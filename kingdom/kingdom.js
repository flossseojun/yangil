// 양일 캠퍼스: 진짜 학교처럼 본관 · 운동장 · 은행나무길 · 다목적관 · 매점 등이 제자리에 있고,
// 시설을 레벨업하고, 꾸미기를 놓고, 친구 의뢰를 들어주며 캠퍼스를 키운다.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeChibi } from './chibi3d.js';
import { shot } from './chibishot.js';

const N = 24;                       // 부지 크기 (N×N 칸)
const SAVE = 'yangil.kingdom.v1';
const $ = id => document.getElementById(id);
const RES_NAME = { know: '지식', snack: '간식', power: '체력' };
const INK = '#231c17';

/* ───────── 시설: 처음부터 제자리에 있고 레벨업한다 (0 = 공사 전) ───────── */
// at [x, z], size [가로, 세로], prod [자원, 레벨당 양, 초], w 비용 비중 [지식, 간식, 체력]
const FAC = {
  main:    { name: '본관', at: [7, 1], size: [10, 4], prod: ['know', 6, 20], w: [1.2, .6, .4], wall: '#f3ead6', roof: '#2b4a3c', desc: '교실이 모인 학교의 중심. 다른 시설은 본관 레벨까지만 올릴 수 있어요' },
  lab:     { name: '과학실', at: [1, 1], size: [5, 4], prod: ['know', 5, 25], w: [1, .6, .2], wall: '#dff1f7', roof: '#3f7fb8', desc: '별관 과학실. 실험하다 가끔 연기가 나요' },
  library: { name: '도서관', at: [18, 1], size: [5, 4], prod: ['know', 9, 40], w: [1.1, .3, .5], wall: '#f5e9dc', roof: '#8a5a34', desc: '조용히 공부하는 곳' },
  club:    { name: '동아리실', at: [1, 7], size: [4, 4], w: [.9, .8, .4], wall: '#fff3c4', roof: '#2f8f6b', recruit: true, desc: '새 친구를 모집하는 곳. 레벨이 오를수록 더 많이 모을 수 있어요' },
  store:   { name: '매점', at: [15, 7], size: [3, 3], prod: ['snack', 4, 15], w: [.8, .3, 0], wall: '#ffe2b8', roof: '#e0573b', desc: '쉬는 시간마다 붐비는 매점' },
  cafe:    { name: '급식실', at: [19, 7], size: [4, 4], prod: ['snack', 7, 30], w: [.9, .5, .3], wall: '#fde6d8', roof: '#c9643c', desc: '오늘 메뉴는 뭘까' },
  field:   { name: '운동장', at: [1, 13], size: [9, 10], prod: ['power', 4, 20], w: [.6, .6, .3], ground: true, desc: '체육 시간과 점심시간의 운동장' },
  gym:     { name: '다목적관', at: [15, 13], size: [8, 6], prod: ['power', 6, 25], w: [1, .7, .5], wall: '#e8e2f5', roof: '#6c4fd1', arch: true, desc: '체육관 겸 강당. 큰 LED 스크린이 있어요' },
};
// 넓힐 수 있는 구역의 시설
Object.assign(FAC, {
  comp:       { zone: 'east', name: '컴퓨터실', at: [25, 2], size: [5, 4], prod: ['know', 8, 30], w: [1.1, .5, .3], wall: '#e3ecf7', roof: '#3a4a6a', desc: '소나 부원들이 코딩하고 게임을 만드는 곳' },
  broadcast:  { zone: 'east', name: '방송실', at: [31, 2], size: [4, 4], prod: ['power', 5, 20], w: [.8, .6, .4], wall: '#fbe9e9', roof: '#b8323a', desc: '아침마다 방송이 흘러나오는 곳' },
  health:     { zone: 'east', name: '보건실', at: [25, 9], size: [4, 3], prod: ['snack', 5, 20], w: [.8, .7, .3], wall: '#f4fbf6', roof: '#3fa26a', desc: '메디하트가 지키는 보건실' },
  farm:       { zone: 'back', name: '텃밭', at: [2, -10], size: [7, 6], prod: ['snack', 6, 25], w: [.6, .8, .3], ground: true, desc: '시드핸즈가 가꾸는 학교 텃밭' },
  greenhouse: { zone: 'back', name: '온실', at: [11, -10], size: [4, 4], prod: ['know', 6, 30], w: [.9, .6, .3], wall: '#d8f0e2', roof: '#8fd0a8', desc: '사계절 초록인 유리 온실' },
  pavilion:   { zone: 'back', name: '정자', at: [18, -9], size: [3, 3], prod: ['power', 4, 20], w: [.7, .5, .4], desc: '뒷동산 산책로 끝 쉼터' },
  dorm:       { zone: 'west', name: '기숙사', at: [-11, 2], size: [6, 5], prod: ['snack', 8, 35], w: [1, .8, .5], wall: '#efe6f5', roof: '#6a4a8a', desc: '밤에도 불이 꺼지지 않는 기숙사' },
  pool:       { zone: 'west', name: '수영장', at: [-11, 10], size: [8, 6], prod: ['power', 8, 30], w: [.9, .7, .6], ground: true, desc: '여름엔 제일 인기 많은 곳' },
  hall:       { zone: 'west', name: '강당', at: [-11, 18], size: [8, 5], prod: ['know', 10, 40], w: [1.1, .7, .6], wall: '#f3ead6', roof: '#2b4a3c', arch: true, desc: '입학식 · 졸업식 · 축제가 열리는 곳' },
});
const FAC_ORDER = ['main', 'store', 'field', 'lab', 'library', 'club', 'cafe', 'gym', 'comp', 'broadcast', 'health', 'farm', 'greenhouse', 'pavilion', 'dorm', 'pool', 'hall'];
// 구역: 재건 정도 · 보스 진행 · 자원으로 연다
const ZONES = {
  core: { name: '본교', x0: 0, z0: 0, x1: 24, z1: 24 },
  east: { name: '별관 구역', x0: 24, z0: 0, x1: 36, z1: 24, need: { restore: .12 }, cost: { know: 120, snack: 80, power: 20 } },
  back: { name: '뒷동산', x0: 0, z0: -12, x1: 24, z1: 0, need: { restore: .22, ch: 2 }, cost: { know: 220, snack: 160, power: 60 } },
  west: { name: '기숙사 구역', x0: -12, z0: 0, x1: 0, z1: 24, need: { restore: .36, ch: 3 }, cost: { know: 360, snack: 260, power: 120 } },
};
const ZONE_ORDER = ['core', 'east', 'back', 'west'];
const MAX_LV = 5;
const upCostOf = (t, L) => { const [a, b, c] = FAC[t].w, k = Math.pow(L, 1.7); return { know: Math.round(14 * k * a), snack: Math.round(9 * k * b), power: Math.round(6 * Math.pow(Math.max(0, L - 1), 1.7) * c) }; };
const PATH_X = [11, 12];                                      // 은행나무길 (정문 → 본관)
const isPath = (x, z) => (PATH_X.includes(x) && z >= 5) || (z >= 5 && z <= 6 && x >= 7 && x <= 16);

/* ───────── 꾸미기 (자유롭게 놓기) ───────── */
const DECO = {
  ginkgo:   { name: '은행나무', size: [1, 1], cost: { snack: 4 } },
  bench:    { name: '벤치', size: [1, 1], cost: { snack: 2 } },
  flower:   { name: '화단', size: [1, 1], cost: { snack: 3 } },
  planter:  { name: '화분', size: [1, 1], cost: { snack: 2 } },
  lamp:     { name: '가로등', size: [1, 1], cost: { know: 4, snack: 2 } },
  vending:  { name: '자판기', size: [1, 1], cost: { know: 6, snack: 4 } },
  fountain: { name: '분수', size: [2, 2], cost: { know: 20, snack: 15 } },
};
const DECO_ORDER = ['ginkgo', 'bench', 'flower', 'planter', 'lamp', 'vending', 'fountain'];
const LINES = ['오늘 캠퍼스 분위기 좋다!', '매점 가자!', '은행나무길 걷는 거 좋아.', '오늘도 양일고 파이팅!', '나 여기서 낮잠 자도 돼?', '캠퍼스 점점 멋있어진다.'];

/* ───────── 저장 ───────── */
let G;
function fresh() {
  const others = ROSTER.filter(f => f.id !== 'seojun').sort(() => Math.random() - .5);
  return { res: { know: 40, snack: 20, power: 5 }, fac: {}, facAt: {}, b: [], friends: ['seojun', ...others.slice(0, 4).map(f => f.id)], stat: {}, req: [], story: {} };
}
function migrate(g) {
  if (g.fac) return g;
  const cnt = {}; (g.b || []).forEach(x => { cnt[x.t] = (cnt[x.t] || 0) + 1; });
  g.fac = { main: 1, store: 1, field: 1, lab: Math.min(3, cnt.lab || 0), gym: Math.min(3, cnt.gym || 0), library: Math.min(3, cnt.library || 0), club: Math.min(3, cnt.club || 0), cafe: 0 };
  g.fac.main = Math.max(1, ...Object.values(g.fac));
  g.facAt = {}; g.b = []; g.stat = g.stat || {}; g.req = [];   // 예전 자리 배치는 새 학교 배치와 겹쳐서 꾸미기는 비운다
  g.res.snack = (g.res.snack || 0) + 20;                       // 그 대신 간식을 조금 돌려준다
  return g;
}
function load() { try { const g = JSON.parse(localStorage.getItem(SAVE)); if (g && g.res) return migrate(g); } catch (e) {} return fresh(); }
function save() { if (window.__noSave) return; try { localStorage.setItem(SAVE, JSON.stringify(G)); } catch (e) {} }
G = load(); G.zones = G.zones || {}; G.story = G.story || {}; G.stat = G.stat || {}; G.req = G.req || []; G.facAt = G.facAt || {}; G.b = G.b || [];
const zoneOpen = z => !z || z === 'core' || !!G.zones[z];
const facOpen = t => zoneOpen(FAC[t].zone);
const lvOfFac = t => G.fac[t] || 0;
const inZone = (x, z) => ZONE_ORDER.find(k => { const Z = ZONES[k]; return x >= Z.x0 && x < Z.x1 && z >= Z.z0 && z < Z.z1; });
const allowedCell = (x, z) => { const k = inZone(x, z); return !!k && zoneOpen(k); };
const interior = (x, z) => allowedCell(x, z) && allowedCell(x - 1, z) && allowedCell(x + 1, z) && allowedCell(x, z - 1) && allowedCell(x, z + 1);
const campusLv = () => FAC_ORDER.reduce((a, t) => a + lvOfFac(t), 0);
const restore = () => campusLv() / (FAC_ORDER.length * MAX_LV);   // 재건 정도 0~1
const bump = (k, n = 1) => { G.stat[k] = (G.stat[k] || 0) + n; };
const HOOK = { tick: [], tap: [] };   // notebook.js 같은 덧붙이는 모듈이 쓰는 고리

/* ───────── 장면 ───────── */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfe3f5');
scene.fog = null;

const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 2000);
let camAngle = Math.PI / 4;
const camDist = 400, camH = 340;   // 직교 카메라라 멀리 둬도 크기는 같다 (멀리 볼 때 앞쪽이 잘리지 않게)
const controls = new OrbitControls(camera, canvas);
controls.enableRotate = false; controls.screenSpacePanning = false; controls.enableDamping = true; controls.dampingFactor = .12;
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
controls.minZoom = .1; controls.maxZoom = 3; controls.zoomSpeed = 1.2;
controls.target.set(N / 2, 0, N / 2 + 1);
function placeCamera() { const t = controls.target; camera.position.set(t.x + Math.cos(camAngle) * camDist, camH, t.z + Math.sin(camAngle) * camDist); camera.lookAt(t); controls.update(); }
function resize() { const w = innerWidth, h = innerHeight, a = w / h, view = a < 1 ? 15 : 11.5; camera.left = -view * a; camera.right = view * a; camera.top = view; camera.bottom = -view; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
addEventListener('resize', resize); resize(); camera.zoom = innerWidth / innerHeight < 1 ? 1.15 : 1.05; camera.updateProjectionMatrix(); placeCamera();
controls.addEventListener('change', () => { const t = controls.target, cx = THREE.MathUtils.clamp(t.x, -260, 360), cz = THREE.MathUtils.clamp(t.z, -220, 320); if (cx !== t.x || cz !== t.z) { const dx = cx - t.x, dz = cz - t.z; t.x = cx; t.z = cz; camera.position.x += dx; camera.position.z += dz; } });

scene.add(new THREE.HemisphereLight('#fff7e0', '#7fa86a', 1.15));
const sun = new THREE.DirectionalLight('#fff3d6', 1.7);
sun.position.set(N / 2 + 16, 30, N / 2 - 8); sun.target.position.set(N / 2, 0, N / 2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 }); sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

/* ───────── 재료 ───────── */
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
let grad = null; const gradMap = () => { if (grad) return grad; grad = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true; return grad; };
const MATS = {};
const toon = (c, o = {}) => { const k = c + JSON.stringify(Object.keys(o)) + (o.map ? o.map.uuid : ''); return MATS[k] || (MATS[k] = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: gradMap() }, o))); };
const lineM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const sh = o => { o.castShadow = true; o.receiveShadow = true; return o; };
function mesh(geo, mat, x = 0, y = 0, z = 0, line = 0) { const m = sh(new THREE.Mesh(geo, mat)); m.position.set(x, y, z); if (line) { const o = new THREE.Mesh(geo, lineM); o.scale.setScalar(1 + line); m.add(o); } return m; }
// 움직이지 않는 장식을 재질별로 합쳐 그리기 횟수를 줄인다
function bake(group, keep = new Set()) {
  group.updateMatrixWorld(true); const inv = group.matrixWorld.clone().invert(), buckets = new Map(), dead = [];
  group.traverse(o => { if (!o.isMesh || Array.isArray(o.material) || keep.has(o) || [...keep].some(k => k !== o && isChild(o, k))) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.applyMatrix4(inv.clone().multiply(o.matrixWorld)); const k = o.material.uuid; if (!buckets.has(k)) buckets.set(k, { m: o.material, gs: [] }); buckets.get(k).gs.push(g); dead.push(o); });
  dead.forEach(o => { o.parent && o.parent.remove(o); });
  const prune = o => { [...o.children].forEach(c => { prune(c); if (c.type === 'Group' && !c.children.length && !keep.has(c)) o.remove(c); }); }; prune(group);
  buckets.forEach(({ m, gs }) => { const g = mergeGeometries(gs, false); if (g) { const x = new THREE.Mesh(g, m); x.castShadow = m !== lineM; x.receiveShadow = true; group.add(x); } });
  return group;
}
const isChild = (o, p) => { while (o) { if (o === p) return true; o = o.parent; } return false; };

