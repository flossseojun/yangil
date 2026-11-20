// 양일 캠퍼스: 3D 학교 부지에 건물을 짓고, 자원을 모으고, 친구들이 돌아다니는 캠퍼스 꾸미기 게임 (1단계 시제품)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeChibi } from './chibi3d.js';

const N = 16;                       // 부지 크기 (N×N 칸)
const SAVE = 'yangil.kingdom.v1';
const $ = id => document.getElementById(id);
const RES = { know: '📘', snack: '🍞', power: '💪' };
const RES_NAME = { know: '지식', snack: '간식', power: '체력' };

// 건물 종류: size [가로, 세로], 생산 { 자원, 양, 초 }, 비용
const BUILD = {
  main:    { name: '본관', ico: '🏫', size: [4, 2], h: 2.6, wall: '#f3ead6', roof: '#2b4a3c', prod: ['know', 6, 20], fixed: true },
  store:   { name: '매점', ico: '🏪', size: [2, 2], h: 1.3, wall: '#ffe2b8', roof: '#e0573b', prod: ['snack', 4, 15], cost: { know: 10 } },
  lab:     { name: '과학실', ico: '🧪', size: [2, 2], h: 1.6, wall: '#dff1f7', roof: '#3f7fb8', prod: ['know', 5, 25], cost: { know: 20, snack: 10 } },
  gym:     { name: '체육관', ico: '🏀', size: [3, 2], h: 1.9, wall: '#e8e2f5', roof: '#6c4fd1', prod: ['power', 5, 25], cost: { know: 25, snack: 15 }, arch: true },
  library: { name: '도서관', ico: '📚', size: [2, 3], h: 1.8, wall: '#f5e9dc', roof: '#8a5a34', prod: ['know', 9, 40], cost: { know: 40, power: 10 } },
  club:    { name: '동아리방', ico: '🎪', size: [2, 2], h: 1.4, wall: '#fff3c4', roof: '#2f8f6b', cost: { know: 30, snack: 20, power: 10 }, recruit: true },
  ginkgo:  { name: '은행나무', ico: '🌳', size: [1, 1], cost: { snack: 4 }, deco: 'tree' },
  bench:   { name: '벤치', ico: '🪑', size: [1, 1], cost: { snack: 2 }, deco: 'bench' },
  flower:  { name: '화단', ico: '🌷', size: [1, 1], cost: { snack: 3 }, deco: 'flower' },
};
const ORDER = ['store', 'lab', 'gym', 'library', 'club', 'ginkgo', 'bench', 'flower'];
const LINES = ['오늘 캠퍼스 분위기 좋다!', '여기 매점 생기면 좋겠어.', '건물 하나만 더 지어 줘!', '은행나무길 걷는 거 좋아.', '동아리방 언제 생겨?', '오늘도 양일고 파이팅!', '나 여기서 낮잠 자도 돼?', '캠퍼스 점점 멋있어진다.'];

/* ───────── 저장 ───────── */
let G;
function fresh() {
  const others = ROSTER.filter(f => f.id !== 'seojun').sort(() => Math.random() - .5);
  return {
    res: { know: 20, snack: 10, power: 0 },
    b: [{ t: 'main', x: 6, z: 3, r: 0, at: Date.now() }, { t: 'store', x: 3, z: 7, r: 0, at: Date.now() },
      ...[[5, 7], [5, 8], [5, 9], [5, 10], [10, 7], [10, 8], [10, 9], [10, 10]].map(([x, z]) => ({ t: 'ginkgo', x, z, r: 0, at: 0 }))],
    friends: ['seojun', ...others.slice(0, 4).map(f => f.id)], clubs: 0,
  };
}
function load() { try { const g = JSON.parse(localStorage.getItem(SAVE)); if (g && g.b) return g; } catch (e) {} return fresh(); }
function save() { try { localStorage.setItem(SAVE, JSON.stringify(G)); } catch (e) {} }
G = load();

/* ───────── 장면 ───────── */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#bfe3f5');
scene.fog = new THREE.Fog('#bfe3f5', 40, 80);

