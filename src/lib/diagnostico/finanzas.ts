/**
 * Cuestionario del diagnóstico del área de Finanzas (paso 1 de la oferta de
 * Finanzas). Es la herramienta de Mike durante la reunión de análisis con la
 * persona de Finanzas y la validación con Gerencia: lee la pregunta, marca el
 * punto cuando queda validado y anota la respuesta.
 *
 * Las preguntas van de usted (se le hacen a ella); las pistas le hablan a Mike.
 * Confidencial: nada aquí puede afirmar ni insinuar sanciones pasadas; las
 * preguntas sobre requerimientos o sanciones van en neutro.
 *
 * Lo marcado se guarda en `ajustes` (clave 'diagnostico_finanzas') como un JSON
 * { [idPregunta]: { h: boolean, n: string } }. Cada cambio escribe solo su
 * pregunta con json_set, en una sola sentencia, para no pisar otras.
 */
import { asegurarEsquema, cliente } from '../db'

export interface Pregunta {
  id: string
  texto: string
  /** Pista corta para Mike: por qué importa o qué módulo alimenta. */
  pista?: string
}
export interface Seccion {
  id: string
  titulo: string
  intro?: string
  preguntas: Pregunta[]
}
export interface Marca {
  h: boolean
  n: string
}
export type EstadoFinanzas = Record<string, Marca>

