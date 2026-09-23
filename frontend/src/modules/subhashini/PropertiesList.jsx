import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PropertiesList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/subhashini/properties')
      .then(res => setProperties(res.data.properties || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Properties Master (Subhashini's Module)</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Commercial and residential properties</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Property Name</th>
              <th>Type</th>
              <th>Landlord</th>
              <th>Area</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : properties.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No properties found.</td></tr>
            ) : (
              properties.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.property_name}</td>
                  <td>{p.property_type}</td>
                  <td>{p.landlord_name}</td>
                  <td>{p.area_sqft ? `${p.area_sqft} sq.ft.` : '-'}</td>
                  <td>{p.address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
