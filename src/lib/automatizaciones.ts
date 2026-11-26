// Inventario de las automatizaciones del portal que corren con Claude, en la
// infraestructura de Anthropic (/admin/automatizaciones). No incluye las
// tareas que cada persona programa en su Claude Desktop: esas viven en la
// cuenta de cada quien y el portal no las ve.
//
// Dos grupos:
//  - Las que responden a una persona: llaman a la API de Claude con la clave
//    del portal cuando alguien pregunta, sube un documento o lanza una demo.
//    Cada una lleva su propio tope de gasto; aquí solo se LEE, con las mismas
//    filas y tablas que usa cada motor, sin importar los motores.
//  - Las que tienen horario: las dispara una tarea programada en la nube de
//    Claude que llama a /api/cron/<tarea> con CRON_SECRET. La lógica sigue en
//    el portal; la tarea solo es el despertador. Ninguna va en vercel.json
//    (decisión de Mike, 2026-11-25). Cada llamada deja su huella con
//    registrarEjecucion para que esta pantalla sepa si están corriendo.
//
// Solo servidor. Falla suave: si una lectura no responde, esa tarjeta sale
// sin cifra y las demás siguen.

import type { Client } from '@libsql/client'
import { asegurarEsquema, cliente } from './db'
import { gastoDelValor, hoyBogota, topeDesde } from './asesor/presupuesto'
import { MODELO as MODELO_HAIKU } from './asesor/costo'
import { MODELO as MODELO_ASISTENTE } from './asistente/costo'
import { leerTopes } from './asistente/topes'
import { leerConfig as leerConfigFinanzas } from './finanzas/datos'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (globalThis as any)?.process?.env?.[key] || ''
}

export type Estado = 'activa' | 'tope' | 'sin_clave' | 'sin_dato'

export interface AutomatizacionIA {
  id: string
  nombre: string
  descripcion: string
  disparador: string
  donde: { etiqueta: string; href: string }
  modelo: string
  /** 'dia' o 'mes': el periodo del tope y del gasto. */
  periodo: 'dia' | 'mes'
  topeUsd: number | null
  gastoUsd: number | null
  /** El gasto es una estimación hecha aquí con la tarifa, no la cifra del motor. */
  gastoAprox?: boolean
  nota?: string
  estado: Estado
}

export interface TareaProgramada {
  id: string
  nombre: string
  descripcion: string
  horario: string
  ruta: string
  /** Horas sin correr a partir de las cuales se marca como atrasada. */
  atrasoHoras: number
  ultima: { fecha: string; ok: boolean; detalle: string } | null
  atrasada: boolean
}

const nombreModelo = (id: string) =>
  id
    .replace(/^claude-/, '')
    .replace(/-(\d+)-(\d+)$/, ' $1.$2')
    .replace(/^./, (c) => c.toUpperCase())

const topeEnv = (clave: string, porDefecto: number) => {
  const v = env(clave)
  return v ? topeDesde(v) : porDefecto
}

async function gastoDeAjuste(db: Client, clave: string, hoy: string): Promise<number> {
  const r = await db.execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [clave] })
  const v = r.rows[0]?.valor
  return gastoDelValor(typeof v === 'string' ? v : null, hoy)
}

const intento = async <T>(f: () => Promise<T>, etiqueta: string): Promise<T | null> => {
  try {
    return await f()
  } catch (e) {
    console.error(`[automatizaciones] ${etiqueta}`, e instanceof Error ? e.message : e)
    return null
  }
}

function estadoDe(hayClave: boolean, tope: number | null, gasto: number | null): Estado {
  if (!hayClave) return 'sin_clave'
  if (gasto === null) return 'sin_dato'
  if (tope !== null && gasto >= tope) return 'tope'
  return 'activa'
}

// Tarifa de Sonnet 5.5 por millón de tokens, la misma de asistente/costo.ts.
// El agente de cumplimiento guarda tokens sin separar la caché, así que el
// costo que sale de aquí es aproximado.
const SONNET = { entrada: 2, salida: 10 }

