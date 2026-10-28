// Motor del asistente del panel (fase 7 de docs/plan-asistente.md): une el
// bucle con la API de Claude, las herramientas según el rol, las
// conversaciones, el consumo, los topes y la auditoría. Solo servidor.
//
// Por qué la API y un bucle propio: una propuesta puede esperar horas el clic
// de una persona y una función de Vercel no puede quedarse esperando. La
// conversación vive en la base y `decidir` la retoma en otra petición.

import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { asegurarEsquema, cliente } from '../db.ts'
import { hoyEnBogota } from '../agente/diasHabiles.ts'
import { registrarDecision } from './auditoria.ts'
import { avanzar, decidir, nuevaEjecucion, type Dependencias, type Ejecucion, type EventoBucle } from './bucle.ts'
import { crearConversacion, guardarConversacion, MAX_TURNOS, purgarConversaciones, reclamar, type Conversacion } from './conversaciones.ts'
import { registrarConsumo } from './consumo.ts'
import { MODELO } from './costo.ts'
import { ejecutarEscritura, escritura, escriturasDe, prepararEscritura } from './escrituras/index.ts'
import { ejecutar, herramienta, herramientasDe } from './herramientas/index.ts'
import type { Contexto, Usuario } from './herramientas/tipos.ts'
import { responderFalso } from './modeloFalso.ts'
import { esRol } from './permisos.ts'
import { systemPrompt } from './prompt.ts'
import { estadoDelDia, mensajeSinPresupuesto } from './topes.ts'
import { contarTurnos, sinRayas, textoRechazo } from './turnos.ts'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

/**
 * El modelo simulado solo corre en local (dev y Playwright). En Vercel nunca,
 * ni en producción ni en previews, aunque alguien deje la variable puesta.
 */
export function usarModeloFalso(): boolean {
  return env('ASISTENTE_MODELO_FALSO') === '1' && !env('VERCEL') && !env('VERCEL_ENV')
}

export const iaDisponible = () => usarModeloFalso() || !!env('ANTHROPIC_API_KEY')

export class AsistenteNoDisponible extends Error {
  constructor(
    mensaje: string,
    readonly status: number,
    readonly nueva = false,
  ) {
    super(mensaje)
    this.name = 'AsistenteNoDisponible'
  }
}

async function base() {
  await asegurarEsquema()
  return cliente()
}

/** Usuario de la sesión (middleware: locals.username, locals.user, locals.role). */
export function usuarioDeSesion(locals: any): Usuario | null {
  const usuario = String(locals?.username || '')
  const rol = String(locals?.role || '')
  if (!usuario || !esRol(rol)) return null
  return { usuario, nombre: String(locals?.user || usuario), rol }
}

/**
 * Rol ACTUAL en la base. La sesión dura 8 horas y el rol pudo cambiar o la
 * cuenta pudo desactivarse; al aprobar una escritura manda la base. La cuenta
 * de acceso fija `admin` (users.ts) no está en la tabla.
 */
async function rolVigente(u: Usuario): Promise<string | null> {
  const r = await (await base()).execute({ sql: 'SELECT role, active FROM users WHERE username = ? LIMIT 1', args: [u.usuario] })
  const f: any = r.rows[0]
  if (!f) return u.usuario === 'admin' && u.rol === 'admin' ? 'admin' : null
  return Number(f.active) === 1 && esRol(String(f.role)) ? String(f.role) : null
}

// ── Definiciones para la API ────────────────────────────────────────────────

