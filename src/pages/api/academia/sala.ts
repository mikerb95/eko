import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { SALA_COOKIE, SALA_TTL_SECONDS, crearPaseSala } from '../../../lib/auth'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { AREA_IDS } from '../../../lib/academia/reglas'
import { interaccionDe, interaccionPublica, registroSala, votoValido } from '../../../lib/talleres/reglas'
import { marcarEnSala, misRespuestas, registrarAsistente, votar } from '../../../lib/talleres/datos'
import { salaActual } from '../../../lib/talleres/sala'

// La sala del celular (/academia/sala). Pública: se llega por el QR del
// proyector y no pide usuario ni contraseña (excepción en src/middleware.ts).
// La persona escribe nombre, apellido, cargo y área y recibe un pase firmado
// (cookie eko_sala) que solo sirve para votar en la capacitación en curso,
// ese día. Fuera de una sesión en curso no se puede registrar ni votar.
//
// GET           → capacitación en curso, si la persona ya está registrada, pregunta abierta y sus respuestas
// POST {accion} → registrar | entrar | votar

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { estado, t, asistente } = await salaActual(cookies.get(SALA_COOKIE)?.value)
    if (!estado || !t) return json({ enCurso: false })
    if (!asistente) return json({ enCurso: true, registrado: false, taller: t.n, titulo: t.titulo })
    const i = estado.interaccion ? interaccionDe(t, estado.interaccion) : null
    return json({
      enCurso: true,
      registrado: true,
      taller: t.n,
      titulo: t.titulo,
      escena: t.escenas.find((x) => x.id === estado.escena)?.titulo ?? '',
      interaccion: i ? interaccionPublica(i) : null,
      mias: i ? await misRespuestas(t.n, i.id, asistente.id) : {},
    })
  } catch (e) {
    return fail('academia/sala', e)
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  try {
    const { estado, t, asistente } = await salaActual(cookies.get(SALA_COOKIE)?.value)
    if (!estado || !t) return json({ error: 'No hay una capacitación en curso. Intente de nuevo cuando empiece la sesión.' }, 409)

    if (b?.accion === 'registrar') {
      const r = registroSala(b, AREA_IDS)
      if ('error' in r) return json(r, 400)
      const hoy = hoyEnBogota()
      const { asistente: a } = await registrarAsistente(t, hoy, r)
      await marcarEnSala(t.n, a.id)
      cookies.set(SALA_COOKIE, await crearPaseSala({ a: a.id, t: t.n, f: hoy }), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        maxAge: SALA_TTL_SECONDS,
      })
      return json({ ok: true, nombre: a.nombre })
    }

    if (!asistente) return json({ error: 'Registre su nombre para participar.', registrar: true }, 401)

    if (b?.accion === 'entrar') {
      await marcarEnSala(t.n, asistente.id)
      return json({ ok: true })
    }

    if (b?.accion === 'votar') {
      if (!votoValido(t, estado.interaccion, b.interaccion, b.pregunta, b.valor)) return json({ error: 'Esa pregunta ya se cerró' }, 409)
      await votar(t.n, b.interaccion, b.pregunta, asistente.id, b.valor)
      return json({ ok: true })
    }

    return json({ error: 'Acción desconocida' }, 400)
  } catch (e) {
    return fail('academia/sala', e)
  }
}
