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
  tips: { title: string }[];
  accent: string;
  ctaText: string;
};

export const Outro: React.FC<Props> = ({ duration, tips, accent, ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14 } });
  const listIn = spring({ frame: frame - 18, fps, config: { damping: 14 } });
  const ctaIn = spring({ frame: frame - 70, fps, config: { damping: 14 } });
  const arrowBob = Math.sin(frame / 6) * 10;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8 px-10">
          <p
            className="font-black text-white text-center"
            style={{
              fontSize: 68,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * -20}px)`,
            }}
          >
            Recap ✓
          </p>

          <div
            className="flex flex-col gap-4 rounded-3xl p-8 w-full"
            style={{
              background: `${accent}15`,
              border: `2px solid ${accent}40`,
              opacity: listIn,
              transform: `scale(${0.9 + listIn * 0.1})`,
            }}
          >
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-5">
                <div
                  className="rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
                  style={{ width: 52, height: 52, background: accent, fontSize: 28 }}
                >
                  {i + 1}
                </div>
                <span className="font-bold text-white" style={{ fontSize: 38 }}>
                  {tip.title}
                </span>
              </div>
            ))}
          </div>

          {frame >= 70 && (
            <div
              className="flex flex-col items-center gap-3"
              style={{ opacity: ctaIn }}
            >
              <p className="font-black text-white text-center" style={{ fontSize: 42 }}>
                {ctaText}
              </p>
              <svg
                width="72"
                height="72"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: `translateY(${arrowBob}px)` }}
              >
                <path
                  d="M12 4v16m0 0l-7-7m7 7l7-7"
                  stroke={accent}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
