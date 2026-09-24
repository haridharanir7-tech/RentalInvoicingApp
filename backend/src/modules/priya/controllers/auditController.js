const dbAdapter = require('../../../config/dbAdapter');
const { logAudit, logInvoiceOverride } = require('../services/auditService');

/**
 * GET /api/priya/audit/master-data
 * Admin only: View change history for master data (Rental Rates, Landlord GST status, User updates).
 */
const getMasterDataLogs = async (req, res) => {
  try {
    const { entity_type, start_date, end_date } = req.query;

    const logs = await dbAdapter.getAuditLogs({
      entityType: entity_type,
      startDate: start_date,
      endDate: end_date
    });

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    console.error('Audit log error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve master data audit log.' });
  }
};

/**
 * GET /api/priya/audit/invoice-overrides
 * View log of manual overrides on draft invoices.
 */
const getInvoiceOverrides = async (req, res) => {
  try {
    const logs = await dbAdapter.getAuditLogs({ entityType: 'INVOICE_OVERRIDE' });
    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (err) {
    console.error('Invoice override log error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoice override log.' });
  }
};

/**
 * POST /api/priya/audit/invoice-override
 * Record a manual correction to a draft invoice before finalization.
 * Enforces mandatory justification reason.
 */
const recordInvoiceOverride = async (req, res) => {
  try {
    const { invoice_id, old_values, new_values, reason } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ success: false, message: 'Invoice ID or number is required.' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A detailed justification reason is mandatory when correcting an invoice.'
      });
    }

    const invoice = await dbAdapter.getInvoiceById(invoice_id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Target invoice not found.' });
    }

    if (invoice.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Only 'Draft' invoices can be manually overridden. Current status is '${invoice.status}'.`
      });
    }

    // Apply values to invoice if new_values given
    let updatedInvoice = invoice;
    if (new_values) {
      const updatePayload = {};
      if (new_values.additional_charges !== undefined) updatePayload.additional_charges = Number(new_values.additional_charges);
      if (new_values.rent_amount !== undefined) updatePayload.rent_amount = Number(new_values.rent_amount);
      if (new_values.gst_amount !== undefined) updatePayload.gst_amount = Number(new_values.gst_amount);
      if (new_values.total_amount !== undefined) updatePayload.total_amount = Number(new_values.total_amount);

      const resUpdate = await dbAdapter.updateInvoice(invoice.id, updatePayload);
      if (resUpdate) updatedInvoice = resUpdate.current;
    }

    // Record audit entry
    const auditEntry = await logInvoiceOverride({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      oldValues: old_values || {
        rent_amount: invoice.rent_amount,
        additional_charges: invoice.additional_charges,
        gst_amount: invoice.gst_amount,
        total_amount: invoice.total_amount
      },
      newValues: new_values || {
        rent_amount: updatedInvoice.rent_amount,
        additional_charges: updatedInvoice.additional_charges,
        gst_amount: updatedInvoice.gst_amount,
        total_amount: updatedInvoice.total_amount
      },
      reason: reason.trim(),
      userId: req.user.id,
      userName: req.user.full_name
    });

    return res.status(200).json({
      success: true,
      message: 'Draft invoice override and audit log recorded successfully.',
      audit: auditEntry,
      invoice: updatedInvoice
    });
  } catch (err) {
    console.error('Record invoice override error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to record invoice override.'
    });
  }
};

module.exports = {
  getMasterDataLogs,
  getInvoiceOverrides,
  recordInvoiceOverride
};

