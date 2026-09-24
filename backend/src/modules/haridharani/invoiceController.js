const db = require('../../config/database');

/**
 * Helper to compute tax and totals based on supply type and rates
 */
function calculateInvoiceFinancials(rent, maintenance, parking, gstApplicable, gstRate, taxSupplyType) {
  const baseRent = parseFloat(rent) || 0;
  const maint = parseFloat(maintenance) || 0;
  const park = parseFloat(parking) || 0;
  const addCharges = maint + park;
  const taxable = baseRent + addCharges;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalGst = 0;

  if (gstApplicable && gstRate > 0) {
    const rate = parseFloat(gstRate) || 0;
    if (taxSupplyType === 'inter_state') {
      igst = Math.round((taxable * (rate / 100)) * 100) / 100;
      totalGst = igst;
    } else {
      // Intra-state split equally into CGST & SGST
      const halfRate = rate / 2;
      cgst = Math.round((taxable * (halfRate / 100)) * 100) / 100;
      sgst = Math.round((taxable * (halfRate / 100)) * 100) / 100;
      totalGst = cgst + sgst;
    }
  }

  const grandTotal = Math.round((taxable + totalGst) * 100) / 100;

  return {
    rent_amount: baseRent,
    maintenance_charges: maint,
    parking_charges: park,
    additional_charges: addCharges,
    taxable_amount: taxable,
    tax_supply_type: taxSupplyType || 'intra_state',
    gst_rate: gstApplicable ? parseFloat(gstRate) || 0 : 0,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    gst_amount: totalGst,
    total_amount: grandTotal
  };
}

/**
 * Generate sequential invoice number per landlord: INV-{landlord_id}-{0001}
 */
