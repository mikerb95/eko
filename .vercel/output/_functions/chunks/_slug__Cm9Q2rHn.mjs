import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { L as renderTemplate, x as maybeRenderHead, a2 as addAttribute } from './sequence_liNBEFg9.mjs';
import { r as renderComponent } from './entrypoint_P-vVGiqn.mjs';
import { r as renderScript } from './script_CVkmP5jU.mjs';
import { $ as $$Layout } from './Layout_XJ4jWN7G.mjs';
import { e as getPostBySlug, g as getPosts } from './cms_Cop3Dqhp.mjs';

const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const post = slug ? await getPostBySlug(slug) : null;
  if (!post) return Astro2.redirect("/blog");
  const allPosts = await getPosts();
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${post.title} — Eko`, "activePath": "/blog" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="page-head wrap"> <div class="page-strip"> <a class="l ulink" href="/blog">← Diario</a> <div class="l">${post.category} · ${post.readtime}</div> </div> <div class="blog-kicker reveal" style="margin-top:40px"> <span${addAttribute(`dot accent-${post.accent}`, "class")}></span>${post.category} · ${post.date} </div> <h1 class="display reveal post-title" style="margin-top:24px; font-size:clamp(44px,7vw,104px)"> ${post.title} </h1> <p class="lede reveal" style="margin-top:32px; max-width:58ch">${post.lede}</p> </section> <section class="section wrap" style="padding-top:0"> <div${addAttribute(`post-hero accent-${post.accent} reveal`, "class")} style="view-transition-name: post-hero"> <div class="ph-coords"> <span>Por Equipo Eko</span> <span>${post.date}</span> </div> </div> <div class="post-body reveal"> ${post.sections.map((s) => {
    if (s.type === "p") return renderTemplate`<p class="post-p">${s.text}</p>`;
    if (s.type === "h2") return renderTemplate`<h2 class="post-h2">${s.text}</h2>`;
    if (s.type === "pull") return renderTemplate`<blockquote class="post-pull">${s.text}</blockquote>`;
    if (s.type === "list") return renderTemplate`<ul class="post-list"> ${s.items?.map((item) => renderTemplate`<li>${item}</li>`)} </ul>`;
    return null;
  })} </div> <div class="post-foot reveal"> <div class="pf-share"> <span class="l">Compartir</span> <a href="#">LinkedIn</a> <a href="#">Correo</a> <a href="#">Copiar enlace</a> </div> <a class="pf-next" href="/contacto"> <div> <div class="l">¿Esto te pasa a ti?</div> <div class="t">Pide un diagnóstico →</div> </div> </a> </div> </section> <section class="section wrap"> <div class="section-head reveal"> <div> <div class="eyebrow">Seguir leyendo</div> <h2>Otras <em>notas</em>.</h2> </div> </div> <div class="blog-list reveal"> ${related.map((p, i) => renderTemplate`<a class="blog-row"${addAttribute(`/blog/${p.slug}`, "href")}> <div class="br-num">${String(i + 1).padStart(2, "0")}</div> <div class="br-cat"><span${addAttribute(`d accent-${p.accent}`, "class")}></span>${p.category}</div> <div class="br-title">${p.title}</div> <div class="br-date">${p.date}</div> <div class="br-time">${p.readtime}</div> <div class="br-arrow"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"> <path d="M7 17L17 7M9 7h8v8"></path> </svg> </div> </a>`)} </div> </section> <footer class="foot"> <div class="wrap"> <div class="foot-head reveal"> <div class="display">¿Un nuevo <em>expediente</em><br>en el radar?</div> <a href="/contacto" class="foot-cta">
Escríbenos
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"> <path d="M5 12h14M13 6l6 6-6 6"></path> </svg> </a> </div> <div class="foot-cols"> <div> <img class="foot-logo" src="/brand/ekosolv-horizontal-white.svg" alt="EKOSOLV — Consultores en Sostenibilidad"> <p style="opacity:.6; font-size:14px; margin-top:12px; max-width:36ch">Consultoría ambiental especializada en cumplimiento ANLA para el sector tecnológico.</p> </div> <div><h5>Sitio</h5><ul><li><a href="/">Inicio</a></li><li><a href="/servicios">Servicios</a></li><li><a href="/normativas">Normativas</a></li><li><a href="/casos">Casos</a></li><li><a href="/blog">Diario</a></li></ul></div> <div><h5>Contacto</h5><ul><li>info@ekosolv.com</li><li>+57 321 271 2773</li><li>Edif. RPTV · Carrera 15 #31B-33<br>Bogotá D.C.</li></ul></div> <div><h5>Legal</h5><ul><li>Política de tratamiento</li><li>Términos de servicio</li><li>Código de ética</li></ul></div> </div> <div class="foot-bottom"> <div>© 2026 Ekosolv S.A.S. · NIT 900.659.506-9</div> <div>Built with care in Bogotá</div> </div> </div> </footer> ${renderScript($$result2, "/home/mike/dev/work/github.com/eko/src/pages/blog/[slug].astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/home/mike/dev/work/github.com/eko/src/pages/blog/[slug].astro", void 0);

const $$file = "/home/mike/dev/work/github.com/eko/src/pages/blog/[slug].astro";
const $$url = "/blog/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
