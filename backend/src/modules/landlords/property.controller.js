const db = require('../../config/database');

// GET /api/properties
exports.getProperties = async (req, res, next) => {
  try {
    let query = `
      SELECT p.*, l.name AS landlord_name, l.gst_registered
      FROM properties p
      JOIN landlords l ON p.landlord_id = l.id
    `;
    const params = [];

    if (req.user.role === 'Landlord') {
      query += ` WHERE p.landlord_id = $1`;
      params.push(req.user.linked_landlord_id);
    } else if (req.user.role === 'Manager') {
      query += ` WHERE p.landlord_id IN (
        SELECT landlord_id FROM manager_assignments 
        WHERE manager_id = $1 AND (property_id IS NULL OR property_id = p.id) AND status = 'Active'
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.id ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, properties: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/properties (Admin only)
exports.createProperty = async (req, res, next) => {
  try {
    const { property_name, address, property_type, area_sqft, landlord_id, invoice_template_override_id } = req.body;
    const result = await db.query(
      `INSERT INTO properties (property_name, address, property_type, area_sqft, landlord_id, invoice_template_override_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [property_name, address, property_type, area_sqft || null, landlord_id, invoice_template_override_id || null]
    );

    res.status(201).json({ success: true, property: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
