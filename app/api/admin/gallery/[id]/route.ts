import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { galleryImages } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { deleteStoredObject } from "@/lib/storage";

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
