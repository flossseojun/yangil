// 챕터별 무대와 보스 모습. 전투 규칙은 battle.js가 맡고, 여기서는 보이는 것만 만든다.
// 모든 보스는 (5.2, 0, -.6)에 서고, 팔(arms)은 어깨에서 위로 뻗은 자세(rotation.z = side × -1.05)가 기본이다.
import * as THREE from 'three';

const BOSS_AT = [5.2, 0, -.6];
const grad = (X, stops) => X.tex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([c, k]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const glowBasic = (c, m = 2) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(m) });
const addAura = (boss, color) => { const a = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false })); a.rotation.x = -Math.PI / 2; a.position.y = .02; boss.add(a); return a; };
function makeArm(X, boss, arms, side, at, limbM, fistM, limb, fist) {
  const g = new THREE.Group(); arms.push(g); g.userData.side = side;
  const a = X.cast(new THREE.Mesh(limb, limbM)); a.position.y = 1.1; g.add(a);
  const f = X.cast(new THREE.Mesh(fist, fistM)); f.position.y = 2.4; g.add(f);
  g.position.set(side * at[0], at[1], at[2]); g.rotation.z = side * -1.05; g.rotation.x = -.25; boss.add(g); return g;
}
function floatPoints(X, n, color, size, spread = [18, 7, 10], map) {
  const geo = new THREE.BufferGeometry(), P = [];
  for (let i = 0; i < n; i++) P.push((Math.random() - .3) * spread[0], Math.random() * spread[1], (Math.random() - .5) * spread[2]);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: map || X.glowT, color, size, transparent: true, depthWrite: false, blending: map ? THREE.NormalBlending : THREE.AdditiveBlending }));
  X.scene.add(pts); return pts;
}
function floorOf(X, draw, rep = [6, 3], mat = {}) {
  const t = X.tex(512, 512, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: .9 }, mat))); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; X.scene.add(f); return f;
}
function lights(X, o) {
  X.scene.background = grad(X, o.sky); X.scene.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]);
  X.hemi.color.set(o.hemi[0]); X.hemi.groundColor.set(o.hemi[1]); X.hemi.intensity = o.hemi[2];
  X.sun.color.set(o.sun[0]); X.sun.intensity = o.sun[1]; if (o.sun[2]) X.sun.position.set(...o.sun[2]);
  X.fill.color.set(o.fill[0]); X.fill.intensity = o.fill[1];
}

/* ───────── 1. 은행나무길 · 은행왕 ───────── */
function ginkgo(X) {
  const { scene, tex, cast } = X;
  floorOf(X, (g) => { g.fillStyle = '#6b5a52'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const l = 38 + Math.random() * 10; g.fillStyle = `hsl(20, 12%, ${l}%)`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } g.fillStyle = 'rgba(255,200,80,.18)'; for (let k = 0; k < 90; k++) { g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 6, 4, Math.random() * 3, 0, 7); g.fill(); } });
  const winT = tex(256, 128, (g, w, h) => { g.fillStyle = '#3a2f45'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = Math.random() < .55 ? '#ffd27a' : '#2a2236'; g.fillRect(i * 16 + 4, j * 32 + 8, 8, 14); } });
  const bld = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 3), [0, 0, 0, 0, 1, 0].map(k => new THREE.MeshStandardMaterial(k ? { map: winT, emissive: '#ffffff', emissiveMap: winT, emissiveIntensity: .55 } : { color: '#3a2f45' })));
  bld.position.set(1, 3.5, -12); scene.add(bld);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshStandardMaterial({ color: '#3a2f45' })); tower.position.set(1, 9, -12); scene.add(tower);
  const clockM = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), glowBasic('#ffe2a0', 1.8)); clockM.position.set(1, 9.3, -10.45); scene.add(clockM);
  function tree(x, z, s) { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.18 * s, .28 * s, 2 * s, 7), new THREE.MeshStandardMaterial({ color: '#4a3020' })); tr.position.y = s; tr.castShadow = true; g.add(tr); const lm = new THREE.MeshStandardMaterial({ color: '#d99a1e', flatShading: true, roughness: .8 }); [[0, 2.4, 0, 1.1], [.6, 2, .3, .8], [-.6, 2.1, -.2, .85], [0, 3, 0, .8]].forEach(([a, b, c, r]) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), lm); l.position.set(a * s, b * s, c * s); l.castShadow = true; g.add(l); }); g.position.set(x, 0, z); scene.add(g); }
  [[-11, -5, 1.2], [-8, -8, 1], [11, -5, 1.2], [8.5, -8.5, 1], [-14, 0, 1.3], [14, -1, 1.3]].forEach(a => tree(...a));

  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  const bark = new THREE.MeshStandardMaterial({ color: '#5a3a24', roughness: .95, flatShading: true });
  const leafM = new THREE.MeshStandardMaterial({ color: '#f2b720', emissive: '#a05a00', emissiveIntensity: .35, flatShading: true, roughness: .6 });
  const trunk = cast(new THREE.Mesh(new THREE.CylinderGeometry(.85, 1.25, 3.4, 9, 3), bark)); trunk.position.y = 2.3; trunk.rotation.z = .06; boss.add(trunk);
  [[-.9, .45, .5, -.7], [.95, .4, .4, .8], [0, .4, -1, 0], [.2, .4, 1.05, .3]].forEach(([x, y, z, r]) => { const root = cast(new THREE.Mesh(new THREE.ConeGeometry(.42, 1.6, 6), bark)); root.position.set(x, y, z); root.rotation.set(z * .6, 0, r + Math.PI); boss.add(root); });
  const arms = [];
  [-1, 1].forEach(s => makeArm(X, boss, arms, s, [1, 3.1, .2], bark, leafM, new THREE.CylinderGeometry(.22, .34, 2.4, 7), new THREE.IcosahedronGeometry(.55, 0)));
  [[0, 5, 0, 1.6], [1.1, 4.6, .3, 1.15], [-1.1, 4.7, -.1, 1.2], [.3, 5.9, -.2, 1.1], [-.5, 4.3, .9, .9], [.7, 4.2, -.9, 1]].forEach(([x, y, z, r]) => { const l = cast(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), leafM)); l.position.set(x, y, z); boss.add(l); });
  const eyeM = glowBasic('#ffef9a', 3);
  [-.38, .38].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), eyeM); e.position.set(x, 3.05, .98); e.scale.set(1.4, .7, .6); boss.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .1), bark); brow.position.set(x, 3.3, 1); brow.rotation.z = x > 0 ? .45 : -.45; boss.add(brow); });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.8, .14, .1), glowBasic('#ff9a3c', 2.2)); mouth.position.set(0, 2.55, 1.05); boss.add(mouth);
  const eyeLight = new THREE.PointLight('#ffb040', 6, 6, 1.6); eyeLight.position.set(0, 3.1, 1.6); boss.add(eyeLight);
  const aura = addAura(boss, '#ff7a2a');
  const leafT = tex(32, 32, (g) => { g.fillStyle = '#ffcf3a'; g.beginPath(); g.moveTo(16, 28); g.lineTo(4, 10); g.quadraticCurveTo(16, 0, 28, 10); g.closePath(); g.fill(); });
  floatPoints(X, 160, '#ffffff', .28, undefined, leafT);
  const LEAF = ['#f2b720', '#ff8a2a', '#ff4a3a'];
  return {
    name: () => '은행왕', boss, arms, hitColor: '#ffd27a',
    onLayer(l) { leafM.color.set(LEAF[l]); leafM.emissive.set(l === 2 ? '#b0200a' : '#b04a00'); return l === 2 ? '마지막 한 겹! 은행왕이 분노했다' : '한 겹 격파!'; },
    idle(now, B) {
      if (!B.dead) { boss.rotation.y = Math.sin(now * .6) * .05; boss.scale.set(1, 1 + Math.sin(now * 1.6) * .03, 1); }
      leafM.emissiveIntensity = B.flashT > 0 ? 1.4 : .35 + (B.layer === 2 ? Math.sin(now * 6) * .15 : 0);
      bark.emissive.set(B.flashT > 0 ? '#5a2a10' : '#000000');
      aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
    },
  };
}

