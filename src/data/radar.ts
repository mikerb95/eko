/**
 * Radar regulatorio y editorial — fuente única de la página /docs/radar.
 *
 * Qué es: el registro de novedades del entorno político y normativo que se
 * detectaron, qué contenido o negocio propone cada una, y en qué estado está.
 *
 * Regla de esta tabla: `estado: 'verificado'` significa que el dato se leyó en
 * la fuente primaria (texto de la norma, boletín oficial). `'por-verificar'`
 * significa que viene de prensa y NO se puede publicar todavía. Si un dato de
 * aquí no coincide con su fuente, el que está mal es el de esta página.
 */

export const ACTUALIZADO = '30 de julio de 2026'

export const REPO = 'https://github.com/eko'

export type Estado = 'verificado' | 'por-verificar' | 'corregido'

export interface Novedad {
  code: string
  fecha: string
  titulo: string
  /** Qué se encontró, en seco. */
  hallazgo: string
  /** Qué significa para Ekosolv. */
  implicacion: string
  lineas: string[]
  estado: Estado
  fuente: { titulo: string; url: string }
}

/** Novedades del entorno, ordenadas por relevancia comercial. */
export const NOVEDADES: Novedad[] = [
  {
    code: 'ANLA',
    fecha: 'jul 2026',
    titulo: 'La ANLA no se elimina: se reforma para agilizar licencias',
    hallazgo:
      'El ministro designado de Ambiente, Fabio Arjona, descartó eliminar la ANLA y anunció plazos definidos de respuesta, requisitos diferenciados según el impacto del proyecto, más capacidad técnica e incorporación de inteligencia artificial en el análisis de expedientes.',
    implicacion:
      'Más trámites en curso y más rápidos no reducen el rigor exigido al solicitante: lo adelantan. Los expedientes mal armados se caerán antes. Es demanda directa de acompañamiento en licenciamiento e ICA.',
    lineas: ['EKONSULTING'],
    estado: 'verificado',
    fuente: {
      titulo: 'Cambio — Arjona ratifica la ANLA y promete agilizar licencias',
      url: 'https://cambiocolombia.com/medio-ambiente/articulo/2026/7/ministro-de-ambiente-designado-por-el-nuevo-gobierno-descarta-eliminar-la-anla-y-promete-agilizar-licencias',
    },
  },
  {
    code: 'CORALINA',
    fecha: 'vigente 2026',
    titulo: 'Cobertura obligatoria en el archipiélago desde 2026',
    hallazgo:
      'Artículo 14 de la Resolución 851 de 2022: a partir de 2026 los sistemas de recolección y gestión colectivos de las nuevas subcategorías de AEE de consumo masivo deben tener cobertura geográfica en la jurisdicción de CORALINA.',
    implicacion:
      'Obligación pequeña en el papel y grande en la operación: logística insular, acopio con condiciones distintas y una autoridad ambiental propia. Es el pendiente del año para los sistemas en ese supuesto.',
    lineas: ['EKORAEE', 'EKONSULTING'],
    estado: 'verificado',
    fuente: {
      titulo: 'Resolución 851 de 2022 — texto oficial, Art. 14',
      url: 'https://gestornormativo.creg.gov.co/gestor/entorno/docs/resolucion_minambienteds_0851_2022.htm',
    },
  },
  {
    code: 'CONSULTA PREVIA',
    fecha: 'jul 2026',
    titulo: 'La consulta previa pasaría del sector privado al Estado',
    hallazgo:
      'Arjona propone centralizar en el Estado la gestión de los procesos de consulta previa, hoy en manos del privado, para unificar criterios y dar seguridad jurídica.',
    implicacion:
      'Esto es un riesgo, no una oportunidad: si alguna línea de Ekosolv factura por acompañar consultas previas, cambia de contraparte o desaparece. Hay que medir la exposición antes de posicionarse públicamente.',
    lineas: ['EKONSULTING', 'EKOPARTNER'],
    estado: 'verificado',
    fuente: {
      titulo: 'Cambio — Traslado de la consulta previa al Estado',
      url: 'https://cambiocolombia.com/medio-ambiente/articulo/2026/7/ministro-de-ambiente-designado-por-el-nuevo-gobierno-descarta-eliminar-la-anla-y-promete-agilizar-licencias',
    },
  },
  {
    code: 'MINERÍA',
    fecha: 'jul 2026',
    titulo: 'El sector minero proyecta US$2.600 millones de inversión',
    hallazgo:
      'La ACM prevé inversiones por más de US$2.600 millones con el nuevo gobierno. Se anunció además emergencia energética en los primeros 90 días y prioridad a la "soberanía energética".',
    implicacion:
      'Cada proyecto nuevo necesita estudios de impacto, planes de manejo e informes de cumplimiento. Es el volumen que sostiene la tesis del boom de licenciamiento.',
    lineas: ['EKONSULTING'],
    estado: 'verificado',
    fuente: {
      titulo: 'Infobae — ACM prevé inversiones por más de US$2.600 millones',
      url: 'https://www.infobae.com/colombia/2026/07/11/mineria-espera-giro-con-de-la-espriella-acm-preve-inversiones-por-mas-de-us2600-millones/',
    },
  },
  {
    code: 'FRACKING',
    fecha: 'jul 2026',
    titulo: 'Fracking avalado en menos del 2% del territorio',
    hallazgo:
      '"El fracking no será en todos los sitios": avalado con controles estrictos en valles interandinos y Magdalena Medio, excluido de resguardos indígenas y parques nacionales. La decisión final queda en la política energética del gobierno.',
    implicacion:
      'Tema polarizado. El valor editorial está en explicar el régimen de licenciamiento y monitoreo aplicable, sin tomar partido. Requiere aprobación de gerencia.',
    lineas: ['EKONSULTING'],
    estado: 'verificado',
    fuente: {
      titulo: 'El Tiempo — "El fracking no será en todos los sitios"',
      url: 'https://www.eltiempo.com/vida/medio-ambiente/el-fracking-no-sera-en-todos-los-sitios-el-nombrado-ministro-de-ambiente-fabio-arjona-revela-como-sera-la-politica-ambiental-del-nuevo-gobierno-3568662',
    },
  },
  {
    code: 'ECONOMÍA CIRCULAR',
    fecha: 'abr 2026',
    titulo: 'Proyecto de resolución de economía circular en minería',
    hallazgo:
      'Habilitaría a proyectos mineros a reutilizar y valorizar residuos como materia prima. Con la Ley 2250 de 2022 se puede acceder a fondos de fomento por incorporar economía circular.',
    implicacion:
      'Amplía el universo de clientes más allá del RAEE clásico: titulares mineros con residuos valorizables. Antes de publicar hay que confirmar si ya se expidió o sigue en proyecto.',
    lineas: ['EKOTRADING', 'EKONSULTING'],
    estado: 'por-verificar',
    fuente: {
      titulo: 'Holland & Knight — Nuevo proyecto de resolución minera',
      url: 'https://www.hklaw.com/en/insights/publications/2026/04/se-publica-nuevo-proyecto-de-resolucion-minera',
    },
  },
  {
    code: 'AGENDA ABC',
    fecha: 'jul 2026',
    titulo: 'La agenda oficial no menciona RAEE ni posconsumo',
    hallazgo:
      'El marco declarado del nuevo gobierno es "ABC": agua, biodiversidad y comunidades, con foco en deforestación, minería ilegal y economía azul. No aparecen los residuos electrónicos ni el posconsumo.',
    implicacion:
      'Conclusión incómoda pero útil: para EKORAEE la exigencia seguirá viniendo del marco vigente y de la presión del mercado, no de nueva fiscalización estatal. El argumento comercial no es "va a haber más control", es "la norma ya está y casi nadie la cumple bien".',
    lineas: ['EKORAEE'],
    estado: 'verificado',
    fuente: {
      titulo: 'Portafolio — Agua y biodiversidad marcarán la agenda ambiental',
      url: 'https://www.portafolio.co/economia/gobierno/agua-y-biodiversidad-marcaran-la-agenda-ambiental-del-gobierno-de-de-la-espriella-dice-su-minambiente-497419',
    },
  },
]

