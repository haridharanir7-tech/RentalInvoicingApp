const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify Bearer JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_2026');

    // Fetch user details from database
    const userResult = await db.query(
      'SELECT id, full_name, email, role, linked_landlord_id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].status !== 'Active') {
      return res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

// Check if user has required role (Admin, Manager, Landlord)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Required role [${allowedRoles.join(', ')}], your role: [${req.user ? req.user.role : 'None'}]`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
