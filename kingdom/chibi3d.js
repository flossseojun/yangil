// 3D 꼬마 친구: 원래 게임의 생김새 정보(머리 모양 · 색 · 안경 · 피부 · 체형 · 표정 · 눈)와 동아리 옷 · 소지품으로 만든다.
// 같은 정보끼리도 달라 보이도록 이름(id)에서 뽑은 고정 난수로 키 · 얼굴 폭 · 눈 간격 · 바보털 같은 작은 차이를 준다.
// 툰 셰이딩 + 잉크 외곽선(뒷면 껍질)으로 UI의 스티커 느낌과 맞춘다.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const INK = '#231c17';
const UNIFORM = '#2a3550', PANTS = '#3a3f4a', SHOE = '#2a2420', SHIRT = '#f4f6fa', TIE = '#b8323a', VEST = '#c9b48a';
let gradMap = null;
function toonGrad() {
  if (gradMap) return gradMap;
  const d = new Uint8Array([95, 175, 255]); gradMap = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true; return gradMap;
}
const MAT = {};
const toon = (c, extra = {}) => { const k = c + JSON.stringify(extra); return MAT[k] || (MAT[k] = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad() }, extra))); };
const CAST = { on: true };
const outlineM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
function part(geo, mat, line = .045) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); m.castShadow = CAST.on; g.add(m);
  if (line) { const o = new THREE.Mesh(geo, outlineM); o.scale.setScalar(1 + line); g.add(o); }
  return g;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
