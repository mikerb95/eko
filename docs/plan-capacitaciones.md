# Capacitaciones presentadas desde el sitio

> `/academia/taller/<n>` (proyector), `/academia/taller/<n>/presentador` (solo admin), `/academia/sala` (celular) y `/academia/taller/<n>/resumen` (tarjeta). Construido el 2026-11-19.

## Decisiones de Mike (2026-11-19)

| Tema | Decisión |
|---|---|
| Programa | 4 capacitaciones presenciales de 4 h. La 1 es general; la 2, 3 y 4 tratan los temas de las áreas. **Todo el equipo asiste a los cuatro sábados**, sin separar por áreas (Mike, 2026-11-19). El cronograma de temas por sábado no está definido: no se muestra ninguno. |
| Dónde | ekosolv.codebymike.net/academia/taller/1, con login de la academia. |
| Público | Responde desde el celular: el QR abre `/academia/sala`, que pide nombres, apellidos (mayúscula inicial automática), correo y área, **sin usuario ni contraseña**. Al enviarlo le llega al correo el enlace de entrada (Resend, remitente `academia@codebymike.net`, misma `RESEND_API_KEY` del portafolio); al abrirlo queda la asistencia y entra. El enlace sirve solo para esa capacitación y ese día; un reenvío por persona cada 60 s. Al mismo correo llegará después el material (guías, plantillas, recursos visuales): el correo queda en `ac_taller_asistentes.correo` (Mike, 2026-11-19, ya no se pide cargo). Regla: **ningún QR lleva a un login**. El QR de la práctica guiada abre la misma sala, que en esa escena se vuelve el revisor de instrucciones; el del cierre abre la tarjeta resumen, que es pública. |
| Celular por área | En cada escena sin votación, el celular muestra la idea que se explica en pantalla, en palabras sencillas, y debajo un ejemplo de esa idea para el área que la persona eligió al registrarse (`src/lib/talleres/ejemplos1.ts`, `Taller.celular`; ejemplos ilustrativos hasta tener documentos reales). Toda escena sin votación tiene idea; 15 tienen ejemplo por área. Debajo, una caja para enviarle preguntas a quien dicta: llegan a la vista de presentador con nombre, área y escena, y se quitan con "Respondida" (Mike, 2026-11-19). Cada pregunta trae una **respuesta sugerida por la IA** para decirla en voz alta (Mike, 2026-11-19): la pide la vista de presentador al mostrar la pregunta (así el celular no espera), con el tema y las notas de la escena como contexto, y se guarda en `ac_taller_preguntas.respuesta_ia` para no pagarla dos veces. Al participante no le llega. Usa el mismo tope diario de la IA de la capacitación; si falla, el presentador lo dice y se responde con las notas. Hasta 20 preguntas por persona al día. La pantalla del celular no se apaga mientras la sala está abierta. |
| IA | En vivo con respaldo: Claude responde en el momento; si falla, se muestra la respuesta guardada, marcada como tal. |
| Motion | En las 4 capacitaciones. |
| Funciones | Vista de presentador, asistencia automática, evaluación antes y después, repaso al iniciar los sábados 2 a 4, tarjeta resumen, apertura con datos del diagnóstico. |
| Fuera | Reto cronometrado y preguntas anónimas (no los eligió). |

## Práctica guiada y PC vinculado (Mike, 2026-11-19)

