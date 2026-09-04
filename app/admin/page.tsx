import Image from "next/image";
import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard";
import { adminIsConfigured, getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getAdminUser();
  if (!user) {
    const { error } = await searchParams;
    const configured = adminIsConfigured();
    return (
      <main className="admin-auth-shell">
        <div className="admin-auth-card">
          <Image
            src="/images/peaches-hair-logo.webp"
            alt="Peaches Hair"
            width={340}
            height={191}
          />
          <p className="eyebrow">Salon administration</p>
          <h1>Your diary, all in one place.</h1>
          <p>
            Sign in securely to manage appointments, availability, gallery
            images and reviews.
          </p>
          {!configured ? (
            <p className="admin-message">
              Admin access will be available once the private Plesk settings
              have been added.
            </p>
          ) : (
            <form action="/api/admin/login" method="post" className="admin-login-form">
              <label>
                Email
                <input name="email" type="email" autoComplete="username" required />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              {error === "invalid" && (
                <p className="form-error">The email or password is incorrect.</p>
              )}
              {error === "locked" && (
                <p className="form-error">
                  Too many attempts. Please wait 15 minutes and try again.
                </p>
              )}
              <button className="primary-button" type="submit">
                Sign in to admin
              </button>
            </form>
          )}
          <Link href="/">Back to the website</Link>
        </div>
      </main>
    );
  }

  return (
    <AdminDashboard
      adminName={user.displayName}
      config={{
        email: Boolean(process.env.RESEND_API_KEY && process.env.SALON_EMAIL),
        whatsappApi: Boolean(
          process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
        ),
        reminders: Boolean(process.env.CRON_SECRET),
      }}
      signOutPath="/api/admin/logout"
    />
  );
}
