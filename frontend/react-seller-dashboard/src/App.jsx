import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
// Will implement these next
import Dashboard from './pages/Dashboard'
import MyProducts from './pages/MyProducts'
import MyOrders from './pages/MyOrders'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { CurrencyProvider } from './context/CurrencyContext'
import './index.css'

export default function App() {
  const [seller, setSeller] = useState(() => {
    const saved = localStorage.getItem('sellerAuth')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error("Failed to parse sellerAuth from localStorage:", e)
        localStorage.removeItem('sellerAuth')
      }
    }
    return null
  })

  const handleLogin = (sellerData) => {
    localStorage.setItem('sellerAuth', JSON.stringify(sellerData.user))
    localStorage.setItem('sellerAuthToken', sellerData.token)
    setSeller(sellerData.user)
  }

  const handleLogout = () => {
    localStorage.removeItem('sellerAuth')
    setSeller(null)
  }

  const handleSellerUpdate = (updatedSeller) => {
    localStorage.setItem('sellerAuth', JSON.stringify(updatedSeller))
    setSeller(updatedSeller)
  }

  return (
    <CurrencyProvider>
      <BrowserRouter>
        {!seller ? (
          <Routes>
            <Route path="/login" element={<Login key="login" mode="login" onLogin={handleLogin} />} />
            <Route path="/register" element={<Login key="register" mode="register" onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div className="admin-layout">
            <Sidebar currentPath={window.location.pathname} />
            <div className="main-area">
              <Topbar seller={seller} onLogout={handleLogout} onSellerUpdate={handleSellerUpdate} />
              <div className="page-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/register" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard seller={seller} />} />
                  <Route path="/products" element={<MyProducts seller={seller} />} />
                  <Route path="/orders" element={<MyOrders seller={seller} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        )}
      </BrowserRouter>
    </CurrencyProvider>
  )
}
