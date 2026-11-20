# Capacitaciones presentadas desde el sitio

> `/academia/taller/<n>` (proyector), `/academia/taller/<n>/presentador` (solo admin), `/academia/sala` (celular) y `/academia/taller/<n>/resumen` (tarjeta). Construido el 2026-11-19.

## Decisiones de Mike (2026-11-19)

| Tema | Decisión |
|---|---|
| Programa | 4 capacitaciones presenciales de 4 h. La 1 es general; la 2, 3 y 4 tratan los temas de las áreas. **Todo el equipo asiste a los cuatro sábados**, sin separar por áreas (Mike, 2026-11-19). El cronograma de temas por sábado no está definido: no se muestra ninguno. |
| Dónde | ekosolv.codebymike.net/academia/taller/1, con login de la academia. |
| Público | Responde desde el celular: el QR abre `/academia/sala`, que pide nombres, apellidos (mayúscula inicial automática), cargo y área, **sin usuario ni contraseña** (cambio de Mike, 2026-11-19). Regla: **ningún QR lleva a un login**. El QR de la práctica guiada abre la misma sala, que en esa escena se vuelve el revisor de instrucciones; el del cierre abre la tarjeta resumen, que es pública. |
| Celular por área | En cada escena sin votación, el celular muestra la idea que se explica en pantalla, en palabras sencillas, y debajo un ejemplo de esa idea para el área que la persona eligió al registrarse (`src/lib/talleres/ejemplos1.ts`, `Taller.celular`; ejemplos ilustrativos hasta tener documentos reales). Toda escena sin votación tiene idea; 15 tienen ejemplo por área. Debajo, una caja para enviarle preguntas a quien dicta: llegan a la vista de presentador con nombre, área y escena, y se quitan con "Respondida" (Mike, 2026-11-19). Hasta 20 preguntas por persona al día. La pantalla del celular no se apaga mientras la sala está abierta. |
| IA | En vivo con respaldo: Claude responde en el momento; si falla, se muestra la respuesta guardada, marcada como tal. |
| Motion | En las 4 capacitaciones. |
| Funciones | Vista de presentador, asistencia automática, evaluación antes y después, repaso al iniciar los sábados 2 a 4, tarjeta resumen, apertura con datos del diagnóstico. |
| Fuera | Reto cronometrado y preguntas anónimas (no los eligió). |

## Cómo se dicta

1. Programar en `/admin/academia` el bloque del día con el módulo de la capacitación (para la 1: `general`). La lista de registrados se guarda siempre (el presentador la muestra); la asistencia que cuenta para el certificado solo se marca si hay bloque programado y el nombre registrado coincide con el de una cuenta inscrita en la academia. Sin bloque, el presentador lo avisa.
2. Abrir `/academia/taller/1` en la pantalla del proyector (F = pantalla completa) y la tecla P abre la vista de presentador en el portátil.
3. Flechas, PageDown, barra espaciadora o clicker: cada clic revela el siguiente paso de la escena; sin pasos, pasa a la siguiente.
4. Al cambiar de escena se abre en los celulares la pregunta de esa escena. Mientras la sesión está en curso (movida en las últimas 6 h), los participantes no ven la presentación, solo la sala.

## Dónde está cada cosa

- Contenido (puro): `src/lib/talleres/taller1.ts`; tipos en `tipos.ts`; registro en `index.ts`; reglas y pruebas en `reglas.ts`, `formato.ts`, `talleres.test.ts`.
- Datos: `src/lib/talleres/datos.ts` (tablas `ac_taller_estado`, `ac_taller_asistentes`, `ac_taller_respuestas`, `ac_taller_sala`; en las dos últimas `usuario_id` es el id del registro en `ac_taller_asistentes`). Quien se registra recibe un pase firmado (cookie `eko_sala`, `src/lib/auth.ts`) válido solo para esa capacitación y ese día. API pública de la sala: `src/pages/api/academia/sala.ts` (excepción en `src/middleware.ts`).
- IA en vivo: `src/lib/talleres/motorIA.ts`. La instrucción sale del contenido, nunca del navegador. Tope `TALLER_IA_TOPE_DIARIO_USD` (2 USD por defecto).
- API: `src/pages/api/academia/taller.ts`.
- Escenas: `src/components/taller/` (un componente por familia). Motor: `src/scripts/taller/proyector.ts`, hooks por tipo en `escenas.ts`, presentador y sala en sus archivos. Estilos: `src/styles/taller.css`, `presentador.css` y la sección de sala en `academia.css`.
- Prueba en navegador: `e2e/taller.spec.ts`.

## Para agregar la capacitación 2, 3 o 4

**Notas del presentador** (Mike, 2026-11-19): contenido de valor real para quien dicta, no instrucciones de clic. Qué explicar y por qué importa, la frase clave para decir, datos concretos, ejemplos de Ekosolv y errores comunes. Si la escena tiene pasos, una nota por paso más la de llegada (la prueba lo exige) para que se resalte la del momento. Las preguntas probables de la sala van en `siPreguntan`, con su respuesta, y salen plegadas bajo las notas.

Crear `src/lib/talleres/tallerN.ts` con la misma forma (bloques, escenas, interacciones, demos, `repaso` apuntando a preguntas de la 1) y sumarlo en `index.ts`. Si una escena necesita un tipo nuevo, agregar su marcado en `src/components/taller/` y su hook en `escenas.ts`.

## Pendientes

- Reemplazar el contenido marcado como provisional con material real de Ekosolv: el auto de la demo, las citas de "verdad o alucinación", los casos del semáforo y el certificado del anonimizador. Verificar las citas normativas antes de la sesión.
- Probar la demo con IA real en producción (en local usa el modelo simulado y muestra la respuesta guardada).
- Contenido de las capacitaciones 2, 3 y 4 cuando lleguen los documentos de cada área.
