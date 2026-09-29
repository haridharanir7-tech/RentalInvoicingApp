import React, { useState, useEffect, useRef } from 'react'; 
import { useAuth } from '../priya/context/AuthContext';
import { Edit, Trash2, CheckCircle, XCircle, Eye, Download, Upload } from 'lucide-react';
import JSZip from 'jszip';

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
  const [viewProperty, setViewProperty] = useState(null);
  
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRef = useRef(null);

  const handleDocumentUploadClick = (id) => {
    setUploadingId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !uploadingId) return;

    const invalidFiles = files.filter(f => f.size > 250 * 1024);
    if (invalidFiles.length > 0) {
      alert('One or more files exceed the 250KB size limit.');
      setUploadingId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const uploadData = new FormData();
      files.forEach(file => {
        uploadData.append('property_documents', file);
      });

      const res = await fetch(`/api/master-data/properties/${uploadingId}/document`, {
        method: 'POST',
        body: uploadData
      });

      if (!res.ok) {
        throw new Error('Failed to upload document(s)');
      }

      alert('Document(s) uploaded successfully!');
      fetchProperties(); // Refresh the list
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const [odtText, setOdtText] = useState('');
  const [odtLoading, setOdtLoading] = useState(false);
  const [odtError, setOdtError] = useState(false);

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleDeleteDocument = async (propertyId, docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/master-data/properties/${propertyId}/document/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Document deleted successfully!');
        if (viewProperty && viewProperty.id === propertyId) {
          setViewProperty(prev => ({
            ...prev,
            property_documents: prev.property_documents.filter(d => d.id !== docId)
          }));
        }
        fetchProperties(); // refresh backend list
      } else {
        let errorMsg = 'Failed to delete document';
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch (e) {
          errorMsg = `Server returned ${res.status}: ${res.statusText}. Please ensure the backend server is restarted to apply new routes.`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    if (showDocumentPreview && viewingDoc?.url?.match(/\.(odt|docx|pptx)$/i)) {
      setOdtLoading(true);
      setOdtText('');
      setOdtError(false);
      
      const url = `http://localhost:5000${encodeURI(viewingDoc.url)}`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.arrayBuffer();
        })
        .then(buffer => JSZip.loadAsync(buffer))
        .then(async zip => {
          const isPptx = viewingDoc.url.endsWith('.pptx');
          if (isPptx) {
            let html = '';
            // Process up to 20 slides
            for (let i = 1; i <= 20; i++) {
              const slideFile = zip.file(`ppt/slides/slide${i}.xml`);
              if (slideFile) {
                const xmlString = await slideFile.async('string');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                const texts = xmlDoc.getElementsByTagName('a:t');
                if (texts.length > 0) {
                  html += `<div style="border: 1px solid #e2e8f0; margin-bottom: 20px; padding: 15px; border-radius: 8px; background: #f8fafc;"><h4 style="margin-top:0; color:#3b82f6;">Slide ${i}</h4>`;
                  for (let j = 0; j < texts.length; j++) {
                    html += `<p style="margin-bottom: 5px;">${texts[j].textContent}</p>`;
                  }
                  html += `</div>`;
                }
              }
            }
            return html;
          } else {
            const xmlString = await (zip.file('content.xml') ? zip.file('content.xml').async('string') : (zip.file('word/document.xml') ? zip.file('word/document.xml').async('string') : ''));
            if (!xmlString) throw new Error('No content found');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const paragraphs = viewingDoc.url.endsWith('.docx') ? xmlDoc.getElementsByTagName('w:t') : xmlDoc.getElementsByTagName('text:p');
            let html = '';
            for (let i = 0; i < paragraphs.length; i++) {
              html += `<p style="margin-bottom: 8px;">${paragraphs[i].textContent}</p>`;
            }
            return html;
          }
        })
        .then(html => {
          setOdtText(html || '<i>Blank document</i>');
        })
        .catch(err => {
          console.error('Error parsing document:', err);
          setOdtError(true);
        })
        .finally(() => {
          setOdtLoading(false);
        });
    }
  }, [showDocumentPreview, viewingDoc]);

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
      property_documents: [],
      existing_documents: property.property_documents || []
    });
    setEditingId(property.id);
    setSuccess('');
    setError('');
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
      if (formData.property_documents && formData.property_documents.length > 0) {
        formData.property_documents.forEach(doc => {
          formDataToSend.append('property_documents', doc);
        });
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
      setFormData({ landlord_id: isLandlord ? user.landlord_id : '', name: '', address: '', property_type: 'Commercial', total_area: '', is_active: true, property_documents: [] });
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
            setFormData({ landlord_id: isLandlord ? user.landlord_id : '', name: '', address: '', property_type: 'Commercial', total_area: '', property_documents: [] });
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
                  <label>Document Files (Optional)</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    name="property_documents" 
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const invalidFiles = files.filter(f => f.size > 250 * 1024);
                      if (invalidFiles.length > 0) {
                        alert('One or more files exceed the 250KB size limit.');
                        e.target.value = '';
                        return;
                      }
                      setFormData(prev => {
                        const existingFiles = prev.property_documents || [];
                        return { ...prev, property_documents: [...existingFiles, ...files] };
                      });
                    }} 
                  />
                  {formData.property_documents && formData.property_documents.length > 0 ? (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#16a34a', marginBottom: '8px', fontWeight: 600 }}>✓ {formData.property_documents.length} File(s) chosen for upload:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {formData.property_documents.map((file, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.8rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{file.name}</span>
                            <button type="button" onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                property_documents: prev.property_documents.filter((_, i) => i !== idx)
                              }));
                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : editingId ? (
                    <div>
                      {formData.existing_documents && formData.existing_documents.length > 0 && (
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: 600 }}>Previously Uploaded Documents:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {formData.existing_documents.map((doc, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.8rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{doc.name || doc.url?.split('/').pop()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px' }}>Leave empty to keep existing documents. Choosing new files will add to the existing ones.</div>
                    </div>
                  ) : null}
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
          <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>Clear</button>
        </div>
      </div>
      
      <div className="table-container">
        <table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '6%', minWidth: '60px' }}>ID</th>
              <th style={{ width: isLandlord ? '38%' : '30%', minWidth: '200px' }}>Property Name</th>
              <th style={{ width: isLandlord ? '26%' : '16%', minWidth: '150px' }}>Type & Area</th>
              {!isLandlord && <th style={{ width: '12%', minWidth: '120px' }}>Landlord</th>}
              <th style={{ textAlign: 'center', width: '10%', minWidth: '90px' }}>Status</th>
              <th style={{ textAlign: 'center', width: isLandlord ? '20%' : '26%', minWidth: '240px' }}>{isLandlord ? 'View Details' : 'Actions'}</th>
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
                {!isLandlord && <td>{p.landlord_name || 'N/A'}</td>}
                <td style={{ textAlign: 'center' }}>
                  <span className={p.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                    {p.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isLandlord ? (
                      <>
                        <button
                          onClick={() => handleDocumentUploadClick(p.id)}
                          title="Upload/Update Document"
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
                          <Upload size={16} />
                        </button>
                        <button
                          className="action-btn-view"
                          onClick={() => { setViewProperty(p); setShowDocumentPreview(false); setViewingDoc(null); }}
                          title="View Details"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#0f172a',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
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
                        <button
                          onClick={() => {
                            setViewProperty(p);
                            setShowViewModal(true);
                          }}
                          title="View Details"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#0f172a',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    )}
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

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        multiple
        onChange={handleFileChange} 
      />

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

      {/* View Property Modal */}
      {viewProperty && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} color="#2563eb" /> Property Details
              </h3>
              <button onClick={() => setViewProperty(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {!showDocumentPreview ? (
                <>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Property Name</strong>
                    <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 500 }}>{viewProperty.name}</div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Address</strong>
                    <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{viewProperty.address}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Type</strong>
                      <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{viewProperty.property_type || '-'}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Area</strong>
                      <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{viewProperty.total_area ? `${viewProperty.total_area} sq ft` : '-'}</div>
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Status</strong>
                    <div style={{ marginTop: '5px' }}>
                      <span className={viewProperty.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                        {viewProperty.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase' }}>Documents</strong>
                    <div style={{ marginTop: '10px' }}>
                      {viewProperty.property_documents && viewProperty.property_documents.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                            <tr>
                              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Document</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.85rem', color: '#475569', fontWeight: 600, width: '100px' }}>Download</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewProperty.property_documents.map(doc => (
                              <tr key={doc.id}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
                                  <button 
                                    onClick={(e) => { e.preventDefault(); setViewingDoc(doc); setShowDocumentPreview(true); }}
                                    style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'flex-start', textAlign: 'left', gap: '8px', padding: 0 }}
                                  >
                                    <div style={{ flexShrink: 0, marginTop: '2px' }}><Eye size={16} /></div>
                                    <span style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>{doc.name || doc.url.split('/').pop()}</span>
                                  </button>
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => handleDownload(encodeURI(doc.url))}
                                      title="Download Document"
                                      style={{
                                        background: '#eff6ff',
                                        border: '1px solid #dbeafe',
                                        color: '#2563eb',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Download size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDocument(viewProperty.id, doc.id)}
                                      title="Delete Document"
                                      style={{
                                        background: '#fef2f2',
                                        border: '1px solid #fee2e2',
                                        color: '#ef4444',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No documents attached</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ height: '500px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
                  <div style={{ padding: '10px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{viewingDoc?.name || viewingDoc?.url?.split('/').pop()}</span>
                    <button onClick={() => setShowDocumentPreview(false)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Back to Details</button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                    {viewingDoc?.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img 
                        src={`http://localhost:5000${encodeURI(viewingDoc.url)}`} 
                        alt="Document Preview" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : viewingDoc?.url?.match(/\.(pdf)$/i) ? (
                      <iframe 
                        src={`http://localhost:5000${encodeURI(viewingDoc.url)}`} 
                        title="Document Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    ) : viewingDoc?.url?.match(/\.(odt|docx|pptx)$/i) ? (
                      <div style={{ width: '100%', height: '100%', padding: '20px', overflowY: 'auto', background: '#fff', textAlign: 'left', color: '#1e293b' }}>
                        {odtLoading ? (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                            Loading text preview...
                          </div>
                        ) : odtError ? (
                          <div style={{ textAlign: 'center', color: '#ef4444', padding: '20px' }}>
                            <p>Failed to parse document preview.</p>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDownload(encodeURI(viewingDoc.url))}
                            >
                              Download to View
                            </button>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: odtText }} />
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                        <div style={{ marginBottom: '15px' }}>
                          <span style={{ fontSize: '3rem' }}>📄</span>
                        </div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>Preview Not Supported</h4>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', maxWidth: '300px' }}>
                          Web browsers cannot display <b>.{viewingDoc?.url?.split('.').pop()}</b> files directly on the screen.
                        </p>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownload(encodeURI(viewingDoc?.url || ''))}
                        >
                          <Download size={16} style={{ marginRight: '8px' }} /> Download to View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '25px', textAlign: 'right' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => { setViewProperty(null); setShowDocumentPreview(false); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
