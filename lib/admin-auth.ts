import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "peaches_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

type AdminUser = {
  email: string;
  displayName: string;
};

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function adminEmail() {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(sha256(left), sha256(right));
}

function sign(encodedPayload: string) {
  const secret = process.env.SESSION_SECRET || "";
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function adminIsConfigured() {
  return Boolean(
    adminEmail() &&
      (process.env.ADMIN_PASSWORD || "").length >= 12 &&
      (process.env.SESSION_SECRET || "").length >= 32,
  );
}

export function verifyAdminCredentials(email: string, password: string) {
  if (!adminIsConfigured()) return false;
  return (
    safeEqual(email.trim().toLowerCase(), adminEmail()) &&
    safeEqual(password, process.env.ADMIN_PASSWORD || "")
  );
}

export function createAdminSession(email: string) {
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySession(token: string): SessionPayload | null {
  if (!adminIsConfigured()) return null;
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return null;
  if (!safeEqual(suppliedSignature, sign(encoded))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (
      payload.email !== adminEmail() ||
      !Number.isInteger(payload.expiresAt) ||
      payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload) return null;
  return {
    email: payload.email,
    displayName: process.env.ADMIN_NAME?.trim() || "Peaches Hair Admin",
  };
}

export async function requireAdminApi() {
  return (await getAdminUser())?.email ?? null;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
