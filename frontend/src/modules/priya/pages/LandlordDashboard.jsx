import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/priyaApi';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Home,
  Warehouse,
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
  FileText,
  Layers,
  KeyRound
} from 'lucide-react';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredInvoiceIdx, setHoveredInvoiceIdx] = useState(null);

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
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 }, propertyTypes: { Commercial: 0, Residential: 0, Warehouse: 0 } }
  };

  // Helper to compute SVG pie slices from items
  const computePieSlices = (items, total, radius = 88, center = 100) => {
    if (!total || total <= 0) return [];
    const nonZero = items.filter(i => i.value > 0);
    if (nonZero.length === 1) {
      return items.map((item, idx) => ({
        ...item,
        index: idx,
        fraction: item.value / total,
        percentage: ((item.value / total) * 100).toFixed(1),
        pathData: null,
        isFullCircle: item.value > 0
      }));
    }
    let currentAngle = -Math.PI / 2;
    return items.map((item, idx) => {
      if (item.value <= 0) {
        return {
          ...item,
          index: idx,
          fraction: 0,
          percentage: '0.0',
          pathData: null,
          isFullCircle: false
        };
      }
      const fraction = item.value / total;
      const sliceAngle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathData = `M ${center} ${center} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;

      return {
        ...item,
        index: idx,
        fraction,
        percentage: (fraction * 100).toFixed(1),
        pathData,
        isFullCircle: false
      };
    });
  };

  // 1. Chart 1 Data: Property Category Distribution (Commercial, Residential & Warehouse)
  const propTypes = charts.propertyTypes || {};
  const commCount = Number(propTypes.Commercial ?? (properties || []).filter(p => (p.property_type || '').toLowerCase() === 'commercial').length);
  const resCount = Number(propTypes.Residential ?? (properties || []).filter(p => (p.property_type || '').toLowerCase() === 'residential').length);
  const whCount = Number(propTypes.Warehouse ?? (properties || []).filter(p => (p.property_type || '').toLowerCase() === 'warehouse').length);
  const totalPortfolioProps = (commCount + resCount + whCount) || Number(summaryCards.myProperties || 0) || (properties?.length || 0) || 1;

  const commPct = totalPortfolioProps > 0 ? ((commCount / totalPortfolioProps) * 100).toFixed(1) : '0.0';
  const resPct = totalPortfolioProps > 0 ? ((resCount / totalPortfolioProps) * 100).toFixed(1) : '0.0';
  const whPct = totalPortfolioProps > 0 ? ((whCount / totalPortfolioProps) * 100).toFixed(1) : '0.0';

  const propertyCategories = [
    {
      type: 'Commercial',
      label: 'Commercial',
      count: commCount,
      percentage: commPct,
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      activeBorder: '#2563eb',
      gradient: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
      desc: 'Offices & Commercial spaces',
      icon: Building2
    },
    {
      type: 'Residential',
      label: 'Residential',
      count: resCount,
      percentage: resPct,
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      activeBorder: '#059669',
      gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
      badgeBg: '#d1fae5',
      badgeColor: '#047857',
      desc: 'Housing & Residential units',
      icon: Home
    },
    {
      type: 'Warehouse',
      label: 'Warehouse',
      count: whCount,
      percentage: whPct,
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      activeBorder: '#d97706',
      gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      desc: 'Storage & Logistics hubs',
      icon: Warehouse
    }
  ];

  // Capture any other property types if present
  const standardTypes = ['Commercial', 'Residential', 'Warehouse'];
  Object.keys(propTypes).forEach(key => {
    if (!standardTypes.includes(key) && Number(propTypes[key]) > 0) {
      const c = Number(propTypes[key]);
      propertyCategories.push({
        type: key,
        label: key,
        count: c,
        percentage: ((c / totalPortfolioProps) * 100).toFixed(1),
        color: '#7c3aed',
        bgColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        activeBorder: '#7c3aed',
        gradient: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
        badgeBg: '#ede9fe',
        badgeColor: '#6d28d9',
        desc: `${key} properties`,
        icon: Building2
      });
    }
  });

  const totalInvoicesCount = (charts.invoiceStatus?.Draft || 0) + (charts.invoiceStatus?.Generated || 0) + (charts.invoiceStatus?.Sent || 0);
  const invoiceStatusData = [
    { label: 'Draft', value: charts.invoiceStatus?.Draft || 0, color: '#f59e0b' },
    { label: 'Generated', value: charts.invoiceStatus?.Generated || 0, color: '#2563eb' },
    { label: 'Sent', value: charts.invoiceStatus?.Sent || 0, color: '#10b981' }
  ];
  const invoiceSlices = computePieSlices(invoiceStatusData, totalInvoicesCount);

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
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              My Landlord Account & Business Profile
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/landlord/change-password')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              title="Change your account password"
            >
              <KeyRound size={14} color="#2563eb" />
              Change Password
            </button>
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
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '3px' }}>{landlord?.id ?? '—'}</div>
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

      {/* Exactly 2 Informative Dashboard Charts - Two Charts in a Row */}
      <style>{`
        .dashboard-charts-2col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }
        @media (max-width: 900px) {
          .dashboard-charts-2col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="dashboard-charts-2col">
        {/* Chart 1: Property Portfolio Distribution (Commercial, Residential & Warehouse) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#2563eb" />
                  Property Portfolio Distribution
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Commercial, Residential & Warehouse asset breakdown
                </p>
              </div>

              {/* Total Portfolio Count Badge */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Portfolio
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  {totalPortfolioProps} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Properties</span>
                </div>
              </div>
            </div>

            {/* Main Visual: 3 Category Volume Level Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '12px',
              marginBottom: '18px'
            }}>
              {propertyCategories.map((cat) => {
                const IconComponent = cat.icon;
                const isHovered = hoveredCategory === cat.type;
                return (
                  <div
                    key={cat.type}
                    onMouseEnter={() => setHoveredCategory(cat.type)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      background: isHovered ? cat.bgColor : '#f8fafc',
                      border: isHovered ? `1.5px solid ${cat.activeBorder}` : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: cat.color
                        }}>
                          <IconComponent size={14} color={cat.color} />
                          {cat.label}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: cat.badgeColor,
                          background: cat.badgeBg,
                          padding: '2px 7px',
                          borderRadius: '12px'
                        }}>
                          {cat.percentage}%
                        </span>
                      </div>

                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                        {cat.count}
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                          {cat.count === 1 ? 'Property' : 'Properties'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.69rem', color: '#64748b', marginBottom: '6px', lineHeight: '1.2' }}>
                        {cat.desc}
                      </div>
                    </div>

                    {/* Category Level Bar */}
                    <div>
                      <div style={{
                        height: '8px',
                        background: '#e2e8f0',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        marginTop: '6px'
                      }}>
                        <div style={{
                          width: `${cat.percentage}%`,
                          height: '100%',
                          background: cat.gradient,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Proportional Full-Width Split Meter */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                <span>Portfolio Share Breakdown</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
                  {propertyCategories.map((c, i) => (
                    <span key={c.type} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color }} />
                      <span>{c.percentage}% {c.label}</span>
                      {i < propertyCategories.length - 1 && <span style={{ color: '#cbd5e1' }}>•</span>}
                    </span>
                  ))}
                </span>
              </div>
              <div style={{
                height: '24px',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {propertyCategories.map((cat) => (
                  <div
                    key={cat.type}
                    onMouseEnter={() => setHoveredCategory(cat.type)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      width: `${cat.percentage}%`,
                      background: cat.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      filter: hoveredCategory === cat.type ? 'brightness(1.15)' : 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: '0 4px'
                    }}
                    title={`${cat.label}: ${cat.count} Properties (${cat.percentage}%)`}
                  >
                    {Number(cat.percentage) >= 12 ? `${cat.label} ${cat.percentage}%` : (Number(cat.percentage) >= 7 ? `${cat.percentage}%` : '')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Navigation & Portfolio Mix */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Portfolio mix: <strong style={{ color: '#0f172a' }}>{commCount} Commercial</strong>, <strong style={{ color: '#0f172a' }}>{resCount} Residential</strong>, and <strong style={{ color: '#0f172a' }}>{whCount} Warehouse</strong> assets
            </div>
            <button
              onClick={() => navigate('/landlord/properties')}
              style={{
                fontSize: '0.78rem',
                color: '#2563eb',
                background: 'none',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Manage Properties
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Chart 2: Invoice Status Distribution – Pie Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#ea580c" />
                  Invoice Status Distribution
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Total Invoices → Draft + Generated + Sent
                </p>
              </div>

              {/* Total Invoices Badge in Top Right */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 14px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Invoices
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  {totalInvoicesCount} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Records</span>
                </div>
              </div>
            </div>

            {/* Centered Solid SVG Pie */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px 0 12px 0',
              minHeight: '235px'
            }}>
              <div style={{ position: 'relative', width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="230" height="230" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                  <filter id="landlordInvPieShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                  </filter>
                  <g filter="url(#landlordInvPieShadow)">
                    {totalInvoicesCount === 0 ? (
                      <circle cx="100" cy="100" r="88" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                    ) : (
                      invoiceSlices.map((slice) => {
                        const isHovered = hoveredInvoiceIdx === slice.index;
                        if (slice.isFullCircle) {
                          return (
                            <circle
                              key={slice.index}
                              cx="100"
                              cy="100"
                              r="88"
                              fill={slice.color}
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              onMouseEnter={() => setHoveredInvoiceIdx(slice.index)}
                              onMouseLeave={() => setHoveredInvoiceIdx(null)}
                              style={{ cursor: 'pointer' }}
                            />
                          );
                        }
                        if (!slice.pathData) return null;
                        return (
                          <path
                            key={slice.index}
                            d={slice.pathData}
                            fill={slice.color}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            opacity={hoveredInvoiceIdx !== null && !isHovered ? 0.65 : 1}
                            onMouseEnter={() => setHoveredInvoiceIdx(slice.index)}
                            onMouseLeave={() => setHoveredInvoiceIdx(null)}
                            style={{
                              cursor: 'pointer',
                              transition: 'opacity 0.2s ease, transform 0.2s ease',
                              transformOrigin: '100px 100px',
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                            }}
                          >
                            <title>{`${slice.label}: ${slice.value} invoices (${slice.percentage}%)`}</title>
                          </path>
                        );
                      })
                    )}
                  </g>
                </svg>
              </div>
            </div>

            {/* Breakdown Cards Placed at the Bottom */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9'
            }}>
              {invoiceSlices.map((item) => {
                const isHovered = hoveredInvoiceIdx === item.index;
                return (
                  <div
                    key={item.index}
                    onMouseEnter={() => setHoveredInvoiceIdx(item.index)}
                    onMouseLeave={() => setHoveredInvoiceIdx(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: isHovered ? '#eff6ff' : '#f8fafc',
                      borderRadius: '8px',
                      border: isHovered ? `1.5px solid ${item.color}` : '1px solid #e2e8f0',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isHovered ? item.color : '#64748b',
                        background: isHovered ? '#ffffff' : '#e2e8f0',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        flexShrink: 0
                      }}>
                        {item.percentage}%
                      </span>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.value} <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#64748b' }}>records</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Status mix: <strong style={{ color: '#0f172a' }}>{charts.invoiceStatus?.Draft || 0} Draft</strong>, <strong style={{ color: '#0f172a' }}>{charts.invoiceStatus?.Generated || 0} Generated</strong>, and <strong style={{ color: '#0f172a' }}>{charts.invoiceStatus?.Sent || 0} Sent</strong>
            </div>
            <button
              onClick={() => navigate('/landlord/invoices')}
              style={{
                fontSize: '0.78rem',
                color: '#2563eb',
                background: 'none',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              View Invoices
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
