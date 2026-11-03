/**
 * Contenido de la capacitación en IA por área, para la página /ia.
 *
 * Es el mismo programa de `programa_capacitacion_por_area.pdf` (raíz del
 * repo), sin precios ni horas: las fechas y la distribución de horas se fijan
 * con el diagnóstico. Si el programa cambia, cambiar aquí también.
 *
 * `material` es lo que queda disponible en /ia después de cada taller. Mientras
 * no haya enlaces (`href`), la página lo muestra como "después del taller".
 */
import type { AreaId } from './diagnostico/preguntas'

export interface Material {
  titulo: string
  href?: string
}

export interface ModuloCapacitacion {
  id: AreaId | 'general'
  titulo: string
  quien: string
  aprende: string[]
  podra: string[]
  demuestra: string
  material: Material[]
}

export const GENERAL: ModuloCapacitacion = {
  id: 'general',
  titulo: 'Capacitación general',
  quien: 'Todo el equipo · Primer sábado',
  aprende: [
    'Qué es la IA y cómo funciona, en términos sencillos.',
    'En qué es buena y cuándo se equivoca o inventa.',
    'Cómo pedir: contexto, tarea, formato y ejemplos.',
    'Qué información no se sube (Ley 1581 de 2012).',
  ],
  podra: [
    'Escribir una instrucción que dé un resultado útil al primer o segundo intento.',
    'Revisar una respuesta y verificar cifras y fuentes antes de usarla.',
    'Decidir qué información de Ekosolv y de sus clientes puede usar y cuál no.',
    'Resolver con IA una tarea de su puesto y guardar la instrucción para repetirla.',
  ],
  demuestra: 'Una tarea real de su puesto, resuelta y revisada en la sesión.',
  material: [{ titulo: 'Guía de uso de IA en Ekosolv' }, { titulo: 'Qué información no se sube' }],
}

