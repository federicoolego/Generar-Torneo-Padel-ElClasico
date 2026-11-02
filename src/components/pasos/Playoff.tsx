import { useMemo, useState } from 'react'
import { Pencil, Sparkles, Trophy } from 'lucide-react'
import {
  clasificados, cuadroAutomatico, erroresCuadro, nombreFase, nombreInstancia, tamCuadro, type Categoria, type Resultado, type Slot,
} from '../../lib/torneo'
import { playoffIniciado, resolverTorneo, type Partido } from '../../lib/resultados'
import { Alerta, Button, Card, Modal, Select } from '../ui'
import { SelectorFormato } from '../Formato'
import { CargaPartido } from '../Resultados'

type Cambiar = (f: (c: Categoria) => Categoria) => void
type Props = { cat: Categoria; cambiar: Cambiar }
/** Lado sin elegir (se guarda así porque en JSON no existe undefined) */
const SIN: Slot = { zona: -1, pos: -1 }
/** '' = sin elegir · 'libre' · 'zona:pos' */
const aValor = (s: Slot | null | undefined) => (s === undefined || (s && s.zona < 0) ? '' : s === null ? 'libre' : `${s.zona}:${s.pos}`)
const deValor = (v: string): Slot | null =>
  v === '' ? SIN : v === 'libre' ? null : { zona: Number(v.split(':')[0]), pos: Number(v.split(':')[1]) }

