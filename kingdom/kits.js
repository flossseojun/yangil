// 양일 캠퍼스 전투: 친구 56명의 역할 · 스킬 · 장비 · 동아리 옷, 그리고 동아리 시너지 (팀 편성 · 전투가 함께 쓴다)

/* ───────── 역할 ───────── */
const ROLES = {
  tank:    { name: '방어', color: '#7fb3ff', icon: 'shield', hp: 3400, atk: 120, rate: 1.1, melee: true, cd: 15, desc: '보호막 · 보스 공격을 대신 받음' },
  striker: { name: '돌격', color: '#ff8a5c', icon: 'bolt', hp: 2500, atk: 170, rate: .9, melee: true, cd: 10, desc: '피해 + 보스 기절 · 폭탄 취소' },
  blaster: { name: '폭발', color: '#ffb84d', icon: 'boom', hp: 1900, atk: 135, rate: 1.25, cd: 12, desc: '폭발 피해 + 화상' },
  mage:    { name: '마법', color: '#b48bff', icon: 'star', hp: 1800, atk: 150, rate: 1.3, cd: 13, desc: '강한 한 방' },
  healer:  { name: '회복', color: '#7dff9e', icon: 'heart', hp: 1800, atk: 90, rate: 1.4, cd: 11, desc: '모두 체력 회복' },
  support: { name: '지원', color: '#ffd779', icon: 'note', hp: 2000, atk: 110, rate: 1.2, cd: 12, desc: '팀 공격력 증가 · 스킬 충전' },
};
const ROLE_ORDER = ['tank', 'striker', 'blaster', 'mage', 'healer', 'support'];

/* ───────── 친구별 구성: [역할, 스킬 이름, 장비, 옷, 동아리 태그] ───────── */
const K = (role, skill, gear, top, tag) => ({ role, skill, gear, top: top || null, tag: tag || null });
const KITS = {
  ryun: K('support', '지름길 안내', 'map'),
  seojun: K('mage', '코딩 폭격', 'laptop', 'sona', 'sona'),
  yejun: K('healer', '응급처치', 'medkit', 'medic', 'medi'),
  mingyeol: K('support', '개그 한 방', 'mic'),
  jaewon: K('tank', '비둘기 방어막', 'shield'),
  jiyong: K('healer', '부화의 온기', 'egg', null, 'squid'),
  geonwoo: K('support', '1000억 투자', 'card'),
  yunsu: K('blaster', '폭발 실험', 'flask', 'labcoat', 'chem'),
  eunseong: K('striker', '에너자이저 돌진', 'ball', 'sport', 'sport'),
  yunbo: K('mage', '보조선 한 줄', 'book', 'sona', 'sona'),
  isan: K('tank', '헬스 코치 버티기', 'dumbbell', 'sport', 'sport'),
  soyul: K('striker', '골밑 덩크', 'basketball', 'sport', 'sport'),
  siwoo: K('tank', '설계 바리케이드', 'blueprint', 'zec', 'zec'),
  hyunwoo: K('striker', '이론 슛', 'ball', 'sport', 'sport'),
  jio: K('striker', '왼발 크로스', 'ball', 'sport', 'sport'),
  younggeun: K('mage', '영어 스피치', 'book'),
  sia: K('mage', '별빛 관측', 'star', null, 'squid'),
  yejunsim: K('support', '전교회장 연설', 'mic', 'zec', 'zec'),
  jejun: K('healer', '착한 격려', 'medkit'),
  sihun: K('healer', '새싹 치유', 'sprout', 'seed', 'seed'),
  hyeongseop: K('tank', '전략 방벽', 'shield', 'work', 'eng'),
  sion: K('striker', '로봇 댄스', 'wrench'),
  seongjun: K('support', '한턱 쏜다', 'card'),
  yuchan: K('tank', '의리 방패', 'shield'),
  yejin: K('blaster', 'F1 터보', 'wrench', 'work', 'eng'),
  seoan: K('support', '치이카와 응원', 'star'),
  jaejun: K('blaster', '아이언 빔', 'wrench'),
  taeyeol: K('blaster', '수질 분석 폭탄', 'flask', 'labcoat', 'chem'),
  munyunsu: K('striker', '텐션 100% 슛', 'ball', 'sport', 'sport'),
  hyeonseo: K('striker', '메시 드리블', 'ball', 'sport', 'sport'),
  yunho: K('support', '확성기 응원', 'mic'),
  hayeon: K('mage', '설계도 폭풍', 'blueprint', 'zec', 'zec'),
  minah: K('striker', '할리 돌진', 'wrench'),
  wooseok: K('striker', '유도 업어치기', 'dumbbell'),
  taejeong: K('mage', '레이드 소환', 'phone'),
  sangwoong: K('support', '응원 방송', 'mic', 'broadcast', 'bcast'),
  hyunsu: K('tank', '일진 위압', 'shield'),
  leeyunho: K('mage', '체크메이트', 'chess'),
  suae: K('mage', '가챠 천장', 'phone'),
  beomsik: K('tank', '큰형 방패', 'shield'),
  jiho: K('blaster', '물로켓 발사', 'wrench', 'work', 'eng'),
  kimhyeonseo: K('tank', '높은 블로킹', 'shield'),
  jeonggyu: K('striker', '돌파 슛', 'ball', 'sport', 'sport'),
  taegeon: K('support', '웃음 폭탄', 'mic', 'seed', 'seed'),
  junyoung: K('tank', '방패 로봇', 'shield', 'work', 'eng'),
  seoeun: K('striker', '멀리뛰기 킥', 'ball', 'sport', 'sport'),
  jaehee: K('support', '내일부터 할게', 'book'),
  yul: K('striker', '3점 슛', 'basketball', 'zec', 'zec'),
  sunbi: K('healer', '메이크업 힐', 'star'),
  yuna: K('blaster', '마라 폭탄', 'flask'),
  baekho: K('support', '응원봉 파도', 'mic'),
  yeonju: K('blaster', '천원돌파 드릴', 'wrench'),
  bojun: K('striker', '강속구', 'baseball', 'sport', 'sport'),
  namjiho: K('support', '장난 작전', 'star'),
  seungmin: K('healer', '치유의 노래', 'mic'),
  sihyeon: K('striker', '연막 은신술', 'shuriken', 'broadcast', 'bcast'),
  minjeong: K('support', '결재 폭풍', 'book'),
  intak: K('striker', '끝내기 홈런', 'baseball', 'sport', 'sport'),
};
const kitOf = id => KITS[id] || K('striker', '전력 질주', 'ball');

