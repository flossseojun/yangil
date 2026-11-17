// 팀 전투 (1-1 은행나무길 · 보스 은행왕): 자동 공격 · 스킬 게이지 · 필살기 컷인 · 위험 구역 · 3겹 체력
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ───────── 동아리 옷 ───────── */
Object.assign(OUTFIT_TOP, {
  labcoat: jk => `<path d="${jk}" fill="#f4f4f0" stroke="#c9ccd2" stroke-width="1"/><path d="M40 76 L50 96 L60 76" fill="#3b4a66"/><path d="M40 76 L46 100 M60 76 L54 100" stroke="#c9ccd2" stroke-width="1.4"/><rect x="61" y="88" width="9" height="7" rx="1" fill="none" stroke="#c9ccd2"/><path d="M63 86 v4" stroke="#3f7fb8" stroke-width="1.6"/>`,
  work: jk => `<path d="${jk}" fill="#e2772d" stroke="#a9521a" stroke-width="1"/><path d="M14 92 H86" stroke="#f5f0c8" stroke-width="3" opacity=".9"/><path d="M50 76 V100" stroke="#a9521a" stroke-width="1.4"/><path d="M42 76 L50 84 L58 76" fill="#2b2f36"/>`,
  sona: jk => `<path d="${jk}" fill="#23262c"/><path d="M33 75 Q50 86 67 75 L64 82 Q50 90 36 82Z" fill="#33373e"/><text x="50" y="96" text-anchor="middle" font-size="7" fill="#5dff8a" font-family="monospace">&lt;/&gt;</text>`,
  medic: jk => `<path d="${jk}" fill="#f7f7f5" stroke="#cfd3d8" stroke-width="1"/><path d="M42 76 L50 86 L58 76" fill="#7fc4b8"/><rect x="25" y="84" width="10" height="10" rx="1.5" fill="#e5484d"/><path d="M30 86 v6 M27 89 h6" stroke="#fff" stroke-width="1.8"/>`,
  sport: jk => `<path d="${jk}" fill="#1f6f8b" stroke="#164f63" stroke-width="1"/><path d="M42 75 L50 81 L58 75" fill="none" stroke="#fff" stroke-width="2"/><text x="50" y="97" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="sans-serif">10</text>`,
});
const GEAR = {
  shield: '<g transform="translate(14 150)"><path d="M0 0 Q12 -6 24 0 L22 22 Q12 32 2 22Z" fill="#5b6b7d" stroke="#2b3440" stroke-width="2"/><path d="M12 2 V26 M3 12 H21" stroke="#e2772d" stroke-width="3"/></g><g transform="translate(80 160) rotate(30)"><rect x="-2" y="0" width="4" height="20" rx="2" fill="#9aa4ad"/><path d="M-6 -2 a6 6 0 1 1 12 0 l-3 3 h-6Z" fill="#9aa4ad"/></g>',
  ball: '<g transform="translate(86 188)"><circle r="7" fill="#fff" stroke="#222" stroke-width="1.2"/><path d="M0 -3 l3 2 -1 3.5 h-4 l-1 -3.5Z" fill="#222"/></g>',
  flask: '<g transform="translate(84 156)"><circle cx="0" cy="16" r="16" fill="#5dff8a" opacity=".25"/><path d="M-3 0 h6 v8 l7 14 a3 3 0 0 1 -3 4 h-14 a3 3 0 0 1 -3 -4 l7 -14Z" fill="#dff" stroke="#7aa" stroke-width="1.2"/><path d="M-8 18 h16 l2 5 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3Z" fill="#5dff8a"/><circle cx="3" cy="12" r="1.6" fill="#b8ffd0"/></g>',
  laptop: '<g transform="translate(74 158)"><rect x="0" y="0" width="26" height="17" rx="2" fill="#2a2f36"/><rect x="2" y="2" width="22" height="13" fill="#0f1720"/><text x="4" y="10" font-size="6" fill="#5dff8a" font-family="monospace">run()</text><path d="M-3 17 h32 l-3 4 h-26Z" fill="#3a4049"/></g><g transform="translate(86 120)"><ellipse rx="10" ry="3" fill="#2a2f36"/><circle r="3" cy="-2" fill="#5dff8a"/><path d="M-12 -2 h-4 M12 -2 h4" stroke="#9aa4ad" stroke-width="2"/></g>',
  medkit: '<g transform="translate(76 164)"><rect x="0" y="0" width="22" height="16" rx="3" fill="#f7f7f5" stroke="#cfd3d8"/><rect x="7" y="-4" width="8" height="5" rx="1" fill="none" stroke="#cfd3d8" stroke-width="2"/><path d="M11 3 v10 M6 8 h10" stroke="#e5484d" stroke-width="3"/></g>',
};
const TEAM = [   // 앞줄부터
  { id: 'junyoung', top: 'work', jacket: '#e2772d', gear: 'shield', x: -1.3, z: .9, role: '#7fb3ff', name: '박준영' },
  { id: 'jeonggyu', top: 'sport', jacket: '#1f6f8b', gear: 'ball', x: -2.9, z: -.6, role: '#ff8a5c', name: '이정규' },
  { id: 'yunsu', top: 'labcoat', jacket: '#f4f4f0', gear: 'flask', x: -4.5, z: 1.1, role: '#ffb84d', name: '송윤수' },
  { id: 'seojun', top: 'sona', jacket: '#23262c', gear: 'laptop', x: -6.0, z: -.5, role: '#b48bff', name: '염서준', cast: true },
  { id: 'yejun', top: 'medic', jacket: '#f7f7f5', gear: 'medkit', x: -7.6, z: 1.0, role: '#7dff9e', name: '김예준' },
];

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
// 친구별 능력치와 스킬 (역할: 방어 · 돌격 · 폭발 · 마법 · 회복)
const STATS = {
  junyoung: { hp: 3400, atk: 120, rate: 1.1, melee: true, home: [2.5, .7], cd: 15, skill: '방패 로봇', who: '박준영 · 프롤로그 공학부 부장', c1: '#1c3358', bg: '#22385a' },
  jeonggyu: { hp: 2500, atk: 170, rate: .9, melee: true, home: [2.3, -1.0], cd: 10, skill: '돌파 슛', who: '이정규', c1: '#5a2018', bg: '#5a2418' },
  yunsu:    { hp: 1900, atk: 135, rate: 1.25, home: [-1.0, 1.1], cd: 12, skill: '폭발 실험', who: '송윤수 · 프롤로그 화학부 부장', c1: '#5a3010', bg: '#6a3a12', bolt: '#ffb84d' },
  seojun:   { hp: 1800, atk: 150, rate: 1.3, home: [-2.6, -.6], cd: 13, skill: '코딩 폭격', who: '염서준 · 소나 부장', c1: '#2a1d55', bg: '#3a2a66', bolt: '#7dffb0' },
  yejun:    { hp: 1800, atk: 90, rate: 1.4, home: [-4.1, .9], cd: 11, skill: '응급처치', who: '김예준 · 메디하트', c1: '#14503a', bg: '#1d5b3a', bolt: '#7dff9e' },
};
const SKILL_ORDER = ['yejun', 'seojun', 'yunsu', 'junyoung', 'jeonggyu'];
const SYNERGY = 1.15;                  // 발명: 프롤로그 화학부 + 공학부 → 스킬 피해 +15%
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
function spriteTex(av, pose, expr, jacket, gear, cb) {
  let svg = avatarFullSVG(av, '', { pose, expr, jacket }); svg = svg.replace(/<\/svg>$/, GEAR[gear] + '</svg>');
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 504; c.getContext('2d').drawImage(img, 0, 0, 240, 504); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; cb(t); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const units = TEAM.map(t => {
  const st = STATS[t.id], av = Object.assign({}, lookOf(t.id).av, { top: t.top });
  const mat = new THREE.SpriteMaterial({ transparent: true, alphaTest: .05 });
  const spr = new THREE.Sprite(mat); spr.center.set(.5, 0); spr.scale.set(1.6, 3.36, 1);
  const u = { id: t.id, t, st, hp: st.hp, max: st.hp, home: new THREE.Vector3(st.home[0], 0, st.home[1]), pos: new THREE.Vector3(st.home[0] - 9, 0, st.home[1]), atkT: rnd(0, st.rate), gauge: rnd(.25, .55), shield: 0, shieldT: 0, dead: false, spr, frames: {}, hitT: 0, lunge: 0, step: 0 };
  ['stand', 'walk', 'wave'].forEach(pose => spriteTex(av, pose, pose === 'wave' ? 'proud' : 'smile', t.jacket, t.gear, tx => { u.frames[pose] = tx; if (!mat.map) { mat.map = tx; mat.needsUpdate = true; } }));
  u.ring = new THREE.Mesh(new THREE.RingGeometry(.42, .6, 32), new THREE.MeshBasicMaterial({ color: t.role, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); u.ring.rotation.x = -Math.PI / 2;
  u.shadow = new THREE.Mesh(new THREE.CircleGeometry(.38, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35 })); u.shadow.rotation.x = -Math.PI / 2;
  u.bubble = new THREE.Sprite(additive('#7fb3ff', 0)); u.bubble.scale.set(1.9, 2.6, 1);
  scene.add(spr, u.ring, u.shadow, u.bubble);
  const bar = document.createElement('div'); bar.className = 'unit'; bar.innerHTML = '<div class="bar"><i></i></div>'; $('hud').appendChild(bar); u.bar = bar;
  return u;
});
const U = id => units.find(u => u.id === id);
const alive = () => units.filter(u => !u.dead);

/* ───────── 보스 상태 ───────── */
const B = { layer: 0, hp: LAYERS[0], trail: LAYERS[0], slamT: 3, bombT: 6.5, stun: 0, burn: 0, burnT: 0, stagger: 0, taunt: 0, dead: false, flashT: 0 };
const bossCenter = new THREE.Vector3(5.2, 2.6, .4);
const LEAF_COLORS = ['#f2b720', '#ff8a2a', '#ff4a3a'];
const stunStars = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = new THREE.Sprite(additive('#ffe58a')); s.scale.set(.5, .5, 1); stunStars.add(s); } stunStars.visible = false; stunStars.position.set(5.2, 6.4, -.4); scene.add(stunStars);
function damageBoss(n, opts = {}) {
  if (B.dead || over) return;
  const crit = opts.crit ?? Math.random() < .15, dmg = Math.round(n * (crit ? 1.8 : 1) * rnd(.92, 1.08));
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
  let left = Math.round(n * rnd(.92, 1.08));
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
function beam(from, to) {
  const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + to.x) / 2, 5.4, 0), to);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .09, 8), beamMat.clone()); scene.add(m);
  const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .24, 8), new THREE.MeshBasicMaterial({ color: '#2dff8a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(glow);
  tween(.7, k => { const o = k < .25 ? k / .25 : 1 - (k - .25) / .75; m.material.opacity = .95 * o; glow.material.opacity = .25 * o; }, () => { scene.remove(m, glow); });
}

/* ───────── 스킬 ───────── */
const SKILLS = {
  yejun: () => { alive().forEach(u => heal(u, u.max * .35)); },
  seojun: (u) => { const from = u.pos.clone().add(new THREE.Vector3(.4, 2.2, 0)); beam(from, bossCenter.clone()); tween(.25, null, () => { damageBoss(2600 * SYNERGY, { big: true }); flash('#ffe28a', 5, bossCenter); flash('#7dffb0', 3, bossCenter); }); },
  yunsu: (u) => { bolt(u.pos.clone().add(new THREE.Vector3(.4, 2, 0)), bossCenter.clone(), '#ffb84d', .45, () => { damageBoss(1500 * SYNERGY, { big: true }); B.burn = 5; flash('#ff8a3c', 6, bossCenter, .6); flash('#ffe28a', 3.5, bossCenter); shake(.18); }, .9, 2.2); },
  junyoung: () => { alive().forEach(x => { x.shield = 900; x.shieldT = 6; }); B.taunt = 6; popText(U('junyoung').pos.clone().add(new THREE.Vector3(0, 3.4, 0)), 'info', '전원 보호막!'); },
  jeonggyu: (u) => { bolt(u.pos.clone().add(new THREE.Vector3(.4, .6, 0)), bossCenter.clone().add(new THREE.Vector3(0, -.6, 0)), '#ffffff', .22, () => { damageBoss(1300 * SYNERGY, { big: true }); B.stun = 2.5; cancelBombs(); flash('#ffffff', 4, bossCenter); shake(.15); popText(bossCenter.clone().add(new THREE.Vector3(0, 2.4, 0)), 'info', '기절!'); }, .7, .3); },
};
let cutLock = 0;          // 컷인이 도는 동안 전투가 멈춘다
const queue = [];
function useSkill(id, fromAuto) {
  const u = U(id); if (!u || u.dead || u.gauge < 1 || over || !started) return;
  if (fromAuto) { u.gauge = 0; u.castT = .6; castBanner(id); SKILLS[id](u); return; }   // 자동: 멈추지 않고 짧은 띠만
  if (cutLock > 0) { if (!queue.includes(id)) queue.push(id); return; }
  u.gauge = 0; cutIn(id); cutLock = 1.05;
  pendingCast = () => { u.castT = .6; SKILLS[id](u); };
}
let bannerT = 0;
function castBanner(id) { const el = $('cast'); el.innerHTML = `<b>${STATS[id].skill}</b><small>${STATS[id].who}</small>`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), 900); }
let pendingCast = null;
const CUT = Object.fromEntries(Object.entries(STATS).map(([id, s]) => [id, [s.skill, s.who, s.c1]]));
function cutIn(id) {
  const t = U(id).t, av = Object.assign({}, lookOf(id).av, { top: t.top });
  const svg = avatarSVG(av, '', { expr: 'proud', pose: id === 'yejun' ? 'hold' : id === 'jeonggyu' ? 'cheer' : 'v' });
  const el = $('cutin'), [nm, who, c1] = CUT[id];
  $('cut-img').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  $('cut-name').textContent = nm; $('cut-who').textContent = who;
  el.style.setProperty('--c1', `linear-gradient(100deg, ${c1}, #0b0912 75%)`);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1150);
}
// 스킬 버튼
$('skills').innerHTML = SKILL_ORDER.map(id => {
  const u = U(id), av = Object.assign({}, lookOf(id).av, { top: u.t.top });
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVG(av, '', { expr: 'proud' }));
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
  const ready = id => { const u = U(id); return u && !u.dead && u.gauge >= 1; };
  if (bombs.length && ready('junyoung')) return useSkill('junyoung', true);
  if (bombs.length && ready('jeonggyu')) return useSkill('jeonggyu', true);
  if (ready('yejun') && alive().some(u => u.hp / u.max < .55)) return useSkill('yejun', true);
  for (const id of ['seojun', 'yunsu']) if (ready(id)) return useSkill(id, true);
  if (ready('jeonggyu') && B.bombT > 3) return useSkill('jeonggyu', true);
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
  B.flashT = Math.max(0, B.flashT - dt); B.taunt = Math.max(0, B.taunt - dt);
  if (B.burn > 0) { B.burn -= dt; B.burnT += dt; if (B.burnT >= 1) { B.burnT = 0; damageBoss(150, { crit: false }); } }
  if (B.stun > 0) B.stun -= dt;
  else if (B.stagger > 0) B.stagger -= dt;
  else if (introT <= 0) {
    const haste = 1 + B.layer * .15;
    B.slamT -= dt * haste; B.bombT -= dt * haste;
    if (B.slamT <= 0 && !bombs.length) {
      B.slamT = 2.6; const tgt = (B.taunt > 0 && !U('junyoung').dead) ? U('junyoung') : alive().sort((a, b) => b.pos.x - a.pos.x)[0];
      if (tgt) { arms.forEach(a => tween(.32, k => { a.rotation.z = a.userData.side * (-1.05 + Math.sin(k * Math.PI) * .7); a.rotation.x = -.25 + Math.sin(k * Math.PI) * .6; })); tween(.18, null, () => { hurt(tgt, 300 + B.layer * 60); flash('#ffb070', 2.2, tgt.pos.clone().add(new THREE.Vector3(0, 1.4, 0))); shake(.07); }); }
    }
    if (B.bombT <= 0 && !bombs.length) { B.bombT = rnd(8.5, 10.5); startBombs(); }
  }
  stepBombs(B.stun > 0 ? 0 : dt);
  // 친구들
  units.forEach(u => {
    if (u.dead) return;
    u.hitT = Math.max(0, u.hitT - dt); u.castT = Math.max(0, (u.castT || 0) - dt);
    if (u.shieldT > 0) { u.shieldT -= dt; if (u.shieldT <= 0) u.shield = 0; }
    const toHome = u.home.clone().sub(u.pos); toHome.y = 0;
    if (toHome.length() > .05) { u.pos.add(toHome.clampLength(0, dt * 5)); u.moving = true; return; }
    u.moving = false;
    u.gauge = Math.min(1, u.gauge + dt / u.st.cd);
    u.atkT -= dt;
    if (u.atkT <= 0) {
      u.atkT = u.st.rate;
      if (u.st.melee) { u.lunge = .3; tween(.12, null, () => damageBoss(u.st.atk)); }
      else bolt(u.pos.clone().add(new THREE.Vector3(.4, 2, 0)), bossCenter.clone().add(new THREE.Vector3(rnd(-.6, .6), rnd(-.8, .8), .8)), u.st.bolt, .35, () => damageBoss(u.st.atk), .45, .6);
    }
  });
  if (auto && cutLock <= 0) autoSkills();
}

/* ───────── 그리기 ───────── */
const clock = new THREE.Clock();
function frame() {
  const real = Math.min(clock.getDelta(), .05);
  if (!paused) {
    if (cutLock > 0) { cutLock -= real; if (cutLock <= 0) { const f = pendingCast; pendingCast = null; f && f(); if (queue.length) setTimeout(() => useSkill(queue.shift()), 80); } runTweens(0); }
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
  if (shakeT > 0) { shakeT -= real; camera.position.set(camBase.x + rnd(-1, 1) * shakeAmp, camBase.y + rnd(-1, 1) * shakeAmp, camBase.z); } else { shakeAmp = 0; camera.position.copy(camBase); }
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__battle = { B, units, useSkill, start: () => $('go').click(), get over() { return over; }, setAuto: v => { auto = v; }, setSpeed: v => { speed = v; } };
