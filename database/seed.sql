-- ==========================================================
-- Rental Invoicing App - Central Database Seed Data
-- ==========================================================

-- 1. Invoice Templates
INSERT INTO invoice_templates (id, template_name, logo_url, header_colour, accent_colour, business_name, footer_text, status)
VALUES 
(1, 'Corporate Blue Template', 'https://via.placeholder.com/150x50.png?text=Acme+Real+Estate', '#1e3a8a', '#3b82f6', 'Acme Real Estate Management Pvt Ltd', 'Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234. Payments due within 7 days of invoice date.', 'Active'),
(2, 'Emerald Modern Template', 'https://via.placeholder.com/150x50.png?text=Emerald+Holdings', '#065f46', '#10b981', 'Emerald Commercial Holdings', 'Bank: ICICI Bank | A/C: 001105001234 | IFSC: ICIC0000011. Thank you for your business.', 'Active');

-- 2. Landlords (One GST-Registered, One Non-GST)
INSERT INTO landlords (id, name, pan, gst_registered, gstin, phone, email, billing_address, default_invoice_template_id, status)
VALUES 
(1, 'Apex Commercial Towers LLP', 'AAACA1234A', TRUE, '33AAACA1234A1Z5', '+91 9876543210', 'billing@apexcommercial.com', 'Tower A, 5th Floor, Anna Salai, Chennai, Tamil Nadu - 600002', 1, 'Active'),
(2, 'Sundaram Sundararajan (Individual)', 'ABCPS5678B', FALSE, NULL, '+91 9840123456', 'sundaram.properties@gmail.com', 'New No. 14, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020', 2, 'Active');

-- 3. Users (Admin, Manager, Landlord)
-- Default test password for all accounts: "Password123!"
INSERT INTO users (id, full_name, email, password_hash, role, linked_landlord_id, status)
VALUES 
(1, 'System Administrator', 'admin@rentalapp.com', '$2b$10$8K1p/a0dL.VpW31q4/U65O1Bsk7d6M28zG4VsqxSfeH/nZ4O0O1kG', 'Admin', NULL, 'Active'),
(2, 'Operations Manager', 'manager@rentalapp.com', '$2b$10$8K1p/a0dL.VpW31q4/U65O1Bsk7d6M28zG4VsqxSfeH/nZ4O0O1kG', 'Manager', NULL, 'Active'),
(3, 'Apex Landlord Representative', 'apex.landlord@rentalapp.com', '$2b$10$8K1p/a0dL.VpW31q4/U65O1Bsk7d6M28zG4VsqxSfeH/nZ4O0O1kG', 'Landlord', 1, 'Active'),
(4, 'Sundaram Property Owner', 'sundaram.owner@rentalapp.com', '$2b$10$8K1p/a0dL.VpW31q4/U65O1Bsk7d6M28zG4VsqxSfeH/nZ4O0O1kG', 'Landlord', 2, 'Active');

UPDATE landlords SET user_id = 3 WHERE id = 1;
UPDATE landlords SET user_id = 4 WHERE id = 2;

-- 4. Properties
INSERT INTO properties (id, property_name, address, property_type, area_sqft, landlord_id, invoice_template_override_id, status)
VALUES 
(1, 'Apex Business Park - Suite 401', 'Floor 4, Apex Towers, Anna Salai, Chennai - 600002', 'Commercial', 2500.00, 1, NULL, 'Active'),
(2, 'Apex Tech Center - Unit 102', 'Ground Floor, Apex Tech Park, OMR, Chennai - 600096', 'Commercial', 1800.00, 1, NULL, 'Active'),
(3, 'Adyar Serene Residences - Flat 2B', 'No. 14, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020', 'Residential', 1450.00, 2, NULL, 'Active');

-- 5. Manager Assignments
INSERT INTO manager_assignments (id, manager_id, landlord_id, property_id, status)
VALUES 
(1, 2, 1, NULL, 'Active'),
(2, 2, 2, 3, 'Active');

-- 6. Tenants
INSERT INTO tenants (id, tenant_name, pan, gstin, property_id, phone, email, lease_start_date, lease_end_date, security_deposit, status)
VALUES 
(1, 'InnoTech Solutions Pvt Ltd', 'AAACI9999K', '33AAACI9999K1Z4', 1, '+91 9123456780', 'finance@innotech.example.com', '2025-04-01', '2028-03-31', 300000.00, 'Active'),
(2, 'CloudNine Digital Labs LLP', 'BBBC98888P', '33BBBC98888P1Z1', 2, '+91 9234567891', 'accounts@cloudnine.example.com', '2025-06-01', '2027-05-31', 200000.00, 'Active'),
(3, 'Dr. R. Vignesh', 'ABCDE1234F', NULL, 3, '+91 9345678902', 'dr.vignesh@hospital.example.com', '2026-01-01', '2026-12-31', 120000.00, 'Active');

-- 7. Rental Rates
INSERT INTO rental_rates (id, property_id, tenant_id, monthly_rent, additional_charges, gst_applicable, gst_rate, effective_from, effective_to, remarks)
VALUES 
(1, 1, 1, 100000.00, 15000.00, TRUE, 18.00, '2025-04-01', NULL, 'Standard commercial lease with 18% GST (Landlord registered)'),
(2, 2, 2, 60000.00, 8000.00, TRUE, 18.00, '2025-06-01', NULL, 'Tech park unit lease with 18% GST'),
(3, 3, 3, 35000.00, 3000.00, FALSE, 0.00, '2026-01-01', NULL, 'Residential lease - non-GST landlord');

-- 8. Sample Invoices
INSERT INTO invoices (
    id, invoice_number, invoice_date, billing_period, landlord_id, property_id, tenant_id, rental_rate_id,
    rent_amount, additional_charges, gst_amount, total_amount, status, invoice_template_used_id, pdf_file_path, generated_by, generated_on
)
VALUES 
(1, 'INV/APX/2026-27/00001', '2026-09-01', 'Sep-2026', 1, 1, 1, 1, 100000.00, 15000.00, 20700.00, 135700.00, 'Generated', 1, '/invoices/INV_APX_2026_00001.pdf', 2, CURRENT_TIMESTAMP),
(2, 'INV/APX/2026-27/00002', '2026-09-01', 'Sep-2026', 1, 2, 2, 2, 60000.00, 8000.00, 12240.00, 80240.00, 'Sent', 1, '/invoices/INV_APX_2026_00002.pdf', 2, CURRENT_TIMESTAMP),
(3, 'INV/SND/2026-27/00001', '2026-09-01', 'Sep-2026', 2, 3, 3, 3, 35000.00, 3000.00, 0.00, 38000.00, 'Generated', 2, '/invoices/INV_SND_2026_00001.pdf', 2, CURRENT_TIMESTAMP);

SELECT setval('invoice_templates_id_seq', (SELECT MAX(id) FROM invoice_templates));
SELECT setval('landlords_id_seq', (SELECT MAX(id) FROM landlords));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('properties_id_seq', (SELECT MAX(id) FROM properties));
SELECT setval('manager_assignments_id_seq', (SELECT MAX(id) FROM manager_assignments));
SELECT setval('tenants_id_seq', (SELECT MAX(id) FROM tenants));
SELECT setval('rental_rates_id_seq', (SELECT MAX(id) FROM rental_rates));
SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));
