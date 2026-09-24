import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function PropertyManagement() {
  const [properties, setProperties] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [formData, setFormData] = useState({
    landlord_id: '', name: '', address: '', property_type: 'Commercial', total_area: ''
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
      // Get all active landlords for the dropdown (no pagination)
      const res = await fetch('http://localhost:5000/api/master-data/landlords?limit=1000&status=active');
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
      const res = await fetch(`http://localhost:5000/api/master-data/properties?page=${overridePage}&limit=5&search=${overrideSearch}&status=${overrideStatus}`);
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      setProperties(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      console.error(err);
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (property) => {
    setFormData(property);
    setEditingId(property.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/master-data/properties/${id}`, {
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
        ? `http://localhost:5000/api/master-data/properties/${editingId}` 
        : 'http://localhost:5000/api/master-data/properties';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      setFormData({ landlord_id: '', name: '', address: '', property_type: 'Commercial', total_area: '' });
      setEditingId(null);
      fetchProperties();
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
        <h2>Property Management</h2>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(true);
          setEditingId(null);
          setFormData({ landlord_id: '', name: '', address: '', property_type: 'Commercial', total_area: '' });
          setSuccess('');
          setError('');
        }}>
          + Add Property
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Property' : 'New Property'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px', fontSize: '0.9rem' }}>{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Property Name *</label>
                  <input type="text" className="form-input" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group flex-1">
                  <label>Landlord / Owner *</label>
                  <select className="form-input" name="landlord_id" value={formData.landlord_id} onChange={handleChange} required>
                    <option value="">Select Landlord</option>
                    {landlords.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea className="form-input" name="address" value={formData.address} onChange={handleChange} rows="2"></textarea>
              </div>

              <div className="flex-row">
                <div className="form-group flex-1">
                  <label>Property Type</label>
                  <select className="form-input" name="property_type" value={formData.property_type} onChange={handleChange}>
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Warehouse">Warehouse</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Total Area (sq ft)</label>
                  <input type="number" step="0.01" className="form-input" name="total_area" value={formData.total_area} onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Existing Properties</h3>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search property, address..." 
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
              <th>Property Name</th>
              <th>Type & Area</th>
              <th>Landlord</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ fontWeight: 500 }}>
                  <div>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.address}</div>
                </td>
                <td>
                  <div>{p.property_type || '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.total_area ? `${p.total_area} sq ft` : ''}</div>
                </td>
                <td>{p.landlord_name || 'N/A'}</td>
                <td>
                  <span className={p.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '10px' }} title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                    <Trash2 size={18} />
                  </button>
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
