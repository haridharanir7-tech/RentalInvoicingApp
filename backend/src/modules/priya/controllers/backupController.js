const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');

/**
 * POST /api/priya/backup/create
 * Admin only: Triggers an immediate full system data backup.
 */
const triggerBackup = async (req, res) => {
  try {
    const backup = await backupService.createBackup({
      createdBy: req.user ? req.user.id : null,
      backupType: 'Manual Admin Snapshot'
    });

    return res.status(201).json({
      success: true,
      message: 'System backup created successfully.',
      data: backup
    });
  } catch (err) {
    console.error('Trigger backup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create backup.' });
  }
};

/**
 * GET /api/priya/backup/list
 * Admin only: Lists all backups.
 */
const getBackupList = async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    return res.status(200).json({
      success: true,
      data: backups
    });
  } catch (err) {
    console.error('List backups error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list backups.' });
  }
};

/**
 * GET /api/priya/backup/download/:filename
 * Admin only: Downloads backup snapshot JSON.
 */
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupService.BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup file not found.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', 'application/json');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('Download backup error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download backup file.' });
  }
};

/**
 * POST /api/priya/backup/test-restore/:id
 * Admin only: Performs non-destructive dry-run restore verification test.
 */
const testRestoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await backupService.testRestore(id);
    return res.status(200).json({
      success: true,
      message: 'Backup restore integrity test completed successfully.',
      report
    });
  } catch (err) {
    console.error('Test restore error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Restore verification failed.'
    });
  }
};

module.exports = {
  triggerBackup,
  getBackupList,
  downloadBackup,
  testRestoreBackup
};

