import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/priyaApi';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Home,
  Receipt,
  IndianRupee,
  Clock,
  ArrowUpRight,
  TrendingUp,
  PieChart,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  CreditCard,
  FileText
} from 'lucide-react';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLandlordData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getLandlordDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching landlord dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load landlord dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlordData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw className="spin" size={32} style={{ margin: '0 auto 12px auto', display: 'block', color: '#2563eb' }} />
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Loading your estate records from Supabase...</p>
      </div>
    );
  }

  const { landlord, summaryCards, charts, invoices = [], properties = [], tenants = [] } = data || {
    landlord: {
      name: user?.landlord_name || user?.full_name,
      id: user?.landlord_id,
      email: user?.email || '',
      phone: '',
      pan: '',
      gstin: '',
      billing_address: '',
      default_invoice_template: 'Template A (Standard)',
      gst_registered: false,
      status: 'Active'
    },
    summaryCards: { myProperties: 0, myTenants: 0, myInvoices: 0, pendingInvoices: 0, occupancyRate: 0, myRevenue: 0 },
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 } }
  };

  const maxRevenue = Math.max(...(charts.monthlyRevenue?.map(m => m.billed) || [5000]), 5000);

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Landlord Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
        padding: '24px 28px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        color: '#ffffff',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.25)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            My Estate & Invoicing Overview
          </h1>
          
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {landlord?.pan && (
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#e2e8f0' }}>
              PAN: <strong>{landlord.pan}</strong>
            </div>
          )}
          <button
            onClick={fetchLandlordData}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          padding: '14px 18px',
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '10px',
          color: '#b91c1c',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Particular Landlord Master Details Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '22px 24px',
        marginBottom: '26px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 3px 0' }}>
              My Landlord Account & Business Profile
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Official records from Supabase PostgreSQL (Scoped strictly to Landlord ID: {landlord?.id})
            </p>
          </div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            <ShieldCheck size={14} color="#2563eb" />
            Verified Account ({landlord?.status || 'Active'})
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px'
        }}>
          {/* Detail 1: Landlord Name */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Landlord Name</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{landlord?.name || '—'}</div>
          </div>

          {/* Detail 2: Landlord ID */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Landlord ID</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '3px' }}>#{landlord?.id}</div>
          </div>

          {/* Detail 3: Registered Email */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered Email</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '3px', wordBreak: 'break-all' }}>{landlord?.email || user?.email || '—'}</div>
          </div>

          {/* Detail 4: Phone / Contact */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact Phone</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '3px' }}>{landlord?.phone || 'Not Provided'}</div>
          </div>

          {/* Detail 5: PAN Number */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PAN Number</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '3px', letterSpacing: '0.02em' }}>{landlord?.pan || 'Not Provided'}</div>
          </div>

          {/* Detail 6: GSTIN */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GSTIN</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '3px' }}>{landlord?.gstin || 'Exempt / Not Provided'}</div>
          </div>

          {/* Detail 7: GST Registered Status */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>GST Status</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: landlord?.gst_registered ? '#16a34a' : '#64748b', marginTop: '3px' }}>
              {landlord?.gst_registered ? 'GST Registered' : 'Non-GST / Exempt'}
            </div>
          </div>

          {/* Detail 8: Default Invoice Template */}
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Invoice Template</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a', marginTop: '3px' }}>
              {landlord?.default_invoice_template || 'Template A (Standard)'}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Scoped KPI Cards Grid (6 cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1: My Properties */}
        <div
          onClick={() => navigate('/landlord/properties')}
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>My Properties</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.myProperties}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Owned by your account
          </div>
        </div>

        {/* Card 2: My Tenants */}
        <div
          onClick={() => navigate('/landlord/tenants')}
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>My Tenants</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.myTenants}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Active leases
          </div>
        </div>

        {/* Card 3: Total Invoices */}
        <div
          onClick={() => navigate('/landlord/invoices')}
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>My Invoices</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.myInvoices}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            All-time invoices
          </div>
        </div>

        {/* Card 4: Pending Invoices */}
        <div
          onClick={() => navigate('/landlord/invoices')}
          style={{
            background: summaryCards.pendingInvoices > 0 ? '#fffbeb' : '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: summaryCards.pendingInvoices > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: summaryCards.pendingInvoices > 0 ? '#92400e' : '#64748b' }}>
              Draft Invoices
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summaryCards.pendingInvoices > 0 ? '#b45309' : '#0f172a' }}>
            {summaryCards.pendingInvoices}
          </div>
          <div style={{ fontSize: '0.75rem', color: summaryCards.pendingInvoices > 0 ? '#b45309' : '#64748b', marginTop: '6px' }}>
            Pending finalization
          </div>
        </div>

        {/* Card 5: Total Revenue */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {formatCurrency(summaryCards.myRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            Rent from your properties
          </div>
        </div>

        {/* Card 6: Occupancy Rate */}
        <div style={{
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Occupancy Rate</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent size={18} color="#c026d3" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.occupancyRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Leased vs Total units
          </div>
        </div>
      </div>


        </div>
  );
}
