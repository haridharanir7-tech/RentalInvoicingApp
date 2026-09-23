import React from 'react';
import { Building2, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155' }}>
        <Building2 size={20} color="#2563eb" />
        <span>Rental Invoicing Application</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <User size={18} color="#64748b" />
        <span style={{ fontSize: '0.9rem', color: '#475569' }}>User Profile</span>
      </div>
    </header>
  );
}
