# Rental Invoicing App

A multi-landlord rental invoicing system that supports GST compliance, role-based access (Admin, Manager, Landlord), rate configuration, monthly invoice automation, and GST reporting.

---

## 👥 Team Module Ownership & Git Branches

To maintain a clean codebase with **zero merge conflicts**, all team members work on isolated feature modules and push to their designated Git branches:

| Team Member | Feature Module | Scope & Responsibilities | Branch Name |
| :--- | :--- | :--- | :--- |
| **Priya** | `auth` | Authentication (JWT), RBAC (Admin, Manager, Landlord), Manager Assignment | `feature/auth` |
| **Subhashini** | `landlords` | Landlord profiles (PAN/GST status), Properties (Commercial/Residential), Template overrides | `feature/landlords-properties` |
| **Haridharani** | `tenants` | Tenants (PAN/GSTIN, leases), Rental Rates configuration (effective dates, GST rules) | `feature/tenants-rates` |
| **Ragul** | `invoices` | Monthly invoice generator, PDF rendering, Template engine, Monthly GST summary reports | `feature/invoices-reports` |

---

## 🌳 Repository Architecture

```text
RentalInvoicingApp/
├── frontend/                     # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/           # Common components (Navbar, Sidebar, ProtectedRoute, Layout)
│   │   ├── context/              # AuthContext (user, tokens, permissions)
│   │   ├── services/             # Axios API client (api.js)
│   │   └── modules/              # Feature modules (auth, landlords, tenants, invoices)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/               # Database connection pool (PostgreSQL)
│   │   ├── middleware/           # JWT auth & error handling
│   │   └── modules/              # Feature modules (routes, controllers, services)
│   ├── package.json
│   └── .env.example
│
├── database/                     # Central Database source of truth
│   ├── schema.sql                # Complete schema DDL (8 tables + relationships)
│   └── seed.sql                  # Seed data for testing and development
│
└── docs/                         # Requirements, DB design, and specifications
```

---

## 🚀 Getting Started

### 1. Central Database Setup
1. Create a PostgreSQL database (locally or hosted on Supabase / Neon / Render).
2. Run the schema:
   ```bash
   psql -U postgres -d rental_db -f database/schema.sql
   ```
3. Run the seed data:
   ```bash
   psql -U postgres -d rental_db -f database/seed.sql
   ```

### 2. Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔄 Git Collaboration Workflow

1. Always pull latest `main` before starting work:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create or switch to your feature branch:
   ```bash
   git checkout -b feature/<your-feature-name>
   ```
3. Work strictly inside your assigned module folder under `frontend/src/modules/` and `backend/src/modules/`.
4. Push your branch and open a Pull Request (PR) to `main`:
   ```bash
   git push -u origin feature/<your-feature-name>
   ```
