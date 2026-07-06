import type { APIRoute } from 'astro'
import { listUsers, upsertUser, deleteUser, ROLES, type Role, type UserInput } from '../../../lib/users'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const users = await listUsers()
    return json({ users })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const username = String(b.username ?? '').trim().toLowerCase()
  const name = String(b.name ?? '').trim()
  const role = String(b.role ?? '')
  if (!username || !name) return json({ error: 'Usuario y nombre son obligatorios' }, 400)
  if (!/^[a-z0-9@._-]{3,60}$/.test(username)) return json({ error: 'Usuario inválido (mín. 3 caracteres, letras/números/@._-)' }, 400)
  if (!(ROLES as readonly string[]).includes(role)) return json({ error: 'Rol inválido' }, 400)

  const password = b.password ? String(b.password) : undefined
  if (password && password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)

  const u: UserInput = {
    id: b.id ? Number(b.id) : undefined,
    username,
    name,
    role: role as Role,
    active: b.active !== false && b.active !== 0 && b.active !== '0',
    password,
  }

  // Un admin no puede quitarse a sí mismo el rol ni desactivarse por accidente
  if (u.id && locals.username) {
    const self = (await listUsers()).find((x) => x.username === locals.username)
    if (self && self.id === u.id && (u.role !== 'admin' || !u.active)) {
      return json({ error: 'No puedes degradar o desactivar tu propia cuenta' }, 400)
    }
  }

  try {
    const id = await upsertUser(u)
    return json({ ok: true, id })
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (msg.includes('UNIQUE')) return json({ error: 'Ese usuario ya existe' }, 400)
    return json({ error: msg }, 500)
  }
}

export const DELETE: APIRoute = async ({ url, locals }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)
  const self = (await listUsers()).find((x) => x.username === locals.username)
  if (self && self.id === id) return json({ error: 'No puedes eliminar tu propia cuenta' }, 400)
  try {
    await deleteUser(id)
    return json({ ok: true })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 400)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
