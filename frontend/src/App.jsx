import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder views for the 4 modules until members add their components
function PriyaModule() {
  return (
    <div className="card">
      <h2>Priya's Module</h2>
      <p style={{ color: '#64748b', marginTop: '6px' }}>
        Place components for Authentication, User Management, and RBAC in <code>frontend/src/modules/priya/</code>
      </p>
    </div>
  );
}

function SubhashiniModule() {
  return (
    <div className="card">
      <h2>Subhashini's Module</h2>
      <p style={{ color: '#64748b', marginTop: '6px' }}>
        Place components for Landlords and Properties Master in <code>frontend/src/modules/subhashini/</code>
      </p>
    </div>
  );
}

function HaridharaniModule() {
  return (
    <div className="card">
      <h2>Haridharani's Module</h2>
      <p style={{ color: '#64748b', marginTop: '6px' }}>
        Place components for Tenants and Rental Rate Configuration in <code>frontend/src/modules/haridharani/</code>
      </p>
    </div>
  );
}

function RagulModule() {
  return (
    <div className="card">
      <h2>Ragul's Module</h2>
      <p style={{ color: '#64748b', marginTop: '6px' }}>
        Place components for Invoice Generation, PDF Rendering, and GST Reports in <code>frontend/src/modules/ragul/</code>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-wrapper">
          <Navbar />
          <main className="content-area">
            <Routes>
              <Route path="/" element={<Navigate to="/priya" replace />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/priya/*" element={<PriyaModule />} />
                <Route path="/subhashini/*" element={<SubhashiniModule />} />
                <Route path="/haridharani/*" element={<HaridharaniModule />} />
                <Route path="/ragul/*" element={<RagulModule />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
