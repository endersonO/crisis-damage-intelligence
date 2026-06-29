import { ImageResponse } from "next/og";
import { BrandIcon } from "@/app/_lib/brand-icon";

// iOS home-screen icon (App Router file-based metadata).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<BrandIcon />, { ...size });
}
