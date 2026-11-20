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

### Pendiente antes del sábado

- **Capturas reales** de la pantalla de autorización de Zoho y de la de permisos por herramienta, con una cuenta de Zoho de Ekosolv, y ajustar las maquetas `oauth` y `permisos` de `src/components/taller/Maqueta.astro`. Para eso hay que darle "Connect" al conector con una cuenta real (no se hizo).
- Confirmar en la consola de administración del plan Team que los conectores y Claude in Chrome estén habilitados para todos.
- **Tiempo**: el bloque "Conectar Zoho" suma 40 minutos y la capacitación 1 pasó de 4 h a 4 h 40. Decidir si se recorta otro bloque o se alarga la sesión.
- Saber quién tiene usuario propio en Zoho y Claude Desktop instalado (los pasos 4 a 7 también se pueden hacer desde claude.ai en Chrome).
- Plan B para quien no pueda instalar la extensión o la aplicación por permisos del equipo: seguir en la pantalla grande y el celular.
