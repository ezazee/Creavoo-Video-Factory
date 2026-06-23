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

export const TipScene: React.FC<Props> = ({
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

  // Entrance animations
  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const emojiIn = spring({ frame: frame - 10, fps, config: { damping: 12, mass: 0.8 } });
  const titleIn = spring({ frame: frame - 25, fps, config: { damping: 16 } });
  const subtitleIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });

  // Bullets appear at 35%, 55%, 72% of scene duration
  const b1Frame = Math.floor(duration * 0.35);
  const b2Frame = Math.floor(duration * 0.54);
  const b3Frame = Math.floor(duration * 0.70);

  const bullet1In = spring({ frame: frame - b1Frame, fps, config: { damping: 14, stiffness: 120 } });
  const bullet2In = spring({ frame: frame - b2Frame, fps, config: { damping: 14, stiffness: 120 } });
  const bullet3In = spring({ frame: frame - b3Frame, fps, config: { damping: 14, stiffness: 120 } });

  const bulletIns = [bullet1In, bullet2In, bullet3In];

  // Subtitle fades out as bullets come in
  const subtitleFade = interpolate(frame, [b1Frame - 10, b1Frame + 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emojiFloat = Math.sin(frame * 0.08) * 10;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const hasBullets = bullets.length > 0;

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center px-12" style={{ gap: 28, width: "100%" }}>
          {/* Number badge */}
          <div
            className="rounded-full flex items-center justify-center font-black"
            style={{
              width: 100,
              height: 100,
              background: accent,
              fontSize: 56,
              color: "white",
              opacity: numIn,
              transform: `scale(${0.5 + numIn * 0.5})`,
              boxShadow: `0 0 40px ${accent}88`,
            }}
          >
            {number}
          </div>

          {/* Emoji */}
          <div
            style={{
              fontSize: 140,
              lineHeight: 1,
              opacity: emojiIn,
              transform: `scale(${0.6 + emojiIn * 0.4}) translateY(${emojiFloat}px)`,
              filter: `drop-shadow(0 0 30px ${accent}66)`,
            }}
          >
            {emoji}
          </div>

          {/* Title */}
          <p
            className="font-black text-white text-center"
            style={{
              fontSize: 68,
              lineHeight: 1.1,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 24}px)`,
            }}
          >
            {title}
          </p>

          {/* Subtitle — fades out when bullets appear */}
          <p
            className="font-bold text-zinc-400 text-center"
            style={{
              fontSize: 36,
              maxWidth: 860,
              lineHeight: 1.4,
              opacity: hasBullets ? subtitleIn * subtitleFade : subtitleIn,
              transform: `translateY(${(1 - subtitleIn) * 16}px)`,
              position: hasBullets ? "absolute" : "relative",
            }}
          >
            {subtitle}
          </p>

          {/* Bullets — appear one by one */}
          {hasBullets && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
                width: "100%",
                maxWidth: 900,
                marginTop: 8,
              }}
            >
              {bullets.slice(0, 3).map((bullet, i) => {
                const bIn = bulletIns[i];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                      opacity: bIn,
                      transform: `translateX(${(1 - bIn) * -40}px)`,
                    }}
                  >
                    {/* Accent dot */}
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: accent,
                        flexShrink: 0,
                        boxShadow: `0 0 12px ${accent}`,
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
