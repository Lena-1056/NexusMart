import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ArrowRight, Star } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

export default function Cart({ customer }) {
  const { formatCurrency } = useCurrency()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [recommended, setRecommended] = useState([])
  const [savedItems, setSavedItems] = useState([])
  const [selectedItems, setSelectedItems] = useState(new Set())

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await fetch(`${SERVICES.CART}/cart/${customer.email}`, { headers: getAuthHeaders() })
      const data = await res.json()
      
      const productsRes = await fetch(`${SERVICES.PRODUCT}/products`)
      const productsData = await productsRes.json()
      
      const enrichedCart = data.map(cartItem => {
        const p = productsData.find(prod => prod.id === cartItem.product_id)
        return { ...cartItem, product: p || { id: cartItem.product_id, name: 'Unknown Product', price: '0.00', seller: 'Unknown' } }
      }).filter(item => item.product)
      
      setItems(enrichedCart)
      setSelectedItems(new Set(enrichedCart.map(item => item.product.id)))

      // Fetch wishlist items
      const wRes = await fetch(`${SERVICES.WISHLIST}/wishlist/${customer.email}`, { headers: getAuthHeaders() })
      const wData = await wRes.json()
      
      const enrichedWishlist = wData.map(pid => {
        return productsData.find(prod => prod.id === pid)
      }).filter(Boolean)
      setSavedItems(enrichedWishlist)

      // Fetch recommended products (not currently in cart)
      const notInCart = productsData.filter(p => p.status === 'APPROVED' && !enrichedCart.some(item => item.product_id === p.id))
      setRecommended(notInCart.slice(0, 2))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId) => {
    try {
      await fetch(`${SERVICES.CART}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId })
      })
      setItems(items.filter(i => i.product.id !== productId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateQuantity = async (productId, newQty) => {
    if (newQty <= 0) {
      handleRemove(productId)
      return
    }
    try {
      await fetch(`${SERVICES.CART}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId, quantity: newQty })
      })
      setItems(items.map(item => item.product.id === productId ? { ...item, quantity: newQty } : item))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveForLater = async (productId) => {
    try {
      await fetch(`${SERVICES.WISHLIST}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId })
      })
      
      const movedItem = items.find(i => i.product.id === productId)
      if (movedItem) {
         setSavedItems(prev => [...prev, movedItem.product])
      }
      await handleRemove(productId)
    } catch(err) {
      console.error(err)
    }
  }

  const handleMoveToCart = async (productId) => {
    try {
      // Add to cart
      await fetch(`${SERVICES.CART}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId, quantity: 1 })
      })
      
      // Remove from wishlist
      await fetch(`${SERVICES.WISHLIST}/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId })
      })
      
      // Refresh cart to get updated state
      fetchCart()
    } catch(err) {
      console.error(err)
    }
  }

  const handleDeleteSaved = async (productId) => {
    try {
      await fetch(`${SERVICES.WISHLIST}/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId })
      })
      setSavedItems(prev => prev.filter(p => p.id !== productId))
    } catch(err) {
      console.error(err)
    }
  }

  const toggleSelection = (productId) => {
    const next = new Set(selectedItems)
    if (next.has(productId)) {
      next.delete(productId)
    } else {
      next.add(productId)
    }
    setSelectedItems(next)
  }

  const handleToggleAll = (e) => {
    e.preventDefault()
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(i => i.product.id)))
    }
  }

  if (loading) return <div className="loading" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>

  const selectedCartItems = items.filter(item => selectedItems.has(item.product.id))
  const subtotal = selectedCartItems.reduce((acc, item) => acc + (parseFloat(item.product.price) * item.quantity), 0)
  const totalItemsCount = selectedCartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div style={{ minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Shopping Cart List */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-light)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>Shopping Cart</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #E7E7E7', paddingBottom: '8px', marginBottom: '20px' }}>
            <a href="#" style={{ color: '#007185', textDecoration: 'none', fontSize: '14px' }} onClick={handleToggleAll}>
              {selectedItems.size === items.length ? 'Deselect all items' : 'Select all items'}
            </a>
            <span style={{ fontSize: '14px', color: '#565959' }}>Price</span>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <span style={{ fontSize: '48px' }}>🛒</span>
              <h2 style={{ fontSize: '20px', margin: '16px 0 8px 0' }}>Your Cart is empty.</h2>
              <p style={{ color: '#565959', fontSize: '14px', marginBottom: '24px' }}>Your shopping cart lives to serve. Give it purpose — fill it with deals.</p>
              <Link to="/" className="amz-btn-yellow" style={{ textDecoration: 'none', display: 'inline-block' }}>Continue shopping</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map(item => {
                const p = item.product
                const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
                const futureDate = new Date()
                futureDate.setDate(futureDate.getDate() + 2)
                const deliveryStr = futureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

                return (
                  <div key={p.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #E7E7E7', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(p.id)}
                        onChange={() => toggleSelection(p.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                      />
                    </div>
                    
                    <Link to={`/product/${p.id}`} style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F7', borderRadius: '4px', overflow: 'hidden', padding: '8px' }}>
                      {cover ? <img src={cover} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '64px' }}>{p.emoji || '📦'}</span>}
                    </Link>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Link to={`/product/${p.id}`} style={{ fontSize: '18px', fontWeight: 500, color: '#007185', textDecoration: 'none', lineHeight: '24px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.name}
                      </Link>
                      {p.stock <= 0 ? (
                        <div style={{ color: 'var(--rose)', fontSize: '12px', fontWeight: 'bold' }}>Out of stock</div>
                      ) : p.stock <= 10 ? (
                        <div style={{ color: 'var(--rose)', fontSize: '12px', fontWeight: 'bold' }}>Only {p.stock} left in stock - order soon.</div>
                      ) : (
                        <div style={{ color: '#007600', fontSize: '12px', fontWeight: 'bold' }}>In stock</div>
                      )}
                      <div style={{ fontSize: '13px', color: '#565959' }}>
                        Eligible for <strong>FREE Shipping</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#565959' }}>
                        <span style={{ background: '#E3E6E6', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>NexusMart Fulfilled</span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                        <input type="checkbox" style={{ width: '14px', height: '14px' }} />
                        This will be a gift <span style={{ color: '#007185' }}>Learn more</span>
                      </label>

                      <div style={{ fontSize: '13px', color: 'var(--text-1)', marginTop: '4px' }}>
                        <strong>Seller:</strong> <span style={{ color: 'var(--accent)' }}>{p.seller || 'NexusMart'}</span>
                      </div>

                      {/* Controls row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {/* Qty Selector Pill */}
                        <div className="amz-qty-selector">
                          <button 
                            className="amz-qty-btn"
                            onClick={() => handleUpdateQuantity(p.id, item.quantity - 1)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                          >
                            {item.quantity === 1 ? <Trash2 size={14} /> : '-'}
                          </button>
                          <div className="amz-qty-val">{item.quantity}</div>
                          <button 
                            className="amz-qty-btn"
                            onClick={() => handleUpdateQuantity(p.id, item.quantity + 1)}
                            disabled={item.quantity >= p.stock}
                            style={{ opacity: item.quantity >= p.stock ? 0.5 : 1, cursor: item.quantity >= p.stock ? 'not-allowed' : 'pointer' }}
                          >
                            +
                          </button>
                        </div>

                        <span style={{ color: 'var(--border-light)' }}>|</span>
                        <a onClick={() => handleRemove(p.id)} style={{ color: 'var(--rose)', textDecoration: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>Delete</a>
                        <span style={{ color: 'var(--border-light)' }}>|</span>
                        <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px' }} onClick={(e) => { e.preventDefault(); handleSaveForLater(p.id) }}>Save for later</a>
                      </div>
                    </div>

                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'right', width: '120px' }}>
                      {formatCurrency(p.price * item.quantity)}
                    </div>
                  </div>
                )
              })}

              <div style={{ textAlign: 'right', fontSize: '18px', color: 'var(--text-main)', marginTop: '12px' }}>
                Subtotal ({totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}): <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </div>
          )}

          {savedItems.length > 0 && (
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #E7E7E7' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 20px 0' }}>Saved for later ({savedItems.length} items)</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {savedItems.map(p => {
                  const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
                  return (
                    <div key={p.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #E7E7E7', paddingBottom: '20px' }}>
                      <Link to={`/product/${p.id}`} style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F7F7', borderRadius: '4px', overflow: 'hidden', padding: '8px' }}>
                        {cover ? <img src={cover} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '64px' }}>{p.emoji || '📦'}</span>}
                      </Link>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Link to={`/product/${p.id}`} style={{ fontSize: '18px', fontWeight: 500, color: '#007185', textDecoration: 'none', lineHeight: '24px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.name}
                        </Link>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                          {formatCurrency(p.price)}
                        </div>
                        <div style={{ color: '#007600', fontSize: '12px', fontWeight: 'bold' }}>In stock</div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleMoveToCart(p.id)} 
                            style={{ padding: '4px 12px', background: '#FFD814', border: '1px solid #FCD200', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Move to cart
                          </button>
                          <span style={{ color: 'var(--border-light)' }}>|</span>
                          <a onClick={() => handleDeleteSaved(p.id)} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', cursor: 'pointer' }}>Delete</a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Summary / Checkout Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--emerald)', marginBottom: '16px' }}>
              <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--emerald)', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>✓</span>
              <div>
                <span style={{ fontWeight: 'bold' }}>Your order is eligible for FREE Delivery.</span>
              </div>
            </div>

            <div style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '20px' }}>
              Subtotal: <strong>{formatCurrency(subtotal)}</strong>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '20px' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px' }} />
              This order contains a gift
            </label>

            <button 
              disabled={selectedItems.size === 0}
              onClick={() => navigate('/checkout', { state: { items: selectedCartItems, total: subtotal } })}
              className="amz-btn-yellow"
              style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            >
              Proceed to Buy
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #E7E7E7', margin: '16px 0' }} />

            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span>EMI Available</span>
              <span>˅</span>
            </div>
          </div>

          {/* Buy It Again / Recommendations */}
          {recommended.length > 0 && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--text-main)' }}>Buy it again</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommended.map(p => {
                  const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
                  return (
                    <div key={p.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Link to={`/product/${p.id}`} style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', borderRadius: '12px', overflow: 'hidden', padding: '4px' }}>
                        {cover ? <img src={cover} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '32px' }}>{p.emoji || '📦'}</span>}
                      </Link>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <Link to={`/product/${p.id}`} style={{ fontSize: '14px', color: 'var(--text-1)', textDecoration: 'none', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.name}
                        </Link>
                        <div style={{ color: 'var(--amber)', display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} fill="currentColor" color="currentColor" />
                          ))}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</div>
                        <Link to={`/product/${p.id}`} style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', padding: '4px 12px', width: 'fit-content', marginTop: '4px', textAlign: 'center' }}>View</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
