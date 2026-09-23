const db = require('../../config/database');

/**
 * Get all rental rates with tenant, property, and landlord info
 */
exports.getRentalRates = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.rate_id,
        r.property_id,
        r.tenant_id,
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
        t.name AS tenant_name,
        t.pan AS tenant_pan,
        p.name AS property_name,
        l.id AS landlord_id,
        l.name AS landlord_name,
        l.gst_registered AS landlord_gst_registered
      FROM rentalrate r
      JOIN tenants t ON r.tenant_id = t.id
      JOIN properties p ON r.property_id = p.id
      JOIN landlords l ON p.landlord_id = l.id
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
 * Get active properties and tenants for rate assignment & dropdowns
 */
exports.getPropertiesAndTenants = async (req, res) => {
  try {
    const tenantsQuery = `
      SELECT 
        t.id AS tenant_id,
        t.name AS tenant_name,
        t.pan AS tenant_pan,
        t.gstin AS tenant_gstin,
        t.property_id,
        p.name AS property_name,
        p.property_type,
        l.id AS landlord_id,
        l.name AS landlord_name,
        l.gst_registered AS landlord_gst_registered
      FROM tenants t
      JOIN properties p ON t.property_id = p.id
      JOIN landlords l ON p.landlord_id = l.id
      WHERE t.status = 'Active' OR t.status IS NULL
      ORDER BY t.name ASC
    `;
    const tenantsResult = await db.query(tenantsQuery);

    const landlordsQuery = `
      SELECT id, name, gst_registered, gstin FROM landlords WHERE is_active = true OR is_active IS NULL ORDER BY name ASC
    `;
    const landlordsResult = await db.query(landlordsQuery);

    const propertiesQuery = `
      SELECT id, landlord_id, name, property_type FROM properties WHERE is_active = true OR is_active IS NULL ORDER BY name ASC
    `;
    const propertiesResult = await db.query(propertiesQuery);

    res.json({
      success: true,
      tenants: tenantsResult.rows,
      landlords: landlordsResult.rows,
      properties: propertiesResult.rows
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch master data' });
  }
};

/**
 * Get rate revision history for a specific tenant
 */
exports.getRateHistory = async (req, res) => {
  const { tenantId } = req.params;
  try {
    const query = `
      SELECT 
        h.history_id,
        h.rate_id,
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
        t.name AS tenant_name,
        p.name AS property_name
      FROM ratehistory h
      JOIN tenants t ON h.tenant_id = t.id
      JOIN properties p ON h.property_id = p.id
      WHERE h.tenant_id = $1
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
    tenant_id,
    property_id,
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

  if (!tenant_id || !property_id || !monthly_rent || !effective_from) {
    return res.status(400).json({
      success: false,
      error: 'Tenant, property, monthly rent, and effective-from date are required.'
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
    // Check if any existing active rate for this tenant/property
    // overlaps with the new [effective_from, effective_to] range
    // -------------------------------------------------------------
    let overlapQuery = `
      SELECT rate_id, TO_CHAR(effective_from, 'YYYY-MM-DD') AS effective_from, TO_CHAR(effective_to, 'YYYY-MM-DD') AS effective_to
      FROM rentalrate
      WHERE tenant_id = $1 
        AND property_id = $2
        AND status = 'Active'
    `;
    const overlapParams = [tenant_id, property_id];
    let pIdx = 3;

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
        error: `Date overlap detected! An active rental rate (Rate #${existing.rate_id}) is already active from ${existing.effective_from} to ${existing.effective_to || 'Indefinite'}. Please adjust your effective dates or end the existing rate first.`
      });
    }

    const additional_charges = (parseFloat(maintenance_charges) || 0) + (parseFloat(parking_charges) || 0);

    let savedRate;
    if (rate_id) {
      // Update existing rate
      const updateQuery = `
        UPDATE rentalrate
        SET 
          monthly_rent = $1,
          maintenance_charges = $2,
          parking_charges = $3,
          additional_charges = $4,
          tax_supply_type = $5,
          gst_applicable = $6,
          gst_rate = $7,
          effective_from = $8,
          effective_to = $9,
          change_reason = $10
        WHERE rate_id = $11
        RETURNING *
      `;
      const updateRes = await db.query(updateQuery, [
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
          tenant_id, property_id, monthly_rent, maintenance_charges,
          parking_charges, additional_charges, tax_supply_type,
          gst_applicable, gst_rate, effective_from, effective_to,
          status, change_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active', $12)
        RETURNING *
      `;
      const insertRes = await db.query(insertQuery, [
        tenant_id,
        property_id,
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
        rate_id, tenant_id, property_id, monthly_rent, maintenance_charges,
        parking_charges, additional_charges, tax_supply_type,
        gst_applicable, gst_rate, effective_from, effective_to,
        status, change_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', $13)
    `, [
      savedRate.rate_id,
      tenant_id,
      property_id,
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

