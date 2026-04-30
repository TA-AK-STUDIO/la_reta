// Run once to create the leaderboard table in Neon PostgreSQL
// Usage: DATABASE_URL=your_url node scripts/init-db.js

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS lareta_leaderboard (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(20) NOT NULL,
    score      INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

console.log('✅ lareta_leaderboard table ready');
process.exit(0);
