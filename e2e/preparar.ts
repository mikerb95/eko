// Base nueva para cada corrida: esquema real y datos de ejemplo.
import { createClient } from '@libsql/client'
import { rmSync } from 'node:fs'
import { COLUMNAS, TABLAS } from '../src/lib/esquema.ts'

export default async function preparar() {
  for (const sufijo of ['', '-wal', '-shm']) rmSync(`./data/e2e.db${sufijo}`, { force: true })
  const db = createClient({ url: 'file:./data/e2e.db' })
  for (const sql of TABLAS) await db.execute(sql)
  for (const [tabla, columna] of COLUMNAS) {
    await db.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} TEXT NOT NULL DEFAULT ''`).catch(() => {})
  }
  const ts = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO orders (consecutive, status, first_name, last_name, email, phone, company, address, city, waste_type, created_at, updated_at)
          VALUES ('REC-2026-0001', 'solicitada', 'Juana', 'Pérez', 'juana@correo.co', '3105551234', 'Acme SAS', 'Av. Industrial 100', 'Funza', 'raee_computo', ?, ?)`,
    args: [ts, ts],
  })
  await db.execute({
    sql: `INSERT INTO contacts (name, email, company, message, status, created_at, updated_at) VALUES ('Pedro Ruiz', 'pedro@correo.co', 'Constructora Uno', 'Necesito asesoría RAEE', 'nuevo', ?, ?)`,
    args: [ts, ts],
  })
  db.close()
}
