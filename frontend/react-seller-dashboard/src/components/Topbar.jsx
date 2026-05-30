import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '../config'
import { useCurrency } from '../context/CurrencyContext'
import './Topbar.css'

export default function Topbar({ seller, onLogout, onSellerUpdate }) {
  const { currencyCode, setCurrencyCode, currencies } = useCurrency()
  const [showProfile, setShowProfile]     = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const profileRef = useRef(null)

  // Edit form state — pre-fill from seller
  const [editStore, setEditStore]   = useState(seller?.store  || '')
  const [editOwner, setEditOwner]   = useState(seller?.owner  || '')
  const [editEmail, setEditEmail]   = useState(seller?.email  || '')
  const [editCat,   setEditCat]     = useState(seller?.cat    || 'Electronics')
  const [editCity,  setEditCity]    = useState(seller?.city   || 'Bengaluru')
  const [editState, setEditState]   = useState(seller?.state  || 'Karnataka')
  const [editAddress, setEditAddress] = useState(seller?.address || '')
  const [editPass,  setEditPass]    = useState('')
  const [showPass,  setShowPass]    = useState(false)
  const [editError, setEditError]   = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Sync form when seller changes
  useEffect(() => {
    if (seller) {
      setEditStore(seller.store || '')
      setEditOwner(seller.owner || '')
      setEditEmail(seller.email || '')
      setEditCat(seller.cat    || 'Electronics')
      setEditCity(seller.city  || 'Bengaluru')
      setEditState(seller.state || 'Karnataka')
      setEditAddress(seller.address || '')
    }
  }, [seller])

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const initials = seller?.store ? seller.store.substring(0, 2).toUpperCase() : 'ST'

  const openEdit = () => {
    setShowProfile(false)
    setEditError('')
    setEditSuccess(false)
    setEditPass('')
    setShowEditModal(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    setEditSuccess(false)
    try {
      // Update seller details via API
      const token = localStorage.getItem('sellerAuthToken')
      const res = await fetch(`${API_BASE}/api/sellers/${seller.id}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store: editStore,
          owner: editOwner,
          email: editEmail,
          cat:   editCat,
          city:  editCity,
          state: editState,
          address: editAddress,
          ...(editPass ? { password: editPass } : {})
        })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to update profile')
      }
      const updated = await res.json()
      setEditSuccess(true)
      // Notify parent to update seller context
      if (onSellerUpdate) onSellerUpdate(updated)
      setTimeout(() => setShowEditModal(false), 1200)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-date">{currentDate}</span>
        <div className="topbar-right">
          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', marginRight: '16px', fontWeight: 600 }}>
            {currencyCode}
          </div>
          <div className="dropdown-wrap" ref={profileRef}>
            <button
              className={`profile-btn ${showProfile ? 'active' : ''}`}
              onClick={() => setShowProfile(p => !p)}
            >
              <div className="avatar">{initials}</div>
              <div className="admin-info">
                <span className="admin-name">{seller?.store || 'My Store'}</span>
                <span className="admin-role">{seller?.owner || 'Owner'}</span>
              </div>
              <span className={`caret ${showProfile ? 'open' : ''}`}>▾</span>
            </button>

            {showProfile && (
              <div className="dropdown-panel profile-panel">
                {/* Profile Header */}
                <div className="profile-header">
                  <div className="avatar avatar-lg">{initials}</div>
                  <div>
                    <div className="profile-name">{seller?.store}</div>
                    <div className="profile-email">{seller?.email}</div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="role-badge">Seller</span>
                      <span className={`role-badge badge-${(seller?.status||'pending').toLowerCase()}`} style={{ background: seller?.status === 'APPROVED' ? 'rgba(16,185,129,.15)' : 'rgba(245,158,11,.15)', color: seller?.status === 'APPROVED' ? '#10b981' : '#f59e0b' }}>
                        {seller?.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span className="detail-label">Owner</span>
                    <span className="detail-value">{seller?.owner}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{seller?.cat}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="detail-label">Revenue</span>
                    <span className="detail-value">${parseFloat(seller?.revenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="detail-label">Rating</span>
                    <span className="detail-value">⭐ {seller?.rating || '0.0'}</span>
                  </div>
                </div>

                <div className="dp-divider" />

                {/* Actions */}
                <div className="profile-actions">
                  <button className="profile-action-btn edit-btn" onClick={openEdit}>
                    <span>✏️</span> Edit Details
                  </button>
                  <button className="profile-action-btn logout-btn-sm" onClick={() => { setShowProfile(false); onLogout() }}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            <h3 style={{ marginBottom: 6 }}>Edit Profile Details</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>Update your store and account information.</p>

            {editError   && <div className="login-error"   style={{ marginBottom: 16 }}>{editError}</div>}
            {editSuccess  && <div className="edit-success"  style={{ marginBottom: 16 }}>Profile updated successfully!</div>}

            <form onSubmit={handleSaveProfile}>
              <div className="edit-grid">
                <div className="form-group">
                  <label>Store Name</label>
                  <input className="form-control" type="text" value={editStore} onChange={e => setEditStore(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Owner Name</label>
                  <input className="form-control" type="text" value={editOwner} onChange={e => setEditOwner(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input className="form-control" style={{ maxWidth: '100%' }} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select className="form-control" style={{ maxWidth: '100%' }} value={editCat} onChange={e => setEditCat(e.target.value)}>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                  <option>Beauty</option>
                  <option>Toys</option>
                </select>
              </div>

              <div className="form-group">
                <label>Operating City</label>
                <select className="form-control" style={{ maxWidth: '100%' }} value={editCity} onChange={e => {
                  const val = e.target.value;
                  setEditCity(val);
                  if (val === 'Bengaluru') setEditState('Karnataka');
                  else if (val === 'Mumbai') setEditState('Maharashtra');
                  else if (val === 'Delhi') setEditState('Delhi');
                }}>
                  <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                  <option value="Delhi">New Delhi (Delhi)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Store Address</label>
                <textarea 
                  className="form-control" 
                  style={{ maxWidth: '100%' }} 
                  value={editAddress} 
                  onChange={e => setEditAddress(e.target.value)} 
                  required 
                  rows="2"
                  placeholder="Full physical address for delivery pickups"
                ></textarea>
              </div>

              <div className="form-group">
                <label>New Password <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(leave blank to keep current)</span></label>
                <div className="password-wrapper" style={{ maxWidth: '100%' }}>
                  <input
                    className="form-control"
                    style={{ maxWidth: '100%' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter new password..."
                    value={editPass}
                    onChange={e => setEditPass(e.target.value)}
                  />
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPass(s => !s)}>
                    {showPass ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
