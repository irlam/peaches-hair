// Run after npm run build. Uses an isolated temporary database and uploads.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import next from "next";

const project = process.cwd();
const scratch = await mkdtemp(path.join(tmpdir(), "peaches-content-"));
process.env.ADMIN_EMAIL = "admin@example.test";
process.env.ADMIN_PASSWORD = randomBytes(24).toString("hex");
process.env.SESSION_SECRET = randomBytes(32).toString("hex");
process.env.RESEND_API_KEY = "";
process.env.WHATSAPP_ACCESS_TOKEN = "";
const app = next({ dev: false, dir: project });
let server;
try {
  await app.prepare();
  process.chdir(scratch);
  server = createServer(app.getRequestHandler());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const payload = Buffer.from(JSON.stringify({ email: process.env.ADMIN_EMAIL, expiresAt: Math.floor(Date.now() / 1000) + 600 })).toString("base64url");
  const cookie = `peaches_admin_session=${payload}.${createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest("base64url")}`;
  const request = (url, init = {}, auth = true) => fetch(base + url, { ...init, headers: { ...(auth ? { cookie } : {}), ...init.headers } });
  const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  for (const url of ["/api/admin/gallery", "/api/admin/poster"]) assert.equal((await request(url, {}, false)).status, 401);
  assert.equal((await request("/api/admin/poster", json("PUT", {}), false)).status, 401);
  assert.equal((await request("/api/admin/gallery/missing", { method: "PATCH" }, false)).status, 401);
  assert.equal((await request("/api/admin/poster", json("PUT", { rows: [] }))).status, 400);
  const poster = { title: "Prices & colour", subtitle: "Peaches Hair", footer: "Book online", format: "a4", rows: [{ name: "Cut & finish", price: "From £45.50" }] };
  assert.equal((await request("/api/admin/poster", json("PUT", poster))).status, 200);
  assert.deepEqual((await (await request("/api/admin/poster")).json()).poster, poster);
  assert.equal((await request("/api/admin/settings", json("PUT", { type: "hours", dayOfWeek: 1, opensAt: "11:15", closesAt: "18:45", isClosed: false }))).status, 200);
  assert.equal((await request("/api/admin/settings", json("PUT", { type: "hours", dayOfWeek: 1, opensAt: "25:15", closesAt: "28:45", isClosed: false }))).status, 400);
  assert.equal((await request("/api/admin/settings", json("PUT", { type: "contact", email: "salon@example.test" }))).status, 200);
  const home = await (await request("/", {}, false)).text();
  assert.ok(home.includes("11:15–18:45"));
  assert.ok(home.includes("mailto:salon@example.test"));
  assert.ok(!home.includes("hello@peaches.hair"));
  const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1N8AAAAASUVORK5CYII=", "base64");
  const upload = new FormData(); upload.set("image", new Blob([pixel], { type: "image/png" }), "test.png"); upload.set("altText", "Test colour work"); upload.set("caption", "Original caption");
  const uploaded = await request("/api/admin/gallery", { method: "POST", body: upload });
  assert.equal(uploaded.status, 201); const { id } = await uploaded.json();
  const edit = new FormData(); edit.set("altText", "Updated description"); edit.set("caption", "Edited caption"); edit.set("sortOrder", "4");
  assert.equal((await request(`/api/admin/gallery/${id}`, { method: "PATCH", body: edit })).status, 200);
  assert.equal((await request(`/api/gallery/${id}`, {}, false)).status, 404);
  assert.equal((await request(`/api/admin/gallery/${id}`, {}, false)).status, 401);
  assert.equal((await request(`/api/admin/gallery/${id}`)).status, 200);
  assert.equal((await (await request("/api/gallery", {}, false)).json()).images.length, 0);
  edit.set("isPublished", "on"); edit.set("image", new Blob([pixel], { type: "image/png" }), "replacement.png");
  assert.equal((await request(`/api/admin/gallery/${id}`, { method: "PATCH", body: edit })).status, 200);
  const publicPhotos = (await (await request("/api/gallery", {}, false)).json()).images;
  assert.equal(publicPhotos[0].caption, "Edited caption");
  const photo = await request(`/api/gallery/${id}`, {}, false); assert.equal(photo.status, 200); assert.equal(photo.headers.get("cache-control"), "no-store");
  assert.equal((await request(`/api/admin/gallery/${id}`, { method: "DELETE" })).status, 200);
  assert.equal((await request(`/api/gallery/${id}`, {}, false)).status, 404);
  console.log("PASS: auth, poster validation/save/reload, opening hours, email link, gallery upload/edit/hide/replace/delete.");
} finally {
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  await app.close();
  process.chdir(project);
  await rm(scratch, { recursive: true, force: true });
}
