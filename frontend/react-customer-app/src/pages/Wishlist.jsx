import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'
import { Trash2, ShoppingCart } from 'lucide-react'

export default function Wishlist({ customer }) {
  const { formatCurrency } = useCurrency()
  const navigate = useNavigate()
  const [wishlistItems, setWishlistItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer?.email) return
    
    fetch(`${SERVICES.WISHLIST}/wishlist/${customer.email}`)
      .then(res => res.json())
      .then(items => {
        setWishlistItems(items)
        if (items.length > 0) {
          fetch(`${SERVICES.PRODUCT}/products`)
            .then(res => res.json())
            .then(data => {
              const strItems = items.map(String)
              const wishlistProducts = data.filter(p => strItems.includes(String(p.id)))
              setProducts(wishlistProducts)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [customer])

  const removeFromWishlist = (productId) => {
    fetch(`${SERVICES.WISHLIST}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customer.email, productId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'removed') {
          setWishlistItems(prev => prev.filter(id => id !== productId))
          setProducts(prev => prev.filter(p => p.id !== productId))
        }
      })
      .catch(console.error)
  }

  const addToCart = (product) => {
    if (product.stock <= 0) return
    fetch(`${SERVICES.CART}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ email: customer.email, productId: product.id, quantity: 1 })
    })
      .then(res => {
        if(res.ok) {
          navigate('/cart')
        }
      })
      .catch(console.error)
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading wishlist...</div>

  return (
    <div className="container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: 'var(--rose)', marginRight: '8px' }}>❤️</span> Your Wishlist
      </h2>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '12px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3>Your wishlist is empty</h3>
          <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>Save items you want to buy later.</p>
          <Link to="/" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '4px' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {products.map(product => {
            const outOfStock = product.stock <= 0
            const images = product.emoji?.startsWith('data:image') ? product.emoji.split('||').filter(Boolean) : []
            const firstImage = images.length > 0 ? images[0] : null
            
            return (
              <div key={product.id} style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ position: 'relative' }}>
                  <Link to={`/product/${product.id}`} style={{ display: 'block' }}>
                    {firstImage ? (
                      <img src={firstImage} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'contain', background: '#fff' }} />
                    ) : (
                      <div style={{ width: '100%', height: '200px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                        {product.emoji || '📦'}
                      </div>
                    )}
                  </Link>
                  <button 
                    onClick={() => removeFromWishlist(product.id)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 'bold' }}>{product.seller}</div>
                    <h3 style={{ fontSize: '16px', margin: '4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h3>
                  </Link>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '8px 0', marginTop: 'auto' }}>
                    {formatCurrency(product.price)}
                  </div>
                  
                  {outOfStock ? (
                    <div style={{ color: 'var(--rose)', fontWeight: 'bold', padding: '8px 0', textAlign: 'center', border: '1px solid var(--rose)', borderRadius: '4px', marginTop: '8px' }}>
                      Out of Stock
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(product)}
                      className="btn-primary" 
                      style={{ width: '100%', padding: '10px', borderRadius: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '8px' }}
                    >
                      <ShoppingCart size={16} style={{ marginRight: '8px' }} /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
