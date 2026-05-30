import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import SellerManagement from './pages/SellerManagement'
import ProductApproval from './pages/ProductApproval'
import OrderMonitoring from './pages/OrderMonitoring'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import ReviewsManagement from './pages/ReviewsManagement'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { CurrencyProvider } from './context/CurrencyContext'
import './index.css'

export default function App() {
  // Persist auth in localStorage using real JWT token
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('adminToken')
  )

  const handleLogin = (token, adminData) => {
    localStorage.setItem('adminToken', token)
    localStorage.setItem('adminData', JSON.stringify(adminData))
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    setIsAuthenticated(false)
  }

  return (
    <CurrencyProvider>
      <BrowserRouter>
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div className="admin-layout">
            <Sidebar />
            <div className="main-area">
              <Topbar onLogout={handleLogout} />
              <div className="page-content">
                <Routes>
                  <Route path="/"               element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login"          element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"      element={<Dashboard />} />
                  <Route path="/users"          element={<UserManagement />} />
                  <Route path="/sellers"        element={<SellerManagement />} />
                  <Route path="/products"       element={<ProductApproval />} />
                  <Route path="/orders"         element={<OrderMonitoring />} />
                  <Route path="/analytics"      element={<Analytics />} />
                  <Route path="/notifications"  element={<Notifications />} />
                  <Route path="/reviews"        element={<ReviewsManagement />} />
                  <Route path="/settings"       element={<Settings />} />
                  <Route path="*"               element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        )}
      </BrowserRouter>
    </CurrencyProvider>
  )
}
