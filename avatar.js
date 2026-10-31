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
  const hairs = gender === 'f' ? ['bob', 'long', 'ponytail', 'short', 'curly'] : ['short', 'twoblock', 'curly', 'buzz', 'bob'];
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
  p.push(`<path d="${JACKET[a.build] || 'M14 100 Q17 80 37 76 L63 76 Q83 80 86 100Z'}" fill="#2e3f63"/>`, '<path d="M41 76 L50 90 L59 76Z" fill="#f4f6f8"/>', '<path d="M48 82 L52 82 L53 96 L50 99 L47 96Z" fill="#c23b2e"/>');
  p.push(`<rect x="44" y="64" width="12" height="14" rx="4" fill="${sk}"/>`);
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