/* ───────── 동아리 옷 (상반신 그림에 덧입힌다) ───────── */
const TOP_COLOR = { work: '#e2772d', labcoat: '#f4f4f0', sona: '#23262c', medic: '#f7f7f5', sport: '#1f6f8b', zec: '#3c8a5a', broadcast: '#2b3a6b', seed: '#6b9a3a' };
if (typeof OUTFIT_TOP !== 'undefined') Object.assign(OUTFIT_TOP, {
  labcoat: jk => `<path d="${jk}" fill="#f4f4f0" stroke="#c9ccd2" stroke-width="1"/><path d="M40 76 L50 96 L60 76" fill="#3b4a66"/><path d="M40 76 L46 100 M60 76 L54 100" stroke="#c9ccd2" stroke-width="1.4"/><rect x="61" y="88" width="9" height="7" rx="1" fill="none" stroke="#c9ccd2"/><path d="M63 86 v4" stroke="#3f7fb8" stroke-width="1.6"/>`,
  work: jk => `<path d="${jk}" fill="#e2772d" stroke="#a9521a" stroke-width="1"/><path d="M14 92 H86" stroke="#f5f0c8" stroke-width="3" opacity=".9"/><path d="M50 76 V100" stroke="#a9521a" stroke-width="1.4"/><path d="M42 76 L50 84 L58 76" fill="#2b2f36"/>`,
  sona: jk => `<path d="${jk}" fill="#23262c"/><path d="M33 75 Q50 86 67 75 L64 82 Q50 90 36 82Z" fill="#33373e"/><text x="50" y="96" text-anchor="middle" font-size="7" fill="#5dff8a" font-family="monospace">&lt;/&gt;</text>`,
  medic: jk => `<path d="${jk}" fill="#f7f7f5" stroke="#cfd3d8" stroke-width="1"/><path d="M42 76 L50 86 L58 76" fill="#7fc4b8"/><rect x="25" y="84" width="10" height="10" rx="1.5" fill="#e5484d"/><path d="M30 86 v6 M27 89 h6" stroke="#fff" stroke-width="1.8"/>`,
  sport: jk => `<path d="${jk}" fill="#1f6f8b" stroke="#164f63" stroke-width="1"/><path d="M42 75 L50 81 L58 75" fill="none" stroke="#fff" stroke-width="2"/><text x="50" y="97" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="sans-serif">10</text>`,
  zec: jk => `<path d="${jk}" fill="#3c8a5a" stroke="#2a6340" stroke-width="1"/><path d="M40 76 L50 92 L60 76" fill="#f4f6f8"/><rect x="58" y="86" width="12" height="8" rx="1" fill="#dfeee4"/><path d="M60 89 h8 M60 91.5 h5" stroke="#3c8a5a" stroke-width="1"/>`,
  broadcast: jk => `<path d="${jk}" fill="#2b3a6b" stroke="#1d2850" stroke-width="1"/><path d="M40 76 L50 92 L60 76" fill="#f4f6f8"/><circle cx="31" cy="89" r="4" fill="#e5484d"/><circle cx="31" cy="89" r="1.6" fill="#fff"/>`,
  seed: jk => `<path d="${jk}" fill="#f4f6f8"/><path d="M34 78 L66 78 L70 100 L30 100Z" fill="#6b9a3a"/><path d="M50 88 q-5 -5 -9 -2 q4 4 9 2 q4 -6 9 -4 q-4 5 -9 4" fill="#c8e6a0"/>`,
});

