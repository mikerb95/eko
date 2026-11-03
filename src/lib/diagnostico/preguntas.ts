/**
 * Cuestionario del diagnóstico de IA por área (capacitación de Ekosolv).
 *
 * Fuente única: de aquí salen los pasos de la encuesta (/ia), la
 * validación del endpoint y las etiquetas del resumen en /admin/diagnostico.
 * Si cambia una opción, cambia en los tres lugares a la vez.
 *
 * Módulo PURO: solo constantes y tipos, sin imports, para que lo carguen igual
 * la página, la API y las pruebas.
 *
 * El programa de capacitación promete "una encuesta virtual de 15 minutos por
 * persona: tareas que repite, tiempo que le dedica y uso actual de IA". Las
 * preguntas responden a eso y a lo que necesita el cronograma: qué área tiene
 * más tiempo por ganar (orden de los talleres), qué documento real se usa en
 * cada ejercicio y qué sábados no puede cada persona.
 */

export interface Opcion {
  id: string
  etiqueta: string
  hint?: string
}

export const AREAS = [
  { id: 'operaciones', etiqueta: 'Operaciones', hint: 'Consultoría ambiental y revisión técnica' },
  { id: 'logistica', etiqueta: 'Logística', hint: 'Recolecciones, gestores y certificados' },
  { id: 'ventas', etiqueta: 'Ventas', hint: 'Briefs, propuestas y seguimiento comercial' },
  { id: 'mercadeo', etiqueta: 'Mercadeo / Redes', hint: 'Contenido, redes y blog' },
  { id: 'gerencia', etiqueta: 'Gerencia General', hint: 'Dirección, decisiones y comunicaciones' },
  { id: 'finanzas', etiqueta: 'Finanzas', hint: 'Zoho Books, cartera, flujo de caja e informes' },
] as const satisfies readonly Opcion[]

export type AreaId = (typeof AREAS)[number]['id']
export const AREA_IDS = AREAS.map((a) => a.id) as AreaId[]

/**
 * Tareas típicas de cada área, alineadas con los talleres del programa. La
 * persona marca las que hace al menos una vez por semana; el resumen cuenta
 * cuántas personas del área marcaron cada una.
 */
export const TAREAS: Record<AreaId, Opcion[]> = {
  operaciones: [
    { id: 'autos', etiqueta: 'Leer autos, resoluciones y requerimientos' },
    { id: 'obligaciones', etiqueta: 'Sacar obligaciones, plazos y responsables de un acto' },
    { id: 'vencimientos', etiqueta: 'Llevar el calendario de vencimientos de clientes' },
    { id: 'normativa', etiqueta: 'Buscar y verificar la norma que aplica' },
    { id: 'ica', etiqueta: 'Revisar o preparar ICA' },
    { id: 'pma_eia', etiqueta: 'Revisar PMA, EIA, permisos o procesos' },
    { id: 'laboratorio', etiqueta: 'Comparar resultados de laboratorio con los límites' },
    { id: 'certificados', etiqueta: 'Cruzar certificados de recolección y de disposición final' },
    { id: 'informes', etiqueta: 'Redactar informes técnicos' },
    { id: 'respuestas', etiqueta: 'Redactar respuestas a la autoridad' },
  ],
  // Logística: coordina las recolecciones, lleva las cifras en Zoho, pide a los
  // gestores el certificado de disposición final y, con base en él, emite el
  // certificado propio de Ekosolv para el cliente (además del de recolección).
  logistica: [
    { id: 'programar', etiqueta: 'Programar recolecciones con los clientes' },
    { id: 'rutas', etiqueta: 'Coordinar transporte y rutas' },
    { id: 'cifras_zoho', etiqueta: 'Registrar y actualizar cifras (kilos, toneladas) en Zoho' },
    { id: 'pedir_certificados', etiqueta: 'Pedir a los gestores los certificados de disposición final' },
    { id: 'seguimiento_gestores', etiqueta: 'Hacer seguimiento a gestores que no han enviado el certificado' },
    { id: 'cert_recoleccion', etiqueta: 'Emitir el certificado de recolección de Ekosolv' },
    { id: 'cert_disposicion', etiqueta: 'Emitir el certificado de disposición final de Ekosolv para el cliente' },
    { id: 'cruzar_cifras', etiqueta: 'Cruzar lo recolectado con lo que certifica el gestor' },
    { id: 'clientes_estado', etiqueta: 'Responder a clientes por el estado de su recolección o certificado' },
    { id: 'consolidar', etiqueta: 'Consolidar toneladas para reportes' },
  ],
  ventas: [
    { id: 'brief', etiqueta: 'Pasar un Brief de Zoho CRM a propuesta' },
    { id: 'cotizar', etiqueta: 'Armar cotizaciones o estimaciones en Zoho' },
    { id: 'prospectos', etiqueta: 'Investigar un prospecto antes de reunirse' },
    { id: 'seguimiento', etiqueta: 'Escribir correos de seguimiento' },
    { id: 'objeciones', etiqueta: 'Responder objeciones o dudas de clientes' },
    { id: 'presentaciones', etiqueta: 'Preparar presentaciones comerciales' },
    { id: 'crm', etiqueta: 'Actualizar registros en el CRM' },
  ],
  mercadeo: [
    { id: 'publicaciones', etiqueta: 'Redactar publicaciones para LinkedIn o Instagram' },
    { id: 'calendario', etiqueta: 'Planear el calendario editorial' },
    { id: 'blog', etiqueta: 'Escribir artículos para el blog' },
    { id: 'piezas', etiqueta: 'Diseñar piezas gráficas' },
    { id: 'boletines', etiqueta: 'Preparar boletines o correos masivos' },
    { id: 'metricas', etiqueta: 'Revisar métricas y armar reportes de redes' },
  ],
  gerencia: [
    { id: 'documentos_largos', etiqueta: 'Leer contratos, resoluciones o informes largos' },
    { id: 'revisar_equipo', etiqueta: 'Revisar propuestas y entregables del equipo' },
    { id: 'comparar', etiqueta: 'Comparar propuestas de proveedores o alternativas' },
    { id: 'reuniones', etiqueta: 'Preparar reuniones y actas' },
    { id: 'comunicaciones', etiqueta: 'Escribir comunicaciones al equipo o a clientes' },
    { id: 'indicadores', etiqueta: 'Hacer seguimiento a indicadores del negocio' },
  ],
  finanzas: [
    { id: 'reportes_books', etiqueta: 'Sacar y analizar reportes de Zoho Books' },
    { id: 'flujo_caja', etiqueta: 'Proyectar el flujo de caja' },
    { id: 'cartera', etiqueta: 'Hacer seguimiento a cartera y cobros' },
    { id: 'conciliaciones', etiqueta: 'Hacer conciliaciones' },
    { id: 'facturacion', etiqueta: 'Facturar y revisar facturas' },
    { id: 'informe_mensual', etiqueta: 'Preparar el informe mensual para Gerencia' },
  ],
}

