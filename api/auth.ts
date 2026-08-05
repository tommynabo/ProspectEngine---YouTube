// API Handler for Authentication (Vercel Serverless Function)
// Usage: POST /api/auth with body {action: 'login' | 'register' | 'verify', ...credentials}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerUser, loginUser, verifyUserFromToken } from '../lib/auth';

interface AuthRequest {
  action: 'login' | 'register' | 'verify';
  email?: string;
  password?: string;
  full_name?: string;
  company_name?: string;
  token?: string;
}

interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

/**
 * Main authentication handler
 */
export async function handleAuthRequest(req: AuthRequest): Promise<AuthResponse> {
  // Validate required env vars before touching the DB
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
    console.error('[auth] DATABASE_URL is not set in environment');
    return { success: false, error: 'Server configuration error: DATABASE_URL missing', statusCode: 500 };
  }

  try {
    const { action } = req;

    switch (action) {
      case 'register':
        return await handleRegister(req);
      case 'login':
        return await handleLogin(req);
      case 'verify':
        return await handleVerify(req);
      default:
        return {
          success: false,
          error: 'Invalid action',
          statusCode: 400,
        };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      statusCode: 500,
    };
  }
}

/**
 * Handle registration
 */
async function handleRegister(req: AuthRequest): Promise<AuthResponse> {
  const { email, password, full_name, company_name } = req;

  // Validation
  if (!email || !password || !full_name) {
    return {
      success: false,
      error: 'Missing required fields: email, password, full_name',
      statusCode: 400,
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters',
      statusCode: 400,
    };
  }

  const result = await registerUser({
    email,
    password,
    full_name,
    company_name,
  });

  return {
    success: true,
    data: result,
    statusCode: 201,
  };
}

/**
 * Handle login
 */
async function handleLogin(req: AuthRequest): Promise<AuthResponse> {
  const { email, password } = req;

  // Validation
  if (!email || !password) {
    return {
      success: false,
      error: 'Missing required fields: email, password',
      statusCode: 400,
    };
  }

  const result = await loginUser({ email, password });

  return {
    success: true,
    data: result,
    statusCode: 200,
  };
}

/**
 * Verify token
 */
async function handleVerify(req: AuthRequest): Promise<AuthResponse> {
  const { token } = req;

  if (!token) {
    return {
      success: false,
      error: 'Missing token',
      statusCode: 400,
    };
  }

  const user = await verifyUserFromToken(token);

  if (!user) {
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }

  return {
    success: true,
    data: { user },
    statusCode: 200,
  };
}

// Vercel HTTP handler — this is what Vercel invokes for /api/auth
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always set Content-Type so the client never receives Vercel's HTML error page
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body: AuthRequest = req.body || {};
    const result = await handleAuthRequest(body);

    return res.status(result.statusCode).json(result);
  } catch (err: any) {
    console.error('[/api/auth] Unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error',
    });
  }
}
