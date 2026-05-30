import { useState } from 'react'
import './Settings.css'

const SECTIONS = [
  { key:'general',       label:'General',       icon:'⚙️'  },
  { key:'security',      label:'Security',      icon:'🔐'  },
  { key:'notifications', label:'Notifications', icon:'🔔'  },
  { key:'apikeys',       label:'API Keys',      icon:'🔑'  },
  { key:'billing',       label:'Billing',       icon:'💳'  },
]

const API_KEYS = [
  { name:'Payment Gateway', key:'pk_live_****************************', active:true  },
  { name:'SMS Provider',    key:'sms_key_***********************',     active:true  },
  { name:'Email Provider',  key:'sg_****************************',     active:false },
]

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )
}

export default function Settings() {
  const [active, setActive]           = useState('general')
  const [saved, setSaved]             = useState(false)
  // General
  const [platformName, setPlatformName]   = useState('Polyglot E-Commerce')
  const [adminEmail, setAdminEmail]       = useState('admin@ecommerce.local')
  const [maxProducts, setMaxProducts]     = useState(500)
  const [maintenance, setMaintenance]     = useState(false)
  const [allowReg, setAllowReg]           = useState(true)
  // Security
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [minPwdLen, setMinPwdLen]           = useState(8)
  const [twoFactor, setTwoFactor]           = useState(false)
  const [emailVerify, setEmailVerify]       = useState(true)
  // Notifications
  const [emailNotif, setEmailNotif]   = useState(true)
  const [orderAlert, setOrderAlert]   = useState(true)
  const [sellerAlert, setSellerAlert] = useState(true)
  const [sysAlert, setSysAlert]       = useState(true)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  return (
    <>
      <div className="page-header">
        <h2>⚙️ Platform Settings</h2>
        <p>Configure platform-wide settings, security, and integrations.</p>
      </div>

      {saved && <div className="save-banner">✅ Settings saved successfully!</div>}

      <div className="settings-layout">
        {/* Sidebar Nav */}
        <div className="settings-nav card">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={`settings-nav-item ${active===s.key?'active':''}`}
              onClick={() => setActive(s.key)}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content card">
          {active === 'general' && (
            <>
              <h3>General Settings</h3>
              <div className="form-group">
                <label>Platform Name</label>
                <input className="form-control" value={platformName} onChange={e=>setPlatformName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Admin Email</label>
                <input className="form-control" type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Max Products Per Seller</label>
                <input className="form-control" type="number" value={maxProducts} onChange={e=>setMaxProducts(+e.target.value)} />
              </div>
              <div className="toggle-item">
                <div className="toggle-item-info"><strong>Maintenance Mode</strong><p>Disable public access to the platform</p></div>
                <Toggle checked={maintenance} onChange={setMaintenance} />
              </div>
              <div className="toggle-item">
                <div className="toggle-item-info"><strong>Allow New Registrations</strong><p>Allow new users to sign up</p></div>
                <Toggle checked={allowReg} onChange={setAllowReg} />
              </div>
            </>
          )}

          {active === 'security' && (
            <>
              <h3>Security Settings</h3>
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input className="form-control" type="number" value={sessionTimeout} onChange={e=>setSessionTimeout(+e.target.value)} />
              </div>
              <div className="form-group">
                <label>Minimum Password Length</label>
                <input className="form-control" type="number" value={minPwdLen} onChange={e=>setMinPwdLen(+e.target.value)} />
              </div>
              <div className="toggle-item">
                <div className="toggle-item-info"><strong>Two-Factor Authentication</strong><p>Require 2FA for admin accounts</p></div>
                <Toggle checked={twoFactor} onChange={setTwoFactor} />
              </div>
              <div className="toggle-item">
                <div className="toggle-item-info"><strong>Email Verification Required</strong><p>Require email verification on sign-up</p></div>
                <Toggle checked={emailVerify} onChange={setEmailVerify} />
              </div>
            </>
          )}

          {active === 'notifications' && (
            <>
              <h3>Notification Preferences</h3>
              {[
                { label:'Email Notifications',       sub:'Receive all admin alerts via email',       val:emailNotif,  set:setEmailNotif  },
                { label:'Order Alerts',              sub:'Notify on new or failed orders',            val:orderAlert,  set:setOrderAlert  },
                { label:'Seller Application Alerts', sub:'Notify on new seller applications',        val:sellerAlert, set:setSellerAlert },
                { label:'System Alerts',             sub:'Critical system health notifications',      val:sysAlert,    set:setSysAlert    },
              ].map(t => (
                <div className="toggle-item" key={t.label}>
                  <div className="toggle-item-info"><strong>{t.label}</strong><p>{t.sub}</p></div>
                  <Toggle checked={t.val} onChange={t.set} />
                </div>
              ))}
            </>
          )}

          {active === 'apikeys' && (
            <>
              <h3>API Key Management</h3>
              <div className="api-keys-list">
                {API_KEYS.map(k => (
                  <div className="api-key-item" key={k.name}>
                    <div>
                      <strong style={{color:'#f1f5f9',display:'block',marginBottom:4}}>{k.name}</strong>
                      <code style={{fontSize:12,color:'#94a3b8'}}>{k.key}</code>
                    </div>
                    <div className="action-btns">
                      <span className={`badge ${k.active?'badge-active':'badge-inactive'}`}>{k.active?'Active':'Inactive'}</span>
                      <button className="btn btn-sm btn-ghost">Regenerate</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {active === 'billing' && (
            <>
              <h3>Billing & Subscription</h3>
              <div className="billing-card">
                <div className="plan-badge">ENTERPRISE PLAN</div>
                <p style={{color:'#94a3b8',marginTop:8,fontSize:14}}>Your plan includes unlimited sellers, 14 microservices, and 24/7 support.</p>
                <div style={{color:'#94a3b8',marginTop:12,fontSize:14}}><strong style={{color:'#f1f5f9'}}>Next billing:</strong> 2024-06-27</div>
                <div style={{color:'#94a3b8',marginTop:6,fontSize:14}}><strong style={{color:'#f1f5f9'}}>Monthly cost:</strong> $499/mo</div>
                <button className="btn btn-primary" style={{marginTop:16}}>Upgrade Plan</button>
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{marginTop:28}} onClick={save}>💾 Save Settings</button>
        </div>
      </div>
    </>
  )
}
