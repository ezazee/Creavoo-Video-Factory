import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Background: React.FC<{ accent?: string; profile?: "creavoo" | "zaportfolio" }> = ({
  accent = "#6366f1",
  profile = "creavoo",
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 80;

  if (profile === "zaportfolio") {
    const navy = "#1a3358";
    const lineColor = "#b8cce4";
    return (
      <AbsoluteFill style={{ background: "#ffffff" }}>
        {/* Top-right diagonal stripe block */}
        <svg style={{ position: "absolute", top: 0, right: 0 }} width="320" height="320" viewBox="0 0 320 320">
          <defs>
            <pattern id="bg-diag" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="12" height="28" fill={navy} opacity="0.18" />
            </pattern>
            <clipPath id="bg-tri-tr"><polygon points="320,0 0,0 320,320" /></clipPath>
          </defs>
          <rect width="320" height="320" fill="url(#bg-diag)" clipPath="url(#bg-tri-tr)" />
        </svg>

        {/* Bottom-left dot grid */}
        <svg style={{ position: "absolute", bottom: 0, left: 0 }} width="260" height="260" viewBox="0 0 260 260">
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={14 + col * 28} cy={14 + row * 28} r="5.5" fill={navy} opacity="0.28" />
            ))
          )}
        </svg>

        {/* Top-left outline triangle */}
        <svg style={{ position: "absolute", top: 70, left: 55 }} width="140" height="140" viewBox="0 0 140 140">
          <polygon points="70,8 132,124 8,124" fill="none" stroke={lineColor} strokeWidth="5" />
        </svg>

        {/* Bottom-right large outline triangle */}
        <svg style={{ position: "absolute", bottom: 110, right: 90 }} width="120" height="120" viewBox="0 0 120 120">
          <polygon points="60,6 114,110 6,110" fill="none" stroke={lineColor} strokeWidth="4.5" />
        </svg>

        {/* Bottom-right small triangle */}
        <svg style={{ position: "absolute", bottom: 52, right: 52 }} width="76" height="76" viewBox="0 0 76 76">
          <polygon points="38,4 72,68 4,68" fill="none" stroke={lineColor} strokeWidth="3.5" />
        </svg>

        {/* Subtle grid lines */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(to right, ${navy} 1px, transparent 1px), linear-gradient(to bottom, ${navy} 1px, transparent 1px)`,
            backgroundSize: "54px 54px",
            opacity: 0.05,
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "#f8f8fa" }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.07,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${50 + drift / 4}% ${30 + drift / 8}%, ${accent}40 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${80 - drift / 6}% 85%, ${accent}22 0%, transparent 45%)`,
        }}
      />
    </AbsoluteFill>
  );
};
