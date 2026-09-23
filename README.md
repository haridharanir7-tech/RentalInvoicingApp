# Rental Invoicing App

Collaborative multi-landlord rental invoicing system built with React (Vite) and Node.js (Express) with a central PostgreSQL database.

---

## 📁 Repository Structure

```text
main
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── modules/
│   │   │   ├── priya/
│   │   │   ├── subhashini/
│   │   │   ├── haridharani/
│   │   │   └── ragul/
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
│   │   │   └── database.js
│   │   │
│   │   ├── modules/
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
│   ├── schema.sql
│   └── seed.sql
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

## 👥 Module Responsibilities

| Member | Frontend Folder | Backend Folder | Module Responsibility |
| :--- | :--- | :--- | :--- |
| **Priya** | `frontend/src/modules/priya/` | `backend/src/modules/priya/` | Authentication & User Management (Login, RBAC) |
| **Subhashini** | `frontend/src/modules/subhashini/` | `backend/src/modules/subhashini/` | Landlords & Properties Management |
| **Haridharani** | `frontend/src/modules/haridharani/` | `backend/src/modules/haridharani/` | Tenants & Rental Rates Configuration |
| **Ragul** | `frontend/src/modules/ragul/` | `backend/src/modules/ragul/` | Invoice Generation, PDF & GST Monthly Reports |

---

## 🚀 Setup Instructions

### 1. Database
Run the central schema and seed scripts in PostgreSQL:
```bash
psql -U postgres -d rental_invoicing_db -f database/schema.sql
psql -U postgres -d rental_invoicing_db -f database/seed.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
