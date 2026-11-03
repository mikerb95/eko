import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import {
  eliminarLeccion,
  eliminarSesion,
  emitirCertificado,
  estadoAdmin,
  guardarAsistencia,
  guardarInscripcion,
  guardarLeccion,
  guardarSesion,
  moverLeccion,
  publicarLeccion,
  quitarInscripcion,
  revisarEntrega,
  revocarCertificado,
} from '../../../lib/academia/datos'

export const prerender = false

// Academia de IA desde el panel: solo admin, también en lectura. El
// middleware ya lo bloquea para este prefijo; esto es la segunda capa.
const soloAdmin = (role: unknown) => role === 'admin'
const prohibido = () => json({ error: 'Solo administradores' }, 403)

export const GET: APIRoute = async ({ locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  try {
    return json(await estadoAdmin(hoyEnBogota()))
  } catch (e) {
    return fail('admin/academia', e)
  }
}

type Accion = (b: any, quien: string, hoy: string) => Promise<unknown>

const ACCIONES: Record<string, Accion> = {
  guardar_inscripcion: (b) => guardarInscripcion(b),
  quitar_inscripcion: (b) => quitarInscripcion(b.usuario_id),
  guardar_leccion: (b) => guardarLeccion(b),
  publicar_leccion: (b) => publicarLeccion(b.id, b.publicada),
  mover_leccion: (b) => moverLeccion(b.id, b.dir),
  eliminar_leccion: (b) => eliminarLeccion(b.id),
  guardar_sesion: (b) => guardarSesion(b),
  eliminar_sesion: (b) => eliminarSesion(b.id),
  guardar_asistencia: (b) => guardarAsistencia(b.sesion_id, b.usuario_ids),
  revisar_entrega: (b, quien) => revisarEntrega(b, quien),
  emitir_certificado: (b, quien, hoy) => emitirCertificado(Number(b.usuario_id), quien, hoy),
  revocar_certificado: (b) => revocarCertificado(b.codigo),
}

/** Todas las escrituras van con `{ accion, ...datos }` y devuelven el estado completo. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const accion = ACCIONES[String(b?.accion)]
  if (!accion) return json({ error: 'Acción desconocida' }, 400)
  const quien = String(locals.user || locals.username || 'admin')
  const hoy = hoyEnBogota()
  try {
    const resultado = await accion(b, quien, hoy)
    return json({ ok: true, resultado: resultado ?? null, estado: await estadoAdmin(hoy) })
  } catch (e) {
    return fail('admin/academia', e)
  }
}
