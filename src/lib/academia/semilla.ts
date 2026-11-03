/**
 * Lecciones con las que arranca la academia, sacadas del programa por área
 * (src/lib/capacitacion.ts). Módulo PURO.
 *
 * - Capacitación general: lecciones completas, escritas para el primer sábado.
 * - Talleres por área: una lección por tema de "Qué aprende", con el título y
 *   sin contenido, y al final la entrega del taller con el ejercicio que pide
 *   el programa ("demuestra") y su material. Mike completa el contenido en
 *   /admin/academia antes de publicarlas.
 *
 * Todo se siembra SIN publicar: nada le llega al equipo sin que Mike lo revise.
 * `semilla` es la clave que evita sembrar dos veces la misma lección.
 */
import { GENERAL, MODULOS } from '../capacitacion.ts'

export interface Prompt {
  titulo: string
  texto: string
}

export interface Recurso {
  titulo: string
  href: string
}

export interface LeccionSemilla {
  semilla: string
  modulo: string
  orden: number
  titulo: string
  resumen: string
  contenido: string
  prompts: Prompt[]
  recursos: Recurso[]
  ejercicio: string
  entregable: string
  practica_consigna: string
  minutos: number
}

const GENERALES: Omit<LeccionSemilla, 'modulo' | 'orden' | 'semilla'>[] = [
  {
    titulo: 'Qué es la IA y cómo funciona',
    resumen: 'Lo justo para entender qué hace una herramienta como Claude cuando le escribe.',
    minutos: 10,
    contenido: `Las herramientas como Claude son **modelos de lenguaje**: programas entrenados con enormes cantidades de texto para continuar una conversación de la forma más útil posible. No buscan la respuesta en una base de datos: la redactan palabra por palabra a partir de lo que aprendieron y de lo que usted les da.

## Qué significa eso en la práctica

- Escribe muy bien y muy rápido: resúmenes, correos, borradores, tablas.
- Entiende documentos que usted le comparte: autos, resoluciones, certificados, informes.
- No "sabe" si algo es cierto: produce lo más probable. Por eso a veces se equivoca con total seguridad.
- Lo que usted le da en la conversación pesa más que lo que aprendió en general. Mientras mejor el contexto, mejor el resultado.

## La idea para llevarse

Trátela como a un asistente muy capaz que acaba de llegar a Ekosolv: rápido y con buena redacción, pero que no conoce a los clientes ni la norma vigente si usted no se la muestra, y cuyo trabajo siempre se revisa antes de enviarlo.`,
    prompts: [],
    recursos: [],
    ejercicio: '',
    entregable: '',
    practica_consigna: '',
  },
  {
    titulo: 'En qué es buena y cuándo se equivoca',
    resumen: 'Dónde ahorra horas, dónde inventa y cómo revisar lo que entrega.',
    minutos: 12,
    contenido: `## Dónde ahorra horas

- Resumir documentos largos y sacar lo importante: obligaciones, plazos, responsables.
- Pasar información de un documento a una tabla.
- Redactar primeros borradores: correos, respuestas, informes, publicaciones.
- Comparar dos versiones o dos opciones con criterios claros.
- Revisar un texto contra una lista de chequeo.

## Dónde se equivoca

- **Normas y artículos:** puede citar un número de resolución o un artículo que no existe, o uno derogado.
- **Cifras y cálculos largos:** puede sumar mal o cambiar un dato al copiarlo.
- **Hechos recientes:** no conoce lo que pasó después de su entrenamiento, salvo que se lo comparta.
- **Lo que no está en el documento:** si le falta información, a veces la rellena en vez de decir que no sabe.

## Cómo revisar

1. Toda norma que cite la IA se verifica en la fuente oficial antes de usarla.
2. Toda cifra se compara contra el documento original.
3. Pídale que diga de qué parte del documento sacó cada dato.
4. Si algo suena demasiado seguro o demasiado perfecto, revíselo dos veces.`,
    prompts: [
      {
        titulo: 'Pedir que muestre de dónde saca cada dato',
        texto: 'Para cada obligación que encuentres, indica entre paréntesis el artículo o la página del documento donde aparece. Si un dato no está en el documento, escribe "no aparece" en vez de suponerlo.',
      },
    ],
    recursos: [],
    ejercicio: '',
    entregable: '',
    practica_consigna: '',
  },
  {
    titulo: 'Cómo pedir: contexto, tarea, formato y ejemplos',
    resumen: 'El método de cuatro partes para que la IA acierte al primer o segundo intento.',
    minutos: 20,
    contenido: `Casi todos los malos resultados vienen de instrucciones cortas. "Resúmeme este auto" deja a la IA adivinando para quién es, qué importa y cómo lo quiere. Una buena instrucción tiene cuatro partes.

## 1. Contexto

Quién es usted, para quién es el resultado y qué hay que saber. Por ejemplo: "Soy consultor ambiental de Ekosolv. El cliente es una planta de producción en Funza con PMA aprobado".

## 2. Tarea

Qué quiere exactamente, con un verbo claro: extraer, resumir, comparar, redactar, revisar. Una tarea por instrucción funciona mejor que cinco mezcladas.

## 3. Formato

Cómo quiere recibirlo: una tabla con columnas definidas, un correo de máximo diez líneas, una lista numerada, un párrafo para el cliente sin términos técnicos.

## 4. Ejemplos

Si tiene un ejemplo de cómo debe quedar, péguelo. Un buen ejemplo vale más que un párrafo de explicaciones.

## Cuando el resultado no sirve

No empiece de cero: dígale qué cambiar. "Más corto", "en tono más formal", "agrega la columna de responsable", "esto no está en el documento, quítalo". Cuando una instrucción le funcione bien, guárdela para repetirla.`,
    prompts: [
      {
        titulo: 'Plantilla de cuatro partes',
        texto: 'Contexto: soy [cargo] en Ekosolv, una empresa de consultoría ambiental y gestión de residuos. [Lo que hay que saber del caso.]\nTarea: [verbo + qué necesita].\nFormato: [tabla con columnas X, Y, Z / correo de máximo N líneas / lista].\nEjemplo: [pegue un ejemplo de cómo debe quedar, si lo tiene].',
      },
      {
        titulo: 'Ejemplo: obligaciones de un auto',
        texto: 'Contexto: soy consultor ambiental de Ekosolv. Te comparto un auto de seguimiento de la autoridad ambiental a un cliente.\nTarea: extrae todas las obligaciones que impone el auto.\nFormato: una tabla con las columnas Obligación, Artículo, Plazo, Responsable. Si el plazo no aparece, escribe "sin plazo".\nAl final, en dos frases, dime cuál es la obligación más urgente y por qué.',
      },
    ],
    recursos: [],
    ejercicio: '',
    entregable: '',
    practica_consigna:
      'Escriba una instrucción para una tarea real de su puesto usando las cuatro partes: contexto, tarea, formato y, si lo tiene, un ejemplo.',
  },
  {
    titulo: 'Qué información no se sube (Ley 1581 de 2012)',
    resumen: 'Qué se puede compartir con la IA, qué no y cómo anonimizar un documento.',
    minutos: 12,
    contenido: `En Colombia, la Ley 1581 de 2012 protege los datos personales. Compartir con una herramienta externa los datos de clientes o de personas sin cuidado puede ser un problema legal y de confianza para Ekosolv.

## No suba

- Números de cédula, teléfonos personales, direcciones y correos de personas.
- Datos sensibles: salud, afiliación sindical, origen étnico, datos biométricos, entre otros.
- Información confidencial de un cliente que no sea necesaria para la tarea.
- Contraseñas, claves de acceso o datos bancarios.

## Cómo anonimizar

1. Cambie nombres de personas por su rol: "el representante legal", "la coordinadora ambiental".
2. Cambie el nombre del cliente por algo genérico si no hace falta: "una planta en Cundinamarca".
3. Borre cédulas, teléfonos y correos antes de pegar el texto.
4. Comparta solo la parte del documento que necesita la tarea.

## Ante la duda

Pregunte antes de subir. Las reglas de uso de IA de Ekosolv definen qué herramientas y qué cuentas usar.`,
    prompts: [],
    recursos: [],
    ejercicio: '',
    entregable: '',
    practica_consigna: '',
  },
  {
    titulo: 'Entrega: una tarea real de su puesto',
    resumen: GENERAL.demuestra,
    minutos: 30,
    contenido: `Llegó el momento de aplicarlo a su trabajo. Elija una tarea que haga cada semana y que le quite tiempo, y resuélvala con IA usando el método de las cuatro partes.

Antes de entregar, revise el resultado como si lo hubiera hecho otra persona: cifras, normas, nombres y tono. Si tuvo que corregir algo, cuéntelo: es parte de lo que se aprende.`,
    prompts: [],
    recursos: GENERAL.material.map((m) => ({ titulo: m.titulo, href: m.href ?? '' })),
    ejercicio: 'Resuelva con IA una tarea real de su puesto y revise el resultado antes de entregarlo.',
    entregable:
      'Pegue la instrucción que usó, un resumen del resultado (sin datos personales) y qué tuvo que corregir o verificar. Si el resultado está en un documento, comparta el enlace.',
    practica_consigna: 'Escriba la instrucción que va a usar para resolver la tarea de su puesto, antes de llevarla a Claude.',
  },
]