/* ───────── 장비 (전신 그림 좌표 100×210, 오른손 근처) ───────── */
const GEAR = {
  shield: '<g transform="translate(14 150)"><path d="M0 0 Q12 -6 24 0 L22 22 Q12 32 2 22Z" fill="#5b6b7d" stroke="#2b3440" stroke-width="2"/><path d="M12 2 V26 M3 12 H21" stroke="#e2772d" stroke-width="3"/></g>',
  ball: '<g transform="translate(86 188)"><circle r="7" fill="#fff" stroke="#222" stroke-width="1.2"/><path d="M0 -3 l3 2 -1 3.5 h-4 l-1 -3.5Z" fill="#222"/></g>',
  flask: '<g transform="translate(84 156)"><circle cx="0" cy="16" r="16" fill="#5dff8a" opacity=".25"/><path d="M-3 0 h6 v8 l7 14 a3 3 0 0 1 -3 4 h-14 a3 3 0 0 1 -3 -4 l7 -14Z" fill="#dff" stroke="#7aa" stroke-width="1.2"/><path d="M-8 18 h16 l2 5 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3Z" fill="#5dff8a"/></g>',
  laptop: '<g transform="translate(74 158)"><rect x="0" y="0" width="26" height="17" rx="2" fill="#2a2f36"/><rect x="2" y="2" width="22" height="13" fill="#0f1720"/><text x="4" y="10" font-size="6" fill="#5dff8a" font-family="monospace">run()</text><path d="M-3 17 h32 l-3 4 h-26Z" fill="#3a4049"/></g>',
  medkit: '<g transform="translate(76 164)"><rect x="0" y="0" width="22" height="16" rx="3" fill="#f7f7f5" stroke="#cfd3d8"/><rect x="7" y="-4" width="8" height="5" rx="1" fill="none" stroke="#cfd3d8" stroke-width="2"/><path d="M11 3 v10 M6 8 h10" stroke="#e5484d" stroke-width="3"/></g>',
  mic: '<g transform="translate(82 150) rotate(20)"><rect x="-2.5" y="8" width="5" height="18" rx="2" fill="#2a2f36"/><circle r="7" cy="4" fill="#b8bec6" stroke="#6b7280"/><path d="M-5 2 h10 M-5 6 h10" stroke="#6b7280" stroke-width=".8"/></g>',
  book: '<g transform="translate(76 160) rotate(-8)"><rect width="22" height="16" rx="1.5" fill="#3f7fb8"/><rect x="2" y="2" width="18" height="12" fill="#f4f1e8"/><path d="M11 2 V14" stroke="#3f7fb8" stroke-width="1.2"/><path d="M4 6 h5 M4 9 h5 M13 6 h5 M13 9 h5" stroke="#9aa" stroke-width=".8"/></g>',
  blueprint: '<g transform="translate(74 158) rotate(-6)"><rect width="26" height="18" rx="1" fill="#2f6fbf"/><path d="M3 14 h8 v-8 h6 v8 h6 M5 4 h6" stroke="#cfe6ff" stroke-width="1" fill="none"/></g>',
  sprout: '<g transform="translate(82 172)"><rect x="-8" y="0" width="16" height="11" rx="2" fill="#a5774b"/><path d="M0 0 V-10" stroke="#3f8a3a" stroke-width="2"/><path d="M0 -8 q-8 -6 -10 0 q6 3 10 0 M0 -10 q7 -7 10 -1 q-5 3 -10 1" fill="#6bc36b"/></g>',
  basketball: '<g transform="translate(86 176)"><circle r="9" fill="#e8823a" stroke="#7a3b10" stroke-width="1.2"/><path d="M-9 0 H9 M0 -9 V9 M-6 -6 Q0 0 -6 6 M6 -6 Q0 0 6 6" stroke="#7a3b10" stroke-width="1" fill="none"/></g>',
  wrench: '<g transform="translate(80 152) rotate(30)"><rect x="-2" y="0" width="4" height="22" rx="2" fill="#9aa4ad"/><path d="M-7 -2 a7 7 0 1 1 14 0 l-3 3 h-8Z" fill="#9aa4ad"/></g>',
  star: '<g transform="translate(86 158)"><circle r="11" fill="#ffd779" opacity=".3"/><path d="M0 -9 l2.6 5.6 6 .7 -4.5 4.1 1.3 6 -5.4 -3 -5.4 3 1.3 -6 -4.5 -4.1 6 -.7Z" fill="#ffd779" stroke="#c99a0c"/></g>',
  card: '<g transform="translate(76 162) rotate(-10)"><rect width="22" height="14" rx="2" fill="#e8c14a" stroke="#a8861a"/><rect x="3" y="4" width="6" height="4" rx="1" fill="#a8861a"/><path d="M3 11 h14" stroke="#a8861a"/></g>',
  dumbbell: '<g transform="translate(84 172)"><rect x="-10" y="-2" width="20" height="4" fill="#6b7280"/><rect x="-14" y="-6" width="5" height="12" rx="1" fill="#2a2f36"/><rect x="9" y="-6" width="5" height="12" rx="1" fill="#2a2f36"/></g>',
  phone: '<g transform="translate(80 158) rotate(-10)"><rect width="12" height="20" rx="2" fill="#2a2f36"/><rect x="1.5" y="2" width="9" height="15" fill="#7fd0ff"/><path d="M3 12 l3 -6 3 6Z" fill="#ffd779"/></g>',
  chess: '<g transform="translate(84 160)"><path d="M-6 22 h12 l-2 -4 h-8Z M-3 18 l1 -10 h4 l1 10Z" fill="#f4f1e8" stroke="#555"/><circle cy="5" r="4" fill="#f4f1e8" stroke="#555"/><path d="M0 -2 v4 M-2 0 h4" stroke="#555" stroke-width="1.4"/></g>',
  baseball: '<g transform="translate(84 150) rotate(25)"><rect x="-2" y="0" width="4" height="30" rx="2" fill="#c98a4a"/><rect x="-3.5" y="0" width="7" height="10" rx="3" fill="#b07a45"/></g><g transform="translate(18 176)"><circle r="6" fill="#fff" stroke="#aaa"/><path d="M-3 -4 q2 4 0 8 M3 -4 q-2 4 0 8" stroke="#e5484d" stroke-width="1" fill="none"/></g>',
  shuriken: '<g transform="translate(86 160)"><path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="#5b6b7d" stroke="#2b3440"/><circle r="2.2" fill="#2b3440"/></g>',
  map: '<g transform="translate(74 160) rotate(-6)"><path d="M0 0 l8 3 8 -3 8 3 v16 l-8 -3 -8 3 -8 -3Z" fill="#f4e6c4" stroke="#b8a070"/><path d="M4 12 q6 -8 14 -2" stroke="#e5484d" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/></g>',
  egg: '<g transform="translate(84 172)"><ellipse rx="7" ry="9" fill="#fff7e8" stroke="#d9c7a3"/><path d="M-5 0 l3 -2 3 2 3 -2" stroke="#d9c7a3" fill="none"/></g>',
};

