/**
 * Qué normas le aplican a cada tipo de empresa. Alimenta el selector del hero
 * de la portada ("¿Qué le exige la ANLA a su empresa?").
 *
 * Es orientativo: el panel lo dice en pantalla y el diagnóstico confirma cada
 * caso. Los perfiles son los mismos sectores del formulario de contacto, así
 * el clic en el hero llega con el sector ya elegido.
 *
 * PENDIENTE-VALIDAR: borrador armado a partir de los tags y descripciones de
 * normativas.json. Ekosolv debe confirmar la relación perfil → norma antes de
 * darla por definitiva.
 */

export const PERFILES = ['importadora', 'productora', 'telco', 'datacenter', 'retail'] as const
export type Perfil = (typeof PERFILES)[number]

/** Aplican a toda empresa con operación en Colombia: marco general y régimen sancionatorio. */
export const BASE = ['DEC 1076 · 2015', 'RES 1407 · 2022'] as const

const PROPIAS: Record<Perfil, readonly string[]> = {
  // Pone aparatos y empaques en el mercado: posconsumo RAEE y de envases.
  importadora: ['RES 1297 · 2010', 'LEY 1672 · 2013', 'RES 1407 · 2018'],
  // Lo mismo que el importador, más lo que trae una planta: emisiones, agua y vertimientos.
  productora: ['RES 1297 · 2010', 'LEY 1672 · 2013', 'RES 1407 · 2018', 'RES 909 · 2008', 'DEC 1076 · Título 5', 'RES 0631 · 2015'],
  // Vende terminales, levanta infraestructura y mantiene plantas eléctricas en sus sitios.
  telco: ['RES 1297 · 2010', 'LEY 1672 · 2013', 'RES 0472 · 2017', 'RES 909 · 2008'],
  // Genera RAEE propio, adecúa obras, tiene generadores y consume agua de enfriamiento.
  datacenter: ['LEY 1672 · 2013', 'RES 0472 · 2017', 'RES 909 · 2008', 'DEC 1076 · Título 5', 'RES 0631 · 2015'],
  // Comercializa aparatos y empaques y separa residuos en sus puntos de venta.
  retail: ['LEY 1672 · 2013', 'RES 1407 · 2018', 'RES 2184 · 2019'],
}

/** Códigos que le aplican a `perfil`, base incluida. */
export function normasDe(perfil: Perfil): string[] {
  return [...BASE, ...PROPIAS[perfil]]
}

export function aplica(perfil: Perfil, code: string): boolean {
  return normasDe(perfil).includes(code)
}

/**
 * Orden de la lista para un perfil: primero las que aplican, luego el resto,
 * respetando dentro de cada grupo el orden original. Estable, para que la
 * animación solo mueva lo que de verdad cambia de grupo.
 */
export function ordenar<T extends { code: string }>(normas: readonly T[], perfil: Perfil): T[] {
  const si = normas.filter((n) => aplica(perfil, n.code))
  const no = normas.filter((n) => !aplica(perfil, n.code))
  return [...si, ...no]
}

export function esPerfil(v: unknown): v is Perfil {
  return typeof v === 'string' && (PERFILES as readonly string[]).includes(v)
}
