# Ideas para las capacitaciones (por ejecutar)

Banco de ideas de Mike para ir construyendo. Cada idea guarda lo que pidió tal cual, lo que falta decidir y cómo encaja con lo que ya existe (`docs/plan-capacitaciones.md`). Al construir una, pasar sus decisiones al plan de capacitaciones y marcarla aquí como hecha.

## 1. Cierre de la capacitación 1: conectar cada cuenta a Zoho con Claude

Estado: idea (Mike, 2026-11-19). Nada construido.

### Qué quiere Mike

- El cierre de la capacitación 1 es una práctica real: **cada participante conecta su cuenta a Zoho** con Claude.
- Todo gira alrededor de esa conexión. Durante el proceso aparecen los conceptos y en cada momento se explica qué es y de qué se trata:
  - **MCP**: el estándar con el que Claude se conecta a otras herramientas.
  - **Conector**: la pieza ya armada que conecta Claude con una herramienta concreta (aquí, Zoho).
  - **Permisos**: qué le autoriza cada persona a Claude, y la diferencia entre **solo leer** y **también escribir**.
  - **Claude Desktop**: la aplicación de escritorio desde donde se hace todo.
  - **Control del navegador**: cómo Claude toma el control de un navegador y hace cosas que la persona no sabía hacer, con solo darle un objetivo y decirle si puede leer únicamente o también escribir.
- La idea de fondo que debe quedar: uno no da instrucciones clic por clic, da un **objetivo** y un **límite** (leer o escribir), y Claude resuelve el cómo.

### Presentación en el PC de cada participante

- La presentación se proyecta en la pantalla grande, pero cada participante puede abrirla también en el navegador de su PC si lo necesita.
- Requisito: haber entrado antes desde el celular (la sala de hoy, `/academia/sala`).
- Flujo de vinculación:
  1. En el PC escribe una URL corta.
  2. En la pantalla de su celular aparece un **código de dos números**.
  3. Escribe ese código en el PC para confirmar el acceso. Así el navegador del PC sabe a qué participante corresponde.

### El celular como guía paso a paso

- Durante la práctica lo normal es que minimicen la presentación para hacer los pasos con Zoho. Por eso **el celular debe mostrar textos y animaciones de lo que se está haciendo en cada paso**, sincronizado con quien dicta.
- Pasos que debe cubrir, en orden (cada uno con su explicación del concepto que aparece):
  1. **Iniciar sesión** en Claude con la cuenta correspondiente.
  2. **Instalar y configurar la extensión** de Claude en un navegador Chromium (Chrome, Edge, etc.).
  3. **Abrir Claude Desktop.**
  4. **Pedirle en el chat que configure Zoho.**
  5. **Claude empieza a pedir permisos**: qué está pidiendo, por qué, y qué significa aceptar solo lectura o también escritura.
  6. **Claude toma el control del navegador**: detallar qué hace en ese momento (abre pestañas, navega, llena formularios, lee la página) y qué ve la persona mientras tanto.
  7. Cierre: comprobar que la conexión con Zoho quedó funcionando con una consulta de prueba.

### Por decidir antes de construir

- **Código de dos números**: con 100 combinaciones el código debe ser único entre los participantes activos de ese día, vencer en pocos minutos y limitar los intentos fallidos por PC. Confirmar con Mike si así le sirve o si prefiere el flujo inverso (el PC muestra el código y se confirma en el celular).
- **Regla actual en conflicto**: hoy, mientras la sesión está en curso, los participantes no ven la presentación, solo la sala (`plan-capacitaciones.md`, "Cómo se dicta", punto 4). El PC vinculado sería la excepción: definir si el PC sigue la escena de quien dicta o si el participante puede navegar libre.
- **Cuentas**: con qué cuenta de Claude entra cada persona (plan Team de Ekosolv por confirmar, ver nota de datos personales) y si cada uno tiene usuario propio en Zoho o comparten.
- **Qué permisos se dan en el taller**: si en la práctica solo se autoriza lectura (más seguro para una primera vez) o también escritura con un ejemplo controlado.
- **Verificar antes de la sesión** (la herramienta cambia rápido): cómo se ve hoy el conector de Zoho en Claude Desktop, los nombres exactos de las pantallas de permisos, qué navegadores Chromium admite la extensión y qué plan de Claude exige cada cosa. Tomar capturas reales para las animaciones del celular.
- **Plan B**: qué hace el participante si su PC no deja instalar la extensión o la aplicación (permisos de administrador del equipo de Ekosolv), o si falla el internet. Por ejemplo, seguir la demo en la pantalla grande y en el celular.
- **Tiempo**: cuánto de las 4 horas toma este cierre con todo el grupo haciéndolo a la vez.

### Encaje con lo que ya existe

- La sala del celular ya sigue la escena de quien dicta (`src/scripts/taller/`, `src/pages/api/academia/sala.ts`) y ya muestra idea y ejemplo por escena (`Taller.celular`). Los pasos de esta práctica serían escenas nuevas al final de `src/lib/talleres/taller1.ts`, con un tipo de escena "paso guiado" para el celular (texto + animación por paso).
- El pase del celular (cookie `eko_sala`, válido solo esa capacitación y ese día) es la identidad a la que se vincula el PC.
- Relacionado: `docs/plan-zoho.md` (integración del sitio con Zoho, distinta de esta conexión personal de cada participante).
