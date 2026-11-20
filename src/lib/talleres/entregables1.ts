/**
 * Entregables impresos de la capacitación 1 (Mike, 2026-11-20): dos hojas
 * carta por área que se reparten el día de la sesión.
 *
 * - Checklist: los temas que se vieron, para marcar lo que ya entiende, con un
 *   punto propio del área en cada bloque y tres cosas para practicar en la
 *   semana.
 * - Guía rápida (cheat sheet): la plantilla de cuatro partes llena con un caso
 *   del área, instrucciones listas para copiar, qué decirle cuando no sirve,
 *   los hábitos de verificación, dónde pegar y un QR al banco de recursos.
 *
 * Todo sale de lo que se dice en la capacitación (taller1.ts, ejemplos1.ts) y
 * del enfoque por área de Mike. Ventas y Mercadeo siguen pendientes de
 * iterar: sus textos son generales, como en ejemplos1.ts.
 *
 * Módulo PURO: sin base ni red.
 */

export type IdBloqueChecklist = 'dentro' | 'alcances' | 'pedir' | 'seguridad' | 'zoho'

export interface BloqueChecklist {
  id: IdBloqueChecklist
  titulo: string
  /** Puntos iguales para todas las áreas. */
  items: string[]
}

export interface EntregableArea {
  id: string
  nombre: string
  /** Un punto del área por bloque del checklist. */
  checklist: Record<IdBloqueChecklist, string>
  /** Tres tareas concretas para probar en la semana. */
  practicar: string[]
  /** La plantilla de cuatro partes llena con un caso del área. */
  plantilla: { contexto: string; tarea: string; formato: string; ejemplo: string }
  /** Instrucciones listas para copiar (se escriben de tú, a la IA). */
  instrucciones: { titulo: string; texto: string }[]
}

