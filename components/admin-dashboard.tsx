"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock3,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Mail,
  MessageCircle,
  Share2,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Appointment = {
  id: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  whatsappConsent: boolean;
};
type Block = {
  id: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};
type Review = {
  id: string;
  customerName: string;
  rating: number;
  body: string;
  status: string;
  createdAt: string;
};
type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceFromPence: number | null;
  consultationRequired: boolean;
  active: boolean;
  sortOrder: number;
};
type BusinessHours = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
};
type DashboardData = {
  appointments: Appointment[];
  blockedSlots: Block[];
  reviews: Review[];
  services: Service[];
  businessHours: BusinessHours[];
  socialLinks: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  today: string;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AdminDashboard({
  adminName,
  signOutPath,
  config,
}: {
  adminName: string;
  signOutPath: string;
  config: { email: boolean; whatsapp: boolean; reminders: boolean };
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/appointments");
    if (response.ok) setData(await response.json());
    else setMessage("The diary could not be loaded.");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/appointments")
      .then(async (response) => {
        if (!active) return;
        if (response.ok) setData(await response.json());
        else setMessage("The diary could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const todayAppointments = useMemo(
    () => data?.appointments.filter((item) => item.appointmentDate === data.today) ?? [],
    [data],
  );
  const upcoming = useMemo(
    () => data?.appointments.filter((item) => item.appointmentDate !== data.today) ?? [],
    [data],
  );

  async function updateAppointment(id: string, status: string) {
    await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.get("date"),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
        reason: form.get("reason"),
      }),
    });
    setMessage(response.ok ? "Time blocked successfully." : "Check the block details.");
    if (response.ok) event.currentTarget.reset();
    await load();
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/admin/blocks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  async function moderateReview(id: string, status: string) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function uploadImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/gallery", { method: "POST", body: form });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Gallery image uploaded." : result.error ?? "Upload failed.");
    if (response.ok) event.currentTarget.reset();
  }

  async function saveService(event: FormEvent<HTMLFormElement>, service: Service) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pounds = String(form.get("price") ?? "").trim();
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "service",
        id: service.id,
        name: form.get("name"),
        description: form.get("description"),
        durationMinutes: Number(form.get("duration")),
        priceFromPence: pounds ? Math.round(Number(pounds) * 100) : null,
        consultationRequired: form.get("consultationRequired") === "on",
        active: form.get("active") === "on",
        sortOrder: service.sortOrder,
      }),
    });
    setMessage(response.ok ? `${String(form.get("name"))} updated.` : "The service could not be saved.");
    if (response.ok) await load();
  }

  async function saveHours(event: FormEvent<HTMLFormElement>, hours: BusinessHours) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "hours",
        dayOfWeek: hours.dayOfWeek,
        opensAt: form.get("opensAt"),
        closesAt: form.get("closesAt"),
        isClosed: form.get("isClosed") === "on",
      }),
    });
    setMessage(response.ok ? `${DAY_NAMES[hours.dayOfWeek]} hours updated.` : "The opening hours could not be saved.");
    if (response.ok) await load();
  }

  async function saveSocialLinks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "socials",
        instagram: form.get("instagram"),
        facebook: form.get("facebook"),
        tiktok: form.get("tiktok"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Social links updated on the website." : result.error ?? "Check the profile addresses.");
    if (response.ok) await load();
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link href="/" aria-label="View Peaches Hair website">
          <Image src="/images/peaches-hair-logo.webp" width={245} height={138} alt="Peaches Hair" />
        </Link>
        <div>
          <span><UserRound /> {adminName}</span>
          <a href={signOutPath}><LogOut /> Sign out</a>
        </div>
      </header>

      <section className="admin-welcome">
        <div>
          <p className="eyebrow">Salon diary</p>
          <h1>Good to see you.</h1>
          <p>Manage today, protect your time and keep every client looked after.</p>
        </div>
        <Button onClick={load} variant="outline"><RefreshCw className={loading ? "spin" : ""} /> Refresh</Button>
      </section>

      <div className="admin-metrics">
        <article><CalendarDays /><span><strong>{todayAppointments.length}</strong>Today</span></article>
        <article><Clock3 /><span><strong>{upcoming.length}</strong>Upcoming</span></article>
        <article><Star /><span><strong>{data?.reviews.filter((r) => r.status === "pending").length ?? 0}</strong>Reviews waiting</span></article>
      </div>

      {message && <p className="admin-message" aria-live="polite">{message}</p>}

      <Tabs defaultValue="diary" className="admin-tabs">
        <TabsList>
          <TabsTrigger value="diary">Diary</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="services">Services & hours</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="socials">Social links</TabsTrigger>
          <TabsTrigger value="setup">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="diary">
          {loading ? (
            <p className="admin-loading"><LoaderCircle className="spin" /> Loading the diary…</p>
          ) : (
            <>
              <h2>Today</h2>
              <AppointmentList rows={todayAppointments} onStatus={updateAppointment} empty="No appointments today." />
              <h2 className="admin-subheading">Coming up</h2>
              <AppointmentList rows={upcoming} onStatus={updateAppointment} empty="No upcoming appointments." />
            </>
          )}
        </TabsContent>

        <TabsContent value="services">
          <div className="admin-settings-layout">
            <section>
              <h2>Services</h2>
              <p className="settings-intro">Change service names, timings, starting prices and what clients can book online.</p>
              <div className="service-admin-list">
                {data?.services.map((service) => (
                  <form className="admin-card service-admin-form" key={service.id} onSubmit={(event) => saveService(event, service)}>
                    <div className="form-row">
                      <label>Service name<Input name="name" defaultValue={service.name} required /></label>
                      <label>Duration in minutes<Input name="duration" type="number" min="15" max="480" step="15" defaultValue={service.durationMinutes} required /></label>
                    </div>
                    <label>Description<Textarea name="description" defaultValue={service.description} /></label>
                    <label>Starting price in pounds <small>Leave blank when quoted after consultation</small><Input name="price" type="number" min="0" step="0.01" defaultValue={service.priceFromPence ? service.priceFromPence / 100 : ""} /></label>
                    <div className="settings-checks">
                      <label><input type="checkbox" name="consultationRequired" defaultChecked={service.consultationRequired} /> Consultation required</label>
                      <label><input type="checkbox" name="active" defaultChecked={service.active} /> Available online</label>
                    </div>
                    <Button type="submit" size="sm">Save service</Button>
                  </form>
                ))}
              </div>
            </section>
            <section>
              <h2>Opening hours</h2>
              <p className="settings-intro">These hours control the dates and times offered to clients.</p>
              <div className="hours-admin-list">
                {data?.businessHours.map((hours) => (
                  <form className="admin-card hours-row" key={hours.dayOfWeek} onSubmit={(event) => saveHours(event, hours)}>
                    <strong>{DAY_NAMES[hours.dayOfWeek]}</strong>
                    <Input aria-label="Opening time" type="time" name="opensAt" defaultValue={hours.opensAt} />
                    <Input aria-label="Closing time" type="time" name="closesAt" defaultValue={hours.closesAt} />
                    <label><input type="checkbox" name="isClosed" defaultChecked={hours.isClosed} /> Closed</label>
                    <Button type="submit" size="sm" variant="outline">Save</Button>
                  </form>
                ))}
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="admin-two-column">
            <form className="admin-card" onSubmit={createBlock}>
              <h2>Block out time</h2>
              <p>Add holidays, breaks, training or any time that clients cannot book.</p>
              <label>Date<Input type="date" name="date" required /></label>
              <div className="form-row">
                <label>From<Input type="time" name="startTime" required /></label>
                <label>To<Input type="time" name="endTime" required /></label>
              </div>
              <label>Reason<Input name="reason" placeholder="Holiday, lunch, training…" required /></label>
              <Button type="submit">Block this time</Button>
            </form>
            <div className="admin-card">
              <h2>Upcoming blocked time</h2>
              <div className="block-list">
                {data?.blockedSlots.length ? data.blockedSlots.map((block) => (
                  <div key={block.id}>
                    <span><strong>{block.blockedDate}</strong>{block.startTime}–{block.endTime} · {block.reason}</span>
                    <Button variant="ghost" size="icon" onClick={() => deleteBlock(block.id)} aria-label="Remove block"><Trash2 /></Button>
                  </div>
                )) : <p>No time is blocked.</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="review-admin-list">
            {data?.reviews.length ? data.reviews.map((review) => (
              <article className="admin-card" key={review.id}>
                <div className="review-admin-top">
                  <strong>{review.customerName}</strong>
                  <Badge variant={review.status === "approved" ? "default" : "outline"}>{review.status}</Badge>
                </div>
                <div className="mini-stars">{Array.from({ length: review.rating }, (_, i) => <Star key={i} />)}</div>
                <p>{review.body}</p>
                <div className="admin-actions">
                  <Button size="sm" onClick={() => moderateReview(review.id, "approved")}><Check /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => moderateReview(review.id, "rejected")}>Hide</Button>
                </div>
              </article>
            )) : <p>No reviews have been submitted yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <form className="admin-card gallery-upload" onSubmit={uploadImage}>
            <ImagePlus />
            <h2>Add colour work to the gallery</h2>
            <p>Use a clear JPG, PNG or WebP image up to 8 MB.</p>
            <Input type="file" name="image" accept="image/jpeg,image/png,image/webp" required />
            <label>Image description<Input name="altText" placeholder="Warm blonde balayage with soft waves" required /></label>
            <label>Optional caption<Textarea name="caption" placeholder="A short note about the result" /></label>
            <Button type="submit">Upload image</Button>
          </form>
        </TabsContent>

        <TabsContent value="socials">
          {data && (
            <form className="admin-card social-settings-form" onSubmit={saveSocialLinks}>
              <Share2 />
              <div>
                <h2>Social profiles</h2>
                <p>Add the complete profile addresses below. Leave a field blank to hide that social link from the website.</p>
              </div>
              <label>Instagram profile<Input type="url" name="instagram" placeholder="https://instagram.com/your-profile" defaultValue={data.socialLinks.instagram} /></label>
              <label>Facebook page<Input type="url" name="facebook" placeholder="https://facebook.com/your-page" defaultValue={data.socialLinks.facebook} /></label>
              <label>TikTok profile<Input type="url" name="tiktok" placeholder="https://tiktok.com/@your-profile" defaultValue={data.socialLinks.tiktok} /></label>
              <Button type="submit">Save social links</Button>
            </form>
          )}
        </TabsContent>

        <TabsContent value="setup">
          <div className="config-grid">
            <ConfigCard icon={<Mail />} title="Email alerts" ready={config.email} text="Booking confirmations for clients and new-booking alerts for the salon." />
            <ConfigCard icon={<MessageCircle />} title="WhatsApp alerts" ready={config.whatsapp} text="Instant admin alerts and opted-in client reminders through WhatsApp Business." />
            <ConfigCard icon={<Clock3 />} title="24-hour reminders" ready={config.reminders} text="A secure reminder task checks tomorrow’s diary and sends friendly messages." />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function AppointmentList({
  rows,
  onStatus,
  empty,
}: {
  rows: Appointment[];
  onStatus: (id: string, status: string) => void;
  empty: string;
}) {
  if (!rows.length) return <p className="admin-empty">{empty}</p>;
  return (
    <div className="appointment-list">
      {rows.map((appointment) => (
        <article key={appointment.id}>
          <time><strong>{appointment.startTime}</strong><span>{appointment.appointmentDate}</span></time>
          <div className="appointment-person">
            <strong>{appointment.customerName}</strong>
            <span>{appointment.serviceName} · until {appointment.endTime}</span>
            <small>{appointment.customerPhone} · {appointment.customerEmail}</small>
            {appointment.notes && <p>{appointment.notes}</p>}
          </div>
          <Badge variant={appointment.status === "confirmed" ? "default" : "outline"}>{appointment.status.replace("_", " ")}</Badge>
          <div className="admin-actions">
            <Button size="sm" variant="outline" onClick={() => onStatus(appointment.id, "completed")}>Complete</Button>
            <Button size="sm" variant="ghost" onClick={() => onStatus(appointment.id, "cancelled")}>Cancel</Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ConfigCard({
  icon,
  title,
  ready,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  ready: boolean;
  text: string;
}) {
  return (
    <article className="admin-card config-card">
      <span>{icon}</span>
      <div><h2>{title}</h2><p>{text}</p></div>
      <Badge variant={ready ? "default" : "outline"}>{ready ? <><ShieldCheck /> Ready</> : "Needs setup"}</Badge>
    </article>
  );
}
