-- Master Data Schema (Landlords, Properties, Tenants)

CREATE TABLE IF NOT EXISTS landlords (
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
);

CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    landlord_id INTEGER REFERENCES landlords(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    property_type VARCHAR(100),
    total_area DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(20),
    gstin VARCHAR(20),
    contact_details VARCHAR(255),
    lease_start_date DATE,
    lease_end_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Notice Period, Vacated
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
