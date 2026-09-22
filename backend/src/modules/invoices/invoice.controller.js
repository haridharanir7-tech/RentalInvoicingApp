const db = require('../../config/database');

// GET /api/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    let query = `
      SELECT i.*, 
             l.name AS landlord_name, l.gst_registered, l.gstin AS landlord_gstin,
             p.property_name,
             t.tenant_name, t.pan AS tenant_pan, t.gstin AS tenant_gstin
      FROM invoices i
      JOIN landlords l ON i.landlord_id = l.id
      JOIN properties p ON i.property_id = p.id
      JOIN tenants t ON i.tenant_id = t.id
    `;
    const params = [];

    if (req.user.role === 'Landlord') {
      query += ` WHERE i.landlord_id = $1`;
      params.push(req.user.linked_landlord_id);
    } else if (req.user.role === 'Manager') {
      query += ` WHERE i.landlord_id IN (
        SELECT landlord_id FROM manager_assignments WHERE manager_id = $1 AND status = 'Active'
      )`;
      params.push(req.user.id);
    }

    query += ` ORDER BY i.id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, invoices: result.rows });
  } catch (error) {
    next(error);
  }
};

// POST /api/invoices/generate (Admin and Manager)
exports.generateMonthlyInvoice = async (req, res, next) => {
  try {
    const { property_id, tenant_id, billing_period } = req.body;

    // 1. Fetch active rental rate for property & tenant
    const rateResult = await db.query(
      `SELECT r.*, p.landlord_id, l.gst_registered, l.default_invoice_template_id, p.invoice_template_override_id
       FROM rental_rates r
       JOIN properties p ON r.property_id = p.id
       JOIN landlords l ON p.landlord_id = l.id
       WHERE r.property_id = $1 AND r.tenant_id = $2
         AND (r.effective_to IS NULL OR r.effective_to >= CURRENT_DATE)
       ORDER BY r.effective_from DESC LIMIT 1`,
      [property_id, tenant_id]
    );

    if (rateResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No active rental rate found for this property and tenant.' });
    }

    const rate = rateResult.rows[0];
    const rentAmount = parseFloat(rate.monthly_rent);
    const additionalCharges = parseFloat(rate.additional_charges || 0);
    const taxableTotal = rentAmount + additionalCharges;

    // Calculate GST: only if landlord is GST registered AND gst_applicable is true
    let gstAmount = 0.0;
    if (rate.gst_registered && rate.gst_applicable) {
      const gstPercent = parseFloat(rate.gst_rate || 18);
      gstAmount = parseFloat(((taxableTotal * gstPercent) / 100).toFixed(2));
    }

    const totalAmount = parseFloat((taxableTotal + gstAmount).toFixed(2));

    // Choose template (override at property level or fallback to landlord default)
    const templateId = rate.invoice_template_override_id || rate.default_invoice_template_id;

    // Sequential invoice number generation
    const countResult = await db.query('SELECT COUNT(*) FROM invoices WHERE landlord_id = $1', [rate.landlord_id]);
    const nextSeq = String(parseInt(countResult.rows[0].count, 10) + 1).padStart(5, '0');
    const invoiceNumber = `INV/LL${String(rate.landlord_id).padStart(4, '0')}/${billing_period.replace('-', '')}/${nextSeq}`;

    // Insert Invoice
    const insertResult = await db.query(
      `INSERT INTO invoices 
        (invoice_number, invoice_date, billing_period, landlord_id, property_id, tenant_id, rental_rate_id,
         rent_amount, additional_charges, gst_amount, total_amount, status, invoice_template_used_id, generated_by, generated_on)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Generated', $11, $12, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        invoiceNumber,
        billing_period,
        rate.landlord_id,
        property_id,
        tenant_id,
        rate.id,
        rentAmount,
        additionalCharges,
        gstAmount,
        totalAmount,
        templateId,
        req.user.id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      invoice: insertResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
