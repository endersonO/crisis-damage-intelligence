import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsEvents from "@/components/AnalyticsEvents";
import OpenPanelAnalytics from "@/components/OpenPanelAnalytics";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://respuestavenezuela.org"),
  applicationName: "Respuesta Venezuela",
  title: "Respuesta Venezuela",
  description: "Bilingual geospatial earthquake response and damage triage platform for Venezuela",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    title: "Respuesta VE",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom for accessibility; the map handles its own gestures.
  maximumScale: 5,
  // Paint under the notch / home indicator so the safe-area insets the CSS
  // already references (env(safe-area-inset-*)) actually take effect.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7e2d8" },
    { media: "(prefers-color-scheme: dark)", color: "#11120f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <AnalyticsEvents />
        <OpenPanelAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
