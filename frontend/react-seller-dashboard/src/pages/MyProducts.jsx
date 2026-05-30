import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../config'
import { useCurrency } from '../context/CurrencyContext'

const MAX_IMAGES = 5

const statusStyle = {
  APPROVED: { bg: 'rgba(16,185,129,.12)', color: '#10b981', label: '✅ Approved' },
  PENDING:  { bg: 'rgba(245,158,11,.12)', color: '#f59e0b', label: '⏳ Pending Review' },
  REJECTED: { bg: 'rgba(244,63,94,.12)',  color: '#f43f5e', label: '❌ Rejected' },
}

// ── Image gallery component ──────────────────────────────────────
function ImageGallery({ emoji }) {
  const imgs = emoji?.startsWith('data:image') ? emoji.split('||').filter(Boolean) : []
  const [active, setActive] = useState(0)
  if (imgs.length === 0) return (
    <div style={{
      width: '100%', height: 200,
      background: 'var(--bg-base)', borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 48, border: '1px solid var(--border)'
    }}>{emoji || '📦'}</div>
  )
  return (
    <div>
      {/* Main image */}
      <img
        src={imgs[active]}
        alt={`Image ${active + 1}`}
        style={{
          width: '100%', height: 240,
          objectFit: 'contain',
          borderRadius: 12,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          display: 'block', marginBottom: 10
        }}
      />
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {imgs.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Thumb ${i + 1}`}
              onClick={() => setActive(i)}
              style={{
                width: 56, height: 56,
                objectFit: 'cover',
                borderRadius: 8,
                cursor: 'pointer',
                border: `2px solid ${i === active ? 'var(--accent)' : 'var(--border)'}`,
                opacity: i === active ? 1 : 0.55,
                transition: 'all 0.15s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MyProducts({ seller }) {
  const { formatCurrency, currencyCode } = useCurrency()
  const [products, setProducts]         = useState([])
  const [showUpload, setShowUpload]     = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Upload form fields
  const [name,    setName]    = useState('')
  const [cat,     setCat]     = useState('Electronics')
  const [subCat,  setSubCat]  = useState('Mobiles')
  const [brand,   setBrand]   = useState('')
  const [price,   setPrice]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [images,  setImages]  = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  
  const SUB_CATEGORIES = {
    'TV, Audio & Cameras': ['Televisions', 'Home Entertainment Systems', 'Headphones', 'Speakers', 'Home Audio & Theater', 'Cameras', 'DSLR Cameras', 'Security Cameras', 'Camera Accessories', 'Musical Instruments & Professional Audio', 'Gaming Consoles'],
    'Electronics': ['Mobiles', 'Computers', 'Laptops', 'Tablets', 'Appliances', 'Smart Home', 'Accessories', 'Other Electronics'],
    'Fashion': ['Shirts', 'T-Shirts', 'Jeans', 'Shoes', 'Watches', "Men's Fashion", "Women's Fashion", 'Other Fashion'],
    'Home & Kitchen': ['Furniture', 'Decor', 'Kitchen Appliances', 'Cookware', 'Bedding'],
    'Beauty & Health': ['Makeup', 'Skincare', 'Haircare', 'Personal Care', 'Supplements'],
    'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Sportswear', 'Footwear'],
    'Toys & Games': ['Action Figures', 'Board Games', 'Educational', 'Video Games'],
    'Books': ['Fiction', 'Non-Fiction', 'Childrens', 'Textbooks']
  };
  const fileInputRef = useRef(null)

  const fetchProducts = () => {
    if (!seller?.store) return
    const token = localStorage.getItem('sellerAuthToken')
    fetch(`${API_BASE}/api/products/seller/${encodeURIComponent(seller.store)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(e => console.error('Products fetch error:', e))
  }

  useEffect(() => { fetchProducts() }, [seller])

  // ── Image upload handlers ─────────────────────────────────────

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const remaining = MAX_IMAGES - images.length
    const toAdd = files.slice(0, remaining)
    if (files.length > remaining)
      setError(`Max ${MAX_IMAGES} images allowed. Added ${toAdd.length}.`)
    else setError('')
    const newImages = toAdd.map(file => {
      if (file.size > 5 * 1024 * 1024) { setError(`"${file.name}" exceeds 5 MB.`); return null }
      return { file, preview: URL.createObjectURL(file) }
    }).filter(Boolean)
    setImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const removeImage = (idx) => { setImages(prev => prev.filter((_, i) => i !== idx)); setError('') }

  // ── Submit new product ────────────────────────────────────────

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (images.length === 0) { setError('Please upload at least one product image.'); return }
    setLoading(true); setError('')
    try {
      const toBase64 = (file) => new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const base64Images = await Promise.all(images.map(img => toBase64(img.file)))
      const payload = {
        name, seller: seller.store, cat, sub_category: subCat, brand,
        price: parseFloat(price),
        emoji: base64Images.join('||'),
        description: desc
      }
      const token = localStorage.getItem('sellerAuthToken')
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setShowUpload(false); resetForm(); fetchProducts()
      } else {
        const txt = await res.text()
        let msg = txt
        try { msg = JSON.parse(txt).detail || txt } catch {}
        setError(msg || 'Failed to upload product.')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const resetForm = () => { setName(''); setBrand(''); setPrice(''); setCat('Electronics'); setDesc(''); setImages([]); setError('') }

  const [searchQuery, setSearchQuery] = useState('')

  // ── Helpers ───────────────────────────────────────────────────

  const getFirstImage = (emoji) => emoji?.startsWith('data:image') ? emoji.split('||')[0] : null
  const getAllImages  = (emoji) => emoji?.startsWith('data:image') ? emoji.split('||').filter(Boolean) : []

  const filteredProducts = products.filter(p => 
    !searchQuery || 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2>📦 My Products</h2>
          <p>Upload and manage your store's inventory.</p>
        </div>
        {seller?.status !== 'APPROVED' && seller?.status !== 'ACTIVE' ? (
          <div style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', padding: '10px 16px', borderRadius: 8, fontWeight: 600 }}>
            ⏳ Account pending Admin approval. Uploads disabled.
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => { setShowUpload(true); resetForm() }}>
            + Upload Product
          </button>
        )}
      </div>

      {/* ── Products Table ── */}
      <div className="table-container">
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Inventory ({filteredProducts.length})</h3>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by product name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '250px' }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Image</th><th>Product</th><th>Category</th>
              <th>Price</th><th>Date Added</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign:'center', padding:'48px', color:'var(--text-2)' }}>
                {searchQuery ? "No products found matching your search." : "No products yet. Click Upload Product to get started!"}
              </td></tr>
            ) : filteredProducts.map(p => {
              const firstImg = getFirstImage(p.emoji)
              const allImgs  = getAllImages(p.emoji)
              return (
                <tr
                  key={p.id}
                  className="clickable-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedProduct(p)}
                >
                  <td>
                    {firstImg ? (
                      <div style={{ position:'relative', display:'inline-block' }}>
                        <img
                          src={firstImg} alt={p.name}
                          style={{ width:52, height:52, borderRadius:10, objectFit:'cover', border:'1px solid var(--border)', display:'block' }}
                        />
                        {allImgs.length > 1 && (
                          <span style={{
                            position:'absolute', bottom:-4, right:-4,
                            background:'var(--accent)', color:'#fff',
                            fontSize:10, fontWeight:700,
                            borderRadius:6, padding:'1px 5px',
                            border:'2px solid var(--bg-card)'
                          }}>+{allImgs.length - 1}</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ width:52, height:52, borderRadius:10, background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                        {p.emoji || '📦'}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'monospace' }}>{p.id}</div>
                  </td>
                  <td>
                    {p.cat}
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.sub_category || 'Other'}</div>
                  </td>
                  <td><strong>{formatCurrency(p.price)}</strong></td>
                  <td>{p.date}</td>
                  <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>

            <h3 style={{ marginBottom: 4 }}>{selectedProduct.name}</h3>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:20 }}>
              Product details and current review status.
            </p>

            {/* Image gallery */}
            <ImageGallery emoji={selectedProduct.emoji} />

            {/* Status banner */}
            {(() => {
              const s = statusStyle[selectedProduct.status] || statusStyle.PENDING
              return (
                <div style={{
                  background: s.bg, color: s.color,
                  borderRadius: 10, padding: '12px 16px',
                  fontWeight: 600, fontSize: 14,
                  marginTop: 16, marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  {s.label}
                  {selectedProduct.status === 'PENDING' && (
                    <span style={{ fontWeight:400, fontSize:12, marginLeft:4 }}>
                      — Your product is awaiting admin review
                    </span>
                  )}
                  {selectedProduct.status === 'REJECTED' && (
                    <span style={{ fontWeight:400, fontSize:12, marginLeft:4 }}>
                      — Contact support for more info
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Detail grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '130px 1fr',
              gap: '12px 16px', fontSize: 14
            }}>
              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Product ID</span>
              <code style={{ fontSize:12, color:'var(--text-1)' }}>{selectedProduct.id}</code>

              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Name</span>
              <span>{selectedProduct.name}</span>

              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Category</span>
              <span>{selectedProduct.cat} / {selectedProduct.sub_category || 'Other'}</span>

              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Price</span>
              <span><strong style={{ color:'var(--accent)', fontSize:16 }}>{formatCurrency(selectedProduct.price)}</strong></span>

              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Date Added</span>
              <span>{selectedProduct.date}</span>

              <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Images</span>
              <span>{getAllImages(selectedProduct.emoji).length || 1} image(s)</span>

              {selectedProduct.description && (
                <>
                  <span style={{ color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>Description</span>
                  <span style={{ color:'var(--text-1)', lineHeight:1.6 }}>{selectedProduct.description}</span>
                </>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" style={{ width:'100%' }} onClick={() => setSelectedProduct(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowUpload(false)}>×</button>
            <h3 style={{ marginBottom: 4 }}>Upload New Product</h3>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:24 }}>
              Add up to {MAX_IMAGES} images for this product listing.
            </p>

            {error && <div className="login-error" style={{ marginBottom:16 }}>{error}</div>}

            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Product Images ({images.length}/{MAX_IMAGES})</label>
                {images.length > 0 ? (
                  <div className="img-grid">
                    {images.map((img, idx) => (
                      <div key={idx} className="img-grid-item">
                        <img src={img.preview} alt={`Product ${idx + 1}`} />
                        <button type="button" className="img-grid-remove" onClick={() => removeImage(idx)}>×</button>
                        {idx === 0 && <span className="img-grid-badge">Cover</span>}
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <div className="img-grid-add" onClick={() => fileInputRef.current.click()}>
                        <span>+</span><small>Add more</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="img-upload-zone" onClick={() => fileInputRef.current.click()}>
                    <div className="img-upload-icon">📷</div>
                    <p className="img-upload-text">Click to upload up to {MAX_IMAGES} images</p>
                    <p className="img-upload-hint">PNG, JPG, WEBP · Max 5 MB each · First image = cover</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleImageChange} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'0 16px' }}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input className="form-control" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Smart TV 55 inch" required />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input className="form-control" type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Samsung" required />
                </div>
              </div>

              <div className="form-group">
                <label>Description <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Describe your product — features, specs, condition..."
                  style={{ resize:'vertical', minHeight:80 }}
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0 16px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" style={{ maxWidth:'100%' }} value={cat} onChange={e => { setCat(e.target.value); setSubCat(SUB_CATEGORIES[e.target.value][0]); }}>
                    {Object.keys(SUB_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub Category</label>
                  <select className="form-control" style={{ maxWidth:'100%' }} value={subCat} onChange={e => setSubCat(e.target.value)}>
                    {(SUB_CATEGORIES[cat] || []).map(sc => <option key={sc}>{sc}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price ({currencyCode})</label>
                  <input className="form-control" style={{ maxWidth:'100%' }} type="number" step="0.01" min="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Uploading…' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
