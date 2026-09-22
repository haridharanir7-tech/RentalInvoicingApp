import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Receipt, 
  FileText, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user ? user.role : 'Landlord';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Building2 size={24} color="#38bdf8" />
        <span>Rental Invoice</span>
      </div>

      <nav className="sidebar-nav">
        {/* Landlords & Properties - Admin & Manager */}
        {(role === 'Admin' || role === 'Manager') && (
          <>
            <NavLink to="/landlords" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Building2 size={18} />
              <span>Landlords</span>
            </NavLink>

            <NavLink to="/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Layers size={18} />
              <span>Properties</span>
            </NavLink>
          </>
        )}

        {/* Tenants & Rates - Admin & Manager */}
        {(role === 'Admin' || role === 'Manager') && (
          <>
            <NavLink to="/tenants" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>Tenants</span>
            </NavLink>

            <NavLink to="/rental-rates" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={18} />
              <span>Rental Rates</span>
            </NavLink>
          </>
        )}

        {/* Invoices - All Roles */}
        <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Receipt size={18} />
          <span>Invoices</span>
        </NavLink>

        {/* Reports - All Roles */}
        <NavLink to="/gst-reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>GST Reports</span>
        </NavLink>

        {/* User Management - Admin Only */}
        {role === 'Admin' && (
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={18} />
            <span>User Management</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
