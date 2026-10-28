# Pendientes

Lista viva de cosas que faltan por resolver en el sitio: activos por entregar (documentos, fotos, video), deuda técnica y decisiones abiertas. Se va apilando a medida que aparecen.

## Activos por entregar

- [ ] **Licencias ambientales (PDF)** — para mostrar certificaciones/avales reales en el footer (idea tomada de ATICA). Nadie las ha subido a `public/` todavía.
- [ ] **Testimonios reales de clientes** — con autorización de uso, para reemplazar/reforzar `/casos`.
- [ ] **Logos de clientes reales** — con autorización de marca, para reponer la sección "Clientes" retirada (ver `docs/plan-competitivo-lito.md`, Fase 3).
- [ ] **URLs de los perfiles de redes sociales** — `src/lib/redes.ts` tiene los tres (LinkedIn, Instagram, Facebook) con `activo: false` y URL vacía. Hasta que alguien pegue las URLs reales y las active, la columna "Síguenos" del footer no se emite en producción. Ver `docs/plan-redes-sociales.md`.
- [ ] **Imágenes 1200×630 de los artículos del blog** — la columna `posts.image` ya existe y el panel marca "Sin imagen" los que faltan. Sin ellas, todo artículo compartido en LinkedIn o WhatsApp muestra la misma portada genérica, y la difusión a Instagram (Fase 1) es imposible porque exige imagen.

## Bloqueadores en producción

- [ ] **No hay base de datos en producción** — el proyecto en Vercel no tiene `DATABASE_URL` ni `DATABASE_AUTH_TOKEN`, y el fallback `file:./data/cms.db` (`src/lib/users.ts:36`, `src/lib/cms.ts`) no puede abrirse en la función: el archivo no va en el bundle y el filesystem es de solo lectura. Verificado el 2026-08-03: `/api/admin/recolecciones`, `/api/admin/contactos` y `/api/admin/users` devuelven 500 `ConnectionFailed(... cms.db: 14)`. Se entra al panel pero ninguna pestaña de datos carga. Hay que provisionar libsql/Turso y migrar el esquema.

  No es solo el panel: `POST /api/recolecciones` y `POST /api/contacto` escriben en esa misma base **antes** de responder, así que hoy un visitante que llene el formulario recibe un 500 y **su solicitud se pierde entera**. Nada se guarda, nada se encola para Zoho, nadie recibe el aviso. **Bloquea de hecho casi todo lo demás de este archivo**: las imágenes del blog, el flujo editorial y los avisos por correo pasan todos por esta base.
- [ ] **Quitar la credencial hardcodeada del login** — `src/lib/users.ts:151-152` tiene usuario y contraseña en texto plano, comprobados antes de tocar la base. Es un parche **deliberado y temporal** para la fase de pruebas: sin base no hay otra forma de entrar, y el destino es que toda la autenticación vaya contra la base. Sale junto con el punto anterior. Al removerla hay que **rotar también la contraseña**, porque el valor ya está en el historial de git y el repo es público (`AUDITORIA.md`, hallazgos 8 y 10).

## Decisiones abiertas

- [ ] **Dominio definitivo del sitio** — `src/lib/site.ts` asume `ekosolv.com` pero la gerencia no ha decidido. Bloquea además el provisionamiento de Resend (el Marketplace exige un dominio de envío verificable por DNS).
- [ ] **¿El plan de Zoho Social contratado incluye la API de publicación?** — no viene en los planes de entrada. Es el bloqueador principal de la Fase 1 de `docs/plan-redes-sociales.md`; si no lo incluye, la difusión automática no se construye y el equipo publica a mano desde Zoho Social.
- [ ] **Correos internos para los avisos** — a qué buzones de Ekosolv deben llegar las nuevas recolecciones y contactos (van en `NOTIFY_EMAIL`, no en el código).

## Zoho (CRM y Books)

El código está construido y probado end-to-end en local (ver `docs/plan-zoho.md` §2). El diseño es que cada mensaje de contacto y cada solicitud de recolección deje una fila pendiente en `zoho_outbox`, para que el día que existan las credenciales se drene la bandeja y entre todo lo recibido en el intervalo, sin digitar nada a mano.

