import { Img, staticFile } from "remotion";

// Icon brand asli (SVG dari simple-icons, di-download workflow) — fallback emoji
export const TipIcon: React.FC<{
  emoji: string;
  iconFile?: string;
  size: number;
  accent: string;
  style?: React.CSSProperties;
}> = ({ emoji, iconFile, size, accent, style }) => {
  if (iconFile) {
    return (
      <div
        style={{
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: size * 0.3,
          background: "rgba(255,255,255,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 ${size * 0.35}px ${accent}55`,
          ...style,
        }}
      >
        <Img src={staticFile(iconFile)} style={{ width: size * 0.85, height: size * 0.85, objectFit: "contain" }} />
      </div>
    );
  }
  return (
    <div style={{ fontSize: size, lineHeight: 1, filter: `drop-shadow(0 0 24px ${accent}66)`, ...style }}>
      {emoji}
    </div>
  );
};

// Screenshot tool dalam frame browser mock
export const ScreenshotFrame: React.FC<{
  file: string;
  accent: string;
  width?: number | string;
}> = ({ file, accent, width = "100%" }) => (
  <div
    style={{
      width,
      borderRadius: 18,
      overflow: "hidden",
      border: `3px solid ${accent}44`,
      boxShadow: `0 12px 40px rgba(0,0,0,0.25), 0 0 30px ${accent}33`,
      background: "#fff",
    }}
  >
    <div style={{ height: 34, background: "#e4e4e7", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
      {["#ef4444", "#eab308", "#22c55e"].map((c) => (
        <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
      ))}
    </div>
    <Img src={staticFile(file)} style={{ width: "100%", display: "block" }} />
  </div>
);
