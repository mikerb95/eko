/**
 * Contenido de las lecciones de los talleres por área. Módulo PURO.
 *
 * La clave es `<área>:<n>`, con n el número del tema en `aprende` de
 * src/lib/capacitacion.ts (empieza en 1), o `<área>:entrega` para la lección
 * de entrega. semilla.ts lo mezcla con el título que viene del programa.
 *
 * Criterios de redacción:
 * - Cada tema: para qué sirve, el método paso a paso, qué verificar y el
 *   error típico. Corto: se lee en 10 a 20 minutos.
 * - Normas: solo las de referencia general, y siempre con la orden de
 *   verificarlas en la fuente oficial. Nunca se le pide a la IA que cite una
 *   norma sin el texto delante.
 * - Las instrucciones de ejemplo usan corchetes para lo que la persona
 *   reemplaza, y piden que la IA diga "no aparece" en vez de suponer.
 *
 * Todo se siembra sin publicar: Mike lo revisa antes de abrirlo al equipo.
 */
import type { Prompt } from './semilla.ts'

export interface ContenidoLeccion {
  resumen: string
  contenido: string
  prompts: Prompt[]
  practica_consigna?: string
  minutos: number
}

const NO_SUPONER = 'Si un dato no aparece en el documento, escribe "no aparece" en vez de suponerlo.'

