/**
 * Retos de la práctica de la capacitación 2 (Mike, 2026-11-25). Cada persona
 * trae un caso real de su trabajo y lo resuelve en su PC, a su ritmo, reto
 * por reto, mientras quien dicta acompaña 15 minutos a cada uno (turnos en
 * src/lib/talleres/turnos.ts). El celular muestra los pasos, la petición de
 * ejemplo de su área y el botón para marcar el reto como hecho.
 *
 * Las skills de cada área se descargan de /academia/skills/<id>.zip (fuente
 * en docs/skills/<id>/SKILL.md). Módulo PURO.
 */
import type { Reto } from './tipos.ts'

/** Skill que se instala en el reto 2, por área: id del archivo y nombre visible. */
export const SKILL_AREA: Record<string, { id: string; nombre: string; para: string }> = {
  operaciones: { id: 'revision-autos-ekosolv', nombre: 'Revisión de autos', para: 'Saca de un auto cada obligación con su artículo, plazo, responsable y acción sugerida.' },
  logistica: { id: 'cruce-certificados-ekosolv', nombre: 'Cruce de certificados', para: 'Compara el certificado del gestor con la recolección y señala lo que no cuadra.' },
  ventas: { id: 'propuesta-desde-brief-ekosolv', nombre: 'Propuesta desde el Brief', para: 'Convierte un Brief de Zoho en el borrador de propuesta con la estructura de Ekosolv.' },
  mercadeo: { id: 'tono-ekosolv', nombre: 'Tono Ekosolv', para: 'Escribe piezas con la voz de la marca y sin inventar cifras.' },
  gerencia: { id: 'seguimiento-propuestas-ekosolv', nombre: 'Seguimiento de propuestas', para: 'Ordena las propuestas sin respuesta y redacta el correo para retomar cada una.' },
  finanzas: { id: 'comparativo-balances-ekosolv', nombre: 'Comparativo de balances', para: 'Compara dos periodos y explica las variaciones que pasan del umbral.' },
}

export const rutaSkill = (area: string) => (SKILL_AREA[area] ? `/academia/skills/${SKILL_AREA[area]!.id}.zip` : '')

