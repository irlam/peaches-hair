"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Photo = { id: string; altText: string; caption: string; isPublished: boolean; sortOrder: number };
export function GalleryManager() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  async function load() {
    const response = await fetch("/api/admin/gallery");
    if (!response.ok) throw new Error("Could not load the gallery.");
    const data = await response.json();
    setPhotos(data.images);
    setVersion((n) => n + 1);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/admin/gallery").then(async (response) => {
      if (!response.ok) throw new Error("Could not load the gallery.");
      const data = await response.json();
      if (active) setPhotos(data.images);
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/gallery${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the image.");
      if (!id) form.reset();
      await load();
      setMessage(id ? "Image updated on the website." : "Image uploaded.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Permanently delete this gallery photo?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete the photo.");
      await load(); setMessage("Photo deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="gallery-manager">
    <form className="admin-card gallery-upload" onSubmit={(event) => save(event)}>
      <h2>Add a gallery photo</h2><p>JPG, PNG or WebP, up to 8 MB.</p>
      <label>Photo<Input type="file" name="image" accept="image/jpeg,image/png,image/webp" required /></label>
      <label>Image description<Input name="altText" minLength={3} maxLength={180} required /></label>
      <label>Caption<Textarea name="caption" maxLength={240} /></label>
      <Button disabled={busy}>Upload photo</Button>
    </form>
    <p role="status">{message}</p>
    <div className="gallery-edit-grid">{photos.map((photo) => <form key={`${photo.id}-${version}`} className="admin-card gallery-upload" onSubmit={(event) => save(event, photo.id)}>
      <Image className="gallery-edit-preview" src={`/api/admin/gallery/${photo.id}?v=${version}`} width={480} height={360} alt={photo.altText} unoptimized />
      <label>Image description<Input name="altText" defaultValue={photo.altText} minLength={3} maxLength={180} required /></label>
      <label>Caption<Textarea name="caption" defaultValue={photo.caption} maxLength={240} /></label>
      <label>Display order (lowest first)<Input type="number" name="sortOrder" min={0} max={9999} defaultValue={photo.sortOrder} required /></label>
      <label><input type="checkbox" name="isPublished" defaultChecked={photo.isPublished} /> Show on website</label>
      <label>Replace photo (optional)<Input type="file" name="image" accept="image/jpeg,image/png,image/webp" /></label>
      <div className="admin-actions"><Button disabled={busy}>Save changes</Button><Button type="button" variant="outline" disabled={busy} onClick={() => remove(photo.id)}>Delete</Button></div>
    </form>)}</div>
  </div>;
}