**Ojo con un supuesto que no se cumple todavía:** eso solo pasa donde hay base de datos, o sea en local. En producción no hay, así que **hoy no se está acumulando nada** y lo que llegue por el sitio se pierde. La red de seguridad de la bandeja empieza a funcionar el día que se provisione Turso, no antes. Ver "Bloqueadores en producción".

### Bloquea la conexión (le toca a Mike / gerencia)

- [ ] **Crear el self-client en Zoho API Console** — https://api-console.zoho.com, con los scopes mínimos (`ZohoCRM.modules.leads.CREATE,READ`; nada de acceso total a la cuenta). El procedimiento completo, incluido el `curl` para canjear el código por el refresh token, está en `.env.example`.
- [ ] **Confirmar el datacenter de la cuenta** (`ZOHO_DC`) — `com`, `eu`, `in`, `com.au`... Una cuenta creada en `.com` no responde en `.eu`, así que equivocarse aquí se ve como credenciales inválidas y hace perder una tarde.
- [ ] **Cargar las cuatro variables en Vercel** — `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_DC` (`vercel env add`).
- [ ] **Primer drenaje observado** — `POST /api/admin/zoho {"action":"sync"}` y verificar en Zoho que los leads acumulados llegaron completos. Se dejó manual a propósito: el primer contacto real con Zoho hay que verlo ocurrir, no enterarse por un cron.

### Depende de comercial

- [ ] **Confirmar el mapeo de campos** — si Ekosolv tiene campos personalizados en Leads, se consultan con `GET /crm/v8/settings/fields?module=Leads` y se ajustan en `src/lib/zohoMap.ts`, que es el único archivo a tocar para esto. Mientras tanto, sector, líneas de interés, tipo de residuo y consecutivo se acumulan en `Description`: no se pierde información y es reversible.

### Depende de administración

- [ ] **Definir el alcance de Zoho Books** — la infraestructura de autenticación ya está lista (`booksFetch()` resuelve token y `organization_id`) y la bandeja acepta las entidades `books_contact` y `books_invoice`, pero falta el mapeo. Las tres preguntas abiertas están al final de `src/lib/zohoMap.ts`: ¿la factura se emite desde Books o el cliente tiene su propio flujo?, ¿qué ítem del catálogo corresponde a una recolección RAEE y se cobra por kilo, por visita o por contrato?, ¿el certificado se adjunta a la factura o vive solo en el panel? No se implementó nada porque sería adivinar sobre plata.
- [ ] **`ZOHO_BOOKS_ORG_ID`** — sale de Books → Settings → Organizations. Solo hace falta cuando se aborde lo anterior.

### Queda por construir (deuda del propio módulo)

- [ ] **Automatizar el drenaje** — cron de Vercel cada 15 minutos contra `/api/admin/zoho`, o `syncPending()` diferido tras cada envío. Solo después de validar el primer drenaje manual.
- [ ] **UI de la bandeja en el panel** — hoy `zoho_outbox` se opera con `curl` contra `/api/admin/zoho` (estado, reintentar, descartar). Falta la pestaña en `/admin` para que no dependa de alguien con terminal.
- [ ] **Cierre de orden → Zoho** — hoy solo se empuja el lead al recibir la solicitud. Actualizar el Deal con kilos, fecha y link al certificado cuando la orden pasa a `certificada`/`cerrada` sigue siendo §3.1 del plan, sin implementar.
- [ ] **Zoho → web** — el cache de cuentas/contactos (`zoho_accounts`) y el estado comercial visible en el panel son §3.2 del plan. Nada de eso existe todavía; se decidió no tocarlo hasta que el flujo de ida esté validado en producción.

## Deuda técnica

