import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/priyaApi';
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  Building2,
  Users,
  Home,
  Receipt,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin, isLandlord } = useAuth();
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async (period = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getSummary(period);
      setSummary(res.data.data);
      if (!selectedPeriod && res.data.data.selected_period) {
        setSelectedPeriod(res.data.data.selected_period);
      }
    } catch (err) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setSelectedPeriod(newPeriod);
    fetchSummary(newPeriod);
  };

  const invoiceSummary = summary?.invoice_summary || {
    draft: { count: 0, amount: 0 },
    generated: { count: 0, amount: 0 },
    sent: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Header showing Current Logged User Name, Role & Scope */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: isAdmin ? '#eff6ff' : '#ecfdf5',
            color: isAdmin ? '#2563eb' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.2rem'
          }}>
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {user?.full_name}
              </h2>
              <span style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                background: isAdmin ? '#dbeafe' : '#d1fae5',
                color: isAdmin ? '#1e40af' : '#065f46'
              }}>
                Role: {user?.role}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#dcfce7',
                color: '#15803d'
              }}>
                ● {user?.status}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.86rem' }}>
              {isLandlord ? (
                <>Linked Landlord Record: <strong>{user?.landlord_name || 'Assigned Landlord'}</strong> (Self-Scoped Access)</>
              ) : (
                <>System Administrator (Unrestricted multi-landlord management)</>
              )}
            </p>
          </div>
        </div>

        {/* Period Selector Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            Billing Period:
          </label>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#1e293b',
              cursor: 'pointer'
            }}
          >
            <option value="">All Periods</option>
            {summary?.available_periods?.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* 2. Invoice Status Summary (Draft / Generated / Sent) */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Invoice Status Summary ({selectedPeriod || 'All Periods'})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Real-time counts and billed values categorized by workflow state
            </p>
          </div>
          {isLandlord && (
            <span style={{ fontSize: '0.78rem', background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
              Scoped to your landlord records only
            </span>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {/* Total Invoices */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Total Invoices
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                  {invoiceSummary.total.count}
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#475569" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginTop: '8px' }}>
              {formatCurrency(invoiceSummary.total.amount)}
            </div>
          </div>

          {/* Draft Invoices */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase' }}>
                  Draft (Editable)
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#b45309', margin: '4px 0' }}>
                  {invoiceSummary.draft.count}
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 600, marginTop: '8px' }}>
              {formatCurrency(invoiceSummary.draft.amount)}
            </div>
          </div>

          {/* Generated Invoices */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Generated (Final)
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1d4ed8', margin: '4px 0' }}>
                  {invoiceSummary.generated.count}
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1e3a8a', fontWeight: 600, marginTop: '8px' }}>
              {formatCurrency(invoiceSummary.generated.amount)}
            </div>
          </div>

          {/* Sent Invoices */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>
                  Sent to Tenants
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#15803d', margin: '4px 0' }}>
                  {invoiceSummary.sent.count}
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} color="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#14532d', fontWeight: 600, marginTop: '8px' }}>
              {formatCurrency(invoiceSummary.sent.amount)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Cards for Key Modules (Properties, Landlords, Tenants, Invoices, Reports) */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '14px' }}>
          Key Modules
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px'
        }}>
          {/* Card 1: Properties */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Building2 size={22} color="#2563eb" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                {isLandlord ? 'My Properties' : 'Properties'}
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                {isLandlord
                  ? 'View commercial and residential units scoped to your estate.'
                  : 'Manage all commercial and residential properties across all landlords.'}
              </p>
            </div>
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb' }}>
                {summary?.module_counts?.properties || 0} Units
              </span>
              <Link to="/subhashini" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: '#2563eb' }}>
                Open <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 2: Landlords (Shown only for Admin) */}
          {isAdmin && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <div>
                <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Users size={22} color="#7c3aed" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Landlords
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                  Master list of registered landlords, PAN details, GSTIN, and default template settings.
                </p>
              </div>
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed' }}>
                  {summary?.module_counts?.landlords || 0} Landlords
                </span>
                <Link to="/subhashini" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: '#7c3aed' }}>
                  Manage <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* Card 3: Tenants */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Home size={22} color="#059669" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                {isLandlord ? 'My Tenants' : 'Tenants'}
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Active leases, PAN/GSTIN capture, contact details, and deposit records.
              </p>
            </div>
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>
                {summary?.module_counts?.tenants || 0} Tenants
              </span>
              <Link to="/subhashini" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: '#059669' }}>
                View <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 4: Invoices */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Receipt size={22} color="#ea580c" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                {isLandlord ? 'My Invoices' : 'Invoices'}
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Monthly rental invoice generation, calculations, and status tracking.
              </p>
            </div>
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ea580c' }}>
                {invoiceSummary.total.count} Invoices
              </span>
              <Link to="/haridharani" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: '#ea580c' }}>
                Open <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 5: Reports */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <TrendingUp size={22} color="#d97706" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                Reports
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                Monthly GST summary, consolidated landlord reports, and occupancy tracking.
              </p>
            </div>
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d97706' }}>
                GST & Occupancy
              </span>
              <Link to="/ragul" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: '#d97706' }}>
                View Reports <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
