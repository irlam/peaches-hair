import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { DEFAULT_SERVICES } from "@/lib/salon";

export async function GET() {
  const db = getDb();
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name));
  const merged = [
    ...DEFAULT_SERVICES.map((fallback, sortOrder) => {
      const custom = rows.find((row) => row.id === fallback.id);
      return custom ?? { ...fallback, active: true, sortOrder };
    }),
    ...rows.filter(
      (row) => !DEFAULT_SERVICES.some((fallback) => fallback.id === row.id),
    ),
  ].filter((service) => service.active);

  return Response.json({
    services: merged.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            priceFromPence: service.priceFromPence,
            consultationRequired: service.consultationRequired,
          })),
  });
}