/* ───────── 땅 · 길 · 담장 · 바깥 동네 ───────── */
const groundTex = canvasTex(N * 32, N * 32, (g, w) => {
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { g.fillStyle = (i + j) % 2 ? '#93d271' : '#8bcb69'; g.fillRect(i * 32, j * 32, 32, 32); }
  for (let k = 0; k < 900; k++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.1)' : 'rgba(40,90,30,.12)'; g.fillRect(Math.random() * w, Math.random() * w, 2, 3); }
  for (let k = 0; k < 70; k++) { g.fillStyle = ['#fff6c0', '#ffd0dc', '#ffffff'][k % 3]; g.beginPath(); g.arc(Math.random() * w, Math.random() * w, 2, 0, 7); g.fill(); }
  // 은행나무길 + 본관 앞 마당 (보도블록)
  const brick = (x, z, ww, hh) => { g.fillStyle = '#e9d9b0'; g.fillRect(x * 32, z * 32, ww * 32, hh * 32); g.strokeStyle = 'rgba(160,130,80,.35)'; g.lineWidth = 1; for (let yy = z * 32; yy < (z + hh) * 32; yy += 8) { g.beginPath(); g.moveTo(x * 32, yy); g.lineTo((x + ww) * 32, yy); g.stroke(); for (let xx = x * 32 + ((yy / 8) % 2) * 8; xx < (x + ww) * 32; xx += 16) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 8); g.stroke(); } } };
  brick(11, 5, 2, N - 5); brick(7, 5, 10, 2);
  g.fillStyle = 'rgba(240,190,40,.5)'; for (let k = 0; k < 160; k++) { g.beginPath(); g.ellipse(11 * 32 + Math.random() * 64, 7 * 32 + Math.random() * (N - 7) * 32, 3, 2, Math.random() * 3, 0, 7); g.fill(); }
});
const ground = new THREE.Mesh(new THREE.BoxGeometry(N, .4, N), [toon('#b9895a'), toon('#b9895a'), new THREE.MeshToonMaterial({ map: groundTex, gradientMap: gradMap() }), toon('#8a6440'), toon('#b9895a'), toon('#b9895a')]);
ground.position.set(N / 2, -.2, N / 2); ground.receiveShadow = true; scene.add(ground);

const outside = new THREE.Group(); scene.add(outside);
/* ───────── 바깥: 양평읍 실제 지도 (OpenStreetMap · yangpyeong.js) ───────── */
const mapLabels = [];
// 양평 복구: 큰 장소는 재건 % 단계에서, 나머지 건물은 학교에서 가까운 곳부터 살아난다
const LANDMARK = { station: [.25, '양평역'], market: [.5, '양평물맑은시장'], hall: [.75, '양평군청'] };
const townU = { uRestore: { value: 0 } };
let townBase = null;
{
  const M = typeof YP_MAP !== 'undefined' ? YP_MAP : { B: [], R: [], RL: [], W: [], WL: [], L: [], P: [] };
  const base = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshToonMaterial({ color: '#b9dca0', gradientMap: gradMap() })); townBase = base; base.rotation.x = -Math.PI / 2; base.position.set(N / 2, -.42, N / 2); base.receiveShadow = true; outside.add(base);
  const shapeOf = f => { const s = new THREE.Shape(); for (let i = 0; i < f.length; i += 2) i ? s.lineTo(f[i], -f[i + 1]) : s.moveTo(f[i], -f[i + 1]); return s; };
  const flatGroup = (list, color, y) => { const geos = list.map(f => { try { const g = new THREE.ShapeGeometry(shapeOf(f)); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; } catch (e) { return null; } }).filter(Boolean); if (!geos.length) return; const g = mergeGeometries(geos.map(x => x.index ? x.toNonIndexed() : x)); const m = new THREE.Mesh(g, toon(color)); m.receiveShadow = true; outside.add(m); };
  const LC = { park: '#8fcf6a', grass: '#a3d684', wood: '#5f9a48', farm: '#d8cf8a', pitch: '#7fbf5a', platform: '#cfc8bb' };
  Object.keys(LC).forEach(k => flatGroup(M.L.filter(l => l[0] === k).map(l => l[1]), LC[k], -.405 + (k === 'platform' ? .02 : 0)));
  flatGroup(M.W, '#6fb8e6', -.4);
  // 길: 칸 단위 폭의 띠 (교차로는 동그라미로 메운다)
  const W = { 3: 2.3, 2: 1.35, 1: .75, 0: .45 }, RC = { 3: '#6b7078', 2: '#8d9198', 1: '#b5b0a6', 0: '#d8c6a0' };
  [0, 1, 2, 3].forEach(cls => {
    const pos = [], w = W[cls] / 2, y = -.395 + cls * .003;
    const quad = (ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w, nz = dx / L * w; pos.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz, ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz); };
    const disc = (x, z) => { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, b = (k + 1) / 8 * Math.PI * 2; pos.push(x, y, z, x + Math.cos(b) * w, y, z + Math.sin(b) * w, x + Math.cos(a) * w, y, z + Math.sin(a) * w); } };
    M.R.filter(r => r[0] === cls).forEach(r => { const p = r[2]; for (let i = 0; i + 3 < p.length; i += 2) quad(p[i], p[i + 1], p[i + 2], p[i + 3]); if (cls >= 1) for (let i = 0; i < p.length; i += 2) disc(p[i], p[i + 1]); });
    if (!pos.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon(RC[cls], { side: THREE.DoubleSide })); m.receiveShadow = true; outside.add(m);
  });
  // 큰길 가운데 노란 선
  { const pos = []; M.R.filter(r => r[0] === 3).forEach(r => { const p = r[2]; for (let i = 0; i + 3 < p.length; i += 2) pos.push(p[i], -.385, p[i + 1], p[i + 2], -.385, p[i + 3]); }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); outside.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#ffd23f' }))); }
  // 철도 (중앙선): 자갈 띠 + 레일
  { const pos = [], w = .55, y = -.39; M.RL.forEach(p => { for (let i = 0; i + 3 < p.length; i += 2) { const ax = p[i], az = p[i + 1], bx = p[i + 2], bz = p[i + 3], dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w, nz = dx / L * w; pos.push(ax + nx, y, az + nz, bx + nx, y, bz + nz, bx - nx, y, bz - nz, ax + nx, y, az + nz, bx - nx, y, bz - nz, ax - nx, y, az - nz); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); outside.add(new THREE.Mesh(g, toon('#9a8a78', { side: THREE.DoubleSide })));
    const lp = []; M.RL.forEach(p => { for (let i = 0; i + 3 < p.length; i += 2) lp.push(p[i], -.37, p[i + 1], p[i + 2], -.37, p[i + 3]); }); const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); outside.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#3a3f4a' }))); }
  // 건물: 실제 윤곽을 층수만큼 올린다 (한 층 ≈ 3m ≈ .66칸)
  { const geos = [], PAL = ['#efe6d6', '#e6dccb', '#f3ece0', '#dcd3c4', '#e9e2d8', '#d9e2e6', '#f0e2d0'];
    const LM = M.P.filter(p => LANDMARK[p[0]]).map(p => [p[2], p[3], LANDMARK[p[0]][0]]);
    let sd = 11; const rnd2 = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const thrOf = f => { let cx = 0, cz = 0; for (let k = 0; k < f.length; k += 2) { cx += f[k]; cz += f[k + 1]; } cx /= f.length / 2; cz /= f.length / 2; const d = Math.hypot(cx - 12, cz - 6); let t = Math.min(.97, .03 + .92 * Math.pow(Math.min(1, d / 300), .8) + rnd2() * .05); LM.forEach(([x, z, th]) => { if (Math.hypot(cx - x, cz - z) < 16) t = Math.min(t, th - .005); }); return t; };
    M.B.forEach(([lv, f], i) => { if (f.length < 6) return; try { const thr = thrOf(f); const g = new THREE.ExtrudeGeometry(shapeOf(f), { depth: Math.max(.6, lv * .66), bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -.4, 0); const ng = g.toNonIndexed(), n = ng.attributes.position.count, col = new THREE.Color(lv >= 8 ? '#f1ead9' : PAL[i % PAL.length]), cols = new Float32Array(n * 3), nrm = ng.attributes.normal; for (let k = 0; k < n; k++) { const top = nrm.getY(k) > .5, c = top ? col.clone().multiplyScalar(lv >= 8 ? .9 : .82).lerp(new THREE.Color(lv >= 8 ? '#8a9aa8' : '#b0705a'), .35) : col; cols.set([c.r, c.g, c.b], k * 3); } ng.setAttribute('color', new THREE.BufferAttribute(cols, 3)); ng.setAttribute('aThr', new THREE.BufferAttribute(new Float32Array(n).fill(thr), 1)); ng.deleteAttribute('uv'); geos.push(ng); g.dispose(); } catch (e) {} });
    if (geos.length) { const g = mergeGeometries(geos); const bm = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradMap() });
      // 무너진 건물: 지붕을 들쭉날쭉 낮추고 잿빛으로 (셰이더에서 처리해서 다시 만들 필요 없음)
      bm.onBeforeCompile = sh2 => {
        sh2.uniforms.uRestore = townU.uRestore;
        sh2.vertexShader = 'attribute float aThr;\nuniform float uRestore;\nvarying float vRuin;\n' + sh2.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat ruin = step(uRestore, aThr);\nfloat hh = 0.12 + 0.3 * fract(sin(dot(position.xz, vec2(12.9898, 78.233))) * 43758.5453);\ntransformed.y = mix(transformed.y, -0.4 + (transformed.y + 0.4) * hh, ruin);\nvRuin = ruin;');
        sh2.fragmentShader = 'varying float vRuin;\n' + sh2.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat gy = dot(diffuseColor.rgb, vec3(0.33));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.58, 0.52) * (0.7 + gy * 0.4), vRuin * 0.85);');
      };
      const m = new THREE.Mesh(g, bm); m.castShadow = true; m.receiveShadow = true; outside.add(m); } }
  // 이름표: 양평역 · 시장 · 남한강 · 군청 · 학교들
  const seen = new Set();
  M.P.forEach(([kind, name, x, z]) => {
    if (seen.has(name) || /상인회|별관|마을회관/.test(name)) return; seen.add(name);
    const big = kind === 'station' || kind === 'market' || kind === 'river';
    const draw = (g, w, h) => { const ruined = LANDMARK[kind] && restore() < LANDMARK[kind][0] - 1e-9, name2 = ruined ? '무너진 ' + name : name; g.clearRect(0, 0, w, h); g.font = `${big ? 40 : 30}px Jua, sans-serif`; const tw = Math.min(w - 16, g.measureText(name2).width + 40); g.fillStyle = ruined ? '#c9c2b4' : kind === 'river' ? '#dff1fb' : kind === 'station' ? '#ffd23f' : kind === 'market' ? '#ffb4a0' : '#fffaf0'; g.beginPath(); g.roundRect((w - tw) / 2, 8, tw, 64, 14); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name2, w / 2, 42); g.beginPath(); g.moveTo(w / 2 - 10, 72); g.lineTo(w / 2, 90); g.lineTo(w / 2 + 10, 72); g.closePath(); g.fillStyle = INK; g.fill(); };
    const t = canvasTex(360, 96, draw); t.userData = { draw };
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); sp.renderOrder = 13; sp.position.set(x, kind === 'river' ? 1 : 6, z); sp.userData.base = big ? 1.35 : 1; sp.userData.lm = !!LANDMARK[kind]; sp.userData.kind = kind; sp.userData.name = name; outside.add(sp); mapLabels.push(sp);
  });
}
// 이름표는 멀리 볼수록 크게 (화면에서 비슷한 크기로)
function refreshTown() {
  const r = restore(); townU.uRestore.value = r;
  if (townBase) townBase.material.color.set('#' + new THREE.Color('#bfae8e').lerp(new THREE.Color('#b9dca0'), Math.min(1, r * 1.6)).getHexString());
  mapLabels.forEach(s => { if (!s.userData.lm) return; const t = s.material.map, c = t.image, g = c.getContext('2d'); t.userData.draw(g, c.width, c.height); t.needsUpdate = true; });
}
function stepLabels() { const k = 1 / camera.zoom; mapLabels.forEach(s => { const b = s.userData.base * 5.2 * k; s.scale.set(b, b * .267, 1); s.visible = camera.zoom < 1.4 || s.userData.base > 1; }); }
// 담장 · 산울타리 · 정문
const fixed = new THREE.Group(); scene.add(fixed);
{
  const fence = toon('#e7e1d2'), hedge = toon('#4f9a45');
  [[5.3, N - .55, 10, .55], [18.7, N - .55, 10, .55]].forEach(([x, z, w, d]) => fixed.add(mesh(new THREE.BoxGeometry(w, .55, d), hedge, x, .28, z)));
  [[10.4], [13.6]].forEach(([x]) => fixed.add(mesh(new THREE.BoxGeometry(.5, 1.6, .5), toon('#d9d2c2'), x, .8, N - .2, .04)));
  // 국기 게양대 · 자전거 거치대 · 본관 앞 화단 · 표지석
  [7.5, 8.5, 15.5, 16.5].forEach(x => fixed.add(mesh(new THREE.CylinderGeometry(.03, .04, 3.2, 6), toon('#c9ccd2'), x, 1.6, 7.5)));
  fixed.add(mesh(new THREE.BoxGeometry(.6, .4, .3), toon('#9aa2aa'), 14.5, .2, N - 2.2, .05));
  for (let i = 0; i < 5; i++) fixed.add(mesh(new THREE.TorusGeometry(.18, .025, 4, 12), toon('#7a8796'), 14.1 + i * .2, .22, N - 2.2));
  [[7.5, 7.6], [16.5, 7.6]].forEach(([x, z]) => { fixed.add(mesh(new THREE.BoxGeometry(2, .25, .9), toon('#a5774b'), x, .12, z, .04)); ['#ff6b8b', '#ffd23f', '#ff9a3c', '#c86bff', '#ffffff'].forEach((c, i) => fixed.add(mesh(new THREE.SphereGeometry(.12, 6, 5), toon(c), x - .7 + i * .35, .32, z + (i % 2 ? .15 : -.15)))); });
  const stoneT = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#c9c2b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b4a3c'; g.font = '34px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('양일', w / 2, 44); });
  const stone = mesh(new THREE.BoxGeometry(1.2, .8, .4), [toon('#c9c2b4'), toon('#c9c2b4'), toon('#c9c2b4'), toon('#c9c2b4'), new THREE.MeshToonMaterial({ map: stoneT, gradientMap: gradMap() }), toon('#c9c2b4')], 9.4, .4, N - 2.4, .05); stone.rotation.y = .25; fixed.add(stone);
  bake(fixed);
}
// 국기는 바람에 흔들리게 따로
const flags = [];
[[7.5, '#ffffff'], [8.5, '#2b4a3c'], [15.5, '#ffd23f'], [16.5, '#5b8def']].forEach(([x, c]) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(.7, .45, 6, 1), toon(c, { side: THREE.DoubleSide })); f.geometry.translate(.35, 0, 0); f.position.set(x, 2.95, 7.5); scene.add(f); flags.push(f); });

