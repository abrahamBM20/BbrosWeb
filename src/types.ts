export type Product = {
  id: string
  name: string
  description?: string
  category: string
  quality: 'Premium' | 'Grade A' | 'Grade B'
  price: number
  stock: number
  images: string[]
  tag?: string
  published: boolean
  createdAt: string
}

export type VisitEvent = {
  id: string
  path: string
  referrer?: string
  createdAt: string
}
