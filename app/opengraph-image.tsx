import { ImageResponse } from "next/og";

export const size = {
  height: 630,
  width: 1200,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        color: "#f8fafc",
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
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.1,
          maxWidth: 900,
        }}
      >
        Find what&apos;s lost. Return what&apos;s found.
      </div>
    </div>,
    size
  );
}
