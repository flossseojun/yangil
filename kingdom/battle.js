// 팀 전투 (챕터 1~4 · 보스는 bosses.js): 자동 공격 · 스킬 게이지 · 필살기 컷인 · 위험 구역 · 3겹 체력
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildArena } from './bosses.js';
import { makeChibi } from './chibi3d.js';
import { shootAll } from './chibishot.js';

/* ───────── 팀 구성 (팀 편성 화면에서 고른 친구) ───────── */
const DEFAULT_TEAM = ['junyoung', 'jeonggyu', 'yunsu', 'seojun', 'yejun'];
let PICK = [];
try { PICK = (JSON.parse(localStorage.getItem(TEAM_KEY)) || []).slice(0, 5); } catch (e) {}
if (!PICK.length) PICK = DEFAULT_TEAM.slice();
const CAMP = loadCampus() || { res: { know: 0, snack: 0, power: 0 }, b: [], friends: [] };
const CB = campusBonus(CAMP);
const FX = teamFx(PICK); FX.heal *= CB.heal; FX.charge *= CB.charge;
const SEL = loadSel(CAMP), CH = SEL.ch, STAGE = SEL.st, CHD = CHAPTERS[CH - 1];
const SM = chapMul(CH, STAGE), SID = CH + '-' + STAGE;
document.getElementById('stg').textContent = SID; document.getElementById('st-sub').textContent = 'STAGE ' + SID;
document.getElementById('st-place').textContent = CHD.place; document.getElementById('st-title').textContent = CHD.place; document.getElementById('boss-name').textContent = CHD.boss;
document.getElementById('st-desc').innerHTML = `보스 · ${CHD.boss}${STAGE > 1 ? ` (강화 ${STAGE - 1}단계)` : ''} · 추천 전투력 ${SM.rec.toLocaleString('ko-KR')}<br><small>${CHD.desc}</small>`;
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

const hemi = new THREE.HemisphereLight('#ffb98a', '#2a2040', .55); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffb070', 2.2); sun.position.set(-8, 7, -6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 10, bottom: -6, near: 1, far: 40 }); sun.shadow.bias = -.0005; scene.add(sun);
const fill = new THREE.DirectionalLight('#8fa8ff', .55); fill.position.set(6, 5, 10); scene.add(fill);
const faceLight = new THREE.DirectionalLight('#fff4e8', .6); faceLight.position.set(-3, 5, 14); scene.add(faceLight);   // 친구 얼굴이 잘 보이게


