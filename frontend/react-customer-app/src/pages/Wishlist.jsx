import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

export default function Wishlist({ customer }) {
  const { formatCurrency } = useCurrency()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWishlistAndProducts()
  }, [])

  const fetchWishlistAndProducts = async () => {
    try {
      const wRes = await fetch(`${SERVICES.WISHLIST}/wishlist/${customer.email}`, { headers: getAuthHeaders() })
      const wData = await wRes.json()
      
      if (wData.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const pRes = await fetch(`${SERVICES.PRODUCT}/products`)
      const pData = await pRes.json()
      
      const wishlistedProducts = pData.filter(p => wData.includes(p.id))
      setItems(wishlistedProducts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productId) => {
    try {
      await fetch(`${SERVICES.WISHLIST}/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId })
      })
      setItems(items.filter(i => i.id !== productId))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header" style={{ justifyContent: 'flex-start' }}>
        <Heart size={28} color="var(--rose)" />
        <h1 className="page-title" style={{ marginBottom: 0 }}>Your Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🤍</span>
          <h3 className="empty-title">Your wishlist is empty</h3>
          <p className="empty-desc">Save items you love to find them easily later.</p>
          <Link to="/" className="btn-primary" style={{ padding: '12px 32px' }}>
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map(p => {
            const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
            return (
              <div key={p.id} className="product-card" style={{ position: 'relative' }}>
                <button 
                  onClick={() => handleRemove(p.id)}
                  className="btn-remove"
                  style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'var(--bg-card)' }}
                  title="Remove from wishlist"
                >
                  <Trash2 size={18} />
                </button>
                <Link to={`/product/${p.id}`} style={{ display: 'block' }}>
                  <div className="product-image">
                    {cover ? (
                      <img src={cover} />
                    ) : (
                      <span className="product-emoji">{p.emoji || '📦'}</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{p.name}</h3>
                    <div className="product-price">{formatCurrency(p.price)}</div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
