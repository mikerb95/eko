/**
 * Envía el material de una sesión de capacitación (docs/plan-recursos.md): a
 * cada persona registrada en la sala ese día, un correo con el enlace a la
 * ruta de su área en el banco de recursos. Lo dispara quien administra desde
 * /admin/academia, pestaña Material. A quien ya le llegó no se le repite.
 */
import { UserError } from '../apiError.ts'
import { enviarRecursos } from '../email.ts'
import { SITE_URL } from '../site.ts'
import { marcarMaterial, pendientesMaterial } from './datos.ts'
import { tallerDe } from './index.ts'
import { areaRecursos, rutaRecursos } from './recursos.ts'

/** Resend admite 2 envíos por segundo en el plan gratuito: se deja holgura. */
const PAUSA_MS = 600
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface ResultadoMaterial {
  enviados: number
  fallidos: { nombre: string; correo: string }[]
}

export async function enviarMaterial(taller: number, fecha: string): Promise<ResultadoMaterial> {
  const t = tallerDe(taller)
  if (!t) throw new UserError('Esa capacitación no existe.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new UserError('Fecha inválida.')
  const pendientes = await pendientesMaterial(taller, fecha)
  const res: ResultadoMaterial = { enviados: 0, fallidos: [] }
  for (const [i, a] of pendientes.entries()) {
    if (i > 0) await esperar(PAUSA_MS)
    const area = areaRecursos(a.area)
    const r = await enviarRecursos({
      to: a.correo,
      nombre: a.nombre,
      capacitacion: `Capacitación ${t.n}: ${t.titulo}`,
      area: area?.nombre ?? 'su área',
      // Siempre el dominio público: es lo que la persona abre desde su correo.
      url: `${SITE_URL}${area ? rutaRecursos(area.id) : '/academia/recursos'}`,
    })
    if (r.reason === 'not_configured') throw new UserError('El correo no está configurado (falta RESEND_API_KEY). No se envió nada.')
    if (r.sent) {
      await marcarMaterial(taller, fecha, a.correo)
      res.enviados++
    } else {
      res.fallidos.push({ nombre: `${a.nombre} ${a.apellido}`.trim(), correo: a.correo })
    }
  }
  return res
}
