/**
 * Mockup C — hero cluster of 3D wild blueberries (ported from src/modules/blueberry/scene.ts).
 * Free-floating cluster (no panel) in the hero's 3D zone: right (desktop) or under the headline (mobile).
 * Driven by time, never by scroll: `frost` 0..1 (shader hoarfrost crust + instanced ice needles) and `intro`.
 * Frozen berries keep floating (slow sway + pointer parallax); rendering pauses while the hero is off-screen.
 */
import {
  ACESFilmicToneMapping, Box3, BufferAttribute, BufferGeometry, CanvasTexture, Color, ConeGeometry,
  DirectionalLight, DoubleSide, DynamicDrawUsage, Group, InstancedMesh, LinearMipmapLinearFilter, Matrix4,
  Mesh, MeshPhysicalMaterial, MeshStandardMaterial, NoColorSpace, PerspectiveCamera, PMREMGenerator,
  Quaternion, RepeatWrapping, Scene, SphereGeometry, SRGBColorSpace, Vector2, Vector3, WebGLRenderer, Euler,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- seeded noise ---------- */
let seedState = 20061;
const rnd = () => ((seedState = (seedState * 16807) % 2147483647) - 1) / 2147483646;
const PERM = new Uint8Array(512);
const VAL = new Float32Array(256);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) VAL[i] = rnd();
}
const fade = (t) => t * t * (3 - 2 * t);
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const X = xi & 255, Y = yi & 255, Z = zi & 255;
  const u = fade(xf), v = fade(yf), w = fade(zf);
  const h = (a, b, c) => VAL[PERM[PERM[PERM[a] + b] + c]];
  const x1 = X + 1, y1 = Y + 1, z1 = Z + 1;
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(h(X, Y, Z), h(x1 & 255, Y, Z), u), l(h(X, y1 & 255, Z), h(x1 & 255, y1 & 255, Z), u), v),
    l(l(h(X, Y, z1 & 255), h(x1 & 255, Y, z1 & 255), u), l(h(X, y1 & 255, z1 & 255), h(x1 & 255, y1 & 255, z1 & 255), u), v),
    w,
  );
}
function fbm(x, y, z, oct = 4) {
  let a = 0.5, s = 0, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise3(x, y, z); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return s / n;
}
const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

/* ---------- procedural fallback berry (used only if the GLB fails) ---------- */
const OBLATE = 0.84, CRATER = 0.36;
function shapeRadius(x, y, z, seed) {
  const theta = Math.acos(Math.min(1, Math.max(-1, y)));
  let r = 1 + (fbm(x * 1.2 + seed, y * 1.2, z * 1.2 - seed, 3) - 0.5) * 0.07;
  r -= sstep(CRATER, 0.0, theta) * 0.065;
  r += Math.exp(-(((theta - CRATER) / 0.06) ** 2)) * 0.01;
  r -= sstep(2.75, Math.PI, theta) * 0.03;
  return r;
}
function berryGeometry(w, h, seed) {
  const g = new SphereGeometry(1, w, h);
  const pos = g.getAttribute('position');
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const r = shapeRadius(v.x, v.y, v.z, seed);
    pos.setXYZ(i, v.x * r, v.y * r * OBLATE, v.z * r);
  }
  g.computeVertexNormals();
  return g;
}
function skinTexture() {
  const W = 256, H = 128, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const th = ((j + 0.5) / H) * Math.PI, ph = ((i + 0.5) / W) * Math.PI * 2;
    const x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
    const t = sstep(0.35, 0.7, fbm(x * 1.6 + 7, y * 1.6, z * 1.6, 3));
    const crown = sstep(CRATER + 0.04, CRATER - 0.14, th);
    const k = (j * W + i) * 4;
    img.data[k] = mix(mix(0x22, 0x33, t), 0x2a, crown); img.data[k + 1] = mix(mix(0x25, 0x38, t), 0x14, crown);
    img.data[k + 2] = mix(mix(0x4a, 0x68, t), 0x2c, crown); img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tx = new CanvasTexture(c); tx.colorSpace = SRGBColorSpace; tx.wrapS = RepeatWrapping; return tx;
}

