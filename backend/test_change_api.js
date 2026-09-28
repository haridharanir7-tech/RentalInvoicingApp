const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({
  id: 1, 
  role: 'Landlord',
  landlord_id: 1
}, 'super_secret_jwt_key_rental_app_2026', { expiresIn: '1h' });

const data = JSON.stringify({
  current_password: 'Landlord@123',
  new_password: 'new_password123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/priya/change-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
