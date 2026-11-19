// 3D 꼬마 친구: 원래 게임의 생김새 정보(머리 모양 · 색 · 안경 · 피부 · 체형 · 표정)와 동아리 옷으로 만든다.
// 툰 셰이딩 + 잉크 외곽선(뒷면 껍질)으로 UI의 스티커 느낌과 맞춘다.
import * as THREE from 'three';

const INK = '#231c17';
const UNIFORM = '#2a3550', PANTS = '#3a3f4a', SHOE = '#2a2420', SHIRT = '#f4f6fa', TIE = '#b8323a';
let gradMap = null;
function toonGrad() {
  if (gradMap) return gradMap;
  const d = new Uint8Array([90, 170, 255]); gradMap = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true; return gradMap;
}
const MAT = {};
const toon = (c, extra = {}) => { const k = c + JSON.stringify(extra); return MAT[k] || (MAT[k] = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad() }, extra))); };
const outlineM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
// 메시 + 외곽선 껍질
function part(geo, mat, line = .045) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m);
  if (line) { const o = new THREE.Mesh(geo, outlineM); o.scale.setScalar(1 + line); g.add(o); }
  return g;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };

/* ───────── 얼굴: 머리 구의 앞쪽(u = 0.25)에 그린다 ───────── */
function faceTex(av, expr = 'smile') {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = av.skin || '#f6dcc6'; g.fillRect(0, 0, W, H);
  const cx = W * .25, ey = H * .56, dx = 62;
  g.lineCap = 'round'; g.lineJoin = 'round';
  // 볼터치
  g.fillStyle = 'rgba(255,120,120,.28)'; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(cx + s * 92, ey + 46, 30, 16, 0, 0, 7); g.fill(); });
  // 눈
  const eyes = av.eyes, face = av.face || 'smile';
  [-1, 1].forEach(s => {
    const x = cx + s * dx;
    if ((face === 'wink' && s > 0) || face === 'sleepy' || expr === 'happy') { g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.arc(x, ey + 8, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
    const rx = eyes === 'small' ? 15 : eyes === 'sharp' ? 21 : 22, ry = eyes === 'small' ? 19 : eyes === 'sharp' ? 22 : 30;
    g.fillStyle = INK; g.beginPath(); g.ellipse(x, ey, rx, ry, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * .3, ey - ry * .38, rx * .38, ry * .3, 0, 0, 7); g.fill(); g.beginPath(); g.arc(x + rx * .35, ey + ry * .35, rx * .16, 0, 7); g.fill();
    if (eyes === 'sharp') { g.fillStyle = av.skin || '#f6dcc6'; g.beginPath(); g.moveTo(x - 30, ey - 34); g.lineTo(x + 30, ey - 34); g.lineTo(x + s * 30, ey - 12); g.closePath(); g.fill(); }
    if (av.lash) { g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(x + s * rx * .7, ey - ry * .7); g.lineTo(x + s * (rx + 12), ey - ry - 6); g.stroke(); }
  });
  // 눈썹
  g.strokeStyle = shade(av.hairColor || '#1e1b1a', .05); g.lineWidth = av.brows === 'bold' ? 16 : 8;
  [-1, 1].forEach(s => { const x = cx + s * dx, up = face === 'proud' || av.brows === 'bold' ? s * 8 : 0; g.beginPath(); g.moveTo(x - 22, ey - 54 - up); g.lineTo(x + 22, ey - 54 + up); g.stroke(); });
  // 입
  g.strokeStyle = INK; g.lineWidth = 8; g.fillStyle = '#c4434d';
  if (face === 'smile' || expr === 'happy') { g.beginPath(); g.moveTo(cx - 22, ey + 52); g.quadraticCurveTo(cx, ey + 82, cx + 22, ey + 52); g.closePath(); g.fill(); g.stroke(); }
  else if (face === 'proud') { g.beginPath(); g.moveTo(cx - 20, ey + 58); g.quadraticCurveTo(cx + 6, ey + 70, cx + 24, ey + 52); g.stroke(); }
  else if (face === 'sleepy') { g.beginPath(); g.ellipse(cx, ey + 60, 9, 11, 0, 0, 7); g.stroke(); }
  else { g.beginPath(); g.moveTo(cx - 16, ey + 60); g.quadraticCurveTo(cx, ey + 68, cx + 16, ey + 60); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ───────── 머리카락 ───────── */
const HEAD_R = .62;
const capGeo = (r, phiS, phiL, thS, thL) => new THREE.SphereGeometry(r, 32, 18, phiS, phiL, thS, thL);
// SphereGeometry의 phi: 0 → -x, π/2 → +z(얼굴). 얼굴 쪽을 비우려면 앞쪽 각도를 뺀다.
const FRONT = Math.PI / 2;
function hair(av, head) {
  const hc = av.hairColor || '#1e1b1a', m = toon(hc), style = av.hair || 'short', R = HEAD_R * 1.07, add = (geo, line = .03) => { const p = part(geo, m, line); head.add(p); return p; };
  const back = (thEnd) => add(capGeo(R, FRONT + .95, Math.PI * 2 - 1.9, 0, thEnd));       // 뒤·옆 (얼굴 앞 비움)
  const top = (thEnd = .42) => add(capGeo(R, 0, Math.PI * 2, 0, Math.PI * thEnd));
  // 앞머리 끝: 작은 뭉치를 이어 붙여 들쭉날쭉하게
  const fringe = (th, skew) => { for (let i = -3; i <= 3; i++) { const ph = FRONT + i * .27 + skew * .2, t = Math.PI * (th + (i % 2 ? .03 : 0) + Math.abs(i) * -.006), tuft = part(new THREE.SphereGeometry(.15, 12, 8), m, .05); tuft.scale.set(1, 1.35, .55); tuft.position.set(-Math.cos(ph) * Math.sin(t) * R * .99, Math.cos(t) * R * .99, Math.sin(ph) * Math.sin(t) * R * .99); tuft.lookAt(tuft.position.clone().multiplyScalar(2)); tuft.rotateZ(i * .08); head.add(tuft); } };
  const bang = (thEnd, w = 1.9) => add(capGeo(R * 1.005, FRONT - w / 2, w, Math.PI * .12, Math.PI * thEnd));
  if (style === 'buzz') { const p = add(capGeo(HEAD_R * 1.015, 0, Math.PI * 2, 0, Math.PI * .44), 0); p.children[0].material = toon(hc, { transparent: true, opacity: .75 }); return; }
  if (style === 'curly') {
    top(.38);
    for (let i = 0; i < 26; i++) { const th = Math.PI * (.05 + Math.random() * .38), ph = Math.random() * Math.PI * 2; if (Math.abs(((ph - FRONT + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < .9 && th > Math.PI * .3) continue; const s = part(new THREE.SphereGeometry(.17 + Math.random() * .06, 10, 8), m, .06); s.position.setFromSphericalCoords(R * 1.02, th, ph + Math.PI / 2); s.position.set(-Math.cos(ph) * Math.sin(th) * R, Math.cos(th) * R, Math.sin(ph) * Math.sin(th) * R); head.add(s); }
    back(Math.PI * .64); return;
  }
  top(); bang(style === 'twoblock' ? .3 : style === 'side' ? .34 : style === 'center' ? .3 : .36, style === 'center' ? 1.5 : 1.9);
  if (style !== 'center') fringe(style === 'twoblock' ? .27 : .33, style === 'side' ? .5 : 0);
  if (style === 'bob') back(Math.PI * .8);
  else if (style === 'long') { back(Math.PI * .8); const tail = part(new THREE.CapsuleGeometry(.5, .5, 6, 16), m, .03); tail.scale.set(1.12, 1, .5); tail.position.set(0, -.55, -.28); head.add(tail); }
  else if (style === 'ponytail') { back(Math.PI * .66); const pt = part(new THREE.CapsuleGeometry(.16, .55, 6, 10), m, .06); pt.position.set(0, -.15, -.72); pt.rotation.x = .5; head.add(pt); const tie = part(new THREE.SphereGeometry(.1, 8, 6), toon('#e5484d'), .08); tie.position.set(0, .2, -.66); head.add(tie); }
  else if (style === 'twoblock') back(Math.PI * .62);
  else back(Math.PI * .68);
  if (style === 'side') { const sw = part(capGeo(R * 1.01, FRONT - 1.2, 1.1, Math.PI * .1, Math.PI * .3), m, .03); head.add(sw); }
}

/* ───────── 몸 ───────── */
export function makeChibi(id, opts = {}) {
  const look = (typeof lookOf === 'function' ? lookOf(id) : { av: {} }).av || {};
  const kit = typeof kitOf === 'function' ? kitOf(id) : {};
  const top = kit.top && typeof TOP_COLOR !== 'undefined' ? TOP_COLOR[kit.top] : UNIFORM;
  const skin = look.skin || '#f6dcc6', skinM = toon(skin);
  const bw = look.build === 'chubby' ? 1.25 : look.build === 'slim' ? .88 : look.build === 'muscle' ? 1.15 : 1;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  // 다리 · 신발
  const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .15 * bw, .55, 0); const l = part(new THREE.CapsuleGeometry(.12, .3, 4, 10), toon(PANTS)); l.position.y = -.25; g.add(l); const sh = part(new THREE.SphereGeometry(.15, 12, 8), toon(SHOE)); sh.scale.set(1, .6, 1.4); sh.position.set(0, -.5, .05); g.add(sh); body.add(g); return g; });
  // 몸통: 셔츠 위에 겉옷
  const torso = part(new THREE.CapsuleGeometry(.3, .32, 6, 16), toon(top)); torso.scale.set(bw, 1, .82 * Math.max(1, bw * .9)); torso.position.y = .92; body.add(torso);
  const shirt = part(new THREE.CylinderGeometry(.01, .16, .3, 3, 1, false, -Math.PI / 6 - Math.PI / 2, Math.PI / 3), toon(kit.top === 'labcoat' || kit.top === 'medic' ? '#3b4a66' : SHIRT), 0); shirt.position.set(0, 1.07, .25 * Math.max(1, bw * .9)); shirt.rotation.x = Math.PI; body.add(shirt);
  if (!kit.top) { const tie = part(new THREE.BoxGeometry(.07, .22, .02), toon(TIE), 0); tie.position.set(0, 1, .27 * Math.max(1, bw * .9)); body.add(tie); }
  if (kit.top === 'work') { const band = part(new THREE.CylinderGeometry(.31 * bw, .31 * bw, .05, 20), toon('#f5f0c8'), 0); band.position.y = .86; band.scale.z = .84; body.add(band); }
  // 팔
  const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * (.32 * bw + .06), 1.12, 0); const a = part(new THREE.CapsuleGeometry(.09, .3, 4, 10), toon(top)); a.position.y = -.2; g.add(a); const hand = part(new THREE.SphereGeometry(.1, 10, 8), skinM); hand.position.y = -.44; g.add(hand); g.rotation.z = s * .18; body.add(g); return g; });
  // 머리
  const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
  const faceM = new THREE.MeshToonMaterial({ map: faceTex(look, opts.expr), gradientMap: toonGrad() });
  const skull = part(new THREE.SphereGeometry(HEAD_R, 40, 28), faceM, .035); skull.scale.set(1.04, .96, 1); head.add(skull);
  [-1, 1].forEach(s => { const ear = part(new THREE.SphereGeometry(.11, 10, 8), skinM, .08); ear.scale.set(.6, 1, .8); ear.position.set(s * HEAD_R * 1.02, -.04, 0); head.add(ear); });
  hair(look, head);
  if (look.acc === 'glasses') {
    const gm = toon('#2a2420');
    [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.TorusGeometry(.13, .022, 8, 24), gm); r.position.set(s * .2, -.03, HEAD_R * .93); r.rotation.y = s * .22; head.add(r); });
    const br = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .14, 6), gm); br.rotation.z = Math.PI / 2; br.position.set(0, -.01, HEAD_R * .98); head.add(br);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .25, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .01; root.add(shadow);
  const scale = opts.scale || 1; root.scale.setScalar(scale);
  // 움직임: idle · walk · cast · hit
  const st = { t: Math.random() * 6, mode: 'idle' };
  root.userData.chibi = {
    head, arms, legs, body,
    set(mode) { st.mode = mode; },
    update(dt) {
      st.t += dt; const t = st.t;
      if (st.mode === 'walk') { const w = Math.sin(t * 10); legs[0].rotation.x = w * .6; legs[1].rotation.x = -w * .6; arms[0].rotation.x = -w * .5; arms[1].rotation.x = w * .5; body.position.y = Math.abs(Math.sin(t * 10)) * .06; head.rotation.z = 0; }
      else if (st.mode === 'cast') { legs.forEach(l => l.rotation.x = 0); arms[0].rotation.set(0, 0, -2.6); arms[1].rotation.set(0, 0, 2.6); body.position.y = .08 + Math.sin(t * 8) * .03; }
      else { legs.forEach(l => l.rotation.x = 0); arms[0].rotation.set(Math.sin(t * 2) * .05, 0, -.18); arms[1].rotation.set(-Math.sin(t * 2) * .05, 0, .18); body.position.y = Math.sin(t * 2.4) * .025; head.rotation.z = Math.sin(t * 1.2) * .04; }
    },
  };
  return root;
}