function definiciones(nombres: { nombre: string; descripcion: string; esquema: z.ZodObject<z.ZodRawShape> }[]): Anthropic.Beta.BetaTool[] {
  return nombres.map((h, i) => {
    const { $schema: _, ...esquema } = z.toJSONSchema(h.esquema) as Record<string, unknown>
    return {
      name: h.nombre,
      description: h.descripcion,
      input_schema: esquema as Anthropic.Beta.BetaTool.InputSchema,
      // La última lleva la marca de caché: herramientas y prompt no cambian
      // en el día para un mismo rol.
      ...(i === nombres.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
    }
  })
}

type Emitir = (e: EventoBucle) => void

function dependencias(ctx: Contexto, conversacion: string, emitirCrudo: Emitir): Dependencias {
  const rol = ctx.usuario.rol
  const lecturas = herramientasDe(rol)
  const escrituras = escriturasDe(rol)
  const nombres = [...lecturas, ...escrituras].map((h) => h.nombre)
  const tools = definiciones([...lecturas, ...escrituras])
  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: 'text', text: systemPrompt(ctx.hoy, rol, lecturas, escrituras), cache_control: { type: 'ephemeral' } },
  ]
  // El modelo pone rayas largas aunque el prompt lo prohíba: se quitan al
  // mostrar. El historial guardado no se toca (editarlo invalida el thinking).
  const emitir: Emitir = (e) => emitirCrudo(e.tipo === 'texto' ? { ...e, texto: sinRayas(e.texto) } : e)
  const falso = usarModeloFalso()
  const api = falso ? null : new Anthropic({ apiKey: env('ANTHROPIC_API_KEY'), maxRetries: 1 })

  return {
    herramientasAprobacion: escrituras.map((e) => e.nombre),
    async llamarModelo(mensajes) {
      const msg = api
        ? await api.beta.messages
            .stream({
              model: MODELO,
              max_tokens: 16_000,
              system,
              tools,
              messages: mensajes,
              thinking: { type: 'adaptive' },
              // Sonnet 5.5: medium para varias herramientas encadenadas; las
              // herramientas hacen el trabajo pesado.
              output_config: { effort: 'medium' },
              // Si Sonnet declina por una regla de seguridad, la API repite en
              // otro modelo dentro de la misma llamada (costo.ts lo tarifa).
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
            } as Anthropic.Beta.MessageCreateParamsStreaming)
            .finalMessage()
        : responderFalso(mensajes, nombres)
      // Por llamada y no al final: si la función muere, lo pagado cuenta.
      await registrarConsumo(ctx.db, { usuario: ctx.usuario.usuario, conversacion, usage: msg.usage, modelo: msg.model }).catch((err) =>
        console.error('[asistente] no se pudo registrar el consumo', err),
      )
      return msg
    },
    validar(nombre, entrada) {
      const h = herramienta(nombre)
      const w = escritura(nombre)
      if (!nombres.includes(nombre) || (!h && !w)) return 'Esa herramienta no está disponible para su rol.'
      const r = (h ?? w)!.esquema.safeParse(entrada ?? {})
      return r.success ? null : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    },
    async ejecutar(nombre, entrada, { toolUseId }) {
      // Solo `decidir` llega aquí con una escritura, y solo tras el "Aprobar".
      if (escritura(nombre)) return ejecutarEscritura(nombre, entrada, { ...ctx, toolUseId })
      return ejecutar(nombre, entrada, ctx)
    },
    prepararPropuesta: (nombre, entrada) => prepararEscritura(nombre, entrada, ctx),
    rechazo: textoRechazo,
    guardar: (e) => guardarConversacion(ctx.db, e),
    emitir,
    async presupuestoRestante() {
      if (falso) return 1
      return (await estadoDelDia(ctx.db, ctx.usuario.usuario)).restanteUsd
    },
  }
}

async function contexto(u: Usuario): Promise<Contexto> {
  return { db: await base(), usuario: u, hoy: hoyEnBogota() }
}

/** Falla con un mensaje claro ANTES de transmitir, para no abrir un stream que muere. */
async function exigirDisponible(ctx: Contexto) {
  if (!iaDisponible()) throw new AsistenteNoDisponible('El asistente todavía no tiene clave de IA configurada. La caja sigue buscando.', 503)
  if (usarModeloFalso()) return
  // Sin poder leer el gasto, lanza y el endpoint responde 503: es dinero, no
  // observabilidad, así que falla cerrado.
  const estado = await estadoDelDia(ctx.db, ctx.usuario.usuario)
  if (estado.restanteUsd <= 0) throw new AsistenteNoDisponible(mensajeSinPresupuesto(estado), 429)
}

// ── Lo que usan los endpoints ───────────────────────────────────────────────

export type Preparada = { ctx: Contexto; conversacion: Conversacion | Ejecucion; seguir: boolean }

