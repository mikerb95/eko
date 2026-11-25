/**
 * Refuerzo de la capacitación 1 (Mike, 2026-11-25). Todo el equipo, 2 horas.
 *
 * Presentación aparte, /academia/taller/5: las cinco ideas de la primera
 * sesión (predice, la mesa de trabajo, verificar, las cuatro partes y la
 * cuenta de Ekosolv) con casos nuevos, sin repetir los ejemplos de la 1, y
 * más tiempo de práctica. Usa los mismos tipos de escena que la 1, así que no
 * toca el motor. Se registra con el número 5 porque el 3 y el 4 quedan para
 * las capacitaciones del programa; en pantalla se llama por su `nombre`.
 *
 * La evaluación de entrada y salida son las mismas cinco preguntas de la 1:
 * la de entrada mide cuánto quedó desde la primera sesión y la de salida,
 * cuánto subió con el refuerzo. Las respuestas se guardan aparte (van con el
 * número 5), así que no cambian los resultados de la 1. Módulo PURO.
 */
import type { Interaccion, Taller } from './tipos.ts'
import { TALLER_1 } from './taller1.ts'

const OPCIONES_SEMAFORO = () => [
  { id: 'si', texto: 'Se sube' },
  { id: 'anon', texto: 'Se sube anonimizado' },
  { id: 'no', texto: 'No se sube' },
]
const OPCIONES_VERDAD = () => [
  { id: 'v', texto: 'Verdad' },
  { id: 'i', texto: 'Inventada' },
]

const PREGUNTAS_EVALUACION = TALLER_1.interacciones.find((i) => i.id === 'pre')!.preguntas
const evaluacion = (id: 'pre' | 'post', titulo: string): Interaccion => ({ id, tipo: 'evaluacion', titulo, preguntas: PREGUNTAS_EVALUACION })

// ---------- Documento y versiones de la demo en vivo ----------
// En la 1 fue un auto (Operaciones). Aquí, un correo desordenado de un
// cliente (Logística), para mostrar que el método sirve igual en cualquier área.

const CORREO = `CORREO DE EJEMPLO
De: Coordinación Ambiental, Planta de Ejemplo S.A.S.
Asunto: RV: recolección

Buenas tardes, como les comenté por teléfono necesitamos que pasen por la sede de Funza. Tenemos unas 40 luminarias dañadas, 3 canecas de aceite usado de la planta eléctrica y como 15 computadores viejos que dio de baja sistemas.

Lo ideal sería antes del 12 porque llega la auditoría.

Ah, y el certificado del lote anterior todavía no nos ha llegado, ¿nos lo pueden reenviar?

Cualquier cosa me escriben o llaman a Laura.
Gracias.`

const V1 = 'Organiza este correo.'
const CONTEXTO =
  'Trabajo en Logística de Ekosolv, empresa de gestión de residuos. Este correo es de un cliente que pide una recolección. Necesito dejarla lista para registrarla en Zoho y responderle.'
const FORMATO =
  'Haz una tabla con las columnas Residuo, Tipo (RAEE, RESPEL o aprovechable), Cantidad, Unidad y Observación. Debajo, lista aparte lo que el cliente pide y no es la recolección. Si un dato no aparece en el correo, escribe "no aparece".'
const EJEMPLO =
  'Usa este ejemplo de fila:\n| Luminarias dañadas | RAEE | 40 | unidades | Confirmar si alguna trae batería |\nAl final, redacta una respuesta al cliente de máximo cinco líneas que confirme lo recibido y pregunte solo lo que falta.'

const DOC = (instr: string) => `${instr}\n\n---\n${CORREO}`

// ---------- El refuerzo ----------

