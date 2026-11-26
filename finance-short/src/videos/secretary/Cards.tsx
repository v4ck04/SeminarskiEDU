// 2D character cards for the Blender film "A Secretary Died With $9 Million": the money-series bean-head characters
// (egg/toon.ts) drawn on a transparent 1200 x 2000 canvas (2x the 600 x 1000 design, feet on y 1950). One still per card;
// scripts/cards.mjs renders every name in CARDS to secretary-short/blender/cards/<name>.png.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, getInputProps } from "remotion";
import { Pen, bodyFront, Outfit, FrontOpts } from "../egg/toon";

const SYL_Y: Outfit = { jacket: "#3f6f9a", pants: "#3b3f52", boots: "#3a2a22", hat: "hair", hair: "#6a4228", skin: "#ffe2c2", dress: "#4f7fb0", buttons: "#f1efe6" };
const SYL_O: Outfit = { ...SYL_Y, hair: "#d9d5cc", jacket: "#6a5a8a", dress: "#7a6a9a", skin: "#f7dcc4" };
const BOSS: Outfit = { jacket: "#2e3442", pants: "#262a35", boots: "#1f1a1a", hat: "hair", hair: "#2a2220", skin: "#f5c9a0", cravat: "#c0353a", buttons: "#d9dde0", build: "stout" };
const HUSB: Outfit = { jacket: "#7a5a3a", pants: "#3b3f52", boots: "#3a2a22", hat: "cap", cap: "#4a5a6e", skin: "#ecd0b6", moustache: "#6a5a4a" };
const NIECE: Outfit = { jacket: "#b5653f", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#3a2a22", skin: "#f5c9a0", dress: "#c25a7a" };
const ST = (j: string, h: string, s: string, d?: string): Outfit => ({ jacket: j, pants: "#2c2f3a", boots: "#2a2230", hat: "hair", hair: h, skin: s, dress: d });
const RIDER = (j: string, hat: string, s: string): Outfit => ({ jacket: j, pants: "#3b3f52", boots: "#3a2a22", hat, cap: "#5a5f6e", hair: "#4a3020", skin: s });

const C = (o: Outfit, f: FrontOpts): [Outfit, FrontOpts] => [o, { light: -2.1, seed: 3, ...f }];
export const CARDS: Record<string, [Outfit, FrontOpts]> = {
  syl_y: C(SYL_Y, { mode: "stand", expr: "smile" }),
  syl_y_blink: C(SYL_Y, { mode: "stand", expr: "smile", blink: 1 }),
  syl_y_no: C(SYL_Y, { mode: "stand", expr: "smile_closed", look: 1 }),
  syl_y_sit: C(SYL_Y, { mode: "sit", expr: "neutral", look: -1 }),
  syl_y_sit_smile: C(SYL_Y, { mode: "sit", expr: "smile", look: 0 }),
  syl_y_sit_paper: C(SYL_Y, { mode: "sit", expr: "smile", look: 0, prop: "paper", wave: 0.4 }),
  syl_o: C(SYL_O, { mode: "stand", expr: "smile" }),
  syl_o_blink: C(SYL_O, { mode: "stand", expr: "smile", blink: 1 }),
  syl_o_sit: C(SYL_O, { mode: "sit", expr: "smile" }),
  syl_o_sit_blink: C(SYL_O, { mode: "sit", expr: "smile", blink: 1 }),
  syl_o_sit_look: C(SYL_O, { mode: "sit", expr: "neutral", look: 1 }),
  syl_o_shh: C(SYL_O, { mode: "stand", expr: "smile_closed", look: -1, headTilt: 6 }),
  syl_o_sit_paper: C(SYL_O, { mode: "sit", expr: "smile_closed", prop: "paper", wave: 0.4 }),
  boss: C(BOSS, { mode: "stand", expr: "neutral" }),
  boss_grin: C(BOSS, { mode: "stand", expr: "grin", prop: "paper", wave: 0.6 }),
  boss_sit: C(BOSS, { mode: "sit", expr: "stern", look: 1 }),
  boss_sit_grin: C(BOSS, { mode: "sit", expr: "grin", prop: "paper", wave: 0.6 }),
  husb: C(HUSB, { mode: "stand", expr: "neutral" }),
  husb_puzzled: C(HUSB, { mode: "stand", expr: "dazed", headTilt: 8 }),
  husb_blink: C(HUSB, { mode: "stand", expr: "neutral", blink: 1 }),
  niece: C(NIECE, { mode: "sit", expr: "neutral", prop: "paper", wave: 0.3 }),
  niece_shock: C(NIECE, { mode: "sit", expr: "shock", prop: "paper", wave: 0.8 }),
  niece_stand_shock: C(NIECE, { mode: "stand", expr: "shock" }),
  st1: C(ST("#2b3a6a", "#2a201a", "#c99067"), { mode: "stand", expr: "grin", prop: "paper", wave: 0.8 }),
  st2: C(ST("#6a2b3a", "#8a5a2a", "#ffe2c2", "#7a3a4a"), { mode: "stand", expr: "laugh", prop: "paper", wave: 1 }),
  st3: C(ST("#2b5a4a", "#1a1414", "#ecd0b6"), { mode: "stand", expr: "smile", prop: "paper", wave: 0.5 }),
  st4: C(ST("#4a3a6a", "#5a3b2a", "#f5c9a0", "#5a8fc2"), { mode: "stand", expr: "grin" }),
  rider1: C(RIDER("#5a6a3a", "cap", "#ecd0b6"), { mode: "sit", expr: "neutral", look: 1 }),
  rider2: C(RIDER("#8c3b4a", "tophat", "#f5c9a0"), { mode: "sit", expr: "neutral", look: -1 }),
  rider3: C(RIDER("#2f5f6a", "hair", "#c99067"), { mode: "stand", expr: "neutral", look: 0 }),
};

export const SecCard: React.FC = () => {
  const name = (getInputProps() as { card?: string }).card ?? "syl_y";
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, 1200, 2000); g.setTransform(2, 0, 0, 2, 0, 0);
    const [o, f] = CARDS[name];
    bodyFront(new Pen(g), o, f);
  }, [name]);
  return <AbsoluteFill style={{ background: "transparent" }}><canvas ref={ref} width={1200} height={2000} /></AbsoluteFill>;
};
