const http = require('http');

const data = JSON.stringify({
  name: 'Landlord1',
  email: 'Landlord1@gmail.com',
  pan: 'GHYR5783H',
  gstin: '33AAAAA0000A1Z5ALP',
  contact_details: '0000000000',
  billing_address: 'TEST BILLING ADDRESS FROM API',
  is_active: true,
  gst_registered: true,
  default_invoice_template: 'Custom Template 9'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/master-data/landlords/33',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
