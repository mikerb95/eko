import type { APIRoute } from 'astro'
import { fail, json } from '../../../../lib/apiError'
import { listarActos } from '../../../../lib/agente/datos'
import { procesarActo, recibirActo } from '../../../../lib/agente/procesar'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    return json({ actos: await listarActos() })
  } catch (e) {
    return fail('cumplimiento/actos', e)
  }
}

/**
 * Sube un acto desde el panel (multipart: `archivo` y `fecha_notificacion`).
 * Se procesa en la misma petición: el consultor ve la alerta al terminar. Con
 * un PDF largo puede tardar varios segundos; el panel muestra el progreso.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return json({ error: 'Formulario inválido' }, 400)
  }
  const archivo = form.get('archivo')
  if (!(archivo instanceof File)) return json({ error: 'Falta el archivo' }, 400)
  try {
    const { id, duplicado } = await recibirActo({
      nombre: archivo.name || 'documento',
      tipo: archivo.type,
      bytes: new Uint8Array(await archivo.arrayBuffer()),
      fechaNotificacion: String(form.get('fecha_notificacion') ?? '').trim(),
      usuario: String((locals as any).username || (locals as any).user || ''),
    })
    if (!duplicado) await procesarActo(id)
    return json({ ok: true, id, duplicado })
  } catch (e) {
    return fail('cumplimiento/actos', e)
  }
}
