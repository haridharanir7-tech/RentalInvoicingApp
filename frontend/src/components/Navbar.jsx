import React from 'react';
import { User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../modules/priya/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div></div>

      {isAuthenticated && user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isAdmin ? '#dbeafe' : '#dcfce7',
              color: isAdmin ? '#1e40af' : '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {user.full_name ? user.full_name[0] : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                {user.full_name}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isAdmin ? '#2563eb' : '#059669'
              }}>
                Role: {user.role} {user.landlord_name ? `(${user.landlord_name})` : ''}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      )}
    </header>
  );
}
