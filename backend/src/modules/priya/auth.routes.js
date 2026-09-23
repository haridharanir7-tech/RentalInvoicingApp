const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.get('/users', authController.getUsers);

module.exports = router;
