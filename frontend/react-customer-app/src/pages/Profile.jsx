import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Settings, CreditCard, MapPin, Edit2 } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'

export default function Profile({ customer, handleLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('tab') || 'account'
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab) setActiveTab(tab)
  }, [location.search])
  const [addresses, setAddresses] = useState([])
  const [payments, setPayments] = useState([])
  
  const [newAddress, setNewAddress] = useState({ 
    country: 'India', fullName: '', mobile: '', pincode: '', 
    flat: '', area: '', landmark: '', city: '', state: '', 
    isDefault: false, addressType: 'House', deliveryInstructions: ''
  })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)

  const [profileData, setProfileData] = useState({
    name: customer.name || '',
    phone: '',
    dob: '',
    gender: '',
    avatar_url: '',
    alt_email: '',
    company_name: '',
    tax_id: ''
  })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' })

  useEffect(() => {
    if (customer) {
      fetchAddresses()
      fetchPayments()
      fetchProfile()
    }
  }, [customer])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${SERVICES.USER}/auth/customer/${customer.email}`, {
        headers: { ...getAuthHeaders() }
      })
      const data = await res.json()
      if (data && !data.error) {
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          dob: data.dob || '',
          gender: data.gender || '',
          avatar_url: data.avatar_url || '',
          alt_email: data.alt_email || '',
          company_name: data.company_name || '',
          tax_id: data.tax_id || ''
        })
      }
    } catch(e) { console.error(e) }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${SERVICES.USER}/auth/customer/${customer.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(profileData)
      })
      alert('Profile updated successfully!')
    } catch (e) { console.error(e) }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be less than 2MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData({...profileData, avatar_url: reader.result})
      }
      reader.readAsDataURL(file)
    }
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${SERVICES.USER}/auth/customer/${customer.email}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(passwordData)
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        alert('Password updated successfully!')
        setPasswordData({ currentPassword: '', newPassword: '' })
      }
    } catch (e) { console.error(e) }
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${SERVICES.USER}/customer/address/${customer.email}`, {
        headers: { ...getAuthHeaders() }
      })
      const data = await res.json()
      setAddresses(data)
    } catch (e) { console.error(e) }
  }

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${SERVICES.USER}/customer/payment/${customer.email}`, {
        headers: { ...getAuthHeaders() }
      })
      const data = await res.json()
      setPayments(data)
    } catch (e) { console.error(e) }
  }

  const saveAddress = async (e) => {
    e.preventDefault()
    try {
      const url = editingAddressId 
        ? `${SERVICES.USER}/customer/address/${editingAddressId}`
        : `${SERVICES.USER}/customer/address`
      const method = editingAddressId ? 'PUT' : 'POST'
      
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customer.email, ...newAddress })
      })
      
      setNewAddress({ 
        country: 'India', fullName: '', mobile: '', pincode: '', 
        flat: '', area: '', landmark: '', city: '', state: '', 
        isDefault: false, addressType: 'House', deliveryInstructions: ''
      })
      setEditingAddressId(null)
      setShowAddressForm(false)
      fetchAddresses()
    } catch (e) { console.error(e) }
  }

  const deleteAddress = async (addrId) => {
    if (window.confirm("Are you sure you want to remove this address?")) {
      try {
        await fetch(`${SERVICES.USER}/customer/address/${addrId}`, {
          method: 'DELETE'
        })
        fetchAddresses()
      } catch (e) { console.error(e) }
    }
  }

  const setAsDefault = async (addrId) => {
    try {
      await fetch(`${SERVICES.USER}/customer/address/${addrId}/default`, {
        method: 'PUT'
      })
      fetchAddresses()
    } catch (e) { console.error(e) }
  }

  const editAddress = (addr) => {
    setNewAddress({
      country: addr.country || 'India',
      fullName: addr.full_name || '',
      mobile: addr.mobile || '',
      pincode: addr.pincode || '',
      flat: addr.flat || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      isDefault: addr.is_default || false,
      addressType: addr.address_type || 'House',
      deliveryInstructions: addr.delivery_instructions || ''
    })
    setEditingAddressId(addr.id)
    setShowAddressForm(true)
  }

  const updateDeliveryInstructions = async (addr) => {
    const inst = window.prompt("Enter delivery instructions:", addr.delivery_instructions || "")
    if (inst !== null) {
      try {
        await fetch(`${SERVICES.USER}/customer/address/${addr.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customer.email,
            country: addr.country,
            fullName: addr.full_name,
            mobile: addr.mobile,
            pincode: addr.pincode,
            flat: addr.flat,
            area: addr.area,
            landmark: addr.landmark,
            city: addr.city,
            state: addr.state,
            isDefault: addr.is_default,
            addressType: addr.address_type,
            deliveryInstructions: inst
          })
        })
        fetchAddresses()
      } catch (e) { console.error(e) }
    }
  }

  const savePayment = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${SERVICES.USER}/customer/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customer.email, ...newPayment })
      })
      setShowPaymentForm(false)
      fetchPayments()
    } catch (e) { console.error(e) }
  }

  if (!customer) {
    navigate('/login')
    return null
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) : 'U'
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '32px', justifyContent: 'flex-start' }}>
        <h1 className="page-title text-gradient">Your Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="profile-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <label className="profile-avatar" style={{ cursor: 'pointer', position: 'relative' }} title="Click to change profile picture">
              {profileData.avatar_url ? <img src={profileData.avatar_url} alt="Avatar" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} /> : getInitials(profileData.name || customer.name)}
              <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <Edit2 size={14} color="#fff" />
              </div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            <h2 className="profile-name">{profileData.name || customer.name}</h2>
            <div className="profile-email">{customer.email}</div>
          </div>
          
          <div className="profile-nav">
            <button 
              onClick={() => setActiveTab('account')}
              className={`profile-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
            >
              <User size={18} /> Account Details
            </button>
            <button 
              onClick={() => setActiveTab('address')}
              className={`profile-nav-btn ${activeTab === 'address' ? 'active' : ''}`}
            >
              <MapPin size={18} /> Shipping Addresses
            </button>
            <button 
              onClick={() => setActiveTab('payment')}
              className={`profile-nav-btn ${activeTab === 'payment' ? 'active' : ''}`}
            >
              <CreditCard size={18} /> Payment Methods
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`profile-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            >
              <Settings size={18} /> Preferences
            </button>
            <div style={{ margin: '16px 0', height: '1px', background: 'var(--border)' }}></div>
            <button onClick={handleLogout} className="profile-nav-btn" style={{ color: 'var(--rose)' }}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        <div className="profile-content">
          {activeTab === 'account' && (
            <div>
              <h2>Account Details</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Update your personal information below.</p>
              
              <form onSubmit={saveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" defaultValue={customer.email} disabled style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" placeholder="e.g. +91 9876543210" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Email</label>
                    <input type="email" className="form-input" placeholder="Secondary email for recovery" value={profileData.alt_email} onChange={e => setProfileData({...profileData, alt_email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-input" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-input" value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Business Details (Optional)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-input" placeholder="For B2B invoices" value={profileData.company_name} onChange={e => setProfileData({...profileData, company_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax ID (GSTIN)</label>
                    <input type="text" className="form-input" placeholder="e.g. 29ABCDE1234F1Z5" value={profileData.tax_id} onChange={e => setProfileData({...profileData, tax_id: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="btn-primary">Save Changes</button>
              </form>

              <div style={{ marginTop: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Change Password</h3>
                <form onSubmit={updatePassword} style={{ maxWidth: '400px' }}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input required type="password" className="form-input" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input required type="password" className="form-input" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-secondary" style={{ marginTop: '8px' }}>Update Password</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div style={{ color: '#0F1111' }}>
              {!showAddressForm ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: '#565959' }}>
                    <a href="#" style={{ color: '#007185', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('account'); }}>Your Account</a>
                    <span>›</span>
                    <span style={{ color: '#C45500' }}>Your Addresses</span>
                  </div>
                  <h2 style={{ fontSize: '28px', fontWeight: 400, marginBottom: '24px', color: '#0F1111' }}>Your Addresses</h2>
                  
                  <div className="amz-address-grid">
                    <div className="amz-address-add-card" onClick={() => {
                      setNewAddress({ 
                        country: 'India', fullName: '', mobile: '', pincode: '', 
                        flat: '', area: '', landmark: '', city: '', state: '', 
                        isDefault: false, addressType: 'House', deliveryInstructions: ''
                      });
                      setEditingAddressId(null);
                      setShowAddressForm(true);
                    }} style={{ cursor: 'pointer' }}>
                      <span style={{ fontSize: '48px', color: '#C7C7C7', marginBottom: '8px' }}>+</span>
                      Add address
                    </div>
                    {addresses.map(addr => (
                      <div key={addr.id} className="amz-address-card">
                        {addr.is_default && <div className="default-tag" style={{ color: '#e77600', fontWeight: 'bold' }}>Default: NexusMart</div>}
                        <strong>{addr.full_name || customer.name}</strong>
                        <p>{addr.flat}</p>
                        <p>{addr.area}</p>
                        {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                        <p>{addr.city}, {addr.state} {addr.pincode}</p>
                        <p>{addr.country}</p>
                        <p>Phone number: {addr.mobile}</p>
                        {addr.delivery_instructions && <p style={{ fontSize: '12px', color: '#565959', fontStyle: 'italic' }}>Instructions: {addr.delivery_instructions}</p>}
                        
                        <a href="#" onClick={(e) => { e.preventDefault(); updateDeliveryInstructions(addr); }} style={{ color: '#007185', marginTop: '4px', display: 'inline-block', fontSize: '13px' }}>
                          {addr.delivery_instructions ? 'Update delivery instructions' : 'Add delivery instructions'}
                        </a>
                        
                        <div className="amz-address-actions" style={{ fontSize: '13px', marginTop: '12px' }}>
                          <a onClick={() => editAddress(addr)} style={{ color: '#007185', cursor: 'pointer' }}>Edit</a>
                          <span style={{ color: '#D5D9D9' }}>|</span>
                          <a onClick={() => deleteAddress(addr.id)} style={{ color: '#007185', cursor: 'pointer' }}>Remove</a>
                          {!addr.is_default && (
                            <>
                              <span style={{ color: '#D5D9D9' }}>|</span>
                              <a onClick={() => setAsDefault(addr.id)} style={{ color: '#007185', cursor: 'pointer' }}>Set as Default</a>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="amz-form">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', color: '#565959' }}>
                    <a href="#" style={{ color: '#007185', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setActiveTab('account'); setShowAddressForm(false); }}>Your Account</a>
                    <span>›</span>
                    <a href="#" style={{ color: '#007185', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setShowAddressForm(false); }}>Your Addresses</a>
                    <span>›</span>
                    <span style={{ color: '#C45500' }}>{editingAddressId ? 'Edit Address' : 'New Address'}</span>
                  </div>
                  <h2>{editingAddressId ? 'Edit address' : 'Add a new address'}</h2>
                  
                  <form onSubmit={saveAddress}>
                    <div className="amz-form-group">
                      <label className="amz-form-label">Country/Region</label>
                      <select className="amz-form-select" value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})}>
                        <option value="India">India</option>
                      </select>
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Full name (First and Last name)</label>
                      <input required type="text" className="amz-form-input" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Mobile number</label>
                      <input required type="text" className="amz-form-input" value={newAddress.mobile} onChange={e => setNewAddress({...newAddress, mobile: e.target.value})} />
                      <div style={{ fontSize: '12px', color: '#565959', marginTop: '4px' }}>May be used to assist delivery</div>
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Pincode</label>
                      <input required type="text" className="amz-form-input" placeholder="6 digits [0-9] PIN code" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Flat, House no., Building, Company, Apartment</label>
                      <input required type="text" className="amz-form-input" value={newAddress.flat} onChange={e => setNewAddress({...newAddress, flat: e.target.value})} />
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Area, Street, Sector, Village</label>
                      <input required type="text" className="amz-form-input" value={newAddress.area} onChange={e => setNewAddress({...newAddress, area: e.target.value})} />
                    </div>
                    
                    <div className="amz-form-group">
                      <label className="amz-form-label">Landmark</label>
                      <input type="text" className="amz-form-input" placeholder="E.g. near apollo hospital" value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="amz-form-group" style={{ flex: 1 }}>
                        <label className="amz-form-label">Town/City</label>
                        <input required type="text" className="amz-form-input" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                      </div>
                      <div className="amz-form-group" style={{ flex: 1 }}>
                        <label className="amz-form-label">State</label>
                        <select required className="amz-form-select" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})}>
                          <option value="">Choose a state</option>
                          <option value="KARNATAKA">KARNATAKA</option>
                          <option value="ANDHRA PRADESH">ANDHRA PRADESH</option>
                          <option value="MAHARASHTRA">MAHARASHTRA</option>
                          <option value="TAMIL NADU">TAMIL NADU</option>
                        </select>
                      </div>
                    </div>
                    
                    <label className="amz-form-checkbox">
                      <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} />
                      Make this my default address
                    </label>
                    
                    <div style={{ marginTop: '24px' }}>
                      <label className="amz-form-label">Address Type</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {['House', 'Apartment', 'Business', 'Other'].map(type => (
                          <div 
                            key={type}
                            onClick={() => setNewAddress({...newAddress, addressType: type})}
                            style={{ 
                              padding: '6px 12px', border: `1px solid ${newAddress.addressType === type ? 'var(--accent)' : 'var(--border)'}`, 
                              borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                              background: newAddress.addressType === type ? 'var(--accent)' : 'transparent',
                              color: newAddress.addressType === type ? '#fff' : 'var(--text-1)',
                              fontWeight: newAddress.addressType === type ? 700 : 400
                            }}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="amz-btn-yellow" style={{ marginTop: '32px' }}>
                        {editingAddressId ? 'Save changes' : 'Add address'}
                      </button>
                      <button type="button" className="btn-secondary" style={{ marginTop: '32px', border: '1px solid #D5D9D9', borderRadius: '8px', padding: '0 16px', background: 'white' }} onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <h2>Payment Methods</h2>
              
              <div className="payment-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {payments.map(pay => (
                  <div key={pay.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CreditCard size={24} color="var(--accent)" />
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{pay.brand || 'Card'} ending in {pay.card_number?.slice(-4)}</p>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-2)' }}>Expires {pay.expiry}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!showPaymentForm ? (
                payments.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px', marginTop: '24px' }}>
                    <CreditCard size={48} color="var(--text-3)" style={{ marginBottom: '16px' }} />
                    <h3 className="empty-title">No cards saved</h3>
                    <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowPaymentForm(true)}>Add New Card</button>
                  </div>
                ) : (
                  <button className="btn-secondary" style={{ marginTop: '24px' }} onClick={() => setShowPaymentForm(true)}>Add Another Card</button>
                )
              ) : (
                <form onSubmit={savePayment} style={{ marginTop: '24px', padding: '24px', background: 'var(--bg-2)', borderRadius: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input required type="text" className="form-input" placeholder="XXXX XXXX XXXX XXXX" value={newPayment.cardNumber} onChange={e => setNewPayment({...newPayment, cardNumber: e.target.value})} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Expiry (MM/YY)</label>
                      <input required type="text" className="form-input" placeholder="12/25" value={newPayment.expiry} onChange={e => setNewPayment({...newPayment, expiry: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Brand</label>
                      <input required type="text" className="form-input" placeholder="Visa, MasterCard..." value={newPayment.brand} onChange={e => setNewPayment({...newPayment, brand: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" className="btn-primary">Save Card</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowPaymentForm(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2>Preferences</h2>
              <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Manage your account settings and notifications.</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>Receive promotional emails</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>Order status notifications</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
