import { useState, useEffect } from 'react'

const typeCls = { SYSTEM:'badge-approved', ORDER:'badge-active', SELLER:'badge-pending', PROMO:'badge-active', ALERT:'badge-inactive' }

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [msg, setMsg]           = useState('')
  const [recipient, setRecipient] = useState('ALL')

  useEffect(() => {
    fetch('http://localhost:8084/api/notifications')
      .then(r => r.json())
      .then(data => setNotifs(data))
      .catch(e => console.error(e))
  }, [])

  const unread = notifs.filter(n => !n.read).length

  const markRead = (id) => {
    fetch(`http://localhost:8084/api/notifications/${id}/read`, { method: 'PUT' })
      .then(() => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n)))
  }
  
  const markAllRead = () => {
    const unread = notifs.filter(n => !n.read)
    Promise.all(unread.map(n => fetch(`http://localhost:8084/api/notifications/${n.id}/read`, { method: 'PUT' })))
      .then(() => setNotifs(p => p.map(n => ({ ...n, read: true }))))
  }
  
  const del = (id) => {
    fetch(`http://localhost:8084/api/notifications/${id}`, { method: 'DELETE' })
      .then(() => setNotifs(p => p.filter(n => n.id !== id)))
  }

  const send = () => {
    if (!msg.trim()) return
    fetch('http://localhost:8084/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, recipient: recipient })
    })
      .then(r => r.json())
      .then(data => {
        setNotifs([data, ...notifs])
        setMsg('')
      })
      .catch(e => console.error(e))
  }

  return (
    <>
      <div className="page-header">
        <h2>🔔 Notifications</h2>
        <p>Manage and broadcast platform notifications to users, sellers, or admins.</p>
      </div>

      {/* Broadcast Form */}
      <div className="card" style={{ marginBottom:24 }}>
        <h3 style={{ marginBottom:16, color:'#f1f5f9', fontSize:15, fontWeight:600 }}>📢 Send Broadcast</h3>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <select className="search-input" value={recipient} onChange={e=>setRecipient(e.target.value)} style={{width:180}}>
            <option value="ALL">All Users</option>
            <option value="CUSTOMERS">Customers Only</option>
            <option value="SELLERS">Sellers Only</option>
            <option value="ADMIN">Admins Only</option>
          </select>
          <input className="search-input" style={{flex:1, minWidth:200}} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type notification message..." />
          <button className="btn btn-primary" onClick={send}>Send 🚀</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(2,1fr)', marginBottom:24 }}>
        <div className="stat-card"><div className="stat-icon icon-rose">🔴</div><div className="stat-info"><h4>Unread</h4><div className="val">{unread}</div></div></div>
        <div className="stat-card"><div className="stat-icon icon-blue">📨</div><div className="stat-info"><h4>Total</h4><div className="val">{notifs.length}</div></div></div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>Notification History</h3>
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark All Read</button>
        </div>
        <table>
          <thead>
            <tr><th>ID</th><th>Type</th><th>Message</th><th>Recipient</th><th>Time</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {notifs.map(n => (
              <tr key={n.id} className={!n.read ? 'unread-row' : ''}>
                <td><code>{n.id}</code></td>
                <td><span className={`badge ${typeCls[n.type]}`}>{n.type}</span></td>
                <td>{n.message}</td>
                <td><strong>{n.recipient}</strong></td>
                <td style={{color:'#94a3b8',fontSize:13}}>{n.time}</td>
                <td>{!n.read ? <span className="unread-dot">● Unread</span> : <span style={{color:'#475569',fontSize:13}}>Read</span>}</td>
                <td className="action-btns">
                  {!n.read && <button className="btn btn-sm btn-ghost" onClick={()=>markRead(n.id)}>Mark Read</button>}
                  <button className="btn btn-sm btn-danger" onClick={()=>del(n.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
