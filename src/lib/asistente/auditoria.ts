// Rastro de cada decisión sobre una propuesta del asistente: quién la pidió,
// quién la aprobó o la descartó, qué cambiaba y qué pasó al ejecutarla. No se
// purga con las conversaciones.

import type { Client } from '@libsql/client'

export type RegistroAuditoria = {
  conversacion: string
  herramienta: string
  pidio: string
  decidio: string
  decision: 'aprobada' | 'rechazada'
  entrada: unknown
  vista?: unknown
  resultado?: unknown
  ok: boolean
}

export async function registrarDecision(db: Client, r: RegistroAuditoria, ahora = new Date()): Promise<void> {
  await db.execute({
    sql: `INSERT INTO asistente_auditoria (fecha, conversacion, herramienta, pidio, decidio, decision, entrada, vista, resultado, ok)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      ahora.toISOString(),
      r.conversacion,
      r.herramienta,
      r.pidio,
      r.decidio,
      r.decision,
      JSON.stringify(r.entrada ?? {}),
      r.vista === undefined ? '' : JSON.stringify(r.vista),
      r.resultado === undefined ? '' : JSON.stringify(r.resultado),
      r.ok ? 1 : 0,
    ],
  })
}

export type FilaAuditoria = RegistroAuditoria & { id: number; fecha: string }

export async function listarAuditoria(db: Client, opciones: { limite?: number; conversacion?: string } = {}): Promise<FilaAuditoria[]> {
  const r = await db.execute({
    sql: `SELECT * FROM asistente_auditoria ${opciones.conversacion ? 'WHERE conversacion = ?' : ''} ORDER BY id DESC LIMIT ?`,
    args: opciones.conversacion ? [opciones.conversacion, opciones.limite ?? 50] : [opciones.limite ?? 50],
  })
  const json = (v: unknown) => {
    try {
      return v ? JSON.parse(String(v)) : undefined
    } catch {
      return undefined
    }
  }
  return r.rows.map((f: any) => ({
    id: Number(f.id),
    fecha: String(f.fecha),
    conversacion: String(f.conversacion),
    herramienta: String(f.herramienta),
    pidio: String(f.pidio),
    decidio: String(f.decidio),
    decision: String(f.decision) as 'aprobada' | 'rechazada',
    entrada: json(f.entrada),
    vista: json(f.vista),
    resultado: json(f.resultado),
    ok: Number(f.ok) === 1,
  }))
}
