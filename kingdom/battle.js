// 팀 전투 (1-1 은행나무길 · 보스 은행왕): 자동 공격 · 스킬 게이지 · 필살기 컷인 · 위험 구역 · 3겹 체력
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ───────── 팀 구성 (팀 편성 화면에서 고른 친구) ───────── */
const DEFAULT_TEAM = ['junyoung', 'jeonggyu', 'yunsu', 'seojun', 'yejun'];
let PICK = [];
try { PICK = (JSON.parse(localStorage.getItem(TEAM_KEY)) || []).slice(0, 5); } catch (e) {}
if (!PICK.length) PICK = DEFAULT_TEAM.slice();
const FX = teamFx(PICK);
const nameOf = id => (ROSTER.find(f => f.id === id) || { name: id }).name;
const introOf = id => (ROSTER.find(f => f.id === id) || { role: '' }).role.split(' · ')[0];

/* ───────── 장면 ───────── */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
scene.background = tex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1d4a'); gr.addColorStop(.45, '#8a3f5e'); gr.addColorStop(.7, '#f08a4b'); gr.addColorStop(1, '#ffd08a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
scene.fog = new THREE.Fog('#b0566a', 16, 40);
const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
const camBase = new THREE.Vector3();
function resize() { const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.position.set(-.6, 6.8, 16.5 * Math.max(1, 1.6 / camera.aspect)); camera.lookAt(-.4, 1.0, -.6); camBase.copy(camera.position); camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .75, .5, 1.0);
composer.addPass(bloom); composer.addPass(new OutputPass());
addEventListener('resize', () => { composer.setSize(innerWidth, innerHeight); }); 
addEventListener('resize', resize); resize(); composer.setSize(innerWidth, innerHeight); composer.setPixelRatio(Math.min(devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight('#ffb98a', '#2a2040', .55));
const sun = new THREE.DirectionalLight('#ffb070', 2.2); sun.position.set(-8, 7, -6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -6, near: 1, far: 40 }); sun.shadow.bias = -.0005; scene.add(sun);
const fill = new THREE.DirectionalLight('#8fa8ff', .55); fill.position.set(6, 5, 10); scene.add(fill);

// 바닥: 돌판 안뜰
const floorT = tex(512, 512, (g) => { g.fillStyle = '#6b5a52'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const l = 38 + Math.random() * 10; g.fillStyle = `hsl(20, 12%, ${l}%)`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } g.fillStyle = 'rgba(255,200,80,.18)'; for (let k = 0; k < 90; k++) { g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 6, 4, Math.random() * 3, 0, 7); g.fill(); } });
floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(6, 3);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ map: floorT, roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
// 뒤쪽 본관 실루엣 + 불 켜진 창문
const winT = tex(256, 128, (g, w, h) => { g.fillStyle = '#3a2f45'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = Math.random() < .55 ? '#ffd27a' : '#2a2236'; g.fillRect(i * 16 + 4, j * 32 + 8, 8, 14); } });
const bld = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 3), [0, 0, 0, 0, 1, 0].map(k => new THREE.MeshStandardMaterial(k ? { map: winT, emissive: '#ffffff', emissiveMap: winT, emissiveIntensity: .55 } : { color: '#3a2f45' })));
bld.position.set(1, 3.5, -12); scene.add(bld);
const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshStandardMaterial({ color: '#3a2f45' })); tower.position.set(1, 9, -12); scene.add(tower);
const clockM = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2a0').multiplyScalar(1.8) })); clockM.position.set(1, 9.3, -10.45); scene.add(clockM);
// 양옆 은행나무 (어둑하게)
function tree(x, z, s) { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.18 * s, .28 * s, 2 * s, 7), new THREE.MeshStandardMaterial({ color: '#4a3020' })); tr.position.y = s; tr.castShadow = true; g.add(tr); const lm = new THREE.MeshStandardMaterial({ color: '#d99a1e', flatShading: true, roughness: .8 }); [[0, 2.4, 0, 1.1], [.6, 2, .3, .8], [-.6, 2.1, -.2, .85], [0, 3, 0, .8]].forEach(([a, b, c, r]) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), lm); l.position.set(a * s, b * s, c * s); l.castShadow = true; g.add(l); }); g.position.set(x, 0, z); scene.add(g); }
[[-11, -5, 1.2], [-8, -8, 1], [11, -5, 1.2], [8.5, -8.5, 1], [-14, 0, 1.3], [14, -1, 1.3]].forEach(a => tree(...a));

/* ───────── 보스: 은행나무 골렘 ───────── */
const boss = new THREE.Group(); boss.position.set(5.2, 0, -.6); scene.add(boss);
const bark = new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: .95, flatShading: true });
const leafM = new THREE.MeshStandardMaterial({ color: '#f2b720', emissive: '#a05a00', emissiveIntensity: .35, flatShading: true, roughness: .6 });
const cast = o => { o.castShadow = true; o.receiveShadow = true; return o; };
const trunk = cast(new THREE.Mesh(new THREE.CylinderGeometry(.85, 1.25, 3.4, 9, 3), bark)); trunk.position.y = 2.3; trunk.rotation.z = .06; boss.add(trunk);
[[-.9, .45, .5, -.7], [.95, .4, .4, .8], [0, .4, -1, 0], [.2, .4, 1.05, .3]].forEach(([x, y, z, r]) => { const root = cast(new THREE.Mesh(new THREE.ConeGeometry(.42, 1.6, 6), bark)); root.position.set(x, y, z); root.rotation.set(z * .6, 0, r + Math.PI); boss.add(root); });
const arms = [];
function arm(side) { const g = new THREE.Group(); arms.push(g); g.userData.side = side; const a = cast(new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 2.4, 7), bark)); a.position.y = 1.1; g.add(a); const fist = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 0), leafM)); fist.position.y = 2.4; g.add(fist); g.position.set(side * 1, 3.1, .2); g.rotation.z = side * -1.05; g.rotation.x = -.25; boss.add(g); }
arm(-1); arm(1);
[[0, 5, 0, 1.6], [1.1, 4.6, .3, 1.15], [-1.1, 4.7, -.1, 1.2], [.3, 5.9, -.2, 1.1], [-.5, 4.3, .9, .9], [.7, 4.2, -.9, 1]].forEach(([x, y, z, r]) => { const l = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM)); l.position.set(x, y, z); boss.add(l); });
// 얼굴: 빛나는 눈 + 갈라진 입
const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffef9a').multiplyScalar(3) });
[-.38, .38].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), eyeM); e.position.set(x, 3.05, .98); e.scale.set(1.4, .7, .6); boss.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .1), bark); brow.position.set(x, 3.3, 1); brow.rotation.z = x > 0 ? .45 : -.45; boss.add(brow); });
const mouth = new THREE.Mesh(new THREE.BoxGeometry(.8, .14, .1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a3c').multiplyScalar(2.2) })); mouth.position.set(0, 2.55, 1.05); boss.add(mouth);
const eyeLight = new THREE.PointLight('#ffb040', 6, 6, 1.6); eyeLight.position.set(0, 3.1, 1.6); boss.add(eyeLight);
const aura = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.6, 48), new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false })); aura.rotation.x = -Math.PI / 2; aura.position.y = .02; boss.add(aura);

// 떠다니는 은행잎
const leafT = tex(32, 32, (g) => { g.fillStyle = '#ffcf3a'; g.beginPath(); g.moveTo(16, 28); g.lineTo(4, 10); g.quadraticCurveTo(16, 0, 28, 10); g.closePath(); g.fill(); });
const pts = new THREE.BufferGeometry(), P = [];
for (let i = 0; i < 160; i++) P.push((Math.random() - .3) * 18, Math.random() * 7, (Math.random() - .5) * 10);
pts.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
scene.add(new THREE.Points(pts, new THREE.PointsMaterial({ map: leafT, size: .28, transparent: true, depthWrite: false })));

