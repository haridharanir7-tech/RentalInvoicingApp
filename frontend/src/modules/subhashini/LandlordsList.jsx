import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function LandlordsList() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/subhashini/landlords')
      .then(res => setLandlords(res.data.landlords || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Landlords Master (Subhashini's Module)</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Master list of landlords, PAN, and GST details</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>PAN</th>
              <th>GST Status</th>
              <th>GSTIN</th>
              <th>Phone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : landlords.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No landlords found.</td></tr>
            ) : (
              landlords.map(l => (
                <tr key={l.id}>
                  <td>#{l.id}</td>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td><code>{l.pan}</code></td>
                  <td><span className={`badge ${l.gst_registered ? 'badge-active' : 'badge-inactive'}`}>{l.gst_registered ? 'GST' : 'Non-GST'}</span></td>
                  <td>{l.gstin || '-'}</td>
                  <td>{l.phone}</td>
                  <td>{l.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
