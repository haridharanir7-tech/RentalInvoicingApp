const db = require('../../config/database');

/**
 * Get all rental rates with landlord, property, and tenant info
 */
exports.getRentalRates = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.rate_id,
        r.property_id,
        r.tenant_id,
        r.landlord_id,
        r.monthly_rent,
        COALESCE(r.maintenance_charges, 0) AS maintenance_charges,
        COALESCE(r.parking_charges, 0) AS parking_charges,
        COALESCE(r.additional_charges, 0) AS additional_charges,
        COALESCE(r.tax_supply_type, 'intra_state') AS tax_supply_type,
        r.gst_applicable,
        COALESCE(r.gst_rate, 18.00) AS gst_rate,
        TO_CHAR(r.effective_from, 'YYYY-MM-DD') AS effective_from,
        TO_CHAR(r.effective_to, 'YYYY-MM-DD') AS effective_to,
        r.status,
        r.change_reason,
        r.created_at,
        COALESCE(l.name, 'Unassigned Landlord') AS landlord_name,
        COALESCE(l.gst_registered, false) AS landlord_gst_registered,
        COALESCE(p.name, 'Unassigned Property') AS property_name,
        COALESCE(t.name, 'N/A') AS tenant_name
      FROM rentalrate r
      LEFT JOIN properties p ON r.property_id = p.id
      LEFT JOIN landlords l ON COALESCE(r.landlord_id, p.landlord_id) = l.id
      LEFT JOIN tenants t ON r.tenant_id = t.id
      ORDER BY r.effective_from DESC, r.rate_id DESC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching rental rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rental rates' });
  }
};

/**
 * Get active landlords and properties for rate assignment & dropdowns
 */
