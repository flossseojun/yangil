// ⑥ 이야기: 2학년 2학기 ~ 3학년 1학기 연속 스토리(녹향제 기획단 / 자율동아리 대회),
// 2학년 2학기 해금(후배 챙기기 · 방송실), 3일 연속 콤보, 예전 선택을 기억하는 콜백.

/* ───────── 연속 스토리: 어떤 이야기가 시작될까 ───────── */
// 2학년 2학기 첫날까지의 활동 횟수로 정한다. 자율동아리가 없거나 동점이면 녹향제 기획단.
function arcScores(s) {
  const c = s.counts || {};
  return {
    fest: (c.talk || 0) + (c.hangout || 0) + (c.council || 0) * 1.5,
    club: (c.auto || 0) * 1.5 + (c.club || 0) + (c.explore || 0) * 0.5,
  };
}
function arcOf(s) {
  if (s.arc) return s.arc.kind;
  if (!(s.year === 2 && s.sem === 2)) return null;
  const sc = arcScores(s);
  const kind = s.autoClub && sc.club > sc.fest ? 'club' : 'fest';
  const crew = typeof topFriends === 'function' ? topFriends(s, 2) : [];
  s.arc = { kind, pts: 0, base: Object.assign({}, s.counts), crew, ch: 0 };
  return kind;
}
// 장이 열리는 날 (학년-학기 → 날짜 → 장)
const ARC_DAYS = { fest: { '2-2': { 1: 1, 4: 2, 7: 3 }, '3-1': { 1: 4, 4: 5, 6: 6 } }, club: { '2-2': { 1: 1, 4: 2, 7: 3 }, '3-1': { 1: 4, 4: 5, 7: 6 } } };
const ARC_NAME = { fest: '녹향제 기획단', club: '자율동아리 대회' };
function arcChapterOn(s, year, sem, day) {
  if (!(year === 2 && sem === 2) && !(year === 3 && sem === 1)) return 0;
  const kind = arcOf(s); if (!kind) return 0;
  return (ARC_DAYS[kind][`${year}-${sem}`] || {})[day] || 0;
}
const _arcSpecials = specialsFor;
specialsFor = function (year, sem, day) {
  const l = _arcSpecials(year, sem, day);
  if (typeof S === 'undefined' || !S || !S.stats) return l;
  if (year === 2 && sem === 2 && day === 1 && !S.seen.season2) l.unshift('season2');
  const ch = arcChapterOn(S, year, sem, day);
  if (ch) { const id = `arc_${S.arc.kind}_${ch}`; if (!S.seen[id]) l.splice(l[0] === 'season2' ? 1 : 0, 0, id); }
  return l;
};
['fest', 'club'].forEach(k => { for (let i = 1; i <= 6; i++) STORY_NAMES[`arc_${k}_${i}`] = `${ARC_NAME[k]} ${i}장`; });
STORY_NAMES.season2 = '새 시즌 시작';

// 함께하는 사람들
const crewOf = s => { const c = (s.arc && s.arc.crew) || []; return [c[0] || null, c[1] || null]; };
const crewName = (id, alt) => id ? N(id) : alt;
const AUTO_LEAD = { robotics: 'sion', squid: 'sia', seed: 'sihun', water: 'taeyeol' };
const leadOf = s => { const id = AUTO_LEAD[s.autoClub]; return id && typeof charInfo === 'function' && charInfo(id) && charInfo(id).name ? id : null; };
const arcPts = n => { if (S.arc) S.arc.pts += n; };
const memo = (k, v) => { S.memo = S.memo || {}; S.memo[k] = v; };
const josaN = (name, a, b) => `${name}${josa(name, a, b)}`;

/* ───────── 2학년 2학기 · 새 시즌 ───────── */
ev({ id: 'season2', type: 'story', once: true, title: '새 시즌 시작',
  text: s => `2학년 2학기 첫날. 교실 공기가 조금 달라졌다. 이제 나도 어엿한 선배다.\n\n【새로 열린 것】\n· 새 행동 「후배 챙기기」 — 1학년 후배들과 엮이는 사건이 생긴다\n· 새 탐험 장소 「방송실」 — 점심 방송의 비밀\n· 3일 연속 같은 행동을 하면 🔥콤보 보너스\n· 그리고 오늘부터, ${ARC_NAME[arcOf(s) || 'fest']} 이야기가 시작된다`,
  choices: [{ label: '좋아, 2학기 시작이다!', run: s => { G.add('rep', 1); return '가방을 고쳐 메고 교실 문을 열었다.'; } }] });

/* ───────── A. 녹향제 기획단 ───────── */
const FEST_CONCEPT = { retro: '레트로 오락실', river: '남한강 여름밤', horror: '공포 체험관' };
const festWhy = s => `그동안 친구들과 보낸 시간이 많아서였을까.`;
ev({ id: 'arc_fest_1', type: 'story', once: true, title: '녹향제 기획단 1장 · 제안',
  setup: (s, c) => { const [a] = crewOf(s); c.who = a || undefined; }, who: (s, c) => c.who,
  text: s => { const [a, b] = crewOf(s); return `${festWhy(s)} 학생회 선배가 복도에서 나를 불러 세웠다. "내년 녹향제 기획단, 너 해 볼래? 같이 할 사람도 데려와도 돼."\n\n${a ? `${josaN(N(a), '이', '가')} 옆에서 눈을 반짝인다.${b ? ` ${josaN(N(b), '도', '도')} 손을 번쩍 들었다.` : ''}` : '같은 반 친구 두 명이 옆에서 눈을 반짝인다.'}`; },
  choices: [
    { label: '"좋아요, 제대로 해 볼게요!"', run: s => { arcPts(2); G.add('rep', 2); crewOf(s).forEach(id => id && G.aff(id, 5)); return '그날 저녁, 단톡방 이름이 「녹향제 기획단 (비공식)」으로 바뀌었다.'; } },
    { label: '"친구들이랑 같이라면요."', run: s => { arcPts(1); crewOf(s).forEach(id => id && G.aff(id, 8)); G.grow('social', 2); return '"역시 너다." 친구들이 어깨동무를 했다. 이걸로 셋은 한 팀이다.'; } },
  ] });
