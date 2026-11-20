/**
 * Bitácora de lo que pasa en el sitio (tabla `bitacora` de esquema.ts). Solo
 * agrega filas: es el respaldo de lo que otras tablas reemplazan y el único
 * registro de los inicios de sesión. Solo servidor.
 *
 * Anotar nunca rompe la acción principal: si la base falla aquí, se deja en el
 * log y la persona sigue (perder una línea de bitácora es menos grave que
 * perder el voto o el inicio de sesión que la generó).
 */
import { asegurarEsquema, cliente } from './db.ts'

export type TipoBitacora =
  | 'login' // entró al panel o a la academia con usuario y contraseña
  | 'login_fallido'
  | 'logout'
  | 'sala_registro' // se registró desde el QR (nombre, correo y área tal como los escribió)
  | 'sala_entrada' // abrió el enlace del correo en el celular
  | 'pc_vinculado' // abrió la presentación en su PC con el código
  | 'voto' // cada respuesta, también las que luego cambió
  | 'opinion' // envió (o corrigió) el formulario de cierre de su área
  | 'escena' // quien dicta movió la presentación

export async function anotar(
  tipo: TipoBitacora,
  datos: { quien?: string; taller?: number; detalle?: unknown; ip?: string } = {},
): Promise<void> {
  try {
    await asegurarEsquema()
    const detalle = datos.detalle == null ? '' : typeof datos.detalle === 'string' ? datos.detalle : JSON.stringify(datos.detalle)
    await cliente().execute({
      sql: 'INSERT INTO bitacora (tipo, quien, taller, detalle, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [tipo, String(datos.quien ?? '').slice(0, 200), datos.taller ?? 0, detalle.slice(0, 4000), String(datos.ip ?? '').slice(0, 100), new Date().toISOString()],
    })
  } catch (e: any) {
    console.error(`[bitacora] no se pudo anotar ${tipo}:`, e?.message || e)
  }
}
