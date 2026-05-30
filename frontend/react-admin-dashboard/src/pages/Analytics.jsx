import { useState, useEffect } from 'react'
import { useCurrency } from '../context/CurrencyContext'
import './Analytics.css'

export default function Analytics() {
  const { formatCurrency, currencyCode } = useCurrency()
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, newUsers: 0, avgOrderVal: 0, revenueChange: "+0%", ordersChange: "+0%"
  })
  
  const [analytics, setAnalytics] = useState({
    monthly: [],
    topProducts: []
  })

  useEffect(() => {
    fetch('http://localhost:8084/api/admin/dashboard')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(e => console.error(e))

    fetch('http://localhost:8084/api/admin/analytics')
      .then(r => r.json())
      .then(data => setAnalytics(data))
      .catch(e => console.error(e))
  }, [])

  const maxRevenue = analytics.monthly.length > 0 ? Math.max(...analytics.monthly.map(d => d.revenue)) : 1

  return (
    <>
      <div className="page-header">
        <h2>📈 Analytics</h2>
        <p>Platform-wide revenue, order, and user growth analytics.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:28 }}>
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
          <div className="stat-icon icon-indigo">👥</div>
          <div className="stat-info"><h4>New Users</h4><div className="val">{stats.newUsers.toLocaleString()}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-amber">📦</div>
          <div className="stat-info"><h4>Avg Order Val</h4><div className="val">{formatCurrency(stats.avgOrderVal)}</div></div>
        </div>
      </div>

      {/* CSS Bar Chart */}
      <div className="card" style={{ marginBottom:24 }}>
        <h3 style={{ marginBottom:24, color:'#f1f5f9', fontSize:16, fontWeight:600 }}>Monthly Revenue</h3>
        <div className="bar-chart">
          {analytics.monthly.map(d => (
            <div className="bar-item" key={d.month}>
              <div className="bar-val" style={{fontSize: 10}}>{formatCurrency(d.revenue)}</div>
              <div className="bar" style={{ height: (d.revenue/maxRevenue)*180 }} />
              <div className="bar-label">{d.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="table-container">
        <div className="table-toolbar"><h3>Top Performing Products</h3></div>
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Sales Share</th></tr>
          </thead>
          <tbody>
            {analytics.topProducts.map((p, i) => (
              <tr key={p.name}>
                <td><strong>{i+1}</strong></td>
                <td><span style={{fontSize:20,marginRight:8}}>{p.emoji}</span><strong>{p.name}</strong></td>
                <td>{p.sales}</td>
                <td><strong>{formatCurrency(p.revenue)}</strong></td>
                <td>
                  <div className="progress-wrap">
                    <div className="progress-fill" style={{ width:`${(p.sales/480)*100}%` }} />
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
