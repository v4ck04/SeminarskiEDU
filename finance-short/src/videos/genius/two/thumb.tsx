// YouTube thumbnail for "4 Geniuses Who Lost a Fortune" (render as a still, 1920x1080 or scale 0.6667 for 1280x720).
import React from "react";
import { AbsoluteFill } from "remotion";
import { Char, T, INK, GOLD, RED, TEAL } from "./kit";
import { NEWTON, TWAIN_O, FISHER_O } from "../toon";

export const GeniusThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(90% 90% at 30% 45%, #1b3a6b 0%, #0B1E3A 60%, #071325 100%)", overflow: "hidden" }}>
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <polyline points="620,330 800,250 940,300 1080,190 1220,260 1380,560 1500,520 1700,900" fill="none" stroke={INK} strokeWidth={54} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points="620,330 800,250 940,300 1080,190 1220,260" fill="none" stroke="#34B36A" strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points="1220,260 1380,560 1500,520 1700,900" fill="none" stroke={RED} strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M1640 1010 L1790 930 L1650 830 Z" fill={RED} stroke={INK} strokeWidth={16} strokeLinejoin="round" transform="rotate(8 1700 930)" />
    </svg>
    <div style={{ position: "absolute", left: 60, top: 170, width: 900, height: 1000, background: "radial-gradient(closest-side, rgba(255,255,255,0.22), rgba(255,255,255,0))" }} />
    <Char o={TWAIN_O} ok="twain" id={8} x={690} y={1210} h={860} f={40} expr="pained" still />
    <Char o={FISHER_O} ok="fisher" id={9} x={130} y={1230} h={840} f={40} expr="shock" still />
    <Char o={NEWTON} ok="newton" id={7} x={410} y={1500} h={1500} f={40} expr="shock" still />
    <T x={1360} y={640} size={230} color="#fff" ls={-6} stroke={INK} sw={26}>GENIUS</T>
    <T x={1360} y={850} size={168} color={GOLD} ls={-3} stroke={INK} sw={24} rot={-3}>STILL LOST</T>
  </AbsoluteFill>
);
