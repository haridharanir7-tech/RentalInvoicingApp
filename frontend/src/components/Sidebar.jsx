import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Users, Receipt, FileText, Layers, ShieldCheck, Home } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Building2 size={22} color="#38bdf8" />
        <span>Rental Invoicing</span>
      </div>

      <nav className="sidebar-nav">
        {/* Priya's Module */}
        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={18} />
          <span>Users (Priya)</span>
        </NavLink>

        {/* Subhashini's Module */}
        <NavLink to="/landlords" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>Landlords (Subhashini)</span>
        </NavLink>
        <NavLink to="/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Properties (Subhashini)</span>
        </NavLink>

        {/* Haridharani's Module */}
        <NavLink to="/tenants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Tenants (Haridharani)</span>
        </NavLink>
        <NavLink to="/rental-rates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Home size={18} />
          <span>Rental Rates (Haridharani)</span>
        </NavLink>

        {/* Ragul's Module */}
        <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={18} />
          <span>Invoices (Ragul)</span>
        </NavLink>
        <NavLink to="/gst-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>GST Reports (Ragul)</span>
        </NavLink>
      </nav>
    </aside>
  );
}
