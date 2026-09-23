const db = require('../../config/database');

// GET /api/ragul/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT i.*, 
             l.name AS landlord_name, l.gst_registered,
             p.property_name,
             t.tenant_name
      FROM invoices i
      JOIN landlords l ON i.landlord_id = l.id
      JOIN properties p ON i.property_id = p.id
      JOIN tenants t ON i.tenant_id = t.id
      ORDER BY i.id DESC
    `);
    res.json({ success: true, invoices: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/ragul/invoices/generate
exports.generateInvoice = async (req, res, next) => {
  try {
    const { property_id, tenant_id, billing_period } = req.body;

    const rateResult = await db.query(
      `SELECT r.*, p.landlord_id, l.gst_registered, l.default_invoice_template_id
       FROM rental_rates r
       JOIN properties p ON r.property_id = p.id
       JOIN landlords l ON p.landlord_id = l.id
       WHERE r.property_id = $1 AND r.tenant_id = $2
       ORDER BY r.effective_from DESC LIMIT 1`,
      [property_id, tenant_id]
    );

    if (rateResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No active rental rate found.' });
    }

    const rate = rateResult.rows[0];
    const rentAmount = parseFloat(rate.monthly_rent);
    const additionalCharges = parseFloat(rate.additional_charges || 0);
    const taxableTotal = rentAmount + additionalCharges;

    let gstAmount = 0.0;
    if (rate.gst_registered && rate.gst_applicable) {
      gstAmount = parseFloat(((taxableTotal * parseFloat(rate.gst_rate || 18)) / 100).toFixed(2));
    }
    const totalAmount = parseFloat((taxableTotal + gstAmount).toFixed(2));

    const countResult = await db.query('SELECT COUNT(*) FROM invoices WHERE landlord_id = $1', [rate.landlord_id]);
    const nextSeq = String(parseInt(countResult.rows[0].count, 10) + 1).padStart(5, '0');
    const invoiceNumber = `INV/LL${String(rate.landlord_id).padStart(4, '0')}/${billing_period.replace('-', '')}/${nextSeq}`;

    const insertResult = await db.query(
      `INSERT INTO invoices 
        (invoice_number, invoice_date, billing_period, landlord_id, property_id, tenant_id, rental_rate_id,
         rent_amount, additional_charges, gst_amount, total_amount, status, invoice_template_used_id, generated_on)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Generated', $11, CURRENT_TIMESTAMP)
       RETURNING *`,
      [invoiceNumber, billing_period, rate.landlord_id, property_id, tenant_id, rate.id, rentAmount, additionalCharges, gstAmount, totalAmount, rate.default_invoice_template_id]
    );

    res.status(201).json({ success: true, invoice: insertResult.rows[0] });
  } catch (error) {
    next(error);
  }
};

// GET /api/ragul/reports/gst-summary
exports.getGstSummaryReport = async (req, res, next) => {
  try {
    const { month } = req.query;
    let query = `
      SELECT 
        l.id AS landlord_id, l.name AS landlord_name, l.pan, l.gstin,
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
      query += ` AND i.billing_period = $1`;
    }
    query += ` GROUP BY l.id, l.name, l.pan, l.gstin ORDER BY l.name ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, billingPeriod: month || 'All', report: result.rows });
  } catch (error) {
    next(error);
  }
};