/* ───────── 2. 다목적관 · LED 스크린 ───────── */
function led(X) {
  const { scene, tex, cast } = X;
  lights(X, { sky: [['#04030c', 0], ['#120a2c', .5], ['#26104a', .8], ['#3a1454', 1]], fog: ['#140a2c', 15, 40], hemi: ['#8a7bff', '#0a0618', .5], sun: ['#d6c8ff', 1.5, [-6, 10, -4]], fill: ['#ff3aa8', .9] });
  // 체육관 마루 + 코트 선
  floorOf(X, (g) => {
    for (let i = 0; i < 16; i++) { g.fillStyle = `hsl(28, 40%, ${22 + (i % 3) * 3 + Math.random() * 2}%)`; g.fillRect(i * 32, 0, 32, 512); }
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 512); g.stroke(); }
    g.strokeStyle = '#ffcf5a'; g.lineWidth = 5; g.beginPath(); g.arc(256, 256, 90, 0, 7); g.stroke(); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.stroke();
    g.strokeStyle = '#ff5ab8'; g.strokeRect(8, 8, 496, 496);
  }, [3, 1.5], { roughness: .32, metalness: .15 });
  // 네온 띠 (바닥 앞뒤)
  [[-6.2, '#ff3ad2'], [5.4, '#2df0ff']].forEach(([z, c]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(40, .14), glowBasic(c, 2.4)); s.rotation.x = -Math.PI / 2; s.position.set(0, .03, z); scene.add(s); });
  // 관중석: 계단 + 휴대폰 불빛
  const crowdT = tex(512, 64, (g, w, h) => { g.fillStyle = '#120e22'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = ['#2df0ff', '#ff3ad2', '#ffe55a', '#ffffff'][i % 4]; g.globalAlpha = .4 + Math.random() * .6; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); } g.globalAlpha = 1; });
  for (let i = 0; i < 5; i++) { const step = new THREE.Mesh(new THREE.BoxGeometry(34, .8, 1.4), [0, 0, 0, 0, 1, 0].map(k => new THREE.MeshStandardMaterial(k ? { map: crowdT, emissive: '#ffffff', emissiveMap: crowdT, emissiveIntensity: .7 } : { color: '#1a1530' }))); step.position.set(0, .4 + i * .8, -9 - i * 1.4); scene.add(step); }
  // 천장 트러스 + 조명 빛줄기
  const truss = new THREE.Mesh(new THREE.BoxGeometry(30, .3, .3), new THREE.MeshStandardMaterial({ color: '#2a2a36', metalness: .6 })); truss.position.set(0, 11, -3); scene.add(truss);
  const beams = [];
  [[-9, '#ff3ad2'], [-3, '#2df0ff'], [3, '#b6ff2d'], [9, '#ff3ad2'], [13, '#2df0ff']].forEach(([x, c], i) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 12, 24, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.geometry.translate(0, -6, 0); cone.position.set(x, 11, -3); cone.userData.ph = i * 1.3; scene.add(cone); beams.push(cone);
  });
  floatPoints(X, 120, '#ff9af0', .16);

  // 보스: 다리 달린 대형 LED 스크린
  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  const metal = new THREE.MeshStandardMaterial({ color: '#1d1f28', metalness: .7, roughness: .35 });
  [-1.3, 1.3].forEach(x => { const leg = cast(new THREE.Mesh(new THREE.BoxGeometry(.32, 2.2, .32), metal)); leg.position.set(x, 1.1, 0); boss.add(leg); const foot = cast(new THREE.Mesh(new THREE.BoxGeometry(.9, .18, 1.1), metal)); foot.position.set(x, .09, .1); boss.add(foot); });
  const frame = cast(new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, .5), metal)); frame.position.y = 3.7; boss.add(frame);
  const FC = document.createElement('canvas'); FC.width = 160; FC.height = 112; const fg = FC.getContext('2d');
  const faceT = new THREE.CanvasTexture(FC); faceT.colorSpace = THREE.SRGBColorSpace; faceT.magFilter = THREE.NearestFilter;
  const screenM = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffffff', emissiveMap: faceT, emissiveIntensity: 1.15 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.85), screenM); screen.position.set(0, 3.7, .26); boss.add(screen);
  [-1.5, 1.5].forEach(x => { const sp = cast(new THREE.Mesh(new THREE.BoxGeometry(.8, .7, .6), metal)); sp.position.set(x, 5.7, 0); boss.add(sp); const cone = new THREE.Mesh(new THREE.CircleGeometry(.26, 18), glowBasic('#2df0ff', 1.6)); cone.position.set(x, 5.7, .31); boss.add(cone); });
  const fistM = new THREE.MeshStandardMaterial({ color: '#202330', emissive: '#2df0ff', emissiveIntensity: .7, metalness: .5 });
  const arms = [];
  [-1, 1].forEach(s => makeArm(X, boss, arms, s, [2.3, 3.4, .1], metal, fistM, new THREE.CylinderGeometry(.12, .16, 2.4, 8), new THREE.BoxGeometry(.85, .85, .85)));
  const glowL = new THREE.PointLight('#2df0ff', 8, 8, 1.6); glowL.position.set(0, 3.7, 1.8); boss.add(glowL);
  const aura = addAura(boss, '#2df0ff');
  const COL = ['#2df0ff', '#ff3ad2', '#ff3a3a'];
  let layer = 0, glare = 0, drawT = 0, look = 0;
  function drawFace(now, B) {
    const c = COL[layer], w = 160, h = 112;
    fg.fillStyle = '#05060a'; fg.fillRect(0, 0, w, h);
    fg.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 4) fg.fillRect(0, y, w, 1);
    const px = (x, y, ww, hh, col = c) => { fg.fillStyle = col; fg.fillRect(Math.round(x), Math.round(y), ww, hh); };
    const blink = Math.sin(now * 1.3) > .96;
    [44, 116].forEach((cx, i) => {
      if (blink) px(cx - 14, 46, 28, 4); else { px(cx - 14, 34, 28, 22); px(cx - 6 + look * 6, 40, 10, 10, '#05060a'); }
      for (let k = 0; k < 5; k++) px(cx - 16 + k * 6, (i ? 30 - k * 2 : 22 + k * 2) - (layer === 2 ? 2 : 0), 6, 4);   // 화난 눈썹
    });
    for (let k = 0; k < 12; k++) px(44 + k * 6, 80 + (k % 2 ? 6 : 0) * (layer + 1) / 2, 6, 5);   // 지그재그 입
    if (Math.random() < .25 + layer * .15) { const y = Math.random() * h, s = (Math.random() - .5) * 30; const img = fg.getImageData(0, y, w, 8); fg.putImageData(img, s, y); }
    if (layer === 2) { px(0, 0, w, 3, '#ff3a3a'); px(0, h - 3, w, 3, '#ff3a3a'); }
    if (glare > 0) { fg.fillStyle = `rgba(255,255,255,${Math.min(1, glare)})`; fg.fillRect(0, 0, w, h); }
    fg.font = 'bold 9px monospace'; fg.fillStyle = c; fg.fillText(B.blind > 0 ? 'FLASH!!' : 'LIVE ●', 6, 12);
    faceT.needsUpdate = true;
  }
  return {
    name: () => 'LED 스크린', boss, arms, hitColor: '#9af6ff',
    onLayer(l) { layer = l; fistM.emissive.set(COL[l]); glowL.color.set(COL[l]); aura.material.color.set(COL[l]); return l === 2 ? '마지막 한 겹! 화면이 빨갛게 달아올랐다' : '한 겹 격파! 화면에 금이 갔다'; },
    glare(k) { glare = k; },
    idle(now, B, dt) {
      if (!B.dead) { boss.rotation.y = Math.sin(now * .7) * .06; boss.position.y = Math.abs(Math.sin(now * 2.2)) * .05; }
      drawT -= dt; if (drawT <= 0) { drawT = .1; look = Math.sin(now * .9); drawFace(now, B); }
      screenM.emissiveIntensity = B.flashT > 0 ? 2.2 : 1.1 + glare * 1.8; glowL.intensity = 8 + glare * 30;
      metal.emissive.set(B.flashT > 0 ? '#20304a' : '#000000');
      aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
      beams.forEach(b => { b.rotation.z = Math.sin(now * .6 + b.userData.ph) * .35; b.rotation.x = Math.cos(now * .5 + b.userData.ph) * .2; });
    },
  };
}

