/**
 * Documentación de ingeniería del proyecto: requerimientos, actores y casos de uso.
 *
 * Reglas de esta fuente de datos —las mismas del tablero en `iteraciones.ts`—:
 *
 * 1. Nada se inventa. Cada requerimiento describe algo que existe en el
 *    repositorio y `archivos` apunta a dónde vive. Si un requerimiento no se
 *    puede abrir en el código, va como `pend`, no como `ok`.
 * 2. `estado: 'ok'` solo si está implementado y verificable hoy; `'parcial'`
 *    cuando el código está pero le falta configuración, activo o verificación;
 *    `'pend'` cuando todavía no existe.
 * 3. Los conteos de la página se calculan de estos arreglos, no se escriben a
 *    mano: un requerimiento nuevo actualiza los indicadores solo.
 * 4. Los módulos son los del sistema real, no los del plan. El plan del panel
 *    (M1–M8 de docs/plan-panel-operaciones.md) es otra cosa y va referenciado
 *    donde corresponde.
 *
 * Complementos: `diagramas.ts` (BPMN, secuencia, componentes, clases, objetos)
 * y `calidad.ts` (niveles de prueba, V&V, usabilidad).
 */

export const REPO = 'https://github.com/mikerb95/eko'

export type Estado = 'ok' | 'parcial' | 'pend'

export const ESTADO_LABELS: Record<Estado, string> = {
  ok: 'Implementado',
  parcial: 'Parcial',
  pend: 'Pendiente',
}

export type Prioridad = 'alta' | 'media' | 'baja'

/* ────────────────────────────── Módulos ────────────────────────────── */

export interface Modulo {
  id: string
  nombre: string
  descripcion: string
}

export const MODULOS: Modulo[] = [
  {
    id: 'sitio',
    nombre: 'Sitio público',
    descripcion:
      'Las 14 páginas en español y sus 13 equivalentes en inglés: unidades de negocio, normativas, casos, licencias y diario.',
  },
  {
    id: 'contenido',
    nombre: 'Contenido y CMS',
    descripcion:
      'Entradas del diario y fichas de normativa, en libSQL con respaldo en JSON versionado.',
  },
  {
    id: 'recoleccion',
    nombre: 'Solicitud de recolección',
    descripcion:
      'Flujo guiado paso a paso que crea una orden RAEE con consecutivo y avisa al equipo.',
  },
  {
    id: 'captacion',
    nombre: 'Captación y contacto',
    descripcion: 'Formulario de contacto, clasificación por sector y línea de servicio.',
  },
  {
    id: 'panel',
    nombre: 'Panel de operaciones',
    descripcion:
      'Gestión de órdenes por estado, asignación, bitácora de eventos y bandeja de mensajes.',
  },
  {
    id: 'acceso',
    nombre: 'Acceso y autorización',
    descripcion: 'Sesión firmada, usuarios con contraseña derivada y cinco roles con permisos.',
  },
  {
    id: 'seguridad',
    nombre: 'Seguridad y hardening',
    descripcion:
      'Cabeceras en todas las respuestas, límite de tasa, honeypot y guardas de contenido no verificado.',
  },
  {
    id: 'docs',
    nombre: 'Documentación del proyecto',
    descripcion: 'Tablero XP del propio repositorio y esta documentación de ingeniería.',
  },
]

/* ─────────────────────── Requerimientos funcionales ─────────────────────── */

export interface RequerimientoFuncional {
  id: string
  /** id en MODULOS */
  modulo: string
  nombre: string
  descripcion: string
  prioridad: Prioridad
  estado: Estado
  /** Archivos donde se puede verificar. */
  archivos: string[]
  /** Por qué está parcial o pendiente. */
  nota?: string
}

