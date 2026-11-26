// Draws the character for one frame on a full-frame canvas, from the solved 3D skeleton (rig.ts).
// Every joint is projected through the real camera, so the 2D drawing lands exactly where the 3D body is: hands meet
// the coin, feet meet the floor. Shading follows the scene's sun: a cel shadow on the side away from the light, a thin
// rim highlight on the lit edge. The face and the clothes live on round forms (a sphere and a cylinder): when the body or
// head turns, eyes, mouth, tie and buttons slide toward the edge and narrow, as on a real round body.
import * as THREE from "three";
import { BODY, Pose } from "./rig";

export const LOOK = {
  ink: "#2b1e2f", skin: "#f1c6a1", skinShade: "#d89b78", skinLight: "#fff1e0",
  hair: "#4a2f22", hairLight: "#7a5238", shirt: "#f7f4ee", shirtShade: "#c9c3d6",
  vest: "#d9a23a", vestShade: "#a8742a", vestLight: "#ffd77a", tie: "#9b2335", trousers: "#3d4255", trousersShade: "#2a2d3d",
  shoe: "#5a3324", mouth: "#5a1e28", tongue: "#e2707a", white: "#ffffff",
};

type P2 = [number, number];
export type Ctx = { cam: THREE.PerspectiveCamera; W: number; H: number; sun: THREE.Vector3; shadowCol?: number };

const tmp = new THREE.Vector3();
export const makeProjector = (c: Ctx) => {
  const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
  c.cam.updateMatrixWorld(); c.cam.matrixWorld.extractBasis(right, up, fwd); fwd.negate();
  const P = (p: THREE.Vector3): P2 => { tmp.copy(p).project(c.cam); return [(tmp.x * 0.5 + 0.5) * c.W, (-tmp.y * 0.5 + 0.5) * c.H]; };
  /** pixels per metre at a world point */
  const S = (p: THREE.Vector3) => { const a = P(p), b = P(tmp.copy(p).addScaledVector(right, 1)); return Math.hypot(b[0] - a[0], b[1] - a[1]); };
  const depth = (p: THREE.Vector3) => tmp.copy(p).sub(c.cam.position).dot(fwd);
  // light direction on screen (canvas y down), and how much it comes from the camera side
  const L = c.sun.clone().normalize();
  const la = Math.atan2(-L.dot(up), L.dot(right));
  return { P, S, depth, right, up, fwd, lightAng: la, lightFront: L.dot(fwd.clone().negate()) };
};

const stroke = (g: CanvasRenderingContext2D, pts: P2[], w: number, col: string, ink: number) => {
  g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.strokeStyle = LOOK.ink; g.lineWidth = w + 2 * ink; g.stroke();
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.strokeStyle = col; g.lineWidth = w; g.stroke();
};
const ellipse = (g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, fill: string | null, ink = 0) => {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.strokeStyle = LOOK.ink; g.lineWidth = ink; g.stroke(); }
};

