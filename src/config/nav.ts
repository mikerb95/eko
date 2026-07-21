/**
 * Fuente única de la navegación del sitio.
 * Layout.astro y LayoutEn.astro consumen esto vía components/Nav.astro.
 */

export type Lang = 'es' | 'en'

type L = Record<Lang, string>

export interface NavUnit {
  href: L
  name: string
  desc: L
  /** token de color de global.css usado como acento de la unidad */
  accent: 'forest' | 'deep' | 'clay' | 'aqua'
}

export interface NavItem {
  href?: L
  label: L
  /** activo también cuando la ruta actual empieza por el href (blog, etc.) */
  prefix?: boolean
  units?: NavUnit[]
}

export const UNITS: NavUnit[] = [
  {
    href: { es: '/ekonsulting', en: '/en/ekonsulting' },
    name: 'Ekonsulting',
    desc: {
      es: 'Trámites y licenciamiento ante ANLA y CAR',
      en: 'Permitting and licensing before ANLA and CAR',
    },
    accent: 'deep',
  },
  {
    href: { es: '/ekoraee', en: '/en/ekoraee' },
    name: 'Ekoraee',
    desc: {
      es: 'Recolección y certificación de residuos electrónicos',
      en: 'E-waste collection and certification',
    },
    accent: 'forest',
  },
  {
    href: { es: '/ekopartner', en: '/en/ekopartner' },
    name: 'Ekopartner',
    desc: {
      es: 'Operación de sistemas posconsumo, colectivos e individuales',
      en: 'Post-consumer collection systems, collective and individual',
    },
    accent: 'aqua',
  },
  {
    href: { es: '/ekotrading', en: '/en/ekotrading' },
    name: 'Ekotrading',
    desc: {
      es: 'Economía circular y valorización de activos IT',
      en: 'Circular economy and IT asset recovery',
    },
    accent: 'clay',
  },
]

export const NAV: NavItem[] = [
  {
    label: { es: 'Unidades', en: 'Business Units' },
    units: UNITS,
  },
  { href: { es: '/servicios', en: '/en/services' }, label: { es: 'Servicios', en: 'Services' } },
  { href: { es: '/casos', en: '/en/cases' }, label: { es: 'Casos', en: 'Cases' } },
  { href: { es: '/normativas', en: '/en/regulations' }, label: { es: 'Normativas', en: 'Regulations' } },
  { href: { es: '/quienes-somos', en: '/en/about' }, label: { es: 'Nosotros', en: 'About' } },
  { href: { es: '/blog', en: '/en/blog' }, label: { es: 'Blog', en: 'Journal' }, prefix: true },
]

/** Enlace secundario destacado dentro del panel de Unidades. */
export const SCHEDULE = {
  href: { es: '/agenda-una-recoleccion', en: '/en/schedule-a-collection' },
  label: { es: 'Agenda una recolección', en: 'Schedule a collection' },
}

export const CTA = {
  href: { es: '/contacto', en: '/en/contact' },
  label: { es: 'Hablemos', en: "Let's talk" },
}

export const HOME: L = { es: '/', en: '/en' }

export const STRINGS = {
  brandAria: {
    es: 'EKOSOLV — Consultores en Sostenibilidad',
    en: 'EKOSOLV — Sustainability Consultants',
  },
  primaryNav: { es: 'Navegación principal', en: 'Main navigation' },
  openMenu: { es: 'Abrir menú', en: 'Open menu' },
  closeMenu: { es: 'Cerrar menú', en: 'Close menu' },
  switchLang: { es: 'View in English', en: 'Ver en español' },
  access: { es: 'Acceso', en: 'Admin access' },
  explore: { es: 'Explorar', en: 'Explore' },
}

/** Rutas equivalentes ES <-> EN para el switch de idioma. */
const PAIRS: Array<[string, string]> = [
  ['/', '/en'],
  ['/servicios', '/en/services'],
  ['/quienes-somos', '/en/about'],
  ['/normativas', '/en/regulations'],
  ['/casos', '/en/cases'],
  ['/blog', '/en/blog'],
  ['/agenda-una-recoleccion', '/en/schedule-a-collection'],
  ['/contacto', '/en/contact'],
  ['/ekonsulting', '/en/ekonsulting'],
  ['/ekoraee', '/en/ekoraee'],
  ['/ekopartner', '/en/ekopartner'],
  ['/ekotrading', '/en/ekotrading'],
]

const ES_TO_EN = Object.fromEntries(PAIRS)
const EN_TO_ES = Object.fromEntries(PAIRS.map(([es, en]) => [en, es]))

/** Devuelve la ruta equivalente en el otro idioma, o la home del otro idioma. */
export function alternateUrl(pathname: string, lang: Lang): string {
  const path = pathname.replace(/\/$/, '') || (lang === 'es' ? '/' : '/en')
  return lang === 'es' ? (ES_TO_EN[path] ?? '/en') : (EN_TO_ES[path] ?? '/')
}

export function isActive(item: NavItem, activePath: string, lang: Lang): boolean {
  const href = item.href?.[lang]
  if (!href) return item.units?.some((u) => u.href[lang] === activePath) ?? false
  return item.prefix ? activePath.startsWith(href) : activePath === href
}
