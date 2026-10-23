/* Mockup C — industrial / expert · page logic */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const NB = ' ';
const fmt = (n) => n.toLocaleString('ru-RU').replace(/\s/g, NB);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePtr = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesk = () => innerWidth >= 1024;
const plural = (n, f) => f[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
const QA = location.search.includes('qa');
if (!reduced && !QA) document.documentElement.classList.add('rvon');

/* ================= DATA (src/content/products/*.json) ================= */
const P = [
  { s: 'chernika', k: 'Дикорастущая', n: 'Черника', t: '#2b3576' },
  { s: 'brusnika', k: 'Дикорастущая', n: 'Брусника', t: '#a3142f' },
  { s: 'klyukva', k: 'Дикорастущая', n: 'Клюква', t: '#8e1730' },
  { s: 'belyy-grib', k: 'Дикорастущий', n: 'Белый гриб', t: '#7a5631' },
  { s: 'golubika', k: '', n: 'Голубика', t: '#36508f' },
  { s: 'klubnika', k: 'Садовая', n: 'Клубника', t: '#b3192b' },
  { s: 'krasnaya-smorodina', k: 'Садовая', n: 'Красная смородина', t: '#b01d2a' },
  { s: 'chernaya-smorodina', k: 'Садовая', n: 'Чёрная смородина', t: '#2a2147' },
  { s: 'malina', k: 'Дикорастущая', n: 'Малина', t: '#b8173f' },
  { s: 'vishnya', k: 'Садовая', n: 'Вишня', t: '#7d0f22' },
  { s: 'ezhevika', k: 'Дикорастущая', n: 'Ежевика', t: '#2b1838' },
  { s: 'oblepikha', k: 'Садовая', n: 'Облепиха', t: '#c76a12' },
  { s: 'kryzhovnik', k: 'Садовая', n: 'Крыжовник', t: '#5f7d22' },
  { s: 'shampinon', k: 'Культивируемый', n: 'Шампиньон', t: '#8d8172' },
];

/* ================= MOTIF: frost-crystal construction drawing =================
   One generator for the hero (behind the berries) and the footer fragment. 60° lattice: hexagon, three axes,
   construction circles, degree ticks, a 60° angle callout and a six-ray dendrite whose branches «grow» with --f. */
const D = Math.PI / 180;
const pt = (r, a) => [+(r * Math.cos(a * D)).toFixed(2), +(r * Math.sin(a * D)).toFixed(2)];
function dendrite(R = 100, cls = 'gd') {
  let s = '';
  for (let k = 0; k < 6; k++) {
    const a = -90 + 60 * k;
    const [x0, y0] = pt(R * 0.06, a), [x1, y1] = pt(R * 0.86, a);
    s += `<path class="${cls}" pathLength="1" style="--k:0" d="M${x0} ${y0}L${x1} ${y1}"/>`;
    for (const [d, len, kk] of [[0.24, 0.2, 0.14], [0.42, 0.17, 0.26], [0.6, 0.12, 0.38], [0.75, 0.07, 0.5]]) {
      for (const side of [-1, 1]) {
        const [bx, by] = pt(R * d, a), [ex, ey] = pt(R * len, a + side * 60);
        s += `<path class="${cls}" pathLength="1" style="--k:${kk}" d="M${bx} ${by}l${ex} ${ey}"/>`;
      }
    }
  }
  return s;
}
function crystal(kind) {
  const R = 100;
  let s = `<circle class="gc" r="${R}" pathLength="1"/><circle class="gc" r="${R * 0.62}" pathLength="1"/><circle class="gc" r="${R * 0.24}" pathLength="1"/>`;
  s += `<path class="ga" pathLength="1" d="M${[...Array(6)].map((_, i) => pt(R, -90 + 60 * i).join(' ')).join('L')}Z"/>`;
  s += `<path class="gc" pathLength="1" d="M${[...Array(6)].map((_, i) => pt(R * 0.62, -60 + 60 * i).join(' ')).join('L')}Z"/>`;
  for (let i = 0; i < 3; i++) { const a = -90 + 60 * i, [x0, y0] = pt(R * 1.08, a + 180), [x1, y1] = pt(R * 1.08, a); s += `<path class="gc" pathLength="1" d="M${x0} ${y0}L${x1} ${y1}"/>`; }
  let ticks = '';
  for (let a = 0; a < 360; a += 5) { const big = a % 30 === 0, [x0, y0] = pt(R, a), [x1, y1] = pt(R + (big ? 4 : 1.8), a); ticks += `M${x0} ${y0}L${x1} ${y1}`; }
  s += `<path class="gk" d="${ticks}"/>`;
  // 60° callout between two axes + radius dimension
  const [ax, ay] = pt(R * 0.36, -90), [bx, by] = pt(R * 0.36, -30), [tx, ty] = pt(R * 0.43, -60);
  s += `<path class="gk" d="M${ax} ${ay}A${R * 0.36} ${R * 0.36} 0 0 1 ${bx} ${by}"/><text class="gt" x="${tx}" y="${ty}" text-anchor="middle">60°</text>`;
  if (kind === 'hero') {
    const [rx, ry] = pt(R, 150);
    s += `<path class="gk" d="M0 0L${rx} ${ry}"/><text class="gt" x="${(rx * 0.55).toFixed(1)}" y="${(ry * 0.55 - 2).toFixed(1)}" text-anchor="middle" transform="rotate(-30 ${(rx * 0.55).toFixed(1)} ${(ry * 0.55 - 2).toFixed(1)})">R</text>`;
  }
  return s + dendrite(R);
}
$$('[data-crystal]').forEach((svg) => (svg.innerHTML = crystal(svg.dataset.crystal)));

/* product swatches: deep tonal field + 60° lattice + caliber gauge + a crystal fragment (no illustration) */
function swatch(seed) {
  const L = { 2: [[168, 300], [356, 74, 0]], 3: [[226, 286], [52, 452, 30]], 4: [[196, 292], [372, 470, 15]] }[seed] || [[200, 280], [360, 80, 0]];
  const [[cx, cy], [kx, ky, kr]] = L;
  let s = '<g class="gl">';
  const h = 40 * Math.sqrt(3) / 2;
  for (let y = 0; y <= 520; y += h) s += `<path d="M0 ${y.toFixed(1)}H400"/>`;
  for (let x = -600; x <= 600; x += 40) s += `<path d="M${x} 0l${(520 / Math.sqrt(3)).toFixed(1)} 520M${x + 400} 0l${(-520 / Math.sqrt(3)).toFixed(1)} 520"/>`;
  s += '</g>';
  let tk = '';
  for (let a = 0; a < 360; a += 6) { const big = a % 30 === 0, [x0, y0] = pt(116, a), [x1, y1] = pt(116 + (big ? 10 : 4), a); tk += `M${cx + x0} ${cy + y0}L${cx + x1} ${cy + y1}`; }
  s += `<g class="gg"><circle cx="${cx}" cy="${cy}" r="116"/><path d="${tk}"/><path d="M${cx - 116} ${cy}H${cx + 116}M${cx - 116} ${cy - 6}v12M${cx + 116} ${cy - 6}v12M${cx - 5} ${cy - 5}l10 10M${cx + 5} ${cy - 5}l-10 10"/></g>`;
  s += `<circle class="gg2" cx="${cx}" cy="${cy}" r="72"/><text class="gtx" x="${cx}" y="${cy - 10}" text-anchor="middle">Ø · мм</text>`;
  s += `<g transform="translate(${kx} ${ky}) rotate(${kr}) scale(1.5)" class="gg2" style="--f:1">${dendrite(100, 'gg2')}<circle r="100"/></g>`;
  return `<svg class="sw" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}
$$('[data-swatch]').forEach((el) => el.insertAdjacentHTML('afterbegin', swatch(+el.dataset.seed)));

/* ================= 01 PRODUCTS: the other ten ================= */
const FEAT = ['chernika', 'brusnika', 'klyukva', 'belyy-grib'];
$('[data-rest]').innerHTML = P.filter((p) => !FEAT.includes(p.s)).map((p) => `<li><a href="/catalog/${p.s}/" data-stub><i style="--t:${p.t}"></i>${p.n}${p.k ? `<em class="rest__kind">${p.k}</em>` : ''}</a></li>`).join('');

/* ================= HEADER ================= */
const hdr = $('[data-hdr]');
const burger = $('[data-burger]');
const setMenu = (o) => { hdr.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', String(o)); };
burger.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
$$('[data-mnav] a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
$$('.lang').forEach((g) => $$('button', g).forEach((b) => b.addEventListener('click', () => {
  $$('.lang button').forEach((o) => o.setAttribute('aria-pressed', String(o.textContent === b.textContent)));
})));
// current section in the menu
const menuLinks = $$('.menu a');
{
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) menuLinks.forEach((a) => a.classList.toggle('is-cur', a.getAttribute('href') === `#${e.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => io.observe(s));
}

/* ================= HERO: one screen; the cluster freezes by itself (+18 → −18 °C, time-based, never scroll-driven) ================= */
const hero = $('[data-hero]');
const heroGeo = $('[data-crystal="hero"]');
const tempV = $('[data-temp-v]'), tempBar = $('[data-temp-bar]'), tempS = $('[data-temp-s]');
const heroState = { frost: reduced ? 1 : 0, intro: reduced ? 1 : 0 };
const qaFrost = new URLSearchParams(location.search).get('frost'); // QA: ?frost=0..1
if (qaFrost !== null) heroState.frost = clamp(parseFloat(qaFrost) || 0);
let lastT = null;
function heroPaint() {
  const T = Math.round(18 - 36 * heroState.frost);
  if (T !== lastT) {
    lastT = T;
    tempV.textContent = T > 0 ? `+${T}` : T < 0 ? `−${-T}` : '0';
    tempS.textContent = heroState.frost < 0.06 ? 'Приёмка сырья' : heroState.frost < 0.97 ? 'IQF-тоннель' : `Хранение · −18${NB}°C`;
  }
  tempBar.style.width = `${(heroState.frost * 100).toFixed(1)}%`;
  heroGeo.style.setProperty('--f', heroState.frost.toFixed(3));
}
heroPaint();
let frostStarted = reduced || qaFrost !== null;
function startFrost(delay = 600, dur = 3500) { // ease-in-out over ~3.5 s, starts ~0.6 s after the berries appear
  if (frostStarted) return; frostStarted = true;
  const t0 = performance.now() + delay;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const tick = (now) => { const k = clamp((now - t0) / dur); heroState.frost = ease(k); heroPaint(); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const hdrUpdate = () => hdr.classList.toggle('is-solid', scrollY > 8);
addEventListener('scroll', hdrUpdate, { passive: true });
hdrUpdate();

const Y = new Date().getFullYear();
$$('[data-year]').forEach((el) => (el.textContent = Y));
const yrs = Y - 2006;
$('[data-years]').innerHTML = `${yrs}<u>${plural(yrs, ['год', 'года', 'лет'])}</u>`;

(async () => {
  const canvas = $('[data-hero-canvas]'), stage = $('[data-hero-vis]');
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('no webgl2');
    const { initHeroScene } = await import('./scene.js');
    await initHeroScene({
      canvas, stage, mobile: !isDesk(), modelUrl: './models/blueberry.glb',
      getState: () => heroState,
      onReady: () => {
        hero.classList.add('is-live');
        if (reduced) return;
        const t0 = performance.now();
        const tick = (now) => { const k = clamp((now - t0) / 1600); heroState.intro = 1 - Math.pow(1 - k, 3); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
        startFrost(600); // the frost starts ~0.6 s after the berries appear
      },
    });
  } catch (e) { console.warn('[c] hero 3D unavailable', e); hero.classList.add('is-static'); startFrost(); }
})();

/* ================= 02 PRODUCTION CYCLE ================= */
// one-shot reveal on first view: axis draws left to right, nodes fill in turn, temperature line draws in sync (all in CSS, .is-run)
{
  const cyc = $('[data-cyc]');
  if (cyc && document.documentElement.classList.contains('rvon')) {
    new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); cyc.classList.add('is-run'); }, { rootMargin: '0px 0px -25% 0px' }).observe(cyc);
  }
}

