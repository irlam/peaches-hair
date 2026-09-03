import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { appointments, appointmentSlots, services } from "@/db/schema";
import {
  addMinutes,
  DEFAULT_SERVICES,
  makeId,
  publicReference,
} from "@/lib/salon";
import { londonLocalToEpoch } from "@/lib/time";
import { sendBookingNotifications } from "@/lib/notifications";

const bookingSchema = z.object({
  serviceId: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(1000).optional().default(""),
  whatsappConsent: z.boolean().optional().default(false),
  company: z.string().max(0).optional().default(""),
});

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your booking details and try again." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const db = getDb();
  const [customService] = await db
    .select()
    .from(services)
    .where(eq(services.id, data.serviceId))
    .limit(1);
  const service = customService
    ? customService.active
      ? customService
      : null
    :
    DEFAULT_SERVICES.find((candidate) => candidate.id === data.serviceId);
  if (!service) {
    return Response.json({ error: "That service is no longer available." }, { status: 400 });
  }

  const availabilityUrl = new URL("/api/availability", request.url);
  availabilityUrl.searchParams.set("date", data.date);
  availabilityUrl.searchParams.set("service", data.serviceId);
  const availabilityResponse = await GET_AVAILABILITY(availabilityUrl);
  if (!availabilityResponse.includes(data.time)) {
    return Response.json(
      { error: "That time has just been booked. Please choose another." },
      { status: 409 },
    );
  }

  const id = makeId("apt");
  const endTime = addMinutes(data.time, service.durationMinutes);
  const appointment = {
    id,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    customerName: data.name,
    customerEmail: data.email.toLowerCase(),
    customerPhone: data.phone,
    notes: data.notes,
    appointmentDate: data.date,
    startTime: data.time,
    endTime,
    startsAt: londonLocalToEpoch(data.date, data.time),
    status: "confirmed",
    whatsappConsent: data.whatsappConsent,
  };
  const slots = Array.from(
    { length: Math.ceil(service.durationMinutes / 30) },
    (_, index) => ({
      appointmentDate: data.date,
      startTime: addMinutes(data.time, index * 30),
      appointmentId: id,
    }),
  );

  try {
    await db.batch([
      db.insert(appointments).values(appointment),
      ...slots.map((slot) => db.insert(appointmentSlots).values(slot)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("constraint")) {
      return Response.json(
        { error: "That time has just been booked. Please choose another." },
        { status: 409 },
      );
    }
    throw error;
  }

  await sendBookingNotifications(appointment);
  return Response.json(
    {
      reference: publicReference(id),
      appointment: {
        service: service.name,
        date: data.date,
        time: data.time,
      },
    },
    { status: 201 },
  );
}

async function GET_AVAILABILITY(url: URL) {
  const response = await import("../availability/route").then(({ GET }) =>
    GET(new Request(url)),
  );
  const data = (await response.json()) as { slots?: string[] };
  return data.slots ?? [];
}