/**
 * Horas por semana en tareas repetitivas. `valor` es el punto medio del rango,
 * con el que el resumen suma el tiempo por ganar de cada área. Es una
 * estimación para ordenar los talleres, no una medición.
 */
export const HORAS = [
  { id: 'menos_2', etiqueta: 'Menos de 2 horas', valor: 1 },
  { id: '2_5', etiqueta: 'Entre 2 y 5 horas', valor: 3.5 },
  { id: '5_10', etiqueta: 'Entre 5 y 10 horas', valor: 7.5 },
  { id: '10_20', etiqueta: 'Entre 10 y 20 horas', valor: 15 },
  { id: 'mas_20', etiqueta: 'Más de 20 horas', valor: 22 },
] as const

/**
 * Propuestas comerciales: la línea base de la automatización. El gerente dijo
 * que su dolor es el tiempo de crear propuestas; con esto se sabe cuánto es.
 * La pregunta sale a Ventas, Gerencia y Operaciones (los consultores aportan el
 * diagnóstico técnico). `valor` es el punto medio de cada rango.
 */
export const AREAS_PROPUESTAS: AreaId[] = ['ventas', 'gerencia', 'operaciones']

export const PROPUESTA_ROL = [
  { id: 'arma', etiqueta: 'Las armo', hint: 'Del Brief al documento que se envía' },
  { id: 'tecnica', etiqueta: 'Aporto la parte técnica o el diagnóstico' },
  { id: 'revisa', etiqueta: 'Las reviso o las apruebo' },
  { id: 'no', etiqueta: 'No participo en propuestas' },
] as const satisfies readonly Opcion[]

export const PROPUESTA_HORAS = [
  { id: 'menos_1', etiqueta: 'Menos de 1 hora', valor: 0.5 },
  { id: '1_3', etiqueta: 'Entre 1 y 3 horas', valor: 2 },
  { id: '3_6', etiqueta: 'Entre 3 y 6 horas', valor: 4.5 },
  { id: '6_12', etiqueta: 'Entre 6 y 12 horas', valor: 9 },
  { id: 'mas_12', etiqueta: 'Más de 12 horas', valor: 14 },
] as const

export const PROPUESTAS_MES = [
  { id: '1_5', etiqueta: 'Entre 1 y 5', valor: 3 },
  { id: '6_10', etiqueta: 'Entre 6 y 10', valor: 8 },
  { id: '11_20', etiqueta: 'Entre 11 y 20', valor: 15 },
  { id: '21_40', etiqueta: 'Entre 21 y 40', valor: 30 },
  { id: 'mas_40', etiqueta: 'Más de 40', valor: 45 },
] as const

/**
 * Certificados de Logística: cuántos emite Ekosolv al mes (recolección y
 * disposición final) y cuánto tarda cada uno, más el tiempo de perseguir a los
 * gestores. Con esto el informe calcula las horas que se van en certificados.
 * `valor`: certificados al mes (punto medio) o minutos por certificado.
 */
export const CERTIFICADOS_MES = [
  { id: '1_10', etiqueta: 'Entre 1 y 10', valor: 5 },
  { id: '11_30', etiqueta: 'Entre 11 y 30', valor: 20 },
  { id: '31_60', etiqueta: 'Entre 31 y 60', valor: 45 },
  { id: '61_100', etiqueta: 'Entre 61 y 100', valor: 80 },
  { id: 'mas_100', etiqueta: 'Más de 100', valor: 120 },
] as const

