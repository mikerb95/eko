/**
 * Diagramas del sistema: BPMN, secuencia, componentes, paquetes, clases y objetos.
 *
 * Todo se modela como datos y lo dibuja el componente correspondiente. La razón
 * es la misma que en iteraciones.ts y documentacion.ts: un diagrama exportado
 * como imagen se desincroniza del código en la primera semana, y nadie lo vuelve
 * a abrir. Aquí, cambiar el sistema obliga a cambiar el diagrama en un archivo
 * revisable, y fuente dice de qué parte del repositorio salió cada cosa.
 *
 * Las clases NO son un modelo ideal: son las tablas que los módulos crean de
 * verdad con CREATE TABLE, más los tipos que viajan en memoria.
 */

/* ────────────────────────────── BPMN ────────────────────────────── */

export type TipoPaso = 'inicio' | 'tarea' | 'decision' | 'mensaje' | 'fin'

export interface PasoBpmn {
  id: string
  /** id del carril en carriles */
  carril: string
  /** Columna en la que se dibuja: fija el orden temporal. */
  col: number
  nombre: string
  tipo: TipoPaso
  /** ids de los pasos siguientes. */
  siguiente?: string[]
  /** Etiqueta de la salida, para decisiones. */
  guarda?: string
  nota?: string
}

export interface ProcesoBpmn {
  id: string
  nombre: string
  descripcion: string
  carriles: Array<{ id: string; nombre: string }>
  pasos: PasoBpmn[]
  fuente: string[]
}

