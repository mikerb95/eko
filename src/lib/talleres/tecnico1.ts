/**
 * Aspectos técnicos de IA de cada escena de la capacitación 1 (Mike,
 * 2026-11-21): viñetas cortas que salen en la vista de presentador encima de
 * las notas, para saber qué concepto se explica en cada slide. Módulo PURO.
 *
 * Las escenas que comparten tema (verdad e inventa; semáforo y anonimizar)
 * llevan la misma tarjeta.
 */
import type { Escena, PuntoTecnico } from './tipos.ts'

const ALUCINACION: PuntoTecnico[] = [
  { termino: 'Alucinación', texto: 'salida plausible pero falsa. Consecuencia directa de predecir lo probable.' },
  { texto: 'Cuando no "sabe" un dato, ninguna opción destaca, pero igual elige una y sigue con el mismo tono.' },
  { texto: 'No tiene calibración confiable: no avisa cuándo no sabe.' },
  { texto: 'Inventa más en números de normas, artículos, fechas, cifras, nombres y hechos recientes.' },
  { texto: 'Inventa menos cuando el dato está en el contexto (documento adjunto).' },
  { termino: 'Complacencia (sycophancy)', texto: 'si se le cuestiona, puede cambiar una respuesta correcta por complacer.' },
]

const CUENTA: PuntoTecnico[] = [
  { texto: 'Plan Team (empresa): Anthropic no entrena con las conversaciones y firma acuerdo de tratamiento de datos.' },
  { texto: 'Cuentas personales: términos de consumidor; el uso para entrenamiento depende de la configuración.' },
  { texto: 'Los servidores están fuera de Colombia: pegar datos es transferirlos al exterior.' },
  { texto: 'Calificar con pulgar arriba o abajo puede enviar la conversación al proveedor como retroalimentación.' },
  { texto: 'Credenciales y contraseñas, nunca, en ningún modelo.' },
]

