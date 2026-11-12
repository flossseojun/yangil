// 주인공 아바타: 부품을 골라 조합하는 캐릭터. 그림은 SVG 문자열로 만들고, 졸업 카드에는 이미지로 바꿔 그린다.
const AVATAR_PARTS = {
  hair: [
    { id: 'short', name: '짧은 머리' }, { id: 'twoblock', name: '투블럭' }, { id: 'bob', name: '단발' }, { id: 'long', name: '장발' },
    { id: 'ponytail', name: '묶은 머리' }, { id: 'curly', name: '곱슬' }, { id: 'buzz', name: '삭발' },
  ],
  hairColor: [
    { id: '#1e1b1a', name: '검정' }, { id: '#4a2f22', name: '흑갈색' }, { id: '#7a4b2a', name: '갈색' },
    { id: '#b5813f', name: '밝은 갈색' }, { id: '#e3c068', name: '금발' }, { id: '#8e6fd6', name: '보라' },
  ],
  skin: [
    { id: '#fcebdf', name: '하얀 톤' }, { id: '#f6dcc6', name: '밝은 톤' }, { id: '#efc6a2', name: '중간 톤' }, { id: '#dba67b', name: '웜 톤' },
    { id: '#b97f55', name: '태닝 톤' }, { id: '#8a5a3b', name: '진한 톤' },
  ],
  face: [
    { id: 'smile', name: '웃음' }, { id: 'plain', name: '무표정' }, { id: 'wink', name: '윙크' }, { id: 'sleepy', name: '졸림' }, { id: 'proud', name: '당당' },
  ],
  acc: [
    { id: 'none', name: '없음' }, { id: 'glasses', name: '안경' }, { id: 'headband', name: '머리띠' }, { id: 'bandage', name: '반창고' }, { id: 'earphones', name: '이어폰' },
  ],
};
const AVATAR_LABEL = { hair: '머리 모양', hairColor: '머리색', skin: '피부톤', face: '표정', acc: '소품' };
const AVATAR_KEYS = Object.keys(AVATAR_PARTS);

function randomAvatar(gender, rng = Math.random) {
  const P = arr => arr[Math.floor(rng() * arr.length)].id;
  const hairs = gender === 'f' ? ['bob', 'long', 'ponytail', 'short', 'curly', 'bangs', 'halfup', 'twintail', 'bun'] : ['short', 'twoblock', 'curly', 'buzz', 'bob', 'side', 'center', 'wolf', 'spiky'];
  return { hair: hairs[Math.floor(rng() * hairs.length)], hairColor: rng() < 0.75 ? P(AVATAR_PARTS.hairColor.slice(0, 3)) : P(AVATAR_PARTS.hairColor),
    skin: P(AVATAR_PARTS.skin.slice(0, 3)), face: P(AVATAR_PARTS.face), acc: rng() < 0.6 ? 'none' : P(AVATAR_PARTS.acc) };
}
// 부품 하나를 앞뒤로 넘긴다 (dir: 1 / -1)
function stepAvatar(av, key, dir) {
  const list = AVATAR_PARTS[key], i = list.findIndex(p => p.id === av[key]);
  return Object.assign({}, av, { [key]: list[(i + dir + list.length) % list.length].id });
}
const avatarPartName = (key, id) => (AVATAR_PARTS[key].find(p => p.id === id) || AVATAR_PARTS[key][0]).name;

