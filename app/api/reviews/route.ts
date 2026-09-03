import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { makeId } from "@/lib/salon";

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(1200),
  company: z.string().max(0).optional().default(""),
});

export async function GET() {
  const rows = await getDb()
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(12);
  return Response.json({ reviews: rows });
}

export async function POST(request: Request) {
  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Please complete every review field." }, { status: 400 });
  }
  const [review] = await getDb()
    .insert(reviews)
    .values({
      id: makeId("rev"),
      customerName: parsed.data.name,
      rating: parsed.data.rating,
      body: parsed.data.body,
    })
    .returning();
  return Response.json({ review, message: "Thank you — your review is awaiting approval." }, { status: 201 });
}
