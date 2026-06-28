import { a6 as defineMiddleware, af as sequence } from './chunks/sequence_liNBEFg9.mjs';
import 'piccolore';
import 'clsx';
import { S as SESSION_COOKIE, v as verifySession } from './chunks/auth_BBNtY4Gb.mjs';

const PUBLIC_ADMIN_PATHS = /* @__PURE__ */ new Set(["/admin/login"]);
const PUBLIC_API_PATHS = /* @__PURE__ */ new Set(["/api/admin/login"]);
const onRequest$1 = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return next();
  if (PUBLIC_ADMIN_PATHS.has(pathname) || PUBLIC_API_PATHS.has(pathname)) return next();
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }
    return context.redirect("/admin/login");
  }
  context.locals.user = session.u;
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
