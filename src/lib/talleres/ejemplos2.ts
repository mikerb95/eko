/**
 * Lo que ve cada participante en el celular en cada escena de la capacitación
 * 2 (idea en palabras sencillas y, en las escenas de concepto, un ejemplo de
 * su área). Mismo enfoque por área que la capacitación 1 (ver ejemplos1.ts).
 * En las escenas de retos el celular muestra los retos (retos2.ts) en vez de
 * la idea. Módulo PURO.
 */
import type { GuiaCelular } from './tipos.ts'

export const CELULAR_TALLER2: Record<string, GuiaCelular> = {
  portada: {
    idea: 'Hoy va a poner a Claude a trabajar con su caso real: qué modelo usar, cómo enseñarle el procedimiento de Ekosolv, cómo conectarlo a Zoho y cómo dejarlo trabajando solo.',
  },
  sala: {
    idea: 'Ya quedó registrado. Deje esta página abierta: aquí vota, aquí salen los retos de la práctica y aquí le avisamos cuando llegue su turno de acompañamiento.',
  },
  modelos: {
    idea: 'Claude tiene tres modelos en el mismo selector: Opus (el experto, lento y profundo), Sonnet (el todoterreno) y Haiku (el rápido). Se elige según la tarea.',
    areas: {
      operaciones: { titulo: 'Un auto largo y delicado', texto: 'Para cruzar un auto de 60 páginas con la licencia del cliente, Opus. Para sacar la tabla de obligaciones de un auto corto, Sonnet basta.' },
      logistica: { titulo: 'Los correos del día', texto: 'Clasificar las solicitudes que llegaron hoy es trabajo de Haiku: rápido y casi no gasta. Para redactar la respuesta a un cliente molesto, Sonnet.' },
      ventas: { titulo: 'La propuesta', texto: 'Del Brief al borrador de propuesta, Sonnet. Para una licitación grande con muchos anexos, Opus.' },
      mercadeo: { titulo: 'Ideas y piezas', texto: 'Lluvia de títulos para LinkedIn, Haiku. El texto final de una pieza con tono de marca, Sonnet.' },
      gerencia: { titulo: 'El embudo comercial', texto: 'Ordenar las propuestas sin respuesta, Sonnet. Un análisis de qué servicios dejan más margen con datos de varios años, Opus.' },
      finanzas: { titulo: 'Balances y requerimientos', texto: 'Listar cuentas con variación, Sonnet. Analizar un requerimiento de la DIAN contra los soportes del año, Opus, y la contadora confirma cada cifra.' },
    },
  },
  carrera: {
    idea: 'La misma petición sale a la vez para los tres modelos. Fíjese en cuánto tarda cada uno y en qué agrega cada respuesta: ¿hacía falta el más lento?',
  },
  orbita: {
    idea: 'Cuatro piezas: la skill (el procedimiento), el conector (el enchufe a sus sistemas), el plugin (la caja que las trae juntas) y la tarea programada (el reloj).',
  },
  skill: {
    idea: 'Una skill es un archivo SKILL.md con un nombre, una descripción de cuándo usarla y las instrucciones. Claude lee las descripciones y abre la skill completa solo cuando su petición encaja.',
    areas: {
      operaciones: { titulo: 'Revisión de autos', texto: 'Con la skill basta escribir "revisa este auto": sale la tabla de Ekosolv con artículo, plazo, responsable y "no aparece" donde falta un dato.' },
      logistica: { titulo: 'Cruce de certificados', texto: 'La skill compara los kilos del certificado del gestor con la planilla de recolección y le marca lo que no cuadra antes de emitir el de Ekosolv.' },
      ventas: { titulo: 'Propuesta desde el Brief', texto: 'La skill sabe la estructura de la propuesta de Ekosolv y deja los precios en blanco para que usted los ponga.' },
      mercadeo: { titulo: 'Tono Ekosolv', texto: 'La skill escribe con la voz de la marca, evita las palabras que no usamos y nunca inventa una cifra.' },
      gerencia: { titulo: 'Seguimiento de propuestas', texto: 'La skill ordena las propuestas sin respuesta por valor y días, y redacta el correo para retomar cada una según su historia.' },
      finanzas: { titulo: 'Comparativo de balances', texto: 'La skill compara dos periodos con el formato de Ekosolv y explica solo las variaciones que pasan del umbral que usted fije.' },
    },
  },
  enchufe: {
    idea: 'Un conector le da a Claude acceso a un sistema (Zoho, el correo, Canva) con permisos que usted controla. MCP es el estándar de ese enchufe, como el USB.',
    areas: {
      operaciones: { titulo: 'El cliente antes del expediente', texto: 'Con el conector, Claude busca en Zoho la línea de servicio del cliente antes de revisar el auto. VITAL y la ANLA no tienen conector: se consultan con Claude in Chrome.' },
      logistica: { titulo: 'Solicitudes sin copiar y pegar', texto: 'Claude lee en Zoho las solicitudes de la semana y le dice cuáles no tienen certificado. Si va a crear un registro, le pide permiso primero.' },
      ventas: { titulo: 'El Brief desde Zoho', texto: 'Claude trae el Brief del prospecto directo de Zoho y arma la propuesta. Usted no copia nada.' },
      mercadeo: { titulo: 'Canva conectado', texto: 'Con el conector de Canva, Claude crea o ajusta la pieza a partir del texto que acaban de escribir juntos.' },
      gerencia: { titulo: 'El embudo en vivo', texto: 'Claude consulta las Quotes y los tratos de Zoho y le arma el tablero de la semana con datos actualizados.' },
      finanzas: { titulo: 'Siigo ya tiene enchufe', texto: 'Con el conector oficial de Siigo (beta), Claude consulta las facturas de compra de un proveedor sin exportar nada. Los balances todavía se exportan a Excel. Zoho Books puede conectarse con el MCP de Zoho (por verificar el plan).' },
    },
  },
  plugin: {
    idea: 'Un plugin junta skills, conectores y comandos en una caja que se instala en un paso. Después de instalarlo, cada conector se conecta con su usuario.',
    areas: {
      operaciones: { titulo: 'Plugin de Operaciones', texto: 'Revisión de autos, informe anual y el conector de Zoho, todo junto, para que un consultor nuevo quede listo en minutos.' },
      logistica: { titulo: 'Plugin de Logística', texto: 'Cruce de certificados, respuestas tipo a clientes y el conector de Zoho en un solo paquete.' },
      ventas: { titulo: 'Plugin Comercial', texto: 'Skill de propuestas, tono Ekosolv, conector de Zoho y el comando /propuesta.' },
      mercadeo: { titulo: 'Plugin de Mercadeo', texto: 'Tono Ekosolv, búsqueda de tendencias y el conector de Canva.' },
      gerencia: { titulo: 'Plugin de Gerencia', texto: 'Seguimiento de propuestas, resumen del embudo y el conector de Zoho, con un comando /semana.' },
      finanzas: { titulo: 'Plugin de Finanzas', texto: 'Comparativo de balances, requerimientos DIAN y Hacienda y el calendario tributario.' },
    },
  },
  reloj: {
    idea: 'Una tarea programada es una instrucción con horario. Corre en la nube aunque su PC esté apagado y deja el resultado como una conversación que usted revisa.',
    areas: {
      operaciones: { titulo: 'Normas de la semana', texto: 'Cada lunes, Claude busca resoluciones nuevas de la ANLA y del Ministerio sobre RAEE y RESPEL y le deja la lista con el enlace oficial.' },
      logistica: { titulo: 'Solicitudes del día', texto: 'Cada día a las 4 p. m., la tabla de solicitudes de recolección creadas en Zoho, con las que no tienen dirección marcadas.' },
      ventas: { titulo: 'Prospectos quietos', texto: 'Cada lunes, los prospectos sin actividad en 14 días con un correo corto para cada uno, como borrador.' },
      mercadeo: { titulo: 'Tendencias del viernes', texto: 'Cada viernes, tres noticias de sostenibilidad en Colombia con su fuente y una idea de pieza para cada una.' },
      gerencia: { titulo: 'Propuestas frías', texto: 'Cada lunes a las 7, las Quotes con más de 7 días sin respuesta, ordenadas por valor, con el correo de seguimiento listo.' },
      finanzas: { titulo: 'Calendario tributario', texto: 'El 5 de cada mes, qué vence ese mes según el calendario de la DIAN, con las fechas verificadas en la página oficial.' },
    },
  },
  flujo: {
    idea: 'Zoho automatiza con reglas fijas cuando pasa algo (un evento). Claude automatiza tareas que piden leer y redactar. Lo mejor es combinarlas.',
    areas: {
      operaciones: { titulo: 'Vencimiento de un permiso', texto: 'Zoho avisa cuando un permiso está a 60 días de vencer. Claude redacta el correo al cliente con lo que debe preparar para la renovación.' },
      logistica: { titulo: 'Solicitud nueva', texto: 'Zoho asigna la solicitud al coordinador apenas se crea. Claude, en la tarea de la tarde, resume las del día y marca las incompletas.' },
      ventas: { titulo: 'Brief nuevo', texto: 'Zoho crea la tarea "armar propuesta" cuando entra un Brief. Claude hace el primer borrador con la skill.' },
      mercadeo: { titulo: 'Cliente nuevo', texto: 'Zoho Marketing envía el correo de bienvenida. Claude propone la publicación del caso de éxito cuando el cliente lo autoriza.' },
      gerencia: { titulo: 'Quote enviada', texto: 'Zoho marca la Quote como fría a los 7 días. La tarea de Claude del lunes redacta el seguimiento de cada una.' },
      finanzas: { titulo: 'Factura vencida', texto: 'Zoho Books envía el recordatorio automático de cobro. Claude arma el informe de cartera con la explicación de los casos raros.' },
    },
  },
  consigna: {
    idea: 'Trabaje los cinco retos a su ritmo con el caso que trajo. Marque cada reto al terminarlo. Quien dicta lo acompaña 15 minutos: aquí le avisamos cuando le toque.',
  },
  'retos-a': {
    idea: 'Siga los retos con su caso. Cuando falte poco para su turno, aquí le aparece el aviso.',
  },
  descanso: {
    idea: 'Diez minutos de descanso. Si está en su turno de acompañamiento, puede seguir.',
  },
  'retos-b': {
    idea: 'Vaya por la tarea programada: que Claude haga solo, cada semana, algo que hoy usted hace a mano.',
  },
  muestra: {
    idea: 'Mire en la pantalla lo que construyó el grupo hoy. Si su skill o su tarea le sirvió, cuéntela.',
  },
  sigue: {
    idea: 'Esta semana use la skill de su área en tres casos reales y revise su tarea programada cuando corra. Abajo están las herramientas recomendadas para su área.',
    herramientas: true,
  },
  cierre: {
    idea: 'Escanee el código de la pantalla para guardar la tarjeta resumen con las cuatro piezas y las plantillas de hoy.',
  },
}