/* ───────── 재건에 따라 바뀌는 것: 정문 간판 · 은행나무길 · 잡초 ───────── */
const decay = new THREE.Group(); scene.add(decay);
const treesAlive = () => (G.stage || 1) >= 2 || lvOfFac('main') >= 3;   // 은행왕(1-1)을 물리치면 은행나무길이 살아난다
function bareTree(x, z, s = 1) {
  const g = new THREE.Group(), br = toon('#6a4a30');
  g.add(mesh(new THREE.CylinderGeometry(.08 * s, .14 * s, 1.1 * s, 5), br, 0, .55 * s, 0, .06));
  [[.5, .3], [-.6, -.2], [.1, 1.2]].forEach(([a, b], i) => { const m = mesh(new THREE.CylinderGeometry(.025, .05, .7 * s, 4), br, Math.sin(b) * .2, (1 + i * .12) * s, Math.cos(b) * .2, .1); m.rotation.set(a * .8, b, a); g.add(m); });
  g.position.set(x, 0, z); return g;
}
let decayKey = '';
function refreshDecay(force) {
  const alive = treesAlive(), signOk = lvOfFac('main') >= 1, weeds = Math.round(80 * (1 - restore()) * (1 - restore())), key = [alive, signOk, weeds, Object.keys(G.zones).join('')].join();
  if (key === decayKey && !force) return; decayKey = key;
  decay.clear();
  for (let z = 8; z < N - 1; z += 2) [10.5, 13.5].forEach(x => decay.add(alive ? ginkgoTree(x, z, .95 + ((z * 7 + x) % 3) * .08) : bareTree(x, z, .95)));
  const signT = canvasTex(320, 44, (g, w, h) => { g.fillStyle = signOk ? '#2b4a3c' : '#5a5a52'; g.fillRect(0, 0, w, h); g.fillStyle = signOk ? '#ffd23f' : '#b8b0a0'; g.font = '30px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('양일고등학교', w / 2, 33); if (!signOk) { g.strokeStyle = '#2a2420'; g.lineWidth = 3; g.beginPath(); g.moveTo(90, 0); g.lineTo(120, 22); g.lineTo(100, 44); g.moveTo(230, 0); g.lineTo(210, 30); g.stroke(); } });
  const sm = new THREE.MeshToonMaterial({ map: signT, gradientMap: gradMap() }), side = toon(signOk ? '#2b4a3c' : '#5a5a52');
  const sign = mesh(new THREE.BoxGeometry(3.6, .55, .14), [side, side, side, side, sm, sm], 12, signOk ? 1.7 : 1.5, N - .2, .03); if (!signOk) sign.rotation.z = -.12; decay.add(sign);
  let sd = 7; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, wm = toon('#5f9a3e'), wm2 = toon('#7ab04a');
  for (let i = 0, n = 0; n < weeds && i < 900; i++) { const x = -11 + R() * 46, z = -11 + R() * 34, c = Math.floor(x) + ',' + Math.floor(z); if (!interior(Math.floor(x), Math.floor(z)) || FAC_CELLS.has(c) || isPath(Math.floor(x), Math.floor(z))) continue; n++; const tuft = new THREE.Group(); for (let k = 0; k < 3; k++) { const b = mesh(new THREE.ConeGeometry(.06, .25 + R() * .2, 4), k % 2 ? wm : wm2, (R() - .5) * .2, .12, (R() - .5) * .2); b.rotation.z = (R() - .5) * .6; tuft.add(b); } tuft.position.set(x, 0, z); decay.add(tuft); }
  bake(decay);
  if (typeof leafPts !== 'undefined') leafPts.visible = alive;
}
function ginkgoTree(x, z, s = 1) {
  const g = new THREE.Group(), leafM = toon('#f2c12e'), leafM2 = toon('#e8a91c');
  g.add(mesh(new THREE.CylinderGeometry(.1 * s, .15 * s, .8 * s, 6), toon('#7a5233'), 0, .4 * s, 0));
  [[0, 1.15, 0, .5], [.25, .95, .12, .34], [-.24, 1, -.1, .36], [0, 1.5, 0, .32]].forEach(([a, b, c, r], i) => g.add(mesh(new THREE.IcosahedronGeometry(r * s, 0), i % 2 ? leafM2 : leafM, a * s, b * s, c * s, .05)));
  g.position.set(x, 0, z); return g;
}

/* ───────── 시설 모델 ───────── */
function windowTex(wall, cols, rows, door) {
  return canvasTex(cols * 32, rows * 32, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    for (let j = 1; j < rows; j++) { g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(0, j * 32 - 2, w, 3); }
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (door && j === rows - 1 && Math.abs(i - (cols - 1) / 2) < .6) { g.fillStyle = '#6b4a2f'; g.fillRect(i * 32 + 6, j * 32 + 5, 20, 27); g.fillStyle = '#9cc6dd'; g.fillRect(i * 32 + 9, j * 32 + 8, 6, 10); g.fillRect(i * 32 + 17, j * 32 + 8, 6, 10); continue; }
      g.fillStyle = '#ffffff'; g.fillRect(i * 32 + 5, j * 32 + 6, 22, 19);
      g.fillStyle = (i * 7 + j * 3) % 5 === 0 ? '#ffe8a0' : '#86c3e3'; g.fillRect(i * 32 + 7, j * 32 + 8, 18, 15);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(i * 32 + 9, j * 32 + 10, 4, 10);
      g.fillStyle = '#ffffff'; g.fillRect(i * 32 + 15, j * 32 + 8, 2, 15);
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(i * 32 + 4, j * 32 + 25, 24, 2);
    }
  });
}
const signTex = (text, lv, bg = '#2b4a3c') => canvasTex(256, 64, (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#fffaf0'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#fffaf0'; g.font = '30px Jua, sans-serif'; g.textAlign = 'center'; g.fillText(text, w / 2 - (lv ? 22 : 0), 42); for (let i = 0; i < lv; i++) { g.fillStyle = '#ffd23f'; star(g, w - 52 + (i % 3) * 16, 22 + Math.floor(i / 3) * 18, 7); } });
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
const animated = [];   // 연기 · 깃발 · 공처럼 움직이는 것 { obj, kind, t }
function building(d, lv, floors, door = true) {
  const [sx, sz] = d.size, g = new THREE.Group(), fh = .8, h = floors * fh, W = sx - .5, D = sz - .6;
  const front = windowTex(d.wall, Math.max(2, Math.round(W * 1.6)), floors, door), side = windowTex(d.wall, Math.max(2, Math.round(D * 1.6)), floors, false), top = toon(shadeHex(d.wall, -.08));
  g.add(mesh(new THREE.BoxGeometry(W + .2, .25, D + .2), toon('#b8ad98'), 0, .12, 0, .03));
  const mt = t => new THREE.MeshToonMaterial({ map: t, gradientMap: gradMap() });
  g.add(mesh(new THREE.BoxGeometry(W, h, D), [mt(side), mt(side), top, top, mt(front), mt(front)], 0, .25 + h / 2, 0, .025));
  if (!d.arch) { const roofM = toon(d.roof); g.add(mesh(new THREE.BoxGeometry(W + .25, .22, D + .25), roofM, 0, .25 + h + .11, 0, .03)); }
  else { const rr = D / 2 + .1, r = mesh(new THREE.CylinderGeometry(rr, rr, W + .1, 20, 1, false, -Math.PI / 2, Math.PI), toon(d.roof), 0, .25 + h, 0, .02); r.rotation.z = Math.PI / 2; r.scale.y = .42; g.add(r); }
  // 간판 · 현관 차양
  const sign = mesh(new THREE.BoxGeometry(Math.min(W * .6, 3.4), .6, .08), [toon('#2b4a3c'), toon('#2b4a3c'), toon('#2b4a3c'), toon('#2b4a3c'), mt(signTex(d.name, lv)), toon('#2b4a3c')], 0, .25 + Math.min(h, 1.6) + .05, D / 2 + .06, .04); g.add(sign);
  if (door) g.add(mesh(new THREE.BoxGeometry(1.1, .08, .5), toon(d.roof), 0, .25 + .78, D / 2 + .25, .05));
  g.userData.h = .25 + h + (d.arch ? D * .3 : .22); return g;
}
function shadeHex(hex, k) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); }
// 폐허: 무너진 벽 · 깨진 창 · 잔해 · 잡초 (시설마다 모양이 조금씩 다르게)
function construction(d) {
  const [sx, sz] = d.size, g = new THREE.Group(); let seed = 0; for (const ch of d.name) seed = (seed * 31 + ch.charCodeAt(0)) % 9973; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const W = sx - .5, D = sz - .6, wallM = toon('#' + new THREE.Color(d.wall || '#e8e0d0').lerp(new THREE.Color('#9a948a'), .6).getHexString()), dark = toon('#3a3530'), stoneM = toon('#9a9286'), weedM = toon('#5f9a3e'), weedM2 = toon('#7ab04a');
  if (d.ground) {
    g.add(mesh(new THREE.BoxGeometry(sx - .2, .05, sz - .2), toon('#b89a72'), 0, .03, 0));
    for (let i = 0; i < 40; i++) { const x = (R() - .5) * (sx - 1), z = (R() - .5) * (sz - 1); g.add(mesh(new THREE.ConeGeometry(.08 + R() * .08, .25 + R() * .3, 4), R() < .5 ? weedM : weedM2, x, .15, z)); }
    const goal = new THREE.Group(), gm = toon('#c9ccd2'); [-.7, .7].forEach(x => goal.add(mesh(new THREE.CylinderGeometry(.04, .04, .7, 6), gm, x, .35, 0))); const bar = mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 6), gm, 0, .7, 0); bar.rotation.z = Math.PI / 2; goal.add(bar);
    goal.position.set(0, 0, -(sz / 2 - 1.6)); goal.rotation.x = -1.2; g.add(goal);
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.IcosahedronGeometry(.15 + R() * .15, 0), stoneM, (R() - .5) * (sx - 2), .1, (R() - .5) * (sz - 2), .08));
  } else {
    g.add(mesh(new THREE.BoxGeometry(W + .2, .12, D + .2), stoneM, 0, .06, 0, .03));
    // 뒷벽 · 옆벽: 들쭉날쭉 무너진 조각
    const seg = Math.max(3, Math.round(W / .8)), sw = W / seg;
    for (let i = 0; i < seg; i++) { const h = .3 + R() * (R() < .3 ? .4 : 1.6); g.add(mesh(new THREE.BoxGeometry(sw * .96, h, .22), wallM, -W / 2 + sw / 2 + i * sw, .12 + h / 2, -D / 2 + .11, .03)); if (h > 1 && R() < .6) { g.add(mesh(new THREE.BoxGeometry(sw * .5, .35, .02), dark, -W / 2 + sw / 2 + i * sw, .12 + h * .6, -D / 2 + .23)); } }
    const sseg = Math.max(2, Math.round(D / .8)), ss = D / sseg;
    for (let i = 0; i < sseg; i++) { const h = .2 + R() * 1.1; g.add(mesh(new THREE.BoxGeometry(.22, h, ss * .96), wallM, -W / 2 + .11, .12 + h / 2, -D / 2 + ss / 2 + i * ss, .03)); }
    // 판자로 막은 창 · 쓰러진 기둥
    const px = -W / 2 + sw * 1.5; [-.5, .5].forEach(a => { const pl = mesh(new THREE.BoxGeometry(.9, .1, .03), toon('#a57a4a'), px, .9, -D / 2 + .25); pl.rotation.z = a; g.add(pl); });
    const beam = mesh(new THREE.BoxGeometry(Math.min(W * .7, 3), .2, .2), wallM, W * .1, .35, D * .1, .04); beam.rotation.set(.1, .5, .25); g.add(beam);
    for (let i = 0; i < 10; i++) g.add(mesh(new THREE.IcosahedronGeometry(.12 + R() * .2, 0), R() < .5 ? stoneM : wallM, (R() - .3) * W * .8, .15, (R() - .3) * D * .8, .06));
    for (let i = 0; i < 9; i++) g.add(mesh(new THREE.ConeGeometry(.08 + R() * .06, .3 + R() * .3, 4), R() < .5 ? weedM : weedM2, (R() - .5) * W, .25, (R() - .5) * D));
  }
  const pz = d.ground ? (sz / 2 - .6) : D / 2 - .1;
  const sT = canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, 10); c.lineTo(60, 50); c.lineTo(40, 86); c.stroke(); c.fillStyle = INK; c.font = '28px Jua, sans-serif'; c.textAlign = 'center'; c.fillText('무너진 ' + d.name, w / 2, 42); c.fillStyle = '#e5484d'; c.font = '24px Jua, sans-serif'; c.fillText('눌러서 복구하기', w / 2, 78); });
  const board = mesh(new THREE.BoxGeometry(1.8, .7, .06), [toon('#e8dcc0'), toon('#e8dcc0'), toon('#e8dcc0'), toon('#e8dcc0'), new THREE.MeshToonMaterial({ map: sT, gradientMap: gradMap() }), toon('#e8dcc0')], 0, .9, pz, .03); board.rotation.z = .06; g.add(board);
  [-.7, .7].forEach(x => g.add(mesh(new THREE.BoxGeometry(.06, .7, .06), toon('#8a6440'), x, .35, pz - .02)));
  g.userData.h = 1.6; return g;
}
function extrasFor(t, d, lv, g) {
  const [sx, sz] = d.size, W = sx - .5, D = sz - .6, H = g.userData.h, add = (geo, c, x, y, z, line = .05) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  if (t === 'main') {
    add(new THREE.BoxGeometry(1.6, 1.3, 1.4), d.wall, 0, H + .65, -.2, .03);
    add(new THREE.ConeGeometry(1.25, .8, 4), d.roof, 0, H + 1.7, -.2).rotation.y = Math.PI / 4;
    const clock = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshToonMaterial({ gradientMap: gradMap(), map: canvasTex(64, 64, c => { c.fillStyle = lv >= 5 ? '#ffe9a0' : '#fff'; c.beginPath(); c.arc(32, 32, 30, 0, 7); c.fill(); c.strokeStyle = '#2b4a3c'; c.lineWidth = 4; c.stroke(); c.beginPath(); c.moveTo(32, 32); c.lineTo(32, 12); c.moveTo(32, 32); c.lineTo(46, 36); c.stroke(); }) }));
    clock.position.set(0, H + .75, .51); g.add(clock);
    if (lv >= 3) for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(.9, .05, .6), '#3a5a8a', -3.4 + i * 1.1, H + .05, -.6, .1).rotation.x = -.3;   // 옥상 태양광
    if (lv >= 4) [-W / 2 + .8, W / 2 - .8].forEach(x => { add(new THREE.BoxGeometry(.6, .5, .6), '#a5774b', x, H + .25, D / 2 - .5); add(new THREE.IcosahedronGeometry(.4, 0), '#5fae4e', x, H + .75, D / 2 - .5); });
    if (lv >= 2) { const ban = add(new THREE.BoxGeometry(.05, 1.4, .6), '#ffd23f', W / 2 + .03, H * .55, D / 4, .05); ban.rotation.y = 0; }
  }
  if (t === 'store') {
    const aw = new THREE.Group(); for (let i = 0; i < 6; i++) aw.add(mesh(new THREE.BoxGeometry((W) / 6, .06, .7), toon(i % 2 ? '#ffffff' : '#e0573b'), -W / 2 + W / 12 + i * W / 6, 0, 0)); aw.position.set(0, 1.25, D / 2 + .3); aw.rotation.x = .35; g.add(aw);
    if (lv >= 2) [[-.8, D / 2 + 1.1], [.8, D / 2 + 1.1]].forEach(([x, z], i) => { add(new THREE.CylinderGeometry(.3, .3, .05, 12), '#ffffff', x, .55, z); add(new THREE.CylinderGeometry(.04, .04, .55, 6), '#888', x, .27, z, 0); add(new THREE.ConeGeometry(.55, .25, 8), i ? '#5b8def' : '#ffd23f', x, 1.25, z); add(new THREE.CylinderGeometry(.02, .02, .7, 6), '#888', x, .9, z, 0); });
    if (lv >= 3) [-W / 2 - .25, W / 2 + .25].forEach((x, i) => { add(new THREE.BoxGeometry(.45, .9, .4), i ? '#e5484d' : '#5b8def', x, .7, D / 2 - .3); add(new THREE.BoxGeometry(.3, .4, .02), '#dff1f7', x, .8, D / 2 - .09, 0); });
    if (lv >= 4) add(new THREE.BoxGeometry(1.8, .4, .1), '#ffd23f', 0, H + .3, D / 2 - .1);
  }
  if (t === 'lab') {
    add(new THREE.CylinderGeometry(.18, .22, .9, 8), '#9aa2aa', W / 2 - .6, H + .45, -D / 4); animated.push({ kind: 'smoke', at: new THREE.Vector3(W / 2 - .6, H + 1, -D / 4), g, t: 0, every: lv >= 3 ? .5 : .9 });
    if (lv >= 3) { add(new THREE.CylinderGeometry(.6, .6, .3, 16), '#e8eef5', -W / 4, H + .15, 0); add(new THREE.SphereGeometry(.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#cfd8e2', -W / 4, H + .3, 0); }
    if (lv >= 4) { const gh = add(new THREE.BoxGeometry(1.2, .8, 1.4), '#bfe8d0', -W / 2 - .2, .4 + .25, D / 2 - .2, .03); gh.material = toon('#bfe8d0', { transparent: true, opacity: .7 }); }
  }
  if (t === 'library') {
    [-.75, .75].forEach(x => add(new THREE.CylinderGeometry(.12, .14, 1.1, 10), '#fffaf0', x, .25 + .55, D / 2 + .25));
    if (lv >= 3) [[-1.6, D / 2 + .9], [1.6, D / 2 + .9]].forEach(([x, z]) => { add(new THREE.BoxGeometry(.9, .08, .3), '#b07a45', x, .32, z); add(new THREE.BoxGeometry(.9, .25, .05), '#b07a45', x, .5, z - .13); });
    if (lv >= 4) add(new THREE.SphereGeometry(.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#8fc0a8', 0, H, 0);
  }
  if (t === 'club') {
    for (let i = 0; i < 5; i++) { const p = add(new THREE.ConeGeometry(.12, .25, 3), ['#e5484d', '#ffd23f', '#5b8def', '#6cd39a', '#ff9a3c'][i], -W / 2 + .3 + i * (W - .6) / 4, H - .15, D / 2 + .08, .1); p.rotation.x = Math.PI; }
    [[-W / 3, '#ff6b8b'], [W / 3, '#5b8def']].forEach(([x, c]) => add(new THREE.BoxGeometry(.5, .6, .03), c, x, .25 + 1.1, D / 2 + .02, .06));
    if (lv >= 3) add(new THREE.BoxGeometry(1.2, .8, .06), '#a5774b', -W / 2 - .3, .7, D / 2 - .5, .04).rotation.y = Math.PI / 2;
  }
  if (t === 'cafe') {
    add(new THREE.CylinderGeometry(.15, .18, .6, 8), '#b8c0c8', -W / 3, H + .3, 0); animated.push({ kind: 'smoke', at: new THREE.Vector3(-W / 3, H + .7, 0), g, t: .3, every: .8, color: '#ffffff' });
    if (lv >= 2) [[-1, D / 2 + 1], [1, D / 2 + 1]].forEach(([x, z]) => { add(new THREE.BoxGeometry(1, .06, .6), '#ffffff', x, .5, z); [-1, 1].forEach(s => add(new THREE.BoxGeometry(1, .05, .2), '#b07a45', x, .3, z + s * .45)); });
  }
  if (t === 'gym') {
    if (lv >= 2) { const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 112, c => { c.fillStyle = '#0a0a14'; c.fillRect(0, 0, 256, 112); c.fillStyle = '#2df0ff'; c.font = '34px Jua, sans-serif'; c.textAlign = 'center'; c.fillText('양일고 파이팅', 128, 66); }) })); sc.position.set(-W / 4, 2.1, D / 2 + .02); g.add(sc); }
    if (lv >= 3) { add(new THREE.CylinderGeometry(.05, .05, 2, 6), '#888', W / 2 + .6, 1, D / 2 + .5, 0); add(new THREE.BoxGeometry(.6, .45, .04), '#ffffff', W / 2 + .6, 2, D / 2 + .4); add(new THREE.TorusGeometry(.18, .02, 4, 12), '#e5484d', W / 2 + .6, 1.8, D / 2 + .6).rotation.x = Math.PI / 2; }
    if (lv >= 4) [-W / 2 + .3, W / 2 - .3].forEach(x => add(new THREE.BoxGeometry(.3, .2, .2), '#ffe8a0', x, H - .3, D / 2 + .1));
  }
}
function extrasMore(t, d, lv, g) {
  const [sx, sz] = d.size, W = sx - .5, D = sz - .6, H = g.userData.h, add = (geo, c, x, y, z, line = .05) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  if (t === 'comp') { add(new THREE.CylinderGeometry(.03, .03, 1.2, 6), '#9aa2aa', W / 2 - .4, H + .6, -D / 4, 0); add(new THREE.SphereGeometry(.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#e8eef5', -W / 4, H + .05, 0).rotation.x = -.6; if (lv >= 2) { const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .55), new THREE.MeshBasicMaterial({ map: canvasTex(160, 72, c => { c.fillStyle = '#0b2a16'; c.fillRect(0, 0, 160, 72); c.fillStyle = '#5dff8a'; c.font = '26px monospace'; c.fillText('</> 소나', 12, 46); }) })); sc.position.set(W / 4, 1.35, D / 2 + .02); g.add(sc); } }
  if (t === 'broadcast') { add(new THREE.CylinderGeometry(.04, .06, 2.4, 6), '#c9ccd2', 0, H + 1.2, -D / 4, 0); add(new THREE.SphereGeometry(.1, 8, 6), '#e5484d', 0, H + 2.45, -D / 4); [-1, 1].forEach(s2 => { const h = add(new THREE.ConeGeometry(.2, .4, 10, 1, true), '#e8eef5', s2 * .3, H + 1.6, -D / 4 + .1); h.rotation.x = Math.PI / 2; h.rotation.z = s2 * .4; }); if (lv >= 3) add(new THREE.BoxGeometry(.6, .4, .05), '#e5484d', -W / 3, 1.3, D / 2 + .03); }
  if (t === 'health') { const cr = toon('#e5484d'); [[.5, .14], [.14, .5]].forEach(([w, h]) => g.add(mesh(new THREE.BoxGeometry(w, h, .05), cr, W / 3, H - .4, D / 2 + .04, .06))); if (lv >= 3) add(new THREE.BoxGeometry(.8, .5, .5), '#ffffff', -W / 2 - .3, .35, D / 4); }
  if (t === 'greenhouse') { const glass = toon('#bfe8d0', { transparent: true, opacity: .55 }); const roof = mesh(new THREE.CylinderGeometry(D / 2, D / 2, W, 16, 1, false, -Math.PI / 2, Math.PI), glass, 0, H, 0, .02); roof.rotation.z = Math.PI / 2; roof.scale.y = .6; g.add(roof); for (let i = 0; i < 3; i++) add(new THREE.IcosahedronGeometry(.3, 0), '#5fae4e', -W / 3 + i * W / 3, H + .2, 0, 0); }
  if (t === 'dorm') { const fl = Math.round((H - .25) / .8); for (let f = 1; f < fl; f++) for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(.9, .06, .35), '#c9b8d8', -W / 3 + i * W / 3, .25 + f * .8, D / 2 + .17, .03); if (lv >= 3) add(new THREE.BoxGeometry(.05, .5, .9), '#ffd23f', W / 2 + .03, H * .6, 0); }
  if (t === 'hall') { if (lv >= 2) { const b = add(new THREE.BoxGeometry(2.6, .45, .06), '#e5484d', 0, H * .55, D / 2 + .05, .04); } if (lv >= 4) [-W / 2 + .3, W / 2 - .3].forEach(x => add(new THREE.ConeGeometry(.2, .5, 4), '#ffd23f', x, H + .3, D / 2 - .3)); }
}
function fieldModel(d, lv) {
  const [sx, sz] = d.size, g = new THREE.Group();
  const T = canvasTex(sx * 48, sz * 48, (c, w, h) => {
    c.fillStyle = '#c66a46'; c.fillRect(0, 0, w, h);
    const r = (w - 20) / 2; c.fillStyle = '#c66a46';
    c.fillStyle = '#7fbf5a'; c.beginPath(); c.roundRect(24 + 16, 24 + 16, w - 80, h - 80, (w - 80) / 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.roundRect(14 + k * 8, 14 + k * 8, w - 28 - k * 16, h - 28 - k * 16, (w - 28 - k * 16) / 2); c.stroke(); }
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(48, h / 2); c.lineTo(w - 48, h / 2); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 34, 0, 7); c.stroke();
    for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(40, 40 + k * (h - 80) / 4, w - 80, (h - 80) / 8); }
  });
  const f = new THREE.Mesh(new THREE.BoxGeometry(sx - .2, .05, sz - .2), [toon('#a85a3a'), toon('#a85a3a'), new THREE.MeshToonMaterial({ map: T, gradientMap: gradMap() }), toon('#a85a3a'), toon('#a85a3a'), toon('#a85a3a')]);
  f.position.y = .03; f.receiveShadow = true; g.add(f);
  // 골대
  [-1, 1].forEach(s => { const z = s * (sz / 2 - 1.6), gm = toon('#ffffff'); [-.7, .7].forEach(x => g.add(mesh(new THREE.CylinderGeometry(.04, .04, .7, 6), gm, x, .35, z, .15))); const bar = mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 6), gm, 0, .7, z, .15); bar.rotation.z = Math.PI / 2; g.add(bar); });
  if (lv >= 2) for (let r = 0; r < 3; r++) g.add(mesh(new THREE.BoxGeometry(.6, .3 + r * .3, sz - 3), toon(r % 2 ? '#5b8def' : '#7aa8f0'), sx / 2 - .2 + r * .55 - .1, (.3 + r * .3) / 2, 0, .02));
  if (lv >= 3) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.add(mesh(new THREE.CylinderGeometry(.06, .08, 3.4, 6), toon('#9aa2aa'), a * (sx / 2 - .3), 1.7, b * (sz / 2 - .3))); g.add(mesh(new THREE.BoxGeometry(.6, .35, .15), toon('#ffe8a0'), a * (sx / 2 - .3), 3.45, b * (sz / 2 - .3), .06)); });
  if (lv >= 4) { const sb = mesh(new THREE.BoxGeometry(2, 1, .15), toon('#2a2f36'), 0, 2.4, -sz / 2 + .3, .04); g.add(sb); g.add(mesh(new THREE.CylinderGeometry(.06, .06, 1.9, 6), toon('#9aa2aa'), 0, .95, -sz / 2 + .3)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .7), new THREE.MeshBasicMaterial({ map: canvasTex(170, 70, c => { c.fillStyle = '#0a0a14'; c.fillRect(0, 0, 170, 70); c.fillStyle = '#ffd23f'; c.font = '30px Jua, sans-serif'; c.textAlign = 'center'; c.fillText('양일 3 : 0', 85, 46); }) })); sc.position.set(0, 2.4, -sz / 2 + .38); g.add(sc); }
  // 공 하나 (튀어 다님)
  const ball = mesh(new THREE.SphereGeometry(.16, 12, 8), toon('#ffffff'), 0, .2, 1, .1); g.add(ball); animated.push({ kind: 'ball', obj: ball, t: 0 });
  g.userData.h = 1.2; return g;
}
function farmModel(d, lv) {
  const [sx, sz] = d.size, g = new THREE.Group(), add = (geo, c, x, y, z, line = .05) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  add(new THREE.BoxGeometry(sx - .2, .05, sz - .2), '#a5d27a', 0, .03, 0, 0);
  const rows = Math.min(5, 1 + lv), crops = ['#6bc36b', '#e5484d', '#ffd23f', '#8a5ad8', '#ff9a3c'];
  for (let r = 0; r < rows; r++) { const z = -sz / 2 + 1 + r * (sz - 2) / Math.max(1, 4); add(new THREE.BoxGeometry(sx - 1.6, .2, .6), '#7a5233', 0, .1, z, .03); for (let i = 0; i < 6; i++) { const x = -sx / 2 + 1.2 + i * (sx - 2.4) / 5; add(new THREE.SphereGeometry(.17, 8, 6), '#4f9a45', x, .32, z); if (r % 2 === 0 || lv >= 3) add(new THREE.SphereGeometry(.08, 6, 5), crops[(r + i) % crops.length], x + .08, .45, z + .05, .1); } }
  for (let i = 0; i <= 8; i++) { const x = -sx / 2 + .2 + i * (sx - .4) / 8; add(new THREE.BoxGeometry(.06, .45, .06), '#b07a45', x, .22, sz / 2 - .2, 0); }
  add(new THREE.BoxGeometry(sx - .4, .05, .04), '#b07a45', 0, .38, sz / 2 - .2, 0);
  if (lv >= 3) { add(new THREE.CylinderGeometry(.04, .04, 1.4, 6), '#8a6440', sx / 2 - 1, .7, -sz / 2 + .8, 0); add(new THREE.BoxGeometry(.9, .06, .06), '#8a6440', sx / 2 - 1, 1.1, -sz / 2 + .8, 0); add(new THREE.SphereGeometry(.18, 8, 6), '#f2d0a8', sx / 2 - 1, 1.5, -sz / 2 + .8); add(new THREE.ConeGeometry(.3, .25, 8), '#e9c46a', sx / 2 - 1, 1.72, -sz / 2 + .8); }
  if (lv >= 4) add(new THREE.CylinderGeometry(.4, .4, .9, 12), '#5b8def', -sx / 2 + .7, .45, -sz / 2 + .7, .04);
  g.userData.h = 1.4; return g;
}
function poolModel(d, lv) {
  const [sx, sz] = d.size, g = new THREE.Group(), add = (geo, c, x, y, z, line = .05) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  add(new THREE.BoxGeometry(sx - .2, .12, sz - .2), '#e8eef5', 0, .06, 0, .02);
  const water = new THREE.Mesh(new THREE.BoxGeometry(sx - 1.6, .06, sz - 1.8), new THREE.MeshToonMaterial({ color: '#4fb8e8', gradientMap: gradMap() })); water.position.y = .1; g.add(water);
  if (lv >= 2) for (let i = 1; i < 4; i++) add(new THREE.BoxGeometry(sx - 1.6, .04, .05), i % 2 ? '#e5484d' : '#ffffff', 0, .15, -(sz - 1.8) / 2 + i * (sz - 1.8) / 4, 0);
  [-1, 1].forEach(s2 => { add(new THREE.TorusGeometry(.15, .025, 4, 10, Math.PI), '#c9ccd2', s2 * (sx / 2 - 1), .3, -(sz - 1.8) / 2, 0); });
  if (lv >= 3) [-1.6, 0, 1.6].forEach((x, i) => { add(new THREE.BoxGeometry(.5, .08, 1), ['#ffd23f', '#ff6b8b', '#5b8def'][i], x, .2, sz / 2 - .45); });
  if (lv >= 4) { add(new THREE.BoxGeometry(.4, .05, 1.2), '#5b8def', sx / 2 - 1.2, .45, 0, .04); add(new THREE.BoxGeometry(.4, .4, .3), '#c9ccd2', sx / 2 - 1.2, .25, .5, 0); }
  g.userData.h = 1; return g;
}
function pavilionModel(d, lv) {
  const g = new THREE.Group(), add = (geo, c, x, y, z, line = .05) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  add(new THREE.CylinderGeometry(1.25, 1.35, .3, 6), '#c9b48a', 0, .15, 0);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(new THREE.CylinderGeometry(.07, .08, 1.4, 6), '#a5402a', Math.cos(a) * 1.05, 1, Math.sin(a) * 1.05); }
  add(new THREE.ConeGeometry(1.7, .9, 6), lv >= 3 ? '#2f8f6b' : '#3a5a4a', 0, 2.1, 0);
  add(new THREE.SphereGeometry(.12, 8, 6), '#ffd23f', 0, 2.6, 0);
  if (lv >= 2) [[-.5, 0], [.5, 0]].forEach(([x]) => add(new THREE.BoxGeometry(.6, .1, .3), '#b07a45', x, .5, .5));
  if (lv >= 3) for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(.18, .2, .06, 8), '#c9c2b4', 0, .03, 1.6 + i * .5, 0);
  if (lv >= 4) [-1, 1].forEach(sx => { add(new THREE.BoxGeometry(.18, .5, .18), '#c9c2b4', sx * .9, .25, 1.7); add(new THREE.BoxGeometry(.14, .14, .14), '#ffe8a0', sx * .9, .55, 1.7, .1); });
  g.userData.h = 2.6; return g;
}
function makeFacility(t) {
  const d = FAC[t], lv = lvOfFac(t);
  let g;
  if (!lv) g = construction(d);
  else if (t === 'farm') g = farmModel(d, lv);
  else if (t === 'pool') g = poolModel(d, lv);
  else if (t === 'pavilion') g = pavilionModel(d, lv);
  else if (d.ground) g = fieldModel(d, lv);
  else {
    const floors = t === 'main' || t === 'dorm' ? 2 + Math.ceil(lv / 2) : t === 'gym' || t === 'hall' ? 2 + (lv >= 4 ? 1 : 0) : t === 'greenhouse' ? 1 : 1 + Math.floor((lv - 1) / 2) + (t === 'library' || t === 'cafe' ? 1 : 0);
    g = building(d, lv, floors); extrasFor(t, d, lv, g); extrasMore(t, d, lv, g);
  }
  bake(g, new Set(animated.filter(a => a.obj && isChild(a.obj, g)).map(a => a.obj)));
  const [sx, sz] = d.size; g.position.set(d.at[0] + sx / 2, 0, d.at[1] + sz / 2); g.userData.fac = t;
  return g;
}

