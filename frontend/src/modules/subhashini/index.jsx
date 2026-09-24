import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import LandlordManagement from './LandlordManagement';
import PropertyManagement from './PropertyManagement';
import TenantManagement from './TenantManagement';
import OccupancyReport from './OccupancyReport';
import { Building, Users, FileText, BarChart } from 'lucide-react';

export default function SubhashiniLayout() {
  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Master Data Management</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
        <NavLink to="/subhashini/landlords" className={({ isActive }) => `btn ${isActive ? '' : 'btn-secondary'}`}>
          <Building size={16} /> Landlords
        </NavLink>
        <NavLink to="/subhashini/properties" className={({ isActive }) => `btn ${isActive ? '' : 'btn-secondary'}`}>
          <FileText size={16} /> Properties
        </NavLink>
        <NavLink to="/subhashini/tenants" className={({ isActive }) => `btn ${isActive ? '' : 'btn-secondary'}`}>
          <Users size={16} /> Tenants
        </NavLink>
        <NavLink to="/subhashini/report" className={({ isActive }) => `btn ${isActive ? '' : 'btn-secondary'}`}>
          <BarChart size={16} /> Occupancy Report
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Select a module from above.</div>} />
        <Route path="landlords" element={<LandlordManagement />} />
        <Route path="properties" element={<PropertyManagement />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="report" element={<OccupancyReport />} />
      </Routes>
    </div>
  );
}
