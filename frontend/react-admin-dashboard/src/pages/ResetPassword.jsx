import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Login.css'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('VERIFY') // 'VERIFY' or 'RESET'

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [location])

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8085/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'OTP Verification failed')
      
      setStep('RESET')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8085/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Password reset failed')
      
      setMessage('Password reset successfully. Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🔐</div>
        <h2>Reset Password</h2>
        <p>{step === 'VERIFY' ? 'Enter the OTP sent to your email' : 'Create a new password'}</p>

        {error && <div className="login-error">{error}</div>}
        {message && <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}

        {step === 'VERIFY' ? (
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <div>
              <label>Email Address</label>
              <input type="email" value={email} disabled required />
            </div>
            <div>
              <label>6-Digit OTP</label>
              <input 
                type="text" 
                placeholder="000000" 
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required 
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleResetPassword}>
            <div>
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  required 
                  disabled={message !== ''}
                />
                <button 
                  type="button" 
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {!message && (
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            )}
          </form>
        )}

        <div className="login-footer">
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
