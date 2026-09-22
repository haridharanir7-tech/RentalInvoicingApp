import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers } from 'lucide-react';

export default function PropertiesList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties')
      .then(res => setProperties(res.data.properties))
      .catch(err => console.error('Failed to load properties', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Properties Master</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Commercial & residential properties linked to landlords</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property Name</th>
              <th>Type</th>
              <th>Owning Landlord</th>
              <th>Area (sq. ft.)</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading properties...</td></tr>
            ) : properties.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No properties found.</td></tr>
            ) : (
              properties.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.property_name}</td>
                  <td>
                    <span className="badge" style={{ background: p.property_type === 'Commercial' ? '#fef3c7' : '#e0f2fe', color: p.property_type === 'Commercial' ? '#92400e' : '#0369a1' }}>
                      {p.property_type}
                    </span>
                  </td>
                  <td>{p.landlord_name}</td>
                  <td>{p.area_sqft ? `${Number(p.area_sqft).toLocaleString()} sq.ft.` : '-'}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{p.address}</td>
                  <td>
                    <span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {p.status}
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
