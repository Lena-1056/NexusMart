import React, { useEffect, useState } from 'react';
import { SERVICES } from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RazorpayCheckout = ({ orderAmount, orderCurrency, onSuccess, onFailure, prefillData }) => {
  const [loading, setLoading] = useState(false);

  const displayRazorpay = async () => {
    setLoading(true);
    const res = await loadRazorpayScript();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      const orderResponse = await fetch(`${SERVICES.PAYMENT}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: 'TBD', // This should be passed from props
          amount: orderAmount,
          currency: orderCurrency
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Server error when creating order');
      }

      const orderData = await orderResponse.json();

      const options = {
        key: 'rzp_test_mock123', // Enter the Key ID generated from the Dashboard
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'E-Commerce Platform',
        description: 'Order Payment',
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
            const verifyRes = await fetch(`${SERVICES.PAYMENT}/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              const paymentResult = await verifyRes.json();
              onSuccess(paymentResult);
            } else {
              onFailure('Payment verification failed');
            }
          } catch (err) {
            onFailure(err.message);
          }
        },
        prefill: prefillData,
        theme: {
          color: '#8b5cf6'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={displayRazorpay} 
      disabled={loading}
      className="btn btn-primary w-full"
    >
      {loading ? 'Processing...' : `Pay via Razorpay`}
    </button>
  );
};
