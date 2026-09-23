-- ==========================================================
-- Rental Invoicing App - Central Database Schema (PostgreSQL)
-- ==========================================================

DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS rental_rates CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS manager_assignments CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;
DROP TABLE IF EXISTS invoice_templates CASCADE;

-- 1. Invoice Templates Master
CREATE TABLE invoice_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    header_colour VARCHAR(20) DEFAULT '#1e3a8a',
    accent_colour VARCHAR(20) DEFAULT '#3b82f6',
    business_name VARCHAR(255) NOT NULL,
    footer_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Landlords Master
CREATE TABLE landlords (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL UNIQUE,
    gst_registered BOOLEAN NOT NULL DEFAULT FALSE,
    gstin VARCHAR(15),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    billing_address TEXT NOT NULL,
    default_invoice_template_id INT REFERENCES invoice_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_gstin_required CHECK (
        (gst_registered = TRUE AND gstin IS NOT NULL AND length(trim(gstin)) = 15) OR
        (gst_registered = FALSE)
    )
);

-- 3. Users Master & RBAC
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Landlord')),
    linked_landlord_id INT REFERENCES landlords(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE landlords ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;

-- 4. Properties Master
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    property_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    property_type VARCHAR(30) NOT NULL CHECK (property_type IN ('Residential', 'Commercial')),
    area_sqft NUMERIC(10,2),
    landlord_id INT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    invoice_template_override_id INT REFERENCES invoice_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Manager Assignments
CREATE TABLE manager_assignments (
    id SERIAL PRIMARY KEY,
    manager_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id INT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tenants Master
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE,
    security_deposit NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Notice Period', 'Vacated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Rental Rate Configuration
CREATE TABLE rental_rates (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    monthly_rent NUMERIC(12,2) NOT NULL,
    additional_charges NUMERIC(12,2) DEFAULT 0.00,
    gst_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    gst_rate NUMERIC(5,2) DEFAULT 0.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Invoices Transaction Table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    billing_period VARCHAR(20) NOT NULL,
    landlord_id INT NOT NULL REFERENCES landlords(id) ON DELETE RESTRICT,
    property_id INT NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    rental_rate_id INT NOT NULL REFERENCES rental_rates(id) ON DELETE RESTRICT,
    rent_amount NUMERIC(12,2) NOT NULL,
    additional_charges NUMERIC(12,2) DEFAULT 0.00,
    gst_amount NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Generated', 'Sent')),
    invoice_template_used_id INT REFERENCES invoice_templates(id) ON DELETE SET NULL,
    pdf_file_path VARCHAR(500),
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    generated_on TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_landlords_pan ON landlords(pan);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_tenants_property ON tenants(property_id);
CREATE INDEX idx_rental_rates_active ON rental_rates(property_id, tenant_id, effective_from, effective_to);
CREATE INDEX idx_invoices_landlord_period ON invoices(landlord_id, billing_period);
CREATE INDEX idx_invoices_status ON invoices(status);
