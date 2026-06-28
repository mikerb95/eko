import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { b4 as renderHead, L as renderTemplate } from './sequence_liNBEFg9.mjs';
import 'clsx';
import { r as renderScript } from './script_CVkmP5jU.mjs';
import { S as SESSION_COOKIE, v as verifySession } from './auth_BBNtY4Gb.mjs';

const prerender = false;
const $$Login = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Login;
  const token = Astro2.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(token)) return Astro2.redirect("/admin");
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>Acceso — EKOSOLV CMS</title><link rel="stylesheet" href="/admin/admin.css">${renderHead()}</head> <body class="login-body"> <main class="login-card"> <img src="/brand/ekosolv-horizontal.svg" alt="EKOSOLV" class="login-logo"> <h1>Panel de administración</h1> <p class="muted">Ingresa para gestionar el blog y las normativas.</p> <form id="login-form"> <label>Usuario<input name="username" type="text" autocomplete="username" required></label> <label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label> <button type="submit" class="btn-primary"><span class="t">Entrar</span></button> <p class="form-error" id="err"></p> </form> </main> ${renderScript($$result, "/home/mike/dev/work/github.com/eko/src/pages/admin/login.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/home/mike/dev/work/github.com/eko/src/pages/admin/login.astro", void 0);

const $$file = "/home/mike/dev/work/github.com/eko/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