/* ================= 03 MAP ================= */
// Natural Earth 110m (world-atlas, ./data) in a Lambert conformal conic: Europe + European Russia, Belarus = compact point of dispatch
const PET = [28.4975, 52.1287];
const CITIES = [
  // [name, lon, lat, capital, on mobile] — directions of supply (визуализация направлений; уточнить у заказчика)
  ['Минск', 27.56, 53.9, 1, 1], ['Москва', 37.62, 55.75, 1, 1], ['Санкт-Петербург', 30.32, 59.94, 1, 1], ['Нижний Новгород', 44.0, 56.33, 0, 0],
  ['Казань', 49.11, 55.79, 0, 0], ['Воронеж', 39.2, 51.67, 0, 0], ['Ростов-на-Дону', 39.72, 47.23, 0, 1], ['Краснодар', 38.98, 45.04, 0, 0],
  ['Екатеринбург', 60.6, 56.84, 0, 0], ['Казахстан', 71.4, 51.1, 1, 1], ['Варшава', 21.01, 52.23, 1, 1], ['Берлин', 13.4, 52.52, 1, 1],
  ['Прага', 14.42, 50.08, 0, 0], ['Вильнюс', 25.28, 54.69, 1, 0], ['Рига', 24.1, 56.95, 1, 0],
];
const CC = { 'Минск': 'by', 'Казахстан': 'kz', 'Варшава': 'pl', 'Берлин': 'de', 'Прага': 'cz', 'Вильнюс': 'lt', 'Рига': 'lv' }; // route → country chip (all other cities are Russia)
const MID = new Set(['Russia', 'Poland', 'Germany', 'Czechia', 'Lithuania', 'Latvia', 'Estonia', 'Kazakhstan', 'Finland', 'Sweden', 'Denmark', 'Austria', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Netherlands', 'Belgium', 'France', 'Italy', 'Slovenia', 'Croatia', 'Greece', 'Luxembourg', 'Ireland', 'Portugal', 'Spain']);
const D2R = Math.PI / 180;
const LCC = (() => {
  const p1 = 48 * D2R, p2 = 62 * D2R, p0 = 54 * D2R, l0 = 32 * D2R, t = (p) => Math.tan(Math.PI / 4 + p / 2);
  const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(t(p2) / t(p1)), F = (Math.cos(p1) * Math.pow(t(p1), n)) / n;
  const rho = (p) => F / Math.pow(t(p), n), r0 = rho(p0);
  return {
    fwd: (lo, la) => { const r = rho(la * D2R), th = n * (lo * D2R - l0); return [r * Math.sin(th), r0 - r * Math.cos(th)]; },
    inv: (x, y) => { const r = Math.hypot(x, r0 - y), th = Math.atan2(x, r0 - y); return [(l0 + th / n) / D2R, (2 * Math.atan(Math.pow(F / r, 1 / n)) - Math.PI / 2) / D2R]; },
  };
})();
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
let geo = null;
async function loadGeo() { // TopoJSON → [{name, parts:[{bb, rings}]}] (decoded by hand, no libraries)
  const t = await (await fetch('./data/countries-110m.json')).json();
  const [sx, sy] = t.transform.scale, [tx, ty] = t.transform.translate;
  const arcs = t.arcs.map((a) => { let x = 0, y = 0; return a.map(([dx, dy]) => [(x += dx) * sx + tx, (y += dy) * sy + ty]); });
  const ring = (ids) => { const o = []; ids.forEach((i) => { const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; for (let k = o.length ? 1 : 0; k < a.length; k++) o.push(a[k]); }); return o; };
  geo = t.objects.countries.geometries.map((g) => {
    const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
    return { name: g.properties.name, parts: polys.map((p) => { const rings = p.map(ring); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; rings[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); return { bb: [x0, y0, x1, y1], rings }; }) };
  });
}
const countryAt = (lo, la) => { for (const c of geo) for (const p of c.parts) { if (lo < p.bb[0] || lo > p.bb[2] || la < p.bb[1] || la > p.bb[3]) continue; let ins = false; for (const r of p.rings) if (inPoly(lo, la, r)) ins = !ins; if (ins) return c.name; } return null; };
const mapBox = $('.map'), mapEl = $('[data-map]'), mapCv = $('[data-map-canvas]'), mapSvg = $('[data-map-svg]');
let mapDots = [], mapR = 1, mapAnim = reduced ? 1 : 0, mapStarted = false;
function buildMap() {
  if (!geo) return;
  const W = mapEl.clientWidth, H = mapEl.clientHeight;
  if (!W) return;
  const small = W < 640;
  // fit: anchor cities define the framed box; Petrikov sits in the left third, far destinations fall off the edge with arrows
  const anchors = small ? [[21.01, 52.23], [37.62, 55.75], PET, [29, 47.6]] : [[21.01, 52.23], [49.11, 55.79], [30.32, 59.94], [39.72, 47.23], PET];
  const ap = anchors.map(([a, b]) => LCC.fwd(a, b));
  const ax0 = Math.min(...ap.map((p) => p[0])), ax1 = Math.max(...ap.map((p) => p[0])), ay0 = Math.min(...ap.map((p) => p[1])), ay1 = Math.max(...ap.map((p) => p[1]));
  const s = Math.min((W * (small ? 0.68 : 0.62)) / (ax1 - ax0), (H * (small ? 0.66 : 0.78)) / (ay1 - ay0));
  const cx = (ax0 + ax1) / 2, cy = (ay0 + ay1) / 2;
  const P = (lo, la) => { const [x, y] = LCC.fwd(lo, la); return [W / 2 + (x - cx) * s, H / 2 - (y - cy) * s]; };
  const [px, py] = P(PET[0], PET[1]);
  const step = 8;
  mapR = step * 0.2;
  mapDots = [];
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const [lo, la] = LCC.inv((x - W / 2) / s + cx, cy - (y - H / 2) / s);
      const name = countryAt(lo, la);
      if (!name) continue; // sea stays empty
      const t = name === 'Belarus' ? 2 : MID.has(name) ? 1 : 0;
      mapDots.push({ x, y, t, d: Math.hypot(x - px, y - py), src: t === 2 || (name === 'Russia' && lo > 28 && lo < 37 && la > 51.8 && la < 57.2) });
    }
  }
  const maxD = Math.max(...mapDots.map((d) => d.d));
  mapDots.forEach((d) => (d.d /= maxD));
  const DP = Math.min(2, devicePixelRatio || 1);
  mapCv.width = W * DP; mapCv.height = H * DP;
  drawMapDots();
  const fs = 14, cfs = 13; // city labels 14px, country labels 13px
  const obst = [];
  const hit = (r) => r.x0 < 6 || r.x1 > W - 6 || r.y0 < 6 || r.y1 > H - 6 || obst.some((o) => r.x0 < o.x1 && r.x1 > o.x0 && r.y0 < o.y1 && r.y1 > o.y0);
  const bel = geo.find((c) => c.name === 'Belarus');
  const bpath = bel.parts.map((p) => p.rings.map((r) => r.map(([lo, la], i) => { const [x, y] = P(lo, la); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; }).join('') + 'Z').join('')).join('');
  let svg = `<path d="${bpath}" fill="none" stroke="rgba(140,200,240,.5)" stroke-width="1"/>`;
  const LBL = 'rgba(238,242,246,.9)'; // one brightness for every label
  const MX = W * (small ? 0.1 : 0.13), MY = H * 0.13; // keep route ends inside the visible (unfaded) area
  // phase 1 · sourcing: raw material flows into Petrikov from Belarus and the west of Russia (Smolensk, Bryansk…)
  if (!reduced) {
    const src = mapDots.filter((d) => d.src && Math.hypot(d.x - px, d.y - py) > 16);
    let g = '<g class="lyr-in"><g class="inflow">';
    const n = small ? 20 : 36;
    for (let q = 0; q < n && src.length; q++) {
      const d0 = src[Math.floor((((q * 7919) % 1000) / 1000) * src.length)];
      const dur = (2.2 + (q % 7) * 0.2).toFixed(2), beg = ((q * 0.37) % 3).toFixed(2);
      g += `<circle r="1.4" fill="#eef2f6" opacity="0"><animateMotion dur="${dur}s" begin="${beg}s" repeatCount="indefinite" path="M${d0.x.toFixed(1)},${d0.y.toFixed(1)} L${px.toFixed(1)},${py.toFixed(1)}"/><animate attributeName="opacity" values="0;.85;.85;0" keyTimes="0;.2;.8;1" dur="${dur}s" begin="${beg}s" repeatCount="indefinite"/></circle>`;
    }
    svg += g + '</g></g>';
  }
  // phase 2 · supply routes. pass 1: geometry (off-frame destinations end at the visible edge with an arrow label)
  const rts = [];
  CITIES.forEach(([n, lo, la, cap, mob], i) => {
    if (small && !mob) return;
    let [x, yy] = P(lo, la), edge = '';
    if (x < MX || x > W - MX || yy < MY || yy > H - MY) {
      const dx = x - px, dy = yy - py;
      const tx = dx > 0 ? (W - MX - px) / dx : dx < 0 ? (MX - px) / dx : Infinity;
      const ty = dy > 0 ? (H - MY - py) / dy : dy < 0 ? (MY - py) / dy : Infinity;
      const t = Math.min(tx, ty); x = px + dx * t; yy = py + dy * t;
      edge = tx < ty ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'b' : 't');
    }
    rts.push({ n, cap, i, x, yy, edge, ang: Math.atan2(yy - py, x - px) });
  });
  // fan: neighbouring routes (sorted by direction) leave Petrikov with alternating sides and different curvature
  [...rts].sort((a, b) => a.ang - b.ang).forEach((r, k) => { r.bend = (k % 2 ? 1 : -1) * Math.tan(([9, 17, 26][k % 3] * Math.PI) / 180) / 2; });
  rts.forEach((r) => {
    const dx = r.x - px, dy = r.yy - py;
    const qx = (px + r.x) / 2 - dy * r.bend, qy = (py + r.yy) / 2 + dx * r.bend;
    r.d = `M${px.toFixed(1)},${py.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${r.x.toFixed(1)},${r.yy.toFixed(1)}`;
    r.pts = [];
    for (let t = 0.06; t <= 1.001; t += 0.06) r.pts.push([(1 - t) * (1 - t) * px + 2 * t * (1 - t) * qx + t * t * r.x, (1 - t) * (1 - t) * py + 2 * t * (1 - t) * qy + t * t * r.yy]);
  });
  const onRoute = (r) => rts.some((q) => q.pts.some(([x, y]) => x > r.x0 - 2 && x < r.x1 + 2 && y > r.y0 - 2 && y < r.y1 + 2));
  obst.push({ x0: px - 10, x1: px + 10, y0: py - 10, y1: py + 10 });
  rts.forEach((r) => { if (!r.edge) obst.push({ x0: r.x - 5, x1: r.x + 5, y0: r.yy - 5, y1: r.yy + 5 }); });
  // pass 2: draw routes + labels
  const cw = (t) => t.length * fs * 0.62;
  rts.forEach((r, ri) => {
    const { n, cap, i, x, yy, edge } = r;
    svg += `<g class="rt" data-c="${CC[n] || 'ru'}"><path class="route" style="--i:${ri}" d="${r.d}" pathLength="1" fill="none" stroke="rgba(140,200,240,.6)" stroke-width="1"/>`;
    if (!reduced) svg += `<circle class="route__dot" style="--i:${ri}" r="1.8" fill="#dff1ff"><animateMotion dur="${(3.6 + (i % 5) * 0.55).toFixed(2)}s" begin="${(3.2 + i * 0.12).toFixed(2)}s" repeatCount="indefinite" path="${r.d}"/></circle>`;
    if (!edge) {
      svg += `<circle class="route__end" style="--i:${ri}" cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${cap ? 3 : 2.2}" fill="#0a1520" stroke="rgba(238,242,246,.85)" stroke-width="1"/>`;
      const w = cw(n), c = [['start', x + 7, x + 7, x + 7 + w, yy + 5], ['end', x - 7, x - 7 - w, x - 7, yy + 5], ['middle', x, x - w / 2, x + w / 2, yy - 9], ['middle', x, x - w / 2, x + w / 2, yy + 19]];
      if (x < px) [c[0], c[1]] = [c[1], c[0]];
      const rect = (o) => ({ x0: o[2], x1: o[3], y0: o[4] - fs, y1: o[4] + 3 });
      const o = c.find((q) => !hit(rect(q)) && !onRoute(rect(q))) || c.find((q) => !hit(rect(q))) || c[0];
      obst.push(rect(o));
      svg += `<text class="route__lbl" style="--i:${ri}" x="${o[1].toFixed(1)}" y="${o[4].toFixed(1)}" text-anchor="${o[0]}" fill="${LBL}" font-size="${fs}" font-weight="500">${n}</text></g>`;
    } else {
      const anchor = edge === 'r' ? 'end' : edge === 'l' ? 'start' : x > W / 2 ? 'end' : 'start';
      const ox2 = edge === 'r' ? -2 : edge === 'l' ? 2 : 0, oy2 = edge === 't' ? 14 : edge === 'l' ? -16 : -8;
      const arrow = edge === 'r' ? ' →' : edge === 'l' ? '← ' : edge === 't' ? ' ↑' : ' ↓';
      const txt = edge === 'l' ? `${arrow}${n}` : `${n}${arrow}`;
      const w = cw(txt), lx = x + ox2;
      const er = (l) => ({ x0: anchor === 'end' ? lx - w : lx, x1: anchor === 'end' ? lx : lx + w, y0: l - fs, y1: l + 3 });
      const sh = [0, 16, -16, 32, -32];
      const dy = sh.find((s0) => !hit(er(yy + oy2 + s0)) && !onRoute(er(yy + oy2 + s0))) ?? sh.find((s0) => !hit(er(yy + oy2 + s0))) ?? 0;
      const ly = yy + oy2 + dy;
      obst.push(er(ly));
      svg += `<text class="route__lbl" style="--i:${ri}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" fill="${LBL}" font-size="${fs}" font-weight="500">${txt}</text></g>`;
    }
  });
  // callout: short leader next to the pin, placed where it crosses neither routes nor labels
  const tw = small ? 96 : 156, th = 40;
  const cc = [[1, 16, 16], [1, 26, 40], [-1, 16, 16], [-1, 26, 40], [1, 10, 64], [-1, 10, 64], [1, 14, 90]];
  const crect = ([sd, dx, dy]) => ({ x0: sd > 0 ? px + dx : px - dx - tw, x1: sd > 0 ? px + dx + tw : px - dx, y0: py + dy - 2, y1: py + dy + th });
  const [sd, cdx, cdy] = cc.find((c) => !hit(crect(c)) && !onRoute(crect(c))) || cc.find((c) => !hit(crect(c))) || cc[0];
  obst.push(crect([sd, cdx, cdy]));
  const tx0 = px + sd * (cdx + 4), ta = sd > 0 ? 'start' : 'end';
  svg += `<circle class="pin-pulse" cx="${px}" cy="${py}" r="6" fill="none" stroke="#fff" stroke-width="1"/>`;
  svg += `<circle cx="${px}" cy="${py}" r="6" fill="none" stroke="rgba(255,255,255,.7)"/><circle cx="${px}" cy="${py}" r="3" fill="#fff"/>`;
  svg += `<path d="M${px + sd * 3},${py + 3} L${px + sd * cdx},${py + cdy} L${px + sd * (cdx + tw)},${py + cdy}" fill="none" stroke="rgba(255,255,255,.7)"/>`;
  svg += `<text x="${tx0}" y="${py + cdy + 17}" text-anchor="${ta}" font-size="14" font-weight="500" letter-spacing=".08em" fill="#fff">ПЕТРИКОВ</text>`;
  svg += `<text x="${tx0}" y="${py + cdy + 36}" text-anchor="${ta}" font-size="13" fill="rgba(238,242,246,.78)">${small ? `IQF 4 т/ч<tspan x="${tx0}" dy="16">2 000+ т</tspan>` : 'IQF 4 т/ч · 2 000+ т'}</text>`;
  // country labels (13px, letter-spaced) go into free space, tried in order
  const padR = (r, m = 12) => ({ x0: r.x0 - m, x1: r.x1 + m, y0: r.y0 - m, y1: r.y1 + m }); // breathing room around other labels and the callout
  const country = (txt, cands) => {
    const w = txt.length * cfs * 0.86;
    const fit = cands.map(([lo, la]) => { const [x, y] = P(lo, la); return { x, y, r: { x0: x - w / 2, x1: x + w / 2, y0: y - cfs, y1: y + 4 } }; })
      .filter((c) => c.r.x0 >= W * 0.1 && c.r.x1 <= W * 0.9 && c.r.y0 >= H * 0.1 && c.r.y1 <= H * 0.9 && !hit(padR(c.r)));
    const c = fit.find((q) => !onRoute(q.r)) || fit[0]; // prefer a spot clear of route lines
    if (!c) return;
    obst.push(c.r);
    svg += `<text x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" fill="${LBL}" font-size="${cfs}" letter-spacing=".24em" text-anchor="middle">${txt}</text>`;
  };
  country('БЕЛАРУСЬ', [[28.4, 55.5], [27.0, 55.7], [29.8, 55.7], [26.4, 55.2], [30.8, 55.3], [26.2, 52.9], [31.2, 53.3], [25.6, 53.5], [29.2, 54.3]]);
  if (!small) {
    country('РОССИЯ', [[41.6, 53.6], [42.6, 53.0], [43, 54.2], [41, 49.6], [45, 52.2], [44.5, 50], [41.5, 57.5]]);
  }
  mapSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  mapSvg.innerHTML = svg;
  // country chips with no route on this layout (mobile shows fewer cities) are hidden
  $$('[data-mchips] [data-c]').forEach((b) => { b.hidden = !mapSvg.querySelector(`.rt[data-c="${b.dataset.c}"]`); });
}
// map filters: layer (Заготовка / Поставки) and country chips; hover/focus previews, click/tap pins, second click clears
(function () {
  const btns = $$('[data-mflt] button, [data-mchips] button');
  if (!btns.length || !mapBox) return;
  let pin = null, hov = null;
  const key = (b) => (b.dataset.layer ? 'L:' + b.dataset.layer : 'C:' + b.dataset.c);
  const apply = () => {
    const k = hov || pin || '';
    mapBox.classList.toggle('f-src', k === 'L:src');
    mapBox.classList.toggle('f-out', k === 'L:out');
    if (k[0] === 'C') mapBox.dataset.c = k.slice(2); else delete mapBox.dataset.c;
    btns.forEach((b) => b.setAttribute('aria-pressed', String(key(b) === pin)));
  };
  btns.forEach((b) => {
    b.addEventListener('click', () => { pin = pin === key(b) ? null : key(b); apply(); });
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hov = key(b); apply(); } });
    b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hov = null; apply(); } });
    b.addEventListener('focus', () => { if (b.matches(':focus-visible')) { hov = key(b); apply(); } });
    b.addEventListener('blur', () => { hov = null; apply(); });
  });
})();
function drawMapDots() {
  const g = mapCv.getContext('2d');
  const DP = mapCv.width / mapEl.clientWidth;
  g.setTransform(DP, 0, 0, DP, 0, 0);
  g.clearRect(0, 0, mapCv.width, mapCv.height);
  const wave = mapAnim * 1.35;
  for (const d of mapDots) {
    const k = clamp((wave - d.d) / 0.35);
    if (k <= 0) continue;
    let a, r, c;
    if (d.t === 2) { a = 0.92; r = mapR * 1.4; c = '140,200,240'; }
    else if (d.t === 1) { a = 0.4; r = mapR * 1.05; c = '140,200,240'; }
    else { a = 0.16; r = mapR * 0.9; c = '238,242,246'; }
    g.fillStyle = `rgba(${c},${a * k})`;
    g.beginPath(); g.arc(d.x, d.y, r * (0.4 + 0.6 * k), 0, Math.PI * 2); g.fill();
  }
}
function startMap() {
  if (mapStarted) return; mapStarted = true;
  mapBox.classList.add('is-on');
  if (reduced) { mapAnim = 1; drawMapDots(); return; }
  const t0 = performance.now();
  const tick = (now) => { mapAnim = clamp((now - t0) / 1600); drawMapDots(); if (mapAnim < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
loadGeo().then(() => {
  buildMap();
  new IntersectionObserver(([e]) => { if (e.isIntersecting) startMap(); }, { threshold: 0.25 }).observe(mapEl);
}).catch((e) => console.warn('[c] map data unavailable', e));

/* ================= 04 FOR THE BUYER: load calculator + reefer plan (top view, 33 EUR places) ================= */
const MIN = 200, TRUCK_KG = 20000, TRUCK_PAL = 33, PAL_Y = 3;
const bySlug = Object.fromEntries(P.map((p) => [p.s, p]));
const calc = { pack: 25, kg: 6000, rows: [], truck: 0 };
const numIn = (inp, set) => inp.addEventListener('input', () => { // digits only, grouped, caret kept from the right
  const caret = inp.value.length - inp.selectionStart;
  const v = Math.min(parseInt(inp.value.replace(/\D/g, ''), 10) || 0, 999999);
  inp.value = v ? fmt(v) : '';
  const pos = Math.max(0, inp.value.length - caret);
  inp.setSelectionRange(pos, pos);
  set(v); renderCalc();
});
numIn($('[data-c-kg]'), (v) => { calc.kg = v; });
$$('[data-c-pack] input').forEach((r) => r.addEventListener('change', () => { calc.pack = +r.value; renderCalc(); }));

// mixed load: extra rows «product + kg», summed with the main volume
const rowsEl = $('[data-c-rows]'), addBtn = $('[data-c-add]');
function renderRows() {
  rowsEl.innerHTML = calc.rows.map((r, i) => `<div class="bcalc__row" data-row="${i}">
      <select aria-label="Позиция ${i + 2}" data-row-s>${P.map((p) => `<option value="${p.s}"${p.s === r.s ? ' selected' : ''}>${p.n}</option>`).join('')}</select>
      <span class="bcalc__rf"><input type="text" inputmode="numeric" autocomplete="off" aria-label="Объём, кг" value="${r.kg ? fmt(r.kg) : ''}" data-row-kg><span>кг</span></span>
      <button type="button" aria-label="Убрать позицию" data-row-x>×</button>
    </div>`).join('');
  $$('[data-row-kg]', rowsEl).forEach((inp) => numIn(inp, (v) => { calc.rows[+inp.closest('[data-row]').dataset.row].kg = v; }));
  addBtn.disabled = calc.rows.length >= 5;
}
rowsEl.addEventListener('change', (e) => {
  const sel = e.target.closest('[data-row-s]');
  if (sel) calc.rows[+sel.closest('[data-row]').dataset.row].s = sel.value;
});
rowsEl.addEventListener('click', (e) => {
  const x = e.target.closest('[data-row-x]'); if (!x) return;
  calc.rows.splice(+x.closest('[data-row]').dataset.row, 1);
  renderRows(); renderCalc();
  (rowsEl.querySelector('[data-row-x]') || addBtn).focus({ preventScroll: true });
});
addBtn.addEventListener('click', () => {
  const free = P.find((p) => !calc.rows.some((r) => r.s === p.s)) || P[0];
  calc.rows.push({ s: free.s, kg: 1000 }); renderRows(); renderCalc();
  $$('[data-row-kg]', rowsEl).at(-1)?.focus({ preventScroll: true });
});

function compute() {
  const size = calc.pack, perPal = size === 25 ? 40 : 80, palKg = perPal * size;
  const parts = [{ kg: calc.kg }, ...calc.rows].filter((r) => r.kg > 0) // positions are not mixed on one pallet
    .map((r) => { const units = Math.ceil(r.kg / size); return { ...r, units, pal: Math.ceil(units / perPal) }; });
  const kg = parts.reduce((a, r) => a + r.kg, 0), units = parts.reduce((a, r) => a + r.units, 0), pallets = parts.reduce((a, r) => a + r.pal, 0);
  const palLimit = Math.min(TRUCK_PAL, Math.floor(TRUCK_KG / palKg)); // 20 t caps the 33 places: 20 bag / 25 box pallets
  const trucks = Math.max(1, Math.ceil(pallets / palLimit));
  const load = []; // truck 1 is filled to the limit, the remainder goes to the next one
  for (let t = 0, pLeft = pallets, kLeft = kg; t < trucks; t++) {
    const pal = Math.min(palLimit, pLeft), m = Math.min(kLeft, pal * palKg);
    const byMass = m / TRUCK_KG, byPal = pal / TRUCK_PAL;
    load.push({ pal, pct: Math.max(1, Math.round(Math.max(byMass, byPal) * 100)), massBound: byMass >= byPal });
    pLeft -= pal; kLeft -= m;
  }
  return { size, perPal, palKg, parts, kg, units, pallets, palLimit, trucks, load };
}
const pl = (n, f) => `${fmt(n)}${NB}${plural(n, f)}`;
const F_UNIT = { 25: ['мешок', 'мешка', 'мешков'], 10: ['коробка', 'коробки', 'коробок'] }, F_PAL = ['паллета', 'паллеты', 'паллет'], F_TR = ['рефрижератор', 'рефрижератора', 'рефрижераторов'];
const eqText = (c) => `${pl(c.units, F_UNIT[c.size])} · ${pl(c.pallets, F_PAL)} · ${c.trucks > 1 ? pl(c.trucks, F_TR) : `${c.load[0].pct}${NB}% рефрижератора`}`;
const kgText = (c) => (calc.rows.length
  ? `${[calc.kg ? `${fmt(calc.kg)}${NB}кг` : '', ...calc.rows.filter((r) => r.kg).map((r) => `${bySlug[r.s].n} ${fmt(r.kg)}${NB}кг`)].filter(Boolean).join(' + ')} (итого ${fmt(c.kg)}${NB}кг)`
  : `${fmt(c.kg)}${NB}кг`);

// deck: 11 rows along × 3 across, filled from the front wall (reefer unit) to the doors
const deck = $('[data-deck]');
deck.innerHTML = Array.from({ length: TRUCK_PAL }, (_, i) => {
  const x = 280 + Math.floor(i / PAL_Y) * 120, y = 60 + (i % PAL_Y) * 80;
  return `<rect x="${x + 4}" y="${y + 4}" width="112" height="72"/>`;
}).join('');
const cells = $$('rect', deck);
let shown = 0, target = 0, stepT = 0, seen = reduced || QA;
const setCells = () => cells.forEach((r, i) => r.classList.toggle('on', i < shown));
function paint() {
  clearTimeout(stepT);
  if (!seen) return;
  if (reduced) { shown = target; setCells(); return; }
  const step = () => {
    if (shown === target) return;
    shown += shown < target ? 1 : -1; setCells();
    stepT = setTimeout(step, 25);
  };
  step();
}
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { seen = true; o.disconnect(); paint(); } }, { threshold: 0.35 }).observe($('[data-r-svg]'));

function renderCalc() {
  const c = compute(), low = c.kg < MIN;
  calc.truck = Math.min(calc.truck, c.trucks - 1);
  const t = c.load[calc.truck], by = t.massBound ? 'по&nbsp;массе' : 'по&nbsp;местам';
  const eq = (n, f) => `<span><b>${fmt(n)}</b>${NB}${plural(n, f)}</span>`;
  $('[data-r-eq]').innerHTML = low
    ? `<span class="bcalc__warn">Минимальная партия&nbsp;— 200&nbsp;кг</span>`
    : `${eq(c.units, F_UNIT[c.size])} <i>·</i> ${eq(c.pallets, F_PAL)} <i>·</i> ${c.trucks > 1 ? eq(c.trucks, F_TR) : `<span><b>${t.pct}${NB}%</b>${NB}рефрижератора</span>`}`;
  const sum = $('[data-c-sum]');
  sum.hidden = !calc.rows.length;
  sum.innerHTML = `итого <b>${fmt(c.kg)}</b>${NB}кг · ${pl(c.parts.length, ['позиция', 'позиции', 'позиций'])}`;
  $('[data-r-pct]').innerHTML = `${low ? 0 : t.pct}<u>%</u>`;
  $('[data-r-pct-d]').innerHTML = c.trucks > 1 ? `загрузка машины ${calc.truck + 1} из&nbsp;${c.trucks}<br>${by}` : `загрузка рефрижератора<br>${by}`;
  $('[data-r-truck]').textContent = c.trucks > 1 ? `План загрузки · ${pl(c.trucks, F_TR)}` : 'План загрузки · вид сверху';
  $('[data-r-nav]').hidden = c.trucks < 2;
  $('[data-r-nav-t]').textContent = `машина ${calc.truck + 1} / ${c.trucks}`;
  $('[data-r-prev]').disabled = calc.truck === 0;
  $('[data-r-next]').disabled = calc.truck >= c.trucks - 1;
  cells.forEach((r, i) => r.classList.toggle('lim', i >= c.palLimit));
  $('[data-r-lg-on]').textContent = `${low ? 0 : t.pal} из ${TRUCK_PAL} мест`;
  $('[data-r-lg-lim]').hidden = c.palLimit >= TRUCK_PAL;
  $('[data-r-lg-lim-t]').innerHTML = `лимит 20&nbsp;т (${fmt(c.palKg)}&nbsp;кг на&nbsp;паллете)`;
  $('[data-c-cta]').disabled = low;
  target = low ? 0 : t.pal; paint();
}
$('[data-r-prev]').addEventListener('click', () => { calc.truck--; renderCalc(); });
$('[data-r-next]').addEventListener('click', () => { calc.truck++; renderCalc(); });
renderRows(); renderCalc();

/* ================= SCROLL: native only. Menu anchors = CSS scroll-behavior + scroll-margin-top ================= */
const scrollToEl = (el, off = 64) => scrollTo({ top: el.getBoundingClientRect().top + scrollY - off, behavior: reduced ? 'auto' : 'smooth' });
{
  const root = document.documentElement;
  let t = 0;
  const off = () => { clearTimeout(t); root.classList.remove('is-anchor'); };
  document.addEventListener('click', (e) => { // native smooth jump for in-page anchors (scroll-margin-top handles the header)
    const a = e.target.closest('a[href^="#"]');
    if (!a || reduced || e.defaultPrevented) return;
    root.classList.add('is-anchor');
    clearTimeout(t); t = setTimeout(off, 1500);
  });
  addEventListener('scrollend', off);
  addEventListener('wheel', off, { passive: true });
  addEventListener('touchstart', off, { passive: true });
}

/* ================= 05 FORM: имя → канал → контакт ================= */
const form = $('[data-form]');
const contactIn = $('[data-contact]', form), contactBox = contactIn.closest('.in');
const nameIn = $('[data-name]', form), nameBox = nameIn.closest('.in');
const toForm = () => { scrollToEl($('.cta__f'), 110); setTimeout(() => nameIn.focus({ preventScroll: true }), 700); };

// контакт: тип поля, подпись и мягкая проверка зависят от выбранного канала
const nDigits = (v) => v.replace(/\D/g, '').length;
const isPhone = (v) => /^[+\d\s()\-.]+$/.test(v.trim()) && nDigits(v) >= 9 && nDigits(v) <= 15;
const CH = {
  telegram: { n: 'Telegram', label: 'Номер или @username в Telegram', ph: '@username или +375 29 123-45-67', type: 'text', mode: 'text', ac: 'off', err: 'Укажите @username (от 4 символов) или номер телефона',
    ok: (v) => /^@?[A-Za-z][A-Za-z0-9_]{3,31}$/.test(v.trim().replace(/^(https?:\/\/)?t\.me\//i, '')) || isPhone(v) },
  viber: { n: 'Viber', label: 'Номер Viber', ph: '+375 29 123-45-67', type: 'tel', mode: 'tel', ac: 'tel', err: 'Укажите номер — минимум 9 цифр', ok: isPhone },
  whatsapp: { n: 'WhatsApp', label: 'Номер WhatsApp', ph: '+375 29 123-45-67', type: 'tel', mode: 'tel', ac: 'tel', err: 'Укажите номер — минимум 9 цифр', ok: isPhone },
  phone: { n: 'Звонок', label: 'Телефон', ph: '+375 29 123-45-67', type: 'tel', mode: 'tel', ac: 'tel', err: 'Укажите номер — минимум 9 цифр', ok: isPhone },
  email: { n: 'E-mail', label: 'E-mail', ph: 'name@company.by', type: 'email', mode: 'email', ac: 'email', err: 'Проверьте адрес, например name@company.by', ok: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) },
};
const OK_TEXT = { telegram: 'Менеджер свяжется с вами в Telegram.', viber: 'Менеджер свяжется с вами в Viber.', whatsapp: 'Менеджер свяжется с вами в WhatsApp.', phone: 'Менеджер позвонит вам.', email: 'Менеджер свяжется с вами по e-mail.' };
const channel = () => form.elements.channel.value;
function applyChannel() {
  const c = CH[channel()];
  if ((contactIn.type === 'email') !== (c.type === 'email')) contactIn.value = ''; // e-mail и номер несовместимы
  contactIn.type = c.type; contactIn.inputMode = c.mode; contactIn.autocomplete = c.ac; contactIn.placeholder = c.ph;
  $('[data-c-lbl]', form).textContent = `${c.label} *`;
  $('[data-c-err]', form).textContent = c.err;
  contactBox.classList.remove('is-err');
}
$$('[data-channels] input', form).forEach((r) => r.addEventListener('change', applyChannel));
applyChannel();
nameIn.addEventListener('input', () => { if (nameIn.value.trim()) nameBox.classList.remove('is-err'); });
contactIn.addEventListener('input', () => { if (contactBox.classList.contains('is-err') && CH[channel()].ok(contactIn.value)) contactBox.classList.remove('is-err'); });

// перенос из калькулятора (#buyer): расчёт → скрытое поле + чип
const calcIn = $('[data-calc]', form), calcChip = $('[data-calc-chip]', form);
const setCalc = (t) => { calcIn.value = t; calcChip.hidden = !t; $('[data-calc-t]', form).textContent = t ? `Ваш расчёт: ${t}` : ''; };
$('[data-calc-x]', form).addEventListener('click', () => setCalc(''));
$('[data-c-cta]').addEventListener('click', () => {
  const c = compute();
  setCalc(`${kgText(c)} · ${c.size === 25 ? 'мешок 25 кг' : 'коробка 10 кг'} = ${eqText(c)}`);
  toForm();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ch = channel(), c = CH[ch];
  const nameOk = nameIn.value.trim().length > 0, contactOk = c.ok(contactIn.value);
  nameBox.classList.toggle('is-err', !nameOk); contactBox.classList.toggle('is-err', !contactOk);
  if (!nameOk) { nameIn.focus(); return; }
  if (!contactOk) { contactIn.focus(); return; }
  const payload = { name: nameIn.value.trim(), channel: ch, contact: contactIn.value.trim() };
  if (calcIn.value) payload.calc = calcIn.value;
  const btn = $('[data-f-btn]'), lab = $('[data-f-label]');
  btn.disabled = true; lab.textContent = 'Отправка…';
  const done = () => { setCalc(''); $('[data-ok-t]').textContent = OK_TEXT[ch]; $('[data-form-ok]').hidden = false; btn.disabled = false; lab.textContent = 'Получить прайс'; };
  if (form.dataset.endpoint) { // боевой режим: <form data-endpoint="…"> → POST JSON; в макете атрибута нет
    fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(done, () => { // mailto-фолбэк
      location.href = `mailto:contact@alantorg.by?subject=${encodeURIComponent('Запрос прайса')}&body=${encodeURIComponent(Object.entries(payload).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join('\n'))}`;
      done();
    });
  } else { console.info('[c] form payload (mock, not sent)', payload); setTimeout(done, reduced ? 0 : 650); }
});

/* ================= MAGNETIC CTA ================= */
if (finePtr && !reduced) {
  const mags = $$('[data-magnet]');
  let mx = 0, my = 0, queued = false;
  const R = 70;
  const step = () => {
    queued = false;
    for (const b of mags) {
      const r = b.getBoundingClientRect();
      if (!r.width) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = mx - cx, dy = my - cy;
      const inside = Math.abs(dx) < r.width / 2 + R && Math.abs(dy) < r.height / 2 + R;
      if (inside) { b.classList.add('is-mag'); b.style.setProperty('--mx', `${(dx * 0.18).toFixed(1)}px`); b.style.setProperty('--my', `${(dy * 0.28).toFixed(1)}px`); }
      else if (b.classList.contains('is-mag')) { b.classList.remove('is-mag'); b.style.removeProperty('--mx'); b.style.removeProperty('--my'); }
    }
  };
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!queued) { queued = true; requestAnimationFrame(step); } }, { passive: true });
}