const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
let camAngle = Math.PI / 4;
const camDist = 30, camH = 26;
const controls = new OrbitControls(camera, canvas);
controls.enableRotate = false; controls.screenSpacePanning = false; controls.enableDamping = true; controls.dampingFactor = .12;
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
controls.minZoom = .55; controls.maxZoom = 2.6; controls.zoomSpeed = 1.2;
controls.target.set(N / 2, 0, N / 2);
function placeCamera() {
  const t = controls.target;
  camera.position.set(t.x + Math.cos(camAngle) * camDist, camH, t.z + Math.sin(camAngle) * camDist);
  camera.lookAt(t); controls.update();
}
function resize() {
  const w = innerWidth, h = innerHeight, a = w / h, view = a < 1 ? 11 : 9;
  camera.left = -view * a; camera.right = view * a; camera.top = view; camera.bottom = -view; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
addEventListener('resize', resize); resize(); placeCamera();
controls.addEventListener('change', () => {
  const t = controls.target, cx = THREE.MathUtils.clamp(t.x, 0, N), cz = THREE.MathUtils.clamp(t.z, 0, N);
  if (cx !== t.x || cz !== t.z) { const dx = cx - t.x, dz = cz - t.z; t.x = cx; t.z = cz; camera.position.x += dx; camera.position.z += dz; }
});

scene.add(new THREE.HemisphereLight('#fff7e0', '#7fa86a', 1.1));
const sun = new THREE.DirectionalLight('#fff3d6', 1.6);
sun.position.set(N / 2 + 12, 22, N / 2 - 6); sun.target.position.set(N / 2, 0, N / 2);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

// 땅: 잔디 칸 무늬 + 가장자리 흙 + 운동장 트랙
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const groundTex = canvasTex(N * 32, N * 32, (g, w) => {
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { g.fillStyle = (i + j) % 2 ? '#8fcf6f' : '#86c766'; g.fillRect(i * 32, j * 32, 32, 32); }
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 600; k++) g.fillRect(Math.random() * w, Math.random() * w, 2, 2);
  // 은행나무길 (정문 → 본관)
  g.fillStyle = '#e9d9a8'; g.fillRect(6.5 * 32, 5 * 32, 3 * 32, 11 * 32);
  g.fillStyle = 'rgba(214,180,90,.35)'; for (let k = 0; k < 120; k++) { g.beginPath(); g.ellipse(6.6 * 32 + Math.random() * 2.8 * 32, 5 * 32 + Math.random() * 11 * 32, 3, 2, Math.random() * 3, 0, 7); g.fill(); }
});
const ground = new THREE.Mesh(new THREE.BoxGeometry(N, .4, N), [
  new THREE.MeshLambertMaterial({ color: '#b9895a' }), new THREE.MeshLambertMaterial({ color: '#b9895a' }),
  new THREE.MeshLambertMaterial({ map: groundTex }), new THREE.MeshLambertMaterial({ color: '#8a6440' }),
  new THREE.MeshLambertMaterial({ color: '#b9895a' }), new THREE.MeshLambertMaterial({ color: '#b9895a' })]);
ground.position.set(N / 2, -.2, N / 2); ground.receiveShadow = true; scene.add(ground);
// 정문 기둥 + 담장
const gate = new THREE.Group();
[[6.4, 0], [9.6, 0]].forEach(([x]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(.4, 1.4, .4), new THREE.MeshLambertMaterial({ color: '#d9d2c2' })); p.position.set(x, .7, N - .2); p.castShadow = true; gate.add(p); });
const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, .5, .12), [0, 0, 0, 0, 1, 1].map(i => new THREE.MeshLambertMaterial(i ? { map: canvasTex(256, 36, (g, w, h) => { g.fillStyle = '#2b4a3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.font = '24px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('양일고등학교', w / 2, 27); }) } : { color: '#2b4a3c' })));
sign.position.set(8, 1.45, N - .2); gate.add(sign); scene.add(gate);
const fenceMat = new THREE.MeshLambertMaterial({ color: '#e7e1d2' });
[[3.2, N - .1, 6.2, .1], [12.8, N - .1, 6.2, .1], [.05, N / 2, .1, N], [N - .05, N / 2, .1, N], [N / 2, .05, N, .1]].forEach(([x, z, w, d]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, .45, d), fenceMat); f.position.set(x, .22, z); f.castShadow = true; scene.add(f); });