ev({ id: 'arc_fest_2', type: 'story', once: true, title: '녹향제 기획단 2장 · 콘셉트 회의',
  text: s => { const [a, b] = crewOf(s); return `빈 교실 칠판에 아이디어가 가득하다. ${crewName(a, '친구 하나')}는 "레트로 오락실!", ${crewName(b, '다른 친구')}는 "남한강 여름밤!"을 외친다. 누군가 구석에 작게 "공포 체험관"이라고 썼다. 마지막 한 표는 내 몫이다.`; },
  choices: [
    { label: '레트로 오락실 — 추억의 게임 부스', run: s => { memo('concept', 'retro'); arcPts(G.check('social', 45) ? 3 : 2); G.add('luck', 2); return '"뿅뿅 효과음은 내가 만든다!" 회의가 순식간에 축제 분위기가 됐다.'; } },
    { label: '남한강 여름밤 — 조명과 버스킹', run: s => { memo('concept', 'river'); arcPts(G.check('study', 45) ? 3 : 2); G.grow('social', 2); return '은행나무길에 전구를 거는 그림을 그렸다. 다들 말없이 고개를 끄덕였다.'; } },
    { label: '공포 체험관 — 별관 빈 교실 통째로', run: s => { memo('concept', 'horror'); arcPts(G.check('luck', 45) ? 3 : 2); G.absurd(); return '"별관 빈 교실… 원래 좀 무섭잖아." 모두 동시에 소름이 돋았다. 결정이다.'; } },
  ] });
ev({ id: 'arc_fest_3', type: 'story', once: true, title: '녹향제 기획단 3장 · 예산 사고',
  text: s => `학생회실에서 전화가 왔다. "미안, 축제 예산이 반으로 깎였어." ${FEST_CONCEPT[(s.memo || {}).concept] || '우리 기획'}을 그대로 하려면 방법을 찾아야 한다.`,
  choices: [
    { label: '발로 뛴다 — 동네 가게를 돌며 재료 구하기', run: s => { const ok = G.check('stamina', 50); arcPts(ok ? 3 : 1); G.fat(10); G.grow('stamina', 2); return ok ? '양평 시장 사장님들이 남는 상자와 전구를 잔뜩 챙겨 주셨다. 다리는 아프지만 마음은 부자다.' : '하루 종일 걸었지만 상자 몇 개뿐. 그래도 시작은 시작이다.'; } },
    { label: '후원 편지를 쓴다 — 사교성으로 승부', run: s => { const ok = G.check('social', 50); arcPts(ok ? 3 : 1); G.grow('social', 3); return ok ? '정성껏 쓴 편지에 답장이 세 통이나 왔다. 예산이 거의 돌아왔다!' : '답장은 한 통. "응원합니다!"라는 말과 함께 초코파이 한 상자가 왔다.'; } },
    { label: '직접 만든다 — 골판지와 손재주', run: s => { const ok = G.check('study', 50); arcPts(ok ? 3 : 1); G.grow('study', 2); crewOf(s).forEach(id => id && G.aff(id, 4)); return ok ? '설계도를 그리고 골판지를 잘랐다. 사 온 것보다 멋있다는 말을 들었다.' : '조금 삐뚤빼뚤하지만, 우리 손으로 만든 첫 소품이 완성됐다.'; } },
  ] });
ev({ id: 'arc_fest_4', type: 'story', once: true, title: '녹향제 기획단 4장 · 후배 모집',
  text: '3학년이 됐다. 녹향제까지 한 달. 손이 모자라다. 1학년 후배들을 기획단으로 모셔 와야 한다.',
  choices: [
    { label: '포스터를 만들어 붙인다', run: s => { const ok = G.check('luck', 45); arcPts(ok ? 2 : 1); return ok ? '포스터 앞에 1학년들이 줄을 섰다. 다섯 명이 들어왔다!' : '두 명이 들어왔다. 둘 다 엄청 성실하다.'; } },
    { label: '1학년 교실을 직접 돌며 소개한다', run: s => { const ok = G.check('social', 55) || G.talent('talker'); arcPts(ok ? 3 : 1); G.add('rep', 2); return ok ? '"선배 멋있어요!" 교실 세 곳에서 박수가 터졌다. 후배 일곱 명 합류.' : '긴장해서 말이 꼬였지만, 그 모습이 친근했는지 세 명이 따라왔다.'; } },
    { label: '평소에 챙기던 후배들에게 부탁한다', run: s => { const n = (s.counts || {}).junior || 0; arcPts(n >= 3 ? 3 : 1); return n >= 3 ? '"선배가 부르면 당연히 가죠!" 그동안 챙긴 후배들이 친구들까지 데려왔다.' : '아는 후배가 한 명 있었다. 그 한 명이 의외로 일당백이다.'; } },
  ] });
