const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.DATABASE_URL)
    return res.status(500).json({ error: 'DATABASE_URL not configured' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS lareta_leaderboard (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(20) NOT NULL,
        score      INTEGER NOT NULL,
        mode       VARCHAR(12) NOT NULL DEFAULT 'powerups',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // Add mode column if table existed without it
    await sql`
      ALTER TABLE lareta_leaderboard
      ADD COLUMN IF NOT EXISTS mode VARCHAR(12) NOT NULL DEFAULT 'powerups'
    `;
  } catch (err) {
    return res.status(500).json({ error: 'DB init: ' + err.message });
  }

  if (req.method === 'GET') {
    try {
      const mode = req.query?.mode || 'powerups';
      const rows = await sql`
        SELECT name, score FROM lareta_leaderboard
        WHERE mode = ${mode}
        ORDER BY score DESC LIMIT 50
      `;
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { name, score, mode } = body || {};
      if (!name || typeof name !== 'string' || !name.trim())
        return res.status(400).json({ error: 'Invalid name' });
      const num = Number(score);
      if (isNaN(num)) return res.status(400).json({ error: 'Invalid score' });
      const safeMode = mode === 'competitive' ? 'competitive' : 'powerups';

      await sql`
        INSERT INTO lareta_leaderboard (name, score, mode)
        VALUES (${name.trim().substring(0, 20)}, ${Math.round(num)}, ${safeMode})
      `;
      return res.status(201).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
