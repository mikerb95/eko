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

## Hallazgos críticos

### 1. Credenciales y secreto de sesión con fallback inseguro
`src/lib/auth.ts:12-18`

Si `AUTH_SECRET`, `ADMIN_USERNAME` o `ADMIN_PASSWORD` no están configuradas como variables de entorno, producción usa por defecto `admin` / `ekosolv2026` y el secreto HMAC `dev-insecure-secret-change-me`. Con esos valores cualquiera puede entrar a `/admin` o forjar cookies de sesión válidas. Los valores están además documentados en `.env.example` y embebidos en los artefactos de build versionados (ver hallazgo 2), por lo que son públicos para cualquiera con acceso al repo.

**Recomendación:** en producción, lanzar un error en el arranque si estas variables no están definidas en vez de usar un fallback. Verificar que estén configuradas en las variables de entorno del proyecto en Vercel.

### 2. `.vercel/output/` versionado en git
~90 archivos de build (~50 MB), incluyendo los chunks compilados de `src/lib/auth.ts` con los defaults inseguros del hallazgo 1.

**Recomendación:** `git rm -r --cached .vercel` y añadir `.vercel/` al `.gitignore` (actualmente `dist/` sí está ignorado pero `.vercel/` no).

### 3. Vulnerabilidades en dependencias
**Estado al 2026-08-03: parcialmente resuelto, 6 vulnerabilidades abiertas (1 moderate, 5 high).**

En el corte original eran 10 (1 low, 3 moderate, 6 high). Las de vite (NTLMv2 hash disclosure y bypass de `server.fs.deny`) se resolvieron con `npm audit fix`. Desde entonces el proyecto subió a Astro 7 y `@astrojs/vercel` 11, y aparecieron avisos nuevos:

| Paquete | Severidad | Problema | Arreglo |
|---|---|---|---|
| `brace-expansion` | high | DoS por expansión sin límite (OOM) | `npm audit fix` |
| `fast-uri` | high | Confusión de host por backslash en el *authority* | `npm audit fix` |
| `path-to-regexp` 4.0.0–6.2.2 | high | ReDoS por backtracking, vía `@vercel/routing-utils` | ver abajo |
| `tar` ≤7.5.20 | moderate | Recursión no controlada, DoS por stack overflow | `npm audit fix` |

**Corrección importante sobre el corte anterior:** ahí se dijo que `path-to-regexp` se resolvía subiendo a `@astrojs/vercel@11`. Es falso. El proyecto ya está en la 11.0.3 y el aviso sigue: lo que `npm audit fix --force` propone hoy es **bajar** a `@astrojs/vercel@8.0.4`, un downgrade de dos majors. No conviene hacerlo. El vector, además, es el enrutado de la plataforma, no código propio.

**Recomendación:** correr `npm audit fix` (resuelve tres de los cuatro sin breaking changes) y dejar `path-to-regexp` esperando a que `@vercel/routing-utils` publique la corrección aguas arriba. No aplicar `--force`.

### 4. Node.js local incompatible
Node v20.20.1 instalado; Astro 6 exige `>=22.12.0`. `astro check` y `astro build` no ejecutan localmente. El deploy en Vercel probablemente funciona porque usa Node 24, pero localmente impide verificar tipos y build antes de commitear/desplegar.

**Recomendación:** actualizar Node local a ≥22.12 (o 24 LTS).

## Hallazgos medios

### 5. Doble lockfile
Coexisten `bun.lock` (abril, desactualizado) y `package-lock.json` (junio). Puede causar instalaciones inconsistentes según el gestor de paquetes usado.

**Recomendación:** eliminar el lockfile del gestor que no se use activamente.

### 6. Sin rate limiting en `/api/admin/login`
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

## Aspectos correctos

- `git fsck --full` sin corrupción; working tree limpio y sincronizado con el historial.
- `src/middleware.ts` protege correctamente todas las rutas `/admin` y `/api/admin`; los endpoints del CMS (`posts.ts`, `normativas.ts`) no quedan expuestos sin sesión.
- Implementación de sesión sólida: HMAC-SHA256, comparación timing-safe (`timingSafeEqual`), expiración de 8h, cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- `.env`, `.env.production` y las bases de datos locales (`data/*.db`) están correctamente ignorados en `.gitignore`.
- No hay secretos reales (solo defaults documentados) en el historial de git.

## Acciones pendientes

- [x] Fail-hard en producción si faltan `AUTH_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`src/lib/auth.ts`, función `requireEnv`)
- [x] Sacar `.vercel/output` del repo y añadir `.vercel/` a `.gitignore`
- [x] `npm audit fix` — resueltas vite (NTLMv2/fs.deny) y tar (file smuggling) en julio.
- [ ] **Volver a correr `npm audit fix`** — hay 6 avisos abiertos al 2026-08-03 (`brace-expansion`, `fast-uri`, `tar` de nuevo, y `path-to-regexp`). Los tres primeros se arreglan sin breaking changes; `path-to-regexp` no, ver hallazgo 3. **No usar `--force`**: hoy propone bajar `@astrojs/vercel` a la 8.0.4.
- [x] Actualizar Node local a ≥22.12 (instalado Node 24.18.0 LTS vía `nvm`; añadido `.nvmrc` al repo fijando `24`). `astro check` (0 errores) y `astro build` corren correctamente.
- [x] Eliminar lockfile no utilizado (`bun.lock`, se mantiene `package-lock.json`)
- [x] Rate limiting en `/api/admin/login` (`src/lib/rateLimit.ts`, aplicado en `src/pages/api/admin/login.ts`): máximo 5 intentos por IP cada 10 minutos, responde `429` con `Retry-After`. Limitador en memoria por instancia de función (no requiere infraestructura externa); con Fluid Compute la reutilización de instancias lo hace efectivo contra fuerza bruta desde un mismo origen, aunque no es una defensa distribuida perfecta entre instancias concurrentes. Probado manualmente: 6º intento devuelve 429.

- [ ] **Provisionar la base en producción** (hallazgo 9). Es el bloqueador raíz: mientras no exista, el sitio pierde las solicitudes que recibe.
- [ ] **Remover la credencial fija de `src/lib/users.ts` y rotar la contraseña** (hallazgo 8). Depende de lo anterior.
- [ ] Mover el limitador de peticiones a Redis compartido antes de que el panel tenga usuarios reales del cliente (ver `infra_deploy.md`).

**Importante:** antes de desplegar, confirma que `AUTH_SECRET` esté configurada en las variables de entorno del proyecto en Vercel (producción); de lo contrario el arranque falla con "Missing required environment variable". `ADMIN_USERNAME` y `ADMIN_PASSWORD` ya no hacen falta en producción: solo siembran el primer administrador si la tabla `users` está vacía, y en producción los usuarios se crean desde la pestaña Usuarios del panel.