ev({ id: 'arc_fest_5', type: 'story', once: true, title: '녹향제 기획단 5장 · 리허설 대참사',
  text: s => `녹향제 이틀 전 리허설. 무대 스피커에서 "삐이이이—" 하울링이 터지더니, 그대로 조명이 꺼졌다. 후배들이 일제히 나를 쳐다본다.${s.arc && s.arc.pts >= 9 ? ' 그래도 지금까지 준비를 잘해 와서인지, 이상하게 마음이 차분하다.' : ''}`,
  choices: [
    { label: '침착하게 순서표를 다시 짠다', run: s => { const ok = G.check('study', 50) || s.arc.pts >= 9; arcPts(ok ? 3 : 1); return ok ? '전기가 필요 없는 순서부터 앞으로 당겼다. 리허설이 오히려 더 매끄러워졌다.' : '순서표가 엉켰지만, 다 같이 붙어 앉아 밤 9시에 다시 맞췄다.'; } },
    { label: '즉석 MC로 분위기를 살린다', run: s => { const ok = G.check('social', 50) || G.talent('talker'); arcPts(ok ? 3 : 1); G.add('rep', 2); return ok ? '"여러분, 이건 연출입니다!" 어둠 속에서 웃음이 터졌다. 그사이 조명이 돌아왔다.' : '농담이 조금 썰렁했지만, 후배 하나가 박수를 쳐 줘서 살았다.'; } },
    { label: '무대 뒤로 뛰어가 전선을 정리한다', run: s => { const ok = G.check('stamina', 50); arcPts(ok ? 3 : 1); G.fat(8); return ok ? '엉킨 멀티탭을 하나씩 풀었다. 딸깍, 조명이 켜지자 함성이 터졌다.' : '30분이 걸렸지만 결국 찾아냈다. 범인은 발에 걸린 콘센트 하나였다.'; } },
  ] });
ev({ id: 'arc_fest_6', type: 'story', once: true, title: '녹향제 기획단 마지막 장 · 녹향제',
  text: s => `드디어 녹향제 당일. 우리가 만든 「${FEST_CONCEPT[(s.memo || {}).concept] || '기획'}」 앞에 사람들이 모이기 시작한다. 지난 1년이 머릿속을 스쳐 간다.`,
  choices: [
    { label: '친구들과 무대 뒤에서 손을 모은다', run: s => arcFinale(s, 'crew') },
    { label: '입구에 서서 손님을 맞이한다', run: s => arcFinale(s, 'host') },
  ] });

/* ───────── B. 자율동아리 대회 ───────── */
const CLUB_ARC = {
  robotics: { topics: [['line', '자율주행 라인트레이서'], ['arm', '분리수거 로봇팔'], ['queue', '급식 대기줄 측정 센서']], crash: '대회 2주 전, 모터 드라이버에서 연기가 피어올랐다. 시제품이 멈췄다.', fixer: '납땜 인두를 다시 잡는다' },
  squid: { topics: [['color', '갑오징어 체색 변화'], ['hatch', '알 인공 부화율'], ['auto', '수조 자동 관리 장치']], crash: '수조 히터가 고장 났다. 갑오징어들 색이 칙칙해지고, 실험 기록도 끊길 위기다.', fixer: '밤새 수온을 지킨다' },
  seed: { topics: [['germ', '토종 씨앗 발아율'], ['farm', '학교 텃밭 스마트팜'], ['leaf', '은행잎 퇴비 실험']], crash: '갑자기 서리가 내렸다. 텃밭 모종이 하얗게 얼어 버렸다.', fixer: '새벽에 나와 비닐을 덮는다' },
  water: { topics: [['do', '남한강 지점별 용존산소량'], ['rain', '비 온 뒤 탁도 변화'], ['micro', '남한강 미세플라스틱']], crash: '측정기 센서가 고장 났다. 한 달치 데이터가 비어 버릴 위기다.', fixer: '둑길을 걸어 손으로 시료를 뜬다' },
};
const clubArc = s => CLUB_ARC[s.autoClub] || CLUB_ARC.squid;
const clubNm = s => (AUTO_CLUBS[s.autoClub] || { name: '자율동아리' }).name;
const topicName = s => { const t = clubArc(s).topics.find(x => x[0] === (s.memo || {}).topic); return t ? t[1] : '우리 탐구'; };
ev({ id: 'arc_club_1', type: 'story', once: true, title: '자율동아리 대회 1장 · 공고문',
  setup: (s, c) => { c.who = leadOf(s) || undefined; }, who: (s, c) => c.who,
  text: s => { const l = leadOf(s); return `자율동아리에 쏟은 시간이 많아서였을까. ${l ? `${clubNm(s)} 부장 ${josaN(N(l), '이', '가')}` : `${clubNm(s)} 부장이`} 공고문 한 장을 들고 왔다.\n\n「경기도 고교 자율동아리 탐구 발표대회 — 참가팀 모집」\n\n"우리 이번엔 나가 보자. 너도 같이 할 거지?"`; },
  choices: [
    { label: '"당연하지. 우승하자!"', run: s => { arcPts(2); G.add('rep', 1); const l = leadOf(s); if (l) G.aff(l, 6); return '공고문을 동아리실 벽에 붙였다. 그 아래 누군가 "D-300"이라고 썼다.'; } },
    { label: '"일단 해 보자. 재밌을 것 같아."', run: s => { arcPts(1); G.add('luck', 2); G.grow('social', 1); return '부담 없이 시작했지만, 그날 집에 가는 길에 계속 탐구 주제를 생각했다.'; } },
  ] });