/* ───────── 건물 모델 ───────── */
function windowTex(wall, cols, rows, door) {
  return canvasTex(cols * 32, rows * 32, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, h - 6, w, 6);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (door && j === rows - 1 && i === Math.floor(cols / 2)) { g.fillStyle = '#6b4a2f'; g.fillRect(i * 32 + 7, j * 32 + 6, 18, 26); continue; }
      g.fillStyle = '#7fc4e8'; g.fillRect(i * 32 + 7, j * 32 + 7, 18, 16); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(i * 32 + 9, j * 32 + 9, 5, 12);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(i * 32 + 7, j * 32 + 7, 18, 16);
    }
  });
}
function makeBuilding(t) {
  const d = BUILD[t], grp = new THREE.Group(), [sx, sz] = d.size;
  const shadow = o => { o.castShadow = true; o.receiveShadow = true; return o; };
  if (d.deco === 'tree') {
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, .7, 6), new THREE.MeshLambertMaterial({ color: '#7a5233' }))); trunk.position.y = .35; grp.add(trunk);
    const leafM = new THREE.MeshLambertMaterial({ color: '#f2c12e', flatShading: true });
    [[0, 1, 0, .45], [.22, .85, .1, .3], [-.2, .9, -.1, .32], [0, 1.3, 0, .3]].forEach(([x, y, z, r]) => { const l = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM)); l.position.set(x, y, z); grp.add(l); });
  } else if (d.deco === 'bench') {
    const m = new THREE.MeshLambertMaterial({ color: '#b07a45' }), leg = new THREE.MeshLambertMaterial({ color: '#555' });
    const seat = shadow(new THREE.Mesh(new THREE.BoxGeometry(.8, .07, .3), m)); seat.position.y = .3; grp.add(seat);
    const back = shadow(new THREE.Mesh(new THREE.BoxGeometry(.8, .25, .05), m)); back.position.set(0, .48, -.13); grp.add(back);
    [-.33, .33].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .28), leg); l.position.set(x, .15, 0); grp.add(l); });
  } else if (d.deco === 'flower') {
    const box = shadow(new THREE.Mesh(new THREE.BoxGeometry(.8, .22, .8), new THREE.MeshLambertMaterial({ color: '#a5774b' }))); box.position.y = .11; grp.add(box);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(.7, .02, .7), new THREE.MeshLambertMaterial({ color: '#5a3d26' })); soil.position.y = .23; grp.add(soil);
    ['#ff6b8b', '#ffd23f', '#ff9a3c', '#c86bff', '#ff6b8b'].forEach((c, i) => { const f = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshLambertMaterial({ color: c })); f.position.set(-.22 + (i % 3) * .22, .32, i < 3 ? -.15 : .15); grp.add(f); });
  } else {
    const cols = sx * 2, rows = Math.max(1, Math.round(d.h / .7));
    const sideX = windowTex(d.wall, sz * 2, rows), front = windowTex(d.wall, cols, rows, true), plain = new THREE.MeshLambertMaterial({ color: d.wall });
    const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(sx - .2, d.h, sz - .2), [new THREE.MeshLambertMaterial({ map: sideX }), new THREE.MeshLambertMaterial({ map: sideX }), plain, plain, new THREE.MeshLambertMaterial({ map: front }), new THREE.MeshLambertMaterial({ map: front })]));
    body.position.y = d.h / 2; grp.add(body);
    const roofM = new THREE.MeshLambertMaterial({ color: d.roof, flatShading: true });
    if (d.arch) { const rr = (sz - .1) / 2, r = shadow(new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, sx - .1, 18, 1, false, -Math.PI / 2, Math.PI), roofM)); r.rotation.z = Math.PI / 2; r.position.y = d.h; grp.add(r); }
    else if (t === 'main') {
      const rim = shadow(new THREE.Mesh(new THREE.BoxGeometry(sx, .18, sz), roofM)); rim.position.y = d.h + .09; grp.add(rim);
      const tower = shadow(new THREE.Mesh(new THREE.BoxGeometry(.9, .8, .9), new THREE.MeshLambertMaterial({ color: d.wall }))); tower.position.set(0, d.h + .55, 0); grp.add(tower);
      const clock = new THREE.Mesh(new THREE.CircleGeometry(.28, 20), new THREE.MeshLambertMaterial({ map: canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill(); g.strokeStyle = '#2b4a3c'; g.lineWidth = 4; g.stroke(); g.beginPath(); g.moveTo(32, 32); g.lineTo(32, 12); g.moveTo(32, 32); g.lineTo(46, 36); g.stroke(); }) }));
      clock.position.set(0, d.h + .6, .46); grp.add(clock);
      const tr = shadow(new THREE.Mesh(new THREE.ConeGeometry(.7, .5, 4), roofM)); tr.rotation.y = Math.PI / 4; tr.position.set(0, d.h + 1.2, 0); grp.add(tr);
    } else {
      const r = shadow(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(sx, sz) / 2 * .78, .7, 4), roofM)); r.rotation.y = Math.PI / 4; r.scale.set(sx / Math.max(sx, sz), 1, sz / Math.max(sx, sz)); r.position.y = d.h + .35; grp.add(r);
    }
    if (d.recruit) { const flag = new THREE.Mesh(new THREE.PlaneGeometry(.5, .32), new THREE.MeshLambertMaterial({ color: '#ff6b8b', side: THREE.DoubleSide })); flag.position.set(.45, d.h + 1, 0); grp.add(flag); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .9), new THREE.MeshLambertMaterial({ color: '#666' })); pole.position.set(.2, d.h + .8, 0); grp.add(pole); }
  }
  return grp;
}
const footprint = (b) => { const [sx, sz] = BUILD[b.t].size; return b.r % 2 ? [sz, sx] : [sx, sz]; };
function cellsOf(b) { const [w, d] = footprint(b), out = []; for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push((b.x + i) + ',' + (b.z + j)); return out; }
const PATH = new Set(); for (let x = 7; x < 9; x++) for (let z = 5; z < N; z++) PATH.add(x + ',' + z);
function blocked(skip) { const s = new Set(); G.b.forEach(b => { if (b !== skip) cellsOf(b).forEach(c => s.add(c)); }); return s; }
function fits(b) { const [w, d] = footprint(b); if (b.x < 1 || b.z < 1 || b.x + w > N - 1 || b.z + d > N - 1) return false; const s = blocked(b); return cellsOf(b).every(c => !s.has(c) && (BUILD[b.t].deco || !PATH.has(c))); }

