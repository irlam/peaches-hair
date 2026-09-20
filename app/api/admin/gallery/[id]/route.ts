import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { deleteStoredObject } from "@/lib/storage";
import { putStoredObject, readStoredObject } from "@/lib/storage";
import { z } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  const [image] = await getDb().select().from(galleryImages).where(eq(galleryImages.id, id));
  const object = image && await readStoredObject(image.objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(object), { headers: { "Content-Type": image.contentType, "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  const [image] = await getDb().select().from(galleryImages).where(eq(galleryImages.id, id));
  if (!image) return Response.json({ error: "Image not found." }, { status: 404 });
  const form = await request.formData();
  const parsed = z.object({
    altText: z.string().trim().min(3).max(180), caption: z.string().trim().max(240),
    sortOrder: z.coerce.number().int().min(0).max(9999), isPublished: z.boolean(),
  }).safeParse({ altText: form.get("altText"), caption: form.get("caption"), sortOrder: form.get("sortOrder"), isPublished: form.get("isPublished") === "on" });
  if (!parsed.success) return Response.json({ error: "Check the image description, caption and display order." }, { status: 400 });
  const file = form.get("image");
  let replacement: { objectKey: string; contentType: string } | undefined;
  if (file instanceof File && file.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) return Response.json({ error: "Choose a JPG, PNG or WebP under 8 MB." }, { status: 400 });
    replacement = { objectKey: `gallery/${crypto.randomUUID()}`, contentType: file.type };
    await putStoredObject(replacement.objectKey, new Uint8Array(await file.arrayBuffer()));
  }
  try {
    await getDb().update(galleryImages).set({ ...parsed.data, ...replacement }).where(eq(galleryImages.id, id));
  } catch (error) {
    if (replacement) await deleteStoredObject(replacement.objectKey);
    throw error;
  }
  if (replacement) await deleteStoredObject(image.objectKey);
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { id } = await params;
  const [image] = await getDb()
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.id, id))
    .limit(1);
  if (!image) return Response.json({ error: "Not found" }, { status: 404 });
  await deleteStoredObject(image.objectKey);
  await getDb().delete(galleryImages).where(eq(galleryImages.id, id));
  return Response.json({ ok: true });
}
