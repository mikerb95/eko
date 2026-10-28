// Topes de gasto diario del asistente: uno para toda la empresa (US$5) y uno
// por persona (US$1), que el admin cambia desde el panel (decisión de Mike,
// 2026-10-27). Viven en la tabla `ajustes`; el gasto sale de asistente_consumo.
//
// Falla CERRADO: si no se puede leer el gasto o el tope, `restante` lanza y el
// motor no llama al modelo. Perder una pregunta cuesta poco; una factura sin
// techo, no.

import type { Client } from '@libsql/client'
import { gastoDelDia } from './consumo.ts'

export const CLAVE_EMPRESA = 'asistente_tope_empresa_usd'
export const CLAVE_USUARIO = 'asistente_tope_usuario_usd'
export const POR_DEFECTO = { empresaUsd: 5, usuarioUsd: 1 } as const
/** Techo de lo que el admin puede poner desde el panel, contra un cero de más. */
export const MAXIMO_USD = 100

export type Topes = { empresaUsd: number; usuarioUsd: number }

const valido = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= MAXIMO_USD
}

export async function leerTopes(db: Client): Promise<Topes> {
  const r = await db.execute({ sql: 'SELECT clave, valor FROM ajustes WHERE clave IN (?, ?)', args: [CLAVE_EMPRESA, CLAVE_USUARIO] })
  const t: Topes = { ...POR_DEFECTO }
  for (const f of r.rows as any[]) {
    if (!valido(f.valor)) continue
    if (f.clave === CLAVE_EMPRESA) t.empresaUsd = Number(f.valor)
    if (f.clave === CLAVE_USUARIO) t.usuarioUsd = Number(f.valor)
  }
  return t
}

/** Guarda los topes que mande el admin. Lanza con un mensaje claro si alguno no es válido. */
export async function guardarTopes(db: Client, cambios: Partial<Topes>, ahora = new Date()): Promise<Topes> {
  for (const [k, v] of Object.entries(cambios)) {
    if (v !== undefined && !valido(v)) throw new Error(`El tope ${k === 'empresaUsd' ? 'de la empresa' : 'por persona'} debe ser un número entre 0 y ${MAXIMO_USD}.`)
  }
  const filas: [string, number | undefined][] = [
    [CLAVE_EMPRESA, cambios.empresaUsd],
    [CLAVE_USUARIO, cambios.usuarioUsd],
  ]
  for (const [clave, valor] of filas) {
    if (valor === undefined) continue
    await db.execute({
      sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)
            ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
      args: [clave, String(valor), ahora.toISOString()],
    })
  }
  return leerTopes(db)
}

export type Estado = Topes & { gastoEmpresaUsd: number; gastoUsuarioUsd: number; restanteUsd: number; limitante: 'empresa' | 'usuario' }

/** Cuánto le queda hoy a esta persona: el menor entre su tope y el de la empresa. Lanza si no puede leer. */
export async function estadoDelDia(db: Client, usuario: string, ahora = new Date()): Promise<Estado> {
  const [topes, gasto] = await Promise.all([leerTopes(db), gastoDelDia(db, ahora, usuario)])
  const empresa = topes.empresaUsd - gasto.empresa
  const propio = topes.usuarioUsd - gasto.usuario
  return {
    ...topes,
    gastoEmpresaUsd: gasto.empresa,
    gastoUsuarioUsd: gasto.usuario,
    restanteUsd: Math.min(empresa, propio),
    limitante: empresa <= propio ? 'empresa' : 'usuario',
  }
}

/** Mensaje para la persona cuando ya no queda presupuesto. */
export function mensajeSinPresupuesto(e: Pick<Estado, 'limitante'>): string {
  return e.limitante === 'usuario'
    ? 'Usted ya usó su límite diario del asistente. Mañana vuelve a estar disponible; si lo necesita antes, el administrador puede ampliarlo.'
    : 'El asistente alcanzó el límite diario de la empresa. Mañana vuelve a estar disponible; el buscador sigue funcionando.'
}
