// ENGINE tool: print the camera (position, aim anchor, key) for some real frames.  VIDEO=<id> npx tsx --tsconfig src/videos/<id>/tsconfig.json src/engine/tools/camdbg.ts 480 490
import {camAt} from '../camera/camera';
for (const a of process.argv.slice(2)) { const fr = +a, c = camAt(fr / 30);
  console.log(fr, c.key, 'cam', c.p.toArray().map((v) => v.toFixed(2)).join(','), 'anchor', c.anchor.toArray().map((v) => v.toFixed(2)).join(','), 'fov', c.fov.toFixed(1)); }
