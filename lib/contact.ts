import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export async function getContactEmail() {
  const [row] = await getDb().select().from(settings).where(eq(settings.key, "contact.email"));
  const email = row?.value ?? process.env.SALON_EMAIL ?? "";
  return z.string().email().safeParse(email).success ? email : "";
}
