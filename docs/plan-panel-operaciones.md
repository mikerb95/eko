# Plan: Panel de Operaciones Ekosolv ("el cerebro")

> Objetivo: expandir el admin actual (blog + normativas) hacia un panel operativo diario para empleados, complementando Zoho (no reemplazándolo en fase 1), con impacto directo y medible en el resultado operacional: recolecciones RAEE, trazabilidad, certificados, clientes y cumplimiento normativo.

---

## 1. Contexto del negocio

Ekosolv opera cuatro líneas con perfiles operativos distintos:

| Línea | Naturaleza | Necesidad operativa diaria |
|---|---|---|
| **Ekoraee** | Logística de recolección y gestión de RAEE | Agenda de recolecciones, rutas, pesaje, actas, certificados de disposición final |
| **Ekonsulting** | Consultoría / licenciamiento ambiental (ANLA) | Expedientes, hitos regulatorios, vencimientos, entregables |
| **Ekotrading** | Comercialización de materiales aprovechables | Inventario por material, lotes, precios, despachos |
| **Ekopartner** | Alianzas / posconsumo | Puntos de recolección aliados, reporte de volúmenes |

Hoy: la web recibe el formulario "Agenda una recolección" pero **no lo persiste ni lo enruta a nadie** (el form no tiene handler); la operación vive en Zoho; el admin web solo gestiona contenido.

## 2. Benchmark del sector

- **Lito S.A.S** (lito.com.co, gestor RAEE pionero, Medellín): su diferencial operativo es **trazabilidad de punta a punta** — recolección, transporte, destrucción de marca, segregación y aprovechamiento con certificado. Opera una red de **Puntos Verdes** públicos con visor de cobertura geográfica y +150 empresas asociadas. Lección: el certificado y la trazabilidad *son el producto*; el panel debe generar ambos sin fricción.
- **Recopila** (recopila.org, programa posconsumo de pilas, Res. 0851/2022): opera por **red de puntos fijos de recolección** con localizador geográfico, reporta volúmenes agregados a la autoridad y rinde cuentas por metas de recolección anuales. Lección: el reporte regulatorio (toneladas recolectadas por periodo/región) debe salir del sistema como subproducto de la operación, no como ejercicio manual de fin de año.
- Patrón común del sector (Lito, RAEE Colombia SAS, RedPosconsumo): portal de agendamiento público → orden interna → ruta → pesaje/clasificación → certificado descargable por el cliente → estadísticas para informes a ANLA/corporaciones autónomas.

**Conclusión del benchmark:** el diferenciador no es el CRM (eso ya lo hace Zoho); es el **ciclo operativo RAEE digitalizado con trazabilidad y certificados**, más el **radar normativo** que Ekonsulting ya publica como contenido y puede volverse herramienta interna.

## 3. Alcance del panel — módulos

### M1 · Recolecciones (corazón operativo — primera prioridad)
Ciclo de vida de una orden: `solicitada → confirmada → programada → en ruta → recolectada → clasificada → certificada → cerrada` (+ `cancelada`).

- El formulario público "Agenda una recolección" **persiste en DB** y crea la orden en estado `solicitada` (hoy se pierde).
- Bandeja de solicitudes con asignación a responsable, fecha programada, vehículo/transportador.
- Registro en sitio (móvil-first): peso por categoría RAEE (línea blanca, TI, pilas, luminarias…), fotos, firma/acta de entrega.
- Notificaciones: email/WhatsApp al cliente en confirmación y al emitir certificado.

### M2 · Trazabilidad y certificados
- Cada orden genera **manifiesto de recolección** y, al cerrar, **certificado de disposición final / aprovechamiento** (PDF numerado consecutivo, con QR de verificación pública `ekosolv.com/verificar/{codigo}`).
- Cadena de custodia: quién recogió, transportó, clasificó, a qué gestor final se entregó cada fracción.
- Registro de gestores finales aliados (licencias, vigencias) — vencimiento de licencia de un aliado = alerta.

