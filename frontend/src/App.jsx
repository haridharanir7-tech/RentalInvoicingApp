import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ModulePlaceholder from './components/ModulePlaceholder';
import SubhashiniLayout from './modules/subhashini/index';

// Priya Auth & Admin Components
import { AuthProvider, useAuth } from './modules/priya/context/AuthContext';
import Login from './modules/priya/pages/Login';
import ForgotPassword from './modules/priya/pages/ForgotPassword';
import ResetPassword from './modules/priya/pages/ResetPassword';
import AdminDashboard from './modules/priya/pages/AdminDashboard';
import LandlordDashboard from './modules/priya/pages/LandlordDashboard';
import AdminLandlords from './modules/priya/pages/AdminLandlords';
import InvoiceRegister from './modules/priya/pages/InvoiceRegister';
import UserManagement from './modules/priya/pages/UserManagement';
import MasterDataAudit from './modules/priya/pages/MasterDataAudit';
import InvoiceOverrideLog from './modules/priya/pages/InvoiceOverrideLog';
import DataBackup from './modules/priya/pages/DataBackup';

// Haridharani Components (Rates, Invoice Generation, Register & GST Reports)
import RentalRates from './modules/haridharani/RentalRates';
import GenerateInvoices from './modules/haridharani/genarateInvoices';
import Invoices from './modules/haridharani/Invoices';
import GSTReport from './modules/haridharani/GSTeport';

