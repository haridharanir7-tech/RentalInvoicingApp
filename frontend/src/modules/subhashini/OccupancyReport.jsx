import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../priya/context/AuthContext';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

export default function OccupancyReport() {
  const { user, isLandlord } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: 0, occupied: 0, vacant: 0, rate: 0 });

  useEffect(() => {
    fetchReport(page, searchQuery, statusFilter);
  }, [page, statusFilter, isLandlord, user?.landlord_id]);

  const fetchReport = async (overridePage = page, overrideSearch = searchQuery, overrideStatus = statusFilter) => {
    if (isLandlord && !user?.landlord_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const landlordParam = isLandlord && user?.landlord_id ? `&landlord_id=${user.landlord_id}` : '';
      const url = `/api/master-data/reports/occupancy?page=${overridePage}&limit=10&search=${encodeURIComponent(overrideSearch)}&status=${overrideStatus}${landlordParam}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);

        const totalProperties = data.pagination?.total || 0;
        const occupiedCount = (data.data || []).filter(r => r.occupancy_status === 'Occupied' || r.occupancy_status === 'Notice Period').length;
        const vacantCount = (data.data || []).filter(r => r.occupancy_status === 'Vacant').length;
        const occupancyRate = data.data && data.data.length ? Math.round((occupiedCount / data.data.length) * 100) : 0;
        
        setStats({ total: totalProperties, occupied: occupiedCount, vacant: vacantCount, rate: occupancyRate });
      }
    } catch (err) {
      console.error('Error fetching occupancy report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport(1, searchQuery, statusFilter);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPage(1);
    fetchReport(1, '', '');
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Occupancy Report</h2>
          <p className="page-subtitle">Vacancy tracking and lease occupancy statistics</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => { setPage(1); fetchReport(); }}>
            <RefreshCw size={14} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Properties</div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-desc">Total units in database</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Occupied Units</div>
          <div className="kpi-value">{stats.occupied}</div>
          <div className="kpi-desc">Active lease contracts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Vacant Units</div>
          <div className="kpi-value">{stats.vacant}</div>
          <div className="kpi-desc">Available for tenancy</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Occupancy Rate</div>
          <div className="kpi-value">{stats.rate}%</div>
          <div className="kpi-desc">Current leased ratio</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search property, landlord..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px' }}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ background: '#f1f5f9' }}>Clear</button>
          </form>
          <select 
            className="form-input" 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '180px' }}
          >
            <option value="">All Occupancy Status</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Notice Period">Notice Period</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>Loading report...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Property Name</th>
                <th>Landlord</th>
                <th style={{ textAlign: 'center', width: '160px' }}>Occupancy Status</th>
                <th>Current Tenant</th>
                <th>Lease Details</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(row => {
                const status = row.occupancy_status;
                const isOccupied = status === 'Occupied';
                const isNotice = status === 'Notice Period';

                return (
                  <tr key={row.property_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.property_name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{row.property_type || '-'}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.landlord_name || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isOccupied && (
                        <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={13} />
                          Occupied
                        </span>
                      )}
                      {isNotice && (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          Notice Period
                        </span>
                      )}
                      {!isOccupied && !isNotice && (
                        <span className="badge badge-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={13} />
                          {status || 'Vacant'}
                        </span>
                      )}
                    </td>
                    <td>{row.tenant_name || '-'}</td>
                    <td style={{ fontSize: '0.84rem', color: '#334155' }}>
                      {row.lease_start_date ? new Date(row.lease_start_date).toLocaleDateString() : '-'} 
                      {row.lease_end_date ? ` to ${new Date(row.lease_end_date).toLocaleDateString()}` : ''}
                    </td>
                  </tr>
                );
              })}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>No data available for report.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 0 && (
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