### M3 · Clientes y puntos de recolección
- Ficha de cliente ligera (empresa, sedes, contactos, historial de órdenes y kilos) **sincronizada con Zoho CRM** (Zoho = maestro de ventas; panel = maestro de operación; sync por API/webhooks, ver §6).
- Puntos de recolección fijos (modelo Puntos Verdes/Recopila): ubicación, aliado, frecuencia de vaciado, kilos por visita.

### M4 · Inventario y trading (Ekotrading)
- Entradas por clasificación de órdenes (kilos por material) → stock por bodega/material.
- Salidas por despacho/venta a gestor final o comprador, con precio → margen bruto por lote.

### M5 · Expedientes de consultoría (Ekonsulting)
- Expediente por proyecto: cliente, autoridad (ANLA/CAR), etapa, hitos con fechas límite, documentos entregables, responsable.
- Calendario de vencimientos regulatorios cruzado con el módulo de normativas ya existente (las normativas dejan de ser solo contenido del sitio y se vinculan a expedientes afectados).

### M6 · Tablero e indicadores (el "cerebro")
- KPIs diarios/mensuales: órdenes por estado, kilos recolectados por categoría/ciudad/cliente, tiempo solicitud→recolección, certificados emitidos, ingresos trading, expedientes en riesgo.
- **Exportes regulatorios**: reporte de toneladas por periodo/departamento en formato listo para informes a autoridad (lo que Recopila hace anualmente).
- Vista "hoy": recolecciones del día, vencimientos de la semana, solicitudes sin asignar.

### M7 · Usuarios, roles y auditoría (habilitador transversal)
- Reemplazar el login único actual (`ADMIN_USERNAME`/`ADMIN_PASSWORD` en env) por tabla de usuarios con hash (argon2/bcrypt) y roles: `admin`, `operaciones`, `logistica` (móvil, solo su ruta), `consultor`, `lectura`.
- Log de auditoría (quién cambió qué orden/certificado — obligatorio para credibilidad de la trazabilidad).

### M8 · Portal del cliente (fase posterior)
- Login de cliente: historial de recolecciones, descarga de certificados, agendar nueva recolección, dashboard de impacto (kg gestionados, CO₂ evitado — valor de marketing que Lito explota).

## 4. Arquitectura técnica

Mantener el stack: **Astro 6 SSR en Vercel + Turso (libSQL)** — ya probado en el admin actual, costo ~0, sin nueva infraestructura.

- `src/pages/admin/*` crece por módulo; API en `src/pages/api/admin/*` (patrón existente de `posts.ts`/`normativas.ts`).
- Migraciones SQL versionadas (carpeta `src/lib/migrations/` aplicadas al arrancar, como hace hoy `cms.ts` con seeds).
- PDFs de certificados: generación server-side (p. ej. `pdf-lib`) + almacenamiento en Vercel Blob; QR con librería ligera.
- Interactividad del panel: islas Astro con vanilla JS como el admin actual mientras sea simple; si M1/M6 crecen, introducir islas React/Svelte solo en el panel.
- Móvil: el registro en campo (M1) es una página web responsive, no una app nativa.

### Modelo de datos (núcleo)
```
users(id, email, name, role, pass_hash, active)
clients(id, zoho_id, name, nit, city, contact_*)  ── sites(id, client_id, address, city)
orders(id, consecutive, client_id, site_id, status, requested_at, scheduled_at,
       assigned_to, vehicle, source[web|whatsapp|zoho|punto], notes)
order_items(id, order_id, raee_category, weight_kg, photos_json)
order_events(id, order_id, user_id, from_status, to_status, at, note)   ← auditoría/custodia
certificates(id, order_id, consecutive, type[disposicion|aprovechamiento], pdf_url, qr_code, issued_at)
final_managers(id, name, license_no, license_expires, materials_json)
collection_points(id, partner, address, lat, lng, frequency)
inventory_moves(id, material, kg, direction[in|out], order_id?, sale_price?, warehouse)
cases(id, client_id, authority, stage, responsible)  ── case_milestones(id, case_id, title, due_at, done)
audit_log(id, user_id, entity, entity_id, action, diff_json, at)
```

