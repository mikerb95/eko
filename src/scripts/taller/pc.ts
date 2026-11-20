/**
 * /pc: vincula este PC con el código de dos números del celular. Al
 * escribir el segundo número se envía solo.
 */
import { enviar } from './comun'

const form = document.querySelector<HTMLFormElement>('[data-pc]')
if (form) {
  const input = form.querySelector<HTMLInputElement>('input[name="codigo"]')!
  const boton = form.querySelector<HTMLButtonElement>('button')!
  const estado = form.querySelector<HTMLElement>('[data-pc-estado]')!
  const decir = (t: string, clase = '') => {
    estado.textContent = t
    estado.className = `sl-estado ${clase}`
  }
  const vincular = async () => {
    const codigo = input.value.replace(/\D/g, '')
    if (codigo.length !== 2) {
      decir('Escriba los dos números que le muestra el celular.', 'error')
      input.focus()
      return
    }
    boton.disabled = true
    decir('Abriendo…')
    try {
      const r = await enviar<{ url: string }>({ codigo }, 15_000, '/api/academia/pc')
      location.assign(r.url)
    } catch (err) {
      decir(err instanceof Error ? err.message : 'No se pudo abrir. Intente de nuevo.', 'error')
      input.select()
      boton.disabled = false
    }
  }
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 2)
    if (estado.classList.contains('error')) decir('')
    if (input.value.length === 2) void vincular()
  })
  form.addEventListener('submit', (ev) => {
    ev.preventDefault()
    void vincular()
  })
}
