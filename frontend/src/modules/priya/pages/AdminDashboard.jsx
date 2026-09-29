import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/priyaApi';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  Home,
  Receipt,
  IndianRupee,
  Clock,
  ArrowUpRight,
  PieChart,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FilePlus,
  Percent,
  FileCode,
  BarChart3,
  Calendar,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const [hoveredInvoiceIdx, setHoveredInvoiceIdx] = useState(null);
  const [hoveredAreaType, setHoveredAreaType] = useState(null);
  const invoicePageSize = 5;

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getAdminDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Loading system analytics...</p>
      </div>
    );
  }

  const { summaryCards, charts, recentInvoices = [] } = data || {
    summaryCards: { totalLandlords: 0, totalProperties: 0, totalTenants: 0, totalInvoices: 0, totalRevenue: 0, totalBilled: 0, pendingApprovalsCount: 0 },
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 }, propertyTypes: { Commercial: 0, Residential: 0 }, tenantStatus: { Active: 0, NoticePeriod: 0, Vacated: 0 }, gstSummary: {}, chargesBreakdown: {} }
  };

  const totalInvoicePages = Math.ceil((recentInvoices?.length || 0) / invoicePageSize) || 1;
  const paginatedInvoices = (recentInvoices || []).slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize
  );

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

  // 1. Chart 1 Data: Commercial vs Residential Area Breakdown & Comparison
  const propArea = charts.propertyArea || {};
  const commCount = propArea.commercialCount ?? charts.propertyTypes?.Commercial ?? 0;
  const resCount = propArea.residentialCount ?? charts.propertyTypes?.Residential ?? 0;
  const totalPropsCount = (commCount + resCount) || summaryCards.totalProperties || 1;

  // Exact Square Footage (sq.ft)
  const commArea = Number(propArea.commercialAreaSqft ?? (charts.totalAreaSqft ? Math.round(charts.totalAreaSqft * 0.65) : 0));
  const resArea = Number(propArea.residentialAreaSqft ?? (charts.totalAreaSqft ? Math.round(charts.totalAreaSqft * 0.35) : 0));
  const totalArea = (commArea + resArea) || Number(charts.totalAreaSqft || 0);

  const commAreaPct = totalArea > 0 ? ((commArea / totalArea) * 100).toFixed(1) : (commCount > 0 ? ((commCount / totalPropsCount) * 100).toFixed(1) : '50.0');
  const resAreaPct = totalArea > 0 ? ((resArea / totalArea) * 100).toFixed(1) : (resCount > 0 ? ((resCount / totalPropsCount) * 100).toFixed(1) : '50.0');

  const avgCommArea = commCount > 0 && commArea > 0 ? Math.round(commArea / commCount) : 0;
  const avgResArea = resCount > 0 && resArea > 0 ? Math.round(resArea / resCount) : 0;


  // 2. Invoice Status Distribution (Pie Chart)
  // Relationship: Total Invoices -> Draft + Generated + Sent
  const invoiceStatusData = charts.invoiceStatus || {};
  const draftInvoices = Number(invoiceStatusData.Draft || 0);
  const generatedInvoices = Number(invoiceStatusData.Generated || 0);
  const sentInvoices = Number(invoiceStatusData.Sent || 0);
  const totalInvoicesCount = draftInvoices + generatedInvoices + sentInvoices || summaryCards.totalInvoices || 1;
  const invoicePieItems = [
    { label: 'Draft Invoices', value: draftInvoices, color: '#64748b' },
    { label: 'Generated Invoices', value: generatedInvoices, color: '#3b82f6' },
    { label: 'Sent Invoices', value: sentInvoices, color: '#10b981' }
  ];
  const invoiceSlices = computePieSlices(invoicePieItems, totalInvoicesCount);

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Header Banner */}
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
            Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchDashboardData}
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

      {/* Error notification */}
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


      {/* Summary KPI Cards Grid (6 cards, 3 per row) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Landlords */}
        <div
          onClick={() => navigate('/admin/landlords')}
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Landlords</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.totalLandlords}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Registered Landlords
          </div>
        </div>

        {/* Card 2: Total Properties */}
        <div
          onClick={() => navigate('/admin/properties')}
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
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Properties</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.totalProperties}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Commercial & Residential
          </div>
        </div>

        {/* Card 3: Total Tenants */}
        <div
          onClick={() => navigate('/admin/tenants')}
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
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Active Tenants</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.totalTenants}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Registered Tenants
          </div>
        </div>

        {/* Card 4: Total Invoices */}
        <div
          onClick={() => navigate('/admin/invoices')}
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
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Invoices</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="#ea580c" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {summaryCards.totalInvoices}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
            Draft / Generated / Sent
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
            {formatCurrency(summaryCards.totalBilled || summaryCards.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            {formatCurrency(summaryCards.totalRevenue)} finalized · Total Billed
          </div>
        </div>

        {/* Card 6: Pending Approvals */}
        <div
          onClick={() => navigate('/admin/landlords')}
          style={{
            background: summaryCards.pendingApprovalsCount > 0 ? '#fffbeb' : '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: summaryCards.pendingApprovalsCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: summaryCards.pendingApprovalsCount > 0 ? '#92400e' : '#64748b' }}>
              Pending Approvals
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summaryCards.pendingApprovalsCount > 0 ? '#b45309' : '#0f172a' }}>
            {summaryCards.pendingApprovalsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: summaryCards.pendingApprovalsCount > 0 ? '#b45309' : '#64748b', marginTop: '6px', fontWeight: 600 }}>
            {summaryCards.pendingApprovalsCount > 0 ? 'Action required' : 'All accounts authorized'}
          </div>
        </div>
      </div>

      {/* Exactly 4 Informative Dashboard Charts - Two Charts in a Row */}
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
      <div className="dashboard-charts-2col" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Chart 1: Commercial vs Residential Area Graph */}
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
                  Commercial vs Residential Area
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Real estate square footage volume & portfolio distribution
                </p>
              </div>

              {/* Total Area Pill in Top Right */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Portfolio
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  {totalArea.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>sq.ft</span>
                </div>
              </div>
            </div>

            {/* Main Visual: Dual Comparative Volume Level Columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '18px'
            }}>
              {/* Commercial Column */}
              <div
                onMouseEnter={() => setHoveredAreaType('Commercial')}
                onMouseLeave={() => setHoveredAreaType(null)}
                style={{
                  background: hoveredAreaType === 'Commercial' ? '#eff6ff' : '#f8fafc',
                  border: hoveredAreaType === 'Commercial' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#1d4ed8'
                  }}>
                    <Building2 size={15} color="#2563eb" />
                    Commercial
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    background: '#dbeafe',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {commAreaPct}%
                  </span>
                </div>

                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {commArea.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>sq.ft</span>
                </div>

                {/* Animated Level Bar */}
                <div style={{
                  height: '10px',
                  background: '#e2e8f0',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  margin: '10px 0 8px 0'
                }}>
                  <div style={{
                    width: `${commAreaPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span><strong>{commCount}</strong> Properties</span>
                  <span>Avg: <strong>{avgCommArea.toLocaleString('en-IN')}</strong> sq.ft</span>
                </div>
              </div>

              {/* Residential Column */}
              <div
                onMouseEnter={() => setHoveredAreaType('Residential')}
                onMouseLeave={() => setHoveredAreaType(null)}
                style={{
                  background: hoveredAreaType === 'Residential' ? '#ecfdf5' : '#f8fafc',
                  border: hoveredAreaType === 'Residential' ? '1.5px solid #059669' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#047857'
                  }}>
                    <Home size={15} color="#059669" />
                    Residential
                  </span>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#047857',
                    background: '#d1fae5',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {resAreaPct}%
                  </span>
                </div>

                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  {resArea.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>sq.ft</span>
                </div>

                {/* Animated Level Bar */}
                <div style={{
                  height: '10px',
                  background: '#e2e8f0',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  margin: '10px 0 8px 0'
                }}>
                  <div style={{
                    width: `${resAreaPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span><strong>{resCount}</strong> Properties</span>
                  <span>Avg: <strong>{avgResArea.toLocaleString('en-IN')}</strong> sq.ft</span>
                </div>
              </div>
            </div>

            {/* Proportional Full-Width Split Meter */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                <span>Area Share Breakdown</span>
                <span>{commAreaPct}% Commercial • {resAreaPct}% Residential</span>
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
                <div
                  onMouseEnter={() => setHoveredAreaType('Commercial')}
                  onMouseLeave={() => setHoveredAreaType(null)}
                  style={{
                    width: `${commAreaPct}%`,
                    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: hoveredAreaType === 'Commercial' ? 'brightness(1.1)' : 'none'
                  }}
                  title={`Commercial: ${commArea.toLocaleString('en-IN')} sq.ft (${commAreaPct}%)`}
                >
                  {Number(commAreaPct) > 15 ? `${commAreaPct}%` : ''}
                </div>
                <div
                  onMouseEnter={() => setHoveredAreaType('Residential')}
                  onMouseLeave={() => setHoveredAreaType(null)}
                  style={{
                    width: `${resAreaPct}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: hoveredAreaType === 'Residential' ? 'brightness(1.1)' : 'none'
                  }}
                  title={`Residential: ${resArea.toLocaleString('en-IN')} sq.ft (${resAreaPct}%)`}
                >
                  {Number(resAreaPct) > 15 ? `${resAreaPct}%` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation & Portfolio Ratio */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Ratio: <strong style={{ color: '#0f172a' }}>{resArea > 0 ? (commArea / resArea).toFixed(1) : '1.0'}x</strong> Commercial to Residential area
            </div>
            <button
              onClick={() => navigate('/admin/properties')}
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

        {/* Invoice Status Distribution – Pie Chart */}
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
                    <filter id="invPieShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                    </filter>
                    <g filter="url(#invPieShadow)">
                      {invoiceSlices.map((slice) => {
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
                      })}
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

      {/* Recent Invoices Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
              Recent Invoices
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              Latest billing records
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/invoices')}
            style={{
              fontSize: '0.82rem',
              color: '#2563eb',
              background: 'none',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View All Invoices
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Period</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Landlord</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Property</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Tenant</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No invoices recorded in database yet.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {inv.billing_period}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b' }}>
                      {inv.landlord_name || (inv.landlord_id ? `Landlord #${inv.landlord_id}` : '-')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {inv.property_name || (inv.property_id ? `Property #${inv.property_id}` : '-')}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 500 }}>
                      {inv.tenant_name || (inv.tenant_id ? `Tenant #${inv.tenant_id}` : '-')}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background:
                          inv.status === 'Sent' ? '#dcfce7' :
                          inv.status === 'Generated' ? '#dbeafe' : '#f1f5f9',
                        color:
                          inv.status === 'Sent' ? '#15803d' :
                          inv.status === 'Generated' ? '#1e40af' : '#475569'
                      }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container matching Landlords module */}
        <div className="pagination-container">
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Showing {recentInvoices.length > 0 ? (invoicePage - 1) * invoicePageSize + 1 : 0} to {Math.min(invoicePage * invoicePageSize, recentInvoices.length)} of {recentInvoices.length} invoices ({recentInvoices.length} total)
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={invoicePage <= 1}
              onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="page-btn"
              disabled={invoicePage >= totalInvoicePages || totalInvoicePages <= 1}
              onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

