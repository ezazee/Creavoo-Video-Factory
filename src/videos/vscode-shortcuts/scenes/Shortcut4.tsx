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

const CURSOR_ROWS = [1, 2, 3, 4];

export const Shortcut4: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numIn = spring({ frame, fps, config: { damping: 14 } });
  const keysIn = spring({ frame: frame - 12, fps, config: { damping: 12, mass: 0.8 } });
  const descIn = spring({ frame: frame - 40, fps, config: { damping: 16 } });

  const visibleCursors = CURSOR_ROWS.filter((_, i) => frame >= 70 + i * 25).length;
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const LINES = [
    'const name = "Alice"',
    'const name = "Bob"  ',
    'const name = "Carol"',
    'const name = "Dave" ',
  ];

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
            4
          </div>

          <div
            className="flex items-center gap-5"
            style={{
              opacity: keysIn,
              transform: `scale(${0.8 + keysIn * 0.2})`,
            }}
          >
            <Key label="Alt" />
            <span className="font-black text-zinc-400" style={{ fontSize: 60 }}>+</span>
            <Key label="Click" />
          </div>

          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: descIn,
              transform: `translateY(${(1 - descIn) * 20}px)`,
            }}
          >
            <p className="font-black text-white text-center" style={{ fontSize: 60 }}>
              Multi-Cursor
            </p>
            <p className="font-bold text-zinc-400 text-center" style={{ fontSize: 34, maxWidth: 800 }}>
              Edit banyak baris secara bersamaan
            </p>
          </div>

          {frame >= 70 && (
            <div className="flex flex-col gap-2 rounded-2xl p-6" style={{ background: "#1e1e1e", border: "1px solid #333", minWidth: 700 }}>
              {LINES.map((line, i) => (
                <div key={i} className="flex items-center font-mono" style={{ fontSize: 34 }}>
                  <span className="text-zinc-600 mr-6" style={{ minWidth: 32 }}>{i + 1}</span>
                  <span className="text-emerald-300">{line}</span>
                  {i < visibleCursors && cursorBlink && (
                    <span style={{ width: 3, height: 36, background: ACCENT, display: "inline-block", marginLeft: 2 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
