import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseUrl = rawSupabaseUrl?.replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = supabaseConfigured
  ? createClient(
      supabaseUrl!,
      supabaseKey!,
    )
  : null
