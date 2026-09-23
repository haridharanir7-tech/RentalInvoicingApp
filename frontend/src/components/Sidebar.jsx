import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Building2, Users, Receipt } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>Rental Portal</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/priya" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={18} />
          <span>Module: Priya</span>
        </NavLink>

        <NavLink to="/subhashini" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>Module: Subhashini</span>
        </NavLink>

        <NavLink to="/haridharani" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Module: Haridharani</span>
        </NavLink>

        <NavLink to="/ragul" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={18} />
          <span>Module: Ragul</span>
        </NavLink>
      </nav>
    </aside>
  );
}
