import React from "react";
import { Composition, getInputProps } from "remotion";
import { NewtonShort, NEWTON_FRAMES } from "./videos/newton/Newton";
import { ReadShort, READ_FRAMES } from "./videos/read/Read";
import { JensenShort, JENSEN_FRAMES } from "./videos/jensen/Jensen";
import { Genius3D, GENIUS3D_FRAMES } from "./videos/genius/Genius3D";
import { Genius2D, GENIUS2D_FRAMES } from "./videos/genius/Genius2D";
import { GeniusThumb } from "./videos/genius/two/thumb";
import { Tenk3D, TENK3D_FRAMES } from "./videos/tenk/Tenk3D";
import { Tenk2D, TENK2D_FRAMES } from "./videos/tenk/Tenk2D";
import { NetShort, NET_FRAMES } from "./videos/net/Net";
import { BasketShort, BASKET_FRAMES } from "./videos/basket/Basket";
import { GoldfishShort, GOLDFISH_FRAMES } from "./videos/goldfish/Goldfish";
import { PoyaisShort, POYAIS_FRAMES } from "./videos/poyais/Poyais";
import { PhonecallShort, PHONECALL_FRAMES } from "./videos/phonecall/Phonecall";
import { EightShort, EIGHT_FRAMES } from "./videos/eight/Eight";
import { NvidiaShort, NVIDIA_FRAMES } from "./videos/nvidia/Nvidia";
import { BatbombShort, BATBOMB_FRAMES } from "./videos/batbomb/Batbomb";
import { RatsShort, RATS_FRAMES } from "./videos/rats/Rats";
import { StinkShort, STINK_FRAMES } from "./videos/stink/Stink";

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
const Tenk3DPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <Tenk3D at={p.frames ?? [0]} />; };
const Tenk2DPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <Tenk2D at={p.frames ?? [0]} />; };
const Genius2DPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <Genius2D at={p.frames ?? [0]} />; };
const GoldfishPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <GoldfishShort at={p.frames ?? [0]} />; };
const BasketPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <BasketShort at={p.frames ?? [0]} />; };
const NetPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <NetShort at={p.frames ?? [0]} />; };
const EightPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <EightShort at={p.frames ?? [0]} />; };
const NvidiaPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <NvidiaShort at={p.frames ?? [0]} />; };
const BatbombPreview: React.FC = () => { const p = getInputProps() as { frames?: number[] }; return <BatbombShort at={p.frames ?? [0]} />; };
const ReadPreview: React.FC = () => { const p = getInputProps() as { frames?: number[]; clean?: boolean }; return <ReadShort at={p.frames ?? [0]} clean={p.clean} />; };

export const RemotionRoot: React.FC = () => {
  const n = ((getInputProps() as { frames?: number[] }).frames ?? [0]).length;
  return (
    <>
      <Composition id="NewtonShort" component={NewtonShort} durationInFrames={NEWTON_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NewtonPreview" component={Preview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="JensenShort" component={JensenShort} durationInFrames={JENSEN_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="JensenPreview" component={JensenPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="Tenk3D" component={Tenk3D} durationInFrames={TENK3D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Tenk3DPreview" component={Tenk3DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="Tenk2D" component={Tenk2D} durationInFrames={TENK2D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Tenk2DPreview" component={Tenk2DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="Genius3D" component={Genius3D} durationInFrames={GENIUS3D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Genius3DPreview" component={Genius3DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="Genius2D" component={Genius2D} durationInFrames={GENIUS2D_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="GeniusThumb" component={GeniusThumb} durationInFrames={1} fps={30} width={1920} height={1080} />
      <Composition id="Genius2DPreview" component={Genius2DPreview} durationInFrames={Math.max(1, n)} fps={30} width={1920} height={1080} />
      <Composition id="PhonecallShort" component={PhonecallShort} durationInFrames={PHONECALL_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="StinkShort" component={StinkShort} durationInFrames={STINK_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="RatsShort" component={RatsShort} durationInFrames={RATS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="BatbombShort" component={BatbombShort} durationInFrames={BATBOMB_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="BatbombPreview" component={BatbombPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="NvidiaShort" component={NvidiaShort} durationInFrames={NVIDIA_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NvidiaPreview" component={NvidiaPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="EightShort" component={EightShort} durationInFrames={EIGHT_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="EightPreview" component={EightPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="PoyaisShort" component={PoyaisShort} durationInFrames={POYAIS_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="GoldfishShort" component={GoldfishShort} durationInFrames={GOLDFISH_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="GoldfishPreview" component={GoldfishPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="BasketShort" component={BasketShort} durationInFrames={BASKET_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="BasketPreview" component={BasketPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="NetShort" component={NetShort} durationInFrames={NET_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="NetPreview" component={NetPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
      <Composition id="ReadShort" component={ReadShort} durationInFrames={READ_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="ReadPreview" component={ReadPreview} durationInFrames={Math.max(1, n)} fps={30} width={1080} height={1920} />
    </>
  );
};
