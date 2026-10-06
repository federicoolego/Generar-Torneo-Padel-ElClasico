/**
 * Acceso con Supabase Auth: un usuario fijo (ELCLASICO) creado en Authentication → Users.
 * El usuario se traduce a email: ELCLASICO → elclasico@generador.elclasico.com.ar
 * Además del login, el email tiene que estar en la tabla torneos_elclasico_usuarios (RLS).
 */
import { supabase } from './supabase'

export const DOMINIO = 'generador.elclasico.com.ar'
const aEmail = (u: string) => {
  const x = u.trim().toLowerCase()
  return x.includes('@') ? x : `${x}@${DOMINIO}`
}

export async function ingresar(usuario: string, pass: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email: aEmail(usuario), password: pass })
  if (error) return false
  // que además esté habilitado para estas tablas
  const { data, error: e2 } = await supabase.rpc('torneos_elclasico_es_usuario')
  if (e2 || data !== true) {
    await supabase.auth.signOut()
    return false
  }
  return true
}

export async function sesionActiva(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

/** Avisa cuando se cierra la sesión (vencida o desde otra pestaña). Devuelve la función para dejar de escuchar */
export function alCerrarSesion(cb: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) cb() })
  return () => data.subscription.unsubscribe()
}

export async function salir() {
  await supabase.auth.signOut()
}