// 100×100 좌표계. 뒷머리 → 교복 → 목 → 얼굴 → 앞머리 → 표정 → 소품 순서로 겹친다.
const HAIR_BACK = {
  bob: 'M24 50 Q22 19 50 18 Q78 19 76 50 L77 66 Q71 69 66 62 L34 62 Q29 69 23 66Z',
  long: 'M23 50 Q20 17 50 17 Q80 17 77 50 L80 86 Q70 90 64 80 L36 80 Q30 90 20 86Z',
  ponytail: 'M68 26 Q92 30 88 62 Q84 76 78 70 Q84 52 70 40Z',
};
const HAIR_FRONT = {
  short: 'M27 47 Q25 21 50 20 Q75 21 73 47 Q67 34 50 33 Q34 33 27 47Z',
  twoblock: 'M29 41 Q28 18 50 18 Q73 18 71 41 Q62 30 50 31 Q38 30 29 41Z',
  bob: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q62 35 50 37 Q37 35 27 46Z',
  long: 'M27 46 Q27 21 50 21 Q73 21 73 46 Q66 32 52 35 Q40 33 27 46Z',
  ponytail: 'M27 45 Q27 21 50 21 Q73 21 73 45 Q63 31 50 33 Q37 31 27 45Z',
  buzz: 'M28 44 Q28 24 50 24 Q72 24 72 44 Q62 37 50 37 Q38 37 28 44Z',
};
// 옷장: 매점에서 산 옷과 소품. 교복 대신 입는 상의(top) · 머리 소품(head) · 목 소품(neck)
const OUTFIT_TOP = {
  hoodie: jk => `<path d="${jk}" fill="#9aa3ad"/><path d="M33 75 Q50 86 67 75 L64 82 Q50 90 36 82Z" fill="#7f8893"/><path d="M45 82 L44 93 M55 82 L56 93" stroke="#eef1f4" stroke-width="1.6" stroke-linecap="round"/><rect x="38" y="92" width="24" height="8" rx="2" fill="#8a939d"/>`,
  cardigan: jk => `<path d="${jk}" fill="#d9c3a0"/><path d="M41 76 L50 94 L59 76Z" fill="#f4f6f8"/><path d="M48 82 L52 82 L53 94 L50 97 L47 94Z" fill="#c23b2e"/><path d="M50 94 V100" stroke="#b8a07c" stroke-width="1.2"/><circle cx="46" cy="96" r="1.3" fill="#8c7350"/><circle cx="54" cy="96" r="1.3" fill="#8c7350"/>`,
  pe: jk => `<path d="${jk}" fill="#2f7d5b"/><path d="M40 75 L50 80 L60 75 L60 79 L50 84 L40 79Z" fill="#f4f6f8"/><path d="M50 84 V100" stroke="#d6e6dd" stroke-width="1.4"/><path d="M24 90 L36 79 M76 90 L64 79" stroke="#f4f6f8" stroke-width="2.4" stroke-linecap="round"/>`,
  classtee: jk => `<path d="${jk}" fill="#ffd23f"/><path d="M42 75 Q50 82 58 75" fill="none" stroke="#e0ae16" stroke-width="2"/><text x="50" y="95" text-anchor="middle" font-size="9" font-weight="700" fill="#2e3f63" font-family="sans-serif">2반</text>`,
  padding: jk => `<path d="${jk}" fill="#26292d"/><path d="M38 72 Q50 66 62 72 L62 80 Q50 76 38 80Z" fill="#33373c"/><path d="M50 78 V100" stroke="#55595e" stroke-width="1.4"/><path d="M20 88 Q50 83 80 88 M16 96 Q50 91 84 96" stroke="#3c4045" stroke-width="1.6" fill="none"/>`,
};
const OUTFIT_NECK = {
  scarf: '<path d="M34 69 Q50 79 66 69 L67 78 Q50 88 33 78Z" fill="#c8453d"/><path d="M37 72 Q50 81 63 72 M35 76 Q50 85 65 76" stroke="#f0d9a0" stroke-width="1.2" fill="none"/><rect x="56" y="77" width="9" height="19" rx="2" fill="#b53a33" transform="rotate(-8 60 77)"/>',
};
const OUTFIT_HEAD = {
  beanie: '<path d="M25 40 Q25 11 50 11 Q75 11 75 40Z" fill="#d1453b"/><rect x="23" y="33" width="54" height="9" rx="4" fill="#b2352d"/><path d="M30 33 V42 M38 33 V42 M46 33 V42 M54 33 V42 M62 33 V42 M70 33 V42" stroke="#9c2d26" stroke-width="1"/><circle cx="50" cy="10" r="5.5" fill="#f4f1ea"/>',
  cap: '<path d="M26 39 Q26 15 50 15 Q74 15 74 39Z" fill="#2f6fbf"/><path d="M22 39 Q50 33 78 39 Q50 47 22 39Z" fill="#245a9e"/><circle cx="50" cy="16" r="2" fill="#245a9e"/><text x="50" y="32" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="sans-serif">Y</text>',
  hairpin: '<path d="M66 25 l2.2 4.6 5 .6 -3.7 3.4 1 5 -4.5 -2.5 -4.5 2.5 1 -5 -3.7 -3.4 5 -.6Z" fill="#ffd23f" stroke="#d4a514" stroke-width=".8"/>',
  ribbon: '<g transform="translate(67 25)"><path d="M0 0 L-10 -7 L-10 7Z" fill="#ff7aa2"/><path d="M0 0 L10 -7 L10 7Z" fill="#ff7aa2"/><circle r="3" fill="#e0557f"/></g>',
  headphones: '<path d="M23 50 Q22 13 50 13 Q78 13 77 50" fill="none" stroke="#3a3a3a" stroke-width="4.5"/><rect x="17" y="42" width="10" height="16" rx="4" fill="#5b8def"/><rect x="73" y="42" width="10" height="16" rx="4" fill="#5b8def"/>',
};
const CURLS = [[29, 40, 8], [33, 30, 9], [42, 24, 9], [52, 22, 9], [62, 25, 9], [69, 32, 8], [72, 42, 7]];

