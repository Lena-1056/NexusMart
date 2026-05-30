import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

export default function MyOrders({ customer }) {
  const { formatCurrency } = useCurrency()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelStatus, setCancelStatus] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const resAll = await fetch(`${SERVICES.ORDER}/orders`)
      const dataAll = await resAll.json()
      
      const pRes = await fetch(`${SERVICES.PRODUCT}/products`)
      const pData = await pRes.json()

      const enrichedOrders = dataAll.filter(o => o.customer === customer.email).map(o => {
        const p = pData.find(prod => prod.id === o.product)
        return { ...o, productDetails: p }
      }).sort((a,b) => new Date(b.date) - new Date(a.date))

      setOrders(enrichedOrders)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelModalOrder) return;
    const orderId = cancelModalOrder.id;
    setCancellingId(orderId)
    setCancelStatus(null)
    try {
      const res = await fetch(`${SERVICES.ORDER}/orders/${orderId}/cancel`, { method: 'PUT' })
      if (res.ok) {
        setCancelStatus('SUCCESS')
        fetchOrders()
      } else {
        setCancelStatus('ERROR')
      }
    } catch (e) {
      setCancelStatus('ERROR')
    } finally {
      setCancellingId(null)
    }
  }

  const closeCancelModal = () => {
    setCancelModalOrder(null)
    setCancelStatus(null)
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  const visibleOrders = orders.filter(o => filter === 'ALL' || o.status === filter)

  return (
    <div>
      <div className="page-header" style={{ justifyContent: 'flex-start' }}>
        <Package size={28} color="var(--accent)" />
        <h1 className="page-title" style={{ marginBottom: 0 }}>My Orders</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {['ALL','CREATED','ACCEPTED','PACKED','SHIPPED','DELIVERED','CANCELLED'].map(f => (
          <button 
            key={f} 
            className="btn-ghost" 
            style={{ padding: '6px 16px', background: filter === f ? 'var(--accent)' : 'var(--bg-card)', color: filter === f ? '#fff' : 'var(--text-1)', borderRadius: '20px', border: filter === f ? 'none' : '1px solid var(--border)' }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h2 className="empty-title">{filter === 'ALL' ? "No orders yet" : `No ${filter.toLowerCase()} orders`}</h2>
          <p className="empty-desc">When you buy something, it will appear here.</p>
          <Link to="/" className="btn-primary" style={{ padding: '12px 32px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {visibleOrders.map(order => (
            <div key={order.id} className="order-card" style={{ opacity: order.status === 'CANCELLED' ? 0.7 : 1 }}>
              <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="order-id">Order ID: <span>{order.id}</span></div>
                  <div className="order-date">Date: <span>{new Date(order.date).toLocaleDateString()}</span></div>
                  {order.paymentMethod && <div className="order-date">Method: <span style={{ fontWeight: 600 }}>{order.paymentMethod}</span></div>}
                </div>
                {(['CREATED','ACCEPTED','PACKED','PENDING_PAYMENT','PROCESSING'].includes(order.status)) && (
                  <button 
                    className="btn-ghost" 
                    style={{ color: 'var(--rose)', border: '1px solid var(--rose)' }}
                    onClick={() => setCancelModalOrder(order)}
                    disabled={cancellingId === order.id}
                  >
                    {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>

              {order.status !== 'CANCELLED' ? (() => {
                const s = order.status;
                const placed = ['CREATED','ACCEPTED','PACKED','DISPATCHED','SHIPPED','IN_TRANSIT','REACHED_ORIGIN_HUB','IN_TRANSIT_LINEHAUL','REACHED_DESTINATION_HUB','OUT_FOR_DELIVERY','DELIVERED'].includes(s);
                const packed = ['PACKED','DISPATCHED','SHIPPED','IN_TRANSIT','REACHED_ORIGIN_HUB','IN_TRANSIT_LINEHAUL','REACHED_DESTINATION_HUB','OUT_FOR_DELIVERY','DELIVERED'].includes(s);
                const shipped = ['DISPATCHED','SHIPPED','IN_TRANSIT','REACHED_ORIGIN_HUB','IN_TRANSIT_LINEHAUL','REACHED_DESTINATION_HUB','OUT_FOR_DELIVERY','DELIVERED'].includes(s);
                const inTransit = ['IN_TRANSIT','REACHED_ORIGIN_HUB','IN_TRANSIT_LINEHAUL','REACHED_DESTINATION_HUB','OUT_FOR_DELIVERY','DELIVERED'].includes(s);
                const outForDelivery = ['OUT_FOR_DELIVERY','DELIVERED'].includes(s);
                const delivered = s === 'DELIVERED';
                return (
                  <div className="order-timeline">
                    <div className={`timeline-step ${placed ? 'completed' : ''} ${['CREATED','ACCEPTED'].includes(s) ? 'active' : ''}`}>
                      <div className="timeline-icon">1</div>
                      <div className="timeline-label">Placed</div>
                    </div>
                    <div className={`timeline-step ${packed ? 'completed' : ''} ${s === 'PACKED' ? 'active' : ''}`}>
                      <div className="timeline-icon">2</div>
                      <div className="timeline-label">Packed</div>
                    </div>
                    <div className={`timeline-step ${shipped ? 'completed' : ''} ${['DISPATCHED','SHIPPED'].includes(s) ? 'active' : ''}`}>
                      <div className="timeline-icon">3</div>
                      <div className="timeline-label">Shipped</div>
                    </div>
                    <div className={`timeline-step ${inTransit ? 'completed' : ''} ${['IN_TRANSIT','REACHED_ORIGIN_HUB','IN_TRANSIT_LINEHAUL','REACHED_DESTINATION_HUB'].includes(s) ? 'active' : ''}`}>
                      <div className="timeline-icon">4</div>
                      <div className="timeline-label">In Transit</div>
                    </div>
                    <div className={`timeline-step ${outForDelivery ? 'completed' : ''} ${s === 'OUT_FOR_DELIVERY' ? 'active' : ''}`}>
                      <div className="timeline-icon">5</div>
                      <div className="timeline-label">Out for Delivery</div>
                    </div>
                    <div className={`timeline-step ${delivered ? 'completed' : ''} ${s === 'DELIVERED' ? 'active' : ''}`}>
                      <div className="timeline-icon">6</div>
                      <div className="timeline-label">Delivered</div>
                    </div>
                  </div>
                );
              })() : (
                <div className="error-message" style={{ marginBottom: '24px', background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', padding: '12px', borderRadius: '8px' }}>
                  <XCircle size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }}/>
                  This order has been cancelled. {order.payment === 'REFUNDED' ? 'The amount has been refunded to your account.' : ''}
                </div>
              )}
              
              <div className="order-body">
                <div className="order-product">
                  <div className="order-img" style={{ padding: '4px' }}>
                    {order.productDetails?.emoji?.startsWith('data:image') ? (
                      <img src={order.productDetails.emoji.split('||')[0]} alt={order.productDetails.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>{order.productDetails?.emoji || '📦'}</span>
                    )}
                  </div>
                  <div>
                    <Link to={`/product/${order.product}`} className="order-pname">
                      {order.productDetails ? order.productDetails.name : `Product ID: ${order.product}`}
                    </Link>
                    <div className="order-seller">Seller: {order.seller}</div>
                  </div>
                </div>
                <div className="order-amount">
                  {formatCurrency(order.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelModalOrder && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {cancelStatus === 'SUCCESS' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={48} color="var(--emerald)" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--emerald)' }}>Order Cancelled Successfully</h3>
                <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Your order has been successfully cancelled and any applicable refunds have been initiated.</p>
                <button className="btn-primary" onClick={closeCancelModal} style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            ) : cancelStatus === 'ERROR' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <XCircle size={48} color="var(--rose)" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--rose)' }}>Failed to Cancel Order</h3>
                <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>There was an error cancelling your order. It may have already been shipped or processed.</p>
                <button className="btn-primary" onClick={closeCancelModal} style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={24} /> Cancel Order
                </h2>
                <p style={{ color: 'var(--text-2)' }}>Are you sure you want to cancel the following order?</p>
                
                <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', margin: '20px 0', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-2)' }}>Order ID:</span>
                    <span style={{ fontWeight: 600 }}>{cancelModalOrder.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-2)' }}>Date:</span>
                    <span>{new Date(cancelModalOrder.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-2)' }}>Total Amount:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{formatCurrency(cancelModalOrder.amount)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {cancelModalOrder.productDetails?.emoji?.startsWith('data:image') ? (
                        <img src={cancelModalOrder.productDetails.emoji.split('||')[0]} alt="product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '24px' }}>{cancelModalOrder.productDetails?.emoji || '📦'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cancelModalOrder.productDetails ? cancelModalOrder.productDetails.name : 'Product'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <button className="btn-ghost" onClick={closeCancelModal} disabled={cancellingId === cancelModalOrder.id}>
                    Keep Order
                  </button>
                  <button className="btn-primary" style={{ background: 'var(--rose)', color: '#fff' }} onClick={confirmCancel} disabled={cancellingId === cancelModalOrder.id}>
                    {cancellingId === cancelModalOrder.id ? 'Cancelling...' : 'Yes, Cancel Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
