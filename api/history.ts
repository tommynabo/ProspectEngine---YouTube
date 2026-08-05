/**
 * API Route: /api/history
 * Guarda y carga historial de búsquedas y leads en Neon PostgreSQL.
 * 
 * POST /api/history           → guarda una nueva sesión + leads
 * GET  /api/history?userId=.. → carga todas las sesiones del usuario con leads
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
      max: 2,
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

// ── GET: Load history ─────────────────────────────────────────────────────────

async function loadHistory(userId: string, res: VercelResponse) {
  const historyResult = await dbQuery(
    `SELECT id, query, source, mode, results_count, icp_type, engine_id, engine_name, executed_at
     FROM search_history
     WHERE user_id = $1
     ORDER BY executed_at DESC
     LIMIT 100`,
    [userId]
  );

  const sessions = await Promise.all(
    historyResult.rows.map(async (row: any) => {
      const leadsResult = await dbQuery(
        `SELECT id, source, company_name, website, location,
                decision_maker, ai_analysis, message_a, is_npl_potential, icp_type, status
         FROM leads
         WHERE search_id = $1 AND user_id = $2`,
        [row.id, userId]
      );

      const leads = leadsResult.rows.map((l: any) => ({
        id: l.id,
        source: l.source || row.source || 'linkedin',
        companyName: l.company_name || 'Sin Nombre',
        website: l.website,
        location: l.location,
        decisionMaker: l.decision_maker || undefined,
        aiAnalysis: l.ai_analysis || { summary: '', painPoints: [] },
        messageA: l.message_a,
        isNPLPotential: l.is_npl_potential || false,
        status: l.status || 'scraped',
        icp_type: l.icp_type,
      }));

      return {
        id: row.id,
        date: row.executed_at,
        query: row.query || '',
        source: row.source || 'linkedin',
        resultsCount: leads.length || row.results_count || 0,
        leads,
        icp_type: row.icp_type || undefined,
        engineId: row.engine_id || undefined,
        engineName: row.engine_name || undefined,
      };
    })
  );

  return res.status(200).json({ success: true, data: sessions });
}

// ── POST: Save session ────────────────────────────────────────────────────────

async function saveSession(userId: string, body: any, res: VercelResponse) {
  const {
    query, source, mode, maxResults, resultsCount,
    icpType, engineId, engineName, leads,
  } = body;

  // Insert search_history row
  const historyResult = await dbQuery(
    `INSERT INTO search_history
       (user_id, query, source, mode, max_results, results_count, icp_type, engine_id, engine_name, executed_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),'completed')
     RETURNING id`,
    [userId, query || '', source || 'linkedin', mode || 'fast',
      maxResults || 10, resultsCount || 0,
      icpType || null, engineId || null, engineName || null]
  );

  const searchId = historyResult.rows[0]?.id;
  if (!searchId) {
    return res.status(500).json({ success: false, error: 'No se pudo guardar historial' });
  }

  // Insert leads
  if (Array.isArray(leads) && leads.length > 0) {
    for (const lead of leads) {
      await dbQuery(
        `INSERT INTO leads
           (user_id, search_id, source, company_name, website, location,
            decision_maker, ai_analysis, message_a, is_npl_potential, icp_type, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          userId,
          searchId,
          lead.source || source || 'linkedin',
          lead.companyName || '',
          lead.website || null,
          lead.location || null,
          lead.decisionMaker ? JSON.stringify(lead.decisionMaker) : null,
          lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : null,
          lead.messageA || null,
          lead.isNPLPotential || false,
          lead.icp_type || icpType || null,
          lead.status || 'ready',
        ]
      );
    }
  }

  return res.status(201).json({ success: true, data: { searchId } });
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

  try {
    if (req.method === 'GET') return await loadHistory(userId, res);
    if (req.method === 'POST') return await saveSession(userId, req.body || {}, res);

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[/api/history] Error:', err?.message);
    return res.status(500).json({ success: false, error: err?.message || 'Error interno' });
  }
}