export const RF: RequerimientoFuncional[] = [
  // ── Sitio público ──────────────────────────────────────────────────────
  {
    id: 'RF-01',
    modulo: 'sitio',
    nombre: 'Presentar las cuatro unidades de negocio',
    descripcion:
      'Cada unidad —Ekonsulting, Ekoraee, Ekopartner y Ekotrading— tiene página propia con su alcance, y aparece en el panel de navegación con su color de acento.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/ekonsulting.astro', 'src/pages/ekoraee.astro', 'src/config/nav.ts'],
  },
  {
    id: 'RF-02',
    modulo: 'sitio',
    nombre: 'Servir el sitio completo en español e inglés',
    descripcion:
      'Cada página pública tiene su equivalente bajo /en, con conmutador de idioma que lleva a la página equivalente y no a la portada.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/en/', 'src/config/nav.ts', 'src/layouts/LayoutEn.astro'],
  },
  {
    id: 'RF-03',
    modulo: 'sitio',
    nombre: 'Declarar equivalencias hreflang entre idiomas',
    descripcion:
      'Las páginas con par es↔en emiten hreflang es, en y x-default; las que existen solo en un idioma no emiten alternates.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/rutas.ts', 'src/layouts/Layout.astro'],
  },
  {
    id: 'RF-04',
    modulo: 'sitio',
    nombre: 'Publicar el marco normativo consultable',
    descripcion:
      'Fichas de normativa colombiana con código, título, alcance y etiquetas, en dos columnas ordenables desde el panel.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/normativas.astro', 'src/data/normativas.json'],
  },
  {
    id: 'RF-05',
    modulo: 'sitio',
    nombre: 'Publicar licencias y autorizaciones con trazabilidad',
    descripcion:
      'Cada licencia se muestra con entidad, número de resolución, fecha de expedición, vigencia y alcance.',
    prioridad: 'alta',
    estado: 'parcial',
    archivos: ['src/pages/licencias.astro', 'src/lib/credenciales.ts'],
    nota: 'La página y el modelo existen, pero ninguna licencia tiene `publicada: true`: faltan los PDF y los números de resolución reales.',
  },
  {
    id: 'RF-06',
    modulo: 'sitio',
    nombre: 'Contar la trayectoria y el equipo',
    descripcion: 'Página de quiénes somos con hitos desde 2013, equipo y aliados institucionales.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/quienes-somos.astro'],
  },
  {
    id: 'RF-07',
    modulo: 'sitio',
    nombre: 'Presentar casos de trabajo',
    descripcion:
      'Casos con contexto, intervención y resultado, más un agregado de cifras del conjunto.',
    prioridad: 'media',
    estado: 'parcial',
    archivos: ['src/pages/casos.astro', 'src/lib/credenciales.ts'],
    nota: 'Ningún caso tiene `verificado: true`. En producción la sección no muestra nada hasta que haya casos reales; en desarrollo se ven los placeholders con aviso.',
  },
  {
    id: 'RF-08',
    modulo: 'sitio',
    nombre: 'Publicar el análisis de oportunidades 2026–2030',
    descripcion:
      'Análisis del entorno regulatorio y político colombiano con las fuentes citadas. Existe solo en español.',
    prioridad: 'baja',
    estado: 'ok',
    archivos: ['src/pages/oportunidades2630.astro'],
  },
  {
    id: 'RF-09',
    modulo: 'sitio',
    nombre: 'Reproducir video sin coste de terceros en la carga inicial',
    descripcion:
      'El reproductor usa una fachada: se muestra el póster y solo al hacer clic se inserta el iframe de youtube-nocookie.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/components/VideoFacade.astro'],
  },
  {
    id: 'RF-10',
    modulo: 'sitio',
    nombre: 'Navegación accesible por teclado con salto al contenido',
    descripcion:
      'Menú con estado expandido anunciado, cierre con Escape, enlace de salto al contenido y foco visible.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/components/Nav.astro', 'src/styles/global.css'],
  },
  {
    id: 'RF-11',
    modulo: 'sitio',
    nombre: 'Exponer un inventario único de rutas',
    descripcion:
      'Una sola fuente lista las páginas públicas con título y descripción; de ahí salen sitemap, llms.txt y llms-full.txt.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/rutas.ts', 'src/pages/sitemap.xml.ts', 'src/pages/llms.txt.js'],
  },
  {
    id: 'RF-12',
    modulo: 'sitio',
    nombre: 'Emitir sitemap con alternates por idioma',
    descripcion:
      'El sitemap incluye las rutas de ambos idiomas y las entradas del diario, con xhtml:link hreflang.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/sitemap.xml.ts'],
  },
  {
    id: 'RF-13',
    modulo: 'sitio',
    nombre: 'Declarar robots.txt con el sitemap',
    descripcion: 'robots.txt generado, con referencia al sitemap y exclusión del panel.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/robots.txt.ts'],
  },
  {
    id: 'RF-14',
    modulo: 'sitio',
    nombre: 'Describir el sitio para agentes de IA',
    descripcion:
      'llms.txt y llms-full.txt describen las páginas reales del sitio en lugar del contenido de la plantilla original.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/llms.txt.js', 'src/pages/llms-full.txt.js'],
  },
  {
    id: 'RF-15',
    modulo: 'sitio',
    nombre: 'Centralizar dominio e identidad legal',
    descripcion:
      'URL base, razón social y NIT viven en un solo módulo, sobreescribible con PUBLIC_SITE_URL para previews.',
    prioridad: 'alta',
    estado: 'parcial',
    archivos: ['src/lib/site.ts', 'astro.config.mjs'],
    nota: 'El dominio definitivo sigue sin decidir: el valor por defecto es ekosolv.com pero el proyecto no está ligado a él.',
  },
  {
    id: 'RF-16',
    modulo: 'sitio',
    nombre: 'Emitir metadatos para compartir en redes',
    descripcion: 'Canónica, Open Graph y Twitter Card por página, con imagen por defecto.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/layouts/Layout.astro'],
  },

  // ── Contenido y CMS ────────────────────────────────────────────────────
  {
    id: 'RF-17',
    modulo: 'contenido',
    nombre: 'Listar el diario con destacado',
    descripcion:
      'Índice del diario ordenado por destacado y luego por id, con categoría, fecha y tiempo de lectura.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/blog/index.astro', 'src/lib/cms.ts'],
  },
  {
    id: 'RF-18',
    modulo: 'contenido',
    nombre: 'Renderizar una entrada por slug',
    descripcion:
      'La entrada se compone de secciones tipadas (párrafo, subtítulo, destacado, lista), no de HTML libre.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/blog/[slug].astro', 'src/lib/cms.ts'],
  },
  {
    id: 'RF-19',
    modulo: 'contenido',
    nombre: 'Crear el esquema de la base si no existe',
    descripcion:
      'Cada módulo de datos ejecuta su CREATE TABLE IF NOT EXISTS al primer uso: no hay paso de migración manual para arrancar.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/cms.ts', 'src/lib/ops.ts', 'src/lib/contactos.ts', 'src/lib/users.ts'],
  },
  {
    id: 'RF-20',
    modulo: 'contenido',
    nombre: 'Sembrar contenido inicial desde JSON',
    descripcion:
      'Si las tablas de entradas y normativas están vacías, se llenan con el JSON versionado del repositorio.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/cms.ts', 'src/data/blog-posts.json', 'src/data/normativas.json'],
  },
  {
    id: 'RF-21',
    modulo: 'contenido',
    nombre: 'Degradar a JSON si la base falla',
    descripcion:
      'Las lecturas públicas capturan el error de la base, lo registran y devuelven el JSON versionado: el sitio no se cae por la base de datos.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/cms.ts'],
  },
  {
    id: 'RF-22',
    modulo: 'contenido',
    nombre: 'Editar entradas del diario desde el panel',
    descripcion: 'Alta, edición y borrado de entradas, con secciones tipadas y control de destacado.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/admin/posts.ts', 'src/pages/admin/index.astro'],
  },
  {
    id: 'RF-23',
    modulo: 'contenido',
    nombre: 'Editar normativas desde el panel',
    descripcion: 'Alta, edición, borrado y orden (columna y posición) de las fichas de normativa.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/admin/normativas.ts'],
  },
  {
    id: 'RF-24',
    modulo: 'contenido',
    nombre: 'Impedir slugs duplicados en el diario',
    descripcion: 'La columna slug es UNIQUE: dos entradas no pueden compartir URL.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/cms.ts'],
  },

  // ── Solicitud de recolección ───────────────────────────────────────────
  {
    id: 'RF-25',
    modulo: 'recoleccion',
    nombre: 'Guiar la solicitud paso a paso',
    descripcion:
      'El formulario pregunta una cosa a la vez, con avance visible y validación por paso, en lugar de un formulario largo.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/components/TypeformFlow.astro', 'src/pages/agenda-una-recoleccion.astro'],
  },
  {
    id: 'RF-26',
    modulo: 'recoleccion',
    nombre: 'Registrar la orden con consecutivo único',
    descripcion:
      'Cada solicitud genera una orden con consecutivo propio, estado inicial `solicitada` y fecha de creación.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/ops.ts', 'src/pages/api/recolecciones.ts'],
  },
  {
    id: 'RF-27',
    modulo: 'recoleccion',
    nombre: 'Validar los campos obligatorios en el servidor',
    descripcion:
      'Nombre, apellido, correo, teléfono, dirección y ciudad son obligatorios; el correo se valida por formato. La validación no depende del navegador.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts'],
  },
  {
    id: 'RF-28',
    modulo: 'recoleccion',
    nombre: 'Recortar y acotar toda entrada de texto',
    descripcion:
      'Cada campo se convierte a texto, se recorta y se limita en longitud antes de tocar la base (mensaje, 2000 caracteres).',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts', 'src/pages/api/contacto.ts'],
  },
  {
    id: 'RF-29',
    modulo: 'recoleccion',
    nombre: 'Capturar tipo y cantidad estimada de residuo',
    descripcion:
      'La orden guarda tipo de residuo y cantidad estimada, añadidos con migración idempotente para bases ya existentes.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/ops.ts'],
  },
  {
    id: 'RF-30',
    modulo: 'recoleccion',
    nombre: 'Confirmar al solicitante con su consecutivo',
    descripcion: 'La respuesta devuelve el consecutivo para que el solicitante pueda referenciarlo.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts'],
  },
  {
    id: 'RF-31',
    modulo: 'recoleccion',
    nombre: 'No perder la solicitud si el aviso por correo falla',
    descripcion:
      'La orden se guarda antes de intentar el correo, y el envío no lanza excepciones: si falla, se registra y la solicitud sigue confirmada.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/email.ts', 'src/pages/api/recolecciones.ts'],
  },
  {
    id: 'RF-32',
    modulo: 'recoleccion',
    nombre: 'Ofrecer una salida alterna cuando el registro falla',
    descripcion:
      'Ante error del servidor, el mensaje invita a reintentar o escribir por WhatsApp en lugar de dejar al usuario sin ruta.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts'],
  },

  // ── Captación y contacto ───────────────────────────────────────────────
  {
    id: 'RF-33',
    modulo: 'captacion',
    nombre: 'Recibir mensajes de contacto',
    descripcion:
      'Formulario público que registra nombre, correo, empresa, teléfono, sector, líneas de interés y mensaje.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/contacto.astro', 'src/pages/api/contacto.ts', 'src/lib/contactos.ts'],
  },
  {
    id: 'RF-34',
    modulo: 'captacion',
    nombre: 'Clasificar el mensaje por estado',
    descripcion: 'Cada mensaje nace `nuevo` y se marca `atendido` desde el panel.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/contactos.ts', 'src/pages/api/admin/contactos.ts'],
  },
  {
    id: 'RF-35',
    modulo: 'captacion',
    nombre: 'Avisar al equipo de un mensaje nuevo',
    descripcion:
      'Notificación por correo con los datos del mensaje y reply-to del remitente, para responder desde la bandeja del equipo.',
    prioridad: 'media',
    estado: 'parcial',
    archivos: ['src/lib/email.ts'],
    nota: 'El código está probado, pero sin RESEND_API_KEY, NOTIFY_FROM y NOTIFY_EMAIL en producción el envío es un no-op silencioso.',
  },
  {
    id: 'RF-36',
    modulo: 'captacion',
    nombre: 'Registrar el origen de cada contacto',
    descripcion: 'Toda solicitud y todo mensaje guardan su `source` para poder atribuir la captación.',
    prioridad: 'baja',
    estado: 'ok',
    archivos: ['src/lib/contactos.ts', 'src/lib/ops.ts'],
  },

  // ── Panel de operaciones ───────────────────────────────────────────────
  {
    id: 'RF-37',
    modulo: 'panel',
    nombre: 'Mostrar el estado operativo al entrar',
    descripcion:
      'El panel abre con el conteo de órdenes por atender y mensajes nuevos, sin tener que buscarlos.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/admin/index.astro'],
  },
  {
    id: 'RF-38',
    modulo: 'panel',
    nombre: 'Listar órdenes filtrando por estado',
    descripcion: 'El listado acepta filtro por estado y ordena por fecha de creación descendente.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/ops.ts', 'src/pages/api/admin/recolecciones.ts'],
  },
  {
    id: 'RF-39',
    modulo: 'panel',
    nombre: 'Gobernar la orden con ocho estados',
    descripcion:
      'Solicitada, confirmada, programada, en ruta, recolectada, certificada, cerrada y cancelada, con etiqueta legible cada uno.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/ops.ts'],
  },
  {
    id: 'RF-40',
    modulo: 'panel',
    nombre: 'Registrar cada cambio de estado en bitácora',
    descripcion:
      'Cada transición guarda quién la hizo, de qué estado a cuál, nota y fecha, en una tabla de eventos aparte.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/ops.ts'],
  },
  {
    id: 'RF-41',
    modulo: 'panel',
    nombre: 'Asignar responsable y fecha de recolección',
    descripcion: 'La orden admite responsable asignado, fecha programada y notas internas.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/ops.ts', 'src/pages/api/admin/recolecciones.ts'],
  },
  {
    id: 'RF-42',
    modulo: 'panel',
    nombre: 'Contar órdenes por estado para indicadores',
    descripcion: 'Agregado por estado para alimentar el tablero del panel.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/ops.ts'],
  },
  {
    id: 'RF-43',
    modulo: 'panel',
    nombre: 'Consultar la bandeja de mensajes',
    descripcion: 'Listado de contactos con filtro por estado y cambio a atendido.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/admin/contactos.ts'],
  },
  {
    id: 'RF-44',
    modulo: 'panel',
    nombre: 'Seguir funcionando con la base caída',
    descripcion:
      'El panel captura los errores de cada consulta por separado y muestra el aviso, en lugar de fallar la página completa.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/admin/index.astro'],
  },
  {
    id: 'RF-45',
    modulo: 'panel',
    nombre: 'Excluir el panel de los buscadores',
    descripcion: 'El panel emite noindex, nofollow y queda fuera del sitemap.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/pages/admin/index.astro', 'src/pages/robots.txt.ts'],
  },
  {
    id: 'RF-46',
    modulo: 'panel',
    nombre: 'Certificado de disposición final descargable',
    descripcion:
      'El cliente debería poder descargar el certificado de su orden certificada desde un enlace propio.',
    prioridad: 'alta',
    estado: 'pend',
    archivos: ['docs/plan-panel-operaciones.md'],
    nota: 'Módulo M2 del plan del panel. Hoy el estado `certificada` existe pero no hay documento asociado.',
  },
  {
    id: 'RF-47',
    modulo: 'panel',
    nombre: 'Portal del cliente',
    descripcion: 'Acceso del cliente a sus propias órdenes y certificados, sin pasar por el equipo.',
    prioridad: 'baja',
    estado: 'pend',
    archivos: ['docs/plan-panel-operaciones.md'],
    nota: 'Módulo M8 del plan, fase posterior.',
  },
  {
    id: 'RF-48',
    modulo: 'panel',
    nombre: 'Inventario y valorización de activos',
    descripcion: 'Registro de equipos recibidos, su clasificación y su salida por venta o disposición.',
    prioridad: 'media',
    estado: 'pend',
    archivos: ['docs/plan-panel-operaciones.md'],
    nota: 'Módulo M4 del plan (Ekotrading).',
  },
  {
    id: 'RF-49',
    modulo: 'panel',
    nombre: 'Expedientes de consultoría',
    descripcion: 'Seguimiento de trámites Ekonsulting por cliente, con vencimientos y entregables.',
    prioridad: 'media',
    estado: 'pend',
    archivos: ['docs/plan-panel-operaciones.md'],
    nota: 'Módulo M5 del plan.',
  },

  // ── Acceso y autorización ──────────────────────────────────────────────
  {
    id: 'RF-50',
    modulo: 'acceso',
    nombre: 'Autenticar con usuario y contraseña',
    descripcion:
      'El acceso al panel valida contra la tabla de usuarios, solo cuentas activas, con usuario normalizado a minúsculas.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/users.ts', 'src/pages/api/admin/login.ts'],
  },
  {
    id: 'RF-51',
    modulo: 'acceso',
    nombre: 'Derivar la contraseña, nunca guardarla',
    descripcion:
      'PBKDF2-SHA256 con 120 000 iteraciones y sal aleatoria por usuario, comparación en tiempo constante.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/users.ts'],
  },
  {
    id: 'RF-52',
    modulo: 'acceso',
    nombre: 'Mantener la sesión en cookie firmada',
    descripcion:
      'Sesión de 8 horas en cookie HttpOnly, SameSite=Lax y Secure en producción, firmada con HMAC-SHA256.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/auth.ts'],
  },
  {
    id: 'RF-53',
    modulo: 'acceso',
    nombre: 'Rechazar sesiones alteradas o vencidas',
    descripcion:
      'La firma se compara en tiempo constante y la expiración se valida en cada petición; las sesiones antiguas sin rol se invalidan.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/auth.ts'],
  },
  {
    id: 'RF-54',
    modulo: 'acceso',
    nombre: 'Proteger todo el panel en un solo punto',
    descripcion:
      'El middleware exige sesión para /admin y /api/admin, excepto login; sin sesión, página redirige y API responde 401.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/middleware.ts'],
  },
  {
    id: 'RF-55',
    modulo: 'acceso',
    nombre: 'Autorizar escrituras por rol y área',
    descripcion:
      'Las lecturas las permite cualquier sesión; cada área de escritura declara qué roles la pueden ejecutar, y lo no declarado queda solo para admin.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/middleware.ts'],
  },
  {
    id: 'RF-56',
    modulo: 'acceso',
    nombre: 'Restringir el listado de usuarios a admin',
    descripcion:
      'El área de usuarios expone información sensible, así que exige rol admin incluso para leer.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/middleware.ts', 'src/pages/api/admin/users.ts'],
  },
  {
    id: 'RF-57',
    modulo: 'acceso',
    nombre: 'Administrar usuarios y roles',
    descripcion:
      'Alta, edición, activación y borrado de usuarios con cinco roles: admin, operaciones, logística, consultor y solo lectura.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/users.ts', 'src/pages/api/admin/users.ts'],
  },
  {
    id: 'RF-58',
    modulo: 'acceso',
    nombre: 'Impedir quedarse sin administrador',
    descripcion:
      'Borrar o degradar al último admin activo se rechaza con error explícito, no con un panel inaccesible.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/users.ts'],
  },
  {
    id: 'RF-59',
    modulo: 'acceso',
    nombre: 'Crear el primer administrador al arrancar',
    descripcion:
      'Si la tabla de usuarios está vacía, se crea el admin inicial desde variables de entorno; sin contraseña definida, se avisa y no se crea nada.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/users.ts'],
  },
  {
    id: 'RF-60',
    modulo: 'acceso',
    nombre: 'Cerrar sesión',
    descripcion: 'El cierre de sesión limpia la cookie con Max-Age=0.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/admin/logout.ts', 'src/lib/auth.ts'],
  },
  {
    id: 'RF-61',
    modulo: 'acceso',
    nombre: 'Exigir el secreto de sesión en producción',
    descripcion:
      'Sin AUTH_SECRET el arranque falla en producción; el valor de desarrollo solo sirve en local.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/auth.ts'],
  },
  {
    id: 'RF-62',
    modulo: 'acceso',
    nombre: 'Segundo factor para el panel',
    descripcion: 'Verificación en dos pasos para las cuentas con permiso de escritura.',
    prioridad: 'media',
    estado: 'pend',
    archivos: ['pendientes.md'],
    nota: 'No implementado. Hoy la única barrera es contraseña más límite de intentos.',
  },

  // ── Seguridad y hardening ──────────────────────────────────────────────
  {
    id: 'RF-63',
    modulo: 'seguridad',
    nombre: 'Aplicar cabeceras de seguridad a toda respuesta',
    descripcion:
      'CSP, HSTS, nosniff, X-Frame-Options, Referrer-Policy y Permissions-Policy se inyectan en el Build Output de Vercel, así que cubren también las páginas prerenderizadas.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['astro.config.mjs'],
  },
  {
    id: 'RF-64',
    modulo: 'seguridad',
    nombre: 'Restringir orígenes con CSP',
    descripcion:
      'La política permite solo lo que el sitio carga de verdad: fuentes de Google, pósters de YouTube y el iframe de youtube-nocookie; bloquea object-src y frame-ancestors.',
    prioridad: 'alta',
    estado: 'parcial',
    archivos: ['astro.config.mjs'],
    nota: "Conserva 'unsafe-inline' en script y style porque Astro emite inline sin nonce en modo estático.",
  },
  {
    id: 'RF-65',
    modulo: 'seguridad',
    nombre: 'Limitar intentos de acceso',
    descripcion:
      'Cinco intentos de login por clave cada diez minutos, con Retry-After en la respuesta.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/rateLimit.ts', 'src/pages/api/admin/login.ts'],
  },
  {
    id: 'RF-66',
    modulo: 'seguridad',
    nombre: 'Limitar el uso de los formularios públicos',
    descripcion: 'Diez solicitudes por IP cada diez minutos en recolecciones y en contacto.',
    prioridad: 'alta',
    estado: 'parcial',
    archivos: ['src/pages/api/recolecciones.ts', 'src/pages/api/contacto.ts'],
    nota: 'El contador vive en memoria de la instancia: mitiga el abuso desde una IP, pero no coordina entre instancias concurrentes.',
  },
  {
    id: 'RF-67',
    modulo: 'seguridad',
    nombre: 'Descartar bots con honeypot',
    descripcion:
      'Un campo oculto que solo un bot rellena; si viene con datos se responde éxito sin escribir nada.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts', 'src/pages/api/contacto.ts'],
  },
  {
    id: 'RF-68',
    modulo: 'seguridad',
    nombre: 'No publicar contenido sin verificar',
    descripcion:
      'Licencias, testimonios, clientes y casos no se muestran en producción hasta que alguien marca su bandera de verificación; en desarrollo se ven como placeholders con aviso.',
    prioridad: 'alta',
    estado: 'ok',
    archivos: ['src/lib/credenciales.ts'],
  },
  {
    id: 'RF-69',
    modulo: 'seguridad',
    nombre: 'Resolver la IP del cliente tras el proxy',
    descripcion:
      'La IP se toma del primer valor de x-forwarded-for, con la dirección de la conexión como respaldo.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/lib/rateLimit.ts'],
  },
  {
    id: 'RF-70',
    modulo: 'seguridad',
    nombre: 'Registro de auditoría del panel',
    descripcion:
      'Bitácora transversal de quién hizo qué en el panel, más allá de los eventos de una orden.',
    prioridad: 'media',
    estado: 'pend',
    archivos: ['docs/plan-panel-operaciones.md'],
    nota: 'Módulo M7 del plan. Hoy solo las órdenes tienen bitácora.',
  },

  // ── Documentación del proyecto ─────────────────────────────────────────
  {
    id: 'RF-71',
    modulo: 'docs',
    nombre: 'Publicar el tablero XP del propio proyecto',
    descripcion:
      'Iteraciones reconstruidas del historial de Git, con historias, Definition of Done verificable y bloqueos declarados.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/data/iteraciones.ts', 'src/components/IteracionesBoard.astro'],
  },
  {
    id: 'RF-72',
    modulo: 'docs',
    nombre: 'Publicar la documentación de ingeniería',
    descripcion:
      'Requerimientos, casos de uso, diagramas UML y plan de calidad, generados de datos tipados en el repositorio.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/data/documentacion.ts', 'src/data/diagramas.ts', 'src/data/calidad.ts'],
  },
  {
    id: 'RF-73',
    modulo: 'docs',
    nombre: 'Funcionar sin JavaScript',
    descripcion:
      'El tablero y la documentación degradan a contenido legible sin JavaScript, no a una página en blanco.',
    prioridad: 'media',
    estado: 'ok',
    archivos: ['src/components/IteracionesBoard.astro', 'src/pages/docs/index.astro'],
  },
]

