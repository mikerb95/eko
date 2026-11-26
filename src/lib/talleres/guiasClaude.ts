/**
 * Guías animadas de Claude (/academia/recursos/guias). Módulo PURO: el texto
 * de cada paso y el id de la escena que lo ilustra (src/components/guias/Escena.astro).
 *
 * Verificado contra la documentación oficial el 2026-11-26:
 * - Siigo: conector oficial en beta, conector personalizado con
 *   https://mcp.siigo.com/mcp-adapter y login de Siigo; antes se activan en
 *   Siigo Nube las credenciales de integración tipo MCP (developers.siigo.com,
 *   ver memoria siigo-integracion-claude).
 * - Zoho: conector "Zoho CRM" del directorio, de Zoho y verificado, con región
 *   y dos autorizaciones (src/lib/talleres/conectarZoho.ts, conexión real del
 *   2026-11-19).
 * - Microsoft 365 (support.claude.com 12542951 y 15183774): en Team el dueño de
 *   la organización lo agrega en Organization settings > Connectors y un
 *   Global Administrator de Microsoft Entra da un consentimiento único; cada
 *   persona entra por Customize > Connectors con su cuenta de trabajo. Trae
 *   SharePoint, OneDrive, Outlook y Teams; escribir depende del administrador.
 *   Los complementos de Excel, PowerPoint y Word salen en AppSource como
 *   "Claude for Microsoft 365" (claude.com/docs/office-agents/excel).
 * - Skills (support.claude.com 12512198, claude.com/docs/skills/how-to):
 *   Settings > Capabilities con "Code execution and file creation" activo;
 *   Customize > Skills > "+" > Create skill > Upload a skill; el ZIP lleva la
 *   carpeta con SKILL.md adentro, no el archivo suelto; skill-creator es de
 *   Anthropic.
 * - Plugins (claude.com/docs/cowork/guide/plugins): Customize > Plugins,
 *   catálogo oficial de Anthropic; instalar no conecta los conectores.
 * - Créditos (support.claude.com 8977456): prepago en Billing con rol Admin o
 *   Billing, recarga automática con umbral y saldo objetivo, sin saldo la API
 *   deja de responder, vencen un año después de la compra y no se reembolsan.
 * - Instalación (support.claude.com 10065433): claude.com/download, macOS 13
 *   o superior y Windows 10 o superior; en Windows, Cowork necesita aceptar el
 *   permiso de administrador al instalar y la virtualización activa.
 * - Tareas programadas (support.claude.com 13854387): Cowork, Scheduled o
 *   /schedule; New task con Create with Claude o Set up manually; corren en la
 *   nube salvo que usen una carpeta del equipo (Require this computer).
 *
 * Los nombres de botones y menús van en inglés, como salen hoy en la cuenta de
 * Ekosolv, con la traducción entre paréntesis la primera vez.
 */

export type GrupoGuia = 'conectar' | 'usar' | 'empezar'

export interface PasoGuiaClaude {
  titulo: string
  hacer: string
  /** Id de la escena animada en src/components/guias/Escena.astro. */
  escena: string
  /** Segundos que dura el paso en reproducción automática. */
  seg?: number
}

export interface GuiaClaude {
  id: string
  grupo: GrupoGuia
  titulo: string
  /** Para qué sirve, en una frase. */
  paraQue: string
  quien: string
  minutos: number
  color: string
  pasos: PasoGuiaClaude[]
  /** Lo que conviene saber antes de usarlo. */
  ojo?: string
  fuente: { texto: string; url: string }
}

export const GRUPOS: { id: GrupoGuia; titulo: string; texto: string }[] = [
  { id: 'conectar', titulo: 'Conectar Claude', texto: 'Con sus datos reales: contabilidad, clientes, correo y archivos.' },
  { id: 'usar', titulo: 'Sacarle provecho', texto: 'Enseñarle cómo trabaja Ekosolv y dejarlo trabajando solo.' },
  { id: 'empezar', titulo: 'Para empezar', texto: 'Instalar la aplicación y entender cómo se paga la API.' },
]

