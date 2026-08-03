/**
 * Datos y textos legales, en un solo lugar.
 *
 * Fuente única para la política de tratamiento, los términos, la política de
 * cookies y el texto de la autorización que firma el titular en cada
 * formulario. Está aquí y no repartido por las páginas por una razón concreta:
 * la Ley 1581 de 2012 obliga a conservar prueba de la autorización, y esa
 * prueba solo vale si podemos decir *qué texto exacto* aceptó el titular. Cada
 * cambio de fondo en el texto sube `POLITICA_VERSION`, y esa versión es la que
 * se guarda junto al registro (`consent_version` en `contacts` y `orders`).
 *
 * ⚠️ PENDIENTES DE EKOSOLV (ver `pendientes.md`):
 *   1. Confirmar el correo de atención al titular. Hoy apunta a info@ekosolv.com
 *      porque es el único buzón verificado; lo ideal es uno dedicado.
 *   2. Verificar si la sociedad está obligada a inscribirse en el RNBD ante la
 *      SIC (aplica con activos totales superiores a 100.000 UVT).
 *   3. Aprobar el manual interno de políticas y procedimientos, que es
 *      documento interno pero la SIC lo exige en inspección.
 */

import { SITE_LEGAL_NAME, SITE_NIT } from './site'

/** Sube al cambiar el fondo del texto de autorización o de las finalidades. */
export const POLITICA_VERSION = '1.0'

/** Fecha de entrada en vigencia de la versión actual (ISO, sin hora). */
export const POLITICA_VIGENCIA = '2026-08-03'

/** Responsable del tratamiento, en los términos del art. 3 de la Ley 1581. */
export const RESPONSABLE = {
  razonSocial: SITE_LEGAL_NAME,
  nit: SITE_NIT,
  direccion: 'Edif. RPTV · Carrera 15 #31B-33, Bogotá D.C., Colombia',
  telefono: '+57 321 271 2773',
  telefonoHref: 'tel:+573212712773',
  /** Canal de atención al titular para consultas y reclamos (PQRS de datos). */
  correo: 'info@ekosolv.com',
} as const

/**
 * Rutas de los documentos legales. Los `null` son documentos que todavía no
 * existen: `SiteFooter` los pinta como texto sin enlace en vez de dejar un 404.
 */
export const LEGAL_PATHS = {
  es: {
    politica: '/politica-de-tratamiento-de-datos',
    terminos: '/terminos-de-servicio',
    cookies: '/politica-de-cookies',
    etica: null,
  },
  en: {
    politica: '/en/data-processing-policy',
    terminos: '/en/terms-of-service',
    cookies: '/en/cookie-policy',
    etica: null,
  },
} as const

/**
 * Finalidades del tratamiento. La autorización solo cubre lo que está
 * declarado aquí: si aparece un uso nuevo de los datos, va en esta lista y
 * sube la versión de la política.
 */
export const FINALIDADES = {
  es: [
    'Responder la solicitud, cotización o agendamiento que usted envía por el sitio.',
    'Coordinar la recolección, el transporte y la disposición final de los residuos, cuando aplique.',
    'Expedir los certificados de disposición final y los soportes que exige la normativa ambiental.',
    'Gestionar la relación comercial y contractual, incluidas facturación y cobranza.',
    'Cumplir obligaciones de reporte ante autoridades ambientales y tributarias.',
    'Enviar información sobre nuestros servicios, siempre con opción de darse de baja.',
  ],
  en: [
    'Respond to the request, quotation, or booking you submit through the site.',
    'Coordinate collection, transport, and final disposal of waste, where applicable.',
    'Issue final disposal certificates and the supporting records required by environmental regulation.',
    'Manage the commercial and contractual relationship, including invoicing and collections.',
    'Comply with reporting obligations before environmental and tax authorities.',
    'Send information about our services, always with an opt-out.',
  ],
} as const

/**
 * Encargados del tratamiento y país donde procesan.
 *
 * Este bloque no es decorativo: ninguno de estos países está en la lista de
 * naciones con nivel adecuado de protección de la Circular Externa 005 de 2017
 * de la SIC. Por eso la transferencia internacional tiene que ir declarada y
 * cubierta por la autorización expresa del titular, y no basta con mencionarla
 * de pasada.
 */
