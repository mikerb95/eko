import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  avanceDe,
  codigoCertificado,
  enlaceSeguro,
  esCodigo,
  leccionesDeRuta,
  renderContenido,
  requisitosCertificado,
  rutaDe,
  sesionesDeRuta,
  textoHoras,
} from './reglas.ts'
import { leccionesSemilla } from './semilla.ts'
import { prepararInstruccion, pulirRevision, validarInstruccion } from './practica.ts'

const RAYA = '—'
const L = (id: number, modulo: string, orden: number, publicada = true, ejercicio = '') => ({ id, modulo, orden, publicada, ejercicio })
const S = (id: number, fecha: string, horas: number, modulos: string[]) => ({ id, fecha, horas, modulos })

test('la ruta es general más el área; un área desconocida solo ve general', () => {
  assert.deepEqual(rutaDe('logistica'), ['general', 'logistica'])
  assert.deepEqual(rutaDe('inventada'), ['general'])
})

test('lecciones de la ruta: solo publicadas, general primero y por orden', () => {
  const ls = [L(1, 'ventas', 1), L(2, 'operaciones', 2), L(3, 'general', 2), L(4, 'operaciones', 1), L(5, 'general', 1, false)]
  assert.deepEqual(leccionesDeRuta(ls, 'operaciones').map((l) => l.id), [3, 4, 2])
  assert.deepEqual(leccionesDeRuta(ls, 'operaciones', true).map((l) => l.id), [5, 3, 4, 2])
})

test('sesiones de la ruta: las de general y las compartidas con su área', () => {
  const ss = [S(1, '2026-11-14', 4, ['general']), S(2, '2026-11-21', 4, ['operaciones']), S(3, '2026-11-28', 1, ['operaciones', 'logistica']), S(4, '2026-11-28', 1.5, ['ventas'])]
  assert.deepEqual(sesionesDeRuta(ss, 'logistica').map((s) => s.id), [1, 3])
})

test('avance y certificado: exige toda la asistencia y todas las entregas aprobadas', () => {
  const ls = [L(1, 'general', 1), L(2, 'general', 2, true, 'Resuelva una tarea'), L(3, 'logistica', 1, true, 'Certificado')]
  const ss = [S(1, '2026-11-14', 4, ['general']), S(2, '2026-11-28', 1.5, ['logistica'])]
  let a = avanceDe('logistica', ls, ss, new Set([1]), [{ leccion_id: 2, estado: 'aprobada' }, { leccion_id: 3, estado: 'enviada' }], new Set([1]))
  assert.equal(a.porcentaje, 33)
  assert.equal(a.horas, 4)
  let r = requisitosCertificado(a)
  assert.equal(r.elegible, false)
  assert.equal(r.faltan.length, 2)

  a = avanceDe('logistica', ls, ss, new Set([1, 2, 3]), [{ leccion_id: 2, estado: 'aprobada' }, { leccion_id: 3, estado: 'aprobada' }], new Set([1, 2]))
  r = requisitosCertificado(a)
  assert.equal(r.elegible, true)
  assert.equal(r.horas, 5.5)
})

test('sin sábados ni ejercicios no hay certificado', () => {
  const r = requisitosCertificado(avanceDe('ventas', [L(1, 'general', 1)], [], new Set([1]), [], new Set()))
  assert.equal(r.elegible, false)
  assert.equal(r.faltan.length, 2)
})

test('código de certificado: formato fijo y sin caracteres confusos', () => {
  const c = codigoCertificado(() => new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]))
  assert.equal(c, 'EKO-IA-ABCD-EFGH')
  for (let i = 0; i < 50; i++) assert.ok(esCodigo(codigoCertificado()))
  assert.equal(esCodigo('EKO-IA-ABCD-EFG0'), false)
})

test('el contenido se escapa antes de dar formato', () => {
  const html = renderContenido('## Título\n\nHola **mundo** <script>alert(1)</script>\n\n- uno\n- dos\n\n1. a\n2. b')
  assert.ok(html.includes('<h3>Título</h3>'))
  assert.ok(html.includes('<strong>mundo</strong>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('<ul><li>uno</li><li>dos</li></ul>'))
  assert.ok(html.includes('<ol><li>a</li><li>b</li></ol>'))
})

test('enlaces: solo http(s)', () => {
  assert.equal(enlaceSeguro('javascript:alert(1)'), '')
  assert.equal(enlaceSeguro('https://drive.google.com/x'), 'https://drive.google.com/x')
  assert.equal(enlaceSeguro(''), '')
})

test('horas en texto', () => {
  assert.equal(textoHoras(1), '1 hora')
  assert.equal(textoHoras(5.5), '5,5 horas')
})

test('la semilla cubre todos los módulos, sin claves repetidas ni rayas', () => {
  const s = leccionesSemilla()
  assert.equal(new Set(s.map((l) => l.semilla)).size, s.length)
  for (const m of ['general', 'operaciones', 'logistica', 'ventas', 'mercadeo', 'gerencia', 'finanzas']) {
    assert.ok(s.some((l) => l.modulo === m && l.ejercicio), `falta la entrega de ${m}`)
  }
  for (const l of s) assert.ok(!/[–—]/.test(JSON.stringify(l)), `raya en ${l.semilla}`)
})

test('práctica: valida el largo y tapa datos de contacto', () => {
  assert.equal(validarInstruccion('corto'), null)
  assert.ok(validarInstruccion('Resume este auto en una tabla con plazos'))
  const p = prepararInstruccion('Escríbele a juan@cliente.co o al 3105551234 sobre el auto')
  assert.ok(p.ocultos)
  assert.ok(!p.texto.includes('juan@cliente.co'))
  assert.ok(!p.texto.includes('3105551234'))
})

test('práctica: la revisión sale con los cuatro criterios en orden y sin rayas', () => {
  const r = pulirRevision(
    { criterios: [{ id: 'formato', nivel: 'falta', comentario: `Falta ${RAYA} formato` }], datos_sensibles: '', resumen: 'Ok', version_mejorada: 'x' },
    false,
  )
  assert.deepEqual(r.criterios.map((c) => c.id), ['contexto', 'tarea', 'formato', 'ejemplos'])
  assert.equal(r.criterios[2]!.nivel, 'falta')
  assert.ok(!r.criterios[2]!.comentario.includes(RAYA))
})
