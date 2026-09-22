const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Feature Module Routers (1 per team member's domain)
const authRoutes = require('./modules/auth/auth.routes');
const landlordRoutes = require('./modules/landlords/landlord.routes');
const propertyRoutes = require('./modules/landlords/property.routes');
const tenantRoutes = require('./modules/tenants/tenant.routes');
const rentalRateRoutes = require('./modules/tenants/rentalRate.routes');
const invoiceRoutes = require('./modules/invoices/invoice.routes');

const app = express();

// Middlewares
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
  res.json({ status: 'ok', message: 'Rental Invoicing API is running smoothly.' });
});

// Mount Feature Routers
app.use('/api/auth', authRoutes);                 // Priya
app.use('/api/landlords', landlordRoutes);         // Subhashini
app.use('/api/properties', propertyRoutes);       // Subhashini
app.use('/api/tenants', tenantRoutes);             // Haridharani
app.use('/api/rental-rates', rentalRateRoutes);   // Haridharani
app.use('/api/invoices', invoiceRoutes);           // Ragul

// Global Error Handler
app.use(errorHandler);

module.exports = app;