export const PROCESOS: ProcesoBpmn[] = [
  {
    id: 'orden',
    nombre: 'Ciclo de una orden de recolección',
    descripcion:
      'Del formulario público al cierre de la orden. Es el proceso central del negocio: todo lo demás lo alimenta o lo audita.',
    carriles: [
      { id: 'sol', nombre: 'Solicitante' },
      { id: 'web', nombre: 'Sitio' },
      { id: 'ops', nombre: 'Operaciones' },
      { id: 'log', nombre: 'Logística' },
      { id: 'sys', nombre: 'Sistema' },
    ],
    pasos: [
      { id: 'p1', carril: 'sol', col: 0, nombre: 'Necesita retirar equipos', tipo: 'inicio', siguiente: ['p2'] },
      { id: 'p2', carril: 'sol', col: 1, nombre: 'Completa el flujo guiado', tipo: 'tarea', siguiente: ['p3'] },
      { id: 'p3', carril: 'web', col: 2, nombre: 'Valida y registra la orden', tipo: 'tarea', siguiente: ['p4', 'p5'] },
      {
        id: 'p4',
        carril: 'sys',
        col: 3,
        nombre: 'Avisa al equipo por correo',
        tipo: 'mensaje',
        nota: 'Si falla, la orden ya está guardada y el panel es la fuente de verdad.',
      },
      { id: 'p5', carril: 'ops', col: 3, nombre: 'Revisa la solicitud', tipo: 'tarea', siguiente: ['p6'] },
      { id: 'p6', carril: 'ops', col: 4, nombre: '¿Es viable?', tipo: 'decision', siguiente: ['p7', 'p12'] },
      { id: 'p7', carril: 'ops', col: 5, nombre: 'Confirma y programa fecha', tipo: 'tarea', guarda: 'sí', siguiente: ['p8'] },
      { id: 'p8', carril: 'log', col: 6, nombre: 'Sale a ruta', tipo: 'tarea', siguiente: ['p9'] },
      { id: 'p9', carril: 'log', col: 7, nombre: 'Recolecta los equipos', tipo: 'tarea', siguiente: ['p10'] },
      {
        id: 'p10',
        carril: 'ops',
        col: 8,
        nombre: 'Certifica la disposición',
        tipo: 'tarea',
        siguiente: ['p11'],
        nota: 'El estado existe; el documento descargable es el módulo M2, pendiente.',
      },
      { id: 'p11', carril: 'ops', col: 9, nombre: 'Cierra la orden', tipo: 'fin' },
      { id: 'p12', carril: 'ops', col: 5, nombre: 'Cancela con nota', tipo: 'fin', guarda: 'no' },
    ],
    fuente: ['src/lib/ops.ts', 'src/pages/api/recolecciones.ts', 'src/pages/admin/index.astro'],
  },
  {
    id: 'prospecto',
    nombre: 'Captación de un prospecto',
    descripcion:
      'Del visitante que llega al sitio al mensaje atendido. Es el único proceso donde el contenido publicado es parte de la operación.',
    carriles: [
      { id: 'vis', nombre: 'Visitante' },
      { id: 'web', nombre: 'Sitio' },
      { id: 'con', nombre: 'Consultor' },
      { id: 'sys', nombre: 'Sistema' },
    ],
    pasos: [
      { id: 'q1', carril: 'vis', col: 0, nombre: 'Llega buscando cumplimiento', tipo: 'inicio', siguiente: ['q2'] },
      { id: 'q2', carril: 'vis', col: 1, nombre: 'Lee unidades y normativas', tipo: 'tarea', siguiente: ['q3'] },
      { id: 'q3', carril: 'vis', col: 2, nombre: '¿Necesita hablar?', tipo: 'decision', siguiente: ['q4', 'q9'] },
      { id: 'q4', carril: 'vis', col: 3, nombre: 'Envía el formulario', tipo: 'tarea', guarda: 'sí', siguiente: ['q5'] },
      { id: 'q5', carril: 'web', col: 4, nombre: 'Valida y guarda como nuevo', tipo: 'tarea', siguiente: ['q6', 'q7'] },
      { id: 'q6', carril: 'sys', col: 5, nombre: 'Avisa con reply-to del remitente', tipo: 'mensaje' },
      { id: 'q7', carril: 'con', col: 5, nombre: 'Responde el diagnóstico', tipo: 'tarea', siguiente: ['q8'] },
      { id: 'q8', carril: 'con', col: 6, nombre: 'Marca atendido', tipo: 'fin' },
      { id: 'q9', carril: 'vis', col: 3, nombre: 'Se va sin contactar', tipo: 'fin', guarda: 'no' },
    ],
    fuente: ['src/pages/api/contacto.ts', 'src/lib/contactos.ts', 'src/lib/email.ts'],
  },
  {
    id: 'acceso',
    nombre: 'Acceso al panel y autorización',
    descripcion:
      'Toda petición al panel pasa por aquí. La autorización no se reparte por endpoint: se decide en un solo punto.',
    carriles: [
      { id: 'usr', nombre: 'Usuario' },
      { id: 'mid', nombre: 'Middleware' },
      { id: 'api', nombre: 'API / Panel' },
    ],
    pasos: [
      { id: 'a1', carril: 'usr', col: 0, nombre: 'Pide una ruta del panel', tipo: 'inicio', siguiente: ['a2'] },
      { id: 'a2', carril: 'mid', col: 1, nombre: '¿Ruta protegida?', tipo: 'decision', siguiente: ['a3', 'a9'] },
      { id: 'a3', carril: 'mid', col: 2, nombre: '¿Sesión válida?', tipo: 'decision', guarda: 'sí', siguiente: ['a4', 'a10'] },
      { id: 'a4', carril: 'mid', col: 3, nombre: '¿Es escritura?', tipo: 'decision', guarda: 'sí', siguiente: ['a5', 'a7'] },
      { id: 'a5', carril: 'mid', col: 4, nombre: '¿El rol puede escribir aquí?', tipo: 'decision', guarda: 'sí', siguiente: ['a7', 'a11'] },
      { id: 'a7', carril: 'mid', col: 5, nombre: 'Publica usuario y rol en el contexto', tipo: 'tarea', siguiente: ['a8'] },
      { id: 'a8', carril: 'api', col: 6, nombre: 'Atiende la petición', tipo: 'fin' },
      { id: 'a9', carril: 'api', col: 2, nombre: 'Pasa sin verificación', tipo: 'fin', guarda: 'no' },
      { id: 'a10', carril: 'mid', col: 4, nombre: 'Redirige o responde 401', tipo: 'fin', guarda: 'no' },
      { id: 'a11', carril: 'mid', col: 5, nombre: 'Responde 403', tipo: 'fin', guarda: 'no' },
    ],
    fuente: ['src/middleware.ts', 'src/lib/auth.ts'],
  },
  {
    id: 'contenido',
    nombre: 'Publicación de contenido',
    descripcion:
      'Cómo una entrada del diario o una ficha de normativa llega al sitio público sin desplegar código, y qué pasa si la base no responde.',
    carriles: [
      { id: 'con', nombre: 'Consultor' },
      { id: 'pan', nombre: 'Panel' },
      { id: 'db', nombre: 'Base de datos' },
      { id: 'pub', nombre: 'Sitio público' },
    ],
    pasos: [
      { id: 'c1', carril: 'con', col: 0, nombre: 'Redacta o corrige', tipo: 'inicio', siguiente: ['c2'] },
      { id: 'c2', carril: 'pan', col: 1, nombre: 'Guarda con secciones tipadas', tipo: 'tarea', siguiente: ['c3'] },
      { id: 'c3', carril: 'db', col: 2, nombre: 'Persiste la fila', tipo: 'tarea', siguiente: ['c4'] },
      { id: 'c4', carril: 'pub', col: 3, nombre: '¿La base responde?', tipo: 'decision', siguiente: ['c5', 'c6'] },
      { id: 'c5', carril: 'pub', col: 4, nombre: 'Publica el contenido de la base', tipo: 'fin', guarda: 'sí' },
      {
        id: 'c6',
        carril: 'pub',
        col: 4,
        nombre: 'Publica el JSON versionado',
        tipo: 'fin',
        guarda: 'no',
        nota: 'El visitante no ve un error: ve la versión del repositorio.',
      },
    ],
    fuente: ['src/lib/cms.ts', 'src/pages/api/admin/posts.ts', 'src/data/blog-posts.json'],
  },
]

/* ─────────────────────── Diagramas de secuencia ─────────────────────── */

export interface MensajeSecuencia {
  de: string
  a: string
  texto: string
  /** llamada, retorno o mensaje a sí mismo. */
  tipo: 'call' | 'return' | 'self'
  /** Marca el camino de error, para dibujarlo distinto. */
  error?: boolean
  nota?: string
}

export interface Secuencia {
  id: string
  nombre: string
  descripcion: string
  participantes: Array<{ id: string; nombre: string }>
  mensajes: MensajeSecuencia[]
  fuente: string[]
}

