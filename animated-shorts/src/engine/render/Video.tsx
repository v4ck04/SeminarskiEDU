// BASIC render composition for the free kit: simple light rig + characters + set + captions.
// (The premium version adds ink outlines, grading, AO, bloom, depth of field — not included.)
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {LOOK_LIGHT, LOOK_SKY} from '../look/look';
import {TOTAL, warp} from '../core/clock';
import {stage, velocities} from '../core/staging';
import {camAt, applyCam, flashAt, Cam} from '../camera/camera';
import {Character} from '../chars/rig';
import {WORDS, CAPS} from '@story/timeline';
import {AUDIO, SetBefore, SetAfter, useSetData} from '@story/set';
export {TOTAL};

const Rig: React.FC<{c: Cam}> = ({c}) => { const {camera} = useThree(); camera.layers.enableAll(); applyCam(camera as THREE.PerspectiveCamera, c); return null; };   // characters live on a separate layer (NOINK)

/** one warm key sun (casts shadows) + cool sky fill + a little ambient — see references/07_BASIC_LIGHT.md */
const Lights: React.FC<{at: THREE.Vector3}> = ({at}) => {
  const L = LOOK_LIGHT, target = React.useMemo(() => new THREE.Object3D(), []);
  target.position.set(at.x, 0, at.z);
  return (<>
    <primitive object={target} />
    <ambientLight intensity={L.ambI} color={L.amb} />
    <hemisphereLight args={[L.skyFill, L.groundFill, L.hemiI]} />
    <directionalLight position={[at.x + L.sunOff[0], L.sunOff[1], at.z + L.sunOff[2]]} target={target} intensity={L.sunI} color={L.sun} castShadow
      shadow-mapSize={[2048, 2048]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-bias={-0.0004} />
  </>);
};

/** captions: 1-3 words, white heavy + black outline, centred at 70 % height */
const Caption: React.FC<{f: number; width: number; height: number}> = ({f, width, height}) => {
  const t = f / 30; let ci = -1;
  for (let i = 0; i < CAPS.length; i++) if (WORDS[CAPS[i][0]][1] <= t) ci = i;
  if (ci < 0) return null;
  const [a, b] = CAPS[ci], end = WORDS[b][2] + 0.6, next = CAPS[ci + 1] ? WORDS[CAPS[ci + 1][0]][1] : 1e9;
  if (t > Math.min(end, next)) return null;
  const txt = WORDS.slice(a, b + 1).map((w) => w[0]).join(' ').toLowerCase(), k = width / 1080;
  return <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.7, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: 'Impact, "Arial Black", sans-serif',
    fontSize: 74 * k, color: '#fff', WebkitTextStroke: `${11 * k}px #000`, paintOrder: 'stroke fill', padding: `0 ${50 * k}px`}}>{txt}</div>;
};

export const Video: React.FC = () => {
  const fr = useCurrentFrame(), {width, height} = useVideoConfig(), rt = fr / 30, f = warp(rt) * 30;
  const d = useSetData(), st = stage(f), cc = camAt(rt), cam = cc.p, vel = velocities(f, st), fl = flashAt(rt);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {AUDIO.voice && <Audio src={staticFile(AUDIO.voice)} />}
      {AUDIO.bed && <Audio src={staticFile(AUDIO.bed)} />}
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 38, near: 0.05, far: 450}}>
        <color attach="background" args={[LOOK_SKY.day.cap]} />
        <Rig c={cc} />
        <Lights at={cc.anchor} />
        <SetBefore d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
        {st.people.map((p, i) => <Character key={i} c={p} f={f} cam={cam} vel={vel[i]} />)}
        <SetAfter d={d} f={f} st={st} cam={cam} vel={vel} tod="day" />
      </ThreeCanvas>
      {fl > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: fl}} />}
      <Caption f={fr} width={width} height={height} />
    </AbsoluteFill>
  );
};
