import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { IndianRupee } from 'lucide-react';

export default function RentalRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rental-rates')
      .then(res => setRates(res.data.rentalRates))
      .catch(err => console.error('Failed to load rental rates', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Rental Rate Configuration</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Defined rates, recurring charges, GST rules, and effective periods</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property</th>
              <th>Tenant</th>
              <th>Monthly Rent</th>
              <th>Additional Charges</th>
              <th>GST Applicable</th>
              <th>Effective Window</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading rental rates...</td></tr>
            ) : rates.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No rental rates configured.</td></tr>
            ) : (
              rates.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.property_name}</td>
                  <td>{r.tenant_name}</td>
                  <td style={{ fontWeight: 600, color: '#0f766e' }}>
                    INR {Number(r.monthly_rent).toLocaleString()}
                  </td>
                  <td>INR {Number(r.additional_charges || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${r.gst_applicable ? 'badge-active' : 'badge-inactive'}`}>
                      {r.gst_applicable ? `Yes (${r.gst_rate}%)` : 'No GST'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {r.effective_from?.slice(0, 10)} {r.effective_to ? `to ${r.effective_to.slice(0, 10)}` : '(Active)'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.remarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