export const SECUENCIAS: Secuencia[] = [
  {
    id: 'sec-recoleccion',
    nombre: 'Solicitud de recolección',
    descripcion:
      'El camino completo de POST /api/recolecciones. Nótese el orden: la orden se guarda antes de intentar el correo, y el correo no puede tumbar la respuesta.',
    participantes: [
      { id: 'nav', nombre: 'Navegador' },
      { id: 'api', nombre: '/api/recolecciones' },
      { id: 'rl', nombre: 'rateLimit' },
      { id: 'ops', nombre: 'ops' },
      { id: 'db', nombre: 'Turso' },
      { id: 'mail', nombre: 'email' },
      { id: 'resend', nombre: 'Resend' },
    ],
    mensajes: [
      { de: 'nav', a: 'api', texto: 'POST con el JSON del flujo', tipo: 'call' },
      { de: 'api', a: 'rl', texto: 'checkRateLimit(ip)', tipo: 'call' },
      { de: 'rl', a: 'api', texto: '{ allowed }', tipo: 'return' },
      { de: 'api', a: 'api', texto: 'honeypot, recorte y validación', tipo: 'self' },
      { de: 'api', a: 'ops', texto: 'createOrder(input)', tipo: 'call' },
      { de: 'ops', a: 'db', texto: 'CREATE TABLE IF NOT EXISTS + INSERT', tipo: 'call' },
      { de: 'db', a: 'ops', texto: 'fila con consecutivo', tipo: 'return' },
      { de: 'ops', a: 'api', texto: 'Order', tipo: 'return' },
      { de: 'api', a: 'mail', texto: 'notifyNewOrder(order)', tipo: 'call' },
      {
        de: 'mail',
        a: 'resend',
        texto: 'POST /emails (timeout 8 s)',
        tipo: 'call',
        nota: 'Solo si hay API key, remitente y destinatarios.',
      },
      { de: 'resend', a: 'mail', texto: 'ok | error', tipo: 'return' },
      {
        de: 'mail',
        a: 'api',
        texto: '{ sent } — nunca lanza',
        tipo: 'return',
        nota: 'Un fallo aquí solo se registra en el log.',
      },
      { de: 'api', a: 'nav', texto: '200 { ok, consecutive }', tipo: 'return' },
      {
        de: 'api',
        a: 'nav',
        texto: '429 / 400 / 500 con salida por WhatsApp',
        tipo: 'return',
        error: true,
      },
    ],
    fuente: ['src/pages/api/recolecciones.ts', 'src/lib/ops.ts', 'src/lib/email.ts'],
  },
  {
    id: 'sec-login',
    nombre: 'Acceso al panel',
    descripcion:
      'Login con límite de intentos, derivación PBKDF2 y sesión firmada. La contraseña nunca se guarda ni se compara en claro.',
    participantes: [
      { id: 'nav', nombre: 'Navegador' },
      { id: 'api', nombre: '/api/admin/login' },
      { id: 'rl', nombre: 'rateLimit' },
      { id: 'usr', nombre: 'users' },
      { id: 'db', nombre: 'Turso' },
      { id: 'auth', nombre: 'auth' },
    ],
    mensajes: [
      { de: 'nav', a: 'api', texto: 'POST usuario y contraseña', tipo: 'call' },
      { de: 'api', a: 'rl', texto: 'checkRateLimit(clave, 5, 10 min)', tipo: 'call' },
      { de: 'rl', a: 'api', texto: '{ allowed }', tipo: 'return' },
      { de: 'api', a: 'usr', texto: 'verifyLogin(usuario, contraseña)', tipo: 'call' },
      { de: 'usr', a: 'db', texto: 'seedAdminIfEmpty() + SELECT activo', tipo: 'call' },
      { de: 'db', a: 'usr', texto: 'fila con pass_hash', tipo: 'return' },
      { de: 'usr', a: 'usr', texto: 'PBKDF2 120 000 y comparación constante', tipo: 'self' },
      { de: 'usr', a: 'api', texto: 'User | null', tipo: 'return' },
      { de: 'api', a: 'auth', texto: 'createSession(user)', tipo: 'call' },
      { de: 'auth', a: 'auth', texto: 'HMAC-SHA256 del payload con exp 8 h', tipo: 'self' },
      { de: 'auth', a: 'api', texto: 'token firmado', tipo: 'return' },
      { de: 'api', a: 'rl', texto: 'resetRateLimit(clave)', tipo: 'call' },
      { de: 'api', a: 'nav', texto: 'Set-Cookie HttpOnly, SameSite=Lax', tipo: 'return' },
      { de: 'api', a: 'nav', texto: '429 con Retry-After | error de credenciales', tipo: 'return', error: true },
    ],
    fuente: ['src/pages/api/admin/login.ts', 'src/lib/users.ts', 'src/lib/auth.ts'],
  },
  {
    id: 'sec-autorizacion',
    nombre: 'Autorización de una escritura',
    descripcion:
      'Qué ocurre entre la petición y el endpoint cuando alguien intenta escribir en un área del panel.',
    participantes: [
      { id: 'nav', nombre: 'Navegador' },
      { id: 'mid', nombre: 'middleware' },
      { id: 'auth', nombre: 'auth' },
      { id: 'api', nombre: 'API del área' },
      { id: 'db', nombre: 'Turso' },
    ],
    mensajes: [
      { de: 'nav', a: 'mid', texto: 'POST /api/admin/…', tipo: 'call' },
      { de: 'mid', a: 'auth', texto: 'verifySession(cookie)', tipo: 'call' },
      { de: 'auth', a: 'auth', texto: 'firma en tiempo constante y expiración', tipo: 'self' },
      { de: 'auth', a: 'mid', texto: 'Session { u, n, r } | null', tipo: 'return' },
      { de: 'mid', a: 'mid', texto: 'canWrite(ruta, rol)', tipo: 'self', nota: 'Lo no declarado queda solo para admin.' },
      { de: 'mid', a: 'api', texto: 'next() con usuario y rol en locals', tipo: 'call' },
      { de: 'api', a: 'db', texto: 'UPDATE / INSERT', tipo: 'call' },
      { de: 'db', a: 'api', texto: 'fila actualizada', tipo: 'return' },
      { de: 'api', a: 'nav', texto: '200 con el recurso', tipo: 'return' },
      { de: 'mid', a: 'nav', texto: '401 sin sesión | 403 rol sin permiso', tipo: 'return', error: true },
    ],
    fuente: ['src/middleware.ts', 'src/pages/api/admin/recolecciones.ts'],
  },
  {
    id: 'sec-degradacion',
    nombre: 'Lectura pública con degradación',
    descripcion:
      'Por qué el sitio no se cae con la base caída: la lectura pública captura el fallo y responde con el JSON versionado del repositorio.',
    participantes: [
      { id: 'pag', nombre: 'Página' },
      { id: 'cms', nombre: 'cms' },
      { id: 'db', nombre: 'Turso' },
      { id: 'json', nombre: 'JSON del repo' },
    ],
    mensajes: [
      { de: 'pag', a: 'cms', texto: 'getPosts()', tipo: 'call' },
      { de: 'cms', a: 'cms', texto: '¿DATABASE_URL remota?', tipo: 'self' },
      { de: 'cms', a: 'db', texto: 'SELECT * FROM posts', tipo: 'call' },
      { de: 'db', a: 'cms', texto: 'filas', tipo: 'return' },
      { de: 'db', a: 'cms', texto: 'excepción de conexión', tipo: 'return', error: true },
      { de: 'cms', a: 'cms', texto: 'console.error del fallo', tipo: 'self', error: true },
      { de: 'cms', a: 'json', texto: 'import de blog-posts.json', tipo: 'call', error: true },
      { de: 'json', a: 'cms', texto: 'entradas versionadas', tipo: 'return', error: true },
      { de: 'cms', a: 'pag', texto: 'Post[] — siempre hay contenido', tipo: 'return' },
    ],
    fuente: ['src/lib/cms.ts', 'src/data/blog-posts.json'],
  },
]

