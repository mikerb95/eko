# Auditoría de integridad del sistema

**Proyecto:** eko-ambiental (Astro + Vercel)
**Fecha:** 2026-07-05
**Revisado:** 2026-08-03

> Los hallazgos 1 a 7 son del corte original del 5 de julio y se conservan con su
> estado actualizado. Lo detectado después va en "Hallazgos posteriores".

## Alcance

Integridad del repositorio git, gestión de secretos, dependencias, autenticación del panel admin y estado del entorno de build.

## Resumen

La integridad del repositorio git es correcta (`git fsck` limpio, working tree limpio). Se encontraron 4 problemas serios: credenciales por defecto embebidas en el código de autenticación, artefactos de build versionados en git, vulnerabilidades en dependencias, y un Node.js local incompatible que impide compilar.

**Al 2026-08-03**, los cuatro del corte original están cerrados, pero hay dos hallazgos nuevos que bloquean la entrega: no existe base de datos en producción (hallazgo 9) y se agregó una credencial fija en el código del login como parche para esa falta (hallazgo 8). Las dependencias volvieron a acumular avisos (hallazgo 3).

## Hallazgos críticos

### 1. Credenciales y secreto de sesión con fallback inseguro
`src/lib/auth.ts:12-18` · **Estado: resuelto (2026-07-05).** `requireEnv()` lanza en producción si falta `AUTH_SECRET`, y las credenciales salieron de `auth.ts` hacia la tabla `users` (ver hallazgo 7). El texto original se conserva abajo.

Si `AUTH_SECRET`, `ADMIN_USERNAME` o `ADMIN_PASSWORD` no están configuradas como variables de entorno, producción usa por defecto `admin` / `ekosolv2026` y el secreto HMAC `dev-insecure-secret-change-me`. Con esos valores cualquiera puede entrar a `/admin` o forjar cookies de sesión válidas. Los valores están además documentados en `.env.example` y embebidos en los artefactos de build versionados (ver hallazgo 2), por lo que son públicos para cualquiera con acceso al repo.

**Recomendación:** en producción, lanzar un error en el arranque si estas variables no están definidas en vez de usar un fallback. Verificar que estén configuradas en las variables de entorno del proyecto en Vercel.

### 2. `.vercel/output/` versionado en git
**Estado: resuelto (2026-07-05).** Sacado del repo y `.vercel/` añadido al `.gitignore`.

~90 archivos de build (~50 MB), incluyendo los chunks compilados de `src/lib/auth.ts` con los defaults inseguros del hallazgo 1.

**Recomendación:** `git rm -r --cached .vercel` y añadir `.vercel/` al `.gitignore` (actualmente `dist/` sí está ignorado pero `.vercel/` no).

### 3. Vulnerabilidades en dependencias
**Estado al 2026-08-03: `npm audit fix` aplicado. Quedan 3 avisos abiertos (high), todos de la misma cadena de `path-to-regexp`.**

En el corte original eran 10 (1 low, 3 moderate, 6 high). Las de vite (NTLMv2 hash disclosure y bypass de `server.fs.deny`) se resolvieron con `npm audit fix`. Desde entonces el proyecto subió a Astro 7 y `@astrojs/vercel` 11, y aparecieron avisos nuevos:

| Paquete | Severidad | Problema | Estado |
|---|---|---|---|
| `brace-expansion` | high | DoS por expansión sin límite (OOM) | ✅ resuelto (5.0.7 → 5.0.9) |
| `fast-uri` | high | Confusión de host por backslash en el *authority* | ✅ resuelto (3.1.3 → 3.1.5) |
| `tar` | moderate | Recursión no controlada, DoS por stack overflow | ✅ resuelto (7.5.19 → 7.5.22) |
| `path-to-regexp` 4.0.0–6.2.2 | high | ReDoS por backtracking, vía `@vercel/routing-utils` | ⚠️ abierto, ver abajo |

`npm audit fix` se corrió el 2026-08-03 y cerró los tres primeros. Solo movió versiones de parche (`@astrojs/vercel` 11.0.3 → 11.0.4, dentro del rango de `package.json`, que no cambió). Verificado después: `astro check` con 0 errores y `astro build` completo, con las cabeceras de seguridad inyectadas correctamente en el Build Output.

