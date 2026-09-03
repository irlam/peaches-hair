import Image from "next/image";
import Link from "next/link";
import { env } from "cloudflare:workers";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { configuredAdminEmails } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) {
    return (
      <main className="admin-auth-shell">
        <div className="admin-auth-card">
          <Image src="/images/peaches-hair-logo.webp" alt="Peaches Hair" width={340} height={191} />
          <p className="eyebrow">Salon administration</p>
          <h1>Your diary, all in one place.</h1>
          <p>Sign in securely to manage appointments, availability, gallery images and reviews.</p>
          <a className="primary-button" href={chatGPTSignInPath("/admin")} target="_top">
            Sign in to admin
          </a>
          <Link href="/">Back to the website</Link>
        </div>
      </main>
    );
  }

  const allowed = configuredAdminEmails();
  if (allowed.length === 0 || !allowed.includes(user.email.toLowerCase())) {
    return (
      <main className="admin-auth-shell">
        <div className="admin-auth-card">
          <p className="eyebrow">Admin setup required</p>
          <h1>This account isn’t authorised yet.</h1>
          <p>
            Add <strong>{user.email}</strong> to the <code>ADMIN_EMAILS</code>{" "}
            setting before using the salon diary.
          </p>
          <a href={chatGPTSignOutPath("/admin")}>Use a different account</a>
          <Link href="/">Back to the website</Link>
        </div>
      </main>
    );
  }

  const runtime = env as unknown as Record<string, unknown>;
  return (
    <AdminDashboard
      adminName={user.displayName}
      config={{
        email: Boolean(runtime.RESEND_API_KEY && runtime.SALON_EMAIL),
        whatsapp: Boolean(
          runtime.WHATSAPP_ACCESS_TOKEN &&
            runtime.WHATSAPP_PHONE_NUMBER_ID &&
            runtime.ADMIN_WHATSAPP_NUMBER,
        ),
        reminders: Boolean(runtime.CRON_SECRET),
      }}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
