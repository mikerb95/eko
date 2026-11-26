/**
 * Control de pagos a proveedores con los datos de Siigo. Módulo PURO: recibe
 * compras, cuentas por pagar y egresos ya traídos de Siigo (siigo.ts del
 * módulo) y devuelve alertas, el resumen por proveedor y el chequeo de un pago
 * antes de hacerlo.
 *
 * Es la misma idea del control de impuestos ("que los botones que se opriman
 * sean los correctos") llevada a los proveedores:
 * - una factura del proveedor registrada dos veces en Siigo,
 * - dos compras que parecen la misma (mismo proveedor, valor y fecha cercana),
 * - una factura con más pagado que su valor,
 * - dos egresos iguales al mismo proveedor en pocos días,
 * - lo vencido y lo que vence esta semana.
 * El sistema no paga ni registra nada en Siigo: avisa.
 */

export interface Compra {
  id: string
  /** Nombre del comprobante en Siigo, p. ej. `FC-1-73`. */
  nombre: string
  fecha: string
  proveedor: string // identificación (NIT o cédula) sin dígito
  /** Número de la factura del proveedor, `prefijo-número` o '' si no se registró. */
  facturaProveedor: string
  total: number
  saldo: number
}

export interface CuentaPorPagar {
  /** `FC-1-73`: prefijo + consecutivo del vencimiento. */
  documento: string
  cuota: number
  vence: string
  saldo: number
  proveedor: string
  proveedorNombre: string
  centroCosto: string
}

export interface Egreso {
  id: string
  nombre: string // RP-1-22
  fecha: string
  proveedor: string
  valor: number
  /** Documentos a los que se aplicó, `FC-1-73`. */
  aplicado: { documento: string; valor: number }[]
}

export type TipoAlerta = 'factura_repetida' | 'posible_duplicado' | 'pagada_de_mas' | 'egreso_repetido' | 'vencida' | 'por_vencer'

export interface Alerta {
  tipo: TipoAlerta
  grave: boolean
  titulo: string
  detalle: string
  proveedor: string
  proveedorNombre: string
  documentos: string[]
  valor: number
}

export const ALERTA_TEXTO: Record<TipoAlerta, string> = {
  factura_repetida: 'Factura del proveedor registrada dos veces',
  posible_duplicado: 'Compra que parece repetida',
  pagada_de_mas: 'Factura con más pagado que su valor',
  egreso_repetido: 'Pago que parece repetido',
  vencida: 'Cuenta por pagar vencida',
  por_vencer: 'Vence en los próximos 7 días',
}

/** Días entre compras para sospechar que son la misma. */
export const DIAS_DUPLICADO = 5
/** Días entre egresos iguales para sospechar un pago doble. */
export const DIAS_EGRESO = 3
/** Ventana de "por vencer", en días calendario. */
export const DIAS_POR_VENCER = 7
/** Diferencia en pesos que se tolera por redondeos de Siigo. */
const TOLERANCIA = 1

export const pesosTxt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')