/* ─────────────────────── Diagrama de componentes ─────────────────────── */

export interface Zona {
  id: string
  nombre: string
  nota?: string
}

export interface Componente {
  id: string
  zona: string
  nombre: string
  tipo: 'cliente' | 'estatico' | 'funcion' | 'datos' | 'externo'
  detalle: string
  tecnologia?: string
}

export interface EnlaceComponente {
  de: string
  a: string
  etiqueta: string
  /** Marca el enlace que puede faltar sin romper el sistema. */
  opcional?: boolean
}

export const ZONAS: Zona[] = [
  { id: 'cliente', nombre: 'Cliente' },
  {
    id: 'vercel',
    nombre: 'Vercel',
    nota: 'Salida estática más funciones. Las cabeceras de seguridad se inyectan en el Build Output, así que cubren también lo prerenderizado.',
  },
  { id: 'gestionado', nombre: 'Servicios gestionados' },
  { id: 'terceros', nombre: 'Terceros en el navegador' },
]

export const COMPONENTES: Componente[] = [
  {
    id: 'browser',
    zona: 'cliente',
    nombre: 'Navegador',
    tipo: 'cliente',
    detalle:
      'Recibe HTML prerenderizado y ejecuta los scripts del propio proyecto: navegación, flujo guiado y tablero.',
    tecnologia: 'HTML + TypeScript compilado, sin framework de UI',
  },
  {
    id: 'static',
    zona: 'vercel',
    nombre: 'Páginas estáticas',
    tipo: 'estatico',
    detalle: 'Las 27 páginas públicas es/en, más sitemap, robots y llms.txt generados en el build.',
    tecnologia: 'Astro 7, salida estática',
  },
  {
    id: 'middleware',
    zona: 'vercel',
    nombre: 'Middleware',
    tipo: 'funcion',
    detalle:
      'Único punto de autenticación y autorización de /admin y /api/admin. Publica usuario y rol en el contexto.',
    tecnologia: 'Astro middleware',
  },
  {
    id: 'apipub',
    zona: 'vercel',
    nombre: 'Endpoints públicos',
    tipo: 'funcion',
    detalle:
      'POST /api/recolecciones y POST /api/contacto: validación en servidor, límite de tasa y honeypot.',
    tecnologia: 'Funciones con prerender = false',
  },
  {
    id: 'apiadmin',
    zona: 'vercel',
    nombre: 'API del panel',
    tipo: 'funcion',
    detalle: 'Recolecciones, contactos, entradas, normativas, usuarios y sesión.',
    tecnologia: 'Funciones tras el middleware',
  },
  {
    id: 'panel',
    zona: 'vercel',
    nombre: 'Panel de operaciones',
    tipo: 'funcion',
    detalle:
      'Render en servidor del tablero, listados y formularios. Captura por separado el error de cada consulta.',
    tecnologia: 'Página con prerender = false',
  },
  {
    id: 'turso',
    zona: 'gestionado',
    nombre: 'Turso / libSQL',
    tipo: 'datos',
    detalle:
      'Seis tablas: posts, normativas, users, orders, order_events y contacts. En local, el mismo código habla con SQLite en archivo.',
    tecnologia: '@libsql/client',
  },
  {
    id: 'resend',
    zona: 'gestionado',
    nombre: 'Resend',
    tipo: 'externo',
    detalle:
      'Avisos internos de orden y de contacto. Sin configurar, el envío es un no-op y el panel queda como fuente de verdad.',
    tecnologia: 'API HTTP, sin SDK',
  },
  {
    id: 'repo',
    zona: 'gestionado',
    nombre: 'GitHub',
    tipo: 'externo',
    detalle:
      'Origen del despliegue y respaldo del contenido semilla. El tablero enlaza a los rangos de commits de cada iteración.',
  },
  {
    id: 'fonts',
    zona: 'terceros',
    nombre: 'Google Fonts',
    tipo: 'externo',
    detalle: 'Geist y Instrument Serif. Permitido explícitamente en style-src y font-src de la CSP.',
  },
  {
    id: 'yt',
    zona: 'terceros',
    nombre: 'YouTube (nocookie)',
    tipo: 'externo',
    detalle:
      'El iframe se inserta solo tras el clic en la fachada; el póster viene de img.youtube.com.',
  },
]

