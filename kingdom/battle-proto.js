// 팀 전투 시안 (정지 장면): 해 질 녘 안뜰 3D 무대 · 은행나무 골렘 보스 · 동아리 장비를 든 친구들
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
function resize() { const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.position.set(-1, 4.2, 15.5 * Math.max(1, 1.6 / camera.aspect)); camera.lookAt(-1, 2.3, 0); camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
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
function arm(side) { const g = new THREE.Group(); const a = cast(new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 2.4, 7), bark)); a.position.y = 1.1; g.add(a); const fist = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 0), leafM)); fist.position.y = 2.4; g.add(fist); g.position.set(side * 1, 3.1, .2); g.rotation.z = side * -1.05; g.rotation.x = -.25; boss.add(g); }
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

/* ───────── 친구들 (장비를 든 SD 그림) ───────── */
const glowT = tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const people = [];
TEAM.forEach(t => {
  const look = lookOf(t.id), av = Object.assign({}, look.av, { top: t.top });
  let svg = avatarFullSVG(av, '', { pose: t.cast ? 'wave' : 'stand', expr: t.cast ? 'proud' : 'smile', jacket: t.jacket });
  svg = svg.replace(/<\/svg>$/, GEAR[t.gear] + '</svg>');
  const mat = new THREE.SpriteMaterial({ transparent: true, alphaTest: .05 });
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 504; c.getContext('2d').drawImage(img, 0, 0, 240, 504); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; mat.map = tx; mat.needsUpdate = true; };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const s = new THREE.Sprite(mat); s.center.set(.5, 0); s.scale.set(1.6, 3.36, 1); s.position.set(t.x, 0, t.z); scene.add(s);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.42, .6, 32), new THREE.MeshBasicMaterial({ color: t.role, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(t.x, .02, t.z); scene.add(ring);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.38, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35 })); shadow.rotation.x = -Math.PI / 2; shadow.position.set(t.x, .015, t.z); scene.add(shadow);
  people.push({ t, s });
});

/* ───────── 스킬 연출: 코딩 폭격 (빛줄기 + 폭발) ───────── */
const caster = TEAM.find(t => t.cast), from = new THREE.Vector3(caster.x + .4, 2.2, caster.z), to = new THREE.Vector3(5.2, 1.9, .9);
const curve = new THREE.QuadraticBezierCurve3(from, new THREE.Vector3((from.x + to.x) / 2, 5.2, 0), to);
const beam = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .07, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#7dffb0').multiplyScalar(2.5), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(beam);
const beam2 = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .2, 8), new THREE.MeshBasicMaterial({ color: '#2dff8a', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(beam2);
for (let i = 0; i < 6; i++) { const p = curve.getPoint(.15 + i * .14), c = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(64, 32, (g) => { g.fillStyle = '#5dff8a'; g.font = 'bold 22px monospace'; g.fillText(['{ }', '01', '</>', 'if', '++', ';'][i], 6, 24); }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); c.position.copy(p).add(new THREE.Vector3(0, .35, 0)); c.scale.set(.7, .35, 1); scene.add(c); }
[[1.2, '#ffe28a'], [.7, '#ffffff'], [1.8, '#ff8a3c']].forEach(([s, col]) => { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); b.position.copy(to); b.scale.set(s, s, 1); scene.add(b); });
const hit = new THREE.PointLight('#ffd27a', 7, 6, 1.6); hit.position.copy(to).add(new THREE.Vector3(0, 0, 1)); scene.add(hit);
// 회복 빛 (김예준 → 앞줄)
const healer = TEAM.find(t => t.id === 'yejun');
TEAM.slice(0, 2).forEach(t => { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: '#7dff9e', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false })); h.position.set(t.x, .9, t.z); h.scale.set(1.4, 1.6, 1); scene.add(h); });

