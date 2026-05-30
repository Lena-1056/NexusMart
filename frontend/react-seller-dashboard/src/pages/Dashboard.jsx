import { useState, useEffect } from 'react'
import { API_BASE } from '../config'
import { useCurrency } from '../context/CurrencyContext'

export default function Dashboard({ seller }) {
  const { formatCurrency } = useCurrency()
  const [stats, setStats] = useState({ revenue: 0, orders: 0, activeProducts: 0, pendingOrders: 0, deliveredOrders: 0, totalProducts: 0 })

  useEffect(() => {
    if (!seller?.store) return
    
    const token = localStorage.getItem('sellerAuthToken')
    fetch(`${API_BASE}/api/sellers/dashboard/${encodeURIComponent(seller.store)}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        setStats({
          revenue: data.revenue || 0,
          orders: data.totalOrders || 0,
          activeProducts: data.activeProducts || 0,
          pendingOrders: data.pendingOrders || 0,
          deliveredOrders: data.deliveredOrders || 0,
          totalProducts: data.totalProducts || 0
        })
      })
      .catch(e => console.error('Dashboard fetch error:', e))
  }, [seller])

  return (
    <>
      <div className="page-header">
        <h2>📊 Sales Dashboard</h2>
        <p>Welcome back to {seller?.store || 'your store'}. Here is your overview.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon icon-emerald">💰</div>
          <div className="stat-info">
            <h4>Total Revenue</h4>
            <div className="val">{formatCurrency(stats.revenue)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-blue">📦</div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <div className="val">{stats.orders}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-indigo">🏷️</div>
          <div className="stat-info">
            <h4>Active Products</h4>
            <div className="val">{stats.activeProducts}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-amber">⭐</div>
          <div className="stat-info">
            <h4>Store Rating</h4>
            <div className="val">{seller?.rating || '0.0'}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{marginTop: 0}}>
        <div className="stat-card">
          <div className="stat-icon icon-blue">📋</div>
          <div className="stat-info">
            <h4>Total Products</h4>
            <div className="val">{stats.totalProducts}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-amber">⏳</div>
          <div className="stat-info">
            <h4>Pending Orders</h4>
            <div className="val">{stats.pendingOrders}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon icon-emerald">✅</div>
          <div className="stat-info">
            <h4>Delivered Orders</h4>
            <div className="val">{stats.deliveredOrders}</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Store Information</h3>
        <table style={{ width: '100%', maxWidth: '400px' }}>
          <tbody>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Store Name</td><td style={{fontWeight: 600, textAlign: 'right'}}>{seller?.store}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Owner</td><td style={{fontWeight: 600, textAlign: 'right'}}>{seller?.owner}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Email</td><td style={{fontWeight: 600, textAlign: 'right'}}>{seller?.email}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Category</td><td style={{fontWeight: 600, textAlign: 'right'}}>{seller?.cat}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Location</td><td style={{fontWeight: 600, textAlign: 'right'}}>{seller?.city}, {seller?.state}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)'}}>Address</td><td style={{fontWeight: 600, textAlign: 'right', whiteSpace: 'pre-wrap', maxWidth: '200px'}}>{seller?.address || 'No address set'}</td></tr>
            <tr><td style={{padding: '12px 0', borderBottom: 'none', color: 'var(--text-2)'}}>Status</td><td style={{fontWeight: 600, textAlign: 'right'}}><span className={`badge badge-${(seller?.status || 'pending').toLowerCase()}`}>{seller?.status || 'PENDING'}</span></td></tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
