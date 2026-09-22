import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building, Plus } from 'lucide-react';

export default function LandlordsList() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/landlords')
      .then(res => setLandlords(res.data.landlords))
      .catch(err => console.error('Failed to load landlords', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Landlords Master</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Registered landlords, PAN, GST status, and billing details</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Landlord / Business Name</th>
              <th>PAN</th>
              <th>GST Status</th>
              <th>GSTIN</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Loading landlords...</td></tr>
            ) : landlords.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>No landlords registered.</td></tr>
            ) : (
              landlords.map(l => (
                <tr key={l.id}>
                  <td>#{l.id}</td>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td><code>{l.pan}</code></td>
                  <td>
                    <span className={`badge ${l.gst_registered ? 'badge-active' : 'badge-inactive'}`}>
                      {l.gst_registered ? 'GST Registered' : 'Non-GST'}
                    </span>
                  </td>
                  <td>{l.gstin || '-'}</td>
                  <td>{l.phone}</td>
                  <td>{l.email}</td>
                  <td>
                    <span className={`badge ${l.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {l.status}
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
