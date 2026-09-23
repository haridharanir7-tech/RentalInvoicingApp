const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');

router.get('/invoices', invoiceController.getInvoices);
router.post('/invoices/generate', invoiceController.generateInvoice);
router.get('/reports/gst-summary', invoiceController.getGstSummaryReport);

module.exports = router;
