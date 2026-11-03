/**
 * Talento humano: catálogos y cálculos (vacaciones, días, vencimientos).
 *
 * Módulo PURO: sin base ni `import.meta`. Lo usan la página del panel, la
 * API, el resumen por correo y la herramienta del asistente, y tiene pruebas
 * en reglas.test.ts.
 *
 * ── LAS REGLAS LEGALES QUE APLICA (Código Sustantivo del Trabajo) ──────────
 * - Vacaciones (art. 186): 15 días hábiles por año de servicio, que se causan
 *   en proporción al tiempo trabajado. El tiempo se cuenta con año comercial
 *   de 360 días, que es como lo liquida la nómina en Colombia.
 * - Solo causan vacaciones los contratos laborales (indefinido, fijo, obra o
 *   labor). La prestación de servicios y el aprendizaje SENA no.
 * - Período de prueba (arts. 76 a 78): máximo dos meses; en un contrato a
 *   término fijo de menos de un año, no más de la quinta parte del término.
 * - Preaviso del término fijo (art. 46): la no renovación se avisa por
 *   escrito con 30 días de anticipación; si no se avisa, el contrato se
 *   prorroga solo por un período igual.
 * - Días hábiles: se excluyen domingos y festivos (los de Colombia, del mismo
 *   módulo que usa el agente de cumplimiento). El sábado cuenta como hábil
 *   solo si la empresa trabaja los sábados: es un ajuste de la sección.
 *
 * Todas las fechas viajan como texto AAAA-MM-DD y se opera en UTC, igual que
 * src/lib/agente/diasHabiles.ts.
 * ────────────────────────────────────────────────────────────────────────────
 */
import { festivosColombia } from '../agente/diasHabiles.ts'

// ---------- Catálogos ----------

type Opcion = { id: string; etiqueta: string }

/** Áreas internas: las mismas del diagnóstico y la capacitación de IA. */
export const AREAS_EMPRESA = [
  { id: 'operaciones', etiqueta: 'Operaciones' },
  { id: 'logistica', etiqueta: 'Logística' },
  { id: 'ventas', etiqueta: 'Ventas' },
  { id: 'mercadeo', etiqueta: 'Mercadeo / Redes' },
  { id: 'gerencia', etiqueta: 'Gerencia General' },
  { id: 'finanzas', etiqueta: 'Finanzas' },
] as const satisfies readonly Opcion[]

export const TIPOS_CONTRATO = [
  { id: 'indefinido', etiqueta: 'Término indefinido' },
  { id: 'fijo', etiqueta: 'Término fijo' },
  { id: 'obra', etiqueta: 'Obra o labor' },
  { id: 'aprendizaje', etiqueta: 'Aprendizaje (SENA)' },
  { id: 'prestacion', etiqueta: 'Prestación de servicios' },
] as const satisfies readonly Opcion[]
export type TipoContrato = (typeof TIPOS_CONTRATO)[number]['id']

/** Contratos que causan vacaciones y período de prueba. */
export const CONTRATOS_LABORALES: readonly string[] = ['indefinido', 'fijo', 'obra']

export const TIPOS_DOCUMENTO = [
  { id: 'contrato', etiqueta: 'Contrato u otrosí' },
  { id: 'hoja_vida', etiqueta: 'Hoja de vida' },
  { id: 'identificacion', etiqueta: 'Documento de identidad' },
  { id: 'afiliaciones', etiqueta: 'Afiliaciones a seguridad social' },
  { id: 'examen', etiqueta: 'Certificado de examen ocupacional' },
  { id: 'alturas', etiqueta: 'Certificado de trabajo en alturas' },
  { id: 'licencia', etiqueta: 'Licencia de conducción' },
  { id: 'certificado', etiqueta: 'Certificado de estudio o curso' },
  { id: 'otro', etiqueta: 'Otro' },
] as const satisfies readonly Opcion[]
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]['id']

/**
 * Tipos de documento de los que solo cuenta el último: si se sube el examen
 * de este año, el del año pasado ya no genera alerta. Los de tipo
 * "certificado" y "otro" se distinguen además por el nombre.
 */
