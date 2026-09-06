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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "Peaches Hair",
    title: "Peaches Hair | Hair Colour Specialist in Bolton",
    description:
      "Beautiful colour, personal service and easy online booking at Peaches Hair in Bolton.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Peaches Hair — Hair Colour Specialist in Bolton",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peaches Hair | Hair Colour Specialist in Bolton",
    description:
      "Beautiful colour, personal service and easy online booking at Peaches Hair in Bolton.",
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest?v=4",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Peaches Hair",
  },
  formatDetection: { telephone: true, email: true, address: true },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      {
        url: "/favicon-16x16.png?v=2",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png?v=2",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: {
      url: "/apple-touch-icon.png?v=2",
      sizes: "180x180",
      type: "image/png",
    },
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
