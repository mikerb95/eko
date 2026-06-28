import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { a2 as addAttribute, L as renderTemplate, b4 as renderHead, b6 as renderSlot } from './sequence_liNBEFg9.mjs';
import { r as renderComponent } from './entrypoint_CQVRoxdA.mjs';
import { r as renderScript } from './script_CVkmP5jU.mjs';
import 'clsx';

const $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ClientRouter;
  const { fallback = "animate" } = Astro2.props;
  return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "/home/mike/dev/work/github.com/eko/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/mike/dev/work/github.com/eko/node_modules/astro/components/ClientRouter.astro", void 0);

const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "Eko — Consultoría ambiental ANLA", description = "Acompañamos a importadores, productores y operadores de tecnología en Colombia a construir sus planes de gestión ambiental, licencias y reportes.", activePath = "/" } = Astro2.props;
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title><meta name="description"${addAttribute(description, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:type" content="website"><meta property="og:locale" content="es_CO"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300..700&family=Geist+Mono:wght@300..500&display=swap" rel="stylesheet">${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderHead()}</head> <body> <div id="cursor"></div> <header class="nav"> <div class="wrap nav-inner"> <a href="/" class="brand" aria-label="EKOSOLV — Consultores en Sostenibilidad"> <img src="/brand/ekosolv-horizontal.svg" alt="EKOSOLV — Consultores en Sostenibilidad" class="brand-logo"> </a> <nav class="nav-links"> <a href="/servicios"${addAttribute(activePath === "/servicios" ? "active" : "", "class")}>Servicios</a> <a href="/quienes-somos"${addAttribute(activePath === "/quienes-somos" ? "active" : "", "class")}>Nosotros</a> <a href="/normativas"${addAttribute(activePath === "/normativas" ? "active" : "", "class")}>Normativas</a> <a href="/casos"${addAttribute(activePath === "/casos" ? "active" : "", "class")}>Casos</a> <a href="/blog"${addAttribute(activePath.startsWith("/blog") ? "active" : "", "class")}>Diario</a> <a href="/agenda-una-recoleccion"${addAttribute(activePath === "/agenda-una-recoleccion" ? "active" : "", "class")}>Agenda</a> </nav> <div class="nav-right" style="display:flex; align-items:center; gap:12px;"> <a href="/en" class="lang-switch" style="font-family:var(--font-mono); font-size:11px; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; transition:opacity .2s;" title="View in English">EN</a> <a href="/contacto" class="nav-cta">
Hablemos
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M5 12h14M13 6l6 6-6 6"></path> </svg> </a> </div> </div> </header> <main> ${renderSlot($$result, $$slots["default"])} </main> ${renderScript($$result, "/home/mike/dev/work/github.com/eko/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/home/mike/dev/work/github.com/eko/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
