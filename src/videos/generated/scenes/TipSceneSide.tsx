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
  bullets?: string[];
};

export const TipSceneSide: React.FC<Props> = ({
  duration,
  number,
  title,
  subtitle,
  emoji,
  accent,
  bullets = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barIn = spring({ frame, fps, config: { damping: 20, stiffness: 200 } });
  const numIn = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 15, fps, config: { damping: 12, mass: 0.7 } });
  const titleIn = spring({ frame: frame - 30, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 48, fps, config: { damping: 16 } });

  const b1Frame = Math.floor(duration * 0.35);
  const b2Frame = Math.floor(duration * 0.54);
  const b3Frame = Math.floor(duration * 0.70);

  const bullet1In = spring({ frame: frame - b1Frame, fps, config: { damping: 14, stiffness: 110 } });
  const bullet2In = spring({ frame: frame - b2Frame, fps, config: { damping: 14, stiffness: 110 } });
  const bullet3In = spring({ frame: frame - b3Frame, fps, config: { damping: 14, stiffness: 110 } });
  const bulletIns = [bullet1In, bullet2In, bullet3In];

  const subtitleFade = interpolate(frame, [b1Frame - 10, b1Frame + 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emojiFloat = Math.sin(frame * 0.07) * 8;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hasBullets = bullets.length > 0;

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      {/* Accent bar left */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: interpolate(barIn, [0, 1], [0, 12]),
          height: "100%",
          background: accent,
          boxShadow: `0 0 60px ${accent}88`,
        }}
      />

      {/* Background number watermark */}
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -40,
          fontSize: 600,
          fontWeight: 900,
          color: `${accent}10`,
          lineHeight: 1,
          fontFamily: "sans-serif",
          userSelect: "none",
        }}
      >
        {number}
      </div>

      {/* Content — left-aligned */}
      <AbsoluteFill
        style={{
          paddingLeft: 72,
          paddingRight: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {/* Number badge */}
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            fontWeight: 900,
            color: "white",
            marginBottom: 36,
            opacity: numIn,
            transform: `scale(${0.5 + numIn * 0.5})`,
            boxShadow: `0 0 30px ${accent}88`,
          }}
        >
          {number}
        </div>

        {/* Emoji */}
        <div
          style={{
            fontSize: 130,
            lineHeight: 1,
            marginBottom: 30,
            opacity: emojiIn,
            transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
            filter: `drop-shadow(0 0 24px ${accent}66)`,
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "white",
            lineHeight: 1.1,
            marginBottom: 20,
            opacity: titleIn,
            transform: `translateX(${(1 - titleIn) * -30}px)`,
          }}
        >
          {title}
        </p>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(titleIn, [0, 1], [0, 100]),
            height: 5,
            background: accent,
            borderRadius: 3,
            marginBottom: 28,
          }}
        />

        {/* Subtitle — fades as bullets arrive */}
        <p
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: "#a1a1aa",
            lineHeight: 1.4,
            maxWidth: 900,
            opacity: hasBullets ? subtitleIn * subtitleFade : subtitleIn,
            transform: `translateX(${(1 - subtitleIn) * -20}px)`,
            position: hasBullets ? "absolute" : "relative",
            top: hasBullets ? 780 : undefined,
          }}
        >
          {subtitle}
        </p>

        {/* Bullets — slide in from left */}
        {hasBullets && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {bullets.slice(0, 3).map((bullet, i) => {
              const bIn = bulletIns[i];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    opacity: bIn,
                    transform: `translateX(${(1 - bIn) * -50}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 52,
                      borderRadius: 4,
                      background: accent,
                      flexShrink: 0,
                      boxShadow: `0 0 10px ${accent}`,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.25,
                    }}
                  >
                    {bullet}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
