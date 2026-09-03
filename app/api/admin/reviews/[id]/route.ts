import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

const schema = z.object({ status: z.enum(["approved", "rejected", "pending"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  await getDb().update(reviews).set({ status: parsed.data.status }).where(eq(reviews.id, id));
  return Response.json({ ok: true });
}