/* ================= STUB LINKS ================= */
const toast = $('[data-toast]');
let toastT = 0;
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-stub]'); if (!a) return;
  e.preventDefault();
  toast.textContent = `Страница ${a.getAttribute('href')} — в разработке`;
  toast.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (toast.hidden = true), 2400);
});

/* ================= REVEALS: masks / 24px shift, expo out ================= */
if (document.documentElement.classList.contains('rvon')) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in'); io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv, .rv-mask, .rv-line').forEach((el) => io.observe(el));
  // footer crystal: the dendrite crystallises when the footer comes into view
  const fg = $('[data-crystal="ftr"]');
  fg.style.setProperty('--f', '0');
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return; o.disconnect();
    const t0 = performance.now();
    const tick = (now) => { const k = clamp((now - t0) / 2200); fg.style.setProperty('--f', (1 - Math.pow(1 - k, 4)).toFixed(3)); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: 0.2 }).observe(fg.parentElement);
}

let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(buildMap, 150); });

/* ================= contacts: map on demand ================= */
{
  const btn = document.querySelector('[data-route-show]'), box = document.querySelector('[data-route-map]');
  if (btn && box) btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    box.hidden = !open;
    if (open && !box.firstChild) {
      const f = document.createElement('iframe');
      f.src = box.dataset.src; f.title = 'Аланторг на карте'; f.loading = 'lazy'; f.allowFullscreen = true;
      box.append(f);
    }
  });
}
