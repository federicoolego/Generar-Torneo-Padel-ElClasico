import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { SEDES, SEDE_DEFECTO, enPasado, hoyLocal, rangoFechas, textoHorario, type Horario } from '../lib/torneo'
import { Input, Select } from './ui'

/** Días en que se puede programar un partido: del inicio del torneo (o de hoy, si ya empezó) al fin */
export function rangoProgramable(desde?: string, hasta?: string) {
  const hoy = hoyLocal()
  return { min: desde && desde > hoy ? desde : hoy, max: hasta || undefined }
}

/** ¿El día cae fuera de las fechas del torneo? */
export const fueraDelTorneo = (fecha: string, desde?: string, hasta?: string) =>
  !!fecha && ((!!desde && fecha < desde) || (!!hasta && fecha > hasta))

/** Error al cambiar el día u hora de un partido: tiene que estar dentro del torneo y en el futuro */
export function errorHorario(antes: Horario, nuevo: Horario, desde?: string, hasta?: string): string {
  const cambio = nuevo.fecha !== (antes.fecha ?? '') || nuevo.hora !== (antes.hora ?? '')
  if (!cambio || !nuevo.fecha) return ''
  if (fueraDelTorneo(nuevo.fecha, desde, hasta)) {
    return desde && hasta ? `El día tiene que estar dentro del torneo (${rangoFechas(desde, hasta)}).` : 'El día tiene que estar dentro de las fechas del torneo.'
  }
  if (enPasado(nuevo.fecha, nuevo.hora || undefined)) {
    return nuevo.hora ? 'El día y la hora tienen que ser futuros.' : 'El día no puede ser anterior a hoy.'
  }
  return ''
}

/**
 * Día, hora y complejo de un partido. El día tiene que estar entre el inicio y el fin del torneo y, al cambiar
 * día u hora, quedar en el futuro (lo que se escribe queda en borrador hasta que es válido).
 * `jugado`: tiene resultado, no se reprograma.
 */
export function EditorHorario({ valor, onChange, requerido = false, jugado = false, desde, hasta }: {
  valor?: Horario; onChange: (h: Horario) => void; requerido?: boolean; jugado?: boolean
  /** fechas del torneo (inicio y fin) */
  desde?: string; hasta?: string
}) {
  const guardado: Horario = { fecha: valor?.fecha ?? '', hora: valor?.hora ?? '', sede: valor?.sede ?? '' }
  const [d, setD] = useState(guardado)
  const firma = `${guardado.fecha}|${guardado.hora}|${guardado.sede}`
  useEffect(() => setD({ fecha: valor?.fecha ?? '', hora: valor?.hora ?? '', sede: valor?.sede ?? '' }), [firma]) // eslint-disable-line react-hooks/exhaustive-deps

  if (jugado) {
    return <p className="flex items-center gap-1.5 text-xs text-noche/55"><Lock className="h-3.5 w-3.5" aria-hidden /> Jugado · {textoHorario(valor)}</p>
  }
  const { min, max } = rangoProgramable(desde, hasta)
  const error = errorHorario(guardado, d, desde, hasta)
  // el día guardado quedó fuera del torneo (por ejemplo, se cambiaron las fechas del torneo después de programar)
  const fuera = fueraDelTorneo(guardado.fecha, desde, hasta)
  const cambiar = (n: Horario) => {
    const m = { ...n, sede: n.sede || SEDE_DEFECTO }
    setD(m)
    if (!errorHorario(guardado, m, desde, hasta)) onChange(m)
  }
  const falta = requerido && (!d.fecha || !d.hora || !d.sede)
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1.3fr_1fr_1.3fr] gap-2 sm:max-w-lg">
        <Input type="date" value={d.fecha} min={min} max={max} onChange={(e) => cambiar({ ...d, fecha: e.target.value })} aria-label="Día"
          className={`py-1.5 ${error || fuera ? 'ring-red' : falta && !d.fecha ? 'ring-amber-400' : ''}`} />
        <Input type="time" value={d.hora} onChange={(e) => cambiar({ ...d, hora: e.target.value })} aria-label="Hora"
          className={`py-1.5 ${error ? 'ring-red' : falta && !d.hora ? 'ring-amber-400' : ''}`} />
        <Select value={d.sede} onChange={(e) => cambiar({ ...d, sede: e.target.value })} aria-label="Complejo"
          className={`py-1.5 ${falta && !d.sede ? 'ring-amber-400' : ''}`}>
          <option value="" disabled>Complejo…</option>
          {SEDES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      {error && <p className="text-xs text-red">{error} No se guardó: sigue {textoHorario(valor)}.</p>}
      {!error && fuera && desde && hasta && <p className="text-xs text-red">Este día quedó fuera de las fechas del torneo ({rangoFechas(desde, hasta)}). Cambialo.</p>}
    </div>
  )
}
