import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../priya/context/AuthContext';
import axios from 'axios';
import {
  FileText,
  Printer,
  Calendar,
  Building,
  User,
  Filter,
  CheckCircle2,
  Edit3,
  AlertCircle,
  X,
  CheckCircle,
  Clock,
  Send,
  Trash2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function Invoices() {
  const { user, isLandlord } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [kpis, setKpis] = useState({
    matchingInvoices: 0,
    totalBaseRent: 0,
    maintenanceParking: 0,
    totalGst: 0,
    totalInvoicedAmount: 0
  });

  // Filter States
  const [periodFilter, setPeriodFilter] = useState('All Periods');
  const [landlordFilter, setLandlordFilter] = useState('All Landlords');
  const [propertyFilter, setPropertyFilter] = useState('All Properties');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Correct Draft Modal State (Task 10)
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    rent_amount: '',
    maintenance_charges: '',
    parking_charges: '',
    gst_rate: 18,
    gst_applicable: true,
    tax_supply_type: 'intra_state',
    change_reason: ''
  });
  const [correcting, setCorrecting] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchFilterOptions();
  }, [periodFilter, landlordFilter, propertyFilter, statusFilter, isLandlord, user?.landlord_id]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        setLandlords(res.data.landlords || []);
        let props = res.data.properties || [];
        if (isLandlord && user?.landlord_id) {
          props = props.filter((p) => String(p.landlord_id) === String(user.landlord_id));
        }
        setProperties(props);
      }
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      if (isLandlord && !user?.landlord_id) {
        return;
      }
      setLoading(true);
      setActionError('');

      const params = {};
      if (periodFilter !== 'All Periods') params.period = periodFilter;
      if (isLandlord) {
        params.landlord_id = user.landlord_id;
      } else if (landlordFilter !== 'All Landlords') {
        params.landlord_id = landlordFilter;
      }
      if (propertyFilter !== 'All Properties') params.property_id = propertyFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await axios.get(`${API_BASE}/invoices`, { params });
      if (res.data.success) {
        setInvoices(res.data.invoices || []);
        setKpis(res.data.kpis || {});

        // Extract unique billing periods
        const periods = Array.from(new Set((res.data.invoices || []).map((i) => i.billing_period))).filter(Boolean);
        setAvailablePeriods(periods);
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setActionError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  // Status Change Workflow (Draft > Generated > Sent)
  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      setActionSuccess('');
      setActionError('');

      const res = await axios.put(`${API_BASE}/invoices/${invoiceId}/status`, {
        status: newStatus,
        change_reason: `Status updated to ${newStatus}`
      });

      if (res.data.success) {
        setActionSuccess(`Invoice status successfully updated to ${newStatus}`);
        fetchInvoices();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update invoice status');
    }
  };

  // Open correction modal for Draft invoices
  const openCorrectModal = (invoice) => {
    setSelectedInvoice(invoice);
    setCorrectionForm({
      rent_amount: invoice.rent_amount,
      maintenance_charges: invoice.maintenance_charges || 0,
      parking_charges: invoice.parking_charges || 0,
      gst_rate: invoice.gst_rate || 18,
      gst_applicable: invoice.gst_amount > 0,
      tax_supply_type: invoice.tax_supply_type || 'intra_state',
      change_reason: ''
    });
    setCorrectModalOpen(true);
  };

  // Save corrected draft invoice
  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.change_reason.trim()) {
      alert('A change reason is mandatory for audit logging compliance.');
      return;
    }

    try {
      setCorrecting(true);
      const res = await axios.put(
        `${API_BASE}/invoices/${selectedInvoice.invoice_id}/correct-draft`,
        correctionForm
      );
      if (res.data.success) {
        setActionSuccess(`Draft invoice ${selectedInvoice.invoice_number} successfully corrected and audited.`);
        setCorrectModalOpen(false);
        fetchInvoices();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to correct invoice.');
    } finally {
      setCorrecting(false);
    }
  };

  // Delete draft invoice
  const handleDeleteDraft = async (invoice) => {
    if (!invoice || invoice.status !== 'Draft') {
      alert('Only draft invoices can be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete draft invoice ${invoice.invoice_number}? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await axios.delete(`${API_BASE}/invoices/${invoice.invoice_id}`);
      if (res.data.success) {
        setActionSuccess(`Draft invoice ${invoice.invoice_number} deleted successfully.`);
        if (correctModalOpen) {
          setCorrectModalOpen(false);
          setSelectedInvoice(null);
        }
        fetchInvoices();
        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        setActionError(res.data.error || 'Failed to delete draft invoice');
      }
    } catch (err) {
      console.error('Error deleting draft invoice:', err);
      setActionError(err.response?.data?.error || 'Failed to delete draft invoice');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (invoices.length === 0) {
      alert('No invoices to export.');
      return;
    }

    const headers = [
      'Invoice No',
      'Date',
      'Period',
      'Landlord',
      'Property',
      'Tenant',
      'Rent',
      'Maintenance',
      'Parking',
      'Taxable Amount',
      'Tax Supply Type',
      'GST Rate',
      'CGST',
      'SGST',
      'IGST',
      'GST Total',
      'Total Amount',
      'Status'
    ];

    const rows = invoices.map((inv) => [
      inv.invoice_number,
      inv.invoice_date,
      inv.billing_period,
      `"${inv.landlord_name}"`,
      `"${inv.property_name}"`,
      `"${inv.tenant_name}"`,
      inv.rent_amount,
      inv.maintenance_charges,
      inv.parking_charges,
      inv.taxable_amount,
      inv.tax_supply_type,
      inv.gst_rate,
      inv.cgst_amount,
      inv.sgst_amount,
      inv.igst_amount,
      inv.gst_amount,
      inv.total_amount,
      inv.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoice_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = Math.ceil(invoices.length / pageSize) || 1;
  const paginatedInvoices = invoices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoices</h2>
          <p className="page-subtitle">
            Overview of all generated rental invoices, payment statuses, and audit records
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <FileText size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Filter Row matching Landlord & Property modules */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <select
            className="form-input"
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '160px' }}
          >
            <option value="All Periods">All Periods</option>
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {!isLandlord && (
            <select
              className="form-input"
              value={landlordFilter}
              onChange={(e) => {
                setLandlordFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '180px' }}
            >
              <option value="All Landlords">All Landlords</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          <select
            className="form-input"
            value={propertyFilter}
            onChange={(e) => {
              setPropertyFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '180px' }}
          >
            <option value="All Properties">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '140px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Generated">Generated</option>
            <option value="Sent">Sent</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPeriodFilter('All Periods');
              setLandlordFilter('All Landlords');
              setPropertyFilter('All Properties');
              setStatusFilter('All');
              setPage(1);
            }}
            style={{ background: '#f1f5f9' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 5 KPI Metric Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Matching Invoices</div>
          <div className="kpi-value">{kpis.matchingInvoices || 0}</div>
          <div className="kpi-desc">Filtered records</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Base Rent</div>
          <div className="kpi-value">
            ₹{Math.round(kpis.totalBaseRent || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-desc">Sum of base rent</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Maintenance & Parking</div>
          <div className="kpi-value">
            ₹{Math.round(kpis.maintenanceParking || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-desc">Additional charges</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total GST</div>
          <div className="kpi-value">
            ₹{Math.round(kpis.totalGst || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-desc">Tax component</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-title">Total Invoiced Amount</div>
          <div className="kpi-value">
            ₹{Math.round(kpis.totalInvoicedAmount || 0).toLocaleString('en-IN')}
          </div>
          <div className="kpi-desc">Grand total value</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Period</th>
              <th>Landlord</th>
              <th>Property / Tenant</th>
              <th>Rent</th>
              <th>Charges</th>
              <th>GST</th>
              <th>Total Amount</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Status</th>
              {!isLandlord && <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isLandlord ? "10" : "11"} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={isLandlord ? "10" : "11"} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No matching invoices found. Generate invoices from the "Generate Invoice" tab.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => {
                const charges =
                  (parseFloat(inv.maintenance_charges) || 0) + (parseFloat(inv.parking_charges) || 0) ||
                  parseFloat(inv.additional_charges) ||
                  0;

                return (
                  <tr key={inv.invoice_id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.billing_period}</td>
                    <td style={{ fontWeight: 600 }}>{inv.landlord_name}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{inv.tenant_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{inv.property_name}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      ₹{parseFloat(inv.rent_amount).toLocaleString('en-IN')}
                    </td>
                    <td>₹{charges.toLocaleString('en-IN')}</td>
                    <td>
                      {inv.gst_amount > 0 ? (
                        <div>
                          <div>₹{parseFloat(inv.gst_amount).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{inv.gst_rate}%</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>0%</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e40af' }}>
                      ₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isLandlord ? (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border:
                              inv.status === 'Draft'
                                ? '1px solid #fed7aa'
                                : inv.status === 'Generated'
                                ? '1px solid #bfdbfe'
                                : '1px solid #bbf7d0',
                            background:
                              inv.status === 'Draft'
                                ? '#fff7ed'
                                : inv.status === 'Generated'
                                ? '#eff6ff'
                                : '#f0fdf4',
                            color:
                              inv.status === 'Draft'
                                ? '#c2410c'
                                : inv.status === 'Generated'
                                ? '#1d4ed8'
                                : '#15803d'
                          }}
                        >
                          {inv.status}
                        </span>
                      ) : (
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.invoice_id, e.target.value)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            outline: 'none',
                            border:
                              inv.status === 'Draft'
                                ? '1px solid #fed7aa'
                                : inv.status === 'Generated'
                                ? '1px solid #bfdbfe'
                                : '1px solid #bbf7d0',
                            background:
                              inv.status === 'Draft'
                                ? '#fff7ed'
                                : inv.status === 'Generated'
                                ? '#eff6ff'
                                : '#f0fdf4',
                            color:
                              inv.status === 'Draft'
                                ? '#c2410c'
                                : inv.status === 'Generated'
                                ? '#1d4ed8'
                                : '#15803d'
                          }}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Generated">Generated</option>
                          <option value="Sent">Sent</option>
                        </select>
                      )}
                    </td>
                    {!isLandlord && (
                      <td style={{ textAlign: 'center' }}>
                        {inv.status === 'Draft' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => openCorrectModal(inv)}
                              title="Correct draft invoice before finalization"
                            >
                              <Edit3 size={12} />
                              <span>Correct</span>
                            </button>
                            <button
                              type="button"
                              className="btn"
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.78rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5'
                              }}
                              onClick={() => handleDeleteDraft(inv)}
                              title="Delete this draft invoice"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Finalized</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination container */}
      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {invoices.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, invoices.length)} of {invoices.length} invoice
          {invoices.length !== 1 ? 's' : ''}
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
            <button
              key={pNum}
              className={`page-btn ${page === pNum ? 'active' : ''}`}
              onClick={() => setPage(pNum)}
            >
              {pNum}
            </button>
          ))}
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Correct Draft Invoice with Audit Trail                   */}
      {/* ============================================================== */}
      {correctModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Correct Draft Invoice
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  {selectedInvoice.invoice_number} • {selectedInvoice.tenant_name} • {selectedInvoice.billing_period}
                </p>
              </div>
              <button
                onClick={() => setCorrectModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection}>
              <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <strong>Audit Compliance Notice:</strong> Per invoicing policy, only Draft invoices can be corrected. All adjustments are permanently stamped in the audit trail with the provided change reason.
              </div>

              <div className="flex-row" style={{ marginBottom: '14px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label">Rent Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'Subtract') e.preventDefault(); }}
                    placeholder="e.g. 50000"
                    className="form-input"
                    value={correctionForm.rent_amount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCorrectionForm({ ...correctionForm, rent_amount: val });
                    }}
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>Base monthly rental amount</span>
                </div>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label">Maintenance Charges (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'Subtract') e.preventDefault(); }}
                    placeholder="e.g. 3000"
                    className="form-input"
                    value={correctionForm.maintenance_charges}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCorrectionForm({ ...correctionForm, maintenance_charges: val });
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>Monthly maintenance fee</span>
                </div>
              </div>

              <div className="flex-row" style={{ marginBottom: '14px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label">Parking Charges (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'Subtract') e.preventDefault(); }}
                    placeholder="e.g. 2000"
                    className="form-input"
                    value={correctionForm.parking_charges}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setCorrectionForm({ ...correctionForm, parking_charges: val });
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>Parking slot charges</span>
                </div>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label">Tax Supply Type</label>
                  <select
                    className="form-input"
                    value={correctionForm.tax_supply_type}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, tax_supply_type: e.target.value })}
                  >
                    <option value="intra_state">Intra-State (CGST + SGST)</option>
                    <option value="inter_state">Inter-State (IGST)</option>
                  </select>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>Tax category applied</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Mandatory Change Reason for Audit Log *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Utility meter reading reconciliation, rate revision"
                  value={correctionForm.change_reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, change_reason: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>Logged in master data audit trails</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5'
                  }}
                  onClick={() => handleDeleteDraft(selectedInvoice)}
                  disabled={correcting}
                  title="Permanently delete this draft invoice"
                >
                  <Trash2 size={15} />
                  <span>Delete Draft</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCorrectModalOpen(false)}
                    disabled={correcting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={correcting}>
                    {correcting ? 'Saving & Auditing...' : 'Save & Log Audit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
