/**
 * Lo que ve cada participante en el celular mientras el proyector está en
 * una escena de la capacitación 1 (cuando no hay pregunta para votar ni
 * práctica abierta):
 *
 * - `idea`: lo que se está explicando en pantalla, en palabras sencillas. Es
 *   igual para todos.
 * - `areas`: cómo se ve esa idea en el trabajo del área que la persona eligió
 *   al registrarse: una situación concreta (`titulo`) y qué pasa y qué hacer
 *   (`texto`).
 *
 * Los ejemplos por área son ilustrativos, no documentos reales de Ekosolv: el
 * celular los marca así. Enfoque por área que pidió Mike (2026-11-19):
 * - Gerencia: Zoho, tableros de control, cierre de oportunidades, propuestas y
 *   automatización de procesos.
 * - Finanzas: Siigo Nube, costeos, nómina, procedimientos para el manual,
 *   automatización y revisiones, bancos, DIAN y Secretaría de Hacienda.
 * - Operaciones: normativa, autoridades (ANLA, CAR), autos administrativos,
 *   vigencias y cambios en las leyes.
 * - Logística: Zoho, tableros, revisión del correo, avisos de eventos y
 *   seguimiento de cifras y solicitudes.
 * Ventas y Mercadeo quedan pendientes de iterar. Las pruebas exigen idea en toda escena sin votación ni
 * práctica, y ejemplo para las seis áreas donde haya `areas`.
 */
import type { GuiaCelular } from './tipos.ts'

