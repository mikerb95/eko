/**
 * Correos del módulo de Finanzas (Resend). Igual que src/lib/email.ts: nunca
 * lanza; si falla, lo informa y la obligación sigue en el panel.
 *
 * Remitente: FIN_FROM, o por defecto el dominio codebymike.net, que ya está
 * verificado en Resend (la misma RESEND_API_KEY de la sala de capacitación).
 * Trato de usted hacia el equipo de Ekosolv.
 */
import { SITE_URL } from '../site.ts'
import { pesos } from './control.ts'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const FROM_DEFECTO = 'Ekosolv Finanzas <finanzas@codebymike.net>'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export function correoConfigurado(): boolean {
  return !!env('RESEND_API_KEY')
}

export interface Envio {
  enviado: boolean
  motivo?: string
}

async function enviar(to: string[], subject: string, html: string, text: string): Promise<Envio> {
  const destinos = [...new Set(to.map((c) => c.trim().toLowerCase()).filter(Boolean))]
  if (!destinos.length) return { enviado: false, motivo: 'sin destinatarios' }
  if (!correoConfigurado()) {
    console.warn('[finanzas/correo] sin RESEND_API_KEY; no se envía:', subject)
    return { enviado: false, motivo: 'correo sin configurar' }
  }
  try {
    const res = await fetch(env('FIN_RESEND_URL') || RESEND_ENDPOINT, {
      method: 'POST',
      headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env('FIN_FROM') || FROM_DEFECTO, to: destinos, subject, html, text }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[finanzas/correo] Resend respondió', res.status, (await res.text().catch(() => '')).slice(0, 300))
      return { enviado: false, motivo: `http_${res.status}` }
    }
    return { enviado: true }
  } catch (e: any) {
    console.error('[finanzas/correo] envío fallido:', e?.message || e)
    return { enviado: false, motivo: 'excepcion' }
  }
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const fecha = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${Number(m[3])} de ${meses[Number(m[2]) - 1]} de ${m[1]}`
}

const url = (q = '') => `${SITE_URL}/admin/finanzas${q}`

type Fila = [string, string]

/** Plantilla con bgcolor además de background-color (Gmail a veces borra `background`). */
function plantilla(titulo: string, intro: string, filas: Fila[], boton: string, href: string, nota = '', color = '#2f7d4f'): string {
  const celdas = filas
    .filter(([, v]) => String(v || '').trim())
    .map(
      ([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5b6b62;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#16261e;font-size:14px">${esc(v)}</td></tr>`,
    )
    .join('')
  return `<div style="margin:0;padding:24px;background-color:#f4f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden">
    <tr><td bgcolor="#16261e" style="padding:20px 24px;background-color:#16261e"><span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em">Ekosolv · Finanzas</span></td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:18px;line-height:1.35;color:#16261e">${esc(titulo)}</h1>
      ${intro ? `<p style="margin:0 0 16px;color:#3d4b44;font-size:14px;line-height:1.55">${esc(intro)}</p>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${celdas}</table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0"><tr><td bgcolor="${color}" style="border-radius:8px;background-color:${color}">
        <a href="${esc(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">${esc(boton)}</a>
      </td></tr></table>
      ${nota ? `<p style="margin:20px 0 0;color:#5b6b62;font-size:12px;line-height:1.5">${esc(nota)}</p>` : ''}
    </td></tr>
  </table>