/** `FC-1-73`, `fc 1 73` y `FC-01-073` comparan igual. */
export function normDoc(s: string): string {
  return String(s || '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((p) => (/^\d+$/.test(p) ? String(Number(p)) : p))
    .join('-')
}

/** Solo dígitos, sin ceros a la izquierda: así el NIT con o sin puntos compara igual. */
export function normNit(s: string): string {
  const d = String(s || '').replace(/\D/g, '')
  return d.replace(/^0+(?=\d)/, '')
}

const dia = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000
export const diasEntre = (a: string, b: string) => Math.round(dia(b) - dia(a))

function nombreDe(nit: string, cxp: readonly CuentaPorPagar[], nombres: ReadonlyMap<string, string>): string {
  return nombres.get(nit) || cxp.find((c) => normNit(c.proveedor) === nit)?.proveedorNombre || `NIT ${nit}`
}

export interface Revision {
  alertas: Alerta[]
  proveedores: { proveedor: string; nombre: string; porPagar: number; vencido: number; facturas: number; proximoVence: string | null }[]
  totales: { porPagar: number; vencido: number; porVencer: number; facturas: number; graves: number }
}

export function revisar(input: {
  compras: readonly Compra[]
  cxp: readonly CuentaPorPagar[]
  egresos: readonly Egreso[]
  hoy: string
  /** Nombres conocidos por NIT (de cuentas por pagar u otra fuente). */
  nombres?: ReadonlyMap<string, string>
}): Revision {
  const { compras, cxp, egresos, hoy } = input
  const nombres = new Map(input.nombres ?? [])
  for (const c of cxp) if (c.proveedorNombre) nombres.set(normNit(c.proveedor), c.proveedorNombre)
  const nom = (nit: string) => nombreDe(nit, cxp, nombres)
  const alertas: Alerta[] = []

  // 1. Misma factura del proveedor en dos compras.
  const porFactura = new Map<string, Compra[]>()
  for (const c of compras) {
    const f = normDoc(c.facturaProveedor)
    if (!f) continue
    const k = `${normNit(c.proveedor)}|${f}`
    porFactura.set(k, [...(porFactura.get(k) ?? []), c])
  }
  const yaRepetidas = new Set<string>()
  for (const grupo of porFactura.values()) {
    if (grupo.length < 2) continue
    const nit = normNit(grupo[0]!.proveedor)
    grupo.forEach((c) => yaRepetidas.add(c.id))
    alertas.push({
      tipo: 'factura_repetida',
      grave: true,
      titulo: ALERTA_TEXTO.factura_repetida,
      detalle: `La factura ${grupo[0]!.facturaProveedor} de ${nom(nit)} está en ${grupo.length} compras: ${grupo.map((c) => `${c.nombre} (${c.fecha}, ${pesosTxt(c.total)})`).join(', ')}. Si se paga cada una, se paga dos veces.`,
      proveedor: nit,
      proveedorNombre: nom(nit),
      documentos: grupo.map((c) => c.nombre),
      valor: grupo.reduce((a, c) => a + c.total, 0),
    })
  }

  // 2. Mismo proveedor, mismo valor, fechas cercanas (y no es una factura distinta a la vista).
  const ordenadas = [...compras].sort((a, b) => a.fecha.localeCompare(b.fecha))
  for (let i = 0; i < ordenadas.length; i++) {
    for (let j = i + 1; j < ordenadas.length; j++) {
      const a = ordenadas[i]!
      const b = ordenadas[j]!
      if (diasEntre(a.fecha, b.fecha) > DIAS_DUPLICADO) break
      if (normNit(a.proveedor) !== normNit(b.proveedor)) continue
      if (Math.abs(a.total - b.total) > TOLERANCIA || a.total <= 0) continue
      if (yaRepetidas.has(a.id) && yaRepetidas.has(b.id)) continue
      const fa = normDoc(a.facturaProveedor)
      const fb = normDoc(b.facturaProveedor)
      if (fa && fb && fa !== fb) continue // dos facturas distintas del mismo valor: normal
      const nit = normNit(a.proveedor)
      alertas.push({
        tipo: 'posible_duplicado',
        grave: false,
        titulo: ALERTA_TEXTO.posible_duplicado,
        detalle: `${a.nombre} (${a.fecha}) y ${b.nombre} (${b.fecha}) son de ${nom(nit)} por ${pesosTxt(a.total)}${fa || fb ? '' : ', y ninguna tiene el número de la factura del proveedor'}. Confirme que son dos compras distintas.`,
        proveedor: nit,
        proveedorNombre: nom(nit),
        documentos: [a.nombre, b.nombre],
        valor: a.total,
      })
    }
  }

  // 3. Más pagado que el valor de la factura.
  const pagado = new Map<string, { valor: number; egresos: string[] }>()
  for (const e of egresos) {
    for (const ap of e.aplicado) {
      const k = normDoc(ap.documento)
      if (!k) continue
      const x = pagado.get(k) ?? { valor: 0, egresos: [] }
      x.valor += ap.valor
      x.egresos.push(e.nombre)
      pagado.set(k, x)
    }
  }
  for (const c of compras) {
    const p = pagado.get(normDoc(c.nombre))
    if (!p || p.valor <= c.total + TOLERANCIA) continue
    const nit = normNit(c.proveedor)
    alertas.push({
      tipo: 'pagada_de_mas',
      grave: true,
      titulo: ALERTA_TEXTO.pagada_de_mas,
      detalle: `${c.nombre} de ${nom(nit)} vale ${pesosTxt(c.total)} y tiene ${pesosTxt(p.valor)} en pagos (${[...new Set(p.egresos)].join(', ')}). Sobran ${pesosTxt(p.valor - c.total)}.`,
      proveedor: nit,
      proveedorNombre: nom(nit),
      documentos: [c.nombre, ...new Set(p.egresos)],
      valor: p.valor - c.total,
    })
  }

  // 4. Dos egresos iguales al mismo proveedor en pocos días.
  const eg = [...egresos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  for (let i = 0; i < eg.length; i++) {
    for (let j = i + 1; j < eg.length; j++) {
      const a = eg[i]!
      const b = eg[j]!
      if (diasEntre(a.fecha, b.fecha) > DIAS_EGRESO) break
      if (normNit(a.proveedor) !== normNit(b.proveedor)) continue
      if (Math.abs(a.valor - b.valor) > TOLERANCIA || a.valor <= 0) continue
      const da = new Set(a.aplicado.map((x) => normDoc(x.documento)))
      const db = b.aplicado.map((x) => normDoc(x.documento))
      // Si se aplicaron a facturas distintas, son dos pagos legítimos.
      if (da.size && db.length && !db.some((d) => da.has(d))) continue
      const nit = normNit(a.proveedor)
      alertas.push({
        tipo: 'egreso_repetido',
        grave: true,
        titulo: ALERTA_TEXTO.egreso_repetido,
        detalle: `${a.nombre} (${a.fecha}) y ${b.nombre} (${b.fecha}) pagan ${pesosTxt(a.valor)} cada uno a ${nom(nit)}${da.size ? ' sobre la misma factura' : ''}. Revise con el extracto si salió dos veces.`,
        proveedor: nit,
        proveedorNombre: nom(nit),
        documentos: [a.nombre, b.nombre],
        valor: a.valor,
      })
    }
  }

  // 5 y 6. Vencidas y por vencer.
  const conSaldo = cxp.filter((c) => c.saldo > TOLERANCIA)
  for (const c of conSaldo) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(c.vence) ? diasEntre(hoy, c.vence) : null
    if (d == null || d > DIAS_POR_VENCER) continue
    const nit = normNit(c.proveedor)
    const vencida = d < 0
    alertas.push({
      tipo: vencida ? 'vencida' : 'por_vencer',
      grave: false,
      titulo: ALERTA_TEXTO[vencida ? 'vencida' : 'por_vencer'],
      detalle: `${c.documento}${c.cuota > 1 ? ` cuota ${c.cuota}` : ''} de ${nom(nit)}: ${pesosTxt(c.saldo)}, ${vencida ? `venció hace ${-d} día${d === -1 ? '' : 's'}` : d === 0 ? 'vence hoy' : `vence en ${d} día${d === 1 ? '' : 's'}`} (${c.vence}).`,
      proveedor: nit,
      proveedorNombre: nom(nit),
      documentos: [c.documento],
      valor: c.saldo,
    })
  }

  // Resumen por proveedor.
  const grupos = new Map<string, CuentaPorPagar[]>()
  for (const c of conSaldo) {
    const k = normNit(c.proveedor)
    grupos.set(k, [...(grupos.get(k) ?? []), c])
  }
  const proveedores = [...grupos.entries()]
    .map(([nit, cs]) => {
      const fechas = cs.map((c) => c.vence).filter(Boolean).sort()
      return {
        proveedor: nit,
        nombre: nom(nit),
        porPagar: Math.round(cs.reduce((a, c) => a + c.saldo, 0)),
        vencido: Math.round(cs.filter((c) => c.vence && c.vence < hoy).reduce((a, c) => a + c.saldo, 0)),
        facturas: cs.length,
        proximoVence: fechas.find((f) => f >= hoy) ?? fechas[0] ?? null,
      }
    })
    .sort((a, b) => b.vencido - a.vencido || b.porPagar - a.porPagar)

  const orden: TipoAlerta[] = ['factura_repetida', 'egreso_repetido', 'pagada_de_mas', 'posible_duplicado', 'vencida', 'por_vencer']
  alertas.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo) || b.valor - a.valor)

  return {
    alertas,
    proveedores,
    totales: {
      porPagar: Math.round(conSaldo.reduce((a, c) => a + c.saldo, 0)),
      vencido: Math.round(conSaldo.filter((c) => c.vence && c.vence < hoy).reduce((a, c) => a + c.saldo, 0)),
      porVencer: Math.round(conSaldo.filter((c) => c.vence >= hoy && diasEntre(hoy, c.vence) <= DIAS_POR_VENCER).reduce((a, c) => a + c.saldo, 0)),
      facturas: conSaldo.length,
      graves: alertas.filter((a) => a.grave).length,
    },
  }
}

