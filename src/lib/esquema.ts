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
    assigned_to TEXT NOT NULL DEFAULT '',
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

  // ── Diagnóstico de IA por área (capacitación) ──────────────────────────
  // Una fila por respuesta a la encuesta de /ia. `datos` es la
  // respuesta completa ya validada (src/lib/diagnostico/validar.ts); `area` y
  // `nombre` van aparte para listar y filtrar sin abrir el JSON. Si la encuesta
  // está abierta vive en `ajustes` (clave 'diagnostico').
  `CREATE TABLE IF NOT EXISTS diagnostico_respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    datos TEXT NOT NULL DEFAULT '{}',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    creado TEXT NOT NULL
  )`,

  // Casos que el equipo deja en /ia para los ejercicios del taller presencial:
  // archivos y lo que hace con ellos. Los archivos viven en Vercel Blob privado
  // (src/lib/diagnostico/almacen.ts); aquí solo van sus rutas en `archivos`
  // (JSON). Se borra todo al terminar la capacitación, desde el panel. Si se
  // reciben casos vive en `ajustes` (clave 'taller_casos').
  `CREATE TABLE IF NOT EXISTS taller_casos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    contexto TEXT NOT NULL DEFAULT '',
    fuentes TEXT NOT NULL DEFAULT '',
    resultados TEXT NOT NULL DEFAULT '[]',
    privacidad TEXT NOT NULL DEFAULT '',
    archivos TEXT NOT NULL DEFAULT '[]',
    consent_at TEXT NOT NULL DEFAULT '',
    consent_version TEXT NOT NULL DEFAULT '',
    creado TEXT NOT NULL
  )`,

  // ── Propuesta comercial en línea (/propuesta) ───────────────────────────
  // Una fila por pregunta del gerente al chat de la propuesta, con la
  // respuesta de la IA. `a_mike` = 1 cuando la IA no la pudo responder o era
  // negociación (llega también por correo).
  `CREATE TABLE IF NOT EXISTS propuesta_preguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesion TEXT NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL DEFAULT '',
    a_mike INTEGER NOT NULL DEFAULT 0,
    motivo TEXT NOT NULL DEFAULT '',
    costo_usd REAL NOT NULL DEFAULT 0,
    creado TEXT NOT NULL
  )`,

  // El plan que el gerente marca como elegido al final de la página. No es
  // un contrato: es el aviso para que Mike formalice.
  `CREATE TABLE IF NOT EXISTS propuesta_elecciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan TEXT NOT NULL DEFAULT '',
    capacitacion TEXT NOT NULL DEFAULT '',
    nombre TEXT NOT NULL DEFAULT '',
    cargo TEXT NOT NULL DEFAULT '',
    comentario TEXT NOT NULL DEFAULT '',
    calculo TEXT NOT NULL DEFAULT '{}',
    creado TEXT NOT NULL
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

  // ── Talento humano (docs/plan-talento-humano.md) ────────────────────────
  // Todo cuelga de users.id: los empleados son las mismas cuentas del panel.
  // Sin datos de salud: de los exámenes y las incapacidades solo se guardan
  // fechas y el enlace al soporte. El salario es opcional (NULL = no se lleva).
  `CREATE TABLE IF NOT EXISTS th_empleados (
    usuario_id INTEGER PRIMARY KEY,
    documento TEXT NOT NULL DEFAULT '',
    cargo_id INTEGER,
    area TEXT NOT NULL DEFAULT '',
    jefe TEXT NOT NULL DEFAULT '',
    tipo_contrato TEXT NOT NULL DEFAULT '',
    fecha_ingreso TEXT NOT NULL DEFAULT '',
    fecha_fin_contrato TEXT NOT NULL DEFAULT '',
    fecha_retiro TEXT NOT NULL DEFAULT '',
    fecha_nacimiento TEXT NOT NULL DEFAULT '',
    salario INTEGER,
    telefono TEXT NOT NULL DEFAULT '',
    correo_personal TEXT NOT NULL DEFAULT '',
    emergencia_nombre TEXT NOT NULL DEFAULT '',
    emergencia_telefono TEXT NOT NULL DEFAULT '',
    eps TEXT NOT NULL DEFAULT '',
    pension TEXT NOT NULL DEFAULT '',
    cesantias TEXT NOT NULL DEFAULT '',
    arl TEXT NOT NULL DEFAULT '',
    caja TEXT NOT NULL DEFAULT '',
    vacaciones_ajuste REAL NOT NULL DEFAULT 0,
    notas TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // Criterios de evaluación: JSON [{ id, nombre, descripcion }].
  `CREATE TABLE IF NOT EXISTS th_cargos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL DEFAULT '',
    criterios TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // Solo el enlace (Drive, WorkDrive): el panel no guarda archivos de RR.HH.
  `CREATE TABLE IF NOT EXISTS th_documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    enlace TEXT NOT NULL DEFAULT '',
    fecha_expedicion TEXT NOT NULL DEFAULT '',
    fecha_vencimiento TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS th_documentos_usuario ON th_documentos (usuario_id)`,

  // Vacaciones, permisos, licencias e incapacidades. Los días se calculan al
  // guardar y quedan fijos, para que cambiar el ajuste del sábado no reescriba
  // el pasado.
  `CREATE TABLE IF NOT EXISTS th_novedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    dias_habiles REAL NOT NULL DEFAULT 0,
    dias_calendario INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'solicitada',
    motivo TEXT NOT NULL DEFAULT '',
    enlace TEXT NOT NULL DEFAULT '',
    decidido_por TEXT NOT NULL DEFAULT '',
    decidido_at TEXT NOT NULL DEFAULT '',
    creado_por TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS th_novedades_usuario ON th_novedades (usuario_id, desde)`,

  // capacitacion_id enlaza los talleres de IA de /ia (src/lib/capacitacion.ts).
  `CREATE TABLE IF NOT EXISTS th_cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'interno',
    proveedor TEXT NOT NULL DEFAULT '',
    horas REAL NOT NULL DEFAULT 0,
    vigencia_meses INTEGER NOT NULL DEFAULT 0,
    capacitacion_id TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL DEFAULT '',
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS th_formaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    vence_el TEXT NOT NULL DEFAULT '',
    enlace TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS th_formaciones_usuario ON th_formaciones (usuario_id)`,

  // calificaciones: copia de los criterios del cargo al momento de evaluar,
  // JSON [{ id, nombre, nota, comentario }], para que editar el cargo después
  // no cambie evaluaciones ya cerradas.
  `CREATE TABLE IF NOT EXISTS th_evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cargo TEXT NOT NULL DEFAULT '',
    periodo TEXT NOT NULL DEFAULT '',
    fecha TEXT NOT NULL,
    evaluador TEXT NOT NULL DEFAULT '',
    calificaciones TEXT NOT NULL DEFAULT '[]',
    promedio REAL NOT NULL DEFAULT 0,
    fortalezas TEXT NOT NULL DEFAULT '',
    mejoras TEXT NOT NULL DEFAULT '',
    metas TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'borrador',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS th_evaluaciones_usuario ON th_evaluaciones (usuario_id, fecha)`,

  // ── Academia de IA (/academia, /admin/academia; docs/plan-academia.md) ──
  // Quién estudia y en qué área. La ruta de cada persona es la capacitación
  // general más el taller de su área (src/lib/capacitacion.ts).
  `CREATE TABLE IF NOT EXISTS ac_inscripciones (
    usuario_id INTEGER PRIMARY KEY,
    area TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // modulo: 'general' o el id de un área. prompts y recursos son JSON
  // [{ titulo, texto }] y [{ titulo, href }]. Si practica_consigna no está
  // vacía, la lección trae el revisor de instrucciones con IA. semilla marca
  // las lecciones creadas desde el programa, para no sembrarlas dos veces.
  `CREATE TABLE IF NOT EXISTS ac_lecciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modulo TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    titulo TEXT NOT NULL,
    resumen TEXT NOT NULL DEFAULT '',
    contenido TEXT NOT NULL DEFAULT '',
    prompts TEXT NOT NULL DEFAULT '[]',
    recursos TEXT NOT NULL DEFAULT '[]',
    ejercicio TEXT NOT NULL DEFAULT '',
    entregable TEXT NOT NULL DEFAULT '',
    practica_consigna TEXT NOT NULL DEFAULT '',
    minutos INTEGER NOT NULL DEFAULT 0,
    publicada INTEGER NOT NULL DEFAULT 0,
    semilla TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS ac_progreso (
    usuario_id INTEGER NOT NULL,
    leccion_id INTEGER NOT NULL,
    vista_at TEXT NOT NULL,
    PRIMARY KEY (usuario_id, leccion_id)
  )`,

  // Una entrega por persona y lección; al reenviar se reemplaza y vuelve a
  // 'enviada'. estado: enviada | aprobada | devuelta.
  `CREATE TABLE IF NOT EXISTS ac_entregas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    leccion_id INTEGER NOT NULL,
    texto TEXT NOT NULL DEFAULT '',
    enlace TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'enviada',
    comentario TEXT NOT NULL DEFAULT '',
    revisado_por TEXT NOT NULL DEFAULT '',
    revisado_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (usuario_id, leccion_id)
  )`,

  // Historial del revisor de instrucciones. revision es el JSON que devolvió
  // la IA (criterios, resumen y versión mejorada).
  `CREATE TABLE IF NOT EXISTS ac_practicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    leccion_id INTEGER NOT NULL,
    instruccion TEXT NOT NULL,
    respuesta TEXT NOT NULL DEFAULT '',
    revision TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS ac_practicas_usuario ON ac_practicas (usuario_id, created_at)`,

  // Bloques de los sábados. Un sábado puede tener varios bloques (por ejemplo
  // Operaciones y luego Logística). modulos: JSON con los módulos que asisten.
  `CREATE TABLE IF NOT EXISTS ac_sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL DEFAULT '',
    horas REAL NOT NULL DEFAULT 0,
    modulos TEXT NOT NULL DEFAULT '[]',
    lugar TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS ac_asistencia (
    sesion_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (sesion_id, usuario_id)
  )`,

  // Copia de los datos al emitir: cambiar después el nombre o las horas no
  // altera un certificado ya entregado. La verificación pública es
  // /verificar/<codigo>.
  // Capacitaciones presentadas desde el sitio (/academia/taller/<n>,
  // src/lib/talleres). Escena activa y pregunta abierta en los celulares.
  `CREATE TABLE IF NOT EXISTS ac_taller_estado (
    taller INTEGER PRIMARY KEY,
    escena TEXT NOT NULL DEFAULT '',
    interaccion TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  )`,

  // Una respuesta por persona y pregunta: al cambiar el voto se reemplaza.
  `CREATE TABLE IF NOT EXISTS ac_taller_respuestas (
    taller INTEGER NOT NULL,
    interaccion TEXT NOT NULL,
    pregunta TEXT NOT NULL,
    usuario_id INTEGER NOT NULL,
    valor TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (taller, interaccion, pregunta, usuario_id)
  )`,

  // Quién se registró en la sala desde el QR (nombre, cargo y área, sin
  // cuenta ni contraseña). Una fila por persona, capacitación y día; clave es
  // el nombre completo sin tildes, para reconocer a quien se registra dos
  // veces. usuario_id es la cuenta de la academia con el mismo nombre, si hay
  // (0 si no): con ella se marca la asistencia que cuenta para el certificado.
  // En ac_taller_respuestas y ac_taller_sala, usuario_id es el id de esta tabla.
  `CREATE TABLE IF NOT EXISTS ac_taller_asistentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taller INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    cargo TEXT NOT NULL,
    area TEXT NOT NULL,
    clave TEXT NOT NULL,
    usuario_id INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE (taller, fecha, clave)
  )`,

  // Instrucciones que revisa la IA desde la sala durante la práctica guiada
  // (asistente_id es el id de ac_taller_asistentes). Sirve para el límite
  // diario por persona y para mostrar casos en el proyector.
  `CREATE TABLE IF NOT EXISTS ac_taller_practicas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taller INTEGER NOT NULL,
    asistente_id INTEGER NOT NULL,
    instruccion TEXT NOT NULL,
    revision TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,

  // Preguntas que los participantes le envían a quien dicta desde el celular.
  // escena: la que estaba en pantalla al enviarla. respondida: 1 cuando
  // quien dicta la marca en la vista de presentador.
  `CREATE TABLE IF NOT EXISTS ac_taller_preguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taller INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    asistente_id INTEGER NOT NULL,
    escena TEXT NOT NULL,
    texto TEXT NOT NULL,
    respondida INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  // Quién está en la sala (celular abierto en /academia/sala).
  `CREATE TABLE IF NOT EXISTS ac_taller_sala (
    taller INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    visto_at TEXT NOT NULL,
    PRIMARY KEY (taller, usuario_id)
  )`,

  // Código de dos números que muestra el celular para vincular el PC del
  // participante (/pc). Vence en minutos y se borra al usarlo.
  `CREATE TABLE IF NOT EXISTS ac_taller_codigos_pc (
    taller INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    asistente_id INTEGER NOT NULL,
    vence_at TEXT NOT NULL,
    PRIMARY KEY (taller, codigo)
  )`,

  // Formulario de cierre de cada capacitación (/academia/sala/opinion), uno
  // por área. No es anónimo: lo ven solo admin y gerencia en el panel. Una
  // fila por asistente (si lo vuelve a enviar, se actualiza). respuestas es
  // JSON { id de campo: texto }. resolucion y resuelta_at llevan la
  // trazabilidad de cómo se resolvió la duda.
  `CREATE TABLE IF NOT EXISTS ac_taller_opiniones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taller INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    asistente_id INTEGER NOT NULL UNIQUE,
    area TEXT NOT NULL,
    respuestas TEXT NOT NULL,
    resolucion TEXT NOT NULL DEFAULT '',
    resuelta_at TEXT NOT NULL DEFAULT '',
    resuelta_por TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // Práctica con casos reales (capacitación 2, src/lib/talleres/turnos.ts):
  // fila de acompañamiento de quien dicta (15 min por persona). estado es
  // espera | ahora | hecho; inicio es la marca (ms) de cuando empezó.
  `CREATE TABLE IF NOT EXISTS ac_taller_turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taller INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    asistente_id INTEGER NOT NULL,
    orden INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'espera',
    inicio TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    UNIQUE (taller, fecha, asistente_id)
  )`,

  // Avance de cada persona en la práctica: el caso que trajo (una línea) y
  // los retos que marcó como hechos (JSON con los ids de retos2.ts).
  `CREATE TABLE IF NOT EXISTS ac_taller_avance (
    taller INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    asistente_id INTEGER NOT NULL,
    caso TEXT NOT NULL DEFAULT '',
    retos TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (taller, fecha, asistente_id)
  )`,

  `CREATE TABLE IF NOT EXISTS ac_certificados (
    codigo TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    area TEXT NOT NULL,
    horas REAL NOT NULL DEFAULT 0,
    emitido_at TEXT NOT NULL,
    emitido_por TEXT NOT NULL DEFAULT '',
    revocado_at TEXT NOT NULL DEFAULT ''
  )`,

  // Bitácora: solo se agregan filas, nunca se editan ni se borran. Guarda lo
  // que las demás tablas reemplazan (el voto anterior, el correo con que se
  // registró alguien, la escena en que iba la presentación) y lo que ninguna
  // guardaba (inicios de sesión, entradas a la sala, PC vinculados). Así nada
  // de lo que pasa en una capacitación se pierde. Ver src/lib/bitacora.ts.
  `CREATE TABLE IF NOT EXISTS bitacora (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    quien TEXT NOT NULL DEFAULT '',
    taller INTEGER NOT NULL DEFAULT 0,
    detalle TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS bitacora_tipo ON bitacora (tipo, created_at)`,
  `CREATE INDEX IF NOT EXISTS bitacora_taller ON bitacora (taller, created_at)`,

  // ── Finanzas: calendario tributario vigilado y control antes de pagar ────
  // (src/lib/finanzas/). El sistema NO entra a portales ni guarda claves:
  // prepara, verifica y avisa. Montos en pesos enteros.
  //
  // Ajustes del módulo en clave/valor (NIT, responsabilidades, tope de IA).
  `CREATE TABLE IF NOT EXISTS fin_config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`,
  // Cada vencimiento. `clave` (p. ej. 'retefuente:2026-11') evita sembrar dos
  // veces la misma obligación; las manuales y las de requerimientos llevan
  // una clave propia. `estado` sigue src/lib/finanzas/estados.ts.
  `CREATE TABLE IF NOT EXISTS fin_obligaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL DEFAULT '',
    concepto TEXT NOT NULL DEFAULT '',
    entidad TEXT NOT NULL DEFAULT '',
    periodo TEXT NOT NULL DEFAULT '',
    formulario TEXT NOT NULL DEFAULT '',
    vence TEXT NOT NULL DEFAULT '',
    con_pago INTEGER NOT NULL DEFAULT 1,
    responsable_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    valor_borrador INTEGER,
    fuente TEXT NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS fin_obligaciones_vence ON fin_obligaciones (vence)`,
  // Soportes en Vercel Blob privado (prefijo finanzas/). Nunca se borran solos.
  `CREATE TABLE IF NOT EXISTS fin_soportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obligacion_id INTEGER NOT NULL,
    tipo TEXT NOT NULL DEFAULT '',
    nombre TEXT NOT NULL DEFAULT '',
    ruta TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL DEFAULT '',
    tamano INTEGER NOT NULL DEFAULT 0,
    subido_por TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS fin_soportes_obligacion ON fin_soportes (obligacion_id)`,
  // Bitácora del módulo: cambios de estado, aprobaciones, ajustes.
  `CREATE TABLE IF NOT EXISTS fin_eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obligacion_id INTEGER,
    pago_id INTEGER,
    accion TEXT NOT NULL DEFAULT '',
    detalle TEXT NOT NULL DEFAULT '',
    usuario TEXT NOT NULL DEFAULT '',
    rol TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS fin_eventos_obligacion ON fin_eventos (obligacion_id, created_at)`,
  // Cuentas de origen autorizadas. Solo los últimos 4 dígitos: el número
  // completo no hace falta para verificar y no se guarda.
  `CREATE TABLE IF NOT EXISTS fin_cuentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alias TEXT NOT NULL DEFAULT '',
    banco TEXT NOT NULL DEFAULT '',
    tipo TEXT NOT NULL DEFAULT '',
    ultimos TEXT NOT NULL DEFAULT '',
    activa INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // Entidades a las que se paga y cómo se paga a cada una (medio, formulario
  // de pago, NIT de la entidad para comparar en la pantalla del banco).
  `CREATE TABLE IF NOT EXISTS fin_entidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    nit TEXT NOT NULL DEFAULT '',
    medio TEXT NOT NULL DEFAULT '',
    formulario_pago TEXT NOT NULL DEFAULT '',
    activa INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // Pagos preparados. El control antes de pagar se recalcula siempre; aquí
  // queda el resultado al aprobar, quién preparó y quién aprobó.
  `CREATE TABLE IF NOT EXISTS fin_pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obligacion_id INTEGER NOT NULL,
    valor INTEGER NOT NULL DEFAULT 0,
    entidad TEXT NOT NULL DEFAULT '',
    referencia TEXT NOT NULL DEFAULT '',
    cuenta_id INTEGER,
    estado TEXT NOT NULL DEFAULT 'por_aprobar',
    preparado_por TEXT NOT NULL DEFAULT '',
    preparado_at TEXT NOT NULL DEFAULT '',
    aprobado_por TEXT NOT NULL DEFAULT '',
    aprobado_at TEXT NOT NULL DEFAULT '',
    motivo_rechazo TEXT NOT NULL DEFAULT '',
    chequeos TEXT NOT NULL DEFAULT '[]',
    verificacion TEXT NOT NULL DEFAULT '[]',
    pagado_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS fin_pagos_obligacion ON fin_pagos (obligacion_id)`,
  // Destinatarios de los avisos. usuario_id = correo de un usuario del panel
  // (activo = 0 lo saca de los avisos); sin usuario_id = correo agregado.
  `CREATE TABLE IF NOT EXISTS fin_destinatarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo TEXT NOT NULL DEFAULT 'finanzas',
    usuario_id INTEGER,
    correo TEXT NOT NULL DEFAULT '',
    activo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // Avisos enviados: uno por obligación y umbral (15, 7, 3, 1 días hábiles)
  // o por resumen (semanal:AAAA-MM-DD, mensual:AAAA-MM). Evita repetir.
  `CREATE TABLE IF NOT EXISTS fin_avisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    obligacion_id INTEGER,
    umbral INTEGER,
    escalado INTEGER NOT NULL DEFAULT 0,
    destinatarios TEXT NOT NULL DEFAULT '',
    enviado INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  // Documentos leídos con IA: lo extraído, las diferencias con lo esperado y
  // lo que costó (para el tope mensual).
  `CREATE TABLE IF NOT EXISTS fin_documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    obligacion_id INTEGER,
    tipo TEXT NOT NULL DEFAULT '',
    nombre TEXT NOT NULL DEFAULT '',
    ruta TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL DEFAULT '',
    hash TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'pendiente',
    extraccion TEXT NOT NULL DEFAULT '',
    diferencias TEXT NOT NULL DEFAULT '[]',
    error TEXT NOT NULL DEFAULT '',
    modelo TEXT NOT NULL DEFAULT '',
    costo_usd REAL NOT NULL DEFAULT 0,
    mes TEXT NOT NULL DEFAULT '',
    creada_obligacion_id INTEGER,
    subido_por TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
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
  // Persona del equipo que atiende el mensaje (texto libre, como en las órdenes).
  ['contacts', 'assigned_to'],
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
  // Sala de la capacitación: el enlace de entrada llega a este correo, y
  // después el material. enlace_at frena reenvíos seguidos.
  ['ac_taller_asistentes', 'correo'],
  ['ac_taller_asistentes', 'enlace_at'],
  // Respuesta que la IA le prepara a quien dicta para cada pregunta de la
  // sala (src/lib/talleres/motorIA.ts). Vacía = todavía no se ha preparado.
  ['ac_taller_preguntas', 'respuesta_ia'],
  // Paso de la escena en curso: lo siguen el celular (pasos guiados) y el PC vinculado.
  ['ac_taller_estado', 'paso'],
  // Aviso "Empezamos en 00:00" que lanza el presentador (JSON {fin, ms}, vacío si no hay).
  ['ac_taller_estado', 'aviso'],
  // Movimientos entre presentador y proyector en equipos distintos: `mov` es
  // la marca (ms) del último cambio de escena o paso, para no pisar uno más
  // nuevo con uno viejo; `orden` es el último botón del presentador (JSON {id, nombre}).
  ['ac_taller_estado', 'mov'],
  ['ac_taller_estado', 'orden'],
  // Marca (ms del servidor) de cuando se llegó a la escena actual: con ella
  // todos los equipos muestran la misma cuenta regresiva (descanso, práctica).
  ['ac_taller_estado', 'escena_desde'],
  // Correo con el enlace al banco de recursos de su área (docs/plan-recursos.md):
  // cuándo se le envió. Vacío = pendiente.
  ['ac_taller_asistentes', 'recursos_at'],
]

/** Tablas que deben existir al terminar. Sirve para verificar tras migrar. */
export const TABLAS_ESPERADAS: readonly string[] = [
  'ac_asistencia',
  'ac_certificados',
  'ac_entregas',
  'ac_inscripciones',
  'ac_lecciones',
  'ac_practicas',
  'ac_progreso',
  'ac_sesiones',
  'ac_taller_asistentes',
  'ac_taller_avance',
  'ac_taller_codigos_pc',
  'ac_taller_estado',
  'ac_taller_opiniones',
  'ac_taller_practicas',
  'ac_taller_preguntas',
  'ac_taller_respuestas',
  'ac_taller_sala',
  'ac_taller_turnos',
  'actos',
  'actos_archivos',
  'ajustes',
  'alertas',
  'asistente_auditoria',
  'asistente_consumo',
  'asistente_conversaciones',
  'contacts',
  'diagnostico_respuestas',
  'expedientes',
  'fin_avisos',
  'fin_config',
  'fin_cuentas',
  'fin_destinatarios',
  'fin_documentos',
  'fin_entidades',
  'fin_eventos',
  'fin_obligaciones',
  'fin_pagos',
  'fin_soportes',
  'normativas',
  'order_events',
  'orders',
  'posts',
  'propuesta_elecciones',
  'propuesta_preguntas',
  'reglas_agente',
  'taller_casos',
  'th_cargos',
  'th_cursos',
  'th_documentos',
  'th_empleados',
  'th_evaluaciones',
  'th_formaciones',
  'th_novedades',
  'users',
  'zoho_outbox',
]
