const db = require('./src/config/database');
const fixSchema = async () => {
    try {
        // Drop tables to recreate them with the correct schema
        // We will CASCADE to remove dependent objects (like FKs) if any exist
        await db.query(`DROP TABLE IF EXISTS tenants CASCADE`);
        await db.query(`DROP TABLE IF EXISTS properties CASCADE`);
        await db.query(`DROP TABLE IF EXISTS landlords CASCADE`);

        // Recreate landlords
        await db.query(`
            CREATE TABLE landlords (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                pan VARCHAR(20),
                gstin VARCHAR(20),
                contact_details VARCHAR(255),
                billing_address TEXT,
                is_active BOOLEAN DEFAULT true,
                gst_registered BOOLEAN DEFAULT false,
                default_invoice_template VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Recreate properties
        await db.query(`
            CREATE TABLE properties (
                id SERIAL PRIMARY KEY,
                landlord_id INTEGER REFERENCES landlords(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                property_type VARCHAR(100),
                total_area DECIMAL(10, 2),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Recreate tenants
        await db.query(`
            CREATE TABLE tenants (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                pan VARCHAR(20),
                gstin VARCHAR(20),
                contact_details VARCHAR(255),
                lease_start_date DATE,
                lease_end_date DATE,
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("Schema fixed successfully!");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
};

fixSchema();