export const CONTENIDO_AREAS: Record<string, ContenidoLeccion> = {
  // ───────────────────────── OPERACIONES ─────────────────────────
  'operaciones:1': {
    resumen: 'De un auto o una resolución a la lista de obligaciones, con artículo, plazo y responsable.',
    minutos: 20,
    contenido: `Un auto de seguimiento puede tener treinta páginas y las obligaciones repartidas entre considerandos y artículos. La IA las encuentra en minutos, pero solo si usted le pide exactamente qué sacar y le prohíbe rellenar lo que no está.

## El método

1. Comparta el documento completo (PDF o texto). Si es escaneado y la IA no lo lee bien, dígalo y pida que marque lo ilegible.
2. Pida una tabla con columnas fijas: obligación, artículo, plazo, cómo se cuenta el plazo, responsable y evidencia que se debe entregar.
3. Exija que cite el artículo de cada fila y que escriba "no aparece" cuando falte algo.
4. Pida al final las obligaciones con plazo más corto y las que no tienen plazo explícito.

## Qué verificar siempre

- Que cada fila exista en el artículo citado. Revise al menos las que tienen plazo.
- Cómo se cuentan los plazos (días hábiles o calendario, desde la ejecutoria o desde la notificación). La IA tiende a simplificar esto.
- Que no haya mezclado lo que dice un considerando con lo que ordena la parte resolutiva. Solo la parte resolutiva obliga.

## Error típico

Pedir "resúmeme el auto". Sale un resumen bonito que no sirve para el calendario de vencimientos.`,
    prompts: [
      {
        titulo: 'Matriz de obligaciones de un auto',
        texto: `Contexto: soy consultor ambiental de Ekosolv. Te comparto un [auto de seguimiento / resolución] de [autoridad] dirigido a un cliente.\nTarea: extrae todas las obligaciones de la parte resolutiva.\nFormato: tabla con las columnas Obligación, Artículo, Plazo, Cómo se cuenta el plazo, Responsable, Evidencia a entregar. Cita el artículo en cada fila. ${NO_SUPONER}\nAl final: las tres obligaciones con plazo más corto y las que no tienen plazo explícito.`,
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para sacar la matriz de obligaciones de un auto que le llegó esta semana.',
  },
  'operaciones:2': {
    resumen: 'Usar la IA para orientarse en la norma, y la fuente oficial para confirmarla.',
    minutos: 15,
    contenido: `La IA sirve para orientarse: qué temas regula una norma, qué otra norma podría aplicar, qué preguntar. **No sirve como fuente.** Puede citar un artículo que no existe, uno modificado o una resolución derogada, y decirlo con total seguridad.

## El método

1. Pregúntele qué normas podrían aplicar al caso y pídale que diga, para cada una, qué tan segura está y qué habría que verificar.
2. Busque cada norma en la fuente oficial: SUIN-Juriscol, el gestor normativo de Función Pública o el sitio de la autoridad que la expidió.
3. Confirme que esté vigente y revise si tiene modificaciones.
4. Con el texto oficial delante, ahí sí: pegue el artículo y pida a la IA que lo aplique al caso.

## Referencias que el equipo ya conoce

El Decreto 1076 de 2015 (único reglamentario del sector ambiente) recoge buena parte de los decretos del sector. Úselo como punto de partida y verifique siempre el texto vigente.

## Error típico

Copiar en un informe para el cliente el número de resolución que dio la IA, sin abrirla.`,
    prompts: [
      {
        titulo: 'Orientarse en la norma sin creerle a ciegas',
        texto: 'Contexto: soy consultor ambiental de Ekosolv en Colombia. Caso: [describa la actividad del cliente, el recurso o el residuo y la autoridad].\nTarea: dime qué normas podrían aplicar y por qué.\nFormato: tabla con Norma, Qué regula del caso, Qué tan seguro estás (alto, medio, bajo), Qué debo verificar en la fuente oficial. No inventes números de artículo: si no estás seguro del artículo, escribe "verificar".',
      },
      {
        titulo: 'Aplicar un artículo ya verificado',
        texto: 'Te pego el texto oficial y vigente del [artículo X de la norma Y]. Con base solo en este texto, dime qué obligaciones tiene el cliente en este caso: [caso]. Si el texto no alcanza para concluir algo, dilo.',
      },
    ],
    minutos_extra: undefined as never,
  } as ContenidoLeccion,
  'operaciones:3': {
    resumen: 'Revisar un ICA, un PMA o un EIA contra una lista de chequeo, punto por punto.',
    minutos: 20,
    contenido: `Revisar un Informe de Cumplimiento Ambiental (ICA) o un Plan de Manejo Ambiental (PMA) es comparar lo que dice el documento con lo que debería decir. La IA hace muy bien esa comparación si usted le da la lista de chequeo: no le pida que invente los criterios.

## El método

1. Tenga a mano la lista de chequeo (la de Ekosolv, los términos de referencia o lo que exige la licencia o el auto).
2. Comparta el documento y la lista, y pida revisar punto por punto: cumple, cumple parcialmente, no cumple o no aplica.
3. Para cada punto, que cite la página o sección del documento donde lo encontró.
4. Pida al final la lista de faltantes en lenguaje claro para el cliente.

## Qué verificar

- Los "cumple" sin página citada: suelen ser suposiciones.
- Las cifras de indicadores y metas contra los anexos.
- Que la versión de la lista de chequeo sea la vigente para ese expediente.

## Error típico

Pedirle "revisa si este PMA está bien". Sin criterios, la IA opina en general y siempre encuentra algo bueno que decir.`,
    prompts: [
      {
        titulo: 'Revisión de un ICA o PMA contra la lista de chequeo',
        texto: `Contexto: soy consultor ambiental de Ekosolv. Te comparto el [ICA / PMA] de un cliente y la lista de chequeo que debe cumplir.\nTarea: revisa el documento punto por punto contra la lista.\nFormato: tabla con Punto de la lista, Resultado (cumple, parcial, no cumple, no aplica), Dónde está en el documento (página o sección), Observación. ${NO_SUPONER}\nAl final: los faltantes en un párrafo corto para el cliente, sin términos técnicos.`,
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para revisar un ICA contra la lista de chequeo de Ekosolv.',
  },
  'operaciones:4': {
    resumen: 'Pasar resultados de laboratorio a una tabla y compararlos con los límites, sin que la IA haga cuentas a ciegas.',
    minutos: 15,
    contenido: `Comparar los resultados de un laboratorio con los límites de la norma (por ejemplo, los de vertimientos de la Resolución 0631 de 2015) es tedioso y propenso a errores al copiar. La IA ayuda a pasar los datos a una tabla y a señalar los excedidos, pero **usted pone los límites**: no deje que los recuerde.

## El método

1. Comparta el informe del laboratorio.
2. Pegue la tabla de límites aplicables, tomada de la norma vigente y del permiso del cliente.
3. Pida una tabla: parámetro, unidad, resultado, límite, cumple o excede, y cuánto excede en porcentaje.
4. Pida que marque unidades distintas entre resultado y límite, en vez de convertirlas por su cuenta.

## Qué verificar

- Cada resultado copiado contra el informe original. Es donde más se equivoca.
- Las unidades y los valores "menor que el límite de detección".
- Los porcentajes de exceso: recalcule los que van a salir en el informe.

## Error típico

Pedir "¿cumple con la norma?" sin pegar los límites. La IA puede usar valores de otra norma o de otro año.`,
    prompts: [
      {
        titulo: 'Resultados de laboratorio contra límites',
        texto: 'Contexto: soy consultor ambiental de Ekosolv. Te comparto el informe de laboratorio de [tipo de muestra] de un cliente y, abajo, la tabla de límites que aplican (ya verificada).\nTarea: compara cada resultado con su límite.\nFormato: tabla con Parámetro, Unidad, Resultado, Límite, Cumple o excede, % de exceso. Usa solo los límites que te pego. Si las unidades no coinciden, márcalo y no conviertas. Si un parámetro no tiene límite en la tabla, escribe "sin límite".\nLímites:\n[pegue la tabla]',
      },
    ],
  },
  'operaciones:5': {
    resumen: 'Cruzar los kilos de los certificados de recolección con los de disposición final y encontrar diferencias.',
    minutos: 20,
    contenido: `Este tema se ve junto con Logística. Cada recolección genera un certificado de recolección; luego el gestor emite el de disposición final. Si los kilos o los tipos de residuo no cuadran, el certificado de Ekosolv al cliente queda mal. La IA puede leer un lote de certificados y cruzarlos.

## El método

1. Reúna el lote: certificados de recolección y certificados de los gestores del mismo período.
2. Pida a la IA pasar cada certificado a una fila: número, fecha, cliente, gestor, tipo de residuo, kilos.
3. Pida cruzar por cliente y tipo de residuo y mostrar las diferencias de kilos, y los certificados que no tienen pareja.
4. Defina con su jefe cuánta diferencia es aceptable (por ejemplo, por humedad o tara) y pídale que marque solo lo que la supere.

## Qué verificar

- Los kilos de cada fila contra el PDF original, sobre todo en certificados escaneados.
- Que no haya juntado dos clientes con nombres parecidos.
- Las sumas del total del mes: recalcúlelas en la hoja de cálculo.

## Error típico

Subir cincuenta certificados de una vez y confiar en la suma. Mejor por lotes pequeños y con la tabla intermedia a la vista.`,
    prompts: [
      {
        titulo: 'Conciliación de un lote de certificados',
        texto: `Contexto: trabajo en Ekosolv. Te comparto los certificados de recolección y los de disposición final de los gestores de [mes].\nTarea 1: pasa cada certificado a una fila con Tipo (recolección o disposición), Número, Fecha, Cliente, Gestor, Tipo de residuo, Kilos. ${NO_SUPONER}\nTarea 2: cruza recolección contra disposición por cliente y tipo de residuo.\nFormato: una tabla de diferencias con Cliente, Tipo de residuo, Kilos recolectados, Kilos dispuestos, Diferencia, % diferencia. Marca las diferencias mayores a [X]%. Lista aparte los certificados sin pareja.`,
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para conciliar los certificados de recolección y de disposición final de un mes.',
  },
  'operaciones:6': {
    resumen: 'Borradores de informes y respuestas a la autoridad con la estructura de Ekosolv, listos para revisar.',
    minutos: 15,
    contenido: `La IA escribe rápido el primer borrador. El valor está en darle los insumos correctos (el requerimiento, los hechos, la evidencia) y la estructura que usa Ekosolv. Usted pone el criterio técnico y la firma.

## El método

1. Pegue el requerimiento o la solicitud que hay que responder.
2. Dé los hechos en viñetas: qué se hizo, cuándo, con qué evidencia. La IA no debe inventar ninguno.
3. Indique la estructura (por ejemplo: referencia, antecedentes, respuesta punto por punto, anexos) y el tono.
4. Pida que marque entre corchetes lo que falte, en vez de rellenarlo.
5. Pida además un resumen de tres líneas para el cliente.

## Qué verificar

- Que cada afirmación tenga respaldo en la evidencia.
- Fechas, números de radicado y nombres.
- Que responda todos los puntos del requerimiento, en el mismo orden.

## Error típico

Mandar el borrador sin leerlo completo. La IA a veces promete acciones que el cliente no ha hecho.`,
    prompts: [
      {
        titulo: 'Respuesta a un requerimiento de la autoridad',
        texto: 'Contexto: soy consultor de Ekosolv y preparo, para un cliente, la respuesta a un requerimiento de [autoridad]. Te pego el requerimiento y, abajo, los hechos y la evidencia disponibles.\nTarea: redacta el borrador de respuesta.\nFormato: Referencia, Antecedentes, Respuesta punto por punto (en el mismo orden del requerimiento), Anexos. Tono formal y concreto. No afirmes nada que no esté en los hechos; marca con [completar] lo que falte.\nAl final, aparte: resumen de tres líneas para el cliente.\nHechos y evidencia:\n[viñetas]',
      },
    ],
  },
  'operaciones:entrega': {
    resumen: 'La matriz de obligaciones de un auto real, la revisión de un ICA o un PMA y la conciliación de un lote de certificados.',
    minutos: 60,
    contenido: `Esta entrega junta los dos sábados del taller. Use documentos reales de un expediente que esté atendiendo, anonimizados si hace falta (cambie el nombre del cliente y quite datos de personas).

## Qué entregar

1. La matriz de obligaciones de un auto o una resolución real, con artículo, plazo y responsable.
2. La revisión de un ICA o un PMA contra la lista de chequeo, con los faltantes.
3. La conciliación de un lote de certificados de recolección contra los de disposición final.

En cada una, cuente qué instrucción usó, qué tuvo que corregir y qué verificó en el documento original o en la fuente oficial.`,
    prompts: [],
  },

  // ───────────────────────── LOGÍSTICA ─────────────────────────
  'logistica:1': {
    resumen: 'De un lote de certificados de gestores a una tabla, cruzada con lo que se recolectó.',
    minutos: 20,
    contenido: `Cada gestor manda su certificado en su propio formato. Pasarlos a mano a una tabla quita horas y es donde se cuelan errores de digitación. La IA lee los PDF y arma la tabla; usted revisa.

## El método

1. Junte los certificados del período y la lista de lo recolectado (de Zoho o de la planilla de rutas).
2. Pida una fila por certificado: gestor, número, fecha, cliente, tipo de residuo, kilos.
3. Pida cruzar con lo recolectado por cliente y tipo de residuo, y mostrar diferencias y faltantes.
4. Trabaje por lotes de diez a quince certificados.

## Qué verificar

- Los kilos de cada fila contra el PDF, sobre todo si es escaneado o foto.
- Los nombres de clientes parecidos.
- Los certificados que la IA no pudo leer: que los liste, no que los salte.

## Error típico

No pedir la tabla intermedia y quedarse solo con el total. Sin la tabla no hay cómo revisar.`,
    prompts: [
      {
        titulo: 'Certificados de gestores a tabla',
        texto: `Contexto: trabajo en Logística de Ekosolv. Te comparto los certificados de disposición final que mandaron los gestores en [mes] y la lista de recolecciones del mismo mes.\nTarea: pasa cada certificado a una fila y crúzalos con lo recolectado.\nFormato: primero la tabla de certificados (Gestor, Número, Fecha, Cliente, Tipo de residuo, Kilos). Después, la tabla de cruce (Cliente, Tipo de residuo, Kilos recolectados, Kilos certificados, Diferencia). ${NO_SUPONER} Lista aparte los certificados que no pudiste leer bien.`,
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para pasar a una tabla los certificados que le mandaron los gestores este mes.',
  },
  'logistica:2': {
    resumen: 'Solicitudes y recordatorios a gestores claros, cordiales y con lo que necesita, en minutos.',
    minutos: 12,
    contenido: `Pedirle a un gestor un certificado que está demorado, o recordarle una recolección, son correos que se escriben muchas veces. La IA los redacta en segundos si le da los datos y el tono.

## El método

1. Dé los datos concretos: gestor, recolección o lote, fecha, qué falta y para cuándo lo necesita.
2. Diga en qué punto va: primera solicitud, primer recordatorio o segundo recordatorio.
3. Pida un correo corto (máximo ocho líneas) y un mensaje de WhatsApp aún más corto.
4. Guarde las instrucciones que le funcionen: se repiten cada semana.

## Qué verificar

- Fechas y números de recolección.
- Que el tono suba de forma gradual: cordial en la primera, firme en el segundo recordatorio, nunca grosero.

## Error típico

Pegar el correo sin revisar el nombre del gestor o la fecha. Un dato equivocado le quita seriedad al seguimiento.`,
    prompts: [
      {
        titulo: 'Recordatorio a un gestor',
        texto: 'Contexto: trabajo en Logística de Ekosolv. El gestor [nombre del gestor] no ha enviado el certificado de disposición final de la recolección [número] del [fecha]. Es el [primer / segundo] recordatorio. Lo necesitamos antes del [fecha] para emitir el certificado al cliente.\nTarea: redacta el recordatorio.\nFormato: un correo de máximo ocho líneas con asunto, y aparte un mensaje de WhatsApp de máximo tres líneas. Tono cordial y firme.',
      },
    ],
  },
  'logistica:3': {
    resumen: 'Sacar del certificado del gestor y de la recolección los datos del certificado de Ekosolv.',
    minutos: 20,
    contenido: `El certificado que Ekosolv entrega al cliente se arma con dos fuentes: los datos de la recolección y el certificado del gestor. La IA puede extraer esos datos y dejarlos listos en la plantilla de Ekosolv. El certificado lo revisa y lo firma una persona.

## El método

1. Comparta el certificado del gestor y los datos de la recolección.
2. Pida extraer exactamente los campos de la plantilla de Ekosolv: cliente, NIT, fecha de recolección, tipo de residuo, kilos, gestor, número del certificado del gestor, tipo de tratamiento.
3. Pida marcar cualquier diferencia entre las dos fuentes, por ejemplo kilos distintos.
4. Con los datos revisados, llénelos en la plantilla oficial.

## Qué verificar

- Cada campo contra el documento fuente. Este documento sale con la firma de Ekosolv.
- El NIT y la razón social del cliente.
- Que el tratamiento coincida con lo que dice el gestor, sin sinónimos inventados.

## Error típico

Pedirle a la IA que "haga el certificado". El formato oficial es el de Ekosolv; la IA solo prepara los datos.`,
    prompts: [
      {
        titulo: 'Datos del certificado de Ekosolv',
        texto: `Contexto: trabajo en Logística de Ekosolv. Te comparto el certificado de disposición final del gestor y los datos de nuestra recolección.\nTarea: extrae los datos para el certificado de Ekosolv al cliente.\nFormato: lista con estos campos y su valor: Cliente, NIT, Fecha de recolección, Tipo de residuo, Kilos recolectados, Kilos dispuestos según el gestor, Gestor, Número del certificado del gestor, Tipo de tratamiento. ${NO_SUPONER} Al final, lista las diferencias entre las dos fuentes.`,
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para sacar los datos del certificado de Ekosolv a partir del certificado de un gestor.',
  },
  'logistica:4': {
    resumen: 'Ordenar la programación de recolecciones y responder rápido a los clientes sobre su servicio.',
    minutos: 12,
    contenido: `Con la lista de solicitudes pendientes, la IA puede proponer una agrupación por zona y fecha, y redactar las respuestas a los clientes que preguntan por su recolección o su certificado.

## Programar

1. Pegue las solicitudes pendientes: cliente, dirección o municipio, tipo y cantidad estimada, fecha deseada.
2. Diga las restricciones: días de ruta, capacidad del vehículo, zonas que se visitan juntas.
3. Pida una propuesta de agrupación por día y zona. La decisión final es suya: la IA no conoce el tráfico ni los acuerdos con cada cliente.

## Responder a clientes

1. Dé el estado real: programada, recolectada, esperando certificado del gestor, certificado enviado.
2. Pida una respuesta corta, cordial y con la fecha esperada solo si usted la tiene.

## Error típico

Dejar que la IA prometa fechas. Solo se comunica lo que está confirmado.`,
    prompts: [
      {
        titulo: 'Agrupar recolecciones por zona',
        texto: 'Contexto: trabajo en Logística de Ekosolv. Te pego las solicitudes de recolección pendientes (cliente, municipio, tipo de residuo, cantidad estimada, fecha deseada). Hacemos ruta [días] y el vehículo carga hasta [kilos].\nTarea: propón cómo agruparlas por día y zona.\nFormato: tabla por día con Cliente, Municipio, Cantidad estimada, y el total del día. Señala las que no caben o no cumplen la fecha deseada.\n[solicitudes]',
      },
      {
        titulo: 'Respuesta a un cliente sobre su servicio',
        texto: 'Un cliente pregunta por su [recolección / certificado]. Estado real: [estado]. Fecha confirmada: [fecha o "sin fecha confirmada"]. Redacta una respuesta de máximo cinco líneas, cordial, en trato de usted. No prometas fechas que no te di.',
      },
    ],
  },
  'logistica:5': {
    resumen: 'Una revisión rápida de las cifras antes de cargarlas en Zoho.',
    minutos: 12,
    contenido: `Un error de digitación en Zoho termina en un certificado o en un reporte equivocado. Antes de cargar, la IA puede revisar la tabla y señalar lo raro.

## El método

1. Pegue la tabla que va a cargar (sin datos personales de contacto).
2. Pida revisar: kilos en cero o negativos, valores muy distintos al promedio de ese cliente, fechas fuera del mes, clientes repetidos con nombres parecidos, totales que no cuadran.
3. Pida solo la lista de filas sospechosas con el motivo. No le pida que corrija: usted decide.

## Qué verificar

- Cada fila sospechosa contra el documento original.
- Los totales por gestor y por cliente en la hoja de cálculo.

## Error típico

Pedirle que "arregle la tabla". Puede cambiar datos correctos para que se vean "normales".`,
    prompts: [
      {
        titulo: 'Revisar la tabla antes de Zoho',
        texto: 'Contexto: trabajo en Logística de Ekosolv y voy a cargar en Zoho esta tabla de recolecciones de [mes].\nTarea: revisa la tabla y señala filas sospechosas: kilos en cero o negativos, valores muy distintos a los demás del mismo cliente, fechas fuera de [mes], clientes que parecen el mismo con otro nombre, totales que no cuadran.\nFormato: lista de filas sospechosas con el motivo. No corrijas ni cambies ningún dato.\n[tabla]',
      },
    ],
  },
  'logistica:entrega': {
    resumen: 'El certificado de disposición final de Ekosolv preparado a partir del certificado real de un gestor y la conciliación de un lote de recolecciones.',
    minutos: 45,
    contenido: `Use documentos reales del último mes, anonimizados si hace falta.

## Qué entregar

1. Los datos del certificado de disposición final de Ekosolv, sacados con IA del certificado real de un gestor, y el borrador en la plantilla de la empresa.
2. La conciliación de un lote de recolecciones contra los certificados de los gestores, con las diferencias encontradas.

Cuente qué instrucción usó, qué diferencias apareció la IA y cuáles verificó usted en el documento original.`,
    prompts: [],
  },

  // ───────────────────────── VENTAS ─────────────────────────
  'ventas:1': {
    resumen: 'Del registro de Brief en Zoho CRM al primer borrador de la propuesta, con la plantilla de Ekosolv.',
    minutos: 25,
    contenido: `El Brief de Zoho CRM ya tiene lo esencial del cliente: qué necesita, línea de servicio, alcance. La IA puede convertirlo en un primer borrador de propuesta con la estructura de Ekosolv, y usted lo ajusta con su criterio comercial.

## El método

1. Copie los campos del Brief (sin datos de contacto personales).
2. Pegue la estructura de la propuesta de Ekosolv: presentación, entendimiento de la necesidad, alcance, metodología, cronograma, entregables, inversión, condiciones.
3. Pida el borrador con esa estructura y que deje entre corchetes lo que no esté en el Brief, empezando por los precios.
4. Pida al final las preguntas que habría que hacerle al cliente para cerrar el alcance.

## Qué verificar

- El alcance: que no prometa servicios que Ekosolv no presta o que el cliente no pidió.
- Las normas que mencione: verifíquelas con Operaciones.
- Los precios: siempre salen del catálogo y de su criterio, nunca de la IA.

## Error típico

Pedir "hazme una propuesta para este cliente" sin la estructura. Sale genérica y hay que rehacerla.`,
    prompts: [
      {
        titulo: 'Del Brief al borrador de propuesta',
        texto: 'Contexto: trabajo en Ventas de Ekosolv (consultoría ambiental y gestión de residuos). Te pego el Brief de Zoho CRM de un prospecto y la estructura de nuestras propuestas.\nTarea: redacta el primer borrador de la propuesta.\nFormato: usa exactamente la estructura que te pego. Tono profesional y cercano, trato de usted. No pongas precios: escribe [precio]. Lo que no esté en el Brief, déjalo entre corchetes.\nAl final, aparte: cinco preguntas para hacerle al cliente y cerrar el alcance.\nBrief:\n[campos]\nEstructura:\n[secciones]',
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para convertir un Brief de Zoho en el borrador de una propuesta.',
  },
  'ventas:2': {
    resumen: 'Llegar a la reunión sabiendo qué hace el prospecto y qué le puede exigir la autoridad.',
    minutos: 15,
    contenido: `Antes de una reunión vale la pena saber a qué se dedica el prospecto, dónde opera y qué obligaciones ambientales podría tener. La IA ayuda a ordenar esa información, pero puede confundir empresas con nombres parecidos o tener datos viejos.

## El método

1. Reúna información pública: sitio web del prospecto, noticias, lo que dijo en el primer contacto.
2. Pida a la IA una ficha: actividad, sedes, tamaño aproximado, posibles obligaciones ambientales y qué servicios de Ekosolv podrían servirle.
3. Pida también tres preguntas para abrir la reunión.

## Qué verificar

- Que la información sea de esa empresa y no de otra con nombre parecido.
- Las obligaciones ambientales: son hipótesis para preguntar, no afirmaciones para el cliente.

## Cuidado

No cargue en la IA información confidencial que el prospecto le haya compartido en privado sin necesidad.`,
    prompts: [
      {
        titulo: 'Ficha de un prospecto',
        texto: 'Contexto: trabajo en Ventas de Ekosolv y tengo reunión con [empresa], que se dedica a [actividad] en [ciudad]. Te pego lo que encontré en su sitio web y lo que nos dijo en el primer contacto.\nTarea: arma una ficha para preparar la reunión.\nFormato: Actividad y sedes, Posibles obligaciones ambientales (como hipótesis a confirmar), Servicios de Ekosolv que podrían servirle (Ekonsulting, Ekoraee, Ekopartner, Ekotrading), Tres preguntas para abrir la reunión. Usa solo la información que te doy; si algo no está, dilo.\n[información]',
      },
    ],
  },
  'ventas:3': {
    resumen: 'Seguimientos que no suenan a plantilla y respuestas a las objeciones de siempre.',
    minutos: 15,
    contenido: `Los seguimientos y las objeciones se repiten: "está muy caro", "ya tenemos proveedor", "ahora no es el momento". La IA ayuda a responderlas bien si le da el contexto de esa conversación.

## El método

1. Cuente en qué va la conversación: qué se propuso, cuándo, qué respondió el cliente.
2. Diga la objeción con las palabras del cliente.
3. Pida dos o tres versiones con enfoques distintos (por ejemplo: valor, riesgo de incumplimiento, opción por etapas) y elija.
4. Pida que sea corto y que termine con un siguiente paso concreto.

## Qué verificar

- Que no prometa descuentos ni condiciones que usted no puede dar.
- Que el tono suene a usted y a Ekosolv, no a correo masivo.

## Error típico

Mandar la primera versión. Pedir dos o tres y combinar suele dar el mejor correo.`,
    prompts: [
      {
        titulo: 'Responder una objeción',
        texto: 'Contexto: trabajo en Ventas de Ekosolv. Le enviamos una propuesta de [servicio] a [tipo de empresa] el [fecha]. El cliente respondió: "[objeción con sus palabras]".\nTarea: redacta tres respuestas con enfoques distintos (valor del servicio, riesgo de no cumplir, propuesta por etapas).\nFormato: cada una de máximo seis líneas, trato de usted, y que termine con un siguiente paso concreto. No ofrezcas descuentos.',
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para responder a un cliente que dijo que la propuesta está muy cara.',
  },
  'ventas:entrega': {
    resumen: 'Un borrador de propuesta hecho a partir de un Brief real.',
    minutos: 45,
    contenido: `Elija un Brief real de Zoho CRM, de ser posible uno que esté en curso.

## Qué entregar

El borrador de la propuesta con la estructura de Ekosolv, hecho con IA a partir del Brief, y las preguntas para cerrar el alcance. Cuente qué instrucción usó, qué corrigió del borrador y qué tuvo que validar con Operaciones.`,
    prompts: [],
  },

  // ───────────────────────── MERCADEO / REDES ─────────────────────────
  'mercadeo:1': {
    resumen: 'Escribir la voz de Ekosolv en una página para que la IA no suene genérica.',
    minutos: 20,
    contenido: `Sin indicaciones, la IA escribe como todo el mundo: frases infladas, mucho "en el mundo de hoy" y emojis. La solución es una guía de voz corta que se pega al inicio de cada instrucción.

## Qué lleva la guía de voz

- **Quién habla:** Ekosolv, consultores en sostenibilidad, con experiencia técnica real.
- **A quién:** gerentes y responsables ambientales de empresas en Colombia.
- **Cómo suena:** claro, técnico sin ser pesado, con datos verificables. Trato de usted.
- **Qué evitar:** promesas exageradas, términos de moda, alarmismo, emojis en exceso.
- **Ejemplos:** dos o tres publicaciones de Ekosolv que hayan funcionado.

## El método

1. Pida a la IA un borrador de guía a partir de las publicaciones que más le gustan.
2. Corríjala con su equipo y déjela en una página.
3. Péguela al inicio de cada instrucción de contenido.

## Error típico

Escribir "con un tono profesional" y nada más. Eso no le dice nada a la IA.`,
    prompts: [
      {
        titulo: 'Borrador de la guía de voz',
        texto: 'Contexto: manejo el contenido y las redes de Ekosolv, empresa colombiana de consultoría ambiental y gestión de residuos. Te pego cinco publicaciones nuestras que funcionaron bien.\nTarea: a partir de ellas, propón una guía de voz de la marca.\nFormato: máximo una página con Quién habla, A quién le hablamos, Cómo sonamos (cinco rasgos con ejemplo), Qué evitamos (cinco cosas), Palabras que sí y palabras que no.\n[publicaciones]',
      },
    ],
  },
  'mercadeo:2': {
    resumen: 'Un mes de contenido repartido entre las líneas de servicio, con fechas y formatos.',
    minutos: 15,
    contenido: `Un calendario editorial evita publicar a última hora y equilibra las líneas de servicio: Ekonsulting, Ekoraee, Ekopartner y Ekotrading.

## El método

1. Dé el insumo: líneas de servicio, frecuencia por red, fechas importantes del mes (ambientales y comerciales) y temas que el equipo técnico quiere comunicar.
2. Pida una tabla por semana: fecha, red, línea de servicio, tema, formato (carrusel, video corto, artículo) y objetivo.
3. Pida que no repita temas y que reparta las líneas de forma equilibrada.

## Qué verificar

- Las fechas conmemorativas que proponga la IA: confirme que existan y que sean de ese día.
- Que los temas técnicos los valide Operaciones antes de publicar.

## Error típico

Pedir "ideas para redes". Salen sueltas y sin relación con lo que vende Ekosolv.`,
    prompts: [
      {
        titulo: 'Calendario editorial del mes',
        texto: 'Contexto: manejo las redes de Ekosolv. Líneas de servicio: Ekonsulting (consultoría y trámites ambientales), Ekoraee (recolección de RAEE), Ekopartner (gestión de residuos posconsumo y certificados), Ekotrading. Publicamos [frecuencia] en LinkedIn e Instagram. Temas que quiere comunicar el equipo: [temas].\nTarea: arma el calendario editorial de [mes].\nFormato: tabla con Fecha, Red, Línea de servicio, Tema, Formato, Objetivo. Reparte las líneas de forma equilibrada y no repitas temas. Si propones una fecha conmemorativa, márcala para verificarla.',
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para armar el calendario editorial del próximo mes.',
  },
  'mercadeo:3': {
    resumen: 'Una norma nueva o un caso convertido en un artículo y varias publicaciones con la misma voz.',
    minutos: 20,
    contenido: `Un buen tema rinde para varias piezas: un artículo para el blog, un carrusel, una publicación de LinkedIn y una historia. La IA hace la adaptación; la fuente y los datos los pone usted.

## El método

1. Parta de una fuente concreta: la norma (texto oficial), el caso real (anonimizado y aprobado) o la nota del equipo técnico.
2. Pegue la guía de voz.
3. Pida primero el artículo, revíselo, y luego pida adaptarlo a cada red con su largo y formato.
4. Pida que cite la fuente en el artículo y que no agregue datos que no estén en ella.

## Qué verificar

- Cada cifra y cada número de norma contra la fuente.
- Que un caso de cliente esté anonimizado y autorizado.
- Que el llamado a la acción lleve a un servicio real de Ekosolv.

## Error típico

Pedir el artículo "sobre la nueva norma de RAEE" sin pegar la norma. La IA puede describir una que no es.`,
    prompts: [
      {
        titulo: 'Del tema al artículo y las publicaciones',
        texto: 'Contexto: manejo el contenido de Ekosolv. Te pego la guía de voz y la fuente del tema: [norma, caso o nota técnica].\nTarea 1: escribe un artículo para el blog de 600 a 800 palabras, con título, subtítulos y un cierre que invite a contactar a Ekosolv. Usa solo datos de la fuente y cítala.\nTarea 2: adáptalo a un carrusel de LinkedIn (6 láminas, una idea por lámina) y a una publicación de Instagram (máximo 120 palabras).\nGuía de voz:\n[guía]\nFuente:\n[texto]',
      },
    ],
  },
  'mercadeo:entrega': {
    resumen: 'Una campaña corta sobre un tema real: un artículo y tres publicaciones.',
    minutos: 45,
    contenido: `Elija un tema real del mes: una norma, un caso aprobado o un servicio que se quiera impulsar.

## Qué entregar

El artículo para el blog y tres publicaciones adaptadas a las redes, hechos con IA y con la guía de voz. Cuente la instrucción que usó, qué datos verificó y qué cambió para que sonara a Ekosolv.`,
    prompts: [],
  },

  // ───────────────────────── GERENCIA ─────────────────────────
  'gerencia:1': {
    resumen: 'El resumen ejecutivo de un contrato, una resolución o un informe largo, sin perder lo que importa.',
    minutos: 15,
    contenido: `Un resumen sirve si responde lo que usted necesita decidir. Por eso, antes de pedirlo, diga para qué es: firmar, responder, aprobar, delegar.

## El método

1. Comparta el documento completo.
2. Diga para qué necesita el resumen y qué le preocupa (riesgos, plazos, plata, obligaciones).
3. Pida una estructura fija: de qué se trata en dos líneas, puntos clave, riesgos, plazos, decisiones que le tocan.
4. Pida que cite la cláusula o página de cada punto, para revisar lo importante en el original.

## Qué verificar

- Los puntos que van a mover una decisión: léalos en el original.
- Cifras, fechas y penalidades.
- Lo que el resumen no dice: pregunte "¿qué cláusulas dejaste por fuera y por qué?".

## Error típico

Firmar con base en el resumen. El resumen dice dónde mirar; la decisión se toma con el texto.`,
    prompts: [
      {
        titulo: 'Resumen ejecutivo para decidir',
        texto: 'Contexto: soy gerente de Ekosolv y tengo que [firmar / aprobar / responder] este [contrato / resolución / informe]. Me preocupa especialmente [riesgos, plazos, valores, obligaciones].\nTarea: hazme un resumen ejecutivo.\nFormato: De qué se trata (dos líneas), Puntos clave (máximo siete viñetas, cada una con la cláusula o página), Riesgos para Ekosolv, Plazos y valores, Decisiones que me tocan. Si algo no está claro en el documento, dilo.',
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para resumir un contrato que tiene que firmar esta semana.',
  },
  'gerencia:2': {
    resumen: 'Comparar proveedores o alternativas con una matriz de criterios que usted define.',
    minutos: 15,
    contenido: `La IA compara bien cuando usted pone los criterios y su peso. Si no, compara con los suyos, que no son los de Ekosolv.

## El método

1. Defina los criterios y su peso (por ejemplo: costo 30 %, experiencia 25 %, plazo 20 %, soporte 15 %, riesgo 10 %).
2. Comparta las propuestas o la descripción de cada alternativa.
3. Pida una matriz: calificación por criterio con su justificación y el puntaje ponderado.
4. Pida también qué información falta para decidir y qué le preguntaría a cada proveedor.

## Qué verificar

- Las justificaciones: que cada calificación tenga respaldo en la propuesta.
- Que no haya premiado la propuesta mejor escrita sobre la mejor oferta.

## Error típico

Preguntar "¿cuál es mejor?". La respuesta depende de criterios que la IA no conoce.`,
    prompts: [
      {
        titulo: 'Matriz de comparación ponderada',
        texto: 'Contexto: soy gerente de Ekosolv y debo elegir entre [opciones]. Criterios y pesos: [criterio 1: peso %, criterio 2: peso %, ...].\nTarea: compara las opciones con esos criterios.\nFormato: tabla con Criterio, Peso, y para cada opción su calificación de 1 a 5 con una línea de justificación. Debajo, el puntaje ponderado de cada opción. Al final: información que falta para decidir y dos preguntas para cada proveedor. Usa solo lo que dicen las propuestas.',
      },
    ],
  },
  'gerencia:3': {
    resumen: 'El guion de una reunión o una comunicación importante, con el mensaje claro desde el inicio.',
    minutos: 12,
    contenido: `Para una reunión difícil o una comunicación al equipo o a un cliente, la IA ayuda a ordenar el mensaje y a anticipar preguntas.

## El método

1. Diga el objetivo: qué quiere que pase al final de la reunión o qué debe entender quien lea.
2. Dé el contexto y los hechos.
3. Pida un guion: apertura con el mensaje principal, puntos en orden, preguntas difíciles que podrían salir con su respuesta, y cierre con el siguiente paso.
4. Para una comunicación escrita, pida dos versiones de largo distinto.

## Qué verificar

- Que el mensaje principal esté en las primeras dos frases.
- Que no prometa nada que no esté decidido.
- El tono: pídale que lo ajuste hasta que suene a usted.`,
    prompts: [
      {
        titulo: 'Guion de una reunión importante',
        texto: 'Contexto: soy gerente de Ekosolv y tengo una reunión con [quién] sobre [tema]. Objetivo: que al final [resultado esperado]. Hechos: [viñetas].\nTarea: prepárame el guion.\nFormato: Mensaje principal en dos frases, Puntos en orden, Cinco preguntas difíciles que podrían hacerme con una respuesta corta para cada una, Cierre con el siguiente paso. No prometas nada que no esté en los hechos.',
      },
    ],
  },
  'gerencia:entrega': {
    resumen: 'Un resumen y una recomendación sobre un documento real elegido por Gerencia.',
    minutos: 40,
    contenido: `Elija un documento real que tenga pendiente: un contrato, una propuesta de proveedor, una resolución o un informe.

## Qué entregar

El resumen ejecutivo y su recomendación, hechos con IA, y qué partes revisó en el original antes de concluir. Si quiere, agregue el borrador de las reglas de uso de IA para la empresa, que es parte del material de este taller.`,
    prompts: [],
  },

  // ───────────────────────── FINANZAS ─────────────────────────
  'finanzas:1': {
    resumen: 'Leer un reporte exportado de Zoho Books y contar en lenguaje sencillo qué está pasando.',
    minutos: 20,
    contenido: `Los reportes de Zoho Books (ventas, cartera por edades, gastos) traen los números; la IA ayuda a explicarlos. Las cuentas las sigue haciendo la hoja de cálculo.

## El método

1. Exporte el reporte a Excel o CSV y quite lo que no haga falta (por ejemplo, datos de contacto).
2. Diga qué pregunta quiere responder: ¿por qué bajaron las ventas?, ¿qué clientes concentran la cartera vencida?
3. Pida una explicación con los números del reporte y una tabla de lo más relevante.
4. Pida que marque cualquier cálculo que hizo, para comprobarlo.

## Qué verificar

- Toda suma, promedio o porcentaje que vaya a un informe: recalcúlelo en la hoja.
- Que no haya leído mal columnas o meses.

## Error típico

Confiar en un total calculado por la IA. Los modelos de lenguaje se equivocan con cuentas largas.`,
    prompts: [
      {
        titulo: 'Explicar un reporte de Zoho Books',
        texto: 'Contexto: trabajo en Finanzas de Ekosolv. Te comparto el reporte de [ventas / cartera por edades / gastos] de [período] exportado de Zoho Books.\nTarea: responde esta pregunta: [pregunta].\nFormato: explicación de máximo un párrafo en lenguaje sencillo, y una tabla con las cifras que la respaldan, tomadas del reporte. Marca con (calculado) cualquier cifra que hayas calculado tú.',
      },
    ],
    practica_consigna: 'Escriba la instrucción que usaría para explicar el reporte de cartera de este mes.',
  },
  'finanzas:2': {
    resumen: 'Explicar por qué cambiaron las cifras y armar un flujo de caja con los supuestos a la vista.',
    minutos: 20,
    contenido: `Explicar variaciones y proyectar flujo de caja son tareas donde la IA ayuda a ordenar y redactar, siempre que los supuestos sean explícitos.

## Variaciones

1. Dé las cifras de los dos períodos y lo que sabe de lo que pasó (un cliente grande que pagó tarde, un gasto extraordinario).
2. Pida una explicación de las tres variaciones más grandes, sin inventar causas: lo que no sepa, que lo pregunte.

## Flujo de caja

1. Defina los supuestos: recaudo esperado por cliente, gastos fijos, pagos programados.
2. Pida la estructura del flujo por semana o mes con los supuestos en una tabla aparte.
3. Lleve los números a la hoja de cálculo para que las fórmulas hagan las cuentas.

## Error típico

Pedir "proyecta el flujo de caja" sin supuestos. La IA los inventa y el resultado parece serio pero no tiene base.`,
    prompts: [
      {
        titulo: 'Explicar variaciones',
        texto: 'Contexto: trabajo en Finanzas de Ekosolv. Te pego las cifras de [mes anterior] y [mes actual] por rubro, y lo que sé de lo que pasó: [hechos].\nTarea: explica las tres variaciones más grandes.\nFormato: por cada una, el rubro, la variación en pesos y en porcentaje, y la explicación en dos líneas. No inventes causas: si no está en los hechos, escribe "causa por confirmar" y dime qué preguntar.',
      },
      {
        titulo: 'Estructura de flujo de caja con supuestos',
        texto: 'Contexto: trabajo en Finanzas de Ekosolv. Necesito proyectar el flujo de caja de los próximos [N] meses.\nTarea: propón la estructura del flujo y la tabla de supuestos con los datos que te doy: [saldo inicial, recaudos esperados, gastos fijos, pagos programados].\nFormato: primero la tabla de supuestos; luego el flujo mes a mes (ingresos, egresos, saldo). Marca cada cifra que hayas calculado para que la compruebe en Excel.',
      },
    ],
  },
  'finanzas:3': {
    resumen: 'Qué información financiera se puede usar con IA y cómo anonimizarla.',
    minutos: 12,
    contenido: `La información financiera de Ekosolv y de sus clientes es confidencial. La regla general está en la lección de la capacitación general (Ley 1581 de 2012); aquí va lo propio de Finanzas.

## No suba

- Números de cuenta, claves, tokens o accesos a bancos y a Zoho.
- Datos personales de empleados: salarios con nombre, cédulas, información de nómina.
- Información de clientes que no sea necesaria para la tarea.

## Cómo anonimizar

1. Cambie los nombres de clientes por códigos (Cliente A, Cliente B) y guarde la equivalencia en su hoja, no en la conversación.
2. Quite NIT, direcciones y contactos.
3. Si la tarea es de tendencias, use totales por rubro en vez del detalle por factura.

## Ante la duda

Pregunte antes de subir. Las reglas de uso de IA de Ekosolv definen qué herramientas y qué cuentas usar.`,
    prompts: [
      {
        titulo: 'Anonimizar una tabla antes de usarla',
        texto: 'Te pego una tabla de [cartera / ventas]. Antes de analizarla: reemplaza cada nombre de cliente por un código (Cliente A, B, C...) y elimina NIT, correos y teléfonos. Devuélveme solo la tabla anonimizada. No hagas ningún análisis todavía.',
      },
    ],
  },
  'finanzas:entrega': {
    resumen: 'Un informe mensual hecho a partir de un reporte real, con datos anonimizados si se prefiere.',
    minutos: 45,
    contenido: `Use el reporte real del último mes cerrado, anonimizado si lo prefiere.

## Qué entregar

El informe financiero mensual para Gerencia, con la explicación de las variaciones, hecho con IA a partir del reporte de Zoho Books. Cuente qué instrucción usó, qué cifras recalculó en la hoja y qué anonimizó.`,
    prompts: [],
  },
}
