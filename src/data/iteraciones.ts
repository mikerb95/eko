/**
 * Tablero XP del propio sitio, reconstruido del historial real de Git.
 *
 * Reglas de esta fuente de datos:
 *
 * 1. Las iteraciones no se inventan: cada una corresponde a un bloque de días
 *    con actividad real en `git log`, y `commits` es el conteo exacto de ese
 *    rango (`git log --since=ghSince --until=ghUntil`). Si vuelves a contar y
 *    no coincide, el dato que está mal es el de este archivo.
 * 2. Cada historia describe algo que existe en el repositorio y se puede abrir.
 *    Los criterios de DoD apuntan a archivos concretos.
 * 3. `estado: 'pass'` solo si está hecho y verificable hoy. Lo que falta va
 *    como `'pend'`, y lo que se hizo y se rompió o se retiró, como `'fail'`.
 *    Un DoD en verde que no es cierto convierte el tablero en decoración.
 * 4. La última iteración (`pendiente`) es el backlog vivo: no tiene commits
 *    todavía y sale de `pendientes.md`, `docs/plan-competitivo-lito.md` y
 *    `docs/plan-panel-operaciones.md`.
 *
 * Al cerrar una iteración: añadir el bloque nuevo, actualizar `COMMITS_POR_MES`
 * y mover a `aceptada` lo que corresponda desde el backlog.
 */

export const REPO = 'https://github.com/mikerb95/eko'

/** Total de commits en el historial al momento de la última actualización. */
export const COMMITS_TOTAL = 423

export interface Par {
  nombre: string
  rol: string
  color: string
}

/** Parejas de programación. Iniciales como aparecen en el avatar de la tarjeta. */
export const PARES: Record<string, Par> = {
  MR: { nombre: 'Mike Restrepo', rol: 'Conductor (humano)', color: '#124E7D' },
  CL: { nombre: 'Claude', rol: 'Navegador (IA)', color: '#179C91' },
}

export interface Columna {
  id: string
  nombre: string
  color: string
}

export const COLUMNAS: Columna[] = [
  { id: 'cola', nombre: 'Cola (pendiente)', color: '#6B7580' },
  { id: 'planeada', nombre: 'Planeada', color: '#124E7D' },
  { id: 'desarrollo', nombre: 'En desarrollo', color: '#00AA9F' },
  { id: 'aceptacion', nombre: 'En aceptación', color: '#B8926F' },
  { id: 'aceptada', nombre: 'Aceptada', color: '#179C91' },
]

export type EstadoDod = 'pass' | 'fail' | 'pend'
export type TipoHistoria = 'historia' | 'bug' | 'tarea' | 'spike'
export type Valor = 'alto' | 'medio' | 'bajo'

export interface Criterio {
  texto: string
  estado: EstadoDod
}

export interface Historia {
  id: string
  titulo: string
  tipo: TipoHistoria
  valor: Valor
  /** id de la columna en COLUMNAS */
  col: string
  /** iniciales en PARES */
  par: string
  agente?: string
  fecha?: string
  tags: string[]
  dod: Criterio[]
  /** Archivos del repositorio donde vive esta historia. */
  archivos?: string[]
  /** Por qué está bloqueada o en espera, cuando aplica. */
  nota?: string
}

export interface Iteracion {
  id: string
  fase: string
  nombre: string
  rango: string
  /** Rango de fechas del historial, para el enlace a GitHub. */
  ghSince: string
  ghUntil: string
  /** Conteo exacto de commits del rango. `null` si la iteración no ha empezado. */
  commits: number | null
  resumen: string
  historias: Historia[]
}