/* ───────────────────── Requerimientos no funcionales ───────────────────── */

/** Categorías de calidad de ISO/IEC 25010. */
export const CATEGORIAS_ISO = [
  'Adecuación funcional',
  'Eficiencia de desempeño',
  'Compatibilidad',
  'Usabilidad',
  'Fiabilidad',
  'Seguridad',
  'Mantenibilidad',
  'Portabilidad',
] as const

export type CategoriaIso = (typeof CATEGORIAS_ISO)[number]

export interface RequerimientoNoFuncional {
  id: string
  categoria: CategoriaIso
  nombre: string
  /** Cómo se mide o se comprueba. */
  criterio: string
  estado: Estado
  archivos: string[]
  nota?: string
}

export const RNF: RequerimientoNoFuncional[] = [
  {
    id: 'RNF-01',
    categoria: 'Adecuación funcional',
    nombre: 'Contenido publicado siempre verificable',
    criterio:
      'Ninguna cifra, logo, testimonio o licencia se publica sin bandera de verificación explícita en el código.',
    estado: 'ok',
    archivos: ['src/lib/credenciales.ts'],
  },
  {
    id: 'RNF-02',
    categoria: 'Adecuación funcional',
    nombre: 'Una sola fuente por dato',
    criterio:
      'Rutas, navegación, identidad del sitio y datos del tablero tienen un módulo único; no se duplican entre páginas.',
    estado: 'ok',
    archivos: ['src/lib/rutas.ts', 'src/config/nav.ts', 'src/lib/site.ts'],
  },
  {
    id: 'RNF-03',
    categoria: 'Eficiencia de desempeño',
    nombre: 'Páginas públicas prerenderizadas',
    criterio:
      'El sitio compila en modo estático; solo los endpoints y el panel corren en servidor (`prerender = false`).',
    estado: 'ok',
    archivos: ['astro.config.mjs', 'src/pages/api/'],
  },
  {
    id: 'RNF-04',
    categoria: 'Eficiencia de desempeño',
    nombre: 'Sin coste de terceros en la carga inicial',
    criterio:
      'El video se carga solo tras la interacción; no hay analítica ni scripts de terceros embebidos.',
    estado: 'ok',
    archivos: ['src/components/VideoFacade.astro'],
  },
  {
    id: 'RNF-05',
    categoria: 'Eficiencia de desempeño',
    nombre: 'Sin dependencias de cliente pesadas',
    criterio:
      'La interacción se escribe en TypeScript sobre el DOM: no hay framework de UI en el bundle del navegador.',
    estado: 'ok',
    archivos: ['package.json'],
  },
  {
    id: 'RNF-06',
    categoria: 'Eficiencia de desempeño',
    nombre: 'Presupuesto de rendimiento medido',
    criterio: 'Core Web Vitals medidos en producción con umbral definido por página.',
    estado: 'pend',
    archivos: ['pendientes.md'],
    nota: 'No hay medición instrumentada. Nunca se ha corrido Lighthouse sobre el sitio desplegado de forma sistemática.',
  },
  {
    id: 'RNF-07',
    categoria: 'Compatibilidad',
    nombre: 'CSS moderno con degradación aceptable',
    criterio:
      'Se usan color-mix, :where y anidación; los navegadores sin soporte pierden matices de color, no estructura.',
    estado: 'ok',
    archivos: ['src/styles/global.css'],
  },
  {
    id: 'RNF-08',
    categoria: 'Compatibilidad',
    nombre: 'Interoperable con agentes de IA',
    criterio: 'llms.txt y llms-full.txt describen el sitio real desde el inventario único de rutas.',
    estado: 'ok',
    archivos: ['src/pages/llms.txt.js', 'src/pages/llms-full.txt.js'],
  },
  {
    id: 'RNF-09',
    categoria: 'Usabilidad',
    nombre: 'Operable por teclado',
    criterio:
      'Navegación, menú, formulario guiado y tablero se manejan con teclado, con foco visible y cierre por Escape.',
    estado: 'ok',
    archivos: ['src/components/Nav.astro', 'src/components/IteracionesBoard.astro'],
  },
  {
    id: 'RNF-10',
    categoria: 'Usabilidad',
    nombre: 'Semántica accesible en los componentes',
    criterio:
      'Roles y atributos ARIA en pestañas, diálogos y grupos; el diálogo mueve el foco y lo devuelve al cerrar.',
    estado: 'ok',
    archivos: ['src/components/IteracionesBoard.astro'],
  },
  {
    id: 'RNF-11',
    categoria: 'Usabilidad',
    nombre: 'Respeta la preferencia de movimiento reducido',
    criterio: 'Las transiciones y desplazamientos se anulan con prefers-reduced-motion.',
    estado: 'ok',
    archivos: ['src/styles/global.css', 'src/components/IteracionesBoard.astro'],
  },
  {
    id: 'RNF-12',
    categoria: 'Usabilidad',
    nombre: 'Legible en móvil sin muros de texto',
    criterio:
      'En pantalla angosta el detalle se traslada a hojas y acordeones en lugar de mostrarse todo a la vez.',
    estado: 'ok',
    archivos: ['src/components/IteracionesBoard.astro', 'src/pages/docs/kanban.astro'],
  },
  {
    id: 'RNF-13',
    categoria: 'Usabilidad',
    nombre: 'Conformidad WCAG 2.2 AA auditada',
    criterio: 'Auditoría de accesibilidad con herramienta automática más revisión manual.',
    estado: 'pend',
    archivos: ['pendientes.md'],
    nota: 'Hay prácticas de accesibilidad aplicadas, pero ninguna auditoría formal ejecutada.',
  },
  {
    id: 'RNF-14',
    categoria: 'Fiabilidad',
    nombre: 'El sitio sobrevive a la caída de la base',
    criterio:
      'Las lecturas públicas capturan el fallo y devuelven el JSON versionado; el visitante no ve un error.',
    estado: 'ok',
    archivos: ['src/lib/cms.ts'],
  },
  {
    id: 'RNF-15',
    categoria: 'Fiabilidad',
    nombre: 'El aviso por correo no condiciona la operación',
    criterio:
      'Ninguna función de notificación lanza excepciones; el dato queda guardado antes de intentar el envío.',
    estado: 'ok',
    archivos: ['src/lib/email.ts'],
  },
  {
    id: 'RNF-16',
    categoria: 'Fiabilidad',
    nombre: 'Esquema idempotente',
    criterio:
      'Crear tablas y añadir columnas se puede repetir sin efecto: el arranque no depende del orden de despliegues.',
    estado: 'ok',
    archivos: ['src/lib/ops.ts', 'src/lib/cms.ts'],
  },
  {
    id: 'RNF-17',
    categoria: 'Fiabilidad',
    nombre: 'Monitoreo y alerta de caídas',
    criterio: 'Chequeo periódico de disponibilidad con aviso al equipo cuando algo falla.',
    estado: 'pend',
    archivos: ['pendientes.md'],
    nota: 'No existe. Hoy una caída se detecta cuando alguien la ve.',
  },
  {
    id: 'RNF-18',
    categoria: 'Seguridad',
    nombre: 'Secretos solo por entorno',
    criterio:
      'Ninguna credencial vive en el repositorio; en producción la ausencia de AUTH_SECRET rompe el arranque en lugar de degradar silenciosamente.',
    estado: 'ok',
    archivos: ['src/lib/auth.ts', 'AUDITORIA.md'],
  },
  {
    id: 'RNF-19',
    categoria: 'Seguridad',
    nombre: 'Contraseñas irrecuperables',
    criterio: 'PBKDF2-SHA256, 120 000 iteraciones, sal por usuario, comparación en tiempo constante.',
    estado: 'ok',
    archivos: ['src/lib/users.ts'],
  },
  {
    id: 'RNF-20',
    categoria: 'Seguridad',
    nombre: 'Superficie pública mínima',
    criterio:
      'Solo dos endpoints públicos de escritura, ambos con validación en servidor, límite de tasa y honeypot.',
    estado: 'ok',
    archivos: ['src/pages/api/recolecciones.ts', 'src/pages/api/contacto.ts'],
  },
  {
    id: 'RNF-21',
    categoria: 'Seguridad',
    nombre: 'Dependencias sin vulnerabilidades conocidas',
    criterio: 'Revisión periódica de vulnerabilidades en dependencias con acción sobre los hallazgos.',
    estado: 'parcial',
    archivos: ['AUDITORIA.md'],
    nota: 'La auditoría documentó hallazgos en dependencias; la revisión es manual y puntual, no automática.',
  },
  {
    id: 'RNF-22',
    categoria: 'Mantenibilidad',
    nombre: 'Tipado estricto en todo el código propio',
    criterio: '`astro check` sobre TypeScript pasa sin errores en el árbol del proyecto.',
    estado: 'ok',
    archivos: ['tsconfig.json', 'package.json'],
  },
  {
    id: 'RNF-23',
    categoria: 'Mantenibilidad',
    nombre: 'Datos separados de la presentación',
    criterio:
      'Requerimientos, tablero, rutas y navegación son datos tipados; los componentes solo los dibujan.',
    estado: 'ok',
    archivos: ['src/data/', 'src/config/nav.ts'],
  },
  {
    id: 'RNF-24',
    categoria: 'Mantenibilidad',
    nombre: 'Decisiones explicadas donde viven',
    criterio:
      'Los módulos documentan en comentario por qué están hechos así, no qué hacen: el porqué es lo que se pierde.',
    estado: 'ok',
    archivos: ['src/lib/email.ts', 'src/lib/credenciales.ts', 'src/lib/rateLimit.ts'],
  },
  {
    id: 'RNF-25',
    categoria: 'Mantenibilidad',
    nombre: 'Suite de pruebas automatizada',
    criterio: 'Pruebas unitarias, de integración y de extremo a extremo corriendo en cada cambio.',
    estado: 'pend',
    archivos: ['package.json'],
    nota: 'No hay ni una prueba automatizada en el repositorio. Ver la sección de Testing para el plan y el estado real de verificación.',
  },
  {
    id: 'RNF-26',
    categoria: 'Portabilidad',
    nombre: 'Base de datos intercambiable por URL',
    criterio:
      'El mismo código habla con SQLite en archivo (local) o Turso remoto según DATABASE_URL, sin cambios.',
    estado: 'ok',
    archivos: ['src/lib/cms.ts', 'src/lib/ops.ts'],
  },
  {
    id: 'RNF-27',
    categoria: 'Portabilidad',
    nombre: 'Criptografía sin dependencias nativas',
    criterio:
      'Sesión y contraseñas usan WebCrypto: el mismo código corre en Node, en el runtime de Vercel y en el navegador.',
    estado: 'ok',
    archivos: ['src/lib/auth.ts', 'src/lib/users.ts'],
  },
  {
    id: 'RNF-28',
    categoria: 'Portabilidad',
    nombre: 'Dominio no acoplado al código',
    criterio: 'La URL base se sobreescribe con PUBLIC_SITE_URL sin tocar el código.',
    estado: 'ok',
    archivos: ['src/lib/site.ts'],
  },
]

