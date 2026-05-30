import { useState } from 'react'
import { SERVICES } from '../services/api'

export default function LoginRegister({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isLogin ? '/auth/customer/login' : '/auth/customer/register'
    const url = `${SERVICES.USER}${endpoint}`
    
    const body = isLogin ? { email, password } : { name, email, password }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Authentication failed')
      
      if (isLogin) {
        onLogin(data) // { token, user }
      } else {
        // Automatically login after register
        const loginRes = await fetch(`${SERVICES.USER}/auth/customer/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const loginData = await loginRes.json()
        if (loginRes.ok) onLogin(loginData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your cart and orders' : 'Join NexusMart to start shopping'}
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="form-input"
              placeholder="John Doe"
            />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            required 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            required 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
          />
        </div>
        <button 
          disabled={loading}
          type="submit" 
          className="btn-primary btn-block"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="auth-footer">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <span 
          onClick={() => { setIsLogin(!isLogin); setError('') }} 
          className="auth-link"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </span>
      </div>
    </div>
  )
}
