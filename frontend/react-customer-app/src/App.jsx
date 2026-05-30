import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Package, LogOut, Search, MapPin, Menu } from 'lucide-react'

import Home from './pages/Home'
import LoginRegister from './pages/LoginRegister'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import LocationModal from './components/LocationModal'
import { CurrencyProvider, useCurrency } from './context/CurrencyContext'

import { getCustomer, setCustomer as setStoredCustomer, clearCustomer, SERVICES } from './services/api'

function Layout({ customer, handleLogout, deliveryLocation, setDeliveryLocation, isLocModalOpen, setIsLocModalOpen, isDrawerOpen, setIsDrawerOpen, children }) {
  const { currencyCode, setCurrencyCode, currencies } = useCurrency()
  const navigate = useNavigate()
  const location = useLocation()
  const currentCat = new URLSearchParams(location.search).get('cat') || ''
  const STATIC_CATEGORIES = ['TV, Audio & Cameras', 'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Health', 'Sports & Outdoors', 'Toys & Games', 'Books'];
  const STATIC_SUB_CATEGORIES = {
    'TV, Audio & Cameras': ['Televisions', 'Home Entertainment Systems', 'Headphones', 'Speakers', 'Home Audio & Theater', 'Cameras', 'DSLR Cameras', 'Security Cameras', 'Camera Accessories', 'Musical Instruments & Professional Audio', 'Gaming Consoles'],
    'Electronics': ['Mobiles', 'Computers', 'Laptops', 'Tablets', 'Appliances', 'Smart Home', 'Accessories', 'Other Electronics'],
    'Fashion': ['Shirts', 'T-Shirts', 'Jeans', 'Shoes', 'Watches', "Men's Fashion", "Women's Fashion", 'Other Fashion'],
    'Home & Kitchen': ['Furniture', 'Decor', 'Kitchen Appliances', 'Cookware', 'Bedding'],
    'Beauty & Health': ['Makeup', 'Skincare', 'Haircare', 'Personal Care', 'Supplements'],
    'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Sportswear', 'Footwear'],
    'Toys & Games': ['Action Figures', 'Board Games', 'Educational', 'Video Games'],
    'Books': ['Fiction', 'Non-Fiction', 'Childrens', 'Textbooks']
  };

  const categories = STATIC_CATEGORIES;
  const subCategories = STATIC_SUB_CATEGORIES;
  const [expandedCategory, setExpandedCategory] = useState(null)
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const query = e.target.q.value
    const cat = e.target.cat.value
    let url = '/'
    if (query || cat) {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (cat && cat !== 'All Categories') params.append('cat', cat)
      url = `/?${params.toString()}`
    }
    navigate(url)
  }

  return (
    <div className="app-container">
      {/* Sidebar Drawer */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}></div>
      {isDrawerOpen && (
        <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}>&times;</button>
      )}
      <div className={`drawer-container ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-header-avatar">
            {customer ? customer.name[0].toUpperCase() : '👤'}
          </div>
          <span>Hello, {customer ? customer.name : 'Sign in'}</span>
        </div>
        <div className="drawer-content">
          <div className="drawer-section-title">Shop by Category</div>
          {categories.map(cat => (
            <div key={cat}>
              <div 
                className="drawer-link"
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: expandedCategory === cat ? 700 : 400, color: expandedCategory === cat ? 'var(--accent)' : 'inherit' }}
              >
                {cat} <span style={{ transform: expandedCategory === cat ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>&rsaquo;</span>
              </div>
              
              {expandedCategory === cat && (
                <div style={{ background: 'var(--bg-base)', padding: '8px 0', borderLeft: '3px solid var(--accent)' }}>
                  <Link 
                    to={`/?cat=${encodeURIComponent(cat)}`} 
                    className="drawer-link" 
                    style={{ fontSize: '14px', paddingLeft: '32px' }}
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    All {cat}
                  </Link>
                  {(subCategories[cat] || []).map(sc => (
                    <Link 
                      key={sc}
                      to={`/?cat=${encodeURIComponent(cat)}&subcat=${encodeURIComponent(sc)}`} 
                      className="drawer-link" 
                      style={{ fontSize: '14px', paddingLeft: '32px' }}
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      {sc}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="drawer-divider"></div>
          <div className="drawer-section-title">Help & Settings</div>
          <Link to="/profile" className="drawer-link" onClick={() => setIsDrawerOpen(false)}>
            Your Account <span>&rsaquo;</span>
          </Link>
          <Link to="/profile?tab=address" className="drawer-link" onClick={() => setIsDrawerOpen(false)}>
            Your Addresses <span>&rsaquo;</span>
          </Link>
          <Link to="/orders" className="drawer-link" onClick={() => setIsDrawerOpen(false)}>
            Your Orders <span>&rsaquo;</span>
          </Link>
          <Link to="/wishlist" className="drawer-link" onClick={() => setIsDrawerOpen(false)}>
            Your Wishlist <span>&rsaquo;</span>
          </Link>
          {customer ? (
            <div className="drawer-link" onClick={() => { handleLogout(); setIsDrawerOpen(false); }} style={{ color: 'var(--rose)', cursor: 'pointer' }}>
              Sign Out <span>&rsaquo;</span>
            </div>
          ) : (
            <Link to="/login" className="drawer-link" onClick={() => setIsDrawerOpen(false)}>
              Sign In <span>&rsaquo;</span>
            </Link>
          )}
        </div>
      </div>

      <header>
        <div className="header">
          <div className="header-inner">
            <Link to="/" className="logo">Nexus<span>Mart</span></Link>
            
            <div className="header-actions" style={{ marginRight: 'auto' }}>
              <button 
                className="header-action-btn" 
                onClick={() => setIsLocModalOpen(true)}
                style={{ textAlign: 'left', background: 'transparent', cursor: 'pointer', border: 'none', marginRight: '16px' }}
              >
                <span className="top-line" style={{ display: 'block', fontSize: '11px', color: '#ccc' }}>Deliver to {deliveryLocation?.name || (customer ? customer.name : 'Guest')}</span>
                <span className="bottom-line" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#fff' }}><MapPin size={14} style={{ marginRight: '2px' }} /> {deliveryLocation?.address || 'Update Location'}</span>
              </button>
              
              <select 
                value={currencyCode} 
                onChange={(e) => setCurrencyCode(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-card)', color: '#000', border: '1px solid #ccc', outline: 'none', cursor: 'pointer', alignSelf: 'center', fontWeight: 'bold' }}
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <form className="header-search" onSubmit={handleSearchSubmit}>
              <select 
                className="header-search-cat" 
                name="cat"
                value={currentCat}
                onChange={(e) => {
                  if (e.target.value) {
                    navigate(`/?cat=${encodeURIComponent(e.target.value)}`)
                  } else {
                    navigate(`/`)
                  }
                }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input type="text" className="header-search-input" placeholder="Search NexusMart" name="q" />
              <button className="header-search-btn" type="submit" style={{ cursor: 'pointer' }}>
                <Search size={20} />
              </button>
            </form>

            <div className="header-actions">
              {customer ? (
                <>
                  <Link to="/profile" className="header-action-btn">
                    <span className="top-line">Hello, {customer.name}</span>
                    <span className="bottom-line">Account & Lists</span>
                  </Link>
                  <Link to="/orders" className="header-action-btn">
                    <span className="top-line">Returns</span>
                    <span className="bottom-line">& Orders</span>
                  </Link>
                  <Link to="/cart" className="cart-btn">
                    <ShoppingCart size={32} />
                    <span className="cart-text" style={{ marginLeft: '4px' }}>Cart</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="header-action-btn">
                    <span className="top-line">Hello, sign in</span>
                    <span className="bottom-line">Account & Lists</span>
                  </Link>
                  <Link to="/cart" className="cart-btn">
                    <ShoppingCart size={32} />
                    <span className="cart-text" style={{ marginLeft: '4px' }}>Cart</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sub-nav">
          <div className="sub-nav-all" onClick={() => setIsDrawerOpen(true)} style={{ cursor: 'pointer' }}>
            <Menu size={20} /> All
          </div>
          <Link to="/">Home</Link>
          {categories.map(c => (
            <Link key={c} to={`/?cat=${encodeURIComponent(c)}`}>{c}</Link>
          ))}
        </div>
      </header>

      <main className="main-content" style={{ padding: 0, maxWidth: '100%' }}>
        {children}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} NexusMart. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default function App() {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deliveryLocation, setDeliveryLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem('deliveryLocationData');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return null;
  });

  const setDeliveryLocation = (data) => {
    setDeliveryLocationState(data);
    if (data) localStorage.setItem('deliveryLocationData', JSON.stringify(data));
    else localStorage.removeItem('deliveryLocationData');
  };

  const [isLocModalOpen, setIsLocModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    const c = getCustomer()
    if (c) setCustomer(c)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (customer) {
      // Fetch user's real addresses to see default address
      fetch(`${SERVICES.USER}/customer/address/${customer.email}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const def = data.find(addr => addr.is_default);
            if (def) {
              setDeliveryLocation({ name: def.full_name || customer.name, address: `${def.city} ${def.pincode}`, fullAddress: `${def.flat}, ${def.area}, ${def.city}, ${def.state} ${def.pincode}` });
            } else if (data.length > 0) {
              setDeliveryLocation({ name: data[0].full_name || customer.name, address: `${data[0].city} ${data[0].pincode}`, fullAddress: `${data[0].flat}, ${data[0].area}, ${data[0].city}, ${data[0].state} ${data[0].pincode}` });
            } else {
              setDeliveryLocation(null);
            }
          }
        })
        .catch(console.error);
    } else {
      setDeliveryLocation(null);
    }
  }, [customer]);

  const handleLogin = (data) => {
    setCustomer(data.user)
    setStoredCustomer(data)
  }

  const handleLogout = () => {
    setCustomer(null)
    clearCustomer()
  }

  if (loading) return null

  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Layout 
          customer={customer} 
          handleLogout={handleLogout} 
          deliveryLocation={deliveryLocation} 
          setDeliveryLocation={setDeliveryLocation}
          isLocModalOpen={isLocModalOpen}
          setIsLocModalOpen={setIsLocModalOpen}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
        >
          <LocationModal 
            isOpen={isLocModalOpen} 
            onClose={() => setIsLocModalOpen(false)} 
            onSelect={setDeliveryLocation} 
            customer={customer}
          />
          <Routes>
            <Route path="/" element={<Home customer={customer} />} />
            <Route path="/login" element={customer ? <Navigate to="/" /> : <LoginRegister onLogin={handleLogin} />} />
            <Route path="/product/:id" element={<ProductDetails customer={customer} deliveryLocation={deliveryLocation} setIsLocModalOpen={setIsLocModalOpen} />} />
            
            {/* Protected Routes - simple redirect if no customer */}
            <Route path="/cart" element={customer ? <Cart customer={customer} /> : <LoginRegister onLogin={handleLogin} />} />
            <Route path="/checkout" element={customer ? <Checkout customer={customer} /> : <LoginRegister onLogin={handleLogin} />} />
            <Route path="/orders" element={customer ? <MyOrders customer={customer} /> : <LoginRegister onLogin={handleLogin} />} />
            <Route path="/wishlist" element={customer ? <Wishlist customer={customer} /> : <LoginRegister onLogin={handleLogin} />} />
            <Route path="/profile" element={customer ? <Profile customer={customer} handleLogout={handleLogout} /> : <LoginRegister onLogin={handleLogin} />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CurrencyProvider>
  )
}
