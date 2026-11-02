import { LETRAS, claveInicioZona, type Categoria, type Horario } from '../../lib/torneo'
import { clavesJugadas } from '../../lib/resultados'
import { Card } from '../ui'
import { EditorHorario } from '../Horarios'
import { ProblemaHorario } from './Datos'

type Props = { cat: Categoria; cambiar: (f: (c: Categoria) => Categoria) => void }

/** Cuándo y dónde arranca cada zona: día, hora y complejo del primer partido (los demás los coordina el complejo en el momento) */
export default function HorariosZona({ cat, cambiar }: Props) {
  const jugados = clavesJugadas(cat).zona
  const set = (zi: number, h: Horario) => cambiar((c) => ({ ...c, horariosZona: { ...c.horariosZona, [claveInicioZona(zi)]: h } }))

  return (
    <Card>
      <div className="mb-3">
        <h3 className="font-display text-xl font-semibold">Inicio de cada zona</h3>
        <p className="max-w-xl text-sm text-noche/65">
          Día, hora y complejo del primer partido de la zona. Los días tienen que estar dentro de las fechas del torneo y, para reprogramar, la nueva fecha y hora tienen que ser futuras.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {cat.zonas.map((z, zi) => {
          const k = claveInicioZona(zi)
          return (
            <section key={zi} className="overflow-hidden rounded-xl bg-white ring-1 ring-noche/10">
              <h4 className="bg-noche px-4 py-2 font-display text-lg font-bold text-white">Zona {LETRAS[zi]}</h4>
              <div className="space-y-2 p-3">
                {z.some((id) => cat.parejas.find((p) => p.id === id)?.horario) && (
                  <div className="space-y-1 rounded-lg bg-vidrio p-2">
                    {z.map((id) => {
                      const p = cat.parejas.find((x) => x.id === id)
                      return p?.horario ? (
                        <div key={id} className="text-xs"><span className="font-semibold">{p.nombre}:</span><ProblemaHorario texto={p.horario} compacto /></div>
                      ) : null
                    })}
                  </div>
                )}
                <EditorHorario valor={cat.horariosZona[k]} onChange={(h) => set(zi, h)} desde={cat.fechaInicio} hasta={cat.fechaFin} requerido jugado={jugados.has(k)} />
              </div>
            </section>
          )
        })}
      </div>
    </Card>
  )
}
