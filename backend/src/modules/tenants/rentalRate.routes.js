const express = require('express');
const router = express.Router();
const rentalRateController = require('./rentalRate.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', rentalRateController.getRentalRates);
router.post('/', authorizeRoles('Admin'), rentalRateController.createRentalRate);

module.exports = router;
