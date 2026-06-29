import type { ReactElement } from "react";

// Shared brand mark used by the favicon, the Apple touch icon and the PWA
// manifest icons. The mark is a map pin (this is a crisis map) drawn on a
// full-bleed dark background with generous padding so the same artwork is
// safe to declare as a `maskable` icon (content stays inside the central
// safe zone after platform masking).
export const BRAND_BG = "#11120f";
export const BRAND_FG = "#f4f1e8";
export const BRAND_ACCENT = "#1f6f56";

export function BrandIcon(): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_BG,
      }}
    >
      <svg
        width="60%"
        height="60%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 1.5C7.86 1.5 4.5 4.86 4.5 9c0 5.6 7.5 13.5 7.5 13.5S19.5 14.6 19.5 9c0-4.14-3.36-7.5-7.5-7.5z"
          fill={BRAND_ACCENT}
          stroke={BRAND_FG}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9" r="2.8" fill={BRAND_FG} />
      </svg>
    </div>
  );
}