</div>`
}

function plano(titulo: string, intro: string, filas: Fila[], href: string, nota = ''): string {
  const cuerpo = filas.filter(([, v]) => String(v || '').trim()).map(([k, v]) => `${k}: ${v}`).join('\n')
  return `${titulo}\n\n${intro ? intro + '\n\n' : ''}${cuerpo}\n\nAbrir en el panel: ${href}\n${nota ? '\n' + nota + '\n' : ''}`
}

const NOTA_LIMITE = 'El panel no entra a portales ni hace pagos: prepara, verifica y avisa. La persona ejecuta y Gerencia aprueba.'

export interface ObligacionCorreo {
  id: number
  concepto: string
  entidad: string
  periodo: string
  vence: string
  estado: string
  responsable?: string
}

/** Aviso de vencimiento (15, 7, 3, 1 día hábil). Con escalamiento, el asunto lo dice. */
export async function avisoVencimiento(p: {
  to: string[]
  obligacion: ObligacionCorreo
  plazo: string
  estadoTexto: string
  escalado: boolean
}): Promise<Envio> {
  const o = p.obligacion
  const titulo = p.escalado ? `Sin cerrar a ${p.plazo.toLowerCase().replace('faltan ', '').replace('falta ', '')}: ${o.concepto}` : `${p.plazo}: ${o.concepto}`
  const intro = p.escalado
    ? 'Esta obligación sigue sin presentarse y está por vencer. El aviso también le llega a Gerencia.'
    : 'Este es un recordatorio del calendario tributario de Ekosolv.'
  const filas: Fila[] = [
    ['Obligación', o.concepto],
    ['Entidad', o.entidad],
    ['Periodo', o.periodo],
    ['Vence', fecha(o.vence)],
    ['Plazo', p.plazo],
    ['Estado actual', p.estadoTexto],
    ['Responsable', o.responsable || ''],
  ]
  const href = url(`?ob=${o.id}`)
  return enviar(
    p.to,
    `${p.escalado ? '[Gerencia] ' : ''}${p.plazo}: ${o.concepto} (${o.periodo})`,
    plantilla(titulo, intro, filas, 'Abrir la obligación', href, NOTA_LIMITE, p.escalado ? '#b4442f' : '#2f7d4f'),
    plano(titulo, intro, filas, href, NOTA_LIMITE),
  )
}

/** A Gerencia: hay un pago esperando su visto bueno. */
export async function pagoPorAprobar(p: { to: string[]; pagoId: number; obligacion: ObligacionCorreo; valor: number; cuenta: string; preparadoPor: string }): Promise<Envio> {
  const titulo = 'Hay un pago esperando su visto bueno'
  const intro = 'El control antes de pagar ya revisó que no esté pagado, que el valor sea el del borrador y que la entidad, la referencia y la cuenta estén autorizadas. Falta su aprobación.'
  const filas: Fila[] = [
    ['Obligación', p.obligacion.concepto],
    ['Periodo', p.obligacion.periodo],
    ['Valor', pesos(p.valor)],
    ['Cuenta de origen', p.cuenta],
    ['Vence', fecha(p.obligacion.vence)],
    ['Preparado por', p.preparadoPor],
  ]
  const href = url(`?pago=${p.pagoId}`)
  return enviar(p.to, `Pago por aprobar: ${p.obligacion.concepto} (${pesos(p.valor)})`, plantilla(titulo, intro, filas, 'Revisar y aprobar', href, 'La aprobación se da dentro del panel, con su usuario.'), plano(titulo, intro, filas, href))
}

/** A Finanzas: Gerencia aprobó o rechazó el pago. */
export async function pagoDecidido(p: { to: string[]; pagoId: number; obligacion: ObligacionCorreo; valor: number; aprobado: boolean; por: string; motivo?: string }): Promise<Envio> {
  const titulo = p.aprobado ? 'Gerencia aprobó el pago' : 'Gerencia devolvió el pago'
  const intro = p.aprobado
    ? 'Ya puede pagar en el portal. Antes de confirmar, siga la lista de verificación del panel pantalla por pantalla.'
    : 'Revise el motivo, corrija y vuelva a preparar el pago.'
  const filas: Fila[] = [
    ['Obligación', p.obligacion.concepto],
    ['Periodo', p.obligacion.periodo],
    ['Valor', pesos(p.valor)],
    [p.aprobado ? 'Aprobado por' : 'Devuelto por', p.por],
    ['Motivo', p.motivo || ''],
  ]
  const href = url(`?pago=${p.pagoId}`)
  return enviar(p.to, `${p.aprobado ? 'Pago aprobado' : 'Pago devuelto'}: ${p.obligacion.concepto}`, plantilla(titulo, intro, filas, p.aprobado ? 'Ver la lista de verificación' : 'Abrir el pago', href, NOTA_LIMITE, p.aprobado ? '#2f7d4f' : '#b4442f'), plano(titulo, intro, filas, href, NOTA_LIMITE))
}

export interface LineaResumen {
  concepto: string
  periodo: string
  vence: string
  estado: string
  plazo: string
}

function tablaLineas(titulo: string, lineas: LineaResumen[], color: string): string {
  if (!lineas.length) return ''
  const filas = lineas
    .map(
      (l) => `<tr><td style="padding:8px 8px 8px 0;border-bottom:1px solid #e6ebe8;font-size:13px;color:#16261e"><b>${esc(l.concepto)}</b><br><span style="color:#5b6b62">${esc(l.periodo)}</span></td><td style="padding:8px;border-bottom:1px solid #e6ebe8;font-size:13px;color:#16261e;white-space:nowrap">${esc(fecha(l.vence))}<br><span style="color:${color}">${esc(l.plazo)}</span></td><td style="padding:8px 0 8px 8px;border-bottom:1px solid #e6ebe8;font-size:13px;color:#3d4b44;white-space:nowrap">${esc(l.estado)}</td></tr>`,
    )
    .join('')
  return `<h2 style="margin:20px 0 6px;font-size:15px;color:${color}">${esc(titulo)} (${lineas.length})</h2><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">${filas}</table>`
}

