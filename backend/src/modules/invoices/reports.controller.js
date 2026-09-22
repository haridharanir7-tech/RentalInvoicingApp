const db = require('../../config/database');

// GET /api/invoices/reports/gst-summary?month=Sep-2026
exports.getGstSummaryReport = async (req, res, next) => {
  try {
    const { month } = req.query;

    let query = `
      SELECT 
        l.id AS landlord_id,
        l.name AS landlord_name,
        l.pan,
        l.gstin,
        COUNT(i.id) AS total_invoices,
        COALESCE(SUM(i.rent_amount + i.additional_charges), 0) AS total_taxable_value,
        COALESCE(SUM(i.gst_amount), 0) AS total_gst_collected,
        COALESCE(SUM(i.gst_amount) / 2, 0) AS cgst_amount,
        COALESCE(SUM(i.gst_amount) / 2, 0) AS sgst_amount,
        COALESCE(SUM(i.total_amount), 0) AS total_invoice_value
      FROM landlords l
      JOIN invoices i ON l.id = i.landlord_id
      WHERE l.gst_registered = TRUE
    `;
    const params = [];

    if (month) {
      params.push(month);
      query += ` AND i.billing_period = $${params.length}`;
    }

    if (req.user.role === 'Landlord') {
      params.push(req.user.linked_landlord_id);
      query += ` AND l.id = $${params.length}`;
    }

    query += ` GROUP BY l.id, l.name, l.pan, l.gstin ORDER BY l.name ASC`;

    const result = await db.query(query, params);
    res.json({
      success: true,
      billingPeriod: month || 'All Periods',
      report: result.rows
    });
  } catch (error) {
    next(error);
  }
};
