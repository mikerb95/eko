/**
 * Capacitación 1: qué es la IA, por dentro. Todo el equipo, 4 horas.
 *
 * Contenido de la presentación /academia/taller/1. Módulo PURO. Se alinea con
 * las lecciones de la capacitación general de la academia
 * (src/lib/academia/semilla.ts), que quedan como material de repaso.
 *
 * Lo marcado como `provisional` es contenido de ejemplo que se reemplaza por
 * documentos reales de Ekosolv cuando lleguen (el documento de la demo, las
 * citas del juego de verdad o alucinación y los casos del semáforo). La vista
 * de presentador lo avisa.
 */
import type { Interaccion, Pregunta, Taller } from './tipos.ts'
import { CELULAR_TALLER1 } from './ejemplos1.ts'

// ---------- Evaluación de entrada y salida (las mismas preguntas) ----------

const EVALUACION: Pregunta[] = [
  {
    id: 'e1',
    enunciado: 'Cuando Claude le responde, ¿qué está haciendo?',
    opciones: [
      { id: 'a', texto: 'Busca la respuesta en una base de datos' },
      { id: 'b', texto: 'Predice el texto más probable, pieza por pieza' },
      { id: 'c', texto: 'Copia una página de internet' },
      { id: 'd', texto: 'Le pregunta a una persona' },
    ],
    correcta: 'b',
    explicacion: 'Redacta prediciendo la siguiente pieza de texto a partir de lo que aprendió y de lo que usted le da.',
  },
  {
    id: 'e2',
    enunciado: 'La IA le cita una resolución que usted no conoce. ¿Qué hace?',
    opciones: [
      { id: 'a', texto: 'La uso: en normas no se equivoca' },
      { id: 'b', texto: 'Le pregunto si está segura y, si dice que sí, la uso' },
      { id: 'c', texto: 'La verifico en la fuente oficial antes de usarla' },
    ],
    correcta: 'c',
    explicacion: 'Puede citar normas que no existen o que fueron derogadas, y hacerlo con total seguridad.',
  },
  {
    id: 'e3',
    enunciado: '¿Qué le falta a la instrucción "Resúmeme este auto"?',
    opciones: [
      { id: 'a', texto: 'Nada, es clara' },
      { id: 'b', texto: 'Contexto, para qué es y en qué formato lo quiere' },
      { id: 'c', texto: 'Decirle "por favor"' },
    ],
    correcta: 'b',
    explicacion: 'Sin contexto ni formato, la IA adivina para quién es y qué importa.',
  },
  {
    id: 'e4',
    enunciado: '¿Dónde puede pegar un certificado con la cédula y el teléfono del conductor?',
    opciones: [
      { id: 'a', texto: 'Sí, en la cuenta de IA de Ekosolv' },
      { id: 'b', texto: 'Sí, en la que tenga abierta, incluso la personal' },
      { id: 'c', texto: 'Solo si el cliente es antiguo' },
    ],
    correcta: 'a',
    explicacion: 'En la cuenta de la empresa el proveedor no entrena con lo que se pega y trata los datos bajo contrato, como pide la Ley 1581 de 2012. En una cuenta personal, no.',
  },
  {
    id: 'e5',
    enunciado: 'Ayer le explicó un caso a la IA. Hoy abre una conversación nueva. ¿Lo recuerda?',
    opciones: [
      { id: 'a', texto: 'Sí, siempre recuerda todo' },
      { id: 'b', texto: 'No, salvo que le vuelva a dar el contexto o esté en un proyecto' },
      { id: 'c', texto: 'Solo si fue hace menos de una semana' },
    ],
    correcta: 'b',
    explicacion: 'Trabaja con lo que está en la conversación (y en el proyecto, si lo usa). Lo demás no lo ve.',
  },
]

const evaluacion = (id: 'pre' | 'post', titulo: string): Interaccion => ({ id, tipo: 'evaluacion', titulo, preguntas: EVALUACION })

// ---------- Documento y versiones de la demo en vivo ----------

const AUTO = `AUTO No. 0000 DE 2026 (DOCUMENTO DE EJEMPLO)
"Por el cual se efectúa seguimiento y control ambiental y se imponen unas obligaciones"

La autoridad ambiental, en ejercicio de sus funciones de seguimiento, revisó el Plan de Manejo Ambiental de la sociedad PLANTA DE EJEMPLO S.A.S., proyecto "Planta de ensamble de luminarias", ubicado en el municipio de Funza (Cundinamarca).

DISPONE:

ARTÍCULO PRIMERO. Requerir a PLANTA DE EJEMPLO S.A.S. para que, en un término de treinta (30) días hábiles contados a partir de la ejecutoria del presente acto, presente los certificados de disposición final de las luminarias y bombillas desechadas durante el año 2025, emitidos por un gestor con licencia ambiental vigente.

ARTÍCULO SEGUNDO. Requerir para que en el próximo Informe de Cumplimiento Ambiental (ICA) incluya el registro mensual de generación de residuos peligrosos, en kilogramos.

ARTÍCULO TERCERO. Requerir para que, en un término de dos (2) meses, actualice la ficha PMA-07 de manejo de residuos de aparatos eléctricos y electrónicos, de acuerdo con la Ley 1672 de 2013 y el Decreto 284 de 2018.

ARTÍCULO CUARTO. El incumplimiento de las obligaciones aquí impuestas dará lugar a las medidas preventivas y sanciones previstas en la Ley 1333 de 2009.

ARTÍCULO QUINTO. Notificar el contenido del presente acto al representante legal de la sociedad.`

const V1 = 'Resúmeme este auto.'
const CONTEXTO = 'Soy consultor ambiental de Ekosolv. Este auto es de seguimiento a un cliente nuestro, una planta de luminarias en Funza. Necesito saber qué tenemos que hacer.'
const FORMATO = 'Extrae todas las obligaciones en una tabla con las columnas Obligación, Artículo, Plazo y Responsable. Si un dato no aparece en el auto, escribe "no aparece".'
const EJEMPLO =
  'Usa este ejemplo de fila:\n| Presentar certificados de disposición final de luminarias 2025 | Art. 1 | 30 días hábiles desde la ejecutoria | Cliente, con apoyo de Ekosolv |\nAl final, en dos frases, dime cuál es la obligación más urgente y por qué.'

const DOC = (instr: string) => `${instr}\n\n---\n${AUTO}`

// ---------- La capacitación ----------

