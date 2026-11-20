/**
 * Forma de una capacitación presentada desde el sitio (/academia/taller/<n>).
 * Módulo PURO: solo tipos. El contenido de cada capacitación vive en su archivo
 * (taller1.ts, ...) y el registro en index.ts.
 *
 * Una capacitación es una secuencia de escenas agrupadas en bloques. Cada
 * escena tiene `pasos`: cada clic del presentador revela el siguiente paso
 * dentro de la misma escena (no cambia de diapositiva) y, cuando ya no quedan
 * pasos, pasa a la escena siguiente.
 */

export interface Bloque {
  id: string
  titulo: string
  minutos: number
}

export interface Opcion {
  id: string
  texto: string
}

export interface Pregunta {
  id: string
  enunciado: string
  opciones: Opcion[]
  /** Opción correcta. Las votaciones de opinión no la llevan. */
  correcta?: string
  /** Lo que se explica al revelar la respuesta. */
  explicacion?: string
}

/**
 * Lo que el equipo responde desde el celular mientras la escena está activa.
 * `voto`: una o varias preguntas con resultados en vivo en el proyector.
 * `evaluacion`: las preguntas de entrada o de salida (se comparan al cierre).
 */
export interface Interaccion {
  id: string
  tipo: 'voto' | 'evaluacion'
  titulo: string
  preguntas: Pregunta[]
}

/** Una versión de la instrucción en la demo en vivo con Claude. */
export interface VersionDemo {
  id: string
  /** Qué parte del método agrega esta versión (contexto, formato...). */
  parte: string
  /** Instrucción completa que se le envía a Claude. */
  instruccion: string
  /** Fragmento nuevo respecto a la versión anterior (se resalta en pantalla). */
  agregado: string
  /** Respuesta guardada: se muestra si la IA no responde o fuera de la sesión. */
  respaldo: string
}

export interface Demo {
  id: string
  documentoTitulo: string
  documento: string
  /** true mientras el documento sea de ejemplo y no uno real de Ekosolv. */
  provisional: boolean
  versiones: VersionDemo[]
}

export type TipoEscena =
  | 'portada'
  | 'sala'
  | 'evaluacion'
  | 'diagnostico'
  | 'reglas'
  | 'perillas'
  | 'tokens'
  | 'siguiente'
  | 'mapa'
  | 'etapas'
  | 'contexto'
  | 'ecosistema'
  | 'voto'
  | 'areas'
  | 'verdad'
  | 'inventa'
  | 'verificar'
  | 'descanso'
  | 'metodo'
  | 'constructor'
  | 'iterar'
  | 'practica'
  | 'semaforo'
  | 'anonimizar'
  | 'comparacion'
  | 'sigue'
  | 'cierre'
  | 'repaso'

/** Cómo se ve la idea de una escena en el trabajo de un área (celular). */
export interface EjemploArea {
  titulo: string
  texto: string
}

/** Lo que ve el celular en una escena sin votación: la idea y su ejemplo por área. */
export interface GuiaCelular {
  /** Lo que se explica en pantalla, en palabras sencillas (igual para todos). */
  idea: string
  /** id de área → ejemplo de esa idea en su trabajo. */
  areas?: Record<string, EjemploArea>
}

export interface Escena {
  id: string
  bloque: string
  tipo: TipoEscena
  kicker: string
  titulo: string
  /** Minutos planeados: alimentan el cronómetro de la vista de presentador. */
  minutos: number
  /** Clics dentro de la escena antes de pasar a la siguiente (0 = ninguno). */
  pasos: number
  /**
   * Notas de la vista de presentador. Si la escena tiene pasos, hay una nota
   * por paso más la de llegada (pasos + 1): la del paso actual se resalta.
   * Son contenido de fondo para quien dicta (qué explicar, datos, ejemplos y
   * errores comunes), no instrucciones de clic.
   */
  notas: string[]
  /** Preguntas que probablemente hará la sala, con su respuesta (solo presentador). */
  siPreguntan?: { p: string; r: string }[]
  /** Interacción que se abre en los celulares mientras la escena está activa. */
  interaccion?: string
  demo?: string
  /** Contenido de ejemplo que se reemplaza por material real de Ekosolv. */
  provisional?: boolean
  /** Datos propios del tipo de escena (los lee su componente). */
  datos?: Record<string, any>
}

export interface Taller {
  n: number
  titulo: string
  subtitulo: string
  /** Módulos de la academia que asisten (para marcar la asistencia del día). */
  modulos: string[]
  minutosTotales: number
  bloques: Bloque[]
  escenas: Escena[]
  interacciones: Interaccion[]
  demos: Demo[]
  /** Interacciones de entrada y salida que se comparan al cierre. */
  evaluacion?: { pre: string; post: string }
  /** Preguntas de una capacitación anterior para repasar al empezar. */
  repaso?: { taller: number; interaccion: string; preguntas: string[] }
  /** Celular por escena (id de escena → idea y ejemplos por área). */
  celular?: Record<string, GuiaCelular>
  /** Tarjeta resumen descargable. */
  resumen: {
    ideas: { titulo: string; texto: string }[]
    instrucciones: { titulo: string; texto: string }[]
  }
}
