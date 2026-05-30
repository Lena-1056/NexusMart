import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { label: 'Dashboard',         icon: '📊', path: '/dashboard' },
  { label: 'User Management',   icon: '👥', path: '/users' },
  { label: 'Seller Management', icon: '🏪', path: '/sellers' },
  { label: 'Product Approval',  icon: '📦', path: '/products' },
  { label: 'Order Monitoring',  icon: '🛒', path: '/orders' },
  { label: 'Analytics',         icon: '📈', path: '/analytics' },
  { label: 'Notifications',     icon: '🔔', path: '/notifications' },
  { label: 'Reviews',           icon: '⭐', path: '/reviews' },
  { label: 'Settings',          icon: '⚙️',  path: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AC</div>
        <div>
          <span className="logo-title">AdminControl</span>
          <span className="logo-sub">E-Commerce Platform</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="version">v1.0.0 — React MVP</span>
      </div>
    </aside>
  )
}
