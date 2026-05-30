import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from './config';

const STATUS_ORDER = [
  'PENDING',
  'PICKED_UP',
  'REACHED_ORIGIN_HUB',
  'IN_TRANSIT_LINEHAUL',
  'REACHED_DESTINATION_HUB',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const STATUS_LABEL = {
  PENDING: '📦 Pending Pickup',
  PICKED_UP: '🚚 Picked Up',
  REACHED_ORIGIN_HUB: '🏭 At Origin Hub',
  IN_TRANSIT_LINEHAUL: '✈️ In Transit',
  REACHED_DESTINATION_HUB: '🏭 At Dest Hub',
  OUT_FOR_DELIVERY: '🛵 Out for Delivery',
  DELIVERED: '✅ Delivered',
};

function StatusTimeline({ status }) {
  const steps = [
    { key: 'PENDING', label: 'Pickup', icon: '📦' },
    { key: 'PICKED_UP', label: 'Picked Up', icon: '🚚' },
    { key: 'REACHED_ORIGIN_HUB', label: 'Origin Hub', icon: '🏭' },
    { key: 'IN_TRANSIT_LINEHAUL', label: 'In Transit', icon: '✈️' },
    { key: 'REACHED_DESTINATION_HUB', label: 'Dest Hub', icon: '🏭' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
    { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
  ];

  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div style={{ overflowX: 'auto', padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: '560px', gap: 0 }}>
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && (
                  <div style={{
                    flex: 1,
                    height: 3,
                    background: i <= currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.4s'
                  }} />
                )}
                <div style={{
                  width: 34, height: 34,
                  borderRadius: '50%',
                  border: active ? '3px solid var(--accent)' : done ? '3px solid #10b981' : '3px solid rgba(255,255,255,0.18)',
                  background: active ? 'rgba(99,102,241,0.25)' : done ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  transition: 'all 0.4s',
                  flexShrink: 0,
                  boxShadow: active ? '0 0 12px rgba(99,102,241,0.6)' : 'none'
                }}>
                  {done ? '✓' : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 3,
                    background: i < currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.4s'
                  }} />
                )}
              </div>
              <div style={{
                fontSize: 10,
                marginTop: 6,
                color: active ? 'var(--accent)' : done ? '#10b981' : 'rgba(255,255,255,0.35)',
                textAlign: 'center',
                fontWeight: active ? 700 : 400,
                maxWidth: 64
              }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showCodModal, setShowCodModal] = useState(null);
  const [tab, setTab] = useState('active'); // 'active' | 'delivered'
  const navigate = useNavigate();
  const courier = JSON.parse(localStorage.getItem('courier'));

  useEffect(() => {
    if (!courier) navigate('/login');
  }, []);

  const fetchShipments = async () => {
    if (!courier) return;
    try {
      // My assigned shipments
      const res = await fetch(`${API_BASE}/api/shipping?courierId=${courier.id}`);
      const mine = await res.json();

      // All unclaimed shipments globally (to allow testing cross-city flows)
      const res2 = await fetch(`${API_BASE}/api/shipping`);
      const allShipments = await res2.json();
      const available = allShipments.filter(s => s.status === 'PENDING' && !s.courierId);

      // Nearby unclaimed shipments at destination hub (local last-mile delivery)
      const res3 = await fetch(`${API_BASE}/api/shipping/nearby?location=${encodeURIComponent(courier.location)}`);
      const nearby = res3.ok ? await res3.json() : [];

      const all = [...mine, ...available, ...nearby];
      const unique = Array.from(new Map(all.map(s => [s.id, s])).values());
      setShipments(unique);
    } catch (e) {
      console.error('Failed to fetch shipments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  // Open Google Maps — route from origin to destination if possible
  const openMaps = (shipment) => {
    const dest = shipment.deliveryAddress || shipment.destHub || shipment.sellerLocation;
    const origin = shipment.originAddress || shipment.sellerLocation;
    
    if (shipment.status === 'PENDING' || shipment.status === 'COLLECTED') {
        // Just navigate to seller for pickup
        const query = encodeURIComponent(origin);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    } else {
        // Navigate from seller/hub to destination
        if (origin && origin !== dest) {
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`, '_blank');
        } else {
            const query = encodeURIComponent(dest);
            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        }
    }
  };

  const handleUpdateStatus = async (trackingId, newStatus) => {
    if (newStatus === 'DELIVERED') {
      const shipment = shipments.find(s => s.trackingId === trackingId);
      if (shipment && shipment.paymentMethod === 'COD') {
        setShowCodModal(shipment);
        return;
      }
    }
    await executeUpdate(trackingId, newStatus);
  };

  const executeUpdate = async (trackingId, newStatus) => {
    setUpdating(trackingId);
    try {
      const res = await fetch(`${API_BASE}/api/shipping/${trackingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, courierId: courier.id })
      });
      if (res.ok) {
        fetchShipments();
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Network error updating status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  const activeShipments = shipments.filter(s => s.status !== 'DELIVERED');
  const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED');
  const display = tab === 'active' ? activeShipments : deliveredShipments;

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>Nexus Logistics</h1>
          <p>Welcome, {courier?.name} ({courier?.location})</p>
        </div>
        <button
          className="btn"
          style={{ flex: 'none', minWidth: 'auto', padding: '0.6rem 1.5rem' }}
          onClick={() => { localStorage.removeItem('courier'); navigate('/login'); }}
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, margin: '0 0 20px 0' }}>
        {[['active', `🚚 Active (${activeShipments.length})`], ['delivered', `✅ Delivered (${deliveredShipments.length})`]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 22px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: tab === key ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
              color: tab === key ? '#fff' : 'rgba(255,255,255,0.55)',
              fontWeight: tab === key ? 700 : 400, fontSize: 14, transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="shipment-list">
        {display.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            {tab === 'active' ? 'No active shipments at the moment.' : 'No delivered shipments yet.'}
          </div>
        ) : (
          display.map(shipment => (
            <div className="shipment-card" key={shipment.trackingId} style={{
              opacity: shipment.status === 'DELIVERED' ? 0.8 : 1,
              borderLeft: shipment.status === 'DELIVERED' ? '4px solid #10b981' : '4px solid var(--accent)'
            }}>
              {/* Header */}
              <div className="shipment-header">
                <div className="tracking-info">
                  <h2>{shipment.trackingId}</h2>
                  <p>Order ID: {shipment.orderId}</p>
                </div>
                <div className={`status-badge status-${shipment.status}`} style={{
                  background: shipment.status === 'DELIVERED' ? 'rgba(16,185,129,0.18)' :
                    shipment.status === 'OUT_FOR_DELIVERY' ? 'rgba(245,158,11,0.18)' : 'rgba(99,102,241,0.18)',
                  color: shipment.status === 'DELIVERED' ? '#10b981' :
                    shipment.status === 'OUT_FOR_DELIVERY' ? '#f59e0b' : 'var(--accent)',
                  border: '1px solid currentColor', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700
                }}>
                  {STATUS_LABEL[shipment.status] || shipment.status.replace(/_/g, ' ')}
                </div>
              </div>

              {/* Status Timeline */}
              <div style={{ marginBottom: 12 }}>
                <StatusTimeline status={shipment.status} />
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.875rem', marginBottom: 12 }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  From: <strong style={{ color: 'white' }}>{shipment.sellerLocation}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  To: <strong style={{ color: 'white' }}>{shipment.destHub}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Payment: <strong style={{ color: shipment.paymentMethod === 'COD' ? '#f59e0b' : '#10b981' }}>
                    {shipment.paymentMethod}
                  </strong>
                </div>
                <div style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                  Amount: <strong style={{ color: 'white' }}>₹{shipment.amount?.toFixed(2)}</strong>
                </div>
              </div>

              {/* Delivery address + Google Maps button (visible when OUT_FOR_DELIVERY or DELIVERED) */}
              {(shipment.status === 'OUT_FOR_DELIVERY' || shipment.status === 'DELIVERED') && (
                <div style={{
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>📍 Delivery Address</div>
                    <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>
                      {shipment.deliveryAddress || shipment.destHub || 'See destination city'}
                    </div>
                  </div>
                  {shipment.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => openMaps(shipment)}
                      style={{
                        background: 'linear-gradient(135deg, #4285f4, #34a853)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      🗺️ Open Maps
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons — shown based on current status, no role restriction */}
              {shipment.status !== 'DELIVERED' && (
                <div className="shipment-actions">
                  {shipment.status === 'PENDING' && (
                    <button
                      className="btn primary"
                      disabled={updating === shipment.trackingId}
                      onClick={() => handleUpdateStatus(shipment.trackingId, 'PICKED_UP')}
                    >
                      {updating === shipment.trackingId ? 'Updating...' : '🚚 Pick Up from Seller'}
                    </button>
                  )}
                  {shipment.status === 'PICKED_UP' && (
                    <button
                      className="btn primary"
                      disabled={updating === shipment.trackingId}
                      onClick={() => handleUpdateStatus(shipment.trackingId, 'REACHED_ORIGIN_HUB')}
                    >
                      {updating === shipment.trackingId ? 'Updating...' : '🏭 Drop at Origin Hub'}
                    </button>
                  )}
                  {shipment.status === 'REACHED_ORIGIN_HUB' && (
                    <button
                      className="btn primary"
                      disabled={updating === shipment.trackingId}
                      onClick={() => handleUpdateStatus(shipment.trackingId, 'IN_TRANSIT_LINEHAUL')}
                    >
                      {updating === shipment.trackingId ? 'Updating...' : '✈️ Start Transit'}
                    </button>
                  )}
                  {shipment.status === 'IN_TRANSIT_LINEHAUL' && (
                    <button
                      className="btn primary"
                      disabled={updating === shipment.trackingId}
                      onClick={() => handleUpdateStatus(shipment.trackingId, 'REACHED_DESTINATION_HUB')}
                    >
                      {updating === shipment.trackingId ? 'Updating...' : '🏭 Reached Destination Hub'}
                    </button>
                  )}
                  {shipment.status === 'REACHED_DESTINATION_HUB' && (
                    <button
                      className="btn primary"
                      disabled={updating === shipment.trackingId}
                      onClick={() => handleUpdateStatus(shipment.trackingId, 'OUT_FOR_DELIVERY')}
                    >
                      {updating === shipment.trackingId ? 'Updating...' : '🛵 Out for Delivery'}
                    </button>
                  )}
                  {shipment.status === 'OUT_FOR_DELIVERY' && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => openMaps(shipment)}
                        style={{
                          background: 'linear-gradient(135deg, #4285f4, #34a853)',
                          color: '#fff', border: 'none', borderRadius: 10,
                          padding: '10px 18px', fontSize: 14, fontWeight: 700,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        🗺️ Navigate to Customer
                      </button>
                      <button
                        className="btn success"
                        disabled={updating === shipment.trackingId}
                        onClick={() => handleUpdateStatus(shipment.trackingId, 'DELIVERED')}
                        style={{ flex: 1 }}
                      >
                        {updating === shipment.trackingId ? 'Updating...' : '✅ Mark as Delivered'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {shipment.status === 'DELIVERED' && (
                <div style={{
                  textAlign: 'center', color: '#10b981', fontWeight: 700,
                  fontSize: 14, padding: '8px 0', letterSpacing: 0.5
                }}>
                  ✅ Successfully Delivered
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* COD Modal */}
      {showCodModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="shipment-card" style={{ maxWidth: '420px', width: '94%', textAlign: 'center' }}>
            <h2 style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>💵 Cash Collection Required</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              This is a COD order. Collect <strong style={{ color: 'white', fontSize: 18 }}>₹{showCodModal.amount?.toFixed(2)}</strong> from the customer before marking as delivered.
            </p>
            {showCodModal.deliveryAddress && (
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: '1.25rem', textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>📍 Delivery Address</div>
                <div style={{ fontSize: 13, color: 'white' }}>{showCodModal.deliveryAddress}</div>
              </div>
            )}
            <div style={{ padding: '1.5rem', background: 'white', borderRadius: '10px', marginBottom: '1.25rem', display: 'inline-block' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NexusPay:${showCodModal.amount}`} alt="QR Code" />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowCodModal(null)}>Cancel</button>
              <button className="btn success" onClick={() => {
                setShowCodModal(null);
                executeUpdate(showCodModal.trackingId, 'DELIVERED');
              }}>✅ Confirm Cash Collected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
