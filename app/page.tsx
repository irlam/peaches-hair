import Image from "next/image";
import {
  ArrowRight,
  Camera,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Scissors,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BookingFlow } from "@/components/booking-flow";
import { GallerySection } from "@/components/gallery-section";
import { InstallAppCard } from "@/components/install-app-card";
import { ReviewSection } from "@/components/review-section";
import { ServicesSection } from "@/components/services-section";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_SERVICES } from "@/lib/salon";
import { getSocialLinks } from "@/lib/social";
import { getWhatsAppSettings, whatsAppChatUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [socialLinks, whatsappSettings] = await Promise.all([
    getSocialLinks(),
    getWhatsAppSettings(),
  ]);
  const whatsappChat = whatsappSettings.showPublicChat
    ? whatsAppChatUrl(whatsappSettings.publicNumber)
    : "";

  return (
    <main>
      <SiteHeader />

      <section id="book" className="hero-shell">
        <div className="hero-copy reveal">
          <p className="eyebrow">
            <Sparkles aria-hidden="true" />
            Hair colour specialist · Bolton
          </p>
          <h1>Beautiful colour, made personal.</h1>
          <p className="hero-intro">
            A calm, one-to-one salon experience built around healthy hair,
            thoughtful colour and results that feel completely you.
          </p>
          <div className="hero-details">
            <span>
              <MapPin aria-hidden="true" />
              32 Dobson Road, Bolton
            </span>
            <span>
              <Clock3 aria-hidden="true" />
              Tuesday–Saturday
            </span>
          </div>
          <a className="text-link" href="#salon">
            Discover the salon <ArrowRight aria-hidden="true" />
          </a>
        </div>

        <BookingFlow
          initialServices={DEFAULT_SERVICES}
          bookingEnabled={process.env.BOOKING_ENABLED === "true"}
          whatsappChatUrl={whatsappChat}
          whatsappConfirmationsEnabled={
            whatsappSettings.customerConfirmationsEnabled
          }
          whatsappRemindersEnabled={whatsappSettings.customerRemindersEnabled}
        />
      </section>

      <InstallAppCard />
      <ServicesSection initialServices={DEFAULT_SERVICES} />

      <section id="salon" className="salon-section">
        <div className="salon-image salon-image-primary">
          <Image
            src="/images/salon-design-window.webp"
            alt="Peaches Hair salon interior with champagne gold mirrors and styling chairs"
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
          />
        </div>
        <div className="salon-copy">
          <p className="eyebrow">Your appointment, your space</p>
          <h2>A boutique salon without the rush.</h2>
          <p>
            Peaches Hair is designed to feel relaxed, private and welcoming.
            With two styling stations and a dedicated wash area, every detail
            has been chosen to make your visit comfortable.
          </p>
          <ul>
            <li><Sparkles aria-hidden="true" /> Personal colour plans</li>
            <li><Scissors aria-hidden="true" /> Professional products and techniques</li>
            <li><MessageCircle aria-hidden="true" /> Friendly appointment reminders</li>
          </ul>
          <a className="primary-link" href="#book">
            Book your visit <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <div className="salon-image salon-image-secondary">
          <Image
            src="/images/salon-design-reverse.webp"
            alt="Second view of the warm, modern Peaches Hair colour studio"
            fill
            sizes="(max-width: 900px) 100vw, 36vw"
          />
        </div>
      </section>

      <GallerySection />
      <ReviewSection />

      <section id="contact" className="contact-section">
        <div>
          <p className="eyebrow">Peaches Hair · Bolton</p>
          <h2>Ready for your next hair chapter?</h2>
        </div>
        <div className="contact-actions">
          <a href="#book">
            <Scissors aria-hidden="true" />
            <span><small>Online booking</small>Choose an appointment</span>
            <ArrowRight aria-hidden="true" />
          </a>
          <a href="mailto:hello@peaches.hair">
            <Mail aria-hidden="true" />
            <span><small>Email</small>hello@peaches.hair</span>
            <ArrowRight aria-hidden="true" />
          </a>
          {whatsappChat && (
            <a href={whatsappChat} rel="noreferrer" target="_blank">
              <MessageCircle aria-hidden="true" />
              <span><small>WhatsApp</small>Chat with Peaches Hair</span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} rel="noreferrer" target="_blank">
              <Camera aria-hidden="true" />
              <span><small>Instagram</small>Follow our colour work</span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} rel="noreferrer" target="_blank">
              <UsersRound aria-hidden="true" />
              <span><small>Facebook</small>News, updates and transformations</span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
          {socialLinks.tiktok && (
            <a href={socialLinks.tiktok} rel="noreferrer" target="_blank">
              <Music2 aria-hidden="true" />
              <span><small>TikTok</small>Watch our latest colour work</span>
              <ArrowRight aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      <footer>
        <Image
          src="/images/peaches-hair-logo.webp"
          width={300}
          height={169}
          alt="Peaches Hair"
        />
        <p>Hair Colour Specialist · Bolton</p>
        <nav aria-label="Footer">
          <a href="#services">Services</a>
          <a href="#book">Book</a>
          <a href="#contact">Contact</a>
          {socialLinks.instagram && <a href={socialLinks.instagram} rel="noreferrer" target="_blank">Instagram</a>}
          {socialLinks.facebook && <a href={socialLinks.facebook} rel="noreferrer" target="_blank">Facebook</a>}
          {socialLinks.tiktok && <a href={socialLinks.tiktok} rel="noreferrer" target="_blank">TikTok</a>}
          <a href="/admin">Admin</a>
        </nav>
        <small>© {new Date().getFullYear()} Peaches Hair. All rights reserved.</small>
      </footer>
    </main>
  );
}
