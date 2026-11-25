/**
 * Control antes de pagar: "que los botones que se opriman sean los
 * correctos". Módulo PURO, se recalcula cada vez que alguien mira un pago.
 *
 * Cuatro chequeos, los de la oferta:
 * 1. Esa obligación y ese periodo no están pagados ya (ni por otro pago, ni
 *    por otra obligación del mismo tipo y periodo cargada dos veces), y la
 *    referencia de pago no se ha usado en otro pago.
 * 2. El valor coincide con el borrador aprobado, peso por peso.
 * 3. La entidad, la referencia y la cuenta de origen están autorizadas.
 * 4. Gerencia dio el visto bueno, y quien aprueba no es quien preparó.
 *
 * Además arma la lista de verificación por pantalla (portal de la entidad y
 * banco) con los datos exactos que se deben ver antes de confirmar. El sistema
 * no entra a ningún portal: la persona compara y marca.
 */
import { ROL_APRUEBA } from './estados.ts'

export interface Cuenta {
  id: number
  alias: string
  banco: string
  tipo: string
  ultimos: string
  activa: boolean
}

export interface Entidad {
  codigo: string
  nombre: string
  nit: string
  medio: string
  formulario_pago: string
  activa: boolean
}

export interface ObligacionControl {
  id: number
  tipo: string
  concepto: string
  entidad: string
  periodo: string
  formulario: string
  estado: string
  valor_borrador: number | null
}

export interface PagoControl {
  id?: number
  obligacion_id: number
  valor: number
  entidad: string
  referencia: string
  cuenta_id: number | null
  estado?: string
  preparado_por: string
  aprobado_por?: string
  aprobado_rol?: string
}

/** Otro pago registrado, con el tipo y periodo de su obligación. */
export interface PagoExistente {
  id: number
  obligacion_id: number
  tipo: string
  periodo: string
  referencia: string
  estado: string
}

export interface Chequeo {
  id: 'no_pagado' | 'referencia_unica' | 'valor' | 'entidad' | 'referencia' | 'cuenta' | 'aprobacion'
  titulo: string
  /** `null` = todavía no aplica (la aprobación antes de que Gerencia la dé). */
  ok: boolean | null
  detalle: string
}

/** Estados de pago que cuentan como "ya se pagó o se va a pagar". */
const PAGOS_VIGENTES = ['por_aprobar', 'aprobado', 'pagado']

export const pesos = (n: number | null | undefined) =>
  n == null ? 'sin valor' : '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.')

const normRef = (s: string) => String(s || '').replace(/[\s.-]/g, '').toUpperCase()

export function chequear(input: {
  obligacion: ObligacionControl
  pago: PagoControl
  otrosPagos: readonly PagoExistente[]
  cuentas: readonly Cuenta[]
  entidades: readonly Entidad[]
}): Chequeo[] {
  const { obligacion: o, pago: p, cuentas, entidades } = input
  const otros = input.otrosPagos.filter((x) => x.id !== p.id && PAGOS_VIGENTES.includes(x.estado))
  const out: Chequeo[] = []

  // 1. No pagado ya.
  const yaPagada = o.estado === 'pagado' || o.estado === 'presentado'
  const mismoPago = otros.find((x) => x.obligacion_id === o.id)
  const mismoPeriodo = otros.find((x) => x.obligacion_id !== o.id && x.tipo === o.tipo && x.periodo === o.periodo)
  out.push({
    id: 'no_pagado',
    titulo: 'Esta obligación y este periodo no están pagados',
    ok: !yaPagada && !mismoPago && !mismoPeriodo,
    detalle: yaPagada
      ? 'La obligación ya figura como pagada.'
      : mismoPago
        ? `Ya hay otro pago de esta obligación (pago #${mismoPago.id}, ${mismoPago.estado.replace('_', ' ')}).`
        : mismoPeriodo
          ? `Ya hay un pago del mismo impuesto y periodo en otra obligación (pago #${mismoPeriodo.id}). Puede estar cargada dos veces.`
          : `Sin pagos previos de ${o.periodo}.`,
  })

  const ref = normRef(p.referencia)
  const refUsada = ref ? otros.find((x) => normRef(x.referencia) === ref) : undefined
  out.push({
    id: 'referencia_unica',
    titulo: 'La referencia de pago no se ha usado antes',
    ok: !!ref && !refUsada,
    detalle: !ref ? 'Falta la referencia.' : refUsada ? `La referencia ya está en el pago #${refUsada.id}.` : 'Referencia nueva.',
  })

  // 2. Valor igual al borrador.
  const borrador = o.valor_borrador
  out.push({
    id: 'valor',
    titulo: 'El valor coincide con el borrador aprobado',
    ok: !!borrador && borrador > 0 && p.valor === borrador,
    detalle: !borrador
      ? 'La obligación no tiene valor de borrador.'
      : p.valor === borrador
        ? `${pesos(p.valor)}, igual al borrador.`
        : `El pago dice ${pesos(p.valor)} y el borrador ${pesos(borrador)} (diferencia de ${pesos(Math.abs(p.valor - borrador))}).`,
  })

  // 3. Entidad, referencia y cuenta autorizadas.
  const ent = entidades.find((e) => e.codigo === p.entidad)
  const entOk = !!ent && ent.activa && p.entidad === o.entidad
  out.push({
    id: 'entidad',
    titulo: 'La entidad es la que corresponde y está autorizada',
    ok: entOk,
    detalle: !ent
      ? `La entidad "${p.entidad}" no está en la lista autorizada.`
      : !ent.activa
        ? `${ent.nombre} está desactivada en la lista autorizada.`
        : p.entidad !== o.entidad
          ? `Esta obligación se paga a ${o.entidad}, no a ${ent.nombre}.`
          : `${ent.nombre}${ent.nit ? ` (NIT ${ent.nit})` : ''}.`,
  })

  const formatoOk = /^[A-Z0-9]{6,30}$/.test(ref)
  out.push({
    id: 'referencia',
    titulo: 'La referencia tiene el formato de la entidad',
    ok: formatoOk,
    detalle: formatoOk
      ? `${ent?.formulario_pago || 'Referencia'} ${p.referencia}.`
      : 'La referencia debe tener entre 6 y 30 letras o números (el número del recibo o formulario de pago).',
  })

  const cuenta = cuentas.find((c) => c.id === p.cuenta_id)
  out.push({
    id: 'cuenta',
    titulo: 'La cuenta de origen está autorizada',
    ok: !!cuenta && cuenta.activa,
    detalle: !cuenta
      ? 'No se eligió una cuenta autorizada.'
      : !cuenta.activa
        ? `La cuenta ${cuenta.alias} está desactivada.`
        : `${cuenta.banco} ${cuenta.tipo} terminada en ${cuenta.ultimos}.`,
  })

  // 4. Visto bueno de Gerencia, distinta de quien preparó.
  const aprobador = p.aprobado_por || ''
  out.push({
    id: 'aprobacion',
    titulo: 'Gerencia dio el visto bueno (quien prepara no aprueba)',
    ok: !aprobador ? null : p.aprobado_rol === ROL_APRUEBA && aprobador !== p.preparado_por,
    detalle: !aprobador
      ? 'Pendiente del visto bueno de Gerencia.'
      : aprobador === p.preparado_por
        ? 'Quien aprobó es la misma persona que preparó el pago.'
        : p.aprobado_rol !== ROL_APRUEBA
          ? 'Quien aprobó no tiene el rol de Gerencia.'
          : `Aprobado por ${aprobador}.`,
  })

  return out
}