/* ───────── 꾸미기 모델 ───────── */
function makeDeco(t) {
  const g = new THREE.Group(), add = (geo, c, x, y, z, line = .06) => { const m = mesh(geo, toon(c), x, y, z, line); g.add(m); return m; };
  if (t === 'ginkgo') g.add(ginkgoTree(0, 0, .9));
  else if (t === 'bench') { add(new THREE.BoxGeometry(.8, .07, .3), '#b07a45', 0, .3, 0); add(new THREE.BoxGeometry(.8, .25, .05), '#b07a45', 0, .48, -.13); [-.33, .33].forEach(x => add(new THREE.BoxGeometry(.06, .3, .28), '#555', x, .15, 0, 0)); }
  else if (t === 'flower') { add(new THREE.BoxGeometry(.8, .22, .8), '#a5774b', 0, .11, 0); ['#ff6b8b', '#ffd23f', '#ff9a3c', '#c86bff', '#ff6b8b'].forEach((c, i) => add(new THREE.SphereGeometry(.1, 8, 6), c, -.22 + (i % 3) * .22, .32, i < 3 ? -.15 : .15, .1)); }
  else if (t === 'planter') { add(new THREE.CylinderGeometry(.22, .16, .35, 10), '#c96a3a', 0, .17, 0); add(new THREE.IcosahedronGeometry(.3, 0), '#5fae4e', 0, .55, 0); add(new THREE.SphereGeometry(.07, 6, 5), '#ff6b8b', .12, .7, .15, .1); }
  else if (t === 'lamp') { add(new THREE.CylinderGeometry(.04, .06, 1.6, 6), '#3a3f4a', 0, .8, 0); add(new THREE.SphereGeometry(.16, 10, 8), '#ffe8a0', 0, 1.65, 0); }
  else if (t === 'vending') { add(new THREE.BoxGeometry(.6, 1, .45), '#e5484d', 0, .5, 0); const w = new THREE.Mesh(new THREE.PlaneGeometry(.4, .5), new THREE.MeshBasicMaterial({ map: canvasTex(40, 50, c => { c.fillStyle = '#dff1f7'; c.fillRect(0, 0, 40, 50); ['#5b8def', '#ffd23f', '#6cd39a', '#ff9a3c'].forEach((col, i) => { c.fillStyle = col; c.fillRect(4 + (i % 2) * 18, 6 + Math.floor(i / 2) * 20, 12, 14); }); }) })); w.position.set(0, .62, .23); g.add(w); }
  else if (t === 'fountain') { add(new THREE.CylinderGeometry(.9, .95, .3, 20), '#d9d2c2', 0, .15, 0); const water = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .05, 20), toon('#7fc4e8')); water.position.y = .3; g.add(water); add(new THREE.CylinderGeometry(.12, .16, .7, 10), '#d9d2c2', 0, .5, 0); add(new THREE.SphereGeometry(.18, 10, 8), '#9fd8f0', 0, .95, 0, 0); }
  bake(g); return g;
}
const footprint = b => { const [sx, sz] = DECO[b.t].size; return b.r % 2 ? [sz, sx] : [sx, sz]; };
function cellsOf(b) { const [w, d] = footprint(b), out = []; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push((b.x + i) + ',' + (b.z + j)); return out; }
const FAC_CELLS = new Set(); FAC_ORDER.forEach(t => { const d = FAC[t]; for (let i = 0; i < d.size[0]; i++) for (let j = 0; j < d.size[1]; j++) FAC_CELLS.add((d.at[0] + i) + ',' + (d.at[1] + j)); });
const FIELD_CELLS = new Set(); { const d = FAC.field; for (let i = 0; i < d.size[0]; i++) for (let j = 0; j < d.size[1]; j++) FIELD_CELLS.add((d.at[0] + i) + ',' + (d.at[1] + j)); }
const TREE_CELLS = new Set(); for (let z = 8; z < N - 1; z += 2) [10, 13].forEach(x => TREE_CELLS.add(x + ',' + z));
function decoBlocked(skip) { const s = new Set([...FAC_CELLS, ...TREE_CELLS]); G.b.forEach(b => { if (b !== skip) cellsOf(b).forEach(c => s.add(c)); }); return s; }
function fits(b) { const s = decoBlocked(b); return cellsOf(b).every(c => { const [x, z] = c.split(',').map(Number); return interior(x, z) && !s.has(c) && !isPath(x, z) && !(z >= N - 3 && x >= 9 && x <= 14); }); }
// 친구가 걸을 수 없는 칸 (건물 · 꾸미기, 운동장은 걸을 수 있음)
function walkBlocked() { const s = new Set([...FAC_CELLS].filter(c => !FIELD_CELLS.has(c) || !lvOfFac('field'))); G.b.forEach(b => cellsOf(b).forEach(c => s.add(c))); TREE_CELLS.forEach(c => s.add(c)); return s; }