export const ENLACES_COMPONENTES: EnlaceComponente[] = [
  { de: 'browser', a: 'static', etiqueta: 'GET de las páginas públicas' },
  { de: 'browser', a: 'apipub', etiqueta: 'POST del flujo y del contacto' },
  { de: 'browser', a: 'middleware', etiqueta: 'toda petición a /admin o /api/admin' },
  { de: 'middleware', a: 'panel', etiqueta: 'next() con sesión válida' },
  { de: 'middleware', a: 'apiadmin', etiqueta: 'next() si el rol autoriza' },
  { de: 'apipub', a: 'turso', etiqueta: 'INSERT de orden o contacto' },
  { de: 'apiadmin', a: 'turso', etiqueta: 'lectura y escritura del panel' },
  { de: 'panel', a: 'turso', etiqueta: 'listados e indicadores' },
  { de: 'static', a: 'turso', etiqueta: 'contenido en el build, con respaldo JSON' },
  { de: 'apipub', a: 'resend', etiqueta: 'aviso interno', opcional: true },
  { de: 'static', a: 'repo', etiqueta: 'despliegue y enlaces al historial' },
  { de: 'browser', a: 'fonts', etiqueta: 'tipografías' },
  { de: 'browser', a: 'yt', etiqueta: 'solo tras el clic', opcional: true },
]

/* ─────────────────────── Diagrama de paquetes ─────────────────────── */

export interface Paquete {
  ruta: string
  rol: string
  /** Rutas de las que depende. */
  depende: string[]
  nota?: string
}

export const PAQUETES: Paquete[] = [
  {
    ruta: 'src/pages',
    rol: 'Rutas: páginas públicas, panel y endpoints. Es la única capa que conoce HTTP.',
    depende: ['src/layouts', 'src/components', 'src/lib', 'src/data'],
  },
  {
    ruta: 'src/pages/api',
    rol: 'Endpoints. Validan la entrada, delegan en lib y traducen errores a códigos HTTP.',
    depende: ['src/lib'],
  },
  {
    ruta: 'src/layouts',
    rol: 'Armazón de página: metadatos, canónica, hreflang y navegación.',
    depende: ['src/components', 'src/lib', 'src/config'],
  },
  {
    ruta: 'src/components',
    rol: 'Piezas de interfaz reutilizables: navegación, pie, fachada de video, flujo guiado, tablero.',
    depende: ['src/data', 'src/config'],
  },
  {
    ruta: 'src/lib',
    rol: 'Dominio y servicios: acceso a datos, sesión, usuarios, correo, límite de tasa, rutas e identidad.',
    depende: ['src/data'],
    nota: 'No importa nada de pages ni de components: es la capa que se puede probar sin HTTP.',
  },
  {
    ruta: 'src/data',
    rol: 'Datos tipados y contenido semilla: tablero, documentación, diagramas, calidad, normativas y entradas.',
    depende: [],
    nota: 'Hoja del grafo: no depende de nada del proyecto.',
  },
  {
    ruta: 'src/config',
    rol: 'Configuración de navegación e idiomas.',
    depende: [],
  },
  {
    ruta: 'src/styles',
    rol: 'Sistema visual: variables de color, tipografía, radios y utilidades compartidas.',
    depende: [],
  },
  {
    ruta: 'src/middleware.ts',
    rol: 'Puerta única del panel: autenticación y autorización por rol y área.',
    depende: ['src/lib'],
  },
]

export const REGLAS_DEPENDENCIA: string[] = [
  'La dependencia va en un solo sentido: pages → lib → data. Nada de lib importa una página.',
  'Los endpoints no hablan con la base directamente: pasan por el módulo del dominio que corresponda.',
  'Todo lo que sea dato de negocio o documentación vive en src/data como TypeScript tipado, no incrustado en una plantilla.',
  'La identidad del sitio, las rutas y la navegación tienen una sola fuente; duplicarlas fue el error de la plantilla original.',
]

/* ─────────────────────── Diagrama de clases ─────────────────────── */

export interface Atributo {
  nombre: string
  tipo: string
  nota?: string
}

export interface Clase {
  nombre: string
  /** Módulo funcional al que pertenece. */
  modulo: string
  estereotipo: 'entidad' | 'valor' | 'servicio' | 'enum'
  /** Tabla que la respalda, si es persistente. */
  tabla?: string
  atributos: Atributo[]
  operaciones?: string[]
  fuente: string
}