/* ───────── 전투 데이터 ───────── */
const BOLT = { blaster: '#ffb84d', mage: '#b48bff', healer: '#7dff9e', support: '#ffd779' };
const CUT_BG = { tank: '#1c3358', striker: '#5a2018', blaster: '#5a3010', mage: '#2a1d55', healer: '#14503a', support: '#4a3c10' };
// 앞줄(방어·돌격)은 보스 앞, 뒷줄은 뒤에서
const FRONT = [[2.5, .7], [2.3, -1.0], [1.1, .2]], BACK = [[-1.0, 1.1], [-2.6, -.6], [-4.1, .9], [-.2, -1.4], [-5.4, -.4]];
const ordered = PICK.slice().sort((a, b) => ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
let fi = 0, bi = 0;
const STATS = Object.fromEntries(ordered.map(id => {
  const k = kitOf(id), r = ROLES[k.role], front = !!r.melee && fi < FRONT.length, home = front ? FRONT[fi++] : BACK[bi++] || [-5, 0];
  const lvm = lvMult(lvOf(CAMP, id)), magic = ['blaster', 'mage'].includes(k.role) ? CB.magic : 1, frontB = r.melee ? CB.front : 1;
  return [id, { lvm, role: k.role, hp: Math.round(r.hp * FX.hp * lvm * frontB * CB.mood), atk: r.atk * (r.melee ? FX.melee : FX.ranged) * lvm * magic, rate: r.rate, melee: front, home, cd: r.cd / FX.charge, skill: k.skill, who: `${nameOf(id)} · ${introOf(id)}`, c1: CUT_BG[k.role], bg: CUT_BG[k.role], bolt: BOLT[k.role] || '#ffffff', color: r.color }];
}));
const SKILL_ORDER = ordered;
document.getElementById('syn').innerHTML = teamSynergy(PICK).filter(x => x.on).map(x => `<b>${x.name}</b>${x.desc}`).join(' · ');
const SYNERGY = FX.skill;
const LAYERS = [13000, 13000, 13000].map(x => Math.round(x * SM.hp));     // 보스 체력 3겹
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

/* ───────── 무대 · 보스 (챕터별) ───────── */
const cast = o => { o.castShadow = true; o.receiveShadow = true; return o; };
const ARENA = buildArena(CH, { THREE, scene, tex, cast, hemi, sun, fill, glowT, tween, reveal: () => showReveal() });
const { boss, arms } = ARENA;

/* ───────── 친구들 ───────── */
function spriteTex(id, pose, expr, cb) {
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 504; c.getContext('2d').drawImage(img, 0, 0, 240, 504); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cb(t); };
  img.src = svgURL(kitSVG(id, pose, expr));
}
const units = ordered.map(id => {
  const st = STATS[id];
  const spr = makeChibi(id, { scale: 1.3, noShadow: true, lookUp: .2 }); spr.position.set(st.home[0] - 9, 0, st.home[1]);
  const u = { id, st, hp: st.hp, max: st.hp, home: new THREE.Vector3(st.home[0], 0, st.home[1]), pos: new THREE.Vector3(st.home[0] - 9, 0, st.home[1]), atkT: rnd(0, st.rate), gauge: rnd(.25, .55), shield: 0, shieldT: 0, dead: false, spr, ch: spr.userData.chibi, hitT: 0, lunge: 0, step: 0 };
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
const B = { layer: 0, hp: LAYERS[0], trail: LAYERS[0], slamT: 3, bombT: 6.5, stun: 0, burn: 0, burnT: 0, stagger: 0, taunt: 0, dead: false, flashT: 0, spT: CH > 1 ? 7.5 : 1e9, glareT: 0, blind: 0, vanish: 0, nerf: 0 };
const bossCenter = new THREE.Vector3(5.2, 2.6, .4);
const stunStars = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(additive('#ffe58a')); s.scale.set(.5, .5, 1); stunStars.add(s); } stunStars.visible = false; stunStars.position.set(5.2, 6.4, -.4); scene.add(stunStars);
function damageBoss(n, opts = {}) {
  if (B.dead || over) return;
  if (opts.normal && B.blind > 0) { if (Math.random() < .35) popText(bossCenter.clone().add(new THREE.Vector3(rnd(-1, 1), rnd(0, 1.2), 1)), 'block', 'MISS'); return; }
  const crit = opts.crit ?? Math.random() < .15, dmg = Math.round(n * (crit ? 1.8 : 1) * (weakT > 0 ? 1.25 : 1) * (B.vanish > 0 ? .5 : 1) * rnd(.92, 1.08));
  B.hp -= dmg; B.flashT = .12;
  const at = bossCenter.clone().add(new THREE.Vector3(rnd(-1.2, 1.2), rnd(-.6, 1.4), 1));
  popText(at, crit || opts.big ? 'big' : 'mid', fmt(dmg) + (crit ? '<small>크리티컬!</small>' : ''));
  if (opts.big || crit) shake(crit ? .12 : .08);
  while (B.hp <= 0 && !B.dead) {
    if (B.layer >= LAYERS.length - 1) { B.hp = 0; B.dead = true; finish(true); break; }
    B.layer++; const carry = -B.hp; B.hp = LAYERS[B.layer] - carry; B.trail = LAYERS[B.layer]; B.stagger = 1.4;
    cancelBombs(); popText(bossCenter.clone().add(new THREE.Vector3(0, 2.2, 0)), 'info', ARENA.onLayer(B.layer)); $('boss-name').textContent = ARENA.name();
    flash(ARENA.hitColor, 7, bossCenter, .7); shake(.22, .5);
    const c = $('b-count'); c.classList.add('pop'); setTimeout(() => c.classList.remove('pop'), 250);
  }
}
function hurt(u, n, cls = 'taken') {
  if (u.dead || over) return;
  if (veilT > 0) { popText(u.pos.clone().add(new THREE.Vector3(0, 2.4, 0)), 'block', '회피!'); return; }
  let left = Math.round(n * FX.guard * rnd(.92, 1.08));
  if (u.shield > 0) { const used = Math.min(u.shield, left); u.shield -= used; left -= used; if (used) popText(u.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), 'block', '막음 ' + fmt(used)); }
  if (left <= 0) return;
  u.hp -= left; u.hitT = .18; if (u.hp > 0) u.ch.play('hit'); popText(u.pos.clone().add(new THREE.Vector3(.3, 2.3, 0)), cls, '-' + fmt(left));
  if (u.hp <= 0) { u.hp = 0; u.dead = true; u.ch.set('down'); u.ring.visible = false; if (!alive().length) finish(false); }
}
function heal(u, n) { if (u.dead) return; if (u.sleep > 0) wakeUnit(u, '깼다!'); if (n > 0) u.ch.face('happy', .8); const v = Math.min(u.max - u.hp, Math.round(n)); u.hp += v; popText(u.pos.clone().add(new THREE.Vector3(0, 2.8, 0)), 'heal', '+' + fmt(v)); flash('#7dff9e', 2.4, u.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), .6); }

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
      chess: () => { g.fillStyle = '#f4f1e8'; g.strokeStyle = '#2a2420'; g.lineWidth = 5; g.beginPath(); g.moveTo(-34, 46); g.lineTo(34, 46); g.lineTo(28, 34); g.lineTo(16, 30); g.lineTo(22, -12); g.lineTo(36, -30); g.lineTo(18, -18); g.lineTo(8, -40); g.lineTo(0, -20); g.lineTo(-8, -40); g.lineTo(-18, -18); g.lineTo(-36, -30); g.lineTo(-22, -12); g.lineTo(-16, 30); g.lineTo(-28, 34); g.closePath(); g.fill(); g.stroke(); [-36, -8, 8, 36].forEach(x => { g.beginPath(); g.arc(x, x === -36 || x === 36 ? -32 : -42, 6, 0, 7); g.fill(); g.stroke(); }); g.fillStyle = '#ffd779'; g.beginPath(); g.arc(0, 4, 7, 0, 7); g.fill(); },
      knight: () => { g.fillStyle = '#2a2420'; g.strokeStyle = '#f4f1e8'; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, 46); g.lineTo(32, 46); g.lineTo(26, 30); g.lineTo(22, -6); g.quadraticCurveTo(26, -40, -2, -46); g.lineTo(-8, -36); g.lineTo(-34, -14); g.lineTo(-30, 2); g.lineTo(-12, -2); g.lineTo(-24, 30); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(2, -26, 4, 0, 7); g.fill(); },
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

