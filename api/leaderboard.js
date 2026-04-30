import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

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
      const { name, score } = req.body;
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
      }
      await sql`
        INSERT INTO lareta_leaderboard (name, score)
        VALUES (${name.substring(0, 20)}, ${Math.round(score)})
      `;
      return res.status(201).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
