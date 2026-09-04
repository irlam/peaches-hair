import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  appointmentSlots,
  blockedSlots,
  businessHours,
  services,
} from "@/db/schema";
import {
  addMinutes,
  DEFAULT_HOURS,
  DEFAULT_SERVICES,
  timeToMinutes,
} from "@/lib/salon";
import { londonLocalToEpoch } from "@/lib/time";

const SLOT_MINUTES = 30;
const BOOKING_HORIZON_DAYS = 120;
const MINIMUM_NOTICE_SECONDS = 4 * 60 * 60;

export async function GET(request: Request) {
  if (process.env.BOOKING_ENABLED !== "true") {
    return Response.json({ slots: [] });
  }
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const serviceId = url.searchParams.get("service") ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Choose a valid date." }, { status: 400 });
  }

  const requestedDay = new Date(`${date}T12:00:00Z`);
  const today = new Date();
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + BOOKING_HORIZON_DAYS);
  if (
    requestedDay.getTime() < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) ||
    requestedDay.getTime() > horizon.getTime()
  ) {
    return Response.json({ slots: [] });
  }

  const db = getDb();
  const [customService] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  const service = customService
    ? customService.active
      ? customService
      : null
    :
    DEFAULT_SERVICES.find((candidate) => candidate.id === serviceId);
  if (!service) {
    return Response.json({ error: "Choose a valid service." }, { status: 400 });
  }

  const day = requestedDay.getUTCDay();
  const [customHours] = await db
    .select()
    .from(businessHours)
    .where(eq(businessHours.dayOfWeek, day))
    .limit(1);
  const hours = customHours ?? DEFAULT_HOURS[day];
  if (!hours || hours.isClosed) return Response.json({ slots: [] });

  const [reserved, blocked] = await Promise.all([
    db
      .select({ startTime: appointmentSlots.startTime })
      .from(appointmentSlots)
      .where(eq(appointmentSlots.appointmentDate, date)),
    db
      .select()
      .from(blockedSlots)
      .where(eq(blockedSlots.blockedDate, date)),
  ]);
  const reservedTimes = new Set(reserved.map((row) => row.startTime));
  const openMinutes = timeToMinutes(hours.opensAt);
  const closeMinutes = timeToMinutes(hours.closesAt);
  const slots: string[] = [];

  for (
    let minute = openMinutes;
    minute + service.durationMinutes <= closeMinutes;
    minute += SLOT_MINUTES
  ) {
    const start = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(
      minute % 60,
    ).padStart(2, "0")}`;
    const end = addMinutes(start, service.durationMinutes);
    const increments = Array.from(
      { length: Math.ceil(service.durationMinutes / SLOT_MINUTES) },
      (_, index) => addMinutes(start, index * SLOT_MINUTES),
    );
    const clashesWithAppointment = increments.some((time) =>
      reservedTimes.has(time),
    );
    const clashesWithBlock = blocked.some(
      (block) =>
        timeToMinutes(start) < timeToMinutes(block.endTime) &&
        timeToMinutes(end) > timeToMinutes(block.startTime),
    );
    const startsTooSoon =
      londonLocalToEpoch(date, start) < Date.now() / 1000 + MINIMUM_NOTICE_SECONDS;

    if (!clashesWithAppointment && !clashesWithBlock && !startsTooSoon) {
      slots.push(start);
    }
  }

  return Response.json({ slots });
}
