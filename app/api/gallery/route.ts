import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";

export async function GET() {
  const rows = await getDb()
    .select({
      id: galleryImages.id,
      altText: galleryImages.altText,
      caption: galleryImages.caption,
    })
    .from(galleryImages)
    .where(eq(galleryImages.isPublished, true))
    .orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt));
  return Response.json({
    images: rows.map((row) => ({ ...row, url: `/api/gallery/${row.id}` })),
  });
}
