import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import HaridharaniNav from './HaridharaniNav';
import './haridharani.css';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function Invoices() {
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
  }, [periodFilter, landlordFilter, propertyFilter, statusFilter]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        setLandlords(res.data.landlords || []);
        setProperties(res.data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setActionError('');

      const params = {};
      if (periodFilter !== 'All Periods') params.period = periodFilter;
      if (landlordFilter !== 'All Landlords') params.landlord_id = landlordFilter;
      if (propertyFilter !== 'All Properties') params.property_id = propertyFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await axios.get(`${API_BASE}/invoices`, { params });
      if (res.data.success) {
        setInvoices(res.data.invoices);
        setKpis(res.data.kpis);

        // Extract unique billing periods
        const periods = Array.from(new Set(res.data.invoices.map((i) => i.billing_period))).filter(Boolean);
        setAvailablePeriods(periods);
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setActionError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  // Status Change Workflow (Task 9: Draft > Generated > Sent)
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

  // Open Correct / Regenerate Draft Modal (Task 10)
  const openCorrectModal = (inv) => {
    if (inv.status !== 'Draft') {
      setActionError(`Cannot edit finalized invoice. Only Draft invoices can be corrected.`);
      return;
    }

    setSelectedInvoice(inv);
    setCorrectionForm({
      rent_amount: inv.rent_amount,
      maintenance_charges: inv.maintenance_charges,
      parking_charges: inv.parking_charges,
      gst_rate: inv.gst_rate,
      gst_applicable: parseFloat(inv.gst_rate) > 0,
      tax_supply_type: inv.tax_supply_type || 'intra_state',
      change_reason: ''
    });
    setCorrectModalOpen(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.change_reason || correctionForm.change_reason.trim() === '') {
      alert('A mandatory Change Reason is required for audit trail tracking.');
      return;
    }

    try {
      setCorrecting(true);
      const res = await axios.put(`${API_BASE}/invoices/${selectedInvoice.invoice_id}/correct`, {
        rent_amount: parseFloat(correctionForm.rent_amount) || 0,
        maintenance_charges: parseFloat(correctionForm.maintenance_charges) || 0,
        parking_charges: parseFloat(correctionForm.parking_charges) || 0,
        gst_applicable: correctionForm.gst_applicable,
        gst_rate: parseFloat(correctionForm.gst_rate) || 0,
        tax_supply_type: correctionForm.tax_supply_type,
        change_reason: correctionForm.change_reason
      });

      if (res.data.success) {
        setActionSuccess('Draft invoice corrected successfully and logged to audit trail.');
        setCorrectModalOpen(false);
        fetchInvoices();
        setTimeout(() => setActionSuccess(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to correct invoice.');
    } finally {
      setCorrecting(false);
    }
  };

  // Export to CSV
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
      'Supply Type',
      'GST Rate %',
      'CGST',
      'SGST',
      'IGST',
      'Total GST',
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

  // Print Register
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="hd-container">
      {/* Header Bar */}
      <div className="hd-header">
        <div>
          <h1 className="hd-title">Invoices</h1>
          <p className="hd-subtitle">
            Overview of all generated rental invoices and statuses.
          </p>
        </div>
        <div className="hd-header-actions">
          <button className="hd-btn-secondary" onClick={handleExportCSV}>
            <FileText size={16} />
            <span>Export Register (.csv)</span>
          </button>
          <button className="hd-btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Filter Row matching mockup */}
      <div className="hd-filter-bar">
        <div className="hd-filter-group">
          {/* Billing Period Dropdown */}
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <Calendar size={13} />
              <span>Billing Period</span>
            </label>
            <select
              className="hd-select"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="All Periods">All Periods</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Landlord Dropdown */}
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
              <option value="All Landlords">All Landlords</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Property Dropdown */}
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <Building size={13} />
              <span>Property</span>
            </label>
            <select
              className="hd-select"
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="All Properties">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Buttons matching mockup */}
        <div className="hd-filter-item">
          <label className="hd-filter-label">
            <Filter size={13} />
            <span>Status Filter</span>
          </label>
          <div className="hd-status-filter-pills">
            {['All', 'Draft', 'Generated', 'Sent'].map((st) => (
              <button
                key={st}
                className={`hd-pill-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="hd-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="hd-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 5 KPI Metric Summary Cards matching image media_1790159326915.jpg */}
      <div className="hd-kpi-grid">
        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Matching Invoices</div>
          <div className="hd-kpi-value">{kpis.matchingInvoices}</div>
          <div className="hd-kpi-desc">Filtered records</div>
        </div>

        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total Base Rent</div>
          <div className="hd-kpi-value">
            ₹{Math.round(kpis.totalBaseRent).toLocaleString('en-IN')}
          </div>
          <div className="hd-kpi-desc">Sum of base rent</div>
        </div>

        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Maintenance & Parking</div>
          <div className="hd-kpi-value">
            ₹{Math.round(kpis.maintenanceParking).toLocaleString('en-IN')}
          </div>
          <div className="hd-kpi-desc">Additional charges</div>
        </div>

        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total GST</div>
          <div className="hd-kpi-value">
            ₹{Math.round(kpis.totalGst).toLocaleString('en-IN')}
          </div>
          <div className="hd-kpi-desc">Tax component</div>
        </div>

        <div className="hd-kpi-card">
          <div className="hd-kpi-title">Total Invoiced Amount</div>
          <div className="hd-kpi-value">
            ₹{Math.round(kpis.totalInvoicedAmount).toLocaleString('en-IN')}
          </div>
          <div className="hd-kpi-desc">Grand total value</div>
        </div>
      </div>

      {/* Invoices Table matching mockup */}
      <div className="hd-table-card">
        <table className="hd-table">
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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '36px' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No matching invoices found. Generate invoices from the "Generate Invoices" tab.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const charges =
                  (parseFloat(inv.maintenance_charges) || 0) + (parseFloat(inv.parking_charges) || 0) ||
                  parseFloat(inv.additional_charges) ||
                  0;

                return (
                  <tr key={inv.invoice_id}>
                    <td>
                      <span className="hd-badge-inv">{inv.invoice_number}</span>
                    </td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.billing_period}</td>
                    <td>{inv.landlord_name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.tenant_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.property_name}</div>
                    </td>
                    <td>₹{parseFloat(inv.rent_amount).toLocaleString('en-IN')}</td>
                    <td>₹{charges.toLocaleString('en-IN')}</td>
                    <td>₹{parseFloat(inv.gst_amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: '#1e40af' }}>
                      ₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {/* Status Dropdown (Task 9: Draft > Generated > Sent) */}
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.invoice_id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border:
                            inv.status === 'Draft'
                              ? '1px solid #fed7aa'
                              : inv.status === 'Generated'
                              ? '1px solid #bfdbfe'
                              : '1px solid #e2e8f0',
                          background:
                            inv.status === 'Draft'
                              ? '#fff7ed'
                              : inv.status === 'Generated'
                              ? '#eff6ff'
                              : '#f8fafc',
                          color:
                            inv.status === 'Draft'
                              ? '#c2410c'
                              : inv.status === 'Generated'
                              ? '#1d4ed8'
                              : '#475569'
                        }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Generated">Generated</option>
                        <option value="Sent">Sent</option>
                      </select>
                    </td>
                    <td>
                      {inv.status === 'Draft' ? (
                        <button
                          className="hd-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          onClick={() => openCorrectModal(inv)}
                          title="Correct draft invoice before finalization"
                        >
                          <Edit3 size={13} />
                          <span>Correct</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Finalized</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Correct Draft Invoice with Audit Trail (Task 10)         */}
      {/* ============================================================== */}
      {correctModalOpen && selectedInvoice && (
        <div className="hd-modal-backdrop">
          <div className="hd-modal">
            <div className="hd-modal-header">
              <div className="hd-modal-title-group">
                <div className="hd-modal-icon">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="hd-modal-title">Correct Draft Invoice</h3>
                  <p className="hd-modal-subtitle">
                    {selectedInvoice.invoice_number} • {selectedInvoice.tenant_name} • {selectedInvoice.billing_period}
                  </p>
                </div>
              </div>
              <button className="hd-modal-close" onClick={() => setCorrectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection}>
              <div className="hd-modal-body">
                <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong>Audit Compliance Notice:</strong> Per invoicing policy, only Draft invoices can be corrected. All adjustments are permanently stamped in the audit trail with the provided change reason.
                </div>

                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Rent Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={correctionForm.rent_amount}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, rent_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="hd-form-group">
                    <label className="hd-form-label">Maintenance Charges (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={correctionForm.maintenance_charges}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, maintenance_charges: e.target.value })}
                    />
                  </div>
                </div>

                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Parking Charges (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={correctionForm.parking_charges}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, parking_charges: e.target.value })}
                    />
                  </div>
                  <div className="hd-form-group">
                    <label className="hd-form-label">Tax Supply Type</label>
                    <select
                      className="hd-select"
                      value={correctionForm.tax_supply_type}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, tax_supply_type: e.target.value })}
                    >
                      <option value="intra_state">Intra-State (CGST + SGST)</option>
                      <option value="inter_state">Inter-State (IGST)</option>
                    </select>
                  </div>
                </div>

                <div className="hd-form-group">
                  <label className="hd-form-label">Mandatory Change Reason for Audit Log *</label>
                  <input
                    type="text"
                    className="hd-input"
                    placeholder="e.g. Utility meter reading reconciliation, rate revision"
                    value={correctionForm.change_reason}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, change_reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="hd-modal-footer">
                <button
                  type="button"
                  className="hd-btn-secondary"
                  onClick={() => setCorrectModalOpen(false)}
                  disabled={correcting}
                >
                  Cancel
                </button>
                <button type="submit" className="hd-btn-primary" disabled={correcting}>
                  {correcting ? 'Saving & Auditing...' : 'Save & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

