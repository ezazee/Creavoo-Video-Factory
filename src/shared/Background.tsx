import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Background: React.FC<{ accent?: string; profile?: "creavoo" | "zaportfolio" }> = ({
  accent = "#6366f1",
  profile = "creavoo",
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 80;

  if (profile === "zaportfolio") {
    return (
      <AbsoluteFill style={{ background: "#ffffff" }}>
        {/* Grid lines navy */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #1a3358 1px, transparent 1px), linear-gradient(to bottom, #1a3358 1px, transparent 1px)",
            backgroundSize: "54px 54px",
            opacity: 0.06,
          }}
        />
        {/* Diagonal stripe — pojok kanan atas */}
        <svg style={{ position: "absolute", top: 0, right: 0 }} width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <pattern id="bg-diag" x="0" y="0" width="10" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="5" height="18" fill="#1a3358" opacity="0.12" />
            </pattern>
            <clipPath id="bg-tri-tr"><polygon points="220,0 0,0 220,220" /></clipPath>
          </defs>
          <rect width="220" height="220" fill="url(#bg-diag)" clipPath="url(#bg-tri-tr)" />
        </svg>
        {/* Dot grid — pojok kiri bawah */}
        <svg style={{ position: "absolute", bottom: 0, left: 0 }} width="160" height="160" viewBox="0 0 160 160">
          {Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) => (
            <circle key={`${row}-${col}`} cx={16 + col * 30} cy={16 + row * 30} r="3" fill="#1a3358" opacity="0.15" />
          )))}
        </svg>
        {/* Subtle navy radial untuk depth */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 85% ${10 + drift / 12}%, #1a335810 0%, transparent 45%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#f8f8fa" }}>
      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.07,
        }}
      />
      {/* Accent radial utama */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${50 + drift / 4}% ${
            30 + drift / 8
          }%, ${accent}40 0%, transparent 60%)`,
        }}
      />
      {/* Accent corner bawah */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${80 - drift / 6}% 85%, ${accent}22 0%, transparent 45%)`,
        }}
      />
    </AbsoluteFill>
  );
};