export async function cargarAutomatizaciones(ahora = new Date()): Promise<{ ia: AutomatizacionIA[]; tareas: TareaProgramada[]; hayClave: boolean }> {
  await asegurarEsquema()
  const db = cliente()
  const hoy = hoyBogota(ahora)
  const mes = hoy.slice(0, 7)
  const hayClave = !!env('ANTHROPIC_API_KEY')

  const [asis, asisTopes, fin, finCfg, actos, asesor, encuesta, propuesta, academia, taller, tareas] = await Promise.all([
    intento(async () => Number((await db.execute({ sql: 'SELECT COALESCE(SUM(costo_usd), 0) AS usd FROM asistente_consumo WHERE dia = ?', args: [hoy] })).rows[0]?.usd) || 0, 'asistente'),
    intento(() => leerTopes(db), 'asistente topes'),
    intento(async () => Number((await db.execute({ sql: 'SELECT COALESCE(SUM(costo_usd), 0) AS usd FROM fin_documentos WHERE mes = ?', args: [mes] })).rows[0]?.usd) || 0, 'finanzas'),
    intento(() => leerConfigFinanzas(), 'finanzas config'),
    intento(async () => {
      const r = await db.execute({
        sql: `SELECT COUNT(*) AS n, COALESCE(SUM(tokens_entrada), 0) AS ent, COALESCE(SUM(tokens_salida), 0) AS sal
              FROM actos WHERE modelo <> '' AND substr(created_at, 1, 7) = ?`,
        args: [mes],
      })
      const f = r.rows[0] as any
      return { n: Number(f?.n) || 0, usd: ((Number(f?.ent) || 0) * SONNET.entrada + (Number(f?.sal) || 0) * SONNET.salida) / 1e6 }
    }, 'cumplimiento'),
    intento(() => gastoDeAjuste(db, 'asesor_gasto', hoy), 'asesor'),
    intento(() => gastoDeAjuste(db, 'diagnostico_ia_gasto', hoy), 'encuesta'),
    intento(() => gastoDeAjuste(db, 'propuesta_ia_gasto', hoy), 'propuesta'),
    intento(() => gastoDeAjuste(db, 'academia_ia_gasto', hoy), 'academia'),
    intento(() => gastoDeAjuste(db, 'taller_ia_gasto', hoy), 'taller'),
    intento(() => leerTareas(db, ahora), 'tareas'),
  ])

  const haiku = nombreModelo(MODELO_HAIKU)
  const modeloAgente = env('AGENTE_MODELO') || 'claude-sonnet-5-5'
  const ia: AutomatizacionIA[] = []
  const sumar = (a: Omit<AutomatizacionIA, 'estado'>) => ia.push({ ...a, estado: estadoDe(hayClave, a.topeUsd, a.gastoUsd) })

  sumar({
    id: 'asistente',
    nombre: 'Asistente del panel',
    descripcion: 'Responde preguntas del equipo con los datos del panel y prepara cambios que una persona aprueba.',
    disparador: 'Una persona del equipo pregunta',
    donde: { etiqueta: 'Inicio del panel', href: '/admin' },
    modelo: nombreModelo(MODELO_ASISTENTE),
    periodo: 'dia',
    topeUsd: asisTopes?.empresaUsd ?? null,
    gastoUsd: asis,
    nota: 'Además tiene un tope por persona; ambos se cambian en Asistente IA.',
  })
  sumar({
    id: 'cumplimiento',
    nombre: 'Agente de cumplimiento',
    descripcion: 'Lee los actos administrativos de la ANLA y las CAR, extrae obligaciones y plazos y crea las alertas.',
    disparador: 'Se sube un acto o se reprocesa uno',
    donde: { etiqueta: 'Cumplimiento', href: '/admin/cumplimiento' },
    modelo: nombreModelo(modeloAgente),
    periodo: 'mes',
    topeUsd: null,
    gastoUsd: actos?.usd ?? null,
    gastoAprox: true,
    nota: actos ? `${actos.n} documento${actos.n === 1 ? '' : 's'} leído${actos.n === 1 ? '' : 's'} este mes. No tiene tope de gasto.` : 'No tiene tope de gasto.',
  })
  sumar({
    id: 'finanzas',
    nombre: 'Lectura de documentos de Finanzas',
    descripcion: 'Lee facturas, recibos y requerimientos que se suben y llena los datos del pago o de la obligación.',
    disparador: 'Se carga un documento',
    donde: { etiqueta: 'Finanzas', href: '/admin/finanzas' },
    modelo: nombreModelo(env('FIN_MODELO') || 'claude-sonnet-5-5'),
    periodo: 'mes',
    topeUsd: finCfg?.topeIaUsd ?? null,
    gastoUsd: fin,
  })
  sumar({
    id: 'asesor',
    nombre: 'Asesor del sitio público',
    descripcion: 'Atiende a los visitantes de la página en la burbuja de chat y los lleva a WhatsApp.',
    disparador: 'Un visitante pregunta',
    donde: { etiqueta: 'Sitio público', href: '/' },
    modelo: haiku,
    periodo: 'dia',
    topeUsd: topeEnv('ASESOR_TOPE_DIARIO_USD', 1),
    gastoUsd: asesor,
  })
  sumar({
    id: 'encuesta',
    nombre: 'Completar con IA de la encuesta',
    descripcion: 'Ayuda a cada persona a detallar sus respuestas del diagnóstico con preguntas cortas.',
    disparador: 'Alguien llena la encuesta',
    donde: { etiqueta: 'Diagnóstico IA', href: '/admin/diagnostico' },
    modelo: haiku,
    periodo: 'dia',
    topeUsd: topeEnv('DIAGNOSTICO_IA_TOPE_DIARIO_USD', 2),
    gastoUsd: encuesta,
  })
  sumar({
    id: 'propuesta',
    nombre: 'Chat de la propuesta',
    descripcion: 'Resuelve las dudas del cliente sobre la propuesta comercial, sin negociar cifras.',
    disparador: 'El cliente pregunta',
    donde: { etiqueta: 'Propuesta', href: '/admin/propuesta' },
    modelo: haiku,
    periodo: 'dia',
    topeUsd: topeEnv('PROPUESTA_IA_TOPE_DIARIO_USD', 2),
    gastoUsd: propuesta,
  })
  sumar({
    id: 'academia',
    nombre: 'Revisor de prácticas de la academia',
    descripcion: 'Ejecuta la instrucción que escribe cada participante y le dice qué mejorar.',
    disparador: 'Alguien entrega una práctica',
    donde: { etiqueta: 'Academia IA', href: '/admin/academia' },
    modelo: haiku,
    periodo: 'dia',
    topeUsd: topeEnv('ACADEMIA_IA_TOPE_DIARIO_USD', 3),
    gastoUsd: academia,
  })
  sumar({
    id: 'taller',
    nombre: 'Demos en vivo de los talleres',
    descripcion: 'Muestra en la pantalla del taller la respuesta real de Claude a los ejemplos de la capacitación.',
    disparador: 'El presentador lanza una demo',
    donde: { etiqueta: 'Presentaciones', href: '/admin/presentaciones' },
    modelo: haiku,
    periodo: 'dia',
    topeUsd: topeEnv('TALLER_IA_TOPE_DIARIO_USD', 2),
    gastoUsd: taller,
    nota: 'La comparación de modelos usa también Sonnet y Opus. Si no hay IA, muestra la respuesta guardada.',
  })

  return { ia, tareas: tareas ?? catalogoTareas().map((t) => ({ ...t, ultima: null, atrasada: false })), hayClave }
}

