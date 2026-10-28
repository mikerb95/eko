import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { asegurarEsquema, cliente } from '../../../../lib/db'
import { reporteMensual } from '../../../../lib/asistente/consumo'
import { usuarioDeSesion } from '../../../../lib/asistente/motor'

export const prerender = false

// Reporte mensual del consumo del asistente, para facturarlo. Solo admin.
//   GET ?mes=AAAA-MM            JSON
//   GET ?mes=AAAA-MM&formato=csv  archivo CSV por usuario

export const GET: APIRoute = async ({ url, locals }) => {
  const u = usuarioDeSesion(locals)
  if (u?.rol !== 'admin') return json({ error: 'Solo administradores' }, 403)
  const mes = url.searchParams.get('mes') || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date()).slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(mes)) return json({ error: 'Mes inválido: use AAAA-MM' }, 400)
  try {
    await asegurarEsquema()
    const r = await reporteMensual(cliente(), mes)
    if (url.searchParams.get('formato') === 'csv') {
      const filas = [['usuario', 'preguntas_al_modelo', 'conversaciones', 'usd_estimado'], ...r.porUsuario.map((p) => [p.usuario, p.llamadas, p.conversaciones, p.usd.toFixed(4)])]
      filas.push(['TOTAL', r.llamadas, r.conversaciones, r.totalUsd.toFixed(4)])
      const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      return new Response(`${csv}\n`, {
        headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="asistente-consumo-${mes}.csv"`, 'cache-control': 'no-store' },
      })
    }
    return json(r, 200, { 'cache-control': 'no-store' })
  } catch (e) {
    return fail('asistente/consumo', e)
  }
}