/* ───────── 3. 밤의 교실 · 야자의 유령 ───────── */
function ghost(X) {
  const { scene, tex, cast } = X;
  lights(X, { sky: [['#02040d', 0], ['#081230', .55], ['#14224a', 1]], fog: ['#0a1228', 12, 34], hemi: ['#5a78c0', '#05060c', .38], sun: ['#a8c0ff', 1.5, [-6, 9, -2]], fill: ['#6a4aa0', .4] });
  floorOf(X, (g) => { for (let j = 0; j < 16; j++) { g.fillStyle = `hsl(28, 30%, ${18 + Math.random() * 6}%)`; g.fillRect(0, j * 32, 512, 32); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, j * 32, 512, 2); g.fillRect(((j * 97) % 5) * 100 + 40, j * 32, 2, 32); } }, [4, 2], { roughness: .7 });
  // 뒷벽 + 칠판 + 창문
  const wall = new THREE.Mesh(new THREE.BoxGeometry(32, 9, .5), new THREE.MeshStandardMaterial({ color: '#2a3350', roughness: .95 })); wall.position.set(0, 4.5, -9); wall.receiveShadow = true; scene.add(wall);
  const boardT = tex(512, 180, (g, w, h) => { g.fillStyle = '#16302a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * w, Math.random() * h, 60, 6); g.font = '30px Jua, sans-serif'; g.fillStyle = 'rgba(240,244,236,.85)'; g.fillText('야간 자율학습 3교시', 26, 52); g.font = '22px Jua, sans-serif'; g.fillText('떠들면 유령이 온다…', 26, 98); g.fillStyle = 'rgba(255,210,120,.85)'; g.fillText('D-100', 400, 52); g.fillStyle = 'rgba(240,244,236,.6)'; g.fillText('자습 감독: (빈자리)', 26, 144); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.5), new THREE.MeshStandardMaterial({ map: boardT, emissive: '#ffffff', emissiveMap: boardT, emissiveIntensity: .25 })); board.position.set(0, 4.3, -8.7); scene.add(board);
  const winT = tex(128, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a4a90'); gr.addColorStop(1, '#0a1838'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#e8f0ff'; g.beginPath(); g.arc(84, 38, 18, 0, 7); g.fill(); g.fillStyle = '#2a4a90'; g.beginPath(); g.arc(92, 32, 15, 0, 7); g.fill(); g.strokeStyle = '#141a2a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); });
  [-10.5, 10.5].forEach(x => { const wn = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: winT })); wn.position.set(x, 4.6, -8.7); scene.add(wn); });
  // 책상들
  const deskM = new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: .8 }), legM = new THREE.MeshStandardMaterial({ color: '#3a3f4a', metalness: .5 });
  function desk(x, z, r) { const g = new THREE.Group(); const top = cast(new THREE.Mesh(new THREE.BoxGeometry(1.2, .08, .8), deskM)); top.position.y = .9; g.add(top); [[-.5, -.32], [.5, -.32], [-.5, .32], [.5, .32]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .9, .06), legM); l.position.set(a, .45, b); g.add(l); }); const ch = cast(new THREE.Mesh(new THREE.BoxGeometry(.6, .06, .6), deskM)); ch.position.set(0, .55, .75); g.add(ch); const back = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .05), deskM); back.position.set(0, .85, 1.05); g.add(back); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g); }
  [[-12, -5], [-9.5, -5.5], [-12.5, -2], [-10, -2.4], [-13, 1.2], [9.8, -6], [12.4, -5], [11, -2.2], [13.6, -1.4], [12.6, 1.6]].forEach(([x, z], i) => desk(x, z, (i % 3 - 1) * .15));
  const dust = floatPoints(X, 140, '#8fb4ff', .14);

  // 보스: 떠다니는 유령
  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  const body = new THREE.Group(); boss.add(body);
  const ghostM = new THREE.MeshStandardMaterial({ color: '#dfe8ff', emissive: '#4a6aff', emissiveIntensity: .45, transparent: true, opacity: .9, roughness: .4, side: THREE.DoubleSide });
  const head = cast(new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), ghostM)); head.position.y = 4.1; body.add(head);
  const skirtG = new THREE.CylinderGeometry(1.5, 1.95, 2.7, 32, 6, true); const pos = skirtG.attributes.position;
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < -1.2) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, y + Math.sin(a * 7) * .28); } }
  skirtG.computeVertexNormals();
  const skirt = cast(new THREE.Mesh(skirtG, ghostM)); skirt.position.y = 2.75; body.add(skirt);
  const holeM = new THREE.MeshBasicMaterial({ color: '#070912', transparent: true });
  [-.52, .52].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 10), holeM); e.position.set(x, 4.3, 1.3); e.scale.set(1, 1.45, .35); body.add(e); const p = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), glowBasic('#7fd0ff', 3)); p.position.set(x, 4.25, 1.43); body.add(p); });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 10), holeM); mouth.position.set(0, 3.55, 1.4); mouth.scale.set(1, 1.3, .3); body.add(mouth);
  const arms = [];
  [-1, 1].forEach(s => makeArm(X, body, arms, s, [1.45, 3.5, .2], ghostM, ghostM, new THREE.CylinderGeometry(.16, .42, 2.3, 12), new THREE.SphereGeometry(.42, 14, 10)));
  const book = new THREE.Mesh(new THREE.BoxGeometry(.95, .12, .7), [0, 0, 1, 0, 0, 0].map(k => new THREE.MeshStandardMaterial({ color: k ? '#e94a4a' : '#f4efe3', emissive: k ? '#601010' : '#000' })));
  book.position.set(-1.9, 2.4, 1); body.add(book);
  const glowL = new THREE.PointLight('#7fa8ff', 10, 9, 1.6); glowL.position.set(0, 3.6, 1.6); body.add(glowL);
  const aura = addAura(boss, '#6a8aff');
  let vanishK = 0, layer = 0;
  return {
    name: () => '야자의 유령', boss, arms, hitColor: '#bcd4ff',
    onLayer(l) { layer = l; ghostM.emissive.set(l === 2 ? '#a02a8a' : '#5a5aff'); glowL.color.set(l === 2 ? '#ff6ad8' : '#9a9aff'); X.hemi.intensity = l === 2 ? .22 : .32; return l === 2 ? '마지막 한 겹! 교실 불이 꺼졌다' : '한 겹 격파! 유령이 화났다'; },
    idle(now, B, dt) {
      const want = B.vanish > 0 ? 1 : 0; vanishK += (want - vanishK) * Math.min(1, dt * 6);
      if (!B.dead) { body.position.y = .35 + Math.sin(now * 1.5) * .25; body.rotation.y = Math.sin(now * .5) * .15; skirt.rotation.y = now * .4; book.rotation.y = now * 1.2; book.position.y = 2.4 + Math.sin(now * 2) * .15; }
      ghostM.opacity = .9 - vanishK * .78; holeM.opacity = 1 - vanishK * .8;
      ghostM.emissiveIntensity = B.flashT > 0 ? 1.5 : .45 + Math.sin(now * 2) * .1 + (layer === 2 ? .2 : 0);
      glowL.intensity = (10 + Math.sin(now * 7) * 2) * (1 - vanishK * .7);
      aura.material.opacity = (.22 + Math.sin(now * 3) * .06 + B.layer * .06) * (1 - vanishK * .7);
      dust.rotation.y = now * .02;
      if (Math.random() < .004) { X.hemi.intensity *= .4; setTimeout(() => { X.hemi.intensity = layer === 2 ? .22 : .38; }, 90); }   // 형광등 깜빡
    },
  };
}