export const CELULAR_TALLER1: Record<string, GuiaCelular> = {
  portada: {
    idea: 'Hoy va a ver qué es la IA por dentro, en qué sirve, en qué se equivoca y cómo usarla con cuidado en su trabajo. En este celular va a votar y a ver ejemplos de su área.',
  },
  sala: {
    idea: 'Ya quedó registrado. Deje esta página abierta: aquí aparecen las preguntas para votar y, en cada tema, un ejemplo de su área.',
  },
  diagnostico: {
    idea: 'Estos son los resultados de la encuesta que respondió el propio equipo: cuántas horas se van en tareas repetitivas y cuáles son. La meta es recuperar ese tiempo para el trabajo que necesita criterio.',
  },
  reglas: {
    idea: 'Un programa normal solo hace lo que alguien dejó escrito en reglas. Un modelo de IA aprendió de miles de ejemplos, por eso puede con casos que nadie previó.',
    areas: {
      operaciones: { titulo: 'Cada autoridad redacta a su manera', texto: 'Una lista de chequeo busca "presentar el informe". Si el auto de la CAR dice "allegar la documentación soporte" y el de la ANLA "remitir las evidencias", la regla no los encuentra. La IA entiende que es la misma obligación.' },
      logistica: { titulo: 'Correos que no siguen un formato', texto: 'Un cliente escribe "necesitamos que pasen por unas canecas el jueves" y otro manda una tabla. Una regla de correo no reconoce los dos como solicitud de recolección. La IA sí, y puede pasar los datos a Zoho en el mismo formato.' },
      ventas: { titulo: 'El cliente no usa las palabras del catálogo', texto: 'Un prospecto escribe: "tenemos unos equipos viejos y unas canecas de aceite". Ningún formulario lo clasifica. La IA entiende que habla de RAEE y de RESPEL.' },
      mercadeo: { titulo: 'Comentarios en redes', texto: 'Clasificar comentarios por palabras clave falla con la ironía o con preguntas mal escritas. La IA los agrupa por lo que la persona quiso decir.' },
      gerencia: { titulo: 'Oportunidades que se enfrían', texto: 'Un tablero con reglas fijas solo marca la oportunidad que lleva 30 días quieta. La IA puede leer el último correo del cliente y notar que dijo "lo miramos el otro año", aunque en Zoho la etapa siga abierta.' },
      finanzas: { titulo: 'Pagos que no se llaman igual', texto: 'El extracto dice "PAGO PSE 8901..." y en Siigo Nube la factura figura con el nombre del cliente. Una regla exacta no los cruza. La IA reconoce que es el mismo pago y propone la conciliación para que usted la confirme.' },
    },
  },
  perillas: {
    idea: 'Por dentro, un modelo es una cantidad enorme de números que se ajustaron durante el entrenamiento. Nadie le escribió lo que sabe: lo aprendió viendo ejemplos y corrigiendo sus errores.',
    areas: {
      operaciones: { titulo: 'Como un consultor que empieza', texto: 'Después de leer muchos autos de la ANLA y de las CAR, una persona nueva reconoce dónde están las obligaciones sin una regla por autoridad. El modelo aprendió de forma parecida, pero con millones de textos.' },
      logistica: { titulo: 'Como un auxiliar que ya leyó muchos correos', texto: 'Con la práctica se distingue una solicitud de un reclamo o de un simple saludo. El modelo aprendió igual: ejemplo, error, corrección, miles de millones de veces. Cómo trabaja Ekosolv no lo sabe: eso se lo da usted.' },
      ventas: { titulo: 'Como un comercial con experiencia', texto: 'Tras muchas reuniones, se reconoce qué necesita un cliente por cómo habla. El modelo no tiene esa experiencia en Ekosolv: la sacó de textos en general. Su conocimiento del negocio se lo da usted.' },
      mercadeo: { titulo: 'Escribe como lo que leyó', texto: 'El modelo aprendió a escribir de textos de todo tipo. Por eso, sin indicaciones, suena genérico. Para que suene a Ekosolv hay que mostrarle la voz de la marca.' },
      gerencia: { titulo: 'Sabe de propuestas, no de Ekosolv', texto: 'Aprendió de millones de propuestas y contratos en general. No conoce los precios, los clientes ni el estilo de Ekosolv: para una propuesta que cierre, esa información se la da usted.' },
      finanzas: { titulo: 'Aprendió a escribir, no a calcular', texto: 'Su entrenamiento fue predecir texto. Puede razonar sobre un costeo o una nómina, pero las sumas largas se hacen en Siigo Nube o en la hoja de cálculo, o se le pide que use una herramienta para calcular.' },
    },
  },
  tokens: {
    idea: 'La IA parte el texto en pedazos llamados tokens: las palabras cortas suelen ir enteras, las largas y las cifras se parten en varios pedazos. Lo que puede leer de una vez y lo que cuesta se miden en tokens, no en páginas.',
    areas: {
      operaciones: { titulo: 'Un expediente lleno de números', texto: 'Radicados, números de expediente y fechas se parten en muchos tokens. Un auto de 40 páginas cabe sin problema; el expediente completo con sus anexos, no. Dele solo los actos que tocan su pregunta.' },
      logistica: { titulo: 'Una bandeja de correo completa', texto: 'Los correos de una semana caben; los de tres meses, con firmas, respuestas citadas y adjuntos, no. Pase solo los hilos que tienen solicitudes abiertas.' },
      ventas: { titulo: 'El Brief y el historial de correos', texto: 'El Brief de Zoho cabe de sobra. Si además pega meses de correos con el cliente, la IA reparte su atención entre mucho texto que no aporta. Pegue solo lo que sirve para la propuesta.' },
      mercadeo: { titulo: 'El límite de caracteres', texto: 'La IA cuenta en tokens, no en letras. Por eso a veces se pasa aunque usted le pida "máximo 200 caracteres". Cuente usted antes de publicar.' },
      gerencia: { titulo: 'El embudo exportado de Zoho', texto: 'Exportar todas las oportunidades con todas sus columnas gasta muchos tokens y dispersa la respuesta. Para ver qué se puede cerrar este mes, deje solo las abiertas, con etapa, valor y fecha del último contacto.' },
      finanzas: { titulo: 'Un reporte exportado de Siigo Nube', texto: 'Un auxiliar contable de un año tiene miles de filas de cifras, y las cifras gastan muchísimos tokens. Exporte solo el periodo y las cuentas que necesita para la pregunta.' },
    },
  },
  siguiente: {
    idea: 'La IA escribe eligiendo, una tras otra, la palabra más probable según lo que va antes. Por eso suena natural, y por eso también puede escribir algo falso con total seguridad.',
    areas: {
      operaciones: { titulo: 'La vigencia que suena bien', texto: 'Si pregunta hasta cuándo está vigente un permiso sin darle la resolución, la IA escribirá una fecha probable. Las vigencias salen del acto administrativo, nunca de la memoria de la IA.' },
      logistica: { titulo: 'El aviso al cliente', texto: 'Si pide un aviso de "su recolección quedó programada para el..." y no le da la fecha, la IA pondrá una que suene bien. Las fechas y las cifras de cada aviso salen de Zoho.' },
      ventas: { titulo: 'Tres versiones del seguimiento', texto: 'Pedir tres versiones de un correo sirve justamente porque cada vez elige palabras distintas. Usted escoge la que suena a Ekosolv.' },
      mercadeo: { titulo: 'Ideas contra datos', texto: 'Para una lluvia de ideas conviene que se arriesgue. Para un texto que cita una norma, pídale que se ciña al documento que le entrega.' },
      gerencia: { titulo: 'Tres versiones del cierre', texto: 'Pedir tres versiones del correo para cerrar una oportunidad sirve justamente porque cada vez elige palabras distintas. Usted escoge la que mejor le habla a ese cliente.' },
      finanzas: { titulo: 'Un total que suena bien', texto: 'Si le pregunta el costo de la nómina del mes sin darle el reporte, escribirá un número probable, no el real. Las cifras salen de Siigo Nube, nunca de la memoria de la IA.' },
    },
  },
  mapa: {
    idea: 'Para la IA, las palabras que se usan en situaciones parecidas quedan cerca unas de otras. Así entiende sinónimos y frases que nunca vio escritas igual.',
    areas: {
      operaciones: { titulo: 'Puede preguntar con sus palabras', texto: 'Si el auto dice "medidas de manejo" y usted pregunta por "obligaciones del PMA", la IA entiende que es lo mismo. Igual con "requerir", "ordenar" e "imponer la obligación".' },
      logistica: { titulo: 'Recogida, retiro, que pasen por', texto: 'Los clientes piden el servicio con palabras distintas. La IA reconoce todas como solicitud de recolección, y por eso sirve para clasificar el correo antes de crear el registro en Zoho.' },
      ventas: { titulo: 'Cotización, propuesta, oferta', texto: 'Para la IA son vecinas. Puede pedirle "la oferta para el cliente" y entiende que se trata de la propuesta comercial.' },
      mercadeo: { titulo: 'Cerca no es igual', texto: '"Sostenibilidad", "economía circular" y "aprovechamiento" quedan cerca, y la IA tiende a usarlas como sinónimos. Revise que cada palabra diga lo que Ekosolv quiere decir.' },
      gerencia: { titulo: 'Propuesta, cotización, oferta', texto: 'Para la IA son vecinas. Puede pedirle "la oferta para el cliente" y entiende que habla de la propuesta comercial, aunque en Zoho el registro tenga otro nombre.' },
      finanzas: { titulo: 'Cartera, cuentas por cobrar, saldos vencidos', texto: 'La IA entiende que hablan de lo mismo, aunque en el reporte de Siigo Nube la columna tenga otro nombre.' },
    },
  },
  etapas: {
    idea: 'La IA aprendió de textos escritos hasta cierta fecha. Lo que pasó después no lo sabe, a menos que usted se lo dé o que la herramienta busque en internet.',
    areas: {
      operaciones: { titulo: 'La norma que cambió', texto: 'Si la autoridad expidió una resolución hace poco o una ley cambió un trámite, la IA puede no saberlo y responder con la regla anterior. Pegue el texto vigente y confírmelo en la fuente oficial.' },
      logistica: { titulo: 'Lo que pasó hoy', texto: 'La IA no sabe qué recolecciones se hicieron hoy ni qué correos llegaron, a menos que una herramienta conectada a Zoho o al correo se lo muestre. Esas cifras salen de los registros, no de ella.' },
      ventas: { titulo: 'Investigar un prospecto', texto: 'Lo que sabe de una empresa puede estar desactualizado. Si la herramienta no busca en internet, confirme en la página del cliente antes de la reunión.' },
      mercadeo: { titulo: 'Fechas del calendario', texto: 'Puede proponerle fechas o tendencias de un año anterior. El calendario editorial siempre se revisa contra el año en curso.' },
      gerencia: { titulo: 'Cómo va cada oportunidad', texto: 'La IA no sabe en qué va un cliente ni qué se habló en la última reunión. Para preparar el cierre, dele lo que está en Zoho: etapa, última nota y propuesta enviada.' },
      finanzas: { titulo: 'Valores que cambian cada año', texto: 'La UVT, el salario mínimo, el auxilio de transporte y las tarifas de impuestos cambian, y la IA puede darle los de otro año. Confírmelos en la DIAN, la Secretaría de Hacienda o la fuente oficial.' },
    },
  },
  contexto: {
    idea: 'La IA solo tiene en cuenta lo que está en la conversación abierta: sus mensajes y los archivos que adjuntó. Al abrir una conversación nueva, empieza sin recordar nada.',
    areas: {
      operaciones: { titulo: 'Elija qué darle', texto: 'El auto completo cabe; el expediente entero, no. Para responder un auto, dele el auto, la licencia o el permiso y el último informe presentado.' },
      logistica: { titulo: 'Ayer se lo explicó, hoy no lo recuerda', texto: 'Si en otra conversación le explicó cómo clasificar los correos de solicitudes, en una nueva no lo sabe. Déjelo fijo en un proyecto de Claude o en la automatización que hace esa tarea.' },
      ventas: { titulo: 'Un proyecto por cliente grande', texto: 'En un proyecto de Claude puede dejar fijos el Brief, las propuestas anteriores y el tono de Ekosolv, para no repetirlos en cada conversación.' },
      mercadeo: { titulo: 'La voz de la marca, siempre a la mano', texto: 'Si pega la guía de voz al inicio, o la deja en un proyecto, todas las publicaciones salen con el mismo tono.' },
      gerencia: { titulo: 'Un proyecto para las propuestas', texto: 'En un proyecto de Claude puede dejar fijos el portafolio, las propuestas que se ganaron y los precios de referencia, para no repetirlos cada vez que arma una propuesta.' },
      finanzas: { titulo: 'Este periodo y el anterior', texto: 'Para explicar por qué cambió el costeo de un servicio, los dos periodos tienen que estar en la misma conversación. Si le falta uno, la IA puede inventar la comparación.' },
    },
  },
  ecosistema: {
    idea: 'Claude o GPT son el modelo: el cerebro. claude.ai o ChatGPT son la aplicación por donde usted lo usa. Las herramientas le permiten leer archivos, buscar en internet o conectarse a otros sistemas.',
    areas: {
      operaciones: { titulo: 'Vigilar los cambios en la norma', texto: 'Con búsqueda en internet, la IA puede revisar lo que publican la ANLA, las CAR o el Diario Oficial y avisarle de una norma nueva. Lo que encuentre se confirma en la fuente antes de actuar.' },
      logistica: { titulo: 'Del correo a Zoho', texto: 'Una herramienta conectada puede leer el correo, reconocer una solicitud, crear el registro en Zoho y avisarle al cliente. Eso es darle "manos" a la IA; alguien revisa lo que hizo.' },
      ventas: { titulo: 'Zoho y la IA', texto: 'Hoy se copia el Brief de Zoho y se pega en la conversación. Una herramienta conectada podría leerlo directamente: eso es darle "manos" a la IA.' },
      mercadeo: { titulo: 'La IA dentro de otras aplicaciones', texto: 'Canva, LinkedIn o Copilot traen IA adentro, y detrás hay un modelo como Claude o GPT. Las reglas para pedir bien son las mismas.' },
      gerencia: { titulo: 'Un tablero que se explica', texto: 'Conectada a Zoho, la IA puede leer el tablero de oportunidades y decirle cuáles llevan días sin moverse y qué falta para cerrarlas. Es un agente: hace varios pasos solo, y su resultado se revisa.' },
      finanzas: { titulo: 'Siigo, bancos y Excel', texto: 'Claude puede leer un Excel exportado de Siigo Nube o un extracto bancario y hacer cálculos. Pídale que muestre los pasos o las fórmulas para poder verificarlos.' },
    },
  },
  areas: {
    idea: 'La IA ahorra tiempo sobre todo en cuatro tipos de tarea: leer y resumir documentos largos, pasar información a tablas, escribir primeros borradores y revisar contra una lista.',
    areas: {
      operaciones: { titulo: 'Responder un auto a tiempo', texto: 'Sacar de un auto de la ANLA o de la CAR las obligaciones, los plazos y los responsables, citando el artículo, y llevar las vigencias a un calendario.' },
      logistica: { titulo: 'La bandeja de entrada en orden', texto: 'Leer los correos del día, separar las solicitudes de recolección, pasarlas a Zoho y avisarle al cliente cuando cambie el estado de su servicio.' },
      ventas: { titulo: 'Del Brief a la propuesta', texto: 'Convertir un Brief de Zoho en el borrador de una propuesta con la estructura de Ekosolv, listo para ajustar.' },
      mercadeo: { titulo: 'De una norma a una campaña', texto: 'Convertir una norma nueva en un artículo para el blog y tres publicaciones, con la voz de la marca.' },
      gerencia: { titulo: 'De la oportunidad a la propuesta', texto: 'Armar el borrador de la propuesta desde la oportunidad de Zoho y ver en el tablero cuáles están listas para cerrar.' },
      finanzas: { titulo: 'El manual que nadie ha escrito', texto: 'Convertir la explicación de cómo se hace el cierre de mes, la nómina o el costeo en un procedimiento escrito, paso a paso, para el manual.' },
    },
  },
  inventa: {
    idea: 'Cuando la IA no tiene un dato, igual escribe algo que suena probable. Le pasa sobre todo con números de normas, fechas, artículos y cifras, y casi nunca con lo que está en el documento que usted le dio.',
    areas: {
      operaciones: { titulo: 'El artículo que no existe', texto: 'Si pregunta qué artículo exige algo o hasta cuándo rige un permiso sin darle el documento, puede responder con total seguridad. Toda cita y toda vigencia se confirman en el texto oficial.' },
      logistica: { titulo: 'Cifras que no estaban', texto: 'Si un correo no dice cuántos kilos son o la fecha está incompleta, la IA puede completarlos con algo razonable. Pídale que escriba "no aparece" y deje la solicitud pendiente.' },
      ventas: { titulo: 'Clientes que nunca lo fueron', texto: 'Si le pide "agrega casos de éxito", puede inventar empresas y cifras. En una propuesta no queda nada que usted no haya confirmado.' },
      mercadeo: { titulo: 'La estadística sin fuente', texto: '"El 70 % de las empresas..." suena bien y puede ser inventado. Toda cifra que se publica lleva una fuente verificada.' },
      gerencia: { titulo: 'Casos de éxito inventados', texto: 'Si le pide "agrega casos de éxito" a una propuesta, puede inventar clientes y cifras. En una propuesta no queda nada que usted no haya confirmado.' },
      finanzas: { titulo: 'Un procedimiento que suena bien', texto: 'Si le pide el manual de un proceso sin explicárselo, escribirá cómo se hace "normalmente", no cómo lo hace Ekosolv. El manual sale de lo que hace el equipo; la IA solo lo ordena.' },
    },
  },
  verificar: {
    idea: 'Lo que entrega la IA se revisa como el trabajo de alguien nuevo: cada norma en la fuente oficial, cada cifra contra el documento original, y se le pide que diga de dónde sacó cada dato.',
    areas: {
      operaciones: { titulo: 'Antes de responderle a la autoridad', texto: 'Abra cada norma citada en la fuente oficial, confirme que siga vigente y cuente cada plazo en el calendario. Si la IA no dice de qué página salió una obligación, no la use.' },
      logistica: { titulo: 'Antes de cargar en Zoho', texto: 'Compare las cifras de la tabla con el correo o el certificado de origen, o por lo menos los totales por cliente. Un error aquí aparece después en el tablero y en el certificado del cliente.' },
      ventas: { titulo: 'Antes de enviar la propuesta', texto: 'Revise que precios, alcance y plazos sean los del Brief y no los que la IA supuso. Lo que dice la propuesta compromete a Ekosolv.' },
      mercadeo: { titulo: 'Antes de publicar', texto: 'Confirme cifras, nombres de normas y lo que se dice de los servicios. Una publicación con un dato falso queda circulando aunque la borre.' },
      gerencia: { titulo: 'Antes de enviar la propuesta', texto: 'Revise que precios, alcance y plazos sean los de la oportunidad en Zoho y no los que la IA supuso. Lo que dice la propuesta compromete a Ekosolv.' },
      finanzas: { titulo: 'Antes de pagar o declarar', texto: 'Cruce cada cifra con Siigo Nube y con el extracto del banco. Lo que va a la nómina, a un pago o a una declaración ante la DIAN o la Secretaría de Hacienda se recalcula siempre.' },
    },
  },
  descanso: {
    idea: 'Quince minutos de descanso. Al volver: cómo pedirle a la IA para que acierte al primer o segundo intento. Si le quedó una duda, escríbala abajo.',
  },
  metodo: {
    idea: 'Una buena instrucción tiene cuatro partes: contexto (quién es usted y para qué es), tarea (qué quiere, con un verbo claro), formato (cómo lo quiere recibir) y, si lo tiene, un ejemplo.',
    areas: {
      operaciones: { titulo: 'Las cuatro partes con un auto', texto: 'Contexto: soy consultor de Ekosolv; el cliente tiene un permiso ante la CAR. Tarea: extrae las obligaciones del auto adjunto. Formato: tabla con obligación, artículo, plazo y responsable. Ejemplo: una fila ya llena.' },
      logistica: { titulo: 'Las cuatro partes con el correo', texto: 'Contexto: soy de logística de Ekosolv y reviso las solicitudes que llegan por correo. Tarea: identifica las solicitudes de recolección. Formato: cliente, residuo, cantidad, dirección y fecha pedida. Ejemplo: una fila ya llena.' },
      ventas: { titulo: 'Las cuatro partes con un Brief', texto: 'Contexto: soy comercial de Ekosolv; adjunto el Brief de un cliente industrial. Tarea: redacta el borrador de la propuesta. Formato: las secciones de nuestra plantilla. Ejemplo: una propuesta aprobada.' },
      mercadeo: { titulo: 'Las cuatro partes con una publicación', texto: 'Contexto: manejo las redes de Ekosolv; adjunto la guía de voz. Tarea: escribe tres publicaciones sobre esta norma. Formato: LinkedIn, máximo 120 palabras cada una. Ejemplo: una publicación que funcionó.' },
      gerencia: { titulo: 'Las cuatro partes con una propuesta', texto: 'Contexto: soy gerente de Ekosolv; adjunto la oportunidad de Zoho y una propuesta que ganamos. Tarea: redacta el borrador para este cliente. Formato: las secciones de nuestra plantilla. Ejemplo: la propuesta ganada.' },
      finanzas: { titulo: 'Las cuatro partes con un procedimiento', texto: 'Contexto: llevo la nómina de Ekosolv y le cuento cómo la liquido. Tarea: conviértelo en un procedimiento para el manual. Formato: objetivo, responsable, pasos numerados y controles. Ejemplo: un procedimiento que ya tenemos.' },
    },
  },
  constructor: {
    idea: 'En pantalla se le pide a Claude la misma tarea cuatro veces y en cada una se agrega una parte. Fíjese en cómo mejora la respuesta.',
    areas: {
      operaciones: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Resume este auto." Completa: "Soy consultor de Ekosolv. Extrae las obligaciones de este auto de la ANLA en una tabla con artículo, plazo y responsable. Si un plazo no aparece, escribe \'no aparece\'."' },
      logistica: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Revisa estos correos." Completa: "Soy de logística de Ekosolv. De estos correos, saca las solicitudes de recolección en una tabla con cliente, residuo, cantidad y fecha. Si falta un dato, escribe \'no aparece\'."' },
      ventas: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Haz una propuesta." Completa: "Soy comercial de Ekosolv. Con este Brief, redacta el borrador de la propuesta con nuestras secciones. No inventes precios: deja [PRECIO] donde vaya."' },
      mercadeo: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Escribe un post sobre RAEE." Completa: "Con esta guía de voz, escribe una publicación de LinkedIn de 100 palabras sobre esta norma, para jefes de planta. Cierra con una pregunta."' },
      gerencia: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Haz una propuesta." Completa: "Soy gerente de Ekosolv. Con esta oportunidad de Zoho, redacta el borrador de la propuesta con nuestras secciones. No inventes precios: deja [PRECIO] donde vaya."' },
      finanzas: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Revisa la conciliación." Completa: "Llevo la tesorería de Ekosolv. Cruza este extracto bancario con los recaudos de Siigo Nube y lista en una tabla los movimientos que no coinciden, con fecha y valor."' },
    },
  },
  iterar: {
    idea: 'Si la respuesta no sirve del todo, no empiece de nuevo: dígale qué cambiar, como a un compañero. Cuando una instrucción le funcione, guárdela para repetirla.',
    areas: {
      operaciones: { titulo: 'Corregir por partes', texto: '"Quita la obligación que no está en el auto." Y después: "Agrega una columna con la fecha de vencimiento y marca las que vencen este mes."' },
      logistica: { titulo: 'Corregir por partes', texto: '"Separa las solicitudes urgentes de las demás." Y después: "Redacta el aviso al cliente con la fecha confirmada de su recolección."' },
      ventas: { titulo: 'Corregir por partes', texto: '"Más corto: el cliente es de producción, no ambiental." Y después: "Cambia el cierre: propón una visita técnica en vez de una llamada."' },
      mercadeo: { titulo: 'Corregir por partes', texto: '"Menos formal, pero sin emojis." Y después: "Empieza con la pregunta que se hace el cliente, no con la norma."' },
      gerencia: { titulo: 'Corregir por partes', texto: '"Más corto: el cliente es de producción, no ambiental." Y después: "Cambia el cierre: propón una fecha para firmar."' },
      finanzas: { titulo: 'Corregir por partes', texto: '"Agrega quién revisa cada paso." Y después: "Marca qué pasos se podrían automatizar y cuáles necesitan criterio."' },
    },
  },
  anonimizar: {
    idea: 'Antes de pegar un documento, cambie nombres, cédulas, teléfonos y correos por un rol: "el conductor", "el cliente". El documento sigue sirviendo para la tarea.',
    areas: {
      operaciones: { titulo: 'Qué cambiar en un auto', texto: 'Nombres de funcionarios y del representante legal, cédulas y direcciones de predios cuando no hagan falta. Escriba "el representante legal" en vez del nombre.' },
      logistica: { titulo: 'Qué cambiar en un correo', texto: 'Nombre, celular y correo de quien escribe, y los datos del conductor. El residuo, la cantidad y la fecha se dejan: son lo que se necesita para la tarea.' },
      ventas: { titulo: 'Qué cambiar en un Brief', texto: 'El celular y el correo personal del contacto. Para redactar la propuesta basta con "el jefe de planta" y el sector del cliente.' },
      mercadeo: { titulo: 'Qué cambiar en un caso', texto: 'El nombre del cliente si no autorizó publicarlo, y los datos de personas que aparezcan en fotos o testimonios.' },
      gerencia: { titulo: 'Qué no se sube', texto: 'Salarios, datos de salud y evaluaciones de desempeño no se suben ni siquiera anonimizados. En el reporte de oportunidades, cambie el nombre de cada contacto por su cargo.' },
      finanzas: { titulo: 'Qué cambiar en nómina y bancos', texto: 'Cédulas, cuentas bancarias y nombres de empleados y clientes: cámbielos por "Empleado 1" o "Cliente A". Los salarios de cada persona no se suben; para la tarea bastan totales o rangos.' },
    },
  },
  comparacion: {
    idea: 'En pantalla está el resultado del grupo en las mismas cinco preguntas, antes y después de hoy.',
  },
  sigue: {
    idea: 'Faltan tres sábados y asiste todo el equipo. Mientras tanto, practique con una tarea real de su puesto.',
  },
  cierre: {
    idea: 'Escanee el código de la pantalla para guardar la tarjeta resumen, con las ideas y las instrucciones de hoy. Gracias por participar.',
  },
}