const world = new THREE.Group(); scene.add(world);
const meshes = new Map();   // key: 시설 id 또는 꾸미기 객체
function addFac(t) { const m = makeFacility(t); world.add(m); meshes.set(t, m); return m; }
function setDecoPos(b, m) { const [w, d] = footprint(b); m.position.set(b.x + w / 2, 0, b.z + d / 2); m.rotation.y = -b.r * Math.PI / 2; }
function addDeco(b) { const m = makeDeco(b.t); setDecoPos(b, m); m.userData.b = b; world.add(m); meshes.set(b, m); return m; }
FAC_ORDER.forEach(t => { if (facOpen(t)) addFac(t); });

/* ───────── 구역: 열린 곳은 잔디 · 담장, 잠긴 곳은 숲 · 자물쇠 ───────── */
const zoneG = {};
const plainGrass = (w, h) => canvasTex(w * 32, h * 32, (g, W, H) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { g.fillStyle = (i + j) % 2 ? '#93d271' : '#8bcb69'; g.fillRect(i * 32, j * 32, 32, 32); } for (let k = 0; k < w * h * 3; k++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.1)' : 'rgba(40,90,30,.12)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 3); } });
const lockTex = name => canvasTex(240, 120, (g, w, h) => { g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(6, 6, w - 12, 82, 16); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.moveTo(w / 2 - 14, 88); g.lineTo(w / 2, 112); g.lineTo(w / 2 + 14, 88); g.closePath(); g.fillStyle = '#fffaf0'; g.fill(); g.stroke(); g.fillStyle = '#ffd23f'; g.fillRect(24, 38, 30, 26); g.lineWidth = 4; g.strokeRect(24, 38, 30, 26); g.beginPath(); g.arc(39, 38, 10, Math.PI, 0); g.stroke(); g.fillStyle = INK; g.font = '30px Jua, sans-serif'; g.textAlign = 'left'; g.fillText(name, 66, 48); g.font = '20px Jua, sans-serif'; g.fillStyle = '#e5484d'; g.fillText('눌러서 넓히기', 66, 74); });
function buildZone(k) {
  if (zoneG[k]) scene.remove(zoneG[k]);
  if (k === 'core') return;
  const Z = ZONES[k], w = Z.x1 - Z.x0, h = Z.z1 - Z.z0, g = new THREE.Group(); g.userData.zone = k;
  const open = zoneOpen(k);
  const top = open ? new THREE.MeshToonMaterial({ map: plainGrass(w, h), gradientMap: gradMap() }) : toon('#6f9a55');
  const gr = new THREE.Mesh(new THREE.BoxGeometry(w, .4, h), [toon('#b9895a'), toon('#b9895a'), top, toon('#8a6440'), toon('#b9895a'), toon('#b9895a')]); gr.position.set(Z.x0 + w / 2, -.2, Z.z0 + h / 2); gr.receiveShadow = true; g.add(gr);
  if (!open) {
    const forest = new THREE.Group(); let sd = k.length * 97 + 13; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const l1 = toon('#4f9a45'), l2 = toon('#3f8a3a'), l3 = toon('#62ad4e'), tr = toon('#6a4a30');
    for (let x = Z.x0 + .8; x < Z.x1; x += 1.6) for (let z = Z.z0 + .8; z < Z.z1; z += 1.6) { if (R() < .25) continue; const sc = .6 + R() * .6, t = new THREE.Group(); t.add(mesh(new THREE.CylinderGeometry(.1, .14, .6, 5), tr, 0, .3, 0)); t.add(mesh(new THREE.IcosahedronGeometry(.7 * sc, 0), [l1, l2, l3][Math.floor(R() * 3)], 0, .7 + .5 * sc, 0, .04)); t.position.set(x + (R() - .5) * .8, 0, z + (R() - .5) * .8); forest.add(t); }
    bake(forest); g.add(forest); g.userData.forest = forest;
    const lk = new THREE.Sprite(new THREE.SpriteMaterial({ map: lockTex(Z.name), depthTest: false })); lk.scale.set(4.8, 2.4, 1); lk.renderOrder = 12; lk.position.set(Z.x0 + w / 2, 3.8, Z.z0 + h / 2); lk.userData.zone = k; g.add(lk); g.userData.lock = lk;
  }
  scene.add(g); zoneG[k] = g;
}
ZONE_ORDER.forEach(buildZone);
// 담장: 열린 구역의 바깥 테두리만 (정문 자리는 비운다)
const fenceG = new THREE.Group(); scene.add(fenceG);
function buildFence() {
  fenceG.clear(); const fm = toon('#e7e1d2'), segs = [];
  ZONE_ORDER.filter(zoneOpen).forEach(k => { const Z = ZONES[k];
    for (let x = Z.x0; x < Z.x1; x++) { if (!allowedCell(x, Z.z0 - 1)) segs.push(['h', x, Z.z0]); if (!allowedCell(x, Z.z1) && !(Z.z1 === N && x >= 10 && x <= 13)) segs.push(['h', x, Z.z1]); }
    for (let z = Z.z0; z < Z.z1; z++) { if (!allowedCell(Z.x0 - 1, z)) segs.push(['v', Z.x0, z]); if (!allowedCell(Z.x1, z)) segs.push(['v', Z.x1, z]); }
  });
  segs.forEach(([o, a, b]) => fenceG.add(mesh(new THREE.BoxGeometry(o === 'h' ? 1.02 : .25, .5, o === 'h' ? .25 : 1.02), fm, o === 'h' ? a + .5 : a, .25, o === 'h' ? b : b + .5)));
  bake(fenceG);
}
buildFence();
G.b = G.b.filter(b => DECO[b.t] && fits(b)); G.b.forEach(addDeco);

