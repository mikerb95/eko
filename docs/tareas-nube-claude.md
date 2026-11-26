# Tareas programadas en la nube de Claude

Decisión de Mike (2026-11-25): **ningún cron en Vercel**. Las tareas con
horario las dispara una tarea programada en la nube de Claude (infraestructura
de Anthropic). La lógica sigue en el portal: la tarea solo llama a una
dirección a la hora indicada y el portal hace el trabajo.

```
Tarea en la nube de Claude  ──(Authorization: Bearer CRON_SECRET)──▶  Portal /api/cron/<tarea>
         (despertador)                                                (lee la base, calcula, envía correos)
```

Cada llamada queda registrada y se ve en **/admin/automatizaciones**
(última ejecución, si falló y si está atrasada).

## Antes de crearlas

1. Desplegar el portal con el módulo de Finanzas y `vercel.json` sin crons.
2. Configurar `CRON_SECRET` en Vercel (Production): un valor largo y aleatorio,
   por ejemplo `openssl rand -hex 32`.
3. Guardar ese mismo valor en la tarea de Claude. Es lo único sensible que
   lleva: con él cualquiera puede disparar los avisos (no leer datos).
4. Comprobar que el entorno de la tarea puede salir a internet hacia
   `ekosolv.codebymike.net` (algunos entornos de la nube restringen salidas).

## Tarea 1: Avisos diarios de Finanzas

- **Horario:** todos los días, 7:00 a. m. hora de Bogotá (`0 12 * * *` en UTC).
- **Instrucción:**

  > Haz una sola petición GET a `https://ekosolv.codebymike.net/api/cron/finanzas`
  > con el encabezado `Authorization: Bearer <CRON_SECRET>`. No hagas nada más.
  > Si la respuesta no es 200 o no trae `"ok": true`, repórtalo como fallo con
  > el código y el cuerpo de la respuesta. Si sale bien, responde solo con el
  > JSON recibido.

## Tarea 2: Resumen semanal de Talento humano

- **Horario:** lunes, 7:00 a. m. hora de Bogotá (`0 12 * * 1` en UTC).
- **Instrucción:** la misma de arriba, con
  `https://ekosolv.codebymike.net/api/cron/talento-resumen`.

## Por qué así

- La regla de negocio (a cuántos días avisar, a quién escalar) se cambia en el
  código del portal, con pruebas, y la tarea no se toca.
- La tarea no tiene acceso a la base ni al correo: solo puede pedir que corra
  lo que ya está escrito.
- Cada ejecución consume muy poco del plan de Claude: una sola llamada HTTP.
- En Finanzas, llamarla dos veces el mismo día no duplica correos: reserva
  cada aviso en la base antes de enviarlo. Talento no tiene esa protección:
  dos llamadas el mismo lunes envían dos resúmenes.
