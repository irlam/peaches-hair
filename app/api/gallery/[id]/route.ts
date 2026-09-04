import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { readStoredObject } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [image] = await getDb()
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.id, id))
    .limit(1);
  if (!image || !image.isPublished) return new Response("Not found", { status: 404 });
  const object = await readStoredObject(image.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(object), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=3600",
      ETag: `"${createHash("sha256").update(object).digest("hex")}"`,
    },
  });
}