const DOC_POR_NOMBRE: readonly string[] = ['certificado', 'otro']

export const TIPOS_NOVEDAD = [
  { id: 'vacaciones', etiqueta: 'Vacaciones' },
  { id: 'permiso_remunerado', etiqueta: 'Permiso remunerado' },
  { id: 'permiso_no_remunerado', etiqueta: 'Permiso no remunerado' },
  { id: 'incapacidad', etiqueta: 'Incapacidad' },
  { id: 'licencia_maternidad', etiqueta: 'Licencia de maternidad' },
  { id: 'licencia_paternidad', etiqueta: 'Licencia de paternidad' },
  { id: 'licencia_luto', etiqueta: 'Licencia de luto' },
  { id: 'calamidad', etiqueta: 'Calamidad doméstica' },
  { id: 'otro', etiqueta: 'Otra ausencia' },
] as const satisfies readonly Opcion[]
export type TipoNovedad = (typeof TIPOS_NOVEDAD)[number]['id']

export const ESTADOS_NOVEDAD = [
  { id: 'solicitada', etiqueta: 'Solicitada' },
  { id: 'aprobada', etiqueta: 'Aprobada' },
  { id: 'rechazada', etiqueta: 'Rechazada' },
  { id: 'cancelada', etiqueta: 'Cancelada' },
] as const satisfies readonly Opcion[]
export type EstadoNovedad = (typeof ESTADOS_NOVEDAD)[number]['id']

export const TIPOS_CURSO = [
  { id: 'interno', etiqueta: 'Interno' },
  { id: 'externo', etiqueta: 'Externo' },
  { id: 'sst', etiqueta: 'Seguridad y salud en el trabajo' },
  { id: 'ia', etiqueta: 'Capacitación en IA' },
] as const satisfies readonly Opcion[]

/** Criterios con que arranca un cargo nuevo. Se editan por cargo. */
export const CRITERIOS_BASE: readonly Criterio[] = [
  { id: 'calidad', nombre: 'Calidad del trabajo', descripcion: 'Entregas completas, correctas y sin reprocesos.' },
  { id: 'plazos', nombre: 'Cumplimiento de plazos', descripcion: 'Entrega a tiempo o avisa con anticipación.' },
  { id: 'conocimiento', nombre: 'Conocimiento técnico', descripcion: 'Domina la norma y las herramientas de su cargo.' },
  { id: 'equipo', nombre: 'Trabajo en equipo', descripcion: 'Colabora, comparte información y apoya a otras áreas.' },
  { id: 'cliente', nombre: 'Servicio al cliente', descripcion: 'Atiende con claridad y oportunidad a clientes internos y externos.' },
  { id: 'sst', nombre: 'Seguridad y cuidado ambiental', descripcion: 'Cumple los protocolos de SST y de manejo de residuos.' },
]

export const etiquetaDe = (lista: readonly Opcion[], id: string) => lista.find((o) => o.id === id)?.etiqueta ?? id
export const esDe = (lista: readonly Opcion[], id: unknown): boolean => lista.some((o) => o.id === id)

// ---------- Tipos de datos ----------

export interface Criterio {
  id: string
  nombre: string
  descripcion: string
}

export interface Empleado {
  usuario_id: number
  tipo_contrato: string
  fecha_ingreso: string
  fecha_fin_contrato: string
  fecha_retiro: string
  fecha_nacimiento: string
  vacaciones_ajuste: number
  cargo_id: number | null
}

export interface Novedad {
  id: number
  usuario_id: number
  tipo: string
  desde: string
  hasta: string
  dias_habiles: number
  dias_calendario: number
  estado: string
}

export interface Documento {
  id: number
  usuario_id: number
  tipo: string
  nombre: string
  fecha_vencimiento: string
}

export interface Formacion {
  id: number
  usuario_id: number
  curso_id: number
  fecha: string
  vence_el: string
}

export interface Evaluacion {
  id: number
  usuario_id: number
  fecha: string
  estado: string
}

