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
  Check,
  Plus,
  X,
  Edit,
  Trash2
} from 'lucide-react';

export default function AdminLandlords() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, PENDING, ACTIVE, INACTIVE

  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal States
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addingLandlord, setAddingLandlord] = useState(false);
  const [templatesList, setTemplatesList] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [addFormData, setAddFormData] = useState({
    id: null,
    name: '',
    email: '',
    pan: '',
    gstin: '',
    contact_details: '',
    billing_address: '',
    gst_registered: false,
    default_invoice_template: '',
    is_active: true
  });

  // Grant Access Form
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [generatedTempPass, setGeneratedTempPass] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingAccess, setSubmittingAccess] = useState(false);

  const handleAddLandlordSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.name.trim()) {
      setError('Landlord name is required.');
      return;
    }

    // Contact Phone validation: must be digits only and exactly 10 digits
    const cleanPhone = (addFormData.contact_details || '').trim();
    if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) {
      setError('Contact Phone must be exactly 10 digits (numbers only, no alphabets or special characters).');
      return;
    }

    // PAN validation: 10 characters structure (5 letters, 4 numbers, 1 letter)
    const cleanPan = (addFormData.pan || '').trim().toUpperCase();
    if (cleanPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      setError('Invalid PAN format (must be 5 letters, 4 numbers, 1 letter. e.g., ABCDE1234F).');
      return;
    }

    // GSTIN validation: alphanumeric characters
    if (addFormData.gst_registered && !addFormData.gstin.trim()) {
      setError('GSTIN is required when GST Registered Entity is checked.');
      return;
    }

    const cleanGstin = (addFormData.gstin || '').trim().toUpperCase();
    if (cleanGstin) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/.test(cleanGstin)) {
        setError('Invalid GSTIN format. Must be 15 characters: 2 digits, PAN, 1 digit, 1 letter, 1 digit.');
        return;
      }
      const gstinPan = cleanGstin.substring(2, 12);
      if (cleanPan && gstinPan !== cleanPan) {
        setError('The PAN inside the GSTIN must match the entered PAN.');
        return;
      }
    }

    setAddingLandlord(true);
    setError('');
    setSuccessMsg('');
    try {
      const isEdit = !!addFormData.id;
      const url = isEdit ? `/api/master-data/landlords/${addFormData.id}` : '/api/master-data/landlords';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addFormData,
          name: addFormData.name.trim(),
          email: addFormData.email ? addFormData.email.trim() : null,
          pan: addFormData.pan ? addFormData.pan.trim().toUpperCase() : '',
          gstin: addFormData.gstin ? addFormData.gstin.trim().toUpperCase() : '',
          contact_details: addFormData.contact_details ? addFormData.contact_details.trim() : ''
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEdit ? 'Failed to update landlord' : 'Failed to create landlord'));
      }
      // setSuccessMsg(isEdit ? `Landlord "${addFormData.name}" updated successfully.` : `Landlord "${addFormData.name}" added successfully.`);
      setAddModalOpen(false);
      const defaultTpl = templatesList.find((t) => t.isDefault) || templatesList[0];
      setAddFormData({
        id: null,
        name: '', email: '', pan: '', gstin: '', contact_details: '',
        billing_address: '', gst_registered: false,
        default_invoice_template: defaultTpl ? defaultTpl.id : '',
        is_active: true
      });
      fetchLandlords();
    } catch (err) {
      setError(err.message || 'Failed to add landlord.');
    } finally {
      setAddingLandlord(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/ragul/templates');
      if (res.ok) {
        const json = await res.json();
        const tpls = json.data || [];
        setTemplatesList(tpls);
        if (tpls.length > 0) {
          const def = tpls.find((t) => t.isDefault) || tpls[0];
          setAddFormData((prev) => ({
            ...prev,
            default_invoice_template: prev.default_invoice_template || def.id
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load invoice templates from database:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

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
      setError(err.response?.data?.message || 'Failed to retrieve landlords.');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchLandlords();
    fetchTemplates();
  }, []);

  // Status Update (Approve / Activate / Deactivate)
  const handleStatusChange = async (landlordId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminLandlordApi.updateStatus(landlordId, newStatus);
      if (res.data.success) {
        alert(res.data.message || 'Status updated successfully!');
          fetchLandlords();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update landlord status.');
    }
  };

  // Open Grant Access Modal
  const openAccessModal = (landlord) => {
    setSelectedLandlord(landlord);
    setAccessEmail(landlord.email || landlord.landlord_email || '');
    setAccessPassword('Welcome@123');
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
        setAccessModalOpen(false);
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
    const searchVal = appliedSearch.toLowerCase();
    const matchesSearch =
      (l.name || '').toLowerCase().includes(searchVal) ||
      (l.email || '').toLowerCase().includes(searchVal) ||
      (l.pan || '').toLowerCase().includes(searchVal) ||
      (l.contact_details || '').includes(appliedSearch);

    const statusUpper = (l.status || '').toUpperCase();
    if (filterTab === 'PENDING') return matchesSearch && statusUpper === 'PENDING';
    if (filterTab === 'ACTIVE') return matchesSearch && statusUpper === 'ACTIVE';
    if (filterTab === 'INACTIVE') return matchesSearch && statusUpper === 'INACTIVE';
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredLandlords.length / pageSize) || 1;
  const paginatedLandlords = filteredLandlords.slice((page - 1) * pageSize, page * pageSize);

  const pendingCount = landlords.filter((l) => (l.status || '').toUpperCase() === 'PENDING').length;

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Landlords</h2>
          <p className="page-subtitle">Manage landlord profiles, tax credentials, and access</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              const def = templatesList.find((t) => t.isDefault) || templatesList[0];
              setAddFormData({
                id: null,
                name: '',
                email: '',
                pan: '',
                gstin: '',
                contact_details: '',
                billing_address: '',
                gst_registered: false,
                default_invoice_template: def ? def.id : '',
                is_active: true
              });
              setAddModalOpen(true);
              setError('');
              setSuccessMsg('');
              fetchTemplates();
            }}
          >
            + Add Landlord
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
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Dismiss error"
          >
            ×
          </button>
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
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter / Search Bar matching Property & Tenant modules */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search); setPage(1); }} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search landlord, email, PAN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>
          <select 
            className="form-input" 
            value={filterTab} 
            onChange={(e) => { setFilterTab(e.target.value); setPage(1); }}
            style={{ 
              width: '130px',
              padding: '8px 30px 8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#fff',
              color: '#0f172a',
              fontSize: '14px',
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); setAppliedSearch(''); setFilterTab('ALL'); setPage(1); }} style={{ background: '#f1f5f9', marginLeft: '10px' }}>Clear</button>
        </div>
      </div>

      {/* Landlords Table Container */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Landlord Name</th>
              <th>Contact Info</th>
              <th>Tax Details</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Properties</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '220px' }}>Actions</th>
            </tr>
          </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Loading landlords...
                  </td>
                </tr>
              ) : filteredLandlords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No landlords matching the filter.
                  </td>
                </tr>
              ) : (
                paginatedLandlords.map((l) => {
                  const statusUpper = (l.status || '').toUpperCase();
                  const isPending = statusUpper === 'PENDING';
                  const isActive = statusUpper === 'ACTIVE';
                  const isInactive = statusUpper === 'INACTIVE';
                  const hasUserAccount = !!l.user_id || !!l.email;

                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        {l.id}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{l.name}</div>
                        
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div 
                          title={l.email || l.landlord_email || ''} 
                          style={{ 
                            color: '#1e293b', 
                            fontSize: '0.82rem',
                            maxWidth: '150px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {l.email || l.landlord_email || 'No email registered'}
                        </div>
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

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>


                          {/* Create Login / Reset Credentials button */}
                          <button
                            onClick={() => openAccessModal(l)}
                            title="Manage Login Credentials"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #dbeafe',
                              background: '#eff6ff',
                              color: '#2563eb',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <KeyRound size={13} />
                            Credentials
                          </button>

                            {/* Edit */}
                            <button title="Edit" onClick={() => {
                                setAddFormData({
                                  id: l.id,
                                  name: l.name || '',
                                  email: l.email || l.landlord_email || '',
                                  pan: l.pan || '',
                                  gstin: l.gstin || '',
                                  contact_details: l.contact_details || '',
                                  billing_address: l.billing_address || l.address || 'Fallback Test Address',
                                  gst_registered: !!l.gst_registered,
                                  default_invoice_template: l.default_invoice_template || templatesList[0]?.id || '',
                                  is_active: (l.status || '').toUpperCase() === 'ACTIVE'
                                });
                                setError('');
                                setSuccessMsg('');
                                fetchTemplates();
                                setAddModalOpen(true);
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}><Edit size={13} /> Edit</button>

                            {/* Delete */}
                            <button title="Delete" onClick={async () => {
                              if(window.confirm('Are you sure you want to delete this landlord?')) {
                                try {
                                  await fetch('/api/master-data/landlords/' + l.id, { method: 'DELETE' });
                                  fetchLandlords();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}><Trash2 size={13} /> Delete</button>


                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedLandlord(l);
                              setViewModalOpen(true);
                            }}
                            title="View Details"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '30px',
                              height: '30px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              color: '#475569',
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

        {/* Pagination container matching other modules */}
        <div className="pagination-container">
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Showing {filteredLandlords.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredLandlords.length)} of {filteredLandlords.length} landlord{filteredLandlords.length !== 1 ? 's' : ''} ({landlords.length} total)
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={page <= 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button 
              className="page-btn" 
              disabled={page >= totalPages || totalPages <= 1} 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
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
                <strong>{selectedLandlord.id}</strong>
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

            {selectedLandlord.user_id ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <XCircle size={28} color="#dc2626" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 8px 0' }}>
                  Login Access Active
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
                  This landlord currently has an active login account. You can remove their access below.
                </p>
                <button
                  onClick={async () => {
                    if(window.confirm('Are you sure you want to remove login access for this landlord?')) {
                      try {
                        await adminLandlordApi.removeAccess(selectedLandlord.id);
                        fetchLandlords();
                        setAccessModalOpen(false);
                      } catch (e) {
                        alert('Failed to remove access');
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Remove Access
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
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Default password</span>
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

      {/* Add Landlord Modal */}
      {addModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {addFormData.id ? 'Edit Landlord' : 'Add New Landlord'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setAddModalOpen(false); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                color: '#b91c1c',
                marginBottom: '16px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b91c1c',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleAddLandlordSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Landlord / Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    placeholder="landlord@example.com"
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={addFormData.contact_details}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddFormData({ ...addFormData, contact_details: cleanVal });
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    {addFormData.contact_details && (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600,
                        color: addFormData.contact_details.length === 10 ? '#16a34a' : '#e11d48' 
                      }}>
                        {addFormData.contact_details.length}/10 digits
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={addFormData.pan}
                    onChange={(e) => {
                      const cleanPan = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                      setAddFormData({ ...addFormData, pan: cleanPan });
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}"
                    title="Must be 5 letters, 4 numbers, and 1 letter (e.g., ABCDE1234F)"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    GSTIN {addFormData.gst_registered && <span style={{ color: '#e11d48' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!addFormData.gst_registered}
                    value={addFormData.gstin}
                    onChange={(e) => {
                      const cleanGstin = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                      setAddFormData({ ...addFormData, gstin: cleanGstin });
                    }}
                    placeholder="33ABCDE1234F1Z5"
                    maxLength={15}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase',
                      background: !addFormData.gst_registered ? '#f1f5f9' : '#fff'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    {addFormData.gstin && (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: 600,
                        color: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/.test(addFormData.gstin) ? '#16a34a' : '#e11d48' 
                      }}>
                        {/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/.test(addFormData.gstin) ? 'Valid GSTIN' : `${addFormData.gstin.length} chars`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={addFormData.gst_registered}
                    onChange={(e) => setAddFormData({ ...addFormData, gst_registered: e.target.checked })}
                  />
                  GST Registered Entity
                </label>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Billing Address
                </label>
                <textarea
                  value={addFormData.billing_address}
                  onChange={(e) => setAddFormData({ ...addFormData, billing_address: e.target.value })}
                  placeholder="Street, City, State, PIN"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Default Invoice Template {loadingTemplates ? '(Fetching from database...)' : ''}
                </label>
                <select
                  value={addFormData.default_invoice_template}
                  onChange={(e) => setAddFormData({ ...addFormData, default_invoice_template: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                  required
                >
                  {templatesList.length === 0 && (
                    <option value="">{loadingTemplates ? 'Loading templates from database...' : 'No templates found'}</option>
                  )}
                  {templatesList.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                  {addFormData.default_invoice_template && !templatesList.some((t) => t.id === addFormData.default_invoice_template) && (
                    <option value={addFormData.default_invoice_template}>
                      {addFormData.default_invoice_template} (Current)
                    </option>
                  )}
                </select>
              </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select
                    value={addFormData.is_active ? 'Active' : 'Inactive'}
                    onChange={(e) => setAddFormData({ ...addFormData, is_active: e.target.value === 'Active' })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setError(''); }}
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
                  disabled={addingLandlord}
                  style={{
                    padding: '9px 20px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: addingLandlord ? 'not-allowed' : 'pointer',
                    fontSize: '0.84rem'
                  }}
                >
                  {addingLandlord ? 'Saving...' : (addFormData.id ? 'Save Landlord' : 'Add Landlord')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

