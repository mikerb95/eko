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
 * soporte de Anthropic. Lo que NO se pudo ver sin conectar una cuenta: la
 * pantalla de autorización de Zoho y la de permisos por herramienta; sus
 * maquetas son ilustrativas y se ajustan con capturas reales antes del sábado.
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
    hacer: 'Revise que diga "By Zoho" y que tenga la marca de verificado. Toque Conectar.',
    queEs: 'MCP es el idioma común con el que Claude habla con otras herramientas. Un conector es esa conexión ya armada para una herramienta: este lo hizo Zoho y trae 41 herramientas, como buscar o leer registros.',
    maqueta: 'conector',
  },
  {
    concepto: 'Autorización',
    titulo: 'Autorice el acceso en la página de Zoho',
    hacer: 'Se abre una página de Zoho: inicie sesión con su usuario de Zoho y acepte el acceso.',
    queEs: 'Su contraseña se escribe en Zoho, nunca en Claude. Zoho le entrega a Claude una llave limitada: solo ve lo que su usuario ya puede ver, y usted la puede quitar cuando quiera.',
    maqueta: 'oauth',
  },
  {
    concepto: 'Leer o escribir',
    titulo: 'Deje bloqueada la escritura',
    hacer: 'En los permisos del conector deje permitidas las herramientas de lectura y bloquee las de escritura: crear, actualizar y borrar.',
    queEs: 'Leer es consultar sin tocar nada. Escribir es crear, cambiar o borrar registros. Empezamos solo con lectura: así ninguna instrucción mal dada cambia datos de un cliente.',
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
    hacer: 'Pregúntele: "¿Cuáles son mis cinco tratos abiertos más recientes en Zoho?" y fíjese que use el conector de Zoho.',
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
  minutos: 40,
  pasos: PASOS_ZOHO.length - 1,
  notas: [
    'Llegada. Esta práctica junta todo lo del día en una tarea real: cada uno sale con Claude conectado a su propio Zoho CRM. La idea que debe quedar: a Claude se le da un objetivo y un límite, no una lista de clics. Hoy el límite es solo lectura, y se dice así desde el principio. Pida que abran el PC y, quien quiera seguir la presentación ahí, que toque "Abrir en mi PC" en el celular: escribe la dirección que le sale y el código de dos números. El PC sigue la escena sola; si lo minimizan, el celular les muestra cada paso con su animación.',
    'Paso 1, la cuenta. Que entren a claude.ai en Google Chrome con el correo de Ekosolv y miren que el espacio sea el de la empresa. Es el mismo punto de seguridad de hace un rato: lo que se conecta desde la cuenta Team queda bajo el contrato de Ekosolv. Error común: tener abierta una sesión personal de Claude en el mismo Chrome; que cierren esa primero o usen otro perfil de Chrome.',
    'Paso 2, la extensión. Una extensión es un programa pequeño dentro del navegador. Claude in Chrome deja que Claude vea la pestaña y la use: leer, hacer clic, escribir. Dato clave: según el soporte de Anthropic solo funciona en Google Chrome, no en Edge, Brave ni otros navegadores parecidos. En plan Team viene habilitada por defecto, pero el administrador la puede apagar para toda la organización: confírmelo antes del sábado. Si el PC de alguien no deja instalar extensiones, que siga en la pantalla grande y en el celular.',
    'Paso 3, Claude Desktop. Es Claude instalado en el computador. Diferencia con la web: desde la aplicación se manejan los conectores y Claude puede trabajar con el navegador y con archivos del equipo. Que inicien sesión con la misma cuenta. Si alguien no la tiene instalada, hoy puede hacer los pasos 4 a 7 desde claude.ai en Chrome: los conectores son de la cuenta y aparecen en los dos lados.',
    'Paso 4, pedir. Escriban la frase tal cual: objetivo (conectar mi Zoho CRM) y límite (solo leer). Insista en que no le dijeron dónde hacer clic: Claude busca el conector y les dice qué sigue. Si Claude responde con pasos en vez de mostrar el conector, está bien: que sigan sus indicaciones o vayan a Personalizar, Conectores y busquen "Zoho".',
    'Paso 5, MCP y conector. MCP es un estándar abierto, el idioma común con el que una IA se conecta con otras herramientas; un conector es esa conexión ya armada para una herramienta concreta. Lo comprobado en el directorio: el conector se llama Zoho CRM, es "By Zoho", tiene la marca de verificado, trae 41 herramientas y dice que envía datos a claude-zohocrm.zohomcp.com. Que revisen que sea el de Zoho y no uno de terceros con nombre parecido. El botón puede salir en inglés: Connect.',
    'Paso 6, autorizar. Se abre la página de Zoho: la contraseña se escribe ahí, nunca en el chat de Claude. Zoho le da a Claude una llave limitada (eso es OAuth): Claude solo ve lo que el usuario de Zoho de cada persona ya puede ver, ni más ni menos. Por eso cada uno conecta con su propio usuario y no con el de un administrador. La llave se quita desde Claude (desconectar) o desde la cuenta de Zoho. Zoho cobra el uso en créditos de API de la cuenta: con consultas normales no se nota.',
    'Paso 7, permisos. Este es el corazón de la práctica. Leer es consultar sin tocar nada; escribir es crear, cambiar o borrar. De las 41 herramientas, varias escriben: Create_Records, Update_Record, Delete_Record, Delete_Records, Delete_Notes. Que las dejen en bloqueadas y las de lectura (Get_Records, Search_Records, Get_Modules) permitidas. Por qué: una instrucción mal dada con escritura abierta puede cambiar datos de un cliente. Más adelante, cuando haya confianza, se abre la escritura con aprobación de cada cambio. Verifique antes del sábado cómo se llaman hoy las opciones en la pantalla real.',
    'Paso 8, control del navegador. Claude abre una pestaña propia y trabaja ahí: toma una imagen de la pantalla, decide dónde hacer clic, hace clic, vuelve a mirar. Antes de entrar a un sitio nuevo pide permiso, y hay un botón para detenerlo en cualquier momento. Que miren la pestaña mientras trabaja: así se aprende qué hace. La frase lleva el límite otra vez ("solo lee, no hagas clic en guardar ni en borrar") porque el navegador no tiene el candado del paso 7: ahí el límite es la instrucción y los permisos de su usuario de Zoho.',
    'Paso 9, comprobar. Con el conector, Claude le pide los datos directo a Zoho: más rápido y exacto que mirando la pantalla. Que vean el aviso de que usó el conector de Zoho y que la respuesta coincida con lo que ven en su CRM. Cierre: "El conector para lo que tiene conector; el navegador para todo lo demás. Y siempre: objetivo, límite y revisar."',
  ],
  siPreguntan: [
    { p: '¿Claude puede ver todo el CRM de la empresa?', r: 'No. Ve lo mismo que su usuario de Zoho, con los mismos permisos de su perfil. Si usted no ve un módulo en Zoho, Claude tampoco.' },
    { p: '¿Y si me equivoco y lo dejo con escritura?', r: 'Vuelva a los permisos del conector y bloquee las herramientas de crear, actualizar y borrar. Mientras tanto, Claude igual le pregunta antes de usar las que piden aprobación.' },
    { p: '¿Funciona en Edge o en Brave?', r: 'La extensión, no: según Anthropic solo funciona en Google Chrome. El conector de Zoho sí funciona igual desde Claude Desktop o claude.ai, sin importar el navegador.' },
    { p: '¿Claude guarda mi contraseña de Zoho?', r: 'No. La contraseña se escribe en la página de Zoho. Claude recibe una llave limitada que usted puede quitar cuando quiera desde Claude o desde Zoho.' },
    { p: '¿Cómo lo desconecto?', r: 'En Claude: Personalizar, Conectores, Zoho CRM y desconectar. También puede quitar el acceso desde la seguridad de su cuenta de Zoho.' },
  ],
  datos: { pasos: PASOS_ZOHO },
}
