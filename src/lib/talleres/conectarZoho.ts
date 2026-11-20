/**
 * Cierre práctico de la capacitación 1: cada participante conecta su cuenta de
 * Claude a Zoho CRM, en modo solo lectura (Mike, 2026-11-19). Módulo PURO.
 *
 * Es una sola escena de tipo `conectar` con 9 pasos. `PASOS_ZOHO[k]` es lo que
 * se ve en el paso k (0 = la llegada, con el objetivo): el proyector lo pinta
 * grande y el celular lo repite con su maqueta animada, porque durante la
 * práctica la mayoría minimiza la presentación para hacer los pasos en su PC.
 *
 * Lo comprobado el 2026-11-19 en el directorio de Claude: el conector "Zoho
 * CRM" es de Zoho (verificado), trae 41 herramientas (entre ellas
 * Delete_Record, Delete_Records y Delete_Notes), envía datos a
 * claude-zohocrm.zohomcp.com y pide iniciar sesión. Claude in Chrome solo
 * funciona en Google Chrome (no en Edge, Brave ni otros Chromium) según el
 * soporte de Anthropic.
 *
 * Conexión real hecha el 2026-11-19 con un CRM de prueba de Mike (capturas en
 * docs/capturas/zoho/): al tocar Connect, Claude pide la región de la cuenta;
 * después vienen DOS autorizaciones (Zoho MCP: Deny/Allow; Zoho Accounts:
 * Accept/Reject) y en ninguna se puede elegir solo lectura, porque Zoho pide
 * también crear, actualizar y borrar. La lectura se impone en Claude: pestaña
 * Permissions del conector, grupos "Read-only tools" (21) y "Write/delete
 * tools" (19), cada herramienta con Always allow, Needs approval, Always ask o
 * Blocked (por defecto Needs approval). El aviso con el que Claude pide
 * aprobación antes de usar una herramienta no se vio: su maqueta es ilustrativa.
 */
import type { Escena, PasoGuiado } from './tipos.ts'

export const PASOS_ZOHO: PasoGuiado[] = [
  {
    concepto: 'Objetivo y límite',
    titulo: 'Vamos a conectar Claude con su Zoho CRM',
    hacer: 'Tenga a mano su PC con Google Chrome, su usuario de Zoho y la cuenta de Claude de Ekosolv. Si quiere ver la presentación en su PC, toque "Abrir en mi PC" aquí abajo.',
    queEs: 'A Claude no se le dan instrucciones clic por clic: se le da un objetivo (conectar Zoho) y un límite (solo leer). Él resuelve el cómo, y usted revisa.',
    maqueta: 'objetivo',
  },
  {
    concepto: 'La cuenta de la empresa',
    titulo: 'Entre a Claude con la cuenta de Ekosolv',
    hacer: 'En Google Chrome abra claude.ai e inicie sesión con su correo de Ekosolv. Revise que el espacio que aparece sea el de Ekosolv y no uno personal.',
    queEs: 'La cuenta de la empresa la administra Ekosolv y tiene contrato de protección de datos. Lo que conecte desde ahí queda bajo esas reglas, no bajo una cuenta personal.',
    maqueta: 'cuenta',
  },
  {
    concepto: 'Extensión del navegador',
    titulo: 'Instale Claude in Chrome',
    hacer: 'En la Chrome Web Store busque "Claude" (de Anthropic) y toque Agregar a Chrome. Fíjela con el ícono de la pieza de rompecabezas y entre con la misma cuenta de Ekosolv.',
    queEs: 'Una extensión es un programa pequeño que vive dentro del navegador. Esta deja que Claude vea una pestaña y la use como usted: leer, hacer clic, escribir. Solo funciona en Google Chrome.',
    maqueta: 'extension',
  },
  {
    concepto: 'Claude Desktop',
    titulo: 'Abra Claude Desktop',
    hacer: 'Abra la aplicación de escritorio de Claude e inicie sesión con la misma cuenta de Ekosolv.',
    queEs: 'Es Claude instalado en el computador, no en una pestaña. Desde ahí maneja los conectores y puede trabajar con el navegador y con los archivos del equipo.',
    maqueta: 'desktop',
  },
  {
    concepto: 'Pedir con objetivo y límite',
    titulo: 'Pídale que conecte Zoho',
    hacer: 'Escriba en el chat: "Quiero conectar mi Zoho CRM. Solo para leer: no crees, cambies ni borres nada."',
    queEs: 'No le dijo dónde hacer clic. Le dio el objetivo y el límite, y Claude le muestra el conector que sirve y qué sigue.',
    maqueta: 'pedir',
  },
  {
    concepto: 'MCP y conector',
    titulo: 'Este es el conector de Zoho CRM',
    hacer: 'Revise que diga "By Zoho" y que tenga la marca de verificado. Toque Connect y elija la región de su cuenta de Zoho: normalmente United States.',
    queEs: 'MCP es el idioma común con el que Claude habla con otras herramientas. Un conector es esa conexión ya armada para una herramienta: este lo hizo Zoho y trae 41 herramientas, como buscar o leer registros.',
    maqueta: 'conector',
  },
  {
    concepto: 'Autorización',
    titulo: 'Autorice el acceso en Zoho: son dos pantallas',
    hacer: 'Si no tiene abierta la sesión de Zoho, primero le pide entrar. Después vienen dos pantallas de Zoho: en la primera toque Allow y en la segunda, Accept.',
    queEs: 'Su contraseña se escribe en Zoho, nunca en Claude. Zoho le entrega a Claude una llave que solo ve lo que su usuario ya puede ver. Ojo: Zoho pide permiso para todo, también para escribir. El límite se pone en el paso siguiente, en Claude.',
    maqueta: 'oauth',
  },
  {
    concepto: 'Leer o escribir',
    titulo: 'Deje bloqueada la escritura',
    hacer: 'En Claude abra el conector Zoho CRM, pestaña Permissions. En "Write/delete tools" elija Blocked. Deje "Read-only tools" en Needs approval.',
    queEs: 'Leer es consultar sin tocar nada. Escribir es crear, cambiar o borrar registros. Con la escritura bloqueada, ninguna instrucción mal dada cambia datos de un cliente. Con la lectura en "Needs approval", Claude le pide permiso cada vez que va a leer.',
    maqueta: 'permisos',
  },
  {
    concepto: 'Control del navegador',
    titulo: 'Mire cómo Claude usa Chrome',
    hacer: 'Pídale: "Abre Zoho CRM en Chrome y dime cuántos tratos abiertos tengo. Solo lee: no hagas clic en guardar ni en borrar." Mire la pestaña mientras trabaja.',
    queEs: 'Claude abre su propia pestaña, mira la pantalla, decide dónde hacer clic y lo hace, paso a paso. Antes de entrar a un sitio nuevo le pide permiso, y usted lo puede detener cuando quiera.',
    maqueta: 'navegador',
  },
  {
    concepto: 'Conector o navegador',
    titulo: 'Compruebe que quedó conectado',
    hacer: 'Pregúntele: "¿Cuáles son mis cinco tratos abiertos más recientes en Zoho?". Claude le pide permiso para leer: apruébelo y fíjese que use el conector de Zoho.',
    queEs: 'Con el conector, Claude le pide los datos directo a Zoho: es más rápido y exacto. El navegador queda para lo que no tiene conector: cualquier página que usted pueda abrir.',
    maqueta: 'prueba',
  },
]