export const ENCARGADOS = [
  {
    nombre: 'Zoho Corporation',
    rol: { es: 'CRM y facturación', en: 'CRM and invoicing' },
    pais: { es: 'India / Estados Unidos', en: 'India / United States' },
  },
  {
    nombre: 'Resend',
    rol: { es: 'Envío de notificaciones por correo', en: 'Transactional email delivery' },
    pais: { es: 'Estados Unidos', en: 'United States' },
  },
  {
    nombre: 'Vercel',
    rol: { es: 'Alojamiento del sitio y ejecución del servidor', en: 'Site hosting and server runtime' },
    pais: { es: 'Estados Unidos', en: 'United States' },
  },
  {
    nombre: 'Turso',
    rol: { es: 'Base de datos', en: 'Database' },
    pais: { es: 'Estados Unidos', en: 'United States' },
  },
] as const

/** Derechos del titular (art. 8 de la Ley 1581 de 2012). */
export const DERECHOS = {
  es: [
    'Conocer, actualizar y rectificar sus datos personales.',
    'Solicitar prueba de la autorización que usted otorgó.',
    'Ser informado, previa solicitud, sobre el uso que le hemos dado a sus datos.',
    'Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.',
    'Revocar la autorización o solicitar la supresión de sus datos, cuando no exista un deber legal o contractual que nos obligue a conservarlos.',
    'Acceder de forma gratuita a los datos que hayan sido objeto de tratamiento.',
  ],
  en: [
    'Access, update, and rectify your personal data.',
    'Request proof of the authorisation you granted.',
    'Be informed, upon request, of how your data has been used.',
    'File complaints with the Superintendency of Industry and Commerce for breaches of the law.',
    'Withdraw your authorisation or request deletion of your data, where no legal or contractual duty requires us to keep it.',
    'Access, free of charge, the data that has been processed.',
  ],
} as const

/** Plazos legales de atención al titular (Decreto 1074 de 2015). */
export const PLAZOS = {
  consultaDias: 10,
  consultaProrrogaDias: 5,
  reclamoDias: 15,
  reclamoProrrogaDias: 8,
} as const

/**
 * Texto del checkbox de autorización. Va en HTML porque necesita enlazar la
 * política sin sacar al visitante del formulario.
 *
 * Menciona la transferencia internacional de forma expresa. Sin eso la
 * autorización no cubre el envío a Zoho ni a Resend, que es exactamente lo que
 * hace el backend en cuanto se guarda el registro.
 */
export const CONSENT_HTML = {
  es: `Autorizo a ${RESPONSABLE.razonSocial} a tratar mis datos personales para las finalidades de la <a href="${LEGAL_PATHS.es.politica}" target="_blank" rel="noopener">Política de tratamiento de datos</a>, incluida su transferencia a nuestros proveedores fuera de Colombia. Conozco mis derechos como titular.`,
  en: `I authorise ${RESPONSABLE.razonSocial} to process my personal data for the purposes set out in the <a href="${LEGAL_PATHS.en.politica}" target="_blank" rel="noopener">Data processing policy</a>, including its transfer to our providers outside Colombia. I am aware of my rights as a data subject.`,
} as const

/** Aviso de privacidad corto, para mostrar junto al checkbox. */
export const AVISO_PRIVACIDAD = {
  es: `Responsable: ${RESPONSABLE.razonSocial}, NIT ${RESPONSABLE.nit}. Canal de atención al titular: ${RESPONSABLE.correo}.`,
  en: `Data controller: ${RESPONSABLE.razonSocial}, NIT ${RESPONSABLE.nit}. Data subject contact channel: ${RESPONSABLE.correo}.`,
} as const

/**
 * ¿El valor recibido en el formulario cuenta como autorización?
 *
 * Un checkbox nativo viaja como `'on'` cuando está marcado y simplemente no
 * viaja cuando no lo está, así que basta con que llegue algo afirmativo. Lo que
 * no se acepta es un `'false'` o un `'0'` explícito.
 */
export function consentGranted(value: unknown): boolean {
  const v = String(value ?? '').trim().toLowerCase()
  return v === 'on' || v === 'true' || v === '1' || v === 'si' || v === 'sí' || v === 'yes'
}
