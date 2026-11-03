# Academia de IA

> `/academia` (participantes) y `/admin/academia` (solo admin). Construida el 2026-11-03 con las decisiones de Mike de ese día.

## Decisiones

| Tema | Decisión |
|---|---|
| Alcance | Solo Ekosolv, dentro de este sitio. Convive con `/ia`, que sigue pública (encuesta y programa). |
| Acceso | Cuenta por persona. Rol nuevo `participante`: solo entra a la academia. Quien ya usa el panel entra con su misma cuenta. |
| Ruta | Capacitación general + taller de su área (módulos de `src/lib/capacitacion.ts`). |
| Contenido | Editor en el panel. Arranca sembrado y sin publicar: general con contenido completo, áreas con tema y entrega. |
| Práctica | Revisor de instrucciones: ejecuta la instrucción y la revisa con contexto, tarea, formato y ejemplos. Haiku, tope `ACADEMIA_IA_TOPE_DIARIO_USD` (3 USD por defecto) y 25 prácticas por persona al día. |
| Certificado | Asistencia a todos los bloques de su ruta + todas las entregas aprobadas. Se emite al abrirlo o desde el panel, con código verificable en `/verificar/<código>`, y se registra en Talento humano (cursos general y del área). |

## Dónde está cada cosa

- Reglas puras y pruebas: `src/lib/academia/reglas.ts`, `semilla.ts`, `practica.ts`, `academia.test.ts`.
- Base: `src/lib/academia/datos.ts`; tablas `ac_*` en `src/lib/esquema.ts`.
- IA: `src/lib/academia/motorPractica.ts` (modelo simulado con `ASISTENTE_MODELO_FALSO=1` fuera de Vercel).
- API: `src/pages/api/academia.ts` (participante) y `src/pages/api/admin/academia.ts` (admin).
- Páginas: `src/pages/academia/` (ruta, lección, certificado), `src/pages/verificar/[codigo].astro`, `src/pages/admin/academia.astro` + `public/admin/academia.{js,css}`.
- Estilos del participante: `src/styles/academia.css`, armazón `src/layouts/AcademiaLayout.astro`.
- Prueba en navegador: `e2e/academia.spec.ts`.

## Seguridad

- Middleware: `/academia` y `/api/academia` exigen sesión; el rol `participante` va a `/academia` desde cualquier página de `/admin` y recibe 403 en `/api/admin/*`.
- `/api/admin/academia` solo admin (middleware, `reglasEscritura.ts` y el endpoint).
- Cada acción del participante comprueba cuenta activa, inscripción y que la lección esté publicada y en su ruta.
- Contenido escapado antes de darle formato; enlaces solo http(s); correos y números largos se tapan antes de ir al modelo.

## Pendientes

- Escribir el contenido de las lecciones por área y publicar.
- Crear las cuentas del equipo y programar los sábados cuando el diagnóstico fije las fechas.
- Probar la práctica con IA real en producción (la clave ya está en Vercel Production).
