import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const SHORTCUTS = ["Ctrl+P", "Ctrl+Shift+P", "Ctrl+D", "Alt+Click", "Ctrl+`"];

export const Outro: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14 } });
  const listIn = spring({ frame: frame - 20, fps, config: { damping: 14 } });
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
        <div className="flex flex-col items-center gap-8">
          <p
            className="font-black text-white text-center"
            style={{
              fontSize: 72,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * -20}px)`,
            }}
          >
            5 Shortcuts✓
          </p>

          <div
            className="flex flex-col gap-3 rounded-3xl p-8"
            style={{
              background: `${ACCENT}15`,
              border: `2px solid ${ACCENT}40`,
              opacity: listIn,
              transform: `scale(${0.9 + listIn * 0.1})`,
            }}
          >
            {SHORTCUTS.map((s, i) => (
              <div key={s} className="flex items-center gap-5">
                <div
                  className="rounded-full flex items-center justify-center font-black text-white"
                  style={{ width: 52, height: 52, background: ACCENT, fontSize: 28, flexShrink: 0 }}
                >
                  {i + 1}
                </div>
                <span className="font-mono font-bold text-white" style={{ fontSize: 40 }}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          {frame >= 70 && (
            <div
              className="flex flex-col items-center gap-4"
              style={{ opacity: ctaIn }}
            >
              <p
                className="font-black text-white text-center"
                style={{ fontSize: 44 }}
              >
                Yang mana favoritmu?
              </p>
              <p className="font-bold text-zinc-400 text-center" style={{ fontSize: 32 }}>
                Drop di komentar 👇
              </p>
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: `translateY(${arrowBob}px)` }}
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