export const SECCIONES: Seccion[] = [
  {
    id: 'cargo',
    titulo: 'El cargo y la rutina',
    intro: 'Arranca por aquí para que ella se sienta en terreno conocido. Sale el mapa de tareas del cargo.',
    preguntas: [
      { id: 'cargo-funciones', texto: '¿Cuáles son sus funciones, a quién le reporta y quién la reemplaza en vacaciones o ausencias?', pista: 'Si nadie la reemplaza, el calendario depende de una sola persona: es el argumento del escalamiento a Gerencia.' },
      { id: 'cargo-tareas', texto: '¿Qué tareas hace cada día, cada semana, cada mes y cada año, y cuánto tiempo le toma cada una?', pista: 'Base del mapa de tareas. Pide tiempos aproximados, no exactos.' },
      { id: 'cargo-pesadas', texto: '¿Cuáles le quitan más tiempo y cuáles le gustaría dejar de hacer?', pista: 'Aquí salen los candidatos a automatizar o a resolver con Claude.' },
      { id: 'cargo-herramientas', texto: '¿Qué herramientas usa: Zoho Books, Siigo Nube, Excel, portales bancarios, MUISCA de la DIAN, Secretaría de Hacienda de Bogotá, operador de PILA, Cámara de Comercio, Supersociedades u otras?' },
      { id: 'cargo-contador', texto: '¿Quiénes son el contador externo y el revisor fiscal, qué hace cada uno, qué les entrega usted, cuándo y por qué medio, y quién firma las declaraciones?', pista: 'Define de quién depende cada fecha y quién debe recibir avisos.' },
    ],
  },
  {
    id: 'perfil',
    titulo: 'Perfil tributario',
    intro: 'Casi todo sale del RUT: pide copia actualizada antes de entrar en detalle.',
    preguntas: [
      { id: 'perfil-nit', texto: '¿Cuál es el NIT y su último dígito (o los dos últimos, si es gran contribuyente)?', pista: 'Define todas las fechas del calendario.' },
      { id: 'perfil-responsabilidades', texto: '¿Qué responsabilidades tiene en el RUT (códigos): renta régimen ordinario, retención en la fuente, IVA, informante de exógena, facturador electrónico, obligado a llevar contabilidad u otras?', pista: 'Cada código es una obligación del calendario.' },
      { id: 'perfil-regimen', texto: '¿Es gran contribuyente? ¿Está en el régimen simple? ¿Es autorretenedor de renta o tiene autorretención especial?' },
      { id: 'perfil-iva', texto: '¿Declara IVA bimestral o cuatrimestral? ¿Cuáles fueron los ingresos del año anterior?', pista: 'Los ingresos definen la periodicidad del IVA.' },
      { id: 'perfil-sociedad', texto: '¿Qué tipo de sociedad es, está obligada a tener revisor fiscal y reporta a Supersociedades?' },
      { id: 'perfil-ica', texto: '¿Declara ICA solo en Bogotá o también en otros municipios donde presta servicios? ¿Con qué periodicidad? ¿Practica reteICA o autorretención de ICA?', pista: 'Cada municipio suma fechas distintas.' },
      { id: 'perfil-exogena', texto: '¿Presenta información exógena nacional y distrital?' },
      { id: 'perfil-otros', texto: '¿Aplican el registro de beneficiarios finales (RUB), el impuesto al patrimonio, el GMF u otros?' },
      { id: 'perfil-electronica', texto: '¿Desde qué sistema se emiten la facturación electrónica, la nómina electrónica y el documento soporte?', pista: 'Dice si Zoho Books o Siigo es la fuente de cada cifra.' },
      { id: 'perfil-predial', texto: '¿La empresa tiene inmuebles o vehículos que paguen predial o impuesto vehicular?' },
    ],
  },
  {
    id: 'compromisos',
    titulo: 'Compromisos que no son impuestos',
    intro: 'También entran al calendario vigilado.',
    preguntas: [
      { id: 'comp-pila', texto: '¿Quién liquida la PILA (seguridad social y parafiscales) y en qué fecha se paga?', pista: 'La fecha depende del NIT.' },
      { id: 'comp-laborales', texto: '¿Cómo maneja las cesantías (14 de febrero), los intereses de cesantías (31 de enero), la prima (junio y diciembre) y la dotación?' },
      { id: 'comp-camara', texto: '¿Quién se encarga de renovar la matrícula mercantil (31 de marzo), los estados financieros y la asamblea?' },
      { id: 'comp-certificados', texto: '¿Cómo maneja los certificados de retención que Ekosolv emite a proveedores y los que recibe de clientes?' },
      { id: 'comp-recurrentes', texto: '¿Qué créditos, leasing, tarjetas, arriendos y pagos recurrentes a proveedores tiene la empresa, y en qué fechas se pagan?' },
    ],
  },
  {
    id: 'calendario',
    titulo: 'El calendario hoy',
    preguntas: [
      { id: 'cal-donde', texto: '¿Dónde lleva hoy las fechas (Excel, Google Calendar, Zoho, papel, memoria) y quién más las ve?' },
      { id: 'cal-anticipacion', texto: '¿Con cuánta anticipación empieza a preparar cada obligación y de qué depende: cierre contable, conciliación o información del contador?', pista: 'Ajusta los avisos a 15, 7, 3 y 1 día hábil.' },
      { id: 'cal-inconvenientes', texto: '¿Qué obligaciones le han dado más inconvenientes (con la fecha, el pago o el soporte) y por qué?', pista: 'Pregunta en neutro y deja que ella cuente.' },
      { id: 'cal-requerimientos', texto: '¿Ha habido requerimientos, emplazamientos, actos o sanciones de la DIAN o de Hacienda en los últimos dos años? ¿Por qué concepto, cuál fue la causa y cómo se resolvió?', pista: 'Pregunta en neutro. Alimenta el diagnóstico de qué control falta.' },
    ],
  },
  {
    id: 'preparacion',
    titulo: 'Preparación y presentación',
    intro: 'Recórrelo por obligación: retención, IVA, ICA, renta, exógena.',
    preguntas: [
      { id: 'prep-borrador', texto: '¿Quién prepara el borrador y de qué sistema salen los datos (Siigo o Zoho Books)?', pista: 'Estado "borrador listo" del expediente.' },
      { id: 'prep-revision', texto: '¿Quién revisa y quién aprueba?', pista: 'Estados "revisado" y "aprobado".' },
      { id: 'prep-firma', texto: '¿Quién tiene la firma electrónica de la DIAN (representante legal, contador, revisor fiscal) y quién presenta en MUISCA?' },
      { id: 'prep-490', texto: '¿Quién genera el formulario 490 (recibo de pago)?' },
      { id: 'prep-archivo', texto: '¿Dónde se guardan el borrador, la declaración, el 490, el comprobante de pago y el acuse (carpeta, WorkDrive o Drive) y cómo se nombran los archivos?', pista: 'Define los soportes que pide cada estado del expediente.' },
      { id: 'prep-correcciones', texto: '¿Cada cuánto se corrigen declaraciones y por qué?' },
    ],
  },
  {
    id: 'pagos',
    titulo: 'Pagos',
    intro: 'Alimenta el control antes de pagar: es el pedido del gerente de que "los botones sean los correctos".',
    preguntas: [
      { id: 'pago-cuentas', texto: '¿Desde qué bancos y cuentas se pagan los impuestos y cuál se usa para qué?', pista: 'Lista de cuentas autorizadas.' },
      { id: 'pago-medio', texto: '¿Cómo se paga: PSE desde MUISCA, botón de pago del banco, ventanilla con el 490 o débito?', pista: 'Define la lista de pasos del portal que entrega el sistema.' },
      { id: 'pago-aprobacion', texto: '¿Quién crea el pago en el banco y quién lo aprueba (doble firma, token, montos límite)? ¿Gerencia tiene usuario aprobador en el banco?' },
      { id: 'pago-verificacion', texto: '¿Cómo se verifica hoy que un pago no se hizo ya y que la referencia, el periodo y el valor son los correctos?', pista: 'Es justo lo que el control reemplaza.' },
      { id: 'pago-errores', texto: '¿Alguna vez se pagó dos veces, con la referencia equivocada o desde la cuenta que no era? ¿Cómo se recuperó?' },
      { id: 'pago-parciales', texto: '¿Hay pagos parciales, acuerdos de pago, saldos a favor o compensaciones?', pista: 'Casos especiales que el control no debe bloquear.' },
      { id: 'pago-caja', texto: '¿Se aparta la plata de los impuestos con anticipación? ¿Quién decide el flujo de caja?' },
      { id: 'pago-otros', texto: '¿Quién prepara y quién aprueba los pagos a proveedores, la nómina y los créditos?' },
    ],
  },
  {
    id: 'notificaciones',
    titulo: 'Notificaciones y requerimientos',
    preguntas: [
      { id: 'not-canal', texto: '¿Por dónde llegan las notificaciones: el correo registrado en el RUT, el buzón electrónico de la DIAN o en físico? ¿Quién revisa ese correo y cada cuánto?' },
      { id: 'not-respuesta', texto: '¿Quién responde los requerimientos y cómo controla el plazo?', pista: 'Alimenta la lectura de requerimientos con IA y su alerta de plazo.' },
      { id: 'not-correo', texto: '¿El correo de la empresa es Zoho Mail o Gmail?', pista: 'Está pendiente de confirmar.' },
    ],
  },
  {
    id: 'zoho',
    titulo: 'Zoho Books',
    intro: 'Para traer cifras por API a los resúmenes.',
    preguntas: [
      { id: 'zoho-modulos', texto: '¿Qué módulos usa: facturas, cotizaciones, gastos, bancos, conciliación, cartera? ¿Se factura electrónicamente desde Zoho Books?' },
      { id: 'zoho-admin', texto: 'Ekosolv tiene Zoho One (organización "ekosolv"). ¿Quién es el administrador y quién puede autorizar una conexión?' },
      { id: 'zoho-api', texto: '¿Se puede crear un usuario o un permiso de solo lectura para conectar el sistema?', pista: 'OAuth desde la Zoho API Console (Self Client o cliente de servidor), permisos de solo lectura (ZohoBooks.invoices.READ, contacts, banking, reports). Anota el centro de datos (.com u otro) y el organization_id.' },
      { id: 'zoho-bancos', texto: '¿Tiene bancos conectados a Zoho (feeds)?' },
      { id: 'zoho-reportes', texto: '¿Qué reportes saca (cartera por edades, ventas, recaudo), cada cuánto y para quién?', pista: 'Define las cifras del resumen mensual.' },
      { id: 'zoho-claude', texto: '¿Usan o podrían usar el conector de Zoho con Claude?', pista: 'Sesión 4 de la capacitación.' },
    ],
  },
  {
    id: 'siigo',
    titulo: 'Siigo Nube',
    preguntas: [
      { id: 'siigo-plan', texto: '¿Qué plan de Siigo tienen contratado, incluye API y quién administra la cuenta?', pista: 'Siigo pide usuario de API y access key, según el plan.' },
      { id: 'siigo-division', texto: '¿Qué se hace en Siigo y qué en Zoho Books? ¿Se digita dos veces? ¿Cómo se cuadran?' },
      { id: 'siigo-reportes', texto: '¿Qué reportes usa (balance, estado de resultados, auxiliares, cuentas de impuestos por pagar)? ¿Los exporta a Excel?' },
      { id: 'siigo-borradores', texto: '¿Los borradores de IVA y retención salen de Siigo?' },
      { id: 'siigo-exportaciones', texto: 'Si no hay API: ¿qué exportaciones manuales serían posibles y con qué frecuencia?', pista: 'Plan B que ya quedó en los supuestos de la oferta.' },
    ],
  },
  {
    id: 'bancos',
    titulo: 'Bancos y conciliación',
    preguntas: [
      { id: 'banco-extractos', texto: '¿En qué formato llegan los extractos (PDF o Excel), cómo los descarga y cada cuánto concilia?', pista: 'Sesión 2 de la capacitación: limpieza de extractos.' },
      { id: 'banco-conexion', texto: '¿El banco ofrece algún servicio de conexión o archivo automático?', pista: 'Normalmente no; confírmalo.' },
    ],
  },
  {
    id: 'excel',
    titulo: 'Excel',
    intro: 'Base de la capacitación.',
    preguntas: [
      { id: 'excel-archivos', texto: '¿Qué archivos usa cada semana? ¿Me puede compartir una copia de las conciliaciones, los comparativos de balances, el flujo de caja y el control de pagos?', pista: 'Las sesiones 1 y 2 se preparan con estos archivos.' },
      { id: 'excel-nivel', texto: '¿Qué fórmulas usa hoy, dónde se traba y qué versión de Excel tiene (Microsoft 365 u otra)?', pista: 'BUSCARX y algunas funciones nuevas solo existen en Microsoft 365.' },
    ],
  },
  {
    id: 'ia',
    titulo: 'Claude e IA',
    preguntas: [
      { id: 'ia-uso', texto: '¿Ha usado IA? ¿Tiene cuenta de Claude de Ekosolv o personal?', pista: 'El plan Team de Ekosolv está por confirmar.' },
      { id: 'ia-deseo', texto: '¿Qué le gustaría recibir: resúmenes, análisis contables, alertas, comparativos?' },
      { id: 'ia-limites', texto: '¿Qué documentos no deberían subirse a ninguna herramienta?' },
    ],
  },
  {
    id: 'alertas',
    titulo: 'Diseño de alertas y aprobaciones',
    preguntas: [
      { id: 'alerta-correos', texto: '¿A qué correos deben llegar los avisos? ¿Gerencia quiere un resumen semanal?' },
      { id: 'alerta-plazos', texto: '¿Le sirven los avisos a 15, 7, 3 y 1 día hábil, con escalamiento a Gerencia a los 3 días?' },
      { id: 'alerta-aprobador', texto: '¿Quién aprueba los pagos en el sistema y quién lo reemplaza?' },
      { id: 'alerta-cuentas', texto: '¿Qué datos de cada cuenta autorizada se registran (banco, tipo, últimos dígitos)?', pista: 'Nunca la cuenta completa ni claves.' },
    ],
  },
  {
    id: 'capacitacion',
    titulo: 'Capacitación 1 a 1',
    preguntas: [
      { id: 'cap-horario', texto: '¿Qué disponibilidad y horario tiene? ¿Tiene PC propio? ¿Prefiere presencial o virtual?' },
      { id: 'cap-temas', texto: '¿Qué temas quiere ver usted?' },
    ],
  },
  {
    id: 'documentos',
    titulo: 'Documentos por recolectar',
    intro: 'Checklist de entrega. Marca cada uno cuando lo tengas.',
    preguntas: [
      { id: 'doc-rut', texto: 'RUT actualizado.' },
      { id: 'doc-declaraciones', texto: 'Declaraciones del último año: renta, IVA, retención, ICA, exógena.' },
      { id: 'doc-490', texto: 'Formularios 490 y comprobantes de pago.' },
      { id: 'doc-extractos', texto: 'Extractos de las cuentas desde las que se pagan impuestos.' },
      { id: 'doc-actos', texto: 'Requerimientos o actos recibidos, si los hay.' },
      { id: 'doc-calendario', texto: 'Calendario actual.' },
      { id: 'doc-excel', texto: 'Archivos de Excel.' },
      { id: 'doc-reportes', texto: 'Reportes de Zoho Books y Siigo.' },
      { id: 'doc-contador', texto: 'Datos del contador y del revisor fiscal.' },
    ],
  },
  {
    id: 'gerencia',
    titulo: 'Validación con Gerencia',
    intro: 'Reunión corta aparte, al final.',
    preguntas: [
      { id: 'ger-prioridades', texto: '¿Cuáles son sus prioridades?' },
      { id: 'ger-aprobaciones', texto: '¿Quién aprueba qué?' },
      { id: 'ger-alcance', texto: 'Confirmar el alcance y el límite: el sistema no entra a los portales de la DIAN, Hacienda ni bancos, no guarda claves ni firma electrónica, y no presenta ni paga.', pista: 'Que quede dicho en voz alta: protege la responsabilidad.' },
    ],
  },
]

