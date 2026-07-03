import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VisualBlock, type VisualData } from "./VisualBlock";
import { TipIcon, ScreenshotFrame } from "./TipMedia";

type Props = {
  duration: number;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  bullets?: string[];
  visual?: VisualData;
  iconFile?: string;
  screenshotFile?: string;
  profile?: "creavoo" | "zaportfolio";
};

export const TipSceneBold: React.FC<Props> = ({
  duration, number, title, subtitle, emoji, accent, bullets, visual, iconFile, screenshotFile, profile = "creavoo",
}) => {
  const isZap = profile === "zaportfolio";
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgNumIn = spring({ frame, fps, config: { damping: 20 } });
  const emojiIn = spring({ frame: frame - 8, fps, config: { damping: 11, mass: 0.6 } });
  const titleIn = spring({ frame: frame - 22, fps, config: { damping: 15 } });
  const lineIn = spring({ frame: frame - 38, fps, config: { damping: 18, stiffness: 120 } });
  const subtitleIn = spring({ frame: frame - 46, fps, config: { damping: 16 } });
  const numBadgeIn = spring({ frame: frame - 60, fps, config: { damping: 14 } });

  const resolvedVisual: VisualData | null = visual ?? (
    bullets && bullets.length > 0 ? { type: "bullets", items: bullets } : null
  );
  const hasVisual = resolvedVisual !== null || !!screenshotFile;

  const visualStartFrame = Math.floor(duration * 0.42);

  // Subtitle dan visual berbagi slot bawah yang SAMA — crossfade di tempat.
  // Tanpa visual, subtitle tetap tampil sepanjang scene.
  const subtitleOpacity = hasVisual
    ? interpolate(frame, [visualStartFrame - 10, visualStartFrame + 6], [subtitleIn, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : subtitleIn;
  const visualOpacity = interpolate(frame, [visualStartFrame, visualStartFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const emojiFloat = Math.sin(frame * 0.09) * 10;
  const pulse = 1 + Math.sin(frame * 0.18) * 0.02;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Top accent strip */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* Huge background number */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: 700, fontWeight: 900, color: `${accent}12`, lineHeight: 1,
        fontFamily: "sans-serif", userSelect: "none", opacity: bgNumIn, pointerEvents: "none",
      }}>
        {number}
      </div>

      {/* ZONA ATAS — emoji + title + divider. Terkunci di area atas-tengah, tidak pernah bergerak. */}
      <div style={{
        position: "absolute", top: 240, left: 80, right: 80,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          marginBottom: 28,
          opacity: emojiIn,
          transform: `scale(${0.5 + emojiIn * 0.5}) translateY(${emojiFloat}px) scale(${pulse})`,
        }}>
          <TipIcon emoji={emoji} iconFile={iconFile} size={110} accent={accent} />
        </div>
        <p style={{
          fontSize: 72, fontWeight: 900, color: isZap ? "#1a3358" : "#18181b", textAlign: "center",
          lineHeight: 1.05, marginBottom: 24, letterSpacing: "-1px",
          opacity: titleIn, transform: `scale(${0.85 + titleIn * 0.15})`,
        }}>
          {title}
        </p>
        <div style={{
          width: interpolate(lineIn, [0, 1], [0, 180]), height: 5,
          background: accent, borderRadius: 3, boxShadow: `0 0 20px ${accent}`,
        }} />
      </div>

      {/* ZONA BAWAH — subtitle & visual berbagi slot absolute yang SAMA. Crossfade tanpa overlap text. */}
      <div style={{
        position: "absolute", top: 880, left: 80, right: 80, bottom: 200,
        display: "flex", flexDirection: "column", justifyContent: "flex-start",
      }}>
        {/* Subtitle */}
        <p style={{
          position: "absolute", top: 0, left: 0, right: 0,
          fontSize: 36, fontWeight: 600, color: isZap ? "#2d4a7a" : "#71717a", textAlign: "center",
          lineHeight: 1.45, opacity: subtitleOpacity,
          transform: `translateY(${(1 - subtitleIn) * 20}px)`,
        }}>
          {subtitle}
        </p>

        {/* Visual / screenshot */}
        {screenshotFile && frame >= visualStartFrame - 4 ? (
          <div style={{ position: "absolute", top: 0, left: 40, right: 40, opacity: visualOpacity }}>
            <ScreenshotFrame file={screenshotFile} accent={accent} />
          </div>
        ) : hasVisual && frame >= visualStartFrame - 4 && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, opacity: visualOpacity }}>
            <VisualBlock visual={resolvedVisual!} frame={frame} fps={fps} startFrame={visualStartFrame} accent={accent} />
          </div>
        )}
      </div>

      {/* Number badge bottom-right */}
      {frame >= 60 && (
        <div style={{
          position: "absolute", bottom: 100, right: 80,
          width: 80, height: 80, borderRadius: "50%", border: `4px solid ${accent}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, fontWeight: 900, color: accent,
          opacity: numBadgeIn, transform: `scale(${0.6 + numBadgeIn * 0.4})`,
          boxShadow: `0 0 24px ${accent}55`,
        }}>
          {number}
        </div>
      )}
    </AbsoluteFill>
  );
};
