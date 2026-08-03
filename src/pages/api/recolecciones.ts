import type { APIRoute } from 'astro'
import { createOrder } from '../../lib/ops'
import { notifyNewOrder } from '../../lib/email'
import { queueOrderAsLead, queueOrderAsSubscriber } from '../../lib/zoho'
import { defer } from '../../lib/defer'
import { checkRateLimit, clientIp } from '../../lib/rateLimit'
import { consentGranted, POLITICA_VERSION } from '../../lib/legal'

export const prerender = false

const MAX = 2000

// Endpoint público: 10 solicitudes por IP cada 10 minutos. Suficiente para un
// uso legítimo (una persona solicita una recolección de vez en cuando) y frena
// el relleno masivo de la tabla de órdenes.
const RATE_MAX = 10
const RATE_WINDOW_MS = 10 * 60 * 1000

function field(b: any, key: string, max = 200): string {
  return String(b[key] ?? '').trim().slice(0, max)
}

export const POST: APIRoute = async (context) => {
  const { request } = context
  let fallbackIp = 'unknown'
  try {
    fallbackIp = context.clientAddress
  } catch {
    // clientAddress no disponible; nos quedamos con el header.
  }
  const ip = clientIp(request, fallbackIp)
  const { allowed, retryAfterSeconds } = checkRateLimit(`recoleccion:${ip}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.' }),
      { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(retryAfterSeconds) } },
    )
  }

  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  // Honeypot: los bots suelen rellenar todos los campos
  if (String(b.website ?? '').trim()) return json({ ok: true, consecutive: 'REC' })

  const first_name = field(b, 'first_name')
  const last_name = field(b, 'last_name')
  const email = field(b, 'email')
  const phone = field(b, 'phone', 50)
  const address = field(b, 'address', 300)
  const city = field(b, 'city')

  if (!first_name || !last_name || !email || !phone || !address || !city) {
    return json({ error: 'Faltan campos obligatorios' }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Email inválido' }, 400)
  }
  // Sin autorización no se guarda nada. La validación del cliente es cortesía;
  // esta es la que cuenta, porque el endpoint es público y cualquiera puede
  // hacer POST sin pasar por el formulario.
  if (!consentGranted(b.consent)) {
    return json({ error: 'Falta la autorización de tratamiento de datos personales.' }, 400)
  }

  try {
    const order = await createOrder({
      first_name,
      last_name,
      email,
      phone,
      company: field(b, 'company'),
      country: field(b, 'country', 100) || 'Colombia',
      address,
      address2: field(b, 'address2', 300),
      city,
      postal_code: field(b, 'postal_code', 20),
      waste_type: field(b, 'waste_type', 50),
      estimated_quantity: field(b, 'estimated_quantity', 100),
      message: field(b, 'message', MAX),
      source: 'web',
      consent_version: POLITICA_VERSION,
      consent_ip: ip,
      // Casilla opcional y aparte de la autorización de tratamiento: es otra
      // finalidad. Si no llega, el correo no entra a ninguna lista de difusión.
      marketing: consentGranted(b.marketing),
    })
    // Encolar para Zoho es una escritura a la misma DB y no lanza: se espera.
    // Que quede en la bandeja es lo que garantiza que el lead no se pierda
    // aunque Zoho todavía no esté conectado (src/lib/zohoOutbox.ts).
    await queueOrderAsLead(order)
    // Solo hace algo si el titular marcó la casilla de comunicaciones.
    await queueOrderAsSubscriber(order)
    // El aviso al equipo no condiciona la respuesta: la orden ya está guardada.
    // Va diferido para no cobrarle al visitante la latencia de Resend; en Vercel
    // `defer` entrega la promesa al runtime y vuelve de inmediato.
    await defer('email recolección', notifyNewOrder(order))
    return json({ ok: true, consecutive: order.consecutive })
  } catch (e: any) {
    console.error('[recolecciones] createOrder failed:', e?.message || e)
    return json({ error: 'No se pudo registrar la solicitud. Intenta de nuevo o escríbenos por WhatsApp.' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