/* ────────────────────────────── Actores ────────────────────────────── */

export interface Actor {
  id: string
  nombre: string
  tipo: 'primario' | 'secundario'
  descripcion: string
  /** Rol del sistema con el que se corresponde, cuando aplica. */
  rol?: string
}

export const ACTORES: Actor[] = [
  {
    id: 'visitante',
    nombre: 'Visitante',
    tipo: 'primario',
    descripcion:
      'Cualquiera que llega al sitio público: lee las unidades de negocio, el marco normativo y el diario. No se autentica.',
  },
  {
    id: 'solicitante',
    nombre: 'Solicitante',
    tipo: 'primario',
    descripcion:
      'Empresa o persona que pide una recolección de RAEE o escribe por el formulario de contacto. Se identifica con sus datos, no con una cuenta.',
  },
  {
    id: 'admin',
    nombre: 'Administrador',
    tipo: 'primario',
    descripcion:
      'Gobierna el panel completo, incluidos usuarios y roles. Es el único que puede escribir en áreas no declaradas.',
    rol: 'admin',
  },
  {
    id: 'operaciones',
    nombre: 'Operaciones',
    tipo: 'primario',
    descripcion:
      'Atiende órdenes de recolección y mensajes de contacto: confirma, programa y cierra el ciclo.',
    rol: 'operaciones',
  },
  {
    id: 'logistica',
    nombre: 'Logística',
    tipo: 'primario',
    descripcion: 'Mueve la orden en la calle: en ruta, recolectada. Escribe solo sobre recolecciones.',
    rol: 'logistica',
  },
  {
    id: 'consultor',
    nombre: 'Consultor',
    tipo: 'primario',
    descripcion:
      'Mantiene el contenido técnico —diario y normativas— y atiende los mensajes de contacto.',
    rol: 'consultor',
  },
  {
    id: 'lectura',
    nombre: 'Solo lectura',
    tipo: 'primario',
    descripcion: 'Consulta el panel sin poder escribir en ninguna área.',
    rol: 'lectura',
  },
  {
    id: 'correo',
    nombre: 'Servicio de correo',
    tipo: 'secundario',
    descripcion:
      'Resend entrega los avisos internos. Si no está configurado o falla, el sistema sigue operando.',
  },
  {
    id: 'base',
    nombre: 'Base de datos',
    tipo: 'secundario',
    descripcion:
      'Turso/libSQL guarda contenido, órdenes, contactos y usuarios. Si no responde, las lecturas públicas caen al JSON versionado.',
  },
  {
    id: 'buscador',
    nombre: 'Buscador o agente de IA',
    tipo: 'secundario',
    descripcion:
      'Rastrea el sitio y consume sitemap.xml, robots.txt y llms.txt para indexar o resumir el contenido.',
  },
]

