import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'
import './Login.css'

export default function Login({ mode, onLogin }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [store, setStore]               = useState('')
  const [owner, setOwner]               = useState('')
  const [cat, setCat]                   = useState('Electronics')
  const [city, setCity]                 = useState('Bengaluru')
  const [state, setState]               = useState('Karnataka')
  const [address, setAddress]           = useState('')
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState('')
  const [loading, setLoading]           = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (isRegister) {
        const res = await fetch(`${API_BASE}/api/sellers/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, store, owner, cat, city, state, address })
        })
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || 'Failed to register. Email may be taken.')
        }
        const data = await res.json()
        setSuccess('Registration successful! Please sign in.')
        // navigate('/login') // Removed navigate so they can see the message on the same screen
        setStore(''); setOwner(''); setEmail(''); setPassword(''); setAddress('');
      } else {
        const res = await fetch(`${API_BASE}/api/sellers/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || 'Invalid credentials.')
        }
        const data = await res.json()
        onLogin(data)
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Is the backend running on port 8090?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏪</div>
        <h2>Seller Portal</h2>
        <p>{isRegister ? 'Register your store and start selling' : 'Manage your store and products'}</p>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)'}}>{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Store Name</label>
                <input className="form-control" type="text" value={store} onChange={e=>setStore(e.target.value)} required />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Owner Name</label>
                <input className="form-control" type="text" value={owner} onChange={e=>setOwner(e.target.value)} required />
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Category</label>
                <select className="form-control" value={cat} onChange={e=>setCat(e.target.value)}>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                  <option>Beauty</option>
                  <option>Toys</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Operating City</label>
                <select className="form-control" value={city} onChange={e=>{
                  const val = e.target.value;
                  setCity(val);
                  if (val === 'Bengaluru') setState('Karnataka');
                  else if (val === 'Mumbai') setState('Maharashtra');
                  else if (val === 'Delhi') setState('Delhi');
                }}>
                  <option value="Bengaluru">Bengaluru (Karnataka)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                  <option value="Delhi">New Delhi (Delhi)</option>
                </select>
              </div>
              <div className="form-group" style={{marginBottom: 0}}>
                <label>Store Address</label>
                <textarea 
                  className="form-control" 
                  value={address} 
                  onChange={e=>setAddress(e.target.value)} 
                  required 
                  rows="3"
                  placeholder="Full physical address for delivery pickups"
                ></textarea>
              </div>
            </>
          )}

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Email Address</label>
            <input className="form-control" type="email" placeholder="e.g. mike@techhaven.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                className="form-control" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn" 
                onClick={() => setShowPassword(s => !s)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Register Store' : 'Sign In')}
          </button>
        </form>

        <div className="login-footer">
          {isRegister ? (
            <>Already have an account? <button onClick={() => navigate('/login')}>Sign in</button></>
          ) : (
            <>Don't have an account? <button onClick={() => navigate('/register')}>Register</button></>
          )}
        </div>
      </div>
    </div>
  )
}
