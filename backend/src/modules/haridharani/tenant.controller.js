const db = require('../../config/database');

// GET /api/haridharani/tenants
exports.getTenants = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.property_name, l.name AS landlord_name
      FROM tenants t
      JOIN properties p ON t.property_id = p.id
      JOIN landlords l ON p.landlord_id = l.id
      ORDER BY t.id ASC
    `);
    res.json({ success: true, tenants: result.rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/haridharani/rental-rates
exports.getRentalRates = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT r.*, p.property_name, t.tenant_name, l.name AS landlord_name
      FROM rental_rates r
      JOIN properties p ON r.property_id = p.id
      JOIN tenants t ON r.tenant_id = t.id
      JOIN landlords l ON p.landlord_id = l.id
      ORDER BY r.id DESC
    `);
    res.json({ success: true, rentalRates: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/haridharani/tenants
exports.createTenant = async (req, res, next) => {
  try {
    const { tenant_name, pan, gstin, property_id, phone, email, lease_start_date, lease_end_date, security_deposit } = req.body;
    const result = await db.query(
      `INSERT INTO tenants (tenant_name, pan, gstin, property_id, phone, email, lease_start_date, lease_end_date, security_deposit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenant_name, pan.toUpperCase(), gstin || null, property_id, phone, email, lease_start_date, lease_end_date || null, security_deposit || 0]
    );
    res.status(201).json({ success: true, tenant: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
