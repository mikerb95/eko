// Consulta de talento humano (src/lib/talento/). Solo admin la recibe
// (permisos.ts) y es de solo lectura: el asistente no propone cambios aquí.
//
// Nunca salen el salario, el documento de identidad, el celular, el correo
// personal, el contacto de emergencia ni los fondos de seguridad social: el
// modelo no los necesita para responder "¿quién tiene el examen vencido?" o
// "¿cuántos días de vacaciones le quedan a X?". Los saldos y vencimientos los
// calcula src/lib/talento/reglas.ts, nunca el modelo.

import { z } from 'zod'
import { leerEstado, type EstadoTalento, type Persona } from '../../talento/datos.ts'
import { AREAS_EMPRESA, TIPOS_CONTRATO, TIPOS_NOVEDAD, ausenciasEntre, estaActivo, etiquetaDe, masDias } from '../../talento/reglas.ts'
import { ok, textoSeguro, type Herramienta } from './tipos.ts'

const enlace = (id: number, ver?: string) => `/admin/talento?persona=${id}${ver ? `&ver=${ver}` : ''}`

const esquema = z.object({
  que: z
    .enum(['vencimientos', 'personas', 'vacaciones', 'ausencias', 'solicitudes', 'formacion', 'evaluaciones'])
    .describe('Qué consultar'),
  persona: z.string().trim().max(80).optional().describe('Nombre (o parte) de la persona, para filtrar'),
  dias: z.number().int().min(1).max(120).optional().describe('Solo ausencias: cuántos días hacia adelante mirar (por defecto 14)'),
})

function filtrar(e: EstadoTalento, persona?: string): Persona[] {
  if (!persona) return e.personas
  const plano = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
  const q = plano(persona)
  return e.personas.filter((p) => plano(p.nombre).includes(q))
}

export const TALENTO: Herramienta = {
  nombre: 'talento_humano',
  area: 'talento',
  descripcion:
    'Talento humano del equipo de Ekosolv: vencimientos (documentos, cursos, contratos, períodos de prueba, evaluaciones), personas con cargo y contrato, saldo de vacaciones, ausencias, solicitudes por aprobar, formación y evaluaciones de desempeño. Úsela para "¿quién tiene el examen vencido?", "¿cuántos días de vacaciones le quedan a X?" o "¿quién está de vacaciones la otra semana?". No trae salarios ni datos de contacto.',
  esquema,
  async ejecutar(args: z.infer<typeof esquema>, { db, hoy }) {
    const e = await leerEstado(db, hoy)
    const personas = filtrar(e, args.persona)
    const ids = new Set(personas.map((p) => p.usuario_id))
    const nombre = new Map(e.personas.map((p) => [p.usuario_id, p.nombre]))
    const cargo = new Map(e.cargos.map((c) => [c.id, c.nombre]))
    const de = (id: number) => nombre.get(id) ?? 'Persona sin cuenta'

    if (args.que === 'vencimientos') {
      return ok({
        hoy,
        vencimientos: e.avisos.filter((a) => ids.has(a.usuario_id)).map((a) => ({
          persona: de(a.usuario_id),
          que: a.titulo,
          tipo: a.tipo,
          detalle: a.detalle,
          fecha: a.fecha,
          diasQueFaltan: a.dias,
          nivel: a.nivel,
          enlace: enlace(a.usuario_id),
        })),
      })
    }

    if (args.que === 'personas' || args.que === 'vacaciones') {
      return ok({
        personas: personas.map((p) => {
          const f = p.ficha
          const s = e.saldos[p.usuario_id]
          return {
            nombre: p.nombre,
            activa: estaActivo(f, hoy),
            tieneFicha: !!f,
            cargo: f?.cargo_id ? cargo.get(f.cargo_id) ?? null : null,
            area: f?.area ? etiquetaDe(AREAS_EMPRESA, f.area) : null,
            contrato: f?.tipo_contrato ? etiquetaDe(TIPOS_CONTRATO, f.tipo_contrato) : null,
            ingreso: f?.fecha_ingreso || null,
            finContrato: f?.fecha_fin_contrato || null,
            retiro: f?.fecha_retiro || null,
            jefe: f?.jefe || null,
            vacaciones: !s
              ? null
              : !s.aplica
                ? 'Su contrato no causa vacaciones'
                : s.sinIngreso
                  ? 'Falta la fecha de ingreso para calcularlas'
                  : { diasHabilesDisponibles: s.saldo, causadas: s.causadas, disfrutadas: s.tomadas + s.ajuste, programadas: s.programadas, porAprobar: s.porAprobar },
            enlace: enlace(p.usuario_id, args.que === 'vacaciones' ? 'novedades' : undefined),
          }
        }),
      })
    }

    if (args.que === 'ausencias' || args.que === 'solicitudes') {
      const lista =
        args.que === 'ausencias'
          ? ausenciasEntre(e.novedades, hoy, masDias(hoy, args.dias ?? 14))
          : e.novedades.filter((n) => n.estado === 'solicitada')
      return ok({
        hoy,
        novedades: lista.filter((n) => ids.has(n.usuario_id)).map((n) => ({
          persona: de(n.usuario_id),
          tipo: etiquetaDe(TIPOS_NOVEDAD, n.tipo),
          desde: n.desde,
          hasta: n.hasta,
          diasHabiles: n.dias_habiles,
          estado: n.estado,
          // En incapacidades no se pasa el motivo: podría traer un diagnóstico.
          motivo: n.tipo === 'incapacidad' ? null : textoSeguro(n.motivo, 200),
          enlace: enlace(n.usuario_id, 'novedades'),
        })),
      })
    }

    if (args.que === 'formacion') {
      const curso = new Map(e.cursos.map((c) => [c.id, c.nombre]))
      return ok({
        formacion: e.formaciones.filter((f) => ids.has(f.usuario_id)).slice(0, 80).map((f) => ({
          persona: de(f.usuario_id),
          curso: curso.get(f.curso_id) ?? 'Curso',
          fecha: f.fecha,
          venceEl: f.vence_el || null,
          enlace: enlace(f.usuario_id, 'formacion'),
        })),
      })
    }

    return ok({
      evaluaciones: e.evaluaciones.filter((v) => ids.has(v.usuario_id)).slice(0, 40).map((v) => ({
        persona: de(v.usuario_id),
        cargo: v.cargo || null,
        periodo: v.periodo || null,
        fecha: v.fecha,
        estado: v.estado,
        promedio: v.promedio,
        criterios: v.calificaciones.map((c) => ({ nombre: c.nombre, nota: c.nota })),
        metas: textoSeguro(v.metas, 400),
        enlace: enlace(v.usuario_id, 'desempeno'),
      })),
    })
  },
}
