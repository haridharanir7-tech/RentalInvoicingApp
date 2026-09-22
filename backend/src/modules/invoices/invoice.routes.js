const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const reportsController = require('./reports.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(authenticate);

// Reports
router.get('/reports/gst-summary', reportsController.getGstSummaryReport);

// Invoices CRUD & generation
router.get('/', invoiceController.getInvoices);
router.post('/generate', authorizeRoles('Admin', 'Manager'), invoiceController.generateMonthlyInvoice);

module.exports = router;
