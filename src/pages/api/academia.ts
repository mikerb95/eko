import type { APIRoute } from 'astro'
import { fail, json } from '../../lib/apiError'
import { hoyEnBogota } from '../../lib/agente/diasHabiles'
import { areaInscrita, cuentaDe, entregar, guardarPractica, leccionParaPracticar, marcarVista, practicasDeHoy } from '../../lib/academia/datos'
import { nombreModulo } from '../../lib/academia/reglas'
import { PRACTICAS_DIA, validarInstruccion, MIN_INSTRUCCION, MAX_INSTRUCCION } from '../../lib/academia/practica'
import { practicar, PracticaNoDisponible } from '../../lib/academia/motorPractica'

// Academia de IA: lo que hace el participante (marcar una lección como vista,
// entregar un ejercicio y practicar con el revisor de instrucciones). El
// middleware ya exige sesión; aquí se exige además cuenta activa e inscripción,
// y cada acción comprueba que la lección esté publicada y en su ruta.

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  try {
    const cuenta = await cuentaDe(String(locals.username || ''))
    if (!cuenta) return json({ error: 'Su cuenta no está activa en la academia' }, 403)
    const area = await areaInscrita(cuenta.id)
    if (!area) return json({ error: 'Todavía no está inscrito en la academia' }, 403)

    switch (b?.accion) {
      case 'marcar_vista':
        await marcarVista(cuenta.id, area, b.leccion_id)
        return json({ ok: true })

      case 'entregar':
        return json({ ok: true, entrega: await entregar(cuenta.id, area, b) })

      case 'practicar': {
        const instruccion = validarInstruccion(b.instruccion)
        if (!instruccion) return json({ error: `Escriba una instrucción de entre ${MIN_INSTRUCCION} y ${MAX_INSTRUCCION} caracteres` }, 400)
        const leccion = await leccionParaPracticar(area, b.leccion_id)
        if ((await practicasDeHoy(cuenta.id, hoyEnBogota())) >= PRACTICAS_DIA) {
          return json({ error: `Ya hizo ${PRACTICAS_DIA} prácticas hoy. Mañana puede seguir.` }, 429)
        }
        let r: Awaited<ReturnType<typeof practicar>>
        try {
          r = await practicar({ instruccion, consigna: leccion.practica_consigna, leccion: leccion.titulo, area: nombreModulo(area) })
        } catch (err) {
          if (err instanceof PracticaNoDisponible) throw err
          console.error('[academia/practica]', err instanceof Error ? err.message : err)
          return json({ error: 'La IA no respondió. Intente de nuevo en un momento.' }, 502)
        }
        const id = await guardarPractica(cuenta.id, leccion.id, instruccion, r.respuesta, r.revision)
        return json({ ok: true, id, ...r })
      }

      default:
        return json({ error: 'Acción desconocida' }, 400)
    }
  } catch (e) {
    if (e instanceof PracticaNoDisponible) return json({ error: 'La práctica con IA no está disponible ahora. Intente más tarde.' }, 503)
    return fail('academia', e)
  }
}
