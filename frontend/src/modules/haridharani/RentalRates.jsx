import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, History, X, Check, AlertCircle, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function RentalRates() {
  const [rates, setRates] = useState([]);
  const [masterData, setMasterData] = useState({ landlords: [], properties: [], tenants: [] });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyItem, setHistoryItem] = useState(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [landlordFilter, setLandlordFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Form State: Landlord & Property selection
  const [formData, setFormData] = useState({
    rate_id: null,
    landlord_id: '',
    property_id: '',
    tenant_id: '',
    effective_from: '',
    effective_to: '',
    monthly_rent: '',
    maintenance_charges: '',
    parking_charges: '',
    tax_supply_type: 'intra_state', // 'intra_state' | 'inter_state'
    gst_rate: 18,
    gst_applicable: true,
    is_custom_gst: false,
    change_reason: ''
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
        setRates(res.data.data || []);
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
        setMasterData({
          landlords: res.data.landlords || [],
          properties: res.data.properties || [],
          tenants: res.data.tenants || []
        });
      }
    } catch (err) {
      console.error('Failed to load master data', err);
    }
  };

  const openNewRateModal = () => {
    fetchMasterData();
    setFormData({
      rate_id: null,
      landlord_id: '',
      property_id: '',
      tenant_id: '',
      effective_from: '',
      effective_to: '',
      monthly_rent: '',
      maintenance_charges: '',
      parking_charges: '',
      tax_supply_type: 'intra_state',
      gst_rate: 18,
      gst_applicable: true,
      is_custom_gst: false,
      change_reason: ''
    });
    setFormError('');
    setFormSuccess('');
    setModalOpen(true);
  };

  const selectedLandlord = masterData.landlords.find((item) => String(item.id) === String(formData.landlord_id));
  const isLandlordGstRegistered = selectedLandlord ? !!selectedLandlord.gst_registered : false;

  const handleLandlordChange = (landlordId) => {
    const l = masterData.landlords.find((item) => String(item.id) === String(landlordId));
    const isGst = l ? !!l.gst_registered : false;
    setFormData((prev) => ({
      ...prev,
      landlord_id: landlordId,
      property_id: '', // Always reset to Select Property so "Select Property" shows first
      gst_applicable: isGst,
      gst_rate: isGst ? 18 : 0,
      tax_supply_type: 'intra_state',
      is_custom_gst: false
    }));
  };

  const handleEditRate = (rate) => {
    const l = masterData.landlords.find((item) => String(item.id) === String(rate.landlord_id));
    const isGst = l ? !!l.gst_registered : !!rate.landlord_gst_registered;
    setFormData({
      rate_id: rate.rate_id,
      landlord_id: rate.landlord_id || '',
      property_id: rate.property_id || '',
      tenant_id: rate.tenant_id || '',
      monthly_rent: rate.monthly_rent || 0,
      maintenance_charges: rate.maintenance_charges || 0,
      parking_charges: rate.parking_charges || 0,
      tax_supply_type: isGst ? (rate.tax_supply_type || 'intra_state') : 'intra_state',
      gst_rate: isGst ? (rate.gst_rate || 0) : 0,
      gst_applicable: isGst ? (rate.gst_applicable || false) : false,
      is_custom_gst: isGst && rate.gst_rate !== 18 && rate.gst_rate !== 12 && rate.gst_rate !== 5 && rate.gst_rate !== 0,
      effective_from: rate.effective_from ? rate.effective_from.substring(0, 10) : '',
      effective_to: rate.effective_to ? rate.effective_to.substring(0, 10) : '',
      change_reason: rate.change_reason || ''
    });
    setModalOpen(true);
  };

  const handleDeleteRate = async (id) => {
    if (window.confirm("Are you sure you want to delete this rental rate?")) {
      try {
        await axios.delete(`${API_BASE}/rental-rates/${id}`);
        alert("Rental rate deleted successfully from database!");
        fetchRates();
      } catch (e) {
        alert("Failed to delete rental rate.");
      }
    }
  };

  const openHistoryModal = async (rate) => {
    try {
      setHistoryItem(rate);
      const res = await axios.get(`${API_BASE}/rental-rates/history/${rate.rate_id}`);
      if (res.data.success) {
        setHistoryList(res.data.history || []);
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

  const gstRateNum = isLandlordGstRegistered && formData.gst_applicable ? parseFloat(formData.gst_rate) || 0 : 0;
  const isInterState = isLandlordGstRegistered && formData.tax_supply_type === 'inter_state';

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let totalGstAmount = 0;

  if (isLandlordGstRegistered && formData.gst_applicable && gstRateNum > 0) {
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

    if (!formData.landlord_id || !formData.property_id) {
      setFormError('Please select both a landlord and a property.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        rate_id: formData.rate_id,
        landlord_id: parseInt(formData.landlord_id, 10),
        property_id: parseInt(formData.property_id, 10),
        tenant_id: formData.tenant_id ? parseInt(formData.tenant_id, 10) : null,
        monthly_rent: baseRentNum,
        maintenance_charges: maintNum,
        parking_charges: parkNum,
        tax_supply_type: isLandlordGstRegistered ? formData.tax_supply_type : 'intra_state',
        gst_applicable: isLandlordGstRegistered ? !!formData.gst_applicable : false,
        gst_rate: isLandlordGstRegistered && formData.gst_applicable ? gstRateNum : 0,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        change_reason: formData.change_reason || 'Rate Revision'
      };

      let res;
      res = await axios.post(`${API_BASE}/rental-rates`, payload);
      alert(formData.rate_id ? "Rental rate updated successfully in database!" : "Rental rate created successfully in database!");
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

  // Available properties for selected landlord (or all if none selected)
  const availableProperties = formData.landlord_id
    ? masterData.properties.filter((p) => String(p.landlord_id) === String(formData.landlord_id))
    : masterData.properties;

  // Filtered rates logic
  const filteredRates = rates.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (r.landlord_name || '').toLowerCase().includes(query) ||
      (r.property_name || '').toLowerCase().includes(query) ||
      (r.tenant_name || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      !statusFilter ||
      (r.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

    const matchesLandlord =
      landlordFilter === 'all' ||
      !landlordFilter ||
      String(r.landlord_id) === String(landlordFilter);

    return matchesSearch && matchesStatus && matchesLandlord;
  });

  const totalPages = Math.ceil(filteredRates.length / pageSize) || 1;
  const paginatedRates = filteredRates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Rental Rates</h2>
          <p className="page-subtitle">
            Configure monthly rent, recurring charges, and GST taxation rules per property
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNewRateModal}>
            + Add Rental Rate
          </button>
        </div>
      </div>

      {/* Filter / Search Bar matching Property & Landlord modules */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
          className="filter-bar"
          style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Search landlord, property, tenant..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: '230px' }}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          <select
            className="form-input"
            value={landlordFilter}
            onChange={(e) => {
              setLandlordFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: '170px' }}
          >
            <option value="all">All Landlords</option>
            {masterData.landlords
              .filter((l) => l.is_active !== false)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.email ? `(${l.email})` : ''}
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setLandlordFilter('all');
              setStatusFilter('all');
              setPage(1);
            }}
            style={{ background: '#f1f5f9' }}
          >
            Clear
          </button>
        </form>
      </div>

      {/* Rates Table Container */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Landlord</th>
              <th>Property</th>
              <th>Base Monthly Rent</th>
              <th>Maintenance & Parking</th>
              <th>GST Rate / Supply</th>
              <th>Effective Period</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Loading rental rates...
                </td>
              </tr>
            ) : filteredRates.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No rental rates matching your filter criteria.
                </td>
              </tr>
            ) : (
              paginatedRates.map((rate) => {
                const totalAdditional =
                  (parseFloat(rate.maintenance_charges) || 0) + (parseFloat(rate.parking_charges) || 0);
                const isActive = (rate.status || 'Active').toLowerCase() === 'active';

                return (
                  <tr key={rate.rate_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{rate.landlord_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {rate.landlord_gst_registered ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>GST Registered</span>
                        ) : (
                          <span style={{ color: '#b91c1c' }}>Non-GST</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{rate.property_name}</div>
                      {rate.tenant_name && rate.tenant_name !== 'N/A' && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Tenant: {rate.tenant_name}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      ₹{parseFloat(rate.monthly_rent).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>₹{totalAdditional.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        (Maint: ₹{parseFloat(rate.maintenance_charges).toLocaleString('en-IN')}, Park: ₹
                        {parseFloat(rate.parking_charges).toLocaleString('en-IN')})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {rate.landlord_gst_registered && rate.gst_applicable
                          ? `${parseFloat(rate.gst_rate)}% GST`
                          : '0% (Non-GST)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: rate.landlord_gst_registered && rate.gst_applicable ? '#64748b' : '#94a3b8' }}>
                        {rate.landlord_gst_registered && rate.gst_applicable
                          ? (rate.tax_supply_type === 'inter_state' ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)')
                          : 'Exempt from GST'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {rate.effective_from} to {rate.effective_to || 'Indefinite'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isActive ? (
                        <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={13} />
                          Active
                        </span>
                      ) : (
                        <span className="badge badge-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={13} />
                          {rate.status || 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button title="Edit" onClick={() => handleEditRate(rate)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}><Edit size={14} /> Edit</button>
                          <button title="Delete" onClick={() => handleDeleteRate(rate.rate_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}><Trash2 size={14} /> Delete</button>
                          <button
                          className="btn btn-secondary"
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => openHistoryModal(rate)}
                          title="View rate revision history"
                        >
                          <History size={13} />
                          <span>History</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination container matching Landlord and Property modules */}
      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {filteredRates.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, filteredRates.length)} of {filteredRates.length} rental rate
          {filteredRates.length !== 1 ? 's' : ''} ({rates.length} total)
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
      {/* MODAL: Define Rental Rate Revision                             */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: '620px',
              padding: '18px 22px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Define Rental Rate Revision
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRate}>
              {formError && (
                <div style={{ padding: '7px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#b91c1c', marginBottom: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '7px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#15803d', marginBottom: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={15} />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Landlord & Property Selection (Row 0) */}
              <div className="flex-row" style={{ marginBottom: '10px', gap: '12px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Landlord Selection *</label>
                  <select
                    className="form-input"
                    value={formData.landlord_id}
                    onChange={(e) => handleLandlordChange(e.target.value)}
                    required
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  >
                    <option value="">Select Landlord</option>
                    {masterData.landlords
                      .filter((l) => l.is_active !== false)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.email ? `(${l.email})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Property Selection *</label>
                  <select
                    className="form-input"
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    required
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  >
                    <option value="">
                      {formData.landlord_id && availableProperties.length === 0
                        ? 'No properties found for this landlord'
                        : 'Select Property'}
                    </option>
                    {availableProperties
                      .filter((p) => p.is_active !== false)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.property_type})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Effective Dates (Row 1) */}
              <div className="flex-row" style={{ marginBottom: '10px', gap: '12px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Effective From Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    required
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  />
                </div>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Effective To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Base Monthly Rent & Maintenance (Row 2) */}
              <div className="flex-row" style={{ marginBottom: '10px', gap: '12px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Base Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                    }}
                    placeholder="e.g. 60000"
                    className="form-input"
                    value={formData.monthly_rent}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setFormData({ ...formData, monthly_rent: val });
                    }}
                    required
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  />
                </div>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Maintenance Charges (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                    }}
                    placeholder="e.g. 3000"
                    className="form-input"
                    value={formData.maintenance_charges}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setFormData({ ...formData, maintenance_charges: val });
                    }}
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              {/* Parking Charges & Tax Supply Type (Row 3) */}
              <div className="flex-row" style={{ marginBottom: '10px', gap: '12px' }}>
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Parking Charges (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'Subtract') e.preventDefault();
                    }}
                    placeholder="e.g. 2000"
                    className="form-input"
                    value={formData.parking_charges}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                      setFormData({ ...formData, parking_charges: val });
                    }}
                    style={{ height: '36px', fontSize: '0.84rem' }}
                  />
                </div>
                {isLandlordGstRegistered ? (
                  <div className="form-group flex-1" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Tax Supply Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: formData.tax_supply_type === 'intra_state' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.tax_supply_type === 'intra_state' ? '#eff6ff' : '#ffffff',
                          color: formData.tax_supply_type === 'intra_state' ? '#1d4ed8' : '#334155',
                          fontWeight: formData.tax_supply_type === 'intra_state' ? 600 : 500,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          height: '36px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setFormData({ ...formData, tax_supply_type: 'intra_state' })}
                      >
                        <span>Intra-State</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(CGST+SGST)</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: formData.tax_supply_type === 'inter_state' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.tax_supply_type === 'inter_state' ? '#eff6ff' : '#ffffff',
                          color: formData.tax_supply_type === 'inter_state' ? '#1d4ed8' : '#334155',
                          fontWeight: formData.tax_supply_type === 'inter_state' ? 600 : 500,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          height: '36px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setFormData({ ...formData, tax_supply_type: 'inter_state' })}
                      >
                        <span>Inter-State</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(IGST)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-group flex-1" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Tax Status</label>
                    <div
                      style={{
                        height: '36px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 10px'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {formData.landlord_id ? 'Non-GST Landlord' : 'Select Landlord'}
                      </span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#047857', background: '#d1fae5', padding: '2px 7px', borderRadius: '4px' }}>
                        0% GST (Exempt)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* GST Applicable Selector (Row 4) */}
              {isLandlordGstRegistered ? (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.82rem' }}>GST Applicable (Commercial Leasing)</label>
                    <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600 }}>
                      Selected: {formData.gst_applicable ? `${formData.gst_rate}%` : '0% (Non-GST)'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: '18% (Standard)', rate: 18, applicable: true },
                      { label: '12%', rate: 12, applicable: true },
                      { label: '5%', rate: 5, applicable: true },
                      { label: '0% (Exempt)', rate: 0, applicable: false }
                    ].map((opt) => {
                      const isSelected =
                        !formData.is_custom_gst &&
                        formData.gst_applicable === opt.applicable &&
                        formData.gst_rate === opt.rate;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1d4ed8' : '#334155',
                            fontWeight: isSelected ? 600 : 500,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              gst_rate: opt.rate,
                              gst_applicable: opt.applicable,
                              is_custom_gst: false
                            })
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: formData.is_custom_gst ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                        background: formData.is_custom_gst ? '#eff6ff' : '#ffffff',
                        color: formData.is_custom_gst ? '#1d4ed8' : '#334155',
                        fontWeight: formData.is_custom_gst ? 600 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormData({ ...formData, is_custom_gst: true, gst_applicable: true })}
                    >
                      Customize GST
                    </button>
                  </div>

                  {formData.is_custom_gst && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="Enter custom GST %"
                        value={formData.gst_rate}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setFormData({ ...formData, gst_rate: val });
                        }}
                        style={{ maxWidth: '140px', height: '34px', fontSize: '0.82rem' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>%</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      GST Exemption (Non-GST Landlord)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {formData.landlord_id
                        ? `${selectedLandlord?.name || 'Selected landlord'} is not registered for GST. Tax is locked at 0%.`
                        : 'Select a landlord to determine GST registration rules.'}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', background: '#d1fae5', padding: '2px 7px', borderRadius: '4px' }}>
                    0% GST Auto-Applied
                  </span>
                </div>
              )}

              {/* Revision Reason */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.82rem' }}>Revision Reason / Remarks</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Annual rate revision, new lease term"
                  value={formData.change_reason}
                  onChange={(e) => setFormData({ ...formData, change_reason: e.target.value })}
                  style={{ height: '36px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Compact Calculation Summary Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Taxable Subtotal: <strong>₹{subtotal.toLocaleString('en-IN')}</strong> {isLandlordGstRegistered && formData.gst_applicable && gstRateNum > 0 ? `• GST (${gstRateNum}%): ₹${totalGstAmount.toLocaleString('en-IN')}` : ' • 0% GST (Exempt)'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e40af' }}>
                  Total: ₹{grandTotal.toLocaleString('en-IN')}/mo
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  style={{ height: '36px', padding: '0 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ height: '36px', padding: '0 18px', fontSize: '0.84rem' }}
                >
                  {submitting ? 'Saving...' : 'Save Rental Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Rate Revision History                                    */}
      {/* ============================================================== */}
      {historyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Rate Revision History
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div>
              {historyList.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No historical revisions found for this rate.
                </p>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setHistoryModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
