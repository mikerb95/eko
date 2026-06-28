const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const SESSION_COOKIE = "eko_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
function env(key, fallback = "") {
  return Object.assign(__vite_import_meta_env__, { USER: "mike", _: "/home/mike/.nvm/versions/node/v22.22.3/bin/npx", USERNAME: "mike" })[key] || process.env[key] || fallback;
}
function getSecret() {
  return env("AUTH_SECRET", "dev-insecure-secret-change-me");
}
function adminUser() {
  return env("ADMIN_USERNAME", "admin");
}
function adminPass() {
  return env("ADMIN_PASSWORD", "ekosolv2026");
}
function b64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const enc = new TextEncoder();
async function hmac(data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function verifyCredentials(username, password) {
  const u = timingSafeEqual(username || "", adminUser());
  const p = timingSafeEqual(password || "", adminPass());
  return u && p;
}
async function createSession(username) {
  const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1e3) + SESSION_TTL_SECONDS })));
  const sig = b64url(await hmac(payload));
  return `${payload}.${sig}`;
}
async function verifySession(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = b64url(await hmac(payload));
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1e3)) return null;
    return { u: data.u };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE as S, verifyCredentials as a, createSession as c, verifySession as v };
