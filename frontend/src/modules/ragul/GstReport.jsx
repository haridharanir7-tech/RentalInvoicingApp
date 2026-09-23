import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function GstReport() {
  const [report, setReport] = useState([]);
  const [month, setMonth] = useState('Sep-2026');
  const [loading, setLoading] = useState(true);

  const fetchReport = (m) => {
    setLoading(true);
    axios.get(`/api/ragul/reports/gst-summary?month=${m}`)
      .then(res => setReport(res.data.report || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(month);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>GST Summary Report (Ragul's Module)</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Consolidated GST collection for statutory filing</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }} />
          <button onClick={() => fetchReport(month)} className="btn">Filter</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Landlord</th>
              <th>PAN</th>
              <th>GSTIN</th>
              <th>Invoices</th>
              <th>Taxable Value</th>
              <th>Total GST</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : report.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No GST data for {month}.</td></tr>
            ) : (
              report.map(r => (
                <tr key={r.landlord_id}>
                  <td style={{ fontWeight: 600 }}>{r.landlord_name}</td>
                  <td><code>{r.pan}</code></td>
                  <td><code>{r.gstin}</code></td>
                  <td>{r.total_invoices}</td>
                  <td>INR {Number(r.total_taxable_value).toLocaleString()}</td>
                  <td style={{ color: '#047857', fontWeight: 600 }}>INR {Number(r.total_gst_collected).toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>INR {Number(r.total_invoice_value).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
