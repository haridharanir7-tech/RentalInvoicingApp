-- ============================================================================
-- Rental Invoicing App - PostgreSQL / Supabase Database Schema
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Landlords Master
CREATE TABLE IF NOT EXISTS landlords (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL UNIQUE,
    gst_registered BOOLEAN NOT NULL DEFAULT FALSE,
    gstin VARCHAR(15),
    phone VARCHAR(20),
    email VARCHAR(255),
    billing_address TEXT,
    default_template_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Authentication, Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Landlord', 'Manager')),
    landlord_id INTEGER REFERENCES landlords(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Invoice Templates
CREATE TABLE IF NOT EXISTS invoice_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    header_color VARCHAR(20) DEFAULT '#2563eb',
    accent_color VARCHAR(20) DEFAULT '#1e40af',
    address TEXT,
    footer_text TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Properties Master
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    property_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('Residential', 'Commercial')),
    area_sqft NUMERIC(10, 2),
    landlord_id INTEGER NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    template_override_id INTEGER REFERENCES invoice_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tenants Master
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    gstin VARCHAR(15),
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contact_details TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    security_deposit NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Notice Period', 'Vacated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Rental Rates
CREATE TABLE IF NOT EXISTS rental_rates (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    monthly_rent NUMERIC(12, 2) NOT NULL,
    additional_charges NUMERIC(12, 2) DEFAULT 0,
    gst_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    billing_period VARCHAR(50) NOT NULL, -- e.g. "Sep-2026"
    landlord_id INTEGER NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rate_id INTEGER REFERENCES rental_rates(id) ON DELETE SET NULL,
    rent_amount NUMERIC(12, 2) NOT NULL,
    additional_charges NUMERIC(12, 2) DEFAULT 0,
    gst_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Generated', 'Sent')),
    template_id INTEGER REFERENCES invoice_templates(id) ON DELETE SET NULL,
    pdf_path VARCHAR(500),
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_on TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Logs (Master Data Changes & Invoice Overrides)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 'RENTAL_RATE', 'LANDLORD_GST', 'USER_STATUS', 'INVOICE_OVERRIDE'
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,       -- 'UPDATE', 'STATUS_CHANGE', 'OVERRIDE', 'CREATE'
    old_values JSONB,
    new_values JSONB,
    reason TEXT,                       -- Mandatory for invoice overrides
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    performed_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Automated Data Backups
CREATE TABLE IF NOT EXISTS data_backups (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) NOT NULL DEFAULT 'Full', -- 'Database', 'PDFs', 'Full'
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    record_counts JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Failed', 'Verified')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Manager Scope Assignments (Optional)
CREATE TABLE IF NOT EXISTS manager_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id INTEGER NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query scoping
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_invoices_landlord ON invoices(landlord_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_billing_period ON invoices(billing_period);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