/* ───────── 움직이는 것들 (연기 · 공 · 깃발 · 은행잎) ───────── */
const puffs = [];
const puffGeo = new THREE.SphereGeometry(.18, 8, 6);
function stepAnimated(dt, t) {
  animated.forEach(a => {
    if (a.kind === 'smoke') { a.t += dt; if (a.t > a.every && a.g.parent) { a.t = 0; const p = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: a.color || '#e8eef5', transparent: true, opacity: .8, depthWrite: false })); p.position.copy(a.at).applyMatrix4(a.g.matrixWorld); scene.add(p); puffs.push({ p, life: 0 }); } }
    if (a.kind === 'ball' && a.obj.parent) { a.t += dt; const k = a.t * .8; a.obj.position.set(Math.sin(k * 1.3) * 2.2, .2 + Math.abs(Math.sin(k * 5)) * .5, Math.cos(k * .9) * 3); }
  });
  for (let i = puffs.length - 1; i >= 0; i--) { const q = puffs[i]; q.life += dt; q.p.position.y += dt * .7; q.p.position.x += dt * .2; q.p.scale.setScalar(1 + q.life * 1.5); q.p.material.opacity = Math.max(0, .8 - q.life * .45); if (q.life > 1.8) { scene.remove(q.p); q.p.material.dispose(); puffs.splice(i, 1); } }
  flags.forEach((f, i) => { const p = f.geometry.attributes.position; for (let j = 0; j < p.count; j++) { const x = p.getX(j); p.setZ(j, Math.sin(t * 4 + x * 5 + i) * .08 * x); } p.needsUpdate = true; });
}
// 은행잎
const leafTex = canvasTex(32, 32, g => { g.fillStyle = '#ffcf3a'; g.beginPath(); g.moveTo(16, 28); g.lineTo(4, 10); g.quadraticCurveTo(16, 0, 28, 10); g.closePath(); g.fill(); });
const LN = 70, leafGeo = new THREE.BufferGeometry(), LP = new Float32Array(LN * 3);
for (let i = 0; i < LN; i++) { LP[i * 3] = 9 + Math.random() * 6; LP[i * 3 + 1] = Math.random() * 3; LP[i * 3 + 2] = 7 + Math.random() * 17; }
leafGeo.setAttribute('position', new THREE.BufferAttribute(LP, 3));
const leafPts = new THREE.Points(leafGeo, new THREE.PointsMaterial({ map: leafTex, size: .3, transparent: true, depthWrite: false })); scene.add(leafPts);
refreshDecay(true);
function stepLeaves(dt, t) { for (let i = 0; i < LN; i++) { let y = LP[i * 3 + 1] - dt * (.35 + (i % 5) * .05); LP[i * 3] += Math.sin(t + i) * dt * .3; if (y < .05) { y = 2.2 + Math.random(); LP[i * 3] = 9.5 + Math.random() * 5; LP[i * 3 + 2] = 7 + Math.random() * 17; } LP[i * 3 + 1] = y; } leafGeo.attributes.position.needsUpdate = true; }
function stepSky() {}

/* ───────── 자원 말풍선 ───────── */
const iconTex = {};
function bubbleTex(k) { return iconTex[k] || (iconTex[k] = bubbleIcon(canvasTex(96, 112, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(48, 46, 42, 0, 7); g.fill(); g.beginPath(); g.moveTo(36, 82); g.lineTo(48, 108); g.lineTo(60, 82); g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(48, 46, 40, 0, 7); g.stroke(); }), k)); }
function bubbleIcon(t, k) { const img = new Image(); img.onload = () => { const g = t.image.getContext('2d'); g.drawImage(img, 22, 20, 52, 52); t.needsUpdate = true; }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawIcon(k, 52).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); return t; }
const bubbles = new Map();
const prodOf = t => { const d = FAC[t]; return d.prod ? [d.prod[0], d.prod[1] * lvOfFac(t), d.prod[2]] : null; };
function syncBubble(t, now) {
  const p = prodOf(t); if (!p || !lvOfFac(t) || !facOpen(t)) return;
  if (!G.facAt[t]) G.facAt[t] = now;
  const ready = now - G.facAt[t] >= p[2] * 1000;
  let s = bubbles.get(t);
  if (ready && !s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(p[0]), depthTest: false })); s.scale.set(1.1, 1.28, 1); s.renderOrder = 10; s.userData.fac = t; world.add(s); bubbles.set(t, s); }
  if (!ready && s) { world.remove(s); bubbles.delete(t); s = null; }
  if (s) { const m = meshes.get(t); s.position.set(m.position.x, (m.userData.h || 2) + 1.4 + Math.sin(now / 300 + m.position.x) * .1, m.position.z); }
}
function collect(t) {
  const p = prodOf(t); if (!p) return; KS.fx('coin');
  G.res[p[0]] += p[1]; G.facAt[t] = Date.now(); bump('col_' + p[0], p[1]); bump('col'); save(); hud();
  const m = meshes.get(t); floatText(`+${p[1]}${drawIcon(p[0], 20)}`, new THREE.Vector3(m.position.x, (m.userData.h || 2) + 1.2, m.position.z));
}

/* ───────── 친구들 ───────── */
const people = [];
function rosterOf(id) { return ROSTER.find(f => f.id === id) || { id, name: id, role: '' }; }
const SPOTS = () => { const s = [[12, 9], [12, 14], [12, 19], [9, 6.5], [15, 6.5], [16.5, 11], [3, 12], [21, 12], [17, 20.5], [6, 21], [19, 21.5]]; if (zoneOpen('east')) s.push([30, 9], [27, 15], [32, 19]); if (zoneOpen('back')) s.push([9, -3], [16, -4], [20, -2]); if (zoneOpen('west')) s.push([-4, 8], [-3, 16], [-6, 22]); if (lvOfFac('field')) for (let i = 0; i < 4; i++) s.push([2.5 + Math.random() * 6, 14.5 + Math.random() * 7]); return s; };
function freeCell() { const s = walkBlocked(); for (let k = 0; k < 60; k++) { const sp = SPOTS(), [x, z] = Math.random() < .6 ? sp[Math.floor(Math.random() * sp.length)] : [-11 + Math.random() * 46, -11 + Math.random() * 34]; if (!s.has(Math.floor(x) + ',' + Math.floor(z)) && interior(Math.floor(x), Math.floor(z))) return [x + (Math.random() - .5) * .6, z + (Math.random() - .5) * .6]; } return [12.5, 12]; }
const MAX_SHOWN = 18;   // 휴대폰이 느려지지 않게 캠퍼스에는 최대 18명만 나와 있다 (나머지는 수업 중)
function addPerson(id) {
  const spr = makeChibi(id, { scale: .78, noShadow: true, castShadow: false, lookUp: .5 });
  const [x, z] = freeCell(); spr.position.set(x, 0, z); spr.rotation.y = Math.random() * 6;
  const shade = new THREE.Mesh(new THREE.CircleGeometry(.26, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .18 })); shade.rotation.x = -Math.PI / 2; shade.position.y = .01;
  const p = { id, spr, shade, ch: spr.userData.chibi, target: null, wait: Math.random() * 3, step: 0, gift: null };
  spr.userData.person = p; world.add(spr, shade); people.push(p);
  if (people.length > MAX_SHOWN) { const old = people.find(q => q.id !== 'seojun' && q !== p); removePerson(old); }
  return p;
}
function removePerson(p) { world.remove(p.spr, p.shade); if (p.gift) world.remove(p.gift); people.splice(people.indexOf(p), 1); }
G.friends.forEach(addPerson);
function stepPeople(dt) {
  const s = walkBlocked();
  people.forEach(p => {
    const o = p.spr.position;
    if (!p.target) { p.wait -= dt; if (p.wait <= 0) { const [tx, tz] = freeCell(); p.target = new THREE.Vector3(tx, 0, tz); } }
    else {
      const d = p.target.clone().sub(o); d.y = 0; const len = d.length();
      if (len < .05) { p.target = null; p.wait = 2 + Math.random() * 5; }
      else { const v = d.multiplyScalar(Math.min(1, dt * .9 / len)); const nx = o.x + v.x, nz = o.z + v.z; if (s.has(Math.floor(nx) + ',' + Math.floor(nz)) || !allowedCell(Math.floor(nx), Math.floor(nz))) { p.target = null; p.wait = .3; } else { o.x = nx; o.z = nz; } }
    }
    const walking = !!p.target;
    let want = null;
    if (walking) { const d = p.target.clone().sub(o); if (d.lengthSq() > 1e-4) want = Math.atan2(d.x, d.z); }
    else { const c = world.worldToLocal(camera.position.clone()).sub(o); want = Math.atan2(c.x, c.z); }
    if (want != null) { let dr = want - p.spr.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.spr.rotation.y += dr * Math.min(1, dt * (walking ? 8 : 3)); }
    p.ch.set(walking ? 'walk' : 'idle'); p.ch.update(dt);
    p.shade.position.set(o.x, .01, o.z);
    if (p.gift) { p.gift.position.set(o.x, 2.1 + Math.sin(performance.now() / 250) * .08, o.z); }
  });
}
// 선물: 가끔 친구 머리 위에 '!'가 뜬다 → 누르면 자원
const giftTex = canvasTex(80, 96, g => { g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(40, 40, 34, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.moveTo(30, 70); g.lineTo(40, 92); g.lineTo(50, 70); g.fillStyle = '#ffd23f'; g.fill(); g.fillStyle = INK; g.font = 'bold 48px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('!', 40, 57); });
let giftT = 12;
function stepGifts(dt) {
  giftT -= dt; if (giftT > 0) return; giftT = 35 + Math.random() * 35;
  const pool = people.filter(p => !p.gift); if (!pool.length || people.filter(p => p.gift).length >= 2) return;
  const p = pool[Math.floor(Math.random() * pool.length)]; p.gift = new THREE.Sprite(new THREE.SpriteMaterial({ map: giftTex, depthTest: false })); p.gift.scale.set(.55, .66, 1); p.gift.renderOrder = 11; world.add(p.gift);
}
function takeGift(p) {
  world.remove(p.gift); p.gift = null; const k = ['know', 'snack', 'power'][Math.floor(Math.random() * 3)], n = 4 + Math.floor(campusLv() * 1.2 + Math.random() * 5);
  G.res[k] += n; bump('gift'); G.bond = G.bond || {}; save(); hud(); KS.fx('coin');
  floatText(`+${n}${drawIcon(k, 20)}`, p.spr.position.clone().add(new THREE.Vector3(0, 1.8, 0)));
  sayText(p, ['이거 너 줄게!', '매점에서 하나 더 샀어. 너 가져!', '오다 주웠다.', '선물이야!'][Math.floor(Math.random() * 4)]);
}

/* ───────── 화면 위 글자 (말풍선 · 획득 표시) ───────── */
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
function floatText(text, v) { const [x, y] = toScreen(v), el = document.createElement('div'); el.className = 'float'; el.innerHTML = text; el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
let talk = null;
function sayText(p, line) {
  KS.fx('pop'); if (talk) talk.el.remove();
  const f = rosterOf(p.id), el = document.createElement('div'); el.className = 'bubble';
  el.innerHTML = `<b>${f.name}</b>${line}<small>${f.role}</small>`;
  p.target = null; p.wait = 3.2; p.ch.face('happy', 2); p.ch.habitNow();
  document.body.appendChild(el); talk = { el, p, until: performance.now() + 3200 };
}
function say(p) { const own = typeof PROFILES !== 'undefined' && PROFILES[p.id] && PROFILES[p.id].lines.length ? PROFILES[p.id].lines : LINES; bump('talk'); sayText(p, own[Math.floor(Math.random() * own.length)]); refreshReqBadge(); }
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); }

/* ───────── HUD ───────── */
const canPay = cost => Object.entries(cost || {}).every(([k, n]) => (G.res[k] || 0) >= n);
const costText = cost => Object.entries(cost || {}).filter(([, n]) => n).map(([k, n]) => `${RES_NAME[k]} ${n}`).join(' · ');
function hud() {
  ['know', 'snack', 'power'].forEach(k => { $('r-' + k).textContent = G.res[k] || 0; });
  refreshTown();
  const pct = Math.round(restore() * 100);
  $('lv').innerHTML = `양평 재건 ${pct}%<span class="rbar2"><i style="width:${pct}%"></i></span><small>캠퍼스 Lv.${campusLv()} · 친구 ${G.friends.length}명</small>`;
  document.querySelectorAll('.bcard').forEach(c => c.classList.toggle('off', !canPay(DECO[c.dataset.t].cost)));
  refreshReqBadge();
}
$('cards').innerHTML = `<button class="cards-lab" id="deco-tog" aria-expanded="true">꾸미기<i>▾</i></button>` + DECO_ORDER.map(t => `<button class="bcard" data-t="${t}"><span class="bi">${drawIcon(t, 32)}</span><b>${DECO[t].name}</b><small class="cost">${resText(DECO[t].cost, 13)}</small></button>`).join('');

/* ───────── 꾸미기 놓기 ───────── */
let ghost = null;
function startPlace(t) {
  if (!canPay(DECO[t].cost)) { toast(`${DECO[t].name}을(를) 놓으려면 ${costText(DECO[t].cost)}이 필요해요`); return; }
  cancelPlace(); hideInfo();
  const t0 = controls.target, b = { t, x: Math.round(t0.x), z: Math.round(t0.z), r: 0 };
  const m = makeDeco(t); m.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .7; } });
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#3fbf6f', transparent: true, opacity: .45 })); pad.rotation.x = -Math.PI / 2; pad.position.y = .02;
  ghost = { b, mesh: m, pad }; world.add(m, pad); updateGhost();
  document.querySelectorAll('.bcard').forEach(c => c.classList.toggle('on', c.dataset.t === t));
  $('place').classList.add('show');
}
function updateGhost() { if (!ghost) return; const { b, mesh: m, pad } = ghost, [w, d] = footprint(b), ok = fits(b); setDecoPos(b, m); pad.scale.set(w, d, 1); pad.position.set(b.x + w / 2, .02, b.z + d / 2); pad.material.color.set(ok ? '#3fbf6f' : '#e5484d'); $('p-ok').disabled = !ok; }
function cancelPlace() { if (!ghost) return; world.remove(ghost.mesh, ghost.pad); ghost = null; $('place').classList.remove('show'); document.querySelectorAll('.bcard').forEach(c => c.classList.remove('on')); }
function confirmPlace() {
  if (!ghost || !fits(ghost.b)) return; const b = ghost.b, d = DECO[b.t];
  if (!canPay(d.cost)) { toast('자원이 모자라요'); return; }
  Object.entries(d.cost).forEach(([k, n]) => { G.res[k] -= n; });
  G.b.push(b); const m = addDeco(b); pop(m); cancelPlace(); bump('deco'); KS.fx('build');
  save(); hud();
}
// 꾸미기 줄 접기 · 펴기 (저장)
let decoOpen = true; try { decoOpen = localStorage.getItem('yangil.kingdom.deco') !== '0'; } catch (e) {}
function setDeco(v) { decoOpen = v; document.querySelector('.bar').classList.toggle('closed', !v); $('deco-tog').setAttribute('aria-expanded', v); $('deco-tog').setAttribute('aria-label', v ? '꾸미기 접기' : '꾸미기 펴기'); try { localStorage.setItem('yangil.kingdom.deco', v ? '1' : '0'); } catch (e) {} if (!v) cancelPlace(); }
setDeco(decoOpen);
$('deco-tog').addEventListener('click', e => { e.stopPropagation(); KS.fx('click'); setDeco(!decoOpen); });
$('cards').addEventListener('click', e => { const c = e.target.closest('.bcard'); if (c) { KS.fx('click'); startPlace(c.dataset.t); } });
$('p-no').onclick = cancelPlace; $('p-ok').onclick = confirmPlace;
$('p-rot').onclick = () => { if (ghost) { ghost.b.r = (ghost.b.r + 1) % 4; updateGhost(); } };
const tweens = []; function tween(dur, f, done) { tweens.push({ t: 0, dur, f, done }); }
function pop(m) { m.scale.setScalar(.01); tween(.45, k => { const e = 1 + Math.sin(k * Math.PI) * .25 * (1 - k); m.scale.setScalar(Math.max(.01, k * e)); }); }