/* ───────── 동아리 시너지 ───────── */
const SYNERGIES = [
  { id: 'invent', name: '발명', need: '프롤로그 화학부 + 공학부', test: tags => tags.chem >= 1 && tags.eng >= 1, desc: '스킬 피해 +15%', fx: { skill: 1.15 } },
  { id: 'code', name: '코딩', need: '소나 2명', test: tags => tags.sona >= 2, desc: '원거리 공격 +20%', fx: { ranged: 1.2 } },
  { id: 'city', name: '도시 설계', need: 'ZEC 2명', test: tags => tags.zec >= 2, desc: '모두 최대 체력 +15%', fx: { hp: 1.15 } },
  { id: 'cheer', name: '응원 방송', need: '방송부 2명', test: tags => tags.bcast >= 2, desc: '스킬 충전 +15%', fx: { charge: 1.15 } },
  { id: 'sprout', name: '새싹', need: '시드핸즈 2명', test: tags => tags.seed >= 2, desc: '회복량 +25%', fx: { heal: 1.25 } },
  { id: 'squid', name: '갑오징어 먹물', need: '버터구이 2명', test: tags => tags.squid >= 2, desc: '받는 피해 -10%', fx: { guard: .9 } },
  { id: 'sport', name: '체육부', need: '운동부 친구 3명', test: tags => tags.sport >= 3, desc: '근접 공격 +15%', fx: { melee: 1.15 } },
];
function teamTags(ids) { const t = {}; ids.forEach(id => { const g = kitOf(id).tag; if (g) t[g] = (t[g] || 0) + 1; }); return t; }
function teamSynergy(ids) { const tags = teamTags(ids); return SYNERGIES.map(s => Object.assign({ on: s.test(tags) }, s)); }
function teamFx(ids) { const fx = { skill: 1, ranged: 1, hp: 1, charge: 1, heal: 1, guard: 1, melee: 1 }; teamSynergy(ids).filter(s => s.on).forEach(s => Object.entries(s.fx).forEach(([k, v]) => { fx[k] *= v; })); return fx; }
function power(id) { const r = ROLES[kitOf(id).role]; return Math.round(r.hp / 4 + r.atk * 4); }
// 전신 그림 (장비 · 동아리 옷 포함)
function kitSVG(id, pose = 'stand', expr = 'smile') {
  const k = kitOf(id), av = Object.assign({}, lookOf(id).av, k.top ? { top: k.top } : {});
  return avatarFullSVG(av, '', { pose, expr, jacket: k.top ? TOP_COLOR[k.top] : undefined }).replace(/<\/svg>$/, (GEAR[k.gear] || '') + '</svg>');
}
function kitHeadSVG(id, opts = {}) { const k = kitOf(id), av = Object.assign({}, lookOf(id).av, k.top ? { top: k.top } : {}); return avatarSVG(av, '', Object.assign({ expr: 'proud' }, opts)); }
const svgURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const TEAM_KEY = 'yangil.kingdom.team';
const ROLE_ICON = {
  shield: '<path d="M12 2 L20 5 V11 Q20 18 12 22 Q4 18 4 11 V5Z"/>',
  bolt: '<path d="M13 2 L5 13 H11 L10 22 L19 10 H13Z"/>',
  boom: '<path d="M12 2 L14 8 L20 6 L16 11 L22 14 L15 15 L16 22 L12 17 L8 22 L9 15 L2 14 L8 11 L4 6 L10 8Z"/>',
  star: '<path d="M12 2 L14.8 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.2 8.6Z"/>',
  heart: '<path d="M12 21 L4 13 A4.5 4.5 0 0 1 12 6.5 A4.5 4.5 0 0 1 20 13Z"/>',
  note: '<path d="M9 18 A3 3 0 1 1 9 17.9 V5 L19 3 V15 A3 3 0 1 1 19 14.9 V7 L11 8.6 V18Z"/>',
};
const roleIcon = (role, size = 14) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${ROLES[role].color}" aria-hidden="true">${ROLE_ICON[ROLES[role].icon]}</svg>`;