export const CLASES: Clase[] = [
  {
    nombre: 'Order',
    modulo: 'Operaciones',
    estereotipo: 'entidad',
    tabla: 'orders',
    atributos: [
      { nombre: 'id', tipo: 'number', nota: 'PK autoincremental' },
      { nombre: 'consecutive', tipo: 'string', nota: 'UNIQUE — el número que ve el solicitante' },
      { nombre: 'status', tipo: 'OrderStatus', nota: 'default solicitada' },
      { nombre: 'first_name / last_name', tipo: 'string' },
      { nombre: 'email / phone', tipo: 'string' },
      { nombre: 'company', tipo: 'string' },
      { nombre: 'country / city / postal_code', tipo: 'string' },
      { nombre: 'address / address2', tipo: 'string' },
      { nombre: 'waste_type', tipo: 'string', nota: 'añadida con migración idempotente' },
      { nombre: 'estimated_quantity', tipo: 'string' },
      { nombre: 'message', tipo: 'string', nota: 'acotado a 2000 caracteres' },
      { nombre: 'source', tipo: 'string', nota: "default 'web'" },
      { nombre: 'assigned_to', tipo: 'string' },
      { nombre: 'scheduled_at', tipo: 'string' },
      { nombre: 'internal_notes', tipo: 'string' },
      { nombre: 'created_at / updated_at', tipo: 'string', nota: 'ISO 8601' },
    ],
    operaciones: [
      'createOrder(input): Order',
      'listOrders(status?): Order[]',
      'getOrderById(id): Order | null',
      'updateOrder(id, patch, user): Order | null',
      'countOrdersByStatus(): Record<string, number>',
    ],
    fuente: 'src/lib/ops.ts',
  },
  {
    nombre: 'OrderEvent',
    modulo: 'Operaciones',
    estereotipo: 'entidad',
    tabla: 'order_events',
    atributos: [
      { nombre: 'id', tipo: 'number' },
      { nombre: 'order_id', tipo: 'number', nota: 'FK lógica a orders' },
      { nombre: 'user', tipo: 'string', nota: 'quién hizo el cambio' },
      { nombre: 'from_status / to_status', tipo: 'string' },
      { nombre: 'note', tipo: 'string' },
      { nombre: 'at', tipo: 'string' },
    ],
    operaciones: ['getOrderEvents(orderId): OrderEvent[]'],
    fuente: 'src/lib/ops.ts',
  },
  {
    nombre: 'OrderStatus',
    modulo: 'Operaciones',
    estereotipo: 'enum',
    atributos: [
      { nombre: 'solicitada', tipo: 'estado inicial' },
      { nombre: 'confirmada', tipo: 'viable, sin fecha' },
      { nombre: 'programada', tipo: 'con fecha y responsable' },
      { nombre: 'en_ruta', tipo: 'logística en calle' },
      { nombre: 'recolectada', tipo: 'equipos retirados' },
      { nombre: 'certificada', tipo: 'disposición certificada' },
      { nombre: 'cerrada', tipo: 'ciclo terminado' },
      { nombre: 'cancelada', tipo: 'con nota del motivo' },
    ],
    fuente: 'src/lib/ops.ts',
  },
  {
    nombre: 'Contact',
    modulo: 'Captación',
    estereotipo: 'entidad',
    tabla: 'contacts',
    atributos: [
      { nombre: 'id', tipo: 'number' },
      { nombre: 'name / email', tipo: 'string', nota: 'obligatorios en el endpoint' },
      { nombre: 'company / phone', tipo: 'string' },
      { nombre: 'sector', tipo: 'string' },
      { nombre: 'service_lines', tipo: 'string', nota: 'líneas de interés' },
      { nombre: 'message', tipo: 'string' },
      { nombre: 'source', tipo: 'string' },
      { nombre: 'status', tipo: "'nuevo' | 'atendido'" },
      { nombre: 'created_at / updated_at', tipo: 'string' },
    ],
    operaciones: [
      'createContact(input): Contact',
      'listContacts(status?): Contact[]',
      'updateContactStatus(id, status): Contact | null',
    ],
    fuente: 'src/lib/contactos.ts',
  },
  {
    nombre: 'User',
    modulo: 'Acceso',
    estereotipo: 'entidad',
    tabla: 'users',
    atributos: [
      { nombre: 'id', tipo: 'number' },
      { nombre: 'username', tipo: 'string', nota: 'UNIQUE, normalizado a minúsculas' },
      { nombre: 'name', tipo: 'string' },
      { nombre: 'role', tipo: 'Role', nota: "default 'lectura'" },
      { nombre: 'pass_hash', tipo: 'string', nota: 'pbkdf2$iteraciones$sal$hash' },
      { nombre: 'active', tipo: 'boolean' },
      { nombre: 'created_at / updated_at', tipo: 'string' },
    ],
    operaciones: [
      'verifyLogin(username, password): User | null',
      'hashPassword(password): string',
      'verifyPassword(password, stored): boolean',
      'upsertUser(input): number',
      'deleteUser(id): void',
      'assertNotLastAdmin(id): void',
    ],
    fuente: 'src/lib/users.ts',
  },
  {
    nombre: 'Role',
    modulo: 'Acceso',
    estereotipo: 'enum',
    atributos: [
      { nombre: 'admin', tipo: 'todo, incluidos usuarios' },
      { nombre: 'operaciones', tipo: 'recolecciones y contactos' },
      { nombre: 'logistica', tipo: 'solo recolecciones' },
      { nombre: 'consultor', tipo: 'contenido y contactos' },
      { nombre: 'lectura', tipo: 'sin escritura' },
    ],
    fuente: 'src/lib/users.ts',
  },
  {
    nombre: 'Session',
    modulo: 'Acceso',
    estereotipo: 'valor',
    atributos: [
      { nombre: 'u', tipo: 'string', nota: 'usuario' },
      { nombre: 'n', tipo: 'string', nota: 'nombre visible' },
      { nombre: 'r', tipo: 'string', nota: 'rol' },
      { nombre: 'exp', tipo: 'number', nota: 'epoch, 8 h de vida' },
    ],
    operaciones: [
      'createSession(user): string',
      'verifySession(token): Session | null',
      'sessionCookie(token, secure): string',
      'clearCookie(secure): string',
    ],
    fuente: 'src/lib/auth.ts',
  },
  {
    nombre: 'Post',
    modulo: 'Contenido',
    estereotipo: 'entidad',
    tabla: 'posts',
    atributos: [
      { nombre: 'id', tipo: 'number' },
      { nombre: 'slug', tipo: 'string', nota: 'UNIQUE — es la URL' },
      { nombre: 'category / date / readtime', tipo: 'string' },
      { nombre: 'accent', tipo: "'deep' | 'forest' | 'clay'" },
      { nombre: 'featured', tipo: 'boolean' },
      { nombre: 'title / lede', tipo: 'string' },
      { nombre: 'sections', tipo: 'Section[]', nota: 'JSON en la columna' },
    ],
    operaciones: [
      'getPosts(): Post[]',
      'getPostBySlug(slug): Post | null',
      'upsertPost(post): number',
      'deletePost(id): void',
    ],
    fuente: 'src/lib/cms.ts',
  },
  {
    nombre: 'Section',
    modulo: 'Contenido',
    estereotipo: 'valor',
    atributos: [
      { nombre: 'type', tipo: "'p' | 'h2' | 'pull' | 'list'" },
      { nombre: 'text', tipo: 'string?' },
      { nombre: 'items', tipo: 'string[]?' },
    ],
    fuente: 'src/lib/cms.ts',
  },
  {
    nombre: 'Normativa',
    modulo: 'Contenido',
    estereotipo: 'entidad',
    tabla: 'normativas',
    atributos: [
      { nombre: 'id', tipo: 'number' },
      { nombre: 'col', tipo: '1 | 2', nota: 'columna de presentación' },
      { nombre: 'position', tipo: 'number' },
      { nombre: 'code', tipo: 'string', nota: 'p. ej. Resolución 851 de 2022' },
      { nombre: 'title / body', tipo: 'string' },
      { nombre: 'tags', tipo: 'string[]', nota: 'JSON en la columna' },
    ],
    operaciones: ['getNormativas(): Normativa[]', 'upsertNormativa(n): number', 'deleteNormativa(id): void'],
    fuente: 'src/lib/cms.ts',
  },
  {
    nombre: 'RateLimitBucket',
    modulo: 'Seguridad',
    estereotipo: 'valor',
    atributos: [
      { nombre: 'count', tipo: 'number' },
      { nombre: 'resetAt', tipo: 'number', nota: 'epoch en ms' },
    ],
    operaciones: [
      'checkRateLimit(key, max, windowMs): RateLimitResult',
      'resetRateLimit(key): void',
      'clientIp(request, fallback): string',
    ],
    fuente: 'src/lib/rateLimit.ts',
  },
  {
    nombre: 'Licencia',
    modulo: 'Credenciales',
    estereotipo: 'valor',
    atributos: [
      { nombre: 'titulo / entidad', tipo: 'string' },
      { nombre: 'resolucion', tipo: 'string' },
      { nombre: 'expedida / vigencia', tipo: 'string' },
      { nombre: 'alcance', tipo: 'string' },
      { nombre: 'pdf', tipo: 'string', nota: 'vacío = documento no cargado' },
      { nombre: 'publicada', tipo: 'boolean', nota: 'la guarda: sin true no se muestra en producción' },
    ],
    operaciones: ['licenciasVisibles(): Licencia[]', 'hayLicencias(): boolean'],
    fuente: 'src/lib/credenciales.ts',
  },
  {
    nombre: 'Ruta',
    modulo: 'Sitio',
    estereotipo: 'valor',
    atributos: [
      { nombre: 'path', tipo: 'string' },
      { nombre: 'titulo / descripcion', tipo: 'string' },
    ],
    operaciones: ['hreflangFor(path): { es, en } | null'],
    fuente: 'src/lib/rutas.ts',
  },
]

