import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ZONA, blipsRadar, choques, cruzo, distanciaAngular, giroHacia, normalizar, polar } from './radarGeom.ts'

test('un punto por norma, con las destacadas primero', () => {
  const b = blipsRadar(10, 3)
  assert.equal(b.length, 10)
  assert.deepEqual(b.slice(0, 3).map((x) => x.destacado), [0, 1, 2])
  assert.ok(b.slice(3).every((x) => x.destacado === null))
})

test('los puntos quedan dentro del radar', () => {
  for (const x of blipsRadar(40, 3)) {
    assert.ok(x.radio > 0.2 && x.radio < 0.95, `radio ${x.radio}`)
    assert.ok(x.angulo >= 0 && x.angulo < 360, `ángulo ${x.angulo}`)
  }
})

test('nunca hay más destacadas que puntos', () => {
  assert.equal(blipsRadar(2, 3).length, 2)
  assert.equal(blipsRadar(2, 3).filter((x) => x.destacado !== null).length, 2)
  assert.equal(blipsRadar(0, 3).length, 0)
})

test('todos los puntos caen en la parte visible del radar', () => {
  for (const total of [1, 3, 10, 14]) {
    for (const b of blipsRadar(total, 3)) {
      const p = polar(b.angulo, b.radio, 1)
      assert.ok(p.x >= ZONA.xMin - 0.01, `x ${p.x} (${b.angulo}°, ${b.radio})`)
      assert.ok(p.y >= ZONA.yMin - 0.01 && p.y <= ZONA.yMax + 0.01, `y ${p.y} (${b.angulo}°, ${b.radio})`)
    }
  }
})

test('con las 10 normas, ningún rótulo choca con otro ni tapa un punto', () => {
  const p = blipsRadar(10, 3).map((b) => polar(b.angulo, b.radio, 1))
  for (let i = 0; i < p.length; i++) {
    for (let j = i + 1; j < p.length; j++) assert.equal(choques(p[i], p[j]), 0, `${i} y ${j}`)
  }
})

test('las destacadas quedan espaciadas para que el haz las visite a ritmo parejo', () => {
  const dest = blipsRadar(10, 3).filter((x) => x.destacado !== null).map((x) => x.angulo).sort((a, b) => a - b)
  for (let i = 1; i < dest.length; i++) assert.ok(dest[i] - dest[i - 1] > 45, dest.join(', '))
})

test('las normas sin ficha no se pegan a una destacada', () => {
  const b = blipsRadar(10, 3)
  const dest = b.filter((x) => x.destacado !== null)
  for (const x of b.filter((y) => y.destacado === null)) {
    for (const d of dest) {
      const cerca = distanciaAngular(d.angulo, x.angulo) < 14 && Math.abs(d.radio - x.radio) < 0.2
      assert.ok(!cerca, `(${x.angulo}, ${x.radio}) choca con (${d.angulo}, ${d.radio})`)
    }
  }
})

test('es determinista: el servidor y el navegador pintan lo mismo', () => {
  assert.deepEqual(blipsRadar(10, 3), blipsRadar(10, 3))
})

test('cruzo detecta el paso del haz, también al dar la vuelta', () => {
  assert.equal(cruzo(40, 60, 52), true)
  assert.equal(cruzo(40, 50, 52), false)
  assert.equal(cruzo(350, 370, 5), true)
  assert.equal(cruzo(350, 10, 5), true)
  assert.equal(cruzo(350, 10, 20), false)
  assert.equal(cruzo(52, 52, 52), false)
  // El borde de salida cuenta, el de entrada no: un punto no destella dos veces.
  assert.equal(cruzo(52, 60, 52), false)
  assert.equal(cruzo(40, 52, 52), true)
})

test('normalizar y distancia angular', () => {
  assert.equal(normalizar(-10), 350)
  assert.equal(normalizar(720), 0)
  assert.equal(distanciaAngular(350, 10), 20)
  assert.equal(distanciaAngular(0, 180), 180)
})

test('polar: 0 grados es arriba y 90 a la derecha', () => {
  assert.deepEqual(polar(0, 1), { x: 0, y: -100 })
  const d = polar(90, 0.5)
  assert.equal(Math.round(d.x), 50)
  assert.equal(Math.round(d.y), 0)
})

test('giroHacia siempre avanza y respeta la vuelta mínima', () => {
  assert.equal(giroHacia(10, 50), 40)
  assert.equal(giroHacia(50, 10), 320)
  assert.equal(giroHacia(10, 50, 90), 400)
})