/* ───────── 화면 위 표시 ───────── */
const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
function overlay() {
  const H = document.getElementById('hud'), parts = [];
  people.forEach(({ t, s }) => { const [x, y] = toScreen(new THREE.Vector3(t.x, 3.5, t.z)); parts.push(`<div class="unit" style="left:${x}px;top:${y}px"><div class="bar"><i style="width:${t.id === 'junyoung' ? 68 : t.id === 'jeonggyu' ? 84 : 100}%"></i></div><div class="nm">${t.name}</div></div>`); });
  const d = (v, cls, html) => { const [x, y] = toScreen(v); parts.push(`<div class="dmg ${cls}" style="left:${x}px;top:${y}px">${html}</div>`); };
  d(new THREE.Vector3(2.4, 4.4, 1), 'big', '24,816<small>크리티컬!</small>'); d(new THREE.Vector3(7.1, 2.6, 1), 'mid', '3,402'); d(new THREE.Vector3(3.4, 1.2, 1), 'mid', '2,980');
  d(new THREE.Vector3(-1.3, 2.9, .9), 'heal', '+1,240'); d(new THREE.Vector3(-2.9, 2.9, -.6), 'heal', '+1,240');
  H.innerHTML = parts.join('');
}
const SK = [['yejun', '응급처치', 0, '#1d5b3a'], ['seojun', '코딩 폭격', 0, '#3a2a66', true], ['yunsu', '폭발 실험', 45, '#6a3a12'], ['junyoung', '방패 로봇', 70, '#22385a'], ['jeonggyu', '돌파 슛', 25, '#5a2418']];
document.getElementById('skills').innerHTML = SK.map(([id, nm, cd, bg]) => {
  const t = TEAM.find(x => x.id === id), av = Object.assign({}, lookOf(id).av, { top: t.top });
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVG(av, '', { expr: 'proud' }));
  return `<div class="sk ${cd ? '' : 'ready'}" data-id="${id}" style="--bg:linear-gradient(160deg, ${bg}, #0d0b14)"><div class="face"><img src="${src}" alt=""></div>${cd ? `<div class="cd" style="--p:${cd}%">${Math.ceil(cd / 10)}</div>` : '<span class="ult">READY</span>'}<b>${nm}</b></div>`;
}).join('');

const CUT = { seojun: ['코딩 폭격', '염서준 · 소나 부장', '#2a1d55'], yejun: ['응급처치', '김예준 · 메디하트', '#14503a'], yunsu: ['폭발 실험', '송윤수 · 프롤로그 화학부 부장', '#5a3010'], junyoung: ['방패 로봇', '박준영 · 프롤로그 공학부 부장', '#1c3358'], jeonggyu: ['돌파 슛', '이정규', '#5a2018'] };
function cutIn(id, hold) {
  const t = TEAM.find(x => x.id === id), av = Object.assign({}, lookOf(id).av, { top: t.top });
  const svg = avatarSVG(av, '', { expr: 'proud', pose: id === 'yejun' ? 'hold' : id === 'jeonggyu' ? 'cheer' : 'v' });
  const el = document.getElementById('cutin'), [nm, who, c1] = CUT[id];
  document.getElementById('cut-img').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  document.getElementById('cut-name').textContent = nm; document.getElementById('cut-who').textContent = who;
  el.style.setProperty('--c1', `linear-gradient(100deg, ${c1}, #0b0912 75%)`);
  el.classList.remove('show', 'hold'); void el.offsetWidth; el.classList.add('show'); if (hold) el.classList.add('hold');
  if (!hold) setTimeout(() => el.classList.remove('show'), 1150);
}
document.getElementById('skills').addEventListener('click', e => { const k = e.target.closest('.sk'); if (k) cutIn(k.dataset.id); });
if (new URLSearchParams(location.search).get('cut')) cutIn(new URLSearchParams(location.search).get('cut'), true);
let t0 = 0;
function loop(t) { const k = t / 1000; boss.rotation.y = Math.sin(k * .6) * .05; aura.material.opacity = .22 + Math.sin(k * 3) * .06; composer.render(); overlay(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.__ready = true;
