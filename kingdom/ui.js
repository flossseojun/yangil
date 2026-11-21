// 양일 캠퍼스 손그림 아이콘 (이모지 대신). 굵은 잉크 선 + 납작한 색.
const INK = '#231c17';
const ICON_PATHS = {
  know: '<rect x="5" y="3" width="14" height="18" rx="2" fill="#5b8def"/><path d="M8.5 3v18"/><path d="M11.5 8h4.5M11.5 11.5h4.5" stroke="#fff"/>',
  snack: '<path d="M4 12.5a8 5.5 0 0 1 16 0V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" fill="#f2b25c"/><path d="M9 9.5l1 3M13 9l1 3M16.5 10l.6 2.5"/>',
  power: '<path d="M13.5 2.5L5 13.5h6l-1.5 8 9-11.5h-6z" fill="#ffd23f"/>',
  coin: '<circle cx="12" cy="12" r="8.5" fill="#ffc83a"/><circle cx="12" cy="12" r="5.5" fill="#ffe08a"/><path d="M10 9.5h4M12 9.5v5M10 14.5h4"/>',
  fight: '<path d="M4 4l9 9" stroke-width="3.2"/><path d="M4 4l9 9" stroke="#e6edf3" stroke-width="1.4"/><path d="M20 4l-9 9" stroke-width="3.2"/><path d="M20 4l-9 9" stroke="#e6edf3" stroke-width="1.4"/><path d="M9.5 15.5l5-5M14.5 15.5l-5-5" stroke="#e5484d" stroke-width="2.6"/><path d="M7 17l-2.5 2.5M17 17l2.5 2.5"/>',
  school: '<path d="M3 20.5V10l9-5 9 5v10.5z" fill="#f3ead6"/><path d="M3 10l9-5 9 5" fill="#2b4a3c"/><rect x="10" y="14" width="4" height="6.5" fill="#8a5a34"/><path d="M12 5V1.8l3 1.2-3 1.2"/><path d="M6.5 13h1.5M16 13h1.5"/>',
  rotate: '<path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M19.5 3.5v4.5H15"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-width="2.6"/>',
  minus: '<path d="M5 12h14" stroke-width="2.6"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="' + INK + '"/><rect x="14" y="5" width="4" height="14" rx="1" fill="' + INK + '"/>',
  play: '<path d="M7 4.5v15l12-7.5z" fill="' + INK + '"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#ffd23f"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#d8d0c0"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>',
  music: '<path d="M9 17V5l10-2v12" /><circle cx="6.5" cy="17.5" r="2.8" fill="#ffd23f"/><circle cx="16.5" cy="15" r="2.8" fill="#ffd23f"/>',
  musicOff: '<path d="M9 17V5l10-2v12" /><circle cx="6.5" cy="17.5" r="2.8" fill="#d8d0c0"/><circle cx="16.5" cy="15" r="2.8" fill="#d8d0c0"/><path d="M3 3l18 18" stroke-width="2.6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2" fill="#ffd23f"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z" fill="#ff6b8b"/>',
  heartOff: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z" fill="#fffaf0" stroke-dasharray="2.5 2.5"/>',
  star: '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="#ffd23f"/>',
  starOff: '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.1l-5.7 3.2 1.2-6.4-4.7-4.4 6.4-.8z" fill="#5a524a" stroke="#3a332c"/>',
  info: '<circle cx="12" cy="12" r="9" fill="#fffaf0"/><path d="M12 11v6" stroke-width="2.6"/><circle cx="12" cy="7.6" r=".6" fill="' + INK + '" stroke-width="1.6"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5" stroke-width="2.6"/>',
  next: '<path d="M9.5 5.5L16 12l-6.5 6.5" stroke-width="2.6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke-width="2.6"/>',
  // 건물
  store: '<path d="M4 10v10h16V10" fill="#ffe2b8"/><path d="M3 5h18l-1 5H4z" fill="#fff"/><path d="M7.5 5l-.8 5M12 5v5M16.5 5l.8 5" stroke="#e0573b" stroke-width="2.6"/><path d="M3 5h18l-1 5H4z"/><rect x="10" y="14" width="4" height="6" fill="#8a5a34"/>',
  lab: '<path d="M9.5 3h5M10.5 3v6l-5.5 9.5A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.5L13.5 9V3" fill="#dff1f7"/><path d="M7.4 15h9.2l2.4 3.5a1.6 1.6 0 0 1-1.4 2.5H6.4A1.6 1.6 0 0 1 5 18.5z" fill="#6cd39a"/><circle cx="11" cy="17.5" r=".8" fill="#fff" stroke="none"/>',
  gym: '<circle cx="12" cy="12" r="8.5" fill="#f08a3c"/><path d="M3.5 12h17M12 3.5v17M6 6a9 9 0 0 1 0 12M18 6a9 9 0 0 0 0 12"/>',
  library: '<rect x="3.5" y="5" width="4.5" height="15" rx="1" fill="#e5484d"/><rect x="8" y="3" width="4.5" height="17" rx="1" fill="#5b8def"/><path d="M13.5 6.2l4.3-1.2 3.6 13.6-4.3 1.2z" fill="#6cd39a"/><path d="M5.8 8.5v2M10.2 7v2"/>',
  club: '<path d="M5 21V3" stroke-width="2.4"/><path d="M5 4h13l-3 4 3 4H5z" fill="#2f8f6b"/><path d="M9 8h4" stroke="#ffd23f"/>',
  ginkgo: '<path d="M12 21v-7" stroke-width="2.4"/><path d="M12 14C7 14 3 10 3.5 5.5 7 7 9.5 6 12 4c2.5 2 5 3 8.5 1.5C21 10 17 14 12 14z" fill="#ffc62e"/><path d="M12 4.5v5"/>',
  bench: '<rect x="3" y="7" width="18" height="4" rx="1" fill="#c98a4a"/><rect x="3" y="12.5" width="18" height="3" rx="1" fill="#c98a4a"/><path d="M5.5 15.5V20M18.5 15.5V20"/>',
  flower: '<path d="M12 21v-8" stroke="#3f8a3a" stroke-width="2.4"/><path d="M12 16c-3 0-4.5-2-4.5-2s2 -1.5 4.5 0" fill="#6cd39a"/><path d="M7 5.5l2.5 2L12 4l2.5 3.5L17 5.5V10a5 5 0 0 1-10 0z" fill="#ff6b8b"/>',
  planter: '<path d="M6 13h12l-1.5 8h-9z" fill="#c96a3a"/><circle cx="12" cy="8" r="5" fill="#5fae4e"/><circle cx="14.5" cy="6.5" r="1.2" fill="#ff6b8b" stroke="none"/>',
  lamp: '<path d="M12 9v12M8 21h8" stroke-width="2.4"/><circle cx="12" cy="6" r="3.5" fill="#ffe8a0"/>',
  vending: '<rect x="6" y="2.5" width="12" height="19" rx="1.5" fill="#e5484d"/><rect x="8.5" y="5" width="7" height="8" fill="#dff1f7"/><path d="M9 17h6"/>',
  fountain: '<path d="M3 17h18l-1.5 4h-15z" fill="#d9d2c2"/><path d="M12 17V9" stroke-width="2.4"/><path d="M12 9c-3 0-5 3-5 6M12 9c3 0 5 3 5 6" stroke="#5b8def"/><circle cx="12" cy="7" r="2" fill="#9fd8f0"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2" fill="#2b4a3c"/><rect x="7.5" y="5.5" width="9" height="5" rx="1" fill="#fffaf0"/><path d="M5 7h-1.5M5 12h-1.5M5 17h-1.5" stroke-width="2"/><path d="M15 21v-4l1.5 1 1.5-1v4" fill="#ffd23f"/>',
  pencil: '<path d="M4 20l1.2-4.6L16.5 4.1a2 2 0 0 1 2.9 0l.5.5a2 2 0 0 1 0 2.9L8.6 18.8z" fill="#ffd23f"/><path d="M14.5 6l3.5 3.5M4 20l4.6-1.2"/><path d="M5.2 15.4l3.4 3.4" />',
  pcase: '<rect x="2.5" y="7" width="19" height="10" rx="4" fill="#5b8def"/><path d="M2.5 11.5h19"/><rect x="10" y="9.8" width="4" height="3.4" rx="1" fill="#ffd23f"/>',
  marker: '<path d="M14 3.5l6.5 6.5-8.5 8.5H6V12.5z" fill="#b8f06a"/><path d="M6 18.5L3.5 21H8M10.5 7l6.5 6.5"/>',
  gymsuit: '<path d="M8 3.5L3 6.5l2 4 2-1V20.5h10V9.5l2 1 2-4-5-3c-.6 1.6-2.2 2.6-4 2.6S8.6 5.1 8 3.5z" fill="#e5484d"/><path d="M12 9v11"/>',
  earphone: '<path d="M5 15v-3a7 7 0 0 1 14 0v3"/><rect x="3" y="14" width="5" height="7" rx="2" fill="#c86bff"/><rect x="16" y="14" width="5" height="7" rx="2" fill="#c86bff"/>',
  goldpen: '<path d="M5 19l2-6L16 4l4 4-9 9z" fill="#ffd23f"/><path d="M5 19l1.5-1.5M14 6l4 4"/><circle cx="18.5" cy="5.5" r="1" fill="#fff"/>',
  snowman: '<circle cx="12" cy="16" r="5" fill="#fff"/><circle cx="12" cy="8" r="3.5" fill="#fff"/><path d="M9 4.5h6M10 4.5V2h4v2.5" fill="#231c17"/><path d="M12 8.5l2.5.8" stroke="#ff8a3c"/>',
  cherry: '<path d="M12 21v-7"/><circle cx="12" cy="9" r="6" fill="#ffb7cf"/><circle cx="9" cy="8" r="1" fill="#fff"/><circle cx="14.5" cy="10.5" r="1" fill="#fff"/>',
  flags: '<path d="M2 5c6 4 14 4 20 0"/><path d="M5 6.5l1 4 2-3.5z" fill="#e5484d"/><path d="M10 7.6l1 4 2-3.7z" fill="#ffd23f"/><path d="M15 7.3l1 4 2-3.8z" fill="#5b8def"/>',
  parasol: '<path d="M3 11a9 7 0 0 1 18 0z" fill="#e5484d"/><path d="M12 11v10M9 21h6M8 11a4 7 0 0 1 8 0" />',
  booth: '<path d="M2 9l3-5h14l3 5z" fill="#e5484d"/><path d="M4 9v11M20 9v11"/><rect x="5" y="13" width="14" height="5" fill="#ffd23f"/>',
  banner: '<path d="M4 3v18M20 3v18"/><rect x="4" y="5" width="16" height="8" fill="#fffaf0"/><path d="M7 9h10" stroke="#e5484d"/>',
  xmas: '<path d="M12 2l4 6h-2l4 6h-3l4 5H5l4-5H6l4-6H8z" fill="#2f8f4e"/><path d="M12 19v3"/><circle cx="12" cy="2.5" r="1.3" fill="#ffd23f"/>',
  compass: '<circle cx="12" cy="12" r="9" fill="#fffaf0"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="#e5484d"/><circle cx="12" cy="12" r="1"/>',
  train: '<rect x="5" y="3" width="14" height="14" rx="3" fill="#2f6fb8"/><rect x="7.5" y="5.5" width="9" height="4" rx="1" fill="#dff1fb"/><circle cx="9" cy="13.5" r="1.2" fill="#ffd23f"/><circle cx="15" cy="13.5" r="1.2" fill="#ffd23f"/><path d="M8 17l-2 4M16 17l2 4"/>',
  sweep: '<path d="M14 3l7 7-9 9H5v-7z" fill="#ffd23f"/><path d="M9.5 14.5L5 19M14 3l7 7"/><path d="M3 21h8"/>',
  album: '<rect x="4" y="3" width="16" height="18" rx="2" fill="#8a5a34"/><rect x="7" y="6" width="10" height="7" rx="1" fill="#fffaf0"/><path d="M8 16h8"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="#ffd23f"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6"/>',
  uniform: '<path d="M8 3l4 3 4-3 5 4-2 4-2-1v11H7V10l-2 1-2-4z" fill="#2b4a3c"/><path d="M12 6v14"/><path d="M10 9l2 2 2-2" stroke="#ffd23f"/>',
  chalk: '<rect x="3" y="12" width="18" height="8" rx="1" fill="#c86bff"/><rect x="5" y="5" width="3" height="8" rx="1" fill="#fff"/><rect x="10" y="4" width="3" height="9" rx="1" fill="#ffd23f"/><rect x="15" y="6" width="3" height="7" rx="1" fill="#ff8fb3"/>',
  medal: '<path d="M8 2l2 7M16 2l-2 7" stroke="#e5484d"/><circle cx="12" cy="15" r="6" fill="#ffd23f"/><path d="M12 12l1 2h2l-1.5 1.5.5 2-2-1-2 1 .5-2L9 14h2z" fill="#fff" stroke-width="1"/>',
  mic: '<rect x="9" y="2.5" width="6" height="11" rx="3" fill="#6b7078"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2" fill="#fffaf0"/><rect x="9" y="2.5" width="6" height="3.5" rx="1" fill="#ffd23f"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  expand: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" stroke-width="2.6"/>',
  shrink: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" stroke-width="2.6"/>',
  main: '<path d="M3 20.5V10l9-5 9 5v10.5z" fill="#f3ead6"/><path d="M3 10l9-5 9 5" fill="#2b4a3c"/><rect x="10" y="14" width="4" height="6.5" fill="#8a5a34"/>',
};
function drawIcon(name, size = 18, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}
// 자원 묶음: { know: 10, snack: 4 } → 아이콘 + 숫자
const RES_ORDER = ['know', 'snack', 'power', 'coin'];
// 자원마다 하는 일 (자원 칸을 누르면 보여 준다)
const RES_INFO = {
  know:  { name: '지식', use: '시설 복구 · 레벨업, 구역 넓히기', from: '본관 · 과학실 · 도서관 · 컴퓨터실 · 온실 · 강당' },
  snack: { name: '간식', use: '친구 레벨업 (빨리 키우기)', from: '매점 · 급식실 · 보건실 · 텃밭 · 기숙사' },
  power: { name: '체력', use: '꾸미기 놓기, 친구 각성', from: '운동장 · 다목적관 · 방송실 · 정자 · 수영장' },
  coin:  { name: '용돈', use: '친구 뽑기, 문구점 장비', from: '전투 승리 · 친구 의뢰 · 출석 · 오늘의 미션 · 시장 교환' },
};
const resText = (cost, size = 13) => RES_ORDER.filter(k => cost && cost[k]).map(k => `<span class="rs">${drawIcon(k, size)}${cost[k]}</span>`).join('');