const world = new THREE.Group(); scene.add(world);
const meshes = new Map();
function setMeshPos(b, m) { const [w, d] = footprint(b); m.position.set(b.x + w / 2, 0, b.z + d / 2); m.rotation.y = -b.r * Math.PI / 2; }
function addMesh(b) { const m = makeBuilding(b.t); setMeshPos(b, m); m.userData.b = b; world.add(m); meshes.set(b, m); return m; }
G.b.forEach(addMesh);

/* ───────── 자원 말풍선 ───────── */
const iconTex = {};
function bubbleTex(k) { return iconTex[k] || (iconTex[k] = bubbleIcon(canvasTex(96, 112, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(48, 46, 42, 0, 7); g.fill(); g.beginPath(); g.moveTo(36, 82); g.lineTo(48, 108); g.lineTo(60, 82); g.fill(); g.strokeStyle = '#231c17'; g.lineWidth = 5; g.beginPath(); g.arc(48, 46, 40, 0, 7); g.stroke(); }), k)); }
function bubbleIcon(t, k) { const img = new Image(); img.onload = () => { const g = t.image.getContext('2d'); g.drawImage(img, 22, 20, 52, 52); t.needsUpdate = true; }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawIcon(k, 52).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')); return t; }
const bubbles = new Map();
function syncBubble(b, now) {
  const d = BUILD[b.t]; if (!d.prod) return;
  const ready = now - b.at >= d.prod[2] * 1000;
  let s = bubbles.get(b);
  if (ready && !s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(d.prod[0]), depthTest: false })); s.scale.set(.9, 1.05, 1); s.renderOrder = 10; s.userData.b = b; world.add(s); bubbles.set(b, s); }
  if (!ready && s) { world.remove(s); bubbles.delete(b); s = null; }
  if (s) { const m = meshes.get(b); s.position.set(m.position.x, d.h + 1.6 + Math.sin(now / 300 + b.x) * .08, m.position.z); }
}
function collect(b) {
  KS.fx('coin');
  const [k, n] = BUILD[b.t].prod; G.res[k] += n; b.at = Date.now(); save(); hud();
  const m = meshes.get(b); floatText(`+${n}${drawIcon(k, 20)}`, new THREE.Vector3(m.position.x, BUILD[b.t].h + 1.4, m.position.z));
}

