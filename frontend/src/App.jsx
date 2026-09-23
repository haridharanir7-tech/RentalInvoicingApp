import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import RentalRates from './modules/haridharani/RentalRates';
import GenerateInvoices from './modules/haridharani/genarateInvoices';
import Invoices from './modules/haridharani/Invoices';
import GSTReport from './modules/haridharani/GSTeport';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <Navbar />
          <main className="content-area">
            <Routes>
              <Route path="/" element={<h2>Welcome to Rental Invoicing App</h2>} />
              <Route element={<ProtectedRoute />}>
                {/* Module: Haridharani Routes */}
                <Route path="/haridharani" element={<RentalRates />} />
                <Route path="/haridharani/rates" element={<RentalRates />} />
                <Route path="/haridharani/generate" element={<GenerateInvoices />} />
                <Route path="/haridharani/invoices" element={<Invoices />} />
                <Route path="/haridharani/gst-report" element={<GSTReport />} />
              </Route>
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
