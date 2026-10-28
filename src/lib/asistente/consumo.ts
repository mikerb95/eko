// Registro de consumo del asistente: una fila por llamada al modelo, con
// usuario, tokens y costo estimado. La clave de API es de Mike y el consumo se
// le cobra aparte a Ekosolv (decisión del 2026-10-27), así que esta tabla es
// a la vez la fuente del tope diario (topes.ts) y la del reporte mensual.
//
// Se registra POR LLAMADA, no al final de la pregunta: si la función muere a
// mitad, lo ya pagado cuenta igual.

import type { Client } from '@libsql/client'
import { costoUsdModelo, MODELO, sumarUso, TARIFA_VIGENTE_DESDE, USO_CERO } from './costo.ts'

/** Fecha en Colombia: el día del tope y del reporte empieza a medianoche de Bogotá. */
export function diaBogota(ahora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora)
}

type UsageApi = Parameters<typeof sumarUso>[1]

export async function registrarConsumo(
  db: Client,
  r: { usuario: string; conversacion: string; usage: UsageApi; modelo?: string },
  ahora = new Date(),
): Promise<number> {
  const uso = sumarUso(USO_CERO, r.usage)
  const usd = costoUsdModelo(uso, r.modelo ?? MODELO)
  await db.execute({
    sql: `INSERT INTO asistente_consumo (fecha, dia, usuario, conversacion, modelo, tokens_entrada, tokens_salida, tokens_cache_lectura, tokens_cache_escritura, costo_usd)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [ahora.toISOString(), diaBogota(ahora), r.usuario, r.conversacion, r.modelo ?? MODELO, uso.entrada, uso.salida, uso.cacheLectura, uso.cacheEscritura, usd],
  })
  return usd
}

/** Gasto de hoy: de toda la empresa y, si se pasa, de un usuario. */
export async function gastoDelDia(db: Client, ahora = new Date(), usuario?: string): Promise<{ empresa: number; usuario: number }> {
  const dia = diaBogota(ahora)
  const r = await db.execute({
    sql: `SELECT COALESCE(SUM(costo_usd), 0) AS empresa,
                 COALESCE(SUM(CASE WHEN usuario = ? THEN costo_usd ELSE 0 END), 0) AS usuario
          FROM asistente_consumo WHERE dia = ?`,
    args: [usuario ?? '', dia],
  })
  return { empresa: Number(r.rows[0]?.empresa) || 0, usuario: Number(r.rows[0]?.usuario) || 0 }
}

export type ReporteMes = {
  mes: string
  totalUsd: number
  llamadas: number
  conversaciones: number
  porUsuario: { usuario: string; usd: number; llamadas: number; conversaciones: number }[]
  porDia: { dia: string; usd: number }[]
  nota: string
}

/** Reporte de un mes (AAAA-MM) para facturar. */
export async function reporteMensual(db: Client, mes: string): Promise<ReporteMes> {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error('Mes inválido: use AAAA-MM')
  const filtro = `${mes}-%`
  const [usuarios, dias] = await Promise.all([
    db.execute({
      sql: `SELECT usuario, SUM(costo_usd) AS usd, COUNT(*) AS llamadas, COUNT(DISTINCT conversacion) AS conversaciones
            FROM asistente_consumo WHERE dia LIKE ? GROUP BY usuario ORDER BY usd DESC`,
      args: [filtro],
    }),
    db.execute({ sql: 'SELECT dia, SUM(costo_usd) AS usd FROM asistente_consumo WHERE dia LIKE ? GROUP BY dia ORDER BY dia', args: [filtro] }),
  ])
  const porUsuario = usuarios.rows.map((f: any) => ({
    usuario: String(f.usuario),
    usd: Number(f.usd) || 0,
    llamadas: Number(f.llamadas) || 0,
    conversaciones: Number(f.conversaciones) || 0,
  }))
  return {
    mes,
    totalUsd: porUsuario.reduce((s, u) => s + u.usd, 0),
    llamadas: porUsuario.reduce((s, u) => s + u.llamadas, 0),
    conversaciones: porUsuario.reduce((s, u) => s + u.conversaciones, 0),
    porUsuario,
    porDia: dias.rows.map((f: any) => ({ dia: String(f.dia), usd: Number(f.usd) || 0 })),
    nota: `Estimado con la tarifa de ${MODELO} vigente desde ${TARIFA_VIGENTE_DESDE}. La cifra oficial es la de la consola de Claude.`,
  }
}
