// API Handler for Authentication
// Usage: POST /api/auth with body {action: 'login' | 'register', ...credentials}

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

export default handleAuthRequest;