ev({ id: 'arc_club_2', type: 'story', once: true, title: '자율동아리 대회 2장 · 탐구 주제',
  text: s => `${clubNm(s)} 동아리실 화이트보드에 후보 주제 세 개가 적혀 있다. 대회까지 함께할 주제를 골라야 한다.`,
  choices: s => clubArc(s).topics.map(([k, nm], i) => ({ label: nm, run: s => { memo('topic', k); arcPts(G.check(['study', 'luck', 'social'][i], 45) ? 3 : 2); G.grow(['study', 'luck', 'social'][i], 2); return `「${nm}」. 칠판에 동그라미를 크게 쳤다. 첫 실험 계획서를 쓰는 손이 빨라진다.`; } })) });
ev({ id: 'arc_club_3', type: 'story', once: true, title: '자율동아리 대회 3장 · 실험 실패',
  text: s => clubArc(s).crash,
  choices: s => [
    { label: clubArc(s).fixer, run: s => { const ok = G.check('stamina', 50); arcPts(ok ? 3 : 1); G.fat(12); G.grow('stamina', 2); return ok ? '해가 뜰 때까지 버텼다. 다음 날 기록지에 빈칸이 하나도 없었다.' : '꾸벅꾸벅 졸았지만, 그래도 결정적인 순간은 놓치지 않았다.'; } },
    { label: '부원들에게 도움을 요청한다', run: s => { const l = leadOf(s), f = (AUTO_CLUBS[s.autoClub] || {}).friend; [l, f].forEach(id => id && S.aff[id] !== undefined && G.aff(id, 6)); const ok = G.check('social', 45); arcPts(ok ? 3 : 2); return `${f ? josaN(N(f), '이', '가') : '부원 한 명이'} 공구함을 들고 달려왔다. "혼자 하려고 했어? 우리 팀이잖아." ${ok ? '반나절 만에 다시 돌아갔다.' : '하루가 걸렸지만 다 같이 해냈다.'}`; } },
    { label: '실패 원인을 분석해 처음부터 다시 설계한다', run: s => { const ok = G.check('study', 55); arcPts(ok ? 3 : 1); G.grow('study', 3); if (ok) addSetuk('자율동아리', `자율동아리(${clubNm(s)}) 탐구 중 장비 고장의 원인을 분석하고 실험을 다시 설계해 오차를 줄임.`); return ok ? '실패 원인을 표로 정리했다. 오히려 실험이 더 탄탄해졌다.' : '다시 설계하느라 2주가 밀렸다. 그래도 같은 실수는 안 할 거다.'; } },
  ] });
ev({ id: 'arc_club_4', type: 'story', once: true, title: '자율동아리 대회 4장 · 새 부원',
  text: s => `3학년이 됐다. ${clubNm(s)}에 1학년 신입 부원들이 들어왔다. 대회까지 함께할지, 기록을 물려줄 준비를 할지 정해야 한다.`,
  choices: [
    { label: '후배들과 함께 실험을 나눠 맡는다', run: s => { const ok = G.check('social', 45) || ((s.counts || {}).junior || 0) >= 3; arcPts(ok ? 3 : 2); G.add('rep', 2); return ok ? '후배들이 측정을 맡아 주자 실험 속도가 두 배가 됐다.' : '처음엔 서툴렀지만, 한 달 뒤엔 후배들이 먼저 실험실 문을 열었다.'; } },
    { label: '내 탐구 노트를 후배들에게 정리해 준다', run: s => { arcPts(2); G.grow('study', 2); return '노트 첫 장에 "선배의 시행착오 모음"이라고 썼다. 후배들이 사진을 찍어 갔다.'; } },
  ] });
ev({ id: 'arc_club_5', type: 'story', once: true, title: '자율동아리 대회 5장 · 예선 발표',
  text: s => `예선 날. 「${topicName(s)}」 발표 5분 전. 심사위원 세 명이 펜을 들고 있다. 어떻게 풀어갈까?`,
  choices: [
    { label: '데이터와 그래프로 정면 승부', run: s => { const ok = G.check('study', 55) || s.arc.pts >= 9; arcPts(ok ? 3 : 1); return ok ? '그래프가 넘어갈 때마다 심사위원 펜이 바빠졌다. 예선 통과!' : '질문에 조금 버벅였지만, 데이터가 탄탄해서 겨우 통과했다.'; } },
    { label: '탐구 과정을 이야기처럼 풀어낸다', run: s => { const ok = G.check('social', 55) || G.talent('talker'); arcPts(ok ? 3 : 1); return ok ? '실패담에서 심사위원이 웃었다. "이런 과정이 진짜 탐구죠." 예선 통과!' : '이야기가 조금 길어졌지만, 진심은 전해졌다. 예선 통과.'; } },
    { label: '현장 시연을 준비한다', run: s => { const ok = G.check('luck', 50); arcPts(ok ? 3 : 1); G.add('luck', 1); return ok ? '시연이 한 번에 성공했다. 강당 뒤쪽에서 박수가 나왔다. 예선 통과!' : '시연이 한 번 멈췄지만, 침착하게 다시 해서 통과했다.'; } },
  ] });
