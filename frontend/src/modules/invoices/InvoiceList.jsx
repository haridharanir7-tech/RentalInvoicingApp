import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Plus, Download } from 'lucide-react';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/invoices')
      .then(res => setInvoices(res.data.invoices))
      .catch(err => console.error('Failed to load invoices', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Rental Invoices</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Generated monthly invoices, status, and PDF downloads</p>
        </div>

        {user && user.role !== 'Landlord' && (
          <Link to="/invoices/generate" className="btn">
            <Plus size={16} />
            <span>Generate Monthly Invoice</span>
          </Link>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Billing Period</th>
              <th>Landlord</th>
              <th>Tenant</th>
              <th>Rent (INR)</th>
              <th>GST (INR)</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>No invoices found.</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id}>
                  <td><code>{inv.invoice_number}</code></td>
                  <td>{inv.invoice_date?.slice(0, 10)}</td>
                  <td><strong>{inv.billing_period}</strong></td>
                  <td>{inv.landlord_name}</td>
                  <td>{inv.tenant_name}</td>
                  <td>{Number(inv.rent_amount).toLocaleString()}</td>
                  <td>{Number(inv.gst_amount).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#1e40af' }}>
                    INR {Number(inv.total_amount).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${inv.status === 'Generated' ? 'badge-generated' : inv.status === 'Sent' ? 'badge-sent' : 'badge-inactive'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => alert(`Downloading PDF for invoice ${inv.invoice_number}`)} 
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      title="Download PDF"
                    >
                      <Download size={13} />
                      PDF
                    </button>
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
