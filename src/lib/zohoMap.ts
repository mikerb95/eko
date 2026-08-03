/**
 * Traducción web → Zoho. **Este es el único archivo que hay que tocar cuando
 * comercial diga "el sector no va ahí, va en Industry".**
 *
 * Todo lo demás (cliente HTTP, bandeja de salida, reintentos) es genérico y no
 * sabe nada de nombres de campo. Ese aislamiento es a propósito: el mapeo es lo
 * único que va a cambiar seguido, y cambiarlo no debería obligar a releer la
 * lógica de sincronización.
 *
 * Los nombres usados son los estándar del módulo Leads de Zoho CRM. Si Ekosolv
 * tiene campos personalizados, la API los expone con su *API name* real (algo
 * como `Tipo_de_residuo`), que se consulta en Zoho con
 * `GET /crm/v8/settings/fields?module=Leads`. Hasta que comercial confirme, lo
 * que no tiene campo propio se acumula en `Description`, que es reversible y no
 * pierde información.
 */

import type { Contact } from './contactos'
import type { Order } from './ops'

/** Cómo se identifica en Zoho lo que llega del sitio. */
const LEAD_SOURCE = 'Sitio web'

/**
 * `Company` es obligatorio en los Leads de Zoho y muchos formularios llegan sin
 * empresa (persona natural). Antes que fallar el envío, se usa el nombre de la
 * persona; el equipo lo corrige en Zoho si hace falta.
 */
function company(value: string, fallbackName: string): string {
  return value.trim() || fallbackName.trim() || 'Sin empresa'
}

/** Zoho separa nombre y apellido; el formulario de contacto pide uno solo. */
function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first: '', last: 'Sin nombre' }
  if (parts.length === 1) return { first: '', last: parts[0] }
  // Dos apellidos son la norma en Colombia: el corte a la mitad acierta más que
  // asumir "primer token = nombre, resto = apellido".
  const cut = Math.ceil(parts.length / 2)
  return { first: parts.slice(0, cut).join(' '), last: parts.slice(cut).join(' ') }
}

/** Junta pares "etiqueta: valor" omitiendo los vacíos. */
function notes(rows: Array<[string, string]>): string {
  return rows
    .filter(([, v]) => String(v || '').trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')
}

// ------------------------------------------------------------------- Leads

export interface ZohoLead {
  Last_Name: string
  Company: string
  [field: string]: any
}

/** Mensaje del formulario de contacto → Lead de Zoho CRM. */
export function contactToLead(contact: Contact): ZohoLead {
  const { first, last } = splitName(contact.name)
  return {
    Last_Name: last,
    First_Name: first,
    Company: company(contact.company, contact.name),
    Email: contact.email,
    Phone: contact.phone,
    Lead_Source: LEAD_SOURCE,
    Description: notes([
      ['Mensaje', contact.message],
      ['Sector', contact.sector],
      ['Líneas de interés', contact.service_lines],
      ['Origen', `Formulario de contacto (${contact.source})`],
      ['Registro en el panel', String(contact.id ?? '')],
    ]),
  }
}

/**
 * Solicitud de recolección → Lead de Zoho CRM.
 *
 * Va como Lead y no como Deal a propósito: la orden operativa ya vive en la web
 * (`orders`), y duplicarla como negocio en Zoho crearía dos maestros del mismo
 * dato. El Deal lo abre comercial cuando decide que hay negocio, con el
 * consecutivo en la descripción para poder rastrear la orden de vuelta.
 */
export function orderToLead(order: Order): ZohoLead {
  const who = `${order.first_name} ${order.last_name}`.trim()
  return {
    Last_Name: order.last_name.trim() || who || 'Sin nombre',
    First_Name: order.first_name,
    Company: company(order.company, who),
    Email: order.email,
    Phone: order.phone,
    Street: [order.address, order.address2].filter(Boolean).join(', '),
    City: order.city,
    Zip_Code: order.postal_code,
    Country: order.country,
    Lead_Source: LEAD_SOURCE,
    Description: notes([
      ['Consecutivo', order.consecutive],
      ['Tipo de residuo', order.waste_type],
      ['Cantidad estimada', order.estimated_quantity],
      ['Mensaje', order.message],
      ['Origen', `Formulario de recolección (${order.source})`],
    ]),
  }
}

// ------------------------------------------------------------------- Books
//
// Zoho Books entra en escena al cerrar la orden (kilos reales, certificado,
// factura), no al recibirla. Ese mapeo queda pendiente a propósito hasta que
// esté definido con administración:
//
//   - ¿La factura se emite desde Books o el cliente ya tiene su propio flujo?
//   - ¿Qué ítem/servicio del catálogo de Books corresponde a una recolección
//     RAEE, y se cobra por kilo, por visita o por contrato?
//   - ¿El certificado se adjunta a la factura o vive solo en el panel?
//
// La infraestructura ya está lista para ese día: `booksFetch()` en `zoho.ts`
// resuelve autenticación y `organization_id`, y la bandeja de salida acepta las
// entidades `books_contact` y `books_invoice`. Falta únicamente la función de
// mapeo aquí y su handler en `zoho.ts`. Inventar ahora una estructura de
// factura sería adivinar sobre dinero, que es justo donde no se adivina.
