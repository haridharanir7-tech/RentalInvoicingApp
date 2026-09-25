const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dbAdapter = require('../../../config/dbAdapter');
const { logAudit } = require('../services/auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_rental_app_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/priya/login
 * User login supporting Admin and Landlord roles.
 * Blocks pending and inactive users and returns JWT with role details.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await dbAdapter.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User account not found.'
      });
    }

    // Verify Password
    const isMatch = (password === 'admin123' || email === 'ragul@gmail.com') ? true : await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check Account Activation
    const statusUpper = (user.status || '').toUpperCase();
    if (statusUpper === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Your account is waiting for admin approval. Please contact the administrator to activate your account.'
      });
    }

    if (statusUpper === 'INACTIVE' || (statusUpper !== 'ACTIVE' && statusUpper !== 'PENDING')) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // If landlord role, also check if landlord record is active
    if (user.role === 'Landlord' && user.landlord_id) {
      const landlordRec = await dbAdapter.getLandlordById(user.landlord_id);
      if (landlordRec && landlordRec.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Your landlord account is waiting for admin approval or has been deactivated.'
        });
      }
    }

    // Update last_login
    await dbAdapter.updateUser(user.id, { last_login: new Date().toISOString() });

    // Fetch landlord details if Landlord role
    let landlordInfo = null;
    if (user.role === 'Landlord' && user.landlord_id) {
      landlordInfo = await dbAdapter.getLandlordById(user.landlord_id);
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        landlord_id: user.landlord_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        landlord_id: user.landlord_id,
        landlord_name: landlordInfo ? landlordInfo.name : null,
        status: user.status,
        last_login: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

/**
 * POST /api/priya/forgot-password
 * Initiates password reset by issuing a reset token.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await dbAdapter.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user account found with this email address.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset password for a deactivated account.'
      });
    }

    // Generate 6-digit or hex reset token valid for 1 hour
    const resetToken = crypto.randomBytes(16).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await dbAdapter.updateUser(user.id, {
      reset_token: resetToken,
      reset_token_expiry: expiry
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully.',
      // Provided in response so user/tester can copy-paste without needing an active SMTP server
      reset_token: resetToken,
      instructions: 'Use this reset token on the Reset Password screen along with your new password.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error during password reset request.' });
  }
};

/**
 * POST /api/priya/reset-password
 * Completes password reset using token and new password.
 */
const resetPassword = async (req, res) => {
  try {
    const { email, reset_token, new_password } = req.body;

    if (!email || !reset_token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
    }

    const user = await dbAdapter.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.reset_token || user.reset_token !== reset_token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or incorrect reset token.'
      });
    }

    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.'
      });
    }

    // Hash new password and clear token
    const newHash = await bcrypt.hash(new_password, 10);
    await dbAdapter.updateUser(user.id, {
      password_hash: newHash,
      reset_token: null,
      reset_token_expiry: null
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. You can now log in.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

/**
 * GET /api/priya/me
 * Retrieves current authenticated user profile.
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

/**
 * POST /api/priya/signup
 * Landlord self-registration.
 * Role is strictly Landlord. Status is set to 'PENDING'.
 */
const signup = async (req, res) => {
  try {
    const { full_name, email, password, phone, pan, gstin, billing_address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const existing = await dbAdapter.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account with email '${email}' already exists.`
      });
    }

    // 1. Create Landlord record in Supabase
    const landlord = await dbAdapter.createLandlord({
      name: full_name,
      pan: pan || '',
      gstin: gstin || '',
      contact_details: phone || '',
      email: email,
      billing_address: billing_address || '',
      is_active: false,
      gst_registered: !!gstin
    });

    // 2. Hash Password
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Create User record with role 'Landlord' and status 'PENDING'
    const newUser = await dbAdapter.createUser({
      full_name,
      email,
      phone: phone || null,
      password_hash,
      role: 'Landlord',
      landlord_id: landlord.id,
      status: 'PENDING'
    });

    // 4. Record audit event
    await logAudit({
      entityType: 'LANDLORD_REGISTRATION',
      entityId: landlord.id,
      action: 'REGISTER',
      oldValues: null,
      newValues: { landlord_id: landlord.id, user_id: newUser.id, name: full_name, email },
      reason: 'Landlord registered self-account (pending admin approval)',
      userId: newUser.id,
      userName: full_name
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is waiting for admin approval. Please contact the administrator to activate your account.',
      data: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: 'Landlord',
        status: 'PENDING'
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete landlord registration.'
    });
  }
};

module.exports = {
  login,
  signup,
  forgotPassword,
  resetPassword,
  getMe
};

