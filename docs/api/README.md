# API Documentation

Endpoints grouped by student module:

### Module 1: Priya (`/api/priya`)
- `POST /api/priya/login`: User authentication
- `GET /api/priya/me`: Current session
- `GET /api/priya/users`: List users (Admin)

### Module 2: Subhashini (`/api/subhashini`)
- `GET /api/subhashini/landlords`: Landlords list
- `POST /api/subhashini/landlords`: Create landlord
- `GET /api/subhashini/properties`: Properties list
- `POST /api/subhashini/properties`: Create property

### Module 3: Haridharani (`/api/haridharani`)
- `GET /api/haridharani/tenants`: Tenants list
- `POST /api/haridharani/tenants`: Create tenant
- `GET /api/haridharani/rental-rates`: Rates list
- `POST /api/haridharani/rental-rates`: Set rental rate

### Module 4: Ragul (`/api/ragul`)
- `GET /api/ragul/invoices`: Invoices list
- `POST /api/ragul/invoices/generate`: Generate invoice
- `GET /api/ragul/reports/gst-summary`: GST monthly summary
