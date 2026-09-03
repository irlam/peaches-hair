import { env } from "cloudflare:workers";
import { friendlyDate } from "./time";

type AppointmentNotice = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  startTime: string;
  serviceName: string;
  notes?: string;
  whatsappConsent?: boolean;
};

type RuntimeValues = Record<string, unknown>;

function config(name: string) {
  return String((env as unknown as RuntimeValues)[name] ?? "").trim();
}

async function sendEmail(to: string[], subject: string, html: string) {
  const apiKey = config("RESEND_API_KEY");
  const from = config("EMAIL_FROM") || "Peaches Hair <appointments@peaches.hair>";
  if (!apiKey || to.length === 0) return { sent: false, reason: "not_configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { sent: true };
}

async function sendWhatsApp(to: string, template: string, parameters: string[]) {
  const token = config("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = config("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId || !to) {
    return { sent: false, reason: "not_configured" };
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/\D/g, ""),
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
  if (!response.ok) throw new Error(`WhatsApp provider returned ${response.status}`);
  return { sent: true };
}

function emailShell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e8;color:#211d18;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:36px 22px"><div style="background:#fff;border:1px solid #e8dcc2;border-radius:22px;padding:30px"><p style="letter-spacing:.2em;color:#9a824d;margin:0 0 8px">PEACHES HAIR</p><h1 style="font-family:Georgia,serif;font-weight:400;margin:0 0 20px">${title}</h1>${body}<p style="margin:26px 0 0;color:#6e665c">Peaches Hair · Hair Colour Specialist · Bolton</p></div></div></body></html>`;
}

export async function sendBookingNotifications(appointment: AppointmentNotice) {
  const date = friendlyDate(appointment.appointmentDate);
  const adminEmail = config("SALON_EMAIL");
  const siteUrl = config("PUBLIC_SITE_URL") || "https://peaches.hair";
  const customerBody = emailShell(
    "Your appointment is booked",
    `<p>Hi ${appointment.customerName},</p><p>We’re looking forward to seeing you for <strong>${appointment.serviceName}</strong> on <strong>${date} at ${appointment.startTime}</strong>.</p><p>If anything changes, please contact us as soon as you can.</p><p><a href="${siteUrl}" style="display:inline-block;background:#211d18;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none">View Peaches Hair</a></p>`,
  );
  const adminBody = emailShell(
    "New online booking",
    `<p><strong>${appointment.customerName}</strong> booked ${appointment.serviceName}.</p><p>${date} at ${appointment.startTime}<br>${appointment.customerEmail}<br>${appointment.customerPhone}</p><p>${appointment.notes || "No notes supplied."}</p><p><a href="${siteUrl}/admin">Open the diary</a></p>`,
  );

  const tasks: Promise<unknown>[] = [
    sendEmail([appointment.customerEmail], "Your Peaches Hair appointment", customerBody),
  ];
  if (adminEmail) {
    tasks.push(sendEmail([adminEmail], `New booking: ${appointment.customerName}`, adminBody));
  }
  const adminWhatsApp = config("ADMIN_WHATSAPP_NUMBER");
  if (adminWhatsApp) {
    tasks.push(
      sendWhatsApp(adminWhatsApp, config("WHATSAPP_ADMIN_TEMPLATE") || "new_booking", [
        appointment.customerName,
        appointment.serviceName,
        date,
        appointment.startTime,
      ]),
    );
  }
  return Promise.allSettled(tasks);
}

export async function sendReminder(appointment: AppointmentNotice) {
  const date = friendlyDate(appointment.appointmentDate);
  const body = emailShell(
    "A friendly appointment reminder",
    `<p>Hi ${appointment.customerName},</p><p>Just a friendly reminder that your <strong>${appointment.serviceName}</strong> appointment is tomorrow, <strong>${date} at ${appointment.startTime}</strong>.</p><p>We can’t wait to welcome you to Peaches Hair.</p>`,
  );
  const tasks: Promise<unknown>[] = [
    sendEmail([appointment.customerEmail], "A reminder from Peaches Hair", body),
  ];
  if (appointment.whatsappConsent) {
    tasks.push(
      sendWhatsApp(
        appointment.customerPhone,
        config("WHATSAPP_REMINDER_TEMPLATE") || "appointment_reminder",
        [appointment.customerName, appointment.serviceName, date, appointment.startTime],
      ),
    );
  }
  return Promise.allSettled(tasks);
}
