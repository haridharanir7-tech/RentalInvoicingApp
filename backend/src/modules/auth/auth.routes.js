const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate, authorizeRoles } = require('../../middleware/auth.middleware');

// Public route
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/users', authenticate, authorizeRoles('Admin'), authController.getUsers);

module.exports = router;