/* ───────── 친구별 스킬 (전투 연출과 효과) ───────── */
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
  minjeong: S('rain', 'book', '#b48bff', { n: 8, dmg: 0, gauge: .35, buff: 4, say: '결재 완료! 다들 출동!' }),
  intak: S('shoot', 'baseball', '#ffd779', { n: 1, dmg: 1450, stun: 2.5, dur: .3, size: .8, say: '끝내기 홈런!' }),
};
const ROLE_SPEC = { tank: S('aura', 'shield', '#7fb3ff', { shield: 900, taunt: 6 }), striker: S('shoot', 'soccer', '#fff', { dmg: 1300, stun: 2.5, low: true }), blaster: S('lob', 'flask', '#ff8a3c', { dmg: 1500, burn: 5 }), mage: S('beam', 'star', '#b48bff', { n: 4, dmg: 650 }), healer: S('aura', 'cross', '#7dff9e', { heal: .35 }), support: S('wave', 'note', '#ffd779', { buff: 6, gauge: .2 }) };


// 스킬 설명 한 줄 (프로필 · 팀 편성 카드)
const VIS_NAME = { lob: '포물선으로 던지기', shoot: '일직선으로 날리기', rain: '하늘에서 쏟아지기', dash: '돌진', beam: '빛줄기', slash: '한 줄 베기', rocket: '쏘아 올리기', wave: '퍼지는 응원', aura: '팀 강화', smoke: '연막' };
function skillOf(id) { return SKILL_SPEC[id] || ROLE_SPEC[kitOf(id).role]; }
function skillDesc(id) {
  const s = skillOf(id), out = [];
  const all = [s].concat(s.after ? [s.after] : []);
  const dmg = all.reduce((a, x) => a + (x.dmg || 0) * (x.n || 1), 0);
  if (dmg) out.push(`피해 ${dmg.toLocaleString('ko-KR')}` + (s.n > 1 ? ` (${s.n}연타)` : ''));
  if (s.stun) out.push(`${s.stun}초 기절`); if (s.sleep) out.push(`${s.sleep}초 재우기`);
  if (s.burn) out.push(`화상 ${s.burn}초`); if (s.weak) out.push(`보스 약화 ${s.weak}초`); if (s.confuse) out.push(`공격 빗나가게 ${s.confuse}번`);
  if (s.shield) out.push(`전원 보호막 ${s.shield}`); if (s.taunt) out.push('공격 대신 받기');
  if (s.heal) out.push(`전원 회복 ${Math.round(s.heal * 100)}%`); if (s.hot) out.push(`5초 동안 회복 ${Math.round(s.hot * 100)}%`);
  if (s.buff) out.push(`팀 공격력 UP ${s.buff}초`); if (s.haste) out.push(`공격 속도 UP ${s.haste}초`);
  if (s.gauge) out.push(`팀 스킬 충전 +${Math.round(s.gauge * 100)}%`); if (s.veil) out.push(`${s.veil}초 회피`);
  return out.join(' · ');
}

