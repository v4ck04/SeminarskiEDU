// 02_piggly_wiggly set: the grocery kit + downtown block + the piggly kit (counter, turnstile, signs, palace, stock board, museum).
import React from 'react';
import * as THREE from 'three';
import type {Tod} from '../../engine/look/look';
import {useMats, Set, type Mats} from '../../engine/kits/grocery/store';
import {Town, StreetClock} from '../../engine/kits/downtown/town';
import {Car} from '../../engine/kits/downtown/street';
import {ServiceCounter, Turnstile, UnitSign, PWStoreSign, Palace, StockBoard, Ropes, Plaque, BasketStack, signMat, pwSmall} from '../../engine/kits/piggly/props';
import type {Stage} from './stage';
export const AUDIO: {voice: string | null; bed: string | null} = {voice: '02_piggly_wiggly/voice.wav', bed: null};
/** like + subscribe reminder during the growth montage (engine/render/SubscribePopup.tsx) */
export const POPUPS: {t: number}[] = [{t: 32.35}];
/** optional 2D overlay drawn over the 3D (under the captions) */
export const HUD: React.FC<{t: number; width: number; height: number}> | null = null;
export const useSetData = () => useMats();
export const TURNSTILE: [number, number, number] = [-0.3, 0, 3.4];
export const ROPE_POSTS: [number, number, number][] = [[-3.3, 0, 2.1], [-1.9, 0, 2.1], [-0.5, 0, 2.1], [0.9, 0, 2.1], [2.3, 0, 2.1], [3.6, 0, 2.1]];
type P = {d: Mats; f: number; st: Stage; cam: THREE.Vector3; vel: (THREE.Vector3 | null)[]; tod: Tod};
export const SetBefore: React.FC<P> = ({d, f, st, tod}) => (<>
  <Town tod={tod} />
  {st.loc !== 'palace' && <><Set m={d} f={f} /><StreetClock hours={st.clock} /><PWStoreSign /></>}
  {st.cars.map((c, i) => <Car key={i} c={c} />)}
  {st.loc === 'street' && st.rivals && <>
    <UnitSign sign="BAKERY" mat={signMat('GROCERIES', '#2e5a4a', '#f6e7b4')} />
    <UnitSign sign="HATS" mat={signMat('MEATS & GROCERIES', '#7a3b22', '#f6e7b4')} /></>}
  {st.loc === 'street' && st.exchange && <UnitSign sign="BANK" mat={signMat('STOCK EXCHANGE', '#241726', '#e9b64a')} />}
  {Object.entries(st.signs).map(([n, k]) => <UnitSign key={n} sign={n} mat={pwSmall()} k={k} dz={0.1} />)}
  {st.counters.map((c, i) => <ServiceCounter key={i} c={c} />)}
  {st.loc === 'store' && st.turnstile && <><Turnstile p={TURNSTILE} spin={st.spin} /><BasketStack p={[1.55, 0, 3.6]} /></>}
  {st.board && <StockBoard p={[22.4, 0, 6.6]} prog={st.board.prog} stamp={st.board.stamp} />}
  {st.loc === 'palace' && <Palace state={st.palace} sold={st.sold} />}
  {st.ropes && <><Ropes posts={ROPE_POSTS} /><Plaque p={[1.6, 0, 2.55]} /></>}
</>);
export const SetAfter: React.FC<P> = () => null;