**Corrección importante sobre el corte anterior:** ahí se dijo que `path-to-regexp` se resolvía subiendo a `@astrojs/vercel@11`. Es falso. El proyecto ya está en la 11.0.3 y el aviso sigue: lo que `npm audit fix --force` propone hoy es **bajar** a `@astrojs/vercel@8.0.4`, un downgrade de dos majors. No conviene hacerlo. El vector, además, es el enrutado de la plataforma, no código propio.

**Recomendación:** ya no queda nada que hacer sin romper algo. `path-to-regexp` se queda esperando a que `@vercel/routing-utils` publique la corrección aguas arriba; conviene revisarlo cada tanto. **No aplicar `--force`**, que sigue proponiendo el downgrade a la 8.0.4.

### 4. Node.js local incompatible
**Estado: resuelto (2026-07-07).** Node 24.18.0 LTS instalado y `.nvmrc` fijando `24` en el repo.

Node v20.20.1 instalado; Astro 6 exige `>=22.12.0`. `astro check` y `astro build` no ejecutan localmente. El deploy en Vercel probablemente funciona porque usa Node 24, pero localmente impide verificar tipos y build antes de commitear/desplegar.

**Recomendación:** actualizar Node local a ≥22.12 (o 24 LTS).

## Hallazgos medios

### 5. Doble lockfile
**Estado: resuelto (2026-07-07).** Eliminado `bun.lock`; se mantiene `package-lock.json`.

Coexisten `bun.lock` (abril, desactualizado) y `package-lock.json` (junio). Puede causar instalaciones inconsistentes según el gestor de paquetes usado.

**Recomendación:** eliminar el lockfile del gestor que no se use activamente.

### 6. Sin rate limiting en `/api/admin/login`
**Estado: resuelto (2026-07-07).** `src/lib/rateLimit.ts`, 5 intentos por IP cada 10 minutos. Ver la nota sobre Redis en las acciones pendientes.

El endpoint de login no limita intentos, permitiendo fuerza bruta contra la contraseña del admin.

**Recomendación:** regla de rate limiting en Vercel WAF sobre `/api/admin/login`.

### 7. Contraseña en texto plano
**Estado: resuelto (2026-07-06).**

El hallazgo original decía que `src/lib/auth.ts` comparaba la contraseña directamente contra la variable de entorno, sin hash. Ya no aplica: las credenciales se movieron a la tabla `users` y `src/lib/users.ts` usa PBKDF2-SHA256 con salt por usuario vía WebCrypto (`hashPassword` / `verifyPassword`). `ADMIN_USERNAME` y `ADMIN_PASSWORD` solo siembran el primer administrador si la tabla está vacía.

## Hallazgos posteriores

### 8. Credencial fija en el código del login
`src/lib/users.ts:151-152` · **abierto, crítico**

Hay usuario y contraseña en texto plano (`HARDCODED_USER` / `HARDCODED_PASSWORD`), comprobados **antes** de consultar la base. Se agregó a propósito el 3 de agosto como parche de acceso: en producción no hay `DATABASE_URL` y el fallback a archivo no se puede abrir en la función, así que sin esto el login falla con `ConnectionFailed 14` antes de poder comprobar nada.

Es un parche consciente, no un descuido, pero deja el panel abierto a cualquiera que lea el repositorio, y ya quedó en el historial de git: removerlo no basta, hay que rotar también la contraseña.

**Recomendación:** provisionar la base en producción (bloqueador raíz, ver `pendientes.md`), remover las dos constantes y rotar la contraseña. No desplegar para el cliente con esto puesto.

### 9. Sin base de datos en producción
**abierto, alto**

El proyecto en Vercel no tiene `DATABASE_URL` ni `DATABASE_AUTH_TOKEN`. Verificado el 2026-08-03: `/api/admin/recolecciones`, `/api/admin/contactos` y `/api/admin/users` responden 500.

No es solo un problema de disponibilidad del panel. `POST /api/recolecciones` y `POST /api/contacto` escriben en esa misma base antes de responder (`src/pages/api/recolecciones.ts:63-88`): sin base, la escritura lanza, el visitante recibe un 500 con el mensaje de error y **la solicitud se pierde entera**. Tampoco se encola nada en `zoho_outbox`, que vive en la misma base.

**Recomendación:** provisionar Turso siguiendo `infra_deploy.md` antes de dirigir tráfico real al sitio.

### 10. El repositorio es público con la credencial fija adentro
**abierto, crítico. Le toca a Mike.**