- [ ] **Activar los avisos por email** — el código está listo y probado (`src/lib/email.ts`, conectado a `/api/recolecciones` y `/api/contacto`), pero no envía nada hasta que existan `RESEND_API_KEY`, `NOTIFY_FROM` y `NOTIFY_EMAIL`. Depende de las dos decisiones de arriba.
- [ ] **3 vulnerabilidades de dependencias sin resolver** (high) — todas de la misma cadena: `path-to-regexp` vía `@vercel/routing-utils` vía `@astrojs/vercel`. **No tiene arreglo hacia adelante**: el proyecto ya está en `@astrojs/vercel@11` y `--force` propone *bajar* a la 8.0.4. Hay que esperar la corrección aguas arriba y revisar cada tanto. El vector es el enrutado de la plataforma, no código propio. `npm audit fix` ya se corrió el 2026-08-03 y cerró las otras tres (`brace-expansion`, `fast-uri`, `tar`). Ver `AUDITORIA.md` hallazgo 3.
- [ ] **`audit_log` transversal** — M7 del plan lo pedía; hoy solo existe `order_events` (auditoría de órdenes), no de contenido ni de usuarios.
- [ ] **La tabla `posts` no tiene estado de borrador** (`src/lib/cms.ts:56-68`): no hay columna `status`/`draft`, así que todo lo que entra al CMS queda publicado. Por eso los borradores de blog viven en `docs/borradores/` como archivos, no en la base. Bloquea tener un flujo real de revisión editorial.
- [ ] **La tabla `posts` no tiene columna de idioma** → la paridad ES/EN del blog no está soportada. `src/pages/en/blog/index.astro` lee el JSON estático `src/data/blog-posts.json` y enlaza a los artículos en español, etiquetados "ES ·". No es que falte traducir: no hay dónde guardar la traducción.
- [ ] **`seedIfEmpty()` solo siembra si la tabla está vacía** (`src/lib/cms.ts:116`) — agregar un post a `src/data/blog-posts.json` no lo publica en una base ya sembrada; hay que cargarlo por `/admin`. Conviene documentarlo o dar un comando de sincronización, porque invita al error.
- [x] ~~`AUDITORIA.md` hallazgo #7 hay que reescribirlo, no cerrarlo~~ — hecho el 2026-08-03. El #7 quedó cerrado sobre el hash (PBKDF2-SHA256 con salt por usuario) y la credencial en texto plano se separó como hallazgo 8, que es lo que sigue abierto. Se agregó además el hallazgo 9 por la base de producción.

## Cumplimiento normativo (Ley 1581 de 2012)

Implementado el 2026-08-03: casilla de autorización en los cuatro formularios,
validación en servidor en `/api/contacto` y `/api/recolecciones`, prueba de la
autorización en base (`consent_at`, `consent_version`, `consent_ip`), y las
páginas de política de tratamiento, términos de servicio y política de cookies
en español e inglés. Textos centralizados en `src/lib/legal.ts`.

Lo que falta y no se puede resolver desde el código:

- [ ] **Revisión jurídica de los tres documentos** — están redactados sobre el marco
  legal aplicable y sobre lo que el código hace de verdad, pero los redactó el
  equipo técnico, no un abogado. Antes de publicar en el dominio definitivo deben
  pasar por el área jurídica de Ekosolv, en especial los plazos de conservación
  del numeral 10 de la política y las obligaciones del cliente en los términos.
- [ ] **Correo de atención al titular** — hoy `RESPONSABLE.correo` en
  `src/lib/legal.ts` apunta a `info@ekosolv.com`, que es el único buzón
  verificado. Lo correcto es uno dedicado (`protecciondedatos@ekosolv.com` o
  similar) con alguien responsable de responder en los plazos legales: 10 días
  hábiles para consultas, 15 para reclamos.
- [ ] **Inscripción en el RNBD ante la SIC** — obligatoria para sociedades con
  activos totales superiores a 100.000 UVT. Hay que mirar los estados financieros
  de Ekosolv para saber si aplica. Si aplica y no está inscrita, es incumplimiento
  independiente de todo lo demás.
- [ ] **Manual interno de políticas y procedimientos** — documento interno, no va
  en el sitio, pero la SIC lo pide en inspección. Falta redactarlo y que la
  gerencia lo adopte formalmente.