/* ───────── 시설 정보 · 레벨업 ───────── */
function upgradeBlock(t) {
  const lv = lvOfFac(t), next = lv + 1;
  if (!facOpen(t)) return { ok: false, why: '구역 잠김' };
  if (lv >= MAX_LV) return { ok: false, why: '최고 레벨' };
  if (t !== 'main' && next > lvOfFac('main')) return { ok: false, why: `본관 Lv.${next} 필요` };
  if (t === 'main' && next > 1) { const others = FAC_ORDER.filter(x => x !== 'main' && lvOfFac(x) >= lv).length; if (others < 2) return { ok: false, why: `다른 시설 2곳을 Lv.${lv}로` }; }
  const cost = upCostOf(t, next); if (!canPay(cost)) return { ok: false, why: '자원 부족', cost };
  return { ok: true, cost };
}
const recruitCost = () => { const n = G.friends.length; return { know: 18 + n * 4, snack: 10 + n * 2, power: 4 + n }; };
const recruitCap = () => 5 + lvOfFac('club') * 11;
function showFac(t) {
  const d = FAC[t], lv = lvOfFac(t), el = $('info'), up = upgradeBlock(t), next = lv + 1, cost = up.cost || upCostOf(t, next);
  const p = prodOf(t), bonus = typeof BUILD_BONUS !== 'undefined' && BUILD_BONUS[t];
  const stars = Array.from({ length: MAX_LV }, (_, i) => drawIcon(i < lv ? 'star' : 'starOff', 15)).join('');
  const lines = [];
  if (p && lv) { const left = Math.max(0, Math.ceil((p[2] * 1000 - (Date.now() - (G.facAt[t] || Date.now()))) / 1000)); lines.push(`${RES_NAME[p[0]]} ${p[1]}개 / ${p[2]}초${left ? ` · ${left}초 뒤` : ' · 모을 수 있어요'}`); }
  if (d.prod && lv < MAX_LV) lines.push(`다음 레벨: ${RES_NAME[d.prod[0]]} ${d.prod[1] * next}개`);
  if (bonus) lines.push(`전투 보너스 · ${bonus.text.replace(/\+(\d+)%/, (m, x) => '+' + Math.round(x * .6 * Math.max(1, lv)) + '%')}${lv ? '' : ' (복구하면)'}`);
  if (d.recruit) lines.push(`친구 ${G.friends.length} / ${recruitCap()}명까지 모을 수 있어요`);
  el.innerHTML = `<span class="bi">${drawIcon(t === 'field' ? 'gym' : t === 'cafe' ? 'snack' : t === 'main' ? 'school' : t, 32)}</span>
    <span class="txt"><b>${d.name} <span class="stars">${stars}</span></b><small>${lv ? d.desc : '폐교 뒤 무너진 채 남아 있어요. 복구하면 · ' + d.desc}</small><small>${lines.join('<br>')}</small></span>
    <span class="acts">${lv >= MAX_LV ? '<span class="max">최고 레벨</span>' : `<button id="i-up" class="up" ${up.ok ? '' : 'disabled'}>${lv ? `Lv.${next}로` : '복구하기'}<small>${up.ok || up.why === '자원 부족' ? resText(cost, 12) : up.why}</small></button>`}
    ${d.recruit && lv ? `<button id="i-rec" class="up rec">친구 뽑기<small>${G.friends.length >= recruitCap() ? '레벨업 필요' : '뽑기 열기'}</small></button>` : ''}</span>`;
  el.classList.add('show');
  const ub = $('i-up'); if (ub) ub.onclick = () => doUpgrade(t);
  const rb = $('i-rec'); if (rb) rb.onclick = () => { hideInfo(); window.__kingdom.openGacha && window.__kingdom.openGacha(); };
}
function doUpgrade(t) {
  const up = upgradeBlock(t); if (!up.ok) { toast(up.why); return; }
  Object.entries(up.cost).forEach(([k, n]) => { G.res[k] -= n; });
  G.fac[t] = lvOfFac(t) + 1; if (!G.facAt[t]) G.facAt[t] = Date.now(); bump('up');
  const old = meshes.get(t); world.remove(old); const s = bubbles.get(t); if (s) { world.remove(s); bubbles.delete(t); }
  animated.splice(0, animated.length, ...animated.filter(a => a.g !== old && (!a.obj || !isChild(a.obj, old))));
  const m = addFac(t); pop(m); KS.fx(G.fac[t] === 1 ? 'build' : 'levelup');
  floatText(G.fac[t] === 1 ? `${FAC[t].name} 복구!` : `${FAC[t].name} Lv.${G.fac[t]}!`, m.position.clone().add(new THREE.Vector3(0, (m.userData.h || 2) + .8, 0)));
  if (t === 'club' && G.fac[t] === 1) G.freePull = (G.freePull || 0) + 1;   // 첫 뽑기는 무료 (notebook.js가 알려 준다)
  if (G.fac[t] === 1) firstRestore(t);
  refreshDecay(); save(); hud(); showFac(t); checkMilestone();
}
function showDeco(b) {
  const d = DECO[b.t], el = $('info');
  el.innerHTML = `<span class="bi">${drawIcon(b.t, 32)}</span><span class="txt"><b>${d.name}</b><small>꾸미기 4개마다 모든 친구 체력 +3%</small></span><span class="acts"><button id="i-del" class="del">치우기</button></span>`;
  el.classList.add('show');
  $('i-del').onclick = () => { const m = meshes.get(b); world.remove(m); meshes.delete(b); G.b.splice(G.b.indexOf(b), 1); Object.entries(d.cost).forEach(([k, n]) => { G.res[k] += Math.floor(n / 2); }); save(); hud(); hideInfo(); toast('치우고 절반을 돌려받았어요'); };
}
function hideInfo() { $('info').classList.remove('show'); }
/* ───────── 구역 넓히기 ───────── */
function zoneCheck(k) {
  const Z = ZONES[k], n = Z.need || {}, list = [];
  if (n.restore) list.push({ ok: restore() >= n.restore - 1e-9, text: `양일고 재건 ${Math.round(n.restore * 100)}% (지금 ${Math.round(restore() * 100)}%)` });
  if (n.ch) list.push({ ok: typeof progOf === 'function' && progOf(G, n.ch) > 0, text: `전투 챕터 ${n.ch} 열기 (${n.ch - 1}-5 클리어)` });
  return { list, ready: list.every(x => x.ok), pay: canPay(Z.cost) };
}
function showZone(k) {
  const Z = ZONES[k], c = zoneCheck(k), el = $('info'), facs = FAC_ORDER.filter(t => FAC[t].zone === k).map(t => FAC[t].name).join(' · ');
  el.innerHTML = `<span class="bi">${drawIcon('lock', 32)}</span><span class="txt"><b>${Z.name} 넓히기</b><small>숲을 정리하고 담장을 넓혀요 · 새 시설: ${facs}</small><small>${c.list.map(x => `${x.ok ? '✔' : '✖'} ${x.text}`).join('<br>')}</small></span>
    <span class="acts"><button id="i-zone" class="up" ${c.ready && c.pay ? '' : 'disabled'}>넓히기<small>${resText(Z.cost, 12)}</small></button></span>`;
  el.classList.add('show');
  $('i-zone').onclick = () => unlockZone(k);
}
function unlockZone(k) {
  const Z = ZONES[k], c = zoneCheck(k); if (!c.ready || !c.pay) return;
  Object.entries(Z.cost).forEach(([r, n]) => { G.res[r] -= n; });
  G.zones[k] = 1; save(); hideInfo(); KS.fx('build');
  const old = zoneG[k], forest = old && old.userData.forest, lk = old && old.userData.lock;
  if (lk) lk.visible = false;
  const cx = (Z.x0 + Z.x1) / 2, cz = (Z.z0 + Z.z1) / 2, t0 = controls.target.clone();
  tween(.8, q => { const e = 1 - Math.pow(1 - q, 3); controls.target.set(t0.x + (cx - t0.x) * e, 0, t0.z + (cz - t0.z) * e); placeCamera(); });
  if (forest) tween(.9, q => { forest.scale.set(1, Math.max(.01, 1 - q), 1); forest.position.y = -q * .3; }, after); else after();
  function after() {
    buildZone(k); buildFence();
    FAC_ORDER.filter(t => FAC[t].zone === k).forEach(t => pop(addFac(t)));
    refreshDecay(true); hud(); KS.fx('fanfare');
    const facs = FAC_ORDER.filter(t => FAC[t].zone === k).map(t => `<b>${FAC[t].name}</b>`).join(' · ');
    setTimeout(() => showStory([{ t: `양일고가 넓어졌다! · ${Z.name}`, p: `숲을 걷어 내자 오래된 건물들이 모습을 드러냈다.<br>${facs}<br>무너진 곳을 눌러 다시 세워 보자.`, art: 'go', btn: '좋아!' }]), 400);
  }
}

// 친구 합류: pick이 없으면 아직 없는 친구 중 무작위, at은 나타날 시설
function recruit(pick, at = 'club', why = '동아리실 뽑기') {
  setTimeout(() => KS.fx('fanfare'), 300);
  const pool = ROSTER.filter(f => !G.friends.includes(f.id));
  if (!pool.length) { toast('모든 친구가 캠퍼스에 모였어요!'); return null; }
  const f = (pick && pool.find(x => x.id === pick)) || pool[Math.floor(Math.random() * pool.length)]; G.friends.push(f.id); bump('recruit'); const p = addPerson(f.id);
  const F = FAC[at] || FAC.club; p.spr.position.set(F.at[0] + F.size[0] / 2, 0, F.at[1] + F.size[1] + .6);
  toast(`${why} · ${f.name} 합류`); setTimeout(() => say(p), 600);
  return f;
}