`github.com/mikerb95/eko` es un repositorio **público**. Combinado con el hallazgo 8, eso significa que la credencial del panel es legible por cualquiera en internet. Verificado el 2026-08-03 contra producción: `POST https://ekosolv.vercel.app/api/admin/login` con `admin` / la contraseña del código responde **200** y entrega una cookie de sesión válida.

Es el hallazgo 8 pero con el factor de exposición al máximo: no hace falta acceso al repo, basta con encontrarlo.

**Recomendación:** poner el repositorio en privado hoy mismo. Es lo único que corta la exposición sin depender de provisionar nada. Después, en orden: reemplazar el literal por un valor leído de `ADMIN_PASSWORD` en Vercel (mismo parche, sin secreto commiteado), provisionar Turso, remover el parche y rotar.

### 11. Mensajes de error crudos hacia el cliente
`src/pages/api/admin/login.ts` y los seis endpoints de `/api/admin` · **Estado: resuelto (2026-08-03).**

El login devolvía al cliente `'No se pudo validar el acceso: ' + e.message`, y el resto de endpoints `json({ error: String(e?.message || e) }, 500)`. Con la base caída eso entrega textualmente `ConnectionFailed("Unable to open connection to local database ./data/cms.db: 14")`: revela el motor, la ruta del archivo y que el sistema está degradado, que es justo el reconocimiento que busca un atacante.

Se agregó `src/lib/apiError.ts` con `fail()`, que registra el stack completo en el log del servidor y responde una frase genérica, y con `UserError` para los errores de negocio cuyo mensaje sí está escrito para una persona ("No puedes eliminar al último administrador activo"), que se siguen mostrando tal cual. Verificado con la base apuntando a una ruta inexistente: el cliente recibe "No se pudo validar el acceso", el log del servidor conserva el `ConnectionFailed` completo. Se añadió también registro de los intentos de login fallidos, que antes no quedaban en ninguna parte.

### 12. CSRF: `checkOrigin` de Astro no cubre `application/json`
`src/middleware.ts` · **Estado: resuelto (2026-08-03).**

`security.checkOrigin` viene activo por defecto, pero leyendo su implementación (`node_modules/astro/dist/core/app/origin-check.js:12-21`) solo rechaza peticiones cruzadas cuando el `content-type` es de formulario. Todo el panel habla `application/json`, así que para este proyecto ese chequeo no validaba nada y la única defensa era `SameSite=Lax`.

Se agregó una comprobación en el middleware para métodos no seguros bajo `/api/`: se rechaza con 403 si `Sec-Fetch-Site` es `cross-site` o si el `Origin` declarado no coincide con el del sitio. Un cliente sin navegador (el `curl` con el que hoy se opera la bandeja de Zoho) no manda ninguno de los dos y sigue funcionando, que es correcto: sin cookies de por medio no hay CSRF que montar.

### 13. Rutas internas protegidas por lista exacta
`src/middleware.ts` · **Estado: resuelto (2026-08-03).**

`PROTECTED_DOC_PATHS` era un `Set` de cuatro rutas exactas. Cualquier página nueva bajo `/docs` quedaba pública sin que nadie lo notara, y el modo del sitio agrava el olvido: con `output: 'static'`, una página sin `export const prerender = false` la sirve Vercel como HTML plano y el middleware ni se ejecuta.

Cambiado a comparación por prefijo (`/docs`, `/oportunidades2630`). Verificado: `/docs/pagina-que-no-existe` ahora redirige al login en vez de responder 404 público.

### 14. Cabeceras de caché e indexación en zonas con sesión
`astro.config.mjs` · **Estado: resuelto (2026-08-03).**

`/admin` respondía `cache-control: public, max-age=0, must-revalidate`, que autoriza a cachés intermedias a guardar HTML renderizado con datos de una sesión. Y la única señal contra la indexación era `robots.txt`, que es una petición y no un control: no impide que una URL interna termine indexada si alguien la enlaza.

Se añadió una segunda ruta al Build Output que aplica `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive` sobre `/admin`, `/docs`, `/oportunidades2630` y `/api/admin`.

## Aspectos correctos

