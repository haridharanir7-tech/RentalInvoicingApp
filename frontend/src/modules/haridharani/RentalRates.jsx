import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, History, X, Check, AlertCircle, Building2, Calendar, DollarSign, Percent } from 'lucide-react';
import HaridharaniNav from './HaridharaniNav';
import './haridharani.css';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function RentalRates() {
  const [rates, setRates] = useState([]);
  const [masterData, setMasterData] = useState({ tenants: [], landlords: [], properties: [] });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyTenant, setHistoryTenant] = useState(null);

  // Form State matching "Define Rental Rate Revision" modal
  const [formData, setFormData] = useState({
    rate_id: null,
    tenant_id: '',
    property_id: '',
    effective_from: '2026-10-01',
    effective_to: '2027-09-30',
    monthly_rent: 60000,
    maintenance_charges: 3000,
    parking_charges: 2000,
    tax_supply_type: 'intra_state', // 'intra_state' | 'inter_state'
    gst_rate: 18,
    gst_applicable: true,
    is_custom_gst: false,
    change_reason: 'Annual rate adjustment'
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRates();
    fetchMasterData();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/rental-rates`);
      if (res.data.success) {
        setRates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load rates', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        setMasterData(res.data);
      }
    } catch (err) {
      console.error('Failed to load master data', err);
    }
  };

  const openNewRateModal = () => {
    fetchMasterData();
    const firstTenant = masterData.tenants[0];
    const isLandlordGst = firstTenant ? firstTenant.landlord_gst_registered : true;

    setFormData({
      rate_id: null,
      tenant_id: firstTenant ? firstTenant.tenant_id : '',
      property_id: firstTenant?.property_id || masterData.properties[0]?.id || '',
      effective_from: '2026-10-01',
      effective_to: '2027-09-30',
      monthly_rent: 60000,
      maintenance_charges: 3000,
      parking_charges: 2000,
      tax_supply_type: 'intra_state',
      gst_rate: isLandlordGst ? 18 : 0,
      gst_applicable: isLandlordGst,
      is_custom_gst: false,
      change_reason: 'Define Rental Rate'
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const handleTenantChange = (tenantId) => {
    const t = masterData.tenants.find((item) => String(item.tenant_id) === String(tenantId));
    if (t) {
      const isGst = !!t.landlord_gst_registered;
      setFormData((prev) => ({
        ...prev,
        tenant_id: t.tenant_id,
        property_id: t.property_id || prev.property_id || masterData.properties[0]?.id || '',
        gst_applicable: isGst,
        gst_rate: isGst ? 18 : 0
      }));
    } else {
      setFormData((prev) => ({ ...prev, tenant_id: tenantId }));
    }
  };

  const openHistoryModal = async (tenant) => {
    try {
      setHistoryTenant(tenant);
      const res = await axios.get(`${API_BASE}/rental-rates/history/${tenant.tenant_id}`);
      if (res.data.success) {
        setHistoryList(res.data.history);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch rate history', err);
    }
  };

  // Live calculations for the revision modal
  const baseRentNum = parseFloat(formData.monthly_rent) || 0;
  const maintNum = parseFloat(formData.maintenance_charges) || 0;
  const parkNum = parseFloat(formData.parking_charges) || 0;
  const subtotal = baseRentNum + maintNum + parkNum;

  const gstRateNum = formData.gst_applicable ? parseFloat(formData.gst_rate) || 0 : 0;
  const isInterState = formData.tax_supply_type === 'inter_state';

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalGstAmount = 0;

  if (formData.gst_applicable && gstRateNum > 0) {
    if (isInterState) {
      igstAmount = Math.round((subtotal * (gstRateNum / 100)) * 100) / 100;
      totalGstAmount = igstAmount;
    } else {
      const halfRate = gstRateNum / 2;
      cgstAmount = Math.round((subtotal * (halfRate / 100)) * 100) / 100;
      sgstAmount = Math.round((subtotal * (halfRate / 100)) * 100) / 100;
      totalGstAmount = cgstAmount + sgstAmount;
    }
  }

  const grandTotal = subtotal + totalGstAmount;

  const handleSaveRate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.tenant_id || !formData.property_id) {
      setFormError('Please select a tenant and property.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        rate_id: formData.rate_id,
        tenant_id: parseInt(formData.tenant_id, 10),
        property_id: parseInt(formData.property_id, 10),
        monthly_rent: baseRentNum,
        maintenance_charges: maintNum,
        parking_charges: parkNum,
        tax_supply_type: formData.tax_supply_type,
        gst_applicable: formData.gst_applicable,
        gst_rate: gstRateNum,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        change_reason: formData.change_reason || 'Rate Revision'
      };

      const res = await axios.post(`${API_BASE}/rental-rates`, payload);
      if (res.data.success) {
        setFormSuccess('Rental rate saved successfully!');
        fetchRates();
        setTimeout(() => {
          setModalOpen(false);
        }, 1200);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save rental rate';
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTenantObj = masterData.tenants.find(
    (t) => String(t.tenant_id) === String(formData.tenant_id)
  );

  return (
    <div className="hd-container">
      <HaridharaniNav />

      {/* Header */}
      <div className="hd-header">
        <div>
          <h1 className="hd-title">Rental Rate Configuration</h1>
          <p className="hd-subtitle">
            Define monthly rent, recurring charges, GST taxation rules, and manage lease rate revisions over time.
          </p>
        </div>
        <div className="hd-header-actions">
          <button className="hd-btn-primary" onClick={openNewRateModal}>
            <Plus size={16} />
            <span>Define Rental Rate Revision</span>
          </button>
        </div>
      </div>

      {/* Rates Table */}
      <div className="hd-table-card">
        <table className="hd-table">
          <thead>
            <tr>
              <th>Tenant & Landlord</th>
              <th>Property</th>
              <th>Base Monthly Rent</th>
              <th>Maintenance & Parking</th>
              <th>GST Rate / Supply</th>
              <th>Effective Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                  Loading rental rates...
                </td>
              </tr>
            ) : rates.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No rental rates configured yet. Click "Define Rental Rate Revision" to create one.
                </td>
              </tr>
            ) : (
              rates.map((rate) => {
                const totalAdditional =
                  (parseFloat(rate.maintenance_charges) || 0) + (parseFloat(rate.parking_charges) || 0);

                return (
                  <tr key={rate.rate_id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rate.tenant_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Landlord: {rate.landlord_name}{' '}
                        {rate.landlord_gst_registered ? (
                          <span style={{ color: '#1d4ed8', fontWeight: 600 }}>(GST Reg)</span>
                        ) : (
                          <span style={{ color: '#b91c1c' }}>(Non-GST)</span>
                        )}
                      </div>
                    </td>
                    <td>{rate.property_name}</td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{parseFloat(rate.monthly_rent).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div>₹{totalAdditional.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        (Maint: ₹{parseFloat(rate.maintenance_charges).toLocaleString('en-IN')}, Park: ₹
                        {parseFloat(rate.parking_charges).toLocaleString('en-IN')})
                      </div>
                    </td>
                    <td>
                      <div>{rate.gst_applicable ? `${parseFloat(rate.gst_rate)}% GST` : '0% (Non-GST)'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {rate.tax_supply_type === 'inter_state' ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        {rate.effective_from} to {rate.effective_to || 'Indefinite'}
                      </div>
                    </td>
                    <td>
                      <span className="hd-badge-generated">{rate.status}</span>
                    </td>
                    <td>
                      <button
                        className="hd-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        onClick={() => openHistoryModal(rate)}
                      >
                        <History size={13} />
                        <span>History</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* MODAL: Define Rental Rate Revision (Matches user screenshot)   */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="hd-modal-backdrop">
          <div className="hd-modal">
            <div className="hd-modal-header">
              <div className="hd-modal-title-group">
                <div className="hd-modal-icon">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="hd-modal-title">Define Rental Rate Revision</h3>
                  <p className="hd-modal-subtitle">
                    {selectedTenantObj
                      ? `${selectedTenantObj.tenant_name} • ${selectedTenantObj.property_name} • Active Lease`
                      : 'Select tenant and configure rental rate'}
                  </p>
                </div>
              </div>
              <button className="hd-modal-close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRate}>
              <div className="hd-modal-body">
                {formError && (
                  <div className="hd-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="hd-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} />
                    <span>{formSuccess}</span>
                  </div>
                )}

                {/* Tenant & Property Selection (Row 0) */}
                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Tenant Selection *</label>
                    <select
                      className="hd-select"
                      value={formData.tenant_id}
                      onChange={(e) => handleTenantChange(e.target.value)}
                      required
                    >
                      <option value="">Select Tenant</option>
                      {masterData.tenants.map((t) => (
                        <option key={t.tenant_id} value={t.tenant_id}>
                          {t.tenant_name} {t.tenant_pan ? `(${t.tenant_pan})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="hd-form-group">
                    <label className="hd-form-label">Property Selection *</label>
                    <select
                      className="hd-select"
                      value={formData.property_id}
                      onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                      required
                    >
                      <option value="">Select Property</option>
                      {masterData.properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.property_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Effective Dates (Row 1) */}
                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Effective From Date *</label>
                    <input
                      type="date"
                      className="hd-input"
                      value={formData.effective_from}
                      onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                      required
                    />
                  </div>
                  <div className="hd-form-group">
                    <label className="hd-form-label">Effective To Date</label>
                    <input
                      type="date"
                      className="hd-input"
                      value={formData.effective_to}
                      onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    />
                  </div>
                </div>

                {/* Base Monthly Rent & Maintenance (Row 2) */}
                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Base Monthly Rent (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                      required
                    />
                  </div>
                  <div className="hd-form-group">
                    <label className="hd-form-label">Maintenance Charges (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={formData.maintenance_charges}
                      onChange={(e) => setFormData({ ...formData, maintenance_charges: e.target.value })}
                    />
                  </div>
                </div>

                {/* Parking Charges & Tax Supply Type (Row 3) */}
                <div className="hd-form-grid-2">
                  <div className="hd-form-group">
                    <label className="hd-form-label">Parking Charges (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="hd-input"
                      value={formData.parking_charges}
                      onChange={(e) => setFormData({ ...formData, parking_charges: e.target.value })}
                    />
                  </div>
                  <div className="hd-form-group">
                    <label className="hd-form-label">Tax Supply Type</label>
                    <div className="hd-toggle-group">
                      <button
                        type="button"
                        className={`hd-toggle-btn ${formData.tax_supply_type === 'intra_state' ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, tax_supply_type: 'intra_state' })}
                      >
                        Intra-State (CGST + SGST)
                      </button>
                      <button
                        type="button"
                        className={`hd-toggle-btn ${formData.tax_supply_type === 'inter_state' ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, tax_supply_type: 'inter_state' })}
                      >
                        Inter-State (IGST)
                      </button>
                    </div>
                  </div>
                </div>

                {/* GST Applicable Selector (Row 4) */}
                <div className="hd-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="hd-form-label">GST Applicable (Commercial Leasing)</label>
                    <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                      Selected: {formData.gst_applicable ? `${formData.gst_rate}%` : '0% (Non-GST)'}
                    </span>
                  </div>

                  <div className="hd-gst-btn-group">
                    <button
                      type="button"
                      className={`hd-gst-btn ${formData.gst_rate === 18 && formData.gst_applicable && !formData.is_custom_gst ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({ ...formData, gst_rate: 18, gst_applicable: true, is_custom_gst: false })
                      }
                    >
                      18% (Standard)
                    </button>
                    <button
                      type="button"
                      className={`hd-gst-btn ${formData.gst_rate === 12 && formData.gst_applicable && !formData.is_custom_gst ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({ ...formData, gst_rate: 12, gst_applicable: true, is_custom_gst: false })
                      }
                    >
                      12%
                    </button>
                    <button
                      type="button"
                      className={`hd-gst-btn ${formData.gst_rate === 5 && formData.gst_applicable && !formData.is_custom_gst ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({ ...formData, gst_rate: 5, gst_applicable: true, is_custom_gst: false })
                      }
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      className={`hd-gst-btn ${!formData.gst_applicable || formData.gst_rate === 0 ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData({ ...formData, gst_rate: 0, gst_applicable: false, is_custom_gst: false })
                      }
                    >
                      0% (Non-GST)
                    </button>
                    <button
                      type="button"
                      className={`hd-gst-btn ${formData.is_custom_gst ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, is_custom_gst: true, gst_applicable: true })}
                    >
                      Customize GST
                    </button>
                  </div>

                  {formData.is_custom_gst && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.01"
                        className="hd-input"
                        placeholder="Enter custom GST %"
                        value={formData.gst_rate}
                        onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                        style={{ maxWidth: '180px' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>%</span>
                    </div>
                  )}
                </div>

                {/* Change Reason */}
                <div className="hd-form-group">
                  <label className="hd-form-label">Revision Reason / Remarks</label>
                  <input
                    type="text"
                    className="hd-input"
                    placeholder="e.g. Annual lease renewal, Meter update"
                    value={formData.change_reason}
                    onChange={(e) => setFormData({ ...formData, change_reason: e.target.value })}
                  />
                </div>

                {/* Live Calculation Summary Breakdown Card */}
                <div className="hd-breakdown-card">
                  <div className="hd-breakdown-row">
                    <span>Base Monthly Rent:</span>
                    <span>₹{baseRentNum.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="hd-breakdown-row">
                    <span>Maintenance Charges:</span>
                    <span>₹{maintNum.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="hd-breakdown-row">
                    <span>Parking Charges:</span>
                    <span>₹{parkNum.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="hd-breakdown-row" style={{ fontWeight: 600 }}>
                    <span>Subtotal (Rent + Charges):</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {formData.gst_applicable && gstRateNum > 0 ? (
                    isInterState ? (
                      <div className="hd-breakdown-row">
                        <span>IGST ({gstRateNum}%):</span>
                        <span>₹{igstAmount.toLocaleString('en-IN')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="hd-breakdown-row">
                          <span>CGST ({gstRateNum / 2}%):</span>
                          <span>₹{cgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="hd-breakdown-row">
                          <span>SGST ({gstRateNum / 2}%):</span>
                          <span>₹{sgstAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="hd-breakdown-row">
                      <span>GST Component:</span>
                      <span>₹0.00 (Non-GST / Exempt)</span>
                    </div>
                  )}

                  <div className="hd-breakdown-row total">
                    <span>Total Monthly Payable:</span>
                    <span style={{ color: '#1e40af' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="hd-modal-footer">
                <button
                  type="button"
                  className="hd-btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="hd-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Rental Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Rate Revision History (Task 4)                          */}
      {/* ============================================================== */}
      {historyModalOpen && (
        <div className="hd-modal-backdrop">
          <div className="hd-modal" style={{ maxWidth: '750px' }}>
            <div className="hd-modal-header">
              <div className="hd-modal-title-group">
                <div className="hd-modal-icon">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="hd-modal-title">Rate Revision History</h3>
                  <p className="hd-modal-subtitle">
                    Tenant: {historyTenant?.tenant_name} • Property: {historyTenant?.property_name}
                  </p>
                </div>
              </div>
              <button className="hd-modal-close" onClick={() => setHistoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="hd-modal-body">
              {historyList.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No historical revisions found for this tenant.
                </p>
              ) : (
                <div className="hd-table-card">
                  <table className="hd-table">
                    <thead>
                      <tr>
                        <th>Effective Period</th>
                        <th>Base Rent</th>
                        <th>Charges</th>
                        <th>GST %</th>
                        <th>Reason</th>
                        <th>Recorded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map((item) => (
                        <tr key={item.history_id}>
                          <td>
                            {item.effective_from} to {item.effective_to || 'Indefinite'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            ₹{parseFloat(item.monthly_rent).toLocaleString('en-IN')}
                          </td>
                          <td>
                            ₹
                            {(
                              (parseFloat(item.maintenance_charges) || 0) + (parseFloat(item.parking_charges) || 0)
                            ).toLocaleString('en-IN')}
                          </td>
                          <td>{item.gst_applicable ? `${parseFloat(item.gst_rate)}%` : '0%'}</td>
                          <td>{item.change_reason}</td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="hd-modal-footer">
              <button className="hd-btn-secondary" onClick={() => setHistoryModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

