/**
 * Esquema de la base, en un solo lugar.
 *
 * Antes cada módulo (`cms`, `users`, `contactos`, `ops`, `zohoOutbox`) llevaba
 * su propio `CREATE TABLE` embebido en su `ensureSchema()`. Funcionaba, pero
 * dejaba el esquema repartido en cinco archivos, y cualquier script externo que
 * quisiera crear la base tenía que copiar el SQL — copia que se desactualiza
 * sola. De hecho pasó: la primera versión de `scripts/migrate.mjs` se escribió
 * copiando y se le quedó afuera `marketing_at` en dos tablas.
 *
 * Este archivo es TS deliberadamente plano: solo constantes, sin imports ni
 * `import.meta`. Así node lo carga directo (type stripping) desde un `.mjs`,
 * sin pasar por el bundler, y la app y el script comparten la misma fuente.
 *
 * Todo es idempotente: `CREATE TABLE IF NOT EXISTS` no toca una tabla que ya
 * existe. Por eso las columnas añadidas después van aparte, en COLUMNAS.
 */

/** Tablas e índices. Se ejecutan en orden en cada arranque. */
export const TABLAS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    readtime TEXT NOT NULL DEFAULT '',
    accent TEXT NOT NULL DEFAULT 'deep',
    featured INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL DEFAULT '',
    lede TEXT NOT NULL DEFAULT '',
    sections TEXT NOT NULL DEFAULT '[]',
    image TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS normativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    col INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    code TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'lectura',
    pass_hash TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    sector TEXT NOT NULL DEFAULT '',
    service_lines TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'web',
    status TEXT NOT NULL DEFAULT 'nuevo',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    consent_ip TEXT NOT NULL DEFAULT '',
    marketing_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    consecutive TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'solicitada',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    address2 TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    postal_code TEXT NOT NULL DEFAULT '',
    waste_type TEXT NOT NULL DEFAULT '',
    estimated_quantity TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'web',
    assigned_to TEXT NOT NULL DEFAULT '',
    scheduled_at TEXT NOT NULL DEFAULT '',
    internal_notes TEXT NOT NULL DEFAULT '',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    consent_ip TEXT NOT NULL DEFAULT '',
    marketing_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user TEXT NOT NULL DEFAULT '',
    from_status TEXT NOT NULL DEFAULT '',
    to_status TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE TABLE IF NOT EXISTS zoho_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    ref_type TEXT NOT NULL DEFAULT '',
    ref_id INTEGER NOT NULL DEFAULT 0,
    payload TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pendiente',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT NOT NULL DEFAULT '',
    zoho_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS zoho_outbox_unico ON zoho_outbox (entity, ref_type, ref_id)`,

  `CREATE INDEX IF NOT EXISTS zoho_outbox_estado ON zoho_outbox (status, id)`,

  // ── Agente de cumplimiento ──────────────────────────────────────────────
  // Expedientes que vigila el agente. `numero_norm` es el número sin espacios,
  // guiones ni puntos, en mayúsculas: así "LAM-1234" y "LAM 1234" son el mismo
  // expediente al cruzarlo con lo que trae un auto.
  `CREATE TABLE IF NOT EXISTS expedientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL DEFAULT '',
    nit TEXT NOT NULL DEFAULT '',
    autoridad TEXT NOT NULL DEFAULT '',
    numero TEXT NOT NULL DEFAULT '',
    numero_norm TEXT NOT NULL DEFAULT '',
    tipo_permiso TEXT NOT NULL DEFAULT '',
    responsable TEXT NOT NULL DEFAULT '',
    responsable_email TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE INDEX IF NOT EXISTS expedientes_numero ON expedientes (numero_norm)`,

  // Cada documento que recibe el agente (un auto, una resolución), con lo que
  // la IA extrajo. `hash` evita procesar dos veces el mismo archivo.
  `CREATE TABLE IF NOT EXISTS actos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origen TEXT NOT NULL DEFAULT 'manual',
    archivo_nombre TEXT NOT NULL DEFAULT '',
    archivo_tipo TEXT NOT NULL DEFAULT '',
    hash TEXT NOT NULL DEFAULT '',
    texto TEXT NOT NULL DEFAULT '',
    fecha_notificacion TEXT NOT NULL DEFAULT '',
    expediente_id INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    error TEXT NOT NULL DEFAULT '',
    extraccion TEXT NOT NULL DEFAULT '{}',
    modelo TEXT NOT NULL DEFAULT '',
    tokens_entrada INTEGER NOT NULL DEFAULT 0,
    tokens_salida INTEGER NOT NULL DEFAULT 0,
    subido_por TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS actos_hash ON actos (hash) WHERE hash <> ''`,

  // El archivo original, aparte de `actos` para que listar actos no arrastre
  // megas de base64. Sirve para "ver documento original" y para reprocesar.
  // En la fase siguiente esto pasa a almacenamiento de archivos (Blob).
  `CREATE TABLE IF NOT EXISTS actos_archivos (
    acto_id INTEGER PRIMARY KEY,
    contenido TEXT NOT NULL DEFAULT ''
  )`,

  // Alertas para el consultor. `por_confirmar` = 1 cuando un dato crítico
  // (plazo, expediente) salió con baja confianza y hay que revisarlo contra el
  // original antes de actuar.
  `CREATE TABLE IF NOT EXISTS alertas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    acto_id INTEGER NOT NULL DEFAULT 0,
    expediente_id INTEGER NOT NULL DEFAULT 0,
    prioridad TEXT NOT NULL DEFAULT 'media',
    tipo_acto TEXT NOT NULL DEFAULT '',
    titulo TEXT NOT NULL DEFAULT '',
    que_pide TEXT NOT NULL DEFAULT '',
    norma TEXT NOT NULL DEFAULT '',
    plazo_texto TEXT NOT NULL DEFAULT '',
    plazo_dias INTEGER NOT NULL DEFAULT 0,
    plazo_tipo TEXT NOT NULL DEFAULT '',
    vence_el TEXT NOT NULL DEFAULT '',
    accion TEXT NOT NULL DEFAULT '',
    por_confirmar INTEGER NOT NULL DEFAULT 0,
    motivo_confirmar TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'abierta',
    responsable TEXT NOT NULL DEFAULT '',
    nota TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  `CREATE INDEX IF NOT EXISTS alertas_estado ON alertas (estado, vence_el)`,

  // Reglas que define el equipo técnico de Ekosolv: para cada tipo de acto,
  // qué prioridad tiene y qué acción se sugiere. `umbral_alta` sube la
  // prioridad a alta cuando quedan esos días hábiles o menos.
  `CREATE TABLE IF NOT EXISTS reglas_agente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_acto TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    prioridad TEXT NOT NULL DEFAULT 'media',
    umbral_alta INTEGER NOT NULL DEFAULT 0,
    accion TEXT NOT NULL DEFAULT '',
    activa INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT ''
  )`,

  // Ajustes sueltos de la app, una fila por clave. Hoy solo el gasto diario
  // del asesor con IA del sitio (src/lib/asesor/presupuesto.ts).
  `CREATE TABLE IF NOT EXISTS ajustes (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    actualizado TEXT NOT NULL
  )`,

  // ── Asistente con IA del panel (docs/plan-asistente.md) ─────────────────
  // Una fila por conversación: es el estado del bucle (src/lib/asistente/
  // bucle.ts). `mensajes` es el historial de la API, solo por anexión.
  `CREATE TABLE IF NOT EXISTS asistente_conversaciones (
    id TEXT PRIMARY KEY,
    usuario TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL,
    pregunta TEXT NOT NULL DEFAULT '',
    mensajes TEXT NOT NULL DEFAULT '[]',
    propuesta TEXT NOT NULL DEFAULT '',
    respuesta TEXT NOT NULL DEFAULT '',
    error TEXT NOT NULL DEFAULT '',
    turnos INTEGER NOT NULL DEFAULT 0,
    iteraciones INTEGER NOT NULL DEFAULT 0,
    costo_usd REAL NOT NULL DEFAULT 0,
    creada TEXT NOT NULL,
    actualizada TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS asistente_conv_usuario ON asistente_conversaciones (usuario, actualizada)`,

  // Una fila por llamada al modelo. Es la fuente del tope diario y de lo que
  // se le factura a Ekosolv: no se purga con las conversaciones.
  `CREATE TABLE IF NOT EXISTS asistente_consumo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    dia TEXT NOT NULL,
    usuario TEXT NOT NULL,
    conversacion TEXT NOT NULL,
    modelo TEXT NOT NULL,
    tokens_entrada INTEGER NOT NULL DEFAULT 0,
    tokens_salida INTEGER NOT NULL DEFAULT 0,
    tokens_cache_lectura INTEGER NOT NULL DEFAULT 0,
    tokens_cache_escritura INTEGER NOT NULL DEFAULT 0,
    costo_usd REAL NOT NULL DEFAULT 0
  )`,

  `CREATE INDEX IF NOT EXISTS asistente_consumo_dia ON asistente_consumo (dia, usuario)`,

  // Cada decisión sobre una propuesta del asistente: quién la pidió, quién la
  // aprobó o descartó, qué cambiaba y qué pasó. Tampoco se purga.
  `CREATE TABLE IF NOT EXISTS asistente_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    conversacion TEXT NOT NULL,
    herramienta TEXT NOT NULL,
    pidio TEXT NOT NULL,
    decidio TEXT NOT NULL,
    decision TEXT NOT NULL,
    entrada TEXT NOT NULL DEFAULT '{}',
    vista TEXT NOT NULL DEFAULT '',
    resultado TEXT NOT NULL DEFAULT '',
    ok INTEGER NOT NULL DEFAULT 0
  )`,
]

