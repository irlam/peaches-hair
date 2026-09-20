import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { POSTER_KEY, posterSchema } from "@/lib/poster";

export async function GET() {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const [row] = await getDb().select().from(settings).where(eq(settings.key, POSTER_KEY));
  return Response.json({ poster: row ? JSON.parse(row.value) : null });
}

export async function PUT(request: Request) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const parsed = posterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the poster fields. Include 1–12 services and a price for each." }, { status: 400 });
  const value = JSON.stringify(parsed.data);
  await getDb().insert(settings).values({ key: POSTER_KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
  return Response.json({ ok: true });
}
