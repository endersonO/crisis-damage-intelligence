import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsEvents from "@/components/AnalyticsEvents";
import OpenPanelAnalytics from "@/components/OpenPanelAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://respuestavenezuela.org"),
  title: "Respuesta Venezuela",
  description: "Bilingual geospatial earthquake response and damage triage platform for Venezuela",
  alternates: {
    canonical: "/",
  },
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
        <AnalyticsEvents />
        <OpenPanelAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