// 스킬 실행: 연출 → 맞을 때 피해 → 끝나면 보스 효과
function castSkill(u, big) {
  if (big) speak(u.id, (SKILL_SPEC[u.id] || {}).say || u.st.skill);
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
  const run = (sp, done) => VIS[sp.v](u, Object.assign({ sc: s.sc }, sp), i => { if (sp.dmg) damageBoss(sp.dmg * SYNERGY * u.st.lvm * (['blaster', 'mage'].includes(u.st.role) ? CB.magic : 1) * (buffT > 0 ? 1.2 : 1) * (B.nerf > 0 ? .7 : 1), { big: sp.n === 1 || i === sp.n - 1, crit: sp.crit && Math.random() < .5 ? true : undefined }); }, () => { bossFx(sp); done && done(); });
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
  const u = U(id); if (!u || u.dead || u.sleep > 0 || u.gauge < 1 || over || !started) return;
  if (fromAuto) { u.gauge = 0; u.castT = .6; u.ch.play('cast'); castBanner(id); castSkill(u, false); return; }   // 자동: 멈추지 않고 짧은 띠만
  if (cutLock > 0 || ultT > 0) { if (!queue.includes(id)) queue.push(id); return; }
  u.gauge = 0; cutIn(id); cutLock = 1.05;
  pendingCast = () => { u.castT = .6; u.ch.play('cast'); castSkill(u, true); };
}
let bannerT = 0;
function castBanner(id) { const el = $('cast'); el.innerHTML = `<b>${STATS[id].skill}</b><small>${STATS[id].who}</small>`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), 900); }
let pendingCast = null;
const CUT = Object.fromEntries(Object.entries(STATS).map(([id, s]) => [id, [s.skill, s.who, s.c1]]));
function cutIn(id) {
  const role = STATS[id].role, svg = kitHeadSVG(id, { pose: role === 'healer' ? 'hold' : role === 'striker' ? 'cheer' : 'v' });
  const el = $('cutin'), [nm, who, c1] = CUT[id];
  $('cut-img').src = CUT_IMG[id] || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
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
// 3D 친구 사진: 스킬 카드(상반신) · 컷인(필살기 자세 전신)
const CUT_IMG = {};
shootAll(SKILL_ORDER.flatMap(id => [{ id, kind: 'bust', w: 164, h: 164, face: 'normal' }, { id, kind: 'full', w: 320, h: 560, pose: 'cast', face: 'fight', turn: .5 }]), (j, url) => {
  if (j.kind === 'bust') { const img = document.querySelector(`.sk[data-id="${j.id}"] .face img`); if (img) img.src = url; } else CUT_IMG[j.id] = url;
});
$('skills').addEventListener('click', e => { const k = e.target.closest('.sk'); if (k) useSkill(k.dataset.id); });
function skillUI() {
  document.querySelectorAll('.sk').forEach(el => {
    const u = U(el.dataset.id), ready = !u.dead && u.gauge >= 1;
    el.classList.toggle('ready', ready && !u.sleep); el.classList.toggle('dead', u.dead); el.classList.toggle('sleep', u.sleep > 0 && !u.dead);
    const cd = el.querySelector('.cd'), ult = el.querySelector('.ult');
    cd.style.display = ready || u.dead ? 'none' : 'grid'; cd.style.setProperty('--p', `${(1 - u.gauge) * 100}%`); cd.textContent = Math.ceil((1 - u.gauge) * u.st.cd);
    ult.style.display = ready && !u.sleep ? 'block' : 'none';
  });
}

/* ───────── 보스 위험 구역 (원 · 줄) + 챕터 특수 공격 ───────── */
const bombs = [];
const zoneMat = (c, op) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(op > .5 ? 1.6 : 1), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
// 원: { at, r }   줄: { at, axis: 'x'|'z', w }  — 시간이 차면 안에 있는 친구가 맞는다
function addZone(z) {
  const c = z.color || '#ff3a2a', at = z.at.clone(); at.y = .03; let ring, disc;
  if (z.axis) {
    const len = 26, [w, h] = z.axis === 'x' ? [len, z.w] : [z.w, len];
    ring = new THREE.Group(); [-1, 1].forEach(sd => { const e = new THREE.Mesh(new THREE.PlaneGeometry(z.axis === 'x' ? len : .1, z.axis === 'x' ? .1 : len), zoneMat(c, .9)); e.rotation.x = -Math.PI / 2; e.position.set(z.axis === 'x' ? 0 : sd * w / 2, 0, z.axis === 'x' ? sd * h / 2 : 0); ring.add(e); });
    ring.material = ring.children[0].material; ring.children[1].material = ring.material;
    disc = new THREE.Mesh(new THREE.PlaneGeometry(w, h), zoneMat(c, .3)); disc.rotation.x = -Math.PI / 2;
    if (z.axis === 'x') at.x = 0; else at.z = 0;
  } else {
    ring = new THREE.Mesh(new THREE.RingGeometry(z.r, z.r + .15, 48), zoneMat(c, .9)); ring.rotation.x = -Math.PI / 2;
    disc = new THREE.Mesh(new THREE.CircleGeometry(z.r, 48), zoneMat(c, .32)); disc.rotation.x = -Math.PI / 2;
  }
  [ring, disc].forEach(m => { m.position.copy(at); scene.add(m); }); disc.scale.set(.01, .01, 1);
  bombs.push(Object.assign({ dur: 2.2, dmg: 1100 }, z, { at, ring, disc, t: 0 }));
}
const zoneHits = (b, u) => b.axis === 'x' ? Math.abs(u.pos.z - b.at.z) < b.w / 2 + .2 : b.axis === 'z' ? Math.abs(u.pos.x - b.at.x) < b.w / 2 + .2 : u.pos.distanceTo(b.at) < b.r + .2;
function armsUp() { arms.forEach(a => tween(.5, k => { a.rotation.z = a.userData.side * (-1.05 - k * .9); })); }
const randomTargets = n => alive().sort(() => Math.random() - .5).slice(0, Math.min(n, alive().length));
const sayBoss = (txt, y = 2.6) => popText(bossCenter.clone().add(new THREE.Vector3(0, y, 0)), 'info', txt);
const revealed = () => CH === 4 && B.layer === 2;
function startBombs() {
  const L = B.layer;
  if (CH === 2) {   // 레이저 줄: 가로 한 줄 + 세로 한 줄
    const [a, b] = randomTargets(2);
    if (a) addZone({ at: a.pos, axis: 'x', w: 1.3, color: '#ff3ad2', dmg: 1000 + L * 150, dur: 2.0 });
    if (b) addZone({ at: b.pos, axis: 'z', w: 1.5, color: '#2df0ff', dmg: 1000 + L * 150, dur: 2.3 });
    sayBoss('레이저!');
  } else if (CH === 3) {   // 유령 손
    randomTargets(2).forEach(u => addZone({ at: u.pos, r: 1.15, color: '#8a5aff', dmg: 1050 + L * 150 }));
    sayBoss('유령 손!');
  } else if (revealed()) {   // 코드 블록 비: 작은 원 여러 개
    randomTargets(2).forEach(u => addZone({ at: u.pos, r: .9, color: '#5dff8a', dmg: 750, dur: 2 }));
    for (let i = 0; i < 3; i++) addZone({ at: new THREE.Vector3(rnd(-5.5, 3), 0, rnd(-1.6, 1.4)), r: .9, color: '#5dff8a', dmg: 750, dur: 1.7 + i * .3 });
    sayBoss('코드 블록 비!');
  } else if (CH === 4) {
    randomTargets(2).forEach(u => addZone({ at: u.pos, r: 1.2, color: '#ff8a3a', dmg: 1050 + L * 150 }));
    sayBoss('벽돌 낙하!');
  } else {
    randomTargets(2).forEach(u => addZone({ at: u.pos, r: 1.15, dmg: 1100 + L * 150 }));
    sayBoss('은행 폭탄!');
  }
  armsUp();
}
function cancelBombs() {
  bombs.splice(0).forEach(b => { scene.remove(b.ring, b.disc); }); arms.forEach(a => { a.rotation.z = a.userData.side * -1.05; });
  if (B.glareT > 0) { B.glareT = 0; ARENA.glare && ARENA.glare(0); sayBoss('막았다!', 1.4); }
  if (B.vanish > 0) { B.vanish = 0; sayBoss('모습이 드러났다!', 1.4); }
}
function stepBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.t += dt; const k = Math.min(1, b.t / b.dur);
    if (b.axis === 'x') b.disc.scale.set(1, k, 1); else if (b.axis === 'z') b.disc.scale.set(k, 1, 1); else b.disc.scale.set(k, k, 1);
    b.ring.material.opacity = .55 + Math.sin(b.t * 18) * .35;
    if (k >= 1) {
      scene.remove(b.ring, b.disc); bombs.splice(i, 1);
      const c = b.color || '#ff8a3c';
      if (b.axis) { const s = new THREE.Mesh(new THREE.PlaneGeometry(b.axis === 'x' ? 26 : b.w, b.axis === 'x' ? b.w : 26), zoneMat(c, 1)); s.rotation.x = -Math.PI / 2; s.position.copy(b.at); s.position.y = .06; scene.add(s); tween(.4, q => { s.material.opacity = 1 - q; s.scale.set(b.axis === 'z' ? 1 + q : 1, b.axis === 'x' ? 1 + q : 1, 1); }, () => scene.remove(s)); flash(c, 4, bossCenter.clone().add(new THREE.Vector3(0, 1, 1)), .4); }
      else { flash(c, 5, b.at.clone().add(new THREE.Vector3(0, .8, 0)), .6); flash('#ffe28a', 2.6, b.at.clone().add(new THREE.Vector3(0, .6, 0))); }
      if (revealed() && !b.axis) { const sp = iconSprite('code', 1.1); sp.position.copy(b.at).add(new THREE.Vector3(0, 6, 0)); scene.add(sp); tween(.25, q => { sp.position.y = b.at.y + 6 * (1 - q) + .5; }, () => scene.remove(sp)); }
      shake(.25, .4);
      units.forEach(u => { if (!u.dead && zoneHits(b, u)) hurt(u, b.dmg * SM.dmg); });
      if (!bombs.length) arms.forEach(a => tween(.35, k2 => { a.rotation.z = a.userData.side * (-1.95 + k2 * .9); }));
    }
  }
}
// 챕터 특수 공격: 보스가 기절하면 끊긴다
function special() {
  if (CH === 2) { B.glareT = 1.5; sayBoss('번쩍 준비…', 1.4); return; }
  if (CH === 3) {
    if ((B.spN = (B.spN || 0) + 1) % 2) { B.vanish = 4.5; sayBoss('사라졌다…', 1.4); flash('#8aa0ff', 6, bossCenter, .6); }
    else { const pool = alive().filter(u => !u.sleep), t = pool.find(u => u.st.role !== 'healer' && Math.random() < .6) || pool[0]; if (t) sleepUnit(t, 4.5); }
    return;
  }
  if (revealed()) { B.nerf = 4; sayBoss('밸런스 패치 · 공격 -30%', 1.4); screenFlash('#5dff8a', .35); flash('#5dff8a', 8, bossCenter, .8); }
}
function fireGlare() { ARENA.glare && ARENA.glare(0); B.blind = 3; screenFlash('#ffffff', .95); shake(.15, .3); sayBoss('눈부셔!', 1.4); }
function sleepUnit(u, t) {
  u.sleep = t; u.ch.set('sleep'); u.zzz = u.zzz || iconSprite('zzz', .8); u.zzz.visible = true; scene.add(u.zzz);
  popText(u.pos.clone().add(new THREE.Vector3(0, 2.8, 0)), 'block', '가위눌림');
}
function wakeUnit(u, txt) { if (!u.sleep) return; u.sleep = 0; if (!u.dead) u.ch.set('idle'); if (u.zzz) u.zzz.visible = false; if (txt) popText(u.pos.clone().add(new THREE.Vector3(0, 2.8, 0)), 'heal', txt); }
let revealTO = 0;
function showReveal() {
  const el = $('reveal'); if (!el) return;
  el.hidden = false; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  cutLock = Math.max(cutLock, 2.8); clearTimeout(revealTO); revealTO = setTimeout(() => { el.hidden = true; }, 2900);
  screenFlash('#ffffff', .8); shake(.3, .6);
}

