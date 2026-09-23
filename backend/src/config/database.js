const { Pool } = require('pg');
require('dotenv').config();

// Connects to PostgreSQL (Compatible with Supabase PostgreSQL connection string)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
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

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