- [ ] **Código de ética** — es el único enlace del footer que sigue sin documento
  (`LEGAL_PATHS.*.etica === null`). Es un documento de la compañía y no podemos
  redactarlo por ella.
- [ ] **Cláusulas de transferencia internacional con los encargados** — Zoho,
  Resend, Vercel y Turso procesan en Estados Unidos e India, y ninguno de los dos
  países está en la lista de nivel adecuado de la Circular Externa 005 de 2017 de
  la SIC. La autorización del titular ya cubre la transferencia, que es la vía más
  simple, pero conviene revisar los DPA de cada proveedor y archivarlos.
- [ ] **Migrar los datos capturados antes de esta fecha** — los registros
  anteriores quedaron con `consent_at` vacío, porque se recolectaron sin pedir
  autorización. Si esa base se va a seguir usando para contacto comercial, hay que
  pedir autorización retroactiva a esos titulares o suprimir los registros.

## Agente de cumplimiento

La Fase 1 está construida y probada de punta a punta con base temporal e IA simulada (2026-10-21): subir un acto en `/admin/cumplimiento`, leerlo con Claude, cruzarlo con la tabla de expedientes, calcular el vencimiento en días hábiles con festivos de Colombia y dejar la alerta. Código en `src/lib/agente/`, API en `src/pages/api/admin/cumplimiento/`. Sin `ANTHROPIC_API_KEY` el agente no falla: los actos quedan como "esperando clave" y se procesan después desde Historial → Procesar pendientes.

### Para activarlo (le toca a Mike)

- [ ] **Clave de la API de Anthropic en local y en Vercel**: `ANTHROPIC_API_KEY` en `.env.local` y `vercel env add ANTHROPIC_API_KEY`. Opcional: `AGENTE_MODELO` (por defecto `claude-sonnet-5-5`).
- [ ] **Primera prueba con un auto real**, con los datos del cliente tapados. Es la primera lectura con costo y la que valida la calidad de la extracción; hasta ahora solo se probó con respuestas simuladas.
- [ ] **Revisar las 9 reglas iniciales con el equipo técnico de Ekosolv** (prioridad, umbral y acción por tipo de acto). Están en `src/lib/agente/reglas.ts` y se editan desde la pestaña Reglas.

### Depende de Ekosolv

- [ ] **Tabla de expedientes**: cliente, NIT, autoridad, número y consultor responsable de cada expediente a vigilar (hasta 50). Sin ella el agente no sabe de quién es cada auto.
- [ ] **Buzón de correo para las notificaciones** de los clientes, y **cláusula de autorización** en los contratos de Ekosolv para recibirlas ahí. Es la fuente principal de la Fase 2.

### Queda por construir

- [ ] **Fase 2: leer el buzón de notificaciones**, para que los autos lleguen solos y no haya que subirlos a mano.
- [ ] **Fase 3: vencimientos y avisos por correo** a 60, 30 y 7 días (Resend), y aviso al responsable cuando entra una alerta alta.
- [ ] **Fase 4: gacetas y boletines públicos** (ANLA y CAR) y normativa nueva. Cobertura parcial: cada autoridad publica distinto.
- [ ] **Fase 5: revisión de documentos** (ICA, PMA, permisos) frente a la norma, con el límite de 10 al mes.
- [ ] **Batch API** para bajar a la mitad el costo de la IA. Es requisito para no perder plata en el plan de 80 propuestas.
- [ ] **OCR antes de la IA** para autos escaneados: mandarlos como imagen gasta de 3 a 5 veces más tokens.
- [ ] **Presupuesto mensual por función** (propuestas, agente, chat) y un indicador del costo real de IA frente a lo cobrado, con alerta al 70%.
- [ ] **Archivos a Vercel Blob**: hoy el documento original se guarda en base64 en la tabla `actos_archivos`, que sirve para empezar pero no escala.
- [ ] **Marcar "por confirmar" los datos de páginas mal escaneadas**, con la confianza del OCR página por página. Depende del punto anterior.

## Otros pendientes

- (agregar aquí)
