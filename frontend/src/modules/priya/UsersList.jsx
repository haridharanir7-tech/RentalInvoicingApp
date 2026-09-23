import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/priya/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Users Management (Priya's Module)</h1>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Manage users, roles, and accounts</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{u.role}</span></td>
                  <td><span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{u.status}</span></td>
                  <td>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
