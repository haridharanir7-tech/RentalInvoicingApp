const db = require('../../config/database');

// GET /api/subhashini/landlords
exports.getLandlords = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT l.*, t.template_name 
      FROM landlords l
      LEFT JOIN invoice_templates t ON l.default_invoice_template_id = t.id
      ORDER BY l.id ASC
    `);
    res.json({ success: true, landlords: result.rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/subhashini/properties
exports.getProperties = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.*, l.name AS landlord_name, l.gst_registered
      FROM properties p
      JOIN landlords l ON p.landlord_id = l.id
      ORDER BY p.id ASC
    `);
    res.json({ success: true, properties: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/subhashini/landlords
exports.createLandlord = async (req, res, next) => {
  try {
    const { name, pan, gst_registered, gstin, phone, email, billing_address } = req.body;
    const result = await db.query(
      `INSERT INTO landlords (name, pan, gst_registered, gstin, phone, email, billing_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, pan.toUpperCase(), gst_registered || false, gstin || null, phone, email, billing_address]
    );
    res.status(201).json({ success: true, landlord: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