export const ITERACIONES: Iteracion[] = [
  {
    id: 'it-0-plantilla',
    fase: 'Iteración 0 · Andamiaje',
    nombre: 'Plantilla heredada y primeras páginas estáticas',
    rango: '18–19 abr 2026',
    ghSince: '2026-04-18',
    ghUntil: '2026-04-20',
    commits: 62,
    resumen:
      'El sitio arranca desde una plantilla de Storyblok: se monta el proyecto Astro, se sustituyen los componentes acoplados al CMS de la plantilla por versiones propias y se levantan las primeras páginas estáticas (inicio, servicios, casos, blog). Todavía con contenido de demostración.',
    historias: [
      {
        id: 'EK-0-01',
        titulo: 'Como equipo, quiero un proyecto Astro que compile y despliegue para tener dónde construir el sitio',
        tipo: 'tarea',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-04-18',
        tags: ['astro', 'andamiaje', 'iteración-0'],
        archivos: ['astro.config.mjs', 'src/layouts/Layout.astro'],
        dod: [
          { texto: 'Proyecto Astro con Tailwind y adapter de Vercel compilando sin errores.', estado: 'pass' },
          { texto: 'Layout.astro centraliza head, SEO y metatags de todas las páginas.', estado: 'pass' },
          { texto: 'ViewTransitions (ClientRouter) activo para navegación sin recarga completa.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-0-02',
        titulo: 'Como equipo, quiero soltar el acoplamiento a Storyblok para no depender del CMS de la plantilla',
        tipo: 'tarea',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-04-19',
        tags: ['refactor', 'storyblok', 'iteración-0'],
        dod: [
          { texto: 'StoryblokComponent reemplazado por DynamicComponent en las secciones heredadas.', estado: 'pass' },
          { texto: 'Imports de storyblokEditable y storyblokApi retirados de los componentes.', estado: 'pass' },
          {
            texto: 'Restos de la plantilla (reportes y componentes muertos) eliminados del repositorio.',
            estado: 'pass',
          },
        ],
        nota: 'La limpieza quedó a medias en esta iteración: los reportes con autores inventados sobrevivieron hasta la iteración 3.',
      },
      {
        id: 'EK-0-03',
        titulo: 'Como visitante, quiero ver las páginas principales del sitio para entender qué hace la empresa',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-04-19',
        tags: ['contenido', 'público', 'iteración-0'],
        dod: [
          { texto: 'Páginas de inicio, servicios, casos y blog con layout responsive.', estado: 'pass' },
          { texto: 'Navegación y pie de página consistentes entre páginas.', estado: 'pass' },
          {
            texto: 'Contenido real de Ekosolv en lugar del contenido de demostración.',
            estado: 'fail',
          },
        ],
        nota: 'El contenido de esta iteración era de relleno. Se corrigió en las iteraciones 1 y 3 (ver EK-3-05).',
      },
    ],
  },
  {
    id: 'it-1-identidad-cms',
    fase: 'Iteración 1 · Identidad y CMS',
    nombre: 'Marca Ekosolv, las cuatro unidades y CMS propio',
    rango: '27–28 jun 2026',
    ghSince: '2026-06-27',
    ghUntil: '2026-06-29',
    commits: 68,
    resumen:
      'El sitio pasa de plantilla a sitio de Ekosolv: logo e identidad, una página por unidad de negocio, "Quiénes somos" con equipo e hitos, y un CMS propio sobre libSQL con panel en /admin para blog y normativas. Aparece la versión en inglés.',
    historias: [
      {
        id: 'EK-1-01',
        titulo: 'Como visitante, quiero una página por unidad de negocio para saber qué me puede resolver cada una',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-06-27',
        tags: ['unidades', 'público', 'iteración-1'],
        archivos: [
          'src/pages/ekonsulting.astro',
          'src/pages/ekoraee.astro',
          'src/pages/ekopartner.astro',
          'src/pages/ekotrading.astro',
        ],
        dod: [
          { texto: 'Ekonsulting, Ekoraee, Ekopartner y Ekotrading con página propia y entregables.', estado: 'pass' },
          { texto: 'Cada unidad enlazada desde /servicios por slug.', estado: 'pass' },
          { texto: 'Identidad de marca aplicada: logo en cabecera y pie en todas las páginas.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-1-02',
        titulo: 'Como consultor, quiero publicar artículos y normativas sin tocar código',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-06-28',
        tags: ['cms', 'admin', 'iteración-1'],
        archivos: ['src/lib/cms.ts', 'src/pages/api/admin/posts.ts', 'src/pages/api/admin/normativas.ts'],
        dod: [
          { texto: 'Cliente de CMS sobre libSQL con esquema de posts y normativas.', estado: 'pass' },
          { texto: 'API de administración con POST y DELETE para posts y normativas.', estado: 'pass' },
          { texto: 'El blog público lee del CMS en vez de rutas estáticas.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-1-03',
        titulo: 'Como visitante internacional, quiero el sitio en inglés para evaluarlo sin traductor',
        tipo: 'historia',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-06-28',
        tags: ['i18n', 'público', 'iteración-1'],
        archivos: ['src/layouts/LayoutEn.astro', 'src/pages/en/'],
        dod: [
          { texto: 'LayoutEn.astro y el árbol /en con las páginas equivalentes.', estado: 'pass' },
          { texto: 'Selector de idioma en la navegación que salta a la página equivalente.', estado: 'pass' },
          { texto: 'Paridad de contenido ES/EN auditada página por página.', estado: 'pend' },
        ],
        nota: 'La paridad sigue sin auditarse formalmente: es la historia EK-B-05 del backlog.',
      },
      {
        id: 'EK-1-04',
        titulo: 'Como visitante en celular, quiero un menú que funcione con el pulgar',
        tipo: 'historia',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-06-28',
        tags: ['móvil', 'navegación', 'iteración-1'],
        dod: [
          { texto: 'Botón de menú y panel superpuesto en pantallas pequeñas.', estado: 'pass' },
          { texto: 'Botón flotante de WhatsApp presente en todo el sitio.', estado: 'pass' },
        ],
      },
    ],
  },
  {
    id: 'it-2-operacion',
    fase: 'Iteración 2 · Operación',
    nombre: 'Órdenes de recolección, roles y endurecimiento del acceso',
    rango: '5–7 jul 2026',
    ghSince: '2026-07-05',
    ghUntil: '2026-07-08',
    commits: 55,
    resumen:
      'El sitio deja de ser un folleto: entra el primer módulo operativo. El formulario de recolección persiste órdenes, /admin gana un panel para gestionarlas, y la autenticación pasa a usuarios con roles, contraseñas con hash y rate limiting. Arranca con una auditoría de integridad que fija la deuda a pagar.',
    historias: [
      {
        id: 'EK-2-01',
        titulo: 'Como cliente, quiero solicitar una recolección desde el sitio y que quede registrada',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-05',
        tags: ['recolecciones', 'api', 'iteración-2'],
        archivos: ['src/pages/api/recolecciones.ts', 'src/lib/ops.ts'],
        dod: [
          { texto: 'POST /api/recolecciones valida la solicitud y crea la orden.', estado: 'pass' },
          { texto: 'El formulario reporta errores y confirmación al usuario, sin recargar.', estado: 'pass' },
          { texto: 'Rate limiting en el endpoint para evitar abuso del formulario público.', estado: 'pass' },
          { texto: 'Aviso por correo al equipo cuando entra una orden nueva.', estado: 'pend' },
        ],
        nota: 'El aviso por correo llegó en la iteración 5 como código, pero sigue sin activarse: ver EK-B-01.',
      },
      {
        id: 'EK-2-02',
        titulo: 'Como operaciones, quiero un panel para ver y actualizar el estado de las recolecciones',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-06',
        tags: ['admin', 'recolecciones', 'iteración-2'],
        archivos: ['src/pages/admin/index.astro', 'src/pages/api/admin/recolecciones.ts'],
        dod: [
          { texto: 'Panel de órdenes con filtros por estado en /admin.', estado: 'pass' },
          { texto: 'Cajón lateral para editar estado y datos de una orden.', estado: 'pass' },
          { texto: 'Historial de cambios de la orden en order_events.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-2-03',
        titulo: 'Como administrador, quiero usuarios con roles para que cada persona vea solo lo suyo',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-06',
        tags: ['auth', 'seguridad', 'iteración-2'],
        archivos: ['src/lib/auth.ts', 'src/lib/users.ts', 'src/middleware.ts'],
        dod: [
          { texto: 'Contraseñas con hash; se retiran las credenciales por variable de entorno.', estado: 'pass' },
          { texto: 'Roles admin, operaciones, logística y consultor con reglas de escritura por área.', estado: 'pass' },
          { texto: 'Panel de gestión de usuarios visible solo para admin, también en lectura.', estado: 'pass' },
          { texto: 'Registro de auditoría transversal (audit_log) de contenido y usuarios.', estado: 'pend' },
        ],
        nota: 'Hoy solo se audita el ciclo de vida de las órdenes. El audit_log del M7 del plan sigue pendiente: ver EK-B-04.',
      },
      {
        id: 'EK-2-04',
        titulo: 'Como responsable del sitio, quiero saber qué está roto antes de seguir construyendo',
        tipo: 'spike',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-05',
        tags: ['auditoría', 'deuda', 'iteración-2'],
        archivos: ['AUDITORIA.md', 'docs/plan-panel-operaciones.md'],
        dod: [
          { texto: 'AUDITORIA.md documenta hallazgos de seguridad e integridad con recomendaciones.', estado: 'pass' },
          { texto: 'Plan del panel de operaciones con módulos M1–M8 y modelo de datos.', estado: 'pass' },
          { texto: 'Rate limiting en el login de /admin contra fuerza bruta.', estado: 'pass' },
          { texto: 'Las 5 vulnerabilidades de dependencias reportadas quedan cerradas.', estado: 'pend' },
        ],
        nota: 'Cerrarlas exige un upgrade breaking de astro/@astrojs/vercel. Decisión abierta: ver EK-B-06.',
      },
    ],
  },
  {
    id: 'it-3-confianza',
    fase: 'Iteración 3 · Confianza',
    nombre: 'Cifras con fuente única y retirada del contenido falso',
    rango: '20–22 jul 2026',
    ghSince: '2026-07-20',
    ghUntil: '2026-07-23',
    commits: 147,
    resumen:
      'La iteración más grande, y la que cambió el criterio del proyecto: se centralizan las cifras públicas en brand.ts, se introduce credenciales.ts como guardarraíl para que nada sin autorización se publique, y se retiran clientes, testimonios y casos que afirmaban cosas que no se podían sostener.',
    historias: [
      {
        id: 'EK-3-01',
        titulo: 'Como responsable de marca, quiero que las cifras públicas salgan de un solo archivo para que no se desincronicen',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-20',
        tags: ['marca', 'cifras', 'iteración-3'],
        archivos: ['src/lib/brand.ts'],
        dod: [
          { texto: 'brand.ts concentra años de trayectoria, toneladas, aprobación y sanciones.', estado: 'pass' },
          { texto: 'yearsActive se calcula; no hay años escritos a mano en las plantillas.', estado: 'pass' },
          { texto: 'tonnesManaged localiza el separador de miles para es-CO y en-US.', estado: 'pass' },
          { texto: 'Las cifras marcadas PENDIENTE-DATO se reemplazan por los datos de 2026.', estado: 'pend' },
        ],
        nota: 'tonnesManaged sigue en 1000 con marca PENDIENTE-DATO en el código.',
      },
      {
        id: 'EK-3-02',
        titulo: 'Como responsable de marca, quiero un guardarraíl que impida publicar credenciales sin autorización',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-21',
        tags: ['credenciales', 'guardarraíl', 'iteración-3'],
        archivos: ['src/lib/credenciales.ts', 'src/pages/licencias.astro'],
        dod: [
          { texto: 'credenciales.ts decide qué se muestra según haya autorización de uso.', estado: 'pass' },
          { texto: 'Testimonios y clientes se renderizan solo si están autorizados.', estado: 'pass' },
          { texto: 'Página /licencias lista licencias con resolución, entidad y vigencia.', estado: 'pass' },
          { texto: 'Los PDF de las licencias ambientales están en public/ y enlazados.', estado: 'pend' },
        ],
        nota: 'La página existe y funciona, pero nadie ha entregado los PDF: ver EK-B-02.',
      },
      {
        id: 'EK-3-03',
        titulo: 'Como visitante, quiero ver de qué normativa se trata todo esto desde la primera pantalla',
        tipo: 'historia',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-20',
        tags: ['hero', 'normativas', 'iteración-3'],
        dod: [
          { texto: 'Radar normativo en el hero con el marco vigente en Colombia.', estado: 'pass' },
          { texto: 'Tira de estadísticas del hero alimentada desde brand.ts.', estado: 'pass' },
          { texto: 'Diseño responsive del bloque en pantallas pequeñas.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-3-04',
        titulo: 'Como equipo, quiero la navegación y el pie definidos una sola vez para que no se desalineen',
        tipo: 'tarea',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-21',
        tags: ['refactor', 'navegación', 'iteración-3'],
        archivos: ['src/config/nav.ts', 'src/components/Nav.astro', 'src/components/SiteFooter.astro'],
        dod: [
          { texto: 'nav.ts es la fuente única de la navegación en ambos idiomas.', estado: 'pass' },
          { texto: 'SiteFooter.astro reemplaza el pie duplicado en todas las páginas.', estado: 'pass' },
          { texto: 'Navegación por teclado y ResizeObserver en lugar de listener de resize.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-3-05',
        titulo: 'Como responsable del sitio, quiero que no quede ninguna afirmación que no podamos sostener',
        tipo: 'bug',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-22',
        tags: ['contenido', 'honestidad', 'iteración-3'],
        archivos: ['src/pages/casos.astro'],
        dod: [
          { texto: 'Sección "Clientes" con logos sin autorización retirada del sitio.', estado: 'pass' },
          { texto: 'Afirmaciones falsas de /casos corregidas y títulos ajustados a lo verificable.', estado: 'pass' },
          { texto: 'Reportes heredados de la plantilla, con autores inventados, eliminados.', estado: 'pass' },
          { texto: 'Logos y testimonios reales, con autorización, en su lugar.', estado: 'pend' },
        ],
        nota: 'Se retiró lo falso; reponerlo con material autorizado sigue pendiente (EK-B-02, EK-B-03).',
      },
      {
        id: 'EK-3-06',
        titulo: 'Como visitante, quiero ver el video corporativo sin que la página se vuelva lenta',
        tipo: 'historia',
        valor: 'bajo',
        col: 'aceptacion',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-22',
        tags: ['video', 'rendimiento', 'iteración-3'],
        archivos: ['src/components/VideoFacade.astro'],
        dod: [
          { texto: 'VideoFacade carga el reproductor solo al hacer clic, con póster propio.', estado: 'pass' },
          { texto: 'El iframe usa youtube-nocookie y está permitido en la CSP.', estado: 'pass' },
          { texto: 'Secciones de video en servicios y Ekonsulting, en español e inglés.', estado: 'pass' },
          { texto: 'Subtítulos y transcripción del video publicados.', estado: 'pend' },
        ],
        nota: 'Requieren el archivo de video, que aún no se entrega (Fase 4 del plan competitivo).',
      },
    ],
  },
  {
    id: 'it-4-seo-contactos',
    fase: 'Iteración 4 · SEO y contactos',
    nombre: 'Cabeceras de seguridad, indexación y módulo de contactos',
    rango: '24 jul 2026',
    ghSince: '2026-07-24',
    ghUntil: '2026-07-25',
    commits: 59,
    resumen:
      'Un solo día intenso de plomería: cabeceras de seguridad inyectadas en el Build Output de Vercel, canónicas, Open Graph, hreflang, robots.txt y sitemap generados desde el inventario de rutas, más el segundo módulo operativo —contactos— y una pasada de accesibilidad a los formularios.',
    historias: [
      {
        id: 'EK-4-01',
        titulo: 'Como responsable del sitio, quiero cabeceras de seguridad en todas las respuestas',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-24',
        tags: ['seguridad', 'csp', 'iteración-4'],
        archivos: ['astro.config.mjs'],
        dod: [
          { texto: 'CSP, HSTS, nosniff, X-Frame-Options, Referrer-Policy y Permissions-Policy activas.', estado: 'pass' },
          {
            texto: 'Se inyectan en el config.json del Build Output, porque vercel.json se ignora con este adapter.',
            estado: 'pass',
          },
          { texto: 'La CSP permite exactamente lo que el sitio carga: fuentes, póster e iframe de YouTube.', estado: 'pass' },
          { texto: "Eliminar 'unsafe-inline' de script-src y style-src.", estado: 'pend' },
        ],
        nota: 'Astro emite inline sin nonce en modo estático; el XSS está mitigado aparte por escape en el panel.',
      },
      {
        id: 'EK-4-02',
        titulo: 'Como responsable de marketing, quiero que el sitio se indexe y se comparta bien',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-24',
        tags: ['seo', 'i18n', 'iteración-4'],
        archivos: [
          'src/lib/rutas.ts',
          'src/pages/sitemap.xml.ts',
          'src/pages/robots.txt.ts',
          'src/pages/llms.txt.js',
        ],
        dod: [
          { texto: 'rutas.ts es el inventario único de páginas públicas en ambos idiomas.', estado: 'pass' },
          { texto: 'sitemap.xml y robots.txt se generan desde ese inventario.', estado: 'pass' },
          { texto: 'Canónica, Open Graph, Twitter card y hreflang en cada página vía Layout.', estado: 'pass' },
          { texto: 'llms.txt y llms-full.txt anuncian páginas reales, no las de la plantilla.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-4-03',
        titulo: 'Como comercial, quiero que los mensajes del formulario de contacto lleguen a un panel',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-24',
        tags: ['contactos', 'admin', 'iteración-4'],
        archivos: ['src/pages/api/contacto.ts', 'src/pages/api/admin/contactos.ts', 'src/lib/contactos.ts'],
        dod: [
          { texto: 'POST /api/contacto persiste el mensaje con rate limiting.', estado: 'pass' },
          { texto: 'Pestaña de contactos en /admin con filtros y contador de nuevos.', estado: 'pass' },
          { texto: 'Cambio de estado del contacto desde el panel.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-4-04',
        titulo: 'Como persona que usa teclado o lector de pantalla, quiero poder completar los formularios',
        tipo: 'historia',
        valor: 'medio',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-24',
        tags: ['accesibilidad', 'formularios', 'iteración-4'],
        dod: [
          { texto: 'Todas las etiquetas con for y todos los campos con id correspondiente.', estado: 'pass' },
          { texto: 'Enlace de salto al contenido y main enfocable.', estado: 'pass' },
          { texto: 'aria-pressed en los chips de selección múltiple.', estado: 'pass' },
          { texto: 'Auditoría de accesibilidad con herramienta externa sobre el sitio completo.', estado: 'pend' },
        ],
      },
    ],
  },
  {
    id: 'it-5-formulario-avisos',
    fase: 'Iteración 5 · Conversión',
    nombre: 'Formulario guiado multipaso y avisos por correo',
    rango: '29 jul 2026',
    ghSince: '2026-07-29',
    ghUntil: '2026-07-30',
    commits: 32,
    resumen:
      'El formulario de recolección se convierte en un flujo guiado paso a paso, traducido a los dos idiomas, y se escribe el módulo de avisos por correo para órdenes y contactos. El código de correo queda listo y probado, pero inerte: le faltan las variables de entorno.',
    historias: [
      {
        id: 'EK-5-01',
        titulo: 'Como cliente, quiero un formulario que me pregunte una cosa a la vez para no abandonarlo',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-29',
        tags: ['conversión', 'formularios', 'iteración-5'],
        archivos: ['src/components/TypeformFlow.astro'],
        dod: [
          { texto: 'TypeformFlow presenta el formulario paso a paso con avance y validación.', estado: 'pass' },
          { texto: 'Prop de idioma: etiquetas, errores y confirmación traducidos, sin texto duro.', estado: 'pass' },
          { texto: 'Integrado en agenda-una-recolección y en su equivalente en inglés.', estado: 'pass' },
        ],
      },
      {
        id: 'EK-5-02',
        titulo: 'Como operaciones, quiero un correo cuando entre una recolección o un contacto',
        tipo: 'historia',
        valor: 'alto',
        col: 'aceptacion',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-29',
        tags: ['correo', 'avisos', 'iteración-5'],
        archivos: ['src/lib/email.ts'],
        dod: [
          { texto: 'email.ts compone y envía el aviso; conectado a /api/recolecciones y /api/contacto.', estado: 'pass' },
          { texto: 'Falla en silencio si no hay configuración, sin romper el envío del formulario.', estado: 'pass' },
          { texto: 'RESEND_API_KEY, NOTIFY_FROM y NOTIFY_EMAIL configuradas en producción.', estado: 'pend' },
          { texto: 'Aviso verificado de punta a punta con un envío real.', estado: 'pend' },
        ],
        nota: 'Bloqueada por dos decisiones de negocio: el dominio definitivo y los buzones internos. Ver EK-B-01.',
      },
      {
        id: 'EK-5-03',
        titulo: 'Como equipo, quiero los logos y favicons en los formatos correctos para cada superficie',
        tipo: 'tarea',
        valor: 'bajo',
        col: 'aceptada',
        par: 'MR',
        agente: 'Claude',
        fecha: '2026-07-29',
        tags: ['activos', 'marca', 'iteración-5'],
        dod: [
          { texto: 'Variantes de logo (horizontal, blanco) y favicons en PNG e ICO.', estado: 'pass' },
          { texto: 'Atributos width y height en las imágenes de marca para evitar saltos de layout.', estado: 'pass' },
        ],
      },
    ],
  },
  {
    id: 'it-6-backlog',
    fase: 'Próxima iteración',
    nombre: 'Backlog vivo: desbloqueos, subastas y paridad',
    rango: 'sin planear',
    ghSince: '2026-07-30',
    ghUntil: '2026-12-31',
    commits: null,
    resumen:
      'Lo que está en la cola, con su motivo de bloqueo. Sale de pendientes.md, del plan competitivo y del plan del panel de operaciones. Nada de aquí tiene commits todavía: si aparecen, la historia se mueve a una iteración nueva.',
    historias: [
      {
        id: 'EK-B-01',
        titulo: 'Como operaciones, quiero que los avisos por correo estén realmente activos',
        tipo: 'tarea',
        valor: 'alto',
        col: 'planeada',
        par: 'MR',
        tags: ['correo', 'bloqueada', 'backlog'],
        dod: [
          { texto: 'Dominio definitivo del sitio decidido por la gerencia.', estado: 'pend' },
          { texto: 'Buzones internos de destino confirmados para órdenes y contactos.', estado: 'pend' },
          { texto: 'Resend provisionado con el dominio verificado por DNS.', estado: 'pend' },
          { texto: 'Las tres variables de entorno cargadas y un envío real verificado.', estado: 'pend' },
        ],
        nota: 'El código está listo desde la iteración 5. Bloqueo de negocio, no técnico.',
      },
      {
        id: 'EK-B-02',
        titulo: 'Como visitante, quiero ver las licencias ambientales para confiar en la operación',
        tipo: 'tarea',
        valor: 'alto',
        col: 'cola',
        par: 'MR',
        tags: ['activos', 'confianza', 'backlog'],
        dod: [
          { texto: 'PDF de las licencias entregados y subidos a public/.', estado: 'pend' },
          { texto: 'Enlazados desde /licencias y desde el pie del sitio.', estado: 'pend' },
        ],
        nota: 'Espera que alguien del equipo entregue los archivos.',
      },
      {
        id: 'EK-B-03',
        titulo: 'Como visitante, quiero ver testimonios y clientes reales en lugar de una sección vacía',
        tipo: 'tarea',
        valor: 'medio',
        col: 'cola',
        par: 'MR',
        tags: ['activos', 'confianza', 'backlog'],
        dod: [
          { texto: 'Testimonios con autorización de uso por escrito.', estado: 'pend' },
          { texto: 'Logos de clientes con autorización de marca.', estado: 'pend' },
          { texto: 'Cargados en credenciales.ts para que el guardarraíl los publique.', estado: 'pend' },
        ],
      },
      {
        id: 'EK-B-04',
        titulo: 'Como administrador, quiero un registro de auditoría de todo, no solo de las órdenes',
        tipo: 'historia',
        valor: 'medio',
        col: 'cola',
        par: 'MR',
        tags: ['auditoría', 'panel', 'backlog'],
        dod: [
          { texto: 'Tabla audit_log con actor, acción, entidad y marca de tiempo.', estado: 'pend' },
          { texto: 'Escrituras de contenido y de usuarios registradas, no solo order_events.', estado: 'pend' },
          { texto: 'Consultable desde /admin con filtro por actor y por entidad.', estado: 'pend' },
        ],
        nota: 'M7 del plan del panel de operaciones.',
      },
      {
        id: 'EK-B-05',
        titulo: 'Como visitante internacional, quiero que la versión en inglés diga lo mismo que la española',
        tipo: 'tarea',
        valor: 'medio',
        col: 'planeada',
        par: 'MR',
        tags: ['i18n', 'paridad', 'backlog'],
        dod: [
          { texto: 'Auditoría página por página de paridad ES/EN.', estado: 'pend' },
          { texto: 'Cifras idénticas en ambos idiomas, siempre desde brand.ts.', estado: 'pend' },
          { texto: 'llms.txt y llms-full.txt actualizados con el contenido nuevo.', estado: 'pend' },
        ],
        nota: 'Fase 6 del plan competitivo.',
      },
      {
        id: 'EK-B-06',
        titulo: 'Como responsable del sitio, quiero las dependencias sin vulnerabilidades conocidas',
        tipo: 'tarea',
        valor: 'medio',
        col: 'planeada',
        par: 'MR',
        tags: ['deuda', 'dependencias', 'backlog'],
        dod: [
          { texto: 'Decidido si se acepta el upgrade breaking de astro y @astrojs/vercel.', estado: 'pend' },
          { texto: 'npm audit sin hallazgos pendientes.', estado: 'pend' },
          { texto: 'Sitio verificado tras el upgrade: build, formularios y panel.', estado: 'pend' },
        ],
        nota: 'Ver AUDITORIA.md.',
      },
      {
        id: 'EK-B-07',
        titulo: 'Como comprador de tecnología usada, quiero ver los lotes disponibles y manifestar interés',
        tipo: 'historia',
        valor: 'alto',
        col: 'cola',
        par: 'MR',
        tags: ['ekotrading', 'subastas', 'backlog'],
        dod: [
          { texto: 'Modelo de datos de lotes con categoría, fotos, estado y fechas.', estado: 'pend' },
          { texto: 'CRUD de lotes en /admin y listado público con filtros.', estado: 'pend' },
          { texto: 'Registro de comprador con sesión separada de la del panel interno.', estado: 'pend' },
          { texto: 'Aviso por correo de lotes nuevos según categoría suscrita.', estado: 'pend' },
        ],
        nota: 'Fase 5 del plan competitivo. La suscripción por categoría es la ventaja real sobre el competidor, no la subasta.',
      },
      {
        id: 'EK-B-08',
        titulo: 'Como cliente, quiero descargar mis certificados de disposición final sin pedirlos por correo',
        tipo: 'historia',
        valor: 'medio',
        col: 'cola',
        par: 'MR',
        tags: ['trazabilidad', 'panel', 'backlog'],
        dod: [
          { texto: 'Certificados generados y asociados a la orden de recolección.', estado: 'pend' },
          { texto: 'Portal del cliente con acceso a su propio historial y descargas.', estado: 'pend' },
        ],
        nota: 'M2 y M8 del plan del panel de operaciones.',
      },
    ],
  },
]

/** Commits por mes del historial real. Alimenta el gráfico de actividad. */
export const COMMITS_POR_MES: Array<{ mes: string; commits: number }> = [
  { mes: '2026-04', commits: 62 },
  { mes: '2026-05', commits: 0 },
  { mes: '2026-06', commits: 68 },
  { mes: '2026-07', commits: 293 },
]