/** Los chequeos 1 a 3 en verde: el pago se puede enviar a Gerencia. */
export function listoParaAprobar(ch: readonly Chequeo[]): boolean {
  return ch.filter((c) => c.id !== 'aprobacion').every((c) => c.ok === true)
}

/** Todo en verde, aprobación incluida: se puede pagar. */
export function listoParaPagar(ch: readonly Chequeo[]): boolean {
  return ch.every((c) => c.ok === true)
}

/** Puede `quien` (con `rol`) aprobar este pago. */
export function puedeAprobar(p: PagoControl, quien: string, rol: string): { ok: true } | { ok: false; motivo: string } {
  if (rol !== ROL_APRUEBA) return { ok: false, motivo: 'Solo Gerencia aprueba pagos.' }
  if (quien === p.preparado_por) return { ok: false, motivo: 'Quien preparó el pago no puede aprobarlo.' }
  if (p.estado && p.estado !== 'por_aprobar') return { ok: false, motivo: 'El pago no está esperando aprobación.' }
  return { ok: true }
}

export interface PasoVerificacion {
  id: string
  pantalla: string
  texto: string
}

/**
 * Lista de verificación por pantalla, con los datos exactos que se deben ver.
 * Los `id` son estables: lo marcado se guarda con el pago.
 */
export function listaVerificacion(input: {
  obligacion: ObligacionControl
  pago: PagoControl
  cuenta: Cuenta | null
  entidad: Entidad | null
  nit: string
  dv: string
}): PasoVerificacion[] {
  const { obligacion: o, pago: p, cuenta, entidad, nit, dv } = input
  const nitTxt = `${nit}-${dv}`
  const valor = pesos(p.valor)
  const portal =
    o.entidad === 'DIAN' ? 'Portal de la DIAN' : o.entidad === 'SDH' ? 'Oficina virtual de Hacienda Bogotá' : o.entidad === 'PILA' ? 'Operador de la PILA' : `Portal de ${entidad?.nombre || o.entidad}`
  const pasos: PasoVerificacion[] = [
    { id: 'portal_nit', pantalla: portal, texto: `El NIT de la declaración es ${nitTxt}.` },
    { id: 'portal_periodo', pantalla: portal, texto: `El periodo es ${o.periodo}${o.formulario ? ` (formulario ${o.formulario})` : ''}.` },
    { id: 'portal_valor', pantalla: portal, texto: `El total a pagar es ${valor}.` },
    { id: 'portal_referencia', pantalla: portal, texto: `El ${entidad?.formulario_pago || 'recibo de pago'} tiene el número ${p.referencia}.` },
    { id: 'banco_cuenta', pantalla: 'Banco o PSE', texto: cuenta ? `Paga desde ${cuenta.banco} ${cuenta.tipo} terminada en ${cuenta.ultimos}.` : 'Paga desde la cuenta autorizada.' },
    { id: 'banco_beneficiario', pantalla: 'Banco o PSE', texto: `El beneficiario es ${entidad?.nombre || o.entidad}${entidad?.nit ? ` (NIT ${entidad.nit})` : ''}.` },
    { id: 'banco_valor', pantalla: 'Banco o PSE', texto: `El valor en la pantalla del banco es exactamente ${valor}.` },
    { id: 'banco_referencia', pantalla: 'Banco o PSE', texto: `La referencia de pago es ${p.referencia}.` },
    { id: 'banco_comprobante', pantalla: 'Después de pagar', texto: 'Descargó el comprobante del banco para subirlo al expediente.' },
  ]
  return pasos
}

/** ¿Marcó todos los pasos de la lista? */
export function verificacionCompleta(pasos: readonly PasoVerificacion[], marcados: readonly string[]): boolean {
  return pasos.every((p) => marcados.includes(p.id))
}