function rngOf(id) { let h = 2166136261; for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

/* ───────── 얼굴: 머리 구의 앞쪽(u = 0.25)에 그린다 ───────── */
function faceTex(av, v, expr) {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2; const g = c.getContext('2d'); g.scale(.5, .5);
  const skin = av.skin || '#f6dcc6'; g.fillStyle = skin; g.fillRect(0, 0, W, H);
  const cx = W * .25, ey = H * v.eyeY, dx = v.eyeGap, face = av.face || 'smile', eyes = av.eyes || 'normal';
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = `rgba(255,110,110,${v.blush})`; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(cx + s * (dx + 30), ey + 48, 30, 15, 0, 0, 7); g.fill(); });
  [-1, 1].forEach(s => {
    const x = cx + s * dx;
    g.strokeStyle = INK;
    if (expr === 'down') { g.lineWidth = 10; g.beginPath(); g.moveTo(x - 18, ey - 18); g.lineTo(x + 18, ey + 18); g.moveTo(x + 18, ey - 18); g.lineTo(x - 18, ey + 18); g.stroke(); return; }
    if (expr === 'hurt') { g.lineWidth = 10; g.beginPath(); g.moveTo(x - s * 20, ey - 18); g.lineTo(x + s * 14, ey); g.lineTo(x - s * 20, ey + 18); g.stroke(); return; }
    if (expr === 'sleep') { g.lineWidth = 9; g.beginPath(); g.moveTo(x - 22, ey + 6); g.quadraticCurveTo(x, ey + 16, x + 22, ey + 6); g.stroke(); return; }
    if ((face === 'wink' && s > 0) || expr === 'happy') { g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.arc(x, ey + 10, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
    if (face === 'sleepy') { g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 22, ey + 4); g.quadraticCurveTo(x, ey + 14, x + 22, ey + 4); g.stroke(); return; }
    const k = v.eyeSize;
    let rx = 22 * k, ry = 30 * k;
    if (eyes === 'round') { rx = 26 * k; ry = 27 * k; }
    if (eyes === 'small') { rx = 11 * k; ry = 14 * k; }
    if (eyes === 'sharp') { rx = 24 * k; ry = 26 * k; }
    if (eyes === 'droop') { rx = 23 * k; ry = 24 * k; }
    g.fillStyle = INK; g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
    if (eyes !== 'small') { g.fillStyle = v.iris; g.beginPath(); g.ellipse(x, ey + ry * .25, rx * .62, ry * .55, 0, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.ellipse(x, ey + ry * .2, rx * .32, ry * .32, 0, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * .32, ey - ry * .35, Math.max(4, rx * .36), Math.max(4, ry * .3), 0, 0, 7); g.fill();
    if (eyes === 'round') { g.beginPath(); g.arc(x + rx * .4, ey + ry * .3, rx * .16, 0, 7); g.fill(); }
    g.fillStyle = skin;
    if (eyes === 'sharp') { g.beginPath(); g.moveTo(x - 40, ey - 40); g.lineTo(x + 40, ey - 40); g.lineTo(x + 40, ey - ry * .55 - (s > 0 ? 0 : 12)); g.lineTo(x - 40, ey - ry * .55 - (s > 0 ? 12 : 0)); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.moveTo(x - rx - 4, ey - ry * .55 - (s > 0 ? -2 : 10)); g.lineTo(x + rx + 4, ey - ry * .55 - (s > 0 ? 10 : -2)); g.stroke(); }
    if (eyes === 'droop') { g.beginPath(); g.moveTo(x + s * rx * 1.6, ey - ry * 1.4); g.lineTo(x - s * rx * .2, ey - ry * 1.4); g.lineTo(x + s * rx * 1.6, ey - ry * .1); g.closePath(); g.fill(); }
    if (av.lash) { g.strokeStyle = INK; g.lineWidth = 6; [0, 1].forEach(j => { g.beginPath(); g.moveTo(x + s * rx * (.6 + j * .25), ey - ry * (.75 - j * .2)); g.lineTo(x + s * (rx + 10 + j * 4), ey - ry - 6 + j * 12); g.stroke(); }); }
  });
  // 눈썹
  g.strokeStyle = shade(av.hairColor || '#1e1b1a', .03); g.lineWidth = av.brows === 'bold' ? 18 : v.browW;
  [-1, 1].forEach(s => {
    const x = cx + s * dx, tilt = (expr === 'fight' ? 16 : expr === 'hurt' || expr === 'down' ? -12 : expr === 'happy' ? -2 : face === 'proud' || av.brows === 'bold' ? 9 : eyes === 'droop' ? -8 : v.browTilt) * s;
    g.beginPath(); g.moveTo(x - 22, ey - v.browY - tilt); g.quadraticCurveTo(x, ey - v.browY - 6 + v.browArch, x + 22, ey - v.browY + tilt); g.stroke();
  });
  // 입
  const my = ey + 58, mw = v.mouthW;
  g.strokeStyle = INK; g.lineWidth = 8; g.fillStyle = '#c4434d';
  if (expr === 'fight') { g.beginPath(); g.moveTo(cx - mw * .9, my - 2); g.lineTo(cx + mw * .9, my - 2); g.quadraticCurveTo(cx + mw * .8, my + 22, cx, my + 22); g.quadraticCurveTo(cx - mw * .8, my + 22, cx - mw * .9, my - 2); g.fill(); g.stroke(); }
  else if (expr === 'hurt') { g.beginPath(); g.moveTo(cx - mw, my + 6); for (let i = 1; i <= 4; i++) g.lineTo(cx - mw + i * mw / 2, my + (i % 2 ? -4 : 6)); g.stroke(); }
  else if (expr === 'down' || expr === 'sleep') { g.beginPath(); g.ellipse(cx, my + 6, 8, 10, 0, 0, 7); g.stroke(); }
  else if (face === 'smile' || expr === 'happy') { g.beginPath(); g.moveTo(cx - mw, my - 4); g.quadraticCurveTo(cx, my + 30, cx + mw, my - 4); g.closePath(); g.fill(); g.stroke(); if (v.tooth) { g.fillStyle = '#fff'; g.fillRect(cx - 8, my - 2, 16, 8); } }
  else if (face === 'proud') { g.beginPath(); g.moveTo(cx - mw, my + 4); g.quadraticCurveTo(cx + 6, my + 14, cx + mw + 4, my - 6); g.stroke(); }
  else if (face === 'wink') { g.beginPath(); g.moveTo(cx - mw, my); g.quadraticCurveTo(cx, my + 22, cx + mw, my); g.stroke(); g.fillStyle = '#ff8a9a'; g.beginPath(); g.ellipse(cx + 8, my + 12, 8, 9, 0, 0, 7); g.fill(); }
  else if (face === 'sleepy') { g.beginPath(); g.ellipse(cx, my + 4, 9, 11, 0, 0, 7); g.stroke(); }
  else { g.beginPath(); g.moveTo(cx - mw * .7, my + 4); g.lineTo(cx + mw * .7, my + 4); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ───────── 머리카락 ───────── */
const HEAD_R = .62, FRONT = Math.PI / 2;   // SphereGeometry phi: π/2 → +z(얼굴)
const capGeo = (r, phiS, phiL, thS, thL) => new THREE.SphereGeometry(r, 22, 12, phiS, phiL, thS, thL);
const onSphere = (r, th, ph) => new THREE.Vector3(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r);
function hair(av, head, v, skinM) {
  const hc = av.hairColor || '#1e1b1a', m = toon(hc), style = av.hair || 'short', R = HEAD_R * 1.07, sway = head.userData.sway = [];
  const add = (geo, line = .03) => { const p = part(geo, m, line); head.add(p); return p; };
  const back = thEnd => add(capGeo(R, FRONT + .95, Math.PI * 2 - 1.9, 0, thEnd));
  const top = (thEnd = .42, r = R) => add(capGeo(r, 0, Math.PI * 2, 0, Math.PI * thEnd));
  const tuft = (pos, sx, sy, sz, tilt = 0, r = .15) => { const t = part(new THREE.SphereGeometry(r, 8, 6), m, .05); t.scale.set(sx, sy, sz); t.position.copy(pos); t.lookAt(pos.clone().multiplyScalar(2)); t.rotateZ(tilt); head.add(t); return t; };
  const fringe = (th, n, spread, skew = 0, len = 1.35) => { for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : i / (n - 1) - .5, ph = FRONT + k * spread + skew; tuft(onSphere(R * .99, Math.PI * (th + (i % 2 ? .025 : 0)), ph), 1, len, .55, k * .5); } };
  const spikes = (n, h) => { for (let i = 0; i < n; i++) { const th = Math.PI * (.08 + v.r() * .22), ph = Math.PI * 2 * i / n + v.r() * .4, c = part(new THREE.ConeGeometry(.13, h, 6), m, .06), p = onSphere(R * .96, th, ph); c.position.copy(p); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize()); head.add(c); } };
  const ahoge = () => { const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, R * .9, .04), new THREE.Vector3(.05, R * 1.26, .1), new THREE.Vector3(.18, R * 1.22, .18)); head.add(part(new THREE.TubeGeometry(curve, 10, .03, 6), m, .25)); };

  if (style === 'buzz') { const p = add(capGeo(HEAD_R * 1.015, 0, Math.PI * 2, 0, Math.PI * .46), 0); p.children[0].material = toon(hc, { transparent: true, opacity: .8 }); return; }
  if (style === 'curly') {
    top(.38);
    for (let i = 0; i < 30; i++) { const th = Math.PI * (.04 + v.r() * .4), ph = v.r() * Math.PI * 2; const front = Math.abs(((ph - FRONT) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI) < .95; if (front && th > Math.PI * .28) continue; const s = part(new THREE.SphereGeometry(.16 + v.r() * .07, 8, 6), m, .06); s.position.copy(onSphere(R * (1 + v.vol * .5), th, ph)); head.add(s); }
    back(Math.PI * .64); return;
  }
  if (style === 'twoblock') {                       // 옆은 짧게(피부 보임), 위는 볼륨, 앞머리는 길게 한쪽으로
    const t = top(.34, R * (1.04 + v.vol)); t.scale.y = 1.08;
    back(Math.PI * .5);
    fringe(.31, 5, 1.6, v.side * .35, 1.6);
    const under = part(capGeo(HEAD_R * 1.012, 0, Math.PI * 2, Math.PI * .34, Math.PI * .14), toon(shade(hc, .25), { transparent: true, opacity: .5 }), 0); head.add(under);
  } else if (style === 'side') {                    // 가르마 + 한쪽으로 크게 넘긴 앞머리
    top(.42); back(Math.PI * .68);
    const sweep = part(capGeo(R * 1.02, FRONT - 1.25 * v.side - .2, 1.5, Math.PI * .08, Math.PI * .28), m, .03); head.add(sweep);
    fringe(.33, 4, 1.1, -v.side * .35, 1.5);
    const partLine = new THREE.Mesh(new THREE.BoxGeometry(.02, .02, .5), toon(shade(hc, .2))); partLine.position.copy(onSphere(R * 1.04, Math.PI * .14, FRONT + v.side * .9)); partLine.lookAt(0, R * 1.2, 0); head.add(partLine);
  } else if (style === 'center') {                  // 가운데 가르마, 커튼처럼 양옆으로
    top(.4); back(Math.PI * .7);
    [-1, 1].forEach(s => { const c = part(capGeo(R * 1.02, FRONT + s * .2 - (s < 0 ? .95 : 0), .95, Math.PI * .1, Math.PI * .3), m, .03); head.add(c); });
  } else if (style === 'bob') { top(); back(Math.PI * .8); fringe(.34, 7, 1.85, 0, 1.3); }
  else if (style === 'long') { top(); back(Math.PI * .82); fringe(.35, 7, 1.85, 0, 1.4); const tail = part(new THREE.CapsuleGeometry(.5, .55, 6, 16), m, .03); tail.scale.set(1.12, 1, .5); tail.position.set(0, -.6, -.3); head.add(tail); sway.push([tail, 0]); }
  else if (style === 'ponytail') { top(); back(Math.PI * .66); fringe(.33, 6, 1.7); const pt = part(new THREE.CapsuleGeometry(.17, .6, 6, 10), m, .06); pt.position.set(0, -.12, -.74); pt.rotation.x = .5; head.add(pt); sway.push([pt, .5]); const tie = part(new THREE.SphereGeometry(.1, 8, 6), toon('#e5484d'), .08); tie.position.set(0, .22, -.68); head.add(tie); }
  else {                                            // short: 단정 / 삐죽 두 가지
    top(.42, R * (1 + v.vol * .6)); back(Math.PI * .66);
    fringe(.33, v.spiky ? 6 : 7, 1.8, v.side * .15, v.spiky ? 1.1 : 1.35);
    if (v.spiky) spikes(9, .3 + v.vol);
  }
  // 머리카락 하이라이트 (윤기 띠)
  if (style !== 'curly' && style !== 'buzz') { const th = Math.PI * .26, rr = R * (style === 'twoblock' ? 1.09 + v.vol : style === 'short' ? 1.04 + v.vol * .6 : 1.04), geo = new THREE.TorusGeometry(rr * Math.sin(th), .024, 4, 24, Math.PI * .6); geo.rotateZ(Math.PI * .15); const hl = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: shade(hc, .1) })); hl.rotation.x = Math.PI / 2; hl.position.y = rr * Math.cos(th) * (style === 'twoblock' ? 1.08 : 1); head.add(hl); }
  if (v.ahoge && style !== 'buzz') ahoge();
}