ev({ id: 'arc_club_6', type: 'story', once: true, title: '자율동아리 대회 마지막 장 · 본선',
  text: s => `본선 무대. 「${topicName(s)}」 포스터 앞에 ${clubNm(s)} 부원들이 나란히 섰다. 1년 동안의 실험 노트가 손에 들려 있다.`,
  choices: [
    { label: '부원들과 눈을 맞추고 무대에 오른다', run: s => arcFinale(s, 'crew') },
    { label: '첫 문장을 마음속으로 한 번 더 외운다', run: s => arcFinale(s, 'host') },
  ] });

/* ───────── 결말 ───────── */
function arcReady(s) {
  const a = s.arc || { pts: 0, base: {} }, c = s.counts || {}, b = a.base || {};
  const d = k => Math.max(0, (c[k] || 0) - (b[k] || 0));
  const act = a.kind === 'club' ? (d('auto') + d('club')) * 0.7 : (d('talk') + d('hangout') + d('council') + d('junior')) * 0.45;
  return Math.round(a.pts + Math.min(8, act));
}
function arcFinale(s, how) {
  const r = arcReady(s), tier = r >= 18 ? 'great' : r >= 11 ? 'ok' : 'sad';
  s.arc.end = tier; memo('arcEnd', tier);
  const fest = s.arc.kind === 'fest', [a] = crewOf(s), lead = leadOf(s);
  const pal = fest ? (a ? N(a) : '친구') : (lead ? N(lead) : '부장');
  const open = how === 'crew' ? `${josaN(pal, '과', '와')} 손을 모았다. "하나, 둘, 셋 — 양일!" ` : '심호흡을 한 번 했다. ';
  if (tier === 'great') {
    G.add('rep', 6); G.grow('social', 3);
    if (fest) { G.achieve('arc_fest'); G.nick('녹향제의 설계자'); addSetuk('자율활동', `녹향제 기획단으로 「${FEST_CONCEPT[s.memo.concept] || '축제'}」 부스를 기획하고, 예산 삭감 상황에서 대안을 찾아 행사를 성공적으로 운영함.`); }
    else { G.achieve('arc_club'); G.nick('대회의 주역'); addSetuk('자율동아리', `자율동아리(${clubNm(s)})에서 「${topicName(s)}」를 주제로 1년간 탐구해 경기도 자율동아리 탐구 발표대회 본선에서 수상함.`); }
    return open + (fest ? '부스 앞 줄이 운동장까지 이어졌다. 축제가 끝나고, 학생회 선배가 말했다. "역대 최고의 녹향제였어." 후배들이 우리를 헹가래 쳤다.' : '발표가 끝나자 강당에 정적, 그리고 박수. 결과 발표에서 우리 이름이 불렸다. 「우수상」. 부원들이 서로를 끌어안았다.');
  }
  if (tier === 'ok') {
    G.add('rep', 3); G.add('luck', 2);
    return open + (fest ? '손님이 끊이지 않았다. 대단한 기록은 없었지만, 축제가 끝난 밤 운동장에 누워 다 같이 웃었다. "우리 꽤 잘했지?"' : '상은 못 받았지만, 심사위원이 따로 찾아와 말했다. "내년에 후배들이 이어 가면 좋겠어요." 노트를 후배에게 건넸다.');
  }
  G.grow('social', 2); G.add('luck', 3);
  return open + (fest ? '전구가 반쯤 안 켜졌고, 손님은 생각보다 적었다. 그래도 마지막 손님이 "여기 제일 재밌었어요!"라고 했다. 그 한마디에 다 같이 소리 내 웃었다.' : '본선에서 질문 하나에 말문이 막혔다. 결과는 아쉬웠지만, 돌아오는 버스에서 다들 실험 실패담으로 배가 아프게 웃었다. "그래도 재밌었다, 그치?"');
}
ACHIEVEMENTS.arc_fest = { name: '녹향제의 설계자', desc: '녹향제 기획단 이야기를 대성공으로 끝냈다' };
ACHIEVEMENTS.arc_club = { name: '대회의 주역', desc: '자율동아리 대회 이야기를 대성공으로 끝냈다' };

/* ───────── 명장면 컷 (마지막 장) ───────── */
if (typeof CUTSCENES !== 'undefined') {
  CUTSCENES.arc_fest_6 = s => { const [a, b] = crewOf(s); return [
    { bg: 'classroom', cast: [FR(a, 'smile', 'wave'), ME(s, 'proud'), FR(b, 'laugh', 'v')].filter(Boolean), cap: '1년 전, 빈 교실 칠판 앞에서 시작된 기획.', sfx: '' },
    { bg: 'ginkgo', cast: [ME(s, 'laugh', 'wave', true), FR(a, 'laugh', 'jump', true)].filter(Boolean), cap: '녹향제 당일, 은행나무길에 사람들이 모여든다.', sfx: SFX_TXT('오픈!', 248, 46, 8, 28) },
  ]; };
  CUTSCENES.arc_club_6 = s => { const l = leadOf(s); return [
    { bg: 'classroom', cast: [ME(s, 'plain'), FR(l, 'smile')].filter(Boolean), cap: '1년 치 실험 노트가 책 한 권이 됐다.', sfx: SFX_TXT('사각사각', 248, 58, 8, 20, '#1f2a24') },
    { bg: 'auditorium', cast: [ME(s, 'proud', 'stand', true), FR(l, 'smile', 'stand', true)].filter(Boolean), cap: '본선 무대. 조명이 우리를 비춘다.', sfx: SFX_TXT('두근', 246, 44, -6, 26, '#ff7aa2') },
  ]; };
}

