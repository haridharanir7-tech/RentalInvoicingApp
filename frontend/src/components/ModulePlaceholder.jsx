import React from 'react';
import { GitBranch, Clock, UserCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/priya/context/AuthContext';

export default function ModulePlaceholder({ moduleName, teammateName, description, icon: IconComponent }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/landlord/dashboard';

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <GitBranch size={32} color="#2563eb" />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 10px 0' }}>
          {moduleName} Module
        </h2>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          background: '#f1f5f9',
          borderRadius: '9999px',
          color: '#475569',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <UserCheck size={14} color="#2563eb" />
          <span>Assigned Developer: {teammateName}</span>
        </div>

        <p style={{
          fontSize: '0.95rem',
          color: '#475569',
          lineHeight: 1.6,
          maxWidth: '560px',
          margin: '0 auto 24px auto'
        }}>
          The <strong>{moduleName}</strong> module will be connected when the <em>feature/{teammateName.toLowerCase()}</em> branch is merged into GitHub.
        </p>

        {description && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 18px',
            fontSize: '0.85rem',
            color: '#64748b',
            maxWidth: '520px',
            margin: '0 auto 28px auto',
            textAlign: 'left'
          }}>
            <strong>Scope & Purpose:</strong>
            <p style={{ margin: '4px 0 0 0' }}>{description}</p>
          </div>
        )}

        <button
          onClick={() => navigate(dashboardPath)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
