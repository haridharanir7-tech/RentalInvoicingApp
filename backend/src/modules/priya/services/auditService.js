const dbAdapter = require('../../../config/dbAdapter');

/**
 * Log a change to master data (Rate changes, Landlord GST status, User account status)
 */
const logAudit = async ({
  entityType,
  entityId,
  action,
  oldValues,
  newValues,
  reason = null,
  userId = null,
  userName = 'System'
}) => {
  try {
    const entry = await dbAdapter.createAuditLog({
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      old_values: oldValues,
      new_values: newValues,
      reason: reason,
      performed_by: userId,
      performed_by_name: userName
    });
    return entry;
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
    return null;
  }
};

/**
 * Specifically log a manual override to an invoice before finalization.
 * Per BRD: Any manual override to an invoice before finalization must be logged with a reason.
 */
const logInvoiceOverride = async ({
  invoiceId,
  invoiceNumber,
  oldValues,
  newValues,
  reason,
  userId,
  userName
}) => {
  if (!reason || reason.trim() === '') {
    throw new Error('Audit justification reason is strictly mandatory for invoice overrides.');
  }

  return await logAudit({
    entityType: 'INVOICE_OVERRIDE',
    entityId: invoiceNumber || String(invoiceId),
    action: 'OVERRIDE',
    oldValues,
    newValues,
    reason: reason.trim(),
    userId,
    userName
  });
};

module.exports = {
  logAudit,
  logInvoiceOverride
};

