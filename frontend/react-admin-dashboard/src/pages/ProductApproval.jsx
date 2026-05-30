import { useState, useEffect, useCallback } from 'react'
import { useCurrency } from '../context/CurrencyContext'

const cls = { PENDING:'badge-pending', APPROVED:'badge-active', REJECTED:'badge-inactive' }

// Parse the emoji column — could be base64 images (joined by ||), a single emoji, or empty
const getImages = (emoji) => {
  if (!emoji) return []
  if (emoji.startsWith('data:image')) return emoji.split('||').filter(Boolean)
  return []
}
const getCover = (emoji) => {
  const imgs = getImages(emoji)
  return imgs.length > 0 ? imgs[0] : null
}

// Thumbnail shown in the table row
function CoverCell({ emoji, name }) {
  const cover = getCover(emoji)
  if (cover) {
    return (
      <img
        src={cover}
        alt={name}
        style={{
          width: 56, height: 56,
          objectFit: 'cover',
          borderRadius: 10,
          border: '1px solid var(--border)',
          display: 'block'
        }}
      />
    )
  }
  // Legacy emoji fallback
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 10,
      background: 'var(--bg-hover)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, border: '1px solid var(--border)'
    }}>
      {emoji || '📦'}
    </div>
  )
}

// Image gallery shown inside the detail modal
function ImageGallery({ emoji }) {
  const imgs = getImages(emoji)
  const [active, setActive] = useState(0)
  if (imgs.length === 0) return null
  return (
    <div style={{ marginBottom: 20 }}>
      {/* Main preview */}
      <img
        src={imgs[active]}
        alt={`Image ${active + 1}`}
        style={{
          width: '100%', height: 240,
          objectFit: 'contain',
          borderRadius: 12,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          display: 'block', marginBottom: 10
        }}
      />
      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {imgs.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Thumb ${i + 1}`}
              onClick={() => setActive(i)}
              style={{
                width: 56, height: 56,
                objectFit: 'cover',
                borderRadius: 8,
                cursor: 'pointer',
                border: `2px solid ${i === active ? 'var(--accent)' : 'var(--border)'}`,
                opacity: i === active ? 1 : 0.6,
                transition: 'all 0.15s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductApproval() {
  const { formatCurrency } = useCurrency()
  const [products, setProducts] = useState([])
  const [query,   setQuery]     = useState('')
  const [filter,  setFilter]    = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const token = localStorage.getItem('adminToken')
    fetch('http://localhost:8084/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Close modal immediately (sync), then optimistic-update the list.
  // Never call setSelected inside .then() — that re-opens the modal via stale closure.
  const update = (id, status) => {
    setSelected(null)                                               // close modal now
    setProducts(p => p.map(x => x.id === id ? { ...x, status } : x)) // optimistic
    const token = localStorage.getItem('adminToken')
    fetch(`http://localhost:8084/api/products/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    }).catch(() => load())  // on error, reload to restore true state
  }

  const visible = products
    .filter(p => filter === 'ALL' || p.status === filter)
    .filter(p => !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.seller.toLowerCase().includes(query.toLowerCase())
    )

  const counts = {
    PENDING:  products.filter(p => p.status === 'PENDING').length,
    APPROVED: products.filter(p => p.status === 'APPROVED').length,
    REJECTED: products.filter(p => p.status === 'REJECTED').length,
  }

  return (
    <>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h2>📦 Product Approval</h2>
          <p>Review and approve or reject product listings submitted by sellers.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ display:'inline-block', transition:'transform 0.4s', transform: loading ? 'rotate(360deg)' : 'none' }}>↻</span>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        {[
          { icon: '📋', cls: 'icon-amber',   label: 'Pending',  val: counts.PENDING  },
          { icon: '✅', cls: 'icon-emerald', label: 'Approved', val: counts.APPROVED },
          { icon: '❌', cls: 'icon-rose',    label: 'Rejected', val: counts.REJECTED },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info"><h4>{s.label}</h4><div className="val">{s.val}</div></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3>Product Listings ({visible.length})</h3>
          <input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products or sellers..." />
        </div>
        <table>
          <thead>
            <tr>
              <th>Cover Image</th>
              <th>Product</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No products found.</td></tr>
            ) : visible.map(p => (
              <tr key={p.id} className="clickable-row" onClick={() => setSelected(p)}>
                <td><CoverCell emoji={p.emoji} name={p.name} /></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.id}</div>
                </td>
                <td>{p.seller}</td>
                <td>
                  <div>{p.cat} / {p.sub_category || 'Other'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.brand || 'Generic'}</div>
                </td>
                <td><strong>{formatCurrency(p.price)}</strong></td>
                <td><span className={`badge ${cls[p.status]}`}>{p.status}</span></td>
                <td>{p.date}</td>
                <td className="action-btns" onClick={e => e.stopPropagation()}>
                  {p.status === 'PENDING' ? (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => update(p.id, 'APPROVED')}>Approve</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => update(p.id, 'REJECTED')}>Reject</button>
                    </>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>— No action —</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>

            <h3 style={{ fontSize: 20, marginBottom: 4, color: '#f1f5f9' }}>Product Details</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
              Submitted by <strong style={{ color: '#f1f5f9' }}>{selected.seller}</strong> · {selected.date}
            </p>

            {/* Image gallery */}
            <ImageGallery emoji={selected.emoji} />

            {/* Info grid */}
            <div className="modal-detail-grid">
              <strong>Product ID:</strong>  <code>{selected.id}</code>
              <strong>Name:</strong>        <span>{selected.name}</span>
              <strong>Seller:</strong>      <span>{selected.seller}</span>
              <strong>Category:</strong>  <span>{selected.cat} / {selected.sub_category || 'Other'}</span>
              <strong>Price:</strong>     <span style={{ color:'var(--accent)', fontWeight:600 }}>{formatCurrency(selected.price)}</span>
              <strong>Status:</strong>    <span className={`badge ${cls[selected.status]}`}>{selected.status}</span>
              <strong>Images:</strong>      <span>{getImages(selected.emoji).length} image(s)</span>
            </div>

            {/* Description */}
            {selected.description && (
              <div style={{
                marginTop: 16,
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 16px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em' }}>
                  Description
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#f1f5f9', lineHeight: 1.7 }}>
                  {selected.description}
                </p>
              </div>
            )}

            {/* Approve / Reject buttons */}
            {selected.status === 'PENDING' && (
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button className="btn btn-success" style={{ flex: 1 }}
                  onClick={() => update(selected.id, 'APPROVED')}>
                  ✅ Approve Product
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }}
                  onClick={() => update(selected.id, 'REJECTED')}>
                  ❌ Reject Product
                </button>
              </div>
            )}
            {selected.status === 'APPROVED' && (
              <div style={{ marginTop: 24 }}>
                <button className="btn btn-danger" style={{ width: '100%' }}
                  onClick={() => update(selected.id, 'REJECTED')}>
                  Revoke Approval
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
