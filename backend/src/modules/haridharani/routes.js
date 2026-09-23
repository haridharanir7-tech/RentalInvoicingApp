const express = require('express');
const router = express.Router();

const rentalRateController = require('./rentalRateController');
const invoiceController = require('./invoiceController');
const gstReportController = require('./gstReportController');
const { ensureSchema } = require('./dbHelper');

// Auto-verify Haridharani schema on module boot
ensureSchema().catch(err => console.error('[Haridharani DB Init Error]:', err));

// 1. Rental Rate Configuration & Master Data Helpers
router.get('/rental-rates', rentalRateController.getRentalRates);
router.post('/rental-rates', rentalRateController.saveRentalRate);
router.get('/rental-rates/history/:tenantId', rentalRateController.getRateHistory);
router.get('/properties-tenants', rentalRateController.getPropertiesAndTenants);

// 2. Invoice Generation & Management
router.get('/invoices', invoiceController.getInvoices);
router.post('/invoices/preview', invoiceController.previewInvoices);
router.post('/invoices/generate', invoiceController.generateInvoices);
router.put('/invoices/:id/status', invoiceController.updateInvoiceStatus);
router.put('/invoices/:id/correct', invoiceController.correctInvoice);

// 3. GST Monthly Reporting
router.get('/reports/gst-summary', gstReportController.getGstMonthlySummary);

module.exports = router;
