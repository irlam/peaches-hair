import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, appointmentSlots } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

const updateSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  const { id } = await params;
  const db = getDb();
  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const update = db
    .update(appointments)
    .set({ status: parsed.data.status, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(appointments.id, id));
  if (parsed.data.status === "cancelled") {
    await db.batch([
      update,
      db.delete(appointmentSlots).where(eq(appointmentSlots.appointmentId, id)),
    ]);
  } else {
    await update;
  }
  return Response.json({ ok: true });
}