/* ───────── 전투 데이터 ───────── */
const BOLT = { blaster: '#ffb84d', mage: '#b48bff', healer: '#7dff9e', support: '#ffd779' };
const CUT_BG = { tank: '#1c3358', striker: '#5a2018', blaster: '#5a3010', mage: '#2a1d55', healer: '#14503a', support: '#4a3c10' };
// 앞줄(방어·돌격)은 보스 앞, 뒷줄은 뒤에서
const FRONT = [[2.5, .7], [2.3, -1.0], [1.1, .2]], BACK = [[-1.0, 1.1], [-2.6, -.6], [-4.1, .9], [-.2, -1.4], [-5.4, -.4]];
const ordered = PICK.slice().sort((a, b) => ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
let fi = 0, bi = 0;
const STATS = Object.fromEntries(ordered.map(id => {
  const k = kitOf(id), r = ROLES[k.role], front = !!r.melee && fi < FRONT.length, home = front ? FRONT[fi++] : BACK[bi++] || [-5, 0];
  return [id, { role: k.role, hp: Math.round(r.hp * FX.hp), atk: r.atk * (r.melee ? FX.melee : FX.ranged), rate: r.rate, melee: front, home, cd: r.cd / FX.charge, skill: k.skill, who: `${nameOf(id)} · ${introOf(id)}`, c1: CUT_BG[k.role], bg: CUT_BG[k.role], bolt: BOLT[k.role] || '#ffffff', color: r.color }];
}));
const SKILL_ORDER = ordered;
document.getElementById('syn').innerHTML = teamSynergy(PICK).filter(x => x.on).map(x => `<b>${x.name}</b>${x.desc}`).join(' · ');
const SYNERGY = FX.skill;
const LAYERS = [13000, 13000, 13000];     // 보스 체력 3겹
const TIME_LIMIT = 90;

/* ───────── 작은 도구 ───────── */
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const additive = (color, opacity = 1) => new THREE.SpriteMaterial({ map: glowT, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
const glowT = tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
// 시간에 따라 움직이는 일 (게임 시간 기준이라 일시정지·배속을 따른다)
const tweens = [];
function tween(dur, step, done) { tweens.push({ t: 0, dur, step, done }); }
function runTweens(dt) { for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.step && w.step(k); if (k >= 1) { tweens.splice(i, 1); w.done && w.done(); } } }
function popText(v, cls, html) { const [x, y] = toScreen(v), el = document.createElement('div'); el.className = 'dmg ' + cls; el.innerHTML = html; el.style.left = x + 'px'; el.style.top = y + 'px'; $('hud').appendChild(el); setTimeout(() => el.remove(), 950); }
function flash(color, size, pos, dur = .45) { const s = new THREE.Sprite(additive(color)); s.position.copy(pos); s.scale.set(size * .4, size * .4, 1); scene.add(s); tween(dur, k => { const z = size * (.4 + k * .8); s.scale.set(z, z, 1); s.material.opacity = 1 - k; }, () => scene.remove(s)); }
let shakeT = 0, shakeAmp = 0; const shake = (amp, dur = .3) => { shakeAmp = Math.max(shakeAmp, amp); shakeT = Math.max(shakeT, dur); };

/* ───────── 친구들 ───────── */
function spriteTex(id, pose, expr, cb) {
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 504; c.getContext('2d').drawImage(img, 0, 0, 240, 504); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cb(t); };
  img.src = svgURL(kitSVG(id, pose, expr));
}
const units = ordered.map(id => {
  const st = STATS[id];
  const mat = new THREE.SpriteMaterial({ transparent: true, alphaTest: .05 });
  const spr = new THREE.Sprite(mat); spr.center.set(.5, 0); spr.scale.set(1.6, 3.36, 1);
  const u = { id, st, hp: st.hp, max: st.hp, home: new THREE.Vector3(st.home[0], 0, st.home[1]), pos: new THREE.Vector3(st.home[0] - 9, 0, st.home[1]), atkT: rnd(0, st.rate), gauge: rnd(.25, .55), shield: 0, shieldT: 0, dead: false, spr, frames: {}, hitT: 0, lunge: 0, step: 0 };
  ['stand', 'walk', 'wave'].forEach(pose => spriteTex(id, pose, pose === 'wave' ? 'proud' : 'smile', tx => { u.frames[pose] = tx; if (!mat.map) { mat.map = tx; mat.needsUpdate = true; } }));
  u.ring = new THREE.Mesh(new THREE.RingGeometry(.42, .6, 32), new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); u.ring.rotation.x = -Math.PI / 2;
  u.shadow = new THREE.Mesh(new THREE.CircleGeometry(.38, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35 })); u.shadow.rotation.x = -Math.PI / 2;
  u.bubble = new THREE.Sprite(additive('#7fb3ff', 0)); u.bubble.scale.set(1.9, 2.6, 1);
  scene.add(spr, u.ring, u.shadow, u.bubble);
  const bar = document.createElement('div'); bar.className = 'unit'; bar.innerHTML = '<div class="bar"><i></i></div>'; $('hud').appendChild(bar); u.bar = bar;
  return u;
});
const U = id => units.find(u => u.id === id);
const alive = () => units.filter(u => !u.dead);
let buffT = 0;   // 지원 스킬: 팀 공격력 +40%

/* ───────── 보스 상태 ───────── */
const B = { layer: 0, hp: LAYERS[0], trail: LAYERS[0], slamT: 3, bombT: 6.5, stun: 0, burn: 0, burnT: 0, stagger: 0, taunt: 0, dead: false, flashT: 0 };
const bossCenter = new THREE.Vector3(5.2, 2.6, .4);
const LEAF_COLORS = ['#f2b720', '#ff8a2a', '#ff4a3a'];
const stunStars = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(additive('#ffe58a')); s.scale.set(.5, .5, 1); stunStars.add(s); } stunStars.visible = false; stunStars.position.set(5.2, 6.4, -.4); scene.add(stunStars);
function damageBoss(n, opts = {}) {
  if (B.dead || over) return;
  const crit = opts.crit ?? Math.random() < .15, dmg = Math.round(n * (crit ? 1.8 : 1) * (weakT > 0 ? 1.25 : 1) * rnd(.92, 1.08));
  B.hp -= dmg; B.flashT = .12;
  const at = bossCenter.clone().add(new THREE.Vector3(rnd(-1.2, 1.2), rnd(-.6, 1.4), 1));
  popText(at, crit || opts.big ? 'big' : 'mid', fmt(dmg) + (crit ? '<small>크리티컬!</small>' : ''));
  if (opts.big || crit) shake(crit ? .12 : .08);
  while (B.hp <= 0 && !B.dead) {
    if (B.layer >= LAYERS.length - 1) { B.hp = 0; B.dead = true; finish(true); break; }
    B.layer++; const carry = -B.hp; B.hp = LAYERS[B.layer] - carry; B.trail = LAYERS[B.layer]; B.stagger = 1.4;
    leafM.color.set(LEAF_COLORS[B.layer]); leafM.emissive.set(B.layer === 2 ? '#b0200a' : '#b04a00');
    popText(bossCenter.clone().add(new THREE.Vector3(0, 2.2, 0)), 'info', B.layer === 2 ? '마지막 한 겹! 은행왕이 분노했다' : '한 겹 격파!');
    flash('#ffd27a', 7, bossCenter, .7); shake(.22, .5);
    const c = $('b-count'); c.classList.add('pop'); setTimeout(() => c.classList.remove('pop'), 250);
  }
}
function hurt(u, n, cls = 'taken') {
  if (u.dead || over) return;
  if (veilT > 0) { popText(u.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), 'block', '회피!'); return; }
  let left = Math.round(n * FX.guard * rnd(.92, 1.08));
  if (u.shield > 0) { const used = Math.min(u.shield, left); u.shield -= used; left -= used; if (used) popText(u.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), 'block', '막음 ' + fmt(used)); }
  if (left <= 0) return;
  u.hp -= left; u.hitT = .18; popText(u.pos.clone().add(new THREE.Vector3(.3, 2.3, 0)), cls, '-' + fmt(left));
  if (u.hp <= 0) { u.hp = 0; u.dead = true; u.spr.material.opacity = .35; u.spr.material.rotation = .5; u.ring.visible = false; if (!alive().length) finish(false); }
}
function heal(u, n) { if (u.dead) return; const v = Math.min(u.max - u.hp, Math.round(n)); u.hp += v; popText(u.pos.clone().add(new THREE.Vector3(0, 2.8, 0)), 'heal', '+' + fmt(v)); flash('#7dff9e', 2.4, u.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), .6); }

/* ───────── 날아가는 것 ───────── */
function bolt(from, to, color, dur, done, size = .55, arc = 0) {
  const s = new THREE.Sprite(additive(color)); s.scale.set(size, size, 1); s.position.copy(from); scene.add(s);
  tween(dur, k => { s.position.lerpVectors(from, to, k); s.position.y += Math.sin(k * Math.PI) * arc; }, () => { scene.remove(s); done && done(); });
}
const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#7dffb0').multiplyScalar(2.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
function beam(from, to, color = '#7dffb0') {
  const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + to.x) / 2, 5.4, 0), to);
  const mm = beamMat.clone(); mm.color = new THREE.Color(color).multiplyScalar(2.5); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .09, 8), mm); scene.add(m);
  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .24, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(glow);
  tween(.7, k => { const o = k < .25 ? k / .25 : 1 - (k - .25) / .75; m.material.opacity = .95 * o; glow.material.opacity = .25 * o; }, () => { scene.remove(m, glow); });
}

