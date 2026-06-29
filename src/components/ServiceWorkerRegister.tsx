"use client";

import { useEffect, useState } from "react";
import { LANG_EVENT, readStoredLang } from "@/lib/lang";

type Lang = "es" | "en";
const COPY: Record<Lang, { msg: string; action: string; aria: string }> = {
  es: { msg: "Nueva versión disponible", action: "Actualizar", aria: "Actualización disponible" },
  en: { msg: "New version available", action: "Update", aria: "Update available" },
};

// Registers the service worker (installability + offline) and surfaces a
// visible "update available" prompt instead of swapping versions silently.
export default function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    setLang(readStoredLang());
    const onLang = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (next === "es" || next === "en") setLang(next);
    };
    window.addEventListener(LANG_EVENT, onLang);

    // Reload once the new SW takes control — but not on the very first install
    // (no previous controller), which would reload needlessly.
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let updateTimer: ReturnType<typeof setInterval> | undefined;
    const watch = (reg: ServiceWorkerRegistration) => {
      // A new version is already installed and parked.
      if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(reg.waiting ?? installing);
          }
        });
      });
    };

    const cacheShell = () => {
      try {
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.includes("/_next/static/"))
          .map((u) => {
            try { return new URL(u).pathname; } catch { return null; }
          })
          .filter((u): u is string => Boolean(u));
        if (urls.length === 0) return;
        urls.push("/");
        navigator.serviceWorker.ready
          .then((reg) => {
            (reg.active ?? navigator.serviceWorker.controller)?.postMessage({
              type: "CACHE_SHELL",
              urls: [...new Set(urls)],
            });
          })
          .catch(() => {});
      } catch {
        // best-effort
      }
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          watch(reg);
          // Check for a new SW periodically while the app stays open.
          updateTimer = setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch((error) => console.warn("Service worker registration failed", error));
      // Tell the SW the exact build chunks to cache, so the app shell works
      // offline even on the first visit (chunks load before the SW controls
      // the page, so they're not otherwise cached). Repeat once for late
      // (dynamically imported) chunks.
      cacheShell();
      window.setTimeout(cacheShell, 6000);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("load", register);
      window.removeEventListener(LANG_EVENT, onLang);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, []);

  if (!waiting) return null;
  const t = COPY[lang];

  return (
    <div className="app-update-toast" role="status" aria-label={t.aria}>
      <span>{t.msg}</span>
      <button type="button" onClick={() => waiting.postMessage("SKIP_WAITING")}>
        {t.action}
      </button>
    </div>
  );
}
