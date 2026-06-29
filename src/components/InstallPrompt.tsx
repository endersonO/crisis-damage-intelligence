"use client";

import { useEffect, useState } from "react";

// The `beforeinstallprompt` event is not in the standard DOM lib types.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rv-install-dismissed-at";
// Re-offer the banner this long after the user dismisses it.
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

type Lang = "es" | "en";
// "native": Chromium fired beforeinstallprompt → real install button.
// "ios": iOS Safari → manual Share → Add to Home Screen.
// "manual": any other browser → install via the browser menu.
type Mode = "native" | "ios" | "manual";

const COPY: Record<Lang, { lead: string; cta: string; iosHint: string; manualHint: string; later: string; aria: string }> = {
  es: {
    lead: "Instálala en tu teléfono para abrirla como app",
    cta: "Instalar app",
    iosHint: "Toca Compartir y luego “Agregar a inicio”.",
    manualHint: "Abre el menú del navegador y elige “Instalar app”.",
    later: "Ahora no",
    aria: "Instalar la aplicación",
  },
  en: {
    lead: "Install it on your phone to open it as an app",
    cta: "Install app",
    iosHint: "Tap Share, then “Add to Home Screen”.",
    manualHint: "Open the browser menu and choose “Install app”.",
    later: "Not now",
    aria: "Install the application",
  },
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as desktop Safari; detect via touch points.
  const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return; // already installed

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return;

    setLang(navigator.language.toLowerCase().startsWith("en") ? "en" : "es");

    // Show right away with the best guess for this browser; if Chromium later
    // fires beforeinstallprompt we upgrade to the real install button.
    setMode(isIos() ? "ios" : "manual");
    setVisible(true);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // suppress Chrome's mini-infobar; use our UI
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("native");
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !mode) return null;

  const t = COPY[lang];

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setVisible(false);
    else dismiss();
    setDeferred(null);
  };

  const hint = mode === "ios" ? t.iosHint : mode === "manual" ? t.manualHint : null;

  return (
    <div className="install-prompt" role="dialog" aria-label={t.aria}>
      <div className="install-prompt-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="2.5" width="12" height="19" rx="2.4" stroke="currentColor" strokeWidth="1.6" />
          <line x1="10" y1="18.5" x2="14" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="install-prompt-text">
        <strong>{t.lead}</strong>
        {hint ? <span>{hint}</span> : null}
      </div>
      <div className="install-prompt-actions">
        {mode === "native" ? (
          <button type="button" className="install-prompt-cta" onClick={install}>
            {t.cta}
          </button>
        ) : null}
        <button
          type="button"
          className="install-prompt-later"
          onClick={dismiss}
          aria-label={t.later}
        >
          {mode === "native" ? t.later : "✕"}
        </button>
      </div>
    </div>
  );
}
