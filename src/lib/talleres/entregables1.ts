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
 * del enfoque por área de Mike, con el ajuste de la encuesta de /ia
 * (2026-11-21). En cada área, una instrucción usa el conector de Zoho CRM,
 * salvo Finanzas, que trabaja en Zoho Books y Siigo Nube. Ventas sigue con
 * texto general (nadie respondió la encuesta).
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
      'Dejo la escritura en Always ask y la lectura en Needs approval: Claude me pide permiso antes de leer o cambiar algo.',
      'Distingo cuándo Claude usa el conector y cuándo usa el navegador.',
    ],
  },
]

/** Fecha de la sesión, impresa en el checklist (sábado de la capacitación 1). */
export const FECHA_SESION = 'Sábado 21 de noviembre de 2026'

/** La tarea que se pide al cierre (escena "sigue"), igual para todas las áreas. */
export const TAREA_SEMANA: string[] = [
  'Usar la instrucción de la práctica en una tarea real, ajustarla y entregarla en la academia.',
  'Anotar un caso en que la IA se haya equivocado y traerlo el próximo sábado para el repaso.',
]

/** La plantilla de cuatro partes en blanco (la misma de la tarjeta resumen). */
export const PLANTILLA_BLANCO: { parte: string; texto: string }[] = [
  { parte: 'Contexto', texto: 'Soy [cargo] en Ekosolv. [Lo que hay que saber.]' },
  { parte: 'Tarea', texto: '[Verbo + qué necesita].' },
  { parte: 'Formato', texto: '[Tabla con columnas… / correo de máximo N líneas].' },
  { parte: 'Ejemplo', texto: '[Cómo debe quedar].' },
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
  { titulo: 'Toda norma, a la fuente oficial', texto: 'Número, año, artículo y que siga vigente: SUIN-Juriscol, la autoridad o el Diario Oficial.' },
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
      pedir: 'Sé pedir el borrador de una propuesta sobre el estándar de Ekosolv a partir de una oportunidad de Zoho.',
      seguridad: 'Lo estratégico (precios negociados, contratos confidenciales) solo lo comparto si la tarea lo necesita.',
      zoho: 'Sé pedirle a Claude, conectado a Zoho, qué propuestas enviadas siguen sin respuesta.',
    },
    practicar: [
      'Pedir el borrador de una propuesta sobre el estándar de Ekosolv desde una oportunidad de Zoho.',
      'Pedirle a Claude, conectado a Zoho, las propuestas sin respuesta y un correo para retomar cada una.',
      'Preguntarle qué oportunidades del embudo se pueden cerrar este mes y por qué.',
    ],
    plantilla: {
      contexto: 'Soy gerente de Ekosolv. El cliente es una planta de luminarias que pidió gestión de RAEE.',
      tarea: 'Redacta el borrador de la propuesta con los datos de esta oportunidad.',
      formato: 'Las secciones de nuestra plantilla, en una página.',
      ejemplo: 'Pego una propuesta que ganamos.',
    },
    instrucciones: [
      { titulo: 'Propuestas sin respuesta (con el conector)', texto: 'Busca en Zoho CRM las propuestas enviadas hace más de 15 días que no han cambiado de etapa. Dame una tabla con cliente, valor, fecha de envío y última nota. No cambies nada en Zoho: solo muéstrame.' },
      { titulo: 'Correo para retomar', texto: 'Escribe tres versiones de un correo para retomar esta propuesta, enviada hace dos semanas, de máximo seis líneas. Usa solo los datos que te doy; si falta alguno, pregúntame.' },
      { titulo: 'Embudo del mes', texto: 'Te paso las oportunidades abiertas de Zoho con etapa, valor y fecha del último contacto. Dime cuáles se pueden cerrar este mes, cuáles están en riesgo y qué haría con cada una. En tabla.' },
    ],
  },
  {
    id: 'finanzas',
    nombre: 'Finanzas',
    checklist: {
      dentro: 'Sé que la IA aprendió a escribir, no a calcular: las sumas largas se hacen en Siigo Nube o en la hoja de cálculo.',
      alcances: 'Toda cifra de un comparativo o de un requerimiento la comparo contra Siigo Nube o Zoho Books.',
      pedir: 'Sé pedirle que liste los puntos de un requerimiento de la DIAN o de Hacienda, con su plazo y su soporte.',
      seguridad: 'Sé que balances y requerimientos se pegan completos en la cuenta de Ekosolv, y las incapacidades del personal, solo en cifras.',
      zoho: 'Sé que el conector de hoy es Zoho CRM: lo de Zoho Books y Siigo Nube se exporta y se adjunta.',
    },
    practicar: [
      'Listar los puntos de un requerimiento de la DIAN o de la Secretaría de Hacienda, con plazo y soporte.',
      'Pedir el comparativo de dos balances exportados de Siigo Nube, con las variaciones mayores al 10 %.',
      'Pedirle que cruce un extracto del banco con las facturas de Zoho Books.',
    ],
    plantilla: {
      contexto: 'Trabajo en Finanzas de Ekosolv. Exporté de Siigo Nube el balance de este año y el del anterior.',
      tarea: 'Explica las variaciones de las cuentas mayores al 10 %.',
      formato: 'Tabla: Cuenta, Anterior, Actual, Variación, Posible causa.',
      ejemplo: '| Cartera | 120 M | 158 M | +32 % | Facturación de diciembre |',
    },
    instrucciones: [
      { titulo: 'Requerimiento', texto: 'Lee este requerimiento de la DIAN (o de la Secretaría de Hacienda) y lista en una tabla cada punto que pide, su plazo y el soporte que lo responde. Cita la página de cada punto. No redactes la respuesta todavía.' },
      { titulo: 'Comparativo de balances', texto: 'Te paso dos balances exportados de Siigo Nube. Haz una tabla con las cuentas que variaron más del 10 %: cuenta, valor anterior, valor actual, variación y posible causa. Muestra la fórmula de cada variación para poder revisarla.' },
      { titulo: 'Conciliación', texto: 'Te paso el extracto del banco y las facturas pendientes de Zoho Books. Propón qué pago corresponde a qué factura. Lo que no cruce, déjalo aparte. No calcules totales: márcame qué sumar.' },
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
      zoho: 'Sé pedirle a Claude, conectado a Zoho, los datos de un cliente antes de revisar su expediente.',
    },
    practicar: [
      'Sacar la matriz de obligaciones de un auto real de la ANLA o de la CAR.',
      'Juntar la información de este año en la estructura del informe anual del año pasado.',
      'Pedir las vigencias de los permisos de un cliente, citando la resolución.',
    ],
    plantilla: {
      contexto: 'Soy consultor ambiental de Ekosolv. El cliente es una planta de luminarias en Funza.',
      tarea: 'Extrae todas las obligaciones del auto adjunto.',
      formato: 'Tabla: Obligación, Artículo, Plazo, Responsable.',
      ejemplo: '| Presentar certificados 2025 | Art. 1 | 30 días hábiles | Cliente |',
    },
    instrucciones: [
      { titulo: 'Matriz del auto', texto: 'Extrae del auto adjunto todas las obligaciones en una tabla: Obligación, Artículo, Plazo, Responsable. Para cada dato, indica el artículo o la página. Si no aparece, escribe "no aparece".' },
      { titulo: 'Informe anual', texto: 'Te paso el informe anual del año pasado y los Excel de este año. Arma el borrador del informe de este año con la misma estructura. Cita el archivo y la hoja de cada cifra. Si un dato no está, escribe "no aparece".' },
      { titulo: 'Cliente en Zoho (con el conector)', texto: 'Busca en Zoho CRM el cliente [nombre]: contactos, servicios contratados y últimas notas. Resúmelo en cinco líneas para preparar la revisión de su expediente. No cambies nada en Zoho.' },
    ],
  },
  {
    id: 'logistica',
    nombre: 'Logística',
    checklist: {
      dentro: 'Sé que la IA reconoce una solicitud de recolección aunque el cliente no use un formato fijo.',
      alcances: 'Los kilos y las fechas de cada certificado los cruzo con Zoho y con el soporte del gestor.',
      pedir: 'Sé pedirle que pase las solicitudes de un correo a una tabla lista para Zoho.',
      seguridad: 'Sé que los certificados con nombre y cédula del conductor se pegan completos en la cuenta de Ekosolv.',
      zoho: 'Sé pedirle a Claude, conectado a Zoho, las solicitudes abiertas de la semana.',
    },
    practicar: [
      'Pasar las solicitudes de recolección de los correos de la semana a una tabla para Zoho.',
      'Ver qué gestores no han enviado los soportes de los certificados y redactarles el recordatorio.',
      'Pedirle a Claude, conectado a Zoho, las solicitudes abiertas de la semana y cuánto llevan esperando.',
    ],
    plantilla: {
      contexto: 'Soy auxiliar de Logística en Ekosolv. Recibo por correo las solicitudes de recolección.',
      tarea: 'Saca de estos correos las solicitudes de recolección.',
      formato: 'Tabla: Cliente, Residuo, Cantidad, Dirección, Fecha pedida.',
      ejemplo: '| Planta de Ejemplo | Luminarias | 320 kg | Funza | jueves |',
    },
    instrucciones: [
      { titulo: 'Solicitudes del correo', texto: 'Te pego los correos de hoy. Saca solo las solicitudes de recolección en una tabla: Cliente, Residuo, Cantidad, Dirección, Fecha pedida. Si falta un dato, escribe "falta" y dime qué preguntarle al cliente.' },
      { titulo: 'Soportes pendientes', texto: 'Te paso los certificados del mes con su gestor y si ya llegó el soporte. Dime qué gestores tienen soportes pendientes y escribe a cada uno un recordatorio cordial de máximo cuatro líneas. Si un soporte no trae kilos o fecha, escribe "no aparece".' },
      { titulo: 'Solicitudes abiertas (con el conector)', texto: 'Busca en Zoho CRM las solicitudes de recolección abiertas de esta semana. Dame una tabla con cliente, residuo, fecha pedida y días de espera. No cambies nada en Zoho: solo muéstrame.' },
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
      'Pedirle a Claude, conectado a Zoho, el resumen de un cliente antes de llamarlo.',
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
      { titulo: 'Antes de llamar (con el conector)', texto: 'Busca en Zoho CRM el cliente [nombre]: oportunidades, propuestas enviadas y últimas notas. Resúmelo en cinco líneas para preparar la llamada. No cambies nada en Zoho.' },
      { titulo: 'Qué necesita', texto: 'El prospecto escribió esto. Dime qué tipo de residuos menciona (RAEE, RESPEL, aprovechables) y qué preguntas le haría en la primera llamada.' },
    ],
  },
  {
    id: 'mercadeo',
    nombre: 'Mercadeo / Redes',
    checklist: {
      dentro: 'Sé que, sin indicaciones, la IA suena genérica: le muestro publicaciones nuestras como guía de tono.',
      alcances: 'Toda tendencia o cifra que publique lleva una fuente y una fecha verificadas.',
      pedir: 'Sé convertir una tendencia en sostenibilidad en el texto de una pieza para Canva.',
      seguridad: 'Sé que los datos de clientes en un caso de éxito se publican solo con autorización.',
      zoho: 'Sé pedirle a Claude, conectado a Zoho, qué servicios se mueven más, para escoger temas.',
    },
    practicar: [
      'Pedir las tendencias en sostenibilidad del mes, con la fuente y la fecha de cada una.',
      'Escribir el texto de una pieza para Canva a partir de una tendencia.',
      'Dejar en un proyecto de Claude tres publicaciones nuestras como guía de tono.',
    ],
    plantilla: {
      contexto: 'Manejo las redes de Ekosolv. El público son jefes ambientales de empresas.',
      tarea: 'Convierte esta tendencia en el texto de tres piezas para Canva.',
      formato: 'Título de máximo 8 palabras y texto de máximo 40.',
      ejemplo: 'Pego tres publicaciones nuestras que funcionaron.',
    },
    instrucciones: [
      { titulo: 'Tendencias del mes', texto: 'Busca en internet las tendencias en sostenibilidad y residuos de este mes en Colombia. Dame cinco, cada una con la fuente, la fecha y una idea de publicación para Ekosolv. Si no encuentras la fuente, no la incluyas.' },
      { titulo: 'Texto para Canva', texto: 'Con esta tendencia, escribe el texto de tres piezas para Canva: título de máximo 8 palabras y texto de máximo 40. Usa el tono de las publicaciones nuestras que te paso.' },
      { titulo: 'Temas desde Zoho (con el conector)', texto: 'Busca en Zoho CRM qué servicios aparecen más en las oportunidades de este trimestre. Con eso, propón diez temas de publicación para el mes. No cambies nada en Zoho.' },
    ],
  },
]

export const entregableDe = (area: string) => ENTREGABLES_TALLER1.find((a) => a.id === area)