/* ───────── 4. 본관 옥상 · 본관 → 게임 제작자 염서준 ───────── */
function mainHall(X) {
  const { scene, tex, cast } = X;
  lights(X, { sky: [['#04060a', 0], ['#0e161e', .5], ['#22303a', 1]], fog: ['#121a22', 14, 38], hemi: ['#8aa0b8', '#0a0c10', .45], sun: ['#cfd8e8', 1.2, [-7, 9, -5]], fill: ['#ffb070', .32] });
  floorOf(X, (g) => { g.fillStyle = '#4a4e52'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = `hsl(210, 5%, ${26 + Math.random() * 8}%)`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } g.fillStyle = 'rgba(160,190,220,.16)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 30 + Math.random() * 40, 10 + Math.random() * 12, 0, 0, 7); g.fill(); } }, [6, 3], { roughness: .35, metalness: .2 });
  // 난간 · 물탱크 · 안테나
  const railM = new THREE.MeshStandardMaterial({ color: '#6a7078', metalness: .7, roughness: .4 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(34, .08, .08), railM); rail.position.set(0, 1.2, -7.5); scene.add(rail);
  const rail2 = rail.clone(); rail2.position.y = .6; scene.add(rail2);
  for (let x = -16; x <= 16; x += 2) { const p = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .08), railM); p.position.set(x, .6, -7.5); scene.add(p); }
  const tank = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.4, 20), new THREE.MeshStandardMaterial({ color: '#8a96a0', metalness: .4 }))); tank.position.set(-10.5, 1.6, -4.5); scene.add(tank);
  [-11.4, -9.6].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(.12, .4, .12), railM); l.position.set(x, .2, -4.5); scene.add(l); });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, 5, 6), railM); ant.position.set(11.5, 2.5, -5); scene.add(ant);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), glowBasic('#ff3a2a', 3)); antTip.position.set(11.5, 5.05, -5); scene.add(antTip);
  [[-6, -6], [12, -1.5]].forEach(([x, z]) => { const ac = cast(new THREE.Mesh(new THREE.BoxGeometry(1.4, .9, 1), new THREE.MeshStandardMaterial({ color: '#9aa2aa' }))); ac.position.set(x, .45, z); scene.add(ac); });
  // 먼 도시 불빛
  const cityT = tex(512, 128, (g, w, h) => { g.fillStyle = '#0a0e14'; g.fillRect(0, 0, w, h); for (let x = 0; x < w;) { const bw = 14 + Math.random() * 30, bh = 30 + Math.random() * 90; g.fillStyle = '#141a24'; g.fillRect(x, h - bh, bw, bh); for (let i = 0; i < bw / 6; i++) for (let j = 0; j < bh / 8; j++) if (Math.random() < .35) { g.fillStyle = Math.random() < .8 ? '#ffd27a' : '#9ad0ff'; g.fillRect(x + 2 + i * 6, h - bh + 4 + j * 8, 3, 4); } x += bw + 2; } });
  const city = new THREE.Mesh(new THREE.PlaneGeometry(80, 14), new THREE.MeshBasicMaterial({ map: cityT, fog: false })); city.position.set(0, 4, -26); scene.add(city);
  // 비
  const RN = 500, rg = new THREE.BufferGeometry(), RP = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = (Math.random() - .5) * 30, y = Math.random() * 12, z = (Math.random() - .6) * 16; RP.set([x, y, z, x - .08, y - .5, z], i * 6); }
  rg.setAttribute('position', new THREE.BufferAttribute(RP, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#9ab8d8', transparent: true, opacity: .45 })); scene.add(rain);

  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  // ── 1·2겹: 본관 골렘
  const hall = new THREE.Group(); boss.add(hall);
  const wallM = new THREE.MeshStandardMaterial({ color: '#d8cdb8', roughness: .85, flatShading: true });
  const winT = tex(128, 128, (g, w, h) => { g.fillStyle = '#d8cdb8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = '#ffffff'; g.fillRect(i * 32 + 6, j * 40 + 8, 20, 26); g.fillStyle = '#2a2f3a'; g.fillRect(i * 32 + 15, j * 40 + 8, 2, 26); } });
  const glowM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: winT, emissive: '#ffb040', emissiveMap: winT, emissiveIntensity: .5 });
  const bodyB = cast(new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 2), [wallM, wallM, wallM, wallM, glowM, wallM])); bodyB.position.y = 2.5; hall.add(bodyB);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.1), new THREE.MeshStandardMaterial({ color: '#3a2a1a' })); door.position.set(0, 1.45, 1.01); hall.add(door);
  const roof = cast(new THREE.Mesh(new THREE.BoxGeometry(3.9, .25, 2.3), new THREE.MeshStandardMaterial({ color: '#5a6a5e' }))); roof.position.y = 4.2; hall.add(roof);
  const towerB = cast(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.7, 1.4), wallM)); towerB.position.y = 5.15; hall.add(towerB);
  const eyeM = glowBasic('#ff8a3a', 3);
  [-.38, .38].forEach(x => { const e = new THREE.Mesh(new THREE.BoxGeometry(.36, .2, .05), eyeM); e.position.set(x, 4.85, .72); e.rotation.z = x > 0 ? .3 : -.3; hall.add(e); });
  const clockT = tex(128, 128, (g) => { g.fillStyle = '#f6eed6'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#2a2420'; g.lineWidth = 6; g.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillStyle = '#2a2420'; g.fillRect(64 + Math.cos(a) * 46 - 3, 64 + Math.sin(a) * 46 - 3, 6, 6); } });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.5, 28), new THREE.MeshStandardMaterial({ map: clockT, emissive: '#ffffff', emissiveMap: clockT, emissiveIntensity: .45 })); clock.position.set(0, 5.5, .71); hall.add(clock);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.04, .38, .02), new THREE.MeshBasicMaterial({ color: '#2a2420' })); hand.geometry.translate(0, .17, 0); hand.position.set(0, 5.5, .73); hall.add(hand);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshStandardMaterial({ map: tex(128, 80, (g) => { g.fillStyle = '#2b4a3c'; g.fillRect(0, 0, 128, 80); g.font = '28px Jua, sans-serif'; g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.fillText('양일고', 64, 50); }), side: THREE.DoubleSide })); flag.position.set(.5, 6.6, 0); hall.add(flag);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.4, 6), railM); pole.position.set(0, 6.6, 0); hall.add(pole);
  const fistM = new THREE.MeshStandardMaterial({ color: '#b8ab92', emissive: '#ff8a3a', emissiveIntensity: .2, flatShading: true });
  const arms = [];
  [-1, 1].forEach(s => makeArm(X, hall, arms, s, [2.05, 3.5, .2], wallM, fistM, new THREE.BoxGeometry(.5, 2.4, .5), new THREE.BoxGeometry(.9, .9, .9)));
  const glowL = new THREE.PointLight('#ffb040', 6, 7, 1.6); glowL.position.set(0, 3.4, 2); boss.add(glowL);
  const aura = addAura(boss, '#ffb040');
  // ── 3겹: 염서준 (실제 사진 얼굴)
  const SC = document.createElement('canvas'); SC.width = 400; SC.height = 450; const sg = SC.getContext('2d');
  const sT = new THREE.CanvasTexture(SC); sT.colorSpace = THREE.SRGBColorSpace;
  const sMat = new THREE.SpriteMaterial({ map: sT, transparent: true, opacity: 0, depthWrite: false });
  const seo = new THREE.Sprite(sMat); seo.center.set(.5, 0); seo.scale.set(4.6, 4.6 * 450 / 400, 1); seo.position.set(0, 0, .6); seo.visible = false; boss.add(seo);
  (function compose() {
    try {
      const av = Object.assign({}, typeof lookOf === 'function' ? lookOf('seojun').av : {}, { hair: 'buzz', acc: 'none', skin: '#efc3a8' });
      const svg = avatarSVG(av, '', { expr: 'proud', pose: 'cheer', noHead: true }).replace('<svg ', '<svg width="400" height="400" ');
      const body = new Image(), face = new Image(); let n = 0;
      const done = () => { if (++n < 2) return; sg.clearRect(0, 0, 400, 450); sg.drawImage(body, 0, 50, 400, 400); sg.drawImage(face, 88, 31, 224, 339);
        sg.save(); sg.translate(262, 330); sg.fillStyle = '#2a2f36'; sg.fillRect(0, 0, 120, 72); sg.fillStyle = '#0f1720'; sg.fillRect(7, 7, 106, 56); sg.font = 'bold 12px monospace'; sg.fillStyle = '#5dff8a'; sg.fillText('balance.js', 14, 28); sg.fillStyle = '#ff8a5d'; sg.fillText('atk *= 0.7', 14, 48); sg.fillStyle = '#3a4049'; sg.fillRect(-10, 72, 140, 10); sg.restore();
        sT.needsUpdate = true; };
      body.onload = done; face.onload = done; body.onerror = done; face.onerror = done;
      body.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); face.src = '../seojun-face.png';
    } catch (e) {}
  })();
  const codeRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.35, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5dff8a').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); codeRing.position.set(0, 2.6, .2); boss.add(codeRing);
  let revealed = false, boltT = 3, layer = 0;
  return {
    name: () => revealed ? '게임 제작자 염서준' : '본관', boss, arms, hitColor: revealed ? '#9dffb0' : '#ffd27a',
    onLayer(l) {
      layer = l;
      if (l === 1) { fistM.emissiveIntensity = .6; eyeM.color.set(new THREE.Color('#ff3a2a').multiplyScalar(3)); return '한 겹 격파! 본관이 흔들린다'; }
      revealed = true; seo.visible = true; arms.length = 0; aura.material.color.set('#5dff8a'); glowL.color.set('#5dff8a');
      X.tween(.9, k => { hall.scale.setScalar(Math.max(.01, 1 - k)); hall.position.y = -k * 2; sMat.opacity = k; codeRing.material.opacity = k * .8; }, () => { hall.visible = false; });
      X.reveal && X.reveal();
      return '본관 속에서 누군가 나왔다…!';
    },
    idle(now, B, dt) {
      if (!B.dead) { boss.rotation.y = revealed ? 0 : Math.sin(now * .6) * .05; if (revealed) seo.position.y = .3 + Math.sin(now * 1.8) * .12; }
      hand.rotation.z = -now * 2.4;
      glowM.emissiveIntensity = B.flashT > 0 ? 1.6 : .5 + (layer >= 1 ? Math.sin(now * 5) * .2 : 0);
      wallM.emissive.set(B.flashT > 0 ? '#5a4020' : '#000000');
      if (revealed) { sMat.color.setRGB(1, B.flashT > 0 ? .7 : 1, B.flashT > 0 ? .7 : 1); codeRing.rotation.z = now * .8; codeRing.scale.setScalar(1 + Math.sin(now * 2) * .05); }
      aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
      const p = rg.attributes.position.array;
      for (let i = 0; i < RN; i++) { let y = p[i * 6 + 1] - dt * 16; if (y < 0) y += 12; p[i * 6 + 1] = y; p[i * 6 + 4] = y - .5; p[i * 6] = p[i * 6 + 3] + .08; }
      rg.attributes.position.needsUpdate = true;
      antTip.material.color.setScalar(Math.sin(now * 4) > 0 ? 3 : .4).multiply(new THREE.Color('#ff3a2a'));
      boltT -= dt; if (boltT <= 0) { boltT = (revealed ? 2.5 : 4) + Math.random() * 4; const h0 = X.hemi.intensity; X.hemi.intensity = 2.6; X.scene.background = X.boltSky; setTimeout(() => { X.hemi.intensity = h0; X.scene.background = X.sky; }, 110); }
    },
  };
}


