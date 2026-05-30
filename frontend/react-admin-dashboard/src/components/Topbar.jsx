import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrency } from '../context/CurrencyContext'
import './Topbar.css'

export default function Topbar({ onLogout }) {
  const navigate = useNavigate()
  const { currencyCode, setCurrencyCode, currencies } = useCurrency()
  const [showNotif, setShowNotif]     = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifs, setNotifs]           = useState([])

  // Fetch notifications on mount
  useEffect(() => {
    fetch('http://localhost:8084/api/notifications')
      .then(r => r.json())
      .then(data => setNotifs(data))
      .catch(e => console.error(e))
  }, [])

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  const markRead = (id) => {
    fetch(`http://localhost:8084/api/notifications/${id}/read`, { method: 'PUT' })
      .then(() => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => {
    const unread = notifs.filter(n => !n.read)
    Promise.all(unread.map(n => fetch(`http://localhost:8084/api/notifications/${n.id}/read`, { method: 'PUT' })))
      .then(() => setNotifs(prev => prev.map(n => ({ ...n, read: true }))))
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header className="topbar">
      <span className="topbar-date">{currentDate}</span>

      <div className="topbar-right">
        <div className="topbar-actions">
          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', marginRight: '16px', fontWeight: 600 }}>
            {currencyCode}
          </div>
        </div>

        {/* ── Notification Bell ── */}
        <div className="dropdown-wrap" ref={notifRef}>
          <button
            className={`icon-btn ${showNotif ? 'active' : ''}`}
            onClick={() => { setShowNotif(p => !p); setShowProfile(false) }}
          >
            🔔
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="dropdown-panel notif-panel">
              <div className="dp-header">
                <span className="dp-title">Notifications</span>
                <button className="mark-all" onClick={markAllRead}>Mark all read</button>
              </div>

              <div className="notif-list">
                {notifs.slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="notif-icon">
                      {n.type === 'SYSTEM' ? '⚙️' : n.type === 'ORDER' ? '🛒' : '💬'}
                    </div>
                    <div className="notif-body">
                      <div className="notif-title">{n.type} Alert</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{n.time}</div>
                    </div>
                    {!n.read && <span className="unread-dot-sm" />}
                  </div>
                ))}
              </div>

              <div className="dp-footer">
                <Link to="/notifications" onClick={() => setShowNotif(false)}>
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile Avatar ── */}
        <div className="dropdown-wrap" ref={profileRef}>
          <button
            className={`profile-btn ${showProfile ? 'active' : ''}`}
            onClick={() => { setShowProfile(p => !p); setShowNotif(false) }}
          >
            <div className="avatar">SA</div>
            <div className="admin-info">
              <span className="admin-name">Super Admin</span>
              <span className="admin-role">Administrator</span>
            </div>
            <span className={`caret ${showProfile ? 'open' : ''}`}>▾</span>
          </button>

          {showProfile && (
            <div className="dropdown-panel profile-panel">
              <div className="profile-header">
                <div className="avatar avatar-lg">SA</div>
                <div>
                  <div className="profile-name">Super Admin</div>
                  <div className="profile-email">admin@ecommerce.local</div>
                  <span className="role-badge">Administrator</span>
                </div>
              </div>

              <div className="dp-divider" />

              <div className="profile-menu">
                {[
                  { icon: '⚙️', label: 'Account Settings',        path: '/settings' },
                  { icon: '📊', label: 'My Activity',              path: '/analytics' },
                  { icon: '🔐', label: 'Security & 2FA',           path: '/settings' },
                  { icon: '🔔', label: 'Notification Preferences', path: '/notifications' },
                ].map(item => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="profile-menu-item"
                    onClick={() => setShowProfile(false)}
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}
              </div>

              <div className="dp-divider" />

              <button className="logout-btn" onClick={() => { setShowProfile(false); if (onLogout) onLogout(); }}>
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
