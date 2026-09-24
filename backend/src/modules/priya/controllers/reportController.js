const dbAdapter = require('../../../config/dbAdapter');

/**
 * GET /api/priya/reports/invoice-register
 * Listing of all invoices with filters, totals calculation, and export support.
 * Automatically enforces Landlord self-scoped access.
 */
const getInvoiceRegister = async (req, res) => {
  try {
    const { period, status, landlord_id, format } = req.query;

    const isLandlord = req.user.role === 'Landlord';
    const effectiveLandlordId = isLandlord ? req.user.landlord_id : landlord_id;

    let invoices = await dbAdapter.getInvoices({
      landlordId: effectiveLandlordId,
      billingPeriod: period,
      status: status
    });

    // Compute totals
    const totals = {
      total_count: invoices.length,
      rent_amount_sum: invoices.reduce((acc, i) => acc + Number(i.rent_amount || 0), 0),
      additional_charges_sum: invoices.reduce((acc, i) => acc + Number(i.additional_charges || 0), 0),
      gst_amount_sum: invoices.reduce((acc, i) => acc + Number(i.gst_amount || 0), 0),
      grand_total_sum: invoices.reduce((acc, i) => acc + Number(i.total_amount || 0), 0)
    };

    // If CSV format requested
    if (format === 'csv') {
      let csv = 'Invoice Number,Date,Billing Period,Landlord,Property,Tenant,Rent,Charges,GST,Total,Status\n';
      invoices.forEach(inv => {
        csv += `"${inv.invoice_number}","${inv.invoice_date}","${inv.billing_period}","${inv.landlord_name}","${inv.property_name}","${inv.tenant_name}",${inv.rent_amount},${inv.additional_charges},${inv.gst_amount},${inv.total_amount},"${inv.status}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_register_${period || 'all'}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      filters: {
        period: period || 'All',
        status: status || 'All',
        landlord_id: effectiveLandlordId || 'All'
      },
      totals,
      data: invoices
    });
  } catch (err) {
    console.error('Invoice register report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate invoice register report.' });
  }
};

module.exports = {
  getInvoiceRegister
};

