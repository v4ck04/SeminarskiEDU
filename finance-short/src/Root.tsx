import React from "react";
import { Composition, getInputProps } from "remotion";
import { NewtonShort, NEWTON_FRAMES } from "./videos/newton/Newton";

/** look checks: frame k of NewtonPreview shows story frame frames[k] (inputProps { frames: [...] }) */
const Preview: React.FC = () => {
  const frames = ((getInputProps() as { frames?: number[] }).frames ?? [0]);
  return <PreviewInner frames={frames} />;
};
const PreviewInner: React.FC<{ frames: number[] }> = ({ frames }) => {
  return <NewtonShort at={frames} />;
};

export const RemotionRoot: React.FC = () => {
  const n = ((getInputProps() as { frames?: number[] }).frames ?? [0]).length;
  return (
    <>
      <Composition id="NewtonShort" component={NewtonShort} durationInFrames={NEWTON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NewtonPreview" component={Preview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
    </>
  );
};
