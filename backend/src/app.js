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

// 1. Priya (Access, Dashboard & Audit)
app.use('/api/priya', require('./modules/priya/routes/priyaRoutes'));

// 2. Subhashini (Landlords & Properties)
app.use('/api/master-data', require('./modules/subhashini/index'));

// 3. Haridharani (Tenants & Rental Rates)
app.use('/api/haridharani', require('./modules/haridharani/routes'));

// 4. Ragul (Invoice Templates & PDF Engine)
app.use('/api/ragul', require('./modules/ragul'));
app.use('/api/templates', (req, res, next) => {
  req.url = '/templates' + (req.url === '/' ? '' : req.url);
  require('./modules/ragul')(req, res, next);
});

module.exports = app;
