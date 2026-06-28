import { b as deletePost, c as upsertPost } from './cms_Cop3Dqhp.mjs';

const prerender = false;
const ACCENTS = ["deep", "forest", "clay"];
const SECTION_TYPES = ["p", "h2", "pull", "list"];
function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function cleanSections(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const s of raw) {
    if (!s || !SECTION_TYPES.includes(s.type)) continue;
    if (s.type === "list") {
      const items = Array.isArray(s.items) ? s.items.map((x) => String(x)).filter(Boolean) : [];
      if (items.length) out.push({ type: "list", items });
    } else {
      const text = String(s.text ?? "").trim();
      if (text) out.push({ type: s.type, text });
    }
  }
  return out;
}
const POST = async ({ request }) => {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const title = String(b.title ?? "").trim();
  if (!title) return json({ error: "El título es obligatorio" }, 400);
  const post = {
    id: b.id ? Number(b.id) : void 0,
    slug: b.slug && String(b.slug).trim() ? slugify(String(b.slug)) : slugify(title),
    category: String(b.category ?? "").trim() || "General",
    date: String(b.date ?? "").trim() || (/* @__PURE__ */ new Date()).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }),
    readtime: String(b.readtime ?? "").trim() || "3 min",
    accent: ACCENTS.includes(b.accent) ? b.accent : "deep",
    featured: !!b.featured,
    lede: String(b.lede ?? "").trim(),
    sections: cleanSections(b.sections)
  };
  try {
    const id = await upsertPost(post);
    return json({ ok: true, id, slug: post.slug });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg.includes("UNIQUE")) return json({ error: "Ya existe un artículo con ese slug" }, 409);
    return json({ error: msg }, 500);
  }
};
const DELETE = async ({ url }) => {
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "id requerido" }, 400);
  await deletePost(id);
  return json({ ok: true });
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
