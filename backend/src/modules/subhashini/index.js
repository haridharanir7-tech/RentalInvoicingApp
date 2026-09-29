const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../../uploads/properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

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
router.post('/properties', upload.array('property_documents', 10), propertyController.createProperty);
router.post('/properties/:id/document', upload.array('property_documents', 10), propertyController.uploadDocument);
router.put('/properties/:id', upload.array('property_documents', 10), propertyController.updateProperty);
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
