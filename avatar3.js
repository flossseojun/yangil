// SD(꼬마) 그림체: 머리는 크게, 몸은 작게, 눈은 크고 반짝이게.
// 머리 모양·옷·소품 좌표는 avatar2.js 것을 그대로 쓰고, 머리 묶음과 몸 묶음을 따로 키우고 줄인다.
// 설정의 「예전 그림체」를 켜면 avatar2 그림으로 돌아간다.

const SD = { head: 1.25, headPivotY: 72, headShift: 10, body: 0.74 };
// 머리 묶음 좌표 → 화면 좌표 (팔 포즈를 머리 옆에 놓을 때 쓴다)
const sdHeadY = y => SD.headPivotY + (y - SD.headPivotY) * SD.head + SD.headShift;

function avatarSVG3(av, label = '내 아바타', opts = {}) {
  const a = Object.assign({ hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'none' }, av || {});
  const expr = opts.expr || a.face || 'smile', pose = opts.pose || null;
  const hc = a.hairColor, sk = a.skin, ink = '#2a2420';
  const hl = shade(hc, -0.35), skl = shade(sk, -0.22), brow = hc === '#e9e2d0' || hc === '#e3c068' ? shade(hc, -0.45) : shade(hc, -0.15);
  const fw = a.build === 'chubby' ? 25 : a.build === 'slim' ? 21.5 : 23.5;
  const body = [], head = [], arms = [];

  /* ── 몸 (작게) ── */
  const JACKET = { muscle: 'M8 100 Q10 74 34 72 L66 72 Q90 74 92 100Z', chubby: 'M10 100 Q13 76 35 74 L65 74 Q87 76 90 100Z', slim: 'M20 100 Q23 80 39 77 L61 77 Q77 80 80 100Z' };
  const jk = JACKET[a.build] || 'M15 100 Q18 79 37 76 L63 76 Q82 79 85 100Z';
  body.push(`<rect x="43" y="62" width="14" height="16" rx="5" fill="${sk}"/>`);
  if (a.top && typeof OUTFIT_TOP !== 'undefined' && OUTFIT_TOP[a.top]) body.push(OUTFIT_TOP[a.top](jk));
  else {
    body.push(`<path d="${jk}" fill="#2e3f63" stroke="#1f2b45" stroke-width="1.2"/>`);
    body.push('<path d="M40 76 L50 92 L60 76Z" fill="#f4f6f8" stroke="#c9d0d8" stroke-width=".6"/>');
    if (a.uni === 'ribbon') body.push('<g transform="translate(50 82)"><path d="M0 0 L-8 -5 L-8 5Z M0 0 L8 -5 L8 5Z" fill="#c23b2e"/><circle r="2.2" fill="#9e2e23"/></g>');
    else body.push('<path d="M47.6 81 L52.4 81 L53.4 95 L50 98.5 L46.6 95Z" fill="#c23b2e"/>');
    body.push('<rect x="25" y="86" width="11" height="4" rx="1" fill="#f4f6f8" opacity=".9"/>');
  }
  if (a.neck && typeof OUTFIT_NECK !== 'undefined' && OUTFIT_NECK[a.neck]) body.push(OUTFIT_NECK[a.neck]);

  /* ── 머리 (크게) ── */
  if (HAIR2_TOP[a.hair]) head.push(`<path d="${HAIR2_TOP[a.hair]}" fill="${hc}" stroke="${hl}" stroke-width="1"/>`);
  if (HAIR2_BACK[a.hair]) head.push(`<path d="${HAIR2_BACK[a.hair]}" fill="${hc}" stroke="${hl}" stroke-width="1" stroke-linejoin="round"/>`);
  // 동글동글한 얼굴: 아래가 살짝 넓은 찹쌀떡 모양
  const cy = 48, fy = 23.5;
  head.push(`<ellipse cx="${50 - fw + 0.5}" cy="53" rx="3.6" ry="4.8" fill="${sk}" stroke="${skl}" stroke-width="1"/><ellipse cx="${50 + fw - 0.5}" cy="53" rx="3.6" ry="4.8" fill="${sk}" stroke="${skl}" stroke-width="1"/>`);
  head.push(`<path d="M${50 - fw} ${cy} Q${50 - fw} ${cy - fy} 50 ${cy - fy} Q${50 + fw} ${cy - fy} ${50 + fw} ${cy} Q${50 + fw + 0.6} ${cy + fy * 0.92} 50 ${cy + fy} Q${50 - fw - 0.6} ${cy + fy * 0.92} ${50 - fw} ${cy}Z" fill="${sk}" stroke="${skl}" stroke-width="1"/>`);
  // 볼 (크고 진하게)
  const blush = expr === 'embarrassed' || expr === 'love' ? .75 : .5;
  head.push(`<ellipse cx="35.5" cy="60" rx="5.2" ry="3" fill="#ff8a9a" opacity="${blush}"/><ellipse cx="64.5" cy="60" rx="5.2" ry="3" fill="#ff8a9a" opacity="${blush}"/>`);
  if (expr === 'embarrassed') head.push('<path d="M32 59 l2 -1.6 M35.5 60 l2 -1.6 M61.5 59 l2 -1.6 M65 60 l2 -1.6" stroke="#e05a6d" stroke-width="1" opacity=".7"/>');

  // 눈썹 (짧고 동글게)
  const bw = a.brows === 'bold' ? 3.4 : 1.8;
  const browPath = {
    smile: ['M35.5 44 Q39.5 42.2 43.5 43.6', 'M56.5 43.6 Q60.5 42.2 64.5 44'], sad: ['M35.5 44 Q39.5 43.4 43.5 41.8', 'M56.5 41.8 Q60.5 43.4 64.5 44'],
    angry: ['M35.5 42 Q39.5 43 43.5 45.4', 'M56.5 45.4 Q60.5 43 64.5 42'], surprised: ['M35.5 41.5 Q39.5 39 43.5 41', 'M56.5 41 Q60.5 39 64.5 41.5'],
  }[a.brows === 'bold' && expr !== 'surprised' ? 'angry' : expr === 'embarrassed' ? 'sad' : expr === 'proud' ? 'angry' : expr] || ['M35.5 44 Q39.5 42.2 43.5 43.6', 'M56.5 43.6 Q60.5 42.2 64.5 44'];
  head.push(browPath.map(d => `<path d="${d}" stroke="${brow}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`).join(''));

  // 눈: 크고 세로로 긴 눈동자 + 큰 하이라이트 두 개
  const et = eyeTypeOf(a), irisC = shade(hc === '#1e1b1a' ? '#5a3a28' : hc, -0.1);
  const EX = [39, 61], EY = 53;
  const closed = (cx, up) => `<path d="M${cx - 4} ${up ? EY + 1.5 : EY - .5} Q${cx} ${up ? EY - 3.5 : EY + 3.5} ${cx + 4} ${up ? EY + 1.5 : EY - .5}" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const sdEye = (cx, side) => {
    const big = expr === 'surprised';
    const rx = big ? 5.2 : et === 'small' ? 3.6 : et === 'sharp' ? 4.6 : 4.8;
    const ry = big ? 6.4 : et === 'small' ? 4.4 : et === 'sharp' ? 4.8 : 5.8;
    const tilt = et === 'droop' ? side * 7 : et === 'sharp' ? -side * 9 : 0;
    const e = [`<g transform="rotate(${tilt} ${cx} ${EY})">`];
    e.push(`<ellipse cx="${cx}" cy="${EY}" rx="${rx}" ry="${ry}" fill="#1c1411"/>`);
    e.push(`<ellipse cx="${cx}" cy="${EY + ry * .28}" rx="${rx * .72}" ry="${ry * .62}" fill="${irisC}"/>`);
    e.push(`<circle cx="${cx + rx * .35}" cy="${EY - ry * .38}" r="${rx * .42}" fill="#fff"/><circle cx="${cx - rx * .38}" cy="${EY + ry * .45}" r="${rx * .2}" fill="#fff" opacity=".9"/>`);
    if (et === 'sharp') e.push(`<path d="M${cx - rx - .8} ${EY - ry * .55} L${cx + rx + .8} ${EY - ry * .8}" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`);
    if (et === 'droop') e.push(`<path d="M${cx - rx} ${EY - ry * .75} Q${cx} ${EY - ry - 1.2} ${cx + rx} ${EY - ry * .75}" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
    if (expr === 'proud') e.push(`<rect x="${cx - rx - 1}" y="${EY - ry - 1.5}" width="${rx * 2 + 2}" height="${ry + 1}" fill="${sk}"/><path d="M${cx - rx - .6} ${EY - .5} H${cx + rx + .6}" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`);
    if (a.lash) e.push(`<path d="M${cx + side * (rx - .2)} ${EY - ry * .55} l${side * 2.2} -1.8 M${cx + side * (rx * .45)} ${EY - ry * .92} l${side * 1.4} -2.2" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"/>`);
    e.push('</g>');
    return e.join('');
  };
  const heart = cx => `<path d="M${cx} ${EY + 4} l-4.6 -4.6 a2.8 2.8 0 0 1 4.6 -3.4 a2.8 2.8 0 0 1 4.6 3.4Z" fill="#e8455a"/><circle cx="${cx - 2.4}" cy="${EY - 2.4}" r=".9" fill="#fff" opacity=".8"/>`;
  if (expr === 'laugh') head.push(closed(EX[0], true), closed(EX[1], true));
  else if (expr === 'sleepy') head.push(closed(EX[0], false), closed(EX[1], false));
  else if (expr === 'love') head.push(heart(EX[0]), heart(EX[1]));
  else if (expr === 'wink') head.push(sdEye(EX[0], -1), closed(EX[1], true));
  else head.push(sdEye(EX[0], -1), sdEye(EX[1], 1));
  if (expr === 'sad') head.push(`<path d="M37 58 q-1.8 4.5 0 6.5 q1.8 -2 0 -6.5Z" fill="#7cc4f0"/><path d="M63 58 q-1.8 4.5 0 6.5 q1.8 -2 0 -6.5Z" fill="#7cc4f0"/>`);

  // 코는 아주 작게(점), 입은 작고 귀엽게
  head.push(`<ellipse cx="50" cy="58.4" rx=".9" ry=".6" fill="${skl}"${a.nose ? '' : ' opacity=".7"'}/>`);
  const lipC = a.lips || '#8a3b3b';
  const M = {
    smile: `<path d="M46.6 62 Q50 65.4 53.4 62" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    laugh: `<path d="M45.4 61 Q50 61.6 54.6 61 Q54 67.4 50 67.4 Q46 67.4 45.4 61Z" fill="#7a2e2e"/><path d="M46.8 65.4 Q50 63.4 53.2 65.4 Q50 67.4 46.8 65.4Z" fill="#ef8a8a"/>`,
    surprised: '<ellipse cx="50" cy="64" rx="2.2" ry="2.8" fill="#7a2e2e"/>',
    embarrassed: `<path d="M45.6 63 q1.1 -1.4 2.2 0 t2.2 0 t2.2 0 t2.2 0" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`,
    sad: `<path d="M46.8 64.6 Q50 61.8 53.2 64.6" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    angry: `<path d="M46.4 64 Q50 61.8 53.6 64 L52.4 65 Q50 63.8 47.6 65Z" fill="#7a2e2e" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>`,
    love: `<path d="M45.8 61.4 Q50 67 54.2 61.4 Q50 62.6 45.8 61.4Z" fill="#7a2e2e"/>`,
    proud: `<path d="M46.4 62.4 Q51 64.8 54.4 60.6" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
    sleepy: `<ellipse cx="50" cy="63.4" rx="1.5" ry="1.9" fill="${ink}"/>`,
    wink: `<path d="M46.4 61.6 Q50 66 53.6 61.6 Q50 63 46.4 61.6Z" fill="#7a2e2e"/>`,
    plain: `<path d="M47.4 63 L52.6 63" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`,
  };
  head.push(M[expr] || M.smile);
  if (a.lips && ['smile', 'plain', 'proud'].includes(expr)) head.push(`<path d="M46 61.6 Q50 66.2 54 61.6 Q50 63.2 46 61.6Z" fill="${lipC}" stroke="${lipC}" stroke-width="1.1" stroke-linejoin="round"/>`);

  // 앞머리 + 윤기
  if (a.hair === 'curly') {
    head.push(CURLS2.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}" stroke="${hl}" stroke-width="1"/>`).join(''));
  } else {
    head.push(`<path d="${HAIR2_FRONT[a.hair] || HAIR2_FRONT.short}" fill="${hc}"${a.hair === 'buzz' ? ' opacity=".6"' : ` stroke="${hl}" stroke-width="1" stroke-linejoin="round"`}/>`);
    if (a.hair !== 'buzz') head.push(`<path d="M33 31 Q40 24.5 49 23.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".32"/><circle cx="56" cy="24.4" r="1.3" fill="#fff" opacity=".28"/>`);
  }
  // 소품
  if (a.acc === 'glasses') head.push(`<g fill="none" stroke="${ink}" stroke-width="1.5"><circle cx="${EX[0]}" cy="${EY}" r="7.2"/><circle cx="${EX[1]}" cy="${EY}" r="7.2"/><path d="M46.7 51.5 Q50 50 53.3 51.5 M32.3 51 L27.5 49 M67.7 51 L72.5 49"/></g>`);
  if (a.acc === 'headband') head.push('<path d="M27 38 Q50 18 73 38" fill="none" stroke="#ffd23f" stroke-width="4.5" stroke-linecap="round"/>');
  if (a.acc === 'bandage') head.push('<g transform="rotate(-20 65 60)"><rect x="58" y="57" width="13" height="5.6" rx="2" fill="#f1d3a8"/><rect x="62.6" y="57" width="3.8" height="5.6" fill="#e2bd8b"/></g>');
  if (a.acc === 'earphones') head.push(`<circle cx="${50 - fw}" cy="55" r="3" fill="#fff" stroke="#bbb"/><circle cx="${50 + fw}" cy="55" r="3" fill="#fff" stroke="#bbb"/>`);
  if (a.head && typeof OUTFIT_HEAD !== 'undefined' && OUTFIT_HEAD[a.head]) head.push(OUTFIT_HEAD[a.head]);
  // 감정 표시
  if (expr === 'embarrassed') head.push('<path d="M75 34 q-3 5 0 7 q3 -2 0 -7Z" fill="#8fd0f5" stroke="#5aa9d8" stroke-width=".6"/>');
  if (expr === 'angry') head.push('<g transform="translate(73 29)" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M-3 -1 Q0 0 -1 -3 M1 -3 Q0 0 3 -1 M3 1 Q0 0 1 3 M-1 3 Q0 0 -3 1"/></g>');
  if (expr === 'surprised') head.push('<path d="M77 30 l4 -4 M79 36 h5 M23 30 l-4 -4 M21 36 h-5" stroke="#2a2420" stroke-width="1.4" stroke-linecap="round"/>');
  if (expr === 'love') head.push('<path d="M77 34 l-2.4 -2.4 a1.5 1.5 0 0 1 2.4 -1.8 a1.5 1.5 0 0 1 2.4 1.8Z" fill="#e8455a"/>');

  /* ── 팔 포즈 (화면 좌표: 머리 옆으로) ── */
  const sleeve = a.top && typeof OUTFIT_TOP !== 'undefined' && OUTFIT_TOP[a.top] ? ({ hoodie: '#9aa3ad', cardigan: '#d9c3a0', pe: '#2f7d5b', classtee: '#ffd23f', padding: '#26292d' })[a.top] : '#2e3f63';
  const hand = (x, y, r = 4.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${sk}" stroke="${skl}" stroke-width="1"/>`;
  if (pose === 'wave') arms.push(`<path d="M73 96 Q86 88 89 74" stroke="${sleeve}" stroke-width="7.5" fill="none" stroke-linecap="round"/>${hand(90, 70, 4.6)}<path d="M95 62 q3 3 2 7" stroke="${ink}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".6"/>`);
  if (pose === 'v') arms.push(`<path d="M72 97 Q84 92 85 82" stroke="${sleeve}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M83.4 77 L82 69.5 M87 77 L89.4 70" stroke="${sk}" stroke-width="2.8" stroke-linecap="round"/>${hand(85.2, 79, 4)}`);
  if (pose === 'hold') arms.push(`${hand(40, 96, 4)}${hand(60, 96, 4)}`);
  if (pose === 'cheer') arms.push(`<path d="M27 96 Q14 88 11 74" stroke="${sleeve}" stroke-width="7.5" fill="none" stroke-linecap="round"/>${hand(10, 70, 4.6)}<path d="M73 96 Q86 88 89 74" stroke="${sleeve}" stroke-width="7.5" fill="none" stroke-linecap="round"/>${hand(90, 70, 4.6)}`);

  const bodyT = `translate(50 100) scale(${SD.body}) translate(-50 -100)`;
  const headT = `translate(0 ${SD.headShift}) translate(50 ${SD.headPivotY}) scale(${SD.head}) translate(-50 -${SD.headPivotY})`;
  return `<svg class="avatar-svg" viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g transform="${bodyT}">${body.join('')}</g><g transform="${headT}">${head.join('')}</g>${arms.join('')}</svg>`;
}

// 게임 전체에 SD 그림체 적용 (설정에서 예전 그림체로 되돌릴 수 있다)
avatarSVG = (av, label, opts) => (typeof SETTINGS !== 'undefined' && SETTINGS.artOld ? avatarSVG2 : avatarSVG3)(av, label, opts);
