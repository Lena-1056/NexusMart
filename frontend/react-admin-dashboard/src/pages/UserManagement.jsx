import { useState, useEffect } from 'react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    fetch('http://localhost:8084/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(e => console.error(e))
  }, [])

  const filtered = users.filter(u =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  const toggleStatus = (id) => {
    const user = users.find(u => u.id === id)
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const token = localStorage.getItem('adminToken')
    fetch(`http://localhost:8084/api/users/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    }).then(() => {
      setUsers(p => p.map(u => u.id === id ? { ...u, status: newStatus } : u))
    })
  }

  const del = (id) => {
    if (confirm('Delete this user?')) {
      const token = localStorage.getItem('adminToken')
      fetch(`http://localhost:8084/api/users/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => setUsers(p => p.filter(u => u.id !== id)))
    }
  }

  const active    = users.filter(u => u.status === 'ACTIVE').length
  const suspended = users.filter(u => u.status === 'SUSPENDED').length

  return (
    <>
      <div className="page-header">
        <h2>👥 User Management</h2>
        <p>Manage all registered customers and administrators on the platform.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        {[
          { icon:'👥', cls:'icon-blue',    label:'Total Users', val: users.length },
          { icon:'✅', cls:'icon-emerald', label:'Active',      val: active       },
          { icon:'🚫', cls:'icon-rose',    label:'Suspended',   val: suspended    },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
            <div className="stat-info"><h4>{s.label}</h4><div className="val">{s.val}</div></div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h3>All Users</h3>
          <input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or email..." />
        </div>
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Orders</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="clickable-row" onClick={() => setSelectedUser(u)}>
                <td><code>{u.id}</code></td>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className="badge badge-pending">{u.role}</span></td>
                <td><span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{u.status}</span></td>
                <td>{u.joined}</td>
                <td>{u.orders}</td>
                <td className="action-btns" onClick={e => e.stopPropagation()}>
                  {u.status === 'ACTIVE' 
                    ? <button className="btn btn-sm btn-warning" onClick={() => toggleStatus(u.id)}>Suspend</button>
                    : <button className="btn btn-sm btn-success" onClick={() => toggleStatus(u.id)}>Activate</button>
                  }
                  <button className="btn btn-sm btn-danger" onClick={() => del(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedUser(null)}>×</button>
            <h3 style={{fontSize:20,marginBottom:8,color:'#f1f5f9'}}>👤 User Details</h3>
            <p style={{color:'#94a3b8',fontSize:13,marginBottom:20}}>Detailed profile and platform activity.</p>
            <div className="modal-detail-grid">
              <strong>User ID:</strong>     <code>{selectedUser.id}</code>
              <strong>Full Name:</strong>   <span>{selectedUser.name}</span>
              <strong>Email:</strong>       <span>{selectedUser.email}</span>
              <strong>Role:</strong>        <span className="badge badge-pending">{selectedUser.role}</span>
              <strong>Status:</strong>      <span className={`badge ${selectedUser.status==='ACTIVE'?'badge-active':'badge-inactive'}`}>{selectedUser.status}</span>
              <strong>Joined Date:</strong> <span>{selectedUser.joined}</span>
              <strong>Total Orders:</strong><span>{selectedUser.orders}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
