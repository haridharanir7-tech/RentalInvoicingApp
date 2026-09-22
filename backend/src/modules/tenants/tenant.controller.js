const db = require('../../config/database');

// GET /api/tenants
exports.getTenants = async (req, res, next) => {
  try {
    let query = `
      SELECT t.*, p.property_name, p.landlord_id, l.name AS landlord_name
      FROM tenants t
      JOIN properties p ON t.property_id = p.id
      JOIN landlords l ON p.landlord_id = l.id
    `;
    const params = [];

    if (req.user.role === 'Landlord') {
      query += ` WHERE p.landlord_id = $1`;
      params.push(req.user.linked_landlord_id);
    } else if (req.user.role === 'Manager') {
      query += ` WHERE p.landlord_id IN (
        SELECT landlord_id FROM manager_assignments WHERE manager_id = $1 AND status = 'Active'
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY t.id ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, tenants: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/tenants (Admin and Manager)
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
