import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { registrarEjecucion } from '../../../lib/automatizaciones'
import { hoyEnBogota } from '../../../lib/agente/diasHabiles'
import { notifyResumenTalento, talentoEmailConfigured } from '../../../lib/email'
import { cargarEstado } from '../../../lib/talento/datos'
import { armarResumen } from '../../../lib/talento/resumen'

export const prerender = false

// Resumen semanal de talento humano (lunes 7:00 a. m. en Bogotá). Lo dispara
// una tarea programada en la nube de Claude, NO un cron de Vercel (decisión
// de Mike, 2026-11-25; ver docs/tareas-nube-claude.md). Vive fuera de
// /api/admin porque la tarea no tiene sesión: se autentica con CRON_SECRET
// en el encabezado Authorization. Sin CRON_SECRET configurado no responde a
// nadie. Cada llamada queda en /admin/automatizaciones.
function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export const GET: APIRoute = async ({ request }) => {
  const secreto = env('CRON_SECRET')
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return json({ error: 'No autorizado' }, 401)
  }
  if (!talentoEmailConfigured()) {
    await registrarEjecucion('talento', false, 'El correo de RR.HH. no está configurado.')
    return json({ ok: true, enviado: false, motivo: 'correo sin configurar' })
  }
  try {
    const resumen = armarResumen(await cargarEstado(hoyEnBogota()))
    // Un lunes sin nada que contar no llena la bandeja.
    if (resumen.vacio) {
      await registrarEjecucion('talento', true, 'Sin pendientes: no se envió correo.')
      return json({ ok: true, enviado: false, motivo: 'sin pendientes' })
    }
    const r = await notifyResumenTalento(resumen)
    await registrarEjecucion('talento', r.sent, r.sent ? 'Resumen enviado.' : `No se envió: ${r.reason ?? 'sin detalle'}.`)
    return json({ ok: true, enviado: r.sent, motivo: r.reason ?? null })
  } catch (e) {
    await registrarEjecucion('talento', false, e instanceof Error ? e.message : 'Error sin detalle')
    return fail('cron/talento-resumen', e)
  }
}