/* ───────── 소지품 (오른손) ───────── */
function gearMesh(type) {
  const g = new THREE.Group(), P = (geo, c, line = .08) => { const p = part(geo, toon(c), line); g.add(p); return p; };
  switch (type) {
    case 'ball': case 'baseball': { const b = P(new THREE.SphereGeometry(type === 'ball' ? .17 : .12, 16, 12), '#ffffff'); if (type === 'ball') for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(.05, 5), toon('#222')); d.position.copy(onSphere(.172, 1 + (i % 2) * .9, i * 1.3)); d.lookAt(d.position.clone().multiplyScalar(2)); b.add(d); } else { const st = new THREE.Mesh(new THREE.TorusGeometry(.12, .01, 4, 20, Math.PI), toon('#e5484d')); st.rotation.y = Math.PI / 2; b.add(st); } break; }
    case 'basketball': { const b = P(new THREE.SphereGeometry(.19, 16, 12), '#f08a3c'); const l = new THREE.Mesh(new THREE.TorusGeometry(.192, .01, 4, 24), toon('#5a2a10')); b.add(l); const l2 = l.clone(); l2.rotation.y = Math.PI / 2; b.add(l2); break; }
    case 'shield': { const s = P(new THREE.CylinderGeometry(.3, .3, .06, 24), '#5b6b7d'); s.rotation.x = Math.PI / 2; const c1 = P(new THREE.BoxGeometry(.06, .4, .03), '#e2772d', 0); c1.position.z = .05; const c2 = P(new THREE.BoxGeometry(.4, .06, .03), '#e2772d', 0); c2.position.z = .05; g.position.set(-.1, 0, .12); g.rotation.y = -.5; break; }
    case 'mic': { P(new THREE.CylinderGeometry(.035, .04, .26, 8), '#2a2a30'); const h = P(new THREE.SphereGeometry(.08, 12, 8), '#b8c0c8'); h.position.y = .17; break; }
    case 'laptop': { const b = P(new THREE.BoxGeometry(.4, .03, .28), '#3a4049'); const s = P(new THREE.BoxGeometry(.4, .26, .02), '#3a4049'); s.position.set(0, .13, -.14); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.34, .2), new THREE.MeshBasicMaterial({ color: '#2a5a3a' })); sc.position.set(0, .13, -.128); g.add(sc); g.rotation.x = .2; break; }
    case 'medkit': { P(new THREE.BoxGeometry(.3, .22, .12), '#ffffff'); const c1 = new THREE.Mesh(new THREE.BoxGeometry(.05, .14, .01), toon('#e5484d')); c1.position.z = .065; g.add(c1); const c2 = c1.clone(); c2.rotation.z = Math.PI / 2; g.add(c2); break; }
    case 'flask': { const f = P(new THREE.ConeGeometry(.13, .2, 16), '#dff1f7'); f.position.y = -.02; const liq = new THREE.Mesh(new THREE.ConeGeometry(.1, .1, 16), toon('#6cd39a')); liq.position.y = -.07; g.add(liq); const n = P(new THREE.CylinderGeometry(.04, .04, .12, 8), '#dff1f7'); n.position.y = .13; break; }
    case 'book': case 'blueprint': case 'map': { if (type === 'book') P(new THREE.BoxGeometry(.24, .32, .07), '#e5484d'); else { const r = P(new THREE.CylinderGeometry(.05, .05, .38, 10), type === 'map' ? '#e9d9a8' : '#4a7fd6'); r.rotation.z = Math.PI / 2.4; } break; }
    case 'dumbbell': { const bar = P(new THREE.CylinderGeometry(.025, .025, .34, 6), '#9aa2aa'); bar.rotation.z = Math.PI / 2; [-1, 1].forEach(s => { const w = P(new THREE.CylinderGeometry(.08, .08, .07, 12), '#3a3f4a'); w.rotation.z = Math.PI / 2; w.position.x = s * .15; }); break; }
    case 'star': { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .06 : .14, a = Math.PI / 2 + i * Math.PI / 5; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const sm = P(new THREE.ExtrudeGeometry(st, { depth: .04, bevelEnabled: false }), '#ffd23f'); sm.position.y = .26; P(new THREE.CylinderGeometry(.015, .015, .34, 6), '#c98a4a', .2); break; }
    case 'shuriken': { const st = new THREE.Shape(); for (let i = 0; i < 8; i++) { const r = i % 2 ? .04 : .15, a = i * Math.PI / 4; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(r, 0); } P(new THREE.ExtrudeGeometry(st, { depth: .02, bevelEnabled: false }), '#9aa4ad'); break; }
    case 'sprout': { const pot = P(new THREE.CylinderGeometry(.11, .08, .14, 12), '#c96a3a'); pot.position.y = -.04; [-1, 1].forEach(s => { const l = P(new THREE.SphereGeometry(.07, 8, 6), '#6bc36b', .1); l.scale.set(1.4, .5, .8); l.position.set(s * .07, .12, 0); l.rotation.z = s * .4; }); break; }
    case 'wrench': { P(new THREE.BoxGeometry(.05, .34, .03), '#b8c0c8'); const h = P(new THREE.TorusGeometry(.06, .025, 6, 12, Math.PI * 1.5), '#b8c0c8'); h.position.y = .19; break; }
    case 'phone': case 'card': { P(new THREE.BoxGeometry(type === 'phone' ? .13 : .2, type === 'phone' ? .24 : .13, .02), type === 'phone' ? '#23262c' : '#ffd23f'); break; }
    case 'chess': { const b = P(new THREE.CylinderGeometry(.08, .1, .06, 12), '#f4f1e8'); b.position.y = -.08; const bd = P(new THREE.CylinderGeometry(.05, .07, .14, 12), '#f4f1e8'); const hd = P(new THREE.SphereGeometry(.06, 10, 8), '#f4f1e8'); hd.position.y = .1; break; }
    case 'egg': { const e = P(new THREE.SphereGeometry(.1, 12, 10), '#fffaf0'); e.scale.y = 1.3; break; }
    default: return null;
  }
  return g;
}


