import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import './App.css'
import AdminPage from './AdminPage'
import { getPublishedProducts, registerVisit } from './lib/catalog'
import { supabaseConfigured } from './lib/supabase'

type DisplayProduct = {
  id: string
  name: string
  category: string
  quality: string
  price: number
  stock: number
  image: string
  images: string[]
  description?: string
  tag?: string
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price)

function ProductDetail({
  product,
  isDark,
  onToggleTheme,
  onBack,
}: {
  product: DisplayProduct
  isDark: boolean
  onToggleTheme: () => void
  onBack: () => void
}) {
  const images = product.images.length > 0 ? product.images : [product.image]
  const [activeImage, setActiveImage] = useState(0)
  const imageIndex = (offset: number) =>
    (activeImage + offset + images.length) % images.length

  return (
    <div className={isDark ? 'app dark' : 'app'}>
      <div className="announcement">
        <Sparkles size={14} />
        <span>Prendas que valen la pena · American Premium</span>
      </div>
      <header className="site-header">
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={17} /> Volver a la colección
        </button>
        <a className="brand" href="#" aria-label="Bbros Store, inicio">
          <img src="/logoBbros.jpeg" alt="Bbros Store" />
        </a>
        <button
          className="icon-button"
          aria-label={isDark ? 'Usar tema claro' : 'Usar tema oscuro'}
          onClick={onToggleTheme}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>
      <main className="product-detail">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <img src={images[activeImage]} alt={`${product.name}, foto ${activeImage + 1}`} />
            {images.length > 1 && (
              <>
                <button className="gallery-arrow gallery-prev" onClick={() => setActiveImage(imageIndex(-1))} aria-label="Foto anterior">
                  <ChevronLeft size={21} />
                </button>
                <button className="gallery-arrow gallery-next" onClick={() => setActiveImage(imageIndex(1))} aria-label="Foto siguiente">
                  <ChevronRight size={21} />
                </button>
                <span className="gallery-counter">{activeImage + 1} / {images.length}</span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((image, index) => (
                <button
                  className={index === activeImage ? 'thumbnail active' : 'thumbnail'}
                  key={image}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category} / {product.quality}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <div className="detail-divider" />
          <p className="detail-description">
            {product.description || 'Una pieza seleccionada por Bbros Store, revisada y lista para una nueva historia.'}
          </p>
          <div className="detail-facts">
            <span>Calidad <strong>{product.quality}</strong></span>
            <span>Disponibilidad <strong>{product.stock === 1 ? 'Última unidad' : `${product.stock} unidades`}</strong></span>
          </div>
          <a className="primary-button detail-contact" href="https://www.instagram.com/bbros.store?xtok=MXRqbHA3b2Mxa2U2bw==" target="_blank" rel="noopener noreferrer">
            <Camera size={17} /> Consultar por Instagram <ArrowUpRight size={16} />
          </a>
          <p className="detail-note"><MessageCircle size={15} /> Escríbenos para coordinar precio y envío.</p>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [adminMode] = useState(() => window.location.hash === '#admin')
  const [isDark, setIsDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todo')
  const [catalogProducts, setCatalogProducts] = useState<DisplayProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    () => window.location.hash.startsWith('#producto=')
      ? window.location.hash.replace('#producto=', '')
      : null,
  )

  useEffect(() => {
    if (adminMode) return
    void registerVisit(window.location.pathname)
    if (!supabaseConfigured) return
    void getPublishedProducts()
      .then((remoteProducts) => {
        setCatalogProducts(
          remoteProducts.map((product) => ({
            id: product.id,
            name: product.name,
            category: product.category,
            quality: product.quality,
            price: product.price,
            stock: product.stock,
            image: product.images[0] || '',
            images: product.images,
            description: product.description,
            tag: product.tag,
          })),
        )
      })
      .catch((loadError: Error) => {
        console.warn('No se pudo cargar el catálogo de Supabase:', loadError.message)
      })
  }, [adminMode])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash
      setSelectedProductId(hash.startsWith('#producto=') ? hash.replace('#producto=', '') : null)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalogProducts.filter((product) => {
      const matchesCategory =
        category === 'Todo' || product.category === category
      const matchesSearch =
        !query ||
        `${product.name} ${product.category} ${product.quality}`
          .toLowerCase()
          .includes(query)
      return matchesCategory && matchesSearch
    })
  }, [catalogProducts, category, search])

  if (adminMode) {
    return (
      <AdminPage
        onBack={() => {
          window.location.hash = ''
          window.location.reload()
        }}
      />
    )
  }

  const selectedProduct = catalogProducts.find((product) => product.id === selectedProductId)

  if (selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        isDark={isDark}
        onToggleTheme={() => setIsDark((value) => !value)}
        onBack={() => { window.location.hash = 'coleccion' }}
      />
    )
  }

  return (
    <div className={isDark ? 'app dark' : 'app'}>
      <div className="announcement">
        <Sparkles size={14} />
        <span>Prendas que valen la pena · American Premium</span>
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="Bbros Store, inicio">
          <img src="/logoBbros.jpeg" alt="Bbros Store" />
        </a>
        <nav className={menuOpen ? 'main-nav open' : 'main-nav'}>
          <a href="#coleccion" onClick={() => setMenuOpen(false)}>
            Colección
          </a>
          <a href="#historia" onClick={() => setMenuOpen(false)}>
            Nuestra selección
          </a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>
            Contacto
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label={isDark ? 'Usar tema claro' : 'Usar tema oscuro'}
            onClick={() => setIsDark((value) => !value)}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <a className="bag-button" href="#coleccion" aria-label="Ver colección">
            <ShoppingBag size={19} />
            <span>Ver prendas</span>
          </a>
          <button
            className="menu-button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Bbros store / Santiago, Chile</p>
            <h1>
              No vendemos
              <br />
              <em>cualquier ropa.</em>
            </h1>
            <p className="hero-description">
              Vendemos prendas que valen la pena. Una selección al callo de
              ropa americana premium para usarla a tu manera.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#coleccion">
                Explorar colección <ArrowUpRight size={17} />
              </a>
              <a className="text-link" href="#historia">
                Conoce Bbros <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="shipping-note">
              <span className="status-dot" />
              Envíos a la RM, V y VI región
            </div>
          </div>
          <div className="hero-art" aria-label="Selección de ropa americana">
            <div className="art-glow" />
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85"
              alt="Prendas seleccionadas de Bbros Store"
            />
            <div className="hero-stamp">
              <span>EST.</span>
              <strong>BB</strong>
              <span>PREMIUM GOODS</span>
            </div>
            <p className="image-caption">01 — Autumn selection</p>
          </div>
        </section>

        <section className="collection section" id="coleccion">
          <div className="section-heading">
            <div>
              <p className="eyebrow">La selección actual</p>
              <h2>Encuentra la tuya.</h2>
            </div>
            <p className="section-intro">
              Piezas únicas, revisadas una a una. Cuando se va, se va.
            </p>
          </div>
          <div className="catalog-tools">
            <div className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Buscar prendas..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="category-select">
              <select
                aria-label="Filtrar por categoría"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {['Todo', ...new Set(catalogProducts.map((product) => product.category))].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  <a href={`#producto=${product.id}`} aria-label={`Ver ${product.name}`}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </a>
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                  <span className="stock-label">
                    {product.stock === 1 ? 'Última unidad' : `${product.stock} disponibles`}
                  </span>
                </div>
                <div className="product-info">
                  <div>
                    <p className="product-category">{product.category}</p>
                    <h3><a href={`#producto=${product.id}`}>{product.name}</a></h3>
                  </div>
                  <div className="product-meta">
                    <span className="quality">{product.quality}</span>
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleProducts.length === 0 && (
            <div className="empty-state">
              {search || category !== 'Todo'
                ? 'No encontramos prendas con esa búsqueda.'
                : 'Próximamente nuevas prendas. Vuelve a visitarnos.'}
            </div>
          )}
        </section>

        <section className="manifesto section" id="historia">
          <div className="manifesto-mark">“</div>
          <div>
            <p className="eyebrow">Nuestro criterio</p>
            <h2>Menos ruido.<br /><em>Más identidad.</em></h2>
            <p>
              Buscamos prendas con historia, buenos materiales y ese detalle
              que las hace especiales. No se trata de tener más. Se trata de
              elegir mejor.
            </p>
          </div>
          <div className="manifesto-side">
            <span>American</span>
            <span>Premium</span>
            <span>Since 2026</span>
          </div>
        </section>
      </main>

      <footer className="footer" id="contacto">
        <div className="footer-brand">
          <img src="/logoBbros.jpeg" alt="Bbros Store" />
          <p>Prendas que valen la pena.</p>
        </div>
        <div className="footer-links">
          <div>
            <p className="footer-label">Síguenos</p>
            <a className="pending-link" href="https://www.instagram.com/bbros.store?xtok=MXRqbHA3b2Mxa2U2bw==" target="_blank" rel="noopener noreferrer"><Camera size={16} /> Instagram </a>
          </div>
          <div>
            <p className="footer-label">¿Te gustó algo?</p>
            <span className="pending-link">WhatsApp próximamente <ArrowUpRight size={16} /></span>
          </div>
        </div>
        <p className="copyright">© 2026 Bbros Store · Santiago, Chile</p>
        <p className="copyright">Desarrollado por Abraham Barrera</p>
      </footer>
    </div>
  )
}

export default App
