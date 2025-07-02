import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : undefined,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
