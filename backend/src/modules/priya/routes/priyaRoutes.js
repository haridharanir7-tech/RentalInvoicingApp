const express = require('express');
const router = express.Router();

const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const dashboardController = require('../controllers/dashboardController');
const auditController = require('../controllers/auditController');
const backupController = require('../controllers/backupController');
const reportController = require('../controllers/reportController');

// ==========================================
// 1. Authentication & Password Reset
// ==========================================
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateToken, authController.getMe);

// ==========================================
// 2. User & Role Management (Admin only)
// ==========================================
router.get('/users', authenticateToken, requireRoles(['Admin']), userController.listUsers);
router.post('/users', authenticateToken, requireRoles(['Admin']), userController.createUser);
router.put('/users/:id/status', authenticateToken, requireRoles(['Admin']), userController.updateUserStatus);
router.get('/landlords', authenticateToken, requireRoles(['Admin']), userController.getLandlordList);
router.get('/admin/landlords', authenticateToken, requireRoles(['Admin']), userController.getAdminLandlords);
router.put('/admin/landlords/:id/status', authenticateToken, requireRoles(['Admin']), userController.updateLandlordStatus);
router.post('/admin/landlords/:id/create-access', authenticateToken, requireRoles(['Admin']), userController.createLandlordLoginAccess);

// ==========================================
// 3. Dashboards & Invoice Status Summary
// ==========================================
router.get('/dashboard/admin', authenticateToken, requireRoles(['Admin']), dashboardController.getAdminDashboard);
router.get('/dashboard/landlord', authenticateToken, requireRoles(['Landlord']), dashboardController.getLandlordDashboard);
router.get('/dashboard/summary', authenticateToken, dashboardController.getInvoiceSummary);

// ==========================================
// 4. Audit & Data Governance
// ==========================================
// Master Data Change Log (Admin only)
router.get('/audit/master-data', authenticateToken, requireRoles(['Admin']), auditController.getMasterDataLogs);

// Invoice Override Logging (Draft corrections)
router.get('/audit/invoice-overrides', authenticateToken, auditController.getInvoiceOverrides);
router.post('/audit/invoice-override', authenticateToken, auditController.recordInvoiceOverride);

// ==========================================
// 5. Automated Data Backup & Test Restore
// ==========================================
router.post('/backup/create', authenticateToken, requireRoles(['Admin']), backupController.triggerBackup);
router.get('/backup/list', authenticateToken, requireRoles(['Admin']), backupController.getBackupList);
router.get('/backup/download/:filename', authenticateToken, requireRoles(['Admin']), backupController.downloadBackup);
router.post('/backup/test-restore/:id', authenticateToken, requireRoles(['Admin']), backupController.testRestoreBackup);

// ==========================================
// 6. Reports (Invoice Register)
// ==========================================
router.get('/reports/invoice-register', authenticateToken, reportController.getInvoiceRegister);

module.exports = router;