/* ──────────────────────────── Casos de uso ──────────────────────────── */

export interface CasoUso {
  id: string
  nombre: string
  /** ids de ACTORES */
  actores: string[]
  /** id en MODULOS */
  modulo: string
  objetivo: string
  /** ids de RF que este caso realiza. */
  requerimientos: string[]
  estado: Estado
}

export const CASOS_USO: CasoUso[] = [
  {
    id: 'CU-01',
    nombre: 'Explorar las unidades de negocio y servicios',
    actores: ['visitante'],
    modulo: 'sitio',
    objetivo:
      'Entender qué hace Ekosolv y a cuál de las cuatro unidades corresponde la necesidad del visitante.',
    requerimientos: ['RF-01', 'RF-10'],
    estado: 'ok',
  },
  {
    id: 'CU-02',
    nombre: 'Cambiar el idioma del sitio',
    actores: ['visitante'],
    modulo: 'sitio',
    objetivo: 'Leer la misma página en el otro idioma sin volver a la portada.',
    requerimientos: ['RF-02', 'RF-03'],
    estado: 'ok',
  },
  {
    id: 'CU-03',
    nombre: 'Consultar el marco normativo',
    actores: ['visitante'],
    modulo: 'sitio',
    objetivo: 'Ubicar la norma colombiana que aplica a la operación del visitante.',
    requerimientos: ['RF-04'],
    estado: 'ok',
  },
  {
    id: 'CU-04',
    nombre: 'Verificar licencias y autorizaciones',
    actores: ['visitante'],
    modulo: 'sitio',
    objetivo:
      'Comprobar con qué resoluciones y ante qué entidad está habilitada la operación antes de contratar.',
    requerimientos: ['RF-05'],
    estado: 'parcial',
  },
  {
    id: 'CU-05',
    nombre: 'Leer el diario',
    actores: ['visitante'],
    modulo: 'contenido',
    objetivo: 'Consultar artículos sobre normativa, economía circular y sostenibilidad.',
    requerimientos: ['RF-17', 'RF-18'],
    estado: 'ok',
  },
  {
    id: 'CU-06',
    nombre: 'Solicitar una recolección de RAEE',
    actores: ['solicitante', 'correo', 'base'],
    modulo: 'recoleccion',
    objetivo:
      'Programar el retiro de equipos obsoletos y quedarse con un consecutivo para hacer seguimiento.',
    requerimientos: ['RF-25', 'RF-26', 'RF-27', 'RF-28', 'RF-30', 'RF-31'],
    estado: 'ok',
  },
  {
    id: 'CU-07',
    nombre: 'Enviar un mensaje de contacto',
    actores: ['solicitante', 'correo'],
    modulo: 'captacion',
    objetivo: 'Pedir un diagnóstico o hacer una consulta indicando sector y líneas de interés.',
    requerimientos: ['RF-33', 'RF-35'],
    estado: 'ok',
  },
  {
    id: 'CU-08',
    nombre: 'Indexar el sitio',
    actores: ['buscador'],
    modulo: 'sitio',
    objetivo: 'Descubrir las páginas públicas y sus equivalentes por idioma, sin entrar al panel.',
    requerimientos: ['RF-11', 'RF-12', 'RF-13', 'RF-14', 'RF-45'],
    estado: 'ok',
  },
  {
    id: 'CU-09',
    nombre: 'Iniciar sesión en el panel',
    actores: ['admin', 'operaciones', 'logistica', 'consultor', 'lectura'],
    modulo: 'acceso',
    objetivo: 'Obtener una sesión firmada de ocho horas para operar en el panel.',
    requerimientos: ['RF-50', 'RF-51', 'RF-52', 'RF-65'],
    estado: 'ok',
  },
  {
    id: 'CU-10',
    nombre: 'Cerrar sesión',
    actores: ['admin', 'operaciones', 'logistica', 'consultor', 'lectura'],
    modulo: 'acceso',
    objetivo: 'Terminar la sesión y dejar el navegador sin cookie válida.',
    requerimientos: ['RF-60'],
    estado: 'ok',
  },
  {
    id: 'CU-11',
    nombre: 'Revisar el estado operativo del día',
    actores: ['admin', 'operaciones', 'lectura'],
    modulo: 'panel',
    objetivo: 'Ver de una sola vista cuántas órdenes esperan atención y cuántos mensajes hay nuevos.',
    requerimientos: ['RF-37', 'RF-42', 'RF-44'],
    estado: 'ok',
  },
  {
    id: 'CU-12',
    nombre: 'Consultar y filtrar órdenes de recolección',
    actores: ['admin', 'operaciones', 'logistica', 'lectura'],
    modulo: 'panel',
    objetivo: 'Encontrar las órdenes de un estado concreto para trabajarlas.',
    requerimientos: ['RF-38', 'RF-39'],
    estado: 'ok',
  },
  {
    id: 'CU-13',
    nombre: 'Avanzar el estado de una orden',
    actores: ['admin', 'operaciones', 'logistica'],
    modulo: 'panel',
    objetivo: 'Mover la orden por su ciclo dejando registro de quién lo hizo y por qué.',
    requerimientos: ['RF-39', 'RF-40', 'RF-55'],
    estado: 'ok',
  },
  {
    id: 'CU-14',
    nombre: 'Asignar responsable y programar la recolección',
    actores: ['admin', 'operaciones'],
    modulo: 'panel',
    objetivo: 'Dejar la orden con dueño y fecha antes de que salga a ruta.',
    requerimientos: ['RF-41'],
    estado: 'ok',
  },
  {
    id: 'CU-15',
    nombre: 'Consultar la bitácora de una orden',
    actores: ['admin', 'operaciones', 'logistica', 'lectura'],
    modulo: 'panel',
    objetivo: 'Reconstruir qué pasó con una orden y cuándo, sin depender de la memoria de nadie.',
    requerimientos: ['RF-40'],
    estado: 'ok',
  },
  {
    id: 'CU-16',
    nombre: 'Atender un mensaje de contacto',
    actores: ['admin', 'operaciones', 'consultor'],
    modulo: 'captacion',
    objetivo: 'Marcar el mensaje como atendido para que no se trabaje dos veces.',
    requerimientos: ['RF-34', 'RF-43'],
    estado: 'ok',
  },
  {
    id: 'CU-17',
    nombre: 'Publicar o editar una entrada del diario',
    actores: ['admin', 'consultor'],
    modulo: 'contenido',
    objetivo: 'Mantener el diario al día sin desplegar el sitio.',
    requerimientos: ['RF-22', 'RF-24'],
    estado: 'ok',
  },
  {
    id: 'CU-18',
    nombre: 'Mantener las fichas de normativa',
    actores: ['admin', 'consultor'],
    modulo: 'contenido',
    objetivo: 'Actualizar el marco normativo publicado y su orden de presentación.',
    requerimientos: ['RF-23'],
    estado: 'ok',
  },
  {
    id: 'CU-19',
    nombre: 'Administrar usuarios y roles',
    actores: ['admin'],
    modulo: 'acceso',
    objetivo: 'Dar y quitar acceso al panel con el rol mínimo necesario.',
    requerimientos: ['RF-56', 'RF-57', 'RF-58'],
    estado: 'ok',
  },
  {
    id: 'CU-20',
    nombre: 'Bloquear un intento de abuso',
    actores: ['base'],
    modulo: 'seguridad',
    objetivo:
      'Frenar la fuerza bruta en el acceso y el relleno masivo de los formularios públicos sin afectar el uso legítimo.',
    requerimientos: ['RF-65', 'RF-66', 'RF-67', 'RF-69'],
    estado: 'parcial',
  },
  {
    id: 'CU-21',
    nombre: 'Consultar el tablero del proyecto',
    actores: ['visitante', 'admin'],
    modulo: 'docs',
    objetivo:
      'Revisar el avance real del proyecto por iteraciones, con su Definition of Done y sus bloqueos.',
    requerimientos: ['RF-71', 'RF-73'],
    estado: 'ok',
  },
  {
    id: 'CU-22',
    nombre: 'Consultar la documentación de ingeniería',
    actores: ['visitante', 'admin'],
    modulo: 'docs',
    objetivo:
      'Revisar requerimientos, casos de uso y diagramas del sistema, y su trazabilidad con el código.',
    requerimientos: ['RF-72'],
    estado: 'ok',
  },
]

