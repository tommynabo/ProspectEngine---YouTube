import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    db: !!process.env.DATABASE_URL,
    jwt: !!process.env.JWT_SECRET,
    ts: new Date().toISOString(),
  });
}
