/**
 * Ejemplos por área para el celular, en la capacitación 1. Mientras el
 * proyector está en una escena, cada participante ve en su celular cómo se
 * ve esa misma idea en el trabajo de su área (la que eligió al registrarse).
 *
 * Son ejemplos ilustrativos escritos a partir del programa por área
 * (src/lib/capacitacion.ts), no documentos reales de Ekosolv: el celular los
 * marca así. Cuando lleguen los documentos reales, se ajustan aquí.
 *
 * Clave: id de la escena de taller1.ts → id del área → ejemplo. Las pruebas
 * exigen que cada escena listada tenga ejemplo para todas las áreas.
 */
import type { EjemploArea } from './tipos.ts'

export const EJEMPLOS_TALLER1: Record<string, Record<string, EjemploArea>> = {
  reglas: {
    operaciones: { titulo: 'Un requerimiento con otra redacción', texto: 'Una lista de chequeo busca "presentar el informe". Si el auto dice "allegar la documentación soporte", la regla no lo encuentra. Un modelo sí entiende que es la misma obligación.' },
    logistica: { titulo: 'El certificado que llega en otro formato', texto: 'Una plantilla que busca "Peso (kg)" falla cuando el gestor escribe "Cantidad entregada: 0,32 t". El modelo reconoce que es el mismo dato, aunque cambien el nombre y la unidad.' },
    ventas: { titulo: 'El cliente que no usa las palabras del catálogo', texto: 'Un prospecto escribe "tenemos unos equipos viejos y unas canecas de aceite". Ninguna regla de un formulario lo clasifica. El modelo entiende que habla de RAEE y RESPEL.' },
    mercadeo: { titulo: 'Comentarios que no siguen un patrón', texto: 'Clasificar comentarios de redes con palabras clave falla con la ironía o con preguntas mal escritas. El modelo los ubica por lo que quieren decir.' },
    gerencia: { titulo: 'Contratos que no se parecen entre sí', texto: 'Cada cliente redacta las cláusulas a su manera. Una regla que busca "penalidad" no ve "descuento por incumplimiento". El modelo reconoce que es lo mismo.' },
    finanzas: { titulo: 'Conceptos de gasto escritos a mano', texto: 'Un reporte con "combus.", "gasolina camión" y "ACPM ruta norte" rompe cualquier regla exacta. El modelo los agrupa como combustible.' },
  },
  tokens: {
    operaciones: { titulo: 'Un auto de 40 páginas', texto: 'Para la IA no son páginas: son tokens. Los números de norma y los radicados se parten en varios pedazos, por eso un documento lleno de cifras ocupa más de lo que parece.' },
    logistica: { titulo: 'Un lote de certificados', texto: 'Cada certificado tiene NIT, fechas, kilos y consecutivos. Las cifras gastan muchos tokens: un lote grande puede no caber completo en una sola conversación.' },
    ventas: { titulo: 'El Brief de Zoho', texto: 'Un Brief corto cabe de sobra. Si le pega además el historial completo de correos con el cliente, la IA tiene que repartir su atención entre mucho más texto.' },
    mercadeo: { titulo: 'Límites de caracteres', texto: 'La IA cuenta en tokens, no en letras. Por eso a veces se pasa del límite de una publicación aunque usted le pida "máximo 200 caracteres": verifíquelo usted.' },
    gerencia: { titulo: 'Un contrato largo', texto: 'Un contrato de 60 páginas cabe en la conversación. Lo que importa es saber que el costo y el límite se miden por tokens: no tiene sentido pegar anexos que no hacen falta.' },
    finanzas: { titulo: 'Un reporte exportado de Zoho Books', texto: 'Una tabla con cientos de filas de cifras gasta muchísimos tokens. Mejor exportar solo las columnas y el periodo que necesita para la pregunta.' },
  },
  siguiente: {
    operaciones: { titulo: 'Redacciones distintas del mismo informe', texto: 'Si pide dos veces el borrador de una respuesta a la autoridad, saldrán dos redacciones distintas. No es un error: elige entre varias palabras probables. Por eso se revisa cada vez.' },
    logistica: { titulo: 'El recordatorio al gestor', texto: '"Le recordamos que el certificado de disposición final está pendiente desde el..." La IA completa lo más probable. Si usted no le da la fecha, pondrá una que suene bien.' },
    ventas: { titulo: 'Varias versiones del seguimiento', texto: 'Pedir tres versiones de un correo de seguimiento es útil justamente porque cada vez elige palabras distintas. Usted escoge la que suena a Ekosolv.' },
    mercadeo: { titulo: 'Ideas para un post', texto: 'Para lluvia de ideas conviene que se arriesgue más (temperatura alta). Para un texto con datos de una norma, mejor que vaya a lo seguro.' },
    gerencia: { titulo: 'Un resumen que suena seguro', texto: 'La IA escribe con el mismo tono seguro cuando acierta y cuando se equivoca. Que un resumen ejecutivo suene firme no dice nada sobre si es correcto.' },
    finanzas: { titulo: 'Cifras que "suenan" bien', texto: 'Si le pide el total del mes sin darle el reporte, escribirá un número probable, no el real. Las cifras salen del documento que usted le entrega, nunca de su memoria.' },
  },
  mapa: {
    operaciones: { titulo: 'PMA, plan de manejo, medidas de manejo', texto: 'Para la IA esas expresiones están juntas en el mapa. Por eso entiende su pregunta aunque use un sinónimo distinto al del documento.' },
    logistica: { titulo: 'Gestor, operador, receptor', texto: 'En los certificados cada gestor usa su palabra. La IA las ubica cerca y sabe que hablan del mismo papel en la cadena.' },
    ventas: { titulo: 'Cotización, propuesta, oferta', texto: 'Están en el mismo vecindario del mapa. Usted puede pedirle "la oferta para el cliente" y entiende que es la propuesta comercial.' },
    mercadeo: { titulo: 'Sostenibilidad, economía circular, aprovechamiento', texto: 'Quedan cerca, pero no son iguales. La IA tiende a usarlos como sinónimos: revise que diga lo que Ekosolv quiere decir.' },
    gerencia: { titulo: 'Riesgo, multa, sanción', texto: 'Para la IA están juntos. Si le pregunta por "riesgos del contrato", también le traerá penalidades aunque el contrato no use esa palabra.' },
    finanzas: { titulo: 'Cartera, cuentas por cobrar, saldos vencidos', texto: 'La IA entiende que hablan de lo mismo, aunque en Zoho Books aparezca con otro nombre.' },
  },
  etapas: {
    operaciones: { titulo: 'La norma de la semana pasada', texto: 'Si la autoridad expidió una resolución después de la fecha de corte, la IA no la conoce. Péguele el texto: así trabaja con la norma vigente y no con lo que recuerda.' },
    logistica: { titulo: 'Los gestores de este año', texto: 'La IA no sabe qué gestores tienen licencia vigente hoy ni con cuáles trabaja Ekosolv. Ese dato sale de sus registros, no de ella.' },
    ventas: { titulo: 'Investigar un prospecto', texto: 'Lo que sabe de una empresa puede estar desactualizado. Si la herramienta no busca en internet, la ficha del prospecto puede traer datos viejos.' },
    mercadeo: { titulo: 'Tendencias y fechas', texto: 'Le puede proponer temas que ya pasaron de moda o fechas de un año anterior. El calendario editorial siempre se revisa contra el año en curso.' },
    gerencia: { titulo: 'El mercado de hoy', texto: 'Para comparar proveedores o precios, la IA no conoce las tarifas actuales. Usted le da las propuestas; ella las ordena y compara.' },
    finanzas: { titulo: 'Tasas e impuestos vigentes', texto: 'Valores como la UVT o tarifas del año cambian. La IA puede darle los de su fecha de corte: confírmelos siempre.' },
  },
  contexto: {
    operaciones: { titulo: 'Qué darle', texto: 'El auto completo cabe. Todo el expediente del cliente no. Elija el auto, la licencia y el último informe: lo que necesita para esa tarea.' },
    logistica: { titulo: 'Conversación nueva, mesa vacía', texto: 'Si ayer le explicó el formato de los certificados de Ekosolv, hoy en una conversación nueva no lo recuerda. Guárdelo en un proyecto o vuelva a pegarlo.' },
    ventas: { titulo: 'Un proyecto por cliente grande', texto: 'Con un proyecto en Claude puede dejar fijos el Brief, las propuestas anteriores y el tono de Ekosolv. No tiene que repetirlos en cada conversación.' },
    mercadeo: { titulo: 'La voz de la marca, fija', texto: 'Si pega la guía de voz al inicio de cada conversación (o la deja en un proyecto), todas las publicaciones salen con el mismo tono.' },
    gerencia: { titulo: 'Varios documentos a la vez', texto: 'Puede darle tres propuestas de proveedores en la misma conversación y pedirle la comparación. Si son demasiados anexos, resuma primero cada uno.' },
    finanzas: { titulo: 'El reporte del mes y el del anterior', texto: 'Para explicar variaciones, ambos reportes tienen que estar en la misma conversación. Si solo ve uno, no puede comparar: inventará.' },
  },
  ecosistema: {
    operaciones: { titulo: 'Leer un PDF escaneado', texto: 'Claude lee PDF e imágenes. Un auto escaneado se puede adjuntar, pero revise los números: la lectura de un escaneo borroso puede fallar.' },
    logistica: { titulo: 'Fotos de certificados', texto: 'Puede tomar una foto de un certificado del gestor y pedirle que pase los datos a una tabla. Luego compare cada cifra con la foto.' },
    ventas: { titulo: 'Conectarse a Zoho', texto: 'Hoy se copia el Brief de Zoho y se pega. Más adelante, una herramienta conectada podría leerlo directamente: eso es darle "manos" a la IA.' },
    mercadeo: { titulo: 'Aplicación, no modelo', texto: 'Canva, LinkedIn o Copilot tienen IA adentro, pero detrás hay un modelo como Claude o GPT. Las reglas para pedir bien son las mismas.' },
    gerencia: { titulo: 'Agentes', texto: 'Un agente hace varios pasos solo: busca, lee y redacta. Sirve, pero el resultado se revisa igual que el de una persona nueva.' },
    finanzas: { titulo: 'Hojas de cálculo', texto: 'Claude puede leer un Excel o un CSV exportado de Zoho Books y calcular. Pida que muestre las fórmulas o los pasos para poder verificarlos.' },
  },
  inventa: {
    operaciones: { titulo: 'El artículo que no existe', texto: 'Si le pregunta "¿qué artículo exige el plan de contingencia?", puede citar un número con total seguridad. Si el texto de la norma no estaba en la conversación, verifíquelo.' },
    logistica: { titulo: 'Kilos que no estaban', texto: 'Si un certificado está borroso o le falta un dato, la IA puede completarlo con algo que suena razonable. Pídale que marque "no aparece" cuando no lo encuentre.' },
    ventas: { titulo: 'Casos de éxito inventados', texto: 'Si le pide "agrega clientes que confían en nosotros", puede inventar nombres. Nunca deje en una propuesta un cliente, cifra o certificación que usted no haya confirmado.' },
    mercadeo: { titulo: 'Estadísticas sin fuente', texto: '"El 70 % de las empresas en Colombia..." suena bien en un post y puede ser inventado. Toda cifra publicada lleva su fuente verificada.' },
    gerencia: { titulo: 'Cláusulas que no están', texto: 'En un resumen de contrato, la IA puede mencionar una garantía que es común en otros contratos pero no en ese. Pida que cite la cláusula de cada punto.' },
    finanzas: { titulo: 'Totales que no cuadran', texto: 'La IA puede sumar mal o inventar un subtotal. Las cifras de un informe se recalculan en la hoja de cálculo antes de enviarlo.' },
  },
  verificar: {
    operaciones: { titulo: 'Antes de enviar a la autoridad', texto: 'Cada norma citada se abre en la fuente oficial y cada plazo se cuenta en el calendario. Si la IA no dice de qué página sacó una obligación, no se usa.' },
    logistica: { titulo: 'Antes de cargar en Zoho', texto: 'Compare los kilos de la tabla con el certificado original, fila por fila, o al menos los totales. Un error aquí termina en el certificado del cliente.' },
    ventas: { titulo: 'Antes de enviar la propuesta', texto: 'Revise que precios, alcances y plazos sean los del Brief, no los que la IA supuso. Lo que se promete en la propuesta compromete a Ekosolv.' },
    mercadeo: { titulo: 'Antes de publicar', texto: 'Confirme datos, nombres de normas y afirmaciones sobre servicios. Un post con un dato falso queda público aunque lo borre después.' },
    gerencia: { titulo: 'Antes de decidir', texto: 'Pida a la IA las razones de cada recomendación y revise contra el documento original los dos o tres puntos que más pesan en la decisión.' },
    finanzas: { titulo: 'Antes del informe mensual', texto: 'Cada cifra del texto se cruza con el reporte de Zoho Books. Si la IA explica una variación, pida qué filas la causan y revíselas.' },
  },
  metodo: {
    operaciones: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: soy consultor de Ekosolv, el cliente es una planta en Funza. Tarea: extrae las obligaciones del auto. Formato: tabla con artículo, plazo y responsable. Ejemplo: una fila de muestra.' },
    logistica: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: soy de logística de Ekosolv y concilio certificados de gestores. Tarea: pasa estos certificados a una tabla. Formato: cliente, fecha, residuo, kilos y gestor. Ejemplo: una fila ya llena.' },
    ventas: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: soy comercial de Ekosolv; este es el Brief de un cliente industrial. Tarea: redacta el borrador de la propuesta. Formato: las secciones de nuestra plantilla. Ejemplo: una propuesta anterior aprobada.' },
    mercadeo: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: manejo las redes de Ekosolv; esta es nuestra guía de voz. Tarea: escribe tres publicaciones sobre esta norma nueva. Formato: LinkedIn, máximo 120 palabras. Ejemplo: un post que funcionó.' },
    gerencia: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: soy gerente de Ekosolv y debo elegir proveedor. Tarea: compara estas tres propuestas. Formato: matriz con precio, plazo, riesgos y recomendación. Ejemplo: los criterios que usamos la última vez.' },
    finanzas: { titulo: 'Las cuatro partes en su trabajo', texto: 'Contexto: llevo la cartera de Ekosolv; adjunto el reporte de Zoho Books. Tarea: explica las variaciones frente al mes anterior. Formato: cinco viñetas en lenguaje sencillo. Ejemplo: el informe del mes pasado.' },
  },
  iterar: {
    operaciones: { titulo: 'Corregir por partes', texto: '"Quita la obligación que no está en el auto." "Agrega una columna con la fecha límite." Cada corrección mejora la tabla sin volver a empezar.' },
    logistica: { titulo: 'Corregir por partes', texto: '"El certificado 3 está en toneladas: pásalo a kilos." "Marca en rojo las diferencias de más de 5 kg con lo recolectado."' },
    ventas: { titulo: 'Corregir por partes', texto: '"Más corto, el cliente es de producción, no ambiental." "Cambia el cierre: propón una visita técnica en vez de una llamada."' },
    mercadeo: { titulo: 'Corregir por partes', texto: '"Menos formal, pero sin emojis." "Empieza con la pregunta que se hace el cliente, no con la norma."' },
    gerencia: { titulo: 'Corregir por partes', texto: '"Dale más peso al plazo que al precio." "Ahora escríbeme el correo para comunicar la decisión al proveedor que no quedó."' },
    finanzas: { titulo: 'Corregir por partes', texto: '"Separa la cartera de más de 90 días." "Redacta un recordatorio de cobro cordial para los tres clientes con mayor saldo."' },
  },
  anonimizar: {
    operaciones: { titulo: 'Qué tapar en su trabajo', texto: 'En autos y requerimientos: nombres de funcionarios y del representante legal, cédulas y direcciones de predios cuando no hagan falta. Cámbielos por roles: "el representante legal".' },
    logistica: { titulo: 'Qué tapar en su trabajo', texto: 'En certificados: nombre, cédula y celular del conductor y de quien entregó. Los kilos, el residuo y la fecha sí se pueden dejar: son lo que se necesita.' },
    ventas: { titulo: 'Qué tapar en su trabajo', texto: 'En el Brief y los correos: celular y correo personal del contacto. Para redactar la propuesta basta con "el jefe de planta" y el sector del cliente.' },
    mercadeo: { titulo: 'Qué tapar en su trabajo', texto: 'En casos para publicar: el nombre del cliente si no ha autorizado, y cualquier dato de personas en fotos o testimonios.' },
    gerencia: { titulo: 'Qué tapar en su trabajo', texto: 'En contratos y temas de personal: salarios, datos de salud, evaluaciones de desempeño. Lo de salud y desempeño no se sube ni anonimizado.' },
    finanzas: { titulo: 'Qué tapar en su trabajo', texto: 'En reportes: cuentas bancarias, NIT y nombres de clientes pueden cambiarse por "Cliente A", "Cliente B". Las cifras y los conceptos sirven igual para el análisis.' },
  },
}
