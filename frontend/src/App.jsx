import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Student Modules
import Login from './modules/priya/Login';
import UsersList from './modules/priya/UsersList';
import LandlordsList from './modules/subhashini/LandlordsList';
import PropertiesList from './modules/subhashini/PropertiesList';
import TenantsList from './modules/haridharani/TenantsList';
import RentalRates from './modules/haridharani/RentalRates';
import InvoiceList from './modules/ragul/InvoiceList';
import GenerateInvoice from './modules/ragul/GenerateInvoice';
import GstReport from './modules/ragul/GstReport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route (Priya) */}
        <Route path="/login" element={<Login />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/invoices" replace />} />

          {/* Priya's Module */}
          <Route path="/users" element={<UsersList />} />

          {/* Subhashini's Module */}
          <Route path="/landlords" element={<LandlordsList />} />
          <Route path="/properties" element={<PropertiesList />} />

          {/* Haridharani's Module */}
          <Route path="/tenants" element={<TenantsList />} />
          <Route path="/rental-rates" element={<RentalRates />} />

          {/* Ragul's Module */}
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/generate" element={<GenerateInvoice />} />
          <Route path="/gst-reports" element={<GstReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
