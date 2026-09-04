# Peaches Hair

Mobile-first website, installable PWA and appointment-management system for
**Peaches Hair**, a hair colour specialist in Bolton.

## Included

- champagne-gold salon website
- guided online appointment booking with collision-safe slot reservation
- responsive private salon diary and booking-status controls
- holiday, break and unavailable-time blocking
- editable services, prices and opening hours
- email confirmations and salon alerts through Resend
- optional WhatsApp Business alerts and opted-in reminders
- moderated customer reviews
- admin gallery uploads stored on the Plesk server
- visitor-friendly phone installation with an offline shell
- editable Instagram, Facebook and TikTok profile links
- password-protected admin area with signed, secure sessions

## Plesk requirements

- Plesk Node.js Toolkit
- Node.js 22.13 or newer
- npm
- HTTPS before using the admin login or enabling the PWA

The application stores its small SQLite database and gallery uploads in the
ignored `data/` directory. Include that directory in the Plesk backup schedule.

## Plesk application settings

| Setting | Value |
| --- | --- |
| Node.js version | 22.13 or newer |
| Package manager | npm |
| Application mode | Production |
| Application root | Directory containing this repository |
| Document root | `public` inside the application root |
| Application startup file | `_passenger.cjs` |

After pulling the repository into Plesk:

1. Open **Websites & Domains → peaches.hair → Node.js**.
2. Add the private environment variables listed below.
3. Click **NPM Install**.
4. Click **Run script**, choose `build`, and run it.
5. Click **Enable Node.js** or **Restart App**.

For later Git updates, pull the latest commit, run `build`, and restart the app.
Run **NPM Install** again when `package.json` or `package-lock.json` changes.

## Configuration

Copy the names from `.env.example` into Plesk's **Custom Environment
Variables**. Never commit real credentials.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Public origin, normally `https://peaches.hair` |
| `BOOKING_ENABLED` | Keep `false` until hours and alerts are ready; use `true` to accept bookings |
| `ADMIN_EMAIL` | Email address used to sign in to `/admin` |
| `ADMIN_PASSWORD` | Unique admin password of at least 12 characters |
| `ADMIN_NAME` | Name displayed in the admin area |
| `SESSION_SECRET` | Random secret of at least 32 characters used to sign sessions |
| `RESEND_API_KEY` | Sends customer confirmations and salon alerts |
| `EMAIL_FROM` | Verified sender shown on appointment emails |
| `SALON_EMAIL` | Destination for new-booking alerts |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp Business Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business sending-number ID |
| `WHATSAPP_GRAPH_API_VERSION` | Optional Meta Graph API version override; defaults to `v22.0` |
| `ADMIN_WHATSAPP_NUMBER` | Legacy fallback; the admin mobile is now editable in `/admin` |
| `WHATSAPP_ADMIN_TEMPLATE` | Legacy fallback for the approved new-booking template name |
| `WHATSAPP_CONFIRMATION_TEMPLATE` | Legacy fallback for the approved confirmation template name |
| `WHATSAPP_REMINDER_TEMPLATE` | Legacy fallback for the approved reminder template name |
| `CRON_SECRET` | Protects the automated reminder endpoint |

## Appointment reminders

Create an hourly Plesk scheduled task that sends a POST request to:

```text
https://peaches.hair/api/cron/reminders?key=YOUR_CRON_SECRET
```

The job sends reminders for confirmed appointments approximately 24 hours in
advance and records successful delivery so a reminder is not sent twice.

WhatsApp numbers, feature switches and template names are managed under
**Admin → Alerts**. The Meta access token and sending-number ID remain private
Plesk variables. The **Save & send test** button checks the connection without
revealing either secret.

Automated messages require approved English (UK) Meta templates. The default
names are `new_booking`, `booking_confirmation` and `appointment_reminder`.
Each template receives four body variables in this order: client name, service,
appointment date and appointment time.

## Local development

```bash
npm ci
npm run dev
```

Create `.env.local` from `.env.example` when testing private features. Run
`npm run test` before deployment.
