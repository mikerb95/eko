/**
 * Las cuatro líneas de servicio, tal como las publica /servicios (y /en/services).
 *
 * Viven aquí y no dentro de la página porque las lee también el asesor con IA
 * (src/lib/asesor/conocimiento.ts): todo lo que el asesor dice tiene que estar
 * publicado, y la forma de garantizarlo es que los dos lean la misma fuente.
 * Lo visual (color, ícono) se queda en cada página.
 *
 * Módulo plano, sin imports, para que los tests lo carguen con node directo.
 */

export type Linea = {
  n: string
  code: 'EKONSULTING' | 'EKORAEE' | 'EKOPARTNER' | 'EKOTRADING'
  slug: string
  title: string
  lede: string
  deliverables: readonly string[]
  plazo: string
}

export const LINEAS: Record<'es' | 'en', readonly Linea[]> = {
  es: [
    {
      n: "01", code: "EKONSULTING", slug: "/ekonsulting",
      title: "Asesoría y cumplimiento ANLA",
      lede: "El núcleo de nuestra práctica. Estructuramos y ejecutamos todos los trámites regulatorios ante la ANLA y las CAR, desde el licenciamiento hasta la defensa en procesos sancionatorios.",
      deliverables: [
        "Licenciamiento ambiental (EIA, DAA, PMA)",
        "Planes posconsumo RAEE y pilas",
        "Auditoría de cumplimiento 360°",
        "Reportes ante autoridad (RUA, ICA, ANLA)",
        "Acompañamiento en procesos sancionatorios",
        "Capacitación in-house del equipo HSE",
        "Estrategia ESG y alineación ODS",
      ],
      plazo: "Continuo",
    },
    {
      n: "02", code: "EKORAEE", slug: "/ekoraee",
      title: "Gestión certificada de residuos electrónicos",
      lede: "Recolección, transporte, almacenamiento y certificación de aparatos eléctricos y electrónicos bajo la Resolución 1297 de 2010 y la Ley 1672 de 2013.",
      deliverables: [
        "Recolección en punto o a domicilio",
        "Transporte certificado a gestor autorizado",
        "Certificados de disposición final",
        "Integración con plan posconsumo EKONSULTING",
        "Reporte de metas para la autoridad",
      ],
      plazo: "Por campaña o continuo",
    },
    {
      n: "03", code: "EKOPARTNER", slug: "/ekopartner",
      title: "Operación de sistemas de gestión de residuos",
      lede: "Integramos y operamos el sistema completo de recolección y disposición de residuos de la organización. No solo asesoramos: lo hacemos. Aplica únicamente en Colombia.",
      deliverables: [
        "Diseño del sistema de gestión integral",
        "Operación de puntos de recolección",
        "Gestión de gestores y transportistas",
        "Trazabilidad end-to-end de residuos",
        "Reportes operativos y regulatorios",
      ],
      plazo: "Retainer mensual",
    },
    {
      n: "04", code: "EKOTRADING", slug: "/ekotrading",
      title: "Economía circular · compra y venta de activos IT",
      lede: "Cerramos el ciclo de vida de los equipos tecnológicos dentro de un marco de economía circular. Compramos y vendemos tecnología usada u obsoleta al por mayor, con la trazabilidad que exigen los ODS.",
      deliverables: [
        "Valoración y retiro de activos IT obsoletos",
        "Reacondicionamiento y certificación",
        "Recolocación en mercados secundarios",
        "Documentación para reporte ESG",
        "Integración con EKORAEE para lo no reacondicionable",
      ],
      plazo: "Por lote o continuo",
    },
  ],
  en: [
    {
      n: "01", code: "EKONSULTING", slug: "/en/ekonsulting",
      title: "ANLA advisory and compliance",
      lede: "The core of our practice. We structure and execute all regulatory processes before ANLA and the regional environmental authorities (CAR), from licensing to defense in penalty proceedings.",
      deliverables: [
        "Environmental licensing (EIA, DAA, PMA)",
        "WEEE and battery post-consumer plans",
        "360° compliance audit",
        "Authority reports (RUA, ICA, ANLA)",
        "Support in penalty proceedings",
        "In-house HSE team training",
        "ESG strategy and SDG alignment",
      ],
      plazo: "Ongoing",
    },
    {
      n: "02", code: "EKORAEE", slug: "/en/ekoraee",
      title: "Certified electronic waste management",
      lede: "Collection, transport, storage, and certification of electrical and electronic equipment under Resolution 1297 of 2010 and Law 1672 of 2013.",
      deliverables: [
        "On-site or door-to-door collection",
        "Certified transport to authorized processor",
        "Final disposal certificates",
        "Integration with EKONSULTING post-consumer plan",
        "Target reporting to the authority",
      ],
      plazo: "Per campaign or ongoing",
    },
    {
      n: "03", code: "EKOPARTNER", slug: "/en/ekopartner",
      title: "Operation of waste management systems",
      lede: "We integrate and operate the organization's complete waste collection and disposal system. We don't just advise: we do it. Colombia only.",
      deliverables: [
        "Integral management system design",
        "Collection point operations",
        "Processor and carrier management",
        "End-to-end waste traceability",
        "Operational and regulatory reports",
      ],
      plazo: "Monthly retainer",
    },
    {
      n: "04", code: "EKOTRADING", slug: "/en/ekotrading",
      title: "Circular economy · buying and selling IT assets",
      lede: "We close the lifecycle of tech equipment within a circular economy framework. We buy and sell used or obsolete technology wholesale, with the traceability SDGs demand.",
      deliverables: [
        "Valuation and retrieval of obsolete IT assets",
        "Refurbishment and certification",
        "Remarketing in secondary markets",
        "Documentation for ESG reporting",
        "Integration with EKORAEE for non-refurbishable items",
      ],
      plazo: "Per batch or ongoing",
    },
  ],
}

/** Bloque "Forma de trabajo" de la misma página. */
export const FORMA_DE_TRABAJO = {
  es: {
    modalidades: 'Trabajamos por proyecto cerrado, como retainer mensual o en esquema híbrido. Sin letra pequeña.',
    diagnosticoMin: 45,
    diagnostico: 'Diagnóstico inicial sin costo',
  },
  en: {
    modalidades: 'We work per fixed project, as a monthly retainer, or in a hybrid scheme. No fine print.',
    diagnosticoMin: 45,
    diagnostico: 'Initial diagnostic at no cost',
  },
} as const
