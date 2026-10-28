// Lo que la persona ve antes de aprobar una escritura del asistente: una
// tarjeta con el antes y el después, campo por campo. La arma siempre el
// servidor desde la base, nunca el modelo: se aprueba lo que dice la base, no
// lo que el modelo cree que había.
//
// Módulo PURO: lo importan las escrituras (servidor) y el cliente del panel.

import type { Contexto } from '../herramientas/tipos.ts'
import type { Area } from '../permisos.ts'
import type { z } from 'zod'

export type CampoCambio = {
  campo: string
  /** null = el campo estaba vacío o es nuevo. */
  antes: string | null
  /** null = el campo queda vacío. */
  despues: string | null
}

export type VistaCambio = {
  tipo: 'cambio'
  /** "Orden de recolección", "Alerta de cumplimiento", "Artículo nuevo". */
  rotulo: string
  /** El nombre de la cosa: consecutivo, título. */
  titulo: string
  /** Una línea de contexto: empresa, expediente. */
  contexto: string | null
  cambios: CampoCambio[]
  /** Lo que pasa FUERA del panel al aprobar. Va en grande en la tarjeta. */
  avisos: string[]
  /** Texto del botón: "Aprobar y guardar". */
  boton: string
  nota: string
}

/** Resultado de una escritura ya hecha, para el enlace de "listo" en el hilo. */
export type Hecho = { hecho: true; resumen: string; enlace: string }

export type Preparada<T> = { ok: true; datos: T; vista: VistaCambio } | { ok: false; error: string }

export type PropuestaPreparada = { ok: true; origen: string; motivo: string; vista: VistaCambio } | { ok: false; error: string }
export type ResultadoEscritura = { ok: true; datos: Hecho & Record<string, unknown> } | { ok: false; error: string }

export type ContextoEscritura = Contexto & { toolUseId: string }

export type Escritura = {
  nombre: string
  descripcion: string
  area: Area
  esquema: z.ZodObject<z.ZodRawShape>
  /** Revisa y arma la tarjeta. No escribe nada. */
  preparar: (entrada: unknown, ctx: Contexto) => Promise<PropuestaPreparada>
  /** Solo tras "Aprobar": vuelve a preparar y entonces escribe. Nunca lanza. */
  ejecutar: (entrada: unknown, ctx: ContextoEscritura) => Promise<ResultadoEscritura>
}

/** Solo los campos que de verdad cambian: una tarjeta con "Abierta → Abierta" confunde. */
export const soloDistintos = (cambios: CampoCambio[]): CampoCambio[] => cambios.filter((c) => c.antes !== c.despues)

/** Convierte la tarjeta en la línea que queda en el historial y en el sello. */
export function aPropuesta(vista: VistaCambio): PropuestaPreparada {
  return {
    ok: true,
    origen: `${vista.rotulo}: ${vista.titulo}`,
    motivo: vista.cambios.map((c) => `${c.campo}: ${c.despues ?? 'vacío'}`).join('; '),
    vista,
  }
}

export const errores = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((i) => `${i.path.map(String).join('.')}: ${i.message}`).join('; ')

/** Quién queda en historiales y notas: el nombre de quien aprobó, marcado como hecho desde el asistente. */
export const firma = (ctx: Contexto) => `${ctx.usuario.nombre || ctx.usuario.usuario} (asistente)`
