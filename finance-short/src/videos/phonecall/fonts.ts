// Loads the "Inter Display" weights the film uses from public/fonts, so a render on any machine looks the same
// (the cloud machine has it installed system-wide; a local machine may not). Text drawn into canvases (3D boards,
// badges) must wait for this, so the 3D view mounts only once useFontsReady() is true.
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

const FILES: [string, string][] = [["700", "InterDisplay-Bold.otf"], ["800", "InterDisplay-ExtraBold.otf"], ["900", "InterDisplay-Black.otf"]];
let ready: Promise<void> | null = null;
export const loadFonts = (): Promise<void> => {
  if (ready) return ready;
  if (typeof document === "undefined") return (ready = Promise.resolve());
  const h = delayRender("Inter Display");
  const set = document.fonts as unknown as { add: (f: FontFace) => void };
  ready = Promise.all(FILES.map(([w, f]) => new FontFace("Inter Display", `url(${staticFile(`fonts/${f}`)})`, { weight: w }).load().then((ff) => set.add(ff))))
    .then(() => continueRender(h))
    .catch((e) => { console.error("font load failed", e); continueRender(h); });
  return ready;
};
export const useFontsReady = () => {
  const [ok, setOk] = useState(false);
  useEffect(() => { loadFonts().then(() => setOk(true)); }, []);
  return ok;
};
