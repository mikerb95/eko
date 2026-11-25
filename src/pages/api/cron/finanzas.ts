import type { APIRoute } from 'astro'
import { fail, json } from '../../../lib/apiError'
import { correrDiario } from '../../../lib/finanzas/acciones'

export const prerender = false

// Tarea diaria de Finanzas (cron de vercel.json, 7:00 a. m. en Bogotá):
// avisos de vencimiento a 15, 7, 3 y 1 día hábil con escalamiento a Gerencia,
// resumen del lunes y resumen del día 1. Una sola llamada al día: no hay
// sondeo, así que no gasta CPU del tope de Vercel Hobby.
// Igual que el de talento: sin sesión, se autentica con CRON_SECRET, que
// Vercel manda solo en el encabezado Authorization.
function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export const GET: APIRoute = async ({ request }) => {
  const secreto = env('CRON_SECRET')
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return json({ error: 'No autorizado' }, 401)
  }
  try {
    return json({ ok: true, ...(await correrDiario()) })
  } catch (e) {
    return fail('cron/finanzas', e)
  }
}