/* ───────── 스킬 ───────── */
/* ───────── 친구별 스킬 연출과 효과 ───────── */
// 아이콘: 캔버스로 그린 작은 그림 (공 · 플라스크 · 음표 · 체스 말 …)
const ICON = {};
function iconTex(kind) {
  if (ICON[kind]) return ICON[kind];
  const t = tex(128, 128, (g) => {
    g.translate(64, 64); g.lineCap = 'round'; g.lineJoin = 'round';
    const circle = (r, fill, stroke, w = 6) => { g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = w; g.strokeStyle = stroke; g.stroke(); } };
    const text = (s, size, color, stroke) => { g.font = `bold ${size}px Jua, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (stroke) { g.lineWidth = 10; g.strokeStyle = stroke; g.strokeText(s, 0, 4); } g.fillStyle = color; g.fillText(s, 0, 4); };
    const D = {
      soccer: () => { circle(46, '#fff', '#222'); g.fillStyle = '#222'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; g.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); } g.fill(); },
      baseball: () => { circle(44, '#fff', '#bbb'); g.strokeStyle = '#e5484d'; g.lineWidth = 5; g.beginPath(); g.arc(-58, 0, 44, -.7, .7); g.stroke(); g.beginPath(); g.arc(58, 0, 44, Math.PI - .7, Math.PI + .7); g.stroke(); },
      basketball: () => { circle(46, '#e8823a', '#7a3b10'); g.strokeStyle = '#7a3b10'; g.lineWidth = 5; g.beginPath(); g.moveTo(-46, 0); g.lineTo(46, 0); g.moveTo(0, -46); g.lineTo(0, 46); g.stroke(); g.beginPath(); g.arc(-60, 0, 44, -.8, .8); g.stroke(); g.beginPath(); g.arc(60, 0, 44, Math.PI - .8, Math.PI + .8); g.stroke(); },
      flask: () => { g.fillStyle = '#dff'; g.strokeStyle = '#6aa'; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, -44); g.lineTo(10, -44); g.lineTo(10, -14); g.lineTo(38, 34); g.quadraticCurveTo(40, 46, 28, 46); g.lineTo(-28, 46); g.quadraticCurveTo(-40, 46, -38, 34); g.lineTo(-10, -14); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#5dff8a'; g.beginPath(); g.moveTo(-30, 22); g.lineTo(30, 22); g.lineTo(36, 38); g.lineTo(-36, 38); g.fill(); },
      code: () => text('</>', 56, '#5dff8a', '#0b2a16'),
      note: () => text('♪', 96, '#ffd779', '#4a3000'),
      heart: () => { g.fillStyle = '#ff6b8b'; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-60, 0, -30, -50, 0, -18); g.bezierCurveTo(30, -50, 60, 0, 0, 40); g.fill(); },
      cross: () => { circle(46, '#fff', '#e5484d'); g.fillStyle = '#e5484d'; g.fillRect(-10, -30, 20, 60); g.fillRect(-30, -10, 60, 20); },
      star: () => { g.fillStyle = '#ffd779'; g.strokeStyle = '#b8860b'; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 20 : 48, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); },
      shuriken: () => { g.fillStyle = '#9aa4ad'; g.strokeStyle = '#2b3440'; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 12 : 50, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); circle(8, '#2b3440'); },
      chess: () => text('♛', 100, '#f4f1e8', '#2a2420'),
      knight: () => text('♞', 100, '#2a2420', '#f4f1e8'),
      coin: () => { circle(42, '#ffd23f', '#b8860b'); text('₩', 50, '#b8860b'); },
      pepper: () => { g.fillStyle = '#e0301e'; g.beginPath(); g.ellipse(4, 8, 18, 40, -.5, 0, 7); g.fill(); g.fillStyle = '#3f8a3a'; g.fillRect(-14, -46, 14, 16); },
      drill: () => { g.fillStyle = '#4a7fd6'; g.beginPath(); g.moveTo(-40, -22); g.lineTo(50, 0); g.lineTo(-40, 22); g.closePath(); g.fill(); g.strokeStyle = '#cfe0ff'; g.lineWidth = 4; for (let i = -24; i < 40; i += 16) { g.beginPath(); g.moveTo(i, -18 + (i + 40) * .2); g.lineTo(i + 8, 18 - (i + 40) * .2); g.stroke(); } },
      rocket: () => { g.fillStyle = '#e8eef5'; g.beginPath(); g.ellipse(0, -4, 18, 44, 0, 0, 7); g.fill(); g.fillStyle = '#e5484d'; g.beginPath(); g.moveTo(-18, 20); g.lineTo(-32, 44); g.lineTo(-10, 34); g.fill(); g.beginPath(); g.moveTo(18, 20); g.lineTo(32, 44); g.lineTo(10, 34); g.fill(); circle(0, '#fff'); g.fillStyle = '#3f7fb8'; g.beginPath(); g.arc(0, -10, 8, 0, 7); g.fill(); },
      drop: () => { g.fillStyle = '#5ab8ff'; g.beginPath(); g.moveTo(0, -48); g.bezierCurveTo(30, -10, 40, 10, 0, 44); g.bezierCurveTo(-40, 10, -30, -10, 0, -48); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-10, 6, 6, 12, 0, 0, 7); g.fill(); },
      sprout: () => { g.strokeStyle = '#3f8a3a'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 46); g.lineTo(0, -6); g.stroke(); g.fillStyle = '#6bc36b'; g.beginPath(); g.ellipse(-20, -14, 24, 12, -.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(20, -24, 24, 12, .5, 0, 7); g.fill(); },
      smoke: () => { g.fillStyle = 'rgba(210,214,224,.95)'; [[-20, 6, 28], [16, 0, 30], [0, -18, 26], [-4, 16, 24]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); },
      wrench: () => { g.rotate(-.7); g.fillStyle = '#b8c0c8'; g.fillRect(-7, -10, 14, 56); g.beginPath(); g.arc(0, -24, 22, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,0)'; g.globalCompositeOperation = 'destination-out'; g.fillRect(-7, -48, 14, 22); },
      laugh: () => text('ㅋㅋ', 60, '#ffd779', '#4a3000'),
      zzz: () => text('Zz', 64, '#cfe0ff', '#1d2a50'),
      wave: () => { g.strokeStyle = '#ffd779'; g.lineWidth = 8; [18, 32, 46].forEach(r => { g.beginPath(); g.arc(-30, 0, r, -.7, .7); g.stroke(); }); },
      card: () => { g.fillStyle = '#e8c14a'; g.strokeStyle = '#a8861a'; g.lineWidth = 5; g.beginPath(); g.roundRect(-44, -28, 88, 56, 8); g.fill(); g.stroke(); g.fillStyle = '#a8861a'; g.fillRect(-32, -12, 20, 14); },
      book: () => { g.fillStyle = '#3f7fb8'; g.fillRect(-44, -32, 88, 64); g.fillStyle = '#f4f1e8'; g.fillRect(-38, -26, 76, 52); g.strokeStyle = '#3f7fb8'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, 26); g.stroke(); },
      bolt: () => { g.fillStyle = '#ffe14d'; g.strokeStyle = '#9a6a10'; g.lineWidth = 4; g.beginPath(); g.moveTo(8, -50); g.lineTo(-24, 6); g.lineTo(-2, 6); g.lineTo(-10, 50); g.lineTo(26, -8); g.lineTo(4, -8); g.closePath(); g.fill(); g.stroke(); },
      lightstick: () => { g.rotate(.5); g.fillStyle = '#2a2f36'; g.fillRect(-7, 6, 14, 42); g.fillStyle = '#ff9ad5'; g.beginPath(); g.arc(0, -16, 26, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(-8, -24, 8, 0, 7); g.fill(); },
      egg: () => { g.fillStyle = '#fff7e8'; g.strokeStyle = '#d9c7a3'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 4, 32, 42, 0, 0, 7); g.fill(); g.stroke(); },
      robot: () => { g.fillStyle = '#9aa4ad'; g.beginPath(); g.roundRect(-34, -26, 68, 52, 10); g.fill(); g.fillStyle = '#5dd8ff'; g.fillRect(-22, -10, 14, 10); g.fillRect(8, -10, 14, 10); g.strokeStyle = '#e2772d'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -26); g.lineTo(0, -44); g.stroke(); circle(0, '#fff'); },
      shield: () => { g.fillStyle = '#5b8def'; g.strokeStyle = '#1d3a7a'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, -46); g.lineTo(38, -30); g.lineTo(34, 10); g.quadraticCurveTo(22, 38, 0, 48); g.quadraticCurveTo(-22, 38, -34, 10); g.lineTo(-38, -30); g.closePath(); g.fill(); g.stroke(); },
      dumbbell: () => { g.fillStyle = '#6b7280'; g.fillRect(-36, -6, 72, 12); g.fillStyle = '#2a2f36'; g.fillRect(-50, -24, 16, 48); g.fillRect(34, -24, 16, 48); },
      flag: () => { g.fillStyle = '#222'; g.fillRect(-36, -44, 6, 92); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#111'; g.fillRect(-30 + i * 16, -44 + j * 16, 16, 16); } },
      mic: () => { g.fillStyle = '#2a2f36'; g.fillRect(-7, 4, 14, 44); circle(24, '#b8bec6', '#6b7280'); g.translate(0, -18); },
      map: () => { g.fillStyle = '#f4e6c4'; g.strokeStyle = '#b8a070'; g.lineWidth = 4; g.beginPath(); g.moveTo(-44, -30); g.lineTo(-14, -20); g.lineTo(14, -30); g.lineTo(44, -20); g.lineTo(44, 34); g.lineTo(14, 24); g.lineTo(-14, 34); g.lineTo(-44, 24); g.closePath(); g.fill(); g.stroke(); g.setLineDash([6, 6]); g.strokeStyle = '#e5484d'; g.beginPath(); g.moveTo(-30, 14); g.quadraticCurveTo(0, -24, 30, 4); g.stroke(); },
      blueprint: () => { g.fillStyle = '#2f6fbf'; g.fillRect(-46, -32, 92, 64); g.strokeStyle = '#cfe6ff'; g.lineWidth = 4; g.strokeRect(-34, -20, 30, 40); g.strokeRect(6, -6, 28, 26); },
      punch: () => { g.fillStyle = '#ffe14d'; g.strokeStyle = '#ff5a3c'; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 16; i++) { const r = i % 2 ? 22 : 50, a = i * Math.PI / 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); },
      line: () => { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.moveTo(-50, 30); g.lineTo(50, -30); g.stroke(); },
      phone: () => { g.fillStyle = '#2a2f36'; g.beginPath(); g.roundRect(-24, -44, 48, 88, 8); g.fill(); g.fillStyle = '#7fd0ff'; g.fillRect(-18, -34, 36, 62); text('★', 36, '#ffd779'); },
      makeup: () => { g.rotate(.6); g.fillStyle = '#d4606f'; g.fillRect(-10, -6, 20, 40); g.fillStyle = '#f4c2c2'; g.beginPath(); g.moveTo(-10, -6); g.lineTo(0, -40); g.lineTo(10, -6); g.fill(); },
    };
    (D[kind] || D.star)();
  });
  ICON[kind] = t; return t;
}
const iconSprite = (kind, size = .7) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(kind), transparent: true, depthWrite: false, depthTest: false })); s.renderOrder = 20; const z = size * 1.45; s.scale.set(z, z, 1); scene.add(s); return s; };
const handOf = u => u.pos.clone().add(new THREE.Vector3(.45, 1.9, 0));
const bossHit = (spread = 1) => bossCenter.clone().add(new THREE.Vector3(rnd(-.7, .7) * spread, rnd(-.9, 1.1) * spread, .9));
let weakT = 0, hasteT = 0, veilT = 0;
B.miss = 0;

// 연출 묶음: 각자 맞을 때(onHit) 피해를 준다
const VIS = {
  // 포물선으로 던지기 (농구공 · 플라스크 · 체스 말)
  lob: (u, s, onHit, end) => { for (let i = 0; i < s.n; i++) tween(i * (s.gap ?? .22), null, () => { const sp = iconSprite(s.icon, (s.size || .7) * (s.sc || 1)), from = handOf(u), to = bossHit(.7); tween(s.dur || .55, k => { sp.position.lerpVectors(from, to, k); sp.position.y += Math.sin(k * Math.PI) * Math.min(2.4, s.arc ?? 2); sp.material.rotation = k * (s.spin ?? 8); }, () => { scene.remove(sp); flash(s.color, (s.boom || 2.4) * (s.sc || 1), to, .4); onHit(i); if (i === s.n - 1) end(); }); }); },
  // 일직선으로 빠르게 (야구공 · 축구공 · 수리검)
  shoot: (u, s, onHit, end) => { for (let i = 0; i < s.n; i++) tween(i * (s.gap ?? .12), null, () => { const sp = iconSprite(s.icon, (s.size || .6) * (s.sc || 1)), from = u.pos.clone().add(new THREE.Vector3(.4, s.low ? .5 : 1.8, 0)), to = bossHit(.5); const trail = new THREE.Sprite(additive(s.color, .9)); trail.scale.set(1.4, .5, 1); scene.add(trail); tween(s.dur || .2, k => { sp.position.lerpVectors(from, to, k); trail.position.lerpVectors(from, to, Math.max(0, k - .08)); sp.material.rotation = k * (s.spin ?? 12); }, () => { scene.remove(sp, trail); flash(s.color, (s.boom || 2.6) * (s.sc || 1), to, .35); onHit(i); if (i === s.n - 1) end(); }); }); },
  // 하늘에서 비처럼 (고추 · 동전 · 별)
  rain: (u, s, onHit, end) => { for (let i = 0; i < s.n; i++) tween(i * (s.gap ?? .09), null, () => { const sp = iconSprite(s.icon, (s.size || .55) * (s.sc || 1)), x = bossCenter.x + rnd(-1.8, 1.4), z = rnd(.6, 1.8), from = new THREE.Vector3(x, 7, z), to = new THREE.Vector3(x, rnd(1, 3.4), z); tween(s.dur || .45, k => { sp.position.lerpVectors(from, to, k * k); sp.material.rotation = k * 4; }, () => { scene.remove(sp); flash(s.color, (1.6) * (s.sc || 1), to, .3); onHit(i); if (i === s.n - 1) end(); }); }); },
  // 보스 앞까지 돌진했다 돌아오기 (덩크 · 업어치기 · 할리)
  dash: (u, s, onHit, end) => { const from = u.pos.clone(), to = new THREE.Vector3(bossCenter.x - 1.6, 0, .6); u.busy = true; tween(.22, k => { u.pos.lerpVectors(from, to, k); u.pos.y = Math.sin(k * Math.PI) * (s.jump || 0); }, () => { for (let i = 0; i < s.n; i++) tween(i * .14, null, () => { flash(s.color, (3) * (s.sc || 1), bossHit(.5), .35); const sp = iconSprite(s.icon, (.9) * (s.sc || 1)); sp.position.copy(bossHit(.4)); tween(.3, k => { sp.material.opacity = 1 - k; sp.scale.setScalar(.9 + k); }, () => scene.remove(sp)); onHit(i); if (i === s.n - 1) { shockwave(to, s.color, 4 * (s.sc || 1)); tween(.25, k => { u.pos.lerpVectors(to, from, k); }, () => { u.busy = false; end(); }); } }); }); },
  // 빛줄기 (코딩 폭격 · 아이언 빔)
  beam: (u, s, onHit, end) => { beam(handOf(u), bossCenter.clone(), s.color); for (let i = 0; i < 5; i++) { const g = iconSprite(s.icon, (.45) * (s.sc || 1)), p = handOf(u).lerp(bossCenter, .2 + i * .15); g.position.copy(p).add(new THREE.Vector3(0, .6 + Math.sin(i) * .3, 0)); tween(.7, k => { g.material.opacity = 1 - k; g.position.y += .01; }, () => scene.remove(g)); } for (let i = 0; i < s.n; i++) tween(.25 + i * .12, null, () => { flash(s.color, (3.2) * (s.sc || 1), bossHit(.3), .4); onHit(i); if (i === s.n - 1) end(); }); },
  // 보스를 가로지르는 한 줄 (보조선 · 체크메이트)
  slash: (u, s, onHit, end) => { const line = new THREE.Mesh(new THREE.PlaneGeometry(6, .12), new THREE.MeshBasicMaterial({ color: new THREE.Color(s.color).multiplyScalar(2.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); line.position.copy(bossCenter).add(new THREE.Vector3(0, 0, 1.2)); line.rotation.z = .5; scene.add(line); tween(.35, k => { line.scale.x = k; }, () => { flash(s.color, (5) * (s.sc || 1), bossCenter, .5); shake(.16); for (let i = 0; i < s.n; i++) tween(i * .1, null, () => { onHit(i); if (i === s.n - 1) { tween(.3, k => { line.material.opacity = 1 - k; }, () => { scene.remove(line); end(); }); } }); }); },
  // 위로 쏘아 올렸다 떨어지기 (물로켓)
  rocket: (u, s, onHit, end) => { const sp = iconSprite(s.icon, (1) * (s.sc || 1)), from = handOf(u), top = new THREE.Vector3(bossCenter.x, 9, .5); tween(.4, k => { sp.position.lerpVectors(from, top, k); }, () => { sp.material.rotation = Math.PI; tween(.3, k => { sp.position.lerpVectors(top, bossCenter, k); }, () => { scene.remove(sp); flash(s.color, (6) * (s.sc || 1), bossCenter, .6); shake(.2); for (let i = 0; i < s.n; i++) tween(i * .08, null, () => { onHit(i); if (i === s.n - 1) end(); }); }); }); },
  // 소리 · 응원이 퍼져 나가기 (팀 대상)
  wave: (u, s, onHit, end) => { for (let r = 0; r < 3; r++) tween(r * .15, null, () => shockwave(u.pos.clone(), s.color, 6 * (s.sc || 1))); alive().forEach((x, i) => { const sp = iconSprite(s.icon, (.55) * (s.sc || 1)); sp.position.copy(x.pos).add(new THREE.Vector3(0, 2.6, 0)); tween(.9, k => { sp.position.y += .015; sp.material.opacity = 1 - k * .8; }, () => scene.remove(sp)); }); tween(.3, null, () => { onHit(0); end(); }); },
  // 팀 위로 무언가 떠오르기 (회복 · 보호막)
  aura: (u, s, onHit, end) => { alive().forEach(x => { for (let i = 0; i < 3; i++) { const sp = iconSprite(s.icon, (.45) * (s.sc || 1)); sp.position.copy(x.pos).add(new THREE.Vector3(rnd(-.4, .4), .4 + i * .3, 0)); tween(.9 + i * .1, k => { sp.position.y += .02; sp.material.opacity = 1 - k; }, () => scene.remove(sp)); } flash(s.color, (2.6) * (s.sc || 1), x.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), .7); }); tween(.25, null, () => { onHit(0); end(); }); },
  // 연막 (시현): 팀을 덮는 연기 + 수리검
  smoke: (u, s, onHit, end) => { alive().forEach(x => { for (let i = 0; i < 4; i++) { const sp = iconSprite('smoke', 1.2 * (s.sc || 1)); sp.position.copy(x.pos).add(new THREE.Vector3(rnd(-.6, .6), rnd(.3, 1.6), .3)); tween(1.4, k => { sp.material.opacity = (1 - k) * .9; sp.scale.setScalar(1.2 + k); }, () => scene.remove(sp)); } }); VIS.shoot(u, { icon: 'shuriken', n: s.n, color: '#cfd8e0', gap: .08, sc: s.sc }, onHit, end); },
};

// 직접 누른 필살기의 마무리: 거대한 아이콘이 내리꽂히고 화면이 번쩍
function finisher(s, teamSkill) {
  const big = iconSprite(s.icon, 2.4);
  const to = teamSkill ? teamCenter().add(new THREE.Vector3(0, 2.2, 0)) : bossCenter.clone().add(new THREE.Vector3(0, .4, 1));
  const from = teamSkill ? to.clone().add(new THREE.Vector3(0, -2.5, 0)) : to.clone().add(new THREE.Vector3(-1.5, 7, 0));
  tween(.32, k => { big.position.lerpVectors(from, to, k * k); big.material.rotation = (1 - k) * (teamSkill ? 0 : -1.4); const z = 2.4 * 1.45 * (teamSkill ? .4 + k * .8 : 1); big.scale.set(z, z, 1); }, () => {
    screenFlash(teamSkill ? s.color : '#ffffff', teamSkill ? .45 : .8);
    flash(s.color, 14, to, .8); flash('#ffffff', 7, to, .5); shockwave(new THREE.Vector3(to.x, 0, to.z), s.color, 14);
    shake(teamSkill ? .12 : .45, .5);
    for (let i = 0; i < 26; i++) { const d = new THREE.Sprite(additive(i % 3 ? s.color : '#ffffff')); const a = Math.random() * Math.PI * 2, v = new THREE.Vector3(Math.cos(a), Math.sin(a) * .8 + .3, rnd(-.3, .3)).multiplyScalar(rnd(3, 7)); d.position.copy(to); d.scale.setScalar(rnd(.25, .6)); scene.add(d); tween(.7, k => { d.position.addScaledVector(v, .016); v.y -= .12; d.material.opacity = 1 - k; }, () => scene.remove(d)); }
    tween(.5, k => { big.material.opacity = 1 - k; const z = 2.4 * 1.45 * (1.2 + k * .6); big.scale.set(z, z, 1); }, () => scene.remove(big));
  });
}
const teamCenter = () => { const a = alive(); const c = new THREE.Vector3(); a.forEach(u => c.add(u.pos)); return a.length ? c.multiplyScalar(1 / a.length) : new THREE.Vector3(-2, 0, 0); };
function screenFlash(color, op) { const el = $('flash'); el.style.background = color; el.style.transition = 'none'; el.style.opacity = op; void el.offsetWidth; el.style.transition = 'opacity .45s ease-out'; el.style.opacity = 0; }
function shockwave(at, color, size = 4) { const ring = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(at.x, .05, at.z); scene.add(ring); tween(.5, k => { ring.scale.setScalar(.3 + k * size); ring.material.opacity = 1 - k; }, () => scene.remove(ring)); }

// 친구별 스킬: v 연출 · icon 아이콘 · n 타수 · dmg 한 대 피해 · 그 밖의 효과
const S = (v, icon, color, o) => Object.assign({ v, icon, color, n: 1 }, o);
const SKILL_SPEC = {
  // 방어
  junyoung: S('aura', 'robot', '#7fb3ff', { shield: 900, taunt: 6, say: '방패 로봇 출동!' }),
  jaewon: S('aura', 'shield', '#9fb8d8', { shield: 700, taunt: 6, veil: 1.5, say: '비둘기도 못 뚫어!' }),
  isan: S('aura', 'dumbbell', '#7fb3ff', { shield: 800, taunt: 6, buff: 4, say: '버텨! 한 개 더!' }),
  siwoo: S('aura', 'blueprint', '#5aa0ff', { shield: 1000, taunt: 6, say: '바리케이드 설치' }),
  hyeongseop: S('aura', 'shield', '#7fb3ff', { shield: 800, taunt: 6, weak: 4, say: '계산대로야' }),
  yuchan: S('aura', 'shield', '#ffd779', { shield: 900, taunt: 6, heal: .1, say: '의리!' }),
  hyunsu: S('aura', 'shield', '#3a3a3a', { shield: 800, taunt: 6, confuse: 1, say: '…덤벼.' }),
  beomsik: S('aura', 'heart', '#7fb3ff', { shield: 900, taunt: 6, heal: .12, say: '내 뒤에 있어' }),
  kimhyeonseo: S('aura', 'shield', '#7fb3ff', { shield: 1100, taunt: 6, say: '높이로 막는다' }),
  // 돌격
  jeonggyu: S('shoot', 'soccer', '#ffffff', { n: 1, dmg: 1300, stun: 2.5, low: true, size: .7, say: '골!' }),
  eunseong: S('dash', 'bolt', '#ffe14d', { n: 4, dmg: 360, stun: 1.5, say: '에너지 풀충전!' }),
  soyul: S('dash', 'basketball', '#ff8a3c', { n: 1, dmg: 1500, stun: 2, jump: 2.6, say: '덩크!' }),
  hyunwoo: S('shoot', 'soccer', '#cfe0ff', { n: 1, dmg: 1100, stun: 2.5, low: true, weak: 3, say: '이론상 완벽한 슛' }),
  jio: S('lob', 'soccer', '#ffffff', { n: 1, dmg: 1350, stun: 2.5, arc: 3.4, say: '왼발 크로스!' }),
  sion: S('dash', 'robot', '#b48bff', { n: 3, dmg: 430, stun: 2, say: '로봇 댄스 타임' }),
  munyunsu: S('shoot', 'soccer', '#ff8a5c', { n: 3, dmg: 450, stun: 2, low: true, gap: .15, say: '텐션 100%!' }),
  hyeonseo: S('shoot', 'soccer', '#7dff9e', { n: 5, dmg: 270, stun: 2, low: true, gap: .1, say: '메시처럼!' }),
  minah: S('dash', 'bolt', '#ff5a3c', { n: 2, dmg: 650, stun: 2.5, say: '부릉부릉!' }),
  wooseok: S('dash', 'punch', '#ff5a3c', { n: 1, dmg: 1400, stun: 3, jump: 1.4, say: '업어치기 한판!' }),
  seoeun: S('dash', 'star', '#ff9ad5', { n: 1, dmg: 1250, stun: 2.5, jump: 3, say: '기록 갱신!' }),
  yul: S('lob', 'basketball', '#ff8a3c', { n: 3, dmg: 450, stun: 1.5, arc: 4, gap: .3, say: '…나이스.' }),
  bojun: S('shoot', 'baseball', '#ff6a3a', { n: 1, dmg: 1500, stun: 2.5, dur: .14, crit: true, say: '강속구!' }),
  sihyeon: S('smoke', 'shuriken', '#cfd8e0', { n: 5, dmg: 240, stun: 1.5, veil: 3, say: '…닌닌.' }),
  // 폭발
  yunsu: S('lob', 'flask', '#ff8a3c', { n: 1, dmg: 1500, burn: 5, boom: 6, say: '실험 시작!' }),
  yejin: S('aura', 'flag', '#ff5a3c', { haste: 6, say: 'F1 터보 부스트!' }),
  jaejun: S('beam', 'bolt', '#7fd0ff', { n: 3, dmg: 480, burn: 3, say: '리펄서 빔!' }),
  taeyeol: S('lob', 'drop', '#5ab8ff', { n: 3, dmg: 420, weak: 6, gap: .18, say: '수질 분석 완료' }),
  jiho: S('rocket', 'rocket', '#ffb84d', { n: 1, dmg: 1650, burn: 3, say: '3, 2, 1, 발사!' }),
  yuna: S('rain', 'pepper', '#ff3a1a', { n: 10, dmg: 130, burn: 7, say: '마라 최고 단계!' }),
  yeonju: S('shoot', 'drill', '#4a7fd6', { n: 6, dmg: 250, burn: 2, gap: .07, dur: .25, spin: 0, say: '천원돌파!' }),
  // 마법
  seojun: S('beam', 'code', '#7dffb0', { n: 4, dmg: 650, say: '코딩 폭격!' }),
  yunbo: S('slash', 'line', '#9fd3ff', { n: 1, dmg: 2600, say: '보조선 하나면 끝' }),
  younggeun: S('wave', 'book', '#b48bff', { n: 1, dmg: 0, weak: 6, after: { v: 'lob', icon: 'book', n: 4, dmg: 480, arc: 1.4, spin: 3 }, say: 'Ladies and gentlemen!' }),
  sia: S('rain', 'star', '#cfe0ff', { n: 8, dmg: 310, say: '별이 쏟아진다' }),
  hayeon: S('rain', 'blueprint', '#5aa0ff', { n: 6, dmg: 420, weak: 3, size: .8, say: '설계도 폭풍' }),
  taejeong: S('rain', 'phone', '#ffd779', { n: 6, dmg: 420, say: '레이드 소환!' }),
  leeyunho: S('lob', 'knight', '#f4f1e8', { n: 3, dmg: 380, arc: 3, spin: 0, size: .9, after: { v: 'rain', icon: 'chess', n: 1, dmg: 1500, size: 1.4 }, say: '체크메이트.' }),
  suae: S('rain', 'star', '#ff9ad5', { n: 10, dmg: 250, crit: true, say: '천장 도달!' }),
  // 회복
  yejun: S('aura', 'cross', '#7dff9e', { heal: .35, say: '응급처치!' }),
  jiyong: S('aura', 'egg', '#fff3c4', { heal: .25, shield: 400, say: '부화의 온기' }),
  jejun: S('aura', 'heart', '#9fe0ff', { heal: .3, gauge: .1, say: '다들 잘하고 있어!' }),
  sihun: S('aura', 'sprout', '#6bc36b', { heal: .15, hot: .3, say: '새싹아 자라라' }),
  sunbi: S('aura', 'makeup', '#ff9ad5', { heal: .25, buff: 4, say: '메이크업 완성!' }),
  seungmin: S('wave', 'note', '#ffd779', { hot: .45, heal: .05, say: '♪ 치유의 노래' }),
  // 지원
  ryun: S('aura', 'map', '#ffd779', { haste: 5, gauge: .15, say: '지름길 이쪽이야!' }),
  mingyeol: S('wave', 'laugh', '#ffd779', { confuse: 2, gauge: .15, say: '개그 한 방!' }),
  geonwoo: S('rain', 'coin', '#ffd23f', { n: 12, dmg: 0, gauge: .4, say: '1000억 투자!' }),
  yejunsim: S('wave', 'mic', '#ffd779', { buff: 7, gauge: .2, say: '전교회장으로서 명한다!' }),
  seongjun: S('rain', 'card', '#ffd23f', { n: 6, dmg: 0, heal: .12, gauge: .25, say: '오늘은 내가 쏜다!' }),
  seoan: S('aura', 'heart', '#ffb3c8', { buff: 5, heal: .08, say: '치이카와 화이팅!' }),
  yunho: S('wave', 'wave', '#ffd779', { buff: 6, gauge: .15, say: '다들 힘내!!!' }),
  sangwoong: S('wave', 'mic', '#ffd779', { buff: 6, gauge: .25, say: '양일고 응원 방송!' }),
  taegeon: S('wave', 'laugh', '#ffd779', { sleep: 1.5, gauge: .2, say: '웃음 폭탄!' }),
  jaehee: S('aura', 'zzz', '#cfe0ff', { sleep: 3, say: '공부는… 내일부터…' }),
  baekho: S('wave', 'lightstick', '#ff9ad5', { buff: 6, gauge: .2, say: '응원봉 파도!' }),
  namjiho: S('wave', 'laugh', '#ffd779', { confuse: 2, buff: 4, say: '장난 작전 개시!' }),
};
const ROLE_SPEC = { tank: S('aura', 'shield', '#7fb3ff', { shield: 900, taunt: 6 }), striker: S('shoot', 'soccer', '#fff', { dmg: 1300, stun: 2.5, low: true }), blaster: S('lob', 'flask', '#ff8a3c', { dmg: 1500, burn: 5 }), mage: S('beam', 'star', '#b48bff', { n: 4, dmg: 650 }), healer: S('aura', 'cross', '#7dff9e', { heal: .35 }), support: S('wave', 'note', '#ffd779', { buff: 6, gauge: .2 }) };

// 스킬 실행: 연출 → 맞을 때 피해 → 끝나면 보스 효과
function castSkill(u, big) {
  const base = SKILL_SPEC[u.id] || ROLE_SPEC[u.st.role], s = Object.assign({}, base, { sc: big ? 2.4 : 1.6 });
  const teamSkill = !s.dmg && !s.after;
  if (big) startUlt(teamSkill);
  if (s.say) popText(u.pos.clone().add(new THREE.Vector3(0, 3.2, 0)), 'say', s.say);
  // 팀 효과는 바로
  if (s.shield) alive().forEach(x => { x.shield = Math.max(x.shield, s.shield); x.shieldT = 6; });
  if (s.taunt) { B.taunt = s.taunt; B.tauntBy = u; }
  if (s.heal) alive().forEach(x => heal(x, x.max * s.heal * FX.heal));
  if (s.hot) alive().forEach(x => { x.hot = x.max * s.hot * FX.heal / 5; x.hotT = 5; });
  if (s.buff) buffT = Math.max(buffT, s.buff);
  if (s.haste) hasteT = Math.max(hasteT, s.haste);
  if (s.gauge) alive().forEach(x => { if (x !== u) x.gauge = Math.min(1, x.gauge + s.gauge); });
  if (s.veil) veilT = Math.max(veilT, s.veil);
  const bossFx = sp => {
    if (sp.stun) { B.stun = Math.max(B.stun, sp.stun); cancelBombs(); popText(bossCenter.clone().add(new THREE.Vector3(0, 2.4, 0)), 'info', '기절!'); }
    if (sp.sleep) { B.stun = Math.max(B.stun, sp.sleep); cancelBombs(); popText(bossCenter.clone().add(new THREE.Vector3(0, 2.4, 0)), 'info', '쿨쿨…'); const z = iconSprite('zzz', 1); z.position.copy(bossCenter).add(new THREE.Vector3(.6, 2, 1)); tween(sp.sleep, k => { z.position.y += .004; z.material.opacity = 1 - k * .6; }, () => scene.remove(z)); }
    if (sp.burn) { B.burn = Math.max(B.burn, sp.burn); }
    if (sp.weak) { weakT = Math.max(weakT, sp.weak); popText(bossCenter.clone().add(new THREE.Vector3(0, 1.8, 0)), 'info', '약해졌다!'); }
    if (sp.confuse) { B.miss += sp.confuse; popText(bossCenter.clone().add(new THREE.Vector3(0, 2.4, 0)), 'info', '???'); }
  };
  const run = (sp, done) => VIS[sp.v](u, Object.assign({ sc: s.sc }, sp), i => { if (sp.dmg) damageBoss(sp.dmg * SYNERGY * (buffT > 0 ? 1.2 : 1), { big: sp.n === 1 || i === sp.n - 1, crit: sp.crit && Math.random() < .5 ? true : undefined }); }, () => { bossFx(sp); done && done(); });
  run(s, () => { if (s.after) run(Object.assign({ color: s.color }, s.after), () => { if (big) finisher(s, false); }); else if (big) finisher(s, teamSkill); });
  if (big && teamSkill) tween(.35, null, () => finisher(s, true));
}

let cutLock = 0;
let ultT = 0, zoomK = 0, zoomTeam = false;
const camLook = new THREE.Vector3(-.4, 1.0, -.6);
function startUlt(team) { ultT = 1.7; zoomTeam = team; $('dim').classList.add('on'); }
function endUlt() { ultT = 0; $('dim').classList.remove('on'); if (queue.length) setTimeout(() => useSkill(queue.shift()), 80); }          // 컷인이 도는 동안 전투가 멈춘다
const queue = [];
function useSkill(id, fromAuto) {
  const u = U(id); if (!u || u.dead || u.gauge < 1 || over || !started) return;
  if (fromAuto) { u.gauge = 0; u.castT = .6; castBanner(id); castSkill(u, false); return; }   // 자동: 멈추지 않고 짧은 띠만
  if (cutLock > 0 || ultT > 0) { if (!queue.includes(id)) queue.push(id); return; }
  u.gauge = 0; cutIn(id); cutLock = 1.05;
  pendingCast = () => { u.castT = .6; castSkill(u, true); };
}
let bannerT = 0;
function castBanner(id) { const el = $('cast'); el.innerHTML = `<b>${STATS[id].skill}</b><small>${STATS[id].who}</small>`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), 900); }
let pendingCast = null;
const CUT = Object.fromEntries(Object.entries(STATS).map(([id, s]) => [id, [s.skill, s.who, s.c1]]));
function cutIn(id) {
  const role = STATS[id].role, svg = kitHeadSVG(id, { pose: role === 'healer' ? 'hold' : role === 'striker' ? 'cheer' : 'v' });
  const el = $('cutin'), [nm, who, c1] = CUT[id];
  $('cut-img').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  $('cut-name').textContent = nm; $('cut-who').textContent = who;
  el.style.setProperty('--c1', `linear-gradient(100deg, ${c1}, #0b0912 75%)`);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1150);
}
// 스킬 버튼
$('skills').innerHTML = SKILL_ORDER.map(id => {
  const u = U(id), src = svgURL(kitHeadSVG(id));
  return `<div class="sk" data-id="${id}" style="--bg:linear-gradient(160deg, ${u.st.bg}, #0d0b14)"><div class="face"><img src="${src}" alt=""></div><div class="cd"></div><span class="ult">READY</span><b>${u.st.skill}</b></div>`;
}).join('');
$('skills').addEventListener('click', e => { const k = e.target.closest('.sk'); if (k) useSkill(k.dataset.id); });
function skillUI() {
  document.querySelectorAll('.sk').forEach(el => {
    const u = U(el.dataset.id), ready = !u.dead && u.gauge >= 1;
    el.classList.toggle('ready', ready); el.classList.toggle('dead', u.dead);
    const cd = el.querySelector('.cd'), ult = el.querySelector('.ult');
    cd.style.display = ready || u.dead ? 'none' : 'grid'; cd.style.setProperty('--p', `${(1 - u.gauge) * 100}%`); cd.textContent = Math.ceil((1 - u.gauge) * u.st.cd);
    ult.style.display = ready ? 'block' : 'none';
  });
}

/* ───────── 보스 위험 구역 (은행 폭탄) ───────── */
const bombs = [];
function startBombs() {
  const targets = alive().sort(() => Math.random() - .5).slice(0, Math.min(2, alive().length));
  targets.forEach(u => {
    const at = u.pos.clone(); at.y = .03;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.3, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3a2a').multiplyScalar(1.6), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), new THREE.MeshBasicMaterial({ color: '#ff2a1a', transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false }));
    [ring, disc].forEach(m => { m.rotation.x = -Math.PI / 2; m.position.copy(at); scene.add(m); }); disc.scale.set(.01, .01, 1);
    bombs.push({ at, ring, disc, t: 0, dur: 2.2 });
  });
  popText(bossCenter.clone().add(new THREE.Vector3(0, 2.6, 0)), 'info', '은행 폭탄!');
  arms.forEach(a => tween(.5, k => { a.rotation.z = a.userData.side * (-1.05 - k * .9); }));
}
function cancelBombs() { bombs.splice(0).forEach(b => { scene.remove(b.ring, b.disc); }); arms.forEach(a => { a.rotation.z = a.userData.side * -1.05; }); }
function stepBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.t += dt; const k = Math.min(1, b.t / b.dur); b.disc.scale.set(k, k, 1); b.ring.material.opacity = .55 + Math.sin(b.t * 18) * .35;
    if (k >= 1) {
      scene.remove(b.ring, b.disc); bombs.splice(i, 1);
      flash('#ff8a3c', 5, b.at.clone().add(new THREE.Vector3(0, .8, 0)), .6); flash('#ffe28a', 2.6, b.at.clone().add(new THREE.Vector3(0, .6, 0)));
      shake(.25, .4);
      units.forEach(u => { if (!u.dead && u.pos.distanceTo(b.at) < 1.35) hurt(u, 1100 + B.layer * 150); });
      if (!bombs.length) arms.forEach(a => tween(.35, k2 => { a.rotation.z = a.userData.side * (-1.95 + k2 * .9); }));
    }
  }
}

/* ───────── 자동 스킬 ───────── */
let auto = false;
function autoSkills() {
  const ready = role => units.find(u => !u.dead && u.gauge >= 1 && u.st.role === role);
  let u;
  if (bombs.length && (u = ready('tank'))) return useSkill(u.id, true);
  if (bombs.length && (u = ready('striker'))) return useSkill(u.id, true);
  if ((u = ready('healer')) && alive().some(x => x.hp / x.max < .55)) return useSkill(u.id, true);
  if ((u = ready('support'))) return useSkill(u.id, true);
  for (const r of ['mage', 'blaster']) if ((u = ready(r))) return useSkill(u.id, true);
  if ((u = ready('striker')) && B.bombT > 3) return useSkill(u.id, true);
  if ((u = ready('tank')) && alive().some(x => x.hp / x.max < .4)) return useSkill(u.id, true);
}

/* ───────── 진행 ───────── */
let started = false, over = false, paused = false, speed = 1, clockT = TIME_LIMIT, introT = 1.6;
function finish(win) {
  if (over) return; over = true;
  const left = alive().length, stars = win ? (left === 5 ? 3 : left >= 3 ? 2 : 1) : 0;
  const rw = win ? { know: 20 + stars * 10, snack: 10 + stars * 8, power: 8 + stars * 6 } : { know: 5, snack: 3, power: 0 };
  try { const k = 'yangil.kingdom.v1', g = JSON.parse(localStorage.getItem(k)); if (g && g.res) { Object.keys(rw).forEach(r => { g.res[r] = (g.res[r] || 0) + rw[r]; }); localStorage.setItem(k, JSON.stringify(g)); } } catch (e) {}
  setTimeout(() => {
    $('r-sub').textContent = win ? 'STAGE CLEAR' : 'STAGE FAILED';
    $('r-title').textContent = win ? '승리!' : clockT <= 0 ? '시간 초과…' : '패배…';
    $('r-stars').innerHTML = [0, 1, 2].map(i => i < stars ? '★' : '<i>★</i>').join('');
    $('r-time').textContent = win ? `${Math.round(TIME_LIMIT - clockT)}초 만에 은행왕을 쓰러뜨렸다 · 남은 친구 ${left}명` : '은행왕이 너무 강했다. 스킬 타이밍을 바꿔 보자.';
    $('r-rw').innerHTML = `<span>📘 +${rw.know}</span><span>🍞 +${rw.snack}</span><span>💪 +${rw.power}</span>`;
    $('result').hidden = false;
  }, win ? 1300 : 800);
  if (win) { flash('#ffd27a', 10, bossCenter, 1.2); shake(.3, .6); tween(1.2, k => { boss.rotation.z = -k * .35; boss.position.y = -k * .8; }); }
}
$('go').onclick = () => { $('start').hidden = true; started = true; };
$('r-retry').onclick = () => location.reload();
$('r-camp').onclick = () => { location.href = './'; };
$('b-auto').onclick = () => { auto = !auto; $('b-auto').classList.toggle('on', auto); };
$('b-speed').onclick = () => { speed = speed === 1 ? 2 : 1; $('b-speed').textContent = '×' + speed; $('b-speed').classList.toggle('on', speed === 2); };
$('b-pause').onclick = () => { paused = !paused; $('b-pause').textContent = paused ? '▶' : '❚❚'; };
addEventListener('keydown', e => { const i = '12345'.indexOf(e.key); if (i >= 0) useSkill(SKILL_ORDER[i]); if (e.key === ' ') $('b-pause').click(); });

function step(dt) {
  runTweens(dt);
  if (!started || over) return;
  if (introT > 0) { introT -= dt; }
  clockT -= dt; if (clockT <= 0) { clockT = 0; finish(false); }
  // 보스
  B.flashT = Math.max(0, B.flashT - dt); B.taunt = Math.max(0, B.taunt - dt); buffT = Math.max(0, buffT - dt); weakT = Math.max(0, weakT - dt); hasteT = Math.max(0, hasteT - dt); veilT = Math.max(0, veilT - dt);
  if (B.burn > 0) { B.burn -= dt; B.burnT += dt; if (B.burnT >= 1) { B.burnT = 0; damageBoss(150, { crit: false }); } }
  if (B.stun > 0) B.stun -= dt;
  else if (B.stagger > 0) B.stagger -= dt;
  else if (introT <= 0) {
    const haste = 1 + B.layer * .15;
    B.slamT -= dt * haste; B.bombT -= dt * haste;
    if (B.slamT <= 0 && !bombs.length) {
      B.slamT = 2.6; const tgt = (B.taunt > 0 && B.tauntBy && !B.tauntBy.dead) ? B.tauntBy : alive().sort((a, b) => b.pos.x - a.pos.x)[0];
      if (tgt) { arms.forEach(a => tween(.32, k => { a.rotation.z = a.userData.side * (-1.05 + Math.sin(k * Math.PI) * .7); a.rotation.x = -.25 + Math.sin(k * Math.PI) * .6; })); tween(.18, null, () => { if (B.miss > 0) { B.miss--; popText(tgt.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), 'block', '빗나감!'); return; } hurt(tgt, 300 + B.layer * 60); flash('#ffb070', 2.2, tgt.pos.clone().add(new THREE.Vector3(0, 1.4, 0))); shake(.07); }); }
    }
    if (B.bombT <= 0 && !bombs.length) { B.bombT = rnd(8.5, 10.5); startBombs(); }
  }
  stepBombs(B.stun > 0 ? 0 : dt);
  // 친구들
  units.forEach(u => {
    if (u.dead) return;
    u.hitT = Math.max(0, u.hitT - dt); u.castT = Math.max(0, (u.castT || 0) - dt);
    if (u.shieldT > 0) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
    if (u.hotT > 0) { u.hotT -= dt; u.hotAcc = (u.hotAcc || 0) + dt; if (u.hotAcc >= 1) { u.hotAcc = 0; heal(u, u.hot); } }
    if (u.busy) return;
    const toHome = u.home.clone().sub(u.pos); toHome.y = 0;
    if (toHome.length() > .05) { u.pos.add(toHome.clampLength(0, dt * 5)); u.moving = true; return; }
    u.moving = false;
    u.gauge = Math.min(1, u.gauge + dt / u.st.cd);
    u.atkT -= dt;
    if (u.atkT <= 0) {
      u.atkT = u.st.rate / (hasteT > 0 ? 1.6 : 1);
      const atk = u.st.atk * (buffT > 0 ? 1.4 : 1);
      if (u.st.melee) { u.lunge = .3; tween(.12, null, () => damageBoss(atk)); }
      else bolt(u.pos.clone().add(new THREE.Vector3(.4, 2, 0)), bossCenter.clone().add(new THREE.Vector3(rnd(-.6, .6), rnd(-.8, .8), .8)), u.st.bolt, .35, () => damageBoss(atk), .45, .6);
    }
  });
  if (auto && cutLock <= 0 && ultT <= 0) autoSkills();
}

