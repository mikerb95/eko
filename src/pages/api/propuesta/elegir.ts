import type { APIRoute } from 'astro'
import { z } from 'zod'
import { checkRateLimit, clientIp } from '../../../lib/rateLimit'
import { guardarEleccion, propuestaPublicada } from '../../../lib/propuesta/almacen'
import { calcular, pesos } from '../../../lib/propuesta/datos'
import { notifyPropuestaEleccion } from '../../../lib/email'

// El gerente marca el plan que elige al final de /propuesta. No es un
// contrato: queda en el panel y le llega a Mike por correo para formalizar.

export const prerender = false

const Esquema = z
  .object({
    plan: z.enum(['p20', 'p40', 'p80', 'ninguno']),
    capacitacion: z.enum(['ninguna', 's4', 's5']),
    nombre: z.string().trim().min(2).max(120),
    cargo: z.string().trim().max(120).default(''),
    comentario: z.string().trim().max(1500).default(''),
    // Honeypot: un humano no lo ve.
    web: z.string().max(0).optional(),
  })
  .strict()

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {}
  if (!checkRateLimit(`propuesta-elegir:${clientIp(request, fallbackIp)}`, 5, 60 * 60 * 1000).allowed) {
    return json(429, { error: 'Ya recibimos varias elecciones. Escríbale a Mike directamente.' })
  }

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return json(400, { error: 'Formato inválido.' })
  }
  const r = Esquema.safeParse(cuerpo)
  if (!r.success) return json(400, { error: 'Revise el nombre y la elección.' })
  const d = r.data
  const plan = d.plan === 'ninguno' ? null : d.plan
  if (!plan && d.capacitacion === 'ninguna') return json(400, { error: 'Elija al menos la automatización o la capacitación.' })

  try {
    if (!(await propuestaPublicada())) return json(403, { error: 'La propuesta no está disponible.' })
    const k = calcular({ plan, capacitacion: d.capacitacion })
    await guardarEleccion({ plan: plan ?? '', capacitacion: d.capacitacion, nombre: d.nombre, cargo: d.cargo, comentario: d.comentario, calculo: k })
    const resumen = [k.plan?.etiqueta, k.capacitacion && `capacitación de ${k.capacitacion.sabados} sábados`].filter(Boolean).join(' + ')
    await notifyPropuestaEleccion({
      resumen,
      nombre: d.nombre,
      cargo: d.cargo,
      comentario: d.comentario,
      mensual: k.plan ? `${pesos(k.mensual)} (meses 1 a 18), ${pesos(k.mensualDespues)} desde el mes 19` : 'Sin automatización',
      alFirmar: pesos(k.alFirmar),
    })
    return json(200, { ok: true })
  } catch (err) {
    console.error('[propuesta-elegir]', err instanceof Error ? err.message : err)
    return json(500, { error: 'No se pudo guardar. Intente de nuevo.' })
  }
}
