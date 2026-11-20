// 양일 캠퍼스 손그림 아이콘 (이모지 대신). 굵은 잉크 선 + 납작한 색.
const INK = '#231c17';
const ICON_PATHS = {
  know: '<rect x="5" y="3" width="14" height="18" rx="2" fill="#5b8def"/><path d="M8.5 3v18"/><path d="M11.5 8h4.5M11.5 11.5h4.5" stroke="#fff"/>',
  snack: '<path d="M4 12.5a8 5.5 0 0 1 16 0V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" fill="#f2b25c"/><path d="M9 9.5l1 3M13 9l1 3M16.5 10l.6 2.5"/>',
  power: '<path d="M13.5 2.5L5 13.5h6l-1.5 8 9-11.5h-6z" fill="#ffd23f"/>',
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
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2" fill="#fffaf0"/><rect x="9" y="2.5" width="6" height="3.5" rx="1" fill="#ffd23f"/><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  main: '<path d="M3 20.5V10l9-5 9 5v10.5z" fill="#f3ead6"/><path d="M3 10l9-5 9 5" fill="#2b4a3c"/><rect x="10" y="14" width="4" height="6.5" fill="#8a5a34"/>',
};
function drawIcon(name, size = 18, cls = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}
// 자원 묶음: { know: 10, snack: 4 } → 아이콘 + 숫자
const RES_ORDER = ['know', 'snack', 'power'];
const resText = (cost, size = 13) => RES_ORDER.filter(k => cost && cost[k]).map(k => `<span class="rs">${drawIcon(k, size)}${cost[k]}</span>`).join('');