export const MODULOS: ModuloCapacitacion[] = [
  {
    id: 'operaciones',
    titulo: 'Operaciones',
    quien: 'Consultores y revisión técnica · Dos sábados',
    aprende: [
      'Leer autos, resoluciones y requerimientos con IA e identificar obligaciones, plazos y responsables.',
      'Ubicar la norma que aplica y verificarla.',
      'Revisar ICA, PMA, EIA, permisos y procesos contra listas de chequeo.',
      'Comparar resultados de laboratorio con los límites normativos.',
      'Extraer y cruzar las cifras de los certificados de recolección y de disposición final.',
      'Redactar borradores de informes y de respuestas.',
    ],
    podra: [
      'Extraer de un auto o una resolución las obligaciones, los plazos y los responsables, citando el artículo, y armar la matriz de obligaciones con su calendario de vencimientos.',
      'Revisar un ICA o un PMA contra la lista de chequeo, y resultados y procedimientos frente a la norma y la licencia.',
      'Pasar un lote de certificados a una tabla, detectar diferencias entre recolección y disposición final y consolidar las toneladas para los reportes.',
      'Verificar contra la norma vigente lo que afirma la IA y preparar el borrador de un informe o de una respuesta, con su resumen para el cliente.',
    ],
    demuestra: 'La matriz de obligaciones de un auto real, la revisión de un ICA o un PMA y la conciliación de un lote de certificados.',
    material: [
      { titulo: 'Plantilla de matriz de obligaciones' },
      { titulo: 'Plantilla de conciliación de certificados' },
      { titulo: 'Listas de chequeo de ICA y PMA' },
      { titulo: 'Plantillas de respuesta a la autoridad' },
    ],
  },
  {
    id: 'logistica',
    titulo: 'Logística',
    quien: 'Recolecciones, gestores y certificados · La hora de certificados es con Operaciones',
    aprende: [
      'Pasar a una tabla las cifras de un lote de certificados de los gestores y cruzarlas con lo recolectado.',
      'Redactar con IA las solicitudes y los recordatorios a los gestores.',
      'Preparar los certificados de recolección y de disposición final de Ekosolv a partir de los datos de la recolección y del certificado del gestor.',
      'Organizar la programación de recolecciones y las respuestas a clientes sobre el estado de su servicio.',
      'Revisar las cifras antes de cargarlas en Zoho.',
    ],
    podra: [
      'Sacar de un certificado del gestor los datos del certificado de Ekosolv (cliente, fecha, tipo de residuo, kilos y gestor) y detectar diferencias con lo recolectado.',
      'Preparar el borrador del certificado de disposición final de Ekosolv para el cliente con la plantilla de la empresa, listo para revisar y firmar.',
      'Escribir en minutos las solicitudes y recordatorios a los gestores y las respuestas a clientes sobre su recolección o su certificado.',
      'Consolidar las toneladas del mes por cliente y por gestor, listas para Zoho y para los reportes.',
    ],
    demuestra: 'El certificado de disposición final de Ekosolv preparado a partir del certificado real de un gestor y la conciliación de un lote de recolecciones.',
    material: [
      { titulo: 'Plantillas de solicitud y seguimiento a gestores' },
      { titulo: 'Plantilla de datos para los certificados de Ekosolv' },
      { titulo: 'Hoja de conciliación de cifras' },
    ],
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    quien: 'Equipo comercial',
    aprende: [
      'Pasar del Brief de Zoho CRM a un borrador de propuesta.',
      'Investigar un prospecto antes de una reunión.',
      'Redactar seguimientos y responder objeciones.',
    ],
    podra: [
      'Convertir un Brief en un borrador de propuesta con la plantilla de Ekosolv.',
      'Preparar la ficha de un prospecto con información pública antes de reunirse.',
      'Escribir correos de seguimiento y respuestas a objeciones con el tono de Ekosolv.',
      'Armar la estructura de una presentación comercial.',
    ],
    demuestra: 'Un borrador de propuesta hecho a partir de un Brief real.',
    material: [{ titulo: 'Biblioteca de instrucciones comerciales' }],
  },
  {
    id: 'mercadeo',
    titulo: 'Mercadeo / Redes',
    quien: 'Contenido, redes y blog',
    aprende: [
      'Definir la voz de la marca para usarla con IA.',
      'Planear un calendario editorial por línea de servicio.',
      'Convertir un tema en artículo y publicaciones.',
    ],
    podra: [
      'Producir el calendario editorial de un mes coherente con los servicios de Ekosolv.',
      'Redactar publicaciones para LinkedIn e Instagram con la voz de la marca.',
      'Convertir una norma nueva o un caso en un artículo para el blog y varias publicaciones.',
      'Revisar datos, tono y afirmaciones antes de publicar.',
    ],
    demuestra: 'Una campaña corta sobre un tema real: un artículo y tres publicaciones.',
    material: [{ titulo: 'Guía de voz de marca' }, { titulo: 'Calendario editorial del primer mes' }],
  },
  {
    id: 'gerencia',
    titulo: 'Gerencia General',
    quien: 'Dirección',
    aprende: [
      'Resumir documentos largos sin perder lo importante.',
      'Comparar opciones con criterios explícitos.',
      'Preparar reuniones y comunicaciones.',
    ],
    podra: [
      'Obtener el resumen ejecutivo de un contrato, resolución o informe largo y verificar sus puntos clave.',
      'Comparar propuestas de proveedores o alternativas de decisión con una matriz de criterios.',
      'Preparar el guion de una reunión o una comunicación importante al equipo o a un cliente.',
      'Definir las reglas de uso de IA para la empresa.',
    ],
    demuestra: 'Un resumen y una recomendación sobre un documento real elegido por Gerencia.',
    material: [{ titulo: 'Borrador de reglas de uso de IA' }],
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas',
    quien: 'Zoho Books, cartera e informes',
    aprende: [
      'Analizar reportes exportados de Zoho Books.',
      'Explicar variaciones y proyectar flujo de caja.',
      'Cuidar la información financiera al usar IA.',
    ],
    podra: [
      'Analizar un reporte de ventas, cartera o gastos y explicar las variaciones en lenguaje sencillo.',
      'Armar un flujo de caja proyectado con los supuestos a la vista.',
      'Preparar el informe financiero mensual para Gerencia.',
      'Redactar comunicaciones de cobro claras y cordiales.',
    ],
    demuestra: 'Un informe mensual hecho a partir de un reporte real, con datos anonimizados si se prefiere.',
    material: [{ titulo: 'Plantilla del informe financiero mensual' }],
  },
]
