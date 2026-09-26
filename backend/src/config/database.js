const { Pool } = require('pg');
require('dotenv').config();

// Connects to PostgreSQL (Compatible with Supabase PostgreSQL connection string)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        keepAlive: true,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 25000
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'postgres',
        ssl: false
      }
);

pool.on('connect', () => {
  console.log('Connected to Database (Supabase/PostgreSQL) successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database client error', err);
});

async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.message && (err.message.includes('timeout') || err.message.includes('terminated') || err.message.includes('ECONNRESET'))) {
      console.warn('Retrying query after connection issue...', err.message);
      return await pool.query(text, params);
    }
    throw err;
  }
}

module.exports = {
  query,
  pool
};
