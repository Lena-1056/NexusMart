import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentFailure() {
  const location = useLocation();
  const navigate = useNavigate();
  const error = location.state?.error || 'An unknown error occurred during payment processing.';

  return (
    <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
      <h2>Payment Failed</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
        {error}
      </p>

      <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
        Try Again
      </button>
    </div>
  );
}
