import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, MapPin, Share2, XCircle, CheckCircle } from 'lucide-react'
import { SERVICES, getAuthHeaders } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

export default function ProductDetails({ customer, deliveryLocation, setIsLocModalOpen }) {
  const { formatCurrency } = useCurrency()
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [qty, setQty] = useState(1)
  const [fullscreenImg, setFullscreenImg] = useState(null)
  const [cartMessage, setCartMessage] = useState('')

  // Review form
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const scrollRef = useRef(null)
  const scrollIntervalRef = useRef(null)

  const handleMouseEnter = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    scrollIntervalRef.current = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
          container.scrollLeft = 0
        } else {
          container.scrollLeft += 1
        }
      }
    }, 15)
  }

  const handleMouseLeave = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const pRes = await fetch(`${SERVICES.PRODUCT}/products/${id}`)
      const pData = await pRes.json()
      setProduct(pData)

      const rRes = await fetch(`${SERVICES.REVIEW}/reviews/${id}`)
      const rData = await rRes.json()
      setReviews(Array.isArray(rData) ? rData : [])

      if (customer) {
        const wRes = await fetch(`${SERVICES.WISHLIST}/wishlist/${customer.email}`, { headers: getAuthHeaders() })
        const wData = await wRes.json()
        setIsWishlisted(wData.includes(id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!customer) return navigate('/login')
    setAddingToCart(true)
    try {
      await fetch(`${SERVICES.CART}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId: id, quantity: qty })
      })
      setCartMessage('Added to cart successfully!')
      setTimeout(() => setCartMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setCartMessage('Failed to add to cart.')
      setTimeout(() => setCartMessage(''), 3000)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!customer) return navigate('/login')
    try {
      setIsWishlisted(!isWishlisted)
      await fetch(`${SERVICES.WISHLIST}/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ email: customer.email, productId: id })
      })
    } catch (err) {
      setIsWishlisted(!isWishlisted)
      console.error(err)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!customer) return navigate('/login')
    setSubmittingReview(true)
    try {
      const newReview = {
        product: id,
        customer: customer.name,
        rating,
        comment,
        date: new Date().toISOString()
      }
      await fetch(`${SERVICES.REVIEW}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(newReview)
      })
      setReviews([newReview, ...reviews])
      setComment('')
      setRating(5)
    } catch (err) {
      console.error(err)
      alert("Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="loading" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}><div className="spinner"></div></div>
  if (!product) return <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>Product not found.</div>

  const images = product.emoji?.startsWith('data:image') ? product.emoji.split('||') : []
  const hasImages = images.length > 0

  const avgRating = reviews.length ? (reviews.reduce((a,b) => a + b.rating, 0) / reviews.length).toFixed(1) : 3.8
  const ratingCount = reviews.length ? reviews.length : 3527



  return (
    <div style={{ minHeight: '100vh', padding: '16px 0' }}>
      <div className="pd-3col-grid" style={{ maxWidth: '1400px', margin: '0 auto', background: 'var(--bg-card)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
        
        {/* Left Column: Image Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Main Cover Image */}
          <div 
            onClick={() => { if (hasImages) setFullscreenImg(activeImgIndex) }}
            className="pd-cover-image"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff', 
              border: '1px solid #E7E7E7', 
              borderRadius: '4px',
              cursor: hasImages ? 'zoom-in' : 'default',
              overflow: 'hidden',
              padding: '16px'
            }}
          >
            {hasImages ? (
              <img 
                src={images[activeImgIndex]} 
                alt={`${product.name}`} 
                style={{ 
                  maxHeight: '100%', 
                  maxWidth: '100%', 
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <span style={{ fontSize: '120px' }}>{product.emoji || '📦'}</span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {hasImages && images.length > 1 && (
            <div 
              className="hide-scrollbar"
              style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                padding: '4px 0'
              }}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  style={{
                    flexShrink: 0,
                    width: '64px',
                    height: '64px',
                    border: idx === activeImgIndex ? '2px solid #E77600' : '1px solid #D5D9D9',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.15s ease',
                    boxShadow: idx === activeImgIndex ? '0 0 0 1px #E77600' : 'none'
                  }}
                  onMouseEnter={e => { if (idx !== activeImgIndex) e.currentTarget.style.borderColor = '#E77600' }}
                  onMouseLeave={e => { if (idx !== activeImgIndex) e.currentTarget.style.borderColor = '#D5D9D9' }}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} thumbnail ${idx + 1}`} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Product Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px' }} onClick={e => e.preventDefault()}>Visit the {product.seller || 'NexusMart'} Store</a>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: 'var(--text-main)', margin: '4px 0' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--amber)', display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} fill={s <= Math.round(avgRating) ? 'currentColor' : 'none'} color="currentColor" />
              ))}
            </div>
            <a href="#reviews" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{ratingCount} ratings</a>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />

          {/* Pricing Row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {product.discount && product.discount > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ color: 'var(--rose)', fontSize: '28px', fontWeight: 300 }}>-{product.discount}%</span>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start' }}>
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  M.R.P.: <span style={{ textDecoration: 'line-through' }}>{formatCurrency(parseFloat(product.price) / (1 - product.discount / 100))}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start' }}>
                  {formatCurrency(product.price)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>NexusMart Fulfilled</span>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Inclusive of all taxes</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '8px 0' }} />

          {/* Features Description */}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: 'var(--text-main)' }}>About this item</div>
            <div style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--text-1)', whiteSpace: 'pre-line' }}>
              {product.description || 'No description provided by the seller.'}
            </div>
          </div>
        </div>

        {/* Right Column: Buy Box */}
        <div>
          <div className="buy-box">
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
              {formatCurrency(product.price)}
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-1)' }}>
              <strong>FREE delivery</strong> <strong style={{ color: 'var(--text-main)' }}>Tomorrow, 29 May</strong>. Details
            </div>
            
            <div 
              style={{ fontSize: '13px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              onClick={() => setIsLocModalOpen && setIsLocModalOpen(true)}
            >
              <MapPin size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)' }}>
                Deliver to {deliveryLocation?.name || (customer ? customer.name : 'Guest')} - {deliveryLocation?.address || 'Update Location'}
              </span>
            </div>

            <div style={{ color: 'var(--emerald)', fontSize: '18px', fontWeight: 700 }}>
              In stock
            </div>

            <div className="amz-form-group" style={{ margin: 0 }}>
              <label className="amz-form-label" style={{ fontWeight: 400, fontSize: '13px' }}>Quantity:</label>
              <select className="amz-form-select" value={qty} onChange={e => setQty(parseInt(e.target.value))} style={{ width: '100%', padding: '6px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button 
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="amz-btn-yellow"
                style={{ width: '100%', padding: '10px' }}
              >
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={() => { handleAddToCart(); navigate('/cart'); }}
                className="amz-btn-orange"
                style={{ width: '100%', padding: '10px' }}
              >
                Buy Now
              </button>
            </div>

            {cartMessage && (
              <div style={{ marginTop: '12px', padding: '8px', background: cartMessage.includes('Failed') ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: cartMessage.includes('Failed') ? 'var(--rose)' : 'var(--emerald)', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {cartMessage.includes('Failed') ? <XCircle size={16} /> : <CheckCircle size={16} />}
                {cartMessage}
              </div>
            )}

            <div style={{ fontSize: '12px', color: 'var(--text-2)', display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: '4px', marginTop: '8px' }}>
              <span>Ships from</span>
              <span style={{ color: 'var(--text-main)' }}>NexusMart</span>
              <span>Sold by</span>
              <span style={{ color: 'var(--accent)' }}>{product.seller || 'NexusMart'}</span>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />
            
            <button 
              onClick={handleToggleWishlist}
              style={{ width: '100%', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '12px', background: isWishlisted ? 'rgba(244, 63, 94, 0.1)' : 'transparent', color: isWishlisted ? 'var(--rose)' : 'var(--text-1)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: isWishlisted ? 700 : 600, transition: '0.2s' }}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} color={isWishlisted ? 'currentColor' : 'currentColor'} />
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>

      </div>

      {/* Reviews Section */}
      <div id="reviews" className="reviews-section" style={{ maxWidth: '1400px', margin: '24px auto', background: 'var(--bg-card)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' }}>
        <h2 className="reviews-title" style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', fontSize: '24px', fontWeight: 800 }}>Customer Reviews</h2>
        <div className="reviews-grid" style={{ marginTop: '20px' }}>
          
          <div className="write-review">
            <h3 style={{color: 'var(--text-main)'}}>Write a Review</h3>
            {customer ? (
              <form onSubmit={handleSubmitReview}>
                <div className="rating-select">
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setRating(star)}
                    >
                      <Star size={28} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <textarea 
                  required
                  placeholder="What did you think about this product?" 
                  className="review-textarea"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                ></textarea>
                <button 
                  disabled={submittingReview} 
                  type="submit" 
                  className="amz-btn-yellow" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p style={{ color: 'var(--text-2)' }}>Please log in to leave a review.</p>
            )}
          </div>

          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px' }}>
                <span className="empty-icon">⭐</span>
                <p className="empty-desc" style={{ marginBottom: 0 }}>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              reviews.map((r, idx) => (
                <div key={idx} className="review-card" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
                  <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div className="review-author" style={{ color: 'var(--text-main)', fontWeight: 700 }}>{r.customer}</div>
                      <div className="review-stars" style={{ color: 'var(--amber)', display: 'flex', gap: '2px', marginTop: '4px' }}>
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} fill={star <= r.rating ? 'currentColor' : 'none'} color="currentColor" />
                        ))}
                      </div>
                    </div>
                    <div className="review-date" style={{ color: 'var(--text-3)', fontSize: '13px' }}>{new Date(r.date).toLocaleDateString()}</div>
                  </div>
                  <div className="review-text" style={{ color: 'var(--text-1)', lineHeight: 1.6 }}>{r.comment}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Fullscreen Lightbox with Navigation */}
      {fullscreenImg !== null && hasImages && (
        <div 
          onClick={() => setFullscreenImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          {/* Close Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); setFullscreenImg(null); }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '36px',
              cursor: 'pointer',
              lineHeight: 1,
              zIndex: 10001
            }}
          >
            &times;
          </button>

          {/* Previous Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreenImg(prev => prev <= 0 ? images.length - 1 : prev - 1); }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                fontSize: '32px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              ‹
            </button>
          )}

          {/* Main Image */}
          <img 
            src={images[fullscreenImg]} 
            alt={`${product.name} fullscreen`} 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '85%',
              maxWidth: '80%',
              objectFit: 'contain',
              borderRadius: '4px',
              cursor: 'default'
            }} 
          />

          {/* Next Arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreenImg(prev => prev >= images.length - 1 ? 0 : prev + 1); }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                fontSize: '32px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              ›
            </button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px',
              background: 'rgba(0,0,0,0.5)',
              padding: '6px 16px',
              borderRadius: '20px'
            }}>
              {fullscreenImg + 1} / {images.length}
            </div>
          )}

          {/* Thumbnail strip at bottom */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px'
            }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setFullscreenImg(idx); }}
                  style={{
                    width: '48px',
                    height: '48px',
                    border: idx === fullscreenImg ? '2px solid white' : '2px solid transparent',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: idx === fullscreenImg ? 1 : 0.5,
                    transition: 'opacity 0.2s, border-color 0.2s',
                    background: 'rgba(255,255,255,0.1)'
                  }}
                  onMouseEnter={e => { if (idx !== fullscreenImg) e.currentTarget.style.opacity = '0.8' }}
                  onMouseLeave={e => { if (idx !== fullscreenImg) e.currentTarget.style.opacity = '0.5' }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
