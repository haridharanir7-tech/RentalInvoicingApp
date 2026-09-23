const db = require('../../config/database');

async function ensureSchema() {
  try {
    // 1. Ensure rentalrate has all needed fields
    await db.query(`
      CREATE TABLE IF NOT EXISTS rentalrate (
        rate_id SERIAL PRIMARY KEY,
        property_id INT NOT NULL,
        tenant_id INT NOT NULL,
        monthly_rent NUMERIC(12,2) NOT NULL,
        additional_charges NUMERIC(12,2) DEFAULT 0.00,
        maintenance_charges NUMERIC(12,2) DEFAULT 0.00,
        parking_charges NUMERIC(12,2) DEFAULT 0.00,
        tax_supply_type VARCHAR(50) DEFAULT 'intra_state',
        gst_applicable BOOLEAN DEFAULT TRUE,
        gst_rate NUMERIC(5,2) DEFAULT 18.00,
        effective_from DATE NOT NULL,
        effective_to DATE,
        status VARCHAR(50) DEFAULT 'Active',
        change_reason VARCHAR(255) DEFAULT 'Initial Rate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // In case rentalrate existed already without some columns:
    const rentalRateColumns = [
      `ALTER TABLE rentalrate ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE rentalrate ADD COLUMN IF NOT EXISTS parking_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE rentalrate ADD COLUMN IF NOT EXISTS tax_supply_type VARCHAR(50) DEFAULT 'intra_state'`,
      `ALTER TABLE rentalrate ADD COLUMN IF NOT EXISTS change_reason VARCHAR(255) DEFAULT 'Rate Revision'`,
      `ALTER TABLE rentalrate ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    ];
    for (const sql of rentalRateColumns) {
      await db.query(sql);
    }

    // 2. Ensure ratehistory table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS ratehistory (
        history_id SERIAL PRIMARY KEY,
        rate_id INT,
        tenant_id INT NOT NULL,
        property_id INT NOT NULL,
        monthly_rent NUMERIC(12,2) NOT NULL,
        additional_charges NUMERIC(12,2) DEFAULT 0.00,
        maintenance_charges NUMERIC(12,2) DEFAULT 0.00,
        parking_charges NUMERIC(12,2) DEFAULT 0.00,
        tax_supply_type VARCHAR(50) DEFAULT 'intra_state',
        gst_applicable BOOLEAN DEFAULT TRUE,
        gst_rate NUMERIC(5,2) DEFAULT 18.00,
        effective_from DATE NOT NULL,
        effective_to DATE,
        status VARCHAR(50) DEFAULT 'Active',
        change_reason VARCHAR(255) DEFAULT 'Rate Revision',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const rateHistoryColumns = [
      `ALTER TABLE ratehistory ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE ratehistory ADD COLUMN IF NOT EXISTS parking_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE ratehistory ADD COLUMN IF NOT EXISTS tax_supply_type VARCHAR(50) DEFAULT 'intra_state'`
    ];
    for (const sql of rateHistoryColumns) {
      await db.query(sql);
    }

    // 3. Ensure invoices table has proper columns and auto-increment
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        billing_period VARCHAR(20) NOT NULL,
        landlord_id INT NOT NULL,
        property_id INT NOT NULL,
        tenant_id INT NOT NULL,
        rate_id INT,
        rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        maintenance_charges NUMERIC(12,2) DEFAULT 0.00,
        parking_charges NUMERIC(12,2) DEFAULT 0.00,
        additional_charges NUMERIC(12,2) DEFAULT 0.00,
        taxable_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        tax_supply_type VARCHAR(50) DEFAULT 'intra_state',
        gst_rate NUMERIC(5,2) DEFAULT 0.00,
        cgst_amount NUMERIC(12,2) DEFAULT 0.00,
        sgst_amount NUMERIC(12,2) DEFAULT 0.00,
        igst_amount NUMERIC(12,2) DEFAULT 0.00,
        gst_amount NUMERIC(12,2) DEFAULT 0.00,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // In case invoices existed already without some columns:
    const invoiceCols = [
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS landlord_id INT`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20)`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rate_id INT`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rent_amount NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parking_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_supply_type VARCHAR(50) DEFAULT 'intra_state'`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS additional_charges NUMERIC(12,2) DEFAULT 0.00`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    ];
    for (const sql of invoiceCols) {
      await db.query(sql);
    }

    // Ensure invoice_id has a sequence if it was created without one
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'invoices_invoice_id_seq') THEN
          CREATE SEQUENCE invoices_invoice_id_seq;
          ALTER TABLE invoices ALTER COLUMN invoice_id SET DEFAULT nextval('invoices_invoice_id_seq');
        END IF;
      END $$;
    `);

    // 4. Ensure audit_logs and invoice_status_history exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoice_status_history (
        history_id SERIAL PRIMARY KEY,
        invoice_id INT NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        change_reason TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`ALTER TABLE invoice_status_history ADD COLUMN IF NOT EXISTS change_reason TEXT`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100),
        record_id VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Ensure gst_report table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS gst_report (
        report_id SERIAL PRIMARY KEY,
        landlord_id INT NOT NULL,
        report_month VARCHAR(20) NOT NULL,
        taxable_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        cgst_amount NUMERIC(12,2) DEFAULT 0.00,
        sgst_amount NUMERIC(12,2) DEFAULT 0.00,
        igst_amount NUMERIC(12,2) DEFAULT 0.00,
        total_gst NUMERIC(12,2) DEFAULT 0.00,
        generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[Haridharani DB] Schema verified and updated successfully.');
  } catch (err) {
    console.error('[Haridharani DB] Schema verification error:', err.message);
  }
}

module.exports = { ensureSchema };

