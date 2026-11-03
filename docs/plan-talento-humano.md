# Talento humano en el panel

> Sección `/admin/talento`, solo para administradores. Construida el 2026-11-03 con las decisiones de Mike de ese día.

## Decisiones

| Tema | Decisión |
|---|---|
| Alcance | Cuatro módulos de una vez: ficha, documentos y vencimientos, vacaciones y novedades, capacitación y desempeño. |
| Quién la usa | Solo admin (RR.HH.). Ni jefes de área ni autoservicio. |
| Quiénes son los empleados | Las mismas cuentas de `users`. La ficha cuelga de `users.id`. |
| Datos sensibles | Salario opcional. Nada de salud: de exámenes e incapacidades solo fechas y enlace al soporte. |
| Archivos | Solo enlaces (Drive, WorkDrive). El panel no guarda archivos de RR.HH. |
| Alertas | Tablero + correo semanal + herramienta del asistente IA (solo consulta). |
| Vacaciones | Ley colombiana automática: 15 días hábiles por año, año comercial de 360 días. |
| Desempeño | Criterios configurables por cargo; sin cargo, los sugeridos. |
| Capacitación de IA | Los talleres de `src/lib/capacitacion.ts` se siembran como cursos. |

## Dónde está cada cosa

- Reglas y cálculos (puros, con pruebas): `src/lib/talento/reglas.ts`, `reglas.test.ts`.
- Base: `src/lib/talento/datos.ts`; tablas `th_*` en `src/lib/esquema.ts`; ajustes en `ajustes` (clave `talento`).
- API: `src/pages/api/admin/talento.ts` (GET estado, POST `{ accion, ... }` que devuelve el estado recalculado).
- Página: `src/pages/admin/talento.astro`, `public/admin/talento.js`, `public/admin/talento.css`.
- Correo: `src/lib/talento/resumen.ts` + `notifyResumenTalento` en `src/lib/email.ts`.
- Cron: `src/pages/api/cron/talento-resumen.ts` y `vercel.json` (lunes 12:00 UTC = 7:00 a. m. Bogotá).
- Asistente: `src/lib/asistente/herramientas/talento.ts` (área `talento`, solo admin, sin propuestas).

## Reglas legales aplicadas

- Vacaciones (CST art. 186): solo contratos indefinido, fijo y obra o labor. Saldo = causadas − ajuste previo − aprobadas.
- Días hábiles: sin domingos ni festivos de Colombia; el sábado según el ajuste "la empresa trabaja los sábados". Los días se fijan al guardar la novedad.
- Período de prueba (arts. 76 a 78): dos meses, o la quinta parte de un fijo de menos de un año.
- Preaviso del término fijo (art. 46): aviso 30 días antes del fin del contrato.
- Avisos: vencidos y lo que vence en 90 días; de cada tipo de documento y de cada curso solo cuenta el más reciente.

## Seguridad

- Middleware bloquea `/api/admin/talento` a no admin también en GET, y el endpoint lo vuelve a revisar.
- Enlaces solo `http(s)` (se pintan como `<a href>`).
- Una cuenta con ficha no se puede borrar: se desactiva.
- Ni el correo ni el asistente reciben salario, documento, contactos, seguridad social ni motivos de incapacidades.

## Pendientes

- Activar correo: `RESEND_API_KEY`, `NOTIFY_FROM` (dominio verificado), `TALENTO_EMAIL` y `CRON_SECRET` en Vercel.
- Validar con Ekosolv si trabajan sábados y cada cuánto evalúan, y cargar sus cargos reales con criterios.
- Cargar el ajuste de vacaciones ya disfrutadas de cada persona antigua para que el saldo arranque bien.
- Posibles fases siguientes: que el asistente proponga novedades con aprobación, exportar a Excel, registro de quién consulta salarios.
