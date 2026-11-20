/**
 * Formulario de cierre en el celular (/academia/sala/opinion): envía las
 * respuestas a la sala y muestra el agradecimiento, desde donde se pueden
 * corregir (se vuelve a enviar y se actualiza).
 */
import { API_SALA, enviar } from './comun'

const form = document.querySelector<HTMLFormElement>('[data-op-form]')
if (form) montar(form)

function montar(form: HTMLFormElement) {
  const estado = form.querySelector<HTMLElement>('[data-op-estado]')!
  const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
  const gracias = document.querySelector<HTMLElement>('[data-op-gracias]')!
  const campos = [...form.querySelectorAll('textarea')]
  const decir = (t: string, clase = '') => {
    estado.textContent = t
    estado.className = `sl-estado ${clase}`
  }
  form.addEventListener('input', () => estado.classList.contains('error') && decir(''))

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    if (!campos.some((c) => c.value.trim())) {
      decir('Responda al menos una pregunta.', 'error')
      campos[0]?.focus()
      return
    }
    boton.disabled = true
    decir('Enviando…')
    try {
      await enviar({ accion: 'opinion', respuestas: Object.fromEntries(campos.map((c) => [c.name, c.value])) }, 15_000, API_SALA)
      decir('')
      form.hidden = true
      gracias.hidden = false
      scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo enviar. Intente de nuevo.', 'error')
    } finally {
      boton.disabled = false
    }
  })

  gracias.querySelector<HTMLButtonElement>('[data-op-corregir]')!.addEventListener('click', () => {
    gracias.hidden = true
    form.hidden = false
    campos[0]?.focus()
  })
}