/* ───────── 6. 양평역 · 폭주 기관차 ───────── */
function station(X) {
  const { scene, tex, cast } = X;
  lights(X, { sky: [['#2a2f5a', 0], ['#c0607a', .55], ['#ffb27a', 1]], fog: ['#b06a7a', 18, 42], hemi: ['#ffe0d0', '#4a3a40', .9], sun: ['#ffc59a', 1.6, [6, 10, 8]], fill: ['#8ab0ff', .5] });
  floorOf(X, (g) => { g.fillStyle = '#8a8580'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = `hsl(30, 6%, ${46 + Math.random() * 8}%)`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } g.fillStyle = '#ffd23f'; g.fillRect(0, 230, 512, 26); g.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 32; i++) g.fillRect(i * 16 + 4, 236, 8, 14); });
  // 철로 (뒤쪽)
  const railM = new THREE.MeshStandardMaterial({ color: '#4a4f5a', metalness: .6, roughness: .4 }), slpM = new THREE.MeshStandardMaterial({ color: '#5a4636' });
  [-4.4, -3.4].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(40, .12, .12), railM); r.position.set(0, .07, z); scene.add(r); });
  for (let x = -20; x < 20; x += 1.1) { const sl = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, 1.6), slpM); sl.position.set(x, .03, -3.9); scene.add(sl); }
  // 역 건물 + 이름판
  const winT = tex(256, 128, (g, w, h) => { g.fillStyle = '#4a5a7a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { g.fillStyle = Math.random() < .6 ? '#ffe2a0' : '#2a3450'; g.fillRect(i * 21 + 4, j * 40 + 10, 14, 24); } });
  const bld = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 3), [0, 0, 0, 0, 1, 0].map(k => new THREE.MeshStandardMaterial(k ? { map: winT, emissive: '#ffffff', emissiveMap: winT, emissiveIntensity: .5 } : { color: '#4a5a7a' })));
  bld.position.set(1, 3, -11); scene.add(bld);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(23, .5, 4), new THREE.MeshStandardMaterial({ color: '#2b4a3c' })); roof.position.set(1, 6.2, -10.8); scene.add(roof);
  const signT = tex(512, 128, (g, w, h) => { g.fillStyle = '#1d3f8a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#fff'; g.font = '72px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('양평역', w / 2, 92); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshBasicMaterial({ map: signT })); sign.position.set(1, 7.3, -9.4); scene.add(sign);
  [-7, 9].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 3.4, 8), railM); p.position.set(x, 1.7, -6); scene.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), glowBasic('#ffe2a0', 2.2)); l.position.set(x, 3.5, -6); scene.add(l); });

  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  const bodyM = new THREE.MeshStandardMaterial({ color: '#2f6fb8', roughness: .45, metalness: .2 }), darkM = new THREE.MeshStandardMaterial({ color: '#23262e', roughness: .6 }), trimM = new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: .5 });
  const body = cast(new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 3.4), bodyM)); body.position.y = 2.1; boss.add(body);
  const nose = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.8, 20, 1, false, 0, Math.PI), bodyM)); nose.rotation.z = Math.PI / 2; nose.position.set(0, 2.1, 1.7); boss.add(nose);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.86, .3, 3.46), trimM); stripe.position.y = 1.35; boss.add(stripe);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, .9, .1), new THREE.MeshStandardMaterial({ color: '#1a2440', emissive: '#203a70', emissiveIntensity: .6 })); glass.position.set(0, 2.9, 2.35); glass.rotation.x = -.5; boss.add(glass);
  const eyeM = glowBasic('#fff3b0', 3);
  [-.6, .6].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.26, 14, 10), eyeM); e.position.set(x, 1.85, 2.95); boss.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .12), darkM); brow.position.set(x, 2.25, 2.95); brow.rotation.z = x > 0 ? .4 : -.4; boss.add(brow); });
  const grill = cast(new THREE.Mesh(new THREE.ConeGeometry(1.2, 1, 4), darkM)); grill.rotation.set(Math.PI / 2, Math.PI / 4, 0); grill.position.set(0, .7, 2.9); grill.scale.set(1.2, 1, .5); boss.add(grill);
  const stack = cast(new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 1.2, 12), darkM)); stack.position.set(0, 3.9, -.6); boss.add(stack);
  [-1.45, 1.45].forEach(x => [-1, .3, 1.4].forEach(z => { const w = cast(new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .25, 16), darkM)); w.rotation.z = Math.PI / 2; w.position.set(x, .55, z); boss.add(w); }));
  const arms = [];
  [-1, 1].forEach(sd => makeArm(X, boss, arms, sd, [1.5, 2.6, .4], darkM, trimM, new THREE.CylinderGeometry(.2, .26, 2.4, 8), new THREE.CylinderGeometry(.55, .55, .35, 16)));
  const headL = new THREE.PointLight('#fff0b0', 8, 8, 1.6); headL.position.set(0, 1.9, 3.6); boss.add(headL);
  const aura = addAura(boss, '#ffd23f');
  const smokeT = tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(230,230,240,.9)'); gr.addColorStop(1, 'rgba(230,230,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const smoke = floatPoints(X, 40, '#ffffff', .9, [2, 4, 2], smokeT); smoke.position.set(BOSS_AT[0], 4.4, BOSS_AT[2] - .6);
  const COL = ['#2f6fb8', '#b8562f', '#8a1f2a'];
  return {
    name: () => '폭주 기관차', boss, arms, hitColor: '#ffe28a',
    onLayer(l) { bodyM.color.set(COL[l]); return l === 2 ? '마지막 한 겹! 기관차가 과열됐다' : '한 겹 격파!'; },
    idle(now, B) {
      if (!B.dead) { boss.position.y = Math.abs(Math.sin(now * 8)) * .04; boss.rotation.y = Math.sin(now * .7) * .05; }
      eyeM.color.set(B.flashT > 0 ? '#ffffff' : '#fff3b0').multiplyScalar(B.layer === 2 ? 3 + Math.sin(now * 10) : 3);
      smoke.position.y = 4.4 + (now * 1.2) % 1; smoke.material.opacity = .8 - ((now * 1.2) % 1) * .5;
      aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
    },
  };
}

