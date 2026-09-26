import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../priya/context/AuthContext';
import axios from 'axios';
import { BarChart3, FileSpreadsheet, User, Calendar, Download, Printer, Info } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function GSTReport() {
  const { user, isLandlord } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({
    taxableValue: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGst: 0
  });

  const [monthFilter, setMonthFilter] = useState('all');
  const [landlordFilter, setLandlordFilter] = useState(isLandlord ? user.landlord_id : 'all');
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReport();
    setPage(1);
  }, [monthFilter, landlordFilter]);

  const fetchFilters = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        // Exclude Non-GST landlords from the GST report filter
        const gstOnly = (res.data.landlords || []).filter((l) => !!l.gst_registered);
        setLandlords(gstOnly);
      }
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/reports/gst-summary`, {
        params: {
          month: monthFilter,
          landlord_id: landlordFilter
        }
      });
      if (res.data.success) {
        setReportData(res.data.data || []);
        setTotals(res.data.totals || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 });
      }
    } catch (err) {
      console.error('Failed to load GST report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = [
      'Landlord',
      'GSTIN',
      'Billing Period',
      'Total Invoices',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total GST',
      'Total Invoiced'
    ];

    const rows = reportData.map((r) => [
      `"${r.landlord_name}"`,
      r.landlord_gstin,
      r.billing_period,
      r.total_invoices,
      r.total_taxable_value,
      r.total_cgst,
      r.total_sgst,
      r.total_igst,
      r.total_gst_collected,
      r.total_invoiced_value
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_Monthly_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(reportData.length / pageSize) || 1;
  const paginatedReportData = reportData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">GST Report</h2>
          <p className="page-subtitle">
            Tax breakdown (CGST, SGST, IGST) grouped by landlord and billing period
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print / PDF</span>
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export GST Report (.csv)</span>
          </button>
        </div>
      </div>

      {/* Exclusion Note */}
      <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '0.82rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
        <span><strong>Note:</strong> Non-GST registered landlords are excluded from this report because no GST is applicable on their invoices. Only finalized (Generated / Sent) invoices are included.</span>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Period:</span>
            <input
              type="month"
              className="form-input"
              value={monthFilter === 'all' ? '' : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value || 'all')}
              style={{ width: '160px' }}
            />
          </div>

          <select
            className="form-input"
            value={landlordFilter}
            onChange={(e) => setLandlordFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All GST Landlords</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setMonthFilter('all');
              setLandlordFilter('all');
            }}
            style={{ background: '#f1f5f9' }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Taxable Value</div>
          <div className="kpi-value">₹{Math.round(totals.taxableValue).toLocaleString('en-IN')}</div>
          <div className="kpi-desc">Rent & recurring charges</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total CGST (Central)</div>
          <div className="kpi-value">₹{Math.round(totals.cgst).toLocaleString('en-IN')}</div>
          <div className="kpi-desc">Intra-state central share</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total SGST (State)</div>
          <div className="kpi-value">₹{Math.round(totals.sgst).toLocaleString('en-IN')}</div>
          <div className="kpi-desc">Intra-state state share</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total IGST (Integrated)</div>
          <div className="kpi-value">₹{Math.round(totals.igst).toLocaleString('en-IN')}</div>
          <div className="kpi-desc">Inter-state integrated tax</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total GST Liability</div>
          <div className="kpi-value">₹{Math.round(totals.totalGst).toLocaleString('en-IN')}</div>
          <div className="kpi-desc">Cumulative tax collected</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Landlord</th>
              <th>GSTIN</th>
              <th>Billing Period</th>
              <th>Invoices</th>
              <th>Taxable Value</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total GST</th>
              <th>Total Invoiced</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Compiling GST report...
                </td>
              </tr>
            ) : reportData.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No invoice tax records found for the selected period.
                </td>
              </tr>
            ) : (
              paginatedReportData.map((row, idx) => (
                <tr key={`${row.landlord_id}-${row.billing_period}-${idx}`}>
                  <td style={{ fontWeight: 600 }}>{row.landlord_name}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {row.landlord_gstin}
                    </span>
                  </td>
                  <td>{row.billing_period}</td>
                  <td>{row.total_invoices}</td>
                  <td style={{ fontWeight: 500 }}>
                    ₹{parseFloat(row.total_taxable_value).toLocaleString('en-IN')}
                  </td>
                  <td>₹{parseFloat(row.total_cgst).toLocaleString('en-IN')}</td>
                  <td>₹{parseFloat(row.total_sgst).toLocaleString('en-IN')}</td>
                  <td>₹{parseFloat(row.total_igst).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>
                    ₹{parseFloat(row.total_gst_collected).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontWeight: 700, color: '#1e40af' }}>
                    ₹{parseFloat(row.total_invoiced_value).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination container */}
      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {reportData.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, reportData.length)} of {reportData.length} entries
        </div>
        <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
      </div>
    </div>
  );
}
