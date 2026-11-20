/**
 * Logo de Claude (la chispa naranja) como SVG en texto, para marcar los
 * momentos en que Claude está pensando. Lo usan las maquetas de la práctica
 * guiada (Maqueta.astro, con set:html) y la demo de la escena Pedir
 * (src/scripts/taller/escenas.ts, con innerHTML). La animación vive en
 * src/styles/chispa.css: con la clase `chispa-pensando` gira a saltos y los
 * rayos respiran; sin ella queda quieta.
 *
 * Doce rayos de largo desigual que se afinan hacia el centro, como el logo.
 */
const LARGOS = [46, 37, 43, 34, 45, 38, 42, 35, 46, 39, 41, 36]

function rayo(i: number, largo: number): string {
  const ang = (i / LARGOS.length) * Math.PI * 2 + (i % 2 ? 0.05 : -0.03)
  const cos = Math.cos(ang)
  const sin = Math.sin(ang)
  const p = (r: number, t: number) => {
    const x = 50 + r * cos - t * sin
    const y = 50 + r * sin + t * cos
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  }
  const base = 0
  const punta = largo - 4
  return `<path style="--i:${i}" d="M${p(base, -2)} L${p(punta, -4.2)} A4.2 4.2 0 0 1 ${p(punta, 4.2)} L${p(base, 2)} Z"/>`
}

const RAYOS = LARGOS.map((l, i) => rayo(i, l)).join('')

/** SVG del logo. `pensando` lo anima; `clase` agrega clases propias. */
export function chispa(pensando = true, clase = ''): string {
  const cls = ['chispa', pensando ? 'chispa-pensando' : '', clase].filter(Boolean).join(' ')
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g>${RAYOS}</g></svg>`
}
