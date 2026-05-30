import { useState, useEffect } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const sCls = { PENDING: 'badge-pending', PROCESSING: 'badge-pending', SHIPPED: 'badge-active', DELIVERED: 'badge-active', CANCELLED: 'badge-inactive' }
const pCls = { PENDING: 'badge-pending', PAID: 'badge-approved', REFUNDED: 'badge-inactive' }
const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function OrderMonitoring() {
  const { formatCurrency } = useCurrency()
  const [orders, setOrders] = useState([])
  const [query, setQuery]   = useState('')
  const [filter, setFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8084/api/orders')
      .then(r => r.json())
      .then(data => setOrders(data))
      .catch(e => console.error(e))
  }, [])

  const updateStatus = (id, status) => {
    fetch(`http://localhost:8084/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(() => {
      setOrders(p => p.map(o => o.id===id ? {...o, status} : o))
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => ({...prev, status}))
      }
    })
  }

  const visible = orders
    .filter(o => filter==='ALL' || o.status===filter)
    .filter(o => !query || o.id.toLowerCase().includes(query.toLowerCase()) || o.customer.toLowerCase().includes(query.toLowerCase()))

  const revenue   = orders.filter(o=>o.payment==='PAID').reduce((s,o)=>s+o.amount,0)
  const delivered = orders.filter(o=>o.status==='DELIVERED').length
  const pending   = orders.filter(o=>o.status==='PENDING').length

  return (
    <>
      <div className="page-header">
        <h2>🛒 Order Monitoring</h2>
        <p>Track and manage all orders across the platform in real-time.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:24 }}>
        {[
          { icon:'💰', cls:'icon-emerald', label:'Revenue',   val:formatCurrency(revenue) },
          { icon:'📦', cls:'icon-blue',    label:'Delivered', val:delivered               },
          { icon:'⏳', cls:'icon-amber',   label:'Pending',   val:pending                 },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info"><h4>{s.label}</h4><div className="val">{s.val}</div></div>
          </div>
        ))}
      </div>

      <div className="filter-tabs">
        {['ALL','PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>All Orders</h3>
          <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order ID or customer..." />
        </div>
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Address</th><th>Seller</th><th>Product</th><th>Amount</th><th>Status</th><th>Method</th><th>Payment</th><th>Date</th><th>Update Status</th></tr>
          </thead>
          <tbody>
            {visible.map(o => (
              <tr key={o.id} className="clickable-row" onClick={() => setSelectedOrder(o)}>
                <td><strong>{o.id}</strong></td>
                <td>{o.customer}</td>
                <td><small style={{ color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{o.address || 'N/A'}</small></td>
                <td>{o.seller}</td>
                <td>
                  <div>{o.product}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.sub_category || 'N/A'}</div>
                </td>
                <td><strong>{formatCurrency(o.amount)}</strong></td>
                <td><span className={`badge ${sCls[o.status]}`}>{o.status}</span></td>
                <td><strong>{o.paymentMethod || 'N/A'}</strong></td>
                <td><span className={`badge ${pCls[o.payment]}`}>{o.payment}</span></td>
                <td>{o.date}</td>
                <td onClick={e => e.stopPropagation()}>
                  <select
                    className="search-input"
                    style={{ width:130, fontSize:12 }}
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            <h3 style={{fontSize:20,marginBottom:8,color:'#f1f5f9'}}>📦 Order & Tracking Details</h3>
            <p style={{color:'#94a3b8',fontSize:13,marginBottom:20}}>Comprehensive tracking and fulfillment information.</p>
            <div className="modal-detail-grid">
              <strong>Order ID:</strong>    <code>{selectedOrder.id}</code>
              <strong>Customer:</strong>    <span>{selectedOrder.customer}</span>
              <strong>Delivery To:</strong> <span>{selectedOrder.address || 'N/A'}</span>
              <strong>Seller:</strong>      <span>{selectedOrder.seller}</span>
              <strong>Product:</strong>     <span>{selectedOrder.product} / {selectedOrder.sub_category || 'N/A'}</span>
              <strong>Amount:</strong>      <span>{formatCurrency(selectedOrder.amount)}</span>
              <strong>Method:</strong>      <span>{selectedOrder.paymentMethod || 'N/A'}</span>
              <strong>Payment:</strong>     <span className={`badge ${pCls[selectedOrder.payment]}`}>{selectedOrder.payment}</span>
              <strong>Status:</strong>      <span className={`badge ${sCls[selectedOrder.status]}`}>{selectedOrder.status}</span>
              <strong>Order Date:</strong>  <span>{selectedOrder.date}</span>
              <strong>Tracking URL:</strong><a href="#" style={{color:'#60a5fa'}}>Track Package ↗</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
