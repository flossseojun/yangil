// 관계 심화: 부탁과 보답 · 친구끼리 엮이는 합동 에피소드 · 방과후·주말 약속 잡기 (두 모드 공통)

/* ───────── 약속 장소 ───────── */
const PLACES = {
  noraebang: { name: '코인노래방', cost: 3000, text: n => `${n}${josa(n, '과', '와')} 코인노래방에 갔다. 마지막 곡은 둘이 목이 쉬도록 불렀다.` },
  pc:        { name: 'PC방', cost: 3000, text: n => `${n}${josa(n, '과', '와')} PC방에서 한 시간. 둘이 한 팀으로 연승을 달렸다.` },
  ttok:      { name: '학교 앞 떡볶이집', cost: 4000, text: n => `${n}${josa(n, '과', '와')} 떡볶이 1인분에 튀김을 추가했다. 국물에 김말이를 찍으며 별것 아닌 얘기로 웃었다.` },
  river:     { name: '남한강 둑길 산책', cost: 0, text: n => `${n}${josa(n, '과', '와')} 남한강 둑길을 걸었다. 노을이 강물에 번졌고, 평소에 못 하던 이야기가 나왔다.` },
  market:    { name: '양평 물맑은시장', cost: 3000, text: n => `${n}${josa(n, '과', '와')} 장날 시장을 돌았다. 호떡 하나씩 들고 구경하다 보니 해가 졌다.` },
  dumeori:   { name: '두물머리', cost: 2000, text: n => `주말, ${n}${josa(n, '과', '와')} 버스를 타고 두물머리에 갔다. 느티나무 아래서 강 두 개가 만나는 걸 한참 봤다.` },
  cafe:      { name: '읍내 카페', cost: 5000, text: n => `${n}${josa(n, '과', '와')} 읍내 카페 창가 자리에 앉았다. 음료 한 잔으로 두 시간을 버텼다.` },
};
// 친구마다 제일 좋아하는 장소 (대화 성향 + 이름으로 정한다)
const PLACE_BY_LIKES = { playful: ['noraebang', 'pc', 'ttok'], sincere: ['river', 'ttok', 'cafe'], curious: ['dumeori', 'market', 'cafe'] };
const PLACE_FIXED = { chaerin: 'cafe', taepung: 'pc', sori: 'market', jaemin: 'noraebang', jiyong: 'market', sia: 'dumeori', yunsu: 'pc', taeyeol: 'river', yejin: 'pc', seoan: 'market', mingyeol: 'noraebang', hyunwoo: 'pc', isan: 'ttok' };
function favPlace(id) {
  if (PLACE_FIXED[id]) return PLACE_FIXED[id];
  const pool = PLACE_BY_LIKES[CHARACTERS[id].likes] || PLACE_BY_LIKES.sincere;
  return pool[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % pool.length];
}
function hangout(id, place) {
  if (DATE_PLACES[place]) return dateOut(id, place);
  const p = PLACES[place], n = CHARACTERS[id].name;
  S.money = (S.money || 0) - p.cost;
  const liked = favPlace(id) === place;
  G.aff(id, liked ? 14 : 7); G.grow('social', 2); G.fat(-8);
  if (S.partner === id || S.crush === id) { S.love[id] = clamp(S.love[id] + (liked ? 12 : 6)); G.notes.push(`${n} 설렘 ${S.love[id]}`); loveTouch(id, 15); }
  // 연애 모드: 둘이서 시간을 보내다 보면 썸이 시작되기도 한다
  else if (!S.partner && !S.crush && canDate(S, id) && !S.loveNo[id] && S.aff[id] >= 25 && Math.random() < (liked ? 0.7 : 0.4)) {
    S.crush = id; S.love[id] = 40; G.achieve('first_love'); G.notes.push(`${n}${josa(n, '과', '와')} 썸 시작 ♡`);
    return p.text(n) + ` 헤어질 때 ${n}${josa(n, '이', '가')} "오늘 진짜 좋았어"라며 한참 손을 흔들었다. 집에 오는 길 내내 그 얼굴이 떠올랐다.`;
  }
  if (liked && !S.likedPlace[id]) { S.likedPlace[id] = true; G.notes.push(`${n}${josa(n, '이', '가')} 제일 좋아하는 곳: ${p.name}`); }
  S.flags.hangouts = (S.flags.hangouts || 0) + 1;
  return p.text(n) + (liked ? ` ${n}${josa(n, '이', '가')} "여기 내가 제일 좋아하는 데야!" 하며 눈을 반짝였다.` : '');
}

