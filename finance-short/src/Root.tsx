import React from "react";
import { Composition, getInputProps } from "remotion";
import { NewtonShort, NEWTON_FRAMES } from "./videos/newton/Newton";
import { ReadShort, READ_FRAMES } from "./videos/read/Read";

/** look checks: frame k of NewtonPreview shows story frame frames[k] (inputProps { frames: [...] }) */
const Preview: React.FC = () => {
  const frames = ((getInputProps() as { frames?: number[] }).frames ?? [0]);
  return <PreviewInner frames={frames} />;
};
const PreviewInner: React.FC<{ frames: number[] }> = ({ frames }) => {
  return <NewtonShort at={frames} />;
};
const ReadPreview: React.FC = () => <ReadShort at={(getInputProps() as { frames?: number[] }).frames ?? [0]} />;

export const RemotionRoot: React.FC = () => {
  const n = ((getInputProps() as { frames?: number[] }).frames ?? [0]).length;
  return (
    <>
      <Composition id="NewtonShort" component={NewtonShort} durationInFrames={NEWTON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NewtonPreview" component={Preview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="ReadShort" component={ReadShort} durationInFrames={READ_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ReadPreview" component={ReadPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
    </>
  );
};
