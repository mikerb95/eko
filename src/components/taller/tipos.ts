// Contexto que la página de la presentación pasa a cada escena. PURO.
export interface Diagnostico {
  total: number
  horasMes: number
  sinUsoIA: number
  tareas: { etiqueta: string; n: number }[]
}

export interface Contexto {
  admin: boolean
  qrSala: string
  qrAcademia: string
  qrResumen: string
  urlSala: string
  urlAcademia: string
  urlResumen: string
  diag: Diagnostico | null
}

/** Color de bloque para el punto del kicker. */
export const COLOR_BLOQUE: Record<string, string> = {
  apertura: '#00AA9F',
  dentro: '#124E7D',
  alcances: '#B8926F',
  descanso: '#6B7580',
  pedir: '#179C91',
  practica: '#179C91',
  seguridad: '#B4442F',
  cierre: '#00AA9F',
}

export const TIPOS_OSCUROS = new Set(['portada', 'descanso', 'cierre'])
