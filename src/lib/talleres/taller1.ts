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
    enunciado: '¿Puede pegar en la IA un certificado con la cédula y el teléfono del conductor?',
    opciones: [
      { id: 'a', texto: 'Sí, es un documento de trabajo' },
      { id: 'b', texto: 'No sin antes quitar los datos personales' },
      { id: 'c', texto: 'Solo si el cliente es antiguo' },
    ],
    correcta: 'b',
    explicacion: 'La Ley 1581 de 2012 protege los datos personales: se anonimiza antes de compartir.',
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
        { id: 's1', enunciado: 'El texto de una resolución publicada por la autoridad ambiental.', opciones: OPCIONES_SEMAFORO(), correcta: 'si', explicacion: 'Es un documento público: se puede compartir.' },
        { id: 's2', enunciado: 'Un certificado de disposición final con el nombre y la cédula del conductor.', opciones: OPCIONES_SEMAFORO(), correcta: 'anon', explicacion: 'Sirve para la tarea, pero primero se tapan nombre y cédula.' },
        { id: 's3', enunciado: 'La lista del personal con sus incapacidades médicas.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'Los datos de salud son sensibles: no se suben.' },
        { id: 's4', enunciado: 'El correo de un cliente, con su celular personal, para redactar la respuesta.', opciones: OPCIONES_SEMAFORO(), correcta: 'anon', explicacion: 'Se quita el celular y el nombre si no hacen falta para responder.' },
        { id: 's5', enunciado: 'La contraseña de Zoho, para que la IA "revise" algo.', opciones: OPCIONES_SEMAFORO(), correcta: 'no', explicacion: 'Contraseñas y claves de acceso, nunca.' },
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
        'Bienvenida. Presentarse en una frase y decir el objetivo del día: entender qué hay detrás de la IA para usarla bien desde el lunes.',
        'Cuatro horas, con descanso a mitad. Hoy no hace falta saber nada de tecnología.',
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
        'Que escaneen el código y escriban su nombre, apellido, cargo y área. No necesitan usuario ni contraseña: con eso queda su asistencia.',
        'Al entrar queda marcada la asistencia de hoy. El contador sube en pantalla: esperar a la mayoría antes de seguir.',
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
        'No es un examen y nadie ve las respuestas de nadie. Sirve para comparar al final cuánto avanzó el grupo.',
        'Dar unos tres minutos. Seguir cuando el contador se acerque al total de la sala.',
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
        'Estos son los datos de la encuesta que el propio equipo respondió en /ia. No son cifras de afuera: son las suyas.',
        'Cerrar con: el objetivo no es reemplazar a nadie, es devolverles esas horas para lo que requiere criterio.',
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
        'Paso 1: así funciona el software de siempre. Alguien escribe reglas "si pasa esto, haga aquello".',
        'Paso 2: llega un caso que nadie previó, una luminaria LED con batería de litio. Ninguna regla lo cubre y el programa se queda sin respuesta.',
        'Paso 3: un modelo no tiene reglas escritas. Vio miles de ejemplos ya clasificados y ubica el caso nuevo cerca de los parecidos: es RAEE y lleva un componente peligroso. Eso es aprender de ejemplos.',
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
        'Paso 1: por dentro, un modelo es una red de números que se pueden subir o bajar, como perillas. Al principio están al azar y responde basura.',
        'Paso 2: entrenar es mostrarle un ejemplo, medir cuánto se equivocó y mover un poquito cada perilla para equivocarse menos. Repetido miles de millones de veces, el error baja.',
        'Paso 3: los modelos grandes tienen miles de millones de perillas. El número exacto de Claude no es público. Nadie programa lo que sabe: sale del ajuste.',
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
        'El texto se parte en trozos: palabras comunes enteras, palabras largas en pedazos, cifras en grupos. Cada trozo es un token.',
        'Escribir en vivo algo que digan ellos, por ejemplo el nombre de un cliente o una norma. Mostrar cómo "Resolución" se parte.',
        'Paso 1: por qué importa: el límite de lo que la IA puede leer y el costo se miden en tokens, no en páginas. La partición en pantalla es aproximada, para ilustrar.',
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
        'Esta es la idea central del día. Ante un texto, el modelo calcula qué tan probable es cada token que podría seguir.',
        'Paso 1: elige uno, lo agrega y vuelve a calcular. Así escribe un párrafo entero, token por token.',
        'Paso 2: la temperatura. Baja: casi siempre elige lo más probable, respuestas parecidas. Alta: se arriesga más. Por eso la misma pregunta da redacciones distintas. Mover el control y generar varias veces.',
        'Las probabilidades en pantalla son un ejemplo ilustrativo.',
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
        'Paso 1: cada palabra se convierte en una posición en un mapa con miles de dimensiones. Aquí lo vemos en dos.',
        'Paso 2: durante el entrenamiento, las palabras que aparecen en contextos parecidos terminan cerca. Nadie le dijo que el tóner es peligroso: lo aprendió de cómo se usa la palabra.',
        'Paso 3: la luminaria queda entre RAEE y RESPEL, igual que en la vida real. Por eso entiende sinónimos y frases que nunca vio escritas igual.',
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
        'Paso 1: preentrenamiento. Lee una cantidad enorme de texto: libros, páginas públicas, código. Ahí aprende el idioma y muchísimos datos, buenos y malos.',
        'Paso 2: ajuste. Personas le muestran buenas respuestas y califican las suyas. Ahí aprende a seguir instrucciones, a ser útil y a negarse a lo dañino.',
        'Paso 3: fecha de corte. Lo que pasó después de su entrenamiento no lo sabe, a menos que usted se lo muestre o que la herramienta busque en internet. Una norma de la semana pasada, por ejemplo.',
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
        'Todo lo que la IA tiene en cuenta al responder está en la conversación: sus mensajes, los documentos que adjuntó y sus propias respuestas. Eso es la ventana de contexto.',
        'Paso 1: un auto de 40 páginas cabe sin problema. Paso 2: un PMA completo también, pero ocupa buena parte. Paso 3: todo el archivo de expedientes no cabe: hay que elegir qué darle.',
        'La capacidad es del orden de unos cientos de páginas, según el modelo y el plan. Y al abrir una conversación nueva, la mesa queda vacía: no recuerda la anterior, salvo que use un proyecto.',
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
        'Paso 1: el modelo es el cerebro: Claude, GPT, Gemini, Llama. Lo hacen pocas empresas en el mundo.',
        'Paso 2: la aplicación es por donde usted lo usa: claude.ai, ChatGPT, Gemini, Copilot. En Ekosolv vamos a trabajar con Claude.',
        'Paso 3: las herramientas le dan manos: leer PDF e imágenes, buscar en internet, conectarse a sistemas como Zoho. Cuando la IA usa herramientas por su cuenta para cumplir una tarea, hablamos de agentes.',
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
        'Dos preguntas rápidas desde el celular. Esperar respuestas y revelar con cada clic.',
        'Si más de un tercio falla, repasar tokens o temperatura antes de seguir.',
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
        'Un ejemplo por área, con un clic cada uno. Preguntar a alguien de cada área si le suena.',
        'Lo común: leer y resumir documentos largos, pasar información a tablas, redactar primeros borradores y revisar contra una lista.',
      ],
      datos: {
        areas: [
          { id: 'operaciones', nombre: 'Operaciones', ejemplo: 'Sacar de un auto las obligaciones, plazos y responsables, citando el artículo.' },
          { id: 'logistica', nombre: 'Logística', ejemplo: 'Pasar un lote de certificados a una tabla y detectar diferencias con lo recolectado.' },
          { id: 'ventas', nombre: 'Ventas', ejemplo: 'Convertir un Brief de Zoho en el borrador de una propuesta.' },
          { id: 'mercadeo', nombre: 'Mercadeo / Redes', ejemplo: 'Convertir una norma nueva en un artículo y tres publicaciones.' },
          { id: 'gerencia', nombre: 'Gerencia General', ejemplo: 'El resumen ejecutivo de un contrato largo, con sus puntos clave.' },
          { id: 'finanzas', nombre: 'Finanzas', ejemplo: 'Explicar en lenguaje sencillo las variaciones de un reporte de Zoho Books.' },
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
        'Cuatro afirmaciones como las que podría escribir la IA. Que voten en el celular si cada una es verdad o inventada.',
        'Revelar una por clic. La cuarta es la más importante: una norma real con un dato falso.',
        'Mike: antes de la sesión, verificar estas citas y cambiarlas por normas que el equipo use a diario.',
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
        'Volver a la idea 4: predice lo probable. Ante "la Resolución ____ de 2019", muchos números son probables y ninguno destaca.',
        'Paso 1: elige uno y sigue escribiendo con total seguridad. No miente a propósito: completa el patrón.',
        'Paso 2: por eso inventa más con números, fechas, artículos y hechos recientes, y menos cuando el dato está en el documento que usted le dio.',
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
        'Un hábito por clic. Insistir: el trabajo de la IA se revisa como el de un practicante nuevo, siempre.',
        'El tercero ya lo vieron en la lección de la academia: pedir que diga de qué parte del documento sacó cada dato.',
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
      notas: ['Al volver: cómo pedirle a la IA para que acierte al primer o segundo intento.'],
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
        'Casi todos los malos resultados vienen de instrucciones cortas. Una parte por clic.',
        'Contexto: quién es usted y qué hay que saber. Tarea: un verbo claro. Formato: cómo lo quiere recibir. Ejemplo: cómo debe quedar.',
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
        'Primero mostrar el auto. Después pedirle a Claude con cada versión: el botón "Preguntarle a Claude" está aquí y en la pantalla.',
        'Versión 1: solo "Resúmeme este auto". Sale un párrafo correcto pero inútil para trabajar.',
        'Versión 2 a 4: un clic por versión. Señalar lo que cambia en la respuesta con cada parte agregada.',
        'Si la IA no responde, aparece la respuesta guardada con su etiqueta. El auto es de ejemplo hasta tener uno real de Ekosolv.',
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
        'Paso 1 y 2: una conversación real se corrige por partes, como con un compañero.',
        'Paso 3: cuando una instrucción le funcione, guárdela. En Claude se puede crear un proyecto con instrucciones y documentos fijos, para no repetirlos cada vez.',
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
        'En esta escena la sala del celular se convierte en el revisor: cada persona escribe su instrucción y la IA le dice qué le faltó. Quien cerró la sala, que vuelva a escanear el código.',
        'Recorrer la sala. A los 20 minutos, pedir 2 o 3 voluntarios y mostrar su instrucción antes y después.',
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
        'La Ley 1581 de 2012 protege los datos personales. Compartirlos sin cuidado con una herramienta externa es un riesgo legal y de confianza.',
        'Cinco casos; votan en el celular y se revela uno por clic.',
        'Regla corta: documentos públicos sí; documentos de trabajo, anonimizados; datos sensibles y contraseñas, nunca.',
      ],
    },
    {
      id: 'anonimizar',
      bloque: 'seguridad',
      tipo: 'anonimizar',
      kicker: 'Cómo anonimizar',
      titulo: 'Tape lo personal antes de pegar',
      minutos: 8,
      pasos: 1,
      provisional: true,
      notas: [
        'Hacer clic sobre cada dato personal para taparlo, preguntando a la sala cuál sigue.',
        'Paso 1: tapa los que falten. Mostrar que el documento sigue sirviendo para la tarea sin esos datos.',
        'Cambiar nombres por roles ("el conductor", "el representante legal") en vez de borrarlos.',
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
      notas: ['Las mismas preguntas del inicio. Esperar a la mayoría.'],
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
        'Mostrar el promedio de aciertos antes y después. Paso 1: pregunta por pregunta.',
        'Comentar la pregunta que menos subió: ahí hay que reforzar en los próximos sábados.',
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
        'Todo el equipo asiste a los tres sábados que faltan, sin separar por áreas.',
        'Mientras tanto: entregar en la academia la tarea real de su puesto.',
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
      notas: ['La tarjeta resumen queda en la academia para descargar e imprimir. Cerrar con la idea del practicante: rápido y capaz, pero su trabajo siempre se revisa.'],
    },
  ],
  resumen: {
    ideas: [
      { titulo: 'Predice, no consulta', texto: 'Redacta el texto más probable, token por token, a partir de lo que aprendió y de lo que usted le da.' },
      { titulo: 'Sabe hasta su fecha de corte', texto: 'Lo reciente o interno de Ekosolv no lo conoce si usted no se lo muestra.' },
      { titulo: 'Trabaja con lo que está en la mesa', texto: 'Solo tiene en cuenta la conversación y sus adjuntos. Una conversación nueva empieza vacía.' },
      { titulo: 'Puede inventar con seguridad', texto: 'Normas, cifras y fechas se verifican siempre contra la fuente.' },
      { titulo: 'Cuatro partes', texto: 'Contexto, tarea, formato y ejemplo. Si no sirve, dígale qué cambiar.' },
      { titulo: 'Datos personales, no', texto: 'Anonimice antes de pegar. Datos sensibles y contraseñas, nunca (Ley 1581 de 2012).' },
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
