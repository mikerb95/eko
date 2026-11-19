import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TALLERES, tallerDe } from './index.ts'
import { TALLER_1 } from './taller1.ts'
import {
  aplicarTemperatura,
  capitalizarNombre,
  claveNombre,
  registroSala,
  compararEvaluacion,
  contarVotos,
  inicioDeEscenas,
  interaccionDe,
  interaccionPublica,
  muestrear,
  preguntasDeRepaso,
  puntaje,
  reloj,
  tokenizarAprox,
  validarPregunta,
  MAX_PREGUNTA,
  votoValido,
} from './reglas.ts'
import { AREA_IDS } from '../academia/reglas.ts'
import { aHtml } from './formato.ts'
import type { Taller } from './tipos.ts'

test('validarPregunta limpia espacios y rechaza vacías o muy largas', () => {
  assert.equal(validarPregunta('  ¿Y si el auto   está escaneado? '), '¿Y si el auto está escaneado?')
  assert.equal(validarPregunta('  '), null)
  assert.equal(validarPregunta(42), null)
  assert.equal(validarPregunta('a'.repeat(MAX_PREGUNTA + 1)), null)
})

for (const t of Object.values(TALLERES)) {
  test(`taller ${t.n}: ejemplos por área de escenas que existen y para todas las áreas`, () => {
    for (const [escena, porArea] of Object.entries(t.ejemplos ?? {})) {
      assert.ok(t.escenas.some((e) => e.id === escena), `escena ${escena}`)
      for (const a of AREA_IDS) {
        const ej = porArea[a]
        assert.ok(ej?.titulo && ej.texto, `${escena}: falta ${a}`)
        assert.ok(!/[\u2013\u2014]/.test(ej.titulo + ej.texto), `${escena}/${a}: guion largo`)
      }
      assert.deepEqual(Object.keys(porArea).sort(), [...AREA_IDS].sort(), `${escena}: áreas de más`)
    }
  })

  test(`taller ${t.n}: los minutos de bloques y escenas cuadran`, () => {
    const bloques = t.bloques.reduce((a, b) => a + b.minutos, 0)
    assert.equal(bloques, t.minutosTotales)
    for (const b of t.bloques) {
      const escenas = t.escenas.filter((e) => e.bloque === b.id).reduce((a, e) => a + e.minutos, 0)
      assert.equal(escenas, b.minutos, `bloque ${b.id}`)
    }
  })

  test(`taller ${t.n}: referencias válidas`, () => {
    const ids = new Set<string>()
    for (const e of t.escenas) {
      assert.ok(!ids.has(e.id), `escena repetida ${e.id}`)
      ids.add(e.id)
      assert.ok(t.bloques.some((b) => b.id === e.bloque), `bloque de ${e.id}`)
      assert.ok(e.notas.length > 0, `notas de ${e.id}`)
      if (e.interaccion) assert.ok(interaccionDe(t, e.interaccion), `interacción de ${e.id}`)
      if (e.demo) assert.ok(t.demos.some((d) => d.id === e.demo), `demo de ${e.id}`)
    }
    if (t.evaluacion) {
      const pre = interaccionDe(t, t.evaluacion.pre)!
      const post = interaccionDe(t, t.evaluacion.post)!
      assert.equal(pre.preguntas.length, post.preguntas.length)
    }
  })

  test(`taller ${t.n}: preguntas con opciones y respuesta correcta válida`, () => {
    for (const i of t.interacciones) {
      for (const p of i.preguntas) {
        assert.ok(p.opciones.length >= 2, p.id)
        if (p.correcta) assert.ok(p.opciones.some((o) => o.id === p.correcta), `${i.id}:${p.id}`)
        if (i.tipo === 'evaluacion') assert.ok(p.correcta, `evaluación sin correcta ${p.id}`)
      }
    }
  })

  test(`taller ${t.n}: cada versión de cada demo tiene respaldo`, () => {
    for (const d of t.demos) {
      assert.ok(d.versiones.length > 0)
      for (const v of d.versiones) {
        assert.ok(v.respaldo.length > 40, v.id)
        assert.ok(v.instruccion.includes(v.agregado.split('\n')[0]!), `la instrucción incluye lo agregado (${v.id})`)
      }
    }
  })

  test(`taller ${t.n}: sin guion largo en los textos`, () => {
    assert.ok(!/[—–]/.test(JSON.stringify(t)))
  })
}

test('tallerDe', () => {
  assert.equal(tallerDe(1), TALLER_1)
  assert.equal(tallerDe('1'), TALLER_1)
  assert.equal(tallerDe(9), null)
  assert.equal(tallerDe('x'), null)
})

test('interacción pública sin respuestas', () => {
  const i = interaccionPublica(interaccionDe(TALLER_1, 'pre')!)
  assert.ok(!JSON.stringify(i).includes('correcta'))
  assert.ok(!JSON.stringify(i).includes('explicacion'))
})

