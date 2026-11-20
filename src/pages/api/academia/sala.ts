import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { SALA_COOKIE, crearPaseSala } from '../../../lib/auth'
import { enviarEnlaceSala, salaEmailConfigured } from '../../../lib/email'
import { SITE_URL } from '../../../lib/site'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { AREA_IDS, nombreModulo } from '../../../lib/academia/reglas'
import { MAX_INSTRUCCION, MIN_INSTRUCCION, PRACTICAS_DIA, validarInstruccion } from '../../../lib/academia/practica'
import { practicar, PracticaNoDisponible } from '../../../lib/academia/motorPractica'
import { interaccionDe, interaccionPublica, PREGUNTAS_DIA, registroSala, validarPregunta, votoValido, MAX_PREGUNTA } from '../../../lib/talleres/reglas'
import { guardarPracticaSala, guardarPregunta, marcarEnSala, misRespuestas, practicasSalaDeHoy, preguntasDeHoyDe, liberarEnlace, registrarAsistente, reservarEnlace, votar } from '../../../lib/talleres/datos'
import { salaActual } from '../../../lib/talleres/sala'

// La sala del celular (/academia/sala). Pública: se llega por el QR del
// proyector y no pide usuario ni contraseña (excepción en src/middleware.ts).
// La persona escribe nombre, apellido, correo y área y le llega al correo un
// enlace de entrada (Resend, dominio codebymike.net). El enlace lleva un pase
// firmado que /academia/sala guarda como cookie (eko_sala) y que solo sirve
// para votar en la capacitación en curso, ese día. Al mismo correo llegará
// después el material. Fuera de una sesión en curso no se puede registrar ni votar.
// Mientras el proyector está en la práctica guiada, la sala es el revisor de
// instrucciones (mismo motor y tope de gasto que el de la academia).
// En cada escena la persona ve la idea en palabras sencillas y un ejemplo de
// su área (Taller.celular), y
// puede enviarle una pregunta a quien dicta, que la ve en el presentador.
//
// GET           → capacitación en curso, si la persona ya está registrada, pregunta abierta, sus respuestas y si hay práctica
// POST {accion} → registrar (envía el enlace al correo) | entrar | votar | practicar | preguntar

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const { estado, t, asistente } = await salaActual(cookies.get(SALA_COOKIE)?.value)
    if (!estado || !t) return json({ enCurso: false })
    if (!asistente) return json({ enCurso: true, registrado: false, taller: t.n, titulo: t.titulo })
    const i = estado.interaccion ? interaccionDe(t, estado.interaccion) : null
    const escena = t.escenas.find((x) => x.id === estado.escena)
    return json({
      enCurso: true,
      registrado: true,
      taller: t.n,
      titulo: t.titulo,
      escena: escena?.titulo ?? '',
      kicker: escena?.kicker ?? '',
      idea: t.celular?.[estado.escena]?.idea ?? '',
      practica: escena?.tipo === 'practica' ? { consigna: String(escena.datos?.consigna ?? ''), maximo: MAX_INSTRUCCION } : null,
      interaccion: i ? interaccionPublica(i) : null,
      ejemplo: (() => {
        const ej = t.celular?.[estado.escena]?.areas?.[asistente.area]
        return ej ? { area: nombreModulo(asistente.area), ...ej } : null
      })(),
      mias: i ? await misRespuestas(t.n, i.id, asistente.id) : {},
    })
  } catch (e) {
    return fail('academia/sala', e)
  }
}

export const POST: APIRoute = async ({ request, cookies, url }) => {
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
      // En desarrollo el enlace apunta al servidor local; en producción,
      // siempre al dominio público (una URL de Vercel pediría su login).
      const origen = import.meta.env.DEV ? url.origin : SITE_URL
      const enlace = `${origen}/academia/sala?e=${encodeURIComponent(await crearPaseSala({ a: a.id, t: t.n, f: hoy }))}`
      // Sin Resend en desarrollo, el enlace vuelve en la respuesta para probar sin buzón.
      if (import.meta.env.DEV && !salaEmailConfigured()) return json({ ok: true, correo: r.correo, enlace })
      if (!(await reservarEnlace(a.id))) return json({ error: 'Ya le enviamos el enlace. Revise su correo (también la carpeta de spam) y espere un minuto para pedirlo otra vez.' }, 429)
      const envio = await enviarEnlaceSala({ to: r.correo, nombre: a.nombre, capacitacion: `Capacitación ${t.n} · ${t.titulo}`, url: enlace })
      if (!envio.sent) {
        console.error('[academia/sala] enlace sin enviar', envio.reason)
        await liberarEnlace(a.id)
        return json({ error: 'No pudimos enviar el correo. Revise que esté bien escrito o avísele a quien dicta.' }, 502)
      }
      return json({ ok: true, correo: r.correo })
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

    if (b?.accion === 'preguntar') {
      const texto = validarPregunta(b.texto)
      if (!texto) return json({ error: `Escriba su pregunta (hasta ${MAX_PREGUNTA} caracteres).` }, 400)
      const hoy = hoyEnBogota()
      if ((await preguntasDeHoyDe(asistente.id, hoy)) >= PREGUNTAS_DIA) return json({ error: `Ya envió ${PREGUNTAS_DIA} preguntas hoy. Hágala en voz alta.` }, 429)
      await guardarPregunta(t.n, hoy, asistente.id, estado.escena, texto)
      return json({ ok: true })
    }

    if (b?.accion === 'practicar') {
      const escena = t.escenas.find((x) => x.id === estado.escena)
      if (escena?.tipo !== 'practica') return json({ error: 'El revisor se abre durante la práctica guiada.' }, 409)
      const instruccion = validarInstruccion(b.instruccion)
      if (!instruccion) return json({ error: `Escriba una instrucción de entre ${MIN_INSTRUCCION} y ${MAX_INSTRUCCION} caracteres.` }, 400)
      if ((await practicasSalaDeHoy(asistente.id, hoyEnBogota())) >= PRACTICAS_DIA) {
        return json({ error: `Ya hizo ${PRACTICAS_DIA} prácticas hoy.` }, 429)
      }
      try {
        const r = await practicar({ instruccion, consigna: String(escena.datos?.consigna ?? ''), leccion: 'Cómo pedir', area: nombreModulo(asistente.area) })
        await guardarPracticaSala(t.n, asistente.id, instruccion, r.revision)
        return json(r)
      } catch (err) {
        if (err instanceof PracticaNoDisponible) return json({ error: 'El revisor no está disponible en este momento. Siga con la instrucción y revísela con quien dicta.' }, 503)
        throw err
      }
    }

    return json({ error: 'Acción desconocida' }, 400)
  } catch (e) {
    return fail('academia/sala', e)
  }
}