/* ───────── 부탁과 보답 ───────── */
const FAVORS = [
  { text: n => `${n}${josa(n, '이', '가')} 조심스럽게 묻는다. "다음 주 발표 자료, 같이 봐 줄 수 있어? 나 혼자는 자신이 없어서."`, yes: '같이 자료를 다듬는다', run: () => { G.grow('study', 1); G.fat(8); return '저녁까지 슬라이드를 고쳤다. 발표 연습 상대까지 해 줬다.'; } },
  { text: n => `"체육 수행평가 연습 상대가 필요한데… 혹시 시간 돼?" ${n}${josa(n, '이', '가')} 공을 들고 서 있다.`, yes: '연습 상대가 되어 준다', run: () => { G.grow('stamina', 2); G.fat(8); return '해 질 때까지 패스를 주고받았다. 둘 다 실력이 늘었다.'; } },
  { text: n => `${n}${josa(n, '이', '가')} 포스터 뭉치를 안고 있다. "동아리 행사 포스터 붙이는 거 도와줄 수 있어?"`, yes: '같이 붙이러 간다', run: () => { G.add('rep', 1); G.fat(6); return '층마다 포스터를 붙였다. 마지막 장은 둘이 같이 붙였다.'; } },
  { text: n => `"나 오늘 체육복을 안 가져왔어…" ${n}${josa(n, '이', '가')} 울상이다. 다음 시간이 체육이다.`, yes: '내 체육복을 빌려준다', run: () => { G.fat(4); return '나는 쉬는 시간에 집에서 여벌을 가져왔다. 숨이 찼지만 뿌듯했다.'; } },
  { text: n => `${n}${josa(n, '이', '가')} 휴대폰을 내민다. "동생 생일 선물 고르는 것 좀 봐 줄래? 뭘 좋아할지 모르겠어."`, yes: '같이 고른다', run: () => { G.grow('social', 2); return '쉬는 시간 내내 같이 고민했다. 결국 둘 다 마음에 드는 걸 찾았다.'; } },
  { text: n => `"내일 아침에 일찍 와서 교실 화분 물 주는 거, 나 대신 한 번만 해 줄 수 있어?" ${n}${josa(n, '이', '가')} 미안한 얼굴이다.`, yes: '알겠다고 한다', run: () => { G.fat(5); G.aff('teacher', 2); return '아침 일찍 화분에 물을 줬다. 텅 빈 교실이 생각보다 좋았다.'; } },
];
ev({ id: 'favor_ask', rel: true, relWeight: 7, title: '친구의 부탁',
  cond: s => FRIEND_IDS.some(id => s.met[id] && s.aff[id] >= 25 && !(s.favors[id] > 0)),
  setup: (s, c) => { const l = FRIEND_IDS.filter(id => s.met[id] && s.aff[id] >= 25 && !(s.favors[id] > 0)); c.who = l[Math.floor(Math.random() * l.length)]; c.k = Math.floor(Math.random() * FAVORS.length); },
  who: (s, c) => c.who,
  text: (s, c) => FAVORS[c.k].text(N(c.who)),
  choices: (s, c) => [
    { label: FAVORS[c.k].yes, hint: '나중에 중요한 순간에 보답이 돌아온다', run: (s, c) => { const r = FAVORS[c.k].run(); s.favors[c.who] = 1; G.aff(c.who, 6); G.notes.push(`${N(c.who)}${josa(N(c.who), '이', '가')} 이 일을 기억할 것 같다`); return r; } },
    { label: '오늘은 사정이 있다고 말한다', run: (s, c) => { G.fat(-3); return `"아냐, 괜찮아! 다음에 부탁할게." ${N2(c.who)} 웃으며 손을 흔들었다.`; } },
  ] });

// 부탁을 들어준 친구가 중요한 순간에 나타나 돕는다. kind별로 효과 크기와 문장이 다르다.
const PAYBACK = {
  exam:     { bonus: 4, text: n => `${n}${josa(n, '이', '가')} "저번에 고마웠어" 하며 직접 정리한 요약 노트를 건넸다.` },
  election: { bonus: 4, text: n => `${n}${josa(n, '이', '가')} 반마다 돌아다니며 지지 연설을 해 줬다.` },
  sports:   { bonus: 10, text: n => `출발 직전, ${n}${josa(n, '이', '가')} 다가와 신발 끈을 다시 묶어 주며 말했다. "저번에 도와준 거 갚는 거야."` },
  suneung:  { bonus: 3, text: n => `수능 날 새벽, ${n}에게서 메시지가 왔다. "네가 도와준 거 하나도 안 잊었어. 오늘 꼭 잘해!"` },
};
function payback(kind) {
  const id = FRIEND_IDS.find(f => S.met[f] && S.favors && S.favors[f] > 0);
  if (!id) return { bonus: 0, text: '' };
  S.favors[id] = 0; G.aff(id, 4); S.flags.paybacks = (S.flags.paybacks || 0) + 1;
  return { bonus: PAYBACK[kind].bonus, text: ' ' + PAYBACK[kind].text(CHARACTERS[id].name) };
}

