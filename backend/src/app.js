const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rental Invoicing Backend API is running' });
});

// ==========================================
// Student Modules Mount Points
// (Each member will import & mount their router here)
// ==========================================

// 1. Priya (Auth & Users)
// app.use('/api/priya', require('./modules/priya/...'));

// 2. Subhashini (Landlords & Properties)
// app.use('/api/subhashini', require('./modules/subhashini/...'));

// 3. Haridharani (Tenants & Rental Rates)
// app.use('/api/haridharani', require('./modules/haridharani/...'));

// 4. Ragul (Invoice Templates & PDF Engine)
app.use('/api/ragul', require('./modules/ragul'));
app.use('/api/templates', (req, res, next) => {
  req.url = '/templates' + (req.url === '/' ? '' : req.url);
  require('./modules/ragul')(req, res, next);
});

module.exports = app;
