import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { a2 as addAttribute, L as renderTemplate, b4 as renderHead, b6 as renderSlot } from './sequence_liNBEFg9.mjs';
import { r as renderComponent } from './entrypoint_CpqPsXbs.mjs';
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
  const esToEn = {
    "/": "/en",
    "/servicios": "/en/services",
    "/quienes-somos": "/en/about",
    "/normativas": "/en/regulations",
    "/casos": "/en/cases",
    "/blog": "/en/blog",
    "/agenda-una-recoleccion": "/en/schedule-a-collection",
    "/contacto": "/en/contact",
    "/ekonsulting": "/en/ekonsulting",
    "/ekoraee": "/en/ekoraee",
    "/ekopartner": "/en/ekopartner",
    "/ekotrading": "/en/ekotrading"
  };
  const currentPath = Astro2.url.pathname.replace(/\/$/, "") || "/";
  const enUrl = esToEn[currentPath] ?? "/en";
  return renderTemplate`<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>${title}</title><meta name="description"${addAttribute(description, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:type" content="website"><meta property="og:locale" content="es_CO"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300..700&family=Geist+Mono:wght@300..500&display=swap" rel="stylesheet">${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderHead()}</head> <body> <div id="cursor"></div> <header class="nav"> <div class="wrap nav-inner"> <a href="/" class="brand" aria-label="EKOSOLV — Consultores en Sostenibilidad"> <img src="/brand/ekosolv-horizontal.svg" alt="EKOSOLV — Consultores en Sostenibilidad" class="brand-logo"> </a> <nav class="nav-links"> <a href="/servicios"${addAttribute(activePath === "/servicios" ? "active" : "", "class")}>Servicios</a> <a href="/quienes-somos"${addAttribute(activePath === "/quienes-somos" ? "active" : "", "class")}>Nosotros</a> <a href="/normativas"${addAttribute(activePath === "/normativas" ? "active" : "", "class")}>Normativas</a> <a href="/casos"${addAttribute(activePath === "/casos" ? "active" : "", "class")}>Casos</a> <a href="/blog"${addAttribute(activePath.startsWith("/blog") ? "active" : "", "class")}>Diario</a> <a href="/agenda-una-recoleccion"${addAttribute(activePath === "/agenda-una-recoleccion" ? "active" : "", "class")}>Agenda</a> </nav> <div class="nav-right" style="display:flex; align-items:center; gap:12px;"> <a${addAttribute(enUrl, "href")} class="lang-switch" style="font-family:var(--font-mono); font-size:11px; letter-spacing:0.06em; text-transform:uppercase; opacity:0.55; transition:opacity .2s;" title="View in English">EN</a> <a href="/contacto" class="nav-cta">
Hablemos
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M5 12h14M13 6l6 6-6 6"></path> </svg> </a> </div> </div> </header> <main> ${renderSlot($$result, $$slots["default"])} </main> <a href="https://wa.me/573212712773" target="_blank" rel="noopener noreferrer" class="whatsapp-fab" aria-label="Chatea por WhatsApp"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path> </svg> </a> ${renderScript($$result, "/home/mike/dev/work/github.com/eko/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/home/mike/dev/work/github.com/eko/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