/* ───────── 자동 스킬 ───────── */
let auto = false;
function autoSkills() {
  const ready = role => units.find(u => !u.dead && !u.sleep && u.gauge >= 1 && u.st.role === role);
  let u;
  if (B.glareT > 0 && (u = units.find(x => !x.dead && !x.sleep && x.gauge >= 1 && /stun|sleep/.test(JSON.stringify(skillOf(x.id)))))) return useSkill(u.id, true);
  if ((u = ready('healer')) && alive().some(x => x.sleep > 0)) return useSkill(u.id, true);
  if (bombs.length && (u = ready('tank'))) return useSkill(u.id, true);
  if (bombs.length && (u = ready('striker'))) return useSkill(u.id, true);
  if ((u = ready('healer')) && alive().some(x => x.hp / x.max < .55)) return useSkill(u.id, true);
  if ((u = ready('support'))) return useSkill(u.id, true);
  for (const r of ['mage', 'blaster']) if ((u = ready(r))) return useSkill(u.id, true);
  if ((u = ready('striker')) && B.bombT > 3) return useSkill(u.id, true);
  if ((u = ready('tank')) && alive().some(x => x.hp / x.max < .4)) return useSkill(u.id, true);
}

/* ───────── 전투 대사 · 목소리 ───────── */
const LOW_LINES = ['아직 안 끝났어!', '조금만 버텨!', '여기서 질 순 없지!', '도와줘!'];
const WIN_LINES = ['해냈다!', '역시 우리 팀!', '양일고 최고!', '이겼다!!'];
function sayLine(u, kind) {
  const pf = (typeof PROFILES !== 'undefined' && PROFILES[u.id]) || { lines: [] };
  const pool = kind === 'start' ? pf.lines.slice(0, 4) : kind === 'win' ? WIN_LINES.concat(pf.lines.slice(-3)) : LOW_LINES;
  const line = pool[Math.floor(Math.random() * pool.length)] || '가자!';
  popText(u.pos.clone().add(new THREE.Vector3(0, 3.3, 0)), 'say', line);
}
let voiceOn = true; try { voiceOn = localStorage.getItem('yangil.kingdom.voice') !== '0'; } catch (e) {}
const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
let koVoice = null; const pickVoice = () => { if (!synth) return; const vs = synth.getVoices(); koVoice = vs.find(v => /^ko/i.test(v.lang)) || null; };
if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
function speak(id, text) {
  if (!voiceOn || !synth || !text) return;
  try {
    synth.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[♪…]/g, ''));
    u.lang = 'ko-KR'; if (koVoice) u.voice = koVoice;
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const fem = PROFILES && PROFILES[id] && PROFILES[id].f;
    u.pitch = fem ? 1.25 + (h % 5) * .07 : .75 + (h % 5) * .07; u.rate = 1.05 + (h % 3) * .07; u.volume = .9;
    synth.speak(u);
  } catch (e) {}
}
$('b-voice').onclick = () => { voiceOn = !voiceOn; $('b-voice').innerHTML = drawIcon(voiceOn ? 'sound' : 'mute', 20); try { localStorage.setItem('yangil.kingdom.voice', voiceOn ? '1' : '0'); } catch (e) {} };
$('b-voice').innerHTML = drawIcon(voiceOn ? 'sound' : 'mute', 20); $('b-pause').innerHTML = drawIcon('pause', 18);

