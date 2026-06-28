import type { APIRoute } from 'astro'
import { upsertNormativa, deleteNormativa, type Normativa } from '../../../lib/cms'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  let b: any
  try {
    b = await request.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const code = String(b.code ?? '').trim()
  const title = String(b.title ?? '').trim()
  if (!code || !title) return json({ error: 'Código y título son obligatorios' }, 400)

  let tags: string[] = []
  if (Array.isArray(b.tags)) tags = b.tags.map((t: any) => String(t).trim()).filter(Boolean)
  else if (typeof b.tags === 'string') tags = b.tags.split(',').map((t: string) => t.trim()).filter(Boolean)

  const n: Normativa = {
    id: b.id ? Number(b.id) : undefined,
    col: Number(b.col) === 2 ? 2 : 1,
    position: Number.isFinite(Number(b.position)) ? Number(b.position) : 0,
    code,
    title,
    body: String(b.body ?? '').trim(),
    tags,
  }

  try {
    const id = await upsertNormativa(n)
    return json({ ok: true, id })
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500)
  }
}

export const DELETE: APIRoute = async ({ url }) => {
  const id = Number(url.searchParams.get('id'))
  if (!id) return json({ error: 'id requerido' }, 400)
  await deleteNormativa(id)
  return json({ ok: true })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}