export interface AjustesTalento {
  /** ¿La empresa trabaja los sábados? Si no, el sábado no descuenta vacaciones. */
  sabadoHabil: boolean
  /** Cada cuántos meses se evalúa a cada persona. */
  evaluacionMeses: number
}

export const AJUSTES_BASE: AjustesTalento = { sabadoHabil: false, evaluacionMeses: 12 }

// ---------- Fechas ----------

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

export const esFecha = (s: unknown): s is string => typeof s === 'string' && RE_FECHA.test(s) && !Number.isNaN(aUtc(s))

function aUtc(iso: string): number {
  const m = RE_FECHA.exec(iso)
  if (!m) return NaN
  const d = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  // Rechaza fechas imposibles como 2026-02-31, que Date.UTC corre al 3 de marzo.
  return new Date(d).toISOString().slice(0, 10) === iso ? d : NaN
}

const DIA = 86_400_000
const aIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Días de `a` a `b` (positivo si `b` es posterior). */
export function diasEntre(a: string, b: string): number {
  return Math.round((aUtc(b) - aUtc(a)) / DIA)
}

export function masDias(iso: string, n: number): string {
  return aIso(aUtc(iso) + n * DIA)
}

/** Suma meses; si el día no existe en el mes destino, cae en el último día. */
export function masMeses(iso: string, n: number): string {
  const m = RE_FECHA.exec(iso)!
  const anio = Number(m[1])
  const mes = Number(m[2]) - 1 + n
  const dia = Number(m[3])
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate()
  return aIso(Date.UTC(anio, mes, Math.min(dia, ultimo)))
}

/**
 * Días entre dos fechas con año comercial de 360 días, contando ambos
 * extremos (método 30/360 de la nómina colombiana: un mes completo son 30
 * días, sea de 28 o de 31).
 */
export function dias360(desde: string, hasta: string): number {
  const a = RE_FECHA.exec(desde)!
  const b = RE_FECHA.exec(hasta)!
  const d1 = Math.min(Number(a[3]), 30)
  let d2 = Math.min(Number(b[3]), 30)
  // El último día de febrero cuenta como 30 para que febrero valga un mes entero.
  if (Number(b[2]) === 2 && Number(b[3]) === new Date(Date.UTC(Number(b[1]), 2, 0)).getUTCDate()) d2 = 30
  return (Number(b[1]) - Number(a[1])) * 360 + (Number(b[2]) - Number(a[2])) * 30 + (d2 - d1) + 1
}

/**
 * Cuenta los días de un rango, ambos extremos incluidos. Hábiles: sin
 * domingos ni festivos, y sin sábados salvo que la empresa los trabaje.
 */
export function contarDias(desde: string, hasta: string, sabadoHabil: boolean): { habiles: number; calendario: number } {
  const ini = aUtc(desde)
  const fin = aUtc(hasta)
  if (Number.isNaN(ini) || Number.isNaN(fin) || fin < ini) return { habiles: 0, calendario: 0 }
  let habiles = 0
  let calendario = 0
  for (let t = ini; t <= fin; t += DIA) {
    calendario++
    const d = new Date(t)
    const dia = d.getUTCDay()
    if (dia === 0) continue
    if (dia === 6 && !sabadoHabil) continue
    if (festivosColombia(d.getUTCFullYear()).has(aIso(t))) continue
    habiles++
  }
  return { habiles, calendario }
}

// ---------- Estado de la persona ----------

/** Sigue en la empresa: sin fecha de retiro, o con una que todavía no llega. */
export const estaActivo = (e: Pick<Empleado, 'fecha_retiro'> | null | undefined, hoy: string) =>
  !!e && (!e.fecha_retiro || e.fecha_retiro >= hoy)

export const causaVacaciones = (e: Pick<Empleado, 'tipo_contrato'>) => CONTRATOS_LABORALES.includes(e.tipo_contrato)

