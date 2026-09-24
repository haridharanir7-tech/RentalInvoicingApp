-- ============================================================================
-- Rental Invoicing App - Supabase / PostgreSQL Seed Data
-- ============================================================================

-- 1. Insert Invoice Templates
INSERT INTO invoice_templates (id, template_name, business_name, header_color, accent_color, address, footer_text, is_default)
VALUES 
(1, 'Standard Corporate Blue', 'Nexus Property Management Services', '#2563eb', '#1d4ed8', 'Suite 401, Tech Park, Chennai, Tamil Nadu 600096', 'Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0000240 | Please quote invoice number during NEFT/RTGS transfer.', true),
(2, 'Emerald Modern', 'Prestige Commercial Estates', '#059669', '#047857', 'Level 2, Commerce Square, Bengaluru, Karnataka 560001', 'Bank: ICICI Bank | A/C: 000205012345 | IFSC: ICIC0000002 | Payment terms: Net 15 days.', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Landlords
INSERT INTO landlords (id, name, pan, gst_registered, gstin, phone, email, billing_address, default_template_id, status)
VALUES
(1, 'Greenwood Estates Pvt Ltd', 'AAACG1234F', true, '33AAACG1234F1Z5', '+91 98401 23456', 'accounts@greenwood.com', 'No. 12, Anna Salai, Guindy, Chennai, Tamil Nadu 600032', 1, 'Active'),
(2, 'Apex Realty Ventures', 'AABCA5678G', true, '29AABCA5678G1Z9', '+91 98801 87654', 'finance@apexrealty.in', 'Plot 45, Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037', 2, 'Active'),
(3, 'Skyline Properties (Individual Owner)', 'ABCDE1234H', false, NULL, '+91 94441 11223', 'owner@skylineprops.com', 'Flat 3B, Marina Towers, Santhome, Chennai, Tamil Nadu 600004', 1, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Users (Admin, Landlord, Inactive)
-- Password for all seed users is provided:
-- Admin: Admin@123
-- Landlord: Landlord@123
-- Inactive: Inactive@123
INSERT INTO users (id, full_name, email, password_hash, role, landlord_id, status, last_login)
VALUES
(1, 'System Administrator (Priya)', 'admin@rentalapp.com', '$2a$10$npHkX7wUs69YQYB6iTpIu.bgfm3lTw/YmO6xZLJ26oliKd.MNBBU2', 'Admin', NULL, 'Active', CURRENT_TIMESTAMP),
(2, 'Greenwood Landlord Admin', 'landlord1@greenwood.com', '$2a$10$7sJLipJqPw9wOPy/QoeAbula7PGNo/HhluZBEnk7BaPI8YKCl5Q..', 'Landlord', 1, 'Active', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 'Apex Realty Landlord Admin', 'landlord2@apex.com', '$2a$10$7sJLipJqPw9wOPy/QoeAbula7PGNo/HhluZBEnk7BaPI8YKCl5Q..', 'Landlord', 2, 'Active', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(4, 'Skyline Owner Admin', 'landlord3@skyline.com', '$2a$10$7sJLipJqPw9wOPy/QoeAbula7PGNo/HhluZBEnk7BaPI8YKCl5Q..', 'Landlord', 3, 'Active', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(5, 'Deactivated Staff Account', 'inactive@rentalapp.com', '$2a$10$JgyJ9bfiW06TZMctnVVBv.6OKS4wNGRoUciD1RTcIscP9HQfscbh2', 'Admin', NULL, 'Inactive', CURRENT_TIMESTAMP - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Properties
INSERT INTO properties (id, property_name, address, property_type, area_sqft, landlord_id, status)
VALUES
(1, 'Greenwood Tower A - Unit 301', '3rd Floor, Greenwood Tech Park, Guindy, Chennai', 'Commercial', 3500.00, 1, 'Active'),
(2, 'Greenwood Tower A - Unit 302', '3rd Floor, Greenwood Tech Park, Guindy, Chennai', 'Commercial', 2800.00, 1, 'Active'),
(3, 'Apex Business Bay - Bay 10', 'Plot 45, ORR, Marathahalli, Bengaluru', 'Commercial', 5200.00, 2, 'Active'),
(4, 'Apex Business Bay - Bay 11', 'Plot 45, ORR, Marathahalli, Bengaluru', 'Commercial', 4100.00, 2, 'Active'),
(5, 'Skyline Heritage Villa', '14 Bishop Gardens, R.A. Puram, Chennai', 'Residential', 2400.00, 3, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Tenants
INSERT INTO tenants (id, tenant_name, pan, gstin, property_id, contact_details, phone, email, lease_start_date, lease_end_date, security_deposit, status)
VALUES
(1, 'InnoTech Solutions Ltd', 'AAACI9999K', '33AAACI9999K1Z2', 1, 'Prem Kumar (Facility Mgr)', '+91 98409 11111', 'billing@innotech.com', '2026-01-01', '2027-12-31', 300000.00, 'Active'),
(2, 'CloudByte Systems LLP', 'AABCC8888M', '33AABCC8888M1Z8', 2, 'Sneha Rao (Accounts)', '+91 98409 22222', 'finance@cloudbyte.io', '2026-03-01', '2028-02-28', 240000.00, 'Active'),
(3, 'DataCore Analytics Pvt Ltd', 'AAACD7777N', '29AAACD7777N1Z4', 3, 'Karthik S (Admin)', '+91 98801 33333', 'admin@datacore.com', '2025-06-01', '2027-05-31', 450000.00, 'Active'),
(4, 'VenturePulse Media', 'AABCV6666P', '29AABCV6666P1Z1', 4, 'Anita Roy', '+91 98801 44444', 'anita@venturepulse.com', '2026-04-01', '2027-03-31', 350000.00, 'Active'),
(5, 'Dr. Ramesh Sundaram', 'AAAPS5555Q', NULL, 5, 'Personal Residence', '+91 94441 55555', 'dr.ramesh@sundaram.org', '2026-01-01', '2026-12-31', 120000.00, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Rental Rates
INSERT INTO rental_rates (id, property_id, tenant_id, monthly_rent, additional_charges, gst_applicable, gst_rate, effective_from, effective_to)
VALUES
(1, 1, 1, 150000.00, 15000.00, true, 18.00, '2026-01-01', NULL),
(2, 2, 2, 120000.00, 12000.00, true, 18.00, '2026-03-01', NULL),
(3, 3, 3, 225000.00, 25000.00, true, 18.00, '2025-06-01', NULL),
(4, 4, 4, 180000.00, 18000.00, true, 18.00, '2026-04-01', NULL),
(5, 5, 5, 60000.00, 5000.00, false, 0.00, '2026-01-01', NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Invoices (Draft, Generated, Sent for Sep-2026 and prior)
INSERT INTO invoices (id, invoice_number, invoice_date, billing_period, landlord_id, property_id, tenant_id, rate_id, rent_amount, additional_charges, gst_amount, total_amount, status, template_id, generated_by, generated_on)
VALUES
(1, 'INV/GW/2026-27/00001', '2026-09-01', 'Sep-2026', 1, 1, 1, 1, 150000.00, 15000.00, 29700.00, 194700.00, 'Sent', 1, 1, CURRENT_TIMESTAMP - INTERVAL '20 days'),
(2, 'INV/GW/2026-27/00002', '2026-09-01', 'Sep-2026', 1, 2, 2, 2, 120000.00, 12000.00, 23760.00, 155760.00, 'Generated', 1, 1, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(3, 'INV/AP/2026-27/00001', '2026-09-01', 'Sep-2026', 2, 3, 3, 3, 225000.00, 25000.00, 45000.00, 295000.00, 'Sent', 2, 1, CURRENT_TIMESTAMP - INTERVAL '10 days'),
(4, 'INV/AP/2026-27/00002', '2026-09-05', 'Sep-2026', 2, 4, 4, 4, 180000.00, 18000.00, 35640.00, 233640.00, 'Draft', 2, NULL, NULL),
(5, 'INV/SK/2026-27/00001', '2026-09-05', 'Sep-2026', 3, 5, 5, 5, 60000.00, 5000.00, 0.00, 65000.00, 'Draft', 1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Audit Logs (Master Data changes and Invoice Overrides)
INSERT INTO audit_logs (id, entity_type, entity_id, action, old_values, new_values, reason, performed_by, performed_by_name, created_at)
VALUES
(1, 'LANDLORD_GST', '1', 'UPDATE', '{"gst_registered": false, "gstin": null}', '{"gst_registered": true, "gstin": "33AAACG1234F1Z5"}', 'GST registration certificate received from tax consultant', 1, 'System Administrator (Priya)', CURRENT_TIMESTAMP - INTERVAL '60 days'),
(2, 'RENTAL_RATE', '1', 'UPDATE', '{"monthly_rent": 140000, "additional_charges": 12000}', '{"monthly_rent": 150000, "additional_charges": 15000}', 'Annual 7% contractual rent escalation clause applied', 1, 'System Administrator (Priya)', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(3, 'INVOICE_OVERRIDE', 'INV/AP/2026-27/00002', 'OVERRIDE', '{"additional_charges": 22000, "total_amount": 238360}', '{"additional_charges": 18000, "total_amount": 233640}', 'Power backup diesel expense adjusted after meter reconciliation', 1, 'System Administrator (Priya)', CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Initial Backup Record
INSERT INTO data_backups (id, backup_name, backup_type, file_path, file_size_bytes, record_counts, status, created_by, created_at)
VALUES
(1, 'backup_system_init_20260920.json', 'Full', 'backups/backup_system_init_20260920.json', 14520, '{"users": 5, "landlords": 3, "properties": 5, "tenants": 5, "invoices": 5, "audit_logs": 3}', 'Verified', 1, CURRENT_TIMESTAMP - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;
