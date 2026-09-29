import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { SEDES, sumarMinutos, type Horario } from '../lib/torneo'
import { Button, Input, Modal, Select } from './ui'

/** Día, hora y complejo de un partido */
export function EditorHorario({ valor, onChange, requerido = false }: { valor?: Horario; onChange: (h: Horario) => void; requerido?: boolean }) {
  const h = { fecha: valor?.fecha ?? '', hora: valor?.hora ?? '', sede: valor?.sede ?? '' }
  const falta = requerido && (!h.fecha || !h.hora || !h.sede)
  return (
    <div className="grid grid-cols-[1.3fr_1fr_1.3fr] gap-2 sm:max-w-lg">
      <Input type="date" value={h.fecha} onChange={(e) => onChange({ ...h, fecha: e.target.value })} aria-label="Día"
        className={`py-1.5 ${falta && !h.fecha ? 'ring-amber-400' : ''}`} />
      <Input type="time" value={h.hora} onChange={(e) => onChange({ ...h, hora: e.target.value })} aria-label="Hora"
        className={`py-1.5 ${falta && !h.hora ? 'ring-amber-400' : ''}`} />
      <Select value={h.sede} onChange={(e) => onChange({ ...h, sede: e.target.value })} aria-label="Complejo"
        className={`py-1.5 ${falta && !h.sede ? 'ring-amber-400' : ''}`}>
        <option value="">Complejo…</option>
        {SEDES.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
    </div>
  )
}

/**
 * Completa horarios en orden: los partidos se reparten en turnos de N partidos a la vez,
 * cada turno dura M minutos.
 */
export function CompletarHorarios({ grupos, actuales, onAplicar, etiqueta = 'Completar automático', fechaInicial }: {
  /** partidos agrupados por ronda: cada grupo arranca en un turno nuevo (una ronda después de la otra) */
  grupos: string[][]
  actuales: Record<string, Horario>
  onAplicar: (nuevos: Record<string, Horario>) => void
  etiqueta?: string
  /** día con el que arranca (por defecto, el inicio del torneo) */
  fechaInicial?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const hoy = new Date().toISOString().slice(0, 10)
  const [fecha, setFecha] = useState(fechaInicial || hoy)
  const [hora, setHora] = useState('18:00')
  const [min, setMin] = useState(75)
  const [canchas, setCanchas] = useState(3)
  const [soloVacios, setSoloVacios] = useState(true)
  /** '' = repartir entre los dos complejos */
  const [sede, setSede] = useState('')

  function aplicar() {
    const out: Record<string, Horario> = { ...actuales }
    let turno = 0
    for (const g of grupos) {
      let k = 0
      for (const c of g) {
        if (soloVacios && actuales[c]?.fecha && actuales[c]?.hora && actuales[c]?.sede) continue
        const t = sumarMinutos(fecha, hora, (turno + Math.floor(k / canchas)) * min)
        out[c] = { fecha: t.fecha, hora: t.hora, sede: sede || SEDES[k % SEDES.length] }
        k++
      }
      turno += Math.ceil(k / canchas)
    }
    onAplicar(out)
    setAbierto(false)
  }

  return (
    <>
      <Button variante="secundario" onClick={() => setAbierto(true)} disabled={!grupos.flat().length}><Wand2 className="h-4 w-4" aria-hidden /> {etiqueta}</Button>
      <Modal abierto={abierto} titulo="Completar horarios" onCerrar={() => setAbierto(false)}>
        <div className="space-y-3 text-sm">
          <p className="text-noche/70">Los partidos se asignan en orden, en turnos: tantos partidos a la vez como elijas, y cada ronda arranca cuando termina la anterior. Después podés corregir cualquiera a mano.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">Primer día<Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1" /></label>
            <label className="block">Hora de inicio<Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-1" /></label>
            <label className="block">Minutos por turno<Input type="number" min={20} max={180} value={min} onChange={(e) => setMin(Number(e.target.value) || 75)} className="mt-1" /></label>
            <label className="block">Partidos a la vez
              <Select value={canchas} onChange={(e) => setCanchas(Number(e.target.value))} className="mt-1">
                {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </label>
          </div>
          <label className="block">Complejo
            <Select value={sede} onChange={(e) => setSede(e.target.value)} className="mt-1">
              <option value="">Repartir entre los dos (alternando)</option>
              {SEDES.map((s) => <option key={s} value={s}>Todos en {s}</option>)}
            </Select>
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={soloVacios} onChange={(e) => setSoloVacios(e.target.checked)} /> Completar solo los que no tienen horario</label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button onClick={aplicar}>Aplicar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
