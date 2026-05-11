import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
          "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        color: "#f8fafc",
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
          fontSize: 76,
          lineHeight: 1.1,
          fontWeight: 700,
          maxWidth: 900,
        }}
      >
        Find what&apos;s lost. Return what&apos;s found.
      </div>
    </div>,
    size
  );
}