export const TECNICO_TALLER1: Record<string, PuntoTecnico[]> = {
  reglas: [
    { termino: 'Software programado', texto: 'reglas escritas por alguien. Predecible, no inventa, solo cubre lo previsto.' },
    { termino: 'Modelo entrenado (machine learning)', texto: 'aprende patrones de ejemplos y generaliza a casos nuevos.' },
    { texto: 'Generalizar implica que puede acertar en lo imprevisto y fallar en lo obvio: no hay regla que lo garantice.' },
  ],
  perillas: [
    { termino: 'Parámetros (pesos)', texto: 'miles de millones de números que definen el modelo. Al inicio, aleatorios.' },
    { termino: 'Entrenamiento', texto: 'predice la palabra tapada, se mide el error (función de pérdida) y cada parámetro se ajusta un poco (descenso de gradiente). Se repite sobre billones de palabras.' },
    { texto: 'El conocimiento queda repartido en los pesos: no hay un lugar donde "esté" un dato.' },
    { texto: 'Después del entrenamiento los pesos quedan fijos: la conversación no los cambia.' },
    { texto: 'El número de parámetros de Claude no es público.' },
  ],
  tokens: [
    { termino: 'Token', texto: 'fragmento de texto (palabra, parte de palabra, cifras). El modelo trabaja con tokens, no con letras.' },
    { texto: 'Palabras comunes van enteras; nombres propios y números se parten en varios.' },
    { texto: 'Español consume más tokens que inglés. Una página ronda 700 a 1.000 tokens.' },
    { texto: 'Capacidad de lectura y límite de uso se miden en tokens: un Excel de cifras gasta mucho más que texto.' },
  ],
  siguiente: [
    { termino: 'Modelo autorregresivo', texto: 'calcula una probabilidad para cada token posible, elige uno, lo agrega y repite.' },
    { texto: 'No hay paso de verificación: produce lo probable, no lo comprobado.' },
    { termino: 'Temperatura', texto: 'cuánto azar al elegir. Baja, respuestas parecidas; alta, más variadas.' },
    { texto: 'En claude.ai no hay control de temperatura: se orienta con la instrucción.' },
    { texto: 'Misma pregunta, redacción distinta es normal; si cambia un dato, está adivinando.' },
  ],
  mapa: [
    { termino: 'Embeddings', texto: 'cada token se representa como un vector, un punto en un espacio de miles de dimensiones.' },
    { texto: 'Palabras que aparecen en contextos parecidos quedan cerca: así "entiende" sinónimos y relaciones.' },
    { texto: 'Riesgo: términos vecinos que en la norma son distintos (aprovechamiento y disposición final) se pueden confundir.' },
  ],
  etapas: [
    { termino: 'Preentrenamiento', texto: 'predice texto masivo (libros, web pública, código). Aprende idioma y datos, incluidos errores y normas derogadas.' },
    { termino: 'Ajuste fino y RLHF', texto: 'personas escriben y califican respuestas; aprende a seguir instrucciones y a negarse a lo dañino. Anthropic además usa principios escritos para guiarlo.' },
    { texto: 'El tono seguro viene del ajuste, no de tener razón.' },
    { termino: 'Fecha de corte', texto: 'no sabe nada posterior al entrenamiento salvo que se le dé o use búsqueda web.' },
  ],
  contexto: [
    { termino: 'Ventana de contexto', texto: 'todo lo que el modelo considera a la vez: mensajes, adjuntos y sus propias respuestas. Se mide en tokens (cientos de páginas en Claude).' },
    { texto: 'Lo que no está en el contexto no existe para el modelo. Conversación nueva, contexto vacío.' },
    { texto: 'En contextos muy largos se atiende peor lo que queda en la mitad.' },
    { termino: 'Proyectos', texto: 'documentos e instrucciones fijos disponibles en cada conversación del proyecto.' },
    { termino: 'Memoria', texto: 'función opcional; no reemplaza dejar lo importante en el proyecto.' },
  ],
  ecosistema: [
    { termino: 'Modelo', texto: 'Claude, en versiones Opus (más capaz), Sonnet y Haiku (más rápido).' },
    { termino: 'Aplicación', texto: 'claude.ai, Claude Desktop, app del celular. Mismo modelo, misma cuenta.' },
    { termino: 'Herramientas', texto: 'leer PDF e imágenes, búsqueda web, conectores a otros sistemas.' },
    { termino: 'Agente', texto: 'el modelo encadena pasos y usa herramientas solo hacia un objetivo.' },
  ],
  comp: [
    { texto: 'Token = fragmento de texto. Respuestas distintas = muestreo con temperatura.' },
  ],
  areas: [
    { texto: 'Cuatro tipos de tarea donde rinde: resumir textos largos, extraer a tablas, primer borrador, revisar contra una lista.' },
    { texto: 'Cálculos exactos y datos de sistema siguen en el software (Zoho, Siigo).' },
  ],
  verdad: ALUCINACION,
  inventa: ALUCINACION,
  verificar: [
    { texto: 'Pedir la fuente de cada dato (artículo o página) obliga a anclarse al contexto y hace la revisión rápida.' },
    { texto: 'Búsqueda web reduce errores sobre lo reciente, pero puede leer mal una fuente: se abre el enlace.' },
  ],
  metodo: [
    { texto: 'La instrucción es contexto: define qué es "lo más probable" para el modelo.' },
    { termino: 'Contexto', texto: 'rol y destinatario cambian qué considera relevante.' },
    { termino: 'Tarea', texto: 'verbo concreto, menos ambigüedad.' },
    { termino: 'Formato', texto: 'estructura de salida y una salida explícita para datos faltantes ("no aparece"), lo que más reduce alucinación.' },
    { termino: 'Ejemplo (few-shot)', texto: 'mostrar la salida esperada; el modelo imita el patrón.' },
  ],
  constructor: [
    { texto: 'Mismo modelo y documento; solo cambia el contexto que recibe.' },
    { texto: 'La celda "no aparece" demuestra que no completó el dato faltante.' },
    { texto: 'Si la API falla, se muestra la respuesta guardada.' },
  ],
  iterar: [
    { texto: 'Toda la conversación sigue en el contexto: corregir por partes es eficiente.' },
    { texto: 'Fechas, días hábiles y festivos: cálculo donde falla; se verifica.' },
    { texto: 'Conversación muy larga o enredada: abrir una nueva con la instrucción corregida.' },
  ],
  semaforo: CUENTA,
  anonimizar: CUENTA,
  zoho: [
    { termino: 'MCP (Model Context Protocol)', texto: 'estándar abierto de Anthropic para conectar modelos con herramientas externas.' },
    { termino: 'Conector', texto: 'servidor MCP ya armado. El de Zoho CRM es de Zoho, verificado, 41 herramientas (21 de lectura, 19 de escritura y borrado).' },
    { termino: 'OAuth', texto: 'la contraseña va en Zoho; Claude recibe un token limitado a lo que ve ese usuario y revocable.' },
    { termino: 'Permisos por herramienta', texto: 'Always allow, Needs approval, Always ask, Blocked. Escritura en Always ask, lectura en Needs approval.' },
    { termino: 'Modo Auto contra Manual', texto: 'en Auto, Claude actúa sin preguntar aunque diga Needs approval; Always ask pregunta siempre.' },
    { termino: 'Claude in Chrome', texto: 'agente que opera una pestaña (captura, decide, hace clic). Solo Google Chrome. No usa los permisos del conector: el límite es la instrucción.' },
    { texto: 'Conector para sistemas que lo tienen; navegador para lo demás.' },
  ],
}

/** Pega a cada escena sus puntos técnicos. */
export function conTecnico(mapa: Record<string, PuntoTecnico[]>, escenas: Escena[]): Escena[] {
  return escenas.map((e) => (mapa[e.id] ? { ...e, tecnico: mapa[e.id] } : e))
}
