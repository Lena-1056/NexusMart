import { useState, useEffect } from 'react'

const stars = (r) => '★'.repeat(r) + '☆'.repeat(5-r)

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([])
  const [query, setQuery]     = useState('')
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => {
    fetch('http://localhost:8084/api/reviews')
      .then(r => r.json())
      .then(data => setReviews(data))
      .catch(e => console.error(e))
  }, [])

  const approve = (id) => {
    fetch(`http://localhost:8084/api/reviews/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' })
    }).then(() => setReviews(p => p.map(r => r.id===id ? {...r, status:'APPROVED', flagged:false} : r)))
  }

  const del = (id) => {
    if(confirm('Delete this review completely?')) {
      fetch(`http://localhost:8084/api/reviews/${id}`, { method: 'DELETE' })
        .then(() => setReviews(p => p.filter(r => r.id!==id)))
    }
  }

  const flag = (id) => {
    fetch(`http://localhost:8084/api/reviews/${id}/flag`, { method: 'PUT' })
      .then(() => setReviews(p => p.map(r => r.id===id ? {...r, flagged:!r.flagged} : r)))
  }

  const visible = reviews
    .filter(r => filter==='FLAGGED' ? r.flagged : filter==='ALL' ? true : r.status===filter)
    .filter(r => !query || r.product.toLowerCase().includes(query.toLowerCase()) || r.customer.toLowerCase().includes(query.toLowerCase()))

  const avgRating = (() => {
    const app = reviews.filter(r => r.status==='APPROVED')
    return app.length ? (app.reduce((s,r)=>s+r.rating,0)/app.length).toFixed(1) : '0.0'
  })()

  return (
    <>
      <div className="page-header">
        <h2>⭐ Reviews Management</h2>
        <p>Moderate customer reviews, flag abusive content, and manage visibility.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:24 }}>
        {[
          { icon:'⭐', cls:'icon-amber',   label:'Avg Rating', val:`${avgRating} / 5`                           },
          { icon:'💬', cls:'icon-blue',    label:'Total',      val:reviews.length                               },
          { icon:'🚩', cls:'icon-rose',    label:'Flagged',    val:reviews.filter(r=>r.flagged).length         },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info"><h4>{s.label}</h4><div className="val">{s.val}</div></div>
          </div>
        ))}
      </div>

      <div className="filter-tabs">
        {['ALL','PENDING','APPROVED','FLAGGED'].map(f => (
          <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>All Reviews</h3>
          <input className="search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products or customers..." />
        </div>
        <table>
          <thead>
            <tr><th>ID</th><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id} className={r.flagged ? 'flagged-row' : ''}>
                <td><code>{r.id}</code></td>
                <td><strong>{r.product}</strong></td>
                <td>{r.customer}</td>
                <td>
                  <span className="star-gold">{stars(r.rating)}</span>
                  <span style={{color:'#94a3b8',fontSize:12}}> ({r.rating})</span>
                </td>
                <td style={{maxWidth:180,fontSize:13}}>{r.comment}</td>
                <td>
                  {r.flagged
                    ? <span className="badge badge-inactive">🚩 FLAGGED</span>
                    : <span className={`badge ${r.status==='APPROVED'?'badge-active':'badge-pending'}`}>{r.status}</span>
                  }
                </td>
                <td>{r.date}</td>
                <td className="action-btns">
                  {r.status==='PENDING' && <button className="btn btn-sm btn-success" onClick={()=>approve(r.id)}>Approve</button>}
                  <button className="btn btn-sm btn-warning" onClick={()=>flag(r.id)}>{r.flagged?'Unflag':'🚩 Flag'}</button>
                  <button className="btn btn-sm btn-danger"  onClick={()=>del(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