// 전체화면: 되는 기기는 바로 전체화면, 안 되는 기기(아이폰 사파리)는 '홈 화면에 추가' 안내
const isStandalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
function setupFullscreen(btn, landscape) {
  if (!btn) return;
  const can = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  if (isStandalone()) { btn.hidden = true; return; }
  const draw = () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); btn.innerHTML = drawIcon(on ? 'shrink' : 'expand', 20); btn.setAttribute('aria-label', on ? '전체화면 끄기' : '전체화면'); };
  draw(); document.addEventListener('fullscreenchange', draw); document.addEventListener('webkitfullscreenchange', draw);
  btn.addEventListener('click', async e => {
    e.stopPropagation();
    if (!can) { showInstallTip(); return; }
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const el = document.documentElement; await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
      if (landscape && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    } catch (err) { showInstallTip(); }
  });
}
function showInstallTip() {
  let el = document.getElementById('install-tip');
  if (!el) { el = document.createElement('div'); el.id = 'install-tip'; document.body.appendChild(el); }
  el.innerHTML = `<div class="it-box"><b>주소창 없이 크게 하기</b><p>아이폰: 아래 <b>공유 버튼</b> → <b>홈 화면에 추가</b><br>안드로이드: 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b></p><p>홈 화면 아이콘으로 열면 앱처럼 화면 전체를 써요.</p><button>알겠어요</button></div>`;
  el.hidden = false; el.querySelector('button').onclick = () => { el.hidden = true; };
}
// 스크롤 대신 페이지: box(.pg) 안의 아이템을 box 높이에 맞게 나누고 ◀ 1/3 ▶ 로 넘긴다 (옆으로 밀어도 넘어감)
const PAGE_AT = {};
function paginate(box, key) {
  if (!box) return;
  const old = box.nextElementSibling; if (old && old.classList.contains('pager')) old.remove();
  const kids = [...box.children]; kids.forEach(k => { k.style.display = ''; });
  const nav = document.createElement('div'); nav.className = 'pager'; box.after(nav);
  if (!kids.length || !box.clientHeight) { nav.hidden = true; return; }
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
  const H = box.clientHeight, pages = []; let s = 0;
  while (s < kids.length) {
    kids.forEach((k, i) => { k.style.display = i < s ? 'none' : ''; });
    const top = kids[s].offsetTop; let e = s + 1;
    while (e < kids.length && kids[e].offsetTop + kids[e].offsetHeight - top <= H + 1) e++;
    pages.push([s, e]); s = e;
  }
  let p = Math.min(PAGE_AT[key] || 0, pages.length - 1);
  const show = () => {
    PAGE_AT[key] = p; kids.forEach((k, i) => { k.style.display = i >= pages[p][0] && i < pages[p][1] ? '' : 'none'; });
    nav.innerHTML = `<button type="button" data-pg="-1" aria-label="이전 쪽" ${p ? '' : 'disabled'}>◀</button><span>${p + 1} / ${pages.length}</span><button type="button" data-pg="1" aria-label="다음 쪽" ${p < pages.length - 1 ? '' : 'disabled'}>▶</button>`;
  };
  if (pages.length < 2) { nav.classList.add('one'); show(); return; }
  nav.addEventListener('click', e => { const b = e.target.closest('[data-pg]'); e.stopPropagation(); if (!b || b.disabled) return; p += +b.dataset.pg; show(); if (typeof KS !== 'undefined') KS.fx('click'); });
  let sx = null;
  box.ontouchstart = e => { sx = e.touches[0].clientX; };
  box.ontouchend = e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) { const np = p + (dx < 0 ? 1 : -1); if (np >= 0 && np < pages.length) { p = np; show(); } } };
  show();
}
const paginateIn = (root, prefix = '') => { if (root) root.querySelectorAll('.pg').forEach((b, i) => paginate(b, prefix + (b.dataset.pg || i))); };

