import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/priyaApi';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Shield,
  Clock,
  Lock,
  Mail,
  User
} from 'lucide-react';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Landlord',
    landlord_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [resUsers, resLandlords] = await Promise.all([
        userApi.listUsers(),
        userApi.getLandlords()
      ]);
      setUsers(resUsers.data.data);
      setLandlords(resLandlords.data.data);
    } catch (err) {
      setError('Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser) => {
    setError('');
    setSuccess('');

    const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
    const confirmMsg = `Are you sure you want to ${newStatus === 'Inactive' ? 'deactivate' : 'activate'} account '${targetUser.full_name}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await userApi.updateUserStatus(targetUser.id, newStatus);
      setSuccess(res.data.message);
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        landlord_id: formData.role === 'Landlord' ? formData.landlord_id : null
      };

      const res = await userApi.createUser(payload);
      setSuccess(res.data.message);
      setShowModal(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'Landlord',
        landlord_id: ''
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.landlord_name && u.landlord_name.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            User & Role Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Create user accounts, assign roles, scope landlord access, and manage account activation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <UserPlus size={18} />
          Create User Account
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '18px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', marginBottom: '18px', fontSize: '0.85rem' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search users by name, email, role, or linked landlord..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '0.9rem',
            width: '100%',
            color: '#1e293b'
          }}
        />
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User Name & Email</th>
              <th>System Role</th>
              <th>Scope / Linked Landlord</th>
              <th>Account Status</th>
              <th>Last Login</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading user accounts...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No user accounts found matching your search.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: u.role === 'Admin' ? '#dbeafe' : '#dcfce7',
                        color: u.role === 'Admin' ? '#1e40af' : '#15803d'
                      }}>
                        <Shield size={13} />
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'Landlord' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#334155' }}>
                          <Building size={15} color="#64748b" />
                          <span>{u.landlord_name || `Landlord ID: ${u.landlord_id}`}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>All Landlords (Unrestricted)</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {u.status === 'Active' ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Current Session
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: u.status === 'Active' ? '1px solid #fca5a5' : '1px solid #86efac',
                            background: u.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                            color: u.status === 'Active' ? '#b91c1c' : '#15803d',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {filteredUsers.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} entries
        </div>
        <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
              Create New User Account
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Enter account details and role permissions. Landlords will be automatically self-scoped to their linked record.
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Email Address (Login ID) *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Initial Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Role Selection (Admin vs Landlord - honoring 'no need manager') */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  User Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Landlord">Landlord (Self-Scoped to specific owner record)</option>
                  <option value="Admin">Admin (Full administrative access across all modules)</option>
                </select>
              </div>

              {/* Conditional Linked Landlord Dropdown */}
              {formData.role === 'Landlord' && (
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', marginBottom: '5px' }}>
                    Link to Landlord Record *
                  </label>
                  <select
                    required={formData.role === 'Landlord'}
                    value={formData.landlord_id}
                    onChange={(e) => setFormData({ ...formData, landlord_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Select Landlord --</option>
                    {landlords.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} (PAN: {l.pan})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    All properties, tenants, rates, and invoices will be strictly scoped to this landlord.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Creating...' : 'Save User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

