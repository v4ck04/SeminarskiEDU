// 03_flat_earth_bet set: downtown block (re-signed as 1870 England, no cars) + the flatearth kit (disc, newspaper, fen, letters, jail).
import React from 'react';
import * as THREE from 'three';
import {AbsoluteFill} from 'remotion';
import type {Tod} from '../../engine/look/look';
import {useMats} from '../../engine/kits/grocery/store';
import {Town, StreetClock} from '../../engine/kits/downtown/town';
import {UnitSign, signMat} from '../../engine/kits/piggly/props';
import {FlatDisc, Newspaper, Placard, Fen, Telescope, Letters, BigLetter, YearBoard, JailCell, FEN, JAIL} from '../../engine/kits/flatearth/props';
import {T} from '../../engine/core/clock';
import {SHOT_REAL, END_REAL} from './timeline';
import type {Stage} from './stage';
export const AUDIO: {voice: string | null; bed: string | null} = {voice: '03_flat_earth_bet/voice.wav', bed: null};
export const POPUPS: {t: number}[] = [{t: SHOT_REAL.canal + 0.2}];
export const SCOPE: [number, number] = [T('scope', 'middle') - 0.1, SHOT_REAL.win];
/** telescope view: black vignette with a round eyepiece + crosshair while the scope take runs */
export const HUD: React.FC<{t: number; width: number; height: number}> = ({t, width, height}) => {
  if (t < SCOPE[0] || t >= SCOPE[1]) return null; const r = width * 0.46, k = Math.min(1, (t - SCOPE[0]) / 0.15);
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: width / 2 - r, top: height * 0.42 - r, width: 2 * r, height: 2 * r, borderRadius: '50%', boxShadow: `0 0 0 ${height}px rgba(10,8,14,${0.97 * k})`, border: `${width * 0.018}px solid #241726`}} />
    <div style={{position: 'absolute', left: width / 2 - 1, top: height * 0.42 - r, width: 2, height: 2 * r, background: 'rgba(20,10,20,.45)'}} />
    <div style={{position: 'absolute', left: width / 2 - r, top: height * 0.42 - 1, width: 2 * r, height: 2, background: 'rgba(20,10,20,.45)'}} />
  </AbsoluteFill>;
};
void END_REAL;
export const useSetData = () => useMats();
export const WALLACE_DOOR: [number, number, number] = [-22.7, 1.1, 4.2];
type P = {d: ReturnType<typeof useMats>; f: number; st: Stage; cam: THREE.Vector3; vel: (THREE.Vector3 | null)[]; tod: Tod};
export const SetBefore: React.FC<P> = ({st, tod}) => (<>
  {st.loc === 'street' && <>
    <Town tod={tod} /><StreetClock hours={st.clock} />
    <UnitSign sign="BANK" mat={signMat('THE WEEKLY TIMES', '#241726', '#f2e3c0')} />
    <UnitSign sign="DRUG" mat={signMat('POST OFFICE', '#b2391f', '#fbf3e0')} />
    <UnitSign sign="SHOES" mat={signMat('THE RED LION', '#7a2a22', '#f2c23a')} />
    <UnitSign sign="CAFE" mat={signMat('TEA ROOM', '#2f6f73', '#fbf3e0')} />
    <UnitSign sign="FIVE" mat={signMat('No. 6  ·  A. R. WALLACE', '#3d4a66', '#f2e3c0')} />
    <UnitSign sign="BARBER" mat={signMat('BARBER', '#b2391f', '#fbf3e0')} />
    <UnitSign sign="BAKERY" mat={signMat('BAKER', '#8a3a5a', '#fbf3e0')} />
    {st.placard > 0 && <Placard p={[23.05, 1.4, 6.15]} k={st.placard} tilt={-0.08} lines={[['£500', 1.3, '#b2391f'], ['SAYS THE EARTH', 0.6], ['IS FLAT', 0.8]]} />}
    <FlatDisc p={[22.4, 2.55, 6.0]} s={0.75} k={st.disc} spin={st.discSpin} />
    {st.paper > 0 && <Newspaper p={[22.4, 1.3, 7.3]} k={st.paper} s={1.1} />}
    {st.letters >= 0 && <Letters from={[-29, 2.4, 7.5]} to={[WALLACE_DOOR[0], WALLACE_DOOR[1], WALLACE_DOOR[2] + 0.2]} t={st.letters} n={24} gap={0.22} pile={[-22.7, 0, 4.6]} />}
    {st.letter > 0 && <BigLetter p={[-22.35, 1.3, 5.75]} k={st.letter} s={0.85} />}
    {st.year > 1870 && <YearBoard p={[-21.5, 2.15, 4.3]} year={st.year} />}
  </>}
  {st.loc === 'fen' && <>
    <Fen marks={st.marks} line={st.line} lift={st.lift} />
    <Telescope p={[FEN[0] + 93.0, 0, -256.3]} ry={0} />
    {st.fraud > 0 && <Placard p={[88.25, 1.6, -255.9]} k={st.fraud} tilt={0.1} lines={[['FRAUD!', 1, '#b2391f']]} w={0.8} />}
  </>}
  {st.loc === 'jail' && <>
    <JailCell bars={st.bars} />
    <FlatDisc p={[JAIL[0] - 0.3, 1.95, JAIL[2] - 0.2]} s={0.32} k={st.jailDisc} spin={st.discSpin} />
  </>}
</>);
export const SetAfter: React.FC<P> = () => null;