export const CERTIFICADO_MIN = [
  { id: 'menos_15', etiqueta: 'Menos de 15 minutos', valor: 10 },
  { id: '15_30', etiqueta: 'Entre 15 y 30 minutos', valor: 22.5 },
  { id: '30_60', etiqueta: 'Entre 30 minutos y 1 hora', valor: 45 },
  { id: '1_2h', etiqueta: 'Entre 1 y 2 horas', valor: 90 },
  { id: 'mas_2h', etiqueta: 'Más de 2 horas', valor: 150 },
] as const

export const DOCUMENTOS: Opcion[] = [
  { id: 'pdf_escaneado', etiqueta: 'PDF escaneados (autos, resoluciones, certificados)' },
  { id: 'pdf_digital', etiqueta: 'PDF digitales' },
  { id: 'word', etiqueta: 'Documentos de Word' },
  { id: 'excel', etiqueta: 'Hojas de Excel' },
  { id: 'correos', etiqueta: 'Correos' },
  { id: 'presentaciones', etiqueta: 'Presentaciones' },
  { id: 'fotos', etiqueta: 'Fotos o imágenes' },
]

export const HERRAMIENTAS: Opcion[] = [
  { id: 'zoho_crm', etiqueta: 'Zoho CRM' },
  { id: 'zoho_books', etiqueta: 'Zoho Books' },
  { id: 'workdrive', etiqueta: 'Zoho WorkDrive' },
  { id: 'cliq', etiqueta: 'Zoho Cliq' },
  { id: 'excel', etiqueta: 'Excel o Google Sheets' },
  { id: 'word', etiqueta: 'Word o Google Docs' },
  { id: 'correo', etiqueta: 'Correo (Zoho Mail, Outlook o Gmail)' },
  { id: 'canva', etiqueta: 'Canva' },
  { id: 'vital', etiqueta: 'VITAL u otras plataformas de autoridades' },
]

export const USO_IA = [
  { id: 'nunca', etiqueta: 'Nunca la he usado' },
  { id: 'probado', etiqueta: 'La he probado algunas veces' },
  { id: 'semanal', etiqueta: 'La uso cada semana' },
  { id: 'diario', etiqueta: 'La uso todos los días' },
] as const satisfies readonly Opcion[]

export const IAS: Opcion[] = [
  { id: 'chatgpt', etiqueta: 'ChatGPT' },
  { id: 'gemini', etiqueta: 'Gemini' },
  { id: 'copilot', etiqueta: 'Copilot' },
  { id: 'claude', etiqueta: 'Claude' },
  { id: 'zia', etiqueta: 'Zia (la IA de Zoho)' },
  { id: 'otra', etiqueta: 'Otra' },
]

export const PREOCUPACIONES: Opcion[] = [
  { id: 'inventa', etiqueta: 'Que invente datos o normas' },
  { id: 'confidencial', etiqueta: 'Subir información confidencial de clientes' },
  { id: 'pedir', etiqueta: 'No saber cómo pedirle las cosas' },
  { id: 'revisar', etiqueta: 'Que revisar lo que hace tome más tiempo que hacerlo' },
  { id: 'reemplazo', etiqueta: 'Que reemplace parte de mi trabajo' },
  { id: 'ninguna', etiqueta: 'Ninguna en particular' },
]

export const DOCUMENTO_REAL = [
  { id: 'si', etiqueta: 'Sí, puedo traer uno' },
  { id: 'permiso', etiqueta: 'Sí, pero tengo que pedir permiso o anonimizarlo' },
  { id: 'no', etiqueta: 'No tengo uno que sirva' },
] as const satisfies readonly Opcion[]

export const MODALIDAD = [
  { id: 'presencial', etiqueta: 'Presencial, en la oficina' },
  { id: 'virtual', etiqueta: 'Virtual' },
  { id: 'igual', etiqueta: 'Me da igual' },
] as const satisfies readonly Opcion[]

/** Lo que queda guardado de cada respuesta, ya validado. */
export interface Respuesta {
  nombre: string
  cargo: string
  area: AreaId
  tareas: string[]
  tarea_otra: string
  horas: string
  tarea_principal: string
  propuesta_rol: string
  propuesta_horas: string
  propuestas_mes: string
  propuesta_demora: string
  certificados_mes: string
  certificado_min: string
  seguimiento_gestores: string
  certificado_demora: string
  documentos: string[]
  herramientas: string[]
  uso_ia: string
  ias: string[]
  para_que: string
  preocupaciones: string[]
  deseo: string
  documento_real: string
  documento_cual: string
  modalidad: string
  restricciones: string
}

/** Busca la etiqueta de una opción; si no está, devuelve el id tal cual. */
export function etiqueta(lista: readonly Opcion[], id: string): string {
  return lista.find((o) => o.id === id)?.etiqueta ?? id
}

export const nombreArea = (id: string) => etiqueta(AREAS, id)