/** Abre una conversación nueva (sin `id`) o reclama una propia para seguirla. */
export async function prepararPregunta(u: Usuario, pregunta: string, id: string | null): Promise<Preparada> {
  const ctx = await contexto(u)
  await exigirDisponible(ctx)
  if (!id) {
    const e = nuevaEjecucion(randomUUID(), pregunta)
    await crearConversacion(ctx.db, e, u)
    // Limpieza oportunista de conversaciones viejas, sin cron propio.
    if (Math.random() < 0.05) purgarConversaciones(ctx.db).catch((err) => console.error('[asistente] purga', err))
    return { ctx, conversacion: e, seguir: false }
  }
  // Una fallida no se sigue: pudo cortarse con herramientas sin respuesta.
  const c = await reclamar(ctx.db, id, ['terminada', 'esperando_aprobacion'], u.usuario)
  if (!c) throw new AsistenteNoDisponible('Esa conversación ya no se puede seguir. Empiece una nueva.', 409, true)
  if (contarTurnos(c.mensajes as never) >= MAX_TURNOS && !c.propuesta) {
    c.estado = 'terminada'
    await guardarConversacion(ctx.db, c)
    throw new AsistenteNoDisponible(`Esta conversación ya tiene ${MAX_TURNOS} preguntas. Empiece una nueva: sale más barato y responde igual.`, 409, true)
  }
  return { ctx, conversacion: c, seguir: true }
}

/** Corre la pregunta hasta que termina, falla o se pausa. Nunca lanza. */
export async function responderPregunta(p: Preparada, pregunta: string, emitir: Emitir): Promise<Ejecucion> {
  const e = p.conversacion
  const deps = dependencias(p.ctx, e.id, emitir)
  if (!p.seguir) return avanzar(e, deps)
  e.iteraciones = 0 // el tope de pasos es por pregunta
  // Con una propuesta pendiente, escribir otra cosa es pedir cambios.
  if (e.propuesta) return decidirYAuditar(p.ctx, e, false, deps, pregunta)
  e.mensajes.push({ role: 'user', content: pregunta })
  e.estado = 'corriendo'
  e.respuesta = null
  e.error = null
  return avanzar(e, deps)
}

/**
 * Reclama la propuesta pendiente para decidirla. Solo el dueño de la
 * conversación decide, y con su rol vigente en la base.
 */
export async function prepararDecision(u: Usuario, id: string): Promise<Preparada> {
  const rol = await rolVigente(u)
  if (!rol) throw new AsistenteNoDisponible('Su cuenta ya no tiene acceso al panel.', 403)
  const ctx = await contexto({ ...u, rol })
  if (!iaDisponible()) throw new AsistenteNoDisponible('El asistente todavía no tiene clave de IA configurada.', 503)
  const c = await reclamar(ctx.db, id, ['esperando_aprobacion'], u.usuario)
  if (!c) throw new AsistenteNoDisponible('Esa propuesta ya se decidió o no existe.', 409)
  return { ctx, conversacion: c, seguir: true }
}

export function continuarDecision(p: Preparada, aprobado: boolean, emitir: Emitir): Promise<Ejecucion> {
  return decidirYAuditar(p.ctx, p.conversacion, aprobado, dependencias(p.ctx, p.conversacion.id, emitir))
}

async function decidirYAuditar(ctx: Contexto, e: Ejecucion, aprobado: boolean, deps: Dependencias, comentario: string | null = null): Promise<Ejecucion> {
  const propuesta = e.propuesta!
  let resultado: unknown
  const conResultado: Dependencias = {
    ...deps,
    emitir: (ev) => {
      if (ev.tipo === 'dato' && ev.herramienta === propuesta.herramienta) resultado = ev.datos
      deps.emitir(ev)
    },
  }
  const r = await decidir(e, aprobado, conResultado, comentario)
  const ok = aprobado && resultado !== undefined
  // Si el registro falla, la decisión ya se aplicó: se deja en los logs.
  await registrarDecision(ctx.db, {
    conversacion: e.id,
    herramienta: propuesta.herramienta,
    pidio: ctx.usuario.usuario,
    decidio: ctx.usuario.usuario,
    decision: aprobado ? 'aprobada' : 'rechazada',
    entrada: propuesta.entrada,
    vista: propuesta.vista,
    resultado: aprobado ? (resultado ?? 'falló al ejecutar') : comentario ? { pidioCambios: comentario } : undefined,
    ok,
  }).catch((err) => console.error('[asistente] no se pudo registrar la auditoría', err))
  return r
}
