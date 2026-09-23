import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Download } from 'lucide-react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/ragul/invoices')
      .then(res => setInvoices(res.data.invoices || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Invoices (Ragul's Module)</h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Generated monthly invoices</p>
        </div>
        <Link to="/invoices/generate" className="btn">
          <Plus size={16} /> Generate Invoice
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Period</th>
              <th>Landlord</th>
              <th>Tenant</th>
              <th>Rent</th>
              <th>GST</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No invoices found.</td></tr>
            ) : (
              invoices.map(i => (
                <tr key={i.id}>
                  <td><code>{i.invoice_number}</code></td>
                  <td>{i.billing_period}</td>
                  <td>{i.landlord_name}</td>
                  <td>{i.tenant_name}</td>
                  <td>{Number(i.rent_amount).toLocaleString()}</td>
                  <td>{Number(i.gst_amount).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#1e40af' }}>INR {Number(i.total_amount).toLocaleString()}</td>
                  <td><span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{i.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