function AppLayout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLandlord, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isLandlord) return <Navigate to="/landlord/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root dynamic redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ==================================================== */}
          {/* ADMIN ROUTES (Protected with 'Admin' role check)     */}
          {/* ==================================================== */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* 1. Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              }
            />

            {/* 2. Admin Landlords Management & Approvals */}
            <Route
              path="/admin/landlords"
              element={
                <AppLayout>
                  <AdminLandlords />
                </AppLayout>
              }
            />

            {/* 3. Property Master (Subhashini) */}
            <Route
              path="/admin/properties"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Property Master"
                    teammateName="Subhashini"
                    description="Commercial & residential property portfolio, unit configurations, and floor area measurements."
                  />
                </AppLayout>
              }
            />

            {/* 4. Tenant Master (Subhashini) */}
            <Route
              path="/admin/tenants"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Tenant Master"
                    teammateName="Subhashini"
                    description="Tenant onboarding, lease contracts, PAN/GSTIN registration, and deposit history."
                  />
                </AppLayout>
              }
            />

            {/* 5. Rental Rates (Haridharani) */}
            <Route
              path="/admin/rental-rates"
              element={
                <AppLayout>
                  <RentalRates />
                </AppLayout>
              }
            />

            {/* 6. Generate Invoice (Haridharani) */}
            <Route
              path="/admin/generate-invoice"
              element={
                <AppLayout>
                  <GenerateInvoices />
                </AppLayout>
              }
            />

            {/* 7. Invoices Register (Haridharani) */}
            <Route
              path="/admin/invoices"
              element={
                <AppLayout>
                  <Invoices />
                </AppLayout>
              }
            />

            {/* 8. Invoice Template Designer (Ragul) */}
            <Route
              path="/admin/invoice-template"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Invoice Template Designer"
                    teammateName="Ragul"
                    description="Visual template designer, company logo customization, and PDF rendering engine."
                  />
                </AppLayout>
              }
            />

            {/* 9. Occupancy Report (Subhashini) */}
            <Route
              path="/admin/occupancy-report"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Occupancy Report"
                    teammateName="Subhashini"
                    description="Portfolio occupancy percentage, vacancy tracking, and unit utilization analysis."
                  />
                </AppLayout>
              }
            />

            {/* 10. GST Report (Haridharani) */}
            <Route
              path="/admin/gst-report"
              element={
                <AppLayout>
                  <GSTReport />
                </AppLayout>
              }
            />

            {/* Admin Utility & Governance Routes */}
            <Route
              path="/admin/users"
              element={
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <AppLayout>
                  <MasterDataAudit />
                </AppLayout>
              }
            />
            <Route
              path="/admin/backups"
              element={
                <AppLayout>
                  <DataBackup />
                </AppLayout>
              }
            />
          </Route>

          {/* ==================================================== */}
          {/* LANDLORD ROUTES (Protected with 'Landlord' role check) */}
          {/* ==================================================== */}
          <Route element={<ProtectedRoute allowedRoles={['Landlord']} />}>
            <Route path="/landlord" element={<Navigate to="/landlord/dashboard" replace />} />
            
            {/* 1. Landlord Dashboard */}
            <Route
              path="/landlord/dashboard"
              element={
                <AppLayout>
                  <LandlordDashboard />
                </AppLayout>
              }
            />

            {/* 2. My Properties */}
            <Route
              path="/landlord/properties"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="My Properties"
                    teammateName="Subhashini"
                    description="Real-time list of all commercial and residential properties registered under your landlord account."
                  />
                </AppLayout>
              }
            />

            {/* 3. My Tenants */}
            <Route
              path="/landlord/tenants"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="My Tenants"
                    teammateName="Subhashini"
                    description="Tenants currently leasing your properties, active leases, and contact details."
                  />
                </AppLayout>
              }
            />

            {/* 4. Invoices */}
            <Route
              path="/landlord/invoices"
              element={
                <AppLayout>
                  <Invoices />
                </AppLayout>
              }
            />

            {/* 5. Generate Invoice */}
            <Route
              path="/landlord/generate-invoice"
              element={
                <AppLayout>
                  <GenerateInvoices />
                </AppLayout>
              }
            />

            {/* 6. Invoice Template */}
            <Route
              path="/landlord/invoice-template"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Invoice Template"
                    teammateName="Ragul"
                    description="Preview and choose the template design for invoices issued to your tenants."
                  />
                </AppLayout>
              }
            />

            {/* 7. GST Report */}
            <Route
              path="/landlord/gst-report"
              element={
                <AppLayout>
                  <GSTReport />
                </AppLayout>
              }
            />

            {/* 8. Occupancy Report */}
            <Route
              path="/landlord/occupancy-report"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Occupancy Report"
                    teammateName="Subhashini"
                    description="Unit occupancy and vacancy statistics for your properties."
                  />
                </AppLayout>
              }
            />
          </Route>

          {/* ==================================================== */}
          {/* HARIDHARANI DEDICATED ROUTES & TEAMMATE ROUTES        */}
          {/* ==================================================== */}
          <Route element={<ProtectedRoute />}>
            {/* Haridharani Direct Sub-routes */}
            <Route path="/haridharani" element={<AppLayout><RentalRates /></AppLayout>} />
            <Route path="/haridharani/rates" element={<AppLayout><RentalRates /></AppLayout>} />
            <Route path="/haridharani/generate" element={<AppLayout><GenerateInvoices /></AppLayout>} />
            <Route path="/haridharani/invoices" element={<AppLayout><Invoices /></AppLayout>} />
            <Route path="/haridharani/gst-report" element={<AppLayout><GSTReport /></AppLayout>} />

            {/* Priya Legacy / Direct Routes */}
            <Route path="/priya" element={<RootRedirect />} />
            <Route path="/priya/dashboard" element={<RootRedirect />} />
            <Route path="/priya/invoice-register" element={<AppLayout><InvoiceRegister /></AppLayout>} />
            <Route path="/priya/invoice-overrides" element={<AppLayout><InvoiceOverrideLog /></AppLayout>} />
            <Route path="/priya/users" element={<AppLayout><UserManagement /></AppLayout>} />
            <Route path="/priya/audit-log" element={<AppLayout><MasterDataAudit /></AppLayout>} />
            <Route path="/priya/backups" element={<AppLayout><DataBackup /></AppLayout>} />

            {/* Teammate module routes */}
            <Route
              path="/subhashini/*"
              element={
                <AppLayout>
                  <SubhashiniLayout />
                </AppLayout>
              }
            />
            <Route
              path="/ragul/*"
              element={
                <AppLayout>
                  <ModulePlaceholder
                    moduleName="Ragul - Templates & PDFs"
                    teammateName="Ragul"
                    description="Invoice Template Designer, Logo Upload, and Bulk PDF Generation."
                  />
                </AppLayout>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