export interface RelacionClase {
  de: string
  a: string
  tipo: 'composicion' | 'asociacion' | 'dependencia'
  cardinalidad: string
  etiqueta: string
}

export const RELACIONES_CLASES: RelacionClase[] = [
  {
    de: 'Order',
    a: 'OrderEvent',
    tipo: 'composicion',
    cardinalidad: '1 → 0..*',
    etiqueta: 'cada transición de estado deja un evento en la bitácora',
  },
  {
    de: 'Order',
    a: 'OrderStatus',
    tipo: 'dependencia',
    cardinalidad: '1 → 1',
    etiqueta: 'el estado se valida contra la lista, no es texto libre',
  },
  {
    de: 'OrderEvent',
    a: 'User',
    tipo: 'asociacion',
    cardinalidad: '0..* → 1',
    etiqueta: 'por nombre de usuario de la sesión, sin clave foránea',
  },
  {
    de: 'Order',
    a: 'User',
    tipo: 'asociacion',
    cardinalidad: '0..* → 0..1',
    etiqueta: 'assigned_to guarda el responsable como texto',
  },
  {
    de: 'User',
    a: 'Role',
    tipo: 'dependencia',
    cardinalidad: '1 → 1',
    etiqueta: 'el rol gobierna la autorización en el middleware',
  },
  {
    de: 'Session',
    a: 'User',
    tipo: 'dependencia',
    cardinalidad: '1 → 1',
    etiqueta: 'la sesión copia usuario, nombre y rol; no consulta la tabla en cada petición',
  },
  {
    de: 'Post',
    a: 'Section',
    tipo: 'composicion',
    cardinalidad: '1 → 0..*',
    etiqueta: 'las secciones viajan como JSON en la fila de la entrada',
  },
  {
    de: 'Contact',
    a: 'User',
    tipo: 'asociacion',
    cardinalidad: '0..* → 0..1',
    etiqueta: 'quien lo atiende queda implícito en el cambio de estado',
  },
]

