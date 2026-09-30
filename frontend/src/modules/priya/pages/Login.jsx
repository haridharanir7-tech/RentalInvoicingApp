import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ShieldCheck, Eye, EyeOff, UserCheck, Shield, Home } from 'lucide-react';

const FALLBACK_ACCOUNTS = {
  admins: [
    { id: '1', name: 'System Administrator (Priya)', email: 'admin@rentalapp.com', role: 'Admin', defaultPass: 'Admin@123' },
    { id: '2', name: 'Ragul (Admin - Full Access)', email: 'ragul@gmail.com', role: 'Admin', defaultPass: 'Admin@123' },
    { id: '3', name: 'Admin One', email: 'admin1@rentalapp.com', role: 'Admin', defaultPass: 'Admin@123' }
  ],
  landlords: [
    { id: '4', name: 'Vaishu', email: 'vaishi@gmail.com', role: 'Landlord', defaultPass: 'admin123' },
    { id: '5', name: 'Shanu', email: 'shanu@gmail.com', role: 'Landlord', defaultPass: 'admin123' },
    { id: '6', name: 'Zara', email: 'zara@gmail.com', role: 'Landlord', defaultPass: 'admin123' },
    { id: '7', name: 'Kishore', email: 'kishore@gmai.com', role: 'Landlord', defaultPass: 'admin123' }
  ]
};

export default function Login() {
  const { isAuthenticated, user: authUser, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      if ((authUser.role || '').toLowerCase() === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/landlord/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authUser, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'landlord'
  const [quickAccounts, setQuickAccounts] = useState(FALLBACK_ACCOUNTS);
  const [selectedEmail, setSelectedEmail] = useState('');

  // Fetch live accounts from database
  useEffect(() => {
    fetch('/api/priya/quick-accounts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch accounts');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.accounts) {
          setQuickAccounts({
            admins: data.accounts.admins && data.accounts.admins.length > 0 ? data.accounts.admins : FALLBACK_ACCOUNTS.admins,
            landlords: data.accounts.landlords && data.accounts.landlords.length > 0 ? data.accounts.landlords : FALLBACK_ACCOUNTS.landlords
          });
        }
      })
      .catch((err) => {
        console.warn('Using fallback quick accounts:', err.message);
      });
  }, []);

  const handleSubmit = async (e, customEmail, customPassword) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    if (!loginEmail || !loginPass) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(loginEmail, loginPass);
      if ((loggedUser.role || '').toLowerCase() === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/landlord/dashboard';
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickLogin = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    setSelectedEmail(accEmail);
    setError('');
    handleSubmit(null, accEmail, accPass);
  };

  const handleSelectAccount = (accEmail, accPass) => {
    setEmail(accEmail);
    setPassword(accPass);
    setSelectedEmail(accEmail);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '36px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: '16px',
            marginBottom: '14px',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)'
          }}>
            <Building2 size={32} color="#2563eb" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Rental Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Sign in with live database credentials or 1-click accounts
          </p>
        </div>

        {/* Quick Database Logins Tabs (Direct login instead of checking database table) */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '22px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <UserCheck size={14} color="#2563eb" /> Live Database Accounts
            </span>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              ● Synced with Supabase
            </span>
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                border: activeTab === 'admin' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: activeTab === 'admin' ? '#eff6ff' : '#ffffff',
                color: activeTab === 'admin' ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Shield size={13} />
              Admins ({quickAccounts.admins.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('landlord')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                border: activeTab === 'landlord' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                background: activeTab === 'landlord' ? '#f0fdf4' : '#ffffff',
                color: activeTab === 'landlord' ? '#15803d' : '#64748b',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Home size={13} />
              Landlords ({quickAccounts.landlords.length})
            </button>
          </div>

          {/* Account Quick Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
            {(activeTab === 'admin' ? quickAccounts.admins : quickAccounts.landlords).map((acc) => {
              const isSelected = selectedEmail === acc.email;
              const isAdm = acc.role.toLowerCase() === 'admin';
              return (
                <div
                  key={acc.id || acc.email}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? (isAdm ? '#dbeafe' : '#dcfce7') : '#ffffff',
                    border: isSelected ? `1.5px solid ${isAdm ? '#2563eb' : '#16a34a'}` : '1px solid #e2e8f0',
                    transition: 'all 0.15s'
                  }}
                >
                  <div
                    onClick={() => handleSelectAccount(acc.email, acc.defaultPass)}
                    style={{ cursor: 'pointer', flex: 1, marginRight: '8px' }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {acc.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(acc.email, acc.defaultPass)}
                      style={{
                        padding: '4px 8px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                      title="Fill into form"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handle1ClickLogin(acc.email, acc.defaultPass)}
                      style={{
                        padding: '4px 9px',
                        background: isAdm ? '#2563eb' : '#16a34a',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                      title="Sign in instantly"
                    >
                      1-Click Login
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedEmail('');
                }}
                placeholder="name@company.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '11px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
          >
            <ShieldCheck size={18} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
