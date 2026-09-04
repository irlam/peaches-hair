import { asc, desc, gte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  appointments,
  blockedSlots,
  businessHours,
  reviews,
  services,
  settings,
} from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { DEFAULT_HOURS, DEFAULT_SERVICES } from "@/lib/salon";
import { londonNow } from "@/lib/time";
import { whatsAppSettingsFromRows } from "@/lib/whatsapp";

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const db = getDb();
  const today = londonNow().date;
  const [appointmentRows, blockRows, reviewRows, serviceRows, hoursRows, settingRows] = await Promise.all([
    db
      .select()
      .from(appointments)
      .where(gte(appointments.appointmentDate, today))
      .orderBy(asc(appointments.appointmentDate), asc(appointments.startTime))
      .limit(300),
    db
      .select()
      .from(blockedSlots)
      .where(gte(blockedSlots.blockedDate, today))
      .orderBy(asc(blockedSlots.blockedDate), asc(blockedSlots.startTime)),
    db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(100),
    db.select().from(services).orderBy(services.sortOrder, services.name),
    db.select().from(businessHours).orderBy(businessHours.dayOfWeek),
    db.select().from(settings),
  ]);
  return Response.json({
    appointments: appointmentRows,
    blockedSlots: blockRows,
    reviews: reviewRows,
    services: [
      ...DEFAULT_SERVICES.map((fallback, sortOrder) => {
        const custom = serviceRows.find((row) => row.id === fallback.id);
        return custom ?? { ...fallback, active: true, sortOrder };
      }),
      ...serviceRows.filter(
        (row) => !DEFAULT_SERVICES.some((fallback) => fallback.id === row.id),
      ),
    ],
    businessHours: Array.from({ length: 7 }, (_, dayOfWeek) => {
      const custom = hoursRows.find((row) => row.dayOfWeek === dayOfWeek);
      return custom ?? { dayOfWeek, ...DEFAULT_HOURS[dayOfWeek] };
    }),
    socialLinks: {
      instagram: settingRows.find((row) => row.key === "social.instagram")?.value ?? "",
      facebook: settingRows.find((row) => row.key === "social.facebook")?.value ?? "",
      tiktok: settingRows.find((row) => row.key === "social.tiktok")?.value ?? "",
    },
    whatsappSettings: whatsAppSettingsFromRows(settingRows),
    today,
  });
}
