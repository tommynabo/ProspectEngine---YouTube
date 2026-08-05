/**
 * API Route: /api/user-data
 * CRUD para ICPs, Métodos de Búsqueda y Motores de Prospección.
 * Datos persistidos en Neon PostgreSQL (tablas user_icps, user_search_methods, user_engines).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
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

// ── Auth ──────────────────────────────────────────────────────────────────────

function getUserId(req: VercelRequest): string | null {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId || null;
  } catch {
    return null;
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleICPs(method: string, userId: string, body: any, res: VercelResponse) {
  if (method === 'GET') {
    const r = await dbQuery(
      'SELECT * FROM user_icps WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return res.status(200).json({ success: true, data: r.rows.map(rowToICP) });
  }

  if (method === 'POST') {
    const { icps } = body; // Full array replace
    if (!Array.isArray(icps)) return res.status(400).json({ success: false, error: 'icps array required' });

    await dbQuery('DELETE FROM user_icps WHERE user_id = $1', [userId]);
    for (const icp of icps) {
      await dbQuery(
        `INSERT INTO user_icps (id, user_id, name, niche, job_titles, company_size, locations, industries, keywords, pain_points, revenue_range, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           name=$3, niche=$4, job_titles=$5, company_size=$6, locations=$7,
           industries=$8, keywords=$9, pain_points=$10, revenue_range=$11`,
        [icp.id, userId, icp.name, icp.niche || '',
          icp.jobTitles || [], icp.companySize || [],
          icp.locations || [], icp.industries || [],
          icp.keywords || [], icp.painPoints || '',
          icp.revenueRange || null, icp.createdAt || new Date().toISOString()]
      );
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleMethods(method: string, userId: string, body: any, res: VercelResponse) {
  if (method === 'GET') {
    const r = await dbQuery(
      'SELECT * FROM user_search_methods WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return res.status(200).json({ success: true, data: r.rows.map(rowToMethod) });
  }

  if (method === 'POST') {
    const { methods } = body;
    if (!Array.isArray(methods)) return res.status(400).json({ success: false, error: 'methods array required' });

    await dbQuery('DELETE FROM user_search_methods WHERE user_id = $1', [userId]);
    for (const m of methods) {
      await dbQuery(
        `INSERT INTO user_search_methods (id, user_id, name, platform, mode, max_results, query_template, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           name=$3, platform=$4, mode=$5, max_results=$6, query_template=$7`,
        [m.id, userId, m.name, m.platform || 'linkedin', m.mode || 'fast',
          m.maxResults || 10, m.queryTemplate || null, m.createdAt || new Date().toISOString()]
      );
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

async function handleEngines(method: string, userId: string, body: any, res: VercelResponse) {
  if (method === 'GET') {
    const r = await dbQuery(
      'SELECT * FROM user_engines WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    return res.status(200).json({ success: true, data: r.rows.map(rowToEngine) });
  }

  if (method === 'POST') {
    const { engines } = body;
    if (!Array.isArray(engines)) return res.status(400).json({ success: false, error: 'engines array required' });

    await dbQuery('DELETE FROM user_engines WHERE user_id = $1', [userId]);
    for (const e of engines) {
      await dbQuery(
        `INSERT INTO user_engines (id, user_id, name, icp_id, search_method_id, total_leads, last_run_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET
           name=$3, icp_id=$4, search_method_id=$5, total_leads=$6, last_run_at=$7`,
        [e.id, userId, e.name, e.icpId, e.searchMethodId,
          e.totalLeads || 0, e.lastRunAt || null, e.createdAt || new Date().toISOString()]
      );
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToICP(r: any) {
  return {
    id: r.id,
    name: r.name,
    niche: r.niche || '',
    jobTitles: r.job_titles || [],
    companySize: r.company_size || [],
    locations: r.locations || [],
    industries: r.industries || [],
    keywords: r.keywords || [],
    painPoints: r.pain_points || '',
    revenueRange: r.revenue_range || '',
    createdAt: r.created_at,
  };
}

function rowToMethod(r: any) {
  return {
    id: r.id,
    name: r.name,
    platform: r.platform,
    mode: r.mode,
    maxResults: r.max_results,
    queryTemplate: r.query_template || undefined,
    createdAt: r.created_at,
  };
}

function rowToEngine(r: any) {
  return {
    id: r.id,
    name: r.name,
    icpId: r.icp_id,
    searchMethodId: r.search_method_id,
    totalLeads: r.total_leads || 0,
    lastRunAt: r.last_run_at || undefined,
    createdAt: r.created_at,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'No autenticado' });

  const type = req.query.type as string;
  const method = req.method || 'GET';
  const body = req.body || {};

  try {
    if (type === 'icps') return await handleICPs(method, userId, body, res);
    if (type === 'methods') return await handleMethods(method, userId, body, res);
    if (type === 'engines') return await handleEngines(method, userId, body, res);

    return res.status(400).json({ success: false, error: 'type param required: icps | methods | engines' });
  } catch (err: any) {
    console.error('[/api/user-data] Error:', err?.message);
    return res.status(500).json({ success: false, error: err?.message || 'Error interno' });
  }
}
