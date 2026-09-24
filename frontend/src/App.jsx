import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import RagulModule from './modules/ragul';
import { ShieldCheck, Building2, Users, Receipt, CheckCircle, ArrowRight } from 'lucide-react';

function HomeDashboard() {
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, message: '' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({ online: true, checking: false, message: data.message || 'API Online' });
      })
      .catch((err) => {
        setBackendStatus({ online: false, checking: false, message: 'Could not connect to backend API' });
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          Rental Invoicing System
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Multi-tenant landlord rental billing, automated GST invoicing, and custom template engine.
        </p>
      </div>

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: backendStatus.online ? '#f0fdf4' : '#fef2f2',
          borderColor: backendStatus.online ? '#bbf7d0' : '#fecaca',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={22} color={backendStatus.online ? '#16a34a' : '#dc2626'} />
          <div>
            <div style={{ fontWeight: 600, color: backendStatus.online ? '#166534' : '#991b1b' }}>
              Backend Health: {backendStatus.checking ? 'Checking...' : backendStatus.online ? 'Online (Port 5000)' : 'Offline'}
            </div>
            <div style={{ fontSize: '0.85rem', color: backendStatus.online ? '#15803d' : '#b91c1c' }}>
              {backendStatus.message}
            </div>
          </div>
        </div>
        <span className={backendStatus.online ? 'badge badge-active' : 'badge badge-inactive'}>
          {backendStatus.online ? 'API Ready' : 'Connecting'}
        </span>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', margin: '24px 0 16px' }}>
        Assigned Team Modules
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {/* Module Ragul Card */}
        <div className="card" style={{ borderColor: '#2563eb', borderWidth: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#dbeafe', padding: '8px', borderRadius: '8px' }}>
              <Receipt size={22} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Ragul's Module</div>
              <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>Invoice Templates & PDF</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
            Invoice template customization, landlord logo uploads, custom color themes, live preview, and PDF generator.
          </p>
          <Link to="/ragul" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            Open Templates Module <ArrowRight size={16} />
          </Link>
        </div>

        {/* Priya Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
              <ShieldCheck size={22} color="#475569" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Priya's Module</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Access, Dashboard & Audit</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
            User authentication, role-based access control (RBAC), audit logging, and dashboard KPIs.
          </p>
          <Link to="/priya" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            View Module Info <ArrowRight size={16} />
          </Link>
        </div>

        {/* Subhashini Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
              <Building2 size={22} color="#475569" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Subhashini's Module</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Master Data Management</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
            Landlord Master records, PAN/GSTIN configuration, Property units, and Tenant lease agreements.
          </p>
          <Link to="/subhashini" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            View Module Info <ArrowRight size={16} />
          </Link>
        </div>

        {/* Haridharani Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>
              <Users size={22} color="#475569" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Haridharani's Module</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Rental Rates & Invoicing Engine</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
            Rental rate configuration, GST auto-calculation, sequential invoice numbering, and monthly reports.
          </p>
          <Link to="/haridharani" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            View Module Info <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TeammateModulePlaceholder({ title, author, scope, icon: Icon }) {
  return (
    <div className="card" style={{ padding: '32px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Icon size={28} color="#2563eb" />
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{title}</h2>
      <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f1f5f9', borderRadius: '16px', fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
        Assigned to: <strong>{author}</strong>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
        {scope}
      </p>
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <Link to="/" className="btn btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>
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
              <Route path="/" element={<HomeDashboard />} />
              <Route path="/ragul/*" element={<RagulModule />} />
              <Route
                path="/priya"
                element={
                  <TeammateModulePlaceholder
                    title="Access, Dashboard & Audit Module"
                    author="Priya"
                    scope="Login, RBAC, Password Reset, User Management, Scope Manager, Dashboard Widgets, and Audit Trail."
                    icon={ShieldCheck}
                  />
                }
              />
              <Route
                path="/subhashini"
                element={
                  <TeammateModulePlaceholder
                    title="Master Data Management Module"
                    author="Subhashini"
                    scope="Landlord Master (PAN/GSTIN), Property Master (Units, Types), and Tenant Master (Leases, Status)."
                    icon={Building2}
                  />
                }
              />
              <Route
                path="/haridharani"
                element={
                  <TeammateModulePlaceholder
                    title="Rental Rates & Invoicing Engine"
                    author="Haridharani"
                    scope="Rental Rate Configuration, Sequential Invoice Numbering, Rent + GST Auto-calculation, and GST Reports."
                    icon={Users}
                  />
                }
              />
              <Route element={<ProtectedRoute />}>
                {/* Protected routes */}
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
