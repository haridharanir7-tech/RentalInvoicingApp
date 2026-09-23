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
  TrendingUp,
  PieChart,
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
      setError(err.response?.data?.message || 'Failed to load dashboard analytics from Supabase.');
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
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Connecting to Supabase and compiling system analytics...</p>
      </div>
    );
  }

  const { summaryCards, charts, recentInvoices = [] } = data || {
    summaryCards: { totalLandlords: 0, totalProperties: 0, totalTenants: 0, totalInvoices: 0, totalRevenue: 0, pendingApprovalsCount: 0 },
    charts: { monthlyRevenue: [], invoiceStatus: { Draft: 0, Generated: 0, Sent: 0 }, propertyTypes: { Commercial: 0, Residential: 0 }, tenantStatus: { Active: 0, NoticePeriod: 0, Vacated: 0 }, gstSummary: {} }
  };

  // Compute maximum monthly revenue for chart scaling
  const maxRevenue = Math.max(...(charts.monthlyRevenue?.map(m => m.billed) || [10000]), 10000);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: '#3b82f6',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '9999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              System Administrator
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Logged in: <strong>{user?.full_name || 'Admin'}</strong> ({user?.email})
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Rental Management Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Real-time analytics and data connected directly to Supabase PostgreSQL
          </p>
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

      {/* Summary KPI Cards Grid (6 cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
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
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            Source: Supabase `landlords`
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
            {formatCurrency(summaryCards.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            Generated + Sent Billed
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

      {/* Quick Navigation Cards for Key Modules */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          Quick Module Navigation
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {[
            { name: 'Landlords', path: '/admin/landlords', icon: Users, color: '#2563eb', desc: 'Approvals & Access' },
            { name: 'Properties', path: '/admin/properties', icon: Building2, color: '#7c3aed', desc: 'Master Data (Subhashini)' },
            { name: 'Tenants', path: '/admin/tenants', icon: Home, color: '#059669', desc: 'Tenants (Subhashini)' },
            { name: 'Rental Rates', path: '/admin/rental-rates', icon: Percent, color: '#d97706', desc: 'Pricing (Haridharani)' },
            { name: 'Generate Invoice', path: '/admin/generate-invoice', icon: FilePlus, color: '#ea580c', desc: 'Billing (Haridharani)' },
            { name: 'Invoices', path: '/admin/invoices', icon: Receipt, color: '#0284c7', desc: 'Register (Haridharani)' },
            { name: 'Invoice Template', path: '/admin/invoice-template', icon: FileCode, color: '#4f46e5', desc: 'Designer (Ragul)' },
            { name: 'GST Report', path: '/admin/gst-report', icon: BarChart3, color: '#0d9488', desc: 'Compliance (Haridharani)' },
            { name: 'Occupancy Report', path: '/admin/occupancy-report', icon: PieChart, color: '#e11d48', desc: 'Occupancy (Subhashini)' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(item.path)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={item.color} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Chart 1: Monthly Revenue Trend */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                Monthly Billing & Revenue Trend
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Billed vs Collected volume by billing period
              </p>
            </div>
            <TrendingUp size={20} color="#2563eb" />
          </div>

          {charts.monthlyRevenue?.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No monthly invoice data available yet.
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingTop: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              {charts.monthlyRevenue?.map((m, idx) => {
                const heightPercent = Math.max(Math.round((m.billed / maxRevenue) * 160), 20);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                      {formatCurrency(m.billed)}
                    </span>
                    <div style={{
                      width: '32px',
                      height: `${heightPercent}px`,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      {m.period}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#2563eb', borderRadius: '2px', display: 'inline-block' }} />
              Total Invoiced Billed
            </span>
          </div>
        </div>

        {/* Chart 2: Invoice Status Distribution */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                Invoice Status Distribution
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Breakdown of Draft, Generated, and Sent invoices
              </p>
            </div>
            <PieChart size={20} color="#7c3aed" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', margin: '20px 0' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Draft</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569' }}>{charts.invoiceStatus?.Draft || 0}</div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pending generation</span>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8', marginBottom: '6px' }}>Generated</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e40af' }}>{charts.invoiceStatus?.Generated || 0}</div>
              <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Finalized bills</span>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', marginBottom: '6px' }}>Sent</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>{charts.invoiceStatus?.Sent || 0}</div>
              <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Dispatched</span>
            </div>
          </div>

          {/* Progress bar visual */}
          {summaryCards.totalInvoices > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ height: '10px', borderRadius: '5px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: charts.invoiceStatus?.Draft || 0, background: '#94a3b8' }} title="Draft" />
                <div style={{ flex: charts.invoiceStatus?.Generated || 0, background: '#3b82f6' }} title="Generated" />
                <div style={{ flex: charts.invoiceStatus?.Sent || 0, background: '#10b981' }} title="Sent" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Analytics Row (GST Summary & Properties Overview) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* GST Summary */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#0d9488" />
            GST & Tax Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Taxable Base Rent:</span>
              <strong style={{ color: '#0f172a' }}>{formatCurrency(charts.gstSummary?.taxableRent)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Additional Charges:</span>
              <strong style={{ color: '#0f172a' }}>{formatCurrency(charts.gstSummary?.additionalCharges)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Total GST Collected (18%):</span>
              <strong style={{ color: '#0d9488' }}>{formatCurrency(charts.gstSummary?.totalGst)}</strong>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Grand Total Billed:</span>
              <strong style={{ fontWeight: 800, color: '#2563eb' }}>{formatCurrency(charts.gstSummary?.grandTotal)}</strong>
            </div>
          </div>
        </div>

        {/* Property & Tenant Overview */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#7c3aed" />
            Estate Portfolio Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Commercial Properties:</span>
                <strong>{charts.propertyTypes?.Commercial || 0} Units</strong>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${summaryCards.totalProperties > 0 ? ((charts.propertyTypes?.Commercial || 0) / summaryCards.totalProperties) * 100 : 0}%`,
                  height: '100%',
                  background: '#7c3aed'
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Residential Properties:</span>
                <strong>{charts.propertyTypes?.Residential || 0} Units</strong>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${summaryCards.totalProperties > 0 ? ((charts.propertyTypes?.Residential || 0) / summaryCards.totalProperties) * 100 : 0}%`,
                  height: '100%',
                  background: '#3b82f6'
                }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#64748b' }}>Total Portfolio Area:</span>
              <strong style={{ color: '#0f172a' }}>{charts.totalAreaSqft?.toLocaleString() || 0} sq.ft</strong>
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
              Latest billing records from Supabase
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
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>Property / Tenant</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No invoices recorded in database yet.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2563eb' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      {inv.billing_period}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#1e293b' }}>
                      {inv.landlord_name || `Landlord #${inv.landlord_id}`}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>
                      {inv.property_name || `Property #${inv.property_id}`}
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
      </div>
    </div>
  );
}

