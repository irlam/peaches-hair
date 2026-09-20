"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { posterSchema, type PricePoster } from "@/lib/poster";

type Service = { name: string; priceFromPence: number | null; active: boolean };
function serviceRows(services: Service[]) {
  return services.filter((s) => s.active).slice(0, 12).map((s) => ({ name: s.name, price: s.priceFromPence ? `From £${(s.priceFromPence / 100).toFixed(2)}` : "On consultation" }));
}

export function drawPoster(canvas: HTMLCanvasElement, poster: PricePoster, logo: HTMLImageElement) {
  const sizes = { square: [1080, 1080], portrait: [1080, 1350], a4: [2480, 3508] };
  [canvas.width, canvas.height] = sizes[poster.format];
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image export is not supported in this browser.");
  const scale = canvas.width / 1080;
  ctx.scale(scale, scale);
  const h = canvas.height / scale;
  ctx.fillStyle = "#faf6ed"; ctx.fillRect(0, 0, 1080, h);
  ctx.strokeStyle = "#bca36c"; ctx.lineWidth = 3; ctx.strokeRect(28, 28, 1024, h - 56);
  ctx.lineWidth = 1; ctx.strokeRect(38, 38, 1004, h - 76);
  const logoHeight = 195;
  const logoWidth = logoHeight * logo.naturalWidth / logo.naturalHeight;
  ctx.drawImage(logo, (1080 - logoWidth) / 2, 55, logoWidth, logoHeight);
  const fit = (text: string, x: number, y: number, width: number, size: number, font = "Arial") => {
    ctx.font = `${size}px ${font}`;
    while (ctx.measureText(text).width > width && size > 12) { size -= 1; ctx.font = `${size}px ${font}`; }
    ctx.fillText(text, x, y);
  };
  ctx.fillStyle = "#272219"; ctx.textAlign = "center";
  fit(poster.title, 540, 302, 880, 58, "Georgia");
  ctx.fillStyle = "#756447"; fit(poster.subtitle, 540, 347, 880, 23);
  ctx.beginPath(); ctx.moveTo(90, 377); ctx.lineTo(990, 377); ctx.stroke();
  const rowHeight = Math.min(100, (h - 610) / Math.max(poster.rows.length, 1));
  const textSize = Math.min(30, rowHeight * 0.58);
  poster.rows.forEach((row, index) => {
    const y = 412 + rowHeight * (index + 0.65);
    ctx.fillStyle = "#272219"; ctx.textAlign = "left"; fit(row.name, 90, y, 550, textSize);
    ctx.fillStyle = "#756447"; ctx.textAlign = "right"; fit(row.price, 990, y, 310, textSize);
    ctx.strokeStyle = "#ded2b7"; ctx.beginPath(); ctx.moveTo(90, y + rowHeight * 0.28); ctx.lineTo(990, y + rowHeight * 0.28); ctx.stroke();
  });
  ctx.textAlign = "center"; ctx.fillStyle = "#756447"; ctx.font = "21px Arial";
  const words = poster.footer.split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) { const next = `${line} ${word}`.trim(); if (ctx.measureText(next).width > 850 && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line);
  lines.forEach((text, index) => fit(text, 540, h - 140 + index * 28, 880, 21));
  ctx.fillStyle = "#272219"; fit("peaches.hair", 540, h - 60, 880, 28, "Georgia");
}

