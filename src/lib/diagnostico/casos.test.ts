import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ErrorCaso, MAX_ARCHIVOS, nombreSeguro, rutaValida, tipoDe, validarCaso } from './casos.ts'

const lote = 'taller/0f3a9c2e-1b2c-4d5e-8f90-123456789abc'
const base = {
  nombre: 'Laura Gómez',
  area: 'logistica',
  contexto: 'Con este Excel cruzo los kilos contra los certificados del gestor y armo el correo al cliente.',
  fuentes: 'Página de la CAR',
  resultados: ['correo', 'tabla', 'inventado'],
  privacidad: 'con_datos',
  archivos: [{ ruta: `${lote}/recolecciones-octubre-AbC123.xlsx`, nombre: 'Recolecciones octubre.xlsx' }],
}

test('validarCaso: limpia y filtra opciones inventadas', () => {
  const c = validarCaso(base)
  assert.equal(c.area, 'logistica')
  assert.deepEqual(c.resultados, ['tabla', 'correo'])
  assert.equal(c.archivos[0].nombre, 'Recolecciones octubre.xlsx')
})

test('validarCaso: exige lo mínimo', () => {
  assert.throws(() => validarCaso({ ...base, nombre: 'L' }), ErrorCaso)
  assert.throws(() => validarCaso({ ...base, area: 'contabilidad' }), ErrorCaso)
  assert.throws(() => validarCaso({ ...base, contexto: 'cruzar' }), ErrorCaso)
  assert.throws(() => validarCaso({ ...base, privacidad: '' }), ErrorCaso)
  assert.throws(() => validarCaso({ ...base, archivos: [] }), ErrorCaso)
})

test('validarCaso: rechaza rutas fuera del taller, repetidas o de más', () => {
  const malas = [
    { ruta: 'otra/carpeta/x.pdf', nombre: 'x.pdf' },
    { ruta: `${lote}/../../secreto.pdf`, nombre: 'x.pdf' },
    { ruta: `${lote}/script.exe`, nombre: 'script.exe' },
  ]
  for (const a of malas) assert.throws(() => validarCaso({ ...base, archivos: [a] }), ErrorCaso, a.ruta)
  const a = base.archivos[0]
  assert.throws(() => validarCaso({ ...base, archivos: [a, a] }), ErrorCaso)
  const muchos = Array.from({ length: MAX_ARCHIVOS + 1 }, (_, i) => ({ ruta: `${lote}/a${i}.pdf`, nombre: `a${i}.pdf` }))
  assert.throws(() => validarCaso({ ...base, archivos: muchos }), ErrorCaso)
})

test('nombreSeguro y rutaValida: nombres con tildes y espacios quedan en una ruta válida', () => {
  const n = nombreSeguro('Resolución ANLA nº 123 (copia).PDF')
  assert.equal(n, 'Resolucion-ANLA-n-123-copia.pdf')
  assert.ok(rutaValida(`${lote}/${n}`))
  assert.equal(nombreSeguro('...'), 'archivo')
  assert.equal(tipoDe('foto.HEIC'), 'image/heic')
  assert.equal(tipoDe('macro.xlsm'), '')
})
