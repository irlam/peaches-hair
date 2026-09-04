import { requireAdminApi } from "@/lib/admin-auth";
import { friendlyDate, londonNow } from "@/lib/time";
import {
  getWhatsAppSettings,
  sendWhatsAppTemplate,
  whatsAppApiConfigured,
} from "@/lib/whatsapp";

export async function POST() {
  if (!(await requireAdminApi())) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!whatsAppApiConfigured()) {
    return Response.json(
      { error: "Add the Meta access token and phone-number ID in Plesk first." },
      { status: 400 },
    );
  }

  const settings = await getWhatsAppSettings();
  if (!settings.adminNumber) {
    return Response.json(
      { error: "Save an admin alert number before sending a test." },
      { status: 400 },
    );
  }

  const now = londonNow();
  try {
    const result = await sendWhatsAppTemplate(
      settings.adminNumber,
      settings.adminTemplate,
      ["Peaches Hair test", "Test appointment", friendlyDate(now.date), now.time],
    );
    if (!result.sent) {
      return Response.json(
        { error: "WhatsApp is not fully configured yet." },
        { status: 400 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Meta could not send the WhatsApp test message.",
      },
      { status: 502 },
    );
  }
}
