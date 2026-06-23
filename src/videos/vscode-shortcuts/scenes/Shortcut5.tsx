import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT } from "../Composition";

const Key: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="rounded-2xl border-2 font-mono font-black text-white flex items-center justify-center"
    style={{
      borderColor: ACCENT,
      background: `${ACCENT}2a`,
      fontSize: 60,
      minWidth: 120,
      padding: "20px 32px",
      boxShadow: `0 6px 0 ${ACCENT}66, 0 8px 20px ${ACCENT}44`,
    }}
  >
    {label}
  </div>
);

const TERMINAL_LINES = [
  { text: "$ npm run dev", delay: 70 },
  { text: "  Local: http://localhost:3000", delay: 100 },
  { text: "$ git status", delay: 130 },
  { text: "  nothing to commit ✓", delay: 160 },
];

export const Shortcut5: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const keysIn = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.8 } });
  const descIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });
  const terminalIn = spring({ frame: frame - 65, fps, config: { damping: 16 } });

  const visibleLines = TERMINAL_LINES.filter((l) => frame >= l.delay);

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-10">
          <div
            className="rounded-full flex items-center justify-center font-black"
            style={{
              width: 110,
              height: 110,
              background: ACCENT,
              fontSize: 64,
              color: "white",
              opacity: numIn,
              transform: `scale(${0.5 + numIn * 0.5})`,
              boxShadow: `0 0 40px ${ACCENT}88`,
            }}
          >
            5
          </div>

          <div
            className="flex items-center gap-5"
            style={{
              opacity: keysIn,
              transform: `scale(${0.8 + keysIn * 0.2})`,
            }}
          >
            <Key label="Ctrl" />
            <span className="font-black text-zinc-400" style={{ fontSize: 60 }}>+</span>
            <Key label="` " />
          </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: descIn,
              transform: `translateY(${(1 - descIn) * 20}px)`,
            }}
          >
            <p className="font-black text-white text-center" style={{ fontSize: 60 }}>
              Toggle Terminal
            </p>
            <p className="font-bold text-zinc-400 text-center" style={{ fontSize: 34, maxWidth: 800 }}>
              Buka terminal tanpa keluar dari editor
            </p>
          </div>

          {frame >= 65 && (
            <div
              className="flex flex-col gap-2 rounded-2xl p-6 font-mono"
              style={{
                background: "#0d0d0d",
                border: `1px solid ${ACCENT}44`,
                minWidth: 700,
                opacity: terminalIn,
                transform: `translateY(${(1 - terminalIn) * 20}px)`,
              }}
            >
              <div className="flex gap-2 mb-3">
                <div className="rounded-full" style={{ width: 14, height: 14, background: "#ff5f57" }} />
                <div className="rounded-full" style={{ width: 14, height: 14, background: "#febc2e" }} />
                <div className="rounded-full" style={{ width: 14, height: 14, background: "#28c840" }} />
                <span className="text-zinc-500 ml-2" style={{ fontSize: 22 }}>TERMINAL</span>
              </div>
              {visibleLines.map((line, i) => (
                <p key={i} className={line.text.startsWith("$") ? "text-emerald-400" : "text-zinc-400"} style={{ fontSize: 30 }}>
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
