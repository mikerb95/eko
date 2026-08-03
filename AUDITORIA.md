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
`npm audit`: 10 vulnerabilidades (1 low, 3 moderate, 6 high).

- **vite 7.0.0–7.3.3** (high): NTLMv2 hash disclosure vía UNC path en Windows; bypass de `server.fs.deny`. Solo afecta entornos Windows/dev.
- **path-to-regexp** vía `@vercel/routing-utils` / `@astrojs/vercel` (high): ReDoS por regex vulnerable a backtracking. Requiere subir a `@astrojs/vercel@11` (breaking change).
- **tar ≤7.5.15** (moderate): file smuggling por interpretación diferencial de headers PAX/GNU long-name.

**Recomendación:** `npm audit fix` resuelve vite y tar sin breaking changes. `path-to-regexp` requiere evaluar el upgrade a `@astrojs/vercel@11`.

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
`src/lib/auth.ts` compara la contraseña directamente contra la variable de entorno, sin hash.

**Recomendación:** aceptable para un solo usuario admin; considerar hash (bcrypt/scrypt) si se agregan más usuarios.

## Aspectos correctos

- `git fsck --full` sin corrupción; working tree limpio y sincronizado con el historial.
- `src/middleware.ts` protege correctamente todas las rutas `/admin` y `/api/admin`; los endpoints del CMS (`posts.ts`, `normativas.ts`) no quedan expuestos sin sesión.
- Implementación de sesión sólida: HMAC-SHA256, comparación timing-safe (`timingSafeEqual`), expiración de 8h, cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- `.env`, `.env.production` y las bases de datos locales (`data/*.db`) están correctamente ignorados en `.gitignore`.
- No hay secretos reales (solo defaults documentados) en el historial de git.

## Acciones pendientes

- [x] Fail-hard en producción si faltan `AUTH_SECRET` / `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`src/lib/auth.ts`, función `requireEnv`)
- [x] Sacar `.vercel/output` del repo y añadir `.vercel/` a `.gitignore`
- [x] `npm audit fix` — resueltas vite (NTLMv2/fs.deny) y tar (file smuggling). Quedan 5 vulnerabilidades (1 low, 4 high) que requieren `--force` (upgrade breaking de `astro` y `@astrojs/vercel` a v11 por `esbuild`/`path-to-regexp`); no aplicado, pendiente de decisión.
- [x] Actualizar Node local a ≥22.12 (instalado Node 24.18.0 LTS vía `nvm`; añadido `.nvmrc` al repo fijando `24`). `astro check` (0 errores) y `astro build` corren correctamente.
- [x] Eliminar lockfile no utilizado (`bun.lock`, se mantiene `package-lock.json`)
- [x] Rate limiting en `/api/admin/login` (`src/lib/rateLimit.ts`, aplicado en `src/pages/api/admin/login.ts`): máximo 5 intentos por IP cada 10 minutos, responde `429` con `Retry-After`. Limitador en memoria por instancia de función (no requiere infraestructura externa); con Fluid Compute la reutilización de instancias lo hace efectivo contra fuerza bruta desde un mismo origen, aunque no es una defensa distribuida perfecta entre instancias concurrentes. Probado manualmente: 6º intento devuelve 429.

**Importante:** antes de desplegar, confirma que `AUTH_SECRET`, `ADMIN_USERNAME` y `ADMIN_PASSWORD` estén configuradas en las variables de entorno del proyecto en Vercel (producción) — de lo contrario el login de `/admin` fallará con "Missing required environment variable".
