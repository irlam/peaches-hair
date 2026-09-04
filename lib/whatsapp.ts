import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export type WhatsAppSettings = {
  publicNumber: string;
  adminNumber: string;
  showPublicChat: boolean;
  adminAlertsEnabled: boolean;
  customerConfirmationsEnabled: boolean;
  customerRemindersEnabled: boolean;
  adminTemplate: string;
  confirmationTemplate: string;
  reminderTemplate: string;
};

export const WHATSAPP_SETTING_KEYS = {
  publicNumber: "whatsapp.public_number",
  adminNumber: "whatsapp.admin_number",
  showPublicChat: "whatsapp.show_public_chat",
  adminAlertsEnabled: "whatsapp.admin_alerts_enabled",
  customerConfirmationsEnabled: "whatsapp.customer_confirmations_enabled",
  customerRemindersEnabled: "whatsapp.customer_reminders_enabled",
  adminTemplate: "whatsapp.admin_template",
  confirmationTemplate: "whatsapp.confirmation_template",
  reminderTemplate: "whatsapp.reminder_template",
} as const;

function config(name: string) {
  return String(process.env[name] ?? "").trim();
}

function settingBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "true";
}

export function normaliseWhatsAppNumber(value: string) {
  let number = value.trim().replace(/[\s().-]/g, "");
  if (!number) return "";
  if (number.startsWith("00")) number = `+${number.slice(2)}`;
  if (/^0\d{9,10}$/.test(number)) number = `+44${number.slice(1)}`;
  if (/^44\d{9,10}$/.test(number)) number = `+${number}`;
  return /^\+[1-9]\d{7,14}$/.test(number) ? number : null;
}

export function whatsAppApiConfigured() {
  return Boolean(config("WHATSAPP_ACCESS_TOKEN") && config("WHATSAPP_PHONE_NUMBER_ID"));
}

export function whatsAppSettingsFromRows(
  rows: Array<{ key: string; value: string }>,
): WhatsAppSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const stored = (key: (typeof WHATSAPP_SETTING_KEYS)[keyof typeof WHATSAPP_SETTING_KEYS]) =>
    values.get(key);
  const legacyAdminNumber = normaliseWhatsAppNumber(config("ADMIN_WHATSAPP_NUMBER")) || "";

  return {
    publicNumber: normaliseWhatsAppNumber(stored(WHATSAPP_SETTING_KEYS.publicNumber) || "") || "",
    adminNumber:
      normaliseWhatsAppNumber(
        stored(WHATSAPP_SETTING_KEYS.adminNumber) || legacyAdminNumber,
      ) || "",
    showPublicChat: settingBoolean(
      stored(WHATSAPP_SETTING_KEYS.showPublicChat),
      false,
    ),
    adminAlertsEnabled: settingBoolean(
      stored(WHATSAPP_SETTING_KEYS.adminAlertsEnabled),
      Boolean(legacyAdminNumber),
    ),
    customerConfirmationsEnabled: settingBoolean(
      stored(WHATSAPP_SETTING_KEYS.customerConfirmationsEnabled),
      false,
    ),
    customerRemindersEnabled: settingBoolean(
      stored(WHATSAPP_SETTING_KEYS.customerRemindersEnabled),
      true,
    ),
    adminTemplate:
      stored(WHATSAPP_SETTING_KEYS.adminTemplate) ||
      config("WHATSAPP_ADMIN_TEMPLATE") ||
      "new_booking",
    confirmationTemplate:
      stored(WHATSAPP_SETTING_KEYS.confirmationTemplate) ||
      config("WHATSAPP_CONFIRMATION_TEMPLATE") ||
      "booking_confirmation",
    reminderTemplate:
      stored(WHATSAPP_SETTING_KEYS.reminderTemplate) ||
      config("WHATSAPP_REMINDER_TEMPLATE") ||
      "appointment_reminder",
  };
}

export async function getWhatsAppSettings() {
  const rows = await getDb()
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, Object.values(WHATSAPP_SETTING_KEYS)));
  return whatsAppSettingsFromRows(rows);
}

export function whatsAppChatUrl(number: string) {
  const normalised = normaliseWhatsAppNumber(number);
  if (!normalised) return "";
  const greeting = encodeURIComponent(
    "Hi Peaches Hair, I’d like to ask about an appointment.",
  );
  return `https://wa.me/${normalised.slice(1)}?text=${greeting}`;
}

type MetaErrorResponse = {
  error?: { code?: number; message?: string };
  messages?: Array<{ id?: string }>;
};

export async function sendWhatsAppTemplate(
  to: string,
  template: string,
  parameters: string[],
) {
  const token = config("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = config("WHATSAPP_PHONE_NUMBER_ID");
  const normalised = normaliseWhatsAppNumber(to);
  if (!token || !phoneNumberId) {
    return { sent: false as const, reason: "not_configured" };
  }
  if (!normalised) return { sent: false as const, reason: "invalid_number" };

  const configuredVersion = config("WHATSAPP_GRAPH_API_VERSION");
  const graphVersion = /^v\d+\.\d+$/.test(configuredVersion)
    ? configuredVersion
    : "v22.0";
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalised.slice(1),
        type: "template",
        template: {
          name: template,
          language: { code: "en_GB" },
          components: [
            {
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    },
  );
  const result = (await response.json().catch(() => ({}))) as MetaErrorResponse;
  if (!response.ok) {
    const detail = result.error?.message?.replace(/[\r\n]+/g, " ").slice(0, 300);
    throw new Error(
      detail || `Meta WhatsApp returned error ${response.status}.`,
    );
  }
  return { sent: true as const, messageId: result.messages?.[0]?.id || "" };
}
