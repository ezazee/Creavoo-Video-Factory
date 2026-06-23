import type { ReactNode } from "react";

export type StatusSegment = {
  label: string;
  bg: string;
  fg?: string;
};

/** Powerline-style status bar (optional, for terminal-prompt looks). */
export const PowerlineStatus: React.FC<{ segments: StatusSegment[] }> = ({
  segments,
}) => {
  return (
    <div className="flex items-stretch font-mono text-xl">
      {segments.map((seg, i) => {
        const next = segments[i + 1];
        return (
          <div key={i} className="flex items-stretch">
            <div
              className="flex items-center px-4 py-1 font-bold"
              style={{ background: seg.bg, color: seg.fg ?? "#0b0b0b" }}
            >
              {seg.label}
            </div>
            <div
              className="h-full w-0"
              style={{
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                borderLeft: `12px solid ${seg.bg}`,
                background: next ? next.bg : "transparent",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/** A terminal window with mac-style chrome and monospace lines. */
export const TerminalMock: React.FC<{
  title?: string;
  lines: ReactNode[];
  prompt?: string;
  cursor?: boolean;
  cursorColor?: string;
  status?: ReactNode;
  className?: string;
  showChrome?: boolean;
  blink?: boolean;
}> = ({
  title = "terminal",
  lines,
  prompt = "❯",
  cursor = false,
  cursorColor = "#22d3ee",
  status,
  className,
  showChrome = true,
  blink = true,
}) => {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-zinc-700/60 bg-zinc-900 shadow-2xl ${
        className ?? ""
      }`}
    >
      {showChrome && (
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
          <span className="h-4 w-4 rounded-full bg-rose-500" />
          <span className="h-4 w-4 rounded-full bg-amber-400" />
          <span className="h-4 w-4 rounded-full bg-emerald-500" />
          <span className="ml-4 font-mono text-2xl text-zinc-400">{title}</span>
        </div>
      )}
      <div className="px-6 py-5 font-mono text-2xl leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex items-center text-zinc-200">
            <span className="mr-3 text-zinc-500">{prompt}</span>
            <span className="flex-1">{line}</span>
            {cursor && i === lines.length - 1 && (
              <span
                className="ml-1 inline-block h-7 w-2"
                style={{
                  background: cursorColor,
                  opacity: blink ? 1 : 0.2,
                }}
              />
            )}
          </div>
        ))}
        {status && <div className="mt-4">{status}</div>}
      </div>
    </div>
  );
};
