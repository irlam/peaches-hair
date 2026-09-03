import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://peaches.hair"),
  title: {
    default: "Peaches Hair | Hair Colour Specialist in Bolton",
    template: "%s | Peaches Hair Bolton",
  },
  description:
    "Peaches Hair is a boutique Bolton salon specialising in personalised hair colour, transformations, cutting and styling.",
  applicationName: "Peaches Hair",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peaches Hair",
  },
  formatDetection: { telephone: true, email: true, address: true },
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
