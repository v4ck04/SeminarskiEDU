// Screen-space ambient occlusion (the "real 3D" look: dark corners, contact shade under desks, crates, feet, where
// walls meet floors). One full-screen pass on the composer's depth texture, run FIRST on the linear HDR scene so ink,
// DOF, bloom, tone map and grade all sit on top of it.
// View-space position is rebuilt from depth; the normal from the cross product of neighbouring positions. Samples are
// a golden-angle spiral in a disk of `radius` metres projected to the screen, rotated per pixel (interleaved gradient
// noise); one pass, no extra targets (the lens blur and grade later soften the residual noise).
// (n8ao's N8AOPostPass was tried first and returned no occlusion under software WebGL, so this is our own pass.)
// The sky (depth 1) is skipped. All sizes are in metres, so the look is identical at --scale 0.5, 1 and 1.333.
import * as THREE from "three";
import { Pass } from "postprocessing";

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }`;
const FRAG = /* glsl */ `
#include <packing>
varying vec2 vUv;
uniform sampler2D tDiffuse, tDepth;
uniform mat4 projInv, proj;
uniform vec2 texel;
uniform float cNear, cFar, radius, intensity, bias, maxScreen;
uniform vec3 aoCol;
uniform int debug;
#define N 20
vec3 viewPos( vec2 uv ) {
  float d = texture2D( tDepth, uv ).r;
  vec4 p = projInv * vec4( uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0 );
  return p.xyz / p.w;
}
float ao( vec2 uv, vec3 P, vec3 n ) {
  float a = 6.2831853 * fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  // disk radius on screen (uv units) for radius metres at this depth, capped so close-ups stay cheap and local
  float rs = min( radius * proj[1][1] / max( -P.z, 0.1 ) * 0.5, maxScreen );
  float occ = 0.0;
  for ( int i = 0; i < N; i++ ) {
    float fi = float( i ) + 0.5;
    float r = sqrt( fi / float( N ) );
    float t = a + fi * 2.39996323;
    vec2 o = vec2( cos( t ), sin( t ) ) * r * rs;
    o.x *= texel.y / texel.x;                                  // aspect: keep the disk round on screen
    vec2 su = uv + o;
    if ( su.x < 0.0 || su.x > 1.0 || su.y < 0.0 || su.y > 1.0 ) continue;
    vec3 S = viewPos( su );
    vec3 v = S - P;
    float l = length( v );
    float k = max( dot( n, v / max( l, 1e-4 ) ) - bias, 0.0 );
    occ += k * smoothstep( radius * 1.6, radius * 0.4, l );    // only nearby geometry occludes (no halos from far walls)
  }
  return occ / float( N );
}
void main() {
  vec4 col = texture2D( tDiffuse, vUv );
  float d = texture2D( tDepth, vUv ).r;
  if ( d >= 0.99999 ) { gl_FragColor = debug == 1 ? vec4( 1.0 ) : col; return; }
  vec3 P = viewPos( vUv );
  vec3 px = viewPos( vUv + vec2( texel.x, 0.0 ) ) - P, py = viewPos( vUv + vec2( 0.0, texel.y ) ) - P;
  vec3 qx = P - viewPos( vUv - vec2( texel.x, 0.0 ) ), qy = P - viewPos( vUv - vec2( 0.0, texel.y ) );
  vec3 n = normalize( cross( abs( px.z ) < abs( qx.z ) ? px : qx, abs( py.z ) < abs( qy.z ) ? py : qy ) );
  float o = ao( vUv, P, n );
  float vis = clamp( 1.0 - intensity * o, 0.0, 1.0 );
  vis = vis * vis * ( 3.0 - 2.0 * vis );                       // soft knee
  if ( debug == 1 ) { gl_FragColor = vec4( vec3( vis ), 1.0 ); return; }
  gl_FragColor = vec4( col.rgb * mix( aoCol, vec3( 1.0 ), vis ), col.a );
}`;

export class AOPass extends Pass {
  private mat: THREE.ShaderMaterial;
  private cam: THREE.PerspectiveCamera;
  constructor(camera: THREE.PerspectiveCamera, o: { radius?: number; intensity?: number; bias?: number; color?: string; debug?: number } = {}) {
    super("AOPass");
    this.cam = camera;
    this.needsDepthTexture = true;
    this.needsSwap = true;
    const c = new THREE.Color(o.color ?? "#3a3050");
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: {
        tDiffuse: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() },
        texel: { value: new THREE.Vector2(1 / 1080, 1 / 1920) }, cNear: { value: 0.2 }, cFar: { value: 1500 },
        radius: { value: o.radius ?? 0.9 }, intensity: { value: o.intensity ?? 1.6 }, bias: { value: o.bias ?? 0.08 }, maxScreen: { value: 0.12 },
        aoCol: { value: new THREE.Vector3(c.r, c.g, c.b) }, debug: { value: o.debug ?? 0 },
      },
    });
    this.fullscreenMaterial = this.mat;
  }
  get uniforms() { return this.mat.uniforms; }
  setDepthTexture(t: THREE.Texture) { this.mat.uniforms.tDepth.value = t; }
  setSize(w: number, h: number) { this.mat.uniforms.texel.value.set(1 / w, 1 / h); }
  render(renderer: THREE.WebGLRenderer, input: THREE.WebGLRenderTarget, output: THREE.WebGLRenderTarget | null) {
    const u = this.mat.uniforms;
    u.tDiffuse.value = input.texture;
    u.proj.value.copy(this.cam.projectionMatrix); u.projInv.value.copy(this.cam.projectionMatrixInverse);
    u.cNear.value = this.cam.near; u.cFar.value = this.cam.far;
    renderer.setRenderTarget(this.renderToScreen ? null : output);
    renderer.render(this.scene, this.camera);
  }
}