// ------------------------------------------------------------------ antes de pagar

export interface ChequeoProveedor {
  id: 'registrada' | 'unica' | 'saldo' | 'valor' | 'sin_pago_reciente'
  titulo: string
  ok: boolean
  detalle: string
}

/**
 * Antes de pagarle a un proveedor: la factura está registrada en Siigo una
 * sola vez, tiene saldo pendiente, el valor no supera el saldo y no hay un
 * egreso reciente igual. `factura` puede ser el número del proveedor
 * (`FE-1234`) o el comprobante de Siigo (`FC-1-73`).
 */
export function verificarPago(input: {
  nit: string
  factura: string
  valor: number
  compras: readonly Compra[]
  cxp: readonly CuentaPorPagar[]
  egresos: readonly Egreso[]
  hoy: string
  /** Desde qué fecha se trajeron las compras: va en el mensaje si no aparece. */
  desde?: string
}): { chequeos: ChequeoProveedor[]; ok: boolean; proveedorNombre: string } {
  const nit = normNit(input.nit)
  const f = normDoc(input.factura)
  const valor = Math.round(input.valor)
  const delProveedor = input.compras.filter((c) => normNit(c.proveedor) === nit)
  const coinciden = delProveedor.filter((c) => normDoc(c.facturaProveedor) === f || normDoc(c.nombre) === f)
  // Si escribieron el comprobante de Siigo (FC-1-73) de una compra más vieja
  // que la ventana consultada, se reconoce por lo que sigue pendiente.
  const pendientePorComprobante = !coinciden.length ? input.cxp.filter((c) => normNit(c.proveedor) === nit && normDoc(c.documento) === f) : []
  const compra: Compra | undefined =
    coinciden[0] ??
    (pendientePorComprobante.length
      ? { id: '', nombre: pendientePorComprobante[0]!.documento, fecha: '', proveedor: nit, facturaProveedor: '', total: 0, saldo: pendientePorComprobante.reduce((a, c) => a + c.saldo, 0) }
      : undefined)
  const nombre = input.cxp.find((c) => normNit(c.proveedor) === nit)?.proveedorNombre || `NIT ${nit}`
  const ventana = input.desde ? ` desde el ${input.desde}` : ''
  const out: ChequeoProveedor[] = []

  out.push({
    id: 'registrada',
    titulo: 'La factura está registrada en Siigo',
    ok: !!compra,
    detalle: compra
      ? compra.fecha
        ? `${compra.nombre} del ${compra.fecha} por ${pesosTxt(compra.total)}.`
        : `${compra.nombre} figura en las cuentas por pagar.`
      : delProveedor.length
        ? `No hay una compra de ${nombre} con la factura ${input.factura}${ventana}. Si es más vieja, búsquela por el comprobante de Siigo (FC-...); si no, regístrela antes de pagar.`
        : `No hay compras de ese NIT en Siigo${ventana}. Revise el NIT o registre la factura.`,
  })

  out.push({
    id: 'unica',
    titulo: 'La factura está una sola vez',
    ok: coinciden.length <= 1,
    detalle: coinciden.length > 1 ? `Aparece en ${coinciden.map((c) => c.nombre).join(', ')}: aclare cuál vale antes de pagar.` : 'Sin registros repetidos.',
  })

  const pendientes = compra ? input.cxp.filter((c) => normNit(c.proveedor) === nit && normDoc(c.documento) === normDoc(compra.nombre)) : []
  const saldo = pendientes.length ? pendientes.reduce((a, c) => a + c.saldo, 0) : (compra?.saldo ?? 0)
  out.push({
    id: 'saldo',
    titulo: 'Tiene saldo pendiente de pago',
    ok: !!compra && saldo > TOLERANCIA,
    detalle: !compra ? 'Sin factura no hay saldo que revisar.' : saldo > TOLERANCIA ? `Saldo en Siigo: ${pesosTxt(saldo)}.` : 'En Siigo ya figura pagada (saldo cero).',
  })

  out.push({
    id: 'valor',
    titulo: 'El valor no supera el saldo',
    ok: !!compra && valor > 0 && valor <= saldo + TOLERANCIA,
    detalle: !compra
      ? 'Sin factura no hay con qué comparar.'
      : valor <= 0
        ? 'Escriba el valor a pagar.'
        : valor <= saldo + TOLERANCIA
          ? valor < saldo - TOLERANCIA
            ? `${pesosTxt(valor)} es un abono: quedarían ${pesosTxt(saldo - valor)}.`
            : `${pesosTxt(valor)}, igual al saldo.`
          : `${pesosTxt(valor)} supera el saldo de ${pesosTxt(saldo)} por ${pesosTxt(valor - saldo)}.`,
  })

  const recientes = input.egresos.filter((e) => normNit(e.proveedor) === nit && diasEntre(e.fecha, input.hoy) <= 30 && diasEntre(e.fecha, input.hoy) >= 0)
  const igual = recientes.find((e) => Math.abs(e.valor - valor) <= TOLERANCIA || (compra && e.aplicado.some((a) => normDoc(a.documento) === normDoc(compra.nombre))))
  out.push({
    id: 'sin_pago_reciente',
    titulo: 'No hay un pago igual en los últimos 30 días',
    ok: !igual,
    detalle: igual ? `${igual.nombre} del ${igual.fecha} le pagó ${pesosTxt(igual.valor)} a ${nombre}${compra && igual.aplicado.some((a) => normDoc(a.documento) === normDoc(compra.nombre)) ? ' sobre esta misma factura' : ''}. Confirme que no es el mismo pago.` : 'Sin pagos iguales recientes.',
  })

  return { chequeos: out, ok: out.every((c) => c.ok), proveedorNombre: nombre }
}

