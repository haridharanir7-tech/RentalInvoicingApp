import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users } from 'lucide-react';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants')
      .then(res => setTenants(res.data.tenants))
      .catch(err => console.error('Failed to load tenants', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Tenants Master</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Tenant profiles, PAN/GSTIN, and active lease periods</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant Name</th>
              <th>Occupied Property</th>
              <th>PAN / GSTIN</th>
              <th>Contact Details</th>
              <th>Lease Period</th>
              <th>Deposit (INR)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading tenants...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No tenants found.</td></tr>
            ) : (
              tenants.map(t => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td style={{ fontWeight: 600 }}>{t.tenant_name}</td>
                  <td>{t.property_name}</td>
                  <td>
                    <div><code>PAN: {t.pan}</code></div>
                    {t.gstin && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>GSTIN: {t.gstin}</div>}
                  </td>
                  <td>
                    <div>{t.phone}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {t.lease_start_date?.slice(0, 10)} to {t.lease_end_date ? t.lease_end_date.slice(0, 10) : 'Ongoing'}
                  </td>
                  <td>INR {Number(t.security_deposit || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${t.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {t.status}
                    </span>
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