export const TALLER_1: Taller = {
  n: 1,
  titulo: 'Inteligencia artificial, por dentro',
  subtitulo: 'Qué es, cómo funciona, en qué sirve y cómo usarla con seguridad en Ekosolv',
  modulos: ['general'],
  minutosTotales: 240,
  bloques: [
    { id: 'apertura', titulo: 'Apertura', minutos: 15 },
    { id: 'dentro', titulo: 'Qué es la IA por dentro', minutos: 65 },
    { id: 'alcances', titulo: 'Alcances y límites', minutos: 35 },
    { id: 'descanso', titulo: 'Descanso', minutos: 15 },
    { id: 'pedir', titulo: 'Cómo pedir', minutos: 45 },
    { id: 'practica', titulo: 'Práctica guiada', minutos: 30 },
    { id: 'seguridad', titulo: 'Seguridad y Ley 1581', minutos: 20 },
    { id: 'cierre', titulo: 'Cierre', minutos: 15 },
  ],
  evaluacion: { pre: 'pre', post: 'post' },
  interacciones: [
    evaluacion('pre', 'Antes de empezar: cinco preguntas'),
    evaluacion('post', 'Para cerrar: las mismas cinco preguntas'),
    {
      id: 'comp',
      tipo: 'voto',
      titulo: 'Comprobación',
      preguntas: [
        {
          id: 'c1',
          enunciado: '¿Qué es un token?',
          opciones: [
            { id: 'a', texto: 'Una contraseña para entrar a la IA' },
            { id: 'b', texto: 'Un pedazo de texto: una palabra o parte de ella' },
            { id: 'c', texto: 'Una moneda digital' },
          ],
          correcta: 'b',
          explicacion: 'La IA lee y escribe en tokens: palabras enteras o trozos de palabra.',
        },
        {
          id: 'c2',
          enunciado: 'Si le pide lo mismo dos veces, la respuesta…',
          opciones: [
            { id: 'a', texto: 'Es idéntica, palabra por palabra' },
            { id: 'b', texto: 'Puede cambiar, porque elige entre varias opciones probables' },
          ],
          correcta: 'b',
          explicacion: 'Elige con cierto azar entre las opciones probables: el sentido se mantiene, la redacción cambia.',
        },
      ],
    },
    {
      id: 'verdad',
      tipo: 'voto',
      titulo: '¿Verdad o alucinación?',
      preguntas: [
        {
          id: 'v1',
          enunciado: 'La Ley 1672 de 2013 establece los lineamientos de la política pública de gestión integral de RAEE.',
          opciones: [
            { id: 'v', texto: 'Verdad' },
            { id: 'i', texto: 'Inventada' },
          ],
          correcta: 'v',
          explicacion: 'Existe: es la ley de RAEE en Colombia.',
        },
        {
          id: 'v2',
          enunciado: 'La Resolución 2290 de 2019 obliga a todo generador de RAEE a reportar cada mes en el sistema SIRAEE.',
          opciones: [
            { id: 'v', texto: 'Verdad' },
            { id: 'i', texto: 'Inventada' },
          ],
          correcta: 'i',
          explicacion: 'Inventada: número, obligación y sistema suenan creíbles, pero no existen así.',
        },
        {
          id: 'v3',
          enunciado: 'La Resolución 1407 de 2018 reglamenta la gestión ambiental de los residuos de envases y empaques.',
          opciones: [
            { id: 'v', texto: 'Verdad' },
            { id: 'i', texto: 'Inventada' },
          ],
          correcta: 'v',
          explicacion: 'Existe: es la norma de responsabilidad extendida de envases y empaques.',
        },
        {
          id: 'v4',
          enunciado: 'El Decreto 1076 de 2015 fija una multa única de 50 salarios mínimos por no entregar el certificado de disposición final.',
          opciones: [
            { id: 'v', texto: 'Verdad' },
            { id: 'i', texto: 'Inventada' },
          ],
          correcta: 'i',
          explicacion: 'Inventada: el decreto existe, pero esa multa no. Una norma real con un dato falso es la alucinación más peligrosa.',
        },
      ],
    },
    {
      id: 'semaforo',
      tipo: 'voto',
      titulo: '¿Se sube o no se sube?',
      preguntas: [
        { id: 's1', enunciado: 'El texto de una resolución publicada por la autoridad ambiental.', opciones: OPCIONES_SEMAFORO(), correcta: 'si', explicacion: 'Es un documento público.' },
        { id: 's2', enunciado: 'En la cuenta de Ekosolv: un certificado con el nombre y la cédula del conductor.', opciones: OPCIONES_SEMAFORO(), correcta: 'si', explicacion: 'En la cuenta de la empresa se pega completo.' },
        { id: 's3', enunciado: 'En la cuenta de Ekosolv: las incapacidades del personal, para contar días perdidos.', opciones: OPCIONES_SEMAFORO(), correcta: 'anon', explicacion: 'Dato de salud: bastan las cifras, sin nombres ni diagnósticos.' },
        { id: 's4', enunciado: 'El correo de un cliente, con su celular, en su IA personal gratuita.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'En la cuenta personal no hay contrato que proteja los datos.' },
        { id: 's5', enunciado: 'La contraseña de Zoho, para que la IA "revise" algo.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'Contraseñas y claves, nunca.' },
      ],
    },
  ],
  demos: [
    {
      id: 'auto',
      documentoTitulo: 'Auto de seguimiento (ejemplo)',
      documento: AUTO,
      provisional: true,
      versiones: [
        {
          id: 'v1',
          parte: 'Solo la tarea',
          agregado: V1,
          instruccion: DOC(V1),
          respaldo:
            'El auto corresponde a una actuación de seguimiento ambiental a la sociedad Planta de Ejemplo S.A.S., titular de un Plan de Manejo Ambiental para una planta de luminarias en Funza. La autoridad revisó el proyecto e impuso varios requerimientos relacionados con la gestión de residuos, entre ellos certificados de disposición final, información para el ICA y la actualización de una ficha del PMA. Advierte que el incumplimiento puede generar sanciones y ordena notificar al representante legal.',
        },
        {
          id: 'v2',
          parte: '+ Contexto',
          agregado: CONTEXTO,
          instruccion: DOC(`${CONTEXTO} Resúmeme este auto.`),
          respaldo:
            'Para su cliente, el auto implica tres tareas concretas:\n\n1. **Certificados de disposición final** de las luminarias y bombillas desechadas en 2025, emitidos por un gestor con licencia vigente. Plazo: 30 días hábiles desde la ejecutoria.\n2. **Registro mensual de residuos peligrosos** en kilogramos, dentro del próximo ICA.\n3. **Actualizar la ficha PMA-07** de RAEE según la Ley 1672 de 2013 y el Decreto 284 de 2018. Plazo: 2 meses.\n\nSi no cumplen, la autoridad puede aplicar medidas preventivas y sanciones de la Ley 1333 de 2009.',
        },
        {
          id: 'v3',
          parte: '+ Formato',
          agregado: FORMATO,
          instruccion: DOC(`${CONTEXTO}\n${FORMATO}`),
          respaldo:
            '| Obligación | Artículo | Plazo | Responsable |\n|---|---|---|---|\n| Presentar certificados de disposición final de luminarias y bombillas de 2025, de gestor con licencia vigente | Art. 1 | 30 días hábiles desde la ejecutoria | Planta de Ejemplo S.A.S. |\n| Incluir en el ICA el registro mensual de residuos peligrosos en kg | Art. 2 | Próximo ICA | Planta de Ejemplo S.A.S. |\n| Actualizar la ficha PMA-07 de RAEE (Ley 1672 de 2013 y Decreto 284 de 2018) | Art. 3 | 2 meses | Planta de Ejemplo S.A.S. |\n| Notificar el acto al representante legal | Art. 5 | no aparece | Autoridad ambiental |',
        },
        {
          id: 'v4',
          parte: '+ Ejemplo',
          agregado: EJEMPLO,
          instruccion: DOC(`${CONTEXTO}\n${FORMATO}\n${EJEMPLO}`),
          respaldo:
            '| Obligación | Artículo | Plazo | Responsable |\n|---|---|---|---|\n| Presentar certificados de disposición final de luminarias 2025 | Art. 1 | 30 días hábiles desde la ejecutoria | Cliente, con apoyo de Ekosolv |\n| Incluir en el ICA el registro mensual de residuos peligrosos (kg) | Art. 2 | Próximo ICA | Cliente, con apoyo de Ekosolv |\n| Actualizar la ficha PMA-07 de RAEE | Art. 3 | 2 meses | Ekosolv, con información del cliente |\n\nLa más urgente es la del **artículo primero**: tiene el plazo más corto (30 días hábiles) y depende de que el gestor entregue los certificados a tiempo. Conviene pedírselos esta semana y revisar que su licencia esté vigente.',
        },
      ],
    },
  ],
  escenas: [
    // ── Apertura (15) ──
    {
      id: 'portada',
      bloque: 'apertura',
      tipo: 'portada',
      kicker: 'Capacitación 1 de 4 · Todo el equipo',
      titulo: 'Inteligencia artificial, por dentro',
      minutos: 2,
      pasos: 0,
      notas: [
        'Abra con el porqué, no con la tecnología: "Muchos de ustedes ya le han preguntado algo a ChatGPT o a Claude. Hoy vamos a ver qué pasa por dentro, porque quien entiende cómo funciona sabe cuándo creerle y cuándo no."',
        'Lo que se llevan hoy, en tres frases: por qué la IA a veces inventa con total seguridad, cómo pedirle para que acierte al primer o segundo intento, y qué información de Ekosolv y de los clientes nunca se sube.',
        'Baje la tensión desde el inicio: no hace falta saber de tecnología, nadie va a quedar expuesto y la IA no viene a reemplazar a nadie. Viene a quitar lo repetitivo para que quede tiempo para lo que pide criterio.',
      ],
      siPreguntan: [
        { p: '¿Nos van a reemplazar con esto?', r: 'No es el objetivo ni es lo que la IA hace bien. Redacta, resume y ordena rápido, pero se equivoca con seguridad y no conoce a los clientes ni la norma vigente si alguien no se los da. Siempre necesita a una persona con criterio que revise. Lo que cambia es el tipo de trabajo: menos copiar y pegar, más revisar y decidir.' },
      ],
    },
    {
      id: 'sala',
      bloque: 'apertura',
      tipo: 'sala',
      kicker: 'Antes de empezar',
      titulo: 'Saque el celular: hoy usted también responde',
      minutos: 5,
      pasos: 0,
      notas: [
        'Mientras escanean, rompa el hielo a mano alzada: "¿Quién usó una IA esta semana? ¿Para qué?" Anote dos o tres usos reales: los puede retomar en "Dónde le ahorra horas" y en la práctica.',
        'Explique para qué es el celular: votar, ver en cada tema un ejemplo de su propia área y mandarle preguntas a quien dicta. Pida que elijan bien el área: de eso depende qué ejemplos les salen.',
        'Arranque cuando haya entrado la mayoría; quien llegue tarde escanea sin interrumpir. Con el registro queda la asistencia de hoy.',
      ],
      siPreguntan: [
        { p: '¿Qué hacen con mis datos?', r: 'Solo se piden nombre, correo y área: sirven para la asistencia, para mostrarle ejemplos de su área y para enviarle el enlace de entrada y después el material de la capacitación. En la pantalla las votaciones se ven en grupo, nunca por persona.' },
      ],
    },
    {
      id: 'pre',
      bloque: 'apertura',
      tipo: 'evaluacion',
      kicker: 'Cinco preguntas',
      titulo: 'Lo que sabemos hoy, antes de empezar',
      minutos: 5,
      pasos: 0,
      interaccion: 'pre',
      notas: [
        'Diga: "No es un examen: nadie ve sus respuestas y no cuenta para nada. Respondan lo que creen hoy, sin buscar en internet. Si aciertan por suerte, al final no vamos a poder medir lo que aprendimos."',
        'Qué mide cada pregunta: 1, qué hace la IA al responder (predice); 2, verificar normas; 3, cómo pedir; 4, datos personales; 5, memoria entre conversaciones. Son las cinco ideas que todos deben llevarse, y al cierre se repiten iguales.',
        'No dé respuestas ni pistas ahora, aunque pregunten: todas se resuelven durante la sesión y al final verán cuánto subió el grupo.',
      ],
    },
    {
      id: 'diagnostico',
      bloque: 'apertura',
      tipo: 'diagnostico',
      kicker: 'Lo que ustedes respondieron',
      titulo: 'Por qué estamos aquí',
      minutos: 3,
      pasos: 3,
      notas: [
        'Diga: "Antes de hablar de tecnología, hablemos de ustedes. Estas cifras no son de un estudio de otra empresa: salen de la encuesta que ustedes respondieron."',
        'Paso 1, cuántos respondieron: agradezca la participación y diga para qué sirve: con estas respuestas se van a ajustar los temas de las capacitaciones por área.',
        'Paso 2, horas al mes en tareas repetitivas: vuélvalas tangibles haciendo la cuenta en voz alta. Cada 160 horas equivalen, más o menos, a una persona trabajando un mes entero. Pregunte: "¿Qué harían con ese tiempo?"',
        'Paso 3, las tareas que más se repiten: pida a alguien que se reconozca en la primera y cuente cuánto le toma. Cierre: "La meta no es reemplazar a nadie: es devolverles esas horas para el trabajo que necesita criterio. Hoy empezamos por entender la herramienta."',
      ],
      siPreguntan: [
        { p: '¿Estas cifras son exactas?', r: 'Son lo que cada persona estimó en la encuesta, no una medición con cronómetro. Sirven para ver el orden de magnitud y qué tareas pesan más, que es lo que importa para decidir por dónde empezar.' },
      ],
    },

    // ── Qué es la IA por dentro (65) ──
    {
      id: 'reglas',
      bloque: 'dentro',
      tipo: 'reglas',
      kicker: 'Idea 1 · Aprender de ejemplos',
      titulo: 'Un programa sigue reglas. Un modelo aprende de ejemplos',
      minutos: 8,
      pasos: 3,
      notas: [
        'La idea que hay que dejar: la IA no es un programa más con más reglas, es otra forma de construir software. Si esto queda claro, todo lo demás del día tiene sentido.',
        'Paso 1: el software de siempre (Zoho, Siigo, Excel) hace exactamente lo que alguien dejó escrito: "si dice bombilla, es RAEE". Su ventaja es que es predecible y nunca inventa. Su límite: solo sabe lo que alguien previó.',
        'Paso 2, la luminaria LED con batería de litio: pregunte a la sala qué es. Operaciones lo sabe: un RAEE con un componente peligroso. Ninguna regla de la lista lo cubre, y el programa se queda sin respuesta o, peor, lo clasifica mal.',
        'Paso 3: el modelo no tiene reglas; vio miles de ejemplos clasificados y ubica el caso nuevo cerca de los parecidos. Diga: "Esa es su gran ventaja y también su riesgo: como no sigue reglas, puede acertar en casos que nadie previó y equivocarse en casos que parecían obvios."',
      ],
      siPreguntan: [
        { p: '¿Entonces la IA reemplaza a Zoho o a Siigo?', r: 'No, se complementan. El sistema guarda los datos y hace las cuentas exactas; la IA lee, interpreta y redacta. Lo valioso es conectarlos: que la IA lea un correo y deje el registro listo en Zoho, y que la cifra final la calcule el sistema.' },
      ],
      datos: {
        reglas: [
          { si: 'dice "bombilla" o "computador"', entonces: 'RAEE' },
          { si: 'dice "aceite usado" o "tóner"', entonces: 'RESPEL' },
          { si: 'dice "cartón" o "plástico"', entonces: 'Aprovechable' },
        ],
        caso: 'Luminaria LED con batería de litio',
        grupos: [
          { id: 'raee', nombre: 'RAEE', ejemplos: ['Bombilla', 'Monitor', 'Celular', 'Nevera', 'Impresora'] },
          { id: 'respel', nombre: 'RESPEL', ejemplos: ['Aceite usado', 'Tóner', 'Pilas', 'Solventes'] },
          { id: 'aprov', nombre: 'Aprovechable', ejemplos: ['Cartón', 'Vidrio', 'PET', 'Chatarra'] },
        ],
      },
    },
    {
      id: 'perillas',
      bloque: 'dentro',
      tipo: 'perillas',
      kicker: 'Idea 2 · Entrenar',
      titulo: 'Millones de perillas que se ajustan solas',
      minutos: 8,
      pasos: 3,
      notas: [
        'Esta escena le quita la magia a la IA: por dentro no hay nadie pensando, hay números. Cuanto más concreto lo diga, mejor lo entienden.',
        'Paso 1: imagine una consola de sonido con miles de millones de perillas. Al principio están al azar: si le pide terminar una frase, escribe letras sin sentido.',
        'Paso 2, entrenar es un ciclo: se le muestra un texto tapando la palabra siguiente, el modelo adivina, se mide qué tan lejos quedó y cada perilla se mueve un poquito en la dirección que reduce el error. Repetido con una cantidad enorme de texto, termina escribiendo bien.',
        'Paso 3, remate: "Nadie le escribió a Claude qué es un RAEE: lo aprendió ajustando perillas. Por eso ni sus creadores pueden señalar dónde guarda un dato, y por eso no se le cree por autoridad: se le verifica." El número exacto de perillas de Claude no es público.',
      ],
      siPreguntan: [
        { p: '¿Aprende de lo que yo le escribo?', r: 'No en el momento: sus perillas quedan fijas después del entrenamiento y la conversación no las cambia. Si la empresa usa las conversaciones para entrenar versiones futuras depende del plan: en los planes de empresa de Anthropic no se usan; en las cuentas personales hay una opción en la configuración de privacidad que conviene revisar.' },
        { p: '¿La IA piensa?', r: 'Calcula. Puede encadenar razonamientos muy útiles, pero no sabe si algo es cierto: produce lo más probable según lo que aprendió. Por eso se revisa.' },
      ],
    },
    {
      id: 'tokens',
      bloque: 'dentro',
      tipo: 'tokens',
      kicker: 'Idea 3 · Tokens',
      titulo: 'La IA no lee letras ni palabras: lee tokens',
      minutos: 8,
      pasos: 1,
      notas: [
        'Pida a la sala una palabra o el nombre de un cliente y escríbalo en vivo. Las palabras comunes van enteras; las largas, los nombres propios y las cifras se parten. Muestre "Resolución" y un número de radicado: los números se parten en muchos pedazos. Como referencia, una página de texto en español ronda los 700 a 1.000 tokens.',
        'Paso 1, por qué les importa: lo que la IA puede leer de una vez y lo que cuesta se miden en tokens. Consecuencia práctica: un Excel exportado con miles de filas de cifras llena la capacidad mucho antes que un auto de puro texto. Exporten solo las columnas y el periodo que necesitan. La partición en pantalla es aproximada.',
      ],
      siPreguntan: [
        { p: '¿Cuánto cuesta usar esto?', r: 'En el plan de suscripción se paga una tarifa fija por usuario, con un límite de uso por periodo que también se mide en tokens: las conversaciones larguísimas o los archivos enormes lo gastan más rápido. Por eso conviene abrir una conversación nueva para cada tarea.' },
      ],
      datos: {
        texto: 'ARTÍCULO PRIMERO. Requerir a la sociedad para que presente los certificados de disposición final, conforme a la Resolución 1407 de 2018.',
      },
    },
    {
      id: 'siguiente',
      bloque: 'dentro',
      tipo: 'siguiente',
      kicker: 'Idea 4 · Predecir',
      titulo: 'Todo lo que hace es predecir el siguiente token',
      minutos: 10,
      pasos: 2,
      notas: [
        'Diga: "Si se llevan una sola idea de hoy, que sea esta: la IA no busca la respuesta, la escribe palabra por palabra eligiendo la más probable." Lea la frase en pantalla y pregunte cómo la completarían: casi todos dirán "gestor". Eso mismo calcula el modelo.',
        'Paso 1: use "Elegir el siguiente token" varias veces. Muestre que elige uno, lo pega y vuelve a calcular con la frase más larga. Un párrafo entero es eso repetido cientos de veces, y en ningún momento hay un paso en el que verifique lo que escribió.',
        'Paso 2, la temperatura: baja, casi siempre elige "gestor" y las respuestas se parecen; alta, a veces elige "operador" o hasta "camión". Por eso la misma pregunta da redacciones distintas, y es normal. En claude.ai no hay un control de temperatura: se maneja con la instrucción ("cíñete al documento" o "dame ideas arriesgadas"). Las probabilidades en pantalla son ilustrativas.',
      ],
      siPreguntan: [
        { p: 'Si le pregunto dos veces y me dice cosas distintas, ¿cuál es la buena?', r: 'Ninguna por ser la primera o la segunda. Si las dos dicen lo mismo con otras palabras, bien. Si cambian los datos (una fecha, un artículo, una cifra), es señal de que está adivinando: vaya al documento.' },
        { p: '¿Entonces copia de internet?', r: 'No copia ni busca, salvo que la herramienta tenga la búsqueda activada y muestre las fuentes. Escribe a partir de lo que aprendió; por eso puede producir frases que nunca existieron, verdaderas o falsas.' },
      ],
      datos: {
        frase: 'El generador de RAEE debe entregar los residuos a un',
        opciones: [
          { w: 'gestor', p: 0.58 },
          { w: 'punto', p: 0.16 },
          { w: 'sistema', p: 0.11 },
          { w: 'operador', p: 0.08 },
          { w: 'camión', p: 0.05 },
          { w: 'vecino', p: 0.02 },
        ],
      },
    },
    {
      id: 'mapa',
      bloque: 'dentro',
      tipo: 'mapa',
      kicker: 'Idea 5 · Significado',
      titulo: 'Para la IA, el significado es cercanía',
      minutos: 7,
      pasos: 3,
      notas: [
        'Esta escena explica por qué la IA entiende sinónimos y también por qué a veces confunde términos vecinos. Para Operaciones es clave: en la norma, palabras cercanas no siempre significan lo mismo.',
        'Paso 1: cada palabra se vuelve una posición en un mapa. El mapa real tiene miles de dimensiones; aquí está aplanado a dos para poder verlo.',
        'Paso 2: las palabras que aparecen en frases parecidas terminan cerca. Nadie le dijo que el tóner es peligroso: lo dedujo porque aparece junto a "aceite usado", "pilas" y "RESPEL" en miles de textos.',
        'Paso 3, la luminaria queda entre RAEE y RESPEL, como en la vida real. Doble filo: por eso entiende "medidas de manejo" cuando usted dice "obligaciones del PMA", pero también puede tratar como iguales "aprovechamiento" y "disposición final", que en la norma no lo son. Pídale que use los términos exactos del documento.',
      ],
      siPreguntan: [
        { p: '¿Así funciona Google?', r: 'Los buscadores modernos usan una idea parecida para encontrar textos por significado y no solo por palabras exactas. La diferencia: el buscador le devuelve documentos que existen; la IA le escribe un texto nuevo.' },
      ],
      datos: {
        grupos: [
          { id: 'raee', nombre: 'RAEE', color: '#124E7D' },
          { id: 'respel', nombre: 'RESPEL', color: '#B8926F' },
          { id: 'norma', nombre: 'Normativa', color: '#179C91' },
          { id: 'admin', nombre: 'Administrativo', color: '#6B7580' },
        ],
        puntos: [
          { w: 'computador', g: 'raee', x: 18, y: 26 },
          { w: 'celular', g: 'raee', x: 26, y: 18 },
          { w: 'nevera', g: 'raee', x: 14, y: 36 },
          { w: 'monitor', g: 'raee', x: 28, y: 32 },
          { w: 'aceite usado', g: 'respel', x: 70, y: 22 },
          { w: 'tóner', g: 'respel', x: 62, y: 30 },
          { w: 'pilas', g: 'respel', x: 76, y: 34 },
          { w: 'solventes', g: 'respel', x: 80, y: 20 },
          { w: 'resolución', g: 'norma', x: 24, y: 72 },
          { w: 'decreto', g: 'norma', x: 16, y: 80 },
          { w: 'auto', g: 'norma', x: 30, y: 82 },
          { w: 'licencia', g: 'norma', x: 34, y: 68 },
          { w: 'factura', g: 'admin', x: 72, y: 76 },
          { w: 'cotización', g: 'admin', x: 82, y: 70 },
          { w: 'orden de compra', g: 'admin', x: 70, y: 86 },
        ],
        destacado: { w: 'luminaria', x: 45, y: 28 },
      },
    },
    {
      id: 'etapas',
      bloque: 'dentro',
      tipo: 'etapas',
      kicker: 'Idea 6 · De dónde sale lo que sabe',
      titulo: 'Primero lee casi todo. Después aprende a ayudar',
      minutos: 8,
      pasos: 3,
      notas: [
        'Esta escena responde dos preguntas que siempre salen: de dónde saca lo que sabe y por qué no sabe lo reciente.',
        'Paso 1, preentrenamiento: lee una cantidad enorme de texto (libros, páginas públicas, código) y aprende a predecirlo. Ahí aprende el idioma y muchísimos datos, buenos y malos: también leyó normas derogadas, foros con errores y páginas desactualizadas.',
        'Paso 2, ajuste con personas: personas escriben buenas respuestas y califican las del modelo. Así aprende a seguir instrucciones, a ser útil y a negarse a lo dañino. De aquí sale su tono amable y seguro, que no es lo mismo que tener razón.',
        'Paso 3, fecha de corte: lo posterior no lo sabe. Ejemplo concreto: si mañana la ANLA o una CAR expide una resolución, la IA no la conoce hasta que usted le pegue el texto o la herramienta busque en internet y muestre la fuente. Tampoco sabe nada interno de Ekosolv: clientes, precios, gestores.',
      ],
      siPreguntan: [
        { p: '¿Cómo sé hasta qué fecha sabe?', r: 'Pregúntele, y tome la respuesta como aproximada. La regla práctica: todo lo de los últimos meses, y todo lo que cambia con el tiempo (normas, tarifas, UVT, salario mínimo), se le da o se verifica.' },
        { p: 'Si activo la búsqueda en internet, ¿ya no inventa?', r: 'Inventa menos sobre lo reciente, pero puede leer una fuente mala o resumirla mal. Abra los enlaces que cite y confirme el dato en la página oficial.' },
      ],
      datos: {
        etapas: [
          { titulo: 'Preentrenamiento', texto: 'Lee una cantidad enorme de texto y aprende a predecirlo.' },
          { titulo: 'Ajuste con personas', texto: 'Aprende a seguir instrucciones y a ser útil.' },
          { titulo: 'Fecha de corte', texto: 'Lo posterior no lo conoce si usted no se lo muestra.' },
        ],
      },
    },
    {
      id: 'contexto',
      bloque: 'dentro',
      tipo: 'contexto',
      kicker: 'Idea 7 · Memoria de trabajo',
      titulo: 'La ventana de contexto es su mesa de trabajo',
      minutos: 8,
      pasos: 3,
      notas: [
        'Diga: "Todo lo que la IA tiene en cuenta está sobre la mesa: sus mensajes, lo que adjuntó y lo que ella misma respondió. Lo que no está en la mesa no existe para ella."',
        'Paso 1, un auto de 40 páginas cabe de sobra. Es el caso típico de Operaciones: el documento entero cabe, así que no hay razón para darle solo un pedazo.',
        'Paso 2, un PMA completo también cabe, pero ocupa buena parte de la mesa. Dato útil: en conversaciones muy largas la IA le presta menos atención a lo que quedó en medio. Para una tarea puntual rinde más una conversación nueva con lo justo que una de horas con todo.',
        'Paso 3, el archivo de expedientes no cabe: hay que elegir. Y al abrir una conversación nueva la mesa queda vacía. La solución son los proyectos de Claude: ahí se dejan fijos documentos e instrucciones (la plantilla de propuesta, el manual, la guía de voz) y cada conversación del proyecto los tiene a mano. La capacidad exacta depende del modelo y del plan: hablamos de cientos de páginas.',
      ],
      siPreguntan: [
        { p: '¿Claude tiene memoria entre conversaciones?', r: 'Tiene una función de memoria que se puede activar, y los proyectos guardan documentos e instrucciones. Pero no hay que contar con que recuerde un detalle de hace una semana: lo importante se deja en el proyecto o se vuelve a pegar.' },
      ],
      datos: {
        docs: [
          { nombre: 'Auto de seguimiento', paginas: 40, tono: 'deep' },
          { nombre: 'PMA completo', paginas: 220, tono: 'forest' },
          { nombre: 'Todo el archivo de expedientes', paginas: 9000, tono: 'clay' },
        ],
        capacidad: 400,
      },
    },
    {
      id: 'ecosistema',
      bloque: 'dentro',
      tipo: 'ecosistema',
      kicker: 'Idea 8 · El mapa',
      titulo: 'Modelos, aplicaciones y herramientas',
      minutos: 5,
      pasos: 3,
      notas: [
        'Esta escena ordena el vocabulario: modelo, aplicación, herramienta y agente. Mucha confusión viene de mezclarlos.',
        'Paso 1, el modelo es el cerebro: Claude (Anthropic), GPT (OpenAI), Gemini (Google), Llama (Meta). Los entrenan pocas empresas porque cuesta muchísimo. Todos funcionan igual por dentro: lo que se ve hoy aplica a cualquiera.',
        'Paso 2, la aplicación es por donde se usa: claude.ai, ChatGPT, Copilot. Muchas aplicaciones traen IA adentro (Canva, Notion, Zia en Zoho), con un modelo de estos detrás. En Ekosolv se trabaja con Claude, y las reglas de seguridad aplican también a las IA que vienen dentro de otras aplicaciones.',
        'Paso 3, herramientas y agentes: leer PDF e imágenes, buscar en internet, conectarse a sistemas. Cuando la IA encadena pasos sola (lee el correo, crea el registro en Zoho, avisa al cliente) es un agente. Para Gerencia y Logística es lo más prometedor. La regla no cambia: lo que hace un agente se revisa, sobre todo si escribe en un sistema o le habla a un cliente.',
      ],
      siPreguntan: [
        { p: '¿Por qué Claude y no ChatGPT?', r: 'Ekosolv eligió trabajar con una sola herramienta para que todos compartan instrucciones y proyectos. Lo que se aprende hoy sirve igual para ChatGPT o Gemini, porque por dentro funcionan igual.' },
        { p: '¿Se puede conectar Claude a nuestro Zoho?', r: 'Técnicamente sí, con integraciones, y es de lo que más tiempo ahorra cuando se automatiza. Primero conviene dominar el uso a mano: saber pedir y revisar es lo que hace que una automatización salga bien.' },
      ],
      datos: {
        capas: [
          { titulo: 'Modelos', items: ['Claude', 'GPT', 'Gemini', 'Llama'], texto: 'El cerebro. Lo entrenan pocas empresas.' },
          { titulo: 'Aplicaciones', items: ['claude.ai', 'ChatGPT', 'Gemini', 'Copilot'], texto: 'Por donde usted lo usa.' },
          { titulo: 'Herramientas y agentes', items: ['Leer PDF e imágenes', 'Buscar en internet', 'Conectarse a Zoho', 'Trabajar por pasos'], texto: 'Lo que le permite actuar.' },
        ],
      },
    },
    {
      id: 'comp',
      bloque: 'dentro',
      tipo: 'voto',
      kicker: 'Comprobación',
      titulo: '¿Quedó claro?',
      minutos: 3,
      pasos: 2,
      interaccion: 'comp',
      notas: [
        'Diga: "Dos preguntas rápidas para ver si vamos bien. No importa equivocarse: así sé qué repetir." Espere a que vote la mayoría antes de revelar.',
        'Paso 1, qué es un token: si muchos eligen "contraseña" o "moneda", repita en una frase: es un pedazo de texto, y en tokens se mide lo que la IA lee y lo que cuesta.',
        'Paso 2, respuestas distintas: si muchos creen que la respuesta sale idéntica, vuelva a la temperatura con un ejemplo: "Pídale dos veces el mismo correo y verá dos redacciones. Si lo que cambia es un dato, está adivinando." Si más de un tercio falló alguna, dedique dos minutos a repasarla antes de seguir.',
      ],
    },

    // ── Alcances y límites (35) ──
    {
      id: 'areas',
      bloque: 'alcances',
      tipo: 'areas',
      kicker: 'En qué es buena',
      titulo: 'Dónde le ahorra horas a cada área',
      minutos: 8,
      pasos: 6,
      notas: [
        'Pase de la teoría al trabajo: "Hasta aquí, cómo funciona. Ahora, dónde le ahorra horas a cada uno." En cada área, pregúntele a alguien de esa área cuánto le toma hoy esa tarea.',
        'Operaciones: un auto de la ANLA o de la CAR tiene obligaciones repartidas en varios artículos, con plazos que corren desde la ejecutoria. La IA hace la primera pasada (obligación, artículo, plazo, responsable) y el consultor revisa y lleva las vigencias al calendario. Lo que se ahorra es la lectura; la revisión sigue siendo del consultor.',
        'Logística: el correo trae solicitudes en formatos distintos. La IA las separa del resto, saca cliente, residuo, cantidad y fecha, y deja listos el registro para Zoho y el aviso al cliente. Ojo: si falta un dato, debe escribir "no aparece", no completarlo.',
        'Ventas: del Brief de Zoho al borrador de la propuesta con la estructura de Ekosolv. El comercial pone precios y alcance; la IA, la redacción.',
        'Mercadeo: una norma nueva convertida en un artículo y tres publicaciones con la voz de la marca. Toda cifra y toda cita se verifica antes de publicar.',
        'Gerencia: el borrador de la propuesta sale de la oportunidad en Zoho, y el tablero muestra cuáles están listas para cerrar y cuáles llevan días quietas. Más adelante eso mismo se puede automatizar: avisos de oportunidades frías y un resumen semanal del embudo.',
        'Finanzas: el proceso de nómina o de cierre de mes que hoy vive en la cabeza de una persona, convertido en procedimiento escrito para el manual. Se cuenta tal cual y la IA lo ordena en pasos, responsables y controles. Cierre con lo común a las seis áreas: leer y resumir, pasar a tablas, escribir primeros borradores y revisar contra una lista.',
      ],
      siPreguntan: [
        { p: '¿Y si mi tarea no aparece aquí?', r: 'Pregúntese si es de uno de esos cuatro tipos: leer algo largo, pasar información a una tabla, escribir un primer borrador o revisar contra una lista. Si lo es, la IA probablemente ayuda. En la práctica de hoy cada uno elige una tarea propia.' },
      ],
      datos: {
        areas: [
          { id: 'operaciones', nombre: 'Operaciones', ejemplo: 'Sacar de un auto de la ANLA o la CAR las obligaciones, los plazos y las vigencias, citando el artículo.' },
          { id: 'logistica', nombre: 'Logística', ejemplo: 'Leer el correo, pasar las solicitudes de recolección a Zoho y avisarle al cliente.' },
          { id: 'ventas', nombre: 'Ventas', ejemplo: 'Convertir un Brief de Zoho en el borrador de una propuesta.' },
          { id: 'mercadeo', nombre: 'Mercadeo / Redes', ejemplo: 'Convertir una norma nueva en un artículo y tres publicaciones.' },
          { id: 'gerencia', nombre: 'Gerencia General', ejemplo: 'El borrador de una propuesta a partir de la oportunidad en Zoho.' },
          { id: 'finanzas', nombre: 'Finanzas', ejemplo: 'Convertir el proceso de nómina o de cierre de mes en un procedimiento escrito para el manual.' },
        ],
      },
    },
    {
      id: 'verdad',
      bloque: 'alcances',
      tipo: 'verdad',
      kicker: 'Juego',
      titulo: '¿Verdad o alucinación?',
      minutos: 14,
      pasos: 4,
      interaccion: 'verdad',
      provisional: true,
      notas: [
        'Diga: "Cuatro frases como las que podría escribir la IA. Voten en el celular si cada una es verdad o inventada." No adelante cuántas son falsas. Espere los votos antes de cada revelación.',
        'Paso 1, Ley 1672 de 2013: verdad. Es la ley de la política pública de gestión integral de RAEE; la reglamenta el Decreto 284 de 2018.',
        'Paso 2, la "Resolución 2290 de 2019" y el "SIRAEE": inventada. Haga notar por qué engaña: número plausible, año plausible, sigla que suena oficial. Pregunte a quien votó verdad por qué: casi siempre es "porque sonaba muy específica". Que sea específica no prueba nada.',
        'Paso 3, Resolución 1407 de 2018: verdad. Es la norma de responsabilidad extendida del productor para envases y empaques, modificada después por la Resolución 1342 de 2020.',
        'Paso 4, la más importante: el Decreto 1076 de 2015 existe (es el decreto único del sector ambiente), pero esa "multa única de 50 salarios" no. Una norma real con un dato falso pasa cualquier revisión superficial: no basta con confirmar que la norma existe, hay que leer el artículo. Antes de la sesión, cambie estas citas por normas que el equipo use a diario.',
      ],
      siPreguntan: [
        { p: '¿Cómo verifico rápido una norma?', r: 'En una fuente oficial: SUIN-Juriscol, la página de la autoridad que la expidió o el Diario Oficial. Busque el número y el año, abra el texto, lea el artículo que la IA citó y revise si fue modificado o derogado.' },
      ],
    },
    {
      id: 'inventa',
      bloque: 'alcances',
      tipo: 'inventa',
      kicker: 'Por qué pasa',
      titulo: 'Suena bien no significa que exista',
      minutos: 6,
      pasos: 2,
      notas: [
        'Conecte con la idea 4: "¿Recuerdan que elige la palabra más probable? Miren qué pasa cuando le toca escribir un número de resolución." Señale que ningún número destaca: todos son más o menos igual de probables.',
        'Paso 1: elige uno igual, porque su trabajo es seguir escribiendo, y sigue con total seguridad. No miente a propósito: completa el patrón. No tiene una alarma interna confiable que le avise "este dato no lo sé", y el tono es el mismo cuando acierta que cuando se equivoca.',
        'Paso 2, dónde inventa más: números de normas, artículos, fechas, cifras, nombres propios y hechos recientes. Dónde inventa menos: cuando el dato está en el documento que usted le dio. La lección práctica: no le pregunte de memoria; dele el documento y pídale que diga de dónde sale cada dato.',
      ],
      siPreguntan: [
        { p: '¿Y si le digo que no invente?', r: 'Ayuda, sobre todo si le da una salida: "si no aparece en el documento, escribe no aparece". Pero no lo elimina. Lo que de verdad reduce el error es darle el documento y verificar.' },
        { p: 'Si le pregunto "¿estás segura?", ¿se corrige?', r: 'A veces, pero también puede cambiar una respuesta correcta por una incorrecta solo por complacer. Preguntarle no es verificar; verificar es ir a la fuente.' },
      ],
      datos: {
        frase: 'La obligación de reportar los RAEE está en la Resolución',
        opciones: [
          { w: '1512', p: 0.21 },
          { w: '2290', p: 0.19 },
          { w: '0481', p: 0.18 },
          { w: '1297', p: 0.17 },
          { w: '0372', p: 0.13 },
          { w: '2184', p: 0.12 },
        ],
      },
    },
    {
      id: 'verificar',
      bloque: 'alcances',
      tipo: 'verificar',
      kicker: 'Cómo revisar',
      titulo: 'Cuatro hábitos antes de usar una respuesta',
      minutos: 7,
      pasos: 4,
      notas: [
        'La imagen que debe quedar: el trabajo de la IA se revisa como el de un practicante muy rápido y muy seguro de sí mismo. Es útil, pero nadie firma lo que entrega un practicante sin leerlo.',
        'Paso 1, normas a la fuente oficial: número, año y artículo. Y confirmar la vigencia: una norma derogada o modificada es tan peligrosa como una inventada. SUIN-Juriscol muestra si un artículo fue modificado.',
        'Paso 2, cifras contra el original: kilos, fechas, plazos y valores. No todo se revisa con la misma intensidad: empiece por lo que más daño hace si está mal (un plazo ante la autoridad, un valor en una propuesta, un pago).',
        'Paso 3, pedir de dónde sale cada dato: "indica el artículo o la página; si no aparece, dilo". Así la revisión va directo al punto citado y toma minutos en vez de una hora. Si la IA no puede señalar de dónde sacó un dato, no se usa.',
        'Paso 4, desconfiar de lo demasiado perfecto: cifras redondas, listas completísimas, citas exactas sin documento delante. Cuanto más redondo parece, más vale revisarlo. Pregunte a la sala cuál de los cuatro hábitos les cuesta más.',
      ],
      datos: {
        pasos: [
          { titulo: 'Toda norma, a la fuente oficial', texto: 'Número, año y artículo se confirman antes de citarlos.' },
          { titulo: 'Toda cifra, contra el original', texto: 'Kilos, fechas y plazos se comparan con el documento.' },
          { titulo: 'Pida de dónde sale cada dato', texto: '"Indica el artículo o la página. Si no aparece, dilo."' },
          { titulo: 'Desconfíe de lo demasiado perfecto', texto: 'Si suena muy seguro y muy redondo, revíselo dos veces.' },
        ],
      },
    },

    // ── Descanso (15) ──
    {
      id: 'descanso',
      bloque: 'descanso',
      tipo: 'descanso',
      kicker: 'Descanso',
      titulo: 'Quince minutos',
      minutos: 15,
      pasos: 0,
      notas: [
        'Antes de soltar: "Al volver vamos a ver por qué la misma IA da respuestas malas o excelentes según cómo se le pida, con un auto en vivo."',
        'Durante el descanso, revise las preguntas que llegaron del celular y elija dos o tres para responder al volver.',
      ],
      datos: { minutos: 15 },
    },

    // ── Cómo pedir (45) ──
    {
      id: 'metodo',
      bloque: 'pedir',
      tipo: 'metodo',
      kicker: 'El método',
      titulo: 'Una buena instrucción tiene cuatro partes',
      minutos: 10,
      pasos: 4,
      notas: [
        'Diga: "Casi todos los malos resultados vienen de instrucciones de una línea. La IA no lo conoce, no sabe para quién es ni qué va a hacer con la respuesta: si no se lo dice, lo adivina." Pedirle a la IA es como delegarle a alguien nuevo muy capaz.',
        'Paso 1, contexto: quién es usted, para quién es el resultado y qué hay que saber. Es la parte que más mejora la respuesta y la que más se omite. "Soy consultor de Ekosolv; el cliente es una planta en Funza" cambia el tono y lo que la IA considera importante.',
        'Paso 2, tarea: un verbo claro y concreto. "Extrae", "compara", "redacta", "clasifica" funcionan; "mira esto" o "ayúdame con" dejan que la IA elija qué hacer.',
        'Paso 3, formato: cómo lo quiere recibir (tabla con columnas definidas, correo de cinco líneas, viñetas). Incluya qué hacer cuando falta un dato ("escribe no aparece"): es la línea que más reduce lo inventado.',
        'Paso 4, ejemplo: si tiene uno, péguelo. Una fila de tabla bien hecha o una propuesta ganada enseñan más que cualquier descripción. No es obligatorio, pero cuando el resultado debe verse de una forma exacta es lo que más rinde.',
      ],
      siPreguntan: [
        { p: '¿Hay que decirle "por favor"?', r: 'No cambia la calidad de forma importante. Lo que sí cambia todo es el contexto y el formato. Escríbale como a un compañero: claro y completo.' },
        { p: '¿Funciona mejor en inglés?', r: 'Funciona muy bien en español. Escriba en el idioma en que quiere la respuesta.' },
      ],
      datos: {
        partes: [
          { id: 'contexto', nombre: 'Contexto', texto: 'Quién es usted, para quién es y qué hay que saber.', ejemplo: 'Soy consultor ambiental de Ekosolv. El cliente es una planta de luminarias en Funza.' },
          { id: 'tarea', nombre: 'Tarea', texto: 'Qué quiere, con un verbo claro.', ejemplo: 'Extrae todas las obligaciones del auto.' },
          { id: 'formato', nombre: 'Formato', texto: 'Cómo lo quiere recibir.', ejemplo: 'Una tabla: Obligación, Artículo, Plazo, Responsable.' },
          { id: 'ejemplo', nombre: 'Ejemplo', texto: 'Cómo debe quedar, si lo tiene.', ejemplo: '| Presentar certificados 2025 | Art. 1 | 30 días hábiles | Cliente |' },
        ],
      },
    },
    {
      id: 'constructor',
      bloque: 'pedir',
      tipo: 'constructor',
      kicker: 'En vivo con Claude',
      titulo: 'La misma tarea, cuatro instrucciones',
      minutos: 25,
      pasos: 3,
      demo: 'auto',
      provisional: true,
      notas: [
        'Muestre el auto unos segundos y pida con la versión 1, solo "Resúmeme este auto". Lea la respuesta en voz alta y pregunte: "¿Con esto ya sabemos qué hacer el lunes?" Es correcta, pero no sirve para trabajar: no ordena plazos ni responsables.',
        'Paso 1, más contexto: la respuesta pasa de describir el auto a decir qué tiene que hacer el cliente. Señale que no le pidió una lista: la IA la armó porque entendió para quién era.',
        'Paso 2, más formato: aparece la tabla con obligación, artículo, plazo y responsable, y "no aparece" donde falta un dato. Esa celda es la prueba de que no está inventando el plazo. Esta tabla ya se revisa artículo por artículo en minutos.',
        'Paso 3, más ejemplo: la tabla toma la forma exacta de la fila de muestra ("Cliente, con apoyo de Ekosolv") y además dice cuál obligación es la más urgente y por qué. Remate: "Misma IA, mismo auto. Lo único que cambió fue la instrucción." Si la IA no responde, sale la respuesta guardada con su etiqueta; el auto es de ejemplo.',
      ],
      siPreguntan: [
        { p: '¿Cuánto toma escribir una instrucción así?', r: 'Dos o tres minutos la primera vez. Después se guarda y se reutiliza cambiando solo lo que va entre corchetes. Por eso la entrega de hoy es una instrucción guardada.' },
      ],
    },
    {
      id: 'iterar',
      bloque: 'pedir',
      tipo: 'iterar',
      kicker: 'Cuando no sirve',
      titulo: 'No empiece de cero: dígale qué cambiar',
      minutos: 10,
      pasos: 3,
      notas: [
        'El error más común después de una mala respuesta es borrar todo y empezar de nuevo, o rendirse. La IA conserva todo lo de la conversación: corregir por partes es más rápido.',
        'Paso 1, quitar lo que sobra: "esto no está en el auto, quita la fila". Las correcciones concretas funcionan; "quita la fila de notificación" sirve, "está mal" no.',
        'Paso 2, agregar lo que falta: la fecha límite a partir de la ejecutoria. Fíjese en la respuesta: la IA pide revisar el cálculo de días hábiles. Así debe ser: días hábiles y festivos de Colombia son justo el tipo de cálculo en el que se equivoca, y se cuentan en el calendario.',
        'Paso 3, guardar: cuando una instrucción funcione, se guarda en un proyecto de Claude con sus documentos fijos. Y si una conversación se enreda después de muchas correcciones, abra una nueva con la instrucción ya corregida: rinde más que seguir parchando.',
      ],
      datos: {
        mensajes: [
          { de: 'usted', texto: 'Esto no está en el auto: quita la fila de notificación.' },
          { de: 'ia', texto: 'Listo, quité la fila. Quedan tres obligaciones.' },
          { de: 'usted', texto: 'Agrega una columna con la fecha límite, si la ejecutoria fue el 3 de diciembre.' },
          { de: 'ia', texto: 'Agregué la columna. Revise el cálculo de días hábiles contra el calendario oficial.' },
        ],
      },
    },

    // ── Práctica guiada (30) ──
    {
      id: 'practica',
      bloque: 'practica',
      tipo: 'practica',
      kicker: 'Práctica guiada',
      titulo: 'Ahora usted: una tarea real de su puesto',
      minutos: 30,
      pasos: 0,
      notas: [
        'Consigna en una frase: "Elija una tarea que haga cada semana y le quite tiempo, y escriba la instrucción con las cuatro partes." El revisor del celular dice qué le faltó, no hace la tarea. En el revisor se escribe la instrucción; no se pegan documentos con datos personales. Quien cerró la sala vuelve a escanear el código.',
        'Primeros cinco minutos: muchos se bloquean eligiendo la tarea. Recorra la sala y sugiera por área: Operaciones, la matriz de un auto o las vigencias de los permisos de un cliente; Logística, clasificar los correos de solicitudes; Gerencia, la propuesta desde una oportunidad de Zoho; Finanzas, el procedimiento de la nómina o la conciliación con el banco; Ventas, del Brief a la propuesta; Mercadeo, una publicación a partir de una norma.',
        'Lo que más falta en las instrucciones: el contexto (no dicen quiénes son ni para quién es) y qué hacer cuando falta un dato. Si ve el mismo error en varias personas, dígalo en voz alta para todos.',
        'A los 20 minutos: pida dos o tres voluntarios de áreas distintas y muestre su instrucción antes y después del revisor. Cierre: "Guárdenla: es la base de su entrega en la academia."',
      ],
      datos: {
        pasos: [
          'Elija una tarea que haga cada semana y le quite tiempo.',
          'Escriba la instrucción con las cuatro partes.',
          'Pásela por el revisor en su celular y ajústela.',
          'Guárdela: es la base de su entrega.',
        ],
        consigna: 'Escriba una instrucción para una tarea real de su puesto usando las cuatro partes: contexto, tarea, formato y, si lo tiene, un ejemplo.',
      },
    },

    // ── Seguridad y Ley 1581 (20) ──
    {
      id: 'semaforo',
      bloque: 'seguridad',
      tipo: 'semaforo',
      kicker: 'Ley 1581 de 2012',
      titulo: '¿Se sube o no se sube?',
      minutos: 12,
      pasos: 5,
      interaccion: 'semaforo',
      provisional: true,
      notas: [
        'Contexto legal en 30 segundos: la Ley 1581 de 2012 protege los datos personales y la vigila la Superintendencia de Industria y Comercio, que puede imponer multas de hasta 2.000 salarios mínimos. Pegar datos de personas en una IA es tratarlos, y como los servidores están fuera de Colombia, esos datos salen del país. Por eso importa la cuenta: la de Ekosolv es plan Team, el proveedor no entrena con lo que se pega y firma un acuerdo de tratamiento de datos, igual que Google con el correo o Zoho con el CRM. Una cuenta personal no tiene nada de eso. Diga antes de votar que los casos 1 a 3 son en la cuenta de Ekosolv.',
        'Paso 1, la resolución publicada: se sube. Es un documento público.',
        'Paso 2, el certificado con nombre y cédula del conductor: se sube completo. Muchos votarán "anonimizado" por costumbre; aclare que en la cuenta de la empresa no hace falta tapar nombres, cédulas ni celulares. La diapositiva siguiente lo muestra.',
        'Paso 3, las incapacidades médicas: anonimizado. Los datos de salud son sensibles (artículo 5 de la ley) y tienen protección reforzada, así que solo se usan si la tarea de verdad los necesita. Para contar días perdidos bastan las cifras: quite nombres y diagnósticos. Ojo: en un equipo pequeño, aun sin nombre, a veces se reconoce a la persona.',
        'Paso 4, el correo del cliente en la IA gratuita del celular: no se sube. Es el caso más común en la vida real: se está afuera, se tiene la app personal a mano y se pega "rapidito". En la cuenta de Ekosolv ese mismo correo se pegaría completo; lo que cambia es la cuenta, no el documento.',
        'Paso 5, la contraseña de Zoho: nunca. Ni contraseñas, ni claves bancarias, ni códigos de acceso, en ninguna IA. Regla corta para cerrar: documentos de trabajo, en la cuenta de Ekosolv y completos; datos de salud, solo lo que la tarea necesite; contraseñas, nunca; y nada de trabajo en la cuenta personal. Los casos son de ejemplo: ajústelos con situaciones reales de Ekosolv.',
      ],
      siPreguntan: [
        { p: '¿Y la información de la empresa que no es personal, como precios o contratos?', r: 'La Ley 1581 no la cubre, pero es confidencial. En los planes de empresa de Anthropic las conversaciones no se usan para entrenar, lo que reduce el riesgo; aun así, lo estratégico (precios negociados, contratos con cláusula de confidencialidad) se comparte solo si hace falta para la tarea. Ante la duda, se consulta con Gerencia.' },
      ],
    },
    {
      id: 'anonimizar',
      bloque: 'seguridad',
      tipo: 'anonimizar',
      kicker: 'Dónde pegar',
      titulo: 'Use la cuenta de Ekosolv, no la suya',
      minutos: 8,
      pasos: 1,
      provisional: true,
      notas: [
        'Muestre el certificado completo y diga: "Esto, con nombre, cédula y celular, se pega tal cual en la cuenta de Ekosolv." La cuenta de la empresa es plan Team: Anthropic no entrena con lo que se pega y firma un acuerdo de tratamiento de datos, así que queda como encargado de Ekosolv, igual que Google con el correo o Zoho con el CRM. Eso es lo que pide la Ley 1581 cuando los datos salen del país. Antes del sábado confirme que el plan contratado sea Team y no Pro individual: Pro se rige por los términos de consumidor.',
        'Paso 1: los datos se tapan solos. "Esto es lo que tocaría hacer en una cuenta personal, y por eso no se usa para el trabajo: en esas cuentas lo que se pega puede usarse para entrenar y queda por fuera de la empresa." Puede hacer clic sobre cada dato para destaparlo o taparlo. Para cerrar, lo que vale en cualquier cuenta: contraseñas y claves, nunca; datos de salud (incapacidades, historias clínicas), solo si la tarea de verdad los necesita. Y no califique con pulgar arriba o abajo una conversación con datos de clientes: esa conversación puede llegarle al proveedor como retroalimentación. El certificado es de ejemplo.',
      ],
      siPreguntan: [
        { p: '¿Y si estoy en el celular y no tengo abierta la cuenta de Ekosolv?', r: 'Entre a la cuenta de la empresa también en el celular. Si no puede, espere a estar en el computador: el documento de trabajo no se pega en la cuenta personal.' },
        { p: '¿Entonces la IA se queda con los datos?', r: 'Las conversaciones quedan guardadas en la cuenta de Ekosolv, como un correo en Gmail, y la empresa decide cuánto tiempo. No se usan para entrenar la IA ni las ve otra empresa.' },
      ],
      datos: {
        segmentos: [
          { t: 'Certificado de recolección No. 0457. Se recogieron ' },
          { t: '320 kg de luminarias' },
          { t: ' en la sede de ' },
          { t: 'Planta de Ejemplo S.A.S.' },
          { t: ' Recibió ' },
          { t: 'Carlos Pérez Gómez', dato: 'el conductor' },
          { t: ', cédula ' },
          { t: '79.456.123', dato: 'cédula' },
          { t: ', celular ' },
          { t: '310 456 7890', dato: 'celular' },
          { t: '. Entregó por el cliente ' },
          { t: 'Laura Méndez', dato: 'la coordinadora ambiental' },
          { t: ', correo ' },
          { t: 'laura.mendez@correo.com', dato: 'correo' },
          { t: '. Dirección de recolección: ' },
          { t: 'Calle 15 No. 4-22, Funza', dato: 'dirección' },
          { t: '.' },
        ],
      },
    },

    // ── Cierre (15) ──
    {
      id: 'post',
      bloque: 'cierre',
      tipo: 'evaluacion',
      kicker: 'Para cerrar',
      titulo: 'Las mismas cinco preguntas',
      minutos: 6,
      pasos: 0,
      interaccion: 'post',
      notas: [
        'Diga: "Las mismas cinco preguntas del inicio. Respondan con lo que saben ahora." No repase antes: la gracia es medir lo que quedó.',
        'Mientras responden, revise las preguntas del celular que siguen pendientes y elija las que vale la pena contestar en el cierre.',
      ],
    },
    {
      id: 'comparacion',
      bloque: 'cierre',
      tipo: 'comparacion',
      kicker: 'Antes y después',
      titulo: 'Cuánto avanzó el grupo hoy',
      minutos: 4,
      pasos: 1,
      notas: [
        'Muestre el promedio antes y después. Celebre el avance del grupo, no el de personas. Si el salto es pequeño, no lo esconda: diga qué idea faltó reforzar.',
        'Paso 1, pregunta por pregunta: comente la que más subió (lo que mejor quedó) y la que menos. La que menos subió se retoma en el repaso del próximo sábado; dígalo para que sepan que no queda suelta.',
      ],
    },
    {
      id: 'sigue',
      bloque: 'cierre',
      tipo: 'sigue',
      kicker: 'Lo que viene',
      titulo: 'Tres sábados más, todo el equipo',
      minutos: 3,
      pasos: 0,
      notas: [
        'Todo el equipo asiste a los tres sábados que faltan, sin separar por áreas. Los temas de cada sábado se ajustan con las respuestas de la encuesta: no prometa temas concretos todavía.',
        'Tarea para la semana: usar la instrucción de la práctica en una tarea real, ajustarla y entregarla en la academia. Pida que traigan un caso en que la IA se haya equivocado: es el mejor material para el repaso.',
      ],
      // Sin temas por sábado: el cronograma todavía no está definido.
      datos: { sabados: [2, 3, 4] },
    },
    {
      id: 'cierre',
      bloque: 'cierre',
      tipo: 'cierre',
      kicker: 'Gracias',
      titulo: 'Llévese la tarjeta resumen',
      minutos: 2,
      pasos: 0,
      notas: [
        'Pida que escaneen el código para guardar la tarjeta resumen, con las ideas y las instrucciones de hoy. Se puede imprimir y tener a la mano.',
        'Frase de cierre: "La IA es como un practicante muy rápido y muy seguro de sí mismo. Le puede ahorrar horas, pero lo que entrega se revisa siempre, y se le habla desde la cuenta de Ekosolv." Agradezca y responda las preguntas del celular que quedaron pendientes.',
      ],
    },
  ],
  celular: CELULAR_TALLER1,
  resumen: {
    ideas: [
      { titulo: 'Predice, no consulta', texto: 'Redacta el texto más probable, token por token, a partir de lo que aprendió y de lo que usted le da.' },
      { titulo: 'Sabe hasta su fecha de corte', texto: 'Lo reciente o interno de Ekosolv no lo conoce si usted no se lo muestra.' },
      { titulo: 'Trabaja con lo que está en la mesa', texto: 'Solo tiene en cuenta la conversación y sus adjuntos. Una conversación nueva empieza vacía.' },
      { titulo: 'Puede inventar con seguridad', texto: 'Normas, cifras y fechas se verifican siempre contra la fuente.' },
      { titulo: 'Cuatro partes', texto: 'Contexto, tarea, formato y ejemplo. Si no sirve, dígale qué cambiar.' },
      { titulo: 'La cuenta de Ekosolv, no la suya', texto: 'Los documentos de trabajo se pegan completos solo en la cuenta de la empresa. Datos de salud, solo si la tarea los necesita. Contraseñas, nunca (Ley 1581 de 2012).' },
    ],
    instrucciones: [
      {
        titulo: 'Plantilla de cuatro partes',
        texto: 'Contexto: soy [cargo] en Ekosolv. [Lo que hay que saber.]\nTarea: [verbo + qué necesita].\nFormato: [tabla con columnas X, Y, Z / correo de máximo N líneas].\nEjemplo: [cómo debe quedar].',
      },
      {
        titulo: 'Pedir la fuente de cada dato',
        texto: 'Para cada dato, indica entre paréntesis el artículo o la página donde aparece. Si no está en el documento, escribe "no aparece".',
      },
    ],
  },
}

function OPCIONES_SEMAFORO() {
  return [
    { id: 'si', texto: 'Se sube' },
    { id: 'anon', texto: 'Se sube anonimizado' },
    { id: 'no', texto: 'No se sube' },
  ]
}
