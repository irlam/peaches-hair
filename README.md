# Peaches Hair

Mobile-first website, PWA and appointment-management system for **Peaches Hair**, a hair colour specialist in Bolton.

## Included

- premium champagne-gold salon website
- guided three-step online appointment booking
- live availability with collision-safe slot reservation
- responsive salon diary and booking-status controls
- holiday, break and unavailable-time blocking
- email confirmations and admin alerts through Resend
- WhatsApp Business admin alerts and opted-in client reminders
- secure 24-hour reminder endpoint
- moderated customer reviews
- admin gallery uploads backed by object storage
- installable PWA with offline shell
- private admin access using Sign in with ChatGPT and an email allowlist

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run db:generate
npm run dev
```

The production deployment uses Cloudflare-compatible D1 and R2 bindings named
`DB` and `BUCKET`.

## Configuration

Copy `.env.example` to `.env.local` for local work. Never commit real keys.

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAILS` | Comma-separated admin email allowlist |
| `RESEND_API_KEY` | Sends customer confirmations and salon alerts |
| `EMAIL_FROM` | Verified sender shown on appointment emails |
| `SALON_EMAIL` | Destination for new-booking alerts |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Business Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business sending number ID |
| `ADMIN_WHATSAPP_NUMBER` | Admin mobile in international format |
| `WHATSAPP_ADMIN_TEMPLATE` | Approved new-booking template name |
| `WHATSAPP_REMINDER_TEMPLATE` | Approved reminder template name |
| `CRON_SECRET` | Protects the automated reminder endpoint |
| `PUBLIC_SITE_URL` | Public site origin, normally `https://peaches.hair` |

## Appointment reminders

Run this endpoint every hour using a scheduler:

```text
POST https://peaches.hair/api/cron/reminders
Header: x-cron-secret: YOUR_CRON_SECRET
```

The job sends reminders for confirmed appointments approximately 24 hours away
and records successful delivery so the same appointment is not reminded twice.

## WhatsApp templates

Automated WhatsApp messages require approved Meta templates. The default names
are `new_booking` and `appointment_reminder`; both can be changed through
environment variables.

## Data

- D1 stores appointments, reserved slots, services, hours, blocks and reviews.
- R2 stores gallery image files.
- Uploaded images accept JPG, PNG and WebP files up to 8 MB.
- No provider keys or customer records are stored in the repository.
