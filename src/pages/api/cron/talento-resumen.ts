import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { notifyResumenTalento, talentoEmailConfigured } from '../../../lib/email'
import { cargarEstado } from '../../../lib/talento/datos'
import { armarResumen } from '../../../lib/talento/resumen'

export const prerender = false

// Resumen semanal de talento humano (cron de vercel.json, lunes 7:00 a. m.
// en Bogotá). Vive fuera de /api/admin porque el cron no tiene sesión: se
// autentica con CRON_SECRET, que Vercel manda solo en el encabezado
// Authorization. Sin CRON_SECRET configurado no responde a nadie.
function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export const GET: APIRoute = async ({ request }) => {
  const secreto = env('CRON_SECRET')
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return json({ error: 'No autorizado' }, 401)
  }
  if (!talentoEmailConfigured()) return json({ ok: true, enviado: false, motivo: 'correo sin configurar' })
  try {
    const resumen = armarResumen(await cargarEstado(hoyEnBogota()))
    // Un lunes sin nada que contar no llena la bandeja.
    if (resumen.vacio) return json({ ok: true, enviado: false, motivo: 'sin pendientes' })
    const r = await notifyResumenTalento(resumen)
    return json({ ok: true, enviado: r.sent, motivo: r.reason ?? null })
  } catch (e) {
    return fail('cron/talento-resumen', e)
  }
}
