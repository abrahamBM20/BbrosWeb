import { supabase } from './supabase'
import type { Product } from '../types'

type ProductRow = {
  id: string
  name: string
  description: string
  category: string
  quality: Product['quality']
  price: number
  stock: number
  images: string[]
  tag: string
  published: boolean
  created_at: string
  updated_at: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'> & {
  createdAt?: string
}

const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  quality: row.quality,
  price: row.price,
  stock: row.stock,
  images: row.images,
  tag: row.tag || undefined,
  published: row.published,
  createdAt: row.created_at,
})

export async function getPublishedProducts(): Promise<Product[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ProductRow[]).map(mapProduct)
}

export async function registerVisit(path: string) {
  if (!supabase) return
  const { error } = await supabase.from('visits').insert({
    path,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  })
  if (error) console.warn('No se pudo registrar la visita:', error.message)
}

export { mapProduct }