/* ────────────────────── Casos de uso extendidos ────────────────────── */

export interface PasoFlujo {
  n: number
  actor: string
  accion: string
}

export interface FlujoAlterno {
  id: string
  nombre: string
  pasos: string[]
}

export interface CasoUsoExtendido {
  /** id en CASOS_USO */
  id: string
  nombre: string
  actorPrincipal: string
  actoresSecundarios: string[]
  disparador: string
  precondiciones: string[]
  postcondiciones: string[]
  flujoPrincipal: PasoFlujo[]
  alternos: FlujoAlterno[]
  excepciones: FlujoAlterno[]
  /** Dónde está implementado. */
  archivos: string[]
}

export const CU_EXTENDIDOS: CasoUsoExtendido[] = [
  {
    id: 'CU-06',
    nombre: 'Solicitar una recolección de RAEE',
    actorPrincipal: 'Solicitante',
    actoresSecundarios: ['Base de datos', 'Servicio de correo', 'Operaciones'],
    disparador: 'El solicitante abre /agenda-una-recoleccion y empieza el flujo guiado.',
    precondiciones: [
      'La página pública está disponible; no requiere cuenta ni sesión.',
      'La IP del solicitante no ha superado 10 solicitudes en los últimos 10 minutos.',
    ],
    postcondiciones: [
      'Existe una orden con consecutivo único y estado `solicitada`.',
      'El solicitante conoce su consecutivo.',
      'Si el correo está configurado, el equipo recibió el aviso; si no, la orden sigue registrada y visible en el panel.',
    ],
    flujoPrincipal: [
      { n: 1, actor: 'Solicitante', accion: 'Abre el flujo guiado y responde un campo por paso.' },
      {
        n: 2,
        actor: 'Navegador',
        accion: 'Valida el paso actual y solo entonces habilita el avance.',
      },
      {
        n: 3,
        actor: 'Navegador',
        accion: 'Al terminar, envía el JSON completo a POST /api/recolecciones.',
      },
      {
        n: 4,
        actor: 'Endpoint',
        accion: 'Resuelve la IP del cliente y consulta el límite de tasa.',
      },
      {
        n: 5,
        actor: 'Endpoint',
        accion: 'Descarta la petición si el campo honeypot viene relleno, respondiendo éxito.',
      },
      {
        n: 6,
        actor: 'Endpoint',
        accion:
          'Recorta y acota cada campo, y verifica los obligatorios y el formato del correo.',
      },
      {
        n: 7,
        actor: 'Módulo de operaciones',
        accion: 'Asegura el esquema, genera el consecutivo y guarda la orden con estado `solicitada`.',
      },
      {
        n: 8,
        actor: 'Módulo de correo',
        accion: 'Intenta avisar al equipo; nunca lanza excepción hacia el endpoint.',
      },
      { n: 9, actor: 'Endpoint', accion: 'Responde 200 con el consecutivo de la orden.' },
      {
        n: 10,
        actor: 'Solicitante',
        accion: 'Ve la confirmación con su consecutivo en pantalla.',
      },
    ],
    alternos: [
      {
        id: 'A1',
        nombre: 'El solicitante corrige un paso anterior',
        pasos: [
          'En el paso 2, el solicitante retrocede en el flujo.',
          'El valor previo se conserva y se puede editar.',
          'El flujo continúa en el paso 2 sin perder lo respondido.',
        ],
      },
      {
        id: 'A2',
        nombre: 'El país no se indica',
        pasos: [
          'En el paso 6, el campo país llega vacío.',
          'El endpoint asigna «Colombia» por defecto.',
          'El flujo continúa en el paso 7.',
        ],
      },
      {
        id: 'A3',
        nombre: 'El correo no está configurado',
        pasos: [
          'En el paso 8, faltan RESEND_API_KEY, NOTIFY_FROM o NOTIFY_EMAIL.',
          'El módulo registra el aviso en el log y devuelve `{ sent: false }`.',
          'El flujo continúa en el paso 9: el panel queda como fuente de verdad.',
        ],
      },
    ],
    excepciones: [
      {
        id: 'E1',
        nombre: 'Límite de tasa superado',
        pasos: [
          'En el paso 4 el contador de la IP llegó a 10.',
          'El endpoint responde 429 con Retry-After y un mensaje que ofrece WhatsApp como alternativa.',
          'No se crea ninguna orden.',
        ],
      },
      {
        id: 'E2',
        nombre: 'Cuerpo no es JSON válido',
        pasos: ['En el paso 3 el cuerpo no se puede parsear.', 'El endpoint responde 400.'],
      },
      {
        id: 'E3',
        nombre: 'Faltan campos obligatorios o el correo es inválido',
        pasos: [
          'En el paso 6 falla la validación.',
          'El endpoint responde 400 indicando la causa.',
          'No se crea ninguna orden.',
        ],
      },
      {
        id: 'E4',
        nombre: 'La base de datos no responde',
        pasos: [
          'En el paso 7 falla la escritura.',
          'El error se registra en el log del servidor.',
          'El endpoint responde 500 con un mensaje que invita a reintentar o escribir por WhatsApp.',
        ],
      },
    ],
    archivos: [
      'src/pages/agenda-una-recoleccion.astro',
      'src/components/TypeformFlow.astro',
      'src/pages/api/recolecciones.ts',
      'src/lib/ops.ts',
      'src/lib/email.ts',
      'src/lib/rateLimit.ts',
    ],
  },
  {
    id: 'CU-09',
    nombre: 'Iniciar sesión en el panel',
    actorPrincipal: 'Usuario del panel',
    actoresSecundarios: ['Base de datos'],
    disparador: 'El usuario envía el formulario de /admin/login.',
    precondiciones: [
      'El usuario existe en la tabla de usuarios y está activo.',
      'En producción, AUTH_SECRET está definido.',
    ],
    postcondiciones: [
      'El navegador tiene una cookie de sesión firmada, HttpOnly, válida 8 horas.',
      'La sesión lleva usuario, nombre y rol; el rol gobierna las escrituras posteriores.',
      'El contador de intentos de esa clave queda reiniciado.',
    ],
    flujoPrincipal: [
      { n: 1, actor: 'Usuario', accion: 'Envía usuario y contraseña a POST /api/admin/login.' },
      {
        n: 2,
        actor: 'Middleware',
        accion: 'Deja pasar la ruta de login sin exigir sesión, por estar en la lista pública.',
      },
      { n: 3, actor: 'Endpoint', accion: 'Consulta el límite de intentos para esa clave.' },
      {
        n: 4,
        actor: 'Módulo de usuarios',
        accion: 'Crea el admin inicial si la tabla está vacía y hay contraseña de entorno.',
      },
      {
        n: 5,
        actor: 'Módulo de usuarios',
        accion:
          'Busca el usuario activo, deriva la contraseña con PBKDF2 y compara en tiempo constante.',
      },
      {
        n: 6,
        actor: 'Módulo de sesión',
        accion: 'Firma el payload con HMAC-SHA256 y arma el token con expiración.',
      },
      {
        n: 7,
        actor: 'Endpoint',
        accion: 'Devuelve la cookie de sesión con Secure en producción y reinicia el contador.',
      },
      { n: 8, actor: 'Usuario', accion: 'Entra al panel con su rol aplicado.' },
    ],
    alternos: [
      {
        id: 'A1',
        nombre: 'Primer arranque del sistema',
        pasos: [
          'En el paso 4 la tabla de usuarios está vacía.',
          'Se crea el administrador inicial con las credenciales de entorno.',
          'El flujo continúa en el paso 5.',
        ],
      },
      {
        id: 'A2',
        nombre: 'Sesión anterior sin rol',
        pasos: [
          'El navegador trae una cookie de una versión previa, sin campo de rol.',
          'La verificación la considera inválida.',
          'El usuario es redirigido al login y repite el flujo desde el paso 1.',
        ],
      },
    ],
    excepciones: [
      {
        id: 'E1',
        nombre: 'Demasiados intentos',
        pasos: [
          'En el paso 3 se alcanzaron 5 intentos en 10 minutos.',
          'El endpoint responde 429 con Retry-After.',
          'No se evalúa la contraseña.',
        ],
      },
      {
        id: 'E2',
        nombre: 'Credenciales incorrectas o cuenta inactiva',
        pasos: [
          'En el paso 5 no hay usuario activo o la derivación no coincide.',
          'El endpoint responde error de autenticación sin distinguir cuál de los dos casos fue.',
          'El intento queda contado.',
        ],
      },
      {
        id: 'E3',
        nombre: 'Falta el secreto de sesión en producción',
        pasos: [
          'En el paso 6 no hay AUTH_SECRET.',
          'El módulo lanza el error de configuración en lugar de firmar con un secreto conocido.',
        ],
      },
    ],
    archivos: [
      'src/pages/admin/login.astro',
      'src/pages/api/admin/login.ts',
      'src/lib/users.ts',
      'src/lib/auth.ts',
      'src/lib/rateLimit.ts',
    ],
  },
  {
    id: 'CU-13',
    nombre: 'Avanzar el estado de una orden',
    actorPrincipal: 'Operaciones',
    actoresSecundarios: ['Base de datos', 'Middleware'],
    disparador: 'El usuario cambia el estado de una orden desde el panel.',
    precondiciones: [
      'Hay sesión válida.',
      'El rol es admin, operaciones o logística.',
      'La orden existe.',
    ],
    postcondiciones: [
      'La orden queda en el nuevo estado con su fecha de actualización.',
      'Existe un evento en la bitácora con usuario, estado origen, estado destino, nota y fecha.',
    ],
    flujoPrincipal: [
      {
        n: 1,
        actor: 'Usuario',
        accion: 'Envía el cambio a la API de recolecciones con método de escritura.',
      },
      { n: 2, actor: 'Middleware', accion: 'Verifica la cookie de sesión y su firma.' },
      {
        n: 3,
        actor: 'Middleware',
        accion:
          'Comprueba que el rol de la sesión está entre los autorizados para escribir en recolecciones.',
      },
      {
        n: 4,
        actor: 'Middleware',
        accion: 'Publica usuario y rol en el contexto de la petición y deja continuar.',
      },
      { n: 5, actor: 'Endpoint', accion: 'Valida el estado destino contra la lista de estados.' },
      {
        n: 6,
        actor: 'Módulo de operaciones',
        accion: 'Lee el estado actual, aplica el cambio y actualiza la fecha.',
      },
      {
        n: 7,
        actor: 'Módulo de operaciones',
        accion: 'Inserta el evento de bitácora con el usuario de la sesión.',
      },
      { n: 8, actor: 'Endpoint', accion: 'Devuelve la orden actualizada.' },
    ],
    alternos: [
      {
        id: 'A1',
        nombre: 'Cambio sin transición de estado',
        pasos: [
          'El usuario solo edita responsable, fecha programada o notas internas.',
          'La orden se actualiza sin registrar transición de estado.',
        ],
      },
    ],
    excepciones: [
      {
        id: 'E1',
        nombre: 'Sin sesión',
        pasos: ['En el paso 2 no hay cookie válida.', 'La API responde 401.'],
      },
      {
        id: 'E2',
        nombre: 'Rol sin permiso de escritura en el área',
        pasos: [
          'En el paso 3 el rol no está en la regla del área —por ejemplo, consultor sobre recolecciones—.',
          'La API responde 403 explicando que el rol no tiene permiso.',
        ],
      },
      {
        id: 'E3',
        nombre: 'La orden no existe',
        pasos: ['En el paso 6 no hay fila con ese id.', 'La API responde 404.'],
      },
    ],
    archivos: [
      'src/middleware.ts',
      'src/pages/api/admin/recolecciones.ts',
      'src/lib/ops.ts',
      'src/pages/admin/index.astro',
    ],
  },
  {
    id: 'CU-07',
    nombre: 'Enviar un mensaje de contacto',
    actorPrincipal: 'Solicitante',
    actoresSecundarios: ['Base de datos', 'Servicio de correo'],
    disparador: 'El solicitante envía el formulario de /contacto.',
    precondiciones: ['La IP no ha superado 10 mensajes en 10 minutos.'],
    postcondiciones: [
      'Existe un contacto con estado `nuevo` visible en la bandeja del panel.',
      'Si el correo está configurado, el equipo recibió el aviso con reply-to del remitente.',
    ],
    flujoPrincipal: [
      { n: 1, actor: 'Solicitante', accion: 'Completa nombre, correo y su consulta.' },
      { n: 2, actor: 'Navegador', accion: 'Envía el JSON a POST /api/contacto.' },
      { n: 3, actor: 'Endpoint', accion: 'Consulta el límite de tasa por IP.' },
      { n: 4, actor: 'Endpoint', accion: 'Descarta la petición si el honeypot viene relleno.' },
      {
        n: 5,
        actor: 'Endpoint',
        accion: 'Exige nombre y correo, valida el formato del correo y acota cada campo.',
      },
      { n: 6, actor: 'Módulo de contactos', accion: 'Guarda el contacto con estado `nuevo`.' },
      { n: 7, actor: 'Módulo de correo', accion: 'Intenta el aviso interno, sin lanzar excepciones.' },
      { n: 8, actor: 'Endpoint', accion: 'Responde 200.' },
    ],
    alternos: [
      {
        id: 'A1',
        nombre: 'Sector y líneas de interés vacíos',
        pasos: [
          'En el paso 5 esos campos opcionales llegan vacíos.',
          'Se guardan como cadena vacía y el flujo continúa.',
        ],
      },
    ],
    excepciones: [
      {
        id: 'E1',
        nombre: 'Límite de tasa superado',
        pasos: ['En el paso 3 se alcanzó el límite.', 'El endpoint responde 429 con Retry-After.'],
      },
      {
        id: 'E2',
        nombre: 'Falta nombre o correo, o el correo es inválido',
        pasos: ['En el paso 5 falla la validación.', 'El endpoint responde 400.'],
      },
      {
        id: 'E3',
        nombre: 'La base no responde',
        pasos: [
          'En el paso 6 falla la escritura.',
          'Se registra en el log y el endpoint responde 500 ofreciendo WhatsApp.',
        ],
      },
    ],
    archivos: ['src/pages/contacto.astro', 'src/pages/api/contacto.ts', 'src/lib/contactos.ts'],
  },
]

