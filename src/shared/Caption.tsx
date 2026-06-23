import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Lower-third caption with enter/exit animation. */
export const Caption: React.FC<{
  text: string;
  hold?: number;
}> = ({ text, hold }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const exitStart = (hold ?? durationInFrames) - 10;

  const enter = interpolate(frame, [0, 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [exitStart, exitStart + 10], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = enter - exit;
  const translateY = (1 - enter) * 30 + exit * -20;

  return (
    <AbsoluteFill className="items-center justify-end pb-40">
      <div
        className="mx-12 rounded-2xl bg-black/70 px-10 py-6 backdrop-blur-md"
        style={{ opacity, transform: `translateY(${translateY}px)` }}
      >
        <p className="text-center text-5xl font-bold leading-tight text-white">
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
