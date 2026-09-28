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
  const [filterYear, setFilterYear] = useState('2026');
  const [month1, setMonth1] = useState('09');
  const [month2, setMonth2] = useState('10');
  const [hoveredBar, setHoveredBar] = useState(null);
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
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 } }
  };

  // Helper to compute SVG pie slices from items
  const computePieSlices = (items, total, radius = 78, center = 100) => {
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

  const invoicePeriodMap = {};
  (invoices || []).forEach(inv => {
    const p = inv.billing_period || 'Unknown';
    if (!invoicePeriodMap[p]) {
      invoicePeriodMap[p] = { period: p, rent: 0, maintenance: 0, parking: 0, gst: 0, total: 0, count: 0 };
    }
    const r = Number(inv.rent_amount || 0);
    const m = Number(inv.maintenance_charges || 0);
    const pk = Number(inv.parking_charges || 0);
    const g = Number(inv.gst_amount || 0);
    const tot = Number(inv.total_amount || 0) || (r + m + pk + g);
    invoicePeriodMap[p].rent += r;
    invoicePeriodMap[p].maintenance += m;
    invoicePeriodMap[p].parking += pk;
    invoicePeriodMap[p].gst += g;
    invoicePeriodMap[p].total += tot;
    invoicePeriodMap[p].count += 1;
  });

  const chartMonthlyRevMap = {};
  (charts?.monthlyRevenue || []).forEach(m => {
    if (m.period) chartMonthlyRevMap[m.period] = m;
  });

  const MONTH_OPTIONS = [
    { value: '01', label: '01 - Jan' },
    { value: '02', label: '02 - Feb' },
    { value: '03', label: '03 - Mar' },
    { value: '04', label: '04 - Apr' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - Jun' },
    { value: '07', label: '07 - Jul' },
    { value: '08', label: '08 - Aug' },
    { value: '09', label: '09 - Sep' },
    { value: '10', label: '10 - Oct' },
    { value: '11', label: '11 - Nov' },
    { value: '12', label: '12 - Dec' }
  ];

  const period1 = `${filterYear}-${month1}`;
  const period2 = `${filterYear}-${month2}`;
  const selectedPeriods = month1 === month2 ? [period1] : [period1, period2];

  const displayBillingData = selectedPeriods.map(p => {
    const fromInv = invoicePeriodMap[p];
    const fromChart = chartMonthlyRevMap[p];
    const rent = Number(fromChart?.rent ?? fromInv?.rent ?? 0);
    const maintenance = Number(fromChart?.maintenance ?? fromInv?.maintenance ?? 0);
    const parking = Number(fromChart?.parking ?? fromInv?.parking ?? 0);
    const gst = Number(fromChart?.gst ?? fromInv?.gst ?? 0);
    const total = Number(fromChart?.billed ?? fromInv?.total ?? 0) || (rent + maintenance + parking + gst);
    return {
      period: p,
      rent,
      maintenance,
      parking,
      gst,
      total,
      rentPct: total > 0 ? ((rent / total) * 100).toFixed(1) : '0.0',
      maintenancePct: total > 0 ? ((maintenance / total) * 100).toFixed(1) : '0.0',
      parkingPct: total > 0 ? ((parking / total) * 100).toFixed(1) : '0.0',
      gstPct: total > 0 ? ((gst / total) * 100).toFixed(1) : '0.0',
      count: fromChart?.count || fromChart?.invoicesGenerated || fromInv?.count || 0
    };
  });

  const maxGroupedBarVal = Math.max(
    ...displayBillingData.flatMap(m => [m.rent, m.maintenance, m.parking, m.gst]),
    1
  );

  const filteredInvoices = (invoices || []).filter(inv =>
    selectedPeriods.includes(inv.billing_period)
  );

  const colorCounts = [
    {
      key: 'rent',
      label: 'Base Rent',
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      amount: displayBillingData.reduce((sum, m) => sum + m.rent, 0),
      count: filteredInvoices.filter(i => Number(i.rent_amount || 0) > 0).length
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      amount: displayBillingData.reduce((sum, m) => sum + m.maintenance, 0),
      count: filteredInvoices.filter(i => Number(i.maintenance_charges || 0) > 0).length
    },
    {
      key: 'parking',
      label: 'Parking',
      color: '#06b6d4',
      bgColor: '#ecfeff',
      borderColor: '#a5f3fc',
      amount: displayBillingData.reduce((sum, m) => sum + m.parking, 0),
      count: filteredInvoices.filter(i => Number(i.parking_charges || 0) > 0).length
    },
    {
      key: 'gst',
      label: 'GST (18%)',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      amount: displayBillingData.reduce((sum, m) => sum + m.gst, 0),
      count: filteredInvoices.filter(i => Number(i.gst_amount || 0) > 0).length
    }
  ];

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
        {/* Chart 1: Monthly Billing Breakdown – Grouped Bar Chart (From X-Axis Ground) */}
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#2563eb" />
                Monthly Billing Breakdown
              </h3>

              {/* Month 1, Month 2 & Year Selection in Top Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Year Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700 }}>Year:</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Select Year"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2027">2027</option>
                  </select>
                </div>

                {/* Month 1 Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700 }}>Month 1:</span>
                  <select
                    value={month1}
                    onChange={(e) => setMonth1(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Select Month 1"
                  >
                    {MONTH_OPTIONS.map(m => {
                      const isActive = Boolean(invoicePeriodMap[`${filterYear}-${m.value}`] || chartMonthlyRevMap[`${filterYear}-${m.value}`]);
                      return (
                        <option key={m.value} value={m.value}>
                          {m.label} {isActive ? '•' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Month 2 Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700 }}>Month 2:</span>
                  <select
                    value={month2}
                    onChange={(e) => setMonth2(e.target.value)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="Select Month 2"
                  >
                    {MONTH_OPTIONS.map(m => {
                      const isActive = Boolean(invoicePeriodMap[`${filterYear}-${m.value}`] || chartMonthlyRevMap[`${filterYear}-${m.value}`]);
                      return (
                        <option key={m.value} value={m.value}>
                          {m.label} {isActive ? '•' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', paddingTop: '8px' }}>
              {/* Active Bar Tooltip if hovered */}
              {hoveredBar && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 60,
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: hoveredBar.color, display: 'inline-block' }} />
                  <span style={{ fontWeight: 600 }}>{hoveredBar.period} • {hoveredBar.label}:</span>
                  <strong style={{ color: '#38bdf8' }}>{formatCurrency(hoveredBar.amount)}</strong>
                  <span style={{ color: '#94a3b8' }}>({hoveredBar.pct}% of month total)</span>
                </div>
              )}

              {/* Plot Area with Ground Baseline */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                minHeight: '220px',
                paddingTop: '24px',
                paddingBottom: '0px',
                position: 'relative',
                borderBottom: '2px solid #cbd5e1'
              }}>

                {displayBillingData.map((m, mIdx) => {
                    const maxBarHeight = 150;
                    const categories = [
                      { key: 'rent', label: 'Base Rent', color: '#2563eb', amount: m.rent, pct: m.rentPct, tag: 'Rent' },
                      { key: 'maintenance', label: 'Maintenance', color: '#8b5cf6', amount: m.maintenance, pct: m.maintenancePct, tag: 'Maint' },
                      { key: 'parking', label: 'Parking', color: '#06b6d4', amount: m.parking, pct: m.parkingPct, tag: 'Park' },
                      { key: 'gst', label: 'GST (18%)', color: '#f59e0b', amount: m.gst, pct: m.gstPct, tag: 'GST' }
                    ];

                    return (
                      <div
                        key={m.period || mIdx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {/* Month Total & Invoices badge above the cluster */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#0f172a' }}>
                            {formatCurrency(m.total)}
                          </span>
                          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
                            {m.count} inv
                          </span>
                        </div>

                        {/* 4 Grouped Bars Standing Side-by-Side directly from the Ground Baseline (y = 0) */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '6px',
                          background: 'rgba(241, 245, 249, 0.45)',
                          padding: '0 8px',
                          borderRadius: '6px 6px 0 0'
                        }}>
                          {categories.map(cat => {
                            const barHeight = cat.amount > 0
                              ? Math.max(Math.round((cat.amount / maxGroupedBarVal) * maxBarHeight), 8)
                              : 2;
                            const isHovered = hoveredBar?.period === m.period && hoveredBar?.key === cat.key;

                            return (
                              <div
                                key={cat.key}
                                onMouseEnter={() => setHoveredBar({
                                  period: m.period,
                                  key: cat.key,
                                  label: cat.label,
                                  color: cat.color,
                                  amount: cat.amount,
                                  pct: cat.pct,
                                  monthTotal: m.total
                                })}
                                onMouseLeave={() => setHoveredBar(null)}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                {/* Individual Bar rising from ground baseline */}
                                <div
                                  style={{
                                    width: '24px',
                                    height: `${barHeight}px`,
                                    background: cat.amount > 0 ? cat.color : '#e2e8f0',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'all 0.15s ease',
                                    transform: isHovered ? 'scaleY(1.05) scaleX(1.08)' : 'scale(1)',
                                    transformOrigin: 'bottom',
                                    boxShadow: isHovered ? `0 0 10px ${cat.color}` : 'none',
                                    border: cat.amount === 0 ? '1px dashed #cbd5e1' : 'none'
                                  }}
                                  title={`${m.period} - ${cat.label}: ${formatCurrency(cat.amount)} (${cat.pct}%)`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subcategory markers and Period labels directly below the Ground Line */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  paddingTop: '8px',
                  paddingBottom: '4px'
                }}>
                  {displayBillingData.map((m, mIdx) => (
                    <div
                      key={m.period || mIdx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      {/* Sub-labels right under each of the 4 bars */}
                      <div style={{ display: 'flex', gap: '6px', padding: '0 8px', marginBottom: '4px' }}>
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.62rem', color: '#2563eb', fontWeight: 700 }}>Rent</span>
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.62rem', color: '#8b5cf6', fontWeight: 700 }}>Maint</span>
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.62rem', color: '#06b6d4', fontWeight: 700 }}>Park</span>
                        <span style={{ width: '24px', textAlign: 'center', fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700 }}>GST</span>
                      </div>
                      {/* Period Pill */}
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        padding: '2px 10px',
                        borderRadius: '6px'
                      }}>
                        {m.period}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
          </div>

          {/* Color Breakdown & Individual Counts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9'
          }}>
            {colorCounts.map((c) => {
              const totalMonthAmount = displayBillingData.reduce((s, m) => s + m.total, 0);
              const pct = totalMonthAmount > 0 ? ((c.amount / totalMonthAmount) * 100).toFixed(1) : '0.0';
              return (
                <div
                  key={c.key}
                  style={{
                    background: c.bgColor,
                    border: `1px solid ${c.borderColor}`,
                    borderRadius: '8px',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.color }} />
                    <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#334155' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                    {formatCurrency(c.amount)}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><strong>{c.count}</strong> inv</span>
                    <span style={{ fontWeight: 700, color: '#475569' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#ea580c" />
                  Invoice Status Distribution
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Total Invoices → Draft + Generated + Sent
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', minHeight: '210px' }}>
              {/* Solid SVG Pie */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                    <filter id="landlordInvPieShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                    </filter>
                    <g filter="url(#landlordInvPieShadow)">
                      {totalInvoicesCount === 0 ? (
                        <circle cx="100" cy="100" r="78" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                      ) : (
                        invoiceSlices.map((slice) => {
                          const isHovered = hoveredInvoiceIdx === slice.index;
                          if (slice.isFullCircle) {
                            return (
                              <circle
                                key={slice.index}
                                cx="100"
                                cy="100"
                                r="78"
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
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '0.74rem',
                  color: '#475569',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  Total Invoices: <strong style={{ color: '#0f172a' }}>{totalInvoicesCount} Records</strong>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
                {invoiceSlices.map((item) => {
                  const isHovered = hoveredInvoiceIdx === item.index;
                  return (
                    <div
                      key={item.index}
                      onMouseEnter={() => setHoveredInvoiceIdx(item.index)}
                      onMouseLeave={() => setHoveredInvoiceIdx(null)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: isHovered ? '#eff6ff' : '#f8fafc',
                        borderRadius: '8px',
                        border: isHovered ? `1px solid ${item.color}` : '1px solid #f1f5f9',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{item.label}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{item.value} records</div>
                        <span style={{ fontSize: '0.72rem', color: isHovered ? item.color : '#64748b', fontWeight: 700 }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
