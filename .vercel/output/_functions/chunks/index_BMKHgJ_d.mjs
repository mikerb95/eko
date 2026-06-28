import { c as createComponent } from './astro-component_Dtkjvv3X.mjs';
import 'piccolore';
import { L as renderTemplate, b5 as defineScriptVars, b4 as renderHead } from './sequence_liNBEFg9.mjs';
import 'clsx';
import { s as seedIfEmpty, g as getPosts, a as getNormativas } from './cms_Cop3Dqhp.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  let seedError = "";
  try {
    await seedIfEmpty();
  } catch (e) {
    seedError = String(e?.message || e);
  }
  const posts = await getPosts();
  const normativas = await getNormativas();
  const user = Astro2.locals.user || "admin";
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><title>EKOSOLV CMS</title><link rel="stylesheet" href="/admin/admin.css">', '</head> <body> <header class="admin-top"> <div class="brand-mini"> <img src="/brand/ekosolv-horizontal.svg" alt="EKOSOLV"> <span class="tag">CMS</span> </div> <div class="top-right"> <span class="muted">Sesión: ', '</span> <a href="/" class="btn-ghost" target="_blank">Ver sitio ↗</a> <button id="logout" class="btn-ghost">Salir</button> </div> </header> ', ' <nav class="tabs"> <button class="tab is-active" data-tab="blog">Blog <span class="count">', '</span></button> <button class="tab" data-tab="normativas">Normativas <span class="count">', '</span></button> </nav> <main class="admin-main"> <!-- BLOG --> <section id="panel-blog" class="panel is-active"> <div class="panel-head"> <h2>Artículos del blog</h2> <button class="btn-primary" id="new-post">+ Nuevo artículo</button> </div> <div id="post-list" class="list"></div> </section> <!-- NORMATIVAS --> <section id="panel-normativas" class="panel"> <div class="panel-head"> <h2>Normativas vigentes</h2> <button class="btn-primary" id="new-norm">+ Nueva normativa</button> </div> <div id="norm-list" class="list"></div> </section> </main> <!-- POST EDITOR --> <div class="drawer" id="post-drawer" hidden> <div class="drawer-bg" data-close></div> <div class="drawer-panel"> <div class="drawer-head"><h3 id="post-drawer-title">Artículo</h3><button class="x" data-close>×</button></div> <form id="post-form" class="drawer-body"> <input type="hidden" name="id"> <label>Título<input name="title" required></label> <div class="grid2"> <label>Slug (URL)<input name="slug" placeholder="se genera del título"></label> <label>Categoría<input name="category" placeholder="Economía circular"></label> </div> <div class="grid3"> <label>Fecha<input name="date" placeholder="14 abr 2025"></label> <label>Lectura<input name="readtime" placeholder="3 min"></label> <label>Acento\n<select name="accent"> <option value="deep">deep</option> <option value="forest">forest</option> <option value="clay">clay</option> </select> </label> </div> <label class="check"><input type="checkbox" name="featured"> Destacado (aparece arriba en el blog)</label> <label>Entradilla (lede)<textarea name="lede" rows="3"></textarea></label> <div class="sections-head"> <h4>Contenido</h4> <div class="add-sec"> <button type="button" data-add="p">+ Párrafo</button> <button type="button" data-add="h2">+ Subtítulo</button> <button type="button" data-add="pull">+ Cita</button> <button type="button" data-add="list">+ Lista</button> </div> </div> <div id="sections"></div> <div class="drawer-actions"> <button type="button" class="btn-ghost" data-close>Cancelar</button> <button type="submit" class="btn-primary"><span class="t">Guardar</span></button> <p class="form-error" id="post-err"></p> </div> </form> </div> </div> <!-- NORMATIVA EDITOR --> <div class="drawer" id="norm-drawer" hidden> <div class="drawer-bg" data-close></div> <div class="drawer-panel"> <div class="drawer-head"><h3 id="norm-drawer-title">Normativa</h3><button class="x" data-close>×</button></div> <form id="norm-form" class="drawer-body"> <input type="hidden" name="id"> <div class="grid2"> <label>Código<input name="code" placeholder="RES 1297 · 2010" required></label> <label>Columna\n<select name="col"><option value="1">Columna 1</option><option value="2">Columna 2</option></select> </label> </div> <label>Título<input name="title" required></label> <label>Descripción<textarea name="body" rows="4"></textarea></label> <div class="grid2"> <label>Etiquetas (separadas por coma)<input name="tags" placeholder="RAEE, Posconsumo"></label> <label>Orden<input name="position" type="number" value="0"></label> </div> <div class="drawer-actions"> <button type="button" class="btn-ghost" data-close>Cancelar</button> <button type="submit" class="btn-primary"><span class="t">Guardar</span></button> <p class="form-error" id="norm-err"></p> </div> </form> </div> </div> <script>(function(){', '\n      window.__POSTS__ = posts\n      window.__NORMS__ = normativas\n    })();<\/script> <script src="/admin/admin.js" type="module"><\/script> </body> </html>'])), renderHead(), user, seedError && renderTemplate`<div class="banner-error">No se pudo inicializar la base de datos: ${seedError}</div>`, posts.length, normativas.length, defineScriptVars({ posts, normativas }));
}, "/home/mike/dev/work/github.com/eko/src/pages/admin/index.astro", void 0);

const $$file = "/home/mike/dev/work/github.com/eko/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
