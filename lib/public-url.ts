function validHttpOrigin(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function publicUrl(path: string, request: Request) {
  const configuredOrigin = validHttpOrigin(process.env.PUBLIC_SITE_URL);
  if (configuredOrigin) return new URL(path, configuredOrigin);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol === "http" ? "http" : "https";
  const forwardedOrigin = validHttpOrigin(host ? `${protocol}://${host}` : undefined);

  return new URL(path, forwardedOrigin || new URL(request.url).origin);
}
