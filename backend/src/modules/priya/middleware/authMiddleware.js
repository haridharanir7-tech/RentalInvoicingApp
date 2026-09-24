const jwt = require('jsonwebtoken');
const dbAdapter = require('../../../config/dbAdapter');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_rental_app_2026';

/**
 * Middleware to authenticate JWT token from Authorization header.
 * Attaches decoded user to req.user.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch latest user record to verify account is still active
    const user = await dbAdapter.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User no longer exists.'
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      landlord_id: user.landlord_id,
      landlord_name: user.landlord_name,
      status: user.status
    };
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Restricts access to specified roles e.g. requireRoles(['Admin'])
 */
const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Landlord Self-Scoped Access middleware.
 * If user is Landlord, injects req.scopedLandlordId = req.user.landlord_id
 * so controllers can enforce data scoping automatically.
 */
const scopeLandlordAccess = (req, res, next) => {
  if (req.user && req.user.role === 'Landlord') {
    if (!req.user.landlord_id) {
      return res.status(403).json({
        success: false,
        message: 'Landlord user is not linked to any landlord record. Please contact administrator.'
      });
    }
    req.scopedLandlordId = req.user.landlord_id;
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRoles,
  scopeLandlordAccess
};

