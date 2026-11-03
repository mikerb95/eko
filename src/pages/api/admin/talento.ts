import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { asegurarEsquema } from '../../../lib/db'
import { notifyResumenTalento, talentoEmailConfigured } from '../../../lib/email'
import {
  cargarEstado,
  decidirNovedad,
  eliminarCargo,
  eliminarCurso,
  eliminarDocumento,
  eliminarEvaluacion,
  eliminarFormacion,
  eliminarNovedad,
  guardarAjustes,
  guardarCargo,
  guardarCurso,
  guardarDocumento,
  guardarEvaluacion,
  guardarFicha,
  guardarNovedad,
  registrarFormaciones,
  sembrarCursosIA,
} from '../../../lib/talento/datos'
import { armarResumen } from '../../../lib/talento/resumen'

export const prerender = false

// Talento humano: solo admin, también en lectura. El middleware deja pasar
// cualquier GET con sesión y además lo bloquea para este prefijo; esto es la
// segunda capa, por si alguien mueve la regla.
const soloAdmin = (role: unknown) => role === 'admin'
const prohibido = () => json({ error: 'Solo administradores' }, 403)

export const GET: APIRoute = async ({ locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  try {
    return json(await cargarEstado(hoyEnBogota()))
  } catch (e) {
    return fail('talento', e)
  }
}

type Accion = (b: any, quien: string) => Promise<unknown>

const ACCIONES: Record<string, Accion> = {
  guardar_ficha: (b) => guardarFicha(b),
  guardar_cargo: (b) => guardarCargo(b),
  eliminar_cargo: (b) => eliminarCargo(b.id),
  guardar_documento: (b) => guardarDocumento(b),
  eliminar_documento: (b) => eliminarDocumento(b.id),
  guardar_novedad: (b, quien) => guardarNovedad(b, quien),
  decidir_novedad: (b, quien) => decidirNovedad(b.id, b.estado, quien),
  eliminar_novedad: (b) => eliminarNovedad(b.id),
  guardar_curso: (b) => guardarCurso(b),
  eliminar_curso: (b) => eliminarCurso(b.id),
  registrar_formaciones: (b) => registrarFormaciones(b),
  eliminar_formacion: (b) => eliminarFormacion(b.id),
  guardar_evaluacion: (b, quien) => guardarEvaluacion(b, quien),
  eliminar_evaluacion: (b) => eliminarEvaluacion(b.id),
  guardar_ajustes: (b) => guardarAjustes(b),
}

/**
 * Todas las escrituras van por aquí con `{ accion, ...datos }` y devuelven el
 * estado completo, ya recalculado (saldos y vencimientos incluidos).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!soloAdmin(locals.role)) return prohibido()
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  const quien = String(locals.user || locals.username || 'admin')
  const hoy = hoyEnBogota()
  try {
    if (b?.accion === 'enviar_resumen') {
      if (!talentoEmailConfigured()) {
        return json({ error: 'El correo todavía no está configurado (faltan RESEND_API_KEY, NOTIFY_FROM y TALENTO_EMAIL o NOTIFY_EMAIL).' }, 409)
      }
      const r = await notifyResumenTalento(armarResumen(await cargarEstado(hoy)))
      if (!r.sent) return json({ error: 'No se pudo enviar el correo. Revise los registros del servidor.' }, 502)
      return json({ ok: true, enviado: true })
    }
    const accion = ACCIONES[String(b?.accion)]
    if (!accion) return json({ error: 'Acción desconocida' }, 400)
    // El esquema y los cursos de IA, antes de la primera escritura.
    await asegurarEsquema()
    await sembrarCursosIA()
    const resultado = await accion(b, quien)
    return json({ ok: true, resultado: resultado ?? null, estado: await cargarEstado(hoy) })
  } catch (e) {
    return fail('talento', e)
  }
}
