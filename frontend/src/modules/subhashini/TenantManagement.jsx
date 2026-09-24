import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    property_id: '', name: '', pan: '', gstin: '', contact_details: '', 
    lease_start_date: '', lease_end_date: '', status: 'Active'
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
    fetchPropertiesForDropdown();
  }, []);

  useEffect(() => {
    fetchTenants(page, searchQuery, statusFilter);
  }, [page, statusFilter]);

  const fetchPropertiesForDropdown = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/master-data/properties?limit=1000&status=active');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTenants = async (overridePage = page, overrideSearch = searchQuery, overrideStatus = statusFilter) => {
    try {
      const res = await fetch(`http://localhost:5000/api/master-data/tenants?page=${overridePage}&limit=5&search=${overrideSearch}&status=${overrideStatus}`);
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const data = await res.json();
      setTenants(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTenants(1, searchQuery, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(1);
    fetchTenants(1, '', '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (tenant) => {
    // For date fields, we need to format them to YYYY-MM-DD for the input type="date"
    const formattedTenant = { ...tenant };
    if (formattedTenant.lease_start_date) {
      formattedTenant.lease_start_date = new Date(formattedTenant.lease_start_date).toISOString().split('T')[0];
    }
    if (formattedTenant.lease_end_date) {
      formattedTenant.lease_end_date = new Date(formattedTenant.lease_end_date).toISOString().split('T')[0];
    }
    
    setFormData(formattedTenant);
    setEditingId(tenant.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/master-data/tenants/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete tenant');
      fetchTenants();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side Validation
    if (!formData.name.trim()) {
      return setError('Tenant Name is required');
    }
    if (!formData.property_id) {
      return setError('Property is required');
    }
    
    if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan)) {
      return setError('Invalid PAN format (e.g. ABCDE1234F)');
    }

    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin)) {
      return setError('Invalid GSTIN format');
    }

    if (formData.lease_start_date && formData.lease_end_date) {
      if (new Date(formData.lease_end_date) < new Date(formData.lease_start_date)) {
        return setError('Lease end date cannot be before lease start date');
      }
    }

    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      const url = editingId 
        ? `http://localhost:5000/api/master-data/tenants/${editingId}` 
        : 'http://localhost:5000/api/master-data/tenants';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pan: formData.pan ? formData.pan.toUpperCase() : '',
          gstin: formData.gstin ? formData.gstin.toUpperCase() : ''
        })
      });
      
      if (!res.ok) {
        let errMessage = editingId ? 'Failed to update tenant' : 'Failed to create tenant';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {
          // ignore JSON parse error
        }
        throw new Error(errMessage);
      }
      
      setSuccess(editingId ? 'Tenant updated successfully!' : 'Tenant created successfully!');
      setFormData({
        property_id: '', name: '', pan: '', gstin: '', contact_details: '', 
        lease_start_date: '', lease_end_date: '', status: 'Active'
      });
      setEditingId(null);
      fetchTenants();
      setTimeout(() => setShowForm(false), 1500); // Hide form after success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Tenant Management</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(true);
          setEditingId(null);
          setFormData({ property_id: '', name: '', pan: '', gstin: '', contact_details: '', lease_start_date: '', lease_end_date: '', status: 'Active' });
          setSuccess('');
          setError('');
        }}>
          + Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Tenant' : 'New Tenant'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px', fontSize: '0.9rem' }}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Tenant Name *</label>
                  <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group flex-1">
                  <label>Property *</label>
                  <select className="form-input" name="property_id" value={formData.property_id} onChange={handleChange} required>
                    <option value="">Select Property</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>PAN</label>
                  <input type="text" className="form-input" name="pan" value={formData.pan} onChange={handleChange} placeholder="ABCDE1234F" maxLength="10" style={{textTransform: 'uppercase'}} />
                </div>
                <div className="form-group flex-1">
                  <label>GSTIN</label>
                  <input type="text" className="form-input" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" maxLength="15" style={{textTransform: 'uppercase'}} />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Details</label>
                <input type="text" className="form-input" name="contact_details" value={formData.contact_details} onChange={handleChange} />
              </div>

              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Lease Start Date</label>
                  <input type="date" className="form-input" name="lease_start_date" value={formData.lease_start_date} onChange={handleChange} />
                </div>
                <div className="form-group flex-1">
                  <label>Lease End Date</label>
                  <input type="date" className="form-input" name="lease_end_date" value={formData.lease_end_date} onChange={handleChange} />
                </div>
                <div className="form-group flex-1">
                  <label>Status</label>
                  <select className="form-input" name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Notice Period">Notice Period</option>
                    <option value="Vacated">Vacated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Existing Tenants</h3>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search tenant, property..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '200px' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ background: '#f1f5f9' }}>Clear</button>
          </form>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Notice Period">Notice Period</option>
            <option value="Vacated">Vacated</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant Name</th>
              <th>Property</th>
              <th>Lease Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td style={{ fontWeight: 500 }}>
                  <div>{t.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.contact_details}</div>
                </td>
                <td>{t.property_name || 'N/A'}</td>
                <td>
                  {t.lease_start_date ? new Date(t.lease_start_date).toLocaleDateString() : '-'} 
                  {t.lease_end_date ? ` to ${new Date(t.lease_end_date).toLocaleDateString()}` : ''}
                </td>
                <td>
                  <span className={`badge ${
                    t.status === 'Active' ? 'badge-active' : 
                    t.status === 'Notice Period' ? 'badge' : 'badge-inactive'
                  }`} style={t.status === 'Notice Period' ? { backgroundColor: '#fef08a', color: '#854d0e' } : {}}>
                    {t.status}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }} title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No tenants found.</td>
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
