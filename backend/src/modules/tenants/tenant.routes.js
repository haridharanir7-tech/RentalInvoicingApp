const express = require('express');
const router = express.Router();
const tenantController = require('./tenant.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', tenantController.getTenants);
router.post('/', authorizeRoles('Admin', 'Manager'), tenantController.createTenant);

module.exports = router;