// ------------------------------------------------------------------ desde Siigo

const n = (v: unknown) => Number(v) || 0
const s = (v: unknown) => (v == null ? '' : String(v))

/** Compra de Siigo (`GET /v1/purchases`) al formato del módulo. */
export function compraDeSiigo(x: any): Compra {
  const pi = x?.provider_invoice
  return {
    id: s(x?.id),
    nombre: s(x?.name),
    fecha: s(x?.date).slice(0, 10),
    proveedor: normNit(s(x?.supplier?.identification)),
    facturaProveedor: pi?.number ? [pi.prefix, pi.number].filter((p) => p != null && p !== '').join('-') : '',
    total: n(x?.total),
    saldo: n(x?.balance),
  }
}

/** Vencimiento de `GET /v1/accounts-payable`. */
export function cxpDeSiigo(x: any): CuentaPorPagar {
  const d = x?.due ?? {}
  return {
    documento: [d.prefix, d.consecutive].filter((p) => p != null && p !== '').join('-'),
    cuota: n(d.quote) || 1,
    vence: s(d.date).slice(0, 10),
    saldo: n(d.balance),
    proveedor: normNit(s(x?.provider?.identification)),
    proveedorNombre: s(x?.provider?.name).trim(),
    centroCosto: s(x?.cost_center?.name),
  }
}

/** Recibo de pago o egreso de `GET /v1/payment-receipts`. */
export function egresoDeSiigo(x: any): Egreso {
  const items: any[] = Array.isArray(x?.items) ? x.items : []
  const pagos: any[] = Array.isArray(x?.payment) ? x.payment : x?.payment ? [x.payment] : []
  const aplicado = items
    .filter((i) => i?.due?.prefix || i?.due?.consecutive)
    .map((i) => ({ documento: [i.due.prefix, i.due.consecutive].filter((p: unknown) => p != null && p !== '').join('-'), valor: n(i.value) }))
  const valorPagos = pagos.reduce((a, p) => a + n(p?.value), 0)
  return {
    id: s(x?.id),
    nombre: s(x?.name),
    fecha: s(x?.date).slice(0, 10),
    proveedor: normNit(s(x?.supplier?.identification)),
    valor: valorPagos || aplicado.reduce((a, i) => a + i.valor, 0),
    aplicado,
  }
}
