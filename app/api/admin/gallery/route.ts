import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { makeId } from "@/lib/salon";
import { deleteStoredObject, putStoredObject } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const images = await getDb()
    .select()
    .from(galleryImages)
    .orderBy(desc(galleryImages.createdAt));
  return Response.json({ images });
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const form = await request.formData();
  const file = form.get("image");
  const altText = String(form.get("altText") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_BYTES) {
    return Response.json({ error: "Choose a JPG, PNG or WebP image under 8 MB." }, { status: 400 });
  }
  if (altText.length < 3 || altText.length > 180 || caption.length > 240) {
    return Response.json({ error: "Add a short, helpful image description." }, { status: 400 });
  }
  const id = makeId("img");
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectKey = `gallery/${id}.${extension}`;
  await putStoredObject(objectKey, new Uint8Array(await file.arrayBuffer()));
  try {
    await getDb().insert(galleryImages).values({
      id,
      objectKey,
      altText,
      caption,
      contentType: file.type,
    });
  } catch (error) {
    await deleteStoredObject(objectKey);
    throw error;
  }
  return Response.json({ id }, { status: 201 });
}
