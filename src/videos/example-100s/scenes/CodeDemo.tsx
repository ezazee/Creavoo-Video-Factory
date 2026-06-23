import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TerminalMock } from "../../../shared/TerminalMock";
import { ACCENT } from "../Composition";

type Line = {
  text: string;
  kind: "cmd" | "comment";
};

const SESSION: Line[] = [
  { text: "# basic git flow", kind: "comment" },
  { text: "git init", kind: "cmd" },
  { text: "git add .", kind: "cmd" },
  { text: 'git commit -m "first commit"', kind: "cmd" },
  { text: "git branch new-feature", kind: "cmd" },
  { text: "git merge new-feature", kind: "cmd" },
];

const KIND_COLOR: Record<Line["kind"], string> = {
  comment: "text-zinc-500",
  cmd: "text-emerald-300",
};

const CODE_START = 15;
const HIGHLIGHT_START = 220;

export const CodeDemo: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeIn = spring({ frame, fps, config: { damping: 16 } });
  const highlightPulse =
    frame < HIGHLIGHT_START
      ? 0
      : 0.5 + 0.5 * Math.abs(Math.sin((frame - HIGHLIGHT_START) * 0.15));

  const exit = interpolate(frame, [duration - 12, duration], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const visibleLines = SESSION.filter(
    (_, i) => frame >= CODE_START + i * 24,
  ).map((line, i) => (
    <span key={i} className={`whitespace-pre ${KIND_COLOR[line.kind]}`}>
      {line.text}
    </span>
  ));

  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <AbsoluteFill className="items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <p
            className="text-3xl font-black uppercase tracking-wider"
            style={{ color: ACCENT }}
          >
            basic git flow
          </p>

          <div
            style={{ opacity: codeIn, transform: `scale(${0.9 + codeIn * 0.1})` }}
          >
            <TerminalMock
              title="terminal"
              className="w-[940px]"
              prompt="$"
              lines={visibleLines.length ? visibleLines : [" "]}
            />
          </div>

          {frame >= HIGHLIGHT_START && (
            <div
              className="flex items-center gap-4 rounded-xl px-10 py-4"
              style={{
                background: ACCENT,
                boxShadow: `0 10px 40px ${ACCENT}80`,
                opacity: highlightPulse,
              }}
            >
              <span className="text-3xl">📸</span>
              <span className="text-2xl font-black uppercase text-white">
                every commit is recorded &amp; reversible
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
