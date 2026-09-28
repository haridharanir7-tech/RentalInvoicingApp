import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../priya/context/AuthContext';
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function PropertyManagement() {
  const { user, isLandlord } = useAuth();
  const [properties, setProperties] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [formData, setFormData] = useState({
    landlord_id: isLandlord ? user.landlord_id : '', name: '', address: '', property_type: 'Commercial', total_area: '', is_active: true, property_document: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLandlordsForDropdown();
  }, []);

  useEffect(() => {
    fetchProperties(page, searchQuery, statusFilter);
  }, [page, statusFilter]);

  const fetchLandlordsForDropdown = async () => {
    try {
      const res = await fetch('/api/master-data/landlords?limit=1000&status=active');
      if (res.ok) {
        const data = await res.json();
        setLandlords(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching landlords:', err);
    }
  };

  const fetchProperties = async (overridePage = page, overrideSearch = searchQuery, overrideStatus = statusFilter) => {
    try {
      const url = `/api/master-data/properties?page=${overridePage}&limit=5&search=${encodeURIComponent(overrideSearch)}&status=${overrideStatus}${isLandlord ? '&landlord_id=' + user.landlord_id : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      setProperties(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProperties(1, searchQuery, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(1);
    fetchProperties(1, '', '');
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({ ...formData, [name]: type === 'file' ? files[0] : value });
  };

  const handleEdit = (property) => {
    setFormData({
      landlord_id: property.landlord_id || (isLandlord ? user.landlord_id : ''),
      name: property.name || '',
      address: property.address || '',
      property_type: property.property_type || 'Commercial',
      total_area: property.total_area !== null && property.total_area !== undefined ? property.total_area : '',
      is_active: property.is_active !== false,
      property_document: null
    });
    setEditingId(property.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    
    try {
      const res = await fetch(`/api/master-data/properties/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete property');
      fetchProperties();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return setError('Property Name is required');
    }
    if (!formData.landlord_id) {
      return setError('Landlord is required');
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const url = editingId 
        ? `/api/master-data/properties/${editingId}` 
        : '/api/master-data/properties';
      const method = editingId ? 'PUT' : 'POST';

      const formDataToSend = new FormData();
      formDataToSend.append('landlord_id', parseInt(formData.landlord_id, 10));
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('property_type', formData.property_type || 'Commercial');
      if (formData.total_area && formData.total_area !== '') {
        formDataToSend.append('total_area', parseFloat(formData.total_area));
      }
      formDataToSend.append('is_active', formData.is_active !== false);
      if (formData.property_document) {
        formDataToSend.append('property_document', formData.property_document);
      }

      const res = await fetch(url, {
        method,
        body: formDataToSend
      });
      
      if (!res.ok) {
        let errMessage = editingId ? 'Failed to update property' : 'Failed to create property';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }
      
      setSuccess(editingId ? 'Property updated successfully!' : 'Property created successfully!');
      setFormData({ landlord_id: isLandlord ? user.landlord_id : '', name: '', address: '', property_type: 'Commercial', total_area: '', is_active: true, property_document: null });
      setEditingId(null);
      fetchProperties();
      setTimeout(() => setShowForm(false), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Property Management</h2>
          <p className="page-subtitle">Manage commercial & residential real estate units and landlords</p>
        </div>
        <div className="page-actions">
          {!isLandlord && (<button className="btn btn-primary" onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ landlord_id: isLandlord ? user.landlord_id : '', name: '', address: '', property_type: 'Commercial', total_area: '', property_document: null });
            setSuccess('');
            setError('');
          }}>
            + Add Property
          </button>)}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Property' : 'Add New Property'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px', fontSize: '0.9rem' }}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Property Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    name="name" 
                    placeholder="e.g. Skyline Towers, Block B"
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                {!isLandlord && (
                  <div className="form-group flex-1">
                    <label>Landlord / Owner *</label>
                    <select className="form-input" name="landlord_id" value={formData.landlord_id} onChange={handleChange} required>
                    <option value="">Select Landlord</option>
                    {landlords.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.email || l.landlord_email ? `(${l.email || l.landlord_email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea 
                  className="form-input" 
                  name="address" 
                  placeholder="e.g. Plot No. 12, Outer Ring Road, Marathahalli, Bengaluru 560037"
                  value={formData.address} 
                  onChange={handleChange} 
                  rows="2"
                  required
                />
              </div>

              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Property Type *</label>
                  <select className="form-input" name="property_type" value={formData.property_type} onChange={handleChange} required>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Warehouse">Warehouse</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Total Area (sq ft) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'Subtract') e.preventDefault(); }}
                    placeholder="e.g. 2400"
                    className="form-input" 
                    name="total_area" 
                    value={formData.total_area} 
                    onChange={handleChange}
                    required
                  />
                </div>
              
<div className="form-group flex-1">
                  <label>Status *</label>
                  <select className="form-input" name="is_active" value={formData.is_active ? 'Active' : 'Inactive'} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'Active' })} required>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
</div>

              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Document File (Optional)</label>
                  <input type="file" className="form-input" name="property_document" onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Save Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search property, address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Clear</button>
          </form>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '6%' }}>ID</th>
              <th style={{ width: '28%' }}>Property Name</th>
              <th style={{ width: '18%' }}>Type & Area</th>
              <th style={{ width: '18%' }}>Landlord</th>
              <th style={{ textAlign: 'center', width: '10%' }}>Status</th>
              <th style={{ textAlign: 'center', width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ fontWeight: 500 }}>
                  <div>{p.name}</div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%' 
                  }} title={p.address}>{p.address}</div>
                </td>
                <td>
                  <div>{p.property_type || '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.total_area ? `${p.total_area} sq ft` : ''}</div>
                </td>
                <td>{p.landlord_name || 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={p.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                    {p.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      className="action-btn-edit"
                      onClick={() => handleEdit(p)}
                      title="Edit"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #dbeafe',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      className="action-btn-delete"
                      onClick={() => handleDelete(p.id)}
                      title="Delete"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #fee2e2',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No properties found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="pagination-container">
          <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Showing page {page} of {totalPages} ({totalRecords} total)
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={page <= 1} 
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button 
              className="page-btn" 
              disabled={page >= totalPages} 
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
