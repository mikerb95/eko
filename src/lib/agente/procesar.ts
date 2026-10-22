/**
 * El recorrido completo de un acto: recibirlo, leerlo con la IA, cruzarlo con
 * su expediente y dejar la alerta para el consultor.
 *
 * Está partido en dos pasos a propósito:
 *   1. `recibirActo` guarda el archivo y responde enseguida. Nunca falla por la
 *      IA: si no hay clave o la API está caída, el acto queda guardado.
 *   2. `procesarActo` hace la parte lenta (la IA puede tardar varios segundos
 *      con un PDF largo) y se puede repetir: reprocesar reemplaza la alerta del
 *      acto en vez de duplicarla.
 */
import { createHash } from 'node:crypto'
import { UserError } from '../apiError'
import { armarAlerta } from './alerta'
import {
  actualizarActo,
  buscarActoPorHash,
  crearActo,
  guardarAlertaDeActo,
  leerActo,
  leerArchivo,
  listarExpedientes,
  listarReglas,
} from './datos'
import { hoyEnBogota } from './diasHabiles'
import { fechaValida } from './extraccion'
import { ErrorIA, extraerActo, iaConfigurada, type Documento } from './ia'

/** Límite práctico: Vercel no acepta cuerpos de más de 4,5 MB. */
export const TAMANO_MAXIMO = 4 * 1024 * 1024

const TIPOS_ACEPTADOS: Record<string, Documento['tipo']> = {
  'application/pdf': 'application/pdf',
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'text/plain': 'text/plain',
}

export async function recibirActo(entrada: {
  nombre: string
  tipo: string
  bytes: Uint8Array
  fechaNotificacion: string
  usuario: string
  origen?: string
}): Promise<{ id: number; duplicado: boolean }> {
  const tipo = TIPOS_ACEPTADOS[entrada.tipo]
  if (!tipo) throw new UserError('Formato no admitido. Sube un PDF, una imagen (PNG o JPG) o un texto.')
  if (!entrada.bytes.length) throw new UserError('El archivo está vacío.')
  if (entrada.bytes.length > TAMANO_MAXIMO) throw new UserError('El archivo supera los 4 MB.')

  const fecha = entrada.fechaNotificacion ? fechaValida(entrada.fechaNotificacion) : ''
  if (entrada.fechaNotificacion && !fecha) throw new UserError('La fecha de notificación no es válida.')

  const hash = createHash('sha256').update(entrada.bytes).digest('hex')
  const previo = await buscarActoPorHash(hash)
  if (previo) return { id: previo.id, duplicado: true }

  const contenido =
    tipo === 'text/plain' ? new TextDecoder().decode(entrada.bytes) : Buffer.from(entrada.bytes).toString('base64')

  const id = await crearActo({
    origen: entrada.origen || 'manual',
    archivo_nombre: entrada.nombre.slice(0, 200),
    archivo_tipo: tipo,
    hash,
    fecha_notificacion: fecha,
    subido_por: entrada.usuario,
    contenido,
  })
  return { id, duplicado: false }
}

export async function procesarActo(id: number): Promise<void> {
  const acto = await leerActo(id)
  if (!acto) throw new UserError('El acto no existe.', 404)

  if (!iaConfigurada()) {
    await actualizarActo(id, { estado: 'sin_clave', error: 'Falta ANTHROPIC_API_KEY: se procesará cuando se configure.' })
    return
  }

  const datos = await leerArchivo(id)
  if (!datos) {
    await actualizarActo(id, { estado: 'error', error: 'No se encontró el archivo original.' })
    return
  }

  try {
    const r = await extraerActo(
      { datos, tipo: acto.archivo_tipo as Documento['tipo'] },
      { fechaNotificacion: acto.fecha_notificacion },
    )
    const [expedientes, reglas] = await Promise.all([listarExpedientes(), listarReglas()])
    const alerta = armarAlerta({
      extraccion: r.extraccion,
      expedientes,
      reglas,
      fechaNotificacion: acto.fecha_notificacion,
      hoy: hoyEnBogota(),
    })
    await guardarAlertaDeActo(id, alerta)
    await actualizarActo(id, {
      estado: 'procesado',
      error: '',
      extraccion: r.extraccion,
      modelo: r.modelo,
      tokens_entrada: r.tokensEntrada,
      tokens_salida: r.tokensSalida,
      expediente_id: alerta.expediente_id,
    })
  } catch (e: any) {
    // El mensaje de ErrorIA está escrito para el consultor. Cualquier otro
    // error (red, base) se registra completo en el servidor y al panel llega
    // una frase genérica, como en `apiError.ts`.
    const mensaje = e instanceof ErrorIA ? e.message : 'No se pudo procesar el documento. Intenta reprocesarlo.'
    if (!(e instanceof ErrorIA)) console.error('[agente] procesarActo', id, e?.stack || e)
    await actualizarActo(id, { estado: 'error', error: mensaje })
  }
}
