# Rental Invoicing App

Collaborative multi-landlord rental invoicing system built with React (Vite) and Node.js (Express) with central Supabase (PostgreSQL) database.

---

## 👥 Official Team Module Allocation (Intern Project Plan)

| Team Member | Module Name | Scope & Responsibilities | Official Task IDs |
| :--- | :--- | :--- | :--- |
| **Priya** | `Access, Dashboard & Audit` | Login, RBAC, Password Reset, User Management, Scope Manager, Dashboard Widgets, Audit Trail & Logging, Automated DB Backup, Invoice Register Report | Tasks 7–19, 60 |
| **Subhashini** | `Master Data Management` | Landlord Master (PAN/GSTIN, Template Link), Property Master (Units, Types), Tenant Master (PAN/GSTIN, Leases, Status), Property Occupancy Summary Report | Tasks 20–36, 62 |
| **Haridharani** | `Rental Rates & Invoicing Engine` | Rental Rate Configuration (Charges, GST %, Overlap prevention), Invoice Generation (Rent + GST Auto-calculation, Sequential Numbering), GST Monthly Reporting (CGST/SGST/IGST Breakdown & Export) | Tasks 37–46, 56–59 |
| **Ragul** | `Invoice Templates & PDF` | Invoice Template Customization (Logo upload, Color schemes, Preview), PDF Generation & Storage, Individual & Bulk ZIP Download, Landlord-Wise Summary Report | Tasks 47–55, 61 |

---

## 📁 Repository Structure

```text
main
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Shared UI (Navbar, Sidebar, ProtectedRoute)
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── modules/               # 1 folder per member (no code to avoid conflicts)
│   │   │   ├── priya/             # Access, Auth, Dashboard, Audit, Invoice Register
│   │   │   ├── subhashini/        # Landlords, Properties, Tenants, Occupancy Report
│   │   │   ├── haridharani/       # Rental Rates, Invoice Calculation, GST Reports
│   │   │   └── ragul/             # Invoice Templates, PDF Engine, Bulk Download
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Supabase PostgreSQL Pool Connection
│   │   │
│   │   ├── modules/               # 1 folder per member
│   │   │   ├── priya/
│   │   │   ├── subhashini/
│   │   │   ├── haridharani/
│   │   │   └── ragul/
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql                 # Ready for Supabase migrations
│   └── seed.sql                   # Ready for Supabase test data
│
├── docs/
│   ├── requirements/
│   ├── database/
│   └── api/
│
├── .gitignore
└── README.md
```

---

## 🚀 How to Collaborate on GitHub Without Conflicts

1. Pull latest `main`:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create your designated branch:
   - Priya: `git checkout -b feature/priya-auth-dashboard`
   - Subhashini: `git checkout -b feature/subhashini-master-data`
   - Haridharani: `git checkout -b feature/haridharani-rates-invoicing`
   - Ragul: `git checkout -b feature/ragul-templates-pdf`
3. Work strictly inside your assigned folder in `frontend/src/modules/<name>/` and `backend/src/modules/<name>/`.
4. Open a Pull Request (PR) to `main`.
