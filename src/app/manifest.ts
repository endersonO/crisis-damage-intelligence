import type { MetadataRoute } from "next";

// Web app manifest — Next links this automatically at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Respuesta Venezuela — Crisis Damage Intelligence",
    short_name: "Respuesta VE",
    description:
      "Bilingual geospatial earthquake response and damage triage platform for Venezuela",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // No `orientation` on purpose: "any" makes the installed PWA rotate even
    // when the OS rotation lock is on. Omitting it makes the app respect the
    // device's auto-rotate setting (and still allow landscape on tablets).
    background_color: "#e7e2d8",
    theme_color: "#11120f",
    lang: "es",
    dir: "ltr",
    categories: ["utilities", "navigation", "productivity"],
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Same full-bleed artwork is masking-safe, so reuse it for maskable.
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