export const ESCENA_ZOHO: Escena = {
  id: 'zoho',
  bloque: 'conectar',
  tipo: 'conectar',
  kicker: 'Práctica final',
  titulo: 'Conecte Claude con su Zoho, solo para leer',
  minutos: 35,
  pasos: PASOS_ZOHO.length - 1,
  notas: [
    'Llegada. Esta práctica junta todo lo del día en una tarea real: cada uno sale con Claude conectado a su propio Zoho CRM. La idea que debe quedar: a Claude se le da un objetivo y un límite, no una lista de clics. Hoy el límite es solo lectura, y se dice así desde el principio. Pida que abran el PC y, quien quiera seguir la presentación ahí, que toque "Abrir en mi PC" en el celular: escribe la dirección que le sale y el código de dos números. El PC sigue la escena sola; si lo minimizan, el celular les muestra cada paso con su animación.',
    'Paso 1, la cuenta. Que entren a claude.ai en Google Chrome con el correo de Ekosolv y miren que el espacio sea el de la empresa. Es el mismo punto de seguridad de hace un rato: lo que se conecta desde la cuenta Team queda bajo el contrato de Ekosolv. Error común: tener abierta una sesión personal de Claude en el mismo Chrome; que cierren esa primero o usen otro perfil de Chrome.',
    'Paso 2, la extensión. Una extensión es un programa pequeño dentro del navegador. Claude in Chrome deja que Claude vea la pestaña y la use: leer, hacer clic, escribir. Dato clave: según el soporte de Anthropic solo funciona en Google Chrome, no en Edge, Brave ni otros navegadores parecidos. En plan Team viene habilitada por defecto, pero el administrador la puede apagar para toda la organización: confírmelo antes del sábado. Si el PC de alguien no deja instalar extensiones, que siga en la pantalla grande y en el celular.',
    'Paso 3, Claude Desktop. Es Claude instalado en el computador. Diferencia con la web: desde la aplicación se manejan los conectores y Claude puede trabajar con el navegador y con archivos del equipo. Que inicien sesión con la misma cuenta. Si alguien no la tiene instalada, hoy puede hacer los pasos 4 a 7 desde claude.ai en Chrome: los conectores son de la cuenta y aparecen en los dos lados.',
    'Paso 4, pedir. Escriban la frase tal cual: objetivo (conectar mi Zoho CRM) y límite (solo leer). Insista en que no le dijeron dónde hacer clic: Claude busca el conector y les dice qué sigue. Si Claude responde con pasos en vez de mostrar el conector, está bien: que sigan sus indicaciones o vayan a Personalizar, Conectores y busquen "Zoho".',
    'Paso 5, MCP y conector. MCP es un estándar abierto, el idioma común con el que una IA se conecta con otras herramientas; un conector es esa conexión ya armada para una herramienta concreta. Lo comprobado en el directorio: el conector se llama Zoho CRM, es "By Zoho", tiene la marca de verificado, trae 41 herramientas y dice que envía datos a claude-zohocrm.zohomcp.com. Que revisen que sea el de Zoho y no uno de terceros con nombre parecido. Al tocar Connect, Claude pide la región donde vive la cuenta de Zoho (United States, Europe, India...): la de Ekosolv casi seguro es United States; si al entrar a Zoho la dirección es crm.zoho.com, es esa. Si eligen mal, la autorización falla y se vuelve a intentar con otra.',
    'Paso 6, autorizar. Son dos pantallas, compruébelo en las capturas de docs/capturas/zoho: primero "Zoho MCP: This application wants to access your Zoho MCP Account" con Deny y Allow; después la de Zoho Accounts, "MCP would like to access the following information", con una lista larga y Accept y Reject al final (hay que bajar para verlos). La contraseña se escribe en Zoho, nunca en el chat de Claude. Zoho le da a Claude una llave limitada (eso es OAuth): solo ve lo que el usuario de Zoho de cada persona ya puede ver. Punto clave: la lista pide también "Update resources", "Add resources" y "Delete resources". En Zoho no se puede elegir solo lectura; el límite se pone en Claude en el paso 7. Cada uno conecta con su propio usuario y no con el de un administrador. La llave se quita desde Claude (desconectar) o desde la cuenta de Zoho. Zoho cobra el uso en créditos de API: con consultas normales no se nota.',
    'Paso 7, permisos. Este es el corazón de la práctica. En Claude, conector Zoho CRM, pestaña Permissions: dos grupos, "Read-only tools" (21, como ZohoCRM_searchRecords o ZohoCRM_getRecord) y "Write/delete tools" (19, como ZohoCRM_createRecords, ZohoCRM_updateRecord y ZohoCRM_deleteRecord, que borra para siempre). Cada uno tiene cuatro opciones: Always allow, Needs approval, Always ask y Blocked; por defecto todo viene en Needs approval. Que pongan el grupo de escritura en Blocked con el menú de la derecha del grupo (cambia las 19 de una vez). Por qué Blocked y no Needs approval: la misma pantalla avisa que en modo Auto Claude puede actuar sin preguntar aunque diga Needs approval; Blocked no deja nunca. La lectura se deja en Needs approval para que vean a Claude pedir permiso en el paso 9. Más adelante, con confianza, la escritura se abre con Always ask.',
    'Paso 8, control del navegador. Claude abre una pestaña propia y trabaja ahí: toma una imagen de la pantalla, decide dónde hacer clic, hace clic, vuelve a mirar. Antes de entrar a un sitio nuevo pide permiso, y hay un botón para detenerlo en cualquier momento. Que miren la pestaña mientras trabaja: así se aprende qué hace. La frase lleva el límite otra vez ("solo lee, no hagas clic en guardar ni en borrar") porque el navegador no tiene el candado del paso 7: ahí el límite es la instrucción y los permisos de su usuario de Zoho.',
    'Paso 9, comprobar. Antes de leer, Claude pide permiso porque la lectura quedó en Needs approval: que lo aprueben y vean el nombre de la herramienta que va a usar. Con el conector, Claude le pide los datos directo a Zoho: más rápido y exacto que mirando la pantalla. Que comparen la respuesta con lo que ven en su CRM. Cierre: "El conector para lo que tiene conector; el navegador para todo lo demás. Y siempre: objetivo, límite y revisar."',
  ],
  siPreguntan: [
    { p: '¿Claude puede ver todo el CRM de la empresa?', r: 'No. Ve lo mismo que su usuario de Zoho, con los mismos permisos de su perfil. Si usted no ve un módulo en Zoho, Claude tampoco.' },
    { p: '¿Y si me equivoco y lo dejo con escritura?', r: 'Vuelva a la pestaña Permissions del conector y ponga "Write/delete tools" en Blocked. Mientras estén en Needs approval, Claude pregunta antes de usarlas, salvo en modo Auto.' },
    { p: '¿Por qué Zoho me pidió permiso para borrar si dijimos solo lectura?', r: 'Porque Zoho pide todo de una vez y no deja elegir. El candado lo pone usted en Claude, bloqueando las herramientas de escritura.' },
    { p: '¿Funciona en Edge o en Brave?', r: 'La extensión, no: según Anthropic solo funciona en Google Chrome. El conector de Zoho sí funciona igual desde Claude Desktop o claude.ai, sin importar el navegador.' },
    { p: '¿Claude guarda mi contraseña de Zoho?', r: 'No. La contraseña se escribe en la página de Zoho. Claude recibe una llave limitada que usted puede quitar cuando quiera desde Claude o desde Zoho.' },
    { p: '¿Cómo lo desconecto?', r: 'En Claude: Personalizar, Conectores, Zoho CRM y desconectar. También puede quitar el acceso desde la seguridad de su cuenta de Zoho.' },
  ],
  datos: { pasos: PASOS_ZOHO },
}
