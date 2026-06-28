import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { L as renderTemplate, x as maybeRenderHead, a2 as addAttribute } from './sequence_liNBEFg9.mjs';
import { r as renderComponent } from './entrypoint_P-vVGiqn.mjs';
import { $ as $$Layout } from './Layout_XJ4jWN7G.mjs';
import { a as getNormativas } from './cms_Cop3Dqhp.mjs';

const prerender = false;
const $$Normativas = createComponent(async ($$result, $$props, $$slots) => {
  const all = await getNormativas();
  const col1 = all.filter((n) => n.col === 1);
  const col2 = all.filter((n) => n.col === 2);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Normativas — Eko", "activePath": "/normativas" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="page-head wrap"> <div class="page-strip"> <div class="l">Normativas</div> <div class="l">Actualizado · abril 2026</div> </div> <h1 class="display reveal" style="margin-top:40px">
El <em>marco</em> que<br>le aplica a su empresa.
</h1> <p class="lede reveal" style="margin-top:32px; max-width:56ch">
Un mapa vivo de las obligaciones ambientales más frecuentes para compañías que importan, producen o distribuyen tecnología en Colombia. Haz clic para expandir.
</p> </section> <section class="section wrap"> <div class="norms reveal"> <div class="norms-col"> ${col1.map((n, idx) => renderTemplate`<div class="norm"${addAttribute(idx === 0 ? "true" : "false", "data-open")}> <div> <div class="code">${n.code}</div> <h4>${n.title}</h4> </div> <button class="plus" aria-label="expand"> <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"> <path d="M6 1v10M1 6h10"></path> </svg> </button> <div class="body"> <p>${n.body}</p> <ul>${n.tags.map((t) => renderTemplate`<li>${t}</li>`)}</ul> </div> </div>`)} </div> <div class="norms-col"> ${col2.map((n) => renderTemplate`<div class="norm" data-open="false"> <div> <div class="code">${n.code}</div> <h4>${n.title}</h4> </div> <button class="plus" aria-label="expand"> <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"> <path d="M6 1v10M1 6h10"></path> </svg> </button> <div class="body"> <p>${n.body}</p> <ul>${n.tags.map((t) => renderTemplate`<li>${t}</li>`)}</ul> </div> </div>`)} </div> </div> </section> <section class="section wrap"> <div class="band reveal"> <div class="band-grid"> <div> <div class="eyebrow" style="color: color-mix(in oklab, #fff 55%, transparent)">Seguimiento regulatorio</div> <h2 style="margin-top:14px; max-width:16ch">Nuevas normas, <em>revisadas</em> cada semana.</h2> </div> <div class="stat"> <div class="n">47</div> <div class="lbl">Resoluciones vigentes monitoreadas</div> </div> <div class="stat"> <div class="n">12</div> <div class="lbl">Cambios regulatorios en 2025</div> </div> <div class="stat"> <div class="n">24<small>h</small></div> <div class="lbl">Alerta a clientes tras publicación</div> </div> </div> </div> </section> <footer class="foot"> <div class="wrap"> <div class="foot-head reveal"> <div class="display">¿Un nuevo <em>expediente</em><br>en el radar?</div> <a href="/contacto" class="foot-cta">
Escríbenos
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"> <path d="M5 12h14M13 6l6 6-6 6"></path> </svg> </a> </div> <div class="foot-cols"> <div> <img class="foot-logo" src="/brand/ekosolv-horizontal-white.svg" alt="EKOSOLV — Consultores en Sostenibilidad"> <p style="opacity:.6; font-size:14px; margin-top:12px; max-width:36ch">Consultoría ambiental especializada en cumplimiento ANLA para el sector tecnológico.</p> </div> <div><h5>Sitio</h5><ul><li><a href="/">Inicio</a></li><li><a href="/servicios">Servicios</a></li><li><a href="/normativas">Normativas</a></li><li><a href="/casos">Casos</a></li><li><a href="/blog">Diario</a></li></ul></div> <div><h5>Contacto</h5><ul><li>info@ekosolv.com</li><li>+57 321 271 2773</li><li>Edif. RPTV · Carrera 15 #31B-33<br>Bogotá D.C.</li></ul></div> <div><h5>Legal</h5><ul><li>Política de tratamiento</li><li>Términos de servicio</li><li>Código de ética</li></ul></div> </div> <div class="foot-bottom"> <div>© 2026 Ekosolv S.A.S. · NIT 900.659.506-9</div> <div>Built with care in Bogotá</div> </div> </div> </footer> ` })}`;
}, "/home/mike/dev/work/github.com/eko/src/pages/normativas.astro", void 0);

const $$file = "/home/mike/dev/work/github.com/eko/src/pages/normativas.astro";
const $$url = "/normativas";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Normativas,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