/* ───────── 친구끼리 엮이는 합동 에피소드 ───────── */
const pairKey = (a, b) => [a, b].sort().join('|');
const DUO = [
  (a, b) => ({ text: `하굣길, ${N(a)}${josa(N(a), '과', '와')} ${N(b)}${josa(N(b), '이', '가')} 나를 사이에 두고 걷는다. 둘이 내 얘기로 한참 떠든다.`,
    choices: [['둘 사이에서 맞장구친다', '셋이 걷다 보니 버스를 두 대나 보냈다.'], ['편의점에서 셋이 아이스크림을 고른다', '셋이 고른 맛이 전부 달랐다. 한 입씩 바꿔 먹었다.']] }),
  (a, b) => ({ text: `${N(a)}${josa(N(a), '이', '가')} ${N(b)}에게 자기 특기를 가르쳐 주겠다며 나까지 불렀다. "${CHARACTERS[a].role}의 비법, 오늘 전수한다."`,
    choices: [['같이 배운다', `${N(b)}${josa(N(b), '이', '가')} 나보다 빨리 배웠다. ${N(a)}${josa(N(a), '이', '가')} 뿌듯해했다.`], ['조교를 맡는다', '셋이 하다 보니 수업이 아니라 놀이가 됐다.']] }),
  (a, b) => ({ text: `시험 전, ${N(a)}${josa(N(a), '과', '와')} ${N(b)}${josa(N(b), '이', '가')} 도서관 스터디룸을 잡았다며 나를 불렀다.`,
    choices: [['셋이 서로 문제를 내 준다', '서로 모르는 걸 설명하다 보니 셋 다 머리에 쏙쏙 들어왔다.'], ['간식 담당을 맡는다', '간식이 떨어질 때쯤 공부도 딱 끝났다.']] }),
  (a, b) => ({ text: `${N(a)}${josa(N(a), '과', '와')} ${N(b)}${josa(N(b), '이', '가')} 내 생일을 몰래 준비하다 딱 걸렸다. 둘 다 얼어붙었다.`,
    choices: [['모르는 척해 준다', '다음 날, 초코파이 케이크가 나왔다. 처음 보는 척 크게 놀랐다.'], ['같이 준비하자고 한다', '주인공이 직접 준비한 깜짝 파티. 셋이 배가 아프도록 웃었다.']] }),
  (a, b) => ({ text: `점심시간, ${N(a)}${josa(N(a), '과', '와')} ${N(b)}${josa(N(b), '이', '가')} 셋이 단체 사진을 찍자고 한다. "우리 셋 사진이 하나도 없잖아."`,
    choices: [['은행나무 아래서 찍는다', '셋 다 눈을 감은 사진이 제일 잘 나왔다. 그걸로 프로필 사진을 바꿨다.'], ['웃긴 포즈로 찍는다', '셋의 포즈가 약속도 안 했는데 똑같았다.']] }),
];
ev({ id: 'duo', rel: true, relWeight: 7, title: (s, c) => c.first ? '친구 소개하기' : `${N(c.a)} · ${N(c.b)}${josa(N(c.b), '과', '와')} 셋이서`,
  cond: s => FRIEND_IDS.filter(id => s.met[id] && s.aff[id] >= 20).length >= 2,
  setup: (s, c) => {
    const m = FRIEND_IDS.filter(id => s.met[id] && s.aff[id] >= 20).sort(() => Math.random() - 0.5);
    const pairs = []; m.forEach((a, i) => m.slice(i + 1).forEach(b => pairs.push([a, b])));
    pairs.sort((x, y) => (s.pairs[pairKey(...x)] || 0) - (s.pairs[pairKey(...y)] || 0));
    [c.a, c.b] = pairs[0]; c.first = !s.pairs[pairKey(c.a, c.b)]; c.k = Math.floor(Math.random() * DUO.length);
  },
  who: (s, c) => c.a,
  text: (s, c) => c.first ? `${N(c.a)}${josa(N(c.a), '과', '와')} 매점에 가는데 ${N(c.b)}${josa(N(c.b), '이', '가')} 지나간다. 둘 다 내 친구인데, 서로는 아직 잘 모른다.` : DUO[c.k](c.a, c.b).text,
  choices: (s, c) => (c.first ? [
    ['둘을 서로 소개해 준다', `"${CHARACTERS[c.a].role}"이랑 "${CHARACTERS[c.b].role}". 둘이 의외의 공통점으로 금방 말이 통했다. 소개해 준 보람이 있다.`],
    ['셋이 같이 매점에 간다', `매점 앞 벤치에서 셋이 빵을 나눠 먹었다. 헤어질 때 ${N(c.a)}${josa(N(c.a), '과', '와')} ${N(c.b)}${josa(N(c.b), '이', '가')} 번호를 교환했다.`],
  ] : DUO[c.k](c.a, c.b).choices).map(([label, res]) => ({ label, run: (s, c) => {
    const k = pairKey(c.a, c.b); s.pairs[k] = (s.pairs[k] || 0) + 1;
    G.aff(c.a, 5); G.aff(c.b, 5); G.grow('social', 2); G.fat(-4);
    if (s.pairs[k] === 3) G.notes.push(`${N(c.a)}·${N(c.b)}${josa(N(c.b), '과', '와')} 나, 이제 단짝 삼총사`);
    return res; } })) });
