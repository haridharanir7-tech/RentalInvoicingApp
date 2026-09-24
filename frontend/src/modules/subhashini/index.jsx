import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LandlordManagement from './LandlordManagement';
import PropertyManagement from './PropertyManagement';
import TenantManagement from './TenantManagement';
import OccupancyReport from './OccupancyReport';
import { Building, Users, FileText, BarChart3 } from 'lucide-react';

export default function SubhashiniLayout() {
  return (
    <div>
      <div className="sub-nav-tabs">
        <NavLink to="/subhashini/properties" className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}>
          <FileText size={16} />
          <span>Properties</span>
        </NavLink>
        <NavLink to="/subhashini/tenants" className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}>
          <Users size={16} />
          <span>Tenants</span>
        </NavLink>
        <NavLink to="/subhashini/landlords" className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}>
          <Building size={16} />
          <span>Landlords</span>
        </NavLink>
        <NavLink to="/subhashini/report" className={({ isActive }) => `sub-nav-tab ${isActive ? 'active' : ''}`}>
          <BarChart3 size={16} />
          <span>Occupancy Report</span>
        </NavLink>
      </div>

      <Routes>
        <Route index element={<Navigate to="properties" replace />} />
        <Route path="/" element={<Navigate to="properties" replace />} />
        <Route path="properties" element={<PropertyManagement />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="landlords" element={<LandlordManagement />} />
        <Route path="report" element={<OccupancyReport />} />
      </Routes>
    </div>
  );
}
