import { Composition } from "remotion";
import { SampleVideo } from "./SampleVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SampleVideo"
        component={SampleVideo}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          titleText: "Hello from Remotion",
        }}
      />
    </>
  );
};
