const express = require('express');
const router = express.Router();

const landlordController = require('./landlordController');
const propertyController = require('./propertyController');
const tenantController = require('./tenantController');
const reportController = require('./reportController');

// Landlord Routes
router.post('/landlords', landlordController.createLandlord);
router.put('/landlords/:id', landlordController.updateLandlord);
router.patch('/landlords/:id/deactivate', landlordController.deactivateLandlord);
router.delete('/landlords/:id', landlordController.deleteLandlord);
router.get('/landlords', landlordController.getLandlords);

// Property Routes
router.post('/properties', propertyController.createProperty);
router.put('/properties/:id', propertyController.updateProperty);
router.patch('/properties/:id/deactivate', propertyController.deactivateProperty);
router.delete('/properties/:id', propertyController.deleteProperty);
router.get('/properties', propertyController.getProperties);

// Tenant Routes
router.post('/tenants', tenantController.createTenant);
router.put('/tenants/:id', tenantController.updateTenant);
router.patch('/tenants/:id/deactivate', tenantController.deactivateTenant);
router.delete('/tenants/:id', tenantController.deleteTenant);
router.get('/tenants', tenantController.getTenants);

// Report Routes
router.get('/reports/occupancy', reportController.getOccupancyReport);

module.exports = router;