/* ───────── 키우기: 친구 레벨 · 친밀도 · 건물 보너스 · 스테이지 ───────── */
const CAMPUS_KEY = 'yangil.kingdom.v1';
const loadCampus = () => { try { const g = JSON.parse(localStorage.getItem(CAMPUS_KEY)); if (g && g.res) return g; } catch (e) {} return null; };
const saveCampus = g => { try { localStorage.setItem(CAMPUS_KEY, JSON.stringify(g)); } catch (e) {} };
const MAX_LV = 10;
const lvOf = (g, id) => Math.max(1, ((g && g.lv) || {})[id] || 1);
const bondOf = (g, id) => ((g && g.bond) || {})[id] || 0;
const lvMult = lv => 1 + (lv - 1) * .08;               // 레벨마다 체력 · 공격 · 스킬 +8%
const upCost = lv => ({ know: 10 * lv, snack: 6 * lv, power: 4 * lv });
// 건물 보너스: 같은 건물은 3개까지 센다
const BUILD_BONUS = {
  lab: { name: '과학실', text: '폭발 · 마법 친구 공격 +10%', key: 'magic', v: .10 },
  gym: { name: '다목적관', text: '방어 · 돌격 친구 체력 +12%', key: 'front', v: .12 },
  library: { name: '도서관', text: '스킬 충전 +6%', key: 'charge', v: .06 },
  store: { name: '매점', text: '회복량 +10%', key: 'heal', v: .10 },
};
const DECO_TYPES = ['ginkgo', 'bench', 'flower', 'lamp', 'vending', 'fountain', 'planter'];
function campusBonus(g) {
  const b = { magic: 1, front: 1, charge: 1, heal: 1, mood: 1, list: [] }, cnt = {};
  ((g && g.b) || []).forEach(x => { cnt[x.t] = (cnt[x.t] || 0) + 1; });
  const fac = (g && g.fac) || null;
  Object.entries(BUILD_BONUS).forEach(([t, d]) => {
    if (fac) { const lv = Math.min(5, fac[t] || 0); if (lv) { const v = Math.round(d.v * .6 * lv * 100); b[d.key] += v / 100; b.list.push(`${d.name} Lv.${lv} · ${d.text.replace(/\+(\d+)%/, '+' + v + '%')}`); } return; }
    const n = Math.min(3, cnt[t] || 0); if (n) { b[d.key] += d.v * n; b.list.push(`${d.name} ×${n} · ${d.text.replace(/\+(\d+)%/, (m, x) => '+' + x * n + '%')}`); }
  });
  const deco = DECO_TYPES.reduce((a, t) => a + (cnt[t] || 0), 0), mood = Math.min(5, Math.floor(deco / 4));
  if (mood) { b.mood += mood * .03; b.list.push(`꾸미기 ${deco}개 · 모든 친구 체력 +${mood * 3}%`); }
  return b;
}
// 스테이지: 갈수록 은행왕이 강해진다
const MAX_STAGE = 10;
const stageMul = st => ({ hp: 1 + (st - 1) * .4, dmg: 1 + (st - 1) * .18, reward: 1 + (st - 1) * .35, rec: Math.round((4200 + (st - 1) * 900) / 10) * 10 });
function powerOf(g, id) { const r = ROLES[kitOf(id).role], m = lvMult(lvOf(g, id)); return Math.round((r.hp / 4 + r.atk * 4) * m); }
// 챕터: 각 챕터 1-5를 깨면 다음 챕터가 열린다
const CHAPTERS = [
  { n: 1, place: '은행나무길', boss: '은행왕', desc: '은행 폭탄을 조심!' },
  { n: 2, place: '다목적관', boss: 'LED 스크린', desc: '레이저 줄 공격 · 눈부신 화면(평타 빗나감)' },
  { n: 3, place: '밤의 교실', boss: '야자의 유령', desc: '사라지기(받는 피해 절반) · 가위눌림(친구 잠듦)' },
  { n: 4, place: '본관 옥상', boss: '본관', desc: '마지막 한 겹에서 누군가 나타난다…' },
];
const CHAP_UNLOCK = 5;
const progOf = (g, ch) => ch === 1 ? Math.max(1, (g && g.stage) || 1) : Math.max(((g && g.chs) || {})[ch] || 0, progOf(g, ch - 1) > CHAP_UNLOCK ? 1 : 0);   // 이미 앞 챕터 1-5를 깬 저장도 열린다
function setProg(g, ch, v) { if (ch === 1) g.stage = v; else { g.chs = g.chs || {}; g.chs[ch] = v; } }
const effStage = (ch, st) => st + (ch - 1) * 4;          // 2-1은 1-5와 비슷한 세기
// 챕터 2~4는 특수 공격이 있는 대신 수치는 완만하게 오른다
const chapMul = (ch, st) => { if (ch === 1) return stageMul(st); const e = effStage(ch, st); return { hp: 1 + (e - 1) * .26, dmg: 1 + (e - 1) * .11, reward: 1 + (e - 1) * .35, rec: Math.round((4200 + (e - 1) * 650) / 10) * 10 }; };
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };
function loadSel(g) {
  let ch = 1, st = 1;
  try { ch = +localStorage.getItem('yangil.kingdom.chap') || 1; st = +localStorage.getItem('yangil.kingdom.stage') || 1; } catch (e) {}
  if (!progOf(g, ch)) ch = 1;
  st = Math.max(1, Math.min(st, progOf(g, ch), MAX_STAGE));
  return { ch, st };
}
function saveSel(ch, st) { try { localStorage.setItem('yangil.kingdom.chap', ch); localStorage.setItem('yangil.kingdom.stage', st); } catch (e) {} }
