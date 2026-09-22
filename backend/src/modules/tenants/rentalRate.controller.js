const db = require('../../config/database');

// GET /api/rental-rates
exports.getRentalRates = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT r.*, p.property_name, t.tenant_name, l.name AS landlord_name, l.gst_registered
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

// POST /api/rental-rates (Admin only)
exports.createRentalRate = async (req, res, next) => {
  try {
    const { property_id, tenant_id, monthly_rent, additional_charges, gst_applicable, gst_rate, effective_from, effective_to, remarks } = req.body;

    const result = await db.query(
      `INSERT INTO rental_rates 
        (property_id, tenant_id, monthly_rent, additional_charges, gst_applicable, gst_rate, effective_from, effective_to, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        property_id,
        tenant_id,
        monthly_rent,
        additional_charges || 0,
        gst_applicable || false,
        gst_rate || 0,
        effective_from,
        effective_to || null,
        remarks || null
      ]
    );

    res.status(201).json({ success: true, rentalRate: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
