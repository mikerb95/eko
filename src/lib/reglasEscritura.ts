// Autorización por rol de las escrituras del panel. GET (lectura) lo permite
// cualquier sesión; las escrituras se restringen por área.
//
// Vive aparte del middleware para que el asistente del panel
// (src/lib/asistente/permisos.ts) lea la misma tabla: si un rol pierde el
// permiso de escribir en un área, también pierde el de proponer cambios en
// ella desde el chat. Módulo PURO.

export const WRITE_RULES: ReadonlyArray<{ prefix: string; roles: readonly string[] }> = [
  { prefix: '/api/admin/users', roles: ['admin'] },
  { prefix: '/api/admin/recolecciones', roles: ['admin', 'operaciones', 'logistica'] },
  { prefix: '/api/admin/contactos', roles: ['admin', 'operaciones', 'consultor'] },
  { prefix: '/api/admin/posts', roles: ['admin', 'consultor'] },
  { prefix: '/api/admin/normativas', roles: ['admin', 'consultor'] },
  // Agente de cumplimiento: expedientes, actos, alertas y reglas. Los
  // consultores son quienes atienden las alertas.
  { prefix: '/api/admin/cumplimiento', roles: ['admin', 'consultor'] },
  // La sincronización con Zoho escribe en un sistema externo: solo admin.
  { prefix: '/api/admin/zoho', roles: ['admin'] },
  // El asistente: cualquier sesión puede preguntar y decidir sus propuestas.
  // Qué puede proponer cada rol lo decide src/lib/asistente/permisos.ts, y la
  // gestión de topes y el reporte de consumo se vuelven a restringir a admin
  // dentro de sus endpoints.
  { prefix: '/api/admin/asistente', roles: ['admin', 'operaciones', 'logistica', 'consultor', 'finanzas', 'lectura'] },
]

export function canWrite(pathname: string, role: string): boolean {
  const rule = WRITE_RULES.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return role === 'admin'
  return rule.roles.includes(role)
}

/** Roles que pueden escribir bajo un prefijo, para quien necesite la lista. */
export function rolesQueEscriben(prefix: string): readonly string[] {
  return WRITE_RULES.find((r) => r.prefix === prefix)?.roles ?? ['admin']
}
