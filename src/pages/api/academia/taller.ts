import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { nombreModulo } from '../../../lib/academia/reglas'
import { tallerDe } from '../../../lib/talleres'
import { compararEvaluacion, contarVotos, interaccionDe } from '../../../lib/talleres/reglas'
import { asistentesDeHoy, enSala, fijarEstado, marcarRespondida, preguntasPendientes, respuestas, sesionesDeHoy } from '../../../lib/talleres/datos'
import { preguntarDemo } from '../../../lib/talleres/motorIA'

// Capacitaciones en vivo (/academia/taller/<n>). El middleware ya exige
// sesión. Mover la presentación, ver el tablero del presentador y pedirle a
// Claude es solo de admin. Lo del celular (registrarse y votar, sin cuenta)
// vive en /api/academia/sala.
//
// GET ?que=resultados&n&i  → conteo de una interacción (proyector)
// GET ?que=comparacion&n   → evaluación de entrada contra salida
// GET ?que=panel&n         → sala, asistencia, preguntas de la sala y aviso de bloque del día (presentador)
// POST {accion}            → estado | ia | respondida

export const prerender = false

const esAdmin = (locals: App.Locals) => String(locals.role || '') === 'admin'

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const que = url.searchParams.get('que')
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
      const [sala, asistentes, sesiones, preguntas] = await Promise.all([enSala(t.n), asistentesDeHoy(t.n, hoy), sesionesDeHoy(t, hoy), preguntasPendientes(t.n, hoy)])
      return json({
        sala,
        asistentes: asistentes.length,
        lista: asistentes.map((a) => ({ nombre: `${a.nombre} ${a.apellido}`, cargo: a.cargo, area: nombreModulo(a.area), cuenta: a.usuario_id > 0 })),
        sesiones: sesiones.map((s) => s.titulo),
        preguntas: preguntas.map((p) => ({
          id: p.id,
          texto: p.texto,
          nombre: p.nombre,
          area: nombreModulo(p.area),
          escena: t.escenas.find((e) => e.id === p.escena)?.titulo ?? '',
        })),
      })
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

      case 'respondida': {
        if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
        const id = Number(b.id)
        if (!Number.isInteger(id) || id <= 0) return json({ error: 'Pregunta inválida' }, 400)
        await marcarRespondida(t.n, id)
        return json({ ok: true })
      }

      default:
        return json({ error: 'Acción desconocida' }, 400)
    }
  } catch (e) {
    return fail('academia/taller', e)
  }
}