/* ───────── 진행 ───────── */
let started = false, over = false, paused = false, speed = 1, clockT = TIME_LIMIT, introT = 1.6;
function finish(win) {
  if (over) return; over = true;
  const left = alive().length, stars = win ? (left === 5 ? 3 : left >= 3 ? 2 : 1) : 0;
  const base = win ? { know: 20 + stars * 10, snack: 10 + stars * 8, power: 8 + stars * 6 } : { know: 5, snack: 3, power: 0 };
  const rw = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.round(v * SM.reward)]));
  const g = loadCampus(); let unlocked = false, chapOpen = 0, bondUp = [];
  if (g) {
    Object.keys(rw).forEach(r => { g.res[r] = (g.res[r] || 0) + rw[r]; });
    if (win) { g.bond = g.bond || {}; PICK.forEach(id => { g.bond[id] = (g.bond[id] || 0) + 1; bondUp.push(id); }); const nextCh = CH < CHAPTERS.length ? CH + 1 : 0, had = nextCh && progOf(g, nextCh); if (STAGE >= progOf(g, CH) && STAGE < MAX_STAGE) { setProg(g, CH, STAGE + 1); unlocked = true; saveSel(CH, STAGE + 1); } if (nextCh && !had && STAGE >= CHAP_UNLOCK) { setProg(g, nextCh, 1); chapOpen = nextCh; } }
    saveCampus(g);
  }
  if (win) setTimeout(() => alive().forEach((u, i) => { u.ch.set('cheer'); setTimeout(() => sayLine(u, 'win'), i * 260); }), 500);
  setTimeout(() => {
    $('r-sub').textContent = win ? 'STAGE CLEAR' : 'STAGE FAILED';
    $('r-title').textContent = win ? '승리!' : clockT <= 0 ? '시간 초과…' : '패배…';
    $('r-stars').innerHTML = [0, 1, 2].map(i => drawIcon(i < stars ? 'star' : 'starOff', i === 1 ? 46 : 36)).join('');
    $('r-time').innerHTML = win ? `${Math.round(TIME_LIMIT - clockT)}초 만에 ${josa(ARENA.name(), '을', '를')} 쓰러뜨렸다 · 남은 친구 ${left}명${unlocked ? `<br><b style="color:#ffd779">스테이지 ${CH}-${STAGE + 1} 열림!</b>` : ''}${chapOpen ? `<br><b style="color:#9dffb0">새 챕터 ${chapOpen} 「${CHAPTERS[chapOpen - 1].place}」 열림!</b>` : ''}${bondUp.length ? `<br>함께한 친구들 친밀도 +1` : ''}` : `${josa(ARENA.name(), '이', '가')} 너무 강했다. 캠퍼스에서 친구를 키우거나 건물을 지어 보자.`;
    $('r-rw').innerHTML = RES_ORDER.map(k => `<span class="rs">${drawIcon(k, 20)}+${rw[k]}</span>`).join('');
    $('result').hidden = false;
  }, win ? 1300 : 800);
  if (win) { flash('#ffd27a', 10, bossCenter, 1.2); shake(.3, .6); tween(1.2, k => { boss.rotation.z = -k * .35; boss.position.y = -k * .8; }); }
}
$('go').onclick = () => { $('start').hidden = true; started = true; units.forEach((u, i) => setTimeout(() => sayLine(u, 'start'), 900 + i * 300)); };
$('r-retry').onclick = () => location.reload();
$('r-camp').onclick = () => { location.href = './'; };
$('b-auto').onclick = () => { auto = !auto; $('b-auto').classList.toggle('on', auto); };
$('b-speed').onclick = () => { speed = speed === 1 ? 2 : 1; $('b-speed').textContent = '×' + speed; $('b-speed').classList.toggle('on', speed === 2); };
$('b-pause').onclick = () => { paused = !paused; $('b-pause').innerHTML = drawIcon(paused ? 'play' : 'pause', 18); };
addEventListener('keydown', e => { const i = '12345'.indexOf(e.key); if (i >= 0) useSkill(SKILL_ORDER[i]); if (e.key === ' ') $('b-pause').click(); });

