import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { PC_COOKIE, SALA_TTL_SECONDS, crearPaseSala } from '../../../lib/auth'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { checkRateLimit, clientIp, isRateLimited } from '../../../lib/rateLimit'
import { tallerDe } from '../../../lib/talleres'
import { asistenteDe, canjearCodigoPC, tallerEnCurso } from '../../../lib/talleres/datos'
import { vistaPC } from '../../../lib/talleres/pc'

// El PC vinculado (/pc). Público (excepción en src/middleware.ts): quien ya
// entró a la sala desde el celular escribe aquí el código de dos números que
// le muestra el celular (vence en minutos y sirve una vez). El PC recibe la
// cookie eko_pc, que solo deja ver la presentación siguiendo la escena.
//
// GET  → dónde va la presentación (escena y paso), si este PC está vinculado
// POST {codigo} → vincula este PC
//
// Los intentos fallidos se cuentan por IP. El límite es holgado porque todos
// los PC de la oficina salen a internet por la misma IP.

export const prerender = false

const FALLOS_MAX = 30

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const v = await vistaPC(cookies.get(PC_COOKIE)?.value)
    if (!v) return json({ enCurso: false })
    return json({ enCurso: true, taller: v.estado.taller, escena: v.estado.escena, paso: v.estado.paso })
  } catch (e) {
    return fail('academia/pc', e)
  }
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  try {
    const clave = `pc:${clientIp(request, clientAddress ?? 'local')}`
    if (isRateLimited(clave, FALLOS_MAX)) return json({ error: 'Demasiados intentos. Espere unos minutos y pida un código nuevo en el celular.' }, 429)
    const codigo = String(b?.codigo ?? '').replace(/\D/g, '')
    if (!/^\d{2}$/.test(codigo)) return json({ error: 'Escriba los dos números que le muestra el celular.' }, 400)
    const estado = await tallerEnCurso()
    const t = estado ? tallerDe(estado.taller) : null
    if (!estado || !t) return json({ error: 'No hay una capacitación en curso.' }, 409)
    const id = await canjearCodigoPC(t.n, codigo)
    const asistente = id ? await asistenteDe(id) : null
    if (!asistente || asistente.taller !== t.n || asistente.fecha !== hoyEnBogota()) {
      checkRateLimit(clave, FALLOS_MAX)
      return json({ error: 'Ese código no sirve o ya venció. Pida uno nuevo en el celular.' }, 400)
    }
    const pase = await crearPaseSala({ a: asistente.id, t: t.n, f: asistente.fecha })
    cookies.set(PC_COOKIE, pase, { path: '/', httpOnly: true, sameSite: 'lax', secure: import.meta.env.PROD, maxAge: SALA_TTL_SECONDS })
    return json({ ok: true, url: `/academia/taller/${t.n}`, nombre: asistente.nombre })
  } catch (e) {
    return fail('academia/pc', e)
  }
}