export type EstadoBorrador = 'redactado' | 'listo' | 'espera' | 'bloqueado'

export interface Borrador {
  id: string
  titulo: string
  linea: string
  estado: EstadoBorrador
  /** Qué falta exactamente para que salga. */
  nota: string
  archivo?: string
}

/**
 * Pipeline editorial. El orden es la prioridad sugerida: primero lo que no
 * depende de nadie, al final lo que espera una decisión de negocio.
 */
export const BORRADORES: Borrador[] = [
  {
    id: 'B1',
    titulo: 'Resolución 0851 en 2026: cobertura geográfica y CORALINA',
    linea: 'EKORAEE + EKONSULTING',
    estado: 'redactado',
    nota: 'Texto completo escrito y verificado artículo por artículo. Payload listo para cargar en /admin. Espera revisión de gerencia.',
    archivo: 'docs/borradores/b1-resolucion-0851-2026.md',
  },
  {
    id: 'B2',
    titulo: 'Licenciamiento ambiental en el nuevo gobierno: qué esperar',
    linea: 'EKONSULTING',
    estado: 'listo',
    nota: 'Sin dependencias. Es el de mayor demanda inmediata y apunta a la línea más rentable.',
  },
  {
    id: 'B7',
    titulo: 'Colombia recicla solo el 20% de sus RAEE',
    linea: 'EKORAEE',
    estado: 'espera',
    nota: 'La cifra de 216.000 t proyectadas para 2026 viene de una fuente débil. Confirmar en minambiente.gov.co o publicar sin ese dato.',
  },
  {
    id: 'B5',
    titulo: 'Economía circular en minería: un mercado más allá del RAEE',
    linea: 'EKOTRADING + EKONSULTING',
    estado: 'espera',
    nota: 'Confirmar si la resolución ya se expidió o sigue en proyecto al momento de publicar.',
  },
  {
    id: 'B6',
    titulo: 'El cumplimiento se privatiza: quién audita si el Estado se reduce',
    linea: 'EKONSULTING · ESG',
    estado: 'bloqueado',
    nota: 'Verificar la exposición de Ekosolv en contratos con entidades del sector ambiental antes de opinar públicamente.',
  },
  {
    id: 'B4',
    titulo: 'Fracking en menos del 2% del territorio: lo que exige la norma',
    linea: 'EKONSULTING',
    estado: 'bloqueado',
    nota: 'Tema polarizado. Requiere aprobación explícita de gerencia sobre el tono y la conveniencia.',
  },
  {
    id: 'B3',
    titulo: 'Consulta previa pasa al Estado: impacto en su cronograma',
    linea: 'EKONSULTING · EKOPARTNER',
    estado: 'bloqueado',
    nota: 'Decisión de negocio pendiente: si Ekosolv factura por consulta previa, esto es un riesgo y no se publica hasta definirlo.',
  },
]

