import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { SERVICES } from '../services/api'
import { useCurrency } from '../context/CurrencyContext'

// Subcategory is now fetched directly from the database (p.sub_category)

export default function Home({ customer }) {
  const { formatCurrency } = useCurrency()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const q = searchParams.get('q') || ''
    const cat = searchParams.get('cat') || ''
    fetchProducts(q, cat)
  }, [location])

  const fetchProducts = async (q = '', cat = '') => {
    setLoading(true)
    try {
      const url = q ? `${SERVICES.SEARCH}/search?q=${encodeURIComponent(q)}` : `${SERVICES.PRODUCT}/products`
      const res = await fetch(url)
      const data = await res.json()
      let filtered = Array.isArray(data) ? data.filter(p => p.status === 'APPROVED') : []
      if (cat) {
        filtered = filtered.filter(p => p.cat.toLowerCase() === cat.toLowerCase())
      }
      setProducts(filtered)
    } catch (err) {
      console.error("Failed to fetch products", err)
    } finally {
      setLoading(false)
    }
  }

  const searchParams = new URLSearchParams(location.search)
  const q = searchParams.get('q') || ''
  const cat = searchParams.get('cat') || ''
  const subCatParam = searchParams.get('subcat') || ''
  const priceParam = searchParams.get('price') || ''
  const brandsParam = searchParams.get('brands') || ''
  const selectedBrands = brandsParam ? brandsParam.split(',') : []
  
  const isSearchOrCategory = q || cat || subCatParam || priceParam || brandsParam

  if (loading) {
    return (
      <div className="home-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  const renderProductCard = (p) => {
    const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
    return (
      <Link to={`/product/${p.id}`} key={p.id} className="amz-search-card" style={{ textDecoration: 'none', color: 'inherit', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', transition: '0.3s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
          {cover ? <img src={cover} alt={p.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '64px' }}>{p.emoji || '📦'}</span>}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '44px', lineHeight: '22px' }}>{p.name}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{p.cat}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: 'auto' }}>{formatCurrency(p.price)}</div>
        <div style={{ fontSize: '13px', color: 'var(--emerald)', marginTop: '4px', fontWeight: 600 }}>In stock</div>
      </Link>
    )
  }

  if (isSearchOrCategory) {
    if (products.length === 0) {
      return (
        <div className="home-container" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>No results found</h2>
          <p style={{ color: '#565959', fontSize: '14px', marginBottom: '24px' }}>
            Try checking your spelling or use more general terms
          </p>
          <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Back to home page</Link>
        </div>
      )
    }

    // If it's a category page without a specific search query, show sidebar + products
    if ((cat || subCatParam) && !q) {
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
      const staticCats = STATIC_SUB_CATEGORIES[cat] || [];
      const dynamicCats = [...new Set(products.map(p => p.sub_category || 'Other'))];
      const uniqueSubCats = [...new Set([...staticCats, ...dynamicCats])];
      const dynamicBrands = [...new Set(products.map(p => p.brand || 'Generic'))];
      
      let hardcodedBrands = [];
      if (cat.toLowerCase() === 'electronics') {
        hardcodedBrands = ['Samsung', 'Apple', 'OnePlus', 'iQOO', 'Realme', 'Xiaomi', 'Sony', 'LG', 'ASUS', 'Dell', 'HP', 'Vivo', 'Nokia'];
      } else if (cat.toLowerCase() === 'fashion') {
        hardcodedBrands = ['Nike', 'Adidas', 'Puma', "Levi's", 'Zara', 'H&M', 'Raymond', 'Allen Solly', 'Peter England', 'Calvin Klein'];
      }
      const uniqueBrands = [...new Set([...dynamicBrands, ...hardcodedBrands])].slice(0, 15);
      
      let displayProducts = products;
      if (subCatParam) {
        displayProducts = displayProducts.filter(p => (p.sub_category || 'Other').toLowerCase() === subCatParam.toLowerCase());
      }
      
      if (selectedBrands.length > 0) {
        displayProducts = displayProducts.filter(p => {
           const b = p.brand || 'Generic';
           return selectedBrands.includes(b);
        });
      }
      
      if (priceParam) {
        const [min, max] = priceParam.split('-');
        displayProducts = displayProducts.filter(p => {
          if (min && p.price < parseInt(min)) return false;
          if (max && p.price > parseInt(max)) return false;
          return true;
        });
      }

      const toggleBrand = (b) => {
        const newBrands = selectedBrands.includes(b) 
          ? selectedBrands.filter(x => x !== b)
          : [...selectedBrands, b];
        const params = new URLSearchParams(location.search);
        if (newBrands.length > 0) params.set('brands', newBrands.join(','));
        else params.delete('brands');
        return `/?${params.toString()}`;
      }
      
      const getPriceUrl = (min, max) => {
        const params = new URLSearchParams(location.search);
        params.set('price', `${min || ''}-${max || ''}`);
        return `/?${params.toString()}`;
      }

      return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
          {/* Sidebar Filters */}
          <div style={{ width: '260px', padding: '20px', borderRight: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>Category</div>
            <Link to={`/?cat=${encodeURIComponent(cat)}`} style={{ fontWeight: 700, fontSize: '14px', color: 'inherit', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>&lsaquo; {cat || 'All'}</Link>
            
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', marginTop: '16px' }}>{cat || 'Sub Categories'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '12px' }}>
              {uniqueSubCats.map(sc => (
                <Link 
                  key={sc} 
                  to={`/?cat=${encodeURIComponent(cat)}&subcat=${encodeURIComponent(sc)}`}
                  style={{ 
                    fontSize: '14px', 
                    color: subCatParam === sc ? 'var(--accent)' : 'var(--text-1)', 
                    textDecoration: 'none',
                    fontWeight: subCatParam === sc ? 700 : 400
                  }}
                >
                  {sc}
                </Link>
              ))}
            </div>
            
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', marginTop: '24px' }}>Brands</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {uniqueBrands.map(b => (
                <Link to={toggleBrand(b)} key={b} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text-1)' }}>
                  <input type="checkbox" checked={selectedBrands.includes(b)} readOnly /> {b}
                </Link>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', marginTop: '24px' }}>Price</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <Link to={getPriceUrl('', 1000)} style={{ color: priceParam === '-1000' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>Under ₹1,000</Link>
              <Link to={getPriceUrl(1000, 5000)} style={{ color: priceParam === '1000-5000' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>₹1,000 - ₹5,000</Link>
              <Link to={getPriceUrl(5000, 10000)} style={{ color: priceParam === '5000-10000' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>₹5,000 - ₹10,000</Link>
              <Link to={getPriceUrl(10000, 20000)} style={{ color: priceParam === '10000-20000' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>₹10,000 - ₹20,000</Link>
              <Link to={getPriceUrl(20000, 50000)} style={{ color: priceParam === '20000-50000' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>₹20,000 - ₹50,000</Link>
              <Link to={getPriceUrl(50000, '')} style={{ color: priceParam === '50000-' ? 'var(--accent)' : 'var(--text-1)', textDecoration: 'none' }}>Over ₹50,000</Link>
              {priceParam && (
                 <Link to={`/?cat=${encodeURIComponent(cat)}${subCatParam ? '&subcat='+encodeURIComponent(subCatParam) : ''}${brandsParam ? '&brands='+encodeURIComponent(brandsParam) : ''}`} style={{ marginTop: '8px', color: 'var(--rose)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Clear Price Filter</Link>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, padding: '24px 40px', background: 'var(--bg-base)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>
              {subCatParam || cat}
            </h2>
            <div style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '16px' }}>
              1-{displayProducts.length} of over {products.length} results for <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{subCatParam || cat}</span>
            </div>
            
            {displayProducts.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '60px' }}>No products found in this category.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                {displayProducts.map(p => renderProductCard(p))}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Standard search results
    return (
      <div className="home-container" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', color: 'var(--text-main)' }}>
          Results for "{q}"
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
          {products.map(p => renderProductCard(p))}
        </div>
      </div>
    )
  }

  // Dashboard grouped by inferred subcategories
  const subCategoriesMap = {}
  products.forEach(p => {
    const subCat = p.sub_category || 'Other'
    if (!subCategoriesMap[subCat]) subCategoriesMap[subCat] = []
    subCategoriesMap[subCat].push(p)
  })

  const cards = []
  Object.keys(subCategoriesMap).forEach(subCat => {
    cards.push({ title: `Explore ${subCat}`, queryName: subCat, items: subCategoriesMap[subCat].slice(0, 4) })
  })

  if (!isSearchOrCategory && cards.length === 0) {
    return (
      <div className="home-container" style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏪</div>
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.5px' }}>Welcome to NexusMart!</h1>
        <p style={{ fontSize: '18px', color: 'var(--text-2)', maxWidth: '600px', lineHeight: '1.6', marginBottom: '40px' }}>
          Our shelves are currently empty as sellers are preparing their amazing products. Please check back later to start shopping!
        </p>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="amz-card-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="amz-card">
            <h3>{card.title}</h3>
            {card.items.length > 0 ? (
              <div className="amz-card-inner-grid">
                {card.items.map(p => {
                  const cover = p.emoji?.startsWith('data:image') ? p.emoji.split('||')[0] : null
                  return (
                    <Link to={`/product/${p.id}`} key={p.id} className="amz-mini-prod">
                      <div className="amz-mini-img">
                        {cover ? <img src={cover} alt={p.name} /> : <span>{p.emoji || '📦'}</span>}
                      </div>
                      <span className="amz-mini-name">{p.name}</span>
                      <div className="amz-mini-price">{formatCurrency(p.price)}</div>
                    </Link>
                  )
                })}
              </div>
            ) : null}
            <Link to={`/?q=${encodeURIComponent(card.queryName)}`} className="amz-card-link">Shop now</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