exports.getPropertiesAndTenants = async (req, res) => {
  try {
    const landlordsQuery = `
      SELECT id, name, gst_registered, gstin FROM landlords WHERE is_active = true OR is_active IS NULL ORDER BY name ASC
    `;
    const landlordsResult = await db.query(landlordsQuery);

    const propertiesQuery = `
      SELECT id, landlord_id, name, property_type FROM properties WHERE is_active = true OR is_active IS NULL ORDER BY name ASC
    `;
    const propertiesResult = await db.query(propertiesQuery);

    const tenantsQuery = `
      SELECT 
        t.id AS tenant_id,
        t.name AS tenant_name,
        t.pan AS tenant_pan,
        t.gstin AS tenant_gstin,
        t.property_id,
        COALESCE(p.name, 'Unassigned Property') AS property_name,
        COALESCE(p.property_type, 'Commercial') AS property_type,
        l.id AS landlord_id,
        COALESCE(l.name, 'Unassigned Landlord') AS landlord_name,
        COALESCE(l.gst_registered, false) AS landlord_gst_registered
      FROM tenants t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN landlords l ON p.landlord_id = l.id
      ORDER BY t.name ASC
    `;
    const tenantsResult = await db.query(tenantsQuery);

    res.json({
      success: true,
      landlords: landlordsResult.rows,
      properties: propertiesResult.rows,
      tenants: tenantsResult.rows
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch master data' });
  }
};

/**
 * Get rate revision history for a specific rate, property, or landlord
 */
exports.getRateHistory = async (req, res) => {
  const { tenantId } = req.params;
  try {
    const query = `
      SELECT 
        h.history_id,
        h.rate_id,
        h.landlord_id,
        h.tenant_id,
        h.property_id,
        h.monthly_rent,
        COALESCE(h.maintenance_charges, 0) AS maintenance_charges,
        COALESCE(h.parking_charges, 0) AS parking_charges,
        COALESCE(h.additional_charges, 0) AS additional_charges,
        COALESCE(h.tax_supply_type, 'intra_state') AS tax_supply_type,
        h.gst_applicable,
        h.gst_rate,
        TO_CHAR(h.effective_from, 'YYYY-MM-DD') AS effective_from,
        TO_CHAR(h.effective_to, 'YYYY-MM-DD') AS effective_to,
        h.status,
        h.change_reason,
        h.created_at,
        COALESCE(l.name, 'Unassigned Landlord') AS landlord_name,
        COALESCE(p.name, 'Unassigned Property') AS property_name,
        COALESCE(t.name, 'N/A') AS tenant_name
      FROM ratehistory h
      LEFT JOIN landlords l ON h.landlord_id = l.id
      LEFT JOIN properties p ON h.property_id = p.id
      LEFT JOIN tenants t ON h.tenant_id = t.id
      WHERE h.rate_id = $1 OR h.property_id = $1 OR h.landlord_id = $1 OR h.tenant_id = $1
      ORDER BY h.effective_from DESC, h.history_id DESC
    `;
    const result = await db.query(query, [tenantId]);
    res.json({ success: true, history: result.rows });
  } catch (error) {
    console.error('Error fetching rate history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rate history' });
  }
};

/**
 * Define / Save Rental Rate Revision with Overlap Prevention
 */
exports.saveRentalRate = async (req, res) => {
  const {
    rate_id,
    landlord_id,
    property_id,
    tenant_id = null,
    monthly_rent,
    maintenance_charges = 0,
    parking_charges = 0,
    tax_supply_type = 'intra_state',
    gst_applicable = true,
    gst_rate = 18.00,
    effective_from,
    effective_to = null,
    change_reason = 'Rate Revision'
  } = req.body;

  if (!landlord_id || !property_id || !monthly_rent || !effective_from) {
    return res.status(400).json({
      success: false,
      error: 'Landlord, property, monthly rent, and effective-from date are required.'
    });
  }

  if (effective_to && new Date(effective_to) < new Date(effective_from)) {
    return res.status(400).json({
      success: false,
      error: 'Effective To Date cannot be earlier than Effective From Date.'
    });
  }

  try {
    // -------------------------------------------------------------
    // OVERLAP PREVENTION (Task 5)
    // Check if any existing active rate for this property
    // overlaps with the new [effective_from, effective_to] range
    // -------------------------------------------------------------
    let overlapQuery = `
      SELECT rate_id, TO_CHAR(effective_from, 'YYYY-MM-DD') AS effective_from, TO_CHAR(effective_to, 'YYYY-MM-DD') AS effective_to
      FROM rentalrate
      WHERE property_id = $1
        AND status = 'Active'
    `;
    const overlapParams = [property_id];
    let pIdx = 2;

    if (rate_id) {
      overlapQuery += ` AND rate_id != $${pIdx++}`;
      overlapParams.push(rate_id);
    }

    overlapQuery += `
      AND (
        (effective_to IS NULL OR effective_to >= $${pIdx}::DATE)
        AND
        ($${pIdx + 1}::DATE IS NULL OR effective_from <= $${pIdx + 1}::DATE)
      )
    `;
    overlapParams.push(effective_from);
    overlapParams.push(effective_to || null);

    const overlapCheck = await db.query(overlapQuery, overlapParams);

    if (overlapCheck.rows.length > 0) {
      const existing = overlapCheck.rows[0];
      return res.status(400).json({
        success: false,
        error: `Date overlap detected! An active rental rate (Rate #${existing.rate_id}) is already active from ${existing.effective_from} to ${existing.effective_to || 'Indefinite'} for this property. Please adjust your effective dates or end the existing rate first.`
      });
    }

    const additional_charges = (parseFloat(maintenance_charges) || 0) + (parseFloat(parking_charges) || 0);

    let savedRate;
    if (rate_id) {
      // Update existing rate
      const updateQuery = `
        UPDATE rentalrate
        SET 
          landlord_id = $1,
          property_id = $2,
          tenant_id = $3,
          monthly_rent = $4,
          maintenance_charges = $5,
          parking_charges = $6,
          additional_charges = $7,
          tax_supply_type = $8,
          gst_applicable = $9,
          gst_rate = $10,
          effective_from = $11,
          effective_to = $12,
          change_reason = $13
        WHERE rate_id = $14
        RETURNING *
      `;
      const updateRes = await db.query(updateQuery, [
        landlord_id,
        property_id,
        tenant_id || null,
        monthly_rent,
        maintenance_charges,
        parking_charges,
        additional_charges,
        tax_supply_type,
        gst_applicable,
        gst_rate,
        effective_from,
        effective_to || null,
        change_reason,
        rate_id
      ]);
      savedRate = updateRes.rows[0];
    } else {
      // Insert new rental rate
      const insertQuery = `
        INSERT INTO rentalrate (
          landlord_id, property_id, tenant_id, monthly_rent, maintenance_charges,
          parking_charges, additional_charges, tax_supply_type,
          gst_applicable, gst_rate, effective_from, effective_to,
          status, change_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', $13)
        RETURNING *
      `;
      const insertRes = await db.query(insertQuery, [
        landlord_id,
        property_id,
        tenant_id || null,
        monthly_rent,
        maintenance_charges,
        parking_charges,
        additional_charges,
        tax_supply_type,
        gst_applicable,
        gst_rate,
        effective_from,
        effective_to || null,
        change_reason
      ]);
      savedRate = insertRes.rows[0];
    }

    // Record in ratehistory for audit & rate revision history (Task 4)
    await db.query(`
      INSERT INTO ratehistory (
        rate_id, landlord_id, property_id, tenant_id, monthly_rent, maintenance_charges,
        parking_charges, additional_charges, tax_supply_type,
        gst_applicable, gst_rate, effective_from, effective_to,
        status, change_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Active', $14)
    `, [
      savedRate.rate_id,
      landlord_id,
      property_id,
      tenant_id || null,
      monthly_rent,
      maintenance_charges,
      parking_charges,
      additional_charges,
      tax_supply_type,
      gst_applicable,
      gst_rate,
      effective_from,
      effective_to || null,
      change_reason
    ]);

    res.json({
      success: true,
      message: 'Rental rate saved successfully with rate revision history recorded.',
      data: savedRate
    });
  } catch (error) {
    console.error('Error saving rental rate:', error);
    res.status(500).json({ success: false, error: 'Database error saving rental rate' });
  }
};

exports.deleteRentalRate = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM ratehistory WHERE rate_id = $1', [parseInt(id, 10)]);
    await db.query('DELETE FROM rentalrate WHERE rate_id = $1', [parseInt(id, 10)]);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