/** Fin del período de prueba, o null si el contrato no lo tiene o falta el ingreso. */
export function finPeriodoPrueba(e: Pick<Empleado, 'tipo_contrato' | 'fecha_ingreso' | 'fecha_fin_contrato'>): string | null {
  if (!causaVacaciones(e) || !esFecha(e.fecha_ingreso)) return null
  let fin = masDias(masMeses(e.fecha_ingreso, 2), -1)
  if (e.tipo_contrato === 'fijo' && esFecha(e.fecha_fin_contrato)) {
    const termino = diasEntre(e.fecha_ingreso, e.fecha_fin_contrato) + 1
    if (termino > 0 && termino < 360) {
      const quinta = masDias(e.fecha_ingreso, Math.floor(termino / 5) - 1)
      if (quinta < fin) fin = quinta
    }
  }
  return fin
}

const redondear = (n: number) => Math.round(n * 100) / 100

export interface SaldoVacaciones {
  aplica: boolean
  /** Falta la fecha de ingreso: no se puede calcular. */
  sinIngreso: boolean
  causadas: number
  /** Días ya disfrutados antes de llevar el registro aquí. */
  ajuste: number
  /** Aprobadas que ya empezaron. */
  tomadas: number
  /** Aprobadas que todavía no empiezan. */
  programadas: number
  /** Solicitadas, sin decidir: no descuentan todavía. */
  porAprobar: number
  saldo: number
}

export function saldoVacaciones(e: Empleado, novedades: readonly Novedad[], hoy: string): SaldoVacaciones {
  const vacio = { causadas: 0, ajuste: 0, tomadas: 0, programadas: 0, porAprobar: 0, saldo: 0 }
  if (!causaVacaciones(e)) return { aplica: false, sinIngreso: false, ...vacio }
  if (!esFecha(e.fecha_ingreso)) return { aplica: true, sinIngreso: true, ...vacio }
  const corte = e.fecha_retiro && esFecha(e.fecha_retiro) && e.fecha_retiro < hoy ? e.fecha_retiro : hoy
  const causadas = corte < e.fecha_ingreso ? 0 : (dias360(e.fecha_ingreso, corte) * 15) / 360
  const propias = novedades.filter((n) => n.usuario_id === e.usuario_id && n.tipo === 'vacaciones')
  const suma = (f: (n: Novedad) => boolean) => propias.filter(f).reduce((a, n) => a + (Number(n.dias_habiles) || 0), 0)
  const tomadas = suma((n) => n.estado === 'aprobada' && n.desde <= hoy)
  const programadas = suma((n) => n.estado === 'aprobada' && n.desde > hoy)
  const porAprobar = suma((n) => n.estado === 'solicitada')
  const ajuste = Number(e.vacaciones_ajuste) || 0
  return {
    aplica: true,
    sinIngreso: false,
    causadas: redondear(causadas),
    ajuste: redondear(ajuste),
    tomadas: redondear(tomadas),
    programadas: redondear(programadas),
    porAprobar: redondear(porAprobar),
    saldo: redondear(causadas - ajuste - tomadas - programadas),
  }
}

/** Novedades aprobadas que tocan el rango [desde, hasta]. */
export function ausenciasEntre(novedades: readonly Novedad[], desde: string, hasta: string): Novedad[] {
  return novedades
    .filter((n) => n.estado === 'aprobada' && n.desde <= hasta && n.hasta >= desde)
    .sort((a, b) => a.desde.localeCompare(b.desde))
}

/** Personas que cumplen años en el mes de `hoy`, ordenadas por día. */
export function cumpleanosDelMes<T extends Pick<Empleado, 'fecha_nacimiento'>>(empleados: readonly T[], hoy: string): T[] {
  const mes = hoy.slice(5, 7)
  return empleados
    .filter((e) => esFecha(e.fecha_nacimiento) && e.fecha_nacimiento.slice(5, 7) === mes)
    .sort((a, b) => a.fecha_nacimiento.slice(8).localeCompare(b.fecha_nacimiento.slice(8)))
}

// ---------- Vencimientos ----------

export type Nivel = 'vencido' | 'urgente' | 'pronto' | 'proximo'
export const NIVELES: Record<Nivel, string> = {
  vencido: 'Vencido',
  urgente: '15 días o menos',
  pronto: '30 días o menos',
  proximo: '90 días o menos',
}

