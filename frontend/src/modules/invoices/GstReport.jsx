import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { FileSpreadsheet, Download } from 'lucide-react';

export default function GstReport() {
  const [report, setReport] = useState([]);
  const [month, setMonth] = useState('Sep-2026');
  const [loading, setLoading] = useState(true);

  const fetchReport = (selectedMonth) => {
    setLoading(true);
    api.get(`/invoices/reports/gst-summary?month=${selectedMonth}`)
      .then(res => setReport(res.data.report || []))
      .catch(err => console.error('Failed to load GST report', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(month);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Monthly GST Collection Report</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Consolidated GST summary for statutory GSTR filing (GST-registered landlords)</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="e.g. Sep-2026"
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
          />
          <button onClick={() => fetchReport(month)} className="btn">
            Filter Period
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Landlord Name</th>
              <th>PAN</th>
              <th>GSTIN</th>
              <th>Invoices Count</th>
              <th>Taxable Value (INR)</th>
              <th>CGST (9%)</th>
              <th>SGST (9%)</th>
              <th>Total GST Collected</th>
              <th>Total Invoice Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading GST report...</td></tr>
            ) : report.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>No GST records found for period: {month}.</td></tr>
            ) : (
              report.map(r => (
                <tr key={r.landlord_id}>
                  <td style={{ fontWeight: 600 }}>{r.landlord_name}</td>
                  <td><code>{r.pan}</code></td>
                  <td><code>{r.gstin}</code></td>
                  <td>{r.total_invoices}</td>
                  <td>INR {Number(r.total_taxable_value).toLocaleString()}</td>
                  <td>INR {Number(r.cgst_amount).toLocaleString()}</td>
                  <td>INR {Number(r.sgst_amount).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#047857' }}>
                    INR {Number(r.total_gst_collected).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    INR {Number(r.total_invoice_value).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