/* ---------- frost shader (from the original module) ---------- */
const GLSL_NOISE = /* glsl */ `
uniform float uFrost;
uniform float uTime;
uniform float uRim;
uniform float uSss;
varying vec3 vObj;
float fh3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float fvn(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fh3(i), fh3(i + vec3(1,0,0)), f.x), mix(fh3(i + vec3(0,1,0)), fh3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(fh3(i + vec3(0,0,1)), fh3(i + vec3(1,0,1)), f.x), mix(fh3(i + vec3(0,1,1)), fh3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float ffbm(vec3 p){ float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++){ s += a * fvn(p); p *= 2.03; a *= 0.5; } return s; }
`;
export function patchFrost(mat, uniforms, sss) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFrost = uniforms.uFrost;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uRim = uniforms.uRim ?? { value: 0.7 }; // weight of the silhouette (fresnel) frost
    shader.uniforms.uSss = uniforms.uSss ?? { value: 1 }; // weight of the warm subsurface rim
    shader.vertexShader = 'varying vec3 vObj;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vObj = position;');
    shader.fragmentShader = GLSL_NOISE + shader.fragmentShader
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
  vec3 fN0 = normalize(vNormal);
  vec3 fV = normalize(vViewPosition);
  float fres = pow(1.0 - clamp(abs(dot(fN0, fV)), 0.0, 1.0), 1.5);
  float fn = ffbm(vObj * 11.0);
  float fhf = fvn(vObj * 46.0);
  float front = fres * uRim + (fn - 0.5) * 0.55 + (fhf - 0.5) * 0.35;
  float frostMask = smoothstep(1.02 - uFrost * 0.80, 1.28 - uFrost * 0.80, front + 0.15) * step(0.001, uFrost);
  float grainF = smoothstep(0.35, 0.75, fvn(vObj * 130.0)) * 0.7 + 0.3;
  frostMask = min(0.68, frostMask * grainF * 0.85);
  vec3 frostCol = mix(vec3(0.76, 0.84, 0.94), vec3(0.96, 0.98, 1.0), fhf);
  diffuseColor.rgb = mix(diffuseColor.rgb, frostCol, frostMask);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.72, frostMask);')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a = 1.0;')
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
  ${sss ? 'totalEmissiveRadiance += vec3(0.30, 0.05, 0.16) * pow(fres, 2.2) * 0.22 * uSss * (1.0 - frostMask);' : ''}
  float sp = fh3(floor(vObj * 140.0) + 3.0);
  float tw = 0.5 + 0.5 * sin(uTime * 2.4 + sp * 60.0 + dot(fV, vec3(9.0, 4.0, 6.0)) * 7.0);
  totalEmissiveRadiance += vec3(0.9, 0.96, 1.0) * step(0.988, sp) * frostMask * pow(tw, 12.0) * 2.2;`);
  };
}

/* ---------- kits ---------- */
export async function glbKit(url, uniforms) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3()), centre = box.getCenter(new Vector3());
  const k = 2 / Math.max(size.x, size.y, size.z, 1e-6);
  const norm = new Matrix4().makeScale(k, k, k).multiply(new Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));
  const parts = [];
  const cache = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(norm, o.matrixWorld));
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    const src = Array.isArray(o.material) ? o.material[0] : o.material;
    let mat = cache.get(src);
    if (!mat) {
      mat = new MeshPhysicalMaterial({
        map: src.map ?? null, normalMap: src.normalMap ?? null,
        normalScale: src.normalScale?.clone() ?? new Vector2(1, 1),
        aoMap: src.aoMap ?? null, aoMapIntensity: 1,
        roughnessMap: src.roughnessMap ?? null, roughness: src.roughness ?? 0.6,
        metalness: 0, color: src.color?.clone() ?? new Color('#ffffff'),
        sheen: 0.18, sheenColor: new Color('#8ea2c4'), sheenRoughness: 0.55,
        clearcoat: 0.2, clearcoatRoughness: 0.3, envMapIntensity: 0.6,
      });
      patchFrost(mat, uniforms, true);
      cache.set(src, mat);
    }
    parts.push({ geo, mat });
  });
  if (!parts.length) throw new Error('GLB has no meshes');
  const samples = [];
  const total = parts.reduce((n, pt) => n + pt.geo.getAttribute('position').count, 0);
  const want = Math.min(4000, total);
  for (const pt of parts) {
    const pos = pt.geo.getAttribute('position'), nrm = pt.geo.getAttribute('normal');
    const take = Math.max(1, Math.round((pos.count / total) * want));
    for (let i = 0; i < take; i++) {
      const j = Math.floor(rnd() * pos.count);
      samples.push({ p: new Vector3().fromBufferAttribute(pos, j), n: new Vector3().fromBufferAttribute(nrm, j).normalize() });
    }
  }
  return { scanned: true, make: () => { const g = new Group(); for (const pt of parts) g.add(new Mesh(pt.geo, pt.mat)); return g; }, samples };
}
function proceduralKit(uniforms) {
  const mat = new MeshPhysicalMaterial({ map: skinTexture(), roughness: 0.55, sheen: 0.6, sheenColor: new Color('#9fb3d9'), clearcoat: 0.3, envMapIntensity: 0.7 });
  patchFrost(mat, uniforms, true);
  const geo = berryGeometry(72, 54, 0.3);
  const samples = [];
  while (samples.length < 3000) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, st = Math.sqrt(1 - u * u);
    const dx = Math.cos(a) * st, dy = u, dz = Math.sin(a) * st;
    if (Math.acos(dy) < CRATER * 0.8) continue;
    const r = shapeRadius(dx, dy, dz, 0.3);
    samples.push({ p: new Vector3(dx * r, dy * r * OBLATE, dz * r), n: new Vector3(dx, dy / OBLATE, dz).normalize() });
  }
  return { scanned: false, make: () => new Mesh(geo, mat), samples };
}

/* ---------- scene ---------- */
export async function initHeroScene({ canvas, stage, getState, mobile, modelUrl, onReady }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = SRGBColorSpace;
  const dpr = () => Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // dark stage, one directional cold source from the top-right (matches the CSS light band),
  // cold rim from behind-left to separate the silhouettes, faint cool fill from below
  const key = new DirectionalLight(new Color('#eef4ff'), 1.8); key.position.set(4.5, 5, 4.5);
  const rim = new DirectionalLight(new Color('#bcdcff'), 2.2); rim.position.set(-5, 2.5, -4);
  const fill = new DirectionalLight(new Color('#5f80ad'), 0.45); fill.position.set(-2, -4, 2);
  scene.add(key, rim, fill);

  const camera = new PerspectiveCamera(24, 1, 0.1, 80);
  const uniforms = { uFrost: { value: 0 }, uTime: { value: 0 } };
  let kit;
  try { kit = await glbKit(modelUrl, uniforms); } catch (err) { console.warn('[c] GLB failed, procedural fallback', err); kit = proceduralKit(uniforms); }

  const needleMat = new MeshStandardMaterial({ color: new Color('#eef6ff'), roughness: 0.25, metalness: 0, emissive: new Color('#9cc2e6'), emissiveIntensity: 0.35, envMapIntensity: 1.3 });
  const needleGeo = new ConeGeometry(0.007, 1, 3, 1, true);
  needleGeo.translate(0, 0.5, 0);

  /* airy composition: x, y, z, size(sz), rx, ry, rz — lead berry + mediums + small back ones; gaps ~0.4-0.8 diameter */
  const allDefs = [
    [0.1, -0.1, 0.5, 0.9, 0.75, 0.3, 0.12],
    [-1.95, 0.9, 0.0, 0.6, 0.45, 2.1, 0.7],
    [1.9, -0.9, 0.2, 0.6, 1.15, 4.0, -0.55],
    [1.4, 1.25, -0.8, 0.45, 0.3, 5.2, -0.9],
    [-1.2, -1.5, -1.0, 0.35, 1.6, 0.8, 0.2],
    [-0.3, 1.75, -1.5, 0.3, 0.9, 3.3, -1.3],
  ];
  const defs = mobile ? [allDefs[0], allDefs[1], allDefs[2], allDefs[4]] : allDefs;
  const holder = new Group(); // positioned in the frame
  const cluster = new Group(); // sways
  holder.add(cluster);
  scene.add(holder);

  const NPB = mobile ? 280 : 520;
  const up = new Vector3(0, 1, 0);
  const needleSets = [];
  const makeNeedles = (samples, seed) => {
    const list = [];
    let guard = 0;
    while (list.length < NPB && guard++ < NPB * 25) {
      const s = samples[Math.floor(rnd() * samples.length)];
      const d = s.p.clone().normalize();
      const dens = fbm(d.x * 3 + seed, d.y * 3, d.z * 3, 2) * 1.4 + (d.y + 1) * 0.1;
      if (rnd() > dens - 0.3) continue;
      const nrm = s.n.clone().add(new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.8)).normalize();
      const big = rnd() < 0.1;
      list.push({
        p: s.p.clone().addScaledVector(nrm, -0.004), q: new Quaternion().setFromUnitVectors(up, nrm),
        len: big ? 0.07 + rnd() * 0.05 : 0.018 + rnd() * rnd() * 0.04, t: Math.pow(rnd(), 0.8) * 0.75, w: 0.6 + rnd() * 0.8,
      });
    }
    const mesh = new InstancedMesh(needleGeo, needleMat, list.length);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    return { mesh, list };
  };

  const berries = defs.map(([x, y, z, s, rx, ry, rz], i) => {
    const g = new Group();
    g.add(kit.make());
    const ns = makeNeedles(kit.samples, i % 2 ? 2.1 : 0.3);
    g.add(ns.mesh);
    needleSets.push(ns);
    const rot = new Euler(rx + (rnd() - 0.5) * 1.2, ry + rnd() * Math.PI * 2, rz + (rnd() - 0.5) * 1.2);
    g.rotation.copy(rot);
    const sz = s;
    g.scale.set(sz * (1 + (rnd() - 0.5) * 0.1), sz * (1 + (rnd() - 0.5) * 0.12), sz * (1 + (rnd() - 0.5) * 0.1));
    cluster.add(g);
    return {
      g, base: new Vector3(x, y, z), rot,
      ph: new Vector3(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28), fr: 0.22 + rnd() * 0.22,
    };
  });

  const m4 = new Matrix4(), sc = new Vector3();
  let lastFrost = -1;
  const updateNeedles = (frost) => {
    if (Math.abs(frost - lastFrost) < 0.003) return;
    lastFrost = frost;
    for (const set of needleSets) {
      for (let i = 0; i < set.list.length; i++) {
        const nd = set.list[i];
        const k = sstep(nd.t, nd.t + 0.22, frost);
        const w = k > 0.001 ? nd.w * (0.4 + 0.6 * k) : 0;
        sc.set(w, nd.len * k, w);
        m4.compose(nd.p, nd.q, sc);
        set.mesh.setMatrixAt(i, m4);
      }
      set.mesh.instanceMatrix.needsUpdate = true;
    }
  };
  updateNeedles(0);

  /* framing — `stage` is the hero's 3D zone only (desktop: cols 7–12 bleeding to the right edge, between
     header and the figures strip; mobile: a band under the copy). The cluster fills the zone: its left
     extent sits just inside the zone, the far right berry may be slightly cut by the screen edge. */
  const ext = defs.reduce((e, [x, y, , s]) => ({
    l: Math.min(e.l, x - s), r: Math.max(e.r, x + s), b: Math.min(e.b, y - s), t: Math.max(e.t, y + s),
  }), { l: Infinity, r: -Infinity, b: Infinity, t: -Infinity });
  let visW = 1, visH = 1;
  const resize = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = (camera.fov * Math.PI) / 180;
    const padL = 0.3, padV = 0.3, crop = mobile ? 0.15 : 0.35; // world units: sway/parallax room; right-edge crop
    const needW = ext.r - ext.l + padL - crop, needH = ext.t - ext.b + padV * 2;
    visH = Math.max(needH, needW / camera.aspect);
    visW = visH * camera.aspect;
    const dist = visH / (2 * Math.tan(vFov / 2));
    camera.position.set(0, 0.3, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    holder.position.set(-visW / 2 + padL - ext.l, -(ext.t + ext.b) / 2, 0);
  };
  resize();
  new ResizeObserver(resize).observe(stage);

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!still) window.addEventListener('pointermove', (e) => { ptr.x = (e.clientX / innerWidth - 0.5) * 2; ptr.y = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  let visible = true, raf = 0, last = performance.now(), time = 0, framesDone = 0, readyFired = false;
  const tmp = new Vector3();
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += still ? 0 : dt; // prefers-reduced-motion: a still frame
    const { frost, intro } = getState();
    uniforms.uFrost.value = frost;
    uniforms.uTime.value = time;
    updateNeedles(frost);

    // barely perceptible sway, fresh or frozen
    cluster.rotation.y = Math.sin(time * 0.25) * 0.06 + (1 - intro) * -0.5;
    cluster.rotation.x = Math.sin(time * 0.19) * 0.025;
    cluster.position.y = (1 - intro) * -0.6;
    ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 3); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 3);
    for (const b of berries) {
      const dp = 0.12 + (b.base.z + 1.5) * 0.1; // nearer berries shift more
      tmp.copy(b.base);
      tmp.x += Math.sin(time * b.fr + b.ph.x) * 0.1 + ptr.sx * dp * 0.5;
      tmp.y += Math.sin(time * b.fr * 1.3 + b.ph.y) * 0.16 - ptr.sy * dp * 0.5;
      tmp.z += Math.sin(time * b.fr * 0.8 + b.ph.z) * 0.1;
      b.g.position.copy(tmp);
      b.g.rotation.set(b.rot.x + Math.sin(time * b.fr + b.ph.y) * 0.12, b.rot.y + time * 0.05 * (b.ph.x > 3.14 ? 1 : -1), b.rot.z + Math.sin(time * b.fr * 0.9 + b.ph.z) * 0.1);
    }
    renderer.render(scene, camera);
    if (!readyFired && ++framesDone >= 3) { readyFired = true; onReady(); }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  let compiled = false;
  const start = () => {
    if (compiled && !raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) start(); }, { rootMargin: '100px' }).observe(stage);
  document.addEventListener('visibilitychange', start);
  try { await renderer.compileAsync(scene, camera); } catch { /* compile on first frame */ }
  scene.traverse((o) => {
    const mat = o.material;
    if (!mat) return;
    for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap, mat.sheenColorMap]) if (t) renderer.initTexture(t);
  });
  compiled = true;
  start();
  return { kick: start };
}
