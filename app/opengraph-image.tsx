import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogSize } from "@/components/og/OgCard";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return new ImageResponse(
    <OgCard
      eyebrow="Technology Studio"
      title="We build technology that moves ideas forward."
      description="Products, full-stack engineering, cloud and DevOps."
    />,
    size,
  );
}
