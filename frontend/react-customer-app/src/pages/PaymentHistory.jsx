import React, { useEffect, useState } from 'react';
import { API_BASE } from '../utils/config';
import { useNavigate } from 'react-router-dom';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real application, you'd have an endpoint like GET /api/payments/user to fetch history
    // Since we didn't specify one, this is a mock implementation
    setPayments([
      { id: 'PAY-123456', amount: 567.00, status: 'CAPTURED', date: '2026-05-29', orderId: 'ORD-test' }
    ]);
    setLoading(false);
  }, []);

  if (loading) return <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2>Payment History</h2>
      <div style={{ marginTop: '20px' }}>
        {payments.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', marginBottom: '12px', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{p.id}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{p.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>${p.amount}</div>
              <div style={{ fontSize: '12px', color: p.status === 'CAPTURED' ? '#10b981' : '#f43f5e' }}>{p.status}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => navigate('/profile')}>
        Back to Profile
      </button>
    </div>
  );
}
