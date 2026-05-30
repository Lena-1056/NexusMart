import { useState, useEffect, useCallback, useRef } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const cls = {
  PENDING:   'badge-pending',
  APPROVED:  'badge-approved',
  REJECTED:  'badge-rejected',
  SUSPENDED: 'badge-inactive',
}

export default function SellerManagement() {
  const { formatCurrency } = useCurrency()
  const [sellers,  setSellers]  = useState([])
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    const token = localStorage.getItem('adminToken')
    fetch('http://localhost:8084/api/sellers', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setSellers(Array.isArray(data) ? data : [])
        setLastSync(new Date())
      })
      .catch(e => console.error('Sellers fetch error:', e))
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  // Close modal first (sync), optimistic update, then API call
  const update = (id, status) => {
    setSelected(null)
    setSellers(p => p.map(s => s.id === id ? { ...s, status } : s))
    fetch(`http://localhost:8084/api/sellers/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ status })
    }).catch(() => load())
  }

  const visible = sellers
    .filter(s => filter === 'ALL' || s.status === filter)
    .filter(s => !query ||
      s.store.toLowerCase().includes(query.toLowerCase()) ||
      s.owner.toLowerCase().includes(query.toLowerCase()) ||
      s.email.toLowerCase().includes(query.toLowerCase())
    )

  const counts = {
    PENDING:   sellers.filter(s => s.status === 'PENDING').length,
    APPROVED:  sellers.filter(s => s.status === 'APPROVED').length,
    REJECTED:  sellers.filter(s => s.status === 'REJECTED').length,
    SUSPENDED: sellers.filter(s => s.status === 'SUSPENDED').length,
  }

  const syncText = lastSync
    ? `Last synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : 'Loading…'

  return (
    <>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2>🏪 Seller Management</h2>
          <p>Review applications, approve or reject stores, and monitor seller performance.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          <button
            className="btn btn-ghost"
            onClick={() => load(false)}
            disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6 }}
          >
            <span style={{
              display: 'inline-block',
              animation: loading ? 'spin 0.8s linear infinite' : 'none'
            }}>↻</span>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <span style={{ fontSize: 11, color: '#64748b' }}>{syncText} · auto-refreshes every 30s</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { icon: '⏳', cls: 'icon-amber',   label: 'Pending',   val: counts.PENDING   },
          { icon: '✅', cls: 'icon-emerald', label: 'Approved',  val: counts.APPROVED  },
          { icon: '❌', cls: 'icon-rose',    label: 'Rejected',  val: counts.REJECTED  },
          { icon: '🚫', cls: 'icon-blue',    label: 'Suspended', val: counts.SUSPENDED },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info"><h4>{s.label}</h4><div className="val">{s.val}</div></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
            {f !== 'ALL' && counts[f] > 0 && (
              <span style={{
                background: f === 'PENDING' ? 'var(--amber)' : 'var(--accent)',
                color: '#fff', fontSize: 10, padding: '1px 5px',
                borderRadius: 6, marginLeft: 5
              }}>{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3>Seller Applications ({visible.length})</h3>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search store, owner, or email…"
          />
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Store</th>
              <th>Owner</th>
              <th>Email</th>
              <th>Category</th>
              <th>Status</th>
              <th>Revenue</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && sellers.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                Loading sellers…
              </td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                {sellers.length === 0
                  ? 'No sellers registered yet.'
                  : 'No sellers match your filter.'}
              </td></tr>
            ) : visible.map(s => (
              <tr key={s.id} className="clickable-row" onClick={() => setSelected(s)}>
                <td><code style={{ fontSize:11 }}>{s.id}</code></td>
                <td><strong>{s.store}</strong></td>
                <td>{s.owner}</td>
                <td style={{ fontSize:13, color:'#94a3b8' }}>{s.email}</td>
                <td>{s.cat}</td>
                <td><span className={`badge ${cls[s.status] || 'badge-pending'}`}>{s.status}</span></td>
                <td><strong>{formatCurrency(s.revenue)}</strong></td>
                <td>{s.rating ? <><span style={{ color:'#f59e0b' }}>★</span> {s.rating}</> : '—'}</td>
                <td className="action-btns" onClick={e => e.stopPropagation()}>
                  {s.status === 'PENDING' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => update(s.id, 'APPROVED')}>Approve</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => update(s.id, 'REJECTED')}>Reject</button>
                    </>
                  )}
                  {s.status === 'APPROVED' && (
                    <button className="btn btn-sm btn-warning" onClick={() => update(s.id, 'SUSPENDED')}>Suspend</button>
                  )}
                  {(s.status === 'SUSPENDED' || s.status === 'REJECTED') && (
                    <button className="btn btn-sm btn-success" onClick={() => update(s.id, 'APPROVED')}>Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <h3 style={{ fontSize:20, marginBottom:4, color:'#f1f5f9' }}>🏪 Seller Details</h3>
            <p style={{ color:'#94a3b8', fontSize:13, marginBottom:20 }}>Store profile and performance metrics.</p>
            <div className="modal-detail-grid">
              <strong>Seller ID:</strong>   <code>{selected.id}</code>
              <strong>Store Name:</strong>  <span>{selected.store}</span>
              <strong>Owner Name:</strong>  <span>{selected.owner}</span>
              <strong>Email:</strong>       <span>{selected.email}</span>
              <strong>Category:</strong>    <span>{selected.cat}</span>
              <strong>Status:</strong>      <span className={`badge ${cls[selected.status] || 'badge-pending'}`}>{selected.status}</span>
              <strong>Revenue:</strong>     <span>{formatCurrency(selected.revenue || 0)}</span>
              <strong>Rating:</strong>      <span>{selected.rating ? `${selected.rating} / 5.0` : 'No ratings yet'}</span>
            </div>

            <div style={{ marginTop: 24, display:'flex', gap:12, flexWrap:'wrap' }}>
              {selected.status === 'PENDING' && (
                <>
                  <button className="btn btn-success" style={{ flex:1 }} onClick={() => update(selected.id, 'APPROVED')}>✅ Approve</button>
                  <button className="btn btn-danger"  style={{ flex:1 }} onClick={() => update(selected.id, 'REJECTED')}>❌ Reject</button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <button className="btn btn-warning" style={{ width:'100%' }} onClick={() => update(selected.id, 'SUSPENDED')}>🚫 Suspend Seller</button>
              )}
              {(selected.status === 'SUSPENDED' || selected.status === 'REJECTED') && (
                <button className="btn btn-success" style={{ width:'100%' }} onClick={() => update(selected.id, 'APPROVED')}>✅ Reactivate Seller</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
