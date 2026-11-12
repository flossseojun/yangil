// 새 아바타 그림체 (시안): 눈동자·하이라이트·눈썹·코·외곽선·그림자, 머리 15종, 상황별 표정, 팔 포즈
// 좌표계와 부품 이름은 avatar.js와 같아서 기존 외모 설정(FRIEND_LOOKS)을 그대로 쓴다.

const HAIR_NEW = [
  { id: 'bangs', name: '일자 앞머리' }, { id: 'side', name: '옆 가르마' }, { id: 'center', name: '5:5 가르마' }, { id: 'wolf', name: '울프컷' },
  { id: 'spiky', name: '삐죽 머리' }, { id: 'halfup', name: '반묶음' }, { id: 'twintail', name: '양갈래' }, { id: 'bun', name: '똥머리' },
];
const EYE_TYPES = [{ id: 'round', name: '동그란 눈' }, { id: 'droop', name: '처진 눈' }, { id: 'sharp', name: '날카로운 눈' }, { id: 'small', name: '작은 눈' }];
const EXPRESSIONS = { smile: '웃음', laugh: '빵 터짐', surprised: '놀람', embarrassed: '당황', sad: '울먹', angry: '화남', love: '하트 눈', proud: '당당', sleepy: '졸림', wink: '윙크', plain: '무표정' };

// 색을 어둡게/밝게 (amt: -1 ~ 1)
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(c => c.toString(16).padStart(2, '0')).join('');
}
// 외모마다 눈 모양이 정해지도록 (설정이 없으면 머리·피부로 고른다)
function eyeTypeOf(a) {
  if (a.eyes) return a.eyes;
  const s = (a.hair || '') + (a.skin || '') + (a.hairColor || '') + (a.acc || '');
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return EYE_TYPES[h % EYE_TYPES.length].id;
}

const HAIR2_BACK = {
  bob: 'M24 50 Q22 19 50 18 Q78 19 76 50 L77 66 Q71 69 66 62 L34 62 Q29 69 23 66Z',
  long: 'M23 50 Q20 17 50 17 Q80 17 77 50 L80 86 Q70 90 64 80 L36 80 Q30 90 20 86Z',
  ponytail: 'M68 26 Q92 30 88 62 Q84 76 78 70 Q84 52 70 40Z',
  wolf: 'M24 48 Q22 18 50 17 Q78 18 76 48 L78 63 L71 58 L67 67 L61 60 L39 60 L33 67 L29 58 L22 63Z',
  halfup: 'M23 50 Q20 17 50 17 Q80 17 77 50 L79 80 Q70 85 64 76 L36 76 Q30 85 21 80Z',
  twintail: 'M26 40 Q10 48 14 76 Q18 86 25 78 Q21 60 31 48Z M74 40 Q90 48 86 76 Q82 86 75 78 Q79 60 69 48Z',
  bun: '',
};
const HAIR2_TOP = { bun: 'M41 13 a9 8.5 0 1 0 18 0 a9 8.5 0 1 0 -18 0Z', halfup: 'M44 15 a6 5.5 0 1 0 12 0 a6 5.5 0 1 0 -12 0Z' };
const HAIR2_FRONT = {
  short: 'M27 47 Q25 21 50 20 Q75 21 73 47 Q67 34 50 33 Q34 33 27 47Z',
  twoblock: 'M29 41 Q28 18 50 18 Q73 18 71 41 Q62 30 50 31 Q38 30 29 41Z',
  bob: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q62 35 50 37 Q37 35 27 46Z',
  long: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q66 32 52 35 Q40 33 27 46Z',
  ponytail: 'M27 45 Q27 21 50 21 Q73 21 73 45 Q63 31 50 33 Q37 31 27 45Z',
  buzz: 'M28 44 Q28 24 50 24 Q72 24 72 44 Q62 37 50 37 Q38 37 28 44Z',
  bangs: 'M26 48 Q25 19 50 19 Q75 19 74 48 L73 41 Q50 43 27 41Z',
  side: 'M27 47 Q25 20 47 19 Q75 18 73 45 Q69 31 58 28 Q47 35 30 38 Q28 42 27 47Z',
  center: 'M27 47 Q26 20 50 20 Q74 20 73 47 Q70 32 51 27 Q50 30 49 27 Q30 32 27 47Z',
  wolf: 'M27 47 Q26 20 50 19 Q74 20 73 47 L69 38 L64 44 L58 36 L52 43 L46 36 L40 44 L35 37 L31 44Z',
  spiky: 'M27 45 L28 25 L34 28 L37 16 L44 25 L50 12 L56 25 L63 16 L66 28 L72 25 L73 45 Q62 35 50 35 Q38 35 27 45Z',
  halfup: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q66 32 52 35 Q40 33 27 46Z',
  twintail: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q62 35 50 37 Q37 35 27 46Z',
  bun: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q64 32 50 32 Q36 32 27 46Z',
};
const CURLS2 = [[29, 40, 8], [33, 30, 9], [42, 24, 9], [52, 22, 9], [62, 25, 9], [69, 32, 8], [72, 42, 7]];