export function PricePosterEditor({ services }: { services: Service[] }) {
  const [poster, setPoster] = useState<PricePoster>({ title: "Our price list", subtitle: "Hair colour specialist · Bolton", footer: "Prices from. Final price confirmed at consultation. Book online at peaches.hair.", format: "portrait", rows: serviceRows(services) });
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let active = true;
    const image = new window.Image(); image.onload = () => { if (active) setLogo(image); };
    image.onerror = () => { if (active) setMessage("The Peaches logo could not load. Refresh to try again."); };
    image.src = "/images/peaches-hair-logo.webp";
    fetch("/api/admin/poster").then(async (response) => {
      if (!response.ok) throw new Error("Could not load your saved poster. Refresh to try again.");
      const data = await response.json();
      if (!active) return;
      if (data.poster) setPoster(posterSchema.parse(data.poster));
      setReady(true);
    }).catch((error) => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (logo && canvas.current) drawPoster(canvas.current, poster, logo); }, [poster, logo]);
  function change(update: Partial<PricePoster>) { setPoster((current) => ({ ...current, ...update })); setDirty(true); }
  async function save() {
    if (!posterSchema.safeParse(poster).success) { setMessage("Add a title and a name and price for every service."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/poster", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(poster) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save poster.");
      setDirty(false); setMessage("Poster saved. You can return and edit it later.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  function download() {
    canvas.current?.toBlob((blob) => {
      if (!blob) { setMessage("Could not create the image. Please try again."); return; }
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `peaches-hair-price-list-${poster.format}.png`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, "image/png");
  }
  function print() {
    if (!logo) return;
    const popup = window.open("", "_blank");
    if (!popup) { setMessage("Allow pop-ups to open the print version."); return; }
    const page = document.createElement("canvas"); drawPoster(page, { ...poster, format: "a4" }, logo);
    popup.document.write('<!doctype html><html><head><title>Peaches Hair price list</title><style>@page{size:A4 portrait;margin:0}body{margin:0}img{display:block;width:210mm;height:297mm;max-width:100%}</style></head><body></body></html>');
    popup.document.close();
    const image = popup.document.createElement("img"); image.alt = "Peaches Hair price list";
    image.onload = () => { popup.focus(); popup.print(); }; image.src = page.toDataURL("image/png"); popup.document.body.appendChild(image);
  }
  return <div className="poster-editor">
    <div className="admin-card poster-controls">
      <h2>Price-list studio</h2><p>Create a branded social image or an A4 poster. Poster edits do not change your booking prices.</p>
      <fieldset disabled={!ready || busy}>
        <label>Title<Input value={poster.title} maxLength={50} onChange={(e) => change({ title: e.target.value })} /></label>
        <label>Subtitle<Input value={poster.subtitle} maxLength={90} onChange={(e) => change({ subtitle: e.target.value })} /></label>
        <label>Size<select value={poster.format} onChange={(e) => change({ format: e.target.value as PricePoster["format"] })}><option value="portrait">Social portrait · 1080 × 1350</option><option value="square">Social square · 1080 × 1080</option><option value="a4">A4 print · 2480 × 3508</option></select></label>
        <Button type="button" variant="outline" onClick={() => { if (window.confirm("Replace these poster rows with your current active services and prices?")) change({ rows: serviceRows(services) }); }}>Use current service prices</Button>
        {poster.rows.map((row, index) => <div className="poster-row" key={index}>
          <label>Service {index + 1}<Input value={row.name} maxLength={65} onChange={(e) => change({ rows: poster.rows.map((r, i) => i === index ? { ...r, name: e.target.value } : r) })} /></label>
          <label>Price<Input value={row.price} maxLength={35} onChange={(e) => change({ rows: poster.rows.map((r, i) => i === index ? { ...r, price: e.target.value } : r) })} /></label>
          <Button type="button" variant="outline" aria-label={`Remove service ${index + 1}`} onClick={() => change({ rows: poster.rows.filter((_, i) => i !== index) })}>Remove</Button>
        </div>)}
        <Button type="button" variant="outline" disabled={poster.rows.length >= 12} onClick={() => change({ rows: [...poster.rows, { name: "", price: "" }] })}>Add service</Button>
        <label>Footer note<Textarea maxLength={180} value={poster.footer} onChange={(e) => change({ footer: e.target.value })} /></label>
        <Button type="button" onClick={save}>{busy ? "Saving…" : "Save poster"}</Button>
      </fieldset>
      <p role="status">{message} {dirty && "Unsaved changes."}</p>
    </div>
    <div className="poster-preview">
      <canvas ref={canvas} aria-label="Live preview of your Peaches Hair price-list poster" role="img" />
      <div className="admin-actions"><Button disabled={!ready || !logo || !posterSchema.safeParse(poster).success} onClick={download}>Download PNG</Button><Button variant="outline" disabled={!ready || !logo || !posterSchema.safeParse(poster).success} onClick={print}>Print / Save PDF</Button></div>
      <p>Print opens an A4 version. Choose “Save as PDF” in your print options, with headers and footers off.</p>
    </div>
  </div>;
}