export default function PasoPlayoff({ cat, cambiar }: Props) {
  const cl = clasificados(cat.zonas)
  const b = tamCuadro(cl.length)
  const vacio: (Slot | null)[][] = Array.from({ length: b / 2 }, () => [SIN, SIN])
  const cruces: (Slot | null)[][] = cat.cuadro && cat.cuadro.length === b / 2 ? cat.cuadro : vacio
  const errores = erroresCuadro(cruces, cat.zonas)
  const valido = errores.length === 0 && !!cat.cuadro
  // con algún resultado de playoff cargado, los cruces quedan fijos
  const fijo = playoffIniciado(cat)
  const usados = new Set(cruces.flat().filter((s): s is Slot => !!s && s.zona >= 0).map((s) => `${s.zona}:${s.pos}`))
  const res = useMemo(() => resolverTorneo(cat), [cat])

  const set = (i: number, k: 0 | 1, v: string) =>
    cambiar((c) => {
      const base = (c.cuadro && c.cuadro.length === b / 2 ? c.cuadro : vacio).map((x) => [...x])
      base[i][k] = deValor(v)
      return { ...c, cuadro: base }
    })
  const setResultado = (p: Partido, r: Resultado | null) =>
    cambiar((c) => {
      const nuevo = { ...c.resultadosPlayoff }
      if (r) nuevo[p.key] = r
      else delete nuevo[p.key]
      return { ...c, resultadosPlayoff: nuevo }
    })
  const nombre = (id: string | null) => (id ? cat.parejas.find((p) => p.id === id)?.nombre ?? '—' : '—')

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-xl text-sm text-noche/75">
            Cruces de {nombreFase(b).toLowerCase()} con las posiciones de zona. Con {cl.length} clasificados
            {b - cl.length > 0 ? `, ${b - cl.length} pasan directo a la ronda siguiente (lado “Libre”).` : ', no hay lados libres.'}
            {' '}El armado automático separa lo más posible a las parejas de una misma zona: si se tienen que cruzar, que sea lo más tarde (semifinal o final).
          </p>
          <Button disabled={fijo} onClick={() => (!cat.cuadro || confirm('Se reemplazan los cruces actuales. ¿Continuar?')) && cambiar((c) => ({ ...c, cuadro: cuadroAutomatico(c.zonas) }))}>
            <Sparkles className="h-4 w-4" aria-hidden /> Armar automático
          </Button>
        </div>
        {fijo && <div className="mt-3"><Alerta tipo="aviso">Ya hay resultados de playoff: los cruces no se pueden modificar. Para cambiarlos, primero borrá los resultados del cuadro.</Alerta></div>}
        {errores.length > 0 && <div className="mt-3"><Alerta tipo="aviso">{cat.cuadro ? errores.join(' ') : 'Tocá “Armar automático” o elegí los cruces a mano.'}</Alerta></div>}

        <details className="mt-4 rounded-lg ring-1 ring-noche/10" open={!valido}>
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-cancha"><Pencil className="h-4 w-4" aria-hidden /> Ajustar cruces a mano</summary>
          <ol className="grid gap-2 p-3 pt-1 md:grid-cols-2">
            {cruces.map((c, i) => (
              <li key={i} className="rounded-lg bg-vidrio p-3">
                <p className="mb-1.5 text-xs font-semibold text-noche/60">{b === 2 ? 'Final' : `${nombreFase(b)} ${i + 1}`}</p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  {([0, 1] as const).map((k) => (
                    <div key={k} className={k === 1 ? 'col-start-3' : ''}>
                      <Select value={aValor(c[k])} onChange={(e) => set(i, k, e.target.value)} disabled={fijo} className="py-1.5 text-sm" aria-label={`Partido ${i + 1}, lado ${k + 1}`}>
                        <option value="">Elegir…</option>
                        {cl.map((x) => <option key={x.key} value={x.key} disabled={usados.has(x.key) && aValor(c[k]) !== x.key}>{x.label}</option>)}
                        <option value="libre">Libre (pasa directo)</option>
                      </Select>
                    </div>
                  ))}
                  <span className="col-start-2 row-start-1 text-xs font-semibold text-noche/45">vs</span>
                </div>
              </li>
            ))}
          </ol>
        </details>
      </Card>

      {valido && res.playoff && (
        <>
          {res.campeon && (
            <div className="flex items-center gap-3 rounded-xl bg-noche p-4 text-white">
              <Trophy className="h-8 w-8 shrink-0 text-pelota" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Campeones</p>
                <p className="font-display text-2xl font-bold leading-tight">{nombre(res.campeon)}</p>
              </div>
            </div>
          )}
          <Cuadro cat={cat} cambiar={cambiar} rondas={res.playoff} onResultado={setResultado} />
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ cuadro (llaves)

/** Cuadro en llaves: cada columna es una ronda y las líneas unen cada partido con el siguiente. Tocar un partido abre la carga del resultado */
function Cuadro({ cat, cambiar, rondas, onResultado }: { cat: Categoria; cambiar: Cambiar; rondas: Partido[][]; onResultado: (p: Partido, r: Resultado | null) => void }) {
  const [abierto, setAbierto] = useState<string | null>(null)
  // si la primera ronda son todos "libres", el cuadro arranca en la siguiente
  const desde = rondas[0].every((p) => p.bye) ? 1 : 0
  const visibles = rondas.slice(desde)
  const modal = visibles.flat().find((p) => p.key === abierto)
  const R = visibles.length
  const jugados = visibles.flat().filter((p) => !p.bye && p.estado === 'jugado').length
  const total = visibles.flat().filter((p) => !p.bye).length

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-semibold">Cuadro</h3>
          <p className="text-sm text-noche/65">
            <strong className="num">{jugados}</strong> de <span className="num">{total}</span> partidos con resultado. Tocá un partido para cargarlo o corregirlo: los cruces se completan solos.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch">
          {visibles.map((ronda, r) => {
            const ultima = r === R - 1
            const instancia = ronda[0].instancia
            const grupos: Partido[][] = []
            if (ultima) grupos.push(ronda)
            else for (let i = 0; i < ronda.length; i += 2) grupos.push(ronda.slice(i, i + 2))
            return (
              <div key={r} className="flex w-56 flex-col">
                <div className="mb-2 flex flex-col gap-1 pr-8">
                  <p className="font-display text-lg font-bold">{nombreInstancia(instancia)}</p>
                  <SelectorFormato cat={cat} cambiar={cambiar} instancia={instancia} corto className="w-full py-1 text-xs" />
                </div>
                <div className="flex flex-1 flex-col">
                  {grupos.map((g, gi) => (
                    <div key={gi} className="relative flex flex-1 flex-col">
                      {g.map((p) => (
                        <div key={p.key} className={`relative flex flex-1 items-center py-2 ${r === 0 ? 'min-h-[8rem]' : ''}`}>
                          <div className={`w-full ${ultima ? '' : 'mr-8'}`}><Cruce p={p} onAbrir={() => setAbierto(p.key)} /></div>
                          {!ultima && <span aria-hidden className="absolute right-4 top-1/2 h-px w-4 bg-noche/30" />}
                        </div>
                      ))}
                      {!ultima && (
                        <>
                          <span aria-hidden className="absolute bottom-1/4 right-4 top-1/4 w-px bg-noche/30" />
                          <span aria-hidden className="absolute right-0 top-1/2 h-px w-4 bg-noche/30" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal abierto={!!modal} titulo={modal ? `${nombreInstancia(modal.instancia)} · ${modal.titulo}` : ''} onCerrar={() => setAbierto(null)}>
        {modal && <CargaPartido key={modal.key} p={modal} empezarEditando onGuardar={(r) => onResultado(modal, r)} onTerminar={() => setAbierto(null)} />}
      </Modal>
    </Card>
  )
}

/** Un partido del cuadro: las dos parejas (o de dónde vienen), el marcador y el ganador resaltado */
function Cruce({ p, onAbrir }: { p: Partido; onAbrir: () => void }) {
  if (p.bye) {
    const pasa = p.a ? p.etiquetaA : p.b ? p.etiquetaB : p.etiquetaA === 'Libre' ? p.etiquetaB : p.etiquetaA
    return (
      <div className="rounded-lg border border-dashed border-noche/25 bg-vidrio/60 px-3 py-2">
        <p className="line-clamp-2 break-words text-sm font-semibold leading-tight" title={pasa}>{pasa}</p>
        <p className="text-[11px] text-noche/55">Pasa directo</p>
      </div>
    )
  }
  const jugado = p.estado === 'jugado' && !!p.resultado
  const sets = jugado && !p.resultado!.wo ? p.resultado!.sets : null
  const wo = jugado ? p.resultado!.wo : undefined
  const editable = !!p.a && !!p.b && p.estado !== 'esperando'
  const aviso = p.estado === 'desactualizado' || p.estado === 'invalido'

  const fila = (k: 0 | 1) => {
    const id = k === 0 ? p.a : p.b
    const texto = k === 0 ? p.etiquetaA : p.etiquetaB
    const gano = jugado && id === p.ganador
    return (
      <div key={k} className={`flex items-center gap-2 border-l-4 px-2 py-1.5 ${gano ? 'border-pelota' : 'border-transparent'}`}>
        <span className={`min-w-0 flex-1 line-clamp-2 break-words text-[13px] leading-tight ${!id ? 'italic text-noche/45' : gano ? 'font-bold' : jugado ? 'text-noche/55' : 'font-medium'}`} title={texto}>{texto}</span>
        {sets && (
          <span className="flex shrink-0 gap-1">
            {sets.map((sv, i) => (
              <span key={i} className={`num w-5 text-center text-[13px] ${sv[k] > sv[1 - k] ? 'font-bold text-noche' : 'text-noche/50'}`}>{sv[k]}</span>
            ))}
          </span>
        )}
        {wo && gano && <span className="shrink-0 rounded bg-pelota px-1 text-[10px] font-bold">W.O.</span>}
      </div>
    )
  }

  const contenido = (
    <>
      <p className="border-b border-noche/10 bg-vidrio px-2 py-0.5 text-[11px] font-semibold text-cancha">{p.titulo}{aviso ? ' · revisar' : ''}</p>
      {fila(0)}
      <div className="border-t border-noche/10" />
      {fila(1)}
    </>
  )
  const clases = `block w-full overflow-hidden rounded-lg bg-white text-left ring-1 ${aviso ? 'ring-amber-400' : p.instancia === 'final' ? 'ring-2 ring-pelota' : 'ring-noche/15'}`
  return editable ? (
    <button type="button" onClick={onAbrir} className={`${clases} transition hover:ring-2 hover:ring-cancha focus-visible:outline focus-visible:outline-2 focus-visible:outline-cancha`}
      aria-label={`${p.titulo}: ${p.etiquetaA} vs ${p.etiquetaB}. ${jugado ? 'Editar resultado' : 'Cargar resultado'}`}>
      {contenido}
    </button>
  ) : (
    <div className={`${clases} opacity-80`}>{contenido}</div>
  )
}
