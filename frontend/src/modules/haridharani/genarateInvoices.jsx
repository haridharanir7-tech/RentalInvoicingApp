import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building, User, CheckSquare, Square, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import HaridharaniNav from './HaridharaniNav';
import './haridharani.css';

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

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (billingPeriod) {
      fetchPreviews();
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
        setPreviews(res.data.previews);
        // By default, select all items that haven't been generated yet
        const eligible = res.data.previews
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

  return (
    <div className="hd-container">
      <HaridharaniNav />

      {/* Header */}
      <div className="hd-header">
        <div>
          <h1 className="hd-title">Generate Invoices</h1>
          <p className="hd-subtitle">
            Select billing period and properties to auto-calculate base rent, recurring charges, and GST with sequential invoice numbering.
          </p>
        </div>
        <div className="hd-header-actions">
          <button
            className="hd-btn-secondary"
            onClick={() => navigate('/haridharani/invoices')}
          >
            <span>View Invoices Register</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Filter / Period Selector Bar */}
      <div className="hd-filter-bar">
        <div className="hd-filter-group">
          {/* Billing Period Selector (Task 6) */}
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <Calendar size={14} />
              <span>Billing Period (Month) *</span>
            </label>
            <input
              type="month"
              className="hd-input"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              style={{ minWidth: '170px' }}
            />
          </div>

          {/* Landlord Filter */}
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <User size={14} />
              <span>Landlord</span>
            </label>
            <select
              className="hd-select"
              value={selectedLandlord}
              onChange={(e) => {
                setSelectedLandlord(e.target.value);
                setSelectedProperty('all');
              }}
            >
              <option value="all">All Landlords</option>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.gst_registered ? '(GST Reg)' : '(Non-GST)'}
                </option>
              ))}
            </select>
          </div>

          {/* Property Filter */}
          <div className="hd-filter-item">
            <label className="hd-filter-label">
              <Building size={14} />
              <span>Property</span>
            </label>
            <select
              className="hd-select"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
            >
              <option value="all">All Properties</option>
              {filteredProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.property_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <button
            className="hd-btn-primary"
            onClick={handleGenerate}
            disabled={generating || selectedIds.length === 0}
            style={{ padding: '10px 20px', fontSize: '0.92rem' }}
          >
            <Zap size={18} />
            <span>{generating ? 'Generating Sequential Invoices...' : `Generate ${selectedIds.length} Invoice(s)`}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="hd-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {resultMessage && (
        <div className="hd-alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{resultMessage}</span>
          </div>
          <button
            className="hd-btn-secondary"
            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            onClick={() => navigate('/haridharani/invoices')}
          >
            Go to Register &rarr;
          </button>
        </div>
      )}

      {/* Auto Rent + GST Preview Table (Task 7 & 8) */}
      <div className="hd-table-card">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <span>Select All Eligible ({eligibleCount})</span>
            </button>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Period: <strong>{billingPeriod}</strong>
          </span>
        </div>

        <table className="hd-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Tenant & Landlord</th>
              <th>Property</th>
              <th>Base Rent</th>
              <th>Charges (Maint/Park)</th>
              <th>Taxable Amount</th>
              <th>GST Breakdown</th>
              <th>Total Payable</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }}>
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
              previews.map((item) => {
                const itemId = item.rate_id || `${item.tenant_id}-${item.property_id}`;
                const isSelected = selectedIds.includes(itemId);

                return (
                  <tr key={itemId} style={{ background: item.already_generated ? '#fafafa' : undefined }}>
                    <td>
                      {!item.already_generated ? (
                        <button
                          onClick={() => toggleSelectItem(itemId)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
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
                      <div style={{ fontWeight: 600 }}>{item.tenant_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Landlord: {item.landlord_name}{' '}
                        {item.landlord_gst_registered ? (
                          <span style={{ color: '#1d4ed8', fontWeight: 600 }}>(GST Reg)</span>
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
                    <td>
                      {item.already_generated ? (
                        <div>
                          <span className="hd-badge-generated">{item.existing_invoice_number}</span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            Already Generated ({item.existing_invoice_status})
                          </div>
                        </div>
                      ) : (
                        <span className="hd-badge-draft">Ready to Generate</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

