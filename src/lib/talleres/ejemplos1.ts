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
 * Los ejemplos por área son ilustrativos, escritos a partir del programa por
 * área (src/lib/capacitacion.ts), no documentos reales de Ekosolv: el celular
 * los marca así. Las pruebas exigen idea en toda escena sin votación ni
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
      operaciones: { titulo: 'Un requerimiento redactado distinto', texto: 'Una lista de chequeo busca la frase "presentar el informe". Si el auto dice "allegar la documentación soporte", la regla no lo encuentra. La IA sí entiende que es la misma obligación.' },
      logistica: { titulo: 'Cada gestor llena el certificado a su manera', texto: 'Una plantilla que busca la casilla "Peso (kg)" falla si el gestor escribe "Cantidad entregada: 0,32 t". La IA reconoce que es el mismo dato, aunque cambien el nombre y la unidad.' },
      ventas: { titulo: 'El cliente no usa las palabras del catálogo', texto: 'Un prospecto escribe: "tenemos unos equipos viejos y unas canecas de aceite". Ningún formulario lo clasifica. La IA entiende que habla de RAEE y de RESPEL.' },
      mercadeo: { titulo: 'Comentarios en redes', texto: 'Clasificar comentarios por palabras clave falla con la ironía o con preguntas mal escritas. La IA los agrupa por lo que la persona quiso decir.' },
      gerencia: { titulo: 'Contratos que no se parecen', texto: 'Cada cliente redacta las cláusulas a su manera. Buscar la palabra "penalidad" no encuentra "descuento por incumplimiento". La IA reconoce que se refieren a lo mismo.' },
      finanzas: { titulo: 'Conceptos de gasto escritos a mano', texto: '"Combus.", "gasolina camión" y "ACPM ruta norte" son tres textos distintos para una regla exacta. La IA los agrupa como combustible.' },
    },
  },
  perillas: {
    idea: 'Por dentro, un modelo es una cantidad enorme de números que se ajustaron durante el entrenamiento. Nadie le escribió lo que sabe: lo aprendió viendo ejemplos y corrigiendo sus errores.',
    areas: {
      operaciones: { titulo: 'Como un consultor que empieza', texto: 'Después de leer muchos autos, una persona nueva reconoce dónde están las obligaciones sin que nadie le dé una regla por cada autoridad. El modelo aprendió de forma parecida, pero con millones de textos.' },
      logistica: { titulo: 'Como un auxiliar que ya vio muchos certificados', texto: 'Con la práctica, se aprende dónde va cada dato aunque cambie el formato del gestor. El modelo ajustó sus números de la misma forma: ejemplo, error, corrección, miles de millones de veces.' },
      ventas: { titulo: 'Como un comercial con experiencia', texto: 'Tras muchas reuniones, se reconoce qué necesita un cliente por cómo habla. El modelo no tiene esa experiencia en Ekosolv: la sacó de textos en general. Su conocimiento del negocio se lo da usted.' },
      mercadeo: { titulo: 'Escribe como lo que leyó', texto: 'El modelo aprendió a escribir de textos de todo tipo. Por eso, sin indicaciones, suena genérico. Para que suene a Ekosolv hay que mostrarle la voz de la marca.' },
      gerencia: { titulo: 'Nadie programó lo que sabe', texto: 'Ni sus creadores pueden señalar dónde guarda un dato. Por eso no basta con que una respuesta suene bien: las decisiones se apoyan en documentos, no en lo que el modelo "sabe".' },
      finanzas: { titulo: 'Aprendió a escribir, no a calcular', texto: 'Su entrenamiento fue predecir texto. Puede razonar sobre cifras, pero las sumas largas se hacen en la hoja de cálculo o se le pide que use una herramienta para calcular.' },
    },
  },
  tokens: {
    idea: 'La IA parte el texto en pedazos llamados tokens: las palabras cortas suelen ir enteras, las largas y las cifras se parten en varios pedazos. Lo que puede leer de una vez y lo que cuesta se miden en tokens, no en páginas.',
    areas: {
      operaciones: { titulo: 'Un auto lleno de números', texto: 'Radicados, números de resolución y fechas se parten en muchos tokens. Un auto de 40 páginas cabe sin problema, pero un documento con muchas tablas ocupa más de lo que parece.' },
      logistica: { titulo: 'Un lote de certificados', texto: 'NIT, fechas, kilos y consecutivos son cifras, y las cifras gastan muchos tokens. Un lote de decenas de certificados cabe; el archivo de todo el año, no: divídalo por mes o por gestor.' },
      ventas: { titulo: 'El Brief y el historial de correos', texto: 'El Brief de Zoho cabe de sobra. Si además pega meses de correos con el cliente, la IA reparte su atención entre mucho texto que no aporta. Pegue solo lo que sirve para la propuesta.' },
      mercadeo: { titulo: 'El límite de caracteres', texto: 'La IA cuenta en tokens, no en letras. Por eso a veces se pasa aunque usted le pida "máximo 200 caracteres". Cuente usted antes de publicar.' },
      gerencia: { titulo: 'Un contrato con anexos', texto: 'Un contrato de 60 páginas cabe. Pegar todos los anexos sin necesidad cuesta más y dispersa la respuesta. Dele el contrato y solo los anexos que tocan su pregunta.' },
      finanzas: { titulo: 'Un reporte exportado de Zoho Books', texto: 'Cientos de filas de cifras gastan muchísimos tokens. Exporte solo las columnas y el periodo que necesita para la pregunta.' },
    },
  },
  siguiente: {
    idea: 'La IA escribe eligiendo, una tras otra, la palabra más probable según lo que va antes. Por eso suena natural, y por eso también puede escribir algo falso con total seguridad.',
    areas: {
      operaciones: { titulo: 'Dos borradores distintos', texto: 'Si pide dos veces la misma respuesta a la autoridad, saldrán dos redacciones distintas. No es un error: elige entre varias palabras probables. Por eso cada versión se revisa.' },
      logistica: { titulo: 'El recordatorio al gestor', texto: 'Si escribe "el certificado está pendiente desde el..." y no le da la fecha, la IA pondrá una fecha que suene bien. Los datos siempre se los da usted.' },
      ventas: { titulo: 'Tres versiones del seguimiento', texto: 'Pedir tres versiones de un correo sirve justamente porque cada vez elige palabras distintas. Usted escoge la que suena a Ekosolv.' },
      mercadeo: { titulo: 'Ideas contra datos', texto: 'Para una lluvia de ideas conviene que se arriesgue. Para un texto que cita una norma, pídale que se ciña al documento que le entrega.' },
      gerencia: { titulo: 'Seguro no es lo mismo que correcto', texto: 'La IA usa el mismo tono firme cuando acierta y cuando se equivoca. Que un resumen ejecutivo suene convincente no dice nada sobre si es correcto.' },
      finanzas: { titulo: 'Un total que suena bien', texto: 'Si le pregunta el total del mes sin darle el reporte, escribirá un número probable, no el real. Las cifras salen del documento, nunca de la memoria de la IA.' },
    },
  },
  mapa: {
    idea: 'Para la IA, las palabras que se usan en situaciones parecidas quedan cerca unas de otras. Así entiende sinónimos y frases que nunca vio escritas igual.',
    areas: {
      operaciones: { titulo: 'Puede preguntar con sus palabras', texto: 'Si el documento dice "medidas de manejo" y usted pregunta por "obligaciones del PMA", la IA entiende que habla de lo mismo. No necesita copiar la frase exacta del documento.' },
      logistica: { titulo: 'Gestor, operador, receptor', texto: 'Cada certificado nombra distinto a quien recibe el residuo. La IA entiende que es el mismo papel, así que puede pedirle "el gestor" aunque el documento diga "receptor".' },
      ventas: { titulo: 'Cotización, propuesta, oferta', texto: 'Para la IA son vecinas. Puede pedirle "la oferta para el cliente" y entiende que se trata de la propuesta comercial.' },
      mercadeo: { titulo: 'Cerca no es igual', texto: '"Sostenibilidad", "economía circular" y "aprovechamiento" quedan cerca, y la IA tiende a usarlas como sinónimos. Revise que cada palabra diga lo que Ekosolv quiere decir.' },
      gerencia: { titulo: 'Riesgo, multa, sanción', texto: 'Si pregunta por los riesgos de un contrato, la IA también le traerá penalidades y descuentos, aunque el contrato no use la palabra "riesgo".' },
      finanzas: { titulo: 'Cartera, cuentas por cobrar, saldos vencidos', texto: 'La IA entiende que hablan de lo mismo, aunque en el reporte de Zoho Books la columna tenga otro nombre.' },
    },
  },
  etapas: {
    idea: 'La IA aprendió de textos escritos hasta cierta fecha. Lo que pasó después no lo sabe, a menos que usted se lo dé o que la herramienta busque en internet.',
    areas: {
      operaciones: { titulo: 'La norma más reciente', texto: 'Si la autoridad expidió una resolución hace poco, la IA puede no conocerla. Pegue el texto de la norma: así trabaja con la vigente y no con lo que recuerda.' },
      logistica: { titulo: 'Los gestores con licencia hoy', texto: 'La IA no sabe qué gestores tienen la licencia vigente ni con cuáles trabaja Ekosolv. Ese dato sale de sus registros, no de ella.' },
      ventas: { titulo: 'Investigar un prospecto', texto: 'Lo que sabe de una empresa puede estar desactualizado. Si la herramienta no busca en internet, confirme en la página del cliente antes de la reunión.' },
      mercadeo: { titulo: 'Fechas del calendario', texto: 'Puede proponerle fechas o tendencias de un año anterior. El calendario editorial siempre se revisa contra el año en curso.' },
      gerencia: { titulo: 'Precios del mercado', texto: 'La IA no conoce las tarifas actuales de los proveedores. Usted le da las propuestas; ella las ordena y las compara.' },
      finanzas: { titulo: 'Valores que cambian cada año', texto: 'La UVT, el salario mínimo o las tarifas cambian cada año, y la IA puede darle los de otro año. Confírmelos siempre en la fuente oficial.' },
    },
  },
  contexto: {
    idea: 'La IA solo tiene en cuenta lo que está en la conversación abierta: sus mensajes y los archivos que adjuntó. Al abrir una conversación nueva, empieza sin recordar nada.',
    areas: {
      operaciones: { titulo: 'Elija qué darle', texto: 'El auto completo cabe; el expediente entero del cliente, no. Para una tarea, dele lo que necesita: el auto, la licencia y el último informe.' },
      logistica: { titulo: 'Ayer se lo explicó, hoy no lo recuerda', texto: 'Si en otra conversación le explicó el formato de los certificados de Ekosolv, en una nueva no lo sabe. Vuelva a pegarlo o déjelo fijo en un proyecto de Claude.' },
      ventas: { titulo: 'Un proyecto por cliente grande', texto: 'En un proyecto de Claude puede dejar fijos el Brief, las propuestas anteriores y el tono de Ekosolv, para no repetirlos en cada conversación.' },
      mercadeo: { titulo: 'La voz de la marca, siempre a la mano', texto: 'Si pega la guía de voz al inicio, o la deja en un proyecto, todas las publicaciones salen con el mismo tono.' },
      gerencia: { titulo: 'Comparar varios documentos', texto: 'Para comparar tres propuestas, las tres tienen que estar en la misma conversación. Si solo ve una, no tiene con qué compararla.' },
      finanzas: { titulo: 'Este mes y el anterior', texto: 'Para explicar variaciones, los dos reportes tienen que estar en la misma conversación. Si le falta uno, la IA puede inventar la comparación.' },
    },
  },
  ecosistema: {
    idea: 'Claude o GPT son el modelo: el cerebro. claude.ai o ChatGPT son la aplicación por donde usted lo usa. Las herramientas le permiten leer archivos, buscar en internet o conectarse a otros sistemas.',
    areas: {
      operaciones: { titulo: 'Un auto escaneado', texto: 'Claude lee PDF e imágenes, así que puede adjuntar un auto escaneado. Si el escaneo está borroso, revise sobre todo números y fechas.' },
      logistica: { titulo: 'La foto de un certificado', texto: 'Puede tomarle una foto a un certificado del gestor y pedir que pase los datos a una tabla. Después compare cada cifra con la foto.' },
      ventas: { titulo: 'Zoho y la IA', texto: 'Hoy se copia el Brief de Zoho y se pega en la conversación. Una herramienta conectada podría leerlo directamente: eso es darle "manos" a la IA.' },
      mercadeo: { titulo: 'La IA dentro de otras aplicaciones', texto: 'Canva, LinkedIn o Copilot traen IA adentro, y detrás hay un modelo como Claude o GPT. Las reglas para pedir bien son las mismas.' },
      gerencia: { titulo: 'Qué es un agente', texto: 'Un agente hace varios pasos por su cuenta: busca, lee y redacta. Ahorra tiempo, pero su resultado se revisa igual que el de una persona nueva.' },
      finanzas: { titulo: 'Excel y CSV', texto: 'Claude puede leer un Excel o un CSV exportado de Zoho Books y hacer cálculos. Pídale que muestre los pasos o las fórmulas para poder verificarlos.' },
    },
  },
  areas: {
    idea: 'La IA ahorra tiempo sobre todo en cuatro tipos de tarea: leer y resumir documentos largos, pasar información a tablas, escribir primeros borradores y revisar contra una lista.',
    areas: {
      operaciones: { titulo: 'La matriz de obligaciones', texto: 'Sacar de un auto las obligaciones, los plazos y los responsables, citando el artículo de cada una. Usted revisa; la IA hace la primera pasada.' },
      logistica: { titulo: 'La conciliación de certificados', texto: 'Pasar un lote de certificados a una tabla y marcar las diferencias con lo recolectado, antes de cargarlo en Zoho.' },
      ventas: { titulo: 'Del Brief a la propuesta', texto: 'Convertir un Brief de Zoho en el borrador de una propuesta con la estructura de Ekosolv, listo para ajustar.' },
      mercadeo: { titulo: 'De una norma a una campaña', texto: 'Convertir una norma nueva en un artículo para el blog y tres publicaciones, con la voz de la marca.' },
      gerencia: { titulo: 'El resumen ejecutivo', texto: 'Resumir un contrato o un informe largo en una página, con los puntos que piden decisión y la cláusula de cada uno.' },
      finanzas: { titulo: 'Explicar el mes', texto: 'Explicar en lenguaje sencillo por qué cambiaron las ventas, la cartera o los gastos frente al mes anterior.' },
    },
  },
  inventa: {
    idea: 'Cuando la IA no tiene un dato, igual escribe algo que suena probable. Le pasa sobre todo con números de normas, fechas, artículos y cifras, y casi nunca con lo que está en el documento que usted le dio.',
    areas: {
      operaciones: { titulo: 'El artículo que no existe', texto: 'Si pregunta qué artículo exige algo sin darle la norma, puede citar un número con total seguridad. Toda cita se confirma en el texto oficial.' },
      logistica: { titulo: 'Kilos que no estaban', texto: 'Si un certificado está borroso o le falta un dato, la IA puede completarlo con algo razonable. Pídale que escriba "no aparece" cuando no lo encuentre.' },
      ventas: { titulo: 'Clientes que nunca lo fueron', texto: 'Si le pide "agrega casos de éxito", puede inventar empresas y cifras. En una propuesta no queda nada que usted no haya confirmado.' },
      mercadeo: { titulo: 'La estadística sin fuente', texto: '"El 70 % de las empresas..." suena bien y puede ser inventado. Toda cifra que se publica lleva una fuente verificada.' },
      gerencia: { titulo: 'La cláusula que no está', texto: 'Al resumir un contrato, la IA puede mencionar una garantía típica de otros contratos que en este no aparece. Pídale el número de cláusula de cada punto.' },
      finanzas: { titulo: 'Totales que no cuadran', texto: 'La IA puede sumar mal o inventar un subtotal. Toda cifra del informe se recalcula en la hoja de cálculo antes de enviarlo.' },
    },
  },
  verificar: {
    idea: 'Lo que entrega la IA se revisa como el trabajo de alguien nuevo: cada norma en la fuente oficial, cada cifra contra el documento original, y se le pide que diga de dónde sacó cada dato.',
    areas: {
      operaciones: { titulo: 'Antes de responderle a la autoridad', texto: 'Abra cada norma citada en la fuente oficial y cuente cada plazo en el calendario. Si la IA no dice de qué página salió una obligación, no la use.' },
      logistica: { titulo: 'Antes de cargar en Zoho', texto: 'Compare los kilos de la tabla con cada certificado, o por lo menos los totales por gestor. Un error aquí termina en el certificado del cliente.' },
      ventas: { titulo: 'Antes de enviar la propuesta', texto: 'Revise que precios, alcance y plazos sean los del Brief y no los que la IA supuso. Lo que dice la propuesta compromete a Ekosolv.' },
      mercadeo: { titulo: 'Antes de publicar', texto: 'Confirme cifras, nombres de normas y lo que se dice de los servicios. Una publicación con un dato falso queda circulando aunque la borre.' },
      gerencia: { titulo: 'Antes de decidir', texto: 'Pida las razones de cada recomendación y revise en el documento original los dos o tres puntos que más pesan en la decisión.' },
      finanzas: { titulo: 'Antes del informe mensual', texto: 'Cruce cada cifra del texto con el reporte de Zoho Books. Si la IA explica una variación, pídale qué filas la causan y revíselas.' },
    },
  },
  descanso: {
    idea: 'Quince minutos de descanso. Al volver: cómo pedirle a la IA para que acierte al primer o segundo intento. Si le quedó una duda, escríbala abajo.',
  },
  metodo: {
    idea: 'Una buena instrucción tiene cuatro partes: contexto (quién es usted y para qué es), tarea (qué quiere, con un verbo claro), formato (cómo lo quiere recibir) y, si lo tiene, un ejemplo.',
    areas: {
      operaciones: { titulo: 'Las cuatro partes con un auto', texto: 'Contexto: soy consultor de Ekosolv; el cliente es una planta en Funza. Tarea: extrae las obligaciones del auto adjunto. Formato: tabla con obligación, artículo, plazo y responsable. Ejemplo: una fila ya llena.' },
      logistica: { titulo: 'Las cuatro partes con certificados', texto: 'Contexto: soy de logística de Ekosolv y concilio certificados de gestores. Tarea: pasa estos certificados a una tabla. Formato: cliente, fecha, residuo, kilos y gestor. Ejemplo: una fila ya llena.' },
      ventas: { titulo: 'Las cuatro partes con un Brief', texto: 'Contexto: soy comercial de Ekosolv; adjunto el Brief de un cliente industrial. Tarea: redacta el borrador de la propuesta. Formato: las secciones de nuestra plantilla. Ejemplo: una propuesta aprobada.' },
      mercadeo: { titulo: 'Las cuatro partes con una publicación', texto: 'Contexto: manejo las redes de Ekosolv; adjunto la guía de voz. Tarea: escribe tres publicaciones sobre esta norma. Formato: LinkedIn, máximo 120 palabras cada una. Ejemplo: una publicación que funcionó.' },
      gerencia: { titulo: 'Las cuatro partes con una decisión', texto: 'Contexto: soy gerente de Ekosolv y debo elegir proveedor. Tarea: compara estas tres propuestas. Formato: tabla con precio, plazo, riesgos y una recomendación. Ejemplo: los criterios que usamos la última vez.' },
      finanzas: { titulo: 'Las cuatro partes con un reporte', texto: 'Contexto: llevo la cartera de Ekosolv; adjunto el reporte de Zoho Books. Tarea: explica las variaciones frente al mes anterior. Formato: cinco viñetas en lenguaje sencillo. Ejemplo: el informe del mes pasado.' },
    },
  },
  constructor: {
    idea: 'En pantalla se le pide a Claude la misma tarea cuatro veces y en cada una se agrega una parte. Fíjese en cómo mejora la respuesta.',
    areas: {
      operaciones: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Resume este auto." Completa: "Soy consultor de Ekosolv. Extrae las obligaciones de este auto en una tabla con artículo, plazo y responsable. Si un plazo no aparece, escribe \'no aparece\'."' },
      logistica: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Organiza estos certificados." Completa: "Soy de logística de Ekosolv. Pasa estos certificados a una tabla con cliente, fecha, residuo, kilos y gestor. Marca los kilos que no coincidan con la recolección."' },
      ventas: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Haz una propuesta." Completa: "Soy comercial de Ekosolv. Con este Brief, redacta el borrador de la propuesta con nuestras secciones. No inventes precios: deja [PRECIO] donde vaya."' },
      mercadeo: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Escribe un post sobre RAEE." Completa: "Con esta guía de voz, escribe una publicación de LinkedIn de 100 palabras sobre esta norma, para jefes de planta. Cierra con una pregunta."' },
      gerencia: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Resume este contrato." Completa: "Soy gerente de Ekosolv. Resume este contrato en una página: obligaciones nuestras, plazos, penalidades y riesgos, con el número de cláusula de cada punto."' },
      finanzas: { titulo: 'La diferencia con una tarea suya', texto: 'Corta: "Analiza este reporte." Completa: "Llevo la cartera de Ekosolv. Compara este reporte con el del mes pasado y explica en cinco viñetas qué cambió y por qué, citando las filas."' },
    },
  },
  iterar: {
    idea: 'Si la respuesta no sirve del todo, no empiece de nuevo: dígale qué cambiar, como a un compañero. Cuando una instrucción le funcione, guárdela para repetirla.',
    areas: {
      operaciones: { titulo: 'Corregir por partes', texto: '"Quita la obligación que no está en el auto." Y después: "Agrega una columna con la fecha límite." Cada corrección mejora la tabla sin volver a empezar.' },
      logistica: { titulo: 'Corregir por partes', texto: '"El certificado 3 está en toneladas: pásalo a kilos." Y después: "Marca las diferencias de más de 5 kg con lo recolectado."' },
      ventas: { titulo: 'Corregir por partes', texto: '"Más corto: el cliente es de producción, no ambiental." Y después: "Cambia el cierre: propón una visita técnica en vez de una llamada."' },
      mercadeo: { titulo: 'Corregir por partes', texto: '"Menos formal, pero sin emojis." Y después: "Empieza con la pregunta que se hace el cliente, no con la norma."' },
      gerencia: { titulo: 'Corregir por partes', texto: '"Dale más peso al plazo que al precio." Y después: "Escribe el correo para el proveedor que no quedó elegido."' },
      finanzas: { titulo: 'Corregir por partes', texto: '"Separa la cartera de más de 90 días." Y después: "Redacta un recordatorio de cobro cordial para los tres clientes con mayor saldo."' },
    },
  },
  anonimizar: {
    idea: 'Antes de pegar un documento, cambie nombres, cédulas, teléfonos y correos por un rol: "el conductor", "el cliente". El documento sigue sirviendo para la tarea.',
    areas: {
      operaciones: { titulo: 'Qué cambiar en un auto', texto: 'Nombres de funcionarios y del representante legal, cédulas y direcciones de predios cuando no hagan falta. Escriba "el representante legal" en vez del nombre.' },
      logistica: { titulo: 'Qué cambiar en un certificado', texto: 'Nombre, cédula y celular del conductor y de quien entregó. Los kilos, el residuo y la fecha se dejan: son lo que se necesita para la tarea.' },
      ventas: { titulo: 'Qué cambiar en un Brief', texto: 'El celular y el correo personal del contacto. Para redactar la propuesta basta con "el jefe de planta" y el sector del cliente.' },
      mercadeo: { titulo: 'Qué cambiar en un caso', texto: 'El nombre del cliente si no autorizó publicarlo, y los datos de personas que aparezcan en fotos o testimonios.' },
      gerencia: { titulo: 'Qué no se sube', texto: 'Salarios, datos de salud y evaluaciones de desempeño. Lo de salud y desempeño no se sube ni siquiera anonimizado.' },
      finanzas: { titulo: 'Qué cambiar en un reporte', texto: 'Cuentas bancarias, NIT y nombres de clientes: cámbielos por "Cliente A", "Cliente B". Las cifras y los conceptos sirven igual para el análisis.' },
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
