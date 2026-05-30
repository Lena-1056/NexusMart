import { useState, useEffect } from 'react'
import { API_BASE, ORDER_API_BASE } from '../config'
import { useCurrency } from '../context/CurrencyContext'

const ORDER_API = `${ORDER_API_BASE}/api/orders`

export default function MyOrders({ seller }) {
  const { formatCurrency } = useCurrency()
  const [orders, setOrders] = useState([])
  const [updating, setUpdating] = useState(null)
  const [scanId, setScanId] = useState('')

  const fetchOrders = () => {
    if (!seller?.store) return
    const token = localStorage.getItem('sellerAuthToken')
    fetch(`${API_BASE}/api/orders/seller/${encodeURIComponent(seller.store)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(e => console.error('Orders fetch error:', e))
  }

  useEffect(() => {
    fetchOrders()
  }, [seller])

  const handleAction = async (orderId, actionName) => {
    if (!orderId) return;
    setUpdating(orderId)
    try {
      const token = localStorage.getItem('sellerAuthToken')
      const res = await fetch(`${ORDER_API}/${orderId}/${actionName}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
         fetchOrders()
      } else {
         alert(`Failed to ${actionName} order ${orderId}.`)
      }
    } catch (e) {
      console.error(e)
      alert(`Error updating order.`)
    } finally {
      setUpdating(null)
    }
  }

  const handleDispatch = async (orderId) => {
    if (!orderId) return;
    setUpdating(orderId)
    const token = localStorage.getItem('sellerAuthToken')
    try {
      const res = await fetch(`${ORDER_API}/${orderId}/dispatch`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
         fetchOrders()
         alert(`Order ${orderId} dispatched! Customer notified via email.`)
         setScanId('')
      } else {
         alert(`Failed to dispatch order ${orderId}. Ensure it is a valid ID for your store.`)
      }
    } catch (e) {
      console.error(e)
      alert("Error dispatching order.")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>🛒 Order Management</h2>
        <p>Monitor and fulfill incoming orders for your products.</p>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Scan & Dispatch</h3>
        <input 
           type="text" 
           placeholder="Scan or enter Order ID (e.g. ORD-1234)" 
           className="form-input"
           value={scanId}
           onChange={e => setScanId(e.target.value)}
           style={{ flex: 1, maxWidth: '300px' }}
        />
        <button className="btn-primary" onClick={() => handleDispatch(scanId)} disabled={!scanId || updating === scanId}>
          Dispatch Order
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>Recent Orders ({orders.length})</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Address</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="10" style={{textAlign:'center', padding: '40px', color: 'var(--text-2)'}}>No orders received yet. Keep promoting your store!</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td style={{fontFamily: 'monospace', color: 'var(--text-2)', fontSize: 12}}>{o.id}</td>
                <td><strong>{o.customer}</strong></td>
                <td><small style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{o.address || 'N/A'}</small></td>
                <td>
                  <div>{o.product}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.sub_category || 'N/A'}</div>
                </td>
                <td><strong>{formatCurrency(o.amount)}</strong></td>
                <td>{o.date}</td>
                <td><strong>{o.paymentMethod || 'N/A'}</strong></td>
                <td>
                  <span className={`badge ${o.payment === 'PAID' ? 'badge-approved' : o.payment === 'REFUNDED' ? 'badge-rejected' : 'badge-pending'}`}>
                    {o.payment}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    o.status === 'DELIVERED' ? 'badge-approved' :
                    o.status === 'CANCELLED' ? 'badge-rejected' :
                    (o.status === 'SHIPPED' || o.status === 'DISPATCHED' || o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY') ? 'badge-active' :
                    'badge-pending'
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(o.status === 'CREATED' || o.status === 'PENDING' || o.status === 'PROCESSING') && (
                      <>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: 'var(--emerald)', borderColor: 'var(--emerald)' }} disabled={updating === o.id} onClick={() => handleAction(o.id, 'accept')}>Accept</button>
                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: 'var(--rose)', borderColor: 'var(--rose)' }} disabled={updating === o.id} onClick={() => handleAction(o.id, 'reject')}>Reject</button>
                      </>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} disabled={updating === o.id} onClick={() => handleAction(o.id, 'pack')}>Pack</button>
                    )}
                    {o.status === 'PACKED' && (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: 'var(--amber)', borderColor: 'var(--amber)' }} disabled={updating === o.id} onClick={() => handleAction(o.id, 'dispatch')}>Hand over to Delivery Partner</button>
                    )}
                    {(o.status === 'DISPATCHED' || o.status === 'SHIPPED' || o.status === 'IN_TRANSIT' || o.status === 'OUT_FOR_DELIVERY') && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>With Courier</span>
                    )}
                    {(o.status === 'DELIVERED' || o.status === 'CANCELLED' || o.status === 'REJECTED_BY_SELLER') && (
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Done</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
