/**
 * Convierte la respuesta de Claude (markdown sencillo) en HTML seguro para el
 * proyector: primero escapa todo y después reconoce tablas, listas, títulos y
 * negrillas. Módulo PURO; corre en el servidor y en el navegador.
 */

const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const enLinea = (s: string) => escapar(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')

const celdas = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
const esSeparador = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l)

export function aHtml(md: string): string {
  const lineas = md.replace(/\r/g, '').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lineas.length) {
    const l = lineas[i]!
    if (!l.trim()) {
      i++
      continue
    }
    // Tabla: fila de encabezado seguida de la fila separadora.
    if (l.includes('|') && i + 1 < lineas.length && esSeparador(lineas[i + 1]!)) {
      const cab = celdas(l)
      i += 2
      const filas: string[][] = []
      while (i < lineas.length && lineas[i]!.includes('|') && lineas[i]!.trim()) filas.push(celdas(lineas[i++]!))
      out.push(
        `<table><thead><tr>${cab.map((c) => `<th>${enLinea(c)}</th>`).join('')}</tr></thead><tbody>${filas
          .map((f) => `<tr>${f.map((c) => `<td>${enLinea(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`,
      )
      continue
    }
    const titulo = /^#{1,4}\s+(.*)$/.exec(l)
    if (titulo) {
      out.push(`<h4>${enLinea(titulo[1]!)}</h4>`)
      i++
      continue
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
      const ordenada = /^\s*\d/.test(l)
      const items: string[] = []
      while (i < lineas.length && /^\s*([-*•]|\d+[.)])\s+/.test(lineas[i]!)) items.push(lineas[i++]!.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))
      const tag = ordenada ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((x) => `<li>${enLinea(x)}</li>`).join('')}</${tag}>`)
      continue
    }
    const parrafo: string[] = []
    while (i < lineas.length && lineas[i]!.trim() && !/^\s*([-*•]|\d+[.)])\s+/.test(lineas[i]!) && !/^#{1,4}\s/.test(lineas[i]!) && !(lineas[i]!.includes('|') && esSeparador(lineas[i + 1] ?? ''))) {
      parrafo.push(lineas[i++]!)
    }
    out.push(`<p>${parrafo.map(enLinea).join('<br>')}</p>`)
  }
  return out.join('')
}
