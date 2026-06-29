import { ImageResponse } from "next/og";
import { BrandIcon } from "@/app/_lib/brand-icon";

// PWA manifest icons rendered on demand from the shared brand mark.
// Pre-rendered at build time for the two sizes the manifest references.
export const dynamic = "force-static";

const ALLOWED = new Set([192, 512]);

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const px = ALLOWED.has(Number(size)) ? Number(size) : 512;
  return new ImageResponse(<BrandIcon />, { width: px, height: px });
}
