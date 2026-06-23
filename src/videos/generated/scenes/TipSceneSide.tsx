import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VisualBlock, type VisualData } from "./VisualBlock";

type Props = {
  duration: number;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  bullets?: string[];
  visual?: VisualData;
};

export const TipSceneSide: React.FC<Props> = ({
  duration, number, title, subtitle, emoji, accent, bullets, visual,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barIn = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
  const numIn = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 15, fps, config: { damping: 12, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 30, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 48, fps, config: { damping: 16 } });

  const resolvedVisual: VisualData | null = visual ?? (
    bullets && bullets.length > 0 ? { type: "bullets", items: bullets } : null
  );
  const hasVisual = resolvedVisual !== null;

  const visualStartFrame = Math.floor(duration * 0.42);

  const subtitleOpacity = hasVisual
    ? interpolate(frame, [visualStartFrame - 10, visualStartFrame + 6], [subtitleIn, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : subtitleIn;
  const visualOpacity = interpolate(frame, [visualStartFrame, visualStartFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const emojiFloat = Math.sin(frame * 0.07) * 8;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Accent bar left */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        width: interpolate(barIn, [0, 1], [0, 12]), height: "100%",
        background: accent, boxShadow: `0 0 60px ${accent}88`,
      }} />

      {/* Background number watermark */}
      <div style={{
        position: "absolute", right: -20, bottom: -60,
        fontSize: 500, fontWeight: 900, color: `${accent}08`, lineHeight: 1,
        fontFamily: "sans-serif", userSelect: "none", pointerEvents: "none",
      }}>
        {number}
      </div>

      {/* ZONA ATAS — number + emoji + title + line. Terkunci. */}
      <div style={{ position: "absolute", top: 300, left: 72, right: 60 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, fontWeight: 900, color: "white", marginBottom: 28,
          opacity: numIn, transform: `scale(${0.5 + numIn * 0.5})`,
          boxShadow: `0 0 30px ${accent}88`,
        }}>
          {number}
        </div>
        <div style={{
          fontSize: 96, lineHeight: 1, marginBottom: 24,
          opacity: emojiIn, transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
          filter: `drop-shadow(0 0 24px ${accent}66)`,
        }}>
          {emoji}
        </div>
        <p style={{
          fontSize: 68, fontWeight: 900, color: "#18181b", lineHeight: 1.1, marginBottom: 16,
          opacity: titleIn, transform: `translateX(${(1 - titleIn) * -30}px)`,
        }}>
          {title}
        </p>
        <div style={{
          width: interpolate(titleIn, [0, 1], [0, 100]), height: 5,
          background: accent, borderRadius: 3,
        }} />
      </div>

      {/* ZONA BAWAH — subtitle & visual berbagi slot absolute yang SAMA. */}
      <div style={{ position: "absolute", top: 1080, left: 72, right: 60, bottom: 180 }}>
        <p style={{
          position: "absolute", top: 0, left: 0, right: 0,
          fontSize: 34, fontWeight: 600, color: "#71717a", lineHeight: 1.4,
          opacity: subtitleOpacity, transform: `translateX(${(1 - subtitleIn) * -20}px)`,
        }}>
          {subtitle}
        </p>

        {hasVisual && frame >= visualStartFrame - 4 && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, opacity: visualOpacity }}>
            <VisualBlock visual={resolvedVisual!} frame={frame} fps={fps} startFrame={visualStartFrame} accent={accent} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
