// Vercel Serverless Function — POST /api/auth
// Self-contained: all auth logic inlined to avoid ESM relative-import resolution failures

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── DB ───────────────────────────────────────────────────────────────────────

let _pool: Pool | null = null;
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return _pool;
}

async function dbQuery(text: string, params?: any[]): Promise<any> {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function dbGetOne(text: string, params?: any[]): Promise<any | null> {
  const r = await dbQuery(text, params);
  return r.rows[0] ?? null;
}

// ── JWT ──────────────────────────────────────────────────────────────────────

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-secret-change-in-production';

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET(), { expiresIn: '7d' });
}

function verifyTokenPayload(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET()) as { userId: string };
  } catch {
    return null;
  }
}

// ── AUTH LOGIC ───────────────────────────────────────────────────────────────

async function register(email: string, password: string, full_name: string, company_name = '') {
  const existing = await dbGetOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing) throw new Error('Ya existe una cuenta con ese email');

  const hash = await bcrypt.hash(password, 10);
  const result = await dbQuery(
    `INSERT INTO users (email, password_hash, full_name, company_name, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, email, full_name, company_name, status, created_at, email_verified`,
    [email.toLowerCase(), hash, full_name, company_name]
  );
  const user = result.rows[0];
  return { token: signToken(user.id), user, expiresIn: 604800 };
}

async function login(email: string, password: string) {
  const row = await dbGetOne(
    `SELECT id, email, full_name, company_name, status, created_at,
            email_verified, password_hash FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (!row) throw new Error('Credenciales incorrectas');

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new Error('Credenciales incorrectas');
  if (row.status !== 'active') throw new Error('Cuenta inactiva');

  await dbQuery('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);

  const { password_hash: _ph, ...user } = row;
  return { token: signToken(user.id), user, expiresIn: 604800 };
}

async function verifyToken(token: string) {
  const payload = verifyTokenPayload(token);
  if (!payload) return null;
  return dbGetOne(
    'SELECT id, email, full_name, company_name, status, created_at, email_verified FROM users WHERE id = $1',
    [payload.userId]
  );
}

// ── VERCEL HANDLER ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, email, password, full_name, company_name, token } = req.body ?? {};

    if (!action) {
      return res.status(400).json({ success: false, error: 'action is required' });
    }

    if (action === 'register') {
      if (!email || !password || !full_name) {
        return res.status(400).json({ success: false, error: 'email, password y full_name son obligatorios' });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
      }
      const data = await register(email, password, full_name, company_name);
      return res.status(201).json({ success: true, data });
    }

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'email y password son obligatorios' });
      }
      const data = await login(email, password);
      return res.status(200).json({ success: true, data });
    }

    if (action === 'verify') {
      const t = token || (req.headers.authorization?.replace('Bearer ', '') ?? '');
      if (!t) return res.status(401).json({ success: false, error: 'Token requerido' });
      const user = await verifyToken(t);
      if (!user) return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
      return res.status(200).json({ success: true, data: { user } });
    }

    return res.status(400).json({ success: false, error: 'action no reconocida' });

  } catch (err: any) {
    console.error('[/api/auth] Error:', err?.message ?? err);
    return res.status(500).json({
      success: false,
      error: err?.message ?? 'Error interno del servidor',
    });
  }
}