- `git fsck --full` sin corrupción; working tree limpio y sincronizado con el historial.
- `src/middleware.ts` protege correctamente todas las rutas `/admin` y `/api/admin`; los endpoints del CMS (`posts.ts`, `normativas.ts`) no quedan expuestos sin sesión.
- Implementación de sesión sólida: HMAC-SHA256, comparación timing-safe (`timingSafeEqual`), expiración de 8h, cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- `.env`, `.env.production` y las bases de datos locales (`data/*.db`) están correctamente ignorados en `.gitignore`.
- El middleware también exige rol admin para `/docs` y `/oportunidades2630`, que son documentos internos servidos desde el mismo dominio.
- Cabeceras de seguridad (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`) aplicadas a todas las respuestas desde el Build Output (`astro.config.mjs`).
- Honeypot y rate limiting en los dos formularios públicos.

**Ya no aplica:** el corte original decía que no había secretos reales en el historial de git. Dejó de ser cierto con la credencial fija del hallazgo 8, que ya está commiteada.

## Acciones pendientes

- [x] Fail-hard en producción si faltan `AUTH_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`src/lib/auth.ts`, función `requireEnv`)
- [x] Sacar `.vercel/output` del repo y añadir `.vercel/` a `.gitignore`
- [x] `npm audit fix` — resueltas vite (NTLMv2/fs.deny) y tar (file smuggling) en julio.
- [x] `npm audit fix` (2026-08-03) — cerrados `brace-expansion`, `fast-uri` y `tar`. Quedan 3 avisos de la cadena de `path-to-regexp`, sin arreglo hacia adelante por ahora (hallazgo 3). **No usar `--force`**: propone bajar `@astrojs/vercel` a la 8.0.4.
- [x] Actualizar Node local a ≥22.12 (instalado Node 24.18.0 LTS vía `nvm`; añadido `.nvmrc` al repo fijando `24`). `astro check` (0 errores) y `astro build` corren correctamente.
- [x] Eliminar lockfile no utilizado (`bun.lock`, se mantiene `package-lock.json`)
- [x] Rate limiting en `/api/admin/login` (`src/lib/rateLimit.ts`, aplicado en `src/pages/api/admin/login.ts`): máximo 5 intentos por IP cada 10 minutos, responde `429` con `Retry-After`. Limitador en memoria por instancia de función (no requiere infraestructura externa); con Fluid Compute la reutilización de instancias lo hace efectivo contra fuerza bruta desde un mismo origen, aunque no es una defensa distribuida perfecta entre instancias concurrentes. Probado manualmente: 6º intento devuelve 429.

- [ ] **Poner el repositorio en privado** (hallazgo 10). Es lo más urgente de toda esta lista y no depende de nada.
- [ ] **Provisionar la base en producción** (hallazgo 9). Es el bloqueador raíz: mientras no exista, el sitio pierde las solicitudes que recibe.
- [ ] **Remover la credencial fija de `src/lib/users.ts` y rotar la contraseña** (hallazgo 8). Depende de lo anterior.
- [x] Sanear los mensajes de error de la API (hallazgo 11, `src/lib/apiError.ts`)
- [x] Chequeo de `Origin` para escrituras en `/api/` (hallazgo 12)
- [x] Rutas internas protegidas por prefijo en vez de lista exacta (hallazgo 13)
- [x] `no-store` y `noindex` en las zonas con sesión (hallazgo 14)
- [ ] Mover el limitador de peticiones a Redis compartido antes de que el panel tenga usuarios reales del cliente (ver `infra_deploy.md`).
- [ ] **Reglas de rate limiting en el WAF de Vercel** sobre `/api/admin/login`, `/api/contacto` y `/api/recolecciones`. El limitador propio es en memoria por instancia, así que con varias instancias concurrentes el presupuesto de intentos se multiplica. Una regla de plataforma es global y no depende del runtime. Sumar BotID en los dos formularios públicos, que hoy solo tienen honeypot.
- [ ] **Invalidación de sesiones.** Desactivar o degradar a un usuario en el panel no anula su cookie: sigue entrando hasta 8 horas. Se resuelve con una versión de token en el payload, o revalidando el usuario contra la base en el middleware.

**Importante:** antes de desplegar, confirma que `AUTH_SECRET` esté configurada en las variables de entorno del proyecto en Vercel (producción); de lo contrario el arranque falla con "Missing required environment variable". `ADMIN_USERNAME` y `ADMIN_PASSWORD` ya no hacen falta en producción: solo siembran el primer administrador si la tabla `users` está vacía, y en producción los usuarios se crean desde la pestaña Usuarios del panel.
