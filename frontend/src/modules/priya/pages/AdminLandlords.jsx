import React, { useState, useEffect } from 'react';
import { adminLandlordApi } from '../services/priyaApi';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  FileText,
  Copy,
  Check
} from 'lucide-react';

export default function AdminLandlords() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, PENDING, ACTIVE, INACTIVE

  // Modal States
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);

  // Grant Access Form
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [generatedTempPass, setGeneratedTempPass] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingAccess, setSubmittingAccess] = useState(false);

  const fetchLandlords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminLandlordApi.getLandlords();
      if (res.data.success) {
        setLandlords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load landlords:', err);
      setError(err.response?.data?.message || 'Failed to retrieve landlords from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandlords();
  }, []);

  // Status Update (Approve / Activate / Deactivate)
  const handleStatusChange = async (landlordId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminLandlordApi.updateStatus(landlordId, newStatus);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        fetchLandlords();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update landlord status.');
    }
  };

  // Open Grant Access Modal
  const openAccessModal = (landlord) => {
    setSelectedLandlord(landlord);
    setAccessEmail(landlord.email || landlord.landlord_email || '');
    // Generate secure 10-char random temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAccessPassword(pass);
    setGeneratedTempPass('');
    setCopied(false);
    setAccessModalOpen(true);
  };

  // Submit Grant Access / Create Login Account
  const handleGrantAccessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLandlord) return;

    setSubmittingAccess(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminLandlordApi.createAccess(selectedLandlord.id, {
        email: accessEmail,
        password: accessPassword
      });

      if (res.data.success) {
        setGeneratedTempPass(res.data.data.temp_password);
        setSuccessMsg(`Login credentials generated for ${selectedLandlord.name}.`);
        fetchLandlords();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create landlord login credentials.');
    } finally {
      setSubmittingAccess(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered Landlords list
  const filteredLandlords = landlords.filter((l) => {
    const matchesSearch =
      (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.pan || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.contact_details || '').includes(search);

    const statusUpper = (l.status || '').toUpperCase();
    if (filterTab === 'PENDING') return matchesSearch && statusUpper === 'PENDING';
    if (filterTab === 'ACTIVE') return matchesSearch && statusUpper === 'ACTIVE';
    if (filterTab === 'INACTIVE') return matchesSearch && statusUpper === 'INACTIVE';
    return matchesSearch;
  });

  const pendingCount = landlords.filter((l) => (l.status || '').toUpperCase() === 'PENDING').length;

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
              ADMIN ACCESS CONTROL
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Landlord Directory & Access Management
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Connected directly to Subhashini's `landlords` table in Supabase PostgreSQL
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchLandlords}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          color: '#b91c1c',
          marginBottom: '20px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#15803d',
          marginBottom: '20px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controls: Filter Tabs & Search */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'ALL', label: 'All Landlords', count: landlords.length },
            { id: 'PENDING', label: 'Pending Approvals', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'ACTIVE', label: 'Active', count: landlords.filter(l => (l.status || '').toUpperCase() === 'ACTIVE').length },
            { id: 'INACTIVE', label: 'Inactive', count: landlords.filter(l => (l.status || '').toUpperCase() === 'INACTIVE').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: filterTab === tab.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: filterTab === tab.id ? '#eff6ff' : '#ffffff',
                color: filterTab === tab.id ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: tab.highlight ? '#fef3c7' : filterTab === tab.id ? '#dbeafe' : '#f1f5f9',
                color: tab.highlight ? '#d97706' : filterTab === tab.id ? '#1e40af' : '#64748b',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by name, email, PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Landlords Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Landlord Name</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Contact Info</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Tax Details</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Properties</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Account Status</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading landlords from Supabase...
                  </td>
                </tr>
              ) : filteredLandlords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No landlords matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLandlords.map((l) => {
                  const statusUpper = (l.status || '').toUpperCase();
                  const isPending = statusUpper === 'PENDING';
                  const isActive = statusUpper === 'ACTIVE';
                  const isInactive = statusUpper === 'INACTIVE';
                  const hasUserAccount = !!l.user_id || !!l.email;

                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>
                        #{l.id}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{l.name}</div>
                        {l.user_name && l.user_name !== l.name && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>User: {l.user_name}</div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#1e293b', fontSize: '0.82rem' }}>{l.email || l.landlord_email || 'No email registered'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{l.contact_details || 'No phone'}</div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155' }}>PAN: <strong>{l.pan || 'N/A'}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GSTIN: {l.gstin || 'None'}</div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}>
                          {l.property_count || 0}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background:
                            isPending ? '#fef3c7' :
                            isActive ? '#dcfce7' : '#fee2e2',
                          color:
                            isPending ? '#b45309' :
                            isActive ? '#15803d' : '#991b1b'
                        }}>
                          {isPending && <Clock size={12} />}
                          {isActive && <CheckCircle size={12} />}
                          {isInactive && <XCircle size={12} />}
                          {l.status || 'INACTIVE'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Pending -> Grant Access / Approve */}
                          {isPending && (
                            <button
                              onClick={() => handleStatusChange(l.id, 'ACTIVE')}
                              title="Approve & Grant Login Access"
                              style={{
                                padding: '5px 12px',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <ShieldCheck size={13} />
                              Approve
                            </button>
                          )}

                          {/* Active -> Deactivate */}
                          {isActive && (
                            <button
                              onClick={() => handleStatusChange(l.id, 'INACTIVE')}
                              title="Deactivate account access"
                              style={{
                                padding: '5px 10px',
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Inactive -> Activate */}
                          {isInactive && (
                            <button
                              onClick={() => handleStatusChange(l.id, 'ACTIVE')}
                              title="Reactivate account"
                              style={{
                                padding: '5px 10px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Activate
                            </button>
                          )}

                          {/* Create Login / Reset Credentials button */}
                          <button
                            onClick={() => openAccessModal(l)}
                            title="Manage Login Credentials"
                            style={{
                              padding: '5px 8px',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <KeyRound size={13} />
                            Credentials
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedLandlord(l);
                              setViewModalOpen(true);
                            }}
                            title="View Full Profile"
                            style={{
                              padding: '5px 8px',
                              background: '#f8fafc',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: View Landlord Details */}
      {viewModalOpen && selectedLandlord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '540px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>LANDLORD PROFILE</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedLandlord.name}
                </h2>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Landlord ID:</span>
                <strong>#{selectedLandlord.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <strong style={{
                  color: selectedLandlord.status === 'ACTIVE' ? '#16a34a' :
                         selectedLandlord.status === 'PENDING' ? '#d97706' : '#dc2626'
                }}>
                  {selectedLandlord.status}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Login Email:</span>
                <strong>{selectedLandlord.email || selectedLandlord.landlord_email || 'Not configured'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Phone:</span>
                <strong>{selectedLandlord.contact_details || 'Not provided'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>PAN:</span>
                <strong>{selectedLandlord.pan || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>GSTIN:</span>
                <strong>{selectedLandlord.gstin || 'None'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Properties Owned:</span>
                <strong>{selectedLandlord.property_count || 0} unit(s)</strong>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setViewModalOpen(false)}
                style={{
                  padding: '8px 20px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Grant Access / Manage Credentials */}
      {accessModalOpen && selectedLandlord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>LOGIN ACCESS CONTROL</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  Enable Login Access: {selectedLandlord.name}
                </h2>
              </div>
              <button
                onClick={() => setAccessModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {generatedTempPass ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <CheckCircle size={28} color="#16a34a" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d', margin: '0 0 8px 0' }}>
                  Credentials Generated!
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
                  The landlord account is now <strong>ACTIVE</strong>. Share these temporary credentials with the landlord.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Email:</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{accessEmail}</div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Temporary Password:</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                    <code style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb' }}>{generatedTempPass}</code>
                    <button
                      onClick={() => copyToClipboard(generatedTempPass)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setAccessModalOpen(false)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGrantAccessSubmit}>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
                  Provide an email address and temporary password. The landlord will use these credentials on the common login page to access their dashboard.
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Landlord Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={accessEmail}
                    onChange={(e) => setAccessEmail(e.target.value)}
                    placeholder="landlord@company.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      Secure Temporary Password *
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Auto-generated random</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAccessModalOpen(false)}
                    style={{
                      padding: '9px 16px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.84rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAccess}
                    style={{
                      padding: '9px 18px',
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: submittingAccess ? 'not-allowed' : 'pointer',
                      fontSize: '0.84rem'
                    }}
                  >
                    {submittingAccess ? 'Authorizing...' : 'Grant Access & Activate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