/* ──────────────────────────── Stack y alcance ──────────────────────────── */

export interface StackGrupo {
  area: string
  items: string[]
}

export const STACK: StackGrupo[] = [
  { area: 'Framework', items: ['Astro 7 (salida estática + adapter Vercel)', 'Tailwind CSS 4'] },
  { area: 'Datos', items: ['libSQL / Turso', 'Cliente @libsql/client', 'SQLite en archivo (local)'] },
  {
    area: 'Acceso',
    items: ['Sesión propia HMAC-SHA256 (WebCrypto)', 'PBKDF2-SHA256 120 000 iteraciones'],
  },
  { area: 'Correo', items: ['Resend (API HTTP, sin SDK)'] },
  {
    area: 'Seguridad',
    items: ['CSP y cabeceras en el Build Output', 'Límite de tasa en memoria', 'Honeypot en formularios'],
  },
  { area: 'Lenguaje', items: ['TypeScript estricto', 'astro check'] },
  { area: 'Despliegue', items: ['Vercel (Fluid Compute)', 'Dominio por definir'] },
]

export interface AlcanceItem {
  texto: string
  detalle?: string
}

export const DENTRO_ALCANCE: AlcanceItem[] = [
  {
    texto: 'Sitio público bilingüe',
    detalle: '14 páginas en español y 13 en inglés, con hreflang, sitemap y llms.txt.',
  },
  {
    texto: 'Contenido editable',
    detalle: 'Diario y fichas de normativa administrables desde el panel, con respaldo en JSON.',
  },
  {
    texto: 'Captación',
    detalle: 'Flujo guiado de recolección y formulario de contacto, con aviso interno por correo.',
  },
  {
    texto: 'Panel de operaciones (Fase 1)',
    detalle: 'Órdenes con ocho estados, asignación, bitácora de eventos y bandeja de mensajes.',
  },
  {
    texto: 'Acceso con roles',
    detalle: 'Cinco roles con autorización por área de escritura, gobernada en el middleware.',
  },
  {
    texto: 'Hardening',
    detalle: 'Cabeceras de seguridad, límite de tasa, honeypot y guardas de contenido no verificado.',
  },
  {
    texto: 'Documentación viva',
    detalle: 'Tablero XP del repositorio y esta documentación de ingeniería, como datos tipados.',
  },
]

