// 3D 친구를 사진처럼 찍어 그림(dataURL)으로 쓴다: 스킬 카드 · 컷인 · 팀 편성 카드.
// 프로필에서는 손가락으로 돌려 볼 수 있는 3D 보기도 띄운다.
import * as THREE from 'three';
import { makeChibi } from './chibi3d.js';

function lights(scene) {
  scene.add(new THREE.HemisphereLight('#ffffff', '#9aa6b8', 1.25));
  const key = new THREE.DirectionalLight('#ffffff', 1.9); key.position.set(2.5, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffe8c8', .7); rim.position.set(-4, 3, -3); scene.add(rim);
}
let R = null, S = null; const cam = new THREE.PerspectiveCamera(24, 1, .1, 60);
function setup() {
  if (R) return;
  R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
  S = new THREE.Scene(); lights(S);
}
function dispose(o) { o.traverse(m => { if (m.isMesh) { m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); } }); }
function posed(id, pose, face) {
  const k = makeChibi(id, { noShadow: true, castShadow: false }), c = k.userData.chibi;
  if (pose === 'cast') c.play('cast', 99); else c.set(pose);
  for (let i = 0; i < 45; i++) c.update(1 / 30);
  c.face(face, 99); c.update(1 / 30);
  return k;
}
// kind: 'bust'(머리 · 어깨) | 'full'(전신)
export function shot(id, { kind = 'bust', w = 256, h = 256, pose = 'idle', face = 'normal', turn = .35 } = {}) {
  setup();
  const k = posed(id, pose, face); k.rotation.y = turn; S.add(k); k.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(k), size = box.getSize(new THREE.Vector3()), top = box.max.y;
  cam.aspect = w / h;
  const fovV = cam.fov * Math.PI / 180;
  if (kind === 'bust') {
    const span = 1.8, cy = top - span / 2 + .02;
    cam.position.set(0, cy + .12, span / 2 / Math.tan(fovV / 2) * 1.02); cam.lookAt(0, cy, 0);
  } else {
    const span = Math.max(size.y, size.x / cam.aspect) * 1.06, cy = (box.min.y + box.max.y) / 2;
    cam.position.set(0, cy + .25, span / 2 / Math.tan(fovV / 2)); cam.lookAt(0, cy, 0);
  }
  cam.updateProjectionMatrix(); R.setSize(w, h, false); R.render(S, cam);
  const url = R.domElement.toDataURL('image/png');
  S.remove(k); dispose(k);
  return url;
}
// 여러 장을 조금씩 나눠 찍어 화면이 멈추지 않게
export function shootAll(jobs, each, done) {
  let i = 0;
  const next = () => {
    const t0 = performance.now();
    while (i < jobs.length && performance.now() - t0 < 40) { const j = jobs[i++]; try { each(j, shot(j.id, j)); } catch (e) { console.warn('shot', j.id, e); } }
    if (i < jobs.length) setTimeout(next, 0); else done && done();
  };
  setTimeout(next, 30);
}

/* ───────── 프로필 3D 보기 ───────── */
let V = null;
export function openViewer(id, host) {
  closeViewer();
  const canvas = document.createElement('canvas'); canvas.className = 'viewer3d'; canvas.setAttribute('aria-label', '3D로 돌려 보기'); host.appendChild(canvas);
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace; r.setClearColor(0, 0);
  const scene = new THREE.Scene(); lights(scene);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(.75, 32), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .18 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const k = makeChibi(id, { noShadow: true, castShadow: false }), c = k.userData.chibi; scene.add(k);
  const camV = new THREE.PerspectiveCamera(26, 1, .1, 50);
  const st = { yaw: .35, vel: 0, drag: null, idleT: 0, hop: 0 };
  const resize = () => { const w = host.clientWidth || 150, h = Math.round(w * 1.55); r.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; camV.aspect = w / h; camV.position.set(0, 1.45, 6.6); camV.lookAt(0, 1.15, 0); camV.updateProjectionMatrix(); };
  resize();
  canvas.addEventListener('pointerdown', e => { st.drag = e.clientX; st.idleT = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (st.drag == null) return; const d = e.clientX - st.drag; st.drag = e.clientX; st.yaw += d * .012; st.vel = d * .012; });
  const up = () => { if (st.drag != null) { st.drag = null; } }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('dblclick', () => { c.face('happy', 1.5); c.set('cheer'); setTimeout(() => c.set('idle'), 1200); });
  const clock = new THREE.Clock(); let alive = true;
  c.face('happy', 1.4); c.habitNow();
  r.setAnimationLoop(() => {
    if (!alive) return; const dt = Math.min(clock.getDelta(), .05);
    if (st.drag == null) { st.vel *= .92; st.yaw += st.vel; st.idleT += dt; if (st.idleT > 1.5) st.yaw += dt * .45; }
    k.rotation.y = st.yaw; c.update(dt); r.render(scene, camV);
  });
  V = { stop() { alive = false; r.setAnimationLoop(null); dispose(k); r.dispose(); r.forceContextLoss && r.forceContextLoss(); canvas.remove(); } };
}
export function closeViewer() { if (V) { V.stop(); V = null; } }
