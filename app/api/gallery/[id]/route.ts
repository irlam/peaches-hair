import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";

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
  const object = await env.BUCKET.get(image.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=3600",
      ETag: object.httpEtag,
    },
  });
}
