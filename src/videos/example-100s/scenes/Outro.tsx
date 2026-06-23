import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

export const Outro: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14 } });
  const nextIn = spring({ frame: frame - 30, fps, config: { damping: 14 } });
  const arrowBob = Math.sin(frame / 6) * 10;
  const arrowIn = spring({ frame: frame - 90, fps, config: { damping: 18 } });

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <p
            className="font-bold uppercase tracking-widest text-zinc-400"
            style={{
              fontSize: 44,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * -30}px)`,
            }}
          >
            up next
          </p>
          <div
            className="flex items-center gap-6 rounded-3xl border-4 px-12 py-8"
            style={{
              borderColor: ACCENT,
              background: `${ACCENT}1a`,
              opacity: nextIn,
              transform: `scale(${0.85 + nextIn * 0.15})`,
            }}
          >
            <span className="text-7xl">💡</span>
            <p className="font-black" style={{ color: ACCENT, fontSize: 80 }}>
              YOUR TOPIC
            </p>
          </div>
          {frame >= 90 && (
            <div
              className="flex flex-col items-center"
              style={{ opacity: arrowIn, transform: `translateY(${arrowBob}px)` }}
            >
              <p className="text-5xl font-black text-white">
                COMMENT THE NEXT ONE
              </p>
              <svg
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                className="mt-3"
              >
                <path
                  d="M12 4v16m0 0l-7-7m7 7l7-7"
                  stroke={ACCENT}
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