const IDS = new Set(SECCIONES.flatMap((s) => s.preguntas.map((p) => p.id)))
export const esPregunta = (id: string) => IDS.has(id)
export const NOTA_MAX = 4000

const CLAVE = 'diagnostico_finanzas'

export async function leerFinanzas(): Promise<EstadoFinanzas> {
  await asegurarEsquema()
  const r = await cliente().execute({ sql: 'SELECT valor FROM ajustes WHERE clave = ?', args: [CLAVE] })
  const fila = r.rows[0]
  if (!fila) return {}
  try {
    const datos = JSON.parse(String(fila.valor))
    return datos && typeof datos === 'object' ? datos : {}
  } catch {
    return {}
  }
}

/** Guarda una pregunta sin tocar las demás. */
export async function guardarMarca(id: string, marca: Marca): Promise<void> {
  await asegurarEsquema()
  const ruta = `$."${id}"`
  const valor = JSON.stringify(marca)
  await cliente().execute({
    sql: `INSERT INTO ajustes (clave, valor, actualizado) VALUES (?, json_object(?, json(?)), ?)
          ON CONFLICT (clave) DO UPDATE SET valor = json_set(ajustes.valor, ?, json(?)), actualizado = excluded.actualizado`,
    args: [CLAVE, id, valor, new Date().toISOString(), ruta, valor],
  })
}