function avatarSVG2(av, label = '내 아바타', opts = {}) {
  const a = Object.assign({ hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'none' }, av || {});
  const expr = opts.expr || a.face || 'smile', pose = opts.pose || null;
  const hc = a.hairColor, sk = a.skin, ink = '#2a2420';
  const hl = shade(hc, -0.35), skl = shade(sk, -0.28), brow = hc === '#e9e2d0' || hc === '#e3c068' ? shade(hc, -0.45) : shade(hc, -0.15);
  const fw = a.build === 'chubby' ? 25.5 : a.build === 'slim' ? 19.5 : 22;
  const p = [];
  // 뒷머리
  if (HAIR2_TOP[a.hair]) p.push(`<path d="${HAIR2_TOP[a.hair]}" fill="${hc}" stroke="${hl}" stroke-width="1"/>`);
  if (HAIR2_BACK[a.hair]) p.push(`<path d="${HAIR2_BACK[a.hair]}" fill="${hc}" stroke="${hl}" stroke-width="1" stroke-linejoin="round"/>`);
  // 몸: 교복(또는 옷장 옷) + 셔츠 깃 + 넥타이/리본 + 명찰
  const JACKET = { muscle: 'M5 100 Q7 73 33 72 L67 72 Q93 73 95 100Z', chubby: 'M9 100 Q12 77 35 75 L65 75 Q88 77 91 100Z', slim: 'M19 100 Q22 81 39 77 L61 77 Q78 81 81 100Z' };
  const jk = JACKET[a.build] || 'M14 100 Q17 80 37 76 L63 76 Q83 80 86 100Z';
  if (a.top && typeof OUTFIT_TOP !== 'undefined' && OUTFIT_TOP[a.top]) p.push(OUTFIT_TOP[a.top](jk));
  else {
    p.push(`<path d="${jk}" fill="#2e3f63" stroke="#1f2b45" stroke-width="1"/>`);
    p.push('<path d="M40 76 L50 92 L60 76Z" fill="#f4f6f8" stroke="#c9d0d8" stroke-width=".6"/>');
    p.push('<path d="M40 76 L45 90 M60 76 L55 90" stroke="#1f2b45" stroke-width="1.2" fill="none"/>');
    if (a.uni === 'ribbon') p.push('<g transform="translate(50 81)"><path d="M0 0 L-7 -4 L-7 4Z M0 0 L7 -4 L7 4Z" fill="#c23b2e"/><circle r="1.8" fill="#9e2e23"/></g>');
    else p.push('<path d="M48 81 L52 81 L53 95 L50 98.5 L47 95Z" fill="#c23b2e"/><path d="M48 81 L52 81 L51 84 L49 84Z" fill="#9e2e23"/>');
    p.push('<rect x="26" y="86" width="10" height="3.4" rx=".8" fill="#f4f6f8" opacity=".9"/><rect x="27.2" y="87.2" width="5" height="1" fill="#2e3f63" opacity=".6"/>');
  }
  // 목 + 턱 그림자
  p.push(`<rect x="44" y="64" width="12" height="14" rx="4" fill="${sk}"/><path d="M44 68 Q50 73 56 68 L56 71 Q50 75 44 71Z" fill="${skl}" opacity=".55"/>`);
  if (a.neck && typeof OUTFIT_NECK !== 'undefined' && OUTFIT_NECK[a.neck]) p.push(OUTFIT_NECK[a.neck]);
  // 귀 + 얼굴 (외곽선)
  const cy = a.build === 'chubby' ? 49 : 48, ry = a.build === 'chubby' || a.build === 'slim' ? 24.5 : 24;
  p.push(`<ellipse cx="${50 - fw}" cy="51" rx="4" ry="5.5" fill="${sk}" stroke="${skl}" stroke-width="1"/><ellipse cx="${50 + fw}" cy="51" rx="4" ry="5.5" fill="${sk}" stroke="${skl}" stroke-width="1"/>`);
  p.push(`<ellipse cx="50" cy="${cy}" rx="${fw}" ry="${ry}" fill="${sk}" stroke="${skl}" stroke-width="1.1"/>`);
  // 앞머리 + 하이라이트
  if (a.hair === 'curly') {
    p.push(CURLS2.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}" stroke="${hl}" stroke-width="1"/>`).join(''));
    p.push('<circle cx="40" cy="22" r="2.4" fill="#fff" opacity=".28"/><circle cx="50" cy="19" r="2" fill="#fff" opacity=".22"/>');
  } else {
    p.push(`<path d="${HAIR2_FRONT[a.hair] || HAIR2_FRONT.short}" fill="${hc}"${a.hair === 'buzz' ? ' opacity=".6"' : ` stroke="${hl}" stroke-width="1" stroke-linejoin="round"`}/>`);
    if (a.hair !== 'buzz') p.push(`<path d="M34 30 Q40 24 48 23" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".28"/><path d="M52 23 Q55 23 57 24" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".2"/>`);
    if (['side', 'center', 'long', 'bob', 'bangs', 'wolf'].includes(a.hair)) p.push(`<path d="M44 26 Q41 32 36 38 M56 26 Q59 32 64 38" stroke="${hl}" stroke-width=".8" fill="none" opacity=".6"/>`);
  }
  // 볼터치
  const blush = expr === 'embarrassed' || expr === 'love' ? .7 : .38;
  p.push(`<ellipse cx="36" cy="58" rx="4.4" ry="2.5" fill="#ff8a9a" opacity="${blush}"/><ellipse cx="64" cy="58" rx="4.4" ry="2.5" fill="#ff8a9a" opacity="${blush}"/>`);
  if (expr === 'embarrassed') p.push('<path d="M33 57 l2 -1.5 M36 58 l2 -1.5 M62 57 l2 -1.5 M65 58 l2 -1.5" stroke="#e05a6d" stroke-width=".9" opacity=".7"/>');

  // 눈썹
  const bw = a.build === 'muscle' ? 2.4 : 1.9;
  const browPath = {
    smile: ['M36 43.5 Q41 41.5 45.5 43', 'M54.5 43 Q59 41.5 64 43.5'], sad: ['M36 44 Q41 43 45 41.5', 'M55 41.5 Q59 43 64 44'],
    angry: ['M36 41.5 Q41 42.5 45.5 45', 'M54.5 45 Q59 42.5 64 41.5'], surprised: ['M36 41 Q41 38.5 45.5 40.5', 'M54.5 40.5 Q59 38.5 64 41'],
  }[expr === 'embarrassed' ? 'sad' : expr === 'proud' ? 'angry' : expr] || ['M36 43.5 Q41 41.5 45.5 43', 'M54.5 43 Q59 41.5 64 43.5'];
  p.push(browPath.map(d => `<path d="${d}" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`).join(''));

  // 눈
  const et = eyeTypeOf(a), iris = '#3b2a20';
  const arc = (cx, up) => `<path d="M${cx - 3.6} ${up ? 52 : 50} Q${cx} ${up ? 47.5 : 54} ${cx + 3.6} ${up ? 52 : 50}" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  const openEye = (cx, side) => {
    const big = expr === 'surprised', ryE = big ? 4.6 : et === 'sharp' ? 3.1 : et === 'small' ? 2.6 : 4, rxE = big ? 4 : et === 'small' ? 2.8 : 3.5;
    const tilt = et === 'droop' ? (side < 0 ? -1.2 : 1.2) : et === 'sharp' ? (side < 0 ? 1.2 : -1.2) : 0;
    const e = [`<g transform="rotate(${tilt * 8} ${cx} 51)">`];
    e.push(`<ellipse cx="${cx}" cy="51" rx="${rxE}" ry="${ryE}" fill="#fff"/>`);
    const ir = big ? 1.9 : et === 'small' ? 2.1 : 2.6;
    e.push(`<ellipse cx="${cx + side * .2}" cy="${big ? 51 : 51.6}" rx="${ir}" ry="${big ? 2.2 : Math.min(ryE, 3.2)}" fill="${iris}"/>`);
    e.push(`<circle cx="${cx + side * .2}" cy="${big ? 51 : 51.8}" r="${big ? .9 : 1.2}" fill="#140f0d"/>`);
    e.push(`<circle cx="${cx + 1}" cy="${big ? 49.8 : 50.2}" r="${et === 'small' ? .7 : 1.05}" fill="#fff"/><circle cx="${cx - .9}" cy="53" r=".45" fill="#fff" opacity=".9"/>`);
    // 윗눈꺼풀
    const lidY = 51 - ryE + .3;
    e.push(`<path d="M${cx - rxE - .6} ${51 - ryE * .35} Q${cx} ${lidY - 1.6} ${cx + rxE + .6} ${51 - ryE * .35}" stroke="${ink}" stroke-width="${et === 'sharp' ? 2.1 : 1.7}" fill="none" stroke-linecap="round"/>`);
    if (expr === 'proud') e.push(`<path d="M${cx - rxE} ${51 - 1} H${cx + rxE}" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/><rect x="${cx - rxE}" y="${51 - ryE - .5}" width="${rxE * 2}" height="${ryE - .5}" fill="${sk}"/>`);
    if (a.lash) e.push(`<path d="M${cx + side * (rxE + .4)} ${51 - ryE * .45} l${side * 1.8} -1.6 M${cx + side * (rxE - .6)} ${51 - ryE * .8} l${side * 1.4} -1.9" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>`);
    e.push('</g>');
    return e.join('');
  };
  const heart = cx => `<path d="M${cx} 54.5 l-3.8 -3.8 a2.3 2.3 0 0 1 3.8 -2.8 a2.3 2.3 0 0 1 3.8 2.8Z" fill="#e8455a"/>`;
  if (expr === 'laugh') p.push(arc(41, true), arc(59, true));
  else if (expr === 'sleepy') p.push(arc(41, false), arc(59, false));
  else if (expr === 'love') p.push(heart(41), heart(59));
  else if (expr === 'wink') p.push(openEye(41, -1), arc(59, true));
  else if (expr === 'plain' && et === 'small') p.push(openEye(41, -1), openEye(59, 1));
  else p.push(openEye(41, -1), openEye(59, 1));
  if (expr === 'sad') p.push('<path d="M38.5 55 q-1.5 4 0 6 q1.5 -2 0 -6Z" fill="#7cc4f0" opacity=".9"/><path d="M61.5 55 q-1.5 4 0 6 q1.5 -2 0 -6Z" fill="#7cc4f0" opacity=".9"/>');

  // 코
  p.push(`<path d="M50.5 53.5 Q52.4 56.2 49.8 56.9" fill="none" stroke="${skl}" stroke-width="${a.nose ? 1.5 : 1.1}" stroke-linecap="round"/>`);
  // 입
  const lipC = a.lips || '#8a3b3b';
  const M = {
    smile: `<path d="M44.5 60 Q50 65.5 55.5 60" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    laugh: `<path d="M43.5 59 Q50 59.8 56.5 59 Q55.5 67 50 67 Q44.5 67 43.5 59Z" fill="#7a2e2e"/><path d="M44.4 59.3 Q50 60 55.6 59.3 L55.2 61 Q50 61.6 44.8 61Z" fill="#fff"/><path d="M46.5 65 Q50 62.6 53.5 65 Q50 67 46.5 65Z" fill="#ef8a8a"/>`,
    surprised: '<ellipse cx="50" cy="62" rx="2.6" ry="3.2" fill="#7a2e2e"/>',
    embarrassed: `<path d="M44.5 61.5 q1.4 -1.6 2.8 0 t2.8 0 t2.8 0 t2.8 0" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`,
    sad: `<path d="M45 63 Q50 59.5 55 63" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    angry: `<path d="M45 62.5 Q50 60 55 62.5 L53.5 63.5 Q50 62 46.5 63.5Z" fill="#7a2e2e" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>`,
    love: `<path d="M44 59.5 Q50 66.5 56 59.5 Q50 61 44 59.5Z" fill="#7a2e2e"/>`,
    proud: `<path d="M44.5 60.5 Q51 63.5 56.5 58" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    sleepy: `<ellipse cx="50" cy="61.5" rx="1.8" ry="2.2" fill="${ink}"/>`,
    wink: `<path d="M44.5 59.5 Q50 65.5 55.5 59.5 Q50 61.5 44.5 59.5Z" fill="#7a2e2e"/><path d="M48 62.6 Q50 61.4 52 62.6 Q50 64 48 62.6Z" fill="#ef8a8a"/>`,
    plain: `<path d="M46 61 L54 61" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
  };
  p.push(M[expr] || M.smile);
  if (a.lips && ['smile', 'plain', 'proud'].includes(expr)) p.push(`<path d="M44 59.5 Q50 66 56 59.5 Q50 61.8 44 59.5Z" fill="${lipC}" stroke="${lipC}" stroke-width="1.2" stroke-linejoin="round"/>`);

  // 소품 (안경 등)
  if (a.acc === 'glasses') p.push(`<g fill="none" stroke="${ink}" stroke-width="1.5"><rect x="34.5" y="45.2" width="13" height="11" rx="4.5"/><rect x="52.5" y="45.2" width="13" height="11" rx="4.5"/><path d="M47.5 50 Q50 48.6 52.5 50 M34.5 49 L28.5 47 M65.5 49 L71.5 47"/></g><path d="M37 47.5 l3 -1.2" stroke="#fff" stroke-width="1" opacity=".7"/>`);
  if (a.acc === 'headband') p.push('<path d="M28 38 Q50 18 72 38" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/>');
  if (a.acc === 'bandage') p.push('<g transform="rotate(-20 64 57)"><rect x="57" y="54" width="14" height="6" rx="2" fill="#f1d3a8"/><rect x="62" y="54" width="4" height="6" fill="#e2bd8b"/></g>');
  if (a.acc === 'earphones') p.push('<circle cx="27" cy="53" r="3.2" fill="#fff" stroke="#bbb"/><circle cx="73" cy="53" r="3.2" fill="#fff" stroke="#bbb"/><path d="M27 56 L30 76 M73 56 L70 76" stroke="#ddd" stroke-width="1.4"/>');
  if (a.head && typeof OUTFIT_HEAD !== 'undefined' && OUTFIT_HEAD[a.head]) p.push(OUTFIT_HEAD[a.head]);
  // 감정 표시
  if (expr === 'embarrassed') p.push('<path d="M74 34 q-3 5 0 7 q3 -2 0 -7Z" fill="#8fd0f5" stroke="#5aa9d8" stroke-width=".6"/>');
  if (expr === 'angry') p.push('<g transform="translate(72 30)" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M-3 -1 Q0 0 -1 -3 M1 -3 Q0 0 3 -1 M3 1 Q0 0 1 3 M-1 3 Q0 0 -3 1"/></g>');
  if (expr === 'surprised') p.push('<path d="M76 30 l4 -4 M78 36 h5 M24 30 l-4 -4 M22 36 h-5" stroke="#2a2420" stroke-width="1.4" stroke-linecap="round"/>');
  if (expr === 'love') p.push('<path d="M76 34 l-2.4 -2.4 a1.5 1.5 0 0 1 2.4 -1.8 a1.5 1.5 0 0 1 2.4 1.8Z" fill="#e8455a"/>');
  // 팔 포즈
  const sleeve = a.top && OUTFIT_TOP && OUTFIT_TOP[a.top] ? ({ hoodie: '#9aa3ad', cardigan: '#d9c3a0', pe: '#2f7d5b', classtee: '#ffd23f', padding: '#26292d' })[a.top] : '#2e3f63';
  const hand = (x, y, r = 4.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${sk}" stroke="${skl}" stroke-width="1"/>`;
  if (pose === 'wave') p.push(`<path d="M78 92 Q86 78 85 62" stroke="${sleeve}" stroke-width="9" fill="none" stroke-linecap="round"/>${hand(85, 57, 5)}<path d="M92 50 q3 3 2 7 M94 45 q5 5 3 12" stroke="${ink}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`);
  if (pose === 'v') p.push(`<path d="M76 96 Q80 82 74 70" stroke="${sleeve}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M71.5 64 L69 55 M75.5 64 L78 55.5" stroke="${sk}" stroke-width="3" stroke-linecap="round"/><path d="M71.5 64 L69 55 M75.5 64 L78 55.5" stroke="${skl}" stroke-width=".6" stroke-linecap="round" opacity=".5"/>${hand(73.5, 66, 4.2)}`);
  if (pose === 'hold') p.push(`${hand(38, 94)}${hand(62, 94)}`);
  if (pose === 'cheer') p.push(`<path d="M24 92 Q16 78 17 64" stroke="${sleeve}" stroke-width="9" fill="none" stroke-linecap="round"/>${hand(17, 59, 5)}<path d="M76 92 Q84 78 83 64" stroke="${sleeve}" stroke-width="9" fill="none" stroke-linecap="round"/>${hand(83, 59, 5)}`);
  return `<svg class="avatar-svg" viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
}

// 게임 전체에 새 그림체 적용: 예전 함수는 시안 비교용으로 남겨 둔다
const avatarSVGOld = avatarSVG;
avatarSVG = (av, label, opts) => avatarSVG2(av, label, opts);
AVATAR_PARTS.hair.push(...HAIR_NEW);
// 캐릭터 만들기·외모 보내기에서 고를 수 있는 부품: 눈 모양, 체형
AVATAR_PARTS.eyes = EYE_TYPES;
AVATAR_PARTS.build = [{ id: 'normal', name: '보통' }, { id: 'slim', name: '마름' }, { id: 'chubby', name: '통통' }, { id: 'muscle', name: '근육' }];
AVATAR_LABEL.eyes = '눈 모양'; AVATAR_LABEL.build = '체형';
AVATAR_KEYS.splice(3, 0, 'eyes', 'build');
const _randomAvatarBase = randomAvatar;
randomAvatar = (gender, rng = Math.random) => {
  const a = _randomAvatarBase(gender, rng);
  a.eyes = EYE_TYPES[Math.floor(rng() * EYE_TYPES.length)].id;
  a.build = rng() < 0.7 ? 'normal' : ['slim', 'chubby', 'muscle'][Math.floor(rng() * 3)];
  return a;
};
