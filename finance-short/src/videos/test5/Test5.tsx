// 5-second quality test (vertical 1080x1920): a new character walks into a sunlit office, crouches, picks a gold coin
// off the floor, gets surprised (brows first, then the mouth, eye change hidden in a blink, a little head bounce),
// turns to the camera and smiles. The character is drawn fresh every frame from a 3D skeleton (rig.ts + draw.ts) onto
// a camera-facing plane that sits at the character's depth, so the 3D room can pass in front of and behind it; a
// second, invisible copy turned toward the sun casts the character's real shadow on the floor.
import React, { useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { buildRoom } from "./env";
import { poseAt, camAt, TOTAL } from "./rig";
import { drawCharacter } from "./draw";

export const TEST5_FRAMES = TOTAL;
const W = 1080, H = 1920;

const Inner: React.FC<{ f: number }> = ({ f }) => {
  const { camera, scene, gl } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const world = useMemo(() => {
    const room = buildRoom();
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    // the visible character: lit by the scene (and its shadows), with some of its own colour so faces never go muddy
    const mat = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0.55, 0.55, 0.55), alphaTest: 0.5, side: THREE.DoubleSide });
    const char = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    char.receiveShadow = true; char.castShadow = false; char.renderOrder = 2;
    // the shadow caster: same drawing, turned toward the sun, invisible to the camera
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    const ghostMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ghostMat); ghost.customDepthMaterial = depthMat; ghost.castShadow = true;
    const ghostRoot = new THREE.Group(); ghostRoot.add(ghost);
    const root = new THREE.Group(); root.add(room.root, char, ghostRoot);
    // renderer + image-based light for reflections on metal (set before the first frame is drawn)
    gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05;
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.6;
    scene.background = new THREE.Color("#1d1a22");
    return { room, canvas, ctx, tex, char, ghost, ghostRoot, root };
  }, [gl, scene]);

  // ---- per frame
  const c = camAt(f);
  cam.fov = 50; cam.near = 0.05; cam.far = 60; cam.position.copy(c.pos); cam.lookAt(c.look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const pose = poseAt(f);
  const sunDir = world.room.sun.position.clone().sub(world.room.sun.target.position).normalize();
  drawCharacter(world.ctx, pose, { cam, W, H, sun: sunDir });
  world.tex.needsUpdate = true;
  // the camera-facing slice of the frustum just in front of the character's nearest body point
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const dep = (p: THREE.Vector3) => p.clone().sub(cam.position).dot(fwd);
  const d = Math.max(0.3, Math.min(dep(pose.pelvis), dep(pose.footL), dep(pose.footR), dep(pose.chest), dep(pose.head)) - 0.12);
  const hh = 2 * d * Math.tan((cam.fov * Math.PI) / 360), ww = hh * (W / H);
  const C = cam.position.clone().addScaledVector(fwd, d);
  world.char.position.copy(C); world.char.quaternion.copy(cam.quaternion); world.char.scale.set(ww, hh, 1);
  // shadow caster: pivot the same slice about the pelvis so it faces the sun
  const ray = pose.pelvis.clone().sub(cam.position);
  const Rp = cam.position.clone().addScaledVector(ray, d / ray.dot(fwd));
  const toCam = cam.position.clone().sub(Rp).setY(0).normalize(), toSun = sunDir.clone().setY(0).normalize();
  const ang = Math.atan2(toCam.z * toSun.x - toCam.x * toSun.z, toCam.dot(toSun));
  const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang);
  world.ghostRoot.position.copy(Rp); world.ghostRoot.quaternion.copy(qY).multiply(cam.quaternion);
  const local = C.clone().sub(Rp).applyQuaternion(cam.quaternion.clone().invert());
  world.ghost.position.set(local.x, local.y, 0); world.ghost.scale.set(ww, hh, 1);
  // the coin: flat on the floor, then in the hand facing the camera and slowly turning to catch the sun
  const coin = world.room.coin;
  coin.position.copy(pose.coin!);
  if (pose.coinInHand) {
    const toC = cam.position.clone().sub(coin.position).normalize();
    coin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toC);
    coin.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), 0.35 * Math.sin(f * 0.12));
  }
  else coin.rotation.set(0, 0.4, 0);
  return <primitive object={world.root} dispose={null} />;
};

export const Test5: React.FC<{ at?: number[] }> = ({ at }) => {
  const k = useCurrentFrame(), f = at ? at[Math.min(k, at.length - 1)] : k;
  const mute = (getInputProps() as { mute?: boolean }).mute;
  return (
    <AbsoluteFill style={{ background: "#1d1a22" }}>
      <ThreeCanvas width={W} height={H} shadows gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 50, near: 0.05, far: 60 }}>
        <Inner f={f} />
      </ThreeCanvas>
      {!at && !mute && <Audio src={staticFile("test5/mix.wav")} />}
    </AbsoluteFill>
  );
};
