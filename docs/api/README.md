# API Endpoints by Team Member

### 1. Priya (`/api/priya`) - Access, Dashboard & Audit
- `POST /api/priya/login`: User login
- `POST /api/priya/reset-password`: Password reset
- `GET /api/priya/users`: List users (Admin)
- `POST /api/priya/users`: Create user account
- `PUT /api/priya/users/:id/status`: Activate / Deactivate account
- `POST /api/priya/managers/scope`: Scope manager to landlords/properties
- `GET /api/priya/dashboard/summary`: Invoice counts (Draft/Generated/Sent)
- `GET /api/priya/audit/master-data`: Master data change history log
- `GET /api/priya/reports/invoice-register`: Invoice register with filters & Excel export

### 2. Subhashini (`/api/subhashini`) - Master Data Management
- `GET /api/subhashini/landlords`: List landlords
- `POST /api/subhashini/landlords`: Create landlord (PAN, GSTIN, default template)
- `PUT /api/subhashini/landlords/:id`: Edit landlord details
- `PUT /api/subhashini/landlords/:id/status`: Deactivate landlord
- `GET /api/subhashini/properties`: List properties
- `POST /api/subhashini/properties`: Create property (Commercial/Residential)
- `PUT /api/subhashini/properties/:id`: Edit property
- `GET /api/subhashini/tenants`: List tenants
- `POST /api/subhashini/tenants`: Create tenant (PAN, optional GSTIN, lease dates)
- `PUT /api/subhashini/tenants/:id`: Edit tenant
- `GET /api/subhashini/reports/occupancy`: Property occupancy summary (Active vs Vacant)

### 3. Haridharani (`/api/haridharani`) - Rental Rates & Invoicing Engine
- `GET /api/haridharani/rental-rates`: List rental rates
- `POST /api/haridharani/rental-rates`: Define monthly rent & recurring charges
- `POST /api/haridharani/invoices/generate`: Auto-calculate rent, GST & generate sequential invoice number
- `PUT /api/haridharani/invoices/:id/status`: Update invoice status (Draft > Generated > Sent)
- `PUT /api/haridharani/invoices/:id/correct`: Correct/regenerate draft invoice with audit reason
- `GET /api/haridharani/reports/gst-summary`: Monthly GST report (taxable value, CGST/SGST/IGST breakdown, export)

### 4. Ragul (`/api/ragul`) - Invoice Templates & PDF Generation
- `GET /api/ragul/templates`: List invoice templates
- `POST /api/ragul/templates`: Create invoice template (colors, header/footer)
- `POST /api/ragul/templates/logo`: Upload landlord/business logo
- `GET /api/ragul/templates/preview`: Live template preview with sample data
- `GET /api/ragul/invoices/:id/pdf`: Generate & stream individual invoice PDF
- `GET /api/ragul/invoices/bulk-download`: Download monthly invoice PDFs in ZIP
- `GET /api/ragul/reports/landlord-summary`: Landlord-wise consolidated rent invoiced & collected
