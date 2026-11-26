# Talento humano en el panel

> Sección `/admin/talento`, solo para administradores. Construida el 2026-11-03 con las decisiones de Mike de ese día.

## Decisiones

| Tema | Decisión |
|---|---|
| Alcance | Cuatro módulos de una vez: ficha, documentos y vencimientos, vacaciones y novedades, capacitación y desempeño. |
| Quién la usa | Solo admin (RR.HH.). Ni jefes de área ni autoservicio. |
| Quiénes son los empleados | Las cuentas de `users` (la ficha cuelga de `users.id`) y, desde el 2026-11-25, empleados sin cuenta del panel creados con "Agregar empleado": viven solo en `th_empleados`, con `nombre` propio y `usuario_id` negativo para no chocar con `users.id`. |
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
- Tarea con horario: `src/pages/api/cron/talento-resumen.ts`, disparada por una tarea programada en la nube de Claude (lunes 12:00 UTC = 7:00 a. m. Bogotá). Nunca un cron de Vercel: ver `docs/tareas-nube-claude.md`.
- Asistente: `src/lib/asistente/herramientas/talento.ts` (área `talento`, solo admin, sin propuestas).

## Reglas legales aplicadas

- Vacaciones (CST art. 186): solo contratos indefinido, fijo y obra o labor. Saldo = causadas − ajuste previo − aprobadas.
- Días hábiles: sin domingos ni festivos de Colombia; el sábado según el ajuste "la empresa trabaja los sábados". Los días se fijan al guardar la novedad.
- Período de prueba (arts. 76 a 78): dos meses, o la quinta parte de un fijo de menos de un año.
- Preaviso del término fijo (art. 46): aviso 30 días antes del fin del contrato.
- Avisos: vencidos y lo que vence en 90 días; de cada tipo de documento y de cada curso solo cuenta el más reciente.

## Ciclo de vida (2026-11-26)

- **Retiro cierra el acceso**: con fecha de retiro cumplida, `verifyLogin` no deja entrar; `cerrarAccesosRetirados` desactiva la cuenta al guardar la ficha y al abrir Talento humano (nunca al último admin); el middleware solo renueva la sesión si `cuentaPuedeEntrar` (quien ya tenía sesión sale cuando vence, máximo unas 4 horas). No se reactiva a alguien con retiro cumplido sin quitar antes la fecha.
- **Trayectoria** (`th_historial`): cada cambio de cargo, área, contrato o salario, con la fecha del campo "Desde cuándo rige el cambio" (vacío = hoy; en una ficha nueva, la fecha de ingreso). Se puede borrar una línea mal registrada. La ficha muestra siempre los datos actuales, aunque el cambio rija a futuro.
- **Certificado laboral**: `/admin/talento/certificado?persona=<id>[&salario=1]`, texto en `src/lib/talento/certificado.ts` (salario en letras). Firma configurable en Ajustes. Si faltan documento, ingreso o salario, avisa en vez de imprimir.
- **Pagos legales** (`pagosLegales` en reglas.ts): intereses de cesantías 31 ene, consignación 14 feb, dotación 30 abr / 31 ago / 20 dic, prima 30 jun / 20 dic. Avisos de toda la empresa (`usuario_id` 0) solo si hay alguien con contrato laboral; botón "Ya se pagó" (`ajustes.pagosHechos`); un vencido sin marcar sale 30 días.
- **Pasos de ingreso y retiro** (`PASOS_INGRESO`, `PASOS_RETIRO`, columnas `pasos_ingreso`/`pasos_retiro`): avisos para ingresos y retiros de los últimos 60 días o futuros, nunca a contratistas; si falta la ARL, el aviso vence el día antes del ingreso.

## Seguridad

- Middleware bloquea `/api/admin/talento` a no admin también en GET, y el endpoint lo vuelve a revisar.
- Enlaces solo `http(s)` (se pintan como `<a href>`).
- Una cuenta con ficha no se puede borrar: se desactiva.
- Acceso al panel desde la ficha: a un empleado sin cuenta se le da acceso (usuario, contraseña y rol) y sigue siendo la misma persona: la ficha, documentos, novedades, formación y evaluaciones pasan a su `users.id` en una sola transacción (`darAcceso`). A quien ya tiene cuenta se le cambia el rol o se desactiva ahí mismo (`cambiarAcceso`), con las protecciones de Usuarios (no auto-degradarse, no quedarse sin admin). El nombre se edita en la ficha para todos (con cuenta actualiza `users.name`).
- Un empleado sin cuenta solo se borra si no tiene historial (documentos, novedades, formación ni evaluaciones); si tiene, se le pone fecha de retiro.
- Ni el correo ni el asistente reciben salario, documento, contactos, seguridad social ni motivos de incapacidades.

## Pendientes

- Activar correo: `RESEND_API_KEY`, `NOTIFY_FROM` (dominio verificado), `TALENTO_EMAIL` y `CRON_SECRET` en Vercel.
- Validar con Ekosolv si trabajan sábados y cada cuánto evalúan, y cargar sus cargos reales con criterios.
- Cargar el ajuste de vacaciones ya disfrutadas de cada persona antigua para que el saldo arranque bien.
- Posibles fases siguientes: exportar a Excel, que el asistente proponga novedades con aprobación, registro de quién consulta salarios.
- Validar con el contador de Ekosolv las fechas de pagos y los pasos de ingreso y retiro, y cargar en Ajustes quién firma los certificados.
