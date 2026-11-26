/**
 * Capacitación 2 de 4: de la teoría a la práctica (Mike, 2026-11-25).
 *
 * Una hora de teoría (los tres modelos, skill, conector o MCP, plugin y
 * tareas automatizadas) y el resto práctica con casos reales que cada
 * persona trae ese día: retos a su ritmo (retos2.ts) mientras quien dicta
 * acompaña 15 minutos a cada uno, con turnos en el panel (turnos.ts).
 * Plataforma mixta: Claude Desktop con Cowork para quien pueda instalarla y
 * claude.ai en Chrome como plan B. Módulo PURO.
 */
import type { Interaccion, Taller } from './tipos.ts'
import { TALLER_1 } from './taller1.ts'
import { CELULAR_TALLER2 } from './ejemplos2.ts'
import { RETOS_TALLER2 } from './retos2.ts'

const OPCIONES_MODELO = () => [
  { id: 'opus', texto: 'Opus, el experto' },
  { id: 'sonnet', texto: 'Sonnet, el todoterreno' },
  { id: 'haiku', texto: 'Haiku, el rápido' },
]

const OPCIONES_PIEZA = () => [
  { id: 'skill', texto: 'Skill' },
  { id: 'conector', texto: 'Conector' },
  { id: 'plugin', texto: 'Plugin' },
  { id: 'tarea', texto: 'Tarea programada' },
]

// Repaso de la capacitación 1: las mismas preguntas de la evaluación (mismo id),
// abiertas aquí como interacción propia para que se puedan votar hoy.
const REPASO_IDS = ['e2', 'e4', 'e5']
const evalPre = TALLER_1.interacciones.find((i) => i.id === 'pre')!
const REPASO: Interaccion = {
  id: 'repaso',
  tipo: 'voto',
  titulo: 'Repaso del sábado pasado',
  preguntas: REPASO_IDS.map((id) => evalPre.preguntas.find((p) => p.id === id)!),
}

