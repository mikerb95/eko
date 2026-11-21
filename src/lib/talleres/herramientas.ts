/**
 * Herramientas recomendadas por área para el día a día con Claude: conectores,
 * skills, MCP, extensiones y proyectos (Mike, 2026-11-21).
 *
 * Se muestran en dos lugares y salen de aquí para que no se contradigan:
 * - En el celular de la sala, en la escena "Lo que viene" (`sigue`).
 * - En el banco de recursos del área (/academia/recursos/<área>).
 *
 * Mike pidió mostrar todo, también lo que falta, aclarando que las
 * personalizadas las debemos crear nosotros:
 * - `lista`: se puede usar hoy.
 * - `verificar`: existe, pero falta confirmar que sirve con el plan o las
 *   herramientas de Ekosolv (Zoho MCP, correo).
 * - `crear`: personalizada para Ekosolv, todavía no existe (skills propias y
 *   MCP del panel).
 *
 * Módulo PURO: sin base ni red.
 */

export type EstadoHerramienta = 'lista' | 'verificar' | 'crear'
export type TipoHerramienta = 'conector' | 'mcp' | 'skill' | 'extension' | 'proyecto' | 'incluida' | 'forma'

export interface Herramienta {
  nombre: string
  tipo: TipoHerramienta
  estado: EstadoHerramienta
  /** Para qué le sirve al área, en una o dos frases. */
  para: string
}

export const TIPO_HERRAMIENTA: Record<TipoHerramienta, string> = {
  conector: 'Conector',
  mcp: 'MCP',
  skill: 'Skill',
  extension: 'Extensión',
  proyecto: 'Proyecto',
  incluida: 'Viene en Claude',
  forma: 'Forma de trabajo',
}

export const ESTADO_HERRAMIENTA: Record<EstadoHerramienta, { etiqueta: string; color: string }> = {
  lista: { etiqueta: 'Disponible hoy', color: '#179C91' },
  verificar: { etiqueta: 'Por verificar', color: '#D9A43B' },
  crear: { etiqueta: 'Por crear', color: '#124E7D' },
}

/** Aclaración que acompaña la lista donde se muestre. */
export const ACLARACION_HERRAMIENTAS =
  'Las marcadas "Por crear" son personalizadas para Ekosolv: las debemos crear, todavía no existen. Las "Por verificar" existen, pero falta confirmar que funcionan con el plan y las herramientas de Ekosolv.'

const ORDEN: EstadoHerramienta[] = ['lista', 'verificar', 'crear']

const SEGUIMIENTO_PROPUESTAS: Herramienta = {
  nombre: 'Skill de seguimiento de propuestas',
  tipo: 'skill',
  estado: 'crear',
  para: 'Busca las propuestas enviadas que llevan días sin respuesta y prepara el correo de seguimiento de cada una. El envío lo hace usted.',
}

const ZOHO_MCP_COMERCIAL: Herramienta = {
  nombre: 'Zoho MCP (WorkDrive y Books)',
  tipo: 'mcp',
  estado: 'verificar',
  para: 'Llegar también a la carpeta de cotización en WorkDrive y a la estimación en Books, no solo al CRM. Depende del plan de Zoho One.',
}

