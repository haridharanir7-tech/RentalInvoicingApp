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
  const [selectedBillingMonth, setSelectedBillingMonth] = useState('All');
  const [hoveredStackedIdx, setHoveredStackedIdx] = useState(null);
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);
  const [hoveredPropertyIdx, setHoveredPropertyIdx] = useState(null);
  const [hoveredInvoiceIdx, setHoveredInvoiceIdx] = useState(null);
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

  // 1. Chart 1 Data: Individual Monthly Invoices Composition (Stacked Bar Chart)
  // Relationship: Base Rent + Maintenance Charges + Parking Charges + GST = Total Invoice Amount
  const allInvoiceItems = (recentInvoices || []).map(inv => {
    const rent = Number(inv.rent_amount || 0);
    const maintenance = Number(inv.maintenance_charges || 0);
    const parking = Number(inv.parking_charges || 0);
    const gst = Number(inv.gst_amount || 0);
    const total = Number(inv.total_amount || 0) || (rent + maintenance + parking + gst) || 1;
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number || `INV #${inv.id}`,
      period: inv.billing_period || 'Unknown',
      tenant: inv.tenant_name || inv.tenant || 'Tenant',
      property: inv.property_title || inv.property || '',
      status: inv.status || 'Draft',
      rent,
      maintenance,
      parking,
      gst,
      total,
      rentPct: total > 0 ? ((rent / total) * 100).toFixed(1) : '0.0',
      maintenancePct: total > 0 ? ((maintenance / total) * 100).toFixed(1) : '0.0',
      parkingPct: total > 0 ? ((parking / total) * 100).toFixed(1) : '0.0',
      gstPct: total > 0 ? ((gst / total) * 100).toFixed(1) : '0.0'
    };
  }).sort((a, b) => a.period.localeCompare(b.period) || (Number(a.id) || 0) - (Number(b.id) || 0));

  const availablePeriods = Array.from(new Set(allInvoiceItems.map(i => i.period))).filter(Boolean).sort();

  const displayedInvoiceBars = selectedBillingMonth === 'All'
    ? allInvoiceItems
    : allInvoiceItems.filter(i => i.period === selectedBillingMonth);

  const maxInvoiceBarAmount = Math.max(...displayedInvoiceBars.map(m => m.total), 1);

  // Separate count, amount, and percentage for each color category in current view
  const colorCounts = [
    {
      key: 'rent',
      label: 'Base Rent',
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      amount: displayedInvoiceBars.reduce((sum, i) => sum + i.rent, 0),
      count: displayedInvoiceBars.filter(i => i.rent > 0).length
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      amount: displayedInvoiceBars.reduce((sum, i) => sum + i.maintenance, 0),
      count: displayedInvoiceBars.filter(i => i.maintenance > 0).length
    },
    {
      key: 'parking',
      label: 'Parking',
      color: '#06b6d4',
      bgColor: '#ecfeff',
      borderColor: '#a5f3fc',
      amount: displayedInvoiceBars.reduce((sum, i) => sum + i.parking, 0),
      count: displayedInvoiceBars.filter(i => i.parking > 0).length
    },
    {
      key: 'gst',
      label: 'GST (18%)',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      amount: displayedInvoiceBars.reduce((sum, i) => sum + i.gst, 0),
      count: displayedInvoiceBars.filter(i => i.gst > 0).length
    }
  ];
  const totalBilledInView = colorCounts.reduce((sum, c) => sum + c.amount, 0) || 1;

  // Period map for aggregated monthly trend (Chart 2)
  const invoicePeriodMap = {};
  allInvoiceItems.forEach(inv => {
    const p = inv.period;
    if (!invoicePeriodMap[p]) {
      invoicePeriodMap[p] = { period: p, billed: 0, gst: 0, rent: 0, maintenance: 0, parking: 0, count: 0 };
    }
    invoicePeriodMap[p].billed += inv.total;
    invoicePeriodMap[p].gst += inv.gst;
    invoicePeriodMap[p].rent += inv.rent;
    invoicePeriodMap[p].maintenance += inv.maintenance;
    invoicePeriodMap[p].parking += inv.parking;
    invoicePeriodMap[p].count += 1;
  });

  const basePeriods = (charts.monthlyRevenue?.length > 0)
    ? charts.monthlyRevenue
    : Object.values(invoicePeriodMap).sort((a, b) => a.period.localeCompare(b.period));

  // 2. Chart 2 Data: Monthly Revenue & GST Trend (Line Chart)
  // Relationship: Total Billed Amount <-> GST Collected over time
  const trendData = basePeriods.map(m => {
    const fromMap = invoicePeriodMap[m.period];
    return {
      period: m.period,
      billed: Number(m.billed ?? m.total ?? fromMap?.billed ?? 0),
      gst: Number(m.gst ?? fromMap?.gst ?? 0)
    };
  });
  const maxTrendVal = Math.max(...trendData.map(t => Math.max(t.billed, t.gst)), 1) * 1.15;
  const lineSvgWidth = 520;
  const lineSvgHeight = 220;
  const linePad = { top: 35, right: 35, bottom: 40, left: 75 };
  const linePlotWidth = lineSvgWidth - linePad.left - linePad.right;
  const linePlotHeight = lineSvgHeight - linePad.top - linePad.bottom;

  const trendPoints = trendData.map((d, i) => {
    const x = trendData.length === 1
      ? linePad.left + linePlotWidth / 2
      : linePad.left + (i / (trendData.length - 1)) * linePlotWidth;
    const yBilled = linePad.top + linePlotHeight - (d.billed / maxTrendVal) * linePlotHeight;
    const yGst = linePad.top + linePlotHeight - (d.gst / maxTrendVal) * linePlotHeight;
    return { ...d, x, yBilled, yGst };
  });

  const billedLinePath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yBilled.toFixed(1)}`).join(' ');
  const gstLinePath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yGst.toFixed(1)}`).join(' ');
  const billedAreaPath = trendPoints.length > 0
    ? `${billedLinePath} L ${trendPoints[trendPoints.length - 1].x.toFixed(1)} ${(linePad.top + linePlotHeight).toFixed(1)} L ${trendPoints[0].x.toFixed(1)} ${(linePad.top + linePlotHeight).toFixed(1)} Z`
    : '';

  // 3. Chart 3 Data: Property Type Distribution (Pie Chart)
  // Relationship: Total Properties -> Commercial + Residential
  const propertyTypesData = charts.propertyTypes || {};
  const commercialProps = Number(propertyTypesData.Commercial || 0);
  const residentialProps = Number(propertyTypesData.Residential || 0);
  const totalPropertiesCount = commercialProps + residentialProps || summaryCards.totalProperties || 1;
  const propertyPieItems = [
    { label: 'Commercial Properties', value: commercialProps, color: '#2563eb' },
    { label: 'Residential Properties', value: residentialProps, color: '#10b981' }
  ];
  const propertySlices = computePieSlices(propertyPieItems, totalPropertiesCount);

  // 4. Chart 4 Data: Invoice Status Distribution (Pie Chart)
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

      {/* Pending Landlord Approval Alert Banner */}
      {summaryCards.pendingApprovalsCount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(245, 158, 11, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#d97706" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem' }}>
                {summaryCards.pendingApprovalsCount} Landlord Account{summaryCards.pendingApprovalsCount > 1 ? 's' : ''} Awaiting Approval
              </div>
              <div style={{ fontSize: '0.82rem', color: '#b45309' }}>
                New landlords have registered and require administrator authorization to access their dashboard.
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/landlords')}
            style={{
              padding: '8px 18px',
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Review & Grant Access
            <ArrowUpRight size={15} />
          </button>
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
        {/* Chart 1: Monthly Billing Composition – Stacked Bar Chart */}
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
                  <Layers size={18} color="#2563eb" />
                  1. Monthly Billing Composition
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Base Rent + Maintenance Charges + Parking Charges + GST = Total Invoice Amount
                </p>
              </div>
              {/* Month Filter Pills & Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600, marginRight: '2px' }}>Period:</span>
                <button
                  onClick={() => setSelectedBillingMonth('All')}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: selectedBillingMonth === 'All' ? '#2563eb' : '#cbd5e1',
                    background: selectedBillingMonth === 'All' ? '#2563eb' : '#f8fafc',
                    color: selectedBillingMonth === 'All' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({allInvoiceItems.length})
                </button>
                {availablePeriods.map(p => {
                  const count = allInvoiceItems.filter(i => i.period === p).length;
                  const isSel = selectedBillingMonth === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedBillingMonth(p)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isSel ? '#2563eb' : '#cbd5e1',
                        background: isSel ? '#2563eb' : '#f8fafc',
                        color: isSel ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {p} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {displayedInvoiceBars.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No invoice records available.
              </div>
            ) : (
              <div style={{ minHeight: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '12px', paddingTop: '24px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {displayedInvoiceBars.map((inv, idx) => {
                  const maxBarHeight = 150;
                  const totalBarHeight = Math.max(Math.round((inv.total / maxInvoiceBarAmount) * maxBarHeight), 48);
                  const isHovered = hoveredStackedIdx === idx;

                  return (
                    <div
                      key={inv.id || idx}
                      onMouseEnter={() => setHoveredStackedIdx(idx)}
                      onMouseLeave={() => setHoveredStackedIdx(null)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 0',
                        maxWidth: '90px',
                        minWidth: '60px'
                      }}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          bottom: `${totalBarHeight + 36}px`,
                          left: idx === 0 ? '0px' : (idx === displayedInvoiceBars.length - 1 ? 'auto' : '50%'),
                          right: idx === displayedInvoiceBars.length - 1 ? '0px' : 'auto',
                          transform: (idx === 0 || idx === displayedInvoiceBars.length - 1) ? 'none' : 'translateX(-50%)',
                          zIndex: 50,
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          minWidth: '220px',
                          pointerEvents: 'none',
                          lineHeight: '1.5'
                        }}>
                          <div style={{ fontWeight: 700, borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{inv.invoiceNumber}</span>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: '#1e293b', padding: '1px 6px', borderRadius: '4px' }}>{inv.period}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '6px' }}>
                            Tenant: <strong style={{ color: '#ffffff' }}>{inv.tenant}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#93c5fd' }}>
                            <span>Base Rent:</span>
                            <strong>{formatCurrency(inv.rent)} ({inv.rentPct}%)</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c4b5fd' }}>
                            <span>Maintenance:</span>
                            <strong>{formatCurrency(inv.maintenance)} ({inv.maintenancePct}%)</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#67e8f9' }}>
                            <span>Parking:</span>
                            <strong>{formatCurrency(inv.parking)} ({inv.parkingPct}%)</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fde68a' }}>
                            <span>GST (18%):</span>
                            <strong>{formatCurrency(inv.gst)} ({inv.gstPct}%)</strong>
                          </div>
                          <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#38bdf8' }}>
                            <span>Total Invoice:</span>
                            <span>{formatCurrency(inv.total)}</span>
                          </div>
                        </div>
                      )}

                      {/* Total Amount Label above bar */}
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {formatCurrency(inv.total)}
                      </span>

                      {/* Stacked Vertical Bar */}
                      <div style={{
                        width: '46px',
                        height: `${totalBarHeight}px`,
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        borderRadius: '6px 6px 0 0',
                        overflow: 'hidden',
                        boxShadow: isHovered ? '0 4px 14px rgba(37,99,235,0.35)' : '0 2px 6px rgba(0,0,0,0.08)',
                        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        border: '1px solid #cbd5e1'
                      }}>
                        {/* Segment 1 (Bottom): Base Rent */}
                        {inv.rent > 0 && (
                          <div
                            style={{
                              flex: inv.rent,
                              background: '#2563eb',
                              width: '100%',
                              minHeight: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            title={`Base Rent: ${formatCurrency(inv.rent)} (${inv.rentPct}%)`}
                          />
                        )}
                        {/* Segment 2: Maintenance Charges */}
                        {inv.maintenance > 0 && (
                          <div
                            style={{
                              flex: inv.maintenance,
                              background: '#8b5cf6',
                              width: '100%',
                              minHeight: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            title={`Maintenance Charges: ${formatCurrency(inv.maintenance)} (${inv.maintenancePct}%)`}
                          />
                        )}
                        {/* Segment 3: Parking Charges */}
                        {inv.parking > 0 && (
                          <div
                            style={{
                              flex: inv.parking,
                              background: '#06b6d4',
                              width: '100%',
                              minHeight: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            title={`Parking Charges: ${formatCurrency(inv.parking)} (${inv.parkingPct}%)`}
                          />
                        )}
                        {/* Segment 4 (Top): GST */}
                        {inv.gst > 0 && (
                          <div
                            style={{
                              flex: inv.gst,
                              background: '#f59e0b',
                              width: '100%',
                              minHeight: '4px',
                              transition: 'all 0.3s ease'
                            }}
                            title={`GST (18%): ${formatCurrency(inv.gst)} (${inv.gstPct}%)`}
                          />
                        )}
                      </div>

                      {/* Invoice Label & Period below bar */}
                      <div style={{ textAlign: 'center', lineHeight: '1.2', marginTop: '2px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                          {inv.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500 }}>
                          {inv.period}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: '#2563eb', fontWeight: 600, maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.tenant}>
                          {inv.tenant}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            {colorCounts.map((c, i) => {
              const pct = ((c.amount / totalBilledInView) * 100).toFixed(1);
              return (
                <div
                  key={i}
                  style={{
                    background: c.bgColor,
                    border: `1px solid ${c.borderColor}`,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: c.color, margin: '2px 0' }}>
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

        {/* Chart 2: Monthly Revenue & GST Trend – Line Chart */}
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
                  <TrendingUp size={18} color="#0d9488" />
                  2. Monthly Revenue & GST Trend
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Total Billed Amount ↔ GST Collected over time
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', padding: '3px 8px', borderRadius: '6px' }}>
                Line Chart
              </span>
            </div>

            {trendPoints.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No trend data available yet.
              </div>
            ) : (
              <div style={{ minHeight: '220px', position: 'relative' }}>
                <svg width="100%" height="220" viewBox={`0 0 ${lineSvgWidth} ${lineSvgHeight}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.5, 1].map((pct, i) => {
                    const y = linePad.top + linePlotHeight * (1 - pct);
                    const val = maxTrendVal * pct;
                    return (
                      <g key={i}>
                        <line
                          x1={linePad.left}
                          y1={y}
                          x2={lineSvgWidth - linePad.right}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray={pct === 0 ? 'none' : '4 4'}
                          strokeWidth="1"
                        />
                        <text
                          x={linePad.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          fontWeight="600"
                        >
                          {formatCurrency(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill under Billed line */}
                  {billedAreaPath && (
                    <path d={billedAreaPath} fill="url(#billedGrad)" />
                  )}

                  {/* Total Billed Line */}
                  <path
                    d={billedLinePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* GST Collected Line */}
                  <path
                    d={gstLinePath}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points & Value Badges */}
                  {trendPoints.map((p, idx) => {
                    const isHovered = hoveredTrendIdx === idx;
                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredTrendIdx(idx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Hover vertical guide line */}
                        {isHovered && (
                          <line
                            x1={p.x}
                            y1={linePad.top}
                            x2={p.x}
                            y2={linePad.top + linePlotHeight}
                            stroke="#94a3b8"
                            strokeDasharray="3 3"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Billed Marker Node */}
                        <circle
                          cx={p.x}
                          cy={p.yBilled}
                          r={isHovered ? 7 : 5.5}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                        {/* Billed Value Badge */}
                        <text
                          x={p.x}
                          y={p.yBilled - 10}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="800"
                          fill="#1e40af"
                        >
                          {formatCurrency(p.billed)}
                        </text>

                        {/* GST Marker Node */}
                        <circle
                          cx={p.x}
                          cy={p.yGst}
                          r={isHovered ? 7 : 5.5}
                          fill="#0d9488"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                        {/* GST Value Badge */}
                        <text
                          x={p.x}
                          y={p.yGst + (p.yGst > linePad.top + linePlotHeight - 15 ? -10 : 16)}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="800"
                          fill="#0f766e"
                        >
                          {formatCurrency(p.gst)}
                        </text>

                        {/* X-Axis Period Label */}
                        <text
                          x={p.x}
                          y={linePad.top + linePlotHeight + 22}
                          textAnchor="middle"
                          fontSize="12"
                          fontWeight="700"
                          fill="#0f172a"
                        >
                          {p.period}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '0.76rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '3px', background: '#2563eb', display: 'inline-block', borderRadius: '2px' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', marginLeft: '-13px', marginRight: '6px' }} />
              Total Billed Amount
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '3px', background: '#0d9488', display: 'inline-block', borderRadius: '2px' }} />
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488', marginLeft: '-13px', marginRight: '6px' }} />
              GST Collected
            </span>
          </div>
        </div>

        {/* Chart 3: Property Type Distribution – Pie Chart */}
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
                  <Building2 size={18} color="#2563eb" />
                  3. Property Type Distribution
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Total Properties → Commercial + Residential
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px' }}>
                Pie Chart
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', minHeight: '210px' }}>
              {/* Solid SVG Pie */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="180" height="180" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                    <filter id="propPieShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
                    </filter>
                    <g filter="url(#propPieShadow)">
                      {propertySlices.map((slice) => {
                        const isHovered = hoveredPropertyIdx === slice.index;
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
                              onMouseEnter={() => setHoveredPropertyIdx(slice.index)}
                              onMouseLeave={() => setHoveredPropertyIdx(null)}
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
                            opacity={hoveredPropertyIdx !== null && !isHovered ? 0.65 : 1}
                            onMouseEnter={() => setHoveredPropertyIdx(slice.index)}
                            onMouseLeave={() => setHoveredPropertyIdx(null)}
                            style={{
                              cursor: 'pointer',
                              transition: 'opacity 0.2s ease, transform 0.2s ease',
                              transformOrigin: '100px 100px',
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                            }}
                          >
                            <title>{`${slice.label}: ${slice.value} units (${slice.percentage}%)`}</title>
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
                  Total Portfolio: <strong style={{ color: '#0f172a' }}>{totalPropertiesCount} Units</strong>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
                {propertySlices.map((item) => {
                  const isHovered = hoveredPropertyIdx === item.index;
                  return (
                    <div
                      key={item.index}
                      onMouseEnter={() => setHoveredPropertyIdx(item.index)}
                      onMouseLeave={() => setHoveredPropertyIdx(null)}
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
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{item.value} units</div>
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

        {/* Chart 4: Invoice Status Distribution – Pie Chart */}
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
                  4. Invoice Status Distribution
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Total Invoices → Draft + Generated + Sent
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '6px' }}>
                Pie Chart
              </span>
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

