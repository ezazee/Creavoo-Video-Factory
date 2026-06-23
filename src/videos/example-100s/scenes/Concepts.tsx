import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const PILLARS = [
  {
    num: "①",
    title: "Commit",
    icon: "📸",
    desc: "a snapshot you can return to anytime",
  },
  {
    num: "②",
    title: "Branch",
    icon: "🌿",
    desc: "experiment safely, then merge",
  },
  {
    num: "③",
    title: "Distributed",
    icon: "🌍",
    desc: "full history, works offline",
  },
];

const CARD_STARTS = [25, 95, 175];

export const Concepts: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14 } });

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-10">
          <p
            className="text-5xl font-black uppercase tracking-wider"
            style={{
              color: ACCENT,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * -20}px)`,
            }}
          >
            3 key ideas
          </p>
          <div className="flex flex-col gap-5">
            {PILLARS.map((p, i) => {
              const enter = spring({
                frame: frame - CARD_STARTS[i],
                fps,
                config: { damping: 14, mass: 0.7 },
              });
              return (
                <div
                  key={p.title}
                  className="flex w-[900px] items-center gap-6 rounded-2xl border-2 px-8 py-6"
                  style={{
                    borderColor: `${ACCENT}80`,
                    background: `${ACCENT}1a`,
                    opacity: enter,
                    transform: `translateX(${(1 - enter) * -50}px) scale(${
                      0.9 + enter * 0.1
                    })`,
                  }}
                >
                  <span
                    className="font-black"
                    style={{ color: ACCENT, fontSize: 80 }}
                  >
                    {p.num}
                  </span>
                  <span className="text-7xl">{p.icon}</span>
                  <div className="flex flex-col">
                    <p className="text-4xl font-black uppercase text-white">
                      {p.title}
                    </p>
                    <p className="text-2xl" style={{ color: "#c7d2fe" }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
