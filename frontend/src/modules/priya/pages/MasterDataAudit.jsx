import React, { useState, useEffect } from 'react';
import { auditApi } from '../services/priyaApi';
import { History, Filter, Search, Calendar, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

export default function MasterDataAudit() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditApi.getMasterDataLogs({
        entity_type: entityType || undefined
      });
      // Filter out invoice overrides from master data change log if needed, or show all
      const masterLogs = res.data.data.filter(l => l.entity_type !== 'INVOICE_OVERRIDE');
      setLogs(masterLogs);
    } catch (err) {
      setError('Failed to load master data audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityType]);

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const reasonMatch = log.reason && log.reason.toLowerCase().includes(q);
    const userMatch = log.performed_by_name && log.performed_by_name.toLowerCase().includes(q);
    const entityMatch = log.entity_type.toLowerCase().includes(q) || String(log.entity_id).includes(q);
    return reasonMatch || userMatch || entityMatch;
  });

  const formatEntityBadge = (type) => {
    switch (type) {
      case 'RENTAL_RATE':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>Rental Rate Revision</span>;
      case 'LANDLORD_GST':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>Landlord GST Status</span>;
      case 'USER_STATUS':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>Account Activation/Deactivation</span>;
      case 'USER_ACCOUNT':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>User Creation</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 700 }}>{type}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Master Data Change Log
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Audit trail capturing rental rate changes, landlord GST registrations, and user security events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#334155'
          }}
        >
          <RefreshCw size={15} />
          Refresh Log
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '18px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by reason, modified by user, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.88rem',
              width: '100%',
              color: '#1e293b'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} color="#64748b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Entity Filter:</span>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#fff',
              color: '#334155'
            }}
          >
            <option value="">All Master Data Changes</option>
            <option value="RENTAL_RATE">Rental Rates</option>
            <option value="LANDLORD_GST">Landlord GST Status</option>
            <option value="USER_STATUS">User Status (Activation/Deactivation)</option>
            <option value="USER_ACCOUNT">User Account Creation</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Timestamp</th>
              <th>Entity & Identifier</th>
              <th>Action</th>
              <th style={{ width: '38%' }}>Change Comparison (Old → New)</th>
              <th>Justification / Reason</th>
              <th>Modified By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading change log history...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No master data audit entries found.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', verticalAlign: 'top' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ marginBottom: '4px' }}>{formatEntityBadge(log.entity_type)}</div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', fontFamily: 'monospace' }}>
                      ID: #{log.entity_id}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: log.action === 'CREATE' ? '#dcfce7' : log.action === 'STATUS_CHANGE' ? '#fee2e2' : '#e0e7ff',
                      color: log.action === 'CREATE' ? '#15803d' : log.action === 'STATUS_CHANGE' ? '#991b1b' : '#3730a3'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{
                      background: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.76rem',
                      fontFamily: 'monospace',
                      lineHeight: 1.4
                    }}>
                      {log.old_values && (
                        <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                          <strong>OLD:</strong> {JSON.stringify(log.old_values)}
                        </div>
                      )}
                      {log.new_values && (
                        <div style={{ color: '#16a34a' }}>
                          <strong>NEW:</strong> {JSON.stringify(log.new_values)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: '#334155', verticalAlign: 'top' }}>
                    {log.reason || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None specified</span>}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600, verticalAlign: 'top' }}>
                    {log.performed_by_name || 'Admin'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {filteredLogs.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
        </div>
        <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
      </div>
    </div>
  );
}

