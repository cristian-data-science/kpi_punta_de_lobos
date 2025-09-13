import { createClient } from '@supabase/supabase-js'

// Crear instancia singleton de Supabase para toda la aplicación
let supabaseInstance = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🔗 Creando instancia singleton de Supabase...')
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    console.log('✅ Cliente Supabase singleton creado')
  }
  return supabaseInstance
}

// Función para resetear la instancia (útil para testing)
export const resetSupabaseInstance = () => {
  supabaseInstance = null
}

export default getSupabaseClient