/**
 * Columnas añadidas después de la primera versión de su tabla.
 *
 * Van aparte porque `CREATE TABLE IF NOT EXISTS` no toca una tabla existente:
 * una base creada antes de que existiera `consent_at` se queda sin ella para
 * siempre si no se hace el `ALTER`. Todas son `TEXT NOT NULL DEFAULT ''`.
 */
export const COLUMNAS: readonly (readonly [tabla: string, columna: string])[] = [
  ['posts', 'image'],
  ['contacts', 'consent_at'],
  ['contacts', 'consent_version'],
  ['contacts', 'consent_ip'],
  ['contacts', 'marketing_at'],
  ['orders', 'waste_type'],
  ['orders', 'estimated_quantity'],
  ['orders', 'consent_at'],
  ['orders', 'consent_version'],
  ['orders', 'consent_ip'],
  ['orders', 'marketing_at'],
  // 'borrador' = no se publica; vacío = publicado (todo lo anterior a la
  // columna). Los borradores los crea el asistente del panel (docs/plan-asistente.md).
  ['posts', 'estado'],
  ['normativas', 'estado'],
]

/** Tablas que deben existir al terminar. Sirve para verificar tras migrar. */
export const TABLAS_ESPERADAS: readonly string[] = [
  'actos',
  'actos_archivos',
  'ajustes',
  'alertas',
  'asistente_auditoria',
  'asistente_consumo',
  'asistente_conversaciones',
  'contacts',
  'expedientes',
  'normativas',
  'order_events',
  'orders',
  'posts',
  'reglas_agente',
  'users',
  'zoho_outbox',
]
