import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background:
          "linear-gradient(135deg, #111827 0%, #1f2937 60%, #374151 100%)",
        color: "#f9fafb",
      }}
    >
      <div
        style={{
          fontSize: 34,
          opacity: 0.9,
          marginBottom: 20,
        }}
      >
        Lost and Found
      </div>
      <div
        style={{
          fontSize: 72,
          lineHeight: 1.1,
          fontWeight: 700,
          maxWidth: 900,
        }}
      >
        Organization lost and found, made simple.
      </div>
    </div>,
    size
  );
}
