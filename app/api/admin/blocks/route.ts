import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { blockedSlots } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { makeId } from "@/lib/salon";

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const parsed = blockSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.startTime >= parsed.data.endTime) {
    return Response.json({ error: "Check the blocked time." }, { status: 400 });
  }
  const [block] = await getDb()
    .insert(blockedSlots)
    .values({
      id: makeId("blk"),
      blockedDate: parsed.data.date,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason,
    })
    .returning();
  return Response.json({ block }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  await getDb().delete(blockedSlots).where(eq(blockedSlots.id, id));
  return Response.json({ ok: true });
}
