import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emparejar, tiempoPara, type Curva } from './transicion.ts'

const sep = (s: string) => s.split(' ')

test('el kicker conserva "Idea" y el punto, y el número rueda', () => {
  const r = emparejar(sep('Idea 3 · Tokens'), sep('Idea 4 · Predecir'), true)
  assert.deepEqual(r.pares, [[0, 0], [2, 2]])
  assert.deepEqual(r.numeros, [[1, 1]])
})

test('las palabras largas compartidas se quedan aunque cambien de lugar', () => {
  const r = emparejar(sep('Un programa sigue reglas. Un modelo aprende de ejemplos'), sep('Un modelo aprende de ejemplos'))
  // "modelo aprende de ejemplos" se queda completa ("de" por ir pegada); el
  // primer "Un" queda suelto y no vuela.
  assert.deepEqual(r.pares, [[5, 1], [6, 2], [7, 3], [8, 4]])
})

test('una palabra corta suelta no se empareja', () => {
  const r = emparejar(sep('Un programa sigue reglas de oro'), sep('Millones de perillas que se ajustan solas'))
  assert.deepEqual(r.pares, [])
})

test('los signos y las mayúsculas no impiden el emparejo', () => {
  const r = emparejar(sep('Primero lee casi todo.'), sep('Después lee TODO'))
  assert.ok(r.pares.some(([i, j]) => i === 3 && j === 2))
})

test('tiempoPara es la inversa de la curva', () => {
  const lineal: Curva = [0, 0, 1, 1]
  assert.ok(Math.abs(tiempoPara(lineal, 0.3) - 0.3) < 1e-6)
  const io: Curva = [0.65, 0, 0.35, 1]
  assert.ok(Math.abs(tiempoPara(io, 0.5) - 0.5) < 1e-6)
  assert.ok(tiempoPara(io, 0.1) > 0.1)
  assert.equal(tiempoPara(io, 0), 0)
  assert.equal(tiempoPara(io, 1), 1)
})