/** Resumen del lunes (próximas dos semanas y atrasadas) o del mes. */
export async function resumen(p: {
  to: string[]
  tipo: 'semanal' | 'mensual'
  titulo: string
  atrasadas: LineaResumen[]
  proximas: LineaResumen[]
  extra: Fila[]
  nota?: string
}): Promise<Envio> {
  const href = url()
  const extra = p.extra.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:8px">${p.extra.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#5b6b62;font-size:13px">${esc(k)}</td><td style="padding:6px 0;color:#16261e;font-size:14px;font-weight:600">${esc(v)}</td></tr>`).join('')}</table>`
    : ''
  const vacio = !p.atrasadas.length && !p.proximas.length ? '<p style="margin:0;color:#3d4b44;font-size:14px">No hay obligaciones atrasadas ni por vencer en las próximas dos semanas.</p>' : ''
  const html = `<div style="margin:0;padding:24px;background-color:#f4f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden">
    <tr><td bgcolor="#16261e" style="padding:20px 24px;background-color:#16261e"><span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em">Ekosolv · Finanzas</span></td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 8px;font-size:18px;line-height:1.35;color:#16261e">${esc(p.titulo)}</h1>
      ${extra}${vacio}
      ${tablaLineas('Atrasadas', p.atrasadas, '#b4442f')}
      ${tablaLineas(p.tipo === 'semanal' ? 'Vencen en las próximas dos semanas' : 'Vencen este mes', p.proximas, '#2f7d4f')}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 0"><tr><td bgcolor="#2f7d4f" style="border-radius:8px;background-color:#2f7d4f"><a href="${esc(href)}" style="display:inline-block;padding:12px 22px;color:#ffffff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600">Abrir el calendario</a></td></tr></table>
      ${p.nota ? `<p style="margin:20px 0 0;color:#5b6b62;font-size:12px;line-height:1.5">${esc(p.nota)}</p>` : ''}
    </td></tr>
  </table>
</div>`
  const lin = (t: string, ls: LineaResumen[]) => (ls.length ? `\n${t}:\n${ls.map((l) => `- ${l.concepto} (${l.periodo}): ${fecha(l.vence)}, ${l.plazo}, ${l.estado}`).join('\n')}\n` : '')
  const text = `${p.titulo}\n${p.extra.map(([k, v]) => `${k}: ${v}`).join('\n')}\n${lin('Atrasadas', p.atrasadas)}${lin('Próximas', p.proximas)}\nAbrir el calendario: ${href}\n`
  return enviar(p.to, p.titulo, html, text)
}
