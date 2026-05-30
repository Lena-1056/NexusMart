import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentDetails = location.state?.paymentDetails;

  return (
    <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
      <h2>Payment Successful!</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '30px' }}>
        Thank you for your purchase. Your order has been placed and payment is captured.
      </p>
      
      {paymentDetails && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', maxWidth: '400px', margin: '0 auto 30px' }}>
          <p><strong>Payment ID:</strong> {paymentDetails.id}</p>
          <p><strong>Order ID:</strong> {paymentDetails.orderId}</p>
          <p><strong>Amount:</strong> {paymentDetails.amount}</p>
          <p><strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{paymentDetails.status}</span></p>
        </div>
      )}

      <button className="btn btn-primary" onClick={() => navigate('/orders')}>
        View My Orders
      </button>
    </div>
  );
}
