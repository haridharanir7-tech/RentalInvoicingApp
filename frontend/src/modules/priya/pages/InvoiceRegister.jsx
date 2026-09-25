import React, { useState, useEffect } from 'react';
import { reportApi, dashboardApi } from '../services/priyaApi';
import { useAuth } from '../context/AuthContext';
import { FileSpreadsheet, Download, Filter, Search, RefreshCw, FileText } from 'lucide-react';

export default function InvoiceRegister() {
  const { user, isLandlord } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [totals, setTotals] = useState(null);
  const [period, setPeriod] = useState('');
  const [status, setStatus] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getInvoiceRegister({
        period: period || undefined,
        status: status || undefined
      });
      setInvoices(res.data.data);
      setTotals(res.data.totals);
    } catch (err) {
      console.error('Failed to load invoice register:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await dashboardApi.getSummary();
      if (res.data.data.available_periods) {
        setAvailablePeriods(res.data.data.available_periods);
      }
    } catch (e) {
      console.warn('Could not load periods');
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [period, status]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const filteredInvoices = invoices.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.invoice_number.toLowerCase().includes(q) ||
      i.landlord_name.toLowerCase().includes(q) ||
      i.property_name.toLowerCase().includes(q) ||
      i.tenant_name.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Invoice Register Report
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Comprehensive listing of invoices with status breakdown, GST totals, and Excel/CSV export
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchInvoices}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <a
            href={reportApi.getExportCsvUrl({ period, status })}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            Export CSV / Excel
          </a>
        </div>
      </div>

      {/* Scoping notice for landlords */}
      {isLandlord && (
        <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', marginBottom: '18px', fontSize: '0.84rem' }}>
          Showing records scoped exclusively to <strong>{user?.landlord_name || 'your assigned landlord estate'}</strong>.
        </div>
      )}

      {/* Totals Banner */}
      {totals && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Invoices</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{totals.total_count}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Taxable Rent</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(totals.rent_amount_sum)}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Addl. Charges</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(totals.additional_charges_sum)}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total GST</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>{formatCurrency(totals.gst_amount_sum)}</div>
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase' }}>Grand Total</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1d4ed8' }}>{formatCurrency(totals.grand_total_sum)}</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by invoice #, landlord, property, or tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%', color: '#1e293b' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
            >
              <option value="">All Billing Periods</option>
              {availablePeriods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Generated">Generated</option>
            <option value="Sent">Sent</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date & Period</th>
              <th>Landlord</th>
              <th>Property & Tenant</th>
              <th>Rent Amount</th>
              <th>GST Amount</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading invoice register data...
                </td>
              </tr>
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No invoices found matching the selected filters.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {inv.invoice_number}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.84rem', color: '#1e293b' }}>{inv.invoice_date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.billing_period}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500 }}>
                      {inv.landlord_name}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{inv.tenant_name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{inv.property_name}</div>
                  </td>
                  <td>{formatCurrency(inv.rent_amount)}</td>
                  <td style={{ color: '#2563eb' }}>{formatCurrency(inv.gst_amount)}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(inv.total_amount)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: inv.status === 'Sent' ? '#dcfce7' : inv.status === 'Generated' ? '#dbeafe' : '#fef3c7',
                      color: inv.status === 'Sent' ? '#15803d' : inv.status === 'Generated' ? '#1d4ed8' : '#b45309'
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

      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {filteredInvoices.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredInvoices.length)} of {filteredInvoices.length} entries
        </div>
        <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
      </div>
    </div>
  );
}

