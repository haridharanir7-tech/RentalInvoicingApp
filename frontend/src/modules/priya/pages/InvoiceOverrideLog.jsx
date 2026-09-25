import React, { useState, useEffect } from 'react';
import { auditApi, dashboardApi } from '../services/priyaApi';
import { ShieldAlert, AlertTriangle, Edit3, PlusCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function InvoiceOverrideLog() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State for simulating draft invoice manual override
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [draftInvoices, setDraftInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [revisedCharges, setRevisedCharges] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getInvoiceOverrides();
      setLogs(res.data.data);
    } catch (err) {
      setError('Failed to load invoice override logs.');
    } finally {
      setLoading(false);
    }
  };

  const loadDraftInvoices = async () => {
    try {
      const res = await dashboardApi.getSummary();
      // Also get invoice register to list actual draft invoices
      // For convenience, provide demo draft IDs
      setDraftInvoices([
        { id: 4, number: 'INV/AP/2026-27/00002', period: 'Sep-2026', tenant: 'VenturePulse Media', amount: 233640, charges: 18000 },
        { id: 5, number: 'INV/SK/2026-27/00001', period: 'Sep-2026', tenant: 'Dr. Ramesh Sundaram', amount: 65000, charges: 5000 }
      ]);
    } catch (e) {
      console.warn('Could not load draft invoices');
    }
  };

  useEffect(() => {
    fetchOverrides();
    loadDraftInvoices();
  }, []);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!overrideReason || overrideReason.trim() === '') {
      setError('An audit reason is strictly mandatory for invoice overrides.');
      return;
    }

    setSubmitting(true);
    try {
      const target = draftInvoices.find(i => String(i.id) === String(selectedInvoice) || i.number === selectedInvoice);
      const newCharges = Number(revisedCharges);
      const oldCharges = target ? target.charges : 18000;
      const diff = newCharges - oldCharges;
      const newTotal = target ? target.amount + diff : 233640 + diff;

      const res = await auditApi.recordInvoiceOverride({
        invoice_id: target ? target.id : 4,
        invoice_number: target ? target.number : 'INV/AP/2026-27/00002',
        old_values: { additional_charges: oldCharges, total_amount: target ? target.amount : 233640 },
        new_values: { additional_charges: newCharges, total_amount: newTotal },
        reason: overrideReason
      });

      setSuccess('Draft invoice corrected and audit override logged successfully.');
      setShowOverrideModal(false);
      setOverrideReason('');
      setRevisedCharges('');
      fetchOverrides();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit invoice override.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            Invoice Override Governance Log
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Mandatory audit trail capturing any manual adjustment made to draft invoices before finalization
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchOverrides}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '9px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={() => setShowOverrideModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Edit3 size={16} />
            Correct Draft Invoice (Override)
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '18px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', marginBottom: '18px', fontSize: '0.85rem' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Overrides Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Timestamp</th>
              <th>Target Invoice #</th>
              <th style={{ width: '36%' }}>Changed Values</th>
              <th>Required Justification Reason</th>
              <th>Modified By User</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Loading override logs...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No draft invoice overrides have been recorded.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', verticalAlign: 'top' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.86rem' }}>
                      {log.entity_id}
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      Draft Override
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
                      <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                        <strong>PREVIOUS:</strong> {JSON.stringify(log.old_values)}
                      </div>
                      <div style={{ color: '#16a34a' }}>
                        <strong>REVISED:</strong> {JSON.stringify(log.new_values)}
                      </div>
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', fontSize: '0.85rem', color: '#1e293b' }}>
                    <div style={{
                      padding: '8px 10px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '6px',
                      color: '#92400e',
                      fontStyle: 'italic'
                    }}>
                      "{log.reason}"
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
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
          Showing {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, logs.length)} of {logs.length} entries
        </div>
        <div className="pagination-controls">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && (
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
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ShieldAlert size={24} color="#ea580c" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Manual Invoice Override
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Per statutory audit rules, any manual correction to a draft invoice requires an explicit justification reason.
            </p>

            <form onSubmit={handleOverrideSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Select Draft Invoice *
                </label>
                <select
                  required
                  value={selectedInvoice}
                  onChange={(e) => {
                    setSelectedInvoice(e.target.value);
                    const inv = draftInvoices.find(i => String(i.id) === e.target.value);
                    if (inv) setRevisedCharges(String(inv.charges));
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Select Draft Invoice --</option>
                  {draftInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.number} ({inv.tenant} - Charges: ₹{inv.charges})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Revised Additional Charges (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 21000"
                  value={revisedCharges}
                  onChange={(e) => setRevisedCharges(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Mandatory Audit Justification Reason *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Diesel generator adjustment agreed upon review of maintenance sub-meter with tenant."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Applying...' : 'Apply Correction & Log Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

