import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../services/api';

export default function LocationModal({ isOpen, onClose, onSelect, customer }) {
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (isOpen && customer) {
      // Fetch user's real addresses from auth-service
      fetch(`${SERVICES.USER}/customer/address/${customer.email}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAddresses(data);
        })
        .catch(console.error);
    } else if (!customer) {
      setAddresses([]);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  return (
    <div className="loc-modal-overlay" onClick={onClose}>
      <div className="loc-modal" onClick={e => e.stopPropagation()}>
        <div className="loc-modal-header">
          <h3>Choose your location</h3>
          <button className="loc-close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="loc-modal-body">
          <p className="loc-desc">Select a delivery location to see product availability and delivery options</p>
          
          <div className="loc-list">
            {addresses.map((addr) => (
              <div 
                key={addr.id} 
                className="loc-address-box"
                onClick={() => {
                  const displayStr = addr.city ? `${addr.city} ${addr.pincode}` : (addr.pincode || 'India');
                  onSelect({ name: addr.full_name || customer.name, address: displayStr, fullAddress: `${addr.flat}, ${addr.area}, ${addr.city}, ${addr.state} ${addr.pincode}` });
                  onClose();
                }}
              >
                <strong>{addr.full_name || customer.name}</strong> {addr.flat}, {addr.area}, {addr.city}, {addr.state} {addr.pincode}
                {addr.is_default && <div className="loc-default-tag">Default address</div>}
              </div>
            ))}
            {addresses.length === 0 && customer && (
              <p style={{ fontSize: '13px', color: '#565959', marginBottom: '12px' }}>You haven't saved any addresses yet.</p>
            )}
            {!customer && (
              <p style={{ fontSize: '13px', color: '#565959', marginBottom: '12px' }}>Please <Link to="/login" onClick={onClose} style={{ color: '#007185' }}>sign in</Link> to see your addresses.</p>
            )}
          </div>

          <div className="loc-footer-links">
            <Link to="/profile" onClick={onClose}>Add an address or pick-up point</Link>
          </div>
          
          <div className="loc-or-divider">
            <span>or enter an Indian pincode</span>
          </div>
          
          <div className="loc-pincode-input">
            <input type="text" placeholder="" />
            <button>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
