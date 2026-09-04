import { z } from "zod";
import { getDb } from "@/db";
import { businessHours, services, settings } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { SOCIAL_SETTING_KEYS } from "@/lib/social";

const serviceSchema = z.object({
  type: z.literal("service"),
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300),
  durationMinutes: z.number().int().min(15).max(480),
  priceFromPence: z.number().int().min(0).max(1000000).nullable(),
  consultationRequired: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(100),
});

const hoursSchema = z.object({
  type: z.literal("hours"),
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean(),
});

const socialUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use a complete https:// profile address.");

const socialsSchema = z.object({
  type: z.literal("socials"),
  instagram: socialUrl,
  facebook: socialUrl,
  tiktok: socialUrl,
});

export async function PUT(request: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const payload = await request.json();
  const service = serviceSchema.safeParse(payload);
  if (service.success) {
    const value = service.data;
    await getDb()
      .insert(services)
      .values({
        id: value.id,
        name: value.name,
        description: value.description,
        durationMinutes: value.durationMinutes,
        priceFromPence: value.priceFromPence,
        consultationRequired: value.consultationRequired,
        active: value.active,
        sortOrder: value.sortOrder,
      })
      .onConflictDoUpdate({
        target: services.id,
        set: {
          name: value.name,
          description: value.description,
          durationMinutes: value.durationMinutes,
          priceFromPence: value.priceFromPence,
          consultationRequired: value.consultationRequired,
          active: value.active,
          sortOrder: value.sortOrder,
        },
      });
    return Response.json({ ok: true });
  }

  const hours = hoursSchema.safeParse(payload);
  if (hours.success) {
    const value = hours.data;
    if (!value.isClosed && value.opensAt >= value.closesAt) {
      return Response.json({ error: "Closing time must be after opening time." }, { status: 400 });
    }
    await getDb()
      .insert(businessHours)
      .values(value)
      .onConflictDoUpdate({
        target: businessHours.dayOfWeek,
        set: {
          opensAt: value.opensAt,
          closesAt: value.closesAt,
          isClosed: value.isClosed,
        },
      });
    return Response.json({ ok: true });
  }

  const socials = socialsSchema.safeParse(payload);
  if (socials.success) {
    const values = [
      [SOCIAL_SETTING_KEYS.instagram, socials.data.instagram],
      [SOCIAL_SETTING_KEYS.facebook, socials.data.facebook],
      [SOCIAL_SETTING_KEYS.tiktok, socials.data.tiktok],
    ] as const;
    await Promise.all(
      values.map(([key, value]) =>
        getDb()
          .insert(settings)
          .values({ key, value })
          .onConflictDoUpdate({ target: settings.key, set: { value } }),
      ),
    );
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Check the settings supplied." }, { status: 400 });
}
