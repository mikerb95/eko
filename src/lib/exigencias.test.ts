import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { BASE, PERFILES, aplica, esPerfil, normasDe, ordenar } from './exigencias.ts'

const normativas: { code: string }[] = JSON.parse(
  readFileSync(new URL('../data/normativas.json', import.meta.url), 'utf8'),
)
const codigos = new Set(normativas.map((n) => n.code))

test('cada código del mapa existe en normativas.json', () => {
  for (const p of PERFILES) {
    for (const c of normasDe(p)) assert.ok(codigos.has(c), `${p}: ${c} no está en normativas.json`)
  }
})

test('la base aplica a todos los perfiles', () => {
  for (const p of PERFILES) for (const c of BASE) assert.ok(aplica(p, c))
})

test('ningún perfil repite normas', () => {
  for (const p of PERFILES) assert.equal(new Set(normasDe(p)).size, normasDe(p).length, p)
})

test('los perfiles se distinguen entre sí', () => {
  const firmas = PERFILES.map((p) => normasDe(p).toSorted().join('|'))
  assert.equal(new Set(firmas).size, PERFILES.length)
})

test('ordenar sube las que aplican y conserva el orden dentro de cada grupo', () => {
  const o = ordenar(normativas, 'retail')
  assert.equal(o.length, normativas.length)
  const n = normasDe('retail').length
  assert.ok(o.slice(0, n).every((x) => aplica('retail', x.code)))
  assert.ok(o.slice(n).every((x) => !aplica('retail', x.code)))
  const pos = (c: string) => normativas.findIndex((x) => x.code === c)
  for (let i = 1; i < n; i++) assert.ok(pos(o[i - 1].code) < pos(o[i].code))
})

test('esPerfil filtra valores ajenos', () => {
  assert.ok(esPerfil('telco'))
  assert.ok(!esPerfil('otro'))
  assert.ok(!esPerfil(undefined))
})