// 같이 움직이는 조각들을 재질별로 하나로 합친다 (그리기 횟수를 크게 줄여 휴대폰에서도 가볍게)
function mergeRigid(group, keep) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), buckets = new Map(), dead = [];
  const walk = o => { for (const c of o.children) { if (keep.has(c)) continue; if (c.isMesh) { const m = c.material, key = m.uuid; if (!buckets.has(key)) buckets.set(key, { m, geos: [], shadow: c.castShadow }); const g = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.applyMatrix4(inv.clone().multiply(c.matrixWorld)); buckets.get(key).geos.push(g); dead.push(c); } walk(c); } };
  walk(group);
  dead.forEach(c => c.parent.remove(c));
  const prune = o => { for (const c of [...o.children]) { if (keep.has(c)) continue; prune(c); if (!c.isMesh && !c.children.length && c.type === 'Group') o.remove(c); } }; prune(group);
  buckets.forEach(({ m, geos, shadow }) => { const g = mergeGeometries(geos, false); if (!g) return; const mesh = new THREE.Mesh(g, m); mesh.castShadow = shadow && m !== outlineM; group.add(mesh); });
}

/* ───────── 몸 ───────── */
export function makeChibi(id, opts = {}) {
  CAST.on = opts.castShadow !== false;
  const lookUp = opts.lookUp || 0;   // 카메라가 높을수록 고개를 살짝 든다
  const look = (typeof lookOf === 'function' ? lookOf(id) : { av: {} }).av || {};
  const kit = typeof kitOf === 'function' ? kitOf(id) : {};
  const r = rngOf(id), pick = a => a[Math.floor(r() * a.length)];
  const v = {
    r, eyeGap: 56 + r() * 16, eyeY: .47 + r() * .04, eyeSize: .9 + r() * .25, browY: 52 + r() * 10, browTilt: (r() - .5) * 8, browArch: (r() - .5) * 8, browW: 7 + r() * 4,
    mouthW: 16 + r() * 10, tooth: r() < .25, blush: .18 + r() * .2, iris: pick(['#5a3a2a', '#3a2a22', '#4a3628', '#2a2420']),
    vol: r() * .06, side: r() < .5 ? -1 : 1, spiky: r() < .35, ahoge: r() < .3,
    height: .93 + r() * .14, headW: 1 + r() * .1, layer: kit.top ? 'club' : pick(['jacket', 'jacket', 'vest', 'shirt']),
  };
  const top = kit.top && typeof TOP_COLOR !== 'undefined' ? TOP_COLOR[kit.top] : v.layer === 'jacket' ? UNIFORM : v.layer === 'vest' ? VEST : SHIRT;
  const sleeve = v.layer === 'vest' || v.layer === 'shirt' ? SHIRT : top;
  const skin = look.skin || '#f6dcc6', skinM = toon(skin);
  const bw = look.build === 'chubby' ? 1.28 : look.build === 'slim' ? .86 : look.build === 'muscle' ? 1.18 : 1;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const legLen = .3 * v.height;
  const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .15 * bw, .25 + legLen, 0); const l = part(new THREE.CapsuleGeometry(.12, legLen, 4, 10), toon(PANTS)); l.position.y = -legLen / 2 - .1; g.add(l); const sh = part(new THREE.SphereGeometry(.15, 12, 8), toon(kit.top === 'sport' ? '#f4f4f0' : SHOE)); sh.scale.set(1, .6, 1.4); sh.position.set(0, -legLen - .2, .05); g.add(sh); body.add(g); return g; });
  const hip = .25 + legLen, depth = .82 * Math.max(1, bw * .9);
  const torso = part(new THREE.CapsuleGeometry(.3, .32 * v.height, 4, 12), toon(top)); torso.scale.set(bw * (look.build === 'muscle' ? 1.08 : 1), 1, depth); torso.position.y = hip + .37 * v.height; body.add(torso);
  const chestZ = .27 * depth / .82, neckY = hip + .58 * v.height;
  if (v.layer === 'jacket' || v.layer === 'vest') { const vv = part(new THREE.CylinderGeometry(.01, .15, .28, 3, 1, false, -Math.PI / 6 - Math.PI / 2, Math.PI / 3), toon(SHIRT), 0); vv.position.set(0, neckY - .1, chestZ - .02); vv.rotation.x = Math.PI; body.add(vv); }
  if (!kit.top) { const tie = part(new THREE.BoxGeometry(.07, .22, .02), toon(TIE), 0); tie.position.set(0, neckY - .16, chestZ + .01); body.add(tie); }
  if (kit.top === 'work') { const band = part(new THREE.CylinderGeometry(.31 * bw, .31 * bw, .05, 20), toon('#f5f0c8'), 0); band.position.y = hip + .32; band.scale.z = depth; body.add(band); }
  if (kit.top === 'sport') { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = INK; g.strokeText('10', 32, 34); g.fillStyle = '#fff'; g.fillText('10', 32, 34); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const num = new THREE.Mesh(new THREE.PlaneGeometry(.24, .24), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); num.position.set(0, hip + .4, chestZ + .035); body.add(num); }
  if (kit.top === 'labcoat' || kit.top === 'medic') { const coat = part(new THREE.CylinderGeometry(.3 * bw, .36 * bw, .3, 20, 1, true), toon(top)); coat.position.y = hip + .02; coat.scale.z = depth; body.add(coat); }
  const shoulderY = neckY - .04;
  const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * (.32 * bw + .06), shoulderY, 0); const a = part(new THREE.CapsuleGeometry(.09, .3, 4, 10), toon(sleeve)); a.position.y = -.2; g.add(a); const hand = part(new THREE.SphereGeometry(.1, 10, 8), skinM); hand.position.y = -.44; g.add(hand); g.rotation.z = s * .18; body.add(g); return g; });
  const gear = gearMesh(kit.gear); if (gear) { gear.position.add(new THREE.Vector3(0, -.5, .12)); arms[1].add(gear); }
  const head = new THREE.Group(); head.position.y = neckY + .5; body.add(head);
  const faces = {}, faceOf = e => faces[e] || (faces[e] = faceTex(look, v, e === 'normal' ? undefined : e));
  const faceM = new THREE.MeshToonMaterial({ map: faceOf(opts.expr || 'normal'), gradientMap: toonGrad() });
  const skull = part(new THREE.SphereGeometry(HEAD_R, 28, 18), faceM, .035); skull.scale.set(v.headW, .96, 1); head.add(skull);
  [-1, 1].forEach(s => { const ear = part(new THREE.SphereGeometry(.11, 10, 8), skinM, .08); ear.scale.set(.6, 1, .8); ear.position.set(s * HEAD_R * v.headW * 1.0, -.04, 0); head.add(ear); });
  hair(look, head, v, skinM);
  if (look.acc === 'glasses') {
    const eyeH = HEAD_R * .96 * Math.cos(v.eyeY * Math.PI), gm = toon('#2a2420'), square = r() < .5, gx = (v.eyeGap / 1024) * Math.PI * 2 * HEAD_R * 1.05;
    [-1, 1].forEach(s => { const ring = new THREE.Mesh(square ? new THREE.TorusGeometry(.14, .022, 6, 4) : new THREE.TorusGeometry(.13, .022, 8, 24), gm); if (square) ring.rotation.z = Math.PI / 4; ring.position.set(s * gx, eyeH, HEAD_R * .93); ring.rotation.y = s * .25; head.add(ring); });
    const br = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, gx * .8, 6), gm); br.rotation.z = Math.PI / 2; br.position.set(0, eyeH + .02, HEAD_R * .99); head.add(br);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .01; if (!opts.noShadow) root.add(shadow);
  root.scale.setScalar(opts.scale || 1);
  // 움직이는 부분은 따로 두고 나머지를 합친다
  const sw = (head.userData.sway || []).map(x => x[0]);
  mergeRigid(head, new Set(sw)); sw.forEach(o => mergeRigid(o, new Set()));
  arms.forEach(a => mergeRigid(a, new Set(gear && a === arms[1] ? [gear] : []))); if (gear) mergeRigid(gear, new Set());
  legs.forEach(l => mergeRigid(l, new Set()));
  mergeRigid(body, new Set([head, ...arms, ...legs]));
  root.traverse(o => { if (o.isMesh) o.userData.chibiRoot = root; });

  // ── 움직임 ──
  // base: idle · walk · down(쓰러짐) · sleep · cheer   act: attack · throw · cast · hit (잠깐 덮어씀)
  // habit: 가만히 있을 때 가끔 하는 그 친구다운 버릇 (소지품 · 바보털로 정한다)
  const HABIT = { ball: 'juggle', basketball: 'juggle', baseball: 'juggle', laptop: 'type', mic: 'sing', shuriken: 'ninja', book: 'read', map: 'read', blueprint: 'read', phone: 'read', card: 'read', dumbbell: 'lift', star: 'wand', flask: 'shake', wrench: 'tap', shield: 'guard', medkit: 'look', egg: 'look', chess: 'look', sprout: 'look' };
  const myHabit = HABIT[kit.gear] || (v.ahoge ? 'scratch' : 'look');
  const gearHome = gear ? gear.position.clone() : null;
  const st = { t: r() * 6, base: 'idle', act: null, actT: 0, actDur: 0, habit: null, habitT: 0, nextHabit: 2 + r() * 6, expr: opts.expr || 'normal', exprT: 0 };
  const setFace = e => { if (st.curFace !== e) { st.curFace = e; faceM.map = faceOf(e); faceM.needsUpdate = true; } };
  const pose = { lean: 0, y: 0, rx: [0, 0], rz: [-.18, .18], ry: [0, 0], leg: [0, 0], hx: 0, hy: 0, hz: 0, lie: 0, crouch: 0, gearY: 0 };
  const ease = (a, b, k) => a + (b - a) * k;
  const api = root.userData.chibi = {
    id, head, arms, legs, body, habit: myHabit,
    set(mode) { if (['idle', 'walk', 'down', 'sleep', 'cheer'].includes(mode)) { st.base = mode; if (mode !== 'idle') st.habit = null; } else api.play(mode); },
    play(name, dur) { st.act = name; st.actT = 0; st.actDur = dur || { attack: .38, throw: .4, cast: 1.1, hit: .4 }[name] || .5; st.habit = null; if (name === 'cast') api.face('fight', 1.2); if (name === 'hit') api.face('hurt', .5); },
    face(e, dur = 0) { st.expr = e; st.exprT = dur; },
    habitNow(h) { st.act = null; st.base = 'idle'; st.habit = h || myHabit; st.habitT = 0; },
    get mode() { return st.act || st.base; },
    update(dt) {
      st.t += dt; const t = st.t, P = { lean: 0, y: 0, rx: [0, 0], rz: [-.18, .18], ry: [0, 0], leg: [0, 0], hx: 0, hy: 0, hz: Math.sin(t * 1.2 + v.side) * .05, lie: 0, crouch: 0, gearY: 0 };
      // 표정
      if (st.exprT > 0) { st.exprT -= dt; if (st.exprT <= 0) st.expr = 'normal'; }
      setFace(st.base === 'down' ? 'down' : st.base === 'sleep' ? 'sleep' : st.base === 'cheer' ? 'happy' : st.expr);
      // 기본 자세
      if (st.base === 'walk') { const w = Math.sin(t * 10); P.leg = [w * .6, -w * .6]; P.rx = [-w * .5, w * .5]; P.y = Math.abs(Math.sin(t * 10)) * .06; P.hz = 0; }
      else if (st.base === 'down') { P.lie = 1; P.rz = [-1.2, 1.2]; P.hz = 0; }
      else if (st.base === 'sleep') { P.y = -.02; P.hz = .35; P.lean = .12; P.rx = [-.2, -.2]; }
      else if (st.base === 'cheer') { const j = Math.abs(Math.sin(t * 6)); P.y = j * .35; P.rz = [-2.5 - Math.sin(t * 12) * .2, 2.5 + Math.sin(t * 12) * .2]; P.leg = [-j * .4, -j * .4]; }
      else { P.y = Math.sin(t * 2.4) * .025; P.rx = [Math.sin(t * 2) * .05, -.35 - Math.sin(t * 2) * .05];
        // 버릇
        if (!st.act) {
          if (st.habit) { st.habitT += dt; if (st.habitT > 2.4) { st.habit = null; st.nextHabit = 4 + r() * 6; } }
          else if ((st.nextHabit -= dt) <= 0) { st.habit = r() < .7 ? myHabit : (r() < .5 ? 'look' : 'stretch'); st.habitT = 0; }
        }
        const h = st.habit, k = st.habit ? Math.min(1, st.habitT * 4, (2.4 - st.habitT) * 4) : 0, f = t * 12;
        if (h && k > 0) {
          if (h === 'juggle') { P.rx[1] = ease(P.rx[1], -.9 + Math.sin(f) * .2, k); P.gearY = k * Math.abs(Math.sin(t * 6)) * .45; P.hx = -k * .2 * Math.abs(Math.sin(t * 6)); }
          else if (h === 'type') { P.rx = [ease(P.rx[0], -1.1 + Math.sin(f * 1.3) * .08, k), ease(P.rx[1], -1.1 + Math.cos(f * 1.4) * .08, k)]; P.rz = [ease(-.18, .25, k), ease(.18, -.25, k)]; P.hx = .3 * k; }
          else if (h === 'sing') { P.rx[1] = ease(P.rx[1], -2.0, k); P.rz[1] = ease(.18, -.55, k); P.rz[0] = ease(-.18, -1.4 - Math.sin(t * 4) * .2, k); P.hz = Math.sin(t * 5) * .15 * k; P.y += Math.abs(Math.sin(t * 5)) * .04 * k; }
          else if (h === 'ninja') { P.crouch = .16 * k; P.lean = .35 * k; P.rx = [ease(0, 1.3, k), ease(P.rx[1], 1.3, k)]; P.hx = -.25 * k; }
          else if (h === 'read') { P.rx[1] = ease(P.rx[1], -1.35, k); P.rz[1] = ease(.18, -.3, k); P.hx = .35 * k; P.hy = .2 * k; }
          else if (h === 'lift') { P.rx[1] = ease(P.rx[1], -.4 - (Math.sin(t * 5) * .5 + .5) * 1.7, k); }
          else if (h === 'wand') { P.rz[1] = ease(.18, 2.2 + Math.sin(t * 6) * .5, k); P.y += Math.abs(Math.sin(t * 3)) * .05 * k; }
          else if (h === 'shake') { P.rx[1] = ease(P.rx[1], -1.2, k); P.rz[1] = ease(.18, -.2 + Math.sin(f * 2) * .35, k); P.hx = .2 * k; }
          else if (h === 'tap') { P.rx[1] = ease(P.rx[1], -1.0 - Math.abs(Math.sin(t * 8)) * .8, k); P.hx = .25 * k; }
          else if (h === 'guard') { P.rx[1] = ease(P.rx[1], -1.4, k); P.rz[1] = ease(.18, -.6, k); P.crouch = .06 * k; P.lean = .12 * k; }
          else if (h === 'scratch') { P.rz[0] = ease(-.18, -2.7, k); P.rx[0] = ease(0, -.5 + Math.sin(f * 1.5) * .12, k); P.hz = -.15 * k; }
          else if (h === 'stretch') { P.rz = [ease(-.18, -2.9, k), ease(.18, 2.9, k)]; P.y += .05 * k; P.hx = -.15 * k; }
          else { P.hy = Math.sin(st.habitT * 2.6) * .7 * k; P.rx[1] = ease(P.rx[1], -.9, k * .6); }   // look: 고개 돌리며 둘러보기 / 소지품 보기
        }
      }
      // 잠깐 동작
      if (st.act) {
        st.actT += dt; const k = Math.min(1, st.actT / st.actDur), b = Math.sin(k * Math.PI);
        if (st.act === 'attack') { P.lean = b * .45; P.rx[1] = -2.6 + k * 3.1; P.rx[0] = b * .6; P.leg = [-b * .5, b * .4]; }
        else if (st.act === 'throw') { P.rx[1] = k < .4 ? ease(0, 1.0, k / .4) : ease(1.0, -2.3, (k - .4) / .6); P.lean = b * .2; P.hx = -b * .1; }
        else if (st.act === 'cast') { P.rz = [-1.9, 2.3]; P.rx = [-.9, -.5]; P.y = .1 + b * .25 + Math.sin(t * 14) * .02; P.hx = -.2; }
        else if (st.act === 'hit') { P.lean = -b * .4; P.hz = b * .25; P.y = 0; P.rz = [-.18 - b * .6, .18 + b * .6]; }
        if (k >= 1) st.act = null;
      }
      // 부드럽게 맞추기
      const q = Math.min(1, dt * 14);
      for (const key of ['lean', 'y', 'hx', 'hy', 'hz', 'lie', 'crouch', 'gearY']) pose[key] = ease(pose[key], P[key], key === 'lie' ? Math.min(1, dt * 6) : q);
      for (const key of ['rx', 'rz', 'leg']) for (let i = 0; i < 2; i++) pose[key][i] = ease(pose[key][i], P[key][i], q);
      body.rotation.x = pose.lean - pose.lie * Math.PI / 2; body.position.y = pose.y - pose.crouch + pose.lie * .3; body.position.z = -pose.lie * .2;
      arms.forEach((a, i) => { a.rotation.x = pose.rx[i]; a.rotation.z = pose.rz[i]; });
      legs.forEach((l, i) => { l.rotation.x = pose.leg[i] + pose.crouch * 2.2; });
      head.rotation.set(pose.hx - lookUp, pose.hy, pose.hz);
      if (gear) gear.position.y = gearHome.y + pose.gearY;
      (head.userData.sway || []).forEach(([o, base]) => { o.rotation.x = base + Math.sin(t * (st.base === 'walk' ? 10 : 2.4)) * (st.base === 'walk' ? .18 : .05) - pose.lean * .4; o.rotation.z = Math.sin(t * 5) * (st.base === 'walk' ? .12 : .02); });
    },
  };
  return root;
}