export const REFUERZO_1: Taller = {
  n: 5,
  nombre: 'Refuerzo de la capacitación 1',
  titulo: 'La IA por dentro, con casos nuevos',
  subtitulo: 'Las cinco ideas de la primera sesión, con casos nuevos de Ekosolv y más tiempo de práctica',
  firma: 'Por: Michael Rodriguez',
  modulos: ['general'],
  minutosTotales: 120,
  bloques: [
    { id: 'apertura', titulo: 'Apertura', minutos: 10 },
    { id: 'funciona', titulo: 'Cómo funciona, en corto', minutos: 24 },
    { id: 'verificar', titulo: 'Verificar sin perder tiempo', minutos: 16 },
    { id: 'pedir', titulo: 'Pedir bien, con un caso nuevo', minutos: 31 },
    { id: 'practica', titulo: 'Práctica', minutos: 20 },
    { id: 'seguridad', titulo: 'La cuenta de Ekosolv', minutos: 10 },
    { id: 'cierre', titulo: 'Cierre', minutos: 9 },
  ],
  evaluacion: { pre: 'pre', post: 'post' },
  interacciones: [
    evaluacion('pre', '¿Cuánto nos quedó? Las cinco preguntas de la primera sesión'),
    evaluacion('post', 'Para cerrar: las mismas cinco preguntas'),
    {
      id: 'comp',
      tipo: 'voto',
      titulo: 'Tres situaciones de la semana',
      preguntas: [
        {
          id: 'r1',
          enunciado: 'Le pide dos veces el mismo correo y salen dos redacciones distintas. ¿Qué significa?',
          opciones: [
            { id: 'a', texto: 'Que algo está fallando' },
            { id: 'b', texto: 'Que es normal: elige palabras probables, no siempre las mismas' },
            { id: 'c', texto: 'Que la segunda respuesta es la correcta' },
          ],
          correcta: 'b',
          explicacion: 'Cambiar la redacción es normal. Si lo que cambia es un dato (una fecha, una cifra), está adivinando: vaya al documento.',
        },
        {
          id: 'r2',
          enunciado: 'Abre una conversación nueva para seguir con el informe de ayer. ¿Qué necesita?',
          opciones: [
            { id: 'a', texto: 'Nada, ella se acuerda' },
            { id: 'b', texto: 'Volver a darle el contexto o trabajar dentro de un proyecto' },
            { id: 'c', texto: 'Escribirle "sigue con lo de ayer"' },
          ],
          correcta: 'b',
          explicacion: 'Una conversación nueva empieza con la mesa vacía. Lo que se repite, va fijo en un proyecto.',
        },
        {
          id: 'r3',
          enunciado: 'Le pregunta cuántos kilos dice un certificado que no le adjuntó. ¿Qué es lo más probable?',
          opciones: [
            { id: 'a', texto: 'Que diga que no tiene el certificado' },
            { id: 'b', texto: 'Que escriba una cifra creíble, aunque no exista' },
            { id: 'c', texto: 'Que lo busque solo en Zoho' },
          ],
          correcta: 'b',
          explicacion: 'Sin el documento completa el patrón con un número que suena bien. Por eso se le da el certificado y se le pide citar de dónde sale cada dato.',
        },
      ],
    },
    {
      id: 'verdad',
      tipo: 'voto',
      titulo: '¿Verdad o alucinación? Segunda ronda',
      preguntas: [
        {
          id: 'w1',
          enunciado: 'La Ley 1581 de 2012 dicta las disposiciones generales para la protección de datos personales en Colombia.',
          opciones: OPCIONES_VERDAD(),
          correcta: 'v',
          explicacion: 'Existe: es la ley de datos personales que vigila la Superintendencia de Industria y Comercio.',
        },
        {
          id: 'w2',
          enunciado: 'La Resolución 0874 de 2021 obliga a los gestores de RESPEL a reportar cada semana en la plataforma RESPEL-Web.',
          opciones: OPCIONES_VERDAD(),
          correcta: 'i',
          explicacion: 'Inventada: número, plataforma y obligación suenan oficiales, pero así no existen.',
        },
        {
          id: 'w3',
          enunciado: 'La Ley 1333 de 2009 establece el procedimiento sancionatorio ambiental.',
          opciones: OPCIONES_VERDAD(),
          correcta: 'v',
          explicacion: 'Existe: es la ley del procedimiento sancionatorio ambiental. Fue modificada después: se consulta la versión vigente.',
        },
        {
          id: 'w4',
          enunciado: 'El Decreto 4741 de 2005 obliga al generador de RESPEL a conservar los certificados de disposición final durante dos años.',
          opciones: OPCIONES_VERDAD(),
          correcta: 'i',
          explicacion: 'Inventada: el decreto existe, pero el plazo no es ese. Una norma real con un dato cambiado solo se descubre leyendo el artículo.',
        },
      ],
    },
    {
      id: 'semaforo',
      tipo: 'voto',
      titulo: '¿Se sube o no se sube? Casos nuevos',
      preguntas: [
        { id: 'q1', enunciado: 'Cuenta de Ekosolv: el Excel de facturación del mes, con NIT y valores.', opciones: OPCIONES_SEMAFORO(), correcta: 'si', explicacion: 'Documento de trabajo: se pega completo.' },
        { id: 'q2', enunciado: 'Cuenta de Ekosolv: la hoja de vida de un candidato, para compararla con el cargo.', opciones: OPCIONES_SEMAFORO(), correcta: 'si', explicacion: 'Dato personal de trabajo: completa, solo para esa tarea.' },
        { id: 'q3', enunciado: 'Cuenta de Ekosolv: un reporte de accidente con el diagnóstico, para la lección aprendida.', opciones: OPCIONES_SEMAFORO(), correcta: 'anon', explicacion: 'Salud: basta lo que pasó, sin nombre ni diagnóstico.' },
        { id: 'q4', enunciado: 'La foto del certificado de un cliente, en la IA personal del celular.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'Cuenta personal: espere a estar en la de Ekosolv.' },
        { id: 'q5', enunciado: 'El código que le llegó para entrar a la DIAN o al banco.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'Códigos y claves, nunca, en ninguna IA.' },
      ],
    },
  ],
  demos: [
    {
      id: 'correo',
      documentoTitulo: 'Correo de un cliente (ejemplo)',
      nombreDoc: 'el correo',
      documento: CORREO,
      versiones: [
        {
          id: 'v1',
          parte: 'Solo la tarea',
          agregado: V1,
          instruccion: DOC(V1),
          respaldo:
            'El correo es de la coordinación ambiental de Planta de Ejemplo S.A.S. Piden una recolección en la sede de Funza de luminarias dañadas, aceite usado y computadores dados de baja, idealmente antes del día 12 por una auditoría. También piden reenviar el certificado del lote anterior y dejan el nombre de Laura como contacto.',
        },
        {
          id: 'v2',
          parte: '+ Contexto',
          agregado: CONTEXTO,
          instruccion: DOC(`${CONTEXTO} Organiza este correo.`),
          respaldo:
            'Para registrar en Zoho y responder, esto es lo que pide el cliente:\n\n1. **Recolección en la sede de Funza**: unas 40 luminarias dañadas, 3 canecas de aceite usado de la planta eléctrica y unos 15 computadores dados de baja.\n2. **Fecha**: antes del día 12, porque tienen auditoría.\n3. **Certificado del lote anterior**: dicen que no les ha llegado y piden reenviarlo.\n\nContacto: Laura. Conviene confirmar la dirección y el mes de la fecha antes de programar el vehículo.',
        },
        {
          id: 'v3',
          parte: '+ Formato',
          agregado: FORMATO,
          instruccion: DOC(`${CONTEXTO}\n${FORMATO}`),
          respaldo:
            '| Residuo | Tipo | Cantidad | Unidad | Observación |\n|---|---|---|---|---|\n| Luminarias dañadas | RAEE | 40 | unidades | El cliente dice "unas 40" |\n| Aceite usado de la planta eléctrica | RESPEL | 3 | canecas | no aparece el volumen de cada caneca |\n| Computadores dados de baja | RAEE | 15 | unidades | El cliente dice "como 15" |\n\n**Lo que pide y no es la recolección**\n\n- Reenviar el certificado del lote anterior: no aparece el número de lote.\n- Fecha: antes del 12; no aparece el mes.\n- Dirección exacta de la sede de Funza: no aparece.\n- Teléfono de Laura: no aparece.',
        },
        {
          id: 'v4',
          parte: '+ Ejemplo',
          agregado: EJEMPLO,
          instruccion: DOC(`${CONTEXTO}\n${FORMATO}\n${EJEMPLO}`),
          respaldo:
            '| Residuo | Tipo | Cantidad | Unidad | Observación |\n|---|---|---|---|---|\n| Luminarias dañadas | RAEE | 40 | unidades | Confirmar si alguna trae batería |\n| Aceite usado de la planta eléctrica | RESPEL | 3 | canecas | Confirmar el volumen de cada caneca |\n| Computadores dados de baja | RAEE | 15 | unidades | Cantidad aproximada |\n\n**Lo que pide y no es la recolección**: reenviar el certificado del lote anterior (no aparece el número de lote).\n\n**Respuesta al cliente**\n\nBuenas tardes, Laura. Recibimos la solicitud de recolección en la sede de Funza: 40 luminarias, 3 canecas de aceite usado y 15 computadores. Para programarla antes del 12, ¿nos confirma la dirección exacta, el volumen de cada caneca y si alguna luminaria trae batería? Le reenviamos hoy el certificado del lote anterior; ¿nos indica el número del lote? Gracias.',
        },
      ],
    },
  ],
  escenas: [
    // ── Apertura (10) ──
    {
      id: 'portada',
      bloque: 'apertura',
      tipo: 'portada',
      kicker: 'Refuerzo de la capacitación 1 · Todo el equipo',
      titulo: 'Lo que hay que dominar antes de seguir',
      minutos: 2,
      pasos: 0,
      notas: [
        'Abra explicando para qué es la sesión: "La primera capacitación tuvo muchas ideas en cuatro horas. Hoy volvemos a las cinco que más importan, con casos nuevos, y dedicamos más tiempo a practicar." No es repetir: ningún ejemplo de hoy es el de la primera vez.',
        'Las cinco ideas, en voz alta: la IA predice, no consulta; trabaja con lo que está en la mesa; puede inventar con seguridad y por eso se verifica; se le pide con cuatro partes; y el trabajo va en la cuenta de Ekosolv.',
        'Baje la presión: no es un examen ni una clase de recuperación. Si alguien no fue a la primera sesión, puede seguir sin problema: cada idea se explica desde cero en pocos minutos.',
      ],
      siPreguntan: [
        { p: '¿Esto es lo mismo de la primera vez?', r: 'Son las mismas ideas, pero con ejemplos distintos y más práctica. La primera vez fue un auto de la ANLA; hoy la demo es un correo de un cliente, y las normas del juego y los casos del semáforo son nuevos.' },
      ],
    },
    {
      id: 'sala',
      bloque: 'apertura',
      tipo: 'sala',
      kicker: 'Antes de empezar',
      titulo: 'Saque el celular: hoy también responde',
      minutos: 4,
      pasos: 0,
      notas: [
        'Quien ya se registró en la primera sesión solo escribe su correo y entra de una vez. Quien es nuevo escribe nombre, apellido y área.',
        'Mientras escanean, pregunte a mano alzada: "¿Quién usó la instrucción que guardó en la primera sesión? ¿Le funcionó?" Anote dos o tres casos: los retoma en la práctica.',
        'Pida también un caso en que la IA se haya equivocado esta semana. Es el mejor material para la parte de verificar.',
      ],
    },
    {
      id: 'pre',
      bloque: 'apertura',
      tipo: 'evaluacion',
      kicker: 'Las cinco preguntas',
      titulo: '¿Cuánto nos quedó de la primera sesión?',
      minutos: 4,
      pasos: 0,
      interaccion: 'pre',
      notas: [
        'Diga: "Son las mismas cinco preguntas de la primera vez. Respondan con lo que recuerdan hoy, sin buscar." Así se ve qué quedó después de unos días y qué toca reforzar.',
        'Si tiene a mano los resultados de la primera sesión, compárelos en voz alta al final: la idea que menos aciertos tenga hoy es la que más se trabaja en la práctica.',
        'No dé respuestas ahora: todas se resuelven en las escenas siguientes y al cierre se repiten.',
      ],
    },

    // ── Cómo funciona, en corto (24) ──
    {
      id: 'siguiente',
      bloque: 'funciona',
      tipo: 'siguiente',
      kicker: 'Idea 1 · Predice',
      titulo: 'No busca la respuesta: la escribe, palabra por palabra',
      minutos: 7,
      pasos: 2,
      notas: [
        'Lea la frase y pregunte cómo la terminarían. Casi todos dirán "solicitud". Eso mismo calcula el modelo: la continuación más probable según lo que leyó, no un dato que haya consultado.',
        'Paso 1: use "Elegir el siguiente token" varias veces. Muestre que pega una palabra y vuelve a calcular con la frase más larga. Un correo entero es eso repetido cientos de veces, y en ningún paso verifica lo que escribió.',
        'Paso 2, la temperatura: por eso el mismo pedido da redacciones distintas, y es normal. La señal de alarma no es que cambie la redacción, es que cambie un dato. En claude.ai no hay control de temperatura: se maneja con la instrucción ("cíñete al documento"). Las probabilidades en pantalla son ilustrativas.',
      ],
      siPreguntan: [
        { p: '¿Entonces nunca puedo confiar en lo que escribe?', r: 'Puede confiar en la redacción y en el orden, que es lo que hace bien. Los datos (cifras, fechas, normas, nombres) se confirman contra el documento o la fuente. Esa división del trabajo es la clave.' },
      ],
      datos: {
        frase: 'Para recoger los residuos, el cliente nos envía una',
        opciones: [
          { w: 'solicitud', p: 0.52 },
          { w: 'orden', p: 0.18 },
          { w: 'cotización', p: 0.12 },
          { w: 'carta', p: 0.1 },
          { w: 'factura', p: 0.06 },
          { w: 'canción', p: 0.02 },
        ],
      },
    },
    {
      id: 'inventa',
      bloque: 'funciona',
      tipo: 'inventa',
      kicker: 'Idea 1 · Cuando no tiene el dato',
      titulo: 'Sin el certificado, los kilos se los inventa',
      minutos: 5,
      pasos: 2,
      notas: [
        'Conecte con la escena anterior: "Si la frase es común, la palabra probable suele ser la correcta. Pero miren qué pasa cuando le toca escribir una cifra que no tiene." Señale que ningún valor destaca: todos son casi igual de probables.',
        'Paso 1: igual elige uno, porque su trabajo es seguir escribiendo, y lo escribe con la misma seguridad con la que acierta. No miente a propósito: completa el patrón.',
        'Paso 2, la regla práctica para Logística, Operaciones y Finanzas: kilos, fechas, valores y números de norma nunca se le preguntan de memoria. Se le da el documento y se le pide que diga de dónde sale cada dato. Si no puede señalarlo, no se usa.',
      ],
      siPreguntan: [
        { p: '¿Y si le escribo "no inventes"?', r: 'Ayuda, sobre todo si le da una salida: "si el dato no aparece, escribe no aparece". Pero no lo elimina. Lo que de verdad funciona es darle el documento y revisar.' },
      ],
      datos: {
        frase: 'El certificado de disposición final del lote 4471 reporta',
        // Lo que la IA sigue escribiendo, con la misma seguridad (paso 1).
        sigue: '... de luminarias, entregados al gestor el 14 de marzo.',
        sello: 'Nadie le dio el certificado',
        opciones: [
          { w: '320 kg', p: 0.19 },
          { w: '280 kg', p: 0.18 },
          { w: '415 kg', p: 0.17 },
          { w: '150 kg', p: 0.16 },
          { w: '500 kg', p: 0.15 },
          { w: '275 kg', p: 0.15 },
        ],
      },
    },
    {
      id: 'contexto',
      bloque: 'funciona',
      tipo: 'contexto',
      kicker: 'Idea 2 · La mesa de trabajo',
      titulo: 'Lo que no está en la conversación, no existe para ella',
      minutos: 7,
      pasos: 3,
      notas: [
        'Diga: "La IA solo ve lo que está sobre la mesa: sus mensajes, lo que adjuntó y lo que ella misma respondió. Una conversación nueva es una mesa vacía."',
        'Paso 1, un requerimiento de la DIAN cabe de sobra: no hay razón para darle solo un pedazo. Péguelo completo y pídale que cite el punto de donde sale cada cosa.',
        'Paso 2, un informe anual de un cliente también cabe, pero ocupa buena parte de la mesa. En conversaciones muy largas presta menos atención a lo que quedó en medio: para una tarea puntual, conversación nueva con lo justo.',
        'Paso 3, todos los correos del año no caben: hay que elegir. Y lo que se usa siempre (la plantilla, el manual, los datos de la empresa) va fijo en un proyecto de Claude, para no pegarlo cada vez. Pregunte quién creó un proyecto desde la primera sesión.',
      ],
      siPreguntan: [
        { p: '¿Cuál es la diferencia entre un proyecto y una conversación?', r: 'La conversación es una tarea. El proyecto es la carpeta donde viven los documentos y las instrucciones fijas: cada conversación que abre dentro del proyecto ya los tiene a mano.' },
      ],
      datos: {
        docs: [
          { nombre: 'Requerimiento de la DIAN', paginas: 12, tono: 'deep' },
          { nombre: 'Informe anual de un cliente', paginas: 180, tono: 'forest' },
          { nombre: 'Todos los correos del año', paginas: 6000, tono: 'clay' },
        ],
        capacidad: 400,
      },
    },
    {
      id: 'comp',
      bloque: 'funciona',
      tipo: 'voto',
      kicker: 'Comprobación',
      titulo: 'Tres situaciones de la semana',
      minutos: 5,
      pasos: 3,
      interaccion: 'comp',
      notas: [
        'Diga: "Tres situaciones que les pueden pasar esta semana. Voten en el celular." Espere a que vote la mayoría antes de revelar cada una.',
        'Paso 1, redacciones distintas: es normal. Lo que se vigila es si cambian los datos.',
        'Paso 2, la conversación nueva: empieza vacía. Recuerde los proyectos para lo que se repite.',
        'Paso 3, los kilos sin certificado: lo más probable es que escriba una cifra creíble. Si más de un tercio falló alguna de las tres, dedique dos minutos a repetirla con un ejemplo de la sala antes de seguir.',
      ],
    },

    // ── Verificar sin perder tiempo (16) ──
    {
      id: 'verdad',
      bloque: 'verificar',
      tipo: 'verdad',
      kicker: 'Juego · Segunda ronda',
      titulo: '¿Verdad o alucinación?',
      minutos: 10,
      pasos: 4,
      interaccion: 'verdad',
      notas: [
        'Diga: "Cuatro frases nuevas, como las que podría escribir la IA. Voten si cada una es verdad o inventada." No adelante cuántas son falsas.',
        'Paso 1, Ley 1581 de 2012: verdad. Es la de datos personales, la misma que guía lo que se sube y lo que no.',
        'Paso 2, la "Resolución 0874 de 2021" y "RESPEL-Web": inventada. Pregunte a quien votó verdad por qué: casi siempre es "porque sonaba muy específica". Que sea específica no prueba nada.',
        'Paso 3, Ley 1333 de 2009: verdad. Es la del procedimiento sancionatorio ambiental. Fue modificada después, así que también hay que confirmar que el artículo que se cita sigue vigente: SUIN-Juriscol lo muestra.',
        'Paso 4, la más peligrosa: el Decreto 4741 de 2005 existe (hoy está compilado en el Decreto 1076 de 2015), pero el plazo de "dos años" está cambiado. Una norma real con un dato falso pasa cualquier revisión rápida: no basta con ver que la norma existe, hay que leer el artículo.',
      ],
      siPreguntan: [
        { p: '¿Cuánto tiempo hay que conservar los certificados, entonces?', r: 'Léalo en el artículo vigente del Decreto 1076 de 2015, que compiló el 4741 de 2005, en SUIN-Juriscol. Ese es justo el hábito: no tomar el dato ni de la IA ni de quien dicta sin ir a la fuente.' },
      ],
    },
    {
      id: 'verificar',
      bloque: 'verificar',
      tipo: 'verificar',
      kicker: 'Revisión en cinco minutos',
      titulo: 'Cuatro hábitos, en el orden en que se hacen',
      minutos: 6,
      pasos: 4,
      notas: [
        'La idea: verificar no es leer todo de nuevo. Con estos cuatro hábitos la revisión toma minutos, porque va directo a lo que puede estar mal.',
        'Paso 1, antes de pedir: incluya en la instrucción "indica de dónde sale cada dato; si no aparece, dilo". Es el hábito que más tiempo ahorra después.',
        'Paso 2, normas: número, año y artículo en la fuente oficial, y que siga vigente. Una norma derogada es tan peligrosa como una inventada.',
        'Paso 3, cifras: kilos, fechas, plazos y valores contra el original. Empiece por lo que más daño hace si está mal: un plazo ante la autoridad, un valor en una propuesta, un pago.',
        'Paso 4, lo demasiado perfecto: listas completísimas, cifras redondas, citas exactas sin documento delante. Pregunte a la sala cuál de los cuatro hábitos usaron esta semana y cuál se les olvidó.',
      ],
      datos: {
        pasos: [
          { titulo: 'Pida la fuente desde la instrucción', texto: '"Indica de dónde sale cada dato. Si no aparece, dilo."' },
          { titulo: 'Normas, a la fuente oficial', texto: 'Número, año, artículo y que siga vigente.' },
          { titulo: 'Cifras, contra el original', texto: 'Primero lo que más daño hace si está mal: plazos, valores y pagos.' },
          { titulo: 'Desconfíe de lo demasiado perfecto', texto: 'Si suena muy redondo, revíselo dos veces.' },
        ],
      },
    },

    // ── Pedir bien, con un caso nuevo (31) ──
    {
      id: 'metodo',
      bloque: 'pedir',
      tipo: 'metodo',
      kicker: 'El método, otra vez',
      titulo: 'Las cuatro partes, ahora con un correo',
      minutos: 5,
      pasos: 4,
      notas: [
        'Diga: "La primera vez lo vimos con un auto de la ANLA. Hoy, con un correo de un cliente, para que se vea que el método es el mismo en cualquier área."',
        'Paso 1, contexto: quién es usted y para qué es. Es la parte que más se olvida y la que más cambia la respuesta.',
        'Paso 2, tarea: un verbo claro. "Organiza" es flojo; "pasa a una tabla" o "redacta la respuesta" dejan claro qué hacer.',
        'Paso 3, formato: columnas definidas y qué hacer si falta un dato ("escribe no aparece"). Esa línea es la que más reduce lo inventado.',
        'Paso 4, ejemplo: una fila ya hecha. Enseña más que cualquier descripción. Pase de una vez a la demo.',
      ],
      datos: {
        partes: [
          { id: 'contexto', nombre: 'Contexto', texto: 'Quién es usted, para quién es y qué hay que saber.', ejemplo: 'Trabajo en Logística de Ekosolv. Es un cliente que pide una recolección.' },
          { id: 'tarea', nombre: 'Tarea', texto: 'Qué quiere, con un verbo claro.', ejemplo: 'Pasa la solicitud a una tabla y redacta la respuesta.' },
          { id: 'formato', nombre: 'Formato', texto: 'Cómo lo quiere recibir.', ejemplo: 'Residuo, Tipo, Cantidad, Unidad y Observación. Si falta, "no aparece".' },
          { id: 'ejemplo', nombre: 'Ejemplo', texto: 'Cómo debe quedar, si lo tiene.', ejemplo: '| Luminarias dañadas | RAEE | 40 | unidades | Confirmar batería |' },
        ],
      },
    },
    {
      id: 'constructor',
      bloque: 'pedir',
      tipo: 'constructor',
      kicker: 'En vivo con Claude',
      titulo: 'El mismo correo, cuatro instrucciones',
      minutos: 20,
      pasos: 3,
      demo: 'correo',
      notas: [
        'Muestre el correo con "Ver el correo": está desordenado, como llegan de verdad. Pida con la versión 1, "Organiza este correo", y pregunte: "¿Con esto ya puedo registrar en Zoho?" Es un buen resumen, pero no sirve para trabajar.',
        'Paso 1, más contexto: la respuesta pasa a decir qué hay que registrar y qué falta confirmar, porque entendió para qué era.',
        'Paso 2, más formato: aparece la tabla y, sobre todo, los "no aparece": volumen de las canecas, mes de la fecha, dirección y número del lote. Ahí se ve que no completó los datos que el cliente no dio. Esa es la línea que hay que copiar en todas las instrucciones.',
        'Paso 3, más ejemplo: la tabla toma la forma exacta de la fila de muestra y además sale la respuesta al cliente, que pregunta solo lo que falta. Remate: "Misma IA, mismo correo. Cambió la instrucción." Si la IA no responde, sale la respuesta guardada con su etiqueta; el correo es de ejemplo.',
      ],
      siPreguntan: [
        { p: '¿Puede registrar esto directo en Zoho?', r: 'Sí, con el conector de Zoho que vimos en la primera sesión: Claude pide permiso antes de crear el registro. Pero primero se revisa la tabla: si el dato no aparece en el correo, no se inventa en Zoho.' },
      ],
      datos: { clawd: ['¿Qué correo? ¿Para qué?', '¿Cómo se lo entrego?', '¿Me muestra un ejemplo?', 'Ahora sí: entendido'] },
    },
    {
      id: 'iterar',
      bloque: 'pedir',
      tipo: 'iterar',
      kicker: 'Cuando no sirve',
      titulo: 'Corrija por partes, no empiece de cero',
      minutos: 6,
      pasos: 3,
      notas: [
        'El error más común es borrar todo y volver a empezar. La IA conserva la conversación: corregir por partes es más rápido.',
        'Paso 1, una corrección concreta: "el aceite son canecas de 55 galones". La IA actualiza solo esa fila.',
        'Paso 2, agregar lo que falta: la dirección que le dio el cliente por teléfono. Fíjese en que la IA no rellena lo que nadie le dijo.',
        'Paso 3, guardar: cuando una instrucción funciona, se guarda en un proyecto con la fila de ejemplo. La próxima solicitud sale en un minuto. Si la conversación se enreda después de muchas correcciones, abra una nueva con la instrucción ya corregida.',
      ],
      datos: {
        mensajes: [
          { de: 'usted', texto: 'El aceite son canecas de 55 galones: corrige esa fila.' },
          { de: 'ia', texto: 'Listo, actualicé la fila del aceite: 3 canecas de 55 galones.' },
          { de: 'usted', texto: 'La dirección es la Calle 15 No. 4-22, Funza. Agrégala a la respuesta.' },
          { de: 'ia', texto: 'Agregué la dirección y quité esa pregunta. Sigue faltando el número del lote.' },
        ],
      },
    },

    // ── Práctica (20) ──
    {
      id: 'practica',
      bloque: 'practica',
      tipo: 'practica',
      kicker: 'Práctica',
      titulo: 'Su instrucción, mejorada',
      minutos: 20,
      pasos: 0,
      notas: [
        'Consigna: "Tome la instrucción que guardó en la primera sesión, o elija hoy una tarea de su puesto, y revísela con las cuatro partes. Agréguele la línea: si un dato no aparece, escribe no aparece." El revisor del celular dice qué le falta, no hace la tarea. En el revisor no se pegan documentos con datos personales.',
        'Primeros cinco minutos: recorra la sala. Quien no tenga instrucción guardada, que tome una tarea de esta semana: Logística, una solicitud del correo; Operaciones, las obligaciones de un auto; Finanzas, los puntos de un requerimiento; Gerencia, el correo para retomar una propuesta sin respuesta; Mercadeo, el texto de una pieza; Ventas, del Brief a la propuesta.',
        'Lo que más falta, según la primera sesión: el contexto y qué hacer cuando falta un dato. Si ve el mismo error en varias personas, dígalo en voz alta.',
        'A los 15 minutos, dos voluntarios de áreas distintas muestran su instrucción antes y después. Cierre: "Esta es la que guardan en un proyecto y usan el lunes."',
      ],
      datos: {
        pasos: [
          'Abra la instrucción que guardó, o elija una tarea de esta semana.',
          'Revise que tenga las cuatro partes.',
          'Agregue: "si un dato no aparece, escribe no aparece".',
          'Pásela por el revisor del celular y guárdela en un proyecto.',
        ],
        consigna: 'Mejore una instrucción para una tarea real de su puesto: que tenga contexto, tarea, formato y ejemplo, y que diga qué hacer cuando un dato no aparece.',
      },
    },

    // ── La cuenta de Ekosolv (10) ──
    {
      id: 'semaforo',
      bloque: 'seguridad',
      tipo: 'semaforo',
      kicker: 'Ley 1581 de 2012',
      titulo: '¿Se sube o no se sube? Casos nuevos',
      minutos: 10,
      pasos: 5,
      interaccion: 'semaforo',
      notas: [
        'Recuerde la regla en 30 segundos: lo que decide no es el documento, es la cuenta. En la de Ekosolv (plan Team) el proveedor no entrena con lo que se pega y trata los datos bajo contrato, como pide la Ley 1581. En una cuenta personal no hay nada de eso. Los casos 1 a 3 son en la cuenta de Ekosolv.',
        'Paso 1, el Excel de facturación: se sube completo. Es información de la empresa, confidencial, y justo por eso va en la cuenta de la empresa.',
        'Paso 2, la hoja de vida del candidato: se sube completa, solo para esa tarea. Son datos personales de trabajo, no sensibles.',
        'Paso 3, el accidente con el diagnóstico: anonimizado. La salud es dato sensible: para la lección aprendida basta lo que pasó, sin nombre ni diagnóstico. En un equipo pequeño, revise que no se reconozca a la persona por el contexto.',
        'Paso 4, la foto en la IA personal del celular: no. Es el error más común: se está en la calle y se usa "rapidito" la app personal. En la cuenta de Ekosolv esa misma foto se pegaría completa.',
        'Paso 5, el código de la DIAN o del banco: nunca, en ninguna IA, igual que contraseñas y claves. Cierre con la regla corta: trabajo en la cuenta de Ekosolv y completo; salud, solo lo necesario; claves y códigos, nunca.',
      ],
      siPreguntan: [
        { p: '¿Y si no tengo la cuenta de Ekosolv en el celular?', r: 'Entre con la cuenta de la empresa también en la app del celular. Si no puede en ese momento, espere a estar en el computador: el documento de trabajo no se pega en la cuenta personal.' },
      ],
    },

    // ── Cierre (9) ──
    {
      id: 'post',
      bloque: 'cierre',
      tipo: 'evaluacion',
      kicker: 'Para cerrar',
      titulo: 'Las mismas cinco preguntas',
      minutos: 4,
      pasos: 0,
      interaccion: 'post',
      notas: [
        'Diga: "Las mismas cinco preguntas del inicio. Respondan con lo que saben ahora."',
        'Mientras responden, revise las preguntas del celular pendientes y elija las que vale la pena contestar antes de despedir.',
      ],
    },
    {
      id: 'comparacion',
      bloque: 'cierre',
      tipo: 'comparacion',
      kicker: 'Antes y después',
      titulo: 'Cuánto subió el grupo con el refuerzo',
      minutos: 3,
      pasos: 1,
      notas: [
        'Muestre el promedio al empezar y al terminar. Celebre el avance del grupo, nunca el de personas. Si el salto es pequeño, dígalo y diga qué idea faltó.',
        'Paso 1, pregunta por pregunta: la que siga más baja se convierte en la primera pregunta del repaso de la próxima capacitación. Dígalo para que sepan que no queda suelta.',
      ],
    },
    {
      id: 'cierre',
      bloque: 'cierre',
      tipo: 'cierre',
      kicker: 'Gracias',
      titulo: 'Llévese la tarjeta del refuerzo',
      minutos: 2,
      pasos: 0,
      notas: [
        'Pida que escaneen el código para guardar la tarjeta resumen del refuerzo: las cinco ideas y las dos instrucciones para copiar.',
        'Tarea para la semana: usar la instrucción mejorada en una tarea real y guardarla en un proyecto. Frase de cierre: "La IA escribe rápido y con seguridad; usted pone los datos, la revisión y la cuenta de Ekosolv."',
      ],
    },
  ],
  celular: {
    portada: { idea: 'Hoy repasamos las cinco ideas de la primera capacitación, con casos nuevos y más práctica. En este celular va a votar y a revisar su instrucción.' },
    sala: { idea: 'Ya quedó registrado. Deje esta página abierta: aquí aparecen las preguntas para votar y la práctica.' },
    siguiente: { idea: 'La IA no consulta una base de datos: escribe eligiendo, una tras otra, la palabra más probable. Por eso la misma petición da redacciones distintas, y es normal. Lo que no debe cambiar son los datos.' },
    inventa: { idea: 'Si le pide una cifra que no le dio (los kilos de un certificado, una fecha, un número de norma), igual escribe una que suena creíble. Dele el documento y pídale que diga de dónde sale cada dato.' },
    contexto: { idea: 'La IA solo ve lo que está en la conversación abierta. Una conversación nueva empieza vacía. Lo que usa siempre (plantillas, manuales) déjelo fijo en un proyecto de Claude.' },
    verificar: { idea: 'Para revisar rápido: pida la fuente desde la instrucción, confirme normas en la fuente oficial, compare cifras con el original y desconfíe de lo demasiado perfecto.' },
    metodo: { idea: 'Las cuatro partes sirven en cualquier área: contexto (quién es usted y para qué es), tarea (un verbo claro), formato (cómo lo quiere, y qué hacer si falta un dato) y un ejemplo.' },
    constructor: { idea: 'En pantalla se le pide a Claude el mismo correo cuatro veces, agregando una parte cada vez. Fíjese en los "no aparece": son los datos que no inventó.' },
    iterar: { idea: 'Si la respuesta no sirve del todo, dígale qué cambiar, como a un compañero. Cuando una instrucción le funcione, guárdela en un proyecto.' },
    comparacion: { idea: 'Así cambiaron las respuestas del grupo entre el inicio y el final del refuerzo.' },
    cierre: { idea: 'Guarde la tarjeta resumen del refuerzo. Esta semana use su instrucción mejorada en una tarea real y déjela en un proyecto de Claude.' },
  },
  resumen: {
    ideas: [
      { titulo: 'Predice, no consulta', texto: 'Escribe la palabra más probable, una tras otra. La redacción puede cambiar; los datos no deberían.' },
      { titulo: 'Sin documento, inventa', texto: 'Kilos, fechas, valores y normas se le dan en el documento, nunca se le preguntan de memoria.' },
      { titulo: 'Trabaja con lo que está en la mesa', texto: 'Una conversación nueva empieza vacía. Lo que se repite va fijo en un proyecto.' },
      { titulo: 'Verificar en cinco minutos', texto: 'Pida la fuente desde la instrucción, normas a la fuente oficial, cifras contra el original.' },
      { titulo: 'Cuatro partes y "no aparece"', texto: 'Contexto, tarea, formato y ejemplo. Y qué hacer cuando falta un dato.' },
      { titulo: 'La cuenta de Ekosolv', texto: 'Trabajo completo en la cuenta de la empresa. Salud, solo lo necesario. Claves y códigos, nunca (Ley 1581 de 2012).' },
    ],
    instrucciones: [
      {
        titulo: 'Solicitud del correo a tabla',
        texto: 'Contexto: trabajo en [área] de Ekosolv. Este correo es de un cliente que [lo que pide].\nTarea: pásalo a una tabla y redacta la respuesta.\nFormato: columnas [X, Y, Z]. Si un dato no aparece, escribe "no aparece". Respuesta de máximo cinco líneas que pregunte solo lo que falta.\nEjemplo: [una fila ya hecha].',
      },
      {
        titulo: 'La línea que va en todas',
        texto: 'Para cada dato, indica de dónde sale en el documento. Si no está, escribe "no aparece".',
      },
    ],
  },
}