function avatarSVG(av, label = '내 아바타') {
  const a = Object.assign({ hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'none' }, av || {});
  const hc = a.hairColor, sk = a.skin, ink = '#2a2420';
  const p = [];
  if (HAIR_BACK[a.hair]) p.push(`<path d="${HAIR_BACK[a.hair]}" fill="${hc}"/>`);
  // 교복: 남색 재킷 + 흰 셔츠 깃
  // 체형: 보통 · 통통(chubby) · 마름(slim) · 근육(muscle) — 얼굴 폭과 어깨 폭이 달라진다
  const fw = a.build === 'chubby' ? 25.5 : a.build === 'slim' ? 19.5 : 22;
  const JACKET = { muscle: 'M5 100 Q7 73 33 72 L67 72 Q93 73 95 100Z', chubby: 'M9 100 Q12 77 35 75 L65 75 Q88 77 91 100Z', slim: 'M19 100 Q22 81 39 77 L61 77 Q78 81 81 100Z' };
  const jk = JACKET[a.build] || 'M14 100 Q17 80 37 76 L63 76 Q83 80 86 100Z';
  if (a.top && OUTFIT_TOP[a.top]) p.push(OUTFIT_TOP[a.top](jk));
  else p.push(`<path d="${jk}" fill="#2e3f63"/>`, '<path d="M41 76 L50 90 L59 76Z" fill="#f4f6f8"/>', '<path d="M48 82 L52 82 L53 96 L50 99 L47 96Z" fill="#c23b2e"/>');
  p.push(`<rect x="44" y="64" width="12" height="14" rx="4" fill="${sk}"/>`);
  if (a.neck && OUTFIT_NECK[a.neck]) p.push(OUTFIT_NECK[a.neck]);
  p.push(`<ellipse cx="${50 - fw}" cy="51" rx="4" ry="5.5" fill="${sk}"/><ellipse cx="${50 + fw}" cy="51" rx="4" ry="5.5" fill="${sk}"/>`);
  p.push(`<ellipse cx="50" cy="${a.build === 'chubby' ? 49 : 48}" rx="${fw}" ry="${a.build === 'chubby' ? 24.5 : a.build === 'slim' ? 24.5 : 24}" fill="${sk}"/>`);
  if (a.nose) p.push('<path d="M50 52 Q52.5 55.5 49.5 56.2" fill="none" stroke="#c98f74" stroke-width="1.3" stroke-linecap="round"/>');
  if (a.hair === 'curly') p.push(CURLS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}"/>`).join(''));
  else p.push(`<path d="${HAIR_FRONT[a.hair] || HAIR_FRONT.short}" fill="${hc}"${a.hair === 'buzz' ? ' opacity=".55"' : ''}/>`);
  // 볼터치
  p.push('<ellipse cx="36" cy="57" rx="4" ry="2.4" fill="#ff8a9a" opacity=".35"/><ellipse cx="64" cy="57" rx="4" ry="2.4" fill="#ff8a9a" opacity=".35"/>');
  const dot = x => `<circle cx="${x}" cy="50" r="2.3" fill="${ink}"/>`;
  const line = d => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`;
  if (a.face === 'smile') p.push(dot(41), dot(59), line('M44 59 Q50 65 56 59'));
  if (a.face === 'plain') p.push(dot(41), dot(59), line('M45 61 L55 61'));
  if (a.face === 'wink') p.push(dot(41), line('M56 50 Q59 47 62 50'), line('M44 59 Q50 64 56 59'));
  if (a.face === 'sleepy') p.push(line('M38 50 Q41 52.5 44 50'), line('M56 50 Q59 52.5 62 50'), `<ellipse cx="50" cy="61" rx="1.8" ry="2.2" fill="${ink}"/>`);
  if (a.face === 'proud') p.push(dot(41), dot(59), line('M37 44 L44 45'), line('M56 45 L63 44'), line('M44 59 Q51 63 57 57'));
  // 장면용 특징: 빨간 입술
  if (a.lips) p.push(`<path d="M43.5 59 Q50 66 56.5 59 Q50 61.5 43.5 59Z" fill="${a.lips}" stroke="${a.lips}" stroke-width="1.4" stroke-linejoin="round"/>`);
  if (a.acc === 'glasses') p.push(`<g fill="none" stroke="${ink}" stroke-width="1.6"><circle cx="41" cy="50" r="6"/><circle cx="59" cy="50" r="6"/><path d="M47 50 L53 50 M35 49 L29 47 M65 49 L71 47"/></g>`);
  if (a.acc === 'headband') p.push('<path d="M28 38 Q50 18 72 38" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/>');
  if (a.acc === 'bandage') p.push('<g transform="rotate(-20 64 57)"><rect x="57" y="54" width="14" height="6" rx="2" fill="#f1d3a8"/><rect x="62" y="54" width="4" height="6" fill="#e2bd8b"/></g>');
  if (a.acc === 'earphones') p.push('<circle cx="27" cy="53" r="3.2" fill="#fff" stroke="#bbb"/><circle cx="73" cy="53" r="3.2" fill="#fff" stroke="#bbb"/><path d="M27 56 L30 76 M73 56 L70 76" stroke="#ddd" stroke-width="1.4"/>');
  if (a.head && OUTFIT_HEAD[a.head]) p.push(OUTFIT_HEAD[a.head]);
  return `<svg class="avatar-svg" viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${p.join('')}</svg>`;
}
// 졸업 카드(캔버스)에 그릴 이미지
function avatarImage(av) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img); img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVG(av));
  });
}
