export function Sk({ w = "100%", h = 16, rounded = 8, opacity = 1 }: {
  w?: number | string; h?: number; rounded?: number; opacity?: number;
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: w,
        height: h,
        borderRadius: rounded,
        background: "linear-gradient(90deg,#1f1f23 0%,#2a2a30 50%,#1f1f23 100%)",
        backgroundSize: "200% 100%",
        animation: "sk-shimmer 1.4s ease-in-out infinite",
        opacity,
      }}
    />
  );
}

// Inline keyframes injected once
export function SkeletonStyle() {
  return (
    <style>{`
      @keyframes sk-shimmer {
        0%   { background-position: 200% 0 }
        100% { background-position: -200% 0 }
      }
    `}</style>
  );
}

export function SkCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: "#111113", border: "1px solid #ffffff06" }}>
      <Sk h={12} w="55%" rounded={6} />
      {Array.from({ length: lines }, (_, i) => (
        <Sk key={i} h={20} w={i === lines - 1 ? "70%" : "100%"} rounded={6} />
      ))}
    </div>
  );
}

export function SkRow({ short }: { short?: boolean }) {
  return (
    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#ffffff06" }}>
      <Sk w={36} h={36} rounded={10} />
      <div className="flex-1 flex flex-col gap-2">
        <Sk h={11} w={short ? "45%" : "65%"} rounded={5} />
        <Sk h={9} w={short ? "30%" : "40%"} rounded={5} />
      </div>
    </div>
  );
}

export function SkText({ w = "100%", h = 11 }: { w?: string | number; h?: number }) {
  return <Sk w={w} h={h} rounded={5} />;
}