/* ───────── 해금: 후배 챙기기 · 방송실 ───────── */
const season2 = s => s.year > 2 || (s.year === 2 && s.sem === 2);
ACTIONS.junior = { label: '후배 챙기기', mark: '후', hint: '사교성·평판↑ · 1학년 후배 사건', when: season2 };
LOCATIONS.broadcast = { name: '방송실', desc: '점심 방송 · 신청곡', locked: true, unlock: season2 };
if (typeof LOC_BG !== 'undefined') LOC_BG.broadcast = 'classback';
function extraAction(type) {
  if (type !== 'junior') return '';
  G.grow('social', 3); G.add('rep', 2); G.fat(8);
  if (Math.random() < 0.45) { const id = weighted(JUNIOR_EVS.filter(id => available(EVENTS[id])).map(id => ({ id, w: 1 }))); if (id && !S.queue.includes(id)) S.queue.push(id); }
  return pick(['1학년 복도를 지나다 길 잃은 후배에게 과학실 위치를 알려 줬다.', '매점에서 후배에게 소보로 대신 버터구이… 아니, 꿀팁 메뉴를 알려 줬다.', '후배들에게 1차 시험 기출 경향을 알려 줬다. "선배 천사예요."', '체육복을 안 가져온 후배에게 내 여벌을 빌려줬다.', '동아리 박람회 때 어디 가야 할지 고민하는 후배와 이야기했다.']);
}
ev({ id: 'jr_lost', type: 'junior', once: true, title: '길 잃은 1학년',
  text: '1학년 하나가 본관과 별관 사이에서 지도를 거꾸로 들고 있다. "저… 다목적관이 어디예요?"',
  choices: [
    { label: '직접 데려다준다', run: s => { G.add('rep', 2); G.grow('social', 1); return '가는 길에 학교 꿀팁을 다섯 개쯤 알려 줬다. 후배가 메모장을 꺼냈다.'; } },
    { label: '지도를 바로 들어 준다', run: s => { G.add('luck', 1); return '"아…" 후배 얼굴이 빨개졌다. 둘 다 웃음이 터졌다.'; } },
  ] });
ev({ id: 'jr_worry', type: 'junior', once: true, title: '후배의 고민 상담',
  text: '후배가 조심스럽게 말을 건다. "선배, 문과 이과… 아니, 선택과목 어떻게 정하셨어요?"',
  choices: [
    { label: '진지하게 내 경험을 이야기한다', run: s => { G.grow('social', 2); G.add('rep', 2); return '30분 동안 이야기했다. 후배가 "이제 좀 알 것 같아요"라며 꾸벅 인사했다.'; } },
    { label: '"좋아하는 거 해. 그게 제일 오래 가."', run: s => { G.add('luck', 2); return '한마디였지만 후배 눈이 반짝였다. 나도 1학년 때 이런 말을 듣고 싶었다.'; } },
  ] });
ev({ id: 'jr_exam', type: 'junior', once: true, title: '시험 기간의 후배들',
  text: '도서관에서 1학년 셋이 같은 문제를 붙잡고 끙끙대고 있다.',
  choices: [
    { label: '같이 앉아서 풀어 준다', run: s => { G.grow('study', 2); G.add('rep', 2); return '설명하다 보니 나도 개념이 더 확실해졌다. 가르치는 게 최고의 공부다.'; } },
    { label: '간식을 사다 준다', run: s => { s.money = Math.max(0, (s.money || 0) - 1500); G.add('rep', 3); return '"선배… 평생 따를게요." 초코우유 세 개의 위력이다.'; } },
  ] });
ev({ id: 'jr_cheer', type: 'junior', once: true, title: '후배들의 응원',
  cond: s => s.year === 3,
  text: '책상 위에 포스트잇이 붙어 있다. 「선배 화이팅! 그동안 챙겨 주셔서 감사해요 — 1학년 일동」',
  choices: [{ label: '포스트잇을 다이어리에 붙인다', run: s => { G.fat(-10); G.add('rep', 2); return '오늘 하루는 피곤하지 않을 것 같다.'; } }] });
const JUNIOR_EVS = ['jr_lost', 'jr_worry', 'jr_exam', 'jr_cheer'];

ev({ id: 'bc_request', type: 'daily', loc: 'broadcast', once: true, title: '점심 방송 신청곡',
  text: '방송부원이 신청곡 상자를 내민다. "오늘 신청곡이 하나도 없어서요. 선배가 골라 주실래요?"',
  choices: [
    { label: '신나는 노래를 고른다', run: s => { G.add('rep', 2); G.fat(-5); return '노래가 나오자 급식실에서 박수 소리가 들렸다.'; } },
    { label: '잔잔한 노래를 고른다', run: s => { G.fat(-10); return '점심시간 복도가 잠깐 조용해졌다. 다들 창밖을 봤다.'; } },
  ] });
ev({ id: 'bc_mic', type: 'daily', loc: 'broadcast', once: true, title: '켜져 있던 마이크',
  text: '방송실에 들어가 혼잣말을 했다. "아 배고프다…" 그런데 마이크 불이 빨갛게 켜져 있다.',
  choices: [
    { label: '"…지금까지 양일 라디오였습니다!"', run: s => { G.add('rep', 3); G.absurd(); G.nick('방송 사고 생존자'); return '전교생이 들었다. 다음 날부터 복도에서 "배고프다 선배"라고 불렸다.'; } },
    { label: '조용히 마이크를 끈다', run: s => { G.add('luck', 1); return '아무도 못 들었기를… 다음 날 아무도 말이 없었다. 다행이다. 아마도.'; } },
  ] });
