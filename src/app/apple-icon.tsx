import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fcf9f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "10px solid #ae2a00",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ae2a00",
            fontSize: 78,
            fontWeight: 700,
            letterSpacing: 2,
            lineHeight: 1,
            fontFamily: "Georgia, Times New Roman, serif",
          }}
        >
          AP
        </div>
      </div>
    ),
    { ...size }
  );
}
