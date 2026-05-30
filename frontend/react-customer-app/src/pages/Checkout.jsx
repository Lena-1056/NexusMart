import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, CreditCard, DollarSign, XCircle } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

export default function Checkout({ customer }) {
  const { formatCurrency } = useCurrency()
  const location = useLocation()
  const navigate = useNavigate()
  const { items, total } = location.state || { items: [], total: 0 }

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [recommended, setRecommended] = useState([])
  const [paymentError, setPaymentError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY')
  const [address, setAddress] = useState('')
  const [addresses, setAddresses] = useState([])
  const [eta, setEta] = useState('')

  useEffect(() => {
    if (customer) {
      fetch(`${SERVICES.USER}/customer/address/${customer.email}`, {
        headers: { ...getAuthHeaders() }
      })
      .then(res => res.json())
      .then(data => {
        setAddresses(data)
        if (data.length > 0) {
          const defaultAddr = data.find(a => a.isDefault) || data[0]
          setAddress(`${defaultAddr.fullName}, ${defaultAddr.flat}, ${defaultAddr.area}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode} (Mob: ${defaultAddr.mobile})`)
          // Store city in a data attribute or state for routing
          window.customerCity = defaultAddr.city;
        }
      })
      .catch(console.error)
    }
  }, [customer])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    // Fetch ETA if we have items and a selected delivery city
    if (items.length > 0 && window.customerCity) {
      // Find seller's city from the first item
      fetch(`${SERVICES.USER}/../api/sellers`) // We route through 8090, but let's assume SERVICES.USER has correct base or we use 8090 directly
        .then(res => res.json())
        .catch(e => {
          return fetch(`http://localhost:8090/api/sellers`).then(r => r.json())
        })
        .then(sellers => {
          const sellerName = items[0].product.seller;
          const sellerObj = sellers.find(s => s.store === sellerName);
          const sellerCity = sellerObj ? sellerObj.city : 'Mumbai';
          
          return fetch(`http://localhost:8094/api/shipping/eta?originCity=${encodeURIComponent(sellerCity)}&destCity=${encodeURIComponent(window.customerCity)}`);
        })
        .then(res => res.json())
        .then(data => setEta(data.eta))
        .catch(console.error);
    }
  }, [items, address]) // re-run if address changes because window.customerCity might change

  useEffect(() => {
    if (success && items.length > 0) {
      const category = items[0].product.category;
      fetch(`${SERVICES.PRODUCT}/products`)
        .then(res => res.json())
        .then(data => {
          const boughtIds = items.map(i => i.product.id);
          const recs = data.filter(p => p.category === category && !boughtIds.includes(p.id)).slice(0, 4);
          setRecommended(recs);
        })
        .catch(console.error);
    }
  }, [success])

  if (items.length === 0 && !success) {
    return <div className="empty-state">No items to checkout. <Link to="/" style={{color:'var(--accent)'}}>Go shop.</Link></div>
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!address.trim()) {
      setPaymentError("Please select a delivery address.");
      return;
    }
    setLoading(true)
    
    try {
      if (paymentMethod === 'COD') {
        // Cash on delivery
        for (const item of items) {
          await fetch(`${SERVICES.ORDER}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              customer: customer.email,
              seller: item.product.seller,
              product: item.product.id,
              amount: (item.product.price * item.quantity).toString(),
              payment: 'COD',
              paymentMethod: 'COD',
              address: address,
              customerCity: window.customerCity || 'Mumbai' // Default if not found
            })
          })
          
          await fetch(`${SERVICES.CART}/cart/remove`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ email: customer.email, productId: item.product.id })
          })
        }
        setSuccess(true)
        setLoading(false)
      } else {
        // Razorpay Online
        // 1. First save order locally as PENDING
        let createdOrders = []
        for (const item of items) {
          const res = await fetch(`${SERVICES.ORDER}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              customer: customer.email,
              seller: item.product.seller,
              product: item.product.id,
              amount: (item.product.price * item.quantity).toString(),
              payment: 'PENDING',
              paymentMethod: 'RAZORPAY',
              address: address,
              customerCity: window.customerCity || 'Mumbai'
            })
          })
          const o = await res.json()
          createdOrders.push(o)
        }

        // 2. Create Razorpay order via Payment Service
        const rzpRes = await fetch(`${SERVICES.PAYMENT}/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ 
            orderId: createdOrders[0].id, // Using first order ID for reference
            amount: total,
            currency: 'INR'
          })
        })
        const rzpData = await rzpRes.json()

        // 3. Open Razorpay Widget
        const options = {
          key: "rzp_test_SvQDlSXovmsr5q", // Replace with real key in production
          amount: (total * 100).toString(),
          currency: "INR",
          name: "NexusMart",
          description: "Order Payment",
          order_id: rzpData.razorpayOrderId,
          handler: async function (response) {
            try {
              // Verify payment via Payment Service
              const verifyRes = await fetch(`${SERVICES.PAYMENT}/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                })
              })
              
              if (!verifyRes.ok) throw new Error("Payment verification failed")

              // Verify all orders on order-service (legacy/sync)
              for (const ord of createdOrders) {
                await fetch(`${SERVICES.ORDER}/orders/verify-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    internal_order_id: ord.id
                  })
                })
                
                await fetch(`${SERVICES.CART}/cart/remove`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ email: customer.email, productId: ord.product })
                })
              }
              setSuccess(true)
            } catch (err) {
              setPaymentError("Payment verification failed")
            }
          },
          prefill: {
            name: customer.name,
            email: customer.email,
          },
          theme: { color: "#F2C200" }
        };

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', function (response){
             setPaymentError("Payment Failed: " + response.error.description);
          });
          rzp.open()
        } else {
          // Simulation for mock since key/order is fake
          for (const ord of createdOrders) {
            await fetch(`${SERVICES.ORDER}/orders/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                  razorpay_order_id: rzpData.orderId,
                  razorpay_payment_id: "mock_payment_" + Math.random().toString(36).substr(2, 9),
                  razorpay_signature: "mock_signature",
                  internal_order_id: ord.id
                })
              })
              await fetch(`${SERVICES.CART}/cart/remove`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ email: customer.email, productId: ord.product })
              })
          }
          setSuccess(true)
        }
        setLoading(false)
      }
    } catch (err) {
      setPaymentError("Checkout failed. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="success-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <CheckCircle size={64} color="var(--emerald)" style={{ margin: '0 auto 24px' }} />
          <h1 className="page-title" style={{textAlign:'center', marginBottom:'8px'}}>Order Confirmed!</h1>
          <p style={{color:'var(--text-2)', marginBottom:'32px'}}>Thank you for your purchase. Your order is being processed.</p>
          <Link to="/orders" className="btn-primary" style={{padding:'12px 32px'}}>
            View My Orders
          </Link>
        </div>

        {recommended.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Since you bought {items[0].product.category}, you might also like:
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {recommended.map(prod => (
                <Link key={prod.id} to={`/product/${prod.id}`} className="product-card" style={{ textDecoration: 'none', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                    {prod.emoji?.startsWith('data:image') ? (
                      <img src={prod.emoji.split('||')[0]} alt={prod.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '72px' }}>{prod.emoji || '📦'}</span>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '15px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.name}
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '18px' }}>
                      {formatCurrency(prod.price)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '32px' }}>Checkout</h1>
      
      <div className="checkout-grid">
        <div>
          <form onSubmit={handleCheckout} className="checkout-card">
            
            <h2 className="checkout-title">Delivery Address</h2>
            {addresses.length === 0 ? (
              <div style={{ marginBottom: '24px', padding: '24px', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px dashed var(--border-light)', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: '16px' }}>No Delivery Address</h3>
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-2)', fontSize: '14px' }}>Please add a delivery address to proceed with your order.</p>
                <Link to="/profile?tab=addresses" className="btn-primary" style={{ display: 'inline-block', padding: '10px 20px', textDecoration: 'none', borderRadius: '8px' }}>
                  Add New Address
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {addresses.map((addr, idx) => {
                  const addrStr = `${addr.fullName || 'User'}, ${addr.flat}, ${addr.area}, ${addr.city}, ${addr.state} - ${addr.pincode} (Mob: ${addr.mobile})`
                  const isSelected = address === addrStr;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setAddress(addrStr)}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        padding: '20px', 
                        background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-card)', 
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-light)'}`, 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.1)' : 'none'
                      }}
                    >
                      {isSelected && (
                        <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--accent)' }}>
                          <CheckCircle size={22} fill="currentColor" color="var(--bg-base)" />
                        </div>
                      )}
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', paddingRight: '28px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                        {addr.fullName || 'Saved Address'}
                        {addr.addressType && (
                          <span style={{ background: 'var(--bg-hover)', color: 'var(--text-2)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--border-light)' }}>
                            {addr.addressType}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6, flex: 1 }}>
                        {addr.flat && <span>{addr.flat}, </span>}
                        {addr.area && <span>{addr.area}</span>}<br />
                        {addr.city}, {addr.state} {addr.pincode}
                      </div>
                      <div style={{ color: 'var(--text-main)', fontSize: '14px', marginTop: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📞 {addr.mobile || 'No mobile provided'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {eta && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🚚</span>
                <div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '15px' }}>Estimated Delivery</div>
                  <div style={{ color: 'var(--emerald)', fontWeight: 700, fontSize: '18px' }}>{eta}</div>
                </div>
              </div>
            )}

            <h2 className="checkout-title">Payment Method</h2>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="RAZORPAY" 
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                />
                <CreditCard size={18} /> Online (Card/UPI/NetBanking)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD" 
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <DollarSign size={18} /> Cash on Delivery
              </label>
            </div>

            {paymentError && (
              <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', borderRadius: '12px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ marginTop: '2px' }}><XCircle size={18} /></div>
                <div>{paymentError}</div>
              </div>
            )}

            <button 
              disabled={loading}
              type="submit"
              className="btn-primary btn-block" style={{ marginTop: '24px' }}
            >
              {loading ? 'Processing...' : (paymentMethod === 'COD' ? `Place Order (${formatCurrency(total)})` : `Pay ${formatCurrency(total)} via Razorpay`)}
            </button>
          </form>
        </div>

        <div>
          <div className="summary-card">
            <h2 className="summary-title">Order Summary</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px' }}>
              {items.map(item => (
                <div key={item.product.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:'12px' }}>
                    <span style={{ color:'var(--text-3)' }}>{item.quantity}x</span>
                    <span style={{ fontWeight:500 }}>{item.product.name}</span>
                  </div>
                  <span style={{ fontWeight:600 }}>{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
