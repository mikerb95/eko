import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { SALA_COOKIE, crearPaseSala } from '../../../lib/auth'
import { enviarEnlaceSala, salaEmailConfigured } from '../../../lib/email'
import { SITE_URL } from '../../../lib/site'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { AREA_IDS, nombreModulo } from '../../../lib/academia/reglas'
import { MAX_INSTRUCCION, MIN_INSTRUCCION, PRACTICAS_DIA, validarInstruccion } from '../../../lib/academia/practica'
import { practicar, PracticaNoDisponible } from '../../../lib/academia/motorPractica'
import { correoValido, interaccionDe, interaccionPublica, PREGUNTAS_DIA, registroSala, validarPregunta, votoValido, MAX_PREGUNTA } from '../../../lib/talleres/reglas'
import { avisoPublico, codigoPC, codigoVigente, MINUTOS_CODIGO_PC, guardarOpinion, guardarPracticaSala, guardarPregunta, marcarEnSala, misRespuestas, opinionDe, practicasSalaDeHoy, preguntasDeHoyDe, liberarEnlace, registrarAsistente, registroPorCorreo, reservarEnlace, votar } from '../../../lib/talleres/datos'
import { validarOpinion } from '../../../lib/talleres/opinion'
import { salaActual } from '../../../lib/talleres/sala'
import { anotar } from '../../../lib/bitacora'
import { clientIp } from '../../../lib/rateLimit'
import type { PasoGuiado } from '../../../lib/talleres/tipos'

// La sala del celular (/academia/sala). Pública: se llega por el QR del
// proyector y no pide usuario ni contraseña (excepción en src/middleware.ts).
// La persona escribe su correo (y, solo la primera vez, nombre, apellido y
// área) y le llega al correo un
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
// POST {accion} → registrar (solo correo: si es nuevo responde {nuevo}; si no, envía el enlace) | entrar | votar | practicar | preguntar | codigo_pc | opinion
//
// Al llegar la presentación a su última escena, GET trae `opinion`
// ('pendiente' o 'enviada') y el celular pasa al formulario de cierre de su
// área (/academia/sala/opinion, src/lib/talleres/opinion.ts).
//
// codigo_pc: el celular muestra un código de dos números para abrir la
// presentación en el PC de la persona (/pc). Ver /api/academia/pc.

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
      // Posición exacta de la presentación: la sigue el PC vinculado (/pc).
      escenaId: estado.escena,
      paso: estado.paso,
      kicker: escena?.kicker ?? '',
      // Número de slide (desde 1): el celular decide desde cuál muestra la caja de preguntas.
      numero: t.escenas.findIndex((x) => x.id === estado.escena) + 1,
      // Aviso "Empezamos en 00:00" que puso quien dicta.
      aviso: avisoPublico(estado),
      // Práctica guiada: el paso actual, con su maqueta (el celular la anima).
      guia: (() => {
        const pasos = escena?.tipo === 'conectar' ? ((escena.datos?.pasos ?? []) as PasoGuiado[]) : []
        const p = pasos[Math.min(estado.paso, pasos.length - 1)]
        return p ? { ...p, paso: Math.min(estado.paso, pasos.length - 1), total: pasos.length - 1 } : null
      })(),
      idea: t.celular?.[estado.escena]?.idea ?? '',
      practica: escena?.tipo === 'practica' ? { consigna: String(escena.datos?.consigna ?? ''), maximo: MAX_INSTRUCCION } : null,
      interaccion: i ? interaccionPublica(i) : null,
      ejemplo: (() => {
        const ej = t.celular?.[estado.escena]?.areas?.[asistente.area]
        return ej ? { area: nombreModulo(asistente.area), ...ej } : null
      })(),
      mias: i ? await misRespuestas(t.n, i.id, asistente.id) : {},
      // Código para el PC que sigue vigente (si ya se usó, el celular lo quita).
      codigoPC: await codigoVigente(t.n, asistente.id),
      // Última escena: el celular pasa al formulario de cierre (si no lo ha enviado).
      opinion: estado.escena === t.escenas.at(-1)?.id ? ((await opinionDe(asistente.id)) ? 'enviada' : 'pendiente') : null,
    })
  } catch (e) {
    return fail('academia/sala', e)
  }
}

export const POST: APIRoute = async ({ request, cookies, url, clientAddress }) => {
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
      // Primero llega solo el correo. Si ya se registró antes, entra con sus
      // datos de esa vez; si no, el celular pide nombre, apellido y área (una
      // sola vez) y los manda junto con el correo.
      const correo = correoValido(b?.correo)
      if (!correo) return json({ error: 'Escriba un correo válido.' }, 400)
      let datos = b
      if (!b?.nombre && !b?.apellido) {
        const previo = await registroPorCorreo(correo)
        if (!previo || 'error' in registroSala({ ...previo, correo }, AREA_IDS)) return json({ nuevo: true })
        datos = { ...previo, correo }
      }
      const r = registroSala(datos, AREA_IDS)
      if ('error' in r) return json(r, 400)
      const hoy = hoyEnBogota()
      const { asistente: a, marcados } = await registrarAsistente(t, hoy, r)
      await anotar('sala_registro', {
        quien: `asistente:${a.id}`,
        taller: t.n,
        detalle: { nombre: r.nombre, apellido: r.apellido, correo: r.correo, area: r.area, cuenta: a.usuario_id, bloques: marcados },
        ip: clientIp(request, clientAddress ?? ''),
      })
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

    // Código de dos números para abrir la presentación en el PC (/pc).
    if (b?.accion === 'codigo_pc') {
      const c = await codigoPC(t.n, asistente.id)
      if (!c) return json({ error: 'No hay códigos libres en este momento. Intente de nuevo en un minuto.' }, 503)
      return json({ ...c, minutos: MINUTOS_CODIGO_PC })
    }

    if (b?.accion === 'entrar') {
      await marcarEnSala(t.n, asistente.id)
      return json({ ok: true })
    }

    if (b?.accion === 'votar') {
      if (!votoValido(t, estado.interaccion, b.interaccion, b.pregunta, b.valor)) return json({ error: 'Esa pregunta ya se cerró' }, 409)
      await votar(t.n, b.interaccion, b.pregunta, asistente.id, b.valor)
      await anotar('voto', { quien: `asistente:${asistente.id}`, taller: t.n, detalle: { interaccion: b.interaccion, pregunta: b.pregunta, valor: b.valor } })
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

    if (b?.accion === 'opinion') {
      const r = validarOpinion(b.respuestas, asistente.area, t.n)
      if ('error' in r) return json(r, 400)
      await guardarOpinion(asistente, r.respuestas)
      await anotar('opinion', { quien: `asistente:${asistente.id}`, taller: t.n, detalle: { area: asistente.area } })
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