function step(dt) {
  runTweens(dt);
  if (!started || over) return;
  if (introT > 0) { introT -= dt; }
  clockT -= dt; if (clockT <= 0) { clockT = 0; finish(false); }
  // 보스
  B.flashT = Math.max(0, B.flashT - dt); B.taunt = Math.max(0, B.taunt - dt); buffT = Math.max(0, buffT - dt); weakT = Math.max(0, weakT - dt); hasteT = Math.max(0, hasteT - dt); veilT = Math.max(0, veilT - dt); B.blind = Math.max(0, B.blind - dt); B.vanish = Math.max(0, B.vanish - dt); B.nerf = Math.max(0, B.nerf - dt);
  if (B.burn > 0) { B.burn -= dt; B.burnT += dt; if (B.burnT >= 1) { B.burnT = 0; damageBoss(150, { crit: false }); } }
  if (B.stun > 0) B.stun -= dt;
  else if (B.stagger > 0) B.stagger -= dt;
  else if (introT <= 0) {
    const haste = 1 + B.layer * .15;
    B.slamT -= dt * haste; B.bombT -= dt * haste;
    if (B.slamT <= 0 && !bombs.length) {
      B.slamT = 2.6; const tgt = (B.taunt > 0 && B.tauntBy && !B.tauntBy.dead) ? B.tauntBy : alive().sort((a, b) => b.pos.x - a.pos.x)[0];
      if (tgt) { arms.forEach(a => tween(.32, k => { a.rotation.z = a.userData.side * (-1.05 + Math.sin(k * Math.PI) * .7); a.rotation.x = -.25 + Math.sin(k * Math.PI) * .6; })); tween(.18, null, () => { if (B.miss > 0) { B.miss--; popText(tgt.pos.clone().add(new THREE.Vector3(0, 2.6, 0)), 'block', '빗나감!'); return; } hurt(tgt, (300 + B.layer * 60) * SM.dmg); flash('#ffb070', 2.2, tgt.pos.clone().add(new THREE.Vector3(0, 1.4, 0))); shake(.07); }); }
    }
    if (B.bombT <= 0 && !bombs.length) { B.bombT = rnd(8.5, 10.5); startBombs(); }
    if (B.glareT > 0) { B.glareT -= dt; ARENA.glare(1 - B.glareT / 1.5); if (B.glareT <= 0) fireGlare(); }
    else if ((CH !== 4 || revealed()) && (B.spT -= dt * haste) <= 0) { B.spT = rnd(11, 13.5); special(); }
  }
  stepBombs(B.stun > 0 ? 0 : dt);
  // 친구들
  units.forEach(u => {
    if (u.dead) return;
    u.hitT = Math.max(0, u.hitT - dt); u.castT = Math.max(0, (u.castT || 0) - dt);
    if (u.shieldT > 0) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
    if (u.hotT > 0) { u.hotT -= dt; u.hotAcc = (u.hotAcc || 0) + dt; if (u.hotAcc >= 1) { u.hotAcc = 0; heal(u, u.hot); } }
    if (u.sleep > 0) { u.sleep -= dt; if (u.sleep <= 0) wakeUnit(u, '깼다!'); return; }
    if (u.busy) return;
    const toHome = u.home.clone().sub(u.pos); toHome.y = 0;
    if (toHome.length() > .05) { u.pos.add(toHome.clampLength(0, dt * 5)); u.moving = true; return; }
    u.moving = false;
    u.gauge = Math.min(1, u.gauge + dt / u.st.cd);
    u.atkT -= dt;
    if (u.atkT <= 0) {
      u.atkT = u.st.rate / (hasteT > 0 ? 1.6 : 1);
      const atk = u.st.atk * (buffT > 0 ? 1.4 : 1) * (B.nerf > 0 ? .7 : 1);
      if (u.st.melee) { u.lunge = .3; u.ch.play('attack'); tween(.12, null, () => damageBoss(atk, { normal: true })); }
      else { u.ch.play('throw'); } if (!u.st.melee) bolt(u.pos.clone().add(new THREE.Vector3(.4, 2, 0)), bossCenter.clone().add(new THREE.Vector3(rnd(-.6, .6), rnd(-.8, .8), .8)), u.st.bolt, .35, () => damageBoss(atk, { normal: true }), .45, .6);
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
  ARENA.idle(now, B, real);
  stunStars.visible = B.stun > 0 && !over; stunStars.children.forEach((s, i) => { const a = now * 4 + i * 2.1; s.position.set(Math.cos(a) * .9, Math.sin(now * 8 + i) * .1, Math.sin(a) * .9); });
  // 친구 모습
  units.forEach(u => {
    if (u.lunge > 0) u.lunge = Math.max(0, u.lunge - real * speed * (paused ? 0 : 1));
    const lx = u.lunge > 0 ? Math.sin((u.lunge / .3) * Math.PI) * .7 : 0;
    u.step += real;
    if (!u.dead && !u.sleep && !over) u.ch.set(u.moving ? 'walk' : 'idle');
    u.ch.update(paused ? 0 : real * (cutLock > 0 || ultT > 0 ? 1 : speed));
    u.spr.position.set(u.pos.x + lx, u.pos.y > 0 ? u.pos.y : 0, u.pos.z);
    u.spr.rotation.y = u.dead ? .1 : u.moving ? Math.PI / 2 : .45;
    u.ring.position.set(u.pos.x, .02, u.pos.z); u.shadow.position.set(u.pos.x, .015, u.pos.z);
    u.bubble.position.set(u.pos.x, 1.5, u.pos.z); if (u.zzz) { u.zzz.visible = u.sleep > 0 && !u.dead; u.zzz.position.set(u.pos.x + .3, 3 + Math.sin(now * 3) * .15, u.pos.z); }
    u.bubble.material.opacity = u.shield > 0 ? .28 + Math.sin(now * 5) * .06 : 0;
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
  if (!over) units.forEach(u => { if (!u.dead && !u.lowSaid && u.hp / u.max < .3) { u.lowSaid = true; sayLine(u, 'low'); } });
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
window.__battle = { B, units, useSkill, hit: n => damageBoss(n, { crit: false }), CH, start: () => $('go').click(), get over() { return over; }, setAuto: v => { auto = v; }, setSpeed: v => { speed = v; } };