ev({ id: 'bc_story', type: 'daily', loc: 'broadcast', once: true, title: '사연 하나',
  text: '사연함에 쪽지 하나. 「친구랑 싸웠는데 먼저 사과하기 어려워요.」 방송부원이 나를 본다. "선배가 답장 써 주실래요?"',
  choices: [
    { label: '정성껏 답장을 쓴다', run: s => { G.grow('social', 3); return '다음 날 사연함에 또 쪽지가 있었다. 「화해했어요. 감사합니다!」'; } },
    { label: '노래로 대신 답한다', run: s => { G.add('luck', 2); return '사과 노래를 틀었다. 어느 반에서 "미안해!"라는 외침이 들렸다.'; } },
  ] });
ev({ id: 'bc_old', type: 'daily', loc: 'broadcast', once: true, title: '오래된 테이프',
  text: '방송실 서랍 깊은 곳에서 카세트테이프가 나왔다. 라벨: 「녹향제 2010」.',
  choices: [{ label: '틀어 본다', run: s => { G.add('luck', 2); G.grow('social', 1); return '지지직 소리 사이로 옛 선배들의 함성이 들렸다. 은행나무는 그때도 있었겠지.'; } }] });

/* ───────── 콤보: 3일 연속 같은 행동 ───────── */
const COMBO_NAME = { study: '자습', exercise: '운동' };
function comboKey(type, arg) { return type === 'talk' && arg && arg !== 'teacher' ? `talk:${arg}` : COMBO_NAME[type] ? type : null; }
function comboStep(key) {
  const st = (S.streak = S.streak || {})[key] = S.streak[key] || { last: -9, n: 0 };
  if (st.last === S.dayNo) return 0;
  st.n = st.last === S.dayNo - 1 ? st.n + 1 : 1; st.last = S.dayNo;
  if (st.n >= 3) { st.n = 0; return 3; }
  return st.n;
}
const _comboPerform = performAction;
performAction = function (type, arg, mult = 1, note = '', info = {}) {
  let bonus = '';
  if (type === 'study' && S.buffFocus) { S.buffFocus = false; mult *= 2; bonus = '🔥 몰입 상태! 이번 자습 효과 2배'; }
  const key = comboKey(type, arg), n = key ? comboStep(key) : 0;
  _comboPerform(type, arg, mult, note, info);
  const add = [];
  if (bonus) add.push(bonus);
  if (n === 3) {
    if (type === 'study') { S.buffFocus = true; add.push('🔥 3일 연속 자습 콤보! 「몰입」: 다음 자습 효과 2배'); }
    else if (type === 'exercise') { S.buffCond = true; add.push('🔥 3일 연속 운동 콤보! 「컨디션 최고」: 오늘 밤 피로 회복 +15'); }
    else if (type === 'talk') { S.comboWho = arg; add.push(`🔥 3일 연속 대화 콤보! ${N(arg)}의 특별한 이야기`); if (!S.queue.includes('combo_talk')) S.queue.push('combo_talk'); }
    SFX.play('levelup');
  }
  if (add.length && S.result) S.result.notes = (S.result.notes || []).concat(add);
  if (n === 3 && type === 'talk') nextEvent();
  if (add.length) { save(); render(); }
};
const _comboEndDay = endDay;
endDay = function () {
  if (!S.cur && S.buffCond) { S.buffCond = false; G.fat(-15); }
  return _comboEndDay();
};
REPEATABLE.add('combo_talk');
const COMBO_TALK = [
  w => `사흘 내내 이야기를 나눠서일까. ${josaN(N(w), '이', '가')} 쉬는 시간에 먼저 내 자리로 왔다. "요즘 너랑 얘기하는 게 하루 중 제일 재밌어."`,
  w => `${josaN(N(w), '이', '가')} 매점 앞에서 손을 흔든다. "오늘은 내가 살게. 요즘 너한테 고마운 게 많아서."`,
  w => `방과후, ${josaN(N(w), '이', '가')} 은행나무길 벤치에 앉아 있다. "잠깐 앉을래? 너한테만 하고 싶은 얘기가 있어."`,
  w => `${josaN(N(w), '이', '가')} 내 책상에 쪽지를 놓고 갔다. 「3일 연속 수다 기념. 내일도 하자.」`,
];
ev({ id: 'combo_talk', type: 'combo', title: (s, c) => `${N(c.w)}의 특별한 이야기`,
  cond: s => !!s.comboWho, who: (s, c) => c.w,
  setup: (s, c) => { c.w = s.comboWho; s.comboWho = null; c.t = Math.floor(Math.random() * COMBO_TALK.length); },
  text: (s, c) => COMBO_TALK[c.t || 0](c.w),
  choices: [
    { label: '끝까지 진지하게 들어 준다', run: (s, c) => { const w = c.w; G.aff(w, 10); G.grow('social', 2); return `이야기가 끝나자 ${josaN(N(w), '이', '가')} 환하게 웃었다. "역시 너한테 말하길 잘했다."`; } },
    { label: '장난으로 분위기를 띄운다', run: (s, c) => { const w = c.w; G.aff(w, 8); G.add('luck', 2); return `둘 다 웃다가 종이 울렸다. ${josaN(N(w), '이', '가')} "내일도 이 시간!" 하고 뛰어갔다.`; } },
  ] });