/* ───────── 7. 물맑은시장 · 떡볶이 대왕 ───────── */
function market(X) {
  const { scene, tex, cast } = X;
  lights(X, { sky: [['#3a1d3a', 0], ['#a0402a', .55], ['#ffb05a', 1]], fog: ['#8a4a3a', 18, 42], hemi: ['#ffe0c0', '#5a3020', .95], sun: ['#ffb070', 1.5, [6, 10, 8]], fill: ['#ff8a5a', .5] });
  floorOf(X, (g) => { g.fillStyle = '#7a6a5a'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.fillStyle = `hsl(28, 14%, ${36 + Math.random() * 10}%)`; g.fillRect(i * 32 + 1 + (j % 2) * 16, j * 32 + 1, 30, 30); } });
  // 가게들 + 줄무늬 차양
  const awn = ['#e5484d', '#2f8f6b', '#5b8def', '#ff9a3c', '#c86bff'];
  for (let i = 0; i < 6; i++) {
    const x = -12 + i * 4.6, g = new THREE.Group(); g.position.set(x, 0, -9);
    const stall = new THREE.Mesh(new THREE.BoxGeometry(4, 3.2, 2.4), new THREE.MeshStandardMaterial({ color: '#efe2c8' })); stall.position.y = 1.6; g.add(stall);
    const awT = tex(64, 32, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : awn[i % awn.length]; c.fillRect(k * 8, 0, 8, h); } });
    const a = new THREE.Mesh(new THREE.BoxGeometry(4.3, .15, 1.6), new THREE.MeshStandardMaterial({ map: awT })); a.position.set(0, 3.1, 1.6); a.rotation.x = .35; g.add(a);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, .9, .7), new THREE.MeshStandardMaterial({ color: '#a5774b' })); counter.position.set(0, .45, 1.4); g.add(counter);
    scene.add(g);
  }
  const signT = tex(512, 128, (g, w, h) => { g.fillStyle = '#2b4a3c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#ffd23f'; g.font = '64px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('물맑은시장', w / 2, 88); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: signT })); sign.position.set(0, 5.6, -8.4); scene.add(sign);
  floatPoints(X, 26, '#ff6a4a', .7, [24, 2, 4]).position.set(-2, 4.2, -7);   // 줄 등불

  const boss = new THREE.Group(); boss.position.set(...BOSS_AT); scene.add(boss);
  const potM = new THREE.MeshStandardMaterial({ color: '#3a3a40', metalness: .55, roughness: .4 }), sauceM = new THREE.MeshStandardMaterial({ color: '#e0321e', emissive: '#a01a0a', emissiveIntensity: .5, roughness: .3 });
  const tteokM = new THREE.MeshStandardMaterial({ color: '#fff4e0', roughness: .6 }), fishM = new THREE.MeshStandardMaterial({ color: '#e8b070', roughness: .7 });
  const pot = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.6, 2.4, 24), potM)); pot.position.y = 1.4; boss.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.9, .14, 8, 28), potM); rim.rotation.x = Math.PI / 2; rim.position.y = 2.6; boss.add(rim);
  const sauce = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .12, 24), sauceM); sauce.position.y = 2.55; boss.add(sauce);
  [[-.7, .2, .9], [.5, -.2, .1], [.1, .6, -.6], [-.2, -.5, .3], [.9, .3, .6]].forEach(([x, z, r]) => { const t = cast(new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1.5, 10), tteokM)); t.position.set(x, 3.1, z); t.rotation.set(r * .6, 0, r); boss.add(t); });
  [[.9, -.5], [-1, -.3]].forEach(([x, z]) => { const f = cast(new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .1), fishM)); f.position.set(x, 3, z); f.rotation.set(.3, x, .2); boss.add(f); });
  [-1.95, 1.95].forEach(x => { const h = new THREE.Mesh(new THREE.TorusGeometry(.32, .08, 6, 14), potM); h.position.set(x, 2.1, 0); h.rotation.y = Math.PI / 2; boss.add(h); });
  const eyeM = glowBasic('#fff0c0', 2.8);
  [-.55, .55].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), eyeM); e.position.set(x, 1.7, 1.66); e.scale.set(1.3, .8, .5); boss.add(e); const brow = new THREE.Mesh(new THREE.BoxGeometry(.55, .12, .1), sauceM); brow.position.set(x, 2.05, 1.7); brow.rotation.z = x > 0 ? .5 : -.5; boss.add(brow); });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(1, .18, .1), glowBasic('#ff5a2a', 2.2)); mouth.position.set(0, 1.15, 1.66); boss.add(mouth);
  const arms = [];
  [-1, 1].forEach(sd => makeArm(X, boss, arms, sd, [1.7, 2.2, .3], tteokM, fishM, new THREE.CylinderGeometry(.24, .24, 2.4, 10), new THREE.BoxGeometry(1, .8, .25)));
  const glow = new THREE.PointLight('#ff6a3a', 7, 7, 1.6); glow.position.set(0, 3.4, .5); boss.add(glow);
  const aura = addAura(boss, '#ff4a2a');
  const steamT = tex(32, 32, (g) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  const steam = floatPoints(X, 30, '#ffffff', .8, [3, 3, 3], steamT); steam.position.set(BOSS_AT[0] - 1, 3.4, BOSS_AT[2] - 1.5);
  const HOT = ['#e0321e', '#c01a10', '#8a0a2a'];
  return {
    name: () => '떡볶이 대왕', boss, arms, hitColor: '#ffb07a',
    onLayer(l) { sauceM.color.set(HOT[l]); sauceM.emissiveIntensity = .5 + l * .3; return l === 2 ? '마지막 한 겹! 국물이 끓어 넘친다' : '한 겹 격파!'; },
    idle(now, B) {
      if (!B.dead) { boss.rotation.y = Math.sin(now * .8) * .06; boss.scale.set(1 + Math.sin(now * 2.2) * .02, 1 - Math.sin(now * 2.2) * .02, 1); }
      sauce.position.y = 2.55 + Math.sin(now * 5) * .03; glow.intensity = 6 + Math.sin(now * 7) * 1.5 + B.layer * 2;
      steam.position.y = 3.4 + (now * .8) % 1.2; steam.material.opacity = .7 - ((now * .8) % 1.2) * .4;
      potM.emissive.set(B.flashT > 0 ? '#5a1a10' : '#000000');
      aura.material.opacity = .22 + Math.sin(now * 3) * .06 + B.layer * .06;
    },
  };
}

export function buildArena(ch, X) {
  const a = ([null, ginkgo, led, ghost, mainHall, ginkgo, station, market][ch] || ginkgo)(X);
  if (ch === 4) { X.sky = X.scene.background; X.boltSky = grad(X, [['#3a4a6a', 0], ['#8a9ac0', .6], ['#4a5a7a', 1]]); }
  return a;
}