/** Quita el punto final y recorta para usar un tema del programa como título. */
const comoTitulo = (s: string) => s.replace(/\.$/, '').slice(0, 140)

export function leccionesSemilla(): LeccionSemilla[] {
  const lista: LeccionSemilla[] = GENERALES.map((l, i) => ({ ...l, modulo: 'general', orden: i + 1, semilla: `general:${i + 1}` }))
  for (const m of MODULOS) {
    m.aprende.forEach((tema, i) => {
      lista.push({
        semilla: `${m.id}:tema:${i + 1}`,
        modulo: m.id,
        orden: i + 1,
        titulo: comoTitulo(tema),
        resumen: '',
        contenido: '',
        prompts: [],
        recursos: [],
        ejercicio: '',
        entregable: '',
        practica_consigna: '',
        minutos: 15,
      })
    })
    lista.push({
      semilla: `${m.id}:entrega`,
      modulo: m.id,
      orden: m.aprende.length + 1,
      titulo: `Entrega del taller de ${m.titulo}`,
      resumen: m.demuestra,
      contenido: '',
      prompts: [],
      recursos: m.material.map((x) => ({ titulo: x.titulo, href: x.href ?? '' })),
      ejercicio: m.demuestra,
      entregable: 'Comparta el enlace al resultado (Drive o WorkDrive) y explique en pocas líneas la instrucción que usó y qué verificó.',
      practica_consigna: `Escriba la instrucción que usaría para lograr esto: ${m.demuestra}`,
      minutos: 45,
    })
  }
  return lista
}
