import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  titleText: string;
};

export const SampleVideo: React.FC<Props> = ({ titleText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({
    fps,
    frame,
    config: { damping: 200 },
  });

  const scale = spring({
    fps,
    frame,
    config: { damping: 100, stiffness: 80 },
    from: 0.5,
    to: 1,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: "white",
          fontSize: 64,
          fontWeight: "bold",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        {titleText}
      </div>
    </AbsoluteFill>
  );
};