export const TALLER_2: Taller = {
  n: 2,
  titulo: 'Claude a trabajar: skills, conectores y tareas',
  subtitulo: 'Qué modelo usar, cómo enseñarle el procedimiento de Ekosolv, cómo conectarlo a sus sistemas y cómo dejarlo trabajando solo',
  firma: 'Con su caso real, en su propio computador',
  modulos: ['general'],
  minutosTotales: 240,
  bloques: [
    { id: 'apertura', titulo: 'Apertura', minutos: 8 },
    { id: 'modelos', titulo: 'Tres modelos, tres trabajos', minutos: 14 },
    { id: 'piezas', titulo: 'Skills, conectores y plugins', minutos: 26 },
    { id: 'automatizar', titulo: 'Tareas automatizadas', minutos: 12 },
    { id: 'practica', titulo: 'Práctica con su caso', minutos: 165 },
    { id: 'cierre', titulo: 'Cierre', minutos: 15 },
  ],
  interacciones: [
    REPASO,
    {
      id: 'quemodelo',
      tipo: 'voto',
      titulo: '¿A cuál modelo se lo mandaría?',
      preguntas: [
        {
          id: 'm1',
          enunciado: 'Clasificar 200 correos de solicitudes en recolección, certificado, cotización u otro.',
          opciones: OPCIONES_MODELO(),
          correcta: 'haiku',
          explicacion: 'Tarea simple y repetida: Haiku la hace en segundos y casi no gasta del límite.',
        },
        {
          id: 'm2',
          enunciado: 'Cruzar un auto de 60 páginas con la licencia del cliente y decir qué obligaciones cambian y qué riesgo hay.',
          opciones: OPCIONES_MODELO(),
          correcta: 'opus',
          explicacion: 'Mucho documento y mucho criterio: vale la pena esperar a Opus.',
        },
        {
          id: 'm3',
          enunciado: 'Redactar la propuesta de un cliente nuevo a partir del Brief de Zoho y la plantilla de Ekosolv.',
          opciones: OPCIONES_MODELO(),
          correcta: 'sonnet',
          explicacion: 'Trabajo de todos los días que pide buena redacción: Sonnet, el equilibrio.',
        },
      ],
    },
    {
      id: 'clasificar',
      tipo: 'voto',
      titulo: '¿Skill, conector, plugin o tarea?',
      preguntas: [
        { id: 'p1', enunciado: 'Un archivo con cómo revisa Ekosolv un auto, que Claude abre solo cuando le piden revisar uno.', opciones: OPCIONES_PIEZA(), correcta: 'skill', explicacion: 'Es un procedimiento escrito: una skill.' },
        { id: 'p2', enunciado: 'Que Claude lea las oportunidades de Zoho CRM sin que usted copie y pegue.', opciones: OPCIONES_PIEZA(), correcta: 'conector', explicacion: 'Le da acceso a un sistema: un conector (MCP).' },
        { id: 'p3', enunciado: 'Un paquete con la skill de propuestas, el conector de Zoho y el comando /propuesta, que se instala en un paso.', opciones: OPCIONES_PIEZA(), correcta: 'plugin', explicacion: 'Junta varias piezas en una caja: un plugin.' },
        { id: 'p4', enunciado: 'Cada lunes a las 7 a. m. Claude revisa las propuestas sin respuesta y le deja los correos de seguimiento.', opciones: OPCIONES_PIEZA(), correcta: 'tarea', explicacion: 'Corre sola con horario: una tarea programada.' },
      ],
    },
  ],
  demos: [],
  repaso: { taller: 1, interaccion: 'pre', preguntas: REPASO_IDS },
  carreras: [
    {
      id: 'gestor',
      instruccion:
        'Soy consultor ambiental de Ekosolv, empresa colombiana de gestión de residuos. Un cliente generador de RAEE (una planta de luminarias en Funza) recibió de la autoridad ambiental un requerimiento: debe presentar los certificados de disposición final de 2025 en 30 días hábiles. El gestor de residuos todavía no se los ha entregado.\n\nEscribe:\n1. Un correo corto al gestor pidiendo los certificados, con un plazo claro.\n2. Tres riesgos para el cliente si no cumple el plazo.\n3. Qué haría yo esta misma semana, en tres pasos.\n\nMáximo 220 palabras. No cites números de normas.',
      respaldos: {
        haiku:
          '**1. Correo al gestor**\n\nAsunto: Certificados de disposición final 2025\n\nBuenos días. Les solicitamos los certificados de disposición final de 2025 de nuestro cliente, la planta de luminarias en Funza. La autoridad ambiental los requirió y el plazo es corto. Les agradecemos enviarlos a más tardar el próximo viernes.\n\n**2. Riesgos**\n\n- Sanción por incumplir el requerimiento.\n- Más visitas y requerimientos de la autoridad.\n- Problemas con la licencia o el permiso.\n\n**3. Esta semana**\n\n1. Enviar el correo hoy.\n2. Llamar al gestor el miércoles.\n3. Avisar al cliente del estado.',
        sonnet:
          '**1. Correo al gestor**\n\nAsunto: Urgente · Certificados de disposición final 2025, planta de Funza\n\nBuenos días. La autoridad ambiental requirió a nuestro cliente los certificados de disposición final de los RAEE gestionados en 2025, con un plazo de 30 días hábiles. Les pedimos enviarlos **a más tardar el viernes de la próxima semana**, con las cantidades por lote y la fecha de cada disposición. Si falta algún soporte, por favor avísennos de una vez para resolverlo a tiempo.\n\n**2. Riesgos si no se cumple**\n\n- Apertura de un proceso sancionatorio por no atender el requerimiento.\n- Que la autoridad presuma un manejo inadecuado de los residuos y pida más información o visitas.\n- Que el incumplimiento quede en el expediente y pese en próximos seguimientos.\n\n**3. Esta semana**\n\n1. Enviar el correo hoy y dejar la fecha límite en el calendario.\n2. Verificar que la licencia del gestor esté vigente.\n3. Preparar con el cliente la carta de respuesta, para radicar apenas lleguen los certificados.',
        opus:
          '**1. Correo al gestor**\n\nAsunto: Certificados de disposición final 2025 · plazo de la autoridad\n\nBuenos días. La autoridad ambiental requirió a nuestro cliente, la planta de luminarias de Funza, los certificados de disposición final de 2025, con plazo de 30 días hábiles. Para revisarlos antes de radicar necesitamos recibirlos **a más tardar en 10 días hábiles**, con cantidades por lote, fechas y tratamiento aplicado. Si algún lote no tiene certificado, por favor indíquenlo por escrito.\n\n**2. Riesgos**\n\n- **Sancionatorio**: no responder en el plazo puede abrir una investigación.\n- **Trazabilidad**: sin certificado, la autoridad puede asumir que esos residuos no tuvieron disposición final, y el cliente responde como generador aunque el error sea del gestor.\n- **Reputación**: un incumplimiento queda en el expediente y endurece los próximos seguimientos.\n\n**3. Esta semana**\n\n1. Enviar el correo y calcular la fecha límite real en días hábiles desde la notificación.\n2. Cruzar la cantidad recolectada en 2025 con lo que el gestor dice haber dispuesto: si no cuadra, saberlo antes que la autoridad.\n3. Plan B: si el gestor no responde en 5 días, pedirle al cliente una prórroga sustentada antes de que venza el plazo.',
      },
    },
  ],
  retos: RETOS_TALLER2,
  escenas: [
    // ── Apertura (8) ──
    {
      id: 'portada',
      bloque: 'apertura',
      tipo: 'portada',
      kicker: 'Capacitación 2 de 4 · Todo el equipo',
      titulo: 'Claude a trabajar',
      minutos: 2,
      pasos: 0,
      notas: [
        'Abra con el cambio de ritmo: "El sábado pasado entendimos qué es la IA por dentro. Hoy la ponemos a trabajar con lo de ustedes: una hora de ideas y el resto con su propio caso en su computador."',
        'Lo que se llevan hoy: saber qué modelo usar para cada tarea, entender las cuatro piezas que convierten a Claude en un compañero de trabajo (skill, conector, plugin y tarea programada) y salir con al menos una skill instalada y una tarea programada propia.',
        'Recuerde el caso: cada uno trajo una tarea real. Si alguien no trajo, que piense ya en una que le quite tiempo cada semana: en la práctica la va a necesitar.',
      ],
      siPreguntan: [
        { p: '¿Necesito instalar algo?', r: 'Lo ideal es Claude Desktop, porque trae Cowork con las tareas programadas y los plugins. Si su PC no lo deja instalar, todo lo de hoy también se hace desde claude.ai en Chrome con la cuenta de Ekosolv. Nadie se queda por fuera.' },
      ],
    },
    {
      id: 'sala',
      bloque: 'apertura',
      tipo: 'sala',
      kicker: 'Antes de empezar',
      titulo: 'Saque el celular: hoy también lleva su práctica',
      minutos: 3,
      pasos: 0,
      notas: [
        'Mientras escanean: quien ya se registró el sábado pasado solo escribe su correo y entra de una vez. Quien es nuevo escribe nombre, apellido y área.',
        'Explique qué cambia hoy en el celular: además de votar, en la práctica ahí salen los cinco retos con los pasos y un ejemplo de su área, y ahí les avisa cuando llegue su turno de acompañamiento de 15 minutos.',
        'Pida que también abran la presentación en el PC con "Abrir en mi PC": hoy el PC es la herramienta de trabajo.',
      ],
    },
    {
      id: 'repaso',
      bloque: 'apertura',
      tipo: 'repaso',
      kicker: 'Tres preguntas del sábado pasado',
      titulo: '¿Qué nos quedó?',
      minutos: 3,
      pasos: 3,
      interaccion: 'repaso',
      notas: [
        'Diga: "Tres preguntas rápidas del sábado pasado. Son las que más nos importan para lo de hoy, porque hoy Claude va a leer sus documentos y sus sistemas." Espere a que vote la mayoría antes de revelar.',
        'Paso 1, la norma que cita la IA: se verifica en la fuente oficial. Hoy es más importante que nunca: con un conector, la IA trae datos reales de Zoho, pero lo que redacta sobre normas sigue siendo predicción.',
        'Paso 2, pegar un documento con datos de clientes: sí, en la cuenta de Ekosolv. Recuerde que hoy todo se hace en esa cuenta, también las skills y las tareas programadas.',
        'Paso 3, la memoria entre conversaciones: no recuerda, salvo que le vuelva a dar el contexto o esté en un proyecto. Enlace con lo que viene: "Hoy vamos a ver la forma más poderosa de no repetir las cosas: la skill, un procedimiento que Claude abre solo cuando lo necesita."',
      ],
    },

    // ── Tres modelos (14) ──
    {
      id: 'modelos',
      bloque: 'modelos',
      tipo: 'modelos',
      kicker: 'Idea 1 · Elegir el modelo',
      titulo: 'Opus, Sonnet y Haiku: tres trabajos distintos',
      minutos: 5,
      pasos: 3,
      notas: [
        'La idea que hay que dejar: no hay un modelo "mejor" para todo. Es como en una consultora: no se le pide al socio que clasifique correos ni al practicante que firme un concepto jurídico. Los tres son Claude y están en el selector de modelo de la misma cuenta.',
        'Paso 1, Opus, el experto: el más capaz. Rinde en análisis largos, cruces de varios documentos y decisiones con muchas variables. Es el más lento y el que más gasta del límite de uso del plan. Úselo cuando equivocarse sale caro: un auto complejo, una propuesta grande, un comparativo con hallazgos.',
        'Paso 2, Sonnet, el todoterreno: el equilibrio entre capacidad y velocidad. Para el trabajo de todos los días: redactar, resumir, armar tablas, usar conectores. Si no sabe cuál elegir, empiece por Sonnet.',
        'Paso 3, Haiku, el rápido: responde en segundos y casi no gasta. Ideal para tareas simples y repetidas: clasificar, extraer un dato, revisar ortografía, tareas programadas que corren todos los días. Regla práctica: empiece con el más rápido que sirva y suba solo si la respuesta se queda corta.',
      ],
      siPreguntan: [
        { p: '¿Dónde se cambia el modelo?', r: 'En el selector que está junto a la caja donde se escribe, en claude.ai, en Claude Desktop y en la app. Se puede cambiar en cada conversación.' },
        { p: '¿Gastar más del límite le cuesta plata a Ekosolv?', r: 'En el plan de suscripción se paga una tarifa fija por persona. Lo que cambia es que Opus agota más rápido el límite de uso de cada periodo: si lo usa para todo, puede quedarse sin uso a mitad de semana.' },
      ],
      datos: {
        modelos: [
          { id: 'opus', nombre: 'Opus', apodo: 'El experto', capacidad: 5, velocidad: 2, consumo: 5, para: 'Análisis largos, cruces de documentos y decisiones con muchas variables.', ejemplo: 'Cruzar un auto de 60 páginas con la licencia y decir qué riesgo hay.' },
          { id: 'sonnet', nombre: 'Sonnet', apodo: 'El todoterreno', capacidad: 4, velocidad: 4, consumo: 3, para: 'El trabajo de todos los días: redactar, resumir, tablas y conectores.', ejemplo: 'La propuesta de un cliente nuevo a partir del Brief de Zoho.' },
          { id: 'haiku', nombre: 'Haiku', apodo: 'El rápido', capacidad: 3, velocidad: 5, consumo: 1, para: 'Tareas simples y repetidas, y tareas que corren todos los días.', ejemplo: 'Clasificar los correos de solicitudes del día.' },
        ],
      },
    },
    {
      id: 'carrera',
      bloque: 'modelos',
      tipo: 'carrera',
      kicker: 'En vivo con Claude',
      titulo: 'La misma petición, tres modelos a la vez',
      minutos: 5,
      pasos: 1,
      notas: [
        'Lea la petición en voz alta: un caso típico de Operaciones con un gestor que no entrega certificados. Pregunte: "¿Quién creen que llega primero? ¿Cuál creen que responde mejor?" Toque "Correr la carrera" (o el botón del presentador): las tres peticiones salen al mismo tiempo.',
        'Paso 1, comparar: Haiku llega primero con una respuesta correcta y corta; Sonnet trae un correo más completo y riesgos mejor explicados; Opus tarda más, pero agrega lo que haría un consultor con experiencia (cruzar cantidades, pedir prórroga a tiempo). Pregunte: "¿Para este correo necesitábamos a Opus?" Probablemente no: Sonnet bastaba. Si un modelo no responde, sale su respuesta guardada con la etiqueta.',
      ],
      siPreguntan: [
        { p: '¿Por qué Opus no siempre se nota mejor?', r: 'Porque en tareas sencillas los tres hacen un buen trabajo. La diferencia aparece cuando hay mucho documento, varias fuentes que cruzar o una decisión difícil. Por eso se elige por tarea.' },
      ],
      datos: { carrera: 'gestor' },
    },
    {
      id: 'quemodelo',
      bloque: 'modelos',
      tipo: 'voto',
      kicker: 'Juego',
      titulo: '¿A cuál modelo se lo mandaría?',
      minutos: 4,
      pasos: 3,
      interaccion: 'quemodelo',
      notas: [
        'Diga: "Tres tareas reales de Ekosolv. Voten en el celular a cuál modelo se la mandarían." Espere los votos antes de revelar cada una.',
        'Paso 1, clasificar 200 correos: Haiku. Es simple y se repite; lo importante es que salga rápido y que no gaste el límite. Si después revisa y ve errores, ahí sube a Sonnet.',
        'Paso 2, cruzar un auto de 60 páginas con la licencia: Opus. Mucho documento, varias fuentes y un juicio que cuesta caro si sale mal. Aquí vale la pena esperar un minuto más.',
        'Paso 3, la propuesta desde el Brief: Sonnet. Buena redacción, conector de Zoho y velocidad razonable. Remate: "Si dudan, Sonnet. Si es repetido y simple, Haiku. Si es largo y delicado, Opus."',
      ],
    },

    // ── Skills, conectores y plugins (26) ──
    {
      id: 'orbita',
      bloque: 'piezas',
      tipo: 'orbita',
      kicker: 'El mapa de hoy',
      titulo: 'Cuatro piezas que convierten a Claude en compañero de trabajo',
      minutos: 3,
      pasos: 4,
      notas: [
        'Diga: "Hasta hoy, Claude sabía lo que aprendió y lo que ustedes le pegan en la conversación. Estas cuatro piezas le agregan lo que le faltaba: el procedimiento de Ekosolv, acceso a los sistemas, todo en un paquete y la posibilidad de trabajar solo."',
        'Paso 1, la skill: el procedimiento escrito. Le enseña a Claude cómo hace Ekosolv una tarea.',
        'Paso 2, el conector: el acceso a un sistema (Zoho, el correo, Canva). Le da los datos sin copiar y pegar.',
        'Paso 3, el plugin: la caja que trae varias skills y conectores juntos, para instalar en un paso.',
        'Paso 4, la tarea programada: Claude hace el trabajo solo, con horario. Cierre: "Una pieza por vez. Al final de la hora las van a distinguir sin pensar."',
      ],
      datos: {
        piezas: [
          { id: 'skill', nombre: 'Skill', imagen: 'El procedimiento', texto: 'Le enseña cómo hace Ekosolv una tarea.' },
          { id: 'conector', nombre: 'Conector', imagen: 'El enchufe', texto: 'Le da acceso a Zoho, el correo o Canva.' },
          { id: 'plugin', nombre: 'Plugin', imagen: 'La caja', texto: 'Trae skills y conectores juntos.' },
          { id: 'tarea', nombre: 'Tarea', imagen: 'El reloj', texto: 'Trabaja solo, con horario.' },
        ],
      },
    },
    {
      id: 'skill',
      bloque: 'piezas',
      tipo: 'skill',
      kicker: 'Pieza 1 · Skill',
      titulo: 'Una skill es el procedimiento que Claude abre solo',
      minutos: 8,
      pasos: 3,
      notas: [
        'Diga: "¿Cuántas veces le han explicado a Claude cómo quieren la tabla del auto? Con una skill se le explica una vez, por escrito, y la usa siempre que haga falta." Es como el manual de procedimientos que se le entrega a alguien nuevo.',
        'Paso 1, por dentro: una skill es una carpeta con un archivo de texto llamado SKILL.md. Arriba tiene un nombre y una descripción de cuándo usarla; abajo, las instrucciones: pasos, formato, reglas y ejemplos. Puede traer plantillas o archivos de apoyo. No es programación: es un documento escrito en español.',
        'Paso 2, cómo la elige: Claude solo lee las descripciones de todas sus skills (unas pocas líneas cada una). Cuando una petición encaja con una descripción, abre esa skill completa. Por eso puede tener muchas sin que le ocupen la mesa de trabajo. Consecuencia práctica: la descripción tiene que decir claramente cuándo se usa, o Claude no la va a abrir.',
        'Paso 3, sin y con: la misma petición corta ("revisa este auto") da una respuesta genérica sin skill y la tabla de Ekosolv con skill. Claude ya trae skills hechas por Anthropic (Word, Excel, PowerPoint y PDF) y una para crear skills. En la práctica cada uno instala la de su área y crea una propia.',
      ],
      siPreguntan: [
        { p: '¿Cuál es la diferencia con un proyecto?', r: 'El proyecto guarda documentos e instrucciones para las conversaciones de ese proyecto. La skill funciona en cualquier conversación y Claude la abre solo cuando la tarea encaja. Se usan juntas: el proyecto con los documentos del cliente y la skill con el procedimiento.' },
        { p: '¿Las skills se comparten con el equipo?', r: 'Sí. Cada uno puede subir el mismo archivo, y en el plan de empresa la administración puede publicar skills para toda la organización. Así todos trabajan con el mismo procedimiento.' },
      ],
      datos: {
        archivo: {
          nombre: 'revision-autos-ekosolv',
          descripcion: 'Revisa autos de la ANLA o de una CAR y saca cada obligación con su artículo, plazo y responsable. Úsala cuando pidan revisar, resumir o sacar obligaciones de un auto.',
          cuerpo: ['1. Lee el auto completo antes de responder.', '2. Tabla: Obligación · Artículo · Plazo · Responsable · Acción.', '3. Si un dato no está, escribe "no aparece".', '4. Los plazos en días hábiles se revisan en el calendario.', '5. Cierra con la obligación más urgente y por qué.'],
        },
        lista: [
          { nombre: 'Word (docx)', descripcion: 'Crear y editar documentos de Word.' },
          { nombre: 'Excel (xlsx)', descripcion: 'Hojas de cálculo, fórmulas y tablas.' },
          { nombre: 'revision-autos-ekosolv', descripcion: 'Revisar autos de la ANLA o una CAR.' },
          { nombre: 'tono-ekosolv', descripcion: 'Escribir con la voz de Ekosolv.' },
          { nombre: 'PDF', descripcion: 'Leer, llenar y unir archivos PDF.' },
        ],
        peticion: 'Revisa este auto de la CAR.',
        sin: 'El auto trata sobre el seguimiento ambiental de la planta. La autoridad hace varios requerimientos relacionados con residuos y pide información en los próximos meses.',
        con: [
          ['Presentar certificados de disposición final 2025', 'Art. 1', '30 días hábiles', 'Cliente con Ekosolv'],
          ['Registro mensual de RESPEL en el ICA', 'Art. 2', 'Próximo ICA', 'Cliente'],
          ['Actualizar ficha PMA-07', 'Art. 3', 'no aparece', 'Ekosolv'],
        ],
      },
    },
    {
      id: 'enchufe',
      bloque: 'piezas',
      tipo: 'enchufe',
      kicker: 'Pieza 2 · Conector o MCP',
      titulo: 'Un conector es el enchufe entre Claude y sus sistemas',
      minutos: 7,
      pasos: 3,
      notas: [
        'Conecte con el sábado pasado: "Ya conectamos Zoho CRM. Hoy vamos a entender qué hicimos y por qué importa."',
        'Paso 1, sin conector: usted es el cable. Abre Zoho, copia, pega en Claude, copia la respuesta y la vuelve a pegar en Zoho. Funciona, pero es lento, se cuelan errores y Claude solo ve lo que usted le pegó.',
        'Paso 2, con conector: Claude consulta Zoho directamente, trae los datos actualizados y, si se le permite, crea o modifica registros. Siempre con permisos: lectura y escritura se controlan por separado, y la escritura la dejamos en "Always ask" o bloqueada. Lo que Claude ve es lo que su usuario de Zoho puede ver, nada más.',
        'Paso 3, MCP es el estándar del enchufe: un protocolo abierto, como el USB. Cualquier sistema que tenga su conector MCP se conecta igual: Zoho, Gmail, Google Drive, Canva, Notion. Por eso se habla de "conector" y de "MCP" casi como sinónimos: el conector es el enchufe armado y MCP es la forma estándar que tiene. Siigo ya tiene conector oficial, en beta: facturas de venta y de compra, clientes y productos. Los sistemas sin conector (la DIAN, VITAL) se trabajan exportando a Excel o con Claude in Chrome, iniciando usted la sesión.',
      ],
      siPreguntan: [
        { p: '¿Claude puede borrar algo en Zoho?', r: 'Solo si usted le da permiso a esa herramienta. Por eso dejamos la escritura en "Always ask" o bloqueada: cada cambio le pide aprobación, y usted lee qué va a hacer antes de permitirlo.' },
        { p: '¿Se puede conectar con Siigo?', r: 'Sí. Siigo tiene un conector oficial para Claude, en beta: en Claude, Configuración, Conectores, Agregar conector personalizado, con la dirección https://mcp.siigo.com/mcp-adapter, y se entra con el usuario de Siigo. Antes, en Siigo Nube hay que activar las credenciales de integración tipo MCP. Consulta facturas de venta y de compra, clientes y productos, y crea facturas o clientes solo si usted lo confirma; nunca borra. Una factura creada así es real: en la capacitación solo se consulta. En un plan de equipo de Claude, el conector lo agrega el administrador de la cuenta. La contabilidad y los balances no entran: el balance de prueba sale en Excel desde Finanzas, en el panel, o se exporta de Siigo.' },
      ],
      datos: {
        sistemas: [
          { id: 'zoho', nombre: 'Zoho CRM', color: '#E42527', estado: 'Conectado el sábado pasado' },
          { id: 'correo', nombre: 'Correo', color: '#124E7D', estado: 'Por verificar: Zoho Mail o Gmail' },
          { id: 'canva', nombre: 'Canva', color: '#00C4CC', estado: 'Disponible' },
          { id: 'drive', nombre: 'Google Drive', color: '#179C91', estado: 'Disponible' },
        ],
      },
    },
    {
      id: 'plugin',
      bloque: 'piezas',
      tipo: 'plugin',
      kicker: 'Pieza 3 · Plugin',
      titulo: 'Un plugin trae varias piezas en una sola caja',
      minutos: 4,
      pasos: 2,
      notas: [
        'Diga: "Imagínense que para la tarea de propuestas hay que instalar tres skills, conectar Zoho y aprenderse un comando. Un plugin lo trae todo junto y se instala en un paso."',
        'Paso 1, qué trae: skills, conectores, comandos que empiezan por barra (como /propuesta) y, a veces, ayudantes para tareas específicas. Anthropic publica plugins por oficio (ventas, finanzas, mercadeo) que se pueden instalar desde Cowork en Claude Desktop.',
        'Paso 2, el detalle importante: instalar un plugin no inicia sesión en sus conectores. Después de instalarlo hay que entrar a cada conector y conectarlo con su usuario, como hicimos con Zoho. Para Ekosolv la idea es armar un plugin propio por área con las skills de hoy, para que alguien nuevo quede listo en cinco minutos.',
      ],
      siPreguntan: [
        { p: '¿Los plugins funcionan en claude.ai?', r: 'Los plugins nacieron en Cowork, en Claude Desktop, que es donde más rinden. Las skills y los conectores que traen sí se pueden usar en claude.ai. En la práctica, quien tenga Desktop los prueba; los demás trabajan con la skill y el conector por separado.' },
      ],
      datos: {
        contenido: [
          { tipo: 'skill', nombre: 'Skill de propuestas' },
          { tipo: 'skill', nombre: 'Skill de tono Ekosolv' },
          { tipo: 'conector', nombre: 'Conector Zoho CRM' },
          { tipo: 'comando', nombre: '/propuesta' },
        ],
        nombre: 'Plugin Comercial Ekosolv',
      },
    },
    {
      id: 'clasificar',
      bloque: 'piezas',
      tipo: 'voto',
      kicker: 'Comprobación',
      titulo: '¿Skill, conector, plugin o tarea?',
      minutos: 4,
      pasos: 4,
      interaccion: 'clasificar',
      notas: [
        'Diga: "Cuatro casos. Voten cuál pieza es cada uno." Si la mayoría acierta, avance rápido; si no, dedique un minuto a la confusión más común.',
        'Paso 1, el archivo con cómo revisar un auto: skill. Es conocimiento escrito, no conexión.',
        'Paso 2, leer las oportunidades de Zoho: conector. La confusión típica es creer que una skill da acceso a un sistema: no lo da, solo enseña cómo trabajar.',
        'Paso 3, el paquete con skill, conector y comando: plugin.',
        'Paso 4, lo que corre cada lunes: tarea programada. Enlace: "Esa última es la que más tiempo devuelve. Vamos a verla."',
      ],
    },

    // ── Tareas automatizadas (12) ──
    {
      id: 'reloj',
      bloque: 'automatizar',
      tipo: 'reloj',
      kicker: 'Pieza 4 · Tarea programada',
      titulo: 'Claude puede trabajar mientras usted no está',
      minutos: 7,
      pasos: 3,
      notas: [
        'Diga: "Hasta ahora, Claude solo trabaja cuando alguien le escribe. Una tarea programada es una instrucción con horario: cada lunes a las 7, cada día a las 4, el 5 de cada mes."',
        'Paso 1, la instrucción y el horario: se crea en Cowork, escribiendo /schedule o desde Programadas. La instrucción tiene que estar completa, como si se la dejara a alguien que no estuvo en la conversación: qué revisar, dónde, qué entregar y qué hacer si no hay nada.',
        'Paso 2, corre sola: las tareas programadas de Cowork corren en la nube, así que no hace falta dejar el PC encendido. Cada ejecución queda como una conversación propia que usted revisa cuando llega. Usa los conectores y plugins que tenga configurados.',
        'Paso 3, lo que entrega y la trampa: el lunes a las 7 ya está la lista de propuestas frías con su correo de seguimiento. La trampa: si una herramienta del conector está en "Always ask", la tarea se queda esperando su permiso o termina sin usarla. Para tareas de solo lectura, permita la lectura; la escritura, mejor que la tarea no la haga sola: que deje borradores y usted los envía.',
      ],
      siPreguntan: [
        { p: '¿Y si la tarea se equivoca?', r: 'Por eso se diseñan para que entreguen borradores y listas, no para que envíen correos o cambien registros solas. Usted revisa el resultado como revisaría el trabajo de un practicante, y lo ajusta si hace falta.' },
        { p: '¿Cuántas tareas puedo tener?', r: 'Varias, pero cada ejecución gasta del límite de uso del plan. Empiece con una o dos que de verdad le ahorren tiempo, y use Haiku o Sonnet para las que corren todos los días.' },
      ],
      datos: {
        tarea: {
          nombre: 'Propuestas frías',
          cuando: 'Cada lunes · 7:00 a. m.',
          instruccion: 'Revisa en Zoho CRM las Quotes enviadas hace más de 7 días sin respuesta. Ordénalas por valor y redacta un correo de seguimiento para cada una. No envíes nada.',
          pasos: ['Consulta Zoho CRM', 'Ordena por valor', 'Redacta los correos', 'Le deja el resumen'],
        },
        resultado: [
          { cliente: 'Planta de Ejemplo S.A.S.', dias: 12, valor: 'Alto' },
          { cliente: 'Hospital de Ejemplo', dias: 9, valor: 'Medio' },
          { cliente: 'Constructora de Ejemplo', dias: 8, valor: 'Medio' },
        ],
      },
    },
    {
      id: 'flujo',
      bloque: 'automatizar',
      tipo: 'flujo',
      kicker: 'La otra automatización',
      titulo: 'Zoho reacciona a un evento. Claude trabaja con criterio',
      minutos: 5,
      pasos: 2,
      notas: [
        'Diga: "En Ekosolv ya tienen otra forma de automatizar, y es buena: la de Zoho. No compiten, se complementan."',
        'Paso 1, la automatización de Zoho: regla de flujo de trabajo. Cuando pasa algo (una Quote cambia a Enviada), si se cumple una condición (pasan 7 días sin respuesta), Zoho hace una acción fija (envía un aviso, crea una tarea, cambia un campo). Es exacta, gratis dentro del plan y no se equivoca, pero solo hace lo que se dejó escrito. Zoho Flow conecta varias aplicaciones de Zoho y otras externas con la misma lógica.',
        'Paso 2, cuándo cada una: Zoho, cuando la regla es clara y la acción siempre es la misma (avisar, asignar, cambiar un estado). Claude, cuando hay que leer, interpretar o redactar (resumir el correo del cliente, escribir el seguimiento según la historia del trato). Lo mejor es combinarlas: Zoho marca la Quote como fría y la tarea de Claude del lunes redacta el seguimiento. Pendiente: confirmar si el plan de Zoho de Ekosolv incluye Zoho Flow.',
      ],
      siPreguntan: [
        { p: '¿Zia, la IA de Zoho, no hace lo mismo?', r: 'Zia trae funciones útiles dentro de Zoho, como predicciones y resúmenes. Claude con el conector puede hacer tareas más abiertas y combinar Zoho con documentos, la web y las skills de Ekosolv. Las reglas de seguridad son las mismas para las dos.' },
      ],
      datos: {
        zoho: { evento: 'Una Quote pasa a "Enviada"', condicion: 'Pasan 7 días sin respuesta', accion: 'Avisa al comercial y crea una tarea' },
        comparacion: [
          { tema: 'Se dispara', zoho: 'Por un evento en Zoho', claude: 'Por horario o cuando usted pide' },
          { tema: 'Hace', zoho: 'Una acción fija', claude: 'Lee, interpreta y redacta' },
          { tema: 'Se equivoca', zoho: 'No, si la regla está bien', claude: 'Puede: se revisa' },
          { tema: 'Mejor para', zoho: 'Avisos, asignaciones, estados', claude: 'Resúmenes, correos, análisis' },
        ],
      },
    },

    // ── Práctica con su caso (165) ──
    {
      id: 'consigna',
      bloque: 'practica',
      tipo: 'consigna',
      kicker: 'Práctica con su caso',
      titulo: 'Cinco retos, su caso y 15 minutos con quien dicta',
      minutos: 5,
      pasos: 0,
      notas: [
        'Explique la dinámica en tres frases: cada uno trabaja a su ritmo los cinco retos con el caso que trajo; los pasos y la petición de ejemplo de su área están en el celular; y al terminar cada reto lo marca como hecho.',
        'Turnos: usted va a estar 15 minutos con cada persona en su puesto. El orden sale en la pantalla y a cada uno le llega al celular "Le sigue a usted" cuando falta poco. Mientras no sea su turno, sigue con los retos. Pida que cada uno escriba en el celular en una línea qué caso trajo: así usted llega sabiendo.',
        'Quien no tenga Claude Desktop: todo menos la tarea programada sale en claude.ai; para la tarea, el reto trae un plan B con Zoho. Arme los turnos desde el presentador antes de pasar a la siguiente escena.',
      ],
      siPreguntan: [
        { p: '¿Tengo que hacer los cinco?', r: 'La meta es salir con al menos la skill de su área instalada y una tarea programada. Si su caso da para profundizar en uno, mejor uno bien hecho que cinco a medias.' },
      ],
    },
    {
      id: 'retos-a',
      bloque: 'practica',
      tipo: 'retos',
      kicker: 'Práctica · primera parte',
      titulo: 'Manos a la obra con su caso',
      minutos: 80,
      pasos: 0,
      notas: [
        'Empiece los turnos apenas pase a esta escena: en el presentador, "Empezar" en la primera persona. El cronómetro marca 15 minutos y avisa cuando se pasa. Al terminar, "Terminar y seguir" llama a la siguiente.',
        'En cada acompañamiento: primero que le muestre el caso y qué reto lleva. Ayúdele a escribir la petición con las cuatro partes, a elegir el modelo y a dejar la skill de su área funcionando con su caso real. Lo que más rinde es que salga con una cosa que use el lunes.',
        'Errores comunes que va a ver: la skill subida pero apagada; pedir con la skill pero sin adjuntar el documento; el conector de Zoho desconectado por vencimiento de la sesión; tareas programadas con instrucciones de una línea. Si ve el mismo error en varios, dígalo en voz alta para todos.',
        'Mire el avance en la pantalla: cuántos llevan cada reto. Si casi nadie pasa del reto 2 a los 40 minutos, explique a todos en dos minutos cómo subir una skill.',
      ],
      siPreguntan: [
        { p: 'No me aparece la opción de Skills.', r: 'Puede que esté desactivada en la administración del plan o que su versión de la app esté desactualizada. Mientras se revisa, copie el SKILL.md al inicio de la conversación o déjelo como instrucciones de un proyecto: el reto sale igual.' },
        { p: 'Mi tarea programada no corrió.', r: 'Revise tres cosas: que esté activa, que la instrucción diga dónde buscar (por ejemplo, "en Zoho CRM") y que las herramientas de lectura del conector no estén en "Always ask". Ejecútela una vez a mano para ver el error.' },
      ],
    },
    {
      id: 'descanso',
      bloque: 'practica',
      tipo: 'descanso',
      kicker: 'Descanso',
      titulo: 'Diez minutos',
      minutos: 10,
      pasos: 0,
      notas: [
        'Si hay un acompañamiento a la mitad, puede seguir: el turno no se detiene con el descanso. Revise las preguntas que llegaron al celular.',
        'Al volver: "Quien ya tiene la skill instalada, vaya por la tarea programada. Quien va atrasado, que no se preocupe: la meta es una cosa funcionando."',
      ],
      datos: { minutos: 10 },
    },
    {
      id: 'retos-b',
      bloque: 'practica',
      tipo: 'retos',
      kicker: 'Práctica · segunda parte',
      titulo: 'Ahora, que trabaje solo',
      minutos: 70,
      pasos: 0,
      notas: [
        'Siga con los turnos donde quedaron. En esta parte empuje hacia el reto 5: dejar una tarea programada que corra la próxima semana.',
        'Si alguien terminó todo, pídale que ayude a un compañero de su misma área o que cree una segunda skill. Los que tienen Desktop pueden explorar los plugins de su oficio en Cowork.',
        'A diez minutos del final, pida dos voluntarios de áreas distintas para mostrar su skill o su tarea en el cierre. Elija casos concretos, no los más vistosos.',
      ],
    },

    // ── Cierre (15) ──
    {
      id: 'muestra',
      bloque: 'cierre',
      tipo: 'muestra',
      kicker: 'Lo que construyeron hoy',
      titulo: 'De la teoría a algo que funciona el lunes',
      minutos: 8,
      pasos: 0,
      notas: [
        'Muestre el avance del grupo: cuántos completaron cada reto. Celebre lo del grupo, no de personas.',
        'Dos voluntarios muestran en tres minutos cada uno: qué caso trajeron, qué skill o tarea hicieron y qué les va a ahorrar. Pregunte a la sala: "¿Quién más tiene una tarea parecida?"',
        'Diga qué sigue con las skills: se van a pulir con el uso. Pida que, si una skill se equivoca durante la semana, anoten el caso: es el mejor material para mejorarla.',
      ],
    },
    {
      id: 'sigue',
      bloque: 'cierre',
      tipo: 'sigue',
      kicker: 'Lo que viene',
      titulo: 'Dos sábados más, todo el equipo',
      minutos: 4,
      pasos: 0,
      notas: [
        'Tarea para la semana: usar la skill de su área en por lo menos tres casos reales y revisar el resultado de su tarea programada cuando corra. Lo que no funcione se trae al próximo sábado.',
        'En el celular quedan las herramientas recomendadas para su área: las disponibles hoy, las que hay que verificar y las que vamos a construir. No prometa temas concretos de los próximos sábados: se ajustan con el formulario de cierre.',
      ],
      datos: { sabados: [3, 4] },
    },
    {
      id: 'cierre',
      bloque: 'cierre',
      tipo: 'cierre',
      kicker: 'Gracias',
      titulo: 'Llévese la tarjeta resumen',
      minutos: 3,
      pasos: 0,
      notas: [
        'Pida que escaneen el código para guardar la tarjeta resumen: las cuatro piezas, cuándo usar cada modelo y la plantilla para crear skills y tareas.',
        'Frase de cierre: "La skill le enseña cómo trabajamos, el conector le da los datos y la tarea lo deja trabajando solo. Lo que entrega, se revisa siempre." Responda las preguntas del celular que quedaron pendientes.',
      ],
    },
  ],
  celular: CELULAR_TALLER2,
  resumen: {
    ideas: [
      { titulo: 'Elija el modelo por tarea', texto: 'Haiku para lo simple y repetido, Sonnet para el día a día, Opus para lo largo y delicado. Ante la duda, Sonnet.' },
      { titulo: 'Skill: el procedimiento', texto: 'Un SKILL.md con nombre, descripción de cuándo usarla e instrucciones. Claude la abre solo cuando la tarea encaja.' },
      { titulo: 'Conector o MCP: el enchufe', texto: 'Le da acceso a Zoho, el correo o Canva con permisos. La escritura, en "Always ask" o bloqueada.' },
      { titulo: 'Plugin: la caja', texto: 'Trae skills, conectores y comandos juntos. Después de instalarlo, cada conector se conecta con su usuario.' },
      { titulo: 'Tarea programada: el reloj', texto: 'Corre en la nube con horario. Que entregue borradores, no que envíe ni cambie registros sola.' },
      { titulo: 'Zoho y Claude se complementan', texto: 'Zoho reacciona a eventos con reglas fijas; Claude lee, interpreta y redacta. Combínelos.' },
    ],
    instrucciones: [
      {
        titulo: 'Crear una skill con Claude',
        texto: 'Ayúdame a crear una skill para [tarea que repito cada semana]. Hazme las preguntas que necesites, una por una: cómo la hago, qué reviso, cómo debe quedar y qué nunca debe pasar. Al final dame el archivo listo para subir.',
      },
      {
        titulo: 'Tarea programada',
        texto: 'Cada [día y hora]: revisa en [Zoho CRM / la web / el correo] [qué buscar]. Entrégame [tabla o lista con columnas X, Y, Z] y [borradores de correo]. No envíes ni cambies nada. Si no hay nada nuevo, dilo.',
      },
    ],
  },
}
