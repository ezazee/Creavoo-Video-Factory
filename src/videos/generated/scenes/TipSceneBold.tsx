import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  duration: number;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
};

export const TipSceneBold: React.FC<Props> = ({
  duration,
  number,
  title,
  subtitle,
  emoji,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgNumIn = spring({ frame, fps, config: { damping: 20 } });
  const emojiIn = spring({ frame: frame - 8, fps, config: { damping: 11, mass: 0.6 } });
  const titleIn = spring({ frame: frame - 22, fps, config: { damping: 15 } });
  const lineIn = spring({ frame: frame - 38, fps, config: { damping: 18, stiffness: 120 } });
  const subtitleIn = spring({ frame: frame - 44, fps, config: { damping: 16 } });
  const numBadgeIn = spring({ frame: frame - 55, fps, config: { damping: 14 } });

  const emojiFloat = Math.sin(frame * 0.09) * 14;
  const pulse = 1 + Math.sin(frame * 0.18) * 0.025;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Top accent strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />

      {/* Huge background number */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 800,
          fontWeight: 900,
          color: `${accent}08`,
          lineHeight: 1,
          fontFamily: "sans-serif",
          userSelect: "none",
          opacity: bgNumIn,
        }}
      >
        {number}
      </div>

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "0 80px",
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: 180,
            lineHeight: 1,
            marginBottom: 48,
            opacity: emojiIn,
            transform: `scale(${0.5 + emojiIn * 0.5}) translateY(${emojiFloat}px) scale(${pulse})`,
            filter: `drop-shadow(0 0 40px ${accent}88)`,
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "white",
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 32,
            opacity: titleIn,
            transform: `scale(${0.85 + titleIn * 0.15})`,
            letterSpacing: "-1px",
          }}
        >
          {title}
        </p>

        {/* Accent divider */}
        <div
          style={{
            width: interpolate(lineIn, [0, 1], [0, 200]),
            height: 5,
            background: accent,
            borderRadius: 3,
            marginBottom: 32,
            boxShadow: `0 0 20px ${accent}`,
          }}
        />

        {/* Subtitle */}
        <p
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#a1a1aa",
            textAlign: "center",
            lineHeight: 1.45,
            maxWidth: 880,
            opacity: subtitleIn,
            transform: `translateY(${(1 - subtitleIn) * 20}px)`,
          }}
        >
          {subtitle}
        </p>

        {/* Bottom number badge */}
        {frame >= 55 && (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              right: 80,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "transparent",
              border: `4px solid ${accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 900,
              color: accent,
              opacity: numBadgeIn,
              transform: `scale(${0.6 + numBadgeIn * 0.4})`,
              boxShadow: `0 0 24px ${accent}55`,
            }}
          >
            {number}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
