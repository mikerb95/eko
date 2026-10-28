import type { APIRoute } from 'astro'
import { fail, json, UserError } from '../../../../lib/apiError'
import { asegurarEsquema, cliente } from '../../../../lib/db'
import { usuarioDeSesion } from '../../../../lib/asistente/motor'
import { estadoDelDia, guardarTopes } from '../../../../lib/asistente/topes'

export const prerender = false

// Topes de gasto diario del asistente (empresa y por persona). Verlos y
// cambiarlos es solo del admin: el middleware deja escribir en
// /api/admin/asistente a todos los roles para que puedan preguntar.

export const GET: APIRoute = async ({ locals }) => {
  const u = usuarioDeSesion(locals)
  if (u?.rol !== 'admin') return json({ error: 'Solo administradores' }, 403)
  try {
    await asegurarEsquema()
    return json(await estadoDelDia(cliente(), u.usuario), 200, { 'cache-control': 'no-store' })
  } catch (e) {
    return fail('asistente/topes', e)
  }
}

export const PUT: APIRoute = async ({ request, locals }) => {
  const u = usuarioDeSesion(locals)
  if (u?.rol !== 'admin') return json({ error: 'Solo administradores' }, 403)
  const b = await request.json().catch(() => ({}))
  const cambios = {
    ...(b?.empresaUsd !== undefined ? { empresaUsd: Number(b.empresaUsd) } : {}),
    ...(b?.usuarioUsd !== undefined ? { usuarioUsd: Number(b.usuarioUsd) } : {}),
  }
  try {
    await asegurarEsquema()
    try {
      await guardarTopes(cliente(), cambios)
    } catch (e) {
      throw new UserError(e instanceof Error ? e.message : 'Tope inválido')
    }
    return json(await estadoDelDia(cliente(), u.usuario))
  } catch (e) {
    return fail('asistente/topes', e)
  }
}
