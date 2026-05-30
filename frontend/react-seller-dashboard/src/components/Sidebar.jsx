import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

export default function Sidebar() {
  const location = useLocation()
  
  const links = [
    { path: '/dashboard', label: 'Sales Dashboard', icon: '📊' },
    { path: '/products',  label: 'My Products',     icon: '📦' },
    { path: '/orders',    label: 'Order Management',icon: '🛒' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">🏪</span>
        <h1>Seller Portal</h1>
      </div>

      <nav className="nav-menu">
        {links.map(link => {
          const isActive = location.pathname.startsWith(link.path)
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
