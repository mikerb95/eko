import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { registrarEjecucion } from '../../../lib/automatizaciones'
import { correrDiario } from '../../../lib/finanzas/acciones'

export const prerender = false

// Tarea diaria de Finanzas (7:00 a. m. en Bogotá). La dispara una tarea
// programada en la nube de Claude, NO un cron de Vercel (decisión de Mike,
// 2026-11-25; ver src/lib/automatizaciones.ts y docs/tareas-nube-claude.md):
// avisos de vencimiento a 15, 7, 3 y 1 día hábil con escalamiento a Gerencia,
// resumen del lunes y resumen del día 1. Una sola llamada al día: no hay
// sondeo, así que no gasta CPU del tope de Vercel Hobby.
// Igual que el de talento: sin sesión, se autentica con CRON_SECRET en el
// encabezado Authorization. Cada llamada queda en /admin/automatizaciones.
function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export const GET: APIRoute = async ({ request }) => {
  const secreto = env('CRON_SECRET')
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return json({ error: 'No autorizado' }, 401)
  }
  try {
    const r = await correrDiario()
    const extras = [r.semanal && 'resumen semanal', r.mensual && 'resumen mensual'].filter(Boolean).join(' y ')
    await registrarEjecucion('finanzas', true, `${r.avisos} aviso${r.avisos === 1 ? '' : 's'} pendiente${r.avisos === 1 ? '' : 's'}, ${r.enviados} enviado${r.enviados === 1 ? '' : 's'}${extras ? `, más ${extras}` : ''}.`)
    return json({ ok: true, ...r })
  } catch (e) {
    await registrarEjecucion('finanzas', false, e instanceof Error ? e.message : 'Error sin detalle')
    return fail('cron/finanzas', e)
  }
}