// 콤보 칸: 진행 중인 연속 기록을 행동 버튼 위에 보여 준다
function comboBarHtml() {
  const st = S.streak || {}, chips = [];
  Object.entries(st).forEach(([k, v]) => { if (v.n > 0 && v.last >= S.dayNo - 1) chips.push(`<span class="combo-chip">🔥 ${k.startsWith('talk:') ? esc(N(k.slice(5))) + ' 대화' : COMBO_NAME[k]} ${v.n}/3${v.last === S.dayNo ? ' ✓' : ''}</span>`); });
  if (S.buffFocus) chips.push('<span class="combo-chip on">몰입: 다음 자습 ×2</span>');
  if (S.buffCond) chips.push('<span class="combo-chip on">컨디션 최고: 오늘 밤 회복↑</span>');
  return chips.length ? `<div class="combo-bar" aria-label="연속 기록">${chips.join('')}</div>` : '';
}
const _comboRender = render;
render = function () {
  _comboRender();
  if (UI.screen !== 'game' || !S) return;
  const a = document.querySelector('.actions'); const h = comboBarHtml();
  if (a && h && !document.querySelector('.combo-bar')) a.insertAdjacentHTML('beforebegin', h);
};

/* ───────── 콜백: 예전 선택을 기억하기 ───────── */
function callbackLines(s) {
  const m = s.memo || {}, l = [];
  if (m.concept) l.push(`녹향제 때 「${FEST_CONCEPT[m.concept]}」 하자고 한 거, 아직도 생각나.`);
  if (m.topic) l.push(`「${topicName(s)}」 실험하던 동아리실 냄새, 가끔 생각나더라.`);
  if (m.arcEnd === 'great') l.push(s.arc && s.arc.kind === 'club' ? '대회에서 우리 이름 불렸을 때, 진짜 소름 돋았어.' : '그 녹향제, 아직도 학교에서 전설이래.');
  if (m.arcEnd === 'sad') l.push('그때 망했던 거, 지금 생각하면 제일 웃긴 추억이야.');
  if ((s.ach || []).includes('yleague')) l.push('Y리그 결승 마지막 골, 그거 아직도 돌려 봐.');
  if ((s.bossLog || []).some(b => b.win)) l.push('너 시험 전에 진짜 무슨 보스랑 싸우는 사람 같았어.');
  if (s.flags && s.flags.president) l.push('전교회장 연설하던 날, 맨 앞에서 박수 친 거 나야.');
  if ((s.counts || {}).junior >= 3) l.push('후배들이 아직도 너 얘기 해. "그 선배 진짜 착했다고."');
  return l;
}
const _cbLine = charLine;
charLine = function (id, aff) {
  const l = typeof S !== 'undefined' && S && S.stats && id !== 'teacher' && aff >= 40 ? callbackLines(S) : [];
  if (l.length && Math.random() < 0.15) { S.cbUsed = S.cbUsed || {}; const fresh = l.filter(x => !S.cbUsed[x]); if (fresh.length) { const x = pick(fresh); S.cbUsed[x] = 1; return `그때 기억나? ${x}`; } }
  return _cbLine(id, aff);
};
const _cbRolling = rollingList;
rollingList = function (s) {
  const list = _cbRolling(s), l = callbackLines(s);
  let i = 0;
  return list.map(r => (r.id !== 'teacher' && i < l.length && i < 3) ? Object.assign({}, r, { msg: `${r.msg} ${l[i++]}` }) : r);
};
const _cbSave = saveRecord;
saveRecord = function (s, j) {
  const rec = _cbSave(s, j);
  if (s.arc && s.arc.end) {
    rec.arc = { kind: s.arc.kind, end: s.arc.end, what: s.arc.kind === 'fest' ? FEST_CONCEPT[(s.memo || {}).concept] || '' : topicName(s) };
    const recs = loadRecords(); if (recs[0] && recs[0].no === rec.no) { recs[0].arc = rec.arc; store.set(REC_KEY, recs); }
  }
  return rec;
};
const ARC_EPI = {
  fest: { great: w => `고3 녹향제 「${w}」는 지금도 양일고 역대 최고의 축제로 불린다.`, ok: w => `고3 녹향제 「${w}」 사진은 아직도 휴대폰 배경화면이다.`, sad: w => `반쯤 안 켜진 전구의 「${w}」. 동창회 때마다 다들 그 얘기로 웃는다.` },
  club: { great: w => `「${w}」 탐구로 받은 우수상 상장은 지금 내 책상 위에 있다.`, ok: w => `「${w}」 탐구 노트는 후배들이 이어서 쓰고 있다고 한다.`, sad: w => `「${w}」 발표 날 말문이 막혔던 기억은, 이제 제일 좋아하는 이야깃거리다.` },
};
if (typeof renderEpilogue === 'function') {
  const _cbEpi = renderEpilogue;
  renderEpilogue = function (r) {
    const html = _cbEpi(r);
    if (!r || !r.arc || !ARC_EPI[r.arc.kind]) return html;
    const line = `<p class="epi-arc">${esc(ARC_EPI[r.arc.kind][r.arc.end](r.arc.what || ARC_NAME[r.arc.kind]))}</p>`;
    return html.includes('</p>') ? html.replace(/(<p class="epi-me">[\s\S]*?<\/p>)/, `$1${line}`) : html + line;
  };
}
