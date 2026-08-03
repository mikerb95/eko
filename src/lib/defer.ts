/**
 * Trabajo diferido: lo que debe ocurrir *después* de responderle al visitante.
 *
 * Los formularios públicos guardan en la DB y luego disparan efectos externos
 * (aviso por email, sincronización con Zoho). Esperar a esas APIs antes de
 * responder le cuesta al visitante entre medio segundo y el timeout completo si
 * el proveedor está lento, y no le aporta nada: su solicitud ya quedó guardada.
 *
 * En Vercel el runtime expone un `waitUntil` que mantiene viva la función
 * mientras la promesa termina, aunque la respuesta ya se haya enviado. Se accede
 * por el símbolo global que publica el runtime, sin depender del paquete
 * `@vercel/functions` (mismo criterio que `auth.ts`: cero dependencias externas
 * para algo que son cuatro líneas).
 *
 * Fuera de Vercel (astro dev, `astro preview`) no hay ese contexto: ahí se
 * espera la promesa, que es exactamente el comportamiento de siempre. Nunca se
 * deja una promesa suelta sin `catch`, porque un rechazo no capturado sí puede
 * tumbar el proceso.
 */

const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')

type WaitUntil = (promise: Promise<unknown>) => void

function runtimeWaitUntil(): WaitUntil | null {
  const ctx = (globalThis as any)[REQUEST_CONTEXT]?.get?.()
  return typeof ctx?.waitUntil === 'function' ? ctx.waitUntil.bind(ctx) : null
}

/**
 * Ejecuta `promise` sin bloquear la respuesta cuando el runtime lo permite.
 * Los errores se registran y se tragan: por definición ya no hay a quién
 * reportárselos, el visitante recibió su confirmación hace rato.
 */
export async function defer(label: string, promise: Promise<unknown>): Promise<void> {
  const guarded = promise.catch((e: any) => {
    console.error(`[defer] ${label} falló:`, e?.message || e)
  })

  const waitUntil = runtimeWaitUntil()
  if (waitUntil) {
    waitUntil(guarded)
    return
  }
  await guarded
}