- **Práctica final de Zoho** (bloque `conectar`, 35 min): escena `zoho` de tipo `conectar` con 9 pasos (`src/lib/talleres/conectarZoho.ts`). Cada paso tiene concepto, qué hacer, qué es y una maqueta animada (`src/components/taller/Maqueta.astro`, estilos en `src/styles/maquetas.css`). El proyector muestra la ruta de pasos y el paso actual (`Conectar.astro`, hook `conectar` en `escenas.ts`); el celular repite el paso actual con su maqueta. Solo lectura. Las maquetas son ilustraciones; la del conector copia el directorio de Claude.
- **El paso también se guarda** (columna `paso` de `ac_taller_estado`): lo mandan el proyector y la vista de presentador en cada clic (con 250 ms de espera). Lo siguen el celular y el PC vinculado.
- **Proyector y presentador en equipos distintos** (Mike, 2026-11-20): además del canal local (BroadcastChannel, instantáneo en el mismo equipo), cada ventana consulta `GET ?que=estado` cada segundo y se mueve si la otra cambió escena o paso. La columna `mov` (marca del último movimiento) evita que una respuesta vieja deshaga uno más nuevo, y durante 2 s tras un movimiento propio no se le hace caso al servidor. Los botones "Pedir" y "Generar" van también por el servidor (columna `orden`, con id para no atenderlos dos veces). El proyector de quien dicta recibe el aviso de inicio en esa misma consulta. Código: `seguirRed` en `src/scripts/taller/comun.ts`.
- **PC vinculado**: en la sala, "Abrir en mi PC" muestra la dirección corta `/pc` y un código de dos números (10 a 99, único entre los vigentes, vence en 5 minutos, sirve una vez; tabla `ac_taller_codigos_pc`). En `/pc` se escribe y el PC recibe la cookie `eko_pc` (el mismo pase firmado de la sala, en otra cookie): con ella abre `/academia/taller/<n>` sin cuenta y la presentación sigue la escena y el paso de quien dicta (consulta `/api/academia/pc` cada 2 s; el teclado no la mueve). Con `eko_pc` no se vota ni se pregunta. Los intentos fallidos se limitan por IP (30 cada 10 min, holgado porque la oficina sale por una sola IP). Cuando el PC usa el código, el celular lo avisa. Al terminar la sesión, el PC muestra que ya no está en curso.
- Prueba en navegador: `e2e/zoho-pc.spec.ts` (va después de `taller.spec.ts` porque esa espera la base limpia).

## Formulario de cierre por área (Mike, 2026-11-19)

- Cuando la presentación llega a su **última escena**, cada celular pasa solo a `/academia/sala/opinion`, con el formulario del área con la que la persona se registró (si ya lo envió, no lo vuelve a mandar).
- Cuatro preguntas abiertas: duda sin resolver, qué va a poner en práctica, qué cambiaría y **qué le gustaría ver o solucionar en la siguiente capacitación** (en la 4 dice "después de estas capacitaciones"). Cada campo trae una sugerencia de cómo empezar (placeholder) con el lenguaje de su área. Hay que responder al menos una. Campos y sugerencias: `src/lib/talleres/opinion.ts` (Ventas y Mercadeo con sugerencias generales hasta iterar su contenido).
- **No es anónimo**: la persona lo ve dicho en el formulario. Se guarda en `ac_taller_opiniones` (una fila por asistente; si lo corrige, se actualiza) y solo se lee en `/admin/academia`, pestaña **Opiniones** (solo admin; gerencia entra como admin). Ahí se anota cómo se resolvió cada duda y queda fecha y quién; el contador de la pestaña son las dudas pendientes.
- Después de enviarlo, el celular ofrece la tarjeta resumen.
- Prueba en navegador: `e2e/zz-cierre.spec.ts` (va de último porque deja registros en la base).

## Cómo se dicta

1. Programar en `/admin/academia` el bloque del día con el módulo de la capacitación (para la 1: `general`). La lista de registrados se guarda siempre (el presentador la muestra); la asistencia que cuenta para el certificado solo se marca si hay bloque programado y el nombre registrado coincide con el de una cuenta inscrita en la academia. Sin bloque, el presentador lo avisa.
2. Abrir `/academia/taller/1` en la pantalla del proyector (F = pantalla completa) y la vista de presentador en `/academia/taller/1/presentador`, en el mismo equipo o en otro. Los PC de los participantes entran por `/pc` con el código de dos números que les muestra el celular.
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

- Prueba real del enlace por correo en producción (RESEND_API_KEY "ekosolv-academia" configurada el 2026-11-19).
- Enviar el material de cada capacitación al correo de los asistentes (`ac_taller_asistentes.correo`): por decidir qué, cuándo y desde dónde se manda.
- Reemplazar el contenido marcado como provisional con material real de Ekosolv: el auto de la demo, las citas de "verdad o alucinación", los casos del semáforo y el certificado del anonimizador. Verificar las citas normativas antes de la sesión.
- Probar la demo con IA real en producción (en local usa el modelo simulado y muestra la respuesta guardada).
- Contenido de las capacitaciones 2, 3 y 4 cuando lleguen los documentos de cada área.
- Práctica de Zoho y PC vinculado: pendientes en `docs/ideas-talleres.md` (capturas reales de autorización y permisos, habilitar en el plan Team).