## 5. Roadmap por fases

| Fase | Duración est. | Entrega | Impacto operacional |
|---|---|---|---|
| **0. Fundaciones** | 1–2 sem | M7 (usuarios/roles/auditoría), migraciones, layout del panel con navegación por módulos | Habilita todo lo demás; elimina la credencial única insegura |
| **1. Recolecciones** | 2–3 sem | M1 completo + persistencia del form público + notificaciones email | Cero solicitudes perdidas; visibilidad diaria inmediata |
| **2. Certificados** | 2 sem | M2 (PDF + QR verificable + cadena de custodia) | El entregable de mayor valor al cliente sale del sistema |
| **3. Cerebro v1** | 1–2 sem | M6 tablero "hoy" + kilos/órdenes + exporte regulatorio CSV | Gerencia ve el resultado operacional diario |
| **4. Clientes + Zoho** | 2 sem | M3 + sync Zoho (unidireccional Zoho→panel primero) | Fin del doble registro |
| **5. Inventario/Trading** | 2 sem | M4 | Margen por material visible |
| **6. Expedientes** | 2 sem | M5 + alertas de vencimiento | Ekonsulting entra al panel |
| **7. Portal cliente** | 3 sem | M8 + verificación pública de certificados | Diferenciador comercial estilo Lito |

Cada fase termina desplegada y en uso real antes de iniciar la siguiente; el feedback de los empleados reordena las fases 4–7 si hace falta.

## 6. Integración con Zoho

- **Principio:** Zoho sigue siendo maestro comercial (leads, tratos, facturación); el panel es maestro operativo (órdenes, kilos, certificados). Nunca dos maestros del mismo dato.
- Fase 4a: sync **Zoho → panel** de cuentas/contactos (API REST + refresh token OAuth, job programado o webhook de Zoho Flow).
- Fase 4b (opcional): al cerrar una orden, push del resumen (kilos, certificado) al registro del cliente en Zoho para que comercial lo vea.
- Si a futuro se usan módulos Zoho (Inventory, Desk), reevaluar M4 antes de construirlo dos veces.

## 7. KPIs de éxito del proyecto

1. % de solicitudes web que se convierten en orden gestionada (hoy: no medible → meta 100% capturadas).
2. Tiempo solicitud → recolección (días) y solicitud → certificado.
3. Kilos/mes registrados en sistema vs. reportados manualmente (meta: 100% en sistema en 3 meses).
4. Horas/mes de armado manual de informes regulatorios (meta: −80%).
5. Adopción: usuarios activos diarios del panel / empleados operativos.

## 8. Riesgos y mitigaciones

- **Doble digitación panel/Zoho** → definir maestros por dato (§6) desde fase 0 y no duplicar módulos comerciales.
- **Adopción en campo** → registro móvil ultra simple (una pantalla: pesos + fotos + firma), pilotear con una ruta antes de generalizar.
- **Validez del certificado** → consecutivos inmutables, auditoría (M7) y verificación pública QR; revisar con asesor legal el texto del certificado.
- **Turso/libSQL como única DB** → backups automáticos (Turso los ofrece) + export mensual a Blob.
- **Scope creep** → cada módulo entra solo cuando el anterior está en uso real (regla del roadmap).

## 9. Primer paso concreto

Fase 0 + el arreglo más barato con mayor retorno: **hacer que el formulario "Agenda una recolección" cree una orden real** (tabla `orders`, endpoint `api/recolecciones`, bandeja en el admin, email de aviso). Eso convierte la web de folleto a herramienta operativa en la primera semana.
