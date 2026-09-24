import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  Percent,
  FilePlus,
  Receipt,
  FileCode,
  PieChart,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../modules/priya/context/AuthContext';

export default function Sidebar() {
  const { user, isAdmin, isLandlord } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <Receipt size={22} color="#60a5fa" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Rental Portal
          </span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            {isAdmin ? 'ADMINISTRATOR' : 'LANDLORD PORTAL'}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* ========================================== */}
        {/* ADMIN SIDEBAR (10 Modules)                */}
        {/* ========================================== */}
        {isAdmin && (
          <>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px 4px 12px' }}>
              Core Navigation
            </div>

            {/* 1. Dashboard */}
            <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {/* 2. Landlord */}
            <NavLink to="/admin/landlords" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Landlords</span>
            </NavLink>

            {/* 3. Property */}
            <NavLink to="/admin/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>Properties</span>
            </NavLink>

            {/* 4. Tenant */}
            <NavLink to="/admin/tenants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Home size={18} />
              <span>Tenants</span>
            </NavLink>

            {/* 5. Rental Rate */}
            <NavLink to="/admin/rental-rates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Percent size={18} />
              <span>Rental Rates</span>
            </NavLink>

            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 12px 4px 12px' }}>
              Billing & Documents
            </div>

            {/* 6. Generate Invoice */}
            <NavLink to="/admin/generate-invoice" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FilePlus size={18} />
              <span>Generate Invoice</span>
            </NavLink>

            {/* 7. Invoices */}
            <NavLink to="/admin/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={18} />
              <span>Invoices</span>
            </NavLink>

            {/* 8. Invoice Template */}
            <NavLink to="/admin/invoice-template" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileCode size={18} />
              <span>Invoice Template</span>
            </NavLink>

            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 12px 4px 12px' }}>
              Reports & Compliance
            </div>

            {/* 9. Occupancy Report */}
            <NavLink to="/admin/occupancy-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <PieChart size={18} />
              <span>Occupancy Report</span>
            </NavLink>

            {/* 10. GST Report */}
            <NavLink to="/admin/gst-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>GST Report</span>
            </NavLink>
          </>
        )}

        {/* ========================================== */}
        {/* LANDLORD SIDEBAR (8 Modules)               */}
        {/* ========================================== */}
        {isLandlord && (
          <>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px 4px 12px' }}>
              My Estate
            </div>

            {/* 1. Dashboard */}
            <NavLink to="/landlord/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {/* 2. My Properties */}
            <NavLink to="/landlord/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>My Properties</span>
            </NavLink>

            {/* 3. My Tenants */}
            <NavLink to="/landlord/tenants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Home size={18} />
              <span>My Tenants</span>
            </NavLink>

            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 12px 4px 12px' }}>
              Invoicing & Templates
            </div>

            {/* 4. Invoices */}
            <NavLink to="/landlord/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={18} />
              <span>Invoices</span>
            </NavLink>

            {/* 5. Generate Invoice */}
            <NavLink to="/landlord/generate-invoice" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FilePlus size={18} />
              <span>Generate Invoice</span>
            </NavLink>

            {/* 6. Invoice Template */}
            <NavLink to="/landlord/invoice-template" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileCode size={18} />
              <span>Invoice Template</span>
            </NavLink>

            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '14px 12px 4px 12px' }}>
              Reports
            </div>

            {/* 7. GST Report */}
            <NavLink to="/landlord/gst-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>GST Report</span>
            </NavLink>

            {/* 8. Occupancy Report */}
            <NavLink to="/landlord/occupancy-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <PieChart size={18} />
              <span>Occupancy Report</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
