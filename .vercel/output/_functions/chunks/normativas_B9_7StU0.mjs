import { d as deleteNormativa, u as upsertNormativa } from './cms_BaF-xoCC.mjs';

const prerender = false;
const POST = async ({ request }) => {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const code = String(b.code ?? "").trim();
  const title = String(b.title ?? "").trim();
  if (!code || !title) return json({ error: "Código y título son obligatorios" }, 400);
  let tags = [];
  if (Array.isArray(b.tags)) tags = b.tags.map((t) => String(t).trim()).filter(Boolean);
  else if (typeof b.tags === "string") tags = b.tags.split(",").map((t) => t.trim()).filter(Boolean);
  const n = {
    id: b.id ? Number(b.id) : void 0,
    col: Number(b.col) === 2 ? 2 : 1,
    position: Number.isFinite(Number(b.position)) ? Number(b.position) : 0,
    code,
    title,
    body: String(b.body ?? "").trim(),
    tags
  };
  try {
    const id = await upsertNormativa(n);
    return json({ ok: true, id });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
};
const DELETE = async ({ url }) => {
  const id = Number(url.searchParams.get("id"));
  if (!id) return json({ error: "id requerido" }, 400);
  await deleteNormativa(id);
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
