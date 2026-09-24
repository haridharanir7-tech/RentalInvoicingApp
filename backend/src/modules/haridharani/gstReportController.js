const db = require('../../config/database');

/**
 * Get GST Monthly Summary grouped by landlord and billing period
 */
exports.getGstMonthlySummary = async (req, res) => {
  const { month, landlord_id } = req.query;

  try {
    let whereClauses = [];
    let params = [];
    let pIdx = 1;

    if (month && month !== 'all') {
      whereClauses.push(`i.billing_period = $${pIdx++}`);
      params.push(month);
    }

    if (landlord_id && landlord_id !== 'all') {
      whereClauses.push(`l.id = $${pIdx++}`);
      params.push(landlord_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        l.id AS landlord_id,
        l.name AS landlord_name,
        COALESCE(l.gstin, 'Non-GST') AS landlord_gstin,
        l.gst_registered,
        i.billing_period,
        COUNT(i.invoice_id) AS total_invoices,
        COALESCE(SUM(i.taxable_amount), 0) AS total_taxable_value,
        COALESCE(SUM(i.cgst_amount), 0) AS total_cgst,
        COALESCE(SUM(i.sgst_amount), 0) AS total_sgst,
        COALESCE(SUM(i.igst_amount), 0) AS total_igst,
        COALESCE(SUM(i.gst_amount), 0) AS total_gst_collected,
        COALESCE(SUM(i.total_amount), 0) AS total_invoiced_value
      FROM invoices i
      JOIN landlords l ON i.landlord_id = l.id
      ${whereSql}
      GROUP BY l.id, l.name, l.gstin, l.gst_registered, i.billing_period
      ORDER BY i.billing_period DESC, l.name ASC
    `;

    const result = await db.query(query, params);

    // Compute overall GST summary
    let overallTaxable = 0;
    let overallCgst = 0;
    let overallSgst = 0;
    let overallIgst = 0;
    let overallGst = 0;

    for (const r of result.rows) {
      overallTaxable += parseFloat(r.total_taxable_value) || 0;
      overallCgst += parseFloat(r.total_cgst) || 0;
      overallSgst += parseFloat(r.total_sgst) || 0;
      overallIgst += parseFloat(r.total_igst) || 0;
      overallGst += parseFloat(r.total_gst_collected) || 0;
    }

    res.json({
      success: true,
      data: result.rows,
      totals: {
        taxableValue: overallTaxable,
        cgst: overallCgst,
        sgst: overallSgst,
        igst: overallIgst,
        totalGst: overallGst
      }
    });
  } catch (error) {
    console.error('Error fetching GST summary:', error);
    res.status(500).json({ success: false, error: 'Database error fetching GST summary' });
  }
};