// 가로 전용: 휴대폰을 세로로 들면 "가로로 돌려 주세요"를 보여 준다
(function rotateGuard() {
  const add = () => {
    if (document.getElementById('rotate')) return;
    const st = document.createElement('style');
    st.textContent = `#rotate{position:fixed;inset:0;z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#2b4a3c;color:#fffaf0;font-family:Jua,sans-serif;text-align:center;padding:24px}
#rotate .ph{width:70px;height:116px;border:5px solid #fffaf0;border-radius:14px;position:relative;animation:rot 1.8s ease-in-out infinite}
#rotate .ph::after{content:'';position:absolute;left:50%;bottom:8px;width:14px;height:4px;margin-left:-7px;border-radius:2px;background:#fffaf0}
#rotate b{font-size:24px;font-weight:400}#rotate small{font-family:'Gowun Dodum',sans-serif;font-size:14px;opacity:.85}
@keyframes rot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
@media (orientation:portrait) and (max-width:900px){#rotate{display:flex}}`;
    document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'rotate';
    el.innerHTML = '<div class="ph"></div><b>휴대폰을 가로로 돌려 주세요</b><small>양일 캠퍼스는 가로 화면으로 해요</small>';
    document.body.appendChild(el);
    // 화면을 처음 누르면 (지원하는 폰에서) 가로로 고정해 본다
    const lock = () => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
    addEventListener('pointerdown', lock, { once: true });
  };
  if (document.body) add(); else addEventListener('DOMContentLoaded', add);
})();