export const drawCharacter = (g: CanvasRenderingContext2D, pose: Pose, c: Ctx) => {
  const pr = makeProjector(c);
  const { P, S } = pr;
  g.clearRect(0, 0, c.W, c.H);
  const headPx = S(pose.head) * BODY.headR;
  const ink = Math.max(1.5, headPx * 0.075);
  const toCam = c.cam.position.clone().sub(pose.chest).setY(0).normalize();
  const fw = new THREE.Vector3(Math.sin(pose.yaw), 0, Math.cos(pose.yaw));
  const lf = new THREE.Vector3(Math.cos(pose.yaw), 0, -Math.sin(pose.yaw));
  const la = pr.lightAng, lx = Math.cos(la), ly = Math.sin(la);

  // which side is far from the camera
  const leftFar = pr.depth(pose.shL) > pr.depth(pose.shR);
  const limb = (side: "L" | "R", part: "arm" | "leg") => {
    if (part === "leg") {
      const [h, k, f] = side === "L" ? [pose.hipL, pose.kneeL, pose.footL] : [pose.hipR, pose.kneeR, pose.footR];
      const ank = f.clone().setY(f.y + 0.06);
      const w = S(k) * 0.075;
      stroke(g, [P(h), P(k), P(ank)], w, LOOK.trousers, ink);
      // shoe: along the foot's heading, toe forward
      const toe = ank.clone().addScaledVector(fw, 0.13).setY(f.y + 0.035), heel = ank.clone().addScaledVector(fw, -0.04).setY(f.y + 0.035);
      const a = P(heel), b = P(toe), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
      const len = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), S(f) * 0.08);
      ellipse(g, cx, cy, len / 2 + S(f) * 0.03, S(f) * 0.045, Math.atan2(b[1] - a[1], b[0] - a[0]), LOOK.shoe, ink);
      ellipse(g, cx - lx * 2, cy - Math.abs(ly) * S(f) * 0.015, len * 0.25, S(f) * 0.012, Math.atan2(b[1] - a[1], b[0] - a[0]), "rgba(255,255,255,0.25)");
    } else {
      const [s, e, h] = side === "L" ? [pose.shL, pose.elL, pose.handL] : [pose.shR, pose.elR, pose.handR];
      const w = S(e) * 0.062;
      stroke(g, [P(s), P(e), P(h)], w, LOOK.shirt, ink);
      // sleeve shade line on the side away from the light
      const hp = P(h);
      ellipse(g, hp[0], hp[1], S(h) * 0.05, S(h) * 0.05, 0, LOOK.skin, ink);
      ellipse(g, hp[0] - lx * S(h) * 0.015, hp[1] - ly * S(h) * 0.015, S(h) * 0.025, S(h) * 0.02, 0, "rgba(255,241,224,0.7)");
    }
  };

  // ---- far limbs first
  limb(leftFar ? "L" : "R", "arm");
  limb(leftFar ? "L" : "R", "leg");
  limb(leftFar ? "R" : "L", "leg");

  // ---- torso: a bean between pelvis and shoulders, wrapped in a vest over a white shirt
  const bot = P(pose.pelvis.clone().add(new THREE.Vector3(0, -0.06, 0)));
  const topW = pose.chest.clone().add(new THREE.Vector3(0, 0.05, 0));
  const top = P(topW);
  const ax = top[0] - bot[0], ay = top[1] - bot[1], alen = Math.hypot(ax, ay) || 1;
  const ux = ax / alen, uy = ay / alen;           // along the body (toward the head)
  const vx = -uy, vy = ux;                          // across
  const rpx = S(pose.chest) * BODY.torsoR;
  const cx = (top[0] + bot[0]) / 2, cy = (top[1] + bot[1]) / 2;
  const half = alen / 2 + rpx * 0.25;
  const bean: P2[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * Math.PI * 2, s = Math.sin(t), co = Math.cos(t);
    const along = s * half, across = co * rpx * (1 + 0.14 * (-s));   // wider at the bottom
    bean.push([cx + ux * along + vx * across, cy + uy * along + vy * across]);
  }
  const path = (pts: P2[]) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  path(bean); g.fillStyle = LOOK.vest; g.fill();
  g.save(); path(bean); g.clip();
  // cel shade: everything away from the light darker, a soft sheen on the lit edge
  g.fillStyle = LOOK.vestShade;
  g.beginPath(); g.ellipse(cx - lx * rpx * 1.25, cy - ly * rpx * 1.25, rpx * 1.35, half * 1.4, Math.atan2(uy, ux) + Math.PI / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(255,226,140,0.75)"; g.lineWidth = rpx * 0.07;
  g.beginPath(); g.ellipse(cx + lx * rpx * 0.18, cy + ly * rpx * 0.18, rpx * 0.9, half * 0.92, Math.atan2(uy, ux) + Math.PI / 2, la - 0.7, la + 0.7); g.stroke();
  // features on the round body: angle theta around the body from the front
  const feat = (theta: number) => {
    const d = fw.clone().multiplyScalar(Math.cos(theta)).addScaledVector(lf, Math.sin(theta));
    const off = d.dot(pr.right);           // -1..1 across the body on screen
    const vis = d.dot(toCam);              // > 0 faces the camera
    return { off, vis };
  };
  const at = (off: number, along: number): P2 => [cx + vx * off * rpx + ux * along * half, cy + vy * off * rpx + uy * along * half];
  const front = feat(0);
  if (front.vis > 0.05) {
    const sq = Math.max(0.15, front.vis);
    // shirt V at the neck
    const n0 = at(front.off - 0.32 * sq, 0.98), n1 = at(front.off + 0.32 * sq, 0.98), n2 = at(front.off, 0.45);
    g.fillStyle = LOOK.shirt; g.beginPath(); g.moveTo(...n0); g.lineTo(...n1); g.lineTo(...n2); g.closePath(); g.fill();
    g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.6; g.stroke();
    // tie
    const tw = 0.075 * sq;
    const t0 = at(front.off - tw, 0.9), t1 = at(front.off + tw, 0.9), t2 = at(front.off + tw * 1.3, 0.25), t3 = at(front.off, 0.12), t4 = at(front.off - tw * 1.3, 0.25);
    g.fillStyle = LOOK.tie; g.beginPath(); [t0, t1, t2, t3, t4].forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.fill();
    g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.5; g.stroke();
    // vest buttons, a little off the middle
    const b = feat(0.22);
    if (b.vis > 0.05) for (const along of [0.05, -0.25, -0.55]) { const p = at(b.off, along); ellipse(g, p[0], p[1], rpx * 0.045 * Math.max(0.4, b.vis), rpx * 0.045, 0, "#6b4a1c", ink * 0.35); }
    // pocket welts left and right
    for (const th of [-0.75, 0.75]) {
      const k = feat(th);
      if (k.vis > 0.05) { const a = at(k.off - 0.1 * k.vis, -0.45), z = at(k.off + 0.1 * k.vis, -0.45); g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.5; g.beginPath(); g.moveTo(...a); g.lineTo(...z); g.stroke(); }
    }
  } else {
    // back: a centre seam
    const k = feat(Math.PI);
    const a = at(k.off, 0.85), z = at(k.off, -0.85); g.strokeStyle = "rgba(43,30,47,0.5)"; g.lineWidth = ink * 0.5; g.beginPath(); g.moveTo(...a); g.lineTo(...z); g.stroke();
  }
  // fabric folds near the waist
  g.strokeStyle = "rgba(43,30,47,0.35)"; g.lineWidth = ink * 0.45;
  for (const s of [-1, 1]) { const a = at(s * 0.75, -0.62), m = at(s * 0.55, -0.7), z = at(s * 0.4, -0.66); g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(...m, ...z); g.stroke(); }
  g.restore();
  path(bean); g.strokeStyle = LOOK.ink; g.lineWidth = ink; g.lineJoin = "round"; g.stroke();

  // ---- head
  drawHead(g, pose, pr, headPx, ink, toCam);

  // ---- near limbs last
  limb(leftFar ? "R" : "L", "arm");
};

