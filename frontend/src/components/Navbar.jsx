import React from 'react';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem('rental_user') || '{"fullName":"Admin User","role":"Admin"}');

  const handleLogout = () => {
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
    window.location.href = '/login';
  };

  return (
    <header className="navbar">
      <div style={{ fontWeight: 600, color: '#334155' }}>
        Rental Management & Invoicing Portal
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="#64748b" />
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{user.fullName || user.full_name}</span>
          <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>{user.role}</span>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
          <LogOut size={13} /> Logout
        </button>
      </div>
    </header>
  );
}
