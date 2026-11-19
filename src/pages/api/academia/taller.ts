import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { areaInscrita, cuentaDe } from '../../../lib/academia/datos'
import { tallerDe } from '../../../lib/talleres'
import { compararEvaluacion, contarVotos, interaccionDe, interaccionPublica, votoValido } from '../../../lib/talleres/reglas'
import {
  asistentesDeHoy,
  enCurso,
  enSala,
  entrarASala,
  fijarEstado,
  leerEstado,
  misRespuestas,
  respuestas,
  sesionesDeHoy,
  tallerEnCurso,
  votar,
} from '../../../lib/talleres/datos'
import { preguntarDemo } from '../../../lib/talleres/motorIA'

// Capacitaciones en vivo (/academia/taller/<n> y /academia/sala). El
// middleware ya exige sesión. Mover la presentación, ver el tablero del
// presentador y pedirle a Claude es solo de admin; votar y entrar a la sala,
// de cualquier cuenta activa.
//
// GET ?que=sala            → lo que ve el celular (capacitación en curso, pregunta abierta, sus respuestas)
// GET ?que=resultados&n&i  → conteo de una interacción (proyector)
// GET ?que=comparacion&n   → evaluación de entrada contra salida
// GET ?que=panel&n         → sala, asistencia y aviso de bloque del día (presentador)
// POST {accion}            → estado | entrar | votar | ia

export const prerender = false

const esAdmin = (locals: App.Locals) => String(locals.role || '') === 'admin'

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const que = url.searchParams.get('que')
    if (que === 'sala') {
      const cuenta = await cuentaDe(String(locals.username || ''))
      if (!cuenta) return json({ error: 'Su cuenta no está activa' }, 403)
      const e = await tallerEnCurso()
      const t = e ? tallerDe(e.taller) : null
      if (!e || !t) return json({ enCurso: false })
      const i = e.interaccion ? interaccionDe(t, e.interaccion) : null
      return json({
        enCurso: true,
        taller: t.n,
        titulo: t.titulo,
        escena: t.escenas.find((x) => x.id === e.escena)?.titulo ?? '',
        interaccion: i ? interaccionPublica(i) : null,
        mias: i ? await misRespuestas(t.n, i.id, cuenta.id) : {},
      })
    }

    const t = tallerDe(url.searchParams.get('n'))
    if (!t) return json({ error: 'Esa capacitación no existe' }, 404)

    if (que === 'resultados') {
      const i = interaccionDe(t, String(url.searchParams.get('i') || ''))
      if (!i) return json({ error: 'Esa pregunta no existe' }, 404)
      return json(contarVotos(i, await respuestas(t.n, i.id)))
    }

    if (que === 'comparacion') {
      if (!t.evaluacion) return json({ error: 'Esta capacitación no tiene evaluación' }, 404)
      const pre = interaccionDe(t, t.evaluacion.pre)!
      const post = interaccionDe(t, t.evaluacion.post)!
      const [a, b] = await Promise.all([respuestas(t.n, pre.id), respuestas(t.n, post.id)])
      return json(compararEvaluacion(pre, post, a, b))
    }

    if (que === 'panel') {
      if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
      const hoy = hoyEnBogota()
      const [sala, asistentes, sesiones] = await Promise.all([enSala(t.n), asistentesDeHoy(t, hoy), sesionesDeHoy(t, hoy)])
      return json({ sala, asistentes, sesiones: sesiones.map((s) => s.titulo) })
    }

    return json({ error: 'Consulta desconocida' }, 400)
  } catch (e) {
    return fail('academia/taller', e)
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  try {
    const t = tallerDe(b?.taller)
    if (!t) return json({ error: 'Esa capacitación no existe' }, 404)

    switch (b?.accion) {
      case 'estado': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta mueve la presentación' }, 403)
        const escena = t.escenas.find((x) => x.id === b.escena)
        if (!escena) return json({ error: 'Esa escena no existe' }, 400)
        await fijarEstado(t.n, escena.id, escena.interaccion ?? '')
        return json({ ok: true })
      }

      case 'ia': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta usa la demo en vivo' }, 403)
        const r = await preguntarDemo(t, b.demo, b.version)
        if (!r) return json({ error: 'Esa versión de la demo no existe' }, 400)
        return json(r)
      }

      case 'entrar':
      case 'votar': {
        const cuenta = await cuentaDe(String(locals.username || ''))
        if (!cuenta) return json({ error: 'Su cuenta no está activa' }, 403)
        const e = await leerEstado(t.n)
        if (!enCurso(e)) return json({ error: 'Esta capacitación no está en curso' }, 409)
        if (b.accion === 'entrar') {
          const marcados = await entrarASala(t, cuenta.id, await areaInscrita(cuenta.id), hoyEnBogota())
          return json({ ok: true, asistencia: marcados > 0 })
        }
        if (!votoValido(t, e!.interaccion, b.interaccion, b.pregunta, b.valor)) {
          return json({ error: 'Esa pregunta ya se cerró' }, 409)
        }
        await votar(t.n, b.interaccion, b.pregunta, cuenta.id, b.valor)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Acción desconocida' }, 400)
    }
  } catch (e) {
    return fail('academia/taller', e)
  }
}
