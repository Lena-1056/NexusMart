import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'

const statusMap = {
  DELIVERED:  'badge-active',
  SHIPPED:    'badge-approved',
  PROCESSING: 'badge-pending',
  PENDING:    'badge-pending',
  CANCELLED:  'badge-inactive',
}

export default function Dashboard() {
  const { formatCurrency } = useCurrency()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, newUsers: 0, avgOrderVal: 0, revenueChange: "0%", ordersChange: "0%"
  })
  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetch('http://localhost:8084/api/admin/dashboard')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(e => console.error(e))

    fetch('http://localhost:8084/api/orders')
      .then(r => r.json())
      .then(data => setOrders(data.slice(0, 5)))
      .catch(e => console.error(e))
  }, [])

  return (
    <>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back, Super Admin. Here's what's happening on the platform.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-emerald">💰</div>
          <div className="stat-info"><h4>Total Revenue</h4><div className="val">{formatCurrency(stats.revenue)}</div></div>
          <div className="stat-trend trend-up">{stats.revenueChange}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-blue">📦</div>
          <div className="stat-info"><h4>Total Orders</h4><div className="val">{stats.orders.toLocaleString()}</div></div>
          <div className="stat-trend trend-up">{stats.ordersChange}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-purple">👥</div>
          <div className="stat-info"><h4>New Users</h4><div className="val">{stats.newUsers.toLocaleString()}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-rose">🛒</div>
          <div className="stat-info"><h4>Avg Order Value</h4><div className="val">{formatCurrency(stats.avgOrderVal)}</div></div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>Recent Orders</h3>
          <Link to="/orders" className="btn btn-ghost btn-sm">View All Orders →</Link>
        </div>
        <table>
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="clickable-row" onClick={() => setSelectedOrder(o)}>
                <td><code>{o.id}</code></td>
                <td>{o.customer}</td>
                <td>{o.product}</td>
                <td><strong>{formatCurrency(o.amount)}</strong></td>
                <td><span className={`badge ${statusMap[o.status]}`}>{o.status}</span></td>
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
              <strong>Product:</strong>     <span>{selectedOrder.product}</span>
              <strong>Amount:</strong>      <span>{formatCurrency(selectedOrder.amount)}</span>
              <strong>Status:</strong>      <span className={`badge ${statusMap[selectedOrder.status]}`}>{selectedOrder.status}</span>
              <strong>Tracking URL:</strong><a href="#" style={{color:'#60a5fa'}}>Track Package ↗</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
