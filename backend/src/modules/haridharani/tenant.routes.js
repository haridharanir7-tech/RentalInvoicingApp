const express = require('express');
const router = express.Router();
const tenantController = require('./tenant.controller');

router.get('/tenants', tenantController.getTenants);
router.post('/tenants', tenantController.createTenant);
router.get('/rental-rates', tenantController.getRentalRates);

module.exports = router;