test('votoValido solo con la interacción abierta y una opción conocida', () => {
  assert.ok(votoValido(TALLER_1, 'pre', 'pre', 'e1', 'b'))
  assert.ok(!votoValido(TALLER_1, 'post', 'pre', 'e1', 'b'))
  assert.ok(!votoValido(TALLER_1, 'pre', 'pre', 'e1', 'z'))
  assert.ok(!votoValido(TALLER_1, 'pre', 'pre', 'x9', 'b'))
  assert.ok(!votoValido(TALLER_1, '', '', 'e1', 'b'))
})

test('contar y puntuar', () => {
  const i = interaccionDe(TALLER_1, 'pre')!
  const filas = [
    { pregunta: 'e1', valor: 'b', usuario_id: 1 },
    { pregunta: 'e1', valor: 'a', usuario_id: 2 },
    { pregunta: 'e2', valor: 'c', usuario_id: 1 },
    { pregunta: 'zz', valor: 'a', usuario_id: 3 },
  ]
  const c = contarVotos(i, filas)
  assert.equal(c.personas, 2)
  assert.equal(c.preguntas.e1!.total, 2)
  assert.equal(c.preguntas.e1!.opciones.b, 1)
  const p = puntaje(i, filas)
  assert.equal(p.aciertos, 2 / 3)
  assert.equal(p.porPregunta[0]!.aciertos, 0.5)
  const post = interaccionDe(TALLER_1, 'post')!
  const comp = compararEvaluacion(i, post, filas, [{ pregunta: 'e1', valor: 'b', usuario_id: 1 }, { pregunta: 'e1', valor: 'b', usuario_id: 2 }])
  assert.equal(comp.preguntas[0]!.antes, 0.5)
  assert.equal(comp.preguntas[0]!.despues, 1)
})

test('repaso toma preguntas de la capacitación anterior', () => {
  const t2 = { ...TALLER_1, n: 2, repaso: { taller: 1, interaccion: 'pre', preguntas: ['e2', 'e4', 'nada'] } } as Taller
  assert.deepEqual(preguntasDeRepaso(t2, TALLER_1).map((p) => p.id), ['e2', 'e4'])
  assert.deepEqual(preguntasDeRepaso(TALLER_1, null), [])
})

test('tiempos', () => {
  assert.deepEqual(inicioDeEscenas(TALLER_1.escenas).slice(0, 4), [0, 2, 7, 12])
  assert.equal(reloj(0), '0:00')
  assert.equal(reloj(65), '1:05')
  assert.equal(reloj(3725), '1:02:05')
})

test('temperatura y muestreo', () => {
  const p = [0.6, 0.3, 0.1]
  const fria = aplicarTemperatura(p, 0.2)
  const caliente = aplicarTemperatura(p, 2)
  assert.ok(Math.abs(fria.reduce((a, b) => a + b) - 1) < 1e-9)
  assert.ok(fria[0]! > 0.95)
  assert.ok(caliente[0]! < 0.6 && caliente[2]! > 0.1)
  assert.equal(muestrear([0.5, 0.5], 0.2), 0)
  assert.equal(muestrear([0.5, 0.5], 0.7), 1)
  assert.equal(muestrear([0.5, 0.5], 0.9999999), 1)
})

test('tokenizador aproximado', () => {
  const t = tokenizarAprox('El auto de la Resolución 1407 de 2018.')
  assert.equal(t.join(''), 'El auto de la Resolución 1407 de 2018.')
  assert.ok(t.includes(' auto'))
  assert.ok(t.some((x) => x === ' Reso' || x === ' Res'), JSON.stringify(t))
  assert.ok(t.includes(' 140') && t.includes('7'))
  assert.ok(t.includes('.'))
})

test('aHtml escapa y reconoce tablas, listas y negrillas', () => {
  const h = aHtml('Hola <script>\n\n| A | B |\n|---|---|\n| **x** | y |\n\n1. uno\n2. dos')
  assert.ok(h.includes('&lt;script&gt;'))
  assert.ok(!h.includes('<script>'))
  assert.ok(h.includes('<table>') && h.includes('<th>A</th>') && h.includes('<strong>x</strong>'))
  assert.ok(h.includes('<ol><li>uno</li><li>dos</li></ol>'))
})

test('registro de la sala: nombres con mayúscula inicial y datos obligatorios', () => {
  assert.equal(capitalizarNombre('maría JOSÉ de la torre'), 'María José De La Torre')
  assert.equal(capitalizarNombre('ana-lucía o\'neil'), 'Ana-Lucía O\'Neil')
  assert.equal(capitalizarNombre('luis '), 'Luis ')
  assert.equal(claveNombre('  María   José Peña '), 'maria jose pena')
  const areas = ['operaciones', 'ventas']
  assert.deepEqual(registroSala({ nombre: ' laura  ', apellido: 'GÓMEZ ruiz', cargo: ' Analista  ambiental ', area: 'ventas' }, areas), {
    nombre: 'Laura',
    apellido: 'Gómez Ruiz',
    cargo: 'Analista ambiental',
    area: 'ventas',
  })
  assert.deepEqual(registroSala({ nombre: 'Laura', apellido: '', cargo: 'x', area: 'ventas' }, areas), { error: 'Escriba su apellido.' })
  assert.deepEqual(registroSala({ nombre: 'Laura', apellido: 'Gómez', cargo: 'x', area: 'otra' }, areas), { error: 'Elija su área.' })
})
