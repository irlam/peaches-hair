import { env } from "cloudflare:workers";
import { headers } from "next/headers";

export async function requireAdminApi() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email")?.toLowerCase();
  const allowed = String((env as unknown as Record<string, unknown>).ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!email || allowed.length === 0 || !allowed.includes(email)) {
    return null;
  }
  return email;
}

export function configuredAdminEmails() {
  return String((env as unknown as Record<string, unknown>).ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}
