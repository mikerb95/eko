/**
 * Notificaciones por email al equipo (Resend).
 *
 * Regla de oro: **esto nunca puede tumbar una solicitud**. Si el correo falla
 * —API caída, key ausente, dominio sin verificar— la orden o el mensaje ya
 * quedaron guardados en la DB y el visitante recibe su confirmación igual. Por
 * eso ninguna función de este módulo lanza excepciones: reportan y siguen.
 *
 * Se activa solo cuando estas variables existen (ver `.env.example`):
 *   RESEND_API_KEY  — la inyecta la integración de Resend en Vercel
 *   NOTIFY_FROM     — remitente, debe estar en un dominio verificado en Resend
 *   NOTIFY_EMAIL    — destinatarios internos, separados por coma
 * Si falta alguna, el envío es un no-op silencioso (un aviso en el log) y el
 * panel sigue siendo la fuente de verdad.
 */

import type { Order } from './ops'
import type { Contact } from './contactos'
import { SITE_URL } from './site'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const TIMEOUT_MS = 8000

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

/** Destinatarios internos, tolerante a comas y espacios sueltos. */
function recipients(): string[] {
  return env('NOTIFY_EMAIL')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** ¿Está la notificación por email lista para usarse? */
export function emailConfigured(): boolean {
  return Boolean(env('RESEND_API_KEY') && env('NOTIFY_FROM') && recipients().length)
}

export interface SendResult {
  sent: boolean
  reason?: string
}

interface SendInput {
  subject: string
  html: string
  text: string
  /** Responder al cliente directamente desde la bandeja del equipo. */
  replyTo?: string
}

async function send({ subject, html, text, replyTo }: SendInput): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn('[email] sin configurar (RESEND_API_KEY / NOTIFY_FROM / NOTIFY_EMAIL); no se envía:', subject)
    return { sent: false, reason: 'not_configured' }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env('RESEND_API_KEY')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env('NOTIFY_FROM'),
        to: recipients(),
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] Resend respondió', res.status, body.slice(0, 500))
      return { sent: false, reason: `http_${res.status}` }
    }
    return { sent: true }
  } catch (e: any) {
    console.error('[email] envío fallido:', e?.name === 'TimeoutError' ? 'timeout' : e?.message || e)
    return { sent: false, reason: 'exception' }
  }
}

// ---------------------------------------------------------------- plantillas

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Row = [label: string, value: string]

/** Filas con valor vacío se omiten: nadie quiere leer "Empresa: —". */
function layout(title: string, rows: Row[], ctaLabel: string, ctaHref: string, note?: string): string {
  const cells = rows
    .filter(([, v]) => String(v || '').trim())
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#5b6b62;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#16261e;font-size:14px">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')

  return `<div style="margin:0;padding:24px;background:#f4f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(22,38,30,.08);overflow:hidden">
    <div style="padding:20px 24px;background:#16261e">
      <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em">Ekosolv · Panel</span>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 16px;font-size:18px;line-height:1.35;color:#16261e">${escapeHtml(title)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${cells}</table>
      <p style="margin:24px 0 0">
        <a href="${escapeHtml(ctaHref)}" style="display:inline-block;padding:11px 20px;background:#2f7d4f;color:#ffffff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${escapeHtml(ctaLabel)}</a>
      </p>
      ${note ? `<p style="margin:20px 0 0;color:#5b6b62;font-size:12px;line-height:1.5">${escapeHtml(note)}</p>` : ''}
    </div>
  </div>
</div>`
}

function plain(title: string, rows: Row[], ctaHref: string): string {
  const body = rows
    .filter(([, v]) => String(v || '').trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
  return `${title}\n\n${body}\n\nAbrir en el panel: ${ctaHref}\n`
}

// ------------------------------------------------------------------- avisos

/** Aviso al equipo cuando entra una nueva solicitud de recolección. */
export async function notifyNewOrder(order: Order): Promise<SendResult> {
  const who = `${order.first_name} ${order.last_name}`.trim()
  const rows: Row[] = [
    ['Consecutivo', order.consecutive],
    ['Solicitante', who],
    ['Empresa', order.company],
    ['Email', order.email],
    ['Teléfono', order.phone],
    ['Dirección', [order.address, order.address2].filter(Boolean).join(', ')],
    ['Ciudad', [order.city, order.country].filter(Boolean).join(', ')],
    ['Tipo de residuo', order.waste_type],
    ['Cantidad estimada', order.estimated_quantity],
    ['Mensaje', order.message],
  ]
  const title = `Nueva solicitud de recolección · ${order.consecutive}`
  const cta = `${SITE_URL}/admin`

  return send({
    subject: `[Ekosolv] Nueva recolección ${order.consecutive} — ${who || order.email}`,
    html: layout(title, rows, 'Gestionar en el panel', cta, 'La solicitud ya quedó registrada en el panel; este correo es solo el aviso.'),
    text: plain(title, rows, cta),
    replyTo: order.email || undefined,
  })
}

/** Aviso al equipo cuando entra un mensaje del formulario de contacto. */
export async function notifyNewContact(contact: Contact): Promise<SendResult> {
  const rows: Row[] = [
    ['Nombre', contact.name],
    ['Empresa', contact.company],
    ['Email', contact.email],
    ['Teléfono', contact.phone],
    ['Sector', contact.sector],
    ['Líneas de interés', contact.service_lines],
    ['Mensaje', contact.message],
  ]
  const title = 'Nuevo mensaje de contacto'
  const cta = `${SITE_URL}/admin`

  return send({
    subject: `[Ekosolv] Contacto — ${contact.name || contact.email}`,
    html: layout(title, rows, 'Ver en el panel', cta, 'El mensaje ya quedó registrado en el panel; este correo es solo el aviso.'),
    text: plain(title, rows, cta),
    replyTo: contact.email || undefined,
  })
}
