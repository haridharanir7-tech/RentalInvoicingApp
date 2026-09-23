import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function LandlordManagement() {
  const [landlords, setLandlords] = useState([]);
  const [formData, setFormData] = useState({
    name: '', pan: '', gstin: '', contact_details: '', 
    billing_address: '', gst_registered: false, default_invoice_template: 'Template A (Standard)'
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
    fetchLandlords(page, searchQuery, statusFilter);
  }, [page, statusFilter]);

  const fetchLandlords = async (overridePage = page, overrideSearch = searchQuery, overrideStatus = statusFilter) => {
    try {
      const res = await fetch(`http://localhost:5000/api/master-data/landlords?page=${overridePage}&limit=5&search=${overrideSearch}&status=${overrideStatus}`);
      if (!res.ok) throw new Error('Failed to fetch landlords');
      const data = await res.json();
      setLandlords(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLandlords(1, searchQuery, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(1);
    fetchLandlords(1, '', '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEdit = (landlord) => {
    setFormData(landlord);
    setEditingId(landlord.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this landlord?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/master-data/landlords/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete landlord');
      fetchLandlords();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    if (formData.gst_registered && !formData.gstin) {
      setError('GSTIN is required if GST Registered is checked');
      setLoading(false);
      return;
    }

    try {
      const url = editingId 
        ? `http://localhost:5000/api/master-data/landlords/${editingId}` 
        : 'http://localhost:5000/api/master-data/landlords';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error(editingId ? 'Failed to update landlord' : 'Failed to create landlord');
      
      setSuccess(editingId ? 'Landlord updated successfully!' : 'Landlord created successfully!');
      setFormData({
        name: '', pan: '', gstin: '', contact_details: '', 
        billing_address: '', gst_registered: false, default_invoice_template: 'Template A (Standard)'
      });
      setEditingId(null);
      fetchLandlords();
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
        <h2>Landlord / Owner Management</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(true);
          setEditingId(null);
          setFormData({ name: '', pan: '', gstin: '', contact_details: '', billing_address: '', gst_registered: false, default_invoice_template: 'Template A (Standard)' });
          setSuccess('');
          setError('');
        }}>
          + Add Landlord
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Landlord' : 'New Landlord'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px', fontSize: '0.9rem' }}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Name *</label>
                  <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group flex-1">
                  <label>PAN</label>
                  <input type="text" className="form-input" name="pan" value={formData.pan} onChange={handleChange} />
                </div>
              </div>

              <div className="flex-row" style={{ alignItems: 'center' }}>
                <div className="form-group flex-1" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input type="checkbox" name="gst_registered" checked={formData.gst_registered} onChange={handleChange} />
                  <label style={{ marginBottom: 0 }}>GST Registered</label>
                </div>
                <div className="form-group flex-1">
                  <label>GSTIN</label>
                  <input type="text" className="form-input" name="gstin" value={formData.gstin} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Details</label>
                <input type="text" className="form-input" name="contact_details" value={formData.contact_details} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Billing Address</label>
                <textarea className="form-input" name="billing_address" value={formData.billing_address} onChange={handleChange} rows="2"></textarea>
              </div>

              <div className="form-group">
                <label>Default Invoice Template</label>
                <select className="form-input" name="default_invoice_template" value={formData.default_invoice_template} onChange={handleChange}>
                  <option value="Template A (Standard)">Template A (Standard)</option>
                  <option value="Template B (Detailed)">Template B (Detailed)</option>
                  <option value="Template C (Compact)">Template C (Compact)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Landlord'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Existing Landlords</h3>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search name, PAN..." 
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>PAN / GSTIN</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {landlords.map(l => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td style={{ fontWeight: 500 }}>{l.name}</td>
                <td>
                  <div>{l.pan || 'N/A'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{l.gstin || 'No GST'}</div>
                </td>
                <td>
                  <span className={l.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                    {l.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }} title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {landlords.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No landlords found.</td>
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
