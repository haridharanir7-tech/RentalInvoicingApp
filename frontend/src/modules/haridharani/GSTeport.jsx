import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, FileSpreadsheet, User, Calendar, Download } from 'lucide-react';
import HaridharaniNav from './HaridharaniNav';
import './haridharani.css';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function GSTReport() {
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({
    taxableValue: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGst: 0
  });

  const [monthFilter, setMonthFilter] = useState('all');
  const [landlordFilter, setLandlordFilter] = useState('all');
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [monthFilter, landlordFilter]);

  const fetchFilters = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        setLandlords(res.data.landlords || []);
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
        setReportData(res.data.data);
        setTotals(res.data.totals);
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

  return (
    <div className="hd-container">
      <HaridharaniNav />

      {/* Header */}
      <div className="hd-header">
        <div>
          <h1 className="hd-title">Monthly GST Summary Report</h1>
          <p className="hd-subtitle">
            Comprehensive tax breakdown (CGST, SGST, IGST) grouped by Landlord and Billing Period for GST return filing.
          </p>
        </div>
        <div className="hd-header-actions">
          <button className="hd-btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export GST Report (.csv)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="hd-filter-bar">
        <div className="hd-filter-group">
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <Calendar size={13} />
              <span>Billing Period</span>
            </label>
            <input
              type="month"
              className="hd-input"
              value={monthFilter === 'all' ? '' : monthFilter}
              onChange={(e) => setMonthFilter(e.target.value || 'all')}
            />
          </div>

          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <User size={13} />
              <span>Landlord</span>
            </label>
            <select
              className="hd-select"
              value={landlordFilter}
              onChange={(e) => setLandlordFilter(e.target.value)}
            >
              <option value="all">All Landlords</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="hd-btn-secondary" onClick={() => { setMonthFilter('all'); setLandlordFilter('all'); }}>
          Reset Filters
        </button>
      </div>

      {/* KPI Cards */}
      <div className="hd-kpi-grid">
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total Taxable Value</div>
          <div className="hd-kpi-value">₹{Math.round(totals.taxableValue).toLocaleString('en-IN')}</div>
          <div className="hd-kpi-desc">Rent & recurring charges</div>
        </div>
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total CGST (Central)</div>
          <div className="hd-kpi-value">₹{Math.round(totals.cgst).toLocaleString('en-IN')}</div>
          <div className="hd-kpi-desc">Intra-state central share</div>
        </div>
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total SGST (State)</div>
          <div className="hd-kpi-value">₹{Math.round(totals.sgst).toLocaleString('en-IN')}</div>
          <div className="hd-kpi-desc">Intra-state state share</div>
        </div>
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total IGST (Integrated)</div>
          <div className="hd-kpi-value">₹{Math.round(totals.igst).toLocaleString('en-IN')}</div>
          <div className="hd-kpi-desc">Inter-state integrated tax</div>
        </div>
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total GST Liability</div>
          <div className="hd-kpi-value">₹{Math.round(totals.totalGst).toLocaleString('en-IN')}</div>
          <div className="hd-kpi-desc">Cumulative tax collected</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="hd-table-card">
        <table className="hd-table">
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
                <td colSpan="10" style={{ textAlign: 'center', padding: '36px' }}>
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
              reportData.map((row, idx) => (
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
    </div>
  );
}

