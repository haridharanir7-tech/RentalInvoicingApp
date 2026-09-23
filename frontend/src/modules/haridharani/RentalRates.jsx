import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function RentalRates() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/haridharani/rental-rates')
      .then(res => setRates(res.data.rentalRates || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Rental Rates (Haridharani's Module)</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Monthly rent, recurring charges, and GST rules</p>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : rates.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No rates found.</td></tr>
            ) : (
              rates.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.property_name}</td>
                  <td>{r.tenant_name}</td>
                  <td style={{ fontWeight: 600, color: '#0f766e' }}>INR {Number(r.monthly_rent).toLocaleString()}</td>
                  <td>INR {Number(r.additional_charges || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${r.gst_applicable ? 'badge-active' : 'badge-inactive'}`}>
                      {r.gst_applicable ? `Yes (${r.gst_rate}%)` : 'No'}
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