// ── Tareas con horario ──────────────────────────────────────────────────

const catalogoTareas = (): Omit<TareaProgramada, 'ultima' | 'atrasada'>[] => [
  {
    id: 'finanzas',
    nombre: 'Avisos diarios de Finanzas',
    descripcion: 'Avisa los vencimientos a 15, 7, 3 y 1 día hábil, escala a Gerencia y envía el resumen de los lunes y del día 1.',
    horario: 'Todos los días, 7:00 a. m.',
    ruta: '/api/cron/finanzas',
    atrasoHoras: 26,
  },
  {
    id: 'talento',
    nombre: 'Resumen semanal de Talento humano',
    descripcion: 'Envía a RR.HH. lo vencido o por vencer en 30 días, las ausencias de la semana y las solicitudes por aprobar. Si no hay nada, no envía.',
    horario: 'Lunes, 7:00 a. m.',
    ruta: '/api/cron/talento-resumen',
    atrasoHoras: 24 * 7 + 2,
  },
]

const claveTarea = (id: string) => `tarea_${id}_ultima`

async function leerTareas(db: Client, ahora: Date): Promise<TareaProgramada[]> {
  const cat = catalogoTareas()
  const r = await db.execute({
    sql: `SELECT clave, valor FROM ajustes WHERE clave IN (${cat.map(() => '?').join(', ')})`,
    args: cat.map((t) => claveTarea(t.id)),
  })
  const filas = new Map((r.rows as any[]).map((f) => [String(f.clave), String(f.valor)]))
  return cat.map((t) => {
    let ultima: TareaProgramada['ultima'] = null
    try {
      const v = filas.get(claveTarea(t.id))
      if (v) ultima = JSON.parse(v)
    } catch {
      ultima = null
    }
    const atrasada = !!ultima && ahora.getTime() - new Date(ultima.fecha).getTime() > t.atrasoHoras * 3600_000
    return { ...t, ultima, atrasada }
  })
}

/** La deja cada /api/cron/<tarea> al terminar, bien o mal. Nunca lanza. */
export async function registrarEjecucion(id: 'finanzas' | 'talento', ok: boolean, detalle: string, ahora = new Date()): Promise<void> {
  try {
    await asegurarEsquema()
    await cliente().execute({
      sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?1, ?2, ?3)
            ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
      args: [claveTarea(id), JSON.stringify({ fecha: ahora.toISOString(), ok, detalle: detalle.slice(0, 300) }), ahora.toISOString()],
    })
  } catch (e) {
    console.error('[automatizaciones] registrar', e instanceof Error ? e.message : e)
  }
}
