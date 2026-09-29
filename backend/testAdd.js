const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

const data = JSON.stringify({
  name: 'TestAddLandlord',
  email: 'test@add.com',
  pan: '',
  gstin: '',
  contact_details: '1234567890',
  billing_address: '123 Testing Avenue, City',
  is_active: true,
  gst_registered: false,
  default_invoice_template: 'Custom Template 9'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/master-data/landlords',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('POST Response:', body);
    
    // Check DB
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    pool.query("SELECT * FROM landlords WHERE name='TestAddLandlord'")
      .then(dbRes => {
        console.log('DB Record:', dbRes.rows[0]);
        process.exit(0);
      });
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
