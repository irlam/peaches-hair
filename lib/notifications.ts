import { friendlyDate } from "./time";
import { getWhatsAppSettings, sendWhatsAppTemplate } from "./whatsapp";

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

function config(name: string) {
  return String(process.env[name] ?? "").trim();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const escaped: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return escaped[character];
  });
}

function emailSubjectValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
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

function emailShell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e8;color:#211d18;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:36px 22px"><div style="background:#fff;border:1px solid #e8dcc2;border-radius:22px;padding:30px"><p style="letter-spacing:.2em;color:#9a824d;margin:0 0 8px">PEACHES HAIR</p><h1 style="font-family:Georgia,serif;font-weight:400;margin:0 0 20px">${title}</h1>${body}<p style="margin:26px 0 0;color:#6e665c">Peaches Hair · Hair Colour Specialist · Bolton</p></div></div></body></html>`;
}

export async function sendBookingNotifications(appointment: AppointmentNotice) {
  const date = friendlyDate(appointment.appointmentDate);
  const adminEmail = config("SALON_EMAIL");
  const siteUrl = config("PUBLIC_SITE_URL") || "https://peaches.hair";
  const customerName = escapeHtml(appointment.customerName);
  const serviceName = escapeHtml(appointment.serviceName);
  const safeDate = escapeHtml(date);
  const safeTime = escapeHtml(appointment.startTime);
  const safeSiteUrl = escapeHtml(siteUrl);
  const customerBody = emailShell(
    "Your appointment is booked",
    `<p>Hi ${customerName},</p><p>We’re looking forward to seeing you for <strong>${serviceName}</strong> on <strong>${safeDate} at ${safeTime}</strong>.</p><p>If anything changes, please contact us as soon as you can.</p><p><a href="${safeSiteUrl}" style="display:inline-block;background:#211d18;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none">View Peaches Hair</a></p>`,
  );
  const adminBody = emailShell(
    "New online booking",
    `<p><strong>${customerName}</strong> booked ${serviceName}.</p><p>${safeDate} at ${safeTime}<br>${escapeHtml(appointment.customerEmail)}<br>${escapeHtml(appointment.customerPhone)}</p><p>${escapeHtml(appointment.notes || "No notes supplied.")}</p><p><a href="${safeSiteUrl}/admin">Open the diary</a></p>`,
  );
  const whatsapp = await getWhatsAppSettings();
  const whatsAppParameters = [
    appointment.customerName,
    appointment.serviceName,
    date,
    appointment.startTime,
  ];

  const tasks: Promise<unknown>[] = [
    sendEmail([appointment.customerEmail], "Your Peaches Hair appointment", customerBody),
  ];
  if (adminEmail) {
    tasks.push(
      sendEmail(
        [adminEmail],
        `New booking: ${emailSubjectValue(appointment.customerName)}`,
        adminBody,
      ),
    );
  }
  if (whatsapp.adminAlertsEnabled && whatsapp.adminNumber) {
    tasks.push(
      sendWhatsAppTemplate(
        whatsapp.adminNumber,
        whatsapp.adminTemplate,
        whatsAppParameters,
      ),
    );
  }
  if (appointment.whatsappConsent && whatsapp.customerConfirmationsEnabled) {
    tasks.push(
      sendWhatsAppTemplate(
        appointment.customerPhone,
        whatsapp.confirmationTemplate,
        whatsAppParameters,
      ),
    );
  }
  return Promise.allSettled(tasks);
}

export async function sendReminder(appointment: AppointmentNotice) {
  const date = friendlyDate(appointment.appointmentDate);
  const customerName = escapeHtml(appointment.customerName);
  const serviceName = escapeHtml(appointment.serviceName);
  const body = emailShell(
    "A friendly appointment reminder",
    `<p>Hi ${customerName},</p><p>Just a friendly reminder that your <strong>${serviceName}</strong> appointment is tomorrow, <strong>${escapeHtml(date)} at ${escapeHtml(appointment.startTime)}</strong>.</p><p>We can’t wait to welcome you to Peaches Hair.</p>`,
  );
  const tasks: Promise<unknown>[] = [
    sendEmail([appointment.customerEmail], "A reminder from Peaches Hair", body),
  ];
  const whatsapp = await getWhatsAppSettings();
  if (appointment.whatsappConsent && whatsapp.customerRemindersEnabled) {
    tasks.push(
      sendWhatsAppTemplate(
        appointment.customerPhone,
        whatsapp.reminderTemplate,
        [appointment.customerName, appointment.serviceName, date, appointment.startTime],
      ),
    );
  }
  return Promise.allSettled(tasks);
}
