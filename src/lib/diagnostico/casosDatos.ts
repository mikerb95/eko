/**
 * Persistencia de los casos del taller: si se reciben, guardar, listar y
 * borrar (uno o todos, con sus archivos). Ver src/lib/diagnostico/casos.ts.
 *
 * Tiene su propio interruptor, aparte del de la encuesta: la encuesta se
 * cierra cuando ya hay diagnóstico, pero los casos siguen llegando hasta el
 * último taller.
 */
import { asegurarEsquema, cliente } from '../db'
import { borrar, borrarTodo, verificar } from './almacen'
import { CONSENT_CASOS, ErrorCaso, MAX_BYTES, tipoDe, type ArchivoCaso, type Caso, type CasoNuevo } from './casos'

const CLAVE = 'taller_casos'

export interface EstadoCasos {
  abierto: boolean
  usado: boolean
}

export async function leerEstadoCasos(): Promise<EstadoCasos> {
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE] })
  const fila = r.rows[0]
  if (!fila) return { abierto: false, usado: false }
  try {
    return { abierto: !!JSON.parse(String(fila.valor)).abierto, usado: true }
  } catch {
    return { abierto: false, usado: true }
  }
}

async function guardarEstado(abierto: boolean): Promise<EstadoCasos> {
  await asegurarEsquema()
  await cliente().execute({
    sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, ?, ?)
          ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor, actualizado = excluded.actualizado`,
    args: [CLAVE, JSON.stringify({ abierto }), new Date().toISOString()],
  })
  return { abierto, usado: true }
}

export const abrirCasos = () => guardarEstado(true)
export const cerrarCasos = () => guardarEstado(false)
export const casosAbiertos = async () => (await leerEstadoCasos()).abierto

/**
 * Guarda el caso después de confirmar que cada archivo de verdad está en el
 * almacén. El tamaño sale del almacén, no de lo que diga el navegador.
 */
export async function guardarCaso(c: CasoNuevo): Promise<number> {
  const archivos: ArchivoCaso[] = []
  for (const a of c.archivos) {
    const v = await verificar(a.ruta)
    if (!v) throw new ErrorCaso(`El archivo "${a.nombre}" no terminó de subir. Quítelo y vuelva a agregarlo.`)
    if (v.tamano > MAX_BYTES) throw new ErrorCaso(`"${a.nombre}" pesa más de lo permitido.`)
    archivos.push({ ...a, tipo: tipoDe(a.nombre) || tipoDe(a.ruta), tamano: v.tamano })
  }
  await asegurarEsquema()
  const ahora = new Date().toISOString()
  const res = await cliente().execute({
    sql: `INSERT INTO taller_casos (area, nombre, contexto, fuentes, resultados, privacidad, archivos, consent_at, consent_version, creado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      c.area, c.nombre, c.contexto, c.fuentes, JSON.stringify(c.resultados), c.privacidad,
      JSON.stringify(archivos), ahora, CONSENT_CASOS, ahora,
    ],
  })
  return Number(res.lastInsertRowid)
}

const lista = <T>(v: unknown): T[] => {
  try {
    const x = JSON.parse(String(v ?? '[]'))
    return Array.isArray(x) ? x : []
  } catch {
    return []
  }
}

function aCaso(row: Record<string, unknown>): Caso {
  return {
    id: Number(row.id),
    area: String(row.area) as Caso['area'],
    nombre: String(row.nombre ?? ''),
    contexto: String(row.contexto ?? ''),
    fuentes: String(row.fuentes ?? ''),
    resultados: lista<string>(row.resultados),
    privacidad: String(row.privacidad ?? ''),
    archivos: lista<ArchivoCaso>(row.archivos),
    creado: String(row.creado),
  }
}

export async function listarCasos(): Promise<Caso[]> {
  await asegurarEsquema()
  const res = await cliente().execute('SELECT * FROM taller_casos ORDER BY creado DESC')
  return res.rows.map((r) => aCaso(r as any))
}

export async function leerCaso(id: number): Promise<Caso | null> {
  await asegurarEsquema()
  const res = await cliente().execute({ sql: 'SELECT * FROM taller_casos WHERE id = ?', args: [id] })
  return res.rows[0] ? aCaso(res.rows[0] as any) : null
}

/** Borra el caso y sus archivos. Primero los archivos: si eso falla, el caso sigue visible para reintentar. */
export async function eliminarCaso(id: number): Promise<void> {
  const caso = await leerCaso(id)
  if (!caso) return
  await borrar(caso.archivos.map((a) => a.ruta))
  await cliente().execute({ sql: 'DELETE FROM taller_casos WHERE id = ?', args: [id] })
}

/** Al terminar la capacitación: todos los casos y todos los archivos del taller. */
export async function eliminarTodosLosCasos(): Promise<{ archivos: number }> {
  const archivos = await borrarTodo()
  await asegurarEsquema()
  await cliente().execute('DELETE FROM taller_casos')
  return { archivos }
}
