import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowLeft,
  Check,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { supabase, supabaseConfigured } from './lib/supabase'
import { mapProduct } from './lib/catalog'
import type { Product } from './types'

type ProductForm = {
  name: string
  description: string
  category: string
  quality: Product['quality']
  price: string
  stock: string
  tag: string
  image: string
  published: boolean
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  category: 'Poleras',
  quality: 'Premium',
  price: '',
  stock: '1',
  tag: '',
  image: '',
  published: true,
}

const formFromProduct = (product: Product): ProductForm => ({
  name: product.name,
  description: product.description || '',
  category: product.category,
  quality: product.quality,
  price: String(product.price),
  stock: String(product.stock),
  tag: product.tag || '',
  image: product.images[0] || '',
  published: product.published,
})

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [visitCount, setVisitCount] = useState<number | null>(null)

  async function loadAdminData() {
    if (!supabase) return
    const { data, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (productsError) {
      setError(productsError.message)
      return
    }
    setProducts((data as Parameters<typeof mapProduct>[0][]).map(mapProduct))
    const { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
    setVisitCount(count ?? 0)
  }

  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null)
      if (data.session) void loadAdminData()
    })
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSessionEmail(currentSession?.user.email ?? null)
      if (currentSession) void loadAdminData()
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!supabase) return
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (authError) setError(authError.message)
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setSaving(true)
    setError('')
    setMessage('')
    let imageUrl = form.image.trim()
    if (imageFile) {
      const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type })
      if (uploadError) {
        setSaving(false)
        setError(uploadError.message)
        return
      }
      const { data: publicUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      imageUrl = publicUrl.publicUrl
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      quality: form.quality,
      price: Number(form.price),
      stock: Number(form.stock),
      tag: form.tag.trim(),
      images: imageUrl ? [imageUrl] : [],
      published: form.published,
      updated_at: new Date().toISOString(),
    }
    const query = editingId
      ? supabase.from('products').update(payload).eq('id', editingId)
      : supabase.from('products').insert(payload)
    const { error: saveError } = await query
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setMessage(editingId ? 'Prenda actualizada.' : 'Prenda creada.')
    setForm(emptyForm)
    setImageFile(null)
    setEditingId(null)
    await loadAdminData()
  }

  async function deleteProduct(product: Product) {
    if (!supabase || !window.confirm(`¿Eliminar "${product.name}"?`)) return
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) setError(deleteError.message)
    else {
      setMessage('Prenda eliminada.')
      await loadAdminData()
    }
  }

  if (!supabaseConfigured || !supabase) {
    return (
      <div className="admin-shell">
        <button className="admin-back" onClick={onBack}><ArrowLeft size={16} /> Volver a la tienda</button>
        <div className="admin-card setup-card">
          <img src="/logoBbros.jpeg" alt="Bbros Store" />
          <h1>Conecta Supabase</h1>
          <p>Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.local.</p>
          <code>cp .env.example .env.local</code>
        </div>
      </div>
    )
  }

  if (!sessionEmail) {
    return (
      <div className="admin-shell">
        <button className="admin-back" onClick={onBack}><ArrowLeft size={16} /> Volver a la tienda</button>
        <form className="admin-card login-card" onSubmit={signIn}>
          <img src="/logoBbros.jpeg" alt="Bbros Store" />
          <p className="eyebrow">Acceso privado</p>
          <h1>Panel admin</h1>
          <p>Gestiona tu selección, stock y publicaciones.</p>
          <label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} /></label>
          {error && <p className="admin-error">{error}</p>}
          <button className="primary-button admin-submit" type="submit">Entrar <ArrowLeft size={16} className="rotate-180" /></button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <button className="admin-back" onClick={onBack}><ArrowLeft size={16} /> Tienda</button>
        <div className="admin-title"><img src="/logoBbros.jpeg" alt="Bbros Store" /><span>Administración</span></div>
        <button className="admin-logout" onClick={() => void supabase?.auth.signOut()}><LogOut size={16} /> Salir</button>
      </header>
      <main className="admin-main">
        <div className="admin-stats">
          <div><Users size={20} /><span>Visitas registradas<strong>{visitCount ?? '—'}</strong></span></div>
          <div><ImagePlus size={20} /><span>Prendas<strong>{products.length}</strong></span></div>
        </div>
        <div className="admin-layout">
          <form className="admin-card product-form" onSubmit={saveProduct}>
            <div className="form-heading"><div><p className="eyebrow">{editingId ? 'Editar prenda' : 'Nueva publicación'}</p><h2>{editingId ? 'Actualiza los detalles' : 'Sube una prenda'}</h2></div>{editingId && <button type="button" className="text-link" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancelar</button>}</div>
            <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} /></label>
            <div className="form-row"><label>Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{['Poleras', 'Pantalones', 'Chaquetas', 'Polerones', 'Accesorios'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Calidad<select value={form.quality} onChange={(event) => setForm({ ...form, quality: event.target.value as Product['quality'] })}><option>Premium</option><option>Grade A</option><option>Grade B</option></select></label></div>
            <div className="form-row"><label>Precio CLP<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label><label>Stock<input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label></div>
            <label>Foto de la prenda <span className="label-hint">(JPG, PNG o WebP)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label>
            <label>O usa una URL de imagen <input type="url" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." /></label>
            <label>Etiqueta<input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} placeholder="Ej: New drop" /></label>
            <label className="checkbox-label"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Visible en la tienda</label>
            {error && <p className="admin-error">{error}</p>}{message && <p className="admin-success"><Check size={15} /> {message}</p>}
            <button className="primary-button admin-submit" type="submit" disabled={saving}>{saving ? 'Guardando...' : <><Upload size={16} /> {editingId ? 'Guardar cambios' : 'Publicar prenda'}</>}</button>
          </form>
          <section className="admin-card product-list"><div className="form-heading"><div><p className="eyebrow">Inventario</p><h2>Tus prendas</h2></div><button className="primary-button small-button" onClick={() => { setEditingId(null); setForm(emptyForm) }}><Plus size={16} /> Nueva</button></div>{products.length === 0 ? <p className="empty-admin">Aún no tienes productos.</p> : products.map((product) => <article className="admin-product" key={product.id}><div className="admin-product-image">{product.images[0] ? <img src={product.images[0]} alt="" /> : <ImagePlus size={18} />}</div><div className="admin-product-copy"><strong>{product.name}</strong><span>{product.category} · {product.published ? 'Publicado' : 'Borrador'} · Stock {product.stock}</span><b>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(product.price)}</b></div><div className="admin-product-actions"><button aria-label={`Editar ${product.name}`} onClick={() => { setEditingId(product.id); setForm(formFromProduct(product)) }}><Pencil size={16} /></button><button aria-label={`Eliminar ${product.name}`} onClick={() => void deleteProduct(product)}><Trash2 size={16} /></button></div></article>)}</section>
        </div>
      </main>
    </div>
  )
}