/* ───────── 친구 의뢰 게시판 ───────── */
const REQ_KINDS = ['col_know', 'col_snack', 'col_power', 'up', 'talk', 'deco', 'win', 'gift'];
function makeReq() {
  const who = G.friends[Math.floor(Math.random() * G.friends.length)], L = campusLv();
  let kind = REQ_KINDS[Math.floor(Math.random() * REQ_KINDS.length)];
  if (G.req.some(r => r.kind === kind)) kind = REQ_KINDS.find(k => !G.req.some(r => r.kind === k)) || kind;
  const r = { who, kind, at: Date.now() };
  if (kind.startsWith('col_')) { r.n = 10 + L * 5; r.base = G.stat[kind] || 0; }
  else if (kind === 'up') { const cand = FAC_ORDER.filter(t => facOpen(t) && upgradeBlock(t).why !== '최고 레벨' && (t === 'main' || lvOfFac(t) < lvOfFac('main'))); r.t = cand[Math.floor(Math.random() * cand.length)] || 'main'; r.n = lvOfFac(r.t) + 1; }
  else if (kind === 'talk') { r.n = 3; r.base = G.stat.talk || 0; }
  else if (kind === 'deco') { r.n = 2; r.base = G.stat.deco || 0; }
  else if (kind === 'win') { r.n = 1; r.base = G.wins || 0; }
  else if (kind === 'gift') { r.n = 1; r.base = G.stat.gift || 0; }
  const rk = ['know', 'snack', 'power'][Math.floor(Math.random() * 3)];
  r.reward = { [rk]: 12 + L * 6, snack: (rk === 'snack' ? 12 + L * 6 : 0) + 4 + L * 2 };
  return r;
}
function progOfReq(r) {
  if (r.kind === 'up') return lvOfFac(r.t) >= r.n ? r.n : 0;
  const now = r.kind === 'win' ? (G.wins || 0) : (G.stat[r.kind] || 0);
  return Math.min(r.n, now - r.base);
}
const reqDone = r => r.kind === 'up' ? lvOfFac(r.t) >= r.n : progOfReq(r) >= r.n;
function reqText(r) {
  const n = r.n;
  return ({ col_know: `지식 ${n}개만 모아 줄래? 같이 시험공부 하자.`, col_snack: `간식 ${n}개 모아 줘… 배고파.`, col_power: `체력 ${n} 모아서 같이 운동하자!`, up: `${FAC[r.t] ? FAC[r.t].name : ''} ${n === 1 ? '지어' : `Lv.${n} 만들어`} 주면 좋겠다!`, talk: `친구들이랑 ${n}번 이야기해 봐. 다들 심심하대.`, deco: `캠퍼스에 꾸미기 ${n}개 놓아 줘!`, win: `보스 한 번만 이기고 와 줘!`, gift: `친구 머리 위에 '!' 뜨면 눌러서 선물 받아 봐.` })[r.kind];
}
function fillReqs() { while (G.req.length < 3) G.req.push(makeReq()); G.req.forEach(r => { if (!G.friends.includes(r.who)) r.who = G.friends[0]; }); }
fillReqs();
const faceCache = {};
function faceOf(id) { if (!faceCache[id]) { try { faceCache[id] = shot(id, { kind: 'bust', w: 96, h: 96 }); } catch (e) { faceCache[id] = svgURL(kitHeadSVG(id)); } } return faceCache[id]; }
function refreshReqBadge() { const n = G.req.filter(reqDone).length, b = $('req-n'); if (b) { b.textContent = n; b.hidden = !n; } }
function openReqs() {
  fillReqs(); const el = $('reqs');
  el.innerHTML = `<div class="sheet" role="dialog" aria-label="친구 의뢰"><div class="sh-top"><b>친구 의뢰</b><small>들어주면 보상과 친밀도를 받아요</small><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    ${G.req.map((r, i) => { const f = rosterOf(r.who), pr = r.kind === 'up' ? lvOfFac(r.t) : progOfReq(r), done = reqDone(r);
      return `<div class="req${done ? ' done' : ''}"><img src="${faceOf(r.who)}" alt=""><div class="rq"><b>${f.name}</b><p>${reqText(r)}</p><div class="rbar"><i style="width:${Math.min(100, (r.kind === 'up' ? (done ? 1 : 0) : pr / r.n) * 100)}%"></i><span>${r.kind === 'up' ? (done ? '완료' : `지금 Lv.${lvOfFac(r.t)}`) : `${Math.max(0, pr)} / ${r.n}`}</span></div><div class="rw">${resText(r.reward, 13)}<span class="rs">${drawIcon('heart', 13)}+1</span></div></div><button class="claim" data-i="${i}" ${done ? '' : 'disabled'}>${done ? '받기' : '진행 중'}</button></div>`; }).join('')}</div>`;
  el.hidden = false;
}
$('reqs').addEventListener('click', e => {
  if (e.target === $('reqs') || e.target.closest('[data-close]')) { $('reqs').hidden = true; return; }
  const c = e.target.closest('.claim'); if (!c || c.disabled) return; const r = G.req[+c.dataset.i]; if (!reqDone(r)) return;
  Object.entries(r.reward).forEach(([k, n]) => { G.res[k] = (G.res[k] || 0) + n; }); G.bond = G.bond || {}; G.bond[r.who] = (G.bond[r.who] || 0) + 1;
  G.req.splice(+c.dataset.i, 1); bump('reqs'); fillReqs(); KS.fx('fanfare'); save(); hud(); openReqs();
  const p = people.find(q => q.id === r.who); if (p) sayText(p, '고마워! 역시 너밖에 없어.');
});
$('b-req').onclick = openReqs;

/* ───────── 누르기 (끌기와 구분) ───────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 8) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (ghost) { const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, hit)) { const [w, d] = footprint(ghost.b); ghost.b.x = Math.round(hit.x - w / 2); ghost.b.z = Math.round(hit.z - d / 2); updateGhost(); } return; }
  const gs = ray.intersectObjects(people.filter(p => p.gift).map(p => p.gift), false)[0];
  if (gs) { const p = people.find(q => q.gift === gs.object); if (p) { takeGift(p); return; } }
  const hs = ray.intersectObjects([...bubbles.values()], false)[0];
  if (hs) { collect(hs.object.userData.fac); return; }
  const locks = ZONE_ORDER.filter(k => !zoneOpen(k) && zoneG[k] && zoneG[k].userData.lock).map(k => zoneG[k].userData.lock);
  const hl = ray.intersectObjects(locks, false)[0];
  if (hl) { KS.fx('click'); showZone(hl.object.userData.zone); return; }
  const hp = ray.intersectObjects(people.map(p => p.spr), true)[0];
  if (hp) { const root = hp.object.userData.chibiRoot; if (root && root.userData.person) { const p = root.userData.person; if (p.gift) takeGift(p); else say(p); return; } }
  const hb = ray.intersectObjects([...meshes.values()], true)[0];
  if (hb) { let o = hb.object; while (o && !o.userData.fac && !o.userData.b) o = o.parent; if (o) { KS.fx('click'); if (o.userData.fac) { const t = o.userData.fac; if (bubbles.has(t)) collect(t); else showFac(t); } else showDeco(o.userData.b); return; } }
  const hz = ray.intersectObjects(ZONE_ORDER.filter(k => !zoneOpen(k) && zoneG[k]).map(k => zoneG[k]), true)[0];
  if (hz) { let o = hz.object; while (o && !o.userData.zone) o = o.parent; if (o) { KS.fx('click'); showZone(o.userData.zone); return; } }
  if (HOOK.tap.some(f => f(ray))) return;
  hideInfo();
});
$('b-rot').onclick = () => { camAngle += Math.PI / 2; placeCamera(); };
$('b-in').onclick = () => { camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.25); camera.updateProjectionMatrix(); };
$('b-out').onclick = () => { camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.25); camera.updateProjectionMatrix(); };
$('b-back').onclick = () => { location.href = '../'; };
$('b-fight').onclick = () => { save(); location.href = 'team.html'; };
KS.play('campus'); KS.bind($('b-music')); setupFullscreen($('b-full'), false);
document.querySelectorAll('.rbtn, .pbtn').forEach(b => b.addEventListener('click', () => KS.fx('click')));

/* ───────── 반복 ───────── */
const clock = new THREE.Clock();
const PERF = { t0: performance.now(), n: 0, done: false };
function perfCheck() {
  if (PERF.done) return; PERF.n++; const el = performance.now() - PERF.t0;
  if (el < 4000) return; PERF.done = true; const fps = PERF.n / (el / 1000);
  if (fps < 28) { renderer.setPixelRatio(1); while (people.length > 10) removePerson(people.find(q => q.id !== 'seojun')); }
}
function loop() {
  const dt = Math.min(clock.getDelta(), .05), now = Date.now(), t = performance.now() / 1000;
  controls.update(); stepLabels(); stepPeople(dt); stepGifts(dt); perfCheck(); stepAnimated(dt, t); stepLeaves(dt, t); stepSky(dt, t);
  for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.f(k); if (k >= 1) { tweens.splice(i, 1); w.done && w.done(); } }
  FAC_ORDER.forEach(f => syncBubble(f, now)); HOOK.tick.forEach(f => f(dt, t));
  if (talk) { if (performance.now() > talk.until) { talk.el.remove(); talk = null; } else { const [x, y] = toScreen(talk.p.spr.position.clone().add(new THREE.Vector3(0, 2.1, 0))); talk.el.style.left = x + 'px'; talk.el.style.top = y + 'px'; } }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
hud(); loop();
setInterval(() => { save(); refreshReqBadge(); }, 5000);
$('loading').remove();
/* ───────── 이야기: 망한 양일고를 다시 세운다 ───────── */
const BOSS_LIST = ['은행나무길의 <b>은행왕</b>', '다목적관의 <b>LED 스크린</b>', '밤의 교실의 <b>야자의 유령</b>', '그리고 본관 옥상의… <b>?</b>'];
function storyPages() {
  const team = G.friends.slice(0, 5);
  return [
    { t: '그날, 양평이 무너졌다', p: '어느 날 양평에 이상한 것들이 나타났다.<br>양평역의 기차가 멈추고, 물맑은시장은 문을 닫고, 거리는 무너졌다.', art: 'ruin' },
    { t: '양평을 차지한 녀석들', p: BOSS_LIST.join('<br>'), art: 'boss' },
    { t: '그때, 양일고 친구들이 돌아왔다', p: '“학교부터 다시 세우자. 양일고가 살아나면 양평도 살아날 거야!”', art: 'team', team },
    { t: '양평 재건 시작', p: '먼저 무너진 <b>양일고 본관</b>을 눌러 복구해 보자.<br>학교를 다시 세울수록 <b>학교 가까운 동네부터</b> 하나씩 살아난다.<br><b>전투</b>로 양평을 차지한 녀석들을 몰아내자!', art: 'go' },
  ];
}
const MILES = [
  [.25, '양평역에 다시 기차가 선다', '중앙선 기차가 다시 양평역에 멈춰 섰다. 역 앞 거리에 사람들이 돌아온다.', { know: 60, snack: 40 }],
  [.5, '물맑은시장이 다시 열렸다', '“떡볶이 나왔어요!” 시장 골목에 다시 불이 켜지고, 장날 북적임이 돌아왔다.', { know: 90, snack: 70, power: 30 }],
  [.75, '양평군청에 불이 켜졌다', '군청 앞 광장에 다시 사람들이 모인다. 남한강 산책길도 다시 열렸다.', { know: 140, snack: 100, power: 60 }],
  [1, '양평 재건 완료!', '무너졌던 양평이 다시 우리 동네가 됐다. 남한강은 오늘도 반짝이고, 양일고 종이 울린다.', { know: 300, snack: 200, power: 120 }],
];
function showStory(pages, done) {
  const el = $('story'); let i = 0;
  const draw = () => {
    const pg = pages[i], last = i === pages.length - 1;
    let art = '';
    if (pg.art === 'ruin') art = `<div class="art ruin">${drawIcon('school', 64)}<i></i><i></i><i></i></div>`;
    else if (pg.art === 'boss') art = `<div class="art boss"><span>${drawIcon('fight', 52)}</span></div>`;
    else if (pg.art === 'team') art = `<div class="art team">${pg.team.map(id => `<img src="${faceOf(id)}" alt="">`).join('')}</div>`;
    else if (pg.art === 'go' || pg.art === 'mile') art = `<div class="art go">${drawIcon(pg.art === 'mile' ? 'star' : 'school', 64)}</div>`;
    el.innerHTML = `<div class="page">${art}<h2>${pg.t}</h2><p>${pg.p}</p>${pg.reward ? `<div class="rw">${resText(pg.reward, 16)}</div>` : ''}<div class="dots">${pages.length > 1 ? pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('') : ''}</div><button class="next">${last ? (pg.btn || '시작!') : '다음'}</button></div>`;
    el.querySelector('.next').onclick = () => { KS.fx('click'); if (last) { el.hidden = true; done && done(); } else { i++; draw(); } };
  };
  el.hidden = false; draw();
}
function firstRestore(t) {
  const who = people[Math.floor(Math.random() * people.length)];
  const line = { main: '본관이 다시 섰다! 내 자리 아직 있으려나?', store: '매점 부활! 오늘은 내가 쏜다.', field: '운동장 잡초 다 뽑았다. 공 차러 가자!', lab: '과학실 냄새… 이거 그리웠어.', library: '도서관 조용한 거 그대로네.', club: '동아리실 열렸다! 신입 모집하자!', cafe: '급식실 냄새 난다… 오늘 메뉴 뭐야?', gym: '다목적관 LED가 다시 켜졌어!' }[t];
  if (who && line) setTimeout(() => sayText(who, line), 900);
}
function checkMilestone() {
  const r = restore();
  for (const [th, title, text, reward] of MILES) {
    const key = 'm' + Math.round(th * 100);
    if (r >= th - 1e-9 && !G.story[key]) {
      G.story[key] = 1; Object.entries(reward).forEach(([k, n]) => { G.res[k] = (G.res[k] || 0) + n; }); save(); hud();
      setTimeout(() => { KS.fx('fanfare'); showStory([{ t: title, p: text, art: 'mile', reward, btn: '좋아!' }]); }, 1200);
      break;
    }
  }
}
if (!G.story.intro2) { G.story.intro = 1; G.story.intro2 = 1; save(); setTimeout(() => showStory(storyPages()), 500); }
if (treesAlive() && !G.story.trees) { G.story.trees = 1; save(); setTimeout(() => toast('은행왕을 물리쳐서 은행나무길이 다시 노랗게 물들었어요!'), 1500); }
checkMilestone();
save();
window.__kingdom = { recruitCost, recruitCap, hideInfo, HOOK, THREE, scene, world, save, hud, toast, say, sayText, faceOf, restore, campusLv, lvOfFac, prodOf, facOpen, FAC_ORDER, mapLabels, LANDMARK, recruit, rosterOf, floatText, resText, toScreen, G, FAC, ZONES, unlockZone, showZone, zoneCheck, people, meshes, bubbles, camera, controls, renderer, showFac, doUpgrade, openReqs, showStory, storyPages };