export const RETOS_TALLER2: Reto[] = [
  {
    id: 'modelo',
    concepto: 'Modelo',
    titulo: 'Elija el modelo para su caso',
    meta: 'Saber cuándo basta Haiku y cuándo vale la pena esperar a Sonnet u Opus.',
    pasos: [
      'Abra Claude con la cuenta de Ekosolv (Claude Desktop o claude.ai en Chrome).',
      'Escriba la petición de su caso con las cuatro partes: contexto, tarea, formato y, si lo tiene, un ejemplo.',
      'Envíela con Haiku. Después, en una conversación nueva, envíe la misma con Sonnet (u Opus si su caso es un análisis largo).',
      'Compare: cuál tardó más, cuál le sirvió y cuál usaría la próxima vez para esta misma tarea.',
    ],
    peticion: {
      operaciones: 'Soy consultor de Ekosolv. Adjunto un auto de seguimiento de la CAR. Extrae cada obligación en una tabla: Obligación, Artículo, Plazo, Responsable. Si un dato no aparece, escribe "no aparece".',
      logistica: 'Soy de Logística en Ekosolv. Te pego cinco correos de clientes. Clasifica cada uno en: recolección, certificado, cotización u otro, y saca cliente, residuo y fecha en una tabla.',
      ventas: 'Soy comercial de Ekosolv. Te pego el Brief de un cliente nuevo. Escribe el borrador de la sección "Alcance del servicio" de la propuesta, en máximo 12 líneas, sin precios.',
      mercadeo: 'Soy de Mercadeo en Ekosolv. Propón cinco temas para publicaciones de LinkedIn sobre gestión de RAEE este mes, cada uno con un título y una idea de dos líneas. No inventes cifras.',
      gerencia: 'Soy gerente de Ekosolv. Te pego la lista de propuestas enviadas el último mes con su estado. Dime cuáles llevan más de 10 días sin respuesta y en qué orden las retomaría, con una razón corta para cada una.',
      finanzas: 'Soy de Finanzas en Ekosolv. Adjunto el balance de dos periodos exportado de Siigo. Lista las cinco cuentas con la mayor variación y propón una pregunta para revisar cada una. No calcules impuestos.',
    },
  },
  {
    id: 'usar-skill',
    concepto: 'Skill',
    titulo: 'Instale y use la skill de su área',
    meta: 'Ver cómo Claude trabaja con el procedimiento de Ekosolv sin que usted se lo explique cada vez.',
    pasos: [
      'Descargue el archivo .zip de la skill de su área con el botón de abajo (en su PC: el mismo enlace).',
      'En Claude abra Personalizar (Customize) o Configuración > Capacidades, busque Skills y suba el .zip.',
      'Revise que la skill quedó activa (interruptor encendido).',
      'Abra una conversación nueva y pida la tarea con su caso, sin explicar el formato: la skill ya lo sabe.',
      'Revise si siguió las reglas de la skill (formato, "no aparece", fuente de cada dato).',
    ],
    peticion: {
      operaciones: 'Revisa este auto. (Adjunte el PDF del auto de su caso.)',
      logistica: 'Cruza este certificado del gestor con la recolección. (Adjunte el certificado y la planilla.)',
      ventas: 'Arma la propuesta a partir de este Brief. (Pegue el Brief de Zoho.)',
      mercadeo: 'Escribe la publicación de LinkedIn sobre este tema: (escriba el tema).',
      gerencia: 'Haz el seguimiento de estas propuestas. (Pegue o exporte la lista de propuestas enviadas.)',
      finanzas: 'Compara estos dos balances. Umbral: 15 %. (Adjunte los dos periodos.)',
    },
    planB: 'Si no le aparece la opción de Skills, avísele a quien dicta: puede que haya que activarla en la administración del plan de Ekosolv. Mientras tanto, abra el SKILL.md, cópielo y péguelo al inicio de la conversación.',
  },
  {
    id: 'crear-skill',
    concepto: 'Skill propia',
    titulo: 'Cree una skill para una tarea suya',
    meta: 'Convertir en skill algo que usted repite cada semana con los mismos pasos.',
    pasos: [
      'Elija una tarea que repita cada semana y que siempre haga de la misma forma.',
      'Escríbale a Claude la petición de abajo, cambiando lo que va entre corchetes. Claude trae su propia skill para crear skills y le hará preguntas.',
      'Respóndale con detalle: cómo lo hace usted, qué revisa, cómo debe quedar y qué nunca debe pasar.',
      'Pídale el archivo de la skill, descárguelo y súbalo como en el reto 2.',
      'Pruébela con su caso en una conversación nueva. Si algo no sale, dígale a Claude qué cambiar y vuelva a subirla.',
    ],
    peticion: {
      operaciones: 'Ayúdame a crear una skill para [revisar las vigencias de los permisos de un cliente]. Hazme las preguntas que necesites, una por una.',
      logistica: 'Ayúdame a crear una skill para [redactar el recordatorio a los gestores que no han mandado soportes]. Hazme las preguntas que necesites, una por una.',
      ventas: 'Ayúdame a crear una skill para [responder las preguntas frecuentes de un prospecto sobre RAEE]. Hazme las preguntas que necesites, una por una.',
      mercadeo: 'Ayúdame a crear una skill para [convertir una noticia de sostenibilidad en el texto de una pieza para Canva]. Hazme las preguntas que necesites, una por una.',
      gerencia: 'Ayúdame a crear una skill para [armar el resumen semanal del embudo comercial]. Hazme las preguntas que necesites, una por una.',
      finanzas: 'Ayúdame a crear una skill para [estructurar la respuesta a un requerimiento de la DIAN]. Hazme las preguntas que necesites, una por una.',
    },
    planB: 'Si no puede subir skills, guarde lo que Claude le dio en un proyecto de Claude como instrucciones del proyecto: funciona parecido para esa tarea.',
  },
  {
    id: 'conector',
    concepto: 'Conector',
    titulo: 'Junte la skill con los datos de Zoho',
    meta: 'Que Claude trabaje con datos reales de Zoho y con el procedimiento de Ekosolv al mismo tiempo.',
    pasos: [
      'Revise que el conector de Zoho CRM siga conectado (lo dejamos listo en la capacitación 1).',
      'En una conversación nueva, pida algo que necesite datos de Zoho y su skill a la vez (ejemplo abajo).',
      'Cuando Claude pida permiso para leer en Zoho, lea qué va a consultar y apruebe con "Allow once".',
      'Compare lo que respondió con lo que ve en Zoho: los datos deben ser los mismos.',
    ],
    peticion: {
      operaciones: 'Busca en Zoho CRM el cliente [nombre] y su línea de servicio, y con la skill de revisión de autos dime qué obligaciones del auto adjunto le tocan a Ekosolv.',
      logistica: 'Busca en Zoho CRM las solicitudes de recolección de esta semana y dime cuáles todavía no tienen certificado.',
      ventas: 'Busca en Zoho CRM el Brief más reciente del prospecto [nombre] y arma el borrador de propuesta con la skill.',
      mercadeo: 'Busca en Zoho CRM los tres sectores con más clientes nuevos este año y propón una publicación para cada uno con la skill de tono.',
      gerencia: 'Busca en Zoho CRM las Quotes enviadas hace más de 10 días sin respuesta y aplica la skill de seguimiento.',
      finanzas: 'Busca en Zoho CRM los tratos cerrados del último trimestre y compáralos con el balance adjunto: ¿cuadran las ventas?',
    },
    planB: 'Si no tiene usuario de Zoho o el conector no está, exporte la vista de Zoho a Excel y adjúntela: el reto sale igual, solo que con un archivo en vez de la conexión.',
  },
  {
    id: 'tarea',
    concepto: 'Tarea programada',
    titulo: 'Deje una tarea programada',
    meta: 'Que Claude haga solo, cada semana, algo que hoy usted hace a mano.',
    pasos: [
      'Abra Cowork en Claude Desktop (o en la web) con la cuenta de Ekosolv.',
      'Escriba /schedule o entre a Programadas (Scheduled) en el menú lateral.',
      'Escriba la instrucción completa, como si fuera para alguien que no estuvo en la conversación: qué revisar, dónde y qué entregar.',
      'Elija cada cuánto y a qué hora (por ejemplo, lunes 7:00 a. m.).',
      'Ejecútela una vez ahora para probarla y revise el resultado.',
    ],
    peticion: {
      operaciones: 'Cada lunes a las 7:00 a. m.: busca en la web resoluciones nuevas de la ANLA y del Ministerio de Ambiente sobre RAEE y RESPEL de la última semana. Dame una lista con número, fecha, de qué trata y el enlace oficial. Si no hay nada nuevo, dilo.',
      logistica: 'Cada día a las 4:00 p. m.: revisa en Zoho CRM las solicitudes de recolección creadas hoy y dame una tabla con cliente, residuo, cantidad y fecha propuesta. Marca las que no tienen dirección.',
      ventas: 'Cada lunes a las 8:00 a. m.: revisa en Zoho CRM los prospectos sin actividad en 14 días y redacta un correo corto para cada uno. No los envíes: déjamelos como borrador en la respuesta.',
      mercadeo: 'Cada viernes a las 9:00 a. m.: busca las tres noticias de sostenibilidad y economía circular en Colombia más relevantes de la semana, con su fuente, y propón una pieza para cada una.',
      gerencia: 'Cada lunes a las 7:00 a. m.: revisa en Zoho CRM las Quotes enviadas hace más de 7 días sin respuesta. Dame la lista ordenada por valor y un correo de seguimiento para cada una.',
      finanzas: 'Cada día 5 del mes a las 8:00 a. m.: recuérdame qué obligaciones tributarias vencen este mes según el calendario de la DIAN y verifica las fechas en la página oficial.',
    },
    planB: 'Si no tiene Cowork, haga la versión de Zoho: en Zoho CRM, Configuración > Automatización > Reglas de flujo de trabajo, cree un aviso por correo cuando una Quote pase 7 días en "Enviada". Es otro tipo de automatización: reacciona a un evento, sin IA.',
  },
]

/** Cuántos minutos acompaña quien dicta a cada persona (Mike, 2026-11-25). */
export const MINUTOS_TURNO = 15
