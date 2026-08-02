import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showTemp, setShowTemp] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8090/api/sellers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tempPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to reset password');
      }

      setMessage(data.message);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ width: '100%', maxWidth: '450px' }}>
        <div className="login-logo">📦</div>
        <h2>Reset Password</h2>
        <p>Set a new password for your store</p>

        {error && <div className="login-error">{error}</div>}
        {message && <div style={{ color: '#4CAF50', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', border: '1px solid #4CAF50' }}>{message}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{marginBottom: '15px'}}>
            <label>Email Address</label>
            <input 
              className="form-control"
              type="email" 
              placeholder="e.g. seller@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group" style={{marginBottom: '15px'}}>
            <label>Temporary Password</label>
            <div className="password-wrapper">
              <input 
                className="form-control"
                type={showTemp ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={tempPassword}
                onChange={e => setTempPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowTemp(!showTemp)}
                tabIndex="-1"
                title={showTemp ? "Hide Password" : "Show Password"}
              >
                {showTemp ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group" style={{marginBottom: '15px'}}>
            <label>New Password</label>
            <div className="password-wrapper">
              <input 
                className="form-control"
                type={showNew ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex="-1"
                title={showNew ? "Hide Password" : "Show Password"}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group" style={{marginBottom: '20px'}}>
            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input 
                className="form-control"
                type={showConfirm ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
                title={showConfirm ? "Hide Password" : "Show Password"}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
}