const drawHead = (g: CanvasRenderingContext2D, pose: Pose, pr: ReturnType<typeof makeProjector>, R: number, ink: number, toCam: THREE.Vector3) => {
  const [hx, hy] = pr.P(pose.head);
  const la = pr.lightAng, lx = Math.cos(la), ly = Math.sin(la);
  const hyaw = pose.yaw + pose.headYaw;
  const hf = new THREE.Vector3(Math.sin(hyaw), 0, Math.cos(hyaw));
  const hl = new THREE.Vector3(Math.cos(hyaw), 0, -Math.sin(hyaw));
  const up = new THREE.Vector3(0, 1, 0);
  const pitch = pose.headPitch; // + looks down
  const camToHead = pr.fwd;
  /** a point on the head sphere: theta around (+ toward the character's left), phi up; returns screen offset and facing */
  const sph = (theta: number, phi: number, r = 1) => {
    const ph = phi - pitch;
    const d = hf.clone().multiplyScalar(Math.cos(theta) * Math.cos(ph)).addScaledVector(hl, Math.sin(theta) * Math.cos(ph)).addScaledVector(up, Math.sin(ph));
    const vis = -d.dot(camToHead);
    return { x: d.dot(pr.right) * R * r, y: -d.dot(pr.up) * R * r, vis };
  };
  g.save();
  g.translate(hx, hy);
  g.rotate(-pose.headRoll);
  // ears (behind the head)
  for (const s of [-1, 1]) {
    const e = sph(s * 1.55, 0.02, 1.0);
    if (e.vis > -0.35) { ellipse(g, e.x, e.y, R * 0.17, R * 0.2, 0, LOOK.skin, ink); ellipse(g, e.x, e.y, R * 0.07, R * 0.1, 0, LOOK.skinShade); }
  }
  // skull with cel shade + rim light
  ellipse(g, 0, 0, R, R, 0, LOOK.skin);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.clip();
  g.fillStyle = LOOK.skinShade; g.fillRect(-R, -R, 2 * R, 2 * R);
  ellipse(g, lx * R * 0.3, ly * R * 0.3, R * 1.02, R * 1.02, 0, LOOK.skin);
  // hair: the scalp above a hairline that runs low at the back and up at the forehead
  const ring: P2[] = [];
  // walk the hairline starting from the point facing away from the camera, so the visible part is one unbroken run
  let thC = 0, best = -2;
  for (let i = 0; i < 36; i++) { const th = (i / 36) * Math.PI * 2; const v0 = sph(th, 0).vis; if (v0 > best) { best = v0; thC = th; } }
  for (let i = 0; i <= 48; i++) {
    const th = thC - Math.PI + (i / 48) * Math.PI * 2;
    const tw = Math.atan2(Math.sin(th), Math.cos(th));
    const phi = 0.5 - 0.62 * (1 - Math.cos(tw)) / 2 + 0.1 * Math.cos(tw * 3) * (Math.abs(tw) < 0.8 ? 1 : 0);
    const p = sph(th, phi);
    if (p.vis > -0.05) ring.push([p.x, p.y]);
  }
  if (ring.length > 2) {
    g.fillStyle = LOOK.hair; g.beginPath();
    ring.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    const last = ring[ring.length - 1], first = ring[0];
    g.lineTo(last[0], -R * 3); g.lineTo(first[0], -R * 3); g.closePath(); g.fill();
    // light on the hair
    g.strokeStyle = LOOK.hairLight; g.lineWidth = R * 0.07;
    g.beginPath(); g.arc(lx * R * 0.08, ly * R * 0.08 - R * 0.05, R * 0.82, la - 0.6, la + 0.6); g.stroke();
  }
  g.restore();
  // rim highlight on the lit edge, ink outline
  g.strokeStyle = LOOK.skinLight; g.lineWidth = R * 0.06; g.lineCap = "round";
  g.beginPath(); g.arc(0, 0, R * 0.9, la - 0.55, la + 0.55); g.stroke();
  ellipse(g, 0, 0, R, R, 0, null, ink);
  // cowlick
  const tuft = sph(0.4, 1.2);
  if (tuft.vis > -0.6) { g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.8; g.beginPath(); g.moveTo(tuft.x, tuft.y - R * 0.95 * 0); g.quadraticCurveTo(tuft.x + R * 0.18, tuft.y - R * 0.35, tuft.x + R * 0.05, tuft.y - R * 0.42); g.stroke(); }

  // face
  const ex = pose.expr;
  const eyeTheta = 0.36, eyePhi = 0.06;
  for (const s of [-1, 1]) {
    const e = sph(s * eyeTheta, eyePhi);
    if (e.vis < 0.08) continue;
    const sq = Math.min(1, e.vis * 1.2);
    if (ex.blink > 0.5) {
      g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.8; g.beginPath(); g.ellipse(e.x, e.y, R * 0.09 * sq, R * 0.04, 0, 0.1, Math.PI - 0.1); g.stroke();
    } else if (ex.eyeWide > 0.5) {
      ellipse(g, e.x, e.y, R * 0.13 * sq, R * 0.17 * (1 - ex.blink * 0.6), 0, LOOK.white, ink * 0.75);
      ellipse(g, e.x + R * 0.02 * s * 0, e.y + R * 0.01, R * 0.055 * sq, R * 0.06, 0, LOOK.ink);
      ellipse(g, e.x - R * 0.02, e.y - R * 0.025, R * 0.018, R * 0.018, 0, LOOK.white);
    } else {
      ellipse(g, e.x, e.y, R * 0.065 * sq, R * 0.1 * (1 - ex.blink * 0.7), 0, LOOK.ink);
      ellipse(g, e.x - R * 0.018, e.y - R * 0.03, R * 0.016, R * 0.016, 0, LOOK.white);
    }
    // brow: raised and tilted (inner end up = worried, down = cross)
    const bIn = sph(s * 0.16, 0.3 + ex.browUp * 0.1 + ex.browTilt * 0.06), bOut = sph(s * 0.52, 0.27 + ex.browUp * 0.08 - ex.browTilt * 0.02);
    if (bIn.vis > 0.05 && bOut.vis > -0.1) { g.strokeStyle = LOOK.hair; g.lineWidth = R * 0.055; g.lineCap = "round"; g.beginPath(); g.moveTo(bIn.x, bIn.y); g.lineTo(bOut.x, bOut.y); g.stroke(); }
  }
  // nose: a small arc toward the side away from the light
  const n = sph(0, -0.1);
  if (n.vis > 0.1) { g.strokeStyle = "rgba(160,90,60,0.8)"; g.lineWidth = ink * 0.5; g.beginPath(); g.arc(n.x, n.y, R * 0.05, Math.PI * 0.2, Math.PI * 0.9); g.stroke(); }
  // mouth: a curve that can open; corners on the sphere
  const mL = sph(-0.24, -0.3), mR = sph(0.24, -0.3), mC = sph(0, -0.33);
  if (mC.vis > 0.08) {
    const curve = ex.mouthCurve * R * 0.12, open = ex.mouthOpen * R * 0.24;
    if (open > R * 0.03) {
      g.fillStyle = LOOK.mouth; g.beginPath();
      g.moveTo(mL.x, mL.y); g.quadraticCurveTo(mC.x, mC.y + curve * 0.4 - open * 0.15, mR.x, mR.y);
      g.quadraticCurveTo(mC.x, mC.y + curve + open * 1.6, mL.x, mL.y); g.closePath(); g.fill();
      g.save(); g.clip(); ellipse(g, mC.x, mC.y + curve + open * 1.2, R * 0.12, R * 0.08, 0, LOOK.tongue); g.restore();
      g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.7; g.beginPath();
      g.moveTo(mL.x, mL.y); g.quadraticCurveTo(mC.x, mC.y + curve * 0.4 - open * 0.15, mR.x, mR.y);
      g.quadraticCurveTo(mC.x, mC.y + curve + open * 1.6, mL.x, mL.y); g.closePath(); g.stroke();
    } else {
      g.strokeStyle = LOOK.ink; g.lineWidth = ink * 0.75; g.lineCap = "round"; g.beginPath(); g.moveTo(mL.x, mL.y); g.quadraticCurveTo(mC.x, mC.y + curve * 2, mR.x, mR.y); g.stroke();
    }
  }
  // cheeks when smiling
  if (ex.mouthCurve > 0.4) for (const s of [-1, 1]) { const ch = sph(s * 0.55, -0.18); if (ch.vis > 0.1) ellipse(g, ch.x, ch.y, R * 0.09, R * 0.05, 0, `rgba(230,110,110,${0.35 * ex.mouthCurve})`); }
  g.restore();
};
