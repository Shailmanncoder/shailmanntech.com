import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #22d3ee, #4c7dff 52%, #8b5cf6)",
        color: "#fff",
        fontSize: 104,
        fontWeight: 700,
      }}
    >
      &gt;
    </div>,
    size,
  );
}
