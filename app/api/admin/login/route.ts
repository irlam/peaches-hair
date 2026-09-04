import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { publicUrl } from "@/lib/public-url";

type Attempt = { count: number; resetsAt: number };
const attempts = new Map<string, Attempt>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function loginRedirect(request: Request, error?: string) {
  const url = publicUrl("/admin", request);
  if (error) url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const previous = attempts.get(key);
  const attempt =
    previous && previous.resetsAt > now
      ? previous
      : { count: 0, resetsAt: now + ATTEMPT_WINDOW_MS };

  if (attempt.count >= MAX_ATTEMPTS) {
    return loginRedirect(request, "locked");
  }

  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!verifyAdminCredentials(email, password)) {
    attempts.set(key, { ...attempt, count: attempt.count + 1 });
    return loginRedirect(request, "invalid");
  }

  attempts.delete(key);
  const response = loginRedirect(request);
  response.cookies.set(
    ADMIN_COOKIE,
    createAdminSession(email),
    adminCookieOptions(),
  );
  return response;
}