/** A partir de cuántos días de vacaciones pendientes se avisa (dos períodos). */
export const VACACIONES_ACUMULADAS = 30
/** Horizonte de los avisos: lo que vence más allá no sale. */
export const HORIZONTE_DIAS = 90

export interface Aviso {
  /** Clave estable, para la lista del tablero. */
  clave: string
  usuario_id: number
  tipo: 'documento' | 'formacion' | 'contrato' | 'prueba' | 'vacaciones' | 'evaluacion'
  titulo: string
  detalle: string
  /** Fecha que vence (o null si el aviso no tiene una, como las vacaciones). */
  fecha: string | null
  /** Días que faltan hasta `fecha`; negativo si ya pasó. */
  dias: number | null
  nivel: Nivel
}

export function nivelDe(dias: number): Nivel | null {
  if (dias < 0) return 'vencido'
  if (dias <= 15) return 'urgente'
  if (dias <= 30) return 'pronto'
  if (dias <= HORIZONTE_DIAS) return 'proximo'
  return null
}

const ORDEN_NIVEL: Record<Nivel, number> = { vencido: 0, urgente: 1, pronto: 2, proximo: 3 }

export interface DatosVencimientos {
  empleados: readonly Empleado[]
  documentos: readonly Documento[]
  formaciones: readonly Formacion[]
  novedades: readonly Novedad[]
  evaluaciones: readonly Evaluacion[]
  /** Nombre de cada curso, por id. */
  cursos: ReadonlyMap<number, string>
  /** ¿El cargo de la persona tiene criterios de evaluación? Por id de cargo. */
  cargosConCriterios: ReadonlySet<number>
  ajustes: AjustesTalento
}

/** Se queda con el registro más nuevo de cada grupo (por fecha de vencimiento). */
function ultimos<T>(filas: readonly T[], clave: (f: T) => string, fecha: (f: T) => string): T[] {
  const m = new Map<string, T>()
  for (const f of filas) {
    const k = clave(f)
    const prev = m.get(k)
    if (!prev || fecha(f) > fecha(prev)) m.set(k, f)
  }
  return [...m.values()]
}

/**
 * Todo lo que vence o pide acción en los próximos 90 días, de las personas
 * activas, del más urgente al menos.
 */
