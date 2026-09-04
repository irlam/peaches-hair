import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/admin-auth";
import { publicUrl } from "@/lib/public-url";

export async function GET(request: Request) {
  const response = NextResponse.redirect(publicUrl("/", request), 303);
  response.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
  return response;
}
