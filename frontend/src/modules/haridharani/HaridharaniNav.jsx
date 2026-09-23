import React from 'react';
import { NavLink } from 'react-router-dom';
import { SlidersHorizontal, Zap, FileSpreadsheet, BarChart3 } from 'lucide-react';
import './haridharani.css';

export default function HaridharaniNav() {
  return (
    <div className="hd-nav-tabs">
      <NavLink
        to="/haridharani/rates"
        className={({ isActive }) => `hd-nav-tab ${isActive ? 'active' : ''}`}
      >
        <SlidersHorizontal size={16} />
        <span>Rental Rates</span>
      </NavLink>

      <NavLink
        to="/haridharani/generate"
        className={({ isActive }) => `hd-nav-tab ${isActive ? 'active' : ''}`}
      >
        <Zap size={16} />
        <span>Generate Invoices</span>
      </NavLink>

      <NavLink
        to="/haridharani/invoices"
        className={({ isActive }) => `hd-nav-tab ${isActive ? 'active' : ''}`}
      >
        <FileSpreadsheet size={16} />
        <span>Invoice Register</span>
      </NavLink>

      <NavLink
        to="/haridharani/gst-report"
        className={({ isActive }) => `hd-nav-tab ${isActive ? 'active' : ''}`}
      >
        <BarChart3 size={16} />
        <span>GST Reports</span>
      </NavLink>
    </div>
  );
}

