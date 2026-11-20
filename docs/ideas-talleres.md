# Ideas para las capacitaciones (por ejecutar)

Banco de ideas de Mike para ir construyendo. Cada idea guarda lo que pidió tal cual, lo que falta decidir y cómo encaja con lo que ya existe (`docs/plan-capacitaciones.md`). Al construir una, pasar sus decisiones al plan de capacitaciones y marcarla aquí como hecha.

## 1. Cierre de la capacitación 1: conectar cada cuenta a Zoho con Claude

Estado: **construida** (2026-11-19). Lo que pidió Mike y lo que se decidió está abajo; el cómo funciona quedó en `docs/plan-capacitaciones.md`.

### Lo que pidió Mike

- Cierre práctico: cada participante conecta su cuenta de Claude a Zoho y en cada momento se explica el concepto que aparece (MCP, conector, permisos, Claude Desktop, control del navegador). La idea de fondo: a Claude se le da un **objetivo** y un **límite** (leer o escribir), no instrucciones clic por clic.
- Cada participante puede abrir la presentación en su PC: entra antes desde el celular, en el PC escribe una URL corta y confirma con un código de dos números que le aparece en el celular.
- Como van a minimizar la presentación para hacer los pasos, el celular muestra textos y animaciones de cada paso.

### Decisiones (Mike, 2026-11-19)

- El PC vinculado **sigue la escena** de quien dicta (no se navega libre).
- Cada uno entra con **su propia cuenta**, probablemente del plan Team de Ekosolv.
- En el taller el conector queda en **solo lectura**.
- El código lo muestra el celular y se escribe en el PC (el flujo que propuso Mike).

### Lo que se encontró al revisar el conector (2026-11-19)

- En el directorio de Claude existe el conector oficial **Zoho CRM** "By Zoho", verificado, con 41 herramientas (entre ellas `Delete_Record`, `Delete_Records`, `Delete_Notes`), que envía datos a `claude-zohocrm.zohomcp.com` y pide iniciar sesión. Capturas: `docs/capturas/zoho/`. Zoho también tiene conectores de Books, Desk, Projects y Show.
- En claude.ai el menú ya no se llama "Conectores" sino **Plugins** (filtro Connectors). En Claude Desktop puede verse distinto: confirmar.
- **Claude in Chrome solo funciona en Google Chrome**, no en Edge, Brave ni otros navegadores Chromium (soporte de Anthropic). En plan Team viene habilitada por defecto y el administrador la puede apagar.
- Fuentes de terceros sobre Zoho MCP dicen que en Claude cada herramienta se puede dejar en permitir, pedir aprobación o bloquear. No se pudo ver sin conectar una cuenta.

### Pendientes (trazabilidad)

Cada pendiente con la fecha en que se abrió. Al cerrarlo, se pasa a "Resueltos" con la fecha y cómo se resolvió; nunca se borra.

| # | Abierto | Pendiente | Quién | Estado |
|---|---|---|---|---|
| P1 | 2026-11-19 | **Capturas reales** de la pantalla de autorización de Zoho y de la de permisos por herramienta, con una cuenta de Zoho de Ekosolv. Con ellas, ajustar las maquetas `oauth` y `permisos` de `src/components/taller/Maqueta.astro`. Hay que darle "Connect" al conector con una cuenta real (el inicio de sesión en Zoho lo hace Mike). | Mike + Claude | Abierto |
| P2 | 2026-11-19 | **Confirmar el plan Team**: que la cuenta de Ekosolv sea Team y no Pro, y que en la administración estén habilitados los conectores y Claude in Chrome para todos. | Mike | Abierto |
| P3 | 2026-11-19 | Confirmar cómo se ve hoy el menú de conectores en **Claude Desktop** (en claude.ai ya se llama "Plugins") y ajustar las notas del paso 4 si cambia. | Mike + Claude | Abierto |
| P4 | 2026-11-19 | Saber **quién tiene usuario propio en Zoho** y Claude Desktop instalado. Los pasos 4 a 7 también se pueden hacer desde claude.ai en Chrome. | Mike | Abierto |
| P5 | 2026-11-19 | **Plan B** para quien no pueda instalar la extensión o la aplicación por permisos del equipo: seguir en la pantalla grande y en el celular. Confirmar si los PC de Ekosolv dejan instalar extensiones. | Mike | Abierto |
| P6 | 2026-11-19 | Probar el **PC vinculado en producción** (ekosolv.codebymike.net/pc) con un celular y un PC reales antes del sábado. En local ya pasó la prueba `e2e/zoho-pc.spec.ts`. | Mike | Abierto |

### Resueltos

| # | Abierto | Cerrado | Qué era | Cómo se resolvió |
|---|---|---|---|---|
| R1 | 2026-11-19 | 2026-11-19 | Tiempo: con el bloque de Zoho la capacitación 1 pasaba de 4 h a 4 h 40. | Mike: todo se dicta en 4 h y el descanso sigue en 15 min. Apertura 12, Por dentro 55, Alcances 30, Descanso 15, Cómo pedir 38, Práctica guiada 25, Seguridad 17, Conectar Zoho 35, Cierre 13. |
| R2 | 2026-11-19 | 2026-11-19 | Si el PC vinculado sigue la escena o se navega libre. | Mike: sigue la escena de quien dicta. |
| R3 | 2026-11-19 | 2026-11-19 | Con qué cuenta entra cada persona. | Mike: cada uno con su cuenta, probablemente del plan Team (confirmar en P2). |
| R4 | 2026-11-19 | 2026-11-19 | Permisos del conector en el taller. | Mike: solo lectura. |
| R5 | 2026-11-19 | 2026-11-19 | Navegadores compatibles con la extensión. | Revisado en el soporte de Anthropic: solo Google Chrome, no Edge ni Brave. Corregido en el contenido. |