/* ───────── 그리기 ───────── */
const clock = new THREE.Clock();
function frame() {
  const raw = Math.min(clock.getDelta(), .25), real = Math.min(raw, .05);   // 컷인 · 필살기는 실제 시간(raw), 전투는 끊김 방지용(real)
  if (!paused) {
    if (cutLock > 0) { cutLock -= raw; if (cutLock <= 0) { const f = pendingCast; pendingCast = null; f && f(); if (!ultT && queue.length) setTimeout(() => useSkill(queue.shift()), 80); } runTweens(0); }
    else if (ultT > 0) { ultT -= raw; runTweens(raw); if (ultT <= 0) endUlt(); }
    else step(real * speed);
  }
  const now = performance.now() / 1000;
  // 보스 모습
  const breathe = Math.sin(now * 1.6) * .03;
  if (!B.dead) { boss.rotation.y = Math.sin(now * .6) * .05; boss.scale.set(1, 1 + breathe, 1); }
  leafM.emissiveIntensity = B.flashT > 0 ? 1.4 : .35 + (B.layer === 2 ? Math.sin(now * 6) * .15 : 0);
  bark.emissive.set(B.flashT > 0 ? '#5a2a10' : '#000000');
  aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
  stunStars.visible = B.stun > 0 && !over; stunStars.children.forEach((s, i) => { const a = now * 4 + i * 2.1; s.position.set(Math.cos(a) * .9, Math.sin(now * 8 + i) * .1, Math.sin(a) * .9); });
  // 친구 모습
  units.forEach(u => {
    if (u.lunge > 0) u.lunge = Math.max(0, u.lunge - real * speed * (paused ? 0 : 1));
    const lx = u.lunge > 0 ? Math.sin((u.lunge / .3) * Math.PI) * .7 : 0;
    u.step += real;
    const pose = u.castT > 0 ? 'wave' : u.moving && Math.floor(u.step * 6) % 2 ? 'walk' : 'stand';
    const tx = u.frames[pose] || u.frames.stand; if (tx && u.spr.material.map !== tx) { u.spr.material.map = tx; u.spr.material.needsUpdate = true; }
    const bob = u.dead ? 0 : u.moving ? Math.abs(Math.sin(u.step * 10)) * .08 : Math.sin(u.step * 2.4 + u.home.x) * .02;
    u.spr.position.set(u.pos.x + lx, bob, u.pos.z);
    u.spr.material.color.setRGB(1, u.hitT > 0 ? .45 : 1, u.hitT > 0 ? .45 : 1);
    u.ring.position.set(u.pos.x, .02, u.pos.z); u.shadow.position.set(u.pos.x, .015, u.pos.z);
    u.bubble.position.set(u.pos.x, 1.5, u.pos.z); u.bubble.material.opacity = u.shield > 0 ? .28 + Math.sin(now * 5) * .06 : 0;
    const [x, y] = toScreen(new THREE.Vector3(u.pos.x, 3.5, u.pos.z));
    u.bar.style.left = x + 'px'; u.bar.style.top = y + 'px'; u.bar.style.opacity = u.dead ? 0 : 1;
    u.bar.querySelector('i').style.width = (u.hp / u.max * 100) + '%';
  });
  // 보스 체력바 (3겹)
  B.trail += (Math.max(0, B.hp) - B.trail) * Math.min(1, real * 3);
  const L = LAYERS[B.layer];
  $('b-now').style.width = Math.max(0, B.hp / L * 100) + '%'; $('b-trail').style.width = Math.max(0, B.trail / L * 100) + '%';
  $('b-next').style.visibility = B.layer < LAYERS.length - 1 ? 'visible' : 'hidden';
  $('b-count').textContent = '×' + (LAYERS.length - B.layer);
  $('timer').textContent = `${Math.floor(clockT / 60)}:${String(Math.floor(clockT % 60)).padStart(2, '0')}`;
  skillUI();
  // 화면 흔들림
  zoomK += ((ultT > 0 ? 1 : 0) - zoomK) * Math.min(1, real * (ultT > 0 ? 7 : 4));
  const focus = zoomTeam ? teamCenter().add(new THREE.Vector3(0, 1.4, 0)) : bossCenter;
  const camNow = camBase.clone().lerp(focus.clone().add(new THREE.Vector3(-1.2, 1.6, 7.5)), zoomK * .55);
  if (shakeT > 0) { shakeT -= real; camNow.x += rnd(-1, 1) * shakeAmp; camNow.y += rnd(-1, 1) * shakeAmp; } else shakeAmp = 0;
  camera.position.copy(camNow); camera.lookAt(camLook.clone().lerp(focus, zoomK * .8));
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__battle = { B, units, useSkill, start: () => $('go').click(), get over() { return over; }, setAuto: v => { auto = v; }, setSpeed: v => { speed = v; } };