export function vencimientos(d: DatosVencimientos, hoy: string): Aviso[] {
  const activos = new Map(d.empleados.filter((e) => estaActivo(e, hoy)).map((e) => [e.usuario_id, e]))
  const avisos: Aviso[] = []
  const agregar = (a: Omit<Aviso, 'nivel' | 'dias'> & { fecha: string }) => {
    const dias = diasEntre(hoy, a.fecha)
    const nivel = nivelDe(dias)
    if (nivel) avisos.push({ ...a, dias, nivel })
  }

  const docs = ultimos(
    d.documentos.filter((x) => activos.has(x.usuario_id) && esFecha(x.fecha_vencimiento)),
    (x) => `${x.usuario_id}|${x.tipo}${DOC_POR_NOMBRE.includes(x.tipo) ? `|${x.nombre.trim().toLowerCase()}` : ''}`,
    (x) => x.fecha_vencimiento,
  )
  for (const x of docs) {
    agregar({
      clave: `doc-${x.id}`,
      usuario_id: x.usuario_id,
      tipo: 'documento',
      titulo: x.nombre || etiquetaDe(TIPOS_DOCUMENTO, x.tipo),
      detalle: etiquetaDe(TIPOS_DOCUMENTO, x.tipo),
      fecha: x.fecha_vencimiento,
    })
  }

  const forms = ultimos(
    d.formaciones.filter((x) => activos.has(x.usuario_id) && esFecha(x.vence_el)),
    (x) => `${x.usuario_id}|${x.curso_id}`,
    (x) => x.vence_el,
  )
  for (const x of forms) {
    agregar({
      clave: `form-${x.id}`,
      usuario_id: x.usuario_id,
      tipo: 'formacion',
      titulo: d.cursos.get(x.curso_id) ?? 'Curso',
      detalle: 'Certificación de un curso con vigencia',
      fecha: x.vence_el,
    })
  }

  for (const e of activos.values()) {
    if (esFecha(e.fecha_fin_contrato) && e.tipo_contrato !== 'indefinido') {
      if (e.tipo_contrato === 'fijo') {
        const limite = masDias(e.fecha_fin_contrato, -30)
        const yaTermino = e.fecha_fin_contrato < hoy
        agregar({
          clave: `contrato-${e.usuario_id}`,
          usuario_id: e.usuario_id,
          tipo: 'contrato',
          titulo: yaTermino ? 'Contrato a término fijo vencido' : 'Preaviso de no renovación',
          detalle: yaTermino
            ? `El contrato terminaba el ${e.fecha_fin_contrato}. Si no se avisó, se prorrogó: actualice la fecha de fin o registre el retiro.`
            : `El contrato termina el ${e.fecha_fin_contrato}. Si no se va a renovar, hay que avisarlo por escrito a más tardar el ${limite}; si no, se prorroga solo.`,
          fecha: yaTermino ? e.fecha_fin_contrato : limite,
        })
      } else {
        agregar({
          clave: `contrato-${e.usuario_id}`,
          usuario_id: e.usuario_id,
          tipo: 'contrato',
          titulo: 'Fin de contrato',
          detalle: `${etiquetaDe(TIPOS_CONTRATO, e.tipo_contrato)} hasta el ${e.fecha_fin_contrato}.`,
          fecha: e.fecha_fin_contrato,
        })
      }
    }

    const prueba = finPeriodoPrueba(e)
    if (prueba && prueba >= hoy && diasEntre(hoy, prueba) <= 30) {
      agregar({
        clave: `prueba-${e.usuario_id}`,
        usuario_id: e.usuario_id,
        tipo: 'prueba',
        titulo: 'Termina el período de prueba',
        detalle: `Hasta el ${prueba}. Es el momento de decidir si la persona continúa.`,
        fecha: prueba,
      })
    }

    const saldo = saldoVacaciones(e, d.novedades, hoy)
    if (saldo.aplica && saldo.saldo >= VACACIONES_ACUMULADAS) {
      avisos.push({
        clave: `vac-${e.usuario_id}`,
        usuario_id: e.usuario_id,
        tipo: 'vacaciones',
        titulo: 'Vacaciones acumuladas',
        detalle: `Tiene ${saldo.saldo.toLocaleString('es-CO')} días hábiles pendientes, más de dos períodos. Conviene programarlas.`,
        fecha: null,
        dias: null,
        nivel: 'pronto',
      })
    }

    if (e.cargo_id && d.cargosConCriterios.has(e.cargo_id) && esFecha(e.fecha_ingreso)) {
      const cerradas = d.evaluaciones
        .filter((v) => v.usuario_id === e.usuario_id && v.estado === 'cerrada')
        .map((v) => v.fecha)
        .sort()
      const desde = cerradas.length ? cerradas[cerradas.length - 1]! : e.fecha_ingreso
      const toca = masMeses(desde, Math.max(1, d.ajustes.evaluacionMeses))
      agregar({
        clave: `eval-${e.usuario_id}`,
        usuario_id: e.usuario_id,
        tipo: 'evaluacion',
        titulo: 'Evaluación de desempeño',
        detalle: cerradas.length ? `La última fue el ${desde}.` : 'Todavía no tiene ninguna evaluación cerrada.',
        fecha: toca,
      })
    }
  }

  return avisos.sort(
    (a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel] || (a.dias ?? 0) - (b.dias ?? 0) || a.titulo.localeCompare(b.titulo),
  )
}

/** Promedio de las notas (1 a 5) con dos decimales; 0 si no hay ninguna. */
export function promedioNotas(notas: readonly number[]): number {
  const validas = notas.filter((n) => Number.isFinite(n) && n >= 1 && n <= 5)
  return validas.length ? redondear(validas.reduce((a, n) => a + n, 0) / validas.length) : 0
}
