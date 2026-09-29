const {Pool} = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT * FROM landlords ORDER BY id DESC LIMIT 1")
  .then(res => {
    console.log(res.rows[0]);
    process.exit(0);
  });
