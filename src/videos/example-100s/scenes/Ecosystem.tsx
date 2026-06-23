import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const TOOLS = [
  { name: "GitHub", desc: "host + collaborate", emoji: "🐙" },
  { name: "GitLab", desc: "full ci/cd", emoji: "🦊" },
  { name: "CLI tools", desc: "fast workflows", emoji: "⚡" },
  { name: "Editors", desc: "built-in everywhere", emoji: "🧩" },
];

const CARD_STARTS = [15, 35, 55, 75];

export const Ecosystem: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14 } });
  const taglineIn = spring({ frame: frame - 120, fps, config: { damping: 16 } });

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
            className="text-5xl font-black uppercase tracking-wider text-white"
            style={{
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * -20}px)`,
            }}
          >
            huge ecosystem
          </p>
          <div className="grid grid-cols-2 gap-5">
            {TOOLS.map((t, i) => {
              const enter = spring({
                frame: frame - CARD_STARTS[i],
                fps,
                config: { damping: 14, mass: 0.6 },
              });
              return (
                <div
                  key={t.name}
                  className="flex w-[420px] items-center gap-5 rounded-2xl border-2 bg-zinc-900 px-7 py-5"
                  style={{
                    borderColor: `${ACCENT}60`,
                    opacity: enter,
                    transform: `translateY(${(1 - enter) * 30}px) scale(${
                      0.85 + enter * 0.15
                    })`,
                  }}
                >
                  <span className="text-6xl">{t.emoji}</span>
                  <div>
                    <p className="text-2xl font-black text-white">{t.name}</p>
                    <p
                      className="font-mono text-base uppercase tracking-wider"
                      style={{ color: ACCENT }}
                    >
                      {t.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {frame >= 120 && (
            <p
              className="text-3xl font-black"
              style={{
                color: ACCENT,
                opacity: taglineIn,
                transform: `scale(${0.9 + taglineIn * 0.1})`,
              }}
            >
              version control · zero drama
            </p>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
