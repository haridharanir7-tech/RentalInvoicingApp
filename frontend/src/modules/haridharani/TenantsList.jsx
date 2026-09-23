import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/haridharani/tenants')
      .then(res => setTenants(res.data.tenants || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Tenants Master (Haridharani's Module)</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Tenant profiles and occupied property units</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant Name</th>
              <th>Property</th>
              <th>PAN / GSTIN</th>
              <th>Contact</th>
              <th>Deposit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No tenants found.</td></tr>
            ) : (
              tenants.map(t => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td style={{ fontWeight: 600 }}>{t.tenant_name}</td>
                  <td>{t.property_name}</td>
                  <td>
                    <div>PAN: {t.pan}</div>
                    {t.gstin && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>GSTIN: {t.gstin}</div>}
                  </td>
                  <td>{t.phone}</td>
                  <td>INR {Number(t.security_deposit || 0).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
