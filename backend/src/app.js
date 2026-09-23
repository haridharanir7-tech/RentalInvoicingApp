const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Student Modules
const priyaRoutes = require('./modules/priya/auth.routes');
const subhashiniRoutes = require('./modules/subhashini/landlord.routes');
const haridharaniRoutes = require('./modules/haridharani/tenant.routes');
const ragulRoutes = require('./modules/ragul/invoice.routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rental Invoicing Backend running.' });
});

// Student Module Routes
app.use('/api/priya', priyaRoutes);
app.use('/api/subhashini', subhashiniRoutes);
app.use('/api/haridharani', haridharaniRoutes);
app.use('/api/ragul', ragulRoutes);

// General Route Aliases (maps directly to student modules)
app.use('/api/auth', priyaRoutes);
app.use('/api', subhashiniRoutes);
app.use('/api', haridharaniRoutes);
app.use('/api', ragulRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
