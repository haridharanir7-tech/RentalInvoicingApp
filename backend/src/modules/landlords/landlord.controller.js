const db = require('../../config/database');

// GET /api/landlords
exports.getLandlords = async (req, res, next) => {
  try {
    let query = `
      SELECT l.*, t.template_name 
      FROM landlords l
      LEFT JOIN invoice_templates t ON l.default_invoice_template_id = t.id
    `;
    const params = [];

    // Landlord role can only see their own profile
    if (req.user.role === 'Landlord') {
      query += ` WHERE l.id = $1`;
      params.push(req.user.linked_landlord_id);
    }
    // Manager role sees assigned landlords
    else if (req.user.role === 'Manager') {
      query += ` WHERE l.id IN (SELECT landlord_id FROM manager_assignments WHERE manager_id = $1 AND status = 'Active')`;
      params.push(req.user.id);
    }

    query += ` ORDER BY l.id ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, landlords: result.rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/landlords/:id
exports.getLandlordById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT l.*, t.template_name 
       FROM landlords l 
       LEFT JOIN invoice_templates t ON l.default_invoice_template_id = t.id 
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Landlord not found.' });
    }

    res.json({ success: true, landlord: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/landlords (Admin only)
exports.createLandlord = async (req, res, next) => {
  try {
    const { name, pan, gst_registered, gstin, phone, email, billing_address, default_invoice_template_id } = req.body;
    const result = await db.query(
      `INSERT INTO landlords (name, pan, gst_registered, gstin, phone, email, billing_address, default_invoice_template_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, pan.toUpperCase(), gst_registered || false, gstin || null, phone, email, billing_address, default_invoice_template_id || null]
    );

    res.status(201).json({ success: true, landlord: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