/* ─────────────────────── Diagrama de objetos ─────────────────────── */

export interface Objeto {
  id: string
  clase: string
  valores: Array<[string, string]>
  nota?: string
}

export interface Instantanea {
  id: string
  nombre: string
  descripcion: string
  objetos: Objeto[]
  enlaces: Array<{ de: string; a: string; etiqueta: string }>
}

export const INSTANTANEAS: Instantanea[] = [
  {
    id: 'orden-programada',
    nombre: 'Una orden programada con su bitácora',
    descripcion:
      'Estado típico a media semana: la orden pasó de solicitada a confirmada y de ahí a programada, y cada salto dejó su evento con autor y fecha. La bitácora es lo que permite reconstruir el caso sin preguntarle a nadie.',
    objetos: [
      {
        id: 'o1',
        clase: 'Order',
        valores: [
          ['consecutive', 'REC-0042'],
          ['status', 'programada'],
          ['company', 'Importadora de equipos S.A.S.'],
          ['city', 'Bogotá'],
          ['waste_type', 'Computadores y monitores'],
          ['estimated_quantity', '~120 unidades'],
          ['assigned_to', 'logistica1'],
          ['scheduled_at', '2026-08-06'],
          ['source', 'web'],
        ],
      },
      {
        id: 'e1',
        clase: 'OrderEvent',
        valores: [
          ['from_status', 'solicitada'],
          ['to_status', 'confirmada'],
          ['user', 'operaciones1'],
          ['note', 'Verificado el volumen por teléfono'],
        ],
      },
      {
        id: 'e2',
        clase: 'OrderEvent',
        valores: [
          ['from_status', 'confirmada'],
          ['to_status', 'programada'],
          ['user', 'operaciones1'],
          ['note', 'Ruta del jueves'],
        ],
      },
    ],
    enlaces: [
      { de: 'o1', a: 'e1', etiqueta: 'order_id' },
      { de: 'o1', a: 'e2', etiqueta: 'order_id' },
    ],
  },
  {
    id: 'sesion-rol',
    nombre: 'Una sesión de logística intentando escribir donde no debe',
    descripcion:
      'El rol viaja dentro de la cookie firmada, así que el middleware decide sin consultar la base. Con este rol, escribir en el área de contenido devuelve 403 aunque la sesión sea perfectamente válida.',
    objetos: [
      {
        id: 'u1',
        clase: 'User',
        valores: [
          ['username', 'logistica1'],
          ['role', 'logistica'],
          ['active', 'true'],
          ['pass_hash', 'pbkdf2$120000$…$…'],
        ],
      },
      {
        id: 's1',
        clase: 'Session',
        valores: [
          ['u', 'logistica1'],
          ['r', 'logistica'],
          ['exp', 'ahora + 8 h'],
          ['firma', 'HMAC-SHA256 válida'],
        ],
      },
      {
        id: 'r1',
        clase: 'Resultado',
        valores: [
          ['POST /api/admin/recolecciones', '200 — rol autorizado'],
          ['POST /api/admin/posts', '403 — rol sin permiso'],
          ['GET /api/admin/users', '403 — solo administradores'],
        ],
        nota: 'No es una clase persistida: es lo que devuelve el middleware para esa sesión.',
      },
    ],
    enlaces: [
      { de: 'u1', a: 's1', etiqueta: 'createSession copia usuario y rol' },
      { de: 's1', a: 'r1', etiqueta: 'canWrite(ruta, rol)' },
    ],
  },
  {
    id: 'licencia-guardada',
    nombre: 'Una licencia que existe en el código y no se publica',
    descripcion:
      'El caso que motivó las guardas: en la Fase 0 se retiraron seis logos de clientes inventados que llevaban meses publicados. Hoy el placeholder está en el repositorio, con la bandera en falso, y en producción la página simplemente no muestra la sección.',
    objetos: [
      {
        id: 'l1',
        clase: 'Licencia',
        valores: [
          ['titulo', 'PENDIENTE — Licencia / autorización ambiental'],
          ['entidad', 'PENDIENTE — ANLA / CAR / otra'],
          ['resolucion', 'PENDIENTE'],
          ['pdf', "'' (no cargado)"],
          ['publicada', 'false'],
        ],
      },
      {
        id: 'v1',
        clase: 'Vista pública',
        valores: [
          ['producción', 'la sección no se renderiza'],
          ['desarrollo', 'se ve el placeholder con aviso'],
        ],
        nota: 'mostrarPlaceholders = import.meta.env.DEV',
      },
    ],
    enlaces: [{ de: 'l1', a: 'v1', etiqueta: 'licenciasVisibles() filtra por publicada' }],
  },
]
