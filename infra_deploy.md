# Infraestructura y despliegue

Qué se necesita contratar para poner este sitio en producción, con el mínimo real
de cada servicio. Precios consultados el 3 de agosto de 2026; conviene verificarlos
antes de firmar porque cambian sin aviso.

El sitio es Astro con `output: 'static'` y adapter de Vercel: casi todo se sirve
como HTML plano desde CDN. Solo corren como funciones `/api/*`, `/admin`, `/docs`
y `/oportunidades2630`. Eso mantiene el consumo variable prácticamente en cero.

## Mínimo para producción

| Servicio | Plan mínimo | Costo | Por qué ese y no el gratis |
|---|---|---|---|
| Vercel | Pro | USD 20/mes por asiento | El plan Hobby prohíbe uso comercial |
| Turso (libSQL) | Developer | USD 4,99/mes | El gratis solo guarda 1 día de restauración |
| Resend | Free | USD 0 | Alcanza de sobra para los avisos internos |
| Dominio | según registrador | USD 10–15/año | A nombre de la empresa cliente |
| **Total** | | **≈ USD 25/mes** | |

Upstash Redis entra solo si se mueve el limitador de peticiones fuera de memoria
(ver más abajo). Su plan gratuito cubre este caso, así que no cambia el total.

## Vercel

**Plan mínimo: Pro, USD 20/mes.**

El plan Hobby es gratis y técnicamente serviría, pero sus términos de servicio
prohíben el uso comercial. Si el sitio se le factura a un cliente, estamos en
incumplimiento y la cuenta es cancelable sin previo aviso.

Se cobra **por asiento, no por proyecto**. Los proyectos son ilimitados, así que
todos los clientes caben en el mismo equipo Pro por los mismos USD 20/mes. Los
asientos adicionales con permiso de despliegue cuestan USD 20/mes cada uno; los
asientos de solo lectura (*viewer*) son gratis e ilimitados.

Límites relevantes del Pro:

| | Hobby | Pro |
|---|---|---|
| Proyectos | 200 | Ilimitados |
| Deployments por día | 100 | 6.000 |
| Proyectos conectados al mismo repo Git | 25 | 150 |
| Transferencia de datos incluida | 100 GB | 1 TB |
| Retención de logs de runtime | 1 hora | 1 día |
| Builds concurrentes | 1 | hasta 500 |
| Protección con contraseña en previews | no | sí |

Configuración: fijar la región de las funciones en `iad1` (Washington), que es la
de mejor latencia hacia Colombia, y que coincida con la región de la base.

El proyecto ya está enlazado: `prj_4Qf1IyoluHH2D8IzetEPbNSzQi35`.

## Turso (base de datos libSQL)

**Plan mínimo: Developer, USD 4,99/mes.**

| | Free | Developer | Scaler |
|---|---|---|---|
| Precio | USD 0 | USD 4,99/mes | USD 24,92/mes |
| Bases de datos | 100 | ilimitadas | ilimitadas |
| Almacenamiento | 5 GB | 9 GB | 24 GB |
| Filas leídas/mes | 500 M | 2.500 M | 100.000 M |
| Filas escritas/mes | 10 M | 25 M | 100 M |
| **Restauración a un punto en el tiempo** | **1 día** | **10 días** | **30 días** |

El volumen del sitio no se acerca ni al plan gratuito. Lo que justifica pagar es
la última fila: aquí se guardan solicitudes de recolección y datos de contacto de
clientes corporativos. Un día de ventana de restauración significa que un borrado
accidental detectado el lunes por la mañana ya no se puede deshacer si ocurrió el
viernes. Diez días sí cubre ese caso.

Crear la base en `aws-us-east-1` para que quede junto a las funciones de Vercel.

Variables que inyecta (ver `.env.example`):

```
DATABASE_URL=libsql://<base>.turso.io
DATABASE_AUTH_TOKEN=<token>
```

En local no se contrata nada: por defecto usa el archivo `data/cms.db`.

## Resend (avisos por email)

**Plan mínimo: Free, USD 0.**

| | Free | Pro |
|---|---|---|
| Precio | USD 0 | desde USD 20/mes |
| Correos/mes | 3.000 | 50.000 |
| Límite diario | 100 | sin límite |
| Dominios propios | 1 | 10 |
| Retención de datos | 30 días | 30 días |

El sitio solo envía avisos internos cuando entra una solicitud de recolección o un
contacto. Con eso, 3.000 al mes sobran. Las dos restricciones a tener presentes son
el tope de 100 correos diarios y, sobre todo, **un solo dominio propio**: con más de
un cliente hay que subir a Pro o abrir una cuenta de Resend por cliente.

Lo que hay que dejar bien configurado no es el plan sino el DNS del dominio de
envío: SPF, DKIM y DMARC completos. Si los avisos caen en la carpeta de spam de
gerencia, el cliente concluye que el sitio no funciona. Probar contra Gmail y contra
Outlook corporativo antes de entregar.

Variables:

```
RESEND_API_KEY=
NOTIFY_FROM=Ekosolv <notificaciones@dominio-verificado.com>
NOTIFY_EMAIL=operaciones@ekosolv.com,gerencia@ekosolv.com
```

Si falta cualquiera de las tres, el envío es un no-op silencioso: la solicitud se
guarda igual y el panel sigue siendo la fuente de verdad (`src/lib/email.ts`).

## Upstash Redis (opcional)

**Plan mínimo si se usa: Free, USD 0.** Incluye 1 base de 256 MB y 500.000
comandos al mes, muy por encima de lo que consumiría este caso.

Hoy `src/lib/rateLimit.ts` limita los intentos de login en memoria, por instancia
de función. Con Fluid Compute las instancias se reutilizan, así que frena la fuerza
bruta desde una IP, pero con varias instancias concurrentes el tope efectivo se
multiplica: 5 intentos configurados se vuelven 5 × N.

Para un panel con datos de clientes conviene moverlo a Redis compartido. Se instala
desde el Marketplace de Vercel y queda enlazado al proyecto sin manejar credenciales
a mano. No es bloqueante para salir a producción, pero sí antes de que el panel
tenga usuarios reales del cliente.

## Dominio y DNS

El registrador da lo mismo. Lo que importa es que **el dominio esté a nombre de la
empresa cliente, no del proveedor**. Es la primera pregunta que hace un área de TI
corporativa y la que peor cae cuando la respuesta es incómoda.

El DNS puede quedarse en el registrador o pasar a Cloudflare, apuntando a Vercel en
cualquiera de los dos casos.

Pendiente: el dominio definitivo no está decidido (`src/lib/site.ts` asume
`ekosolv.com`). Bloquea la verificación de Resend, que exige un dominio con DNS
comprobable. Ver `pendientes.md`.

## Resto de variables de entorno

Además de las de cada servicio, en Vercel hay que cargar:

```
AUTH_SECRET=<32 bytes aleatorios en base64url>
PUBLIC_SITE_URL=https://<dominio definitivo>
```

`AUTH_SECRET` firma la cookie de sesión. Sin ella el arranque en producción falla a
propósito (`src/lib/auth.ts`): un secreto conocido es peor que no arrancar. Generarlo
con:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

`ADMIN_USERNAME` y `ADMIN_PASSWORD` son **solo para desarrollo local**. En producción
los usuarios se crean desde la pestaña Usuarios del panel, con su rol. Una credencial
en variables de entorno no se puede rotar ni auditar por usuario.

Cargar todas en los entornos Production y Preview, nunca en el repositorio.

## Escenario multicliente

Con varios clientes en el mismo equipo de Vercel:

- El plan no sube: los proyectos son ilimitados.
- Turso sí crece: una base por cliente, pero el plan Developer ya las permite
  ilimitadas, así que tampoco sube mientras quepan en los 9 GB.
- Resend sí obliga a subir a Pro (USD 20/mes) al pasar del primer dominio.
- **El consumo variable de Vercel es compartido y se factura junto.** El TB de
  transferencia y el crédito mensual se reparten entre todos los proyectos. El panel
  muestra el uso por proyecto, pero la factura llega consolidada.

Decisión pendiente: si cada cliente debe tener su propio equipo de Vercel (paga sus
USD 20 y es dueño de su infraestructura) o si todo vive en el equipo del proveedor.
Lo segundo es más barato y más cómodo; lo primero es lo que pide un área de TI que no
quiere depender de un tercero para recuperar su propio sitio. Recomendación: arrancar
en el equipo del proveedor y dejar la migración por escrito en el contrato.

## Cumplimiento (habeas data)

No es infraestructura, pero se resuelve al mismo tiempo y lo revisa el área jurídica
de cualquier empresa grande.

Se están almacenando datos personales de contactos en servidores en Estados Unidos.
Es legal bajo la Ley 1581 de 2012, pero exige:

- Política de tratamiento de datos publicada en el sitio.
- Autorización explícita en los formularios de contacto y de recolección, no casilla
  premarcada.
- Evaluar si la empresa debe registrar la base ante la SIC en el RNBD. Aplica según
  el nivel de activos, así que hay que confirmarlo con el cliente.

## Antes de entregar

- [ ] Contratar Vercel Pro y mover el proyecto fuera de Hobby
- [ ] Crear la base en Turso Developer, región `aws-us-east-1`
- [ ] Fijar la región de funciones de Vercel en `iad1`
- [ ] Verificar el dominio en Resend con SPF, DKIM y DMARC
- [ ] Probar la entrega de avisos contra Gmail y Outlook corporativo
- [ ] Cargar todas las variables en Production y Preview
- [ ] Confirmar que `.env.local` está en `.gitignore` y nunca entró a la historia de git
- [ ] Sacar `/docs`, `/docs/kanban`, `/docs/radar` y `/oportunidades2630` del
      despliegue de producción del cliente. Están protegidas por sesión, pero son
      documentos comerciales internos y viven en el mismo dominio que ve el cliente
- [ ] Mover el limitador de peticiones a Redis compartido
- [ ] Publicar la política de tratamiento de datos y agregar la autorización a los
      formularios
