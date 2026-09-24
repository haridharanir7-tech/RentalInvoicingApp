import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building, User, CheckSquare, Square, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/haridharani';

export default function GenerateInvoices() {
  const navigate = useNavigate();

  const [billingPeriod, setBillingPeriod] = useState('2026-09');
  const [selectedLandlord, setSelectedLandlord] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState('all');

  const [landlords, setLandlords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (billingPeriod) {
      fetchPreviews();
      setPage(1);
    }
  }, [billingPeriod, selectedLandlord, selectedProperty]);

  const fetchMasterData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/properties-tenants`);
      if (res.data.success) {
        setLandlords(res.data.landlords || []);
        setProperties(res.data.properties || []);
      }
    } catch (err) {
      console.error('Error fetching master filters', err);
    }
  };

  const fetchPreviews = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setResultMessage(null);

      const res = await axios.post(`${API_BASE}/invoices/preview`, {
        billing_period: billingPeriod,
        landlord_id: selectedLandlord,
        property_id: selectedProperty
      });

      if (res.data.success) {
        setPreviews(res.data.previews || []);
        // By default, select all items that haven't been generated yet
        const eligible = (res.data.previews || [])
          .filter((p) => !p.already_generated)
          .map((p) => p.rate_id || `${p.tenant_id}-${p.property_id}`);
        setSelectedIds(eligible);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to fetch invoice preview calculations');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const eligible = previews
      .filter((p) => !p.already_generated)
      .map((p) => p.rate_id || `${p.tenant_id}-${p.property_id}`);

    if (selectedIds.length === eligible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligible);
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage('Please select at least one tenant to generate an invoice for.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMessage('');
      setResultMessage(null);

      const itemsToGenerate = previews.filter((p) =>
        selectedIds.includes(p.rate_id || `${p.tenant_id}-${p.property_id}`)
      );

      const res = await axios.post(`${API_BASE}/invoices/generate`, {
        billing_period: billingPeriod,
        items: itemsToGenerate
      });

      if (res.data.success) {
        setResultMessage(res.data.message);
        fetchPreviews(); // refresh preview list
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to generate invoices.');
    } finally {
      setGenerating(false);
    }
  };

  // Filter properties by selected landlord if specific landlord chosen
  const filteredProperties =
    selectedLandlord === 'all'
      ? properties
      : properties.filter((p) => String(p.landlord_id) === String(selectedLandlord));

  const eligibleCount = previews.filter((p) => !p.already_generated).length;

  const totalPages = Math.ceil(previews.length / pageSize) || 1;
  const paginatedPreviews = previews.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Generate Invoices</h2>
          <p className="page-subtitle">
            Generate monthly rental invoices for properties and tenants
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating || selectedIds.length === 0}
            style={{ padding: '9px 18px' }}
          >
            <Zap size={16} />
            <span>{generating ? 'Generating Invoices...' : `Generate ${selectedIds.length} Invoice(s)`}</span>
          </button>
        </div>
      </div>

      {/* Filter / Period Selector Bar aligned same as Landlord & Property */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Billing Month:</span>
            <input
              type="month"
              className="form-input"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              style={{ width: '160px' }}
            />
          </div>

          <select
            className="form-input"
            value={selectedLandlord}
            onChange={(e) => {
              setSelectedLandlord(e.target.value);
              setSelectedProperty('all');
            }}
            style={{ width: '200px' }}
          >
            <option value="all">All Landlords</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.gst_registered ? '(GST Reg)' : '(Non-GST)'}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All Properties</option>
            {filteredProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.property_type})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSelectedLandlord('all');
              setSelectedProperty('all');
            }}
            style={{ background: '#f1f5f9' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {resultMessage && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{resultMessage}</span>
          </div>
          <button
            className="btn btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
            onClick={() => navigate('/admin/invoices')}
          >
            Go to Invoices &rarr;
          </button>
        </div>
      )}

      {/* Auto Rent + GST Preview Table */}
      <div className="table-container">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleSelectAll}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}
              disabled={eligibleCount === 0}
            >
              {selectedIds.length > 0 && selectedIds.length === eligibleCount ? (
                <CheckSquare size={18} color="#2563eb" />
              ) : (
                <Square size={18} color="#94a3b8" />
              )}
              <span style={{ fontSize: '0.84rem' }}>Select All Eligible ({eligibleCount})</span>
            </button>
          </div>
          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Billing Period: <strong>{billingPeriod}</strong>
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}></th>
              <th>Tenant & Landlord</th>
              <th>Property</th>
              <th>Base Rent</th>
              <th>Charges (Maint/Park)</th>
              <th>Taxable Amount</th>
              <th>GST Breakdown</th>
              <th>Total Payable</th>
              <th style={{ textAlign: 'center', width: '150px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  Calculating rent, additional charges, and GST...
                </td>
              </tr>
            ) : previews.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No active rental rates found for the selected criteria. Please configure rental rates first.
                </td>
              </tr>
            ) : (
              paginatedPreviews.map((item) => {
                const itemId = item.rate_id || `${item.tenant_id}-${item.property_id}`;
                const isSelected = selectedIds.includes(itemId);

                return (
                  <tr key={itemId} style={{ background: item.already_generated ? '#fafafa' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      {!item.already_generated ? (
                        <button
                          onClick={() => toggleSelectItem(itemId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', margin: '0 auto' }}
                        >
                          {isSelected ? (
                            <CheckSquare size={18} color="#2563eb" />
                          ) : (
                            <Square size={18} color="#94a3b8" />
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tenant_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Landlord: {item.landlord_name}{' '}
                        {item.landlord_gst_registered ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>(GST Reg)</span>
                        ) : (
                          <span style={{ color: '#b91c1c' }}>(Non-GST)</span>
                        )}
                      </div>
                    </td>
                    <td>{item.property_name}</td>
                    <td style={{ fontWeight: 500 }}>
                      ₹{parseFloat(item.rent_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      ₹{parseFloat(item.additional_charges).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{parseFloat(item.taxable_amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {item.gst_amount > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#2563eb' }}>
                            ₹{parseFloat(item.gst_amount).toLocaleString('en-IN')}{' '}
                            <span style={{ fontSize: '0.75rem' }}>({item.gst_rate}%)</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {item.tax_supply_type === 'inter_state'
                              ? `IGST: ₹${parseFloat(item.igst_amount).toLocaleString('en-IN')}`
                              : `CGST: ₹${parseFloat(item.cgst_amount).toLocaleString('en-IN')} + SGST: ₹${parseFloat(item.sgst_amount).toLocaleString('en-IN')}`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>₹0.00 (Exempt)</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e40af' }}>
                      ₹{parseFloat(item.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.already_generated ? (
                        <div>
                          <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                            {item.existing_invoice_number}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            Generated ({item.existing_invoice_status})
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          Ready to Generate
                        </span>
                      )}
                    </td>
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
          Showing {previews.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, previews.length)} of {previews.length} item
          {previews.length !== 1 ? 's' : ''}
        </div>
        {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
}
