import { ImageResponse } from "next/og";

export const size = {
  height: 630,
  width: 1200,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #111827 0%, #1f2937 60%, #374151 100%)",
        color: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "64px",
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: 34,
          marginBottom: 20,
          opacity: 0.9,
        }}
      >
        Lost and Found
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        Organization lost and found, made simple.
      </div>
    </div>,
    size
  );
}
