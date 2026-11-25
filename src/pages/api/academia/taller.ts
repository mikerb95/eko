import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { nombreModulo } from '../../../lib/academia/reglas'
import { tallerDe } from '../../../lib/talleres'
import { compararEvaluacion, contarVotos, interaccionDe } from '../../../lib/talleres/reglas'
import { asistentesDeHoy, avisoPublico, enEscena, enSala, fijarAviso, fijarEstado, fijarOrden, leerEstado, guardarRespuestaIA, marcarRespondida, preguntaSala, preguntasPendientes, respuestas, sesionesDeHoy } from '../../../lib/talleres/datos'
import { correrModelo, preguntarDemo, responderPregunta } from '../../../lib/talleres/motorIA'
import { armarTurnos, avancesDeHoy, moverTurno, turnosDeHoy } from '../../../lib/talleres/datos'
import { conteoRetos } from '../../../lib/talleres/turnos'
import { MINUTOS_TURNO } from '../../../lib/talleres/retos2'
import { anotar } from '../../../lib/bitacora'

// Capacitaciones en vivo (/academia/taller/<n>). El middleware ya exige
// sesión. Mover la presentación, ver el tablero del presentador y pedirle a
// Claude es solo de admin. Lo del celular (registrarse y votar, sin cuenta)
// vive en /api/academia/sala.
//
// GET ?que=resultados&n&i  → conteo de una interacción (proyector)
// GET ?que=comparacion&n   → evaluación de entrada contra salida
// GET ?que=panel&n         → sala, asistencia, preguntas de la sala, aviso de bloque del día y aviso de inicio (presentador)
// GET ?que=aviso&n         → aviso "Empezamos en 00:00" (proyector de quien dicta)
// GET ?que=estado&n        → escena, paso, cuánto lleva la escena, último botón y aviso: así se siguen
//                            proyector y presentador aunque estén en equipos distintos
// GET ?que=turnos&n        → fila de acompañamiento y avance de los retos (capacitación 2)
// POST {accion}            → estado | orden | aviso | ia | carrera | turnos | turno | respuesta_ia | respondida

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

    if (que === 'aviso') {
      if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
      return json({ aviso: avisoPublico(await leerEstado(t.n)) })
    }

    if (que === 'estado') {
      if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
      const e = await leerEstado(t.n)
      return json({ escena: e?.escena ?? '', paso: e?.paso ?? 0, mov: e?.mov ?? 0, enEscena: enEscena(e), orden: e?.orden ?? null, aviso: avisoPublico(e) })
    }

    // Práctica con casos reales: fila de acompañamiento (presentador y
    // proyector) y cuántos hicieron cada reto. Solo admin: lleva nombres.
    if (que === 'turnos') {
      if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
      const hoy = hoyEnBogota()
      const [fila, avances] = await Promise.all([turnosDeHoy(t.n, hoy), avancesDeHoy(t.n, hoy)])
      const ahora = Date.now()
      return json({
        minutos: MINUTOS_TURNO,
        turnos: fila.map((x) => ({ ...x, area: nombreModulo(x.area), lleva: x.estado === 'ahora' && x.inicio ? ahora - x.inicio : 0 })),
        retos: conteoRetos((t.retos ?? []).map((r) => r.id), avances),
        personas: avances.length,
      })
    }

    if (que === 'panel') {
      if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
      const hoy = hoyEnBogota()
      const [sala, asistentes, sesiones, preguntas, estado] = await Promise.all([enSala(t.n), asistentesDeHoy(t.n, hoy), sesionesDeHoy(t, hoy), preguntasPendientes(t.n, hoy), leerEstado(t.n)])
      return json({
        aviso: avisoPublico(estado),
        sala,
        asistentes: asistentes.length,
        lista: asistentes.map((a) => ({ nombre: `${a.nombre} ${a.apellido}`, correo: a.correo, area: nombreModulo(a.area), cuenta: a.usuario_id > 0 })),
        sesiones: sesiones.map((s) => s.titulo),
        preguntas: preguntas.map((p) => ({
          id: p.id,
          texto: p.texto,
          nombre: p.nombre,
          area: nombreModulo(p.area),
          escena: t.escenas.find((e) => e.id === p.escena)?.titulo ?? '',
          respuesta: p.respuesta_ia,
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
        const paso = Number.isInteger(b.paso) ? Math.max(0, Math.min(escena.pasos, b.paso)) : 0
        const mov = await fijarEstado(t.n, escena.id, escena.interaccion ?? '', paso)
        await anotar('escena', { quien: String(locals.username ?? ''), taller: t.n, detalle: { escena: escena.id, paso } })
        return json({ ok: true, mov })
      }

      // Botón del presentador ("pedir" en el constructor, "generar" en siguiente token).
      case 'orden': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta mueve la presentación' }, 403)
        const nombre = String(b.nombre ?? '')
        const id = String(b.id ?? '').slice(0, 40)
        if (!['pedir', 'generar', 'correr'].includes(nombre) || !id) return json({ error: 'Orden inválida' }, 400)
        await fijarOrden(t.n, { id, nombre })
        return json({ ok: true })
      }

      // Aviso "Empezamos en 00:00": {minutos} lo pone (o lo relanza), {minutos: null} lo quita.
      case 'aviso': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta pone el aviso' }, 403)
        const quitar = b.minutos == null
        const min = Math.round(Number(b.minutos))
        if (!quitar && !(min >= 1 && min <= 120)) return json({ error: 'Escriba entre 1 y 120 minutos' }, 400)
        const ms = min * 60_000
        const primera = t.escenas[0]!
        await fijarAviso(t.n, quitar ? null : { fin: Date.now() + ms, ms }, primera.id, primera.interaccion ?? '')
        await anotar('aviso_inicio', { quien: String(locals.username ?? ''), taller: t.n, detalle: { minutos: quitar ? null : min } })
        return json({ aviso: avisoPublico(await leerEstado(t.n)) })
      }

      case 'ia': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta usa la demo en vivo' }, 403)
        const r = await preguntarDemo(t, b.demo, b.version)
        if (!r) return json({ error: 'Esa versión de la demo no existe' }, 400)
        return json(r)
      }

      // Carrera entre modelos: el proyector pide los tres a la vez, uno por llamada.
      case 'carrera': {
        if (!esAdmin(locals)) return json({ error: 'Solo quien dicta usa la demo en vivo' }, 403)
        const r = await correrModelo(t, b.carrera, b.modelo)
        if (!r) return json({ error: 'Esa carrera no existe' }, 400)
        return json(r)
      }

      // Fila de acompañamiento: suma a los registrados de hoy que falten.
      case 'turnos': {
        if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
        const agregados = await armarTurnos(t.n, hoyEnBogota())
        return json({ ok: true, agregados })
      }

      case 'turno': {
        if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
        const id = Number(b.id)
        const op = String(b.op ?? '')
        if (!Number.isInteger(id) || id <= 0 || !['empezar', 'terminar', 'final', 'subir'].includes(op)) return json({ error: 'Turno inválido' }, 400)
        const ok = await moverTurno(t.n, hoyEnBogota(), id, op as 'empezar')
        if (!ok) return json({ error: 'Ese turno no existe' }, 404)
        await anotar('turno', { quien: String(locals.username ?? ''), taller: t.n, detalle: { id, op } })
        return json({ ok: true })
      }

      // Respuesta preparada por la IA para una pregunta de la sala. Se guarda la
      // primera vez; las siguientes se devuelve la guardada, sin gastar de nuevo.
      case 'respuesta_ia': {
        if (!esAdmin(locals)) return json({ error: 'Solo administradores' }, 403)
        const id = Number(b.id)
        if (!Number.isInteger(id) || id <= 0) return json({ error: 'Pregunta inválida' }, 400)
        const p = await preguntaSala(t.n, id)
        if (!p) return json({ error: 'Esa pregunta no existe' }, 404)
        if (p.respuesta_ia) return json({ texto: p.respuesta_ia, fuente: 'vivo' })
        const r = await responderPregunta(t, p.escena, nombreModulo(p.area), p.texto)
        if (r.texto) await guardarRespuestaIA(t.n, id, r.texto)
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
