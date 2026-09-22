const express = require('express');
const router = express.Router();
const propertyController = require('./property.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', propertyController.getProperties);
router.post('/', authorizeRoles('Admin'), propertyController.createProperty);

module.exports = router;
