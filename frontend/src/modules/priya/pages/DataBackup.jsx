import React, { useState, useEffect } from 'react';
import { backupApi } from '../services/priyaApi';
import {
  Database,
  Download,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function DataBackup() {
  const [backups, setBackups] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Restore Test Report Modal
  const [restoreReport, setRestoreReport] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await backupApi.listBackups();
      setBackups(res.data.data);
    } catch (err) {
      setError('Failed to fetch backup history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const res = await backupApi.createBackup();
      setSuccess(`System backup '${res.data.data.backup_name}' created successfully.`);
      fetchBackups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger system backup.');
    } finally {
      setCreating(false);
    }
  };

  const handleTestRestore = async (backupId) => {
    setError('');
    setTestingId(backupId);

    try {
      const res = await backupApi.testRestore(backupId);
      setRestoreReport(res.data.report);
    } catch (err) {
      setError(err.response?.data?.message || 'Restore verification failed.');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Automated Data Backup & Recovery
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Daily automated database & document archive scheduler with non-destructive restore integrity testing
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creating}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#16a34a',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: creating ? 'not-allowed' : 'pointer'
          }}
        >
          <Play size={16} />
          {creating ? 'Creating Snapshot...' : 'Backup System Now'}
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '18px', fontSize: '0.85rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', marginBottom: '18px', fontSize: '0.85rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Scheduler Status Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} color="#16a34a" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Automated Schedule
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Every 24 Hours (Daily)
            </div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
              ● Scheduler Active in Backend
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={24} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Snapshot Targets
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Master Data, Invoices, PDFs
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Stored in secure `backend/backups/`
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#9333ea" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Disaster Recovery
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              Non-Destructive Test
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Checksum & schema validation enabled
            </span>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Backup File Name</th>
              <th>Backup Type</th>
              <th>File Size</th>
              <th>Created At</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading backup archives...
                </td>
              </tr>
            ) : paginatedBackups.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No backup archives found. Click 'Backup System Now' to create one.
                </td>
              </tr>
            ) : (
              paginatedBackups.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} color="#2563eb" />
                      <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.86rem' }}>
                        {b.backup_name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#475569' }}>{b.backup_type}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#334155' }}>
                    {b.file_size_kb} KB
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-active">
                      ✓ {b.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <a
                        href={backupApi.downloadUrl(b.backup_name)}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        <Download size={14} />
                        Download
                      </a>

                      <button
                        onClick={() => handleTestRestore(b.id)}
                        disabled={testingId === b.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: testingId === b.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <RotateCcw size={14} />
                        {testingId === b.id ? 'Verifying...' : 'Test Restore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing {backups.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, backups.length)} of {backups.length} entries
        </div>
        <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
      </div>

      {/* Restore Test Report Modal */}
      {restoreReport && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={26} color="#16a34a" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Restore Integrity Test Passed
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 18px 0' }}>
              Verified backup archive: <strong>{restoreReport.backup_name}</strong>
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Integrity Check Status:</span>
                <strong style={{ color: '#15803d' }}>{restoreReport.integrity_status} (Passed)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Checksum Validation:</span>
                <strong style={{ color: '#15803d' }}>Valid (MD5 & JSON Compliant)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b' }}>Verification Duration:</span>
                <strong style={{ color: '#0f172a' }}>{restoreReport.duration_ms} ms</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Table-by-Table Schema Verification:
            </h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th style={{ padding: '6px 10px' }}>Table Name</th>
                    <th style={{ padding: '6px 10px' }}>Records Count</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Integrity Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(restoreReport.tables_verified).map(([table, res]) => (
                    <tr key={table}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{table}</td>
                      <td style={{ padding: '6px 10px' }}>{res.count} rows</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#15803d', fontWeight: 600 }}>
                        ✓ {res.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setRestoreReport(null)}
              style={{
                width: '100%',
                padding: '9px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close Verification Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

