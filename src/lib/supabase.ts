import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false si faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY */
export const configurado = !!url && !!key

export const supabase = createClient(url || 'http://localhost', key || 'sin-configurar', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // clave propia: en federicoolego.github.io conviven varias apps (y el Gestor de Torneos puede usar el mismo proyecto)
    storageKey: 'clasico-generador:auth',
  },
})

/** Nombres de tablas (todas con prefijo torneos_elclasico_) */
export const T = {
  torneos: 'torneos_elclasico_torneos',
  instancias: 'torneos_elclasico_instancias',
  parejas: 'torneos_elclasico_parejas',
  partidos: 'torneos_elclasico_partidos',
} as const
