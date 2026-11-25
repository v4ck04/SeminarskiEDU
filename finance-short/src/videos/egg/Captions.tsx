// Word-group captions burned into the picture (1-3 words, key words in gold), timed to egg-short/voice/words.json.
// Same look as the net episode: Inter Display Black, white with a dark plum outline, a quick pop on each group.
import React from "react";
import { AbsoluteFill } from "remotion";
import WORDS from "./words.json";

type W = { w: string; s: number; e: number; line: string };
const GOLD = new Set(["hundred", "half", "stole", "golden", "egg", "eggs", "goose", "rich", "same", "two", "three", "jar", "third", "fifty", "few", "boats", "nets", "more", "inflation", "percent", "boat"]);
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, "");
const groups: { s: number; e: number; words: W[] }[] = (() => {
  const out: { s: number; e: number; words: W[] }[] = [];
  let g: W[] = [];
  const flush = () => { if (g.length) out.push({ s: g[0].s, e: g[g.length - 1].e, words: g }); g = []; };
  for (const w of WORDS as W[]) {
    if (g.length && (w.line !== g[g.length - 1].line || w.s - g[g.length - 1].e > 0.25)) flush();
    g.push(w);
    const txt = g.map((x) => x.w).join(" ");
    if (g.length === 3 || /[.,?!]$/.test(w.w) || txt.length > 15) flush();
  }
  flush();
  for (let i = 0; i + 1 < out.length; i++) if (out[i + 1].s - out[i].e < 0.5) out[i].e = out[i + 1].s;
  return out;
})();

export const Captions: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30, g = groups.find((x) => t >= x.s && t < x.e);
  if (!g) return null;
  const k = Math.min(1, (t - g.s) / 0.09), sc = 0.88 + 0.12 * k;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 560 }}>
      <div style={{ fontFamily: "'Inter Display', Inter, sans-serif", fontWeight: 900, fontSize: 92, lineHeight: 1.05, textAlign: "center", maxWidth: 940,
        color: "#ffffff", WebkitTextStroke: "16px #141016", paintOrder: "stroke fill", textShadow: "0 6px 0 rgba(0,0,0,0.45)", transform: `scale(${sc})`, letterSpacing: "0.01em" }}>
        {g.words.map((w, i) => (
          <span key={i} style={{ color: GOLD.has(norm(w.w)) ? "#ffc93c" : "#ffffff" }}>{w.w.toUpperCase()}{i < g.words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