/* ───────── 친구들 (2D SD 그림 스프라이트) ───────── */
const svgTex = (svg, cb) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 160; c.height = 336; c.getContext('2d').drawImage(img, 0, 0, 160, 336); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cb(t); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); };
const people = [];
function rosterOf(id) { return ROSTER.find(f => f.id === id) || { id, name: id, role: '' }; }
function freeCell() { const s = blocked(); for (let k = 0; k < 200; k++) { const x = 1 + Math.floor(Math.random() * (N - 2)), z = 1 + Math.floor(Math.random() * (N - 2)); if (!s.has(x + ',' + z)) return [x + .5, z + .5]; } return [8, 12]; }
const MAX_SHOWN = 18;   // 휴대폰이 느려지지 않게 캠퍼스에는 최대 18명만 나와 있다 (나머지는 수업 중)
function addPerson(id) {
  const spr = makeChibi(id, { scale: .7, noShadow: true, castShadow: false, lookUp: .5 });
  const [x, z] = freeCell(); spr.position.set(x, 0, z); spr.rotation.y = Math.random() * 6;
  const shade = new THREE.Mesh(new THREE.CircleGeometry(.24, 16), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .18 })); shade.rotation.x = -Math.PI / 2; shade.position.y = .01;
  const p = { id, spr, shade, ch: spr.userData.chibi, target: null, wait: Math.random() * 3, step: 0 };
  spr.userData.person = p; world.add(spr, shade); people.push(p);
  if (people.length > MAX_SHOWN) { const old = people.find(q => q.id !== 'seojun' && q !== p); world.remove(old.spr, old.shade); people.splice(people.indexOf(old), 1); }
  return p;
}
G.friends.forEach(addPerson);
function stepPeople(dt) {
  const s = blocked();
  people.forEach(p => {
    const o = p.spr.position;
    if (!p.target) { p.wait -= dt; if (p.wait <= 0) { const [tx, tz] = freeCell(); p.target = new THREE.Vector3(tx, 0, tz); } }
    else {
      const d = p.target.clone().sub(o); d.y = 0; const len = d.length();
      if (len < .05) { p.target = null; p.wait = 1.5 + Math.random() * 4; }
      else {
        const v = d.multiplyScalar(Math.min(1, dt * .9 / len)); const nx = o.x + v.x, nz = o.z + v.z;
        if (s.has(Math.floor(nx) + ',' + Math.floor(nz))) { p.target = null; p.wait = .3; } else { o.x = nx; o.z = nz; }
        // 화면 기준 왼쪽/오른쪽으로 걸으면 그림을 뒤집는다
      }
    }
    p.step += dt; const walking = !!p.target;
    // 걸을 땐 가는 쪽, 멈추면 카메라 쪽을 본다 (위에서 내려다봐도 얼굴이 보이게)
    let want = null;
    if (walking) { const d = p.target.clone().sub(o); if (d.lengthSq() > 1e-4) want = Math.atan2(d.x, d.z); }
    else { const c = world.worldToLocal(camera.position.clone()).sub(o); want = Math.atan2(c.x, c.z); }
    if (want != null) { let dr = want - p.spr.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.spr.rotation.y += dr * Math.min(1, dt * (walking ? 8 : 3)); }
    p.ch.set(walking ? 'walk' : 'idle'); p.ch.update(dt);
    p.shade.position.set(o.x, .01, o.z);
  });
}

/* ───────── 화면 위 글자 (말풍선 · 획득 표시) ───────── */
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
function floatText(text, v) { const [x, y] = toScreen(v), el = document.createElement('div'); el.className = 'float'; el.innerHTML = text; el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1000); }
let talk = null;
function say(p) {
  KS.fx('pop');
  if (talk) talk.el.remove();
  const f = rosterOf(p.id), el = document.createElement('div'); el.className = 'bubble';
  const own = typeof PROFILES !== 'undefined' && PROFILES[p.id] && PROFILES[p.id].lines.length ? PROFILES[p.id].lines : LINES;
  el.innerHTML = `<b>${f.name}</b>${own[Math.floor(Math.random() * own.length)]}<small>${f.role}</small>`;
  p.target = null; p.wait = 3.2; p.ch.face('happy', 2); p.ch.habitNow(); 
  document.body.appendChild(el); talk = { el, p, until: performance.now() + 3200 };
}
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200); }

