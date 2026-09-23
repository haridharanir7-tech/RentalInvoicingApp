import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Receipt } from 'lucide-react';

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
    axios.get('/api/subhashini/properties').then(res => setProperties(res.data.properties || []));
    axios.get('/api/haridharani/tenants').then(res => setTenants(res.data.tenants || []));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/api/ragul/invoices/generate', {
        property_id: parseInt(propertyId, 10),
        tenant_id: parseInt(tenantId, 10),
        billing_period: billingPeriod
      });

      if (res.data.success) {
        setMessage(`Success! Invoice ${res.data.invoice.invoice_number} created.`);
        setTimeout(() => navigate('/invoices'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '550px' }}>
      <button onClick={() => navigate('/invoices')} className="btn btn-secondary" style={{ marginBottom: '14px' }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Generate Invoice (Ragul's Module)</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Auto-calculate rent and GST</p>

        {error && <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>{error}</div>}
        {message && <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>{message}</div>}

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Property</label>
            <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option value="">-- Choose Property --</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Tenant</label>
            <select required value={tenantId} onChange={(e) => setTenantId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <option value="">-- Choose Tenant --</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.tenant_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Billing Period</label>
            <input type="text" required value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} placeholder="Oct-2026" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
          </div>

          <button type="submit" disabled={loading} className="btn" style={{ justifyContent: 'center' }}>
            <Receipt size={15} /> {loading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </form>
      </div>
    </div>
  );
}
