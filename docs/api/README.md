# API Endpoints Documentation

## Base URL
`/api`

### Auth & Users (`/api/auth`) - Priya
- `POST /api/auth/login`: Authenticate and obtain JWT
- `GET /api/auth/me`: Get current session profile
- `GET /api/auth/users`: List users (Admin only)

### Landlords & Properties (`/api/landlords`, `/api/properties`) - Subhashini
- `GET /api/landlords`: List landlords (scoped by role)
- `POST /api/landlords`: Create landlord (Admin only)
- `GET /api/properties`: List properties (Residential/Commercial)
- `POST /api/properties`: Create property

### Tenants & Rental Rates (`/api/tenants`, `/api/rental-rates`) - Haridharani
- `GET /api/tenants`: List tenants with leases
- `POST /api/tenants`: Register tenant
- `GET /api/rental-rates`: List rates and GST applicability
- `POST /api/rental-rates`: Set rental rate rules

### Invoices & Reports (`/api/invoices`) - Ragul
- `GET /api/invoices`: List monthly invoices
- `POST /api/invoices/generate`: Auto-generate monthly invoice
- `GET /api/invoices/reports/gst-summary`: GSTR filing summary
