const express = require('express');
const router = express.Router();
const landlordController = require('./landlord.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', landlordController.getLandlords);
router.get('/:id', landlordController.getLandlordById);
router.post('/', authorizeRoles('Admin'), landlordController.createLandlord);

module.exports = router;