export const BLOQUES_CHECKLIST: BloqueChecklist[] = [
  {
    id: 'dentro',
    titulo: 'Qué es la IA por dentro',
    items: [
      'Sé que la IA predice el texto más probable, token por token: no consulta una base de datos.',
      'Sé que solo trabaja con lo que está en la conversación y sus adjuntos. Una conversación nueva empieza vacía.',
      'Sé que no conoce lo interno de Ekosolv ni lo posterior a su fecha de corte si no se lo muestro.',
    ],
  },
  {
    id: 'alcances',
    titulo: 'Alcances y límites',
    items: [
      'Sé que puede inventar normas, cifras y fechas con total seguridad.',
      'Confirmo toda norma en la fuente oficial: número, año y artículo.',
      'Comparo toda cifra, fecha y plazo con el documento original.',
    ],
  },
  {
    id: 'pedir',
    titulo: 'Cómo pedir',
    items: [
      'Escribo la instrucción con cuatro partes: contexto, tarea, formato y ejemplo.',
      'Si la respuesta no sirve, le digo qué cambiar en vez de empezar de cero.',
      'Guardo en un proyecto de Claude las instrucciones que me funcionan.',
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad y Ley 1581',
    items: [
      'Los documentos de trabajo van en la cuenta de Ekosolv, completos. En la personal, nunca.',
      'Datos de salud, solo si la tarea de verdad los necesita.',
      'Contraseñas y claves, nunca, en ninguna IA.',
    ],
  },
  {
    id: 'zoho',
    titulo: 'Conectar Zoho',
    items: [
      'Sé conectar Claude con Zoho CRM desde la cuenta de Ekosolv.',
      'Dejo bloqueada la escritura: la conexión es solo para leer.',
      'Distingo cuándo Claude usa el conector y cuándo usa el navegador.',
    ],
  },
]

/** Lo que se le dice cuando la respuesta no sirve (escena "iterar"). */
export const SI_NO_SIRVE: string[] = [
  'Esto no está en el documento: quítalo.',
  'Agrega una columna con…',
  'Más corto: máximo cinco líneas.',
  'Si un dato no aparece, escribe "no aparece".',
]

/** Los cuatro hábitos antes de usar una respuesta (escena "verificar"). */
export const HABITOS: { titulo: string; texto: string }[] = [
  { titulo: 'Toda norma, a la fuente oficial', texto: 'SUIN-Juriscol, la autoridad que la expidió o el Diario Oficial.' },
  { titulo: 'Toda cifra, contra el original', texto: 'Kilos, valores, fechas y plazos.' },
  { titulo: 'Pida de dónde sale cada dato', texto: 'El artículo, la página o la fila.' },
  { titulo: 'Desconfíe de lo demasiado perfecto', texto: 'Si suena muy seguro y muy redondo, revíselo dos veces.' },
]

/** Dónde pegar (escenas "semaforo" y "anonimizar"). */
export const DONDE_PEGAR: { nivel: 'si' | 'cuidado' | 'no'; titulo: string; texto: string }[] = [
  { nivel: 'si', titulo: 'Se pega completo', texto: 'Documentos de trabajo en la cuenta de Ekosolv: autos, certificados, correos, reportes.' },
  { nivel: 'cuidado', titulo: 'Solo lo necesario', texto: 'Datos de salud: bastan las cifras, sin nombres ni diagnósticos.' },
  { nivel: 'no', titulo: 'Nunca', texto: 'Contraseñas y claves. Y nada de trabajo en una cuenta personal.' },
]

export const ENTREGABLES_TALLER1: EntregableArea[] = [
  {
    id: 'gerencia',
    nombre: 'Gerencia General',
    checklist: {
      dentro: 'Sé que la IA no conoce los precios, los clientes ni el estilo de Ekosolv: para una propuesta, esa información se la doy yo.',
      alcances: 'Reviso cada valor y cada plazo de una propuesta contra Zoho antes de enviarla.',
      pedir: 'Sé pedir el borrador de una propuesta a partir de una oportunidad de Zoho.',
      seguridad: 'Lo estratégico (precios negociados, contratos confidenciales) solo lo comparto si la tarea lo necesita.',
      zoho: 'Sé pedirle a Claude, conectado a Zoho, qué oportunidades llevan más tiempo quietas.',
    },
    practicar: [
      'Pedir el borrador de una propuesta desde una oportunidad abierta en Zoho.',
      'Preguntarle qué oportunidades del embudo se pueden cerrar este mes y por qué.',
      'Describir un proceso repetitivo de la empresa y pedirle cómo automatizarlo.',
    ],
    plantilla: {
      contexto: 'Soy gerente de Ekosolv. El cliente es una planta de luminarias que pidió gestión de RAEE.',
      tarea: 'Redacta el borrador de la propuesta con los datos de esta oportunidad.',
      formato: 'Alcance, entregables, plazos y valor, en una página.',
      ejemplo: 'Pego una propuesta anterior que cerró bien.',
    },
    instrucciones: [
      { titulo: 'Embudo del mes', texto: 'Te paso las oportunidades abiertas de Zoho con etapa, valor y fecha del último contacto. Dime cuáles se pueden cerrar este mes, cuáles están en riesgo y qué haría con cada una. En tabla.' },
      { titulo: 'Correo de cierre', texto: 'Escribe tres versiones del correo para cerrar esta oportunidad, de máximo seis líneas. Usa solo los datos que te doy; si falta alguno, pregúntame.' },
      { titulo: 'Proceso para automatizar', texto: 'Te describo paso a paso cómo hacemos [proceso]. Dime qué pasos se pueden automatizar con Zoho o con IA y qué se pierde si se automatiza cada uno.' },
    ],
  },
  {
    id: 'finanzas',
    nombre: 'Finanzas',
    checklist: {
      dentro: 'Sé que la IA aprendió a escribir, no a calcular: las sumas largas se hacen en Siigo Nube o en la hoja de cálculo.',
      alcances: 'Toda cifra de nómina, costeo o cartera la comparo contra Siigo Nube o Zoho Books.',
      pedir: 'Sé pedirle que convierta un proceso en un procedimiento escrito para el manual.',
      seguridad: 'Sé qué datos de nómina pego completos en la cuenta de Ekosolv y cuáles, como incapacidades, solo en cifras.',
      zoho: 'Sé que Zoho Books (facturas, recaudos, cartera) y Siigo Nube (nómina, contabilidad) se consultan por separado.',
    },
    practicar: [
      'Documentar el procedimiento de la nómina o del cierre de mes para el manual.',
      'Pedirle que cruce un extracto del banco con las facturas de Zoho Books.',
      'Revisar con la IA el reporte de cartera y pedir los clientes que hay que llamar primero.',
    ],
    plantilla: {
      contexto: 'Soy analista de Finanzas en Ekosolv. Hago la nómina en Siigo Nube cada quincena.',
      tarea: 'Convierte estos pasos en un procedimiento para el manual.',
      formato: 'Pasos numerados con responsable, sistema y control de cada uno.',
      ejemplo: 'Pego un procedimiento del manual que ya está aprobado.',
    },
    instrucciones: [
      { titulo: 'Conciliación', texto: 'Te paso el extracto del banco y las facturas pendientes de Zoho Books. Propón qué pago corresponde a qué factura. Lo que no cruce, déjalo aparte. No calcules totales: márcame qué sumar.' },
      { titulo: 'Cartera', texto: 'Con este reporte de cartera, ordena los clientes por días de mora y valor. Para los cinco primeros, escribe un correo de cobro cordial de máximo cinco líneas.' },
      { titulo: 'Procedimiento', texto: 'Te dicto cómo hago [proceso]. Escríbelo como procedimiento: objetivo, alcance, pasos con responsable y sistema, y controles. Si un paso no queda claro, pregúntame.' },
    ],
  },
  {
    id: 'operaciones',
    nombre: 'Operaciones',
    checklist: {
      dentro: 'Sé que un auto de 40 páginas cabe en la conversación, pero el expediente completo con anexos no: le doy solo lo que toca la pregunta.',
      alcances: 'Las vigencias y los plazos salen del acto administrativo, nunca de la memoria de la IA.',
      pedir: 'Sé pedir la matriz de obligaciones de un auto con artículo, plazo y responsable.',
      seguridad: 'Sé que las resoluciones publicadas son documentos públicos y se pueden pegar sin problema.',
      zoho: 'Sé consultar en Zoho los clientes y proyectos asociados a un expediente.',
    },
    practicar: [
      'Sacar la matriz de obligaciones de un auto real de la ANLA o de la CAR.',
      'Pedir las vigencias de los permisos de un cliente, citando la resolución.',
      'Pedir el resumen de un cambio de norma y a qué clientes podría afectar.',
    ],
    plantilla: {
      contexto: 'Soy consultor ambiental de Ekosolv. El cliente es una planta de luminarias en Funza.',
      tarea: 'Extrae todas las obligaciones del auto adjunto.',
      formato: 'Tabla: Obligación, Artículo, Plazo, Responsable.',
      ejemplo: '| Presentar certificados 2025 | Art. 1 | 30 días hábiles | Cliente |',
    },
    instrucciones: [
      { titulo: 'Matriz del auto', texto: 'Extrae del auto adjunto todas las obligaciones en una tabla: Obligación, Artículo, Plazo, Responsable. Para cada dato, indica el artículo o la página. Si no aparece, escribe "no aparece".' },
      { titulo: 'Vigencias', texto: 'Con estas resoluciones, haz una tabla de los permisos del cliente: permiso, número, fecha, vigencia y fecha de vencimiento. Cita la resolución de cada dato. No calcules días hábiles: márcalos para revisar.' },
      { titulo: 'Cambio de norma', texto: 'Te paso la norma nueva y la anterior. Resume qué cambió, desde cuándo rige y qué tipo de cliente debe hacer algo distinto. Cita el artículo de cada cambio.' },
    ],
  },
  {
    id: 'logistica',
    nombre: 'Logística',
    checklist: {
      dentro: 'Sé que la IA reconoce una solicitud de recolección aunque el cliente no use un formato fijo.',
      alcances: 'Las fechas, kilos y direcciones de cada aviso salen de Zoho, no de la IA.',
      pedir: 'Sé pedirle que pase las solicitudes de un correo a una tabla lista para Zoho.',
      seguridad: 'Sé que los certificados con nombre y cédula del conductor se pegan completos en la cuenta de Ekosolv.',
      zoho: 'Sé pedirle a Claude, conectado a Zoho, las solicitudes abiertas de la semana.',
    },
    practicar: [
      'Pasar las solicitudes de recolección de los correos de la semana a una tabla para Zoho.',
      'Redactar el aviso al cliente de una recolección programada con los datos de Zoho.',
      'Pedir el resumen semanal de cifras: recolecciones, kilos y solicitudes pendientes.',
    ],
    plantilla: {
      contexto: 'Soy auxiliar de Logística en Ekosolv. Recibo por correo las solicitudes de recolección.',
      tarea: 'Saca de estos correos las solicitudes de recolección.',
      formato: 'Tabla: Cliente, Residuo, Cantidad, Dirección, Fecha pedida.',
      ejemplo: '| Planta de Ejemplo | Luminarias | 320 kg | Funza | jueves |',
    },
    instrucciones: [
      { titulo: 'Solicitudes del correo', texto: 'Te pego los correos de hoy. Saca solo las solicitudes de recolección en una tabla: Cliente, Residuo, Cantidad, Dirección, Fecha pedida. Si falta un dato, escribe "falta" y dime qué preguntarle al cliente.' },
      { titulo: 'Aviso al cliente', texto: 'Escribe el aviso de recolección programada con estos datos de Zoho: cliente, fecha, franja y residuo. Máximo cuatro líneas, cordial. No agregues datos que no te di.' },
      { titulo: 'Resumen de la semana', texto: 'Con este reporte de Zoho, resume la semana: recolecciones hechas, kilos por tipo de residuo y solicitudes pendientes con su antigüedad. En una tabla y tres frases.' },
    ],
  },
  {
    id: 'ventas',
    nombre: 'Ventas',
    checklist: {
      dentro: 'Sé que la IA entiende lo que pide un prospecto aunque no use las palabras del catálogo.',
      alcances: 'Reviso servicios, valores y plazos de cada cotización antes de enviarla.',
      pedir: 'Sé convertir un Brief de Zoho en el borrador de una propuesta.',
      seguridad: 'Sé que los correos de clientes se pegan solo en la cuenta de Ekosolv.',
      zoho: 'Sé consultar con Claude el historial de un cliente en Zoho antes de llamarlo.',
    },
    practicar: [
      'Convertir un Brief de Zoho en el borrador de una propuesta.',
      'Pedir tres versiones de un correo de seguimiento y escoger la mejor.',
      'Pedir qué servicios de Ekosolv corresponden a lo que describe un prospecto.',
    ],
    plantilla: {
      contexto: 'Soy asesor comercial de Ekosolv. El prospecto tiene equipos viejos y aceite usado.',
      tarea: 'Convierte este Brief en el borrador de una propuesta.',
      formato: 'Necesidad, servicios, alcance y siguiente paso, en una página.',
      ejemplo: 'Pego una propuesta anterior que el cliente aprobó.',
    },
    instrucciones: [
      { titulo: 'Del Brief a la propuesta', texto: 'Con este Brief de Zoho, redacta el borrador de la propuesta: necesidad del cliente, servicios, alcance y siguiente paso. Usa solo lo que dice el Brief; si falta algo, pregúntame.' },
      { titulo: 'Seguimiento', texto: 'Escribe tres versiones de un correo de seguimiento para este cliente, de máximo cinco líneas: una directa, una cordial y una con una pregunta abierta.' },
      { titulo: 'Qué necesita', texto: 'El prospecto escribió esto. Dime qué tipo de residuos menciona (RAEE, RESPEL, aprovechables) y qué preguntas le haría en la primera llamada.' },
    ],
  },
  {
    id: 'mercadeo',
    nombre: 'Mercadeo / Redes',
    checklist: {
      dentro: 'Sé que, sin indicaciones, la IA suena genérica: para que suene a Ekosolv le muestro la voz de la marca.',
      alcances: 'Toda norma que se cite en una publicación la confirmo en la fuente oficial.',
      pedir: 'Sé convertir una norma nueva en un artículo y tres publicaciones.',
      seguridad: 'Sé que los datos de clientes en un caso de éxito se publican solo con autorización.',
      zoho: 'Sé consultar en Zoho qué tipo de clientes y servicios conviene mostrar.',
    },
    practicar: [
      'Convertir una norma nueva en un artículo y tres publicaciones.',
      'Pedir ideas de contenido para el mes con la voz de Ekosolv.',
      'Agrupar los comentarios de redes por lo que la gente quiso decir.',
    ],
    plantilla: {
      contexto: 'Manejo las redes de Ekosolv. El público son jefes ambientales de empresas.',
      tarea: 'Convierte esta norma en tres publicaciones para LinkedIn.',
      formato: 'Máximo 600 caracteres cada una, con una pregunta al final.',
      ejemplo: 'Pego dos publicaciones que funcionaron bien.',
    },
    instrucciones: [
      { titulo: 'Norma a contenido', texto: 'Con esta norma, escribe un artículo corto para el blog y tres publicaciones para redes. Cita el artículo de cada dato. Usa el tono de los ejemplos que te paso.' },
      { titulo: 'Calendario', texto: 'Propón diez ideas de publicación para el mes sobre RAEE, RESPEL y normativa ambiental, con el formato sugerido para cada una.' },
      { titulo: 'Comentarios', texto: 'Agrupa estos comentarios por lo que la persona quiso decir: pregunta, queja, interés comercial u otro. Sugiere una respuesta corta para cada grupo.' },
    ],
  },
]

export const entregableDe = (area: string) => ENTREGABLES_TALLER1.find((a) => a.id === area)
