import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Ensure table exists
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS lareta_leaderboard (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(20) NOT NULL,
        score      INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (err) {
    return res.status(500).json({ error: 'DB init failed: ' + err.message });
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT name, score, created_at
        FROM lareta_leaderboard
        ORDER BY score DESC
        LIMIT 50
      `;
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      // Vercel may pass body as string — parse if needed
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const { name, score } = body || {};
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid name' });
      }
      const numScore = Number(score);
      if (isNaN(numScore)) {
        return res.status(400).json({ error: 'Invalid score' });
      }

      await sql`
        INSERT INTO lareta_leaderboard (name, score)
        VALUES (${name.trim().substring(0, 20)}, ${Math.round(numScore)})
      `;
      return res.status(201).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
