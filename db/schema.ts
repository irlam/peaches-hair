import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    serviceId: text("service_id").notNull(),
    serviceName: text("service_name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    notes: text("notes").notNull().default(""),
    appointmentDate: text("appointment_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    startsAt: integer("starts_at").notNull(),
    status: text("status").notNull().default("confirmed"),
    whatsappConsent: integer("whatsapp_consent", { mode: "boolean" })
      .notNull()
      .default(false),
    reminderSentAt: text("reminder_sent_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_appointments_date_status").on(
      table.appointmentDate,
      table.status,
    ),
    index("idx_appointments_starts_at").on(table.startsAt),
    index("idx_appointments_email").on(table.customerEmail),
  ],
);

export const appointmentSlots = sqliteTable(
  "appointment_slots",
  {
    appointmentDate: text("appointment_date").notNull(),
    startTime: text("start_time").notNull(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      name: "pk_appointment_slots",
      columns: [table.appointmentDate, table.startTime],
    }),
    index("idx_appointment_slots_appointment").on(table.appointmentId),
  ],
);

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    durationMinutes: integer("duration_minutes").notNull(),
    priceFromPence: integer("price_from_pence"),
    consultationRequired: integer("consultation_required", { mode: "boolean" })
      .notNull()
      .default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_services_active_sort").on(table.active, table.sortOrder)],
);

export const businessHours = sqliteTable("business_hours", {
  dayOfWeek: integer("day_of_week").primaryKey(),
  opensAt: text("opens_at").notNull(),
  closesAt: text("closes_at").notNull(),
  isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
});

export const blockedSlots = sqliteTable(
  "blocked_slots",
  {
    id: text("id").primaryKey(),
    blockedDate: text("blocked_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    reason: text("reason").notNull().default("Unavailable"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_blocked_slots_date").on(table.blockedDate)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_reviews_status_created").on(table.status, table.createdAt)],
);

export const galleryImages = sqliteTable(
  "gallery_images",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    altText: text("alt_text").notNull(),
    caption: text("caption").notNull().default(""),
    contentType: text("content_type").notNull(),
    isPublished: integer("is_published", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_gallery_published_sort").on(
      table.isPublished,
      table.sortOrder,
      table.createdAt,
    ),
  ],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