export interface Verificacion {
  afirmacion: string
  realidad: string
  fuente: string
}

/**
 * Registro de correcciones. Existe a propósito: la trazabilidad de los errores
 * es lo que hace confiables los datos que quedaron. Borrarlo haría que esta
 * página contara una historia más limpia que la real.
 */
export const VERIFICACIONES: Verificacion[] = [
  {
    afirmacion:
      'La Resolución 0851 de 2022 entró en vigencia el 1 de enero de 2026.',
    realidad:
      'Falso. El artículo 24 establece que rige desde el 1 de enero de 2023. El dato salió de un resumen de buscador y alcanzó a quedar escrito en el análisis interno antes de verificarse.',
    fuente: 'Res. 851/2022, Art. 24',
  },
  {
    afirmacion:
      'La Resolución 0851 derogó las Resoluciones 372 y 503 de 2009, 1738 de 2010 y 361 de 2011.',
    realidad:
      'Falso. Derogó la Resolución 1297 de 2010 —modificada por la 2246 de 2017—, la 1511 de 2010 y la 1512 de 2010. El listado anterior mezclaba normas de otro régimen.',
    fuente: 'Res. 851/2022, Art. 24',
  },
  {
    afirmacion:
      'Generación nacional de RAEE de 216.000 toneladas proyectadas para 2026.',
    realidad:
      'Sin confirmar. Aparece atribuido a estudios de MinAmbiente pero en una fuente de baja calidad. Marcado como no publicable hasta verificarlo en la fuente oficial.',
    fuente: 'Pendiente en minambiente.gov.co',
  },
]

/** Cosas del sitio que este trabajo dejó al descubierto y siguen abiertas. */
export const HALLAZGOS_TECNICOS = [
  {
    titulo: 'El CMS no tiene estado de borrador',
    detalle:
      'La tabla `posts` no tiene columna de estado, así que todo lo que entra a la base queda publicado. Por eso los borradores viven como archivos en `docs/borradores/` y no en el CMS. Sin esto no hay flujo real de revisión editorial.',
    archivo: 'src/lib/cms.ts',
  },
  {
    titulo: 'La paridad ES/EN del blog no está soportada',
    detalle:
      'La tabla `posts` no tiene columna de idioma. La versión en inglés lee un JSON estático y enlaza a los artículos en español, etiquetados "ES ·". No falta traducir: falta dónde guardar la traducción.',
    archivo: 'src/pages/en/blog/index.astro',
  },
  {
    titulo: 'Editar el JSON semilla no publica nada',
    detalle:
      '`seedIfEmpty()` solo siembra si la tabla está vacía. Agregar un post a `blog-posts.json` no lo publica en una base ya sembrada; hay que cargarlo por /admin. Invita al error y conviene documentarlo.',
    archivo: 'src/lib/cms.ts',
  },
  {
    titulo: 'El análisis estratégico es indexable por Google',
    detalle:
      '`/oportunidades2630` está registrada en `rutas.ts`, así que entra al sitemap y a llms.txt, y no lleva `noindex`. Contiene encuadre comercial interno. Si es intencional como contenido de autoridad, está bien; si no, hay que sacarla del inventario público. Decisión de gerencia.',
    archivo: 'src/lib/rutas.ts',
  },
]
