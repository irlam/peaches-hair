export type SalonService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceFromPence: number | null;
  consultationRequired: boolean;
};

export const DEFAULT_SERVICES: SalonService[] = [
  {
    id: "colour-consultation",
    name: "Colour consultation",
    description: "A relaxed consultation, colour history and personalised plan.",
    durationMinutes: 30,
    priceFromPence: 0,
    consultationRequired: false,
  },
  {
    id: "root-refresh",
    name: "Root refresh",
    description: "Expert root colour application with a polished finish.",
    durationMinutes: 120,
    priceFromPence: 0,
    consultationRequired: true,
  },
  {
    id: "full-colour",
    name: "Full colour",
    description: "Glossy, dimensional colour tailored to your hair and skin tone.",
    durationMinutes: 150,
    priceFromPence: 0,
    consultationRequired: true,
  },
  {
    id: "highlights",
    name: "Highlights",
    description: "Fine, blended highlights designed for natural-looking dimension.",
    durationMinutes: 180,
    priceFromPence: 0,
    consultationRequired: true,
  },
  {
    id: "balayage",
    name: "Balayage",
    description: "Bespoke hand-painted colour with a soft, seamless grow-out.",
    durationMinutes: 210,
    priceFromPence: 0,
    consultationRequired: true,
  },
  {
    id: "cut-finish",
    name: "Cut & finish",
    description: "A precision cut, blow-dry and finish shaped around you.",
    durationMinutes: 60,
    priceFromPence: 0,
    consultationRequired: false,
  },
];

export const DEFAULT_HOURS: Record<
  number,
  { opensAt: string; closesAt: string; isClosed: boolean }
> = {
  0: { opensAt: "09:00", closesAt: "16:00", isClosed: true },
  1: { opensAt: "09:00", closesAt: "17:00", isClosed: true },
  2: { opensAt: "09:30", closesAt: "17:00", isClosed: false },
  3: { opensAt: "09:30", closesAt: "17:00", isClosed: false },
  4: { opensAt: "10:00", closesAt: "19:00", isClosed: false },
  5: { opensAt: "09:30", closesAt: "17:00", isClosed: false },
  6: { opensAt: "09:00", closesAt: "16:00", isClosed: false },
};

export function formatPrice(priceFromPence: number | null) {
  if (!priceFromPence) return "Price confirmed at consultation";
  return `From £${(priceFromPence / 100).toFixed(0)}`;
}

export function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function publicReference(id: string) {
  return id.slice(-8).toUpperCase();
}
