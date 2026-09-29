import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/priyaApi';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Building2,
  Home,
  Warehouse,
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
  const [hoveredCategory, setHoveredCategory] = useState(null);
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
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 }, propertyTypes: { Commercial: 0, Residential: 0, Warehouse: 0 }, tenantStatus: { Active: 0, NoticePeriod: 0, Vacated: 0 }, gstSummary: {}, chargesBreakdown: {} }
  };

  const totalInvoicePages = Math.ceil((recentInvoices?.length || 0) / invoicePageSize) || 1;
  const paginatedInvoices = (recentInvoices || []).slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize
  );

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

  // 1. Chart 1 Data: Property Category Distribution (Commercial, Residential, Warehouse)
  const propTypes = charts.propertyTypes || {};
  const commCount = Number(propTypes.Commercial ?? charts.propertyArea?.commercialCount ?? 0);
  const resCount = Number(propTypes.Residential ?? charts.propertyArea?.residentialCount ?? 0);
  const whCount = Number(propTypes.Warehouse ?? charts.propertyArea?.warehouseCount ?? 0);
  const totalPortfolioProps = (commCount + resCount + whCount) || Number(summaryCards.totalProperties || 0) || 1;

  const commPct = ((commCount / totalPortfolioProps) * 100).toFixed(1);
  const resPct = ((resCount / totalPortfolioProps) * 100).toFixed(1);
  const whPct = ((whCount / totalPortfolioProps) * 100).toFixed(1);

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

  // Capture any other custom property types if present
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
            Commercial, Residential & Warehouse
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
              gap: '8px',
              marginBottom: '16px'
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
                      padding: '12px 10px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div>
                      {/* Top Row: Full Category Label with Icon */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '8px'
                      }}>
                        <IconComponent size={14} color={cat.color} style={{ flexShrink: 0 }} />
                        <span style={{
                          fontSize: '0.80rem',
                          fontWeight: 700,
                          color: cat.color,
                          whiteSpace: 'nowrap'
                        }}>
                          {cat.label}
                        </span>
                      </div>

                      {/* Stat Row: Big Count on Left, Percentage Pill on Right */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2px'
                      }}>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                          {cat.count}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: cat.badgeColor,
                          background: cat.badgeBg,
                          padding: '2px 7px',
                          borderRadius: '8px',
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}>
                          {cat.percentage}%
                        </span>
                      </div>

                      <div style={{ fontSize: '0.70rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                        {cat.count === 1 ? 'Property' : 'Properties'}
                      </div>

                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '6px', lineHeight: '1.25' }}>
                        {cat.desc}
                      </div>
                    </div>

                    {/* Category Level Bar */}
                    <div>
                      <div style={{
                        height: '7px',
                        background: '#e2e8f0',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        marginTop: '4px'
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: '0.74rem'
              }}>
                <span style={{ color: '#475569', fontWeight: 700 }}>
                  Portfolio Share Breakdown
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', flexWrap: 'wrap' }}>
                  {propertyCategories.map((c) => (
                    <span key={c.type} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <strong style={{ color: '#1e293b' }}>{c.label}</strong>
                      <span style={{ color: c.color, fontWeight: 700 }}>{c.percentage}%</span>
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
                      padding: '0 4px'
                    }}
                    title={`${cat.label}: ${cat.count} Properties (${cat.percentage}%)`}
                  >
                    {Number(cat.percentage) >= 28 ? `${cat.label} ${cat.percentage}%` : (Number(cat.percentage) >= 8 ? `${cat.percentage}%` : '')}
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
                    })}
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

          {/* Footer Navigation & Status Mix */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            marginTop: '10px'
          }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
              Status mix: <strong style={{ color: '#0f172a' }}>{draftInvoices} Draft</strong>, <strong style={{ color: '#0f172a' }}>{generatedInvoices} Generated</strong>, and <strong style={{ color: '#0f172a' }}>{sentInvoices} Sent</strong>
            </div>
            <button
              onClick={() => navigate('/admin/invoices')}
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

