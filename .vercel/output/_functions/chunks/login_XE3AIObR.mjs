import { a as verifyCredentials, c as createSession, S as SESSION_COOKIE } from './auth_BBNtY4Gb.mjs';

const prerender = false;
const POST = async ({ request, cookies }) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }
  const { username, password } = body;
  if (!verifyCredentials(username, password)) {
    return json({ error: "Usuario o contraseña incorrectos" }, 401);
  }
  const token = await createSession(username);
  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 8
  });
  return json({ ok: true });
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