export const FUERA_ALCANCE: AlcanceItem[] = [
  {
    texto: 'Certificados de disposición final',
    detalle: 'Módulo M2 del plan del panel: el estado existe, el documento todavía no.',
  },
  {
    texto: 'Portal del cliente',
    detalle: 'Módulo M8 del plan, fase posterior. Hoy todo pasa por el equipo.',
  },
  {
    texto: 'Inventario y trading',
    detalle: 'Módulos M4 y M5 del plan: inventario de activos y expedientes de consultoría.',
  },
  {
    texto: 'Suite de pruebas automatizada',
    detalle:
      'No hay ninguna prueba en el repositorio. La verificación es manual y por revisión, ver Testing.',
  },
  {
    texto: 'Monitoreo y alertas',
    detalle: 'Sin chequeo de disponibilidad: una caída se detecta cuando alguien la ve.',
  },
  {
    texto: 'Segundo factor de autenticación',
    detalle: 'El acceso al panel se defiende con contraseña derivada y límite de intentos.',
  },
]

/* ──────────────────────────── Derivados ──────────────────────────── */

export const contarPorEstado = <T extends { estado: Estado }>(items: T[]) => ({
  total: items.length,
  ok: items.filter((i) => i.estado === 'ok').length,
  parcial: items.filter((i) => i.estado === 'parcial').length,
  pend: items.filter((i) => i.estado === 'pend').length,
})

export const rfDeModulo = (modulo: string) => RF.filter((r) => r.modulo === modulo)

export const rnfDeCategoria = (categoria: CategoriaIso) =>
  RNF.filter((r) => r.categoria === categoria)

export const actorPorId = (id: string) => ACTORES.find((a) => a.id === id)

export const casosDeActor = (id: string) => CASOS_USO.filter((c) => c.actores.includes(id))