async function generateNextInvoiceNumber(client, landlordId) {
  const prefix = `INV-${landlordId}-`;
  const seqQuery = `
    SELECT invoice_number 
    FROM invoices 
    WHERE landlord_id = $1 AND invoice_number LIKE $2
    ORDER BY invoice_id DESC 
    LIMIT 1
  `;
  const result = await client.query(seqQuery, [landlordId, `${prefix}%`]);

  let nextNum = 1;
  if (result.rows.length > 0) {
    const lastInvoice = result.rows[0].invoice_number;
    const parts = lastInvoice.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  const paddedSeq = String(nextNum).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

/**
 * Get Invoices with filters and KPI totals (Matches user's Invoice Register screen)
 */
exports.getInvoices = async (req, res) => {
  const { period, landlord_id, property_id, status } = req.query;

  try {
    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (period && period !== 'All Periods') {
      whereClauses.push(`i.billing_period = $${paramIndex++}`);
      params.push(period);
    }
    if (landlord_id && landlord_id !== 'All Landlords') {
      whereClauses.push(`i.landlord_id = $${paramIndex++}`);
      params.push(landlord_id);
    }
    if (property_id && property_id !== 'All Properties') {
      whereClauses.push(`i.property_id = $${paramIndex++}`);
      params.push(property_id);
    }
    if (status && status !== 'All') {
      whereClauses.push(`LOWER(i.status) = LOWER($${paramIndex++})`);
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listQuery = `
      SELECT 
        i.invoice_id,
        i.invoice_number,
        TO_CHAR(i.invoice_date, 'YYYY-MM-DD') AS invoice_date,
        i.billing_period,
        i.landlord_id,
        i.property_id,
        i.tenant_id,
        i.rent_amount,
        COALESCE(i.maintenance_charges, 0) AS maintenance_charges,
        COALESCE(i.parking_charges, 0) AS parking_charges,
        COALESCE(i.additional_charges, 0) AS additional_charges,
        COALESCE(i.taxable_amount, i.rent_amount + COALESCE(i.additional_charges, 0)) AS taxable_amount,
        COALESCE(i.tax_supply_type, 'intra_state') AS tax_supply_type,
        COALESCE(i.gst_rate, 0) AS gst_rate,
        COALESCE(i.cgst_amount, 0) AS cgst_amount,
        COALESCE(i.sgst_amount, 0) AS sgst_amount,
        COALESCE(i.igst_amount, 0) AS igst_amount,
        COALESCE(i.gst_amount, 0) AS gst_amount,
        i.total_amount,
        i.status,
        i.notes,
        l.name AS landlord_name,
        p.name AS property_name,
        t.name AS tenant_name
      FROM invoices i
      LEFT JOIN landlords l ON i.landlord_id = l.id
      LEFT JOIN properties p ON i.property_id = p.id
      LEFT JOIN tenants t ON i.tenant_id = t.id
      ${whereSql}
      ORDER BY i.invoice_id DESC
    `;

    const result = await db.query(listQuery, params);

    // Compute KPI Summary Metrics
    let matchingInvoices = result.rows.length;
    let totalBaseRent = 0;
    let totalMaintParking = 0;
    let totalGst = 0;
    let totalInvoicedAmount = 0;

    for (const inv of result.rows) {
      totalBaseRent += parseFloat(inv.rent_amount) || 0;
      totalMaintParking += (parseFloat(inv.maintenance_charges) || 0) + (parseFloat(inv.parking_charges) || 0) || (parseFloat(inv.additional_charges) || 0);
      totalGst += parseFloat(inv.gst_amount) || 0;
      totalInvoicedAmount += parseFloat(inv.total_amount) || 0;
    }

    res.json({
      success: true,
      invoices: result.rows,
      kpis: {
        matchingInvoices,
        totalBaseRent,
        maintenanceParking: totalMaintParking,
        totalGst,
        totalInvoicedAmount
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: 'Database error fetching invoices' });
  }
};

/**
 * Preview generation for a billing period and selected landlords/properties
 */
exports.previewInvoices = async (req, res) => {
  const { billing_period, landlord_id, property_id } = req.body;

  if (!billing_period) {
    return res.status(400).json({ success: false, error: 'Billing period is required (e.g. 2026-09).' });
  }

  try {
    // Find active rates for active tenants
    let filters = [`r.status = 'Active'`];
    let params = [];
    let pIdx = 1;

    if (landlord_id && landlord_id !== 'all') {
      filters.push(`l.id = $${pIdx++}`);
      params.push(landlord_id);
    }
    if (property_id && property_id !== 'all') {
      filters.push(`p.id = $${pIdx++}`);
      params.push(property_id);
    }

    const query = `
      SELECT 
        r.rate_id,
        r.monthly_rent,
        COALESCE(r.maintenance_charges, 0) AS maintenance_charges,
        COALESCE(r.parking_charges, 0) AS parking_charges,
        COALESCE(r.additional_charges, 0) AS additional_charges,
        COALESCE(r.tax_supply_type, 'intra_state') AS tax_supply_type,
        r.gst_applicable,
        COALESCE(r.gst_rate, 18.00) AS gst_rate,
        t.id AS tenant_id,
        t.name AS tenant_name,
        p.id AS property_id,
        p.name AS property_name,
        l.id AS landlord_id,
        l.name AS landlord_name,
        l.gst_registered AS landlord_gst_registered,
        inv.invoice_number AS existing_invoice_number,
        inv.status AS existing_invoice_status
      FROM rentalrate r
      LEFT JOIN tenants t ON r.tenant_id = t.id
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN landlords l ON p.landlord_id = l.id
      LEFT JOIN invoices inv ON inv.tenant_id = t.id 
                            AND inv.property_id = p.id 
                            AND inv.billing_period = '${billing_period}'
      WHERE ${filters.join(' AND ')}
      ORDER BY l.name, p.name, t.name
    `;

    const result = await db.query(query, params);

    const previews = result.rows.map(row => {
      const calc = calculateInvoiceFinancials(
        row.monthly_rent,
        row.maintenance_charges,
        row.parking_charges,
        row.gst_applicable && row.landlord_gst_registered,
        row.gst_rate,
        row.tax_supply_type
      );

      return {
        ...row,
        ...calc,
        billing_period,
        already_generated: !!row.existing_invoice_number
      };
    });

    res.json({ success: true, previews });
  } catch (error) {
    console.error('Error previewing invoices:', error);
    res.status(500).json({ success: false, error: 'Failed to generate invoice previews' });
  }
};

/**
 * Generate invoices for selected tenant rates with sequential invoice numbering
 */
exports.generateInvoices = async (req, res) => {
  const { billing_period, items } = req.body;

  if (!billing_period || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Billing period and at least one item are required.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const generatedInvoices = [];
    const skippedInvoices = [];

    for (const item of items) {
      // 1. Check if invoice already exists for this tenant & property & period
      const checkExisting = await client.query(
        `SELECT invoice_id, invoice_number FROM invoices WHERE tenant_id = $1 AND property_id = $2 AND billing_period = $3`,
        [item.tenant_id, item.property_id, billing_period]
      );

      if (checkExisting.rows.length > 0) {
        skippedInvoices.push({
          tenant_name: item.tenant_name,
          invoice_number: checkExisting.rows[0].invoice_number,
          reason: 'Invoice already exists for this period.'
        });
        continue;
      }

      // 2. Sequential Invoice Numbering per landlord
      const invoiceNumber = await generateNextInvoiceNumber(client, item.landlord_id);

      // 3. Recalculate server-side to guarantee precision & tax compliance
      const financials = calculateInvoiceFinancials(
        item.monthly_rent,
        item.maintenance_charges,
        item.parking_charges,
        item.gst_applicable,
        item.gst_rate,
        item.tax_supply_type
      );

      const insertQuery = `
        INSERT INTO invoices (
          invoice_number,
          invoice_date,
          billing_period,
          landlord_id,
          property_id,
          tenant_id,
          rate_id,
          rent_amount,
          maintenance_charges,
          parking_charges,
          additional_charges,
          taxable_amount,
          tax_supply_type,
          gst_rate,
          cgst_amount,
          sgst_amount,
          igst_amount,
          gst_amount,
          total_amount,
          status,
          notes
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'Draft', $19)
        RETURNING *
      `;

      const insertRes = await client.query(insertQuery, [
        invoiceNumber,
        billing_period,
        item.landlord_id,
        item.property_id,
        item.tenant_id,
        item.rate_id || null,
        financials.rent_amount,
        financials.maintenance_charges,
        financials.parking_charges,
        financials.additional_charges,
        financials.taxable_amount,
        financials.tax_supply_type,
        financials.gst_rate,
        financials.cgst_amount,
        financials.sgst_amount,
        financials.igst_amount,
        financials.gst_amount,
        financials.total_amount,
        `Generated on ${new Date().toISOString()} for period ${billing_period}`
      ]);

      const createdInvoice = insertRes.rows[0];

      // Record status creation in status history
      await client.query(`
        INSERT INTO invoice_status_history (invoice_id, old_status, new_status, change_reason)
        VALUES ($1, NULL, 'Draft', 'Initial Invoice Generation')
      `, [createdInvoice.invoice_id]);

      // Record in audit log
      await client.query(`
        INSERT INTO audit_logs (action, table_name, record_id, description)
        VALUES ('INVOICE_GENERATED', 'invoices', $1, $2)
      `, [createdInvoice.invoice_id, `Invoice ${invoiceNumber} created in Draft status for period ${billing_period}`]);

      generatedInvoices.push(createdInvoice);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Generated ${generatedInvoices.length} invoice(s) successfully.${skippedInvoices.length > 0 ? ` ${skippedInvoices.length} were skipped because they already existed.` : ''}`,
      generatedCount: generatedInvoices.length,
      skippedCount: skippedInvoices.length,
      generatedInvoices,
      skippedInvoices
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating invoices:', error);
    res.status(500).json({ success: false, error: 'Database transaction error generating invoices' });
  } finally {
    client.release();
  }
};

/**
 * Update invoice status (Draft > Generated > Sent)
 */
exports.updateInvoiceStatus = async (req, res) => {
  const { id } = req.params;
  const { status, change_reason = 'Status update' } = req.body;

  const validStatuses = ['Draft', 'Generated', 'Sent'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const existing = await db.query('SELECT invoice_id, invoice_number, status FROM invoices WHERE invoice_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const oldStatus = existing.rows[0].status;

    await db.query('UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = $2', [status, id]);

    // Record in history & audit log
    await db.query(`
      INSERT INTO invoice_status_history (invoice_id, old_status, new_status, change_reason)
      VALUES ($1, $2, $3, $4)
    `, [id, oldStatus, status, change_reason]);

    await db.query(`
      INSERT INTO audit_logs (action, table_name, record_id, description)
      VALUES ('INVOICE_STATUS_CHANGE', 'invoices', $1, $2)
    `, [id, `Invoice ${existing.rows[0].invoice_number} status changed from ${oldStatus} to ${status}. Reason: ${change_reason}`]);

    res.json({ success: true, message: `Invoice status updated to ${status}` });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ success: false, error: 'Database error updating invoice status' });
  }
};

/**
 * Correct / Regenerate Invoice with Audit Trail
 * Rule: Allow editing/regenerating Draft invoices only; write audit entry with reason
 */
exports.correctInvoice = async (req, res) => {
  const { id } = req.params;
  const {
    rent_amount,
    maintenance_charges = 0,
    parking_charges = 0,
    gst_applicable = true,
    gst_rate = 18.00,
    tax_supply_type = 'intra_state',
    change_reason
  } = req.body;

  if (!change_reason || change_reason.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'A mandatory Change Reason is required to correct an invoice for audit compliance.'
    });
  }

  try {
    const invoiceRes = await db.query('SELECT * FROM invoices WHERE invoice_id = $1', [id]);
    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const currentInvoice = invoiceRes.rows[0];

    // Enforce business rule: Draft only!
    if (currentInvoice.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        error: `Only 'Draft' invoices can be edited or corrected. This invoice is already '${currentInvoice.status}'. Finalized invoices cannot be altered.`
      });
    }

    const financials = calculateInvoiceFinancials(
      rent_amount !== undefined ? rent_amount : currentInvoice.rent_amount,
      maintenance_charges !== undefined ? maintenance_charges : currentInvoice.maintenance_charges,
      parking_charges !== undefined ? parking_charges : currentInvoice.parking_charges,
      gst_applicable,
      gst_rate,
      tax_supply_type
    );

    const oldSnapshot = {
      rent: currentInvoice.rent_amount,
      maint: currentInvoice.maintenance_charges,
      parking: currentInvoice.parking_charges,
      gst: currentInvoice.gst_amount,
      total: currentInvoice.total_amount
    };

    const updateQuery = `
      UPDATE invoices
      SET 
        rent_amount = $1,
        maintenance_charges = $2,
        parking_charges = $3,
        additional_charges = $4,
        taxable_amount = $5,
        tax_supply_type = $6,
        gst_rate = $7,
        cgst_amount = $8,
        sgst_amount = $9,
        igst_amount = $10,
        gst_amount = $11,
        total_amount = $12,
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $14
      RETURNING *
    `;

    const updatedRes = await db.query(updateQuery, [
      financials.rent_amount,
      financials.maintenance_charges,
      financials.parking_charges,
      financials.additional_charges,
      financials.taxable_amount,
      financials.tax_supply_type,
      financials.gst_rate,
      financials.cgst_amount,
      financials.sgst_amount,
      financials.igst_amount,
      financials.gst_amount,
      financials.total_amount,
      `Corrected on ${new Date().toISOString()}: ${change_reason}`,
      id
    ]);

    // Record audit entry
    await db.query(`
      INSERT INTO audit_logs (action, table_name, record_id, description)
      VALUES ('INVOICE_CORRECTED', 'invoices', $1, $2)
    `, [
      id,
      `Invoice ${currentInvoice.invoice_number} corrected. Reason: ${change_reason}. Old total: ₹${oldSnapshot.total}, New total: ₹${financials.total_amount}`
    ]);

    res.json({
      success: true,
      message: 'Draft invoice corrected successfully and change logged in audit trail.',
      invoice: updatedRes.rows[0]
    });
  } catch (error) {
    console.error('Error correcting invoice:', error);
    res.status(500).json({ success: false, error: 'Database error correcting invoice' });
  }
};

