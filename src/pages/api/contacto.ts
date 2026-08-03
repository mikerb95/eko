import type { APIRoute } from 'astro'
import { createContact } from '../../lib/contactos'
import { notifyNewContact } from '../../lib/email'
import { queueContactAsLead } from '../../lib/zoho'
import { defer } from '../../lib/defer'
import { checkRateLimit, clientIp } from '../../lib/rateLimit'
import { consentGranted, POLITICA_VERSION } from '../../lib/legal'

export const prerender = false

const MAX = 2000

// Público: 10 mensajes por IP cada 10 minutos.
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
  const { allowed, retryAfterSeconds } = checkRateLimit(`contacto:${ip}`, RATE_MAX, RATE_WINDOW_MS)
  if (!allowed) {
    return json(
      { error: 'Demasiados mensajes. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.' },
      429,
      { 'Retry-After': String(retryAfterSeconds) },
    )
  }

  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  // Honeypot: campo oculto que solo un bot rellenaría.
  if (String(b.website ?? '').trim()) return json({ ok: true })

  const name = field(b, 'name')
  const email = field(b, 'email')
  if (!name || !email) return json({ error: 'Nombre y email son obligatorios' }, 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email inválido' }, 400)

  try {
    const contact = await createContact({
      name,
      email,
      company: field(b, 'company'),
      phone: field(b, 'phone', 50),
      sector: field(b, 'sector', 100),
      service_lines: field(b, 'service_lines', 300),
      message: field(b, 'message', MAX),
      source: 'web',
    })
    // Encolar para Zoho es una escritura a la misma DB y no lanza: se espera.
    // Que quede en la bandeja es lo que garantiza que el lead no se pierda
    // aunque Zoho todavía no esté conectado (src/lib/zohoOutbox.ts).
    await queueContactAsLead(contact)
    // El aviso al equipo no condiciona la respuesta: el mensaje ya está
    // guardado. Va diferido para no cobrarle al visitante la latencia de Resend.
    // (`await` sobre defer es gratis en Vercel: entrega la promesa al runtime y
    // vuelve de inmediato. Fuera de Vercel sí espera, como hasta ahora.)
    await defer('email contacto', notifyNewContact(contact))
    return json({ ok: true })
  } catch (e: any) {
    console.error('[contacto] createContact failed:', e?.message || e)
    return json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo o escríbenos por WhatsApp.' }, 500)
  }
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  })
}
