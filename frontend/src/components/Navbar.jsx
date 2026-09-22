import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div style={{ fontWeight: 600, color: '#334155' }}>
        Rental Management & Invoicing Portal
      </div>

      <div className="user-profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} color="#64748b" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {user ? user.full_name || user.fullName : 'Guest'}
          </span>
          <span className="user-badge">
            {user ? user.role : 'Visitor'}
          </span>
        </div>

        <button 
          onClick={logout} 
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          title="Sign Out"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
