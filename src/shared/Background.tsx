import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Animated radial-gradient + subtle grid backdrop.
 * Pass an `accent` hex per video to tint it.
 */
export const Background: React.FC<{ accent?: string }> = ({
  accent = "#6366f1",
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 120) * 80;

  return (
    <AbsoluteFill style={{ background: "#f8f8fa" }}>
      {/* Grid lines — lebih visible di light bg */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.07,
        }}
      />
      {/* Accent radial utama — lebih pekat di light */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${50 + drift / 4}% ${
            30 + drift / 8
          }%, ${accent}40 0%, transparent 60%)`,
        }}
      />
      {/* Accent corner bawah untuk depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${80 - drift / 6}% 85%, ${accent}22 0%, transparent 45%)`,
        }}
      />
    </AbsoluteFill>
  );
};
