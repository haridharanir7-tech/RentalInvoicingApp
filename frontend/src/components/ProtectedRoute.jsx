import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../modules/priya/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        Verifying authorization...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoleNormalized = (user?.role || '').toLowerCase();
  const allowedRolesNormalized = allowedRoles.map(r => r.toLowerCase());

  if (allowedRoles.length > 0 && user && !allowedRolesNormalized.includes(userRoleNormalized)) {
    const dashboardTarget = userRoleNormalized === 'admin' ? '/admin/dashboard' : '/landlord/dashboard';
    return (
      <div style={{
        maxWidth: '500px',
        margin: '60px auto',
        padding: '30px',
        background: '#ffffff',
        border: '1px solid #fee2e2',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <ShieldAlert size={32} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', margin: '0 0 8px 0' }}>
          Access Restricted
        </h3>
        <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px 0' }}>
          Your current role (<strong>{user.role}</strong>) does not have permission to access this screen. This area is restricted to: {allowedRoles.join(', ')}.
        </p>
        <button
          onClick={() => window.location.href = dashboardTarget}
          style={{
            padding: '8px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Return to My Dashboard
        </button>
      </div>
    );
  }

  return <Outlet />;
}
