const bcrypt = require('bcryptjs');
const dbAdapter = require('../../../config/dbAdapter');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/priya/users
 * Admin only: List all user accounts with their roles, linked landlord, and statuses.
 */
const listUsers = async (req, res) => {
  try {
    const users = await dbAdapter.getUsers();
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

/**
 * POST /api/priya/users
 * Admin only: Create a new user account.
 * Primary roles: Admin or Landlord (linked to a landlord record).
 */
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role, landlord_id } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, password, and role are required.'
      });
    }

    if (!['Admin', 'Landlord', 'Manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Allowed: 'Admin', 'Landlord'."
      });
    }

    if (role === 'Landlord' && !landlord_id) {
      return res.status(400).json({
        success: false,
        message: 'A Landlord account must be linked to a Landlord record.'
      });
    }

    const existing = await dbAdapter.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account with email '${email}' already exists.`
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await dbAdapter.createUser({
      full_name,
      email,
      password_hash,
      role,
      landlord_id: role === 'Landlord' ? landlord_id : null,
      status: 'Active'
    });

    // Record audit event
    await logAudit({
      entityType: 'USER_ACCOUNT',
      entityId: newUser.id,
      action: 'CREATE',
      oldValues: null,
      newValues: { id: newUser.id, full_name, email, role, landlord_id },
      reason: 'Admin created new user account',
      userId: req.user.id,
      userName: req.user.full_name
    });

    return res.status(201).json({
      success: true,
      message: `User '${full_name}' created successfully as ${role}.`,
      data: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        landlord_id: newUser.landlord_id,
        status: newUser.status,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create user account.' });
  }
};

/**
 * PUT /api/priya/users/:id/status
 * Admin only: Activate or deactivate a user account.
 * Blocks login for inactive users.
 * Safeguard: Prevents admin from self-deactivating.
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Inactive'."
      });
    }

    const targetUser = await dbAdapter.getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Safety check: Cannot deactivate oneself
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own current administrator account.'
      });
    }

    const oldStatus = targetUser.status;
    const updated = await dbAdapter.updateUser(id, { status });

    // Record audit trail
    await logAudit({
      entityType: 'USER_STATUS',
      entityId: id,
      action: 'STATUS_CHANGE',
      oldValues: { status: oldStatus },
      newValues: { status: status },
      reason: `Account status updated to ${status} by admin ${req.user.full_name}`,
      userId: req.user.id,
      userName: req.user.full_name
    });

    return res.status(200).json({
      success: true,
      message: `User account '${targetUser.full_name}' is now ${status}.`,
      data: {
        id: updated.id,
        full_name: updated.full_name,
        status: updated.status
      }
    });
  } catch (err) {
    console.error('Update user status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * GET /api/priya/landlords
 * Helper for user creation form (Admin only)
 */
const getLandlordList = async (req, res) => {
  try {
    const landlords = await dbAdapter.getLandlords();
    return res.status(200).json({
      success: true,
      data: landlords.map(l => ({ id: l.id, name: l.name, pan: l.pan, gstin: l.gstin }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list landlords.' });
  }
};

/**
 * GET /api/priya/admin/landlords
 * Admin only: List all landlords with user accounts, approval status, and properties count.
 */
const getAdminLandlords = async (req, res) => {
  try {
    const list = await dbAdapter.getAdminLandlords();
    return res.status(200).json({
      success: true,
      data: list
    });
  } catch (err) {
    console.error('getAdminLandlords error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve landlords.' });
  }
};

/**
 * PUT /api/priya/admin/landlords/:id/status
 * Admin only: Approve (PENDING -> ACTIVE), activate, or deactivate a landlord.
 */
const updateLandlordStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(status?.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'ACTIVE', 'INACTIVE', or 'PENDING'."
      });
    }

    const landlord = await dbAdapter.getLandlordById(id);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord record not found.' });
    }

    const oldStatus = landlord.status;
    const result = await dbAdapter.updateLandlordStatus(id, status);

    // Record audit event
    await logAudit({
      entityType: 'LANDLORD_STATUS',
      entityId: id,
      action: status.toUpperCase() === 'ACTIVE' ? 'APPROVE/ACTIVATE' : 'DEACTIVATE',
      oldValues: { status: oldStatus },
      newValues: { status: status.toUpperCase() },
      reason: `Landlord status changed to ${status.toUpperCase()} by admin ${req.user.full_name}`,
      userId: req.user.id,
      userName: req.user.full_name
    });

    return res.status(200).json({
      success: true,
      message: `Landlord '${landlord.name}' status has been updated to ${status.toUpperCase()}.`,
      data: result
    });
  } catch (err) {
    console.error('updateLandlordStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update landlord status.' });
  }
};

/**
 * POST /api/priya/admin/landlords/:id/create-access
 * Admin grants login access to an existing landlord record from Subhashini's table.
 * Generates a secure random temporary password if none provided.
 * Links users.landlord_id = landlords.id, sets status = 'Active', landlords.is_active = true.
 */
const createLandlordLoginAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const landlord = await dbAdapter.getLandlordById(id);
    if (!landlord) {
      return res.status(404).json({ success: false, message: 'Landlord record not found.' });
    }

    const targetEmail = email || landlord.email;
    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: 'An email address is required to create a landlord login account.'
      });
    }

    // Generate secure random temporary password (10 characters alphanumeric) if not provided
    const crypto = require('crypto');
    const tempPassword = password || (crypto.randomBytes(5).toString('hex') + 'A9!');

    // Check if user already exists
    let existingUser = await dbAdapter.getUserByEmail(targetEmail);
    const password_hash = await bcrypt.hash(tempPassword, 10);

    let userResult;
    if (existingUser) {
      // Update existing user to link to this landlord and activate
      userResult = await dbAdapter.updateUser(existingUser.id, {
        landlord_id: parseInt(id, 10),
        role: 'Landlord',
        status: 'Active',
        password_hash
      });
    } else {
      // Create new user account linked to this landlord
      userResult = await dbAdapter.createUser({
        full_name: landlord.name,
        email: targetEmail,
        password_hash,
        role: 'Landlord',
        landlord_id: parseInt(id, 10),
        status: 'Active'
      });
    }

    // Update landlord record is_active = true
    await dbAdapter.updateLandlordStatus(id, 'ACTIVE');

    // Audit log
    await logAudit({
      entityType: 'LANDLORD_ACCESS',
      entityId: id,
      action: 'GRANT_LOGIN_ACCESS',
      oldValues: null,
      newValues: { landlord_id: id, email: targetEmail, user_id: userResult.id },
      reason: `Admin ${req.user.full_name} granted login access with temporary credentials`,
      userId: req.user.id,
      userName: req.user.full_name
    });

    return res.status(200).json({
      success: true,
      message: `Login access granted successfully for '${landlord.name}'.`,
      data: {
        landlord_id: landlord.id,
        landlord_name: landlord.name,
        email: targetEmail,
        temp_password: tempPassword,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    console.error('createLandlordLoginAccess error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create landlord login access.' });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUserStatus,
  getLandlordList,
  getAdminLandlords,
  updateLandlordStatus,
  createLandlordLoginAccess
};

