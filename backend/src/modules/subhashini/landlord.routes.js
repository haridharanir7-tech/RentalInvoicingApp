const express = require('express');
const router = express.Router();
const landlordController = require('./landlord.controller');

router.get('/landlords', landlordController.getLandlords);
router.post('/landlords', landlordController.createLandlord);
router.get('/properties', landlordController.getProperties);

module.exports = router;