const POR_AREA: Record<string, Herramienta[]> = {
  gerencia: [
    { nombre: 'Conector Zoho CRM', tipo: 'conector', estado: 'lista', para: 'Ver cómo va cada oportunidad, los Briefs y las Quotes sin abrir Zoho. Cada cambio pide su permiso.' },
    { nombre: 'Proyecto de Gerencia', tipo: 'proyecto', estado: 'lista', para: 'Propuestas modelo, catálogo de servicios y tono de Ekosolv cargados una vez, para no repetirlos en cada conversación.' },
    { nombre: 'Skills de Word, Excel y PDF', tipo: 'incluida', estado: 'lista', para: 'Armar la propuesta en Word, el tablero en Excel o leer el PDF que mandó el cliente.' },
    ZOHO_MCP_COMERCIAL,
    SEGUIMIENTO_PROPUESTAS,
  ],
  finanzas: [
    { nombre: 'Skills de Excel y PDF', tipo: 'incluida', estado: 'lista', para: 'Comparar balances de dos periodos y leer extractos y requerimientos en PDF.' },
    { nombre: 'Proyecto de Finanzas', tipo: 'proyecto', estado: 'lista', para: 'Plantillas de respuesta, calendario tributario y procedimientos del área, siempre a la mano.' },
    { nombre: 'Claude in Chrome', tipo: 'extension', estado: 'lista', para: 'Consultar los portales de la DIAN y Hacienda, que no tienen conexión directa. Usted inicia la sesión: las claves nunca van en el chat.' },
    { nombre: 'Siigo Nube con exportaciones', tipo: 'forma', estado: 'lista', para: 'Siigo no tiene conector: exporte a Excel y trabaje con el archivo. La nómina no se conecta.' },
    { nombre: 'Zoho MCP (Books)', tipo: 'mcp', estado: 'verificar', para: 'Cartera, recaudos y facturas de Zoho Books desde el chat. Depende del plan de Zoho One.' },
    { nombre: 'Skill de comparativo de balances', tipo: 'skill', estado: 'crear', para: 'Compara dos periodos con el formato de Ekosolv y explica las variaciones que pasan del umbral que usted fije.' },
    { nombre: 'Skill de requerimientos DIAN y Hacienda', tipo: 'skill', estado: 'crear', para: 'Estructura la respuesta, lista los soportes que hay que pedir y marca el plazo.' },
  ],
  operaciones: [
    { nombre: 'Claude in Chrome', tipo: 'extension', estado: 'lista', para: 'Consultar VITAL, la ANLA y la CAR, que no tienen conexión directa.' },
    { nombre: 'Proyecto de Operaciones', tipo: 'proyecto', estado: 'lista', para: 'Normas de referencia, autos modelo y la plantilla del informe anual, cargados una vez.' },
    { nombre: 'Skills de PDF y Word', tipo: 'incluida', estado: 'lista', para: 'Leer autos y resoluciones en PDF y armar el informe en Word.' },
    { nombre: 'Conector Zoho CRM', tipo: 'conector', estado: 'lista', para: 'Ver el cliente y su línea de servicio antes de revisar un expediente.' },
    { nombre: 'Skill de revisión de autos', tipo: 'skill', estado: 'crear', para: 'Lee un auto y saca cada obligación con su plazo en días hábiles, la norma y la acción sugerida.' },
    { nombre: 'Skill del informe anual', tipo: 'skill', estado: 'crear', para: 'Estructura y lista de chequeo del informe anual de cumplimiento, para no dejar nada por fuera.' },
    { nombre: 'MCP del panel Ekosolv', tipo: 'mcp', estado: 'crear', para: 'Consultar desde el chat los expedientes, las alertas y los vencimientos del agente de cumplimiento.' },
  ],
  logistica: [
    { nombre: 'Conector Zoho CRM', tipo: 'conector', estado: 'lista', para: 'Ver cifras y solicitudes de cada cliente sin abrir Zoho. Cada cambio pide su permiso.' },
    { nombre: 'Skills de PDF y Excel', tipo: 'incluida', estado: 'lista', para: 'Leer los certificados de los gestores y llevar las cifras en Excel.' },
    { nombre: 'Proyecto de Logística', tipo: 'proyecto', estado: 'lista', para: 'Formatos de certificado, lista de gestores y respuestas tipo para clientes.' },
    { nombre: 'Correo conectado', tipo: 'conector', estado: 'verificar', para: 'Revisar el correo y ordenar las solicitudes. Falta confirmar si es Zoho Mail (con Zoho MCP) o Gmail (con su conector).' },
    { nombre: 'Zoho MCP (Cliq)', tipo: 'mcp', estado: 'verificar', para: 'Avisar al equipo por Cliq cuando llega una solicitud o un certificado. Depende del plan de Zoho One.' },
    { nombre: 'Skill de cruce de certificados', tipo: 'skill', estado: 'crear', para: 'Compara el certificado de disposición final del gestor con la recolección y señala lo que no cuadra antes de emitir el de Ekosolv.' },
  ],
  ventas: [
    { nombre: 'Conector Zoho CRM', tipo: 'conector', estado: 'lista', para: 'Consultar Briefs, prospectos y Quotes desde el chat. Cada cambio pide su permiso.' },
    { nombre: 'Proyecto de Ventas', tipo: 'proyecto', estado: 'lista', para: 'Catálogo de servicios, propuestas modelo y preguntas frecuentes de los clientes.' },
    { nombre: 'Skills de Word y PDF', tipo: 'incluida', estado: 'lista', para: 'Armar propuestas en Word y leer lo que manda el cliente.' },
    ZOHO_MCP_COMERCIAL,
    SEGUIMIENTO_PROPUESTAS,
  ],
  mercadeo: [
    { nombre: 'Conector de Canva', tipo: 'conector', estado: 'lista', para: 'Crear y ajustar piezas en Canva desde el chat.' },
    { nombre: 'Búsqueda en la web', tipo: 'incluida', estado: 'lista', para: 'Revisar tendencias en sostenibilidad con las fuentes citadas, para verificarlas antes de publicar.' },
    { nombre: 'Proyecto de Mercadeo', tipo: 'proyecto', estado: 'lista', para: 'Publicaciones propias como guía de tono, cifras reales y reglas de marca.' },
    { nombre: 'Skill de tono Ekosolv', tipo: 'skill', estado: 'crear', para: 'Escribe con la voz de la marca y solo con cifras reales de Ekosolv, sin inventar datos.' },
  ],
}

/** Herramientas de un área, ordenadas: disponibles, por verificar y por crear. */
export function herramientasDe(area: string): Herramienta[] {
  return [...(POR_AREA[area] ?? [])].sort((a, b) => ORDEN.indexOf(a.estado) - ORDEN.indexOf(b.estado))
}

/** Las mismas, agrupadas por estado (sin grupos vacíos). */
export function herramientasPorEstado(area: string): { estado: EstadoHerramienta; etiqueta: string; color: string; items: Herramienta[] }[] {
  const todas = herramientasDe(area)
  return ORDEN.map((estado) => ({ estado, ...ESTADO_HERRAMIENTA[estado], items: todas.filter((h) => h.estado === estado) })).filter((g) => g.items.length > 0)
}