/* ───────── HUD · 짓기 ───────── */
const level = () => 1 + Math.floor(G.b.filter(b => !BUILD[b.t].deco).length / 2);
function hud() {
  Object.keys(RES).forEach(k => { $('r-' + k).textContent = G.res[k]; });
  $('lv').innerHTML = `양일 캠퍼스<small>Lv.${level()} · 친구 ${G.friends.length}명</small>`;
  document.querySelectorAll('.bcard').forEach(c => c.classList.toggle('off', !canPay(BUILD[c.dataset.t].cost)));
}
const canPay = cost => Object.entries(cost || {}).every(([k, n]) => G.res[k] >= n);
const costText = cost => Object.entries(cost || {}).map(([k, n]) => `${RES_NAME[k]} ${n}`).join(' · ');
$('cards').innerHTML = ORDER.map(t => `<button class="bcard" data-t="${t}"><span class="bi">${drawIcon(t, 32)}</span><b>${BUILD[t].name}</b><small class="cost">${resText(BUILD[t].cost, 13)}</small>${typeof BUILD_BONUS !== 'undefined' && BUILD_BONUS[t] ? '<span class="tag">전투+</span>' : ''}</button>`).join('');
let ghost = null;   // 짓기 중인 건물 { b, mesh }
function startPlace(t) {
  if (!canPay(BUILD[t].cost)) { toast(`${BUILD[t].name}을(를) 지으려면 ${costText(BUILD[t].cost)}이 필요해요`); return; }
  cancelPlace(); hideInfo();
  const t0 = controls.target, b = { t, x: Math.round(t0.x - BUILD[t].size[0] / 2), z: Math.round(t0.z - BUILD[t].size[1] / 2), r: 0, at: Date.now() };
  const mesh = makeBuilding(t); mesh.traverse(o => { if (o.material) { o.material = (Array.isArray(o.material) ? o.material : [o.material]).map(m => { const c = m.clone(); c.transparent = true; c.opacity = .7; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
  const [w, d] = footprint(b), pad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#3fbf6f', transparent: true, opacity: .45 })); pad.rotation.x = -Math.PI / 2; pad.position.y = .02;
  ghost = { b, mesh, pad }; world.add(mesh, pad); updateGhost();
  document.querySelectorAll('.bcard').forEach(c => c.classList.toggle('on', c.dataset.t === t));
  $('place').classList.add('show');
}
function updateGhost() {
  if (!ghost) return; const { b, mesh, pad } = ghost, [w, d] = footprint(b), ok = fits(b);
  setMeshPos(b, mesh); pad.scale.set(w, d, 1); pad.position.set(b.x + w / 2, .02, b.z + d / 2); pad.material.color.set(ok ? '#3fbf6f' : '#e5484d');
  $('p-ok').disabled = !ok;
}
function cancelPlace() { if (!ghost) return; world.remove(ghost.mesh, ghost.pad); ghost = null; $('place').classList.remove('show'); document.querySelectorAll('.bcard').forEach(c => c.classList.remove('on')); }
function confirmPlace() {
  if (!ghost || !fits(ghost.b)) return; const b = ghost.b, d = BUILD[b.t];
  if (!canPay(d.cost)) { toast('자원이 모자라요'); return; }
  Object.entries(d.cost || {}).forEach(([k, n]) => { G.res[k] -= n; });
  b.at = Date.now(); G.b.push(b); addMesh(b); cancelPlace();
  KS.fx('build'); if (d.recruit) recruit(); else toast(`${d.name}을(를) 지었어요!`);
  save(); hud();
}
function recruit() {
  setTimeout(() => KS.fx('fanfare'), 500);
  const pool = ROSTER.filter(f => !G.friends.includes(f.id));
  if (!pool.length) { toast('모든 친구가 캠퍼스에 모였어요!'); return; }
  const f = pool[Math.floor(Math.random() * pool.length)]; G.friends.push(f.id); const p = addPerson(f.id);
  toast(`동아리방 완성 · ${f.name} 합류`); setTimeout(() => say(p), 600);
}
$('cards').addEventListener('click', e => { const c = e.target.closest('.bcard'); if (c) { KS.fx('click'); startPlace(c.dataset.t); } });
KS.play('campus'); KS.bind($('b-music'));
document.querySelectorAll('.rbtn, .pbtn').forEach(b => b.addEventListener('click', () => KS.fx('click')));
$('p-no').onclick = cancelPlace; $('p-ok').onclick = confirmPlace;
$('p-rot').onclick = () => { if (ghost) { ghost.b.r = (ghost.b.r + 1) % 4; updateGhost(); } };
function showInfo(b) {
  const d = BUILD[b.t], el = $('info');
  const left = d.prod ? Math.max(0, Math.ceil((d.prod[2] * 1000 - (Date.now() - b.at)) / 1000)) : 0;
  el.innerHTML = `<span class="bi">${drawIcon(b.t, 32)}</span><span><b>${d.name}</b><small>${d.prod ? `${RES_NAME[d.prod[0]]} ${d.prod[1]}개 / ${d.prod[2]}초${left ? ` · ${left}초 뒤 완성` : ' · 지금 모을 수 있어요'}` : d.recruit ? '친구들이 모이는 곳' : '캠퍼스를 꾸며 줘요'}${typeof BUILD_BONUS !== 'undefined' && BUILD_BONUS[b.t] ? `<br>전투 보너스 · ${BUILD_BONUS[b.t].text}` : d.deco ? '<br>꾸미기 4개마다 모든 친구 체력 +3%' : ''}</small></span>${d.fixed ? '' : '<button id="i-del">허물기</button>'}`;
  el.classList.add('show'); el.dataset.sel = G.b.indexOf(b);
  const del = $('i-del'); if (del) del.onclick = () => { const m = meshes.get(b); world.remove(m); meshes.delete(b); const s = bubbles.get(b); if (s) { world.remove(s); bubbles.delete(b); } G.b.splice(G.b.indexOf(b), 1); Object.entries(d.cost || {}).forEach(([k, n]) => { G.res[k] += Math.floor(n / 2); }); save(); hud(); hideInfo(); toast('허물고 자원 절반을 돌려받았어요'); };
}
function hideInfo() { $('info').classList.remove('show'); }

/* ───────── 누르기 (끌기와 구분) ───────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 8) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (ghost) { const hit = new THREE.Vector3(); if (ray.ray.intersectPlane(plane, hit)) { const [w, d] = footprint(ghost.b); ghost.b.x = Math.round(hit.x - w / 2); ghost.b.z = Math.round(hit.z - d / 2); updateGhost(); } return; }
  const hs = ray.intersectObjects([...bubbles.values()], false)[0];
  if (hs) { collect(hs.object.userData.b); return; }
  const hp = ray.intersectObjects(people.map(p => p.spr), true)[0];
  if (hp) { const root = hp.object.userData.chibiRoot; if (root && root.userData.person) { say(root.userData.person); return; } }
  const hb = ray.intersectObjects([...meshes.values()], true)[0];
  if (hb) { let o = hb.object; while (o && !o.userData.b) o = o.parent; if (o) { const b = o.userData.b; if (bubbles.has(b)) collect(b); else showInfo(b); return; } }
  hideInfo();
});
$('b-rot').onclick = () => { camAngle += Math.PI / 2; placeCamera(); };
$('b-in').onclick = () => { camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.25); camera.updateProjectionMatrix(); };
$('b-out').onclick = () => { camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.25); camera.updateProjectionMatrix(); };
$('b-back').onclick = () => { location.href = '../'; };
$('b-fight').onclick = () => { save(); location.href = 'team.html'; };

/* ───────── 반복 ───────── */
const clock = new THREE.Clock();
// 느린 기기 안전장치: 처음 4초 평균이 느리면 친구 수 · 화질을 낮춘다
const PERF = { t0: performance.now(), n: 0, done: false };
function perfCheck() {
  if (PERF.done) return; PERF.n++; const el = performance.now() - PERF.t0;
  if (el < 4000) return; PERF.done = true; const fps = PERF.n / (el / 1000);
  if (fps < 28) { renderer.setPixelRatio(1); while (people.length > 10) { const old = people.find(q => q.id !== 'seojun'); world.remove(old.spr, old.shade); people.splice(people.indexOf(old), 1); } }
}
function loop() {
  const dt = Math.min(clock.getDelta(), .05), now = Date.now();
  controls.update(); stepPeople(dt); perfCheck();
  G.b.forEach(b => syncBubble(b, now));
  if (talk) { if (performance.now() > talk.until) { talk.el.remove(); talk = null; } else { const [x, y] = toScreen(talk.p.spr.position.clone().add(new THREE.Vector3(0, 1.9, 0))); talk.el.style.left = x + 'px'; talk.el.style.top = y + 'px'; } }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
hud(); loop();
setInterval(save, 10000);
$('loading').remove();
if (!localStorage.getItem(SAVE)) { save(); setTimeout(() => toast('끌어서 둘러보고, 아래에서 건물을 골라 지어 보세요!'), 600); }
window.__kingdom = { G, BUILD, people, meshes, bubbles, camera, controls, renderer };
