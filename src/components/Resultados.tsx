import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { LETRAS, nombreFormato, textoHorario, type Categoria, type Resultado } from '../lib/torneo'
import { esAmericano, evaluar, setsMax, textoResultado, type Partido, type ZonaResuelta } from '../lib/resultados'
import { Button } from './ui'

type Cambiar = (f: (c: Categoria) => Categoria) => void

/** Empate total (mismos partidos, sets y games): se ordena a mano según el sorteo */
function Desempate({ zi, ids, nombre, cambiar }: { zi: number; ids: string[]; nombre: (id: string | null) => string; cambiar: Cambiar }) {
  const [orden, setOrden] = useState(ids)
  useEffect(() => setOrden(ids), [ids.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  const mover = (i: number, d: -1 | 1) => setOrden((o) => { const c = [...o]; [c[i], c[i + d]] = [c[i + d], c[i]]; return c })
  return (
    <div className="m-3 space-y-2 rounded-lg bg-amber-50 p-3 text-sm ring-1 ring-amber-200">
      <p className="font-semibold text-amber-900">Empate total: mismos partidos ganados, diferencia de sets y de games. Ordenalos según el sorteo:</p>
      <ol className="space-y-1">
        {orden.map((id, i) => (
          <li key={id} className="flex items-center gap-2 rounded bg-white px-2 py-1">
            <span className="num w-4 font-bold text-noche/50">{i + 1}</span>
            <span className="flex-1">{nombre(id)}</span>
            <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" className="p-1 disabled:opacity-20"><ArrowUp className="h-4 w-4" /></button>
            <button onClick={() => mover(i, 1)} disabled={i === orden.length - 1} aria-label="Bajar" className="p-1 disabled:opacity-20"><ArrowDown className="h-4 w-4" /></button>
          </li>
        ))}
      </ol>
      <Button className="py-1.5" onClick={() => cambiar((c) => ({ ...c, desempates: { ...c.desempates, [String(zi)]: orden } }))}>Confirmar orden</Button>
    </div>
  )
}

// ------------------------------------------------------------------ carga de un partido

type Borrador = { sets: [string, string][]; wo: '' | 'a' | 'b' }
const borradorDe = (r: Resultado | undefined, n: number): Borrador => ({
  sets: Array.from({ length: n }, (_, i) => (r && !r.wo && r.sets[i] ? [String(r.sets[i][0]), String(r.sets[i][1])] : ['', ''])),
  wo: r?.wo ?? '',
})

/** `empezarEditando`: abre directo el formulario (cuadro del playoff). `onTerminar`: se llama al guardar o cancelar */
export function CargaPartido({ p, onGuardar, empezarEditando = false, onTerminar }: {
  p: Partido; onGuardar: (r: Resultado | null) => void; empezarEditando?: boolean; onTerminar?: () => void
}) {
  const [editando, setEditando] = useState(empezarEditando)
  const n = setsMax(p.formato)
  // un resultado de otras parejas (desactualizado) no se precarga
  const vigente = p.estado === 'jugado' || p.estado === 'invalido' ? p.resultado : undefined
  const [b, setB] = useState<Borrador>(() => borradorDe(empezarEditando ? vigente : p.resultado, n))
  useEffect(() => { if (!editando) setB(borradorDe(p.resultado, n)) }, [p.resultado, n, editando])

  // resultado armado con lo que se escribió (sets completos, en orden)
  let sets: [number, number][] = []
  for (const [x, y] of b.sets) { if (x === '' || y === '') break; sets.push([Number(x), Number(y)]) }
  // el 3er set solo se habilita (y se tiene en cuenta) si los 2 primeros quedaron 1-1
  const unoYuno = !esAmericano(p.formato) && sets.length >= 2 && (sets[0][0] > sets[0][1]) !== (sets[1][0] > sets[1][1])
  if (!esAmericano(p.formato) && !unoYuno) sets = sets.slice(0, 2)
  const borrador: Resultado = { a: p.a ?? '', b: p.b ?? '', sets: b.wo ? [] : sets, ...(b.wo ? { wo: b.wo } : {}) }
  const ev = evaluar(p.formato, borrador)

  const cerrar = () => { setEditando(false); onTerminar?.() }
  const guardar = () => { if (ev.ok && p.a && p.b) { onGuardar(borrador); cerrar() } }
  const set = (i: number, k: 0 | 1, v: string) => setB((x) => {
    const s = x.sets.map((q) => [...q] as [string, string])
    s[i][k] = v.replace(/\D/g, '').slice(0, 2)
    return { ...x, sets: s }
  })

  const ganador = p.estado === 'jugado' ? p.ganador : null
  const lado = (id: string | null, etiqueta: string) => (
    <span className={`min-w-0 truncate ${ganador && id === ganador ? 'font-bold text-noche' : ganador ? 'text-noche/55' : 'font-medium'} ${!id ? 'italic text-noche/45' : ''}`}>{etiqueta}</span>
  )

  return (
    <div className={`rounded-lg bg-white p-3 ring-1 ${p.estado === 'desactualizado' || p.estado === 'invalido' ? 'ring-amber-400' : 'ring-noche/10'}`}>
      <p className="mb-1.5 text-xs font-semibold text-cancha">{p.titulo}</p>

      {!editando ? (
        <div className="flex items-center gap-3">
          <div className="grid min-w-0 flex-1 gap-0.5 text-sm">
            {lado(p.a, p.etiquetaA)}
            {lado(p.b, p.etiquetaB)}
          </div>
          {p.estado === 'jugado' && p.resultado && (
            <div className="flex gap-1">
              {p.resultado.wo ? <span className="rounded bg-pelota px-2 py-1 text-xs font-bold">W.O.</span> :
                p.resultado.sets.map(([x, y], i) => (
                  <span key={i} className="num grid w-7 rounded bg-vidrio py-0.5 text-center text-sm leading-tight">
                    <span className={x > y ? 'font-bold' : 'text-noche/50'}>{x}</span>
                    <span className={y > x ? 'font-bold' : 'text-noche/50'}>{y}</span>
                  </span>
                ))}
            </div>
          )}
          {p.estado !== 'esperando' && p.a && p.b && (
            <button onClick={() => { setB(borradorDe(vigente, n)); setEditando(true) }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-cancha hover:bg-cancha-suave">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> {p.estado === 'pendiente' ? 'Cargar' : 'Editar'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid items-center gap-x-2 gap-y-1" style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${n}, 2.75rem)` }}>
            <span />
            {Array.from({ length: n }, (_, i) => (
              <span key={i} className="text-center text-[10px] font-semibold uppercase text-noche/50">
                {esAmericano(p.formato) ? 'Games' : i === 2 && p.formato === 'mejor_de_3_stb' ? 'S. TB 11' : `Set ${i + 1}`}
              </span>
            ))}
            {(['a', 'b'] as const).map((l, k) => (
              <Fila key={l} etiqueta={l === 'a' ? p.etiquetaA : p.etiquetaB}>
                {b.sets.map((s, i) => (
                  <input key={i} inputMode="numeric" value={s[k]} onChange={(e) => set(i, k as 0 | 1, e.target.value)} disabled={!!b.wo || (i === 2 && !unoYuno)}
                    aria-label={`${l === 'a' ? p.etiquetaA : p.etiquetaB}, ${i + 1}`}
                    className="num w-full rounded-md border-0 py-1.5 text-center text-base font-semibold ring-1 ring-inset ring-noche/20 focus:ring-2 focus:ring-cancha disabled:bg-vidrio disabled:text-noche/30" />
                ))}
              </Fila>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-noche/70">
            W.O.:
            <select value={b.wo} onChange={(e) => setB((x) => ({ ...x, wo: e.target.value as Borrador['wo'] }))} className="rounded-md border-0 py-1 text-xs ring-1 ring-inset ring-noche/15">
              <option value="">No</option>
              <option value="a">Gana {p.etiquetaA}</option>
              <option value="b">Gana {p.etiquetaB}</option>
            </select>
          </label>
          {!ev.ok && (sets.length > 0 || b.wo) && <p className="text-xs text-red">{ev.error}</p>}
          <p className="text-[11px] text-noche/50">{nombreFormato(p.formato)}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="py-1.5" onClick={guardar} disabled={!ev.ok}>Guardar</Button>
            <Button className="py-1.5" variante="secundario" onClick={cerrar}>Cancelar</Button>
            {p.resultado && (
              <Button className="ml-auto py-1.5" variante="peligro" onClick={() => { if (confirm('¿Borrar el resultado?')) { onGuardar(null); cerrar() } }}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Borrar
              </Button>
            )}
          </div>
        </div>
      )}

      {p.estado === 'desactualizado' && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <span>El resultado cargado ({textoResultado(p.resultado)}) era de otras parejas: cambió un resultado anterior o las zonas.</span>
          <button className="shrink-0 font-semibold underline" onClick={() => onGuardar(null)}>Quitar</button>
        </div>
      )}
      {p.estado === 'invalido' && !editando && (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          {textoResultado(p.resultado)} no es válido para {nombreFormato(p.formato).toLowerCase()}: {p.eval?.error} Editalo.
        </p>
      )}
    </div>
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <>
      <span className="truncate text-sm font-medium">{etiqueta}</span>
      {children}
    </>
  )
}

// ------------------------------------------------------------------ zona: tabla de posiciones + partidos

/** Tabla de la zona con sus partidos: ahí mismo se cargan los resultados */
export function ZonaResultados({ z, cat, cambiar, nombre, onResultado }: {
  z: ZonaResuelta; cat: Categoria; cambiar: Cambiar; nombre: (id: string | null) => string
  onResultado: (p: Partido, r: Resultado | null) => void
}) {
  const { tabla } = z
  const clasifican = (cat.zonas[z.zona]?.length ?? 0) === 4 ? 3 : 2
  const inicio = cat.horariosZona[`${z.zona}-1`]
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-noche/10">
      <header className="flex flex-wrap items-center justify-between gap-x-3 bg-noche px-3 py-2 text-white">
        <p className="font-display text-lg font-bold">Zona {LETRAS[z.zona]}</p>
        <span className="text-xs text-white/70">{tabla.completa ? (tabla.posiciones.every(Boolean) ? 'Terminada' : 'Falta definir empate') : 'En juego'}</span>
      </header>
      {(inicio?.fecha || inicio?.hora) && (
        <p className="bg-cancha-suave/60 px-3 py-1.5 text-xs font-semibold text-noche/80">Empieza: {textoHorario(inicio)}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-vidrio text-[11px] uppercase tracking-wide text-noche/60">
            <tr><th className="w-8 px-2 py-1.5 text-center">#</th><th className="px-2 py-1.5 text-left">Pareja</th><th className="px-2 text-center">PJ</th><th className="px-2 text-center">PG</th><th className="px-2 text-center">Sets</th><th className="px-2 text-center">Games</th></tr>
          </thead>
          <tbody className="divide-y divide-noche/5">
            {tabla.filas.map((f, i) => {
              const pos = tabla.posiciones[i] === f.id ? i + 1 : null
              const clasifica = pos !== null && pos <= clasifican
              return (
                <tr key={f.id} className={clasifica ? 'bg-pelota/15' : ''}>
                  <td className="num px-2 py-1.5 text-center font-display text-base font-bold text-noche/70">{pos ?? '–'}</td>
                  <td className="px-2 py-1.5 font-medium">{nombre(f.id)}</td>
                  <td className="num px-2 text-center">{f.pj}</td>
                  <td className="num px-2 text-center font-semibold">{f.pg}</td>
                  <td className="num px-2 text-center">{f.sf}-{f.sc}</td>
                  <td className="num px-2 text-center">{f.gf}-{f.gc}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {tabla.empatados.length > 0 && <Desempate zi={z.zona} ids={tabla.empatados} nombre={nombre} cambiar={cambiar} />}
      {tabla.desempateManual && (
        <p className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-noche/60">
          Empate total definido a mano (sorteo).
          <button className="font-semibold text-cancha" onClick={() => cambiar((c) => { const d = { ...c.desempates }; delete d[String(z.zona)]; return { ...c, desempates: d } })}>Cambiar</button>
        </p>
      )}
      <ul className="space-y-2 border-t border-noche/10 bg-vidrio/50 p-3">
        {z.partidos.map((p) => (
          <li key={p.key}><CargaPartido p={p} onGuardar={(r) => onResultado(p, r)} /></li>
        ))}
      </ul>
    </div>
  )
}

