// Respuestas de error de la API.
//
// La regla: un fallo de infraestructura nunca viaja al cliente con su mensaje
// original. `ConnectionFailed(file:./data/cms.db: 14)` le dice a un atacante qué
// motor de base se usa, dónde vive el archivo y que ahora mismo está caída.
// Eso se registra en el servidor y al cliente le llega una frase genérica.
//
// La excepción es `UserError`: errores de negocio cuyo mensaje está escrito
// para que lo lea una persona ("No puedes eliminar al último administrador").
// Esos sí se muestran, porque son la respuesta útil a lo que la persona intentó.

export class UserError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'UserError'
    this.status = status
  }
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  })
}

/**
 * Convierte una excepción en respuesta. `scope` es la etiqueta del log, para
 * poder rastrear el error real en los logs de Vercel.
 */
export function fail(scope: string, e: unknown, fallback = 'Ocurrió un error procesando la solicitud.') {
  if (e instanceof UserError) return json({ error: e.message }, e.status)
  console.error(`[${scope}]`, e instanceof Error ? e.stack || e.message : e)
  return json({ error: fallback }, 500)
}
