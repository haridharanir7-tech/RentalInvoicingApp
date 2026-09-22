import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Receipt, CheckCircle, ArrowLeft } from 'lucide-react';

export default function GenerateInvoice() {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('Oct-2026');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/properties').then(res => setProperties(res.data.properties || []));
    api.get('/tenants').then(res => setTenants(res.data.tenants || []));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/invoices/generate', {
        property_id: parseInt(propertyId, 10),
        tenant_id: parseInt(tenantId, 10),
        billing_period: billingPeriod
      });

      if (res.data.success) {
        setMessage(`Invoice generated successfully: ${res.data.invoice.invoice_number}`);
        setTimeout(() => navigate('/invoices'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice. Ensure an active rate is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <button onClick={() => navigate('/invoices')} className="btn btn-secondary" style={{ marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to Invoices
      </button>

      <div className="card">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Generate Monthly Invoice</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
          Select the property, tenant, and billing cycle. Rent and applicable GST will be auto-calculated.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ padding: '10px 14px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Select Property
            </label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="">-- Choose Property --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.property_name} ({p.landlord_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Select Tenant
            </label>
            <select
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="">-- Choose Tenant --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.tenant_name} (Unit: {t.property_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Billing Period (Month-Year)
            </label>
            <input
              type="text"
              required
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder="e.g. Oct-2026"
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn" style={{ justifyContent: 'center', marginTop: '8px' }}>
            <Receipt size={16} />
            {loading ? 'Calculating & Generating...' : 'Generate Invoice Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
