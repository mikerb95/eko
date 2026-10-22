// Tope de gasto diario del asesor público. Es un endpoint abierto a cualquiera
// que gasta créditos de la API: sin tope, un bot con paciencia vacía la cuenta
// aunque el rate limit por IP lo frene (basta con muchas IPs).
//
// Falla CERRADO: si no se puede leer cuánto se ha gastado hoy, el asesor no
// responde y la burbuja ofrece solo WhatsApp. Perder una conversación con la
// IA cuesta poco; una factura sin techo, no.
//
// Una sola fila (clave `asesor_gasto`, valor "AAAA-MM-DD|usd", día de Bogotá)
// con suma atómica, y no una por día, para que la tabla no crezca sola.
//
// La base se inyecta para probarlo con un archivo SQLite temporal; motor.ts
// le pasa la conexión compartida de db.ts.

import type { Client } from '@libsql/client'

export const CLAVE_GASTO = 'asesor_gasto'
export const TOPE_POR_DEFECTO_USD = 1

/** Fecha de hoy en Colombia: el día del tope empieza a medianoche de Bogotá. */
export function hoyBogota(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora)
}

/** Lee "AAAA-MM-DD|usd". Lo que no tenga esa forma, o sea de otro día, cuenta como cero. */
export function gastoDelValor(valor: string | null | undefined, hoy: string): number {
  if (!valor) return 0
  const [fecha, usd] = valor.split('|')
  const n = Number(usd)
  return fecha === hoy && Number.isFinite(n) && n >= 0 ? n : 0
}

/** Tope en USD desde la variable de entorno, o el de por defecto si no es un número válido. */
export function topeDesde(valor: string | undefined): number {
  const v = Number(valor)
  return valor !== undefined && valor !== '' && Number.isFinite(v) && v >= 0 ? v : TOPE_POR_DEFECTO_USD
}

export type TopeDiario = {
  /** USD que quedan hoy. Lanza si la base no responde. */
  presupuestoRestante: (ahora?: Date) => Promise<number>
  /** Suma un gasto de forma atómica. */
  sumarGasto: (usd: number, ahora?: Date) => Promise<void>
}

export function crearTopeDiario(opciones: { db: () => Promise<Client>; topeUsd: () => number }): TopeDiario {
  return {
    async presupuestoRestante(ahora = new Date()) {
      const db = await opciones.db()
      const r = await db.execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE_GASTO] })
      const valor = r.rows[0]?.valor
      return opciones.topeUsd() - gastoDelValor(typeof valor === 'string' ? valor : null, hoyBogota(ahora))
    },
    // El día nuevo arranca de cero dentro del mismo UPSERT, sin leer antes,
    // para que dos gastos a la vez no se pisen.
    async sumarGasto(usd, ahora = new Date()) {
      if (!(usd > 0)) return
      const db = await opciones.db()
      const hoy = hoyBogota(ahora)
      await db.execute({
        sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?1, ?2 || '|' || ?3, ?4)
              ON CONFLICT (clave) DO UPDATE SET
                valor = CASE WHEN substr(ajustes.valor, 1, 10) = ?2
                  THEN ?2 || '|' || (CAST(substr(ajustes.valor, 12) AS REAL) + ?3)
                  ELSE excluded.valor END,
                actualizado = excluded.actualizado`,
        args: [CLAVE_GASTO, hoy, usd, ahora.toISOString()],
      })
    },
  }
}
