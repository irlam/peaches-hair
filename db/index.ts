import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const CREATE_SCHEMA = `
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  notes TEXT DEFAULT '' NOT NULL,
  appointment_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  status TEXT DEFAULT 'confirmed' NOT NULL,
  whatsapp_consent INTEGER DEFAULT 0 NOT NULL,
  reminder_sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments (customer_email);

CREATE TABLE IF NOT EXISTS appointment_slots (
  appointment_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  appointment_id TEXT NOT NULL,
  PRIMARY KEY (appointment_date, start_time),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_appointment ON appointment_slots (appointment_id);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_from_pence INTEGER,
  consultation_required INTEGER DEFAULT 0 NOT NULL,
  active INTEGER DEFAULT 1 NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_active_sort ON services (active, sort_order);

CREATE TABLE IF NOT EXISTS business_hours (
  day_of_week INTEGER PRIMARY KEY NOT NULL,
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS blocked_slots (
  id TEXT PRIMARY KEY NOT NULL,
  blocked_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT DEFAULT 'Unavailable' NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots (blocked_date);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY NOT NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews (status, created_at);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  caption TEXT DEFAULT '' NOT NULL,
  content_type TEXT NOT NULL,
  is_published INTEGER DEFAULT 1 NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gallery_published_sort ON gallery_images (is_published, sort_order, created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

type GlobalDatabase = typeof globalThis & {
  peachesSqlite?: Database.Database;
  peachesDb?: BetterSQLite3Database<typeof schema>;
};

function databasePath() {
  return path.join(process.cwd(), "data", "peaches.sqlite");
}

export function getDb() {
  const runtime = globalThis as GlobalDatabase;
  if (!runtime.peachesSqlite) {
    const filename = databasePath();
    mkdirSync(path.dirname(filename), { recursive: true });
    const sqlite = new Database(filename);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.exec(CREATE_SCHEMA);
    runtime.peachesSqlite = sqlite;
    runtime.peachesDb = drizzle(sqlite, { schema });
  }
  return runtime.peachesDb!;
}
