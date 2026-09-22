import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Module Pages
import Login from './modules/auth/Login';
import UsersList from './modules/auth/UsersList';
import LandlordsList from './modules/landlords/LandlordsList';
import PropertiesList from './modules/landlords/PropertiesList';
import TenantsList from './modules/tenants/TenantsList';
import RentalRates from './modules/tenants/RentalRates';
import InvoiceList from './modules/invoices/InvoiceList';
import GenerateInvoice from './modules/invoices/GenerateInvoice';
import GstReport from './modules/invoices/GstReport';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Main Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/invoices" replace />} />

              {/* Invoices & GST Reports (Accessible by Admin, Manager, Landlord) */}
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/generate" element={<GenerateInvoice />} />
              <Route path="/gst-reports" element={<GstReport />} />

              {/* Landlords & Properties (Admin & Manager) */}
              <Route path="/landlords" element={<LandlordsList />} />
              <Route path="/properties" element={<PropertiesList />} />

              {/* Tenants & Rates (Admin & Manager) */}
              <Route path="/tenants" element={<TenantsList />} />
              <Route path="/rental-rates" element={<RentalRates />} />

              {/* Admin Only */}
              <Route path="/users" element={<UsersList />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
