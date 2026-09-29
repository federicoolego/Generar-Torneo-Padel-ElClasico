/**
 * Acceso con usuario y contraseña fijos.
 *
 * En el código NO está la contraseña: solo un hash PBKDF2-SHA256 (310.000 iteraciones, con sal).
 * Para cambiarla:  npm run hash-password -- ELCLASICO 'NuevaClave'  y reemplazá CREDENCIAL.
 *
 * Importante: como es una app sin servidor, esto es una barrera de acceso, no una protección
 * de datos. No hay datos que proteger: todo lo que se carga queda solo en el navegador de quien lo usa.
 */
export const CREDENCIAL = { sal: '6fd3503728b2fd6db6188842cfec294f', hash: '6dc5bda45680196a8eaab68e6d606831dcd7e04f916edf22e38ae31359752f7b', iteraciones: 310000 }

const CLAVE_SESION = 'clasico-generador:sesion'
const DURACION_MS = 12 * 60 * 60 * 1000   // 12 horas

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
const deHex = (h: string) => new Uint8Array(h.match(/../g)!.map((x) => parseInt(x, 16)))

async function derivar(usuario: string, pass: string): Promise<string> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${usuario.trim().toUpperCase()}\n${pass}`), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deHex(CREDENCIAL.sal), iterations: CREDENCIAL.iteraciones }, base, 256)
  return hex(bits)
}

/** Comparación en tiempo constante */
function iguales(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

export async function ingresar(usuario: string, pass: string): Promise<boolean> {
  const ok = iguales(await derivar(usuario, pass), CREDENCIAL.hash)
  if (ok) {
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify({ hasta: Date.now() + DURACION_MS, h: CREDENCIAL.hash.slice(0, 16) })) } catch { /* sin storage */ }
  }
  return ok
}

export function sesionActiva(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null') as { hasta: number; h: string } | null
    // si se cambia la contraseña (otro hash), las sesiones viejas dejan de valer
    return !!s && s.hasta > Date.now() && s.h === CREDENCIAL.hash.slice(0, 16)
  } catch {
    return false
  }
}

export function salir() {
  try { localStorage.removeItem(CLAVE_SESION) } catch { /* nada */ }
}
