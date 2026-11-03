// Pinta en el navegador la revisión del revisor de instrucciones (respuesta de
// /api/academia, acción "practicar"). Todo el texto de la IA se escapa.

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const CRITERIO: Record<string, string> = { contexto: 'Contexto', tarea: 'Tarea', formato: 'Formato', ejemplos: 'Ejemplos' }
const NIVEL: Record<string, string> = { bien: 'Bien', mejorable: 'Mejorable', falta: 'Falta' }

interface Revision {
  criterios: { id: string; nivel: string; comentario: string }[]
  datos_sensibles: string
  resumen: string
  version_mejorada: string
  datos_ocultos: boolean
}

export function pintarRevision(r: { respuesta: string; revision: Revision }): string {
  const v = r.revision
  const avisos = [
    v.datos_ocultos && 'Su instrucción traía correos o números de documento o teléfono. Se ocultaron antes de enviarla a la IA.',
    v.datos_sensibles,
  ].filter(Boolean)
  return `
    <h3>Así quedó su instrucción</h3>
    ${v.resumen ? `<p class="ac-resumen">${esc(v.resumen)}</p>` : ''}
    ${avisos.length ? `<div class="ac-aviso-datos">${avisos.map((a) => `<p>${esc(a)}</p>`).join('')}</div>` : ''}
    <ul class="ac-criterios">
      ${v.criterios
        .map(
          (c) => `<li class="n-${esc(c.nivel)}">
            <span class="ac-crit-head"><b>${esc(CRITERIO[c.id] ?? c.id)}</b><span class="ac-nivel">${esc(NIVEL[c.nivel] ?? c.nivel)}</span></span>
            <p>${esc(c.comentario)}</p>
          </li>`,
        )
        .join('')}
    </ul>
    ${
      v.version_mejorada
        ? `<figure class="ac-prompt ac-mejorada">
            <figcaption><b>Una versión mejorada</b><span><button type="button" class="ac-copiar" data-copiar>Copiar</button> <button type="button" class="ac-copiar" data-usar-mejorada>Editar esta versión</button></span></figcaption>
            <pre>${esc(v.version_mejorada)}</pre>
          </figure>`
        : ''
    }
    <details class="ac-respuesta">
      <summary>Lo que respondió la IA con su instrucción tal como está</summary>
      <pre>${esc(r.respuesta)}</pre>
    </details>`
}
