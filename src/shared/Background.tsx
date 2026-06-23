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
    <AbsoluteFill className="bg-white">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${50 + drift / 4}% ${
            30 + drift / 8
          }%, ${accent}18 0%, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </AbsoluteFill>
  );
};
