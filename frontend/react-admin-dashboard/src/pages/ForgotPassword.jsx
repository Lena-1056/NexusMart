import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8085/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to request reset')
      }

      setMessage(data.message || 'OTP sent to your email address.')
      
    } catch (err) {
      setError(err.message || 'Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🔑</div>
        <h2>Forgot Password</h2>
        <p>Enter your admin email to receive a reset OTP</p>

        {error && <div className="login-error">{error}</div>}
        {message && <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="admin@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
              disabled={message !== ''}
            />
          </div>

          {!message ? (
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Check your inbox for the reset link and OTP.
            </div>
          )}
        </form>

        <div className="login-footer">
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
