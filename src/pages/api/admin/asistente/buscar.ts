import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { asegurarEsquema, cliente } from '../../../../lib/db'
import { hoyEnBogota } from '../../../../lib/agente/diasHabiles'
import { BUSCAR_EN_PANEL } from '../../../../lib/asistente/herramientas/panel'
import { usuarioDeSesion } from '../../../../lib/asistente/motor'

export const prerender = false

// Buscador instantáneo de la caja, SIN IA: secciones del menú y fichas de la
// base. Funciona aunque no haya clave de API ni presupuesto.

export const GET: APIRoute = async ({ url, locals }) => {
  const usuario = usuarioDeSesion(locals)
  if (!usuario) return json({ error: 'Sesión sin rol válido.' }, 401)
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
  if (q.length < 2) return json({ secciones: [], fichas: [] })
  try {
    await asegurarEsquema()
    const r = await BUSCAR_EN_PANEL.ejecutar({ consulta: q }, { db: cliente(), usuario, hoy: hoyEnBogota() })
    return json(r.ok === true ? r.datos : { secciones: [], fichas: [] }, 200, { 'cache-control': 'no-store' })
  } catch (e) {
    return fail('asistente/buscar', e)
  }
}
