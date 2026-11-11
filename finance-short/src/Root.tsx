import React from "react";
import { Composition, getInputProps } from "remotion";
import { NewtonShort, NEWTON_FRAMES } from "./videos/newton/Newton";
import { ReadShort, READ_FRAMES } from "./videos/read/Read";
import { JensenShort, JENSEN_FRAMES } from "./videos/jensen/Jensen";
import { Genius3D, GENIUS3D_FRAMES } from "./videos/genius/Genius3D";
import { Genius2D, GENIUS2D_FRAMES } from "./videos/genius/Genius2D";

/** look checks: frame k of NewtonPreview shows story frame frames[k] (inputProps { frames: [...] }) */
const Preview: React.FC = () => {
  const frames = ((getInputProps() as { frames?: number[] }).frames ?? [0]);
  return <PreviewInner frames={frames} />;
};
const PreviewInner: React.FC<{ frames: number[] }> = ({ frames }) => {
  return <NewtonShort at={frames} />;
};
const JensenPreview: React.FC = () => { const p = getInputProps() as { frames?: number[]; clean?: boolean }; return <JensenShort at={p.frames ?? [0]} clean={p.clean} />; };
const Genius3DPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <Genius3D at={p.frames ?? [0]} />; };
const Genius2DPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <Genius2D at={p.frames ?? [0]} />; };
const ReadPreview: React.FC = () => { const p = getInputProps() as { frames?: number[]; clean?: boolean }; return <ReadShort at={p.frames ?? [0]} clean={p.clean} />; };

export const RemotionRoot: React.FC = () => {
  const n = ((getInputProps() as { frames?: number[] }).frames ?? [0]).length;
  return (
    <>
      <Composition id="NewtonShort" component={NewtonShort} durationInFrames={NEWTON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NewtonPreview" component={Preview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="JensenShort" component={JensenShort} durationInFrames={JENSEN_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="JensenPreview" component={JensenPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="Genius3D" component={Genius3D} durationInFrames={GENIUS3D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Genius3DPreview" component={Genius3DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="Genius2D" component={Genius2D} durationInFrames={GENIUS2D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Genius2DPreview" component={Genius2DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="ReadShort" component={ReadShort} durationInFrames={READ_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ReadPreview" component={ReadPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
    </>
  );
};
