import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { appointments } from "@/db/schema";
import { sendReminder } from "@/lib/notifications";

export async function POST(request: Request) {
  const expected = String(process.env.CRON_SECRET ?? "");
  const supplied =
    request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("key") ??
    "";
  if (!expected || supplied !== expected) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const due = await getDb()
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "confirmed"),
        isNull(appointments.reminderSentAt),
        gte(appointments.startsAt, now + 22 * 60 * 60),
        lte(appointments.startsAt, now + 26 * 60 * 60),
      ),
    )
    .limit(100);

  let sent = 0;
  for (const appointment of due) {
    const results = await sendReminder(appointment);
    const delivered = results.some(
      (result) =>
        result.status === "fulfilled" &&
        typeof result.value === "object" &&
        result.value !== null &&
        "sent" in result.value &&
        result.value.sent === true,
    );
    if (delivered) {
      await getDb()
        .update(appointments)
        .set({ reminderSentAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(appointments.id, appointment.id));
      sent += 1;
    }
  }
  return Response.json({ checked: due.length, sent });
}
