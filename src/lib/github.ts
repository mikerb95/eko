// Acceso de desarrollo con GitHub (OAuth App). Solo servidor.
//
// Es la puerta del desarrollador, no la de Ekosolv: entra únicamente la cuenta
// cuyo id numérico está en DEV_GITHUB_IDS (o en GITHUB_DEV_IDS del entorno). Se
// compara por id y no por usuario porque un nombre de GitHub se puede cambiar y
// otra persona puede quedarse con el viejo; el id no cambia nunca.
//
// Variables: GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET (de la OAuth App creada en
// github.com/settings/developers). Sin ellas el botón no aparece y las rutas
// responden que el acceso no está configurado.

/** mikerb95 (Mike, desarrollador del sitio). */
const DEV_GITHUB_IDS = [69970540]

export const GITHUB_STATE_COOKIE = 'eko_gh_state'

function env(key: string): string {
  return (import.meta.env as any)?.[key] || (process.env as any)?.[key] || ''
}

export function githubConfigurado(): boolean {
  return !!(env('GITHUB_CLIENT_ID') && env('GITHUB_CLIENT_SECRET'))
}

function idsPermitidos(): number[] {
  const extra = env('GITHUB_DEV_IDS')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
  return [...DEV_GITHUB_IDS, ...extra]
}

export function urlAutorizacion(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: env('GITHUB_CLIENT_ID'),
    redirect_uri: `${origin}/api/admin/github/callback`,
    state,
    // Sin scopes: basta con el perfil público para leer el id.
    scope: '',
    allow_signup: 'false',
  })
  return `https://github.com/login/oauth/authorize?${p}`
}

export interface CuentaGithub {
  id: number
  login: string
  name: string
}

/** Cambia el código por un token y devuelve la cuenta, o null si algo falla. */
export async function cuentaDesdeCodigo(code: string, origin: string): Promise<CuentaGithub | null> {
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: env('GITHUB_CLIENT_ID'),
      client_secret: env('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: `${origin}/api/admin/github/callback`,
    }),
  })
  const t: any = await r.json().catch(() => ({}))
  if (!r.ok || typeof t.access_token !== 'string') return null

  const u = await fetch('https://api.github.com/user', {
    headers: { authorization: `Bearer ${t.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'eko-panel' },
  })
  const d: any = await u.json().catch(() => ({}))
  if (!u.ok || !Number.isInteger(d.id) || typeof d.login !== 'string') return null
  return { id: d.id, login: d.login, name: String(d.name || d.login) }
}

export function esDesarrollador(c: CuentaGithub): boolean {
  return idsPermitidos().includes(c.id)
}