export const GUIAS: GuiaClaude[] = [
  {
    id: 'siigo',
    grupo: 'conectar',
    titulo: 'Conectar Claude con Siigo',
    paraQue: 'Preguntarle a Claude por facturas, clientes y productos de Siigo sin exportar nada.',
    quien: 'Activa Siigo: quien administra Siigo · Agrega el conector: el administrador de Claude',
    minutos: 10,
    color: '#0F7DC2',
    pasos: [
      {
        titulo: 'Active la integración en Siigo Nube',
        hacer: 'Entre a Siigo Nube con un usuario administrador. Vaya a Configuración, Alianzas e integraciones, Credenciales de integración (Siigo API) y active la credencial de tipo MCP.',
        escena: 'sg-activar',
      },
      {
        titulo: 'Agregue el conector en Claude',
        hacer: 'En Claude abra Customize (Personalizar), Connectors (Conectores), toque "+" y elija Add custom connector (Agregar conector personalizado). Nombre: Siigo. Dirección: https://mcp.siigo.com/mcp-adapter. En el plan de equipo de Ekosolv este paso lo hace el administrador una sola vez.',
        escena: 'sg-agregar',
        seg: 8,
      },
      {
        titulo: 'Conéctese con su usuario de Siigo',
        hacer: 'Toque Connect (Conectar). Se abre la página de Siigo: escriba su usuario y contraseña ahí, nunca en Claude, y autorice el acceso.',
        escena: 'sg-login',
      },
      {
        titulo: 'Pruébelo con una consulta',
        hacer: 'Pregunte, por ejemplo: "¿Qué facturas de venta se emitieron esta semana y por qué valor?". Claude pide permiso antes de usar Siigo y le muestra la respuesta con los datos de la factura.',
        escena: 'sg-probar',
        seg: 8,
      },
    ],
    ojo: 'Está en beta. Consulta facturas de venta y de compra, clientes y productos. Puede crear facturas de venta y clientes solo si usted lo confirma, y nunca borra. Una factura creada así es real ante la DIAN: para practicar, solo consulte.',
    fuente: { texto: 'Documentación del MCP de Siigo', url: 'https://developers.siigo.com/docs/siigoapi/MCP/1-documentation/' },
  },
  {
    id: 'zoho',
    grupo: 'conectar',
    titulo: 'Conectar Claude con Zoho CRM',
    paraQue: 'Consultar tratos, contactos y cuentas de Zoho desde el chat, y crear o cambiar registros con su permiso.',
    quien: 'Cada persona, con su usuario de Zoho',
    minutos: 8,
    color: '#D33A2C',
    pasos: [
      {
        titulo: 'Busque el conector oficial',
        hacer: 'En Claude abra Customize, Connectors y busque "Zoho CRM". Revise que diga By Zoho y tenga la marca Verified (verificado).',
        escena: 'zh-buscar',
      },
      {
        titulo: 'Conecte y elija la región',
        hacer: 'Toque Connect y elija la región donde está su cuenta de Zoho. Para Ekosolv normalmente es United States.',
        escena: 'zh-region',
      },
      {
        titulo: 'Autorice en Zoho: son dos pantallas',
        hacer: 'Si no tiene la sesión abierta, Zoho le pide entrar. Luego, en la primera pantalla toque Allow (Permitir) y en la segunda Accept (Aceptar).',
        escena: 'zh-oauth',
      },
      {
        titulo: 'Deje la escritura con permiso',
        hacer: 'En la pestaña Permissions (Permisos) del conector, ponga el grupo Write/delete tools en Always ask (Preguntar siempre). Así Claude le pide permiso antes de crear, cambiar o borrar.',
        escena: 'zh-permisos',
      },
      {
        titulo: 'Pruébelo',
        hacer: 'Pregunte: "¿Cuáles son mis cinco tratos abiertos más recientes en Zoho?". Si el modo de permisos del chat está en Manual, verá el aviso para aprobar.',
        escena: 'zh-probar',
        seg: 8,
      },
    ],
    ojo: 'Zoho le da a Claude los mismos permisos que tiene su usuario. El control de cuándo escribe se pone en Claude, en Permissions.',
    fuente: { texto: 'Conector de Zoho CRM en Claude', url: 'https://claude.com/marketplace/connectors/zoho-crm' },
  },
  {
    id: 'office',
    grupo: 'conectar',
    titulo: 'Conectar Claude con Office (Microsoft 365)',
    paraQue: 'Que Claude busque en su correo de Outlook, en SharePoint, OneDrive y Teams, y que trabaje dentro de Excel, Word y PowerPoint.',
    quien: 'Activa: el administrador de Claude y el de Microsoft · Conecta: cada persona',
    minutos: 10,
    color: '#2B6CB0',
    pasos: [
      {
        titulo: 'El administrador lo habilita una vez',
        hacer: 'El dueño de la cuenta de Claude va a Organization settings (Configuración de la organización), Connectors, busca Microsoft 365 y toca Add to your team. Después, un administrador global de Microsoft (Entra) da el consentimiento una sola vez.',
        escena: 'of-admin',
        seg: 8,
      },
      {
        titulo: 'Cada persona conecta su cuenta',
        hacer: 'En Claude abra Customize, Connectors, busque Microsoft 365 y toque Connect. Si le pregunta, elija cuenta de trabajo o escuela y entre con su correo de Ekosolv.',
        escena: 'of-conectar',
      },
      {
        titulo: 'Qué puede leer',
        hacer: 'Con la cuenta de trabajo, Claude busca en Outlook (correo y calendario), SharePoint, OneDrive y Teams, siempre con los permisos que usted ya tiene. Enviar correos o editar archivos solo funciona si el administrador lo activó.',
        escena: 'of-apps',
      },
      {
        titulo: 'Pídale algo que cruce aplicaciones',
        hacer: 'Por ejemplo: "Busca en mi Outlook los correos de esta semana sobre el informe de cumplimiento y resume qué falta, con el enlace al archivo en SharePoint".',
        escena: 'of-probar',
        seg: 8,
      },
      {
        titulo: 'Extra: Claude dentro de Excel, Word y PowerPoint',
        hacer: 'En la tienda de complementos de Office (AppSource) busque "Claude for Microsoft 365" y toque Get it now. Abra Excel, active el complemento e inicie sesión con su cuenta de Claude. Outlook tiene su propio complemento: "Claude for Outlook".',
        escena: 'of-excel',
        seg: 8,
      },
    ],
    ojo: 'En el plan de equipo solo se conectan cuentas de trabajo o escuela, no cuentas personales de Outlook.com.',
    fuente: { texto: 'Ayuda de Claude: conectar Microsoft 365', url: 'https://support.claude.com/en/articles/15183774-connect-to-microsoft-365' },
  },
  {
    id: 'skills',
    grupo: 'usar',
    titulo: 'Crear una skill',
    paraQue: 'Explicarle a Claude una vez, por escrito, cómo hace Ekosolv una tarea, para que lo haga igual siempre.',
    quien: 'Cada persona',
    minutos: 15,
    color: '#179C91',
    pasos: [
      {
        titulo: 'Revise que pueda crear archivos',
        hacer: 'En Settings (Configuración), Capabilities (Capacidades), deje activo Code execution and file creation (ejecutar código y crear archivos). Las skills lo necesitan. Si no le aparece, la administración de la cuenta lo tiene apagado.',
        escena: 'sk-activar',
      },
      {
        titulo: 'Pídale a Claude que la arme con usted',
        hacer: 'En Customize, Skills, active skill-creator (de Anthropic). Luego escriba: "Ayúdame a crear una skill para [tarea que repito cada semana]. Hazme las preguntas una por una y al final dame el archivo listo para subir".',
        escena: 'sk-pedir',
        seg: 8,
      },
      {
        titulo: 'Así es una skill por dentro',
        hacer: 'Una carpeta con un archivo SKILL.md. Arriba, el nombre y la descripción de cuándo usarla; abajo, los pasos, el formato y las reglas, en español. La descripción es lo más importante: Claude la lee para decidir cuándo abrirla.',
        escena: 'sk-archivo',
        seg: 8,
      },
      {
        titulo: 'Súbala',
        hacer: 'En Customize, Skills, toque "+", Create skill y Upload a skill (Subir una skill). Suba el ZIP que le entregó Claude. Ojo: el ZIP debe tener la carpeta adentro, no el SKILL.md suelto.',
        escena: 'sk-subir',
      },
      {
        titulo: 'Úsela sin nombrarla',
        hacer: 'Deje el interruptor encendido y pida la tarea como siempre. Cuando la petición encaja con la descripción, Claude abre la skill sola y lo dice en la respuesta.',
        escena: 'sk-usar',
        seg: 8,
      },
    ],
    ojo: 'Una skill enseña cómo trabajar, pero no da acceso a ningún sistema. Para leer Zoho o Siigo hace falta el conector.',
    fuente: { texto: 'Ayuda de Claude: crear skills', url: 'https://support.claude.com/en/articles/12512198-how-to-create-custom-skills' },
  },
  {
    id: 'plugins',
    grupo: 'usar',
    titulo: 'Usar los plugins',
    paraQue: 'Instalar en un paso un paquete con skills, conectores y comandos para un oficio.',
    quien: 'Cada persona, en Claude Desktop',
    minutos: 8,
    color: '#7A5AF8',
    pasos: [
      {
        titulo: 'Abra el catálogo',
        hacer: 'En Claude Desktop abra Customize en la barra lateral y luego Plugins. En Discover (Descubrir) está el catálogo oficial de Anthropic, organizado por oficio.',
        escena: 'pl-catalogo',
      },
      {
        titulo: 'Mire qué trae y agréguelo',
        hacer: 'Abra el plugin que le sirva (por ejemplo, el de finanzas o el de ventas). Revise las skills, los comandos y los conectores que trae, y toque Install (Instalar).',
        escena: 'pl-instalar',
      },
      {
        titulo: 'Conecte sus conectores',
        hacer: 'Instalar el plugin no inicia sesión en nada. Vaya a la pestaña Connectors del plugin y conecte cada uno con su usuario, como hizo con Zoho.',
        escena: 'pl-conectores',
      },
      {
        titulo: 'Úselo con la barra',
        hacer: 'Escriba "/" en el chat para ver los comandos del plugin y elija uno. Las skills que trae se abren solas cuando la tarea encaja.',
        escena: 'pl-usar',
        seg: 8,
      },
      {
        titulo: 'Ajústelo a Ekosolv',
        hacer: 'Desde la página del plugin puede pedirle a Claude que lo adapte: cambiar el tono, agregar una skill propia o quitar un conector que no usa.',
        escena: 'pl-ajustar',
      },
    ],
    ojo: 'Instale solo plugins del catálogo oficial o que le entregue Ekosolv: un plugin puede traer programas que corren con los permisos de su computador.',
    fuente: { texto: 'Documentación de plugins de Claude', url: 'https://claude.com/docs/cowork/guide/plugins' },
  },
  {
    id: 'rutinas',
    grupo: 'usar',
    titulo: 'Crear rutinas automatizadas',
    paraQue: 'Que Claude haga una tarea solo, con horario: cada lunes, cada día, el 5 de cada mes.',
    quien: 'Cada persona, en Claude Desktop (Cowork)',
    minutos: 10,
    color: '#C96442',
    pasos: [
      {
        titulo: 'Abra las tareas programadas',
        hacer: 'En Claude Desktop entre a Cowork y toque Scheduled (Programadas) en la barra lateral. También puede escribir /schedule dentro de cualquier tarea de Cowork.',
        escena: 'ru-abrir',
      },
      {
        titulo: 'Cree la tarea',
        hacer: 'Toque New task (Nueva tarea). Elija Create with Claude para que la arme conversando con usted, o Set up manually (Configurar a mano) para llenar los campos.',
        escena: 'ru-nueva',
      },
      {
        titulo: 'Escriba una instrucción completa',
        hacer: 'Como si se la dejara a alguien que no estuvo en la conversación: qué revisar, dónde, qué entregar y qué hacer si no hay nada. Ejemplo: "Revisa en Zoho CRM las propuestas sin respuesta hace más de 7 días y déjame un borrador de correo de seguimiento para cada una. No envíes nada".',
        escena: 'ru-instruccion',
        seg: 9,
      },
      {
        titulo: 'Ponga el horario',
        hacer: 'Elija la frecuencia (cada hora, diaria, entre semana o manual), la hora y, si quiere, el modelo. Para tareas sencillas que corren todos los días, Haiku es suficiente.',
        escena: 'ru-horario',
      },
      {
        titulo: 'Déjela correr y revise',
        hacer: 'Corre en la nube: no necesita el PC encendido, salvo que use una carpeta de su computador (Require this computer). Cada ejecución queda como una conversación que usted revisa. Ejecútela una vez a mano para probarla.',
        escena: 'ru-corre',
        seg: 8,
      },
    ],
    ojo: 'Que la tarea entregue borradores y resúmenes, no que envíe correos ni cambie registros sola. Lo que entrega, se revisa.',
    fuente: { texto: 'Ayuda de Claude: tareas programadas en Cowork', url: 'https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork' },
  },
  {
    id: 'windows',
    grupo: 'empezar',
    titulo: 'Instalar Claude en Windows',
    paraQue: 'Tener Claude Desktop en el PC, con Cowork, tareas programadas y plugins.',
    quien: 'Cada persona (puede pedir permiso de administrador)',
    minutos: 5,
    color: '#0067B8',
    pasos: [
      {
        titulo: 'Descárguelo',
        hacer: 'Abra claude.com/download y toque Download for Windows (Descargar para Windows). Necesita Windows 10 o superior. También está en la Microsoft Store.',
        escena: 'win-descargar',
      },
      {
        titulo: 'Instálelo',
        hacer: 'Abra el archivo descargado. Si Windows pide permiso de administrador, acéptelo: sin ese permiso la instalación queda sin Cowork, que es donde están las tareas programadas y los plugins.',
        escena: 'win-instalar',
      },
      {
        titulo: 'Ábralo e inicie sesión',
        hacer: 'Búsquelo en el menú Inicio como Claude, ábralo y entre con su correo de Ekosolv. Revise que el espacio sea el de Ekosolv.',
        escena: 'win-entrar',
      },
    ],
    ojo: 'Cowork también necesita la virtualización activa en el PC. Si no le aparece Cowork, pídale ayuda a quien administra los equipos.',
    fuente: { texto: 'Ayuda de Claude: instalar Claude Desktop', url: 'https://support.claude.com/en/articles/10065433-install-claude-desktop' },
  },
  {
    id: 'mac',
    grupo: 'empezar',
    titulo: 'Instalar Claude en Mac',
    paraQue: 'Tener Claude Desktop en el Mac, con Cowork, tareas programadas y plugins.',
    quien: 'Cada persona',
    minutos: 5,
    color: '#1D2329',
    pasos: [
      {
        titulo: 'Descárguelo',
        hacer: 'Abra claude.com/download y toque Download for macOS (Descargar para Mac). Necesita macOS 13 Ventura o superior; sirve para chip Apple o Intel.',
        escena: 'mac-descargar',
      },
      {
        titulo: 'Arrástrelo a Aplicaciones',
        hacer: 'Abra el archivo .dmg descargado y arrastre el ícono de Claude a la carpeta Aplicaciones.',
        escena: 'mac-arrastrar',
      },
      {
        titulo: 'Ábralo e inicie sesión',
        hacer: 'Abra Claude desde Aplicaciones o con Spotlight. Si el Mac pregunta si quiere abrirlo, toque Abrir. Entre con su correo de Ekosolv.',
        escena: 'mac-entrar',
      },
    ],
    fuente: { texto: 'Ayuda de Claude: instalar Claude Desktop', url: 'https://support.claude.com/en/articles/10065433-install-claude-desktop' },
  },
  {
    id: 'creditos',
    grupo: 'empezar',
    titulo: 'Cómo funciona el crédito de platform.claude.com',
    paraQue: 'Entender de dónde sale lo que gastan el asistente del panel y las automatizaciones que usan la API.',
    quien: 'Quien administra la facturación',
    minutos: 6,
    color: '#2E8B57',
    pasos: [
      {
        titulo: 'Son dos cuentas distintas',
        hacer: 'La suscripción del equipo (claude.ai y Claude Desktop) se paga por persona. platform.claude.com es la consola de la API: la usan los programas, como el asistente del panel de Ekosolv. Su saldo es aparte: uno no paga el otro.',
        escena: 'cr-dos',
        seg: 8,
      },
      {
        titulo: 'Se compra por adelantado',
        hacer: 'Con rol Admin o Billing, entre a platform.claude.com, Billing (Facturación) y toque Buy credits (Comprar créditos). El saldo queda disponible de inmediato.',
        escena: 'cr-comprar',
      },
      {
        titulo: 'Se gasta por uso',
        hacer: 'Cada vez que un programa le pregunta algo a Claude con una llave de la API, se descuenta según el texto que entra y el que sale. Opus cuesta más que Sonnet, y Sonnet más que Haiku. El consumo se ve en Usage (Uso).',
        escena: 'cr-gasto',
        seg: 8,
      },
      {
        titulo: 'Recarga automática',
        hacer: 'En Billing, en el saldo, active la recarga automática: elija un mínimo y el saldo al que debe volver. Cuando baja del mínimo, compra solo y no se interrumpe nada.',
        escena: 'cr-recarga',
      },
      {
        titulo: 'Si se acaba, se detiene',
        hacer: 'Sin saldo, la API deja de responder y el asistente del panel queda sin servicio hasta que se recargue. Los créditos vencen un año después de comprados y no se reembolsan: compre según el consumo real.',
        escena: 'cr-cero',
        seg: 8,
      },
    ],
    ojo: 'Las llaves de la API (API keys) dan acceso a ese saldo: no se pegan en correos ni en chats.',
    fuente: { texto: 'Ayuda de Claude: pagar el uso de la API', url: 'https://support.claude.com/en/articles/8977456-how-do-i-pay-for-my-claude-api-usage' },
  },
]

export const SEG_PASO = 7

export function guia(id: string): GuiaClaude | undefined {
  return GUIAS.find((g) => g.id === id)
}
