import { ImageResponse } from "next/og";
import { OgCard, ogContentType, ogSize } from "@/components/og/OgCard";
import { getProduct, products } from "@/lib/content";

export const alt = "Shellman Tech product";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  return new ImageResponse(
    <OgCard
      eyebrow={product ? product.kicker : "Product"}
      title={product ? product.name : "Shellman Tech"}
      description={product?.description}
    />,
    size,
  );
}
