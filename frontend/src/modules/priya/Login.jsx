import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/priya/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('rental_token', res.data.token);
        localStorage.setItem('rental_user', JSON.stringify(res.data.user));
        navigate('/invoices');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: '#eff6ff', borderRadius: '50%', color: '#2563eb' }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px' }}>Rental Invoicing</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Sign in to continue</p>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '14px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rentalapp.com"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn" style={{ justifyContent: 'center', marginTop: '6px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
          <strong>Default credentials (Password: Password123!):</strong>
          <div>admin@rentalapp.com</div>
          <div>manager@rentalapp.com</div>
        </div>
      </div>
    </div>
  );
}
