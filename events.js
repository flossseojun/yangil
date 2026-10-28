// 이벤트 데이터. type: daily(일상) · absurd(병맛) · rare(희귀) · meet(첫 만남) · char(친구 전용) · story(학사 일정)
// 선택지의 run(s, c)은 G 헬퍼로 상태를 바꾸고 결과 문장을 돌려준다. 능력치 변화는 화면에 자동으로 표시된다.
const EVENTS = {};
// mode: 'classic'(연애 모드)·'real'(실제 친구 모드) 중 한쪽에서만 일어나는 사건
function ev(def) {
  if (def.mode) { const c0 = def.cond, m = def.mode; def.cond = s => s.mode === m && (!c0 || c0(s)); }
  EVENTS[def.id] = Object.assign({ type: 'daily', weight: 1, once: false }, def);
}

const LOCATIONS = {
  library: { name: '도서관', desc: '조용한 서가 · 시험 정보' },
  store:   { name: '매점', desc: '빵 전쟁 · 소문의 본부' },
  field:   { name: '운동장', desc: '즉석 대결 · 땀' },
  ginkgo:  { name: '은행나무길', desc: '교목 은행나무 · 교훈석' },
  empty:   { name: '별관 빈 교실', desc: '아무도 없는… 정말?' },
  roof:    { name: '본관 옥상', desc: '출입 금지 구역', locked: true },
};

const anyFriend = s => FRIEND_IDS.some(id => s.met[id]);
const pickFriend = s => { const m = FRIEND_IDS.filter(id => s.met[id]); return m[Math.floor(Math.random() * m.length)]; };
const N = id => charInfo(id).name;
const N2 = id => `${N(id)}${josa(N(id), '이', '가')}`;

// 2025년 교내 동아리 현황 (학교 안내 책자). 분야별 설명과 효과는 게임용 설정이다.
const CLUB_FIELDS = {
  '국어': { stat: 'study', desc: '독서·글쓰기 · 공부↑', clubs: ['진로독서부', '샘누리부', '전공독서활동기록부', '스토리창작부', '독서토론동아리', '학보편집부', '창작동아리'] },
  '수학·공학': { stat: 'study', desc: '수학·공학 탐구 · 공부↑', clubs: ['마천루', '건축디자인부', '아두이노', '소나', '회계경영부'] },
  '영어·제2외국어': { stat: 'social', desc: '외국어·영상 제작 · 사교성↑', clubs: ['영자신문부', '중국문화영상제작'] },
  '사회·문화': { stat: 'social', desc: '토론·국제 이슈 · 사교성↑', clubs: ['세계 사회문화 탐구부', '국제교류동아리', '모의 유엔부', '경제경영탐구부', '인터렉트', '국제외교부', '법경제연구부'] },
  '과학': { stat: 'study', desc: '실험·탐구 · 공부↑ · 과학의 날 발표', clubs: ['프론티어', '과학탐구부', '올사이언스', '홀리물리', '프롤로그1', '프롤로그2', '과학연구실험부'] },
  '진로': { stat: 'rep', desc: '진로 탐색·상담·홍보 · 평판↑', clubs: ['또래상담부', 'TOT', '메디하트', '진로심화탐구부', '교수학습연구부', '방송부', '학교홍보부', '하티핸즈', '과학수학진로탐구부'] },
  '봉사': { stat: 'rep', desc: '봉사·캠페인 · 평판↑', clubs: ['설레임 카페', '투게더', '터닝리더부'] },
  '예체능': { stat: 'stamina', desc: '운동·예술 · 체력↑', clubs: ['보디빌딩부', '크리에이티브', '음악연주부', '배드민턴'] },
};
// 특별한 효과가 있는 동아리
const CLUB_SPECIAL = {
  '음악연주부': { tag: 'band', stat: 'social', desc: '밴드 합주 · 녹향제·양스킹 무대 보너스' },
  '보디빌딩부': { tag: 'sport', desc: '체력 훈련 · 체대 입시 준비 · Y리그 보너스' },
  '배드민턴': { tag: 'sport', desc: '배드민턴 · 체육한마당·Y리그 보너스' },
  '학보편집부': { tag: 'paper', stat: 'rep', desc: '학교신문 양일학보 편집 · 평판↑' },
  '영자신문부': { tag: 'paper', desc: '영자신문 VOTIY · 사교성↑' },
  '방송부': { tag: 'paper', desc: '교내 방송 · 평판↑' },
  '학교홍보부': { tag: 'paper', desc: '학교 홍보 콘텐츠 제작 · 평판↑' },
  '메디하트': { tag: 'medic', stat: 'study', desc: '의료·보건 진로 탐구 · 간호·의생명 계열' },
  '과학수학진로탐구부': { tag: 'science', stat: 'study', desc: '과학·수학 진로 탐구 · 과학의 날 발표' },
  '아두이노': { tag: 'science', desc: '아두이노 제작 · 공학 탐구' },
  '교수학습연구부': { tag: 'teach', stat: 'study', desc: '교육 멘토링 · 교육 계열 진로' },
};
const CLUB_WIN = { band: '앵콜이 세 번이나 나왔다.', sport: '시범 경기에서 관객석이 들썩였다.', paper: '특집 기사가 교육청 학생 기자상을 받았다.', science: '"버섯 균사체 포장재" 탐구로 심사위원을 놀라게 했다.', medic: '응급처치 시연이 실제처럼 생생했다는 평을 받았다.' };
const CLUBS = {};
Object.entries(CLUB_FIELDS).forEach(([field, f]) => f.clubs.forEach(name => {
  const sp = CLUB_SPECIAL[name] || {};
  CLUBS[name] = { name, field, stat: sp.stat || f.stat, tag: sp.tag || (field === '과학' ? 'science' : field), desc: sp.desc || f.desc,
    welcome: `${name} 선배들이 박수로 맞아 줬다.`, win: CLUB_WIN[sp.tag || (field === '과학' ? 'science' : '')] || '준비한 발표가 큰 박수를 받았다.' };
}));
const clubTag = s => s.club && CLUBS[s.club] ? CLUBS[s.club].tag : null;

/* ───────── 일상 이벤트 ───────── */
ev({ id: 'bread_last', title: '매점 마지막 빵', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); },
  who: (s, c) => c.who,
  text: (s, c) => `매점 진열대에 남은 소보로빵은 단 하나. 동시에 손을 뻗은 사람은… ${N(c.who)}였다. 눈이 마주쳤다.`,
  choices: [
    { label: '양보한다', run: (s, c) => { G.aff(c.who, 9); G.grow('social', 2); return `${N(c.who)}가 빵을 반으로 갈라 줬다. 반쪽짜리 빵이 이상하게 더 맛있다.`; } },
    { label: '먼저 계산한다', run: (s, c) => { G.fat(-12); G.aff(c.who, -4); G.flag('breadWins'); return '빵은 내 것이 되었다. 피로가 풀리지만… 뒤통수가 따갑다.'; } },
    { label: '가위바위보로 정하자', hint: '운 판정', run: (s, c) => {
      if (G.check('luck', 45)) { G.fat(-12); G.aff(c.who, 3); G.flag('breadWins'); return '보자기로 이겼다! 정정당당한 승리라 아무도 서운하지 않다.'; }
      G.aff(c.who, 5); return '주먹을 냈다가 졌다. 그래도 승부는 승부. 친구가 웃으며 한 입 준다.'; } },
  ] });

ev({ id: 'homework', title: '숙제를 안 했다', text: '1교시 시작 5분 전, 오늘이 수학 숙제 검사라는 걸 깨달았다.',
  choices: [
    { label: '친구에게 빌린다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 4); G.add('rep', -1); return `${N2(w)} 노트를 쓱 내밀었다. "다음엔 네가 나 빌려줘."`; } },
    { label: '솔직하게 말한다', run: s => { G.aff('teacher', 5); G.add('rep', -1); return '"…솔직해서 봐준다. 내일까지." 철벽에 금이 간 소리가 들렸다.'; } },
    { label: '5분 만에 푼다', hint: '공부 판정', run: s => {
      if (G.check('study', 55)) { G.grow('study', 3); G.fat(8); return '손이 보이지 않는 속도로 풀었다. 전부 정답이었다.'; }
      G.fat(10); G.aff('teacher', -3); return '절반도 못 풀었다. 노트엔 의미를 알 수 없는 낙서만 남았다.'; } },
  ] });

ev({ id: 'rain', title: '갑작스러운 소나기', text: '하교 시간, 하늘이 뚫린 듯 비가 쏟아진다. 우산은 집에 있다.',
  choices: [
    { label: '그냥 뛴다', run: s => { G.grow('stamina', 2); G.fat(8); return '빗속을 질주했다. 청춘 영화 한 장면 같았지만 감기 기운이 온다.'; } },
    { label: '친구 우산을 같이 쓴다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 7); return `${N(w)}의 작은 우산 아래, 둘 다 반쯤 젖었지만 수다는 끊이지 않았다.`; } },
    { label: '비가 그칠 때까지 공부한다', run: s => { G.grow('study', 2); return '도서관 창가에서 빗소리를 들으며 단어 30개를 외웠다.'; } },
  ] });

ev({ id: 'quiz', title: '기습 쪽지시험', text: '"책 덮어라. 쪽지시험이다." 교실에 비명이 울려 퍼진다.',
  choices: [
    { label: '정면 돌파', hint: '공부 판정', run: s => {
      if (G.check('study', 50)) { G.add('rep', 2); G.aff('teacher', 3); return '만점! 선생님이 처음으로 고개를 끄덕였다.'; }
      G.add('rep', -1); return '빈칸이 너무 많아서 시험지가 눈부시게 하얗다.'; } },
    { label: '감으로 찍는다', hint: '운 판정', run: s => {
      if (G.check('luck', 50)) { G.add('luck', 1); return '모르는 문제를 전부 찍었는데 다 맞았다. 운이 실력이다.'; }
      return '찍은 번호가 정확히 하나씩 밀려 있었다.'; } },
  ] });

ev({ id: 'cleaning', title: '청소 당번', text: '오늘은 교실 청소 당번. 다들 빗자루를 기타처럼 들고 있다.',
  choices: [
    { label: '성실하게 한다', run: s => { G.add('rep', 2); G.aff('teacher', 3); G.fat(6); return '창틀 먼지까지 닦았다. 지나가던 담임 쌤이 걸음을 멈췄다.'; } },
    { label: '몰래 빠진다', hint: '운 판정', run: s => {
      if (G.check('luck', 55)) { G.fat(-10); return '아무도 눈치채지 못했다. 매점에서 여유를 즐겼다.'; }
      G.add('rep', -3); G.aff('teacher', -4); return '복도 모퉁이에서 담임 쌤과 정면으로 마주쳤다. "…다시 들어가."'; } },
  ] });

ev({ id: 'called_on', title: '수업 중 지목', text: '"자, 이 문제는… 거기 창가 쪽." 선생님의 분필이 나를 가리킨다.',
  choices: [
    { label: '자신 있게 대답한다', hint: '공부 판정', run: s => {
      if (G.check('study', 55)) { G.add('rep', 2); G.grow('study', 1); return '정답이었다. 반 아이들이 "오~" 하고 감탄했다.'; }
      G.add('rep', -2); return '당당하게 틀렸다. 그 당당함만은 다들 인정했다.'; } },
    { label: '농담으로 넘긴다', hint: '사교성 판정', run: s => {
      if (G.check('social', 55)) { G.grow('social', 2); G.add('rep', 1); return '교실이 웃음바다가 됐다. 선생님도 피식 웃고 넘어갔다.'; }
      G.aff('teacher', -3); return '아무도 웃지 않았다. 정적이 3초간 흘렀다.'; } },
  ] });

ev({ id: 'wallet', title: '복도에 떨어진 지갑', text: '복도에서 지갑을 주웠다. 안에는 학생증과 매점 쿠폰 다섯 장.',
  choices: [
    { label: '교무실에 맡긴다', run: s => { G.add('rep', 3); G.aff('teacher', 3); return '다음 날 조회 시간에 이름이 불렸다. "착한 일을 한 학생이 있다."'; } },
    { label: '직접 주인을 찾는다', run: s => { G.grow('social', 3); G.add('luck', 1); return '학생증 주인은 3학년 선배. 고맙다며 쿠폰 한 장을 줬다.'; } },
  ] });

ev({ id: 'drowsy', title: '5교시의 졸음', text: '점심 직후 5교시. 선생님 목소리가 자장가처럼 들린다.',
  choices: [
    { label: '허벅지를 꼬집으며 버틴다', run: s => { G.grow('study', 2); G.fat(6); return '버텼다. 필기는 반쯤 외계어지만 의지만은 빛났다.'; } },
    { label: '잠깐만 눈을 감는다', hint: '운 판정', run: s => {
      G.fat(-15);
      if (G.check('luck', 50)) return '꿀잠을 잤다. 아무도 몰랐다. 침 자국만 빼면.';
      G.aff('teacher', -3); G.add('rep', -1); return '"거기, 일어나서 읽어." 교과서 몇 쪽인지도 모르겠다.'; } },
  ] });

ev({ id: 'group_project', title: '조별 과제 발표', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `조별 과제 발표가 다음 주다. 같은 조가 된 ${N(c.who)}가 나를 쳐다본다.`,
  choices: [
    { label: '역할을 나눠서 한다', run: (s, c) => { G.aff(c.who, 7); G.grow('social', 2); G.grow('study', 1); return '서로 잘하는 걸 맡았다. 발표는 깔끔하게 끝났다.'; } },
    { label: '내가 다 한다', run: (s, c) => { G.grow('study', 3); G.fat(12); G.aff(c.who, 2); return '밤새 PPT를 만들었다. 고마워하긴 하는데… 피곤하다.'; } },
    { label: '조용히 묻어 간다', run: (s, c) => { G.aff(c.who, -6); G.add('rep', -2); return '발표 날, 내 이름이 마지막 슬라이드에 아주 작게 적혀 있었다.'; } },
  ] });

ev({ id: 'friend_down', title: '시무룩한 친구', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `${N(c.who)}가 창밖만 보며 한숨을 쉬고 있다. 무슨 일이 있는 걸까.`,
  choices: [
    { label: '옆에 앉아 이야기를 듣는다', run: (s, c) => { G.aff(c.who, 11); G.fat(4); return '한참 이야기를 들었다. 마지막엔 둘 다 웃고 있었다.'; } },
    { label: '매점 간식을 사 준다', run: (s, c) => { G.aff(c.who, 7); return '"…딸기우유는 반칙이지." 기분이 조금 풀린 것 같다.'; } },
    { label: '혼자 있게 둔다', run: (s, c) => { G.aff(c.who, -2); return '다음 날 괜찮아 보였지만, 조금 서먹했다.'; } },
  ] });

ev({ id: 'lunch_special', title: '급식실 전력 질주', text: s => `오늘 급식은 ${todayMenu(s).slice(1, 4).join(', ')}. 4교시 종이 울리는 순간 전교생이 일어선다.`,
  choices: [
    { label: '급식실까지 전력 질주', hint: '체력 판정', run: s => {
      if (G.check('stamina', 50)) { G.fat(G.has('iron') ? -24 : -12); G.grow('stamina', 2); return `1등으로 도착! ${todayMenu(s)[2]}을 두 배로 받았다. 영양사님 최고.`; }
      G.fat(8); return `계단에서 숨이 찼다. 도착하니 ${todayMenu(s)[2]}은 바닥나 있었다.`; } },
    { label: '여유롭게 걸어간다', run: s => { G.grow('social', 1); return '줄 서서 수다 떠는 것도 나쁘지 않다. 돈가스는 작았지만.'; } },
  ] });

ev({ id: 'seat_change', title: '자리 바꾸는 날', text: '한 달에 한 번, 운명의 자리 뽑기. 쪽지를 뽑는 손이 떨린다.',
  choices: [
    { label: '창가 맨 뒷자리를 노린다', hint: '운 판정', run: s => {
      if (G.check('luck', 50)) { G.fat(-8); G.add('luck', 1); return '창가 맨 뒷자리 당첨! 햇살과 바람이 나를 반긴다.'; }
      G.grow('study', 2); return '교탁 바로 앞자리. 선생님 침이 튀는 거리지만 집중은 잘 된다.'; } },
    { label: '아무 데나 괜찮다', run: s => {
      const u = FRIEND_IDS.filter(id => !s.met[id]);
      if (u.length) { const w = u[Math.floor(Math.random() * u.length)]; G.meet(w); G.aff(w, 6); return `새 짝꿍은 ${N(w)}. ${CHARACTERS[w].desc}`; }
      const w = pickFriend(s); G.aff(w, 6); return `짝꿍이 ${N(w)}가 됐다. 수업 시간이 좀 더 시끄러워질 예정.`; } },
  ] });

/* ───────── 장소 이벤트 (탐험) ───────── */
ev({ id: 'lib_range', loc: 'library', title: '도서관의 정리 노트', text: '도서관 구석 책상에 누가 두고 간 시험 범위 정리 노트가 펼쳐져 있다.',
  choices: [
    { label: '조금만 읽어 본다', run: s => { G.grow('study', 4); return '정리가 기가 막힌다. 머릿속에 목차가 생긴 느낌.'; } },
    { label: '분실물 함에 넣는다', run: s => { G.add('rep', 2); G.add('luck', 1); return '착한 일을 했다. 어디선가 좋은 일이 돌아올 것 같다.'; } },
  ] });
ev({ id: 'lib_quiet', loc: 'library', title: '도서관의 정적', text: '에어컨 소리만 들리는 도서관. 공부하기 딱 좋은 분위기다.',
  choices: [
    { label: '집중 공부 모드', run: s => { G.grow('study', 3); G.fat(5); return '한 시간이 5분처럼 지나갔다.'; } },
    { label: '만화책 코너로 간다', run: s => { G.fat(-12); G.add('luck', 1); return '학습만화도 학습이다. 아마도.'; } },
  ] });
ev({ id: 'store_new', loc: 'store', title: '매점 신상 과자', text: '매점에 "양일 한정 마라맛 초코파이"가 입고됐다. 정체가 의심스럽다.',
  choices: [
    { label: '도전한다', run: s => { if (G.talent('cook')) { G.add('rep', 3); return '한 입 먹자마자 재료를 전부 맞혔다. "이건… 산초 0.3그램." 매점 아주머니가 박수를 쳤다.'; }
      if (G.check('luck', 45)) { G.fat(-10); return '의외로 맛있다! 중독될 것 같다.'; } G.fat(6); return '혀가 마비됐다. 5교시 내내 말을 할 수 없었다.'; } },
    { label: '평범한 바나나우유', run: s => { G.fat(-8); return '역시 근본은 바나나우유다.'; } },
  ] });
ev({ id: 'store_gossip', loc: 'store', title: '매점 벤치의 소문', text: '매점 앞 벤치에서 누군가 속삭인다. "들었어? 이번 시험에…"',
  choices: [
    { label: '귀를 기울인다', run: s => { G.add('luck', 2); G.flag('examTip'); return '다음 시험에 서술형이 많이 나온다는 정보를 입수했다. (다음 시험 +4)'; } },
    { label: '대화에 끼어든다', run: s => { G.grow('social', 3); return '어느새 소문을 함께 퍼뜨리는 중이었다.'; } },
  ] });
ev({ id: 'field_match', loc: 'field', title: '즉석 축구 한 판', text: '운동장에서 공이 굴러왔다. "한 명 모자라! 들어와!"',
  choices: [
    { label: '뛰어든다', run: s => { G.grow('stamina', 4); G.grow('social', 1); G.fat(10); return '골은 못 넣었지만 수비 하나는 철벽이었다.'; } },
    { label: '공만 차 주고 간다', run: s => { G.grow('stamina', 1); return '공이 정확히 골대로 들어갔다. 다들 멍하니 쳐다본다.'; } },
  ] });
ev({ id: 'field_run', loc: 'field', title: '트랙 위의 노을', text: '방과후 트랙. 노을이 운동장을 주황색으로 물들인다.',
  choices: [
    { label: '한 바퀴 달린다', run: s => { if (G.talent('sprint')) { G.add('rep', 3); return '바람처럼 달렸다. 지나가던 육상부 코치가 스톱워치를 떨어뜨렸다.'; } G.grow('stamina', 3); G.fat(6); return '숨이 차지만 기분은 상쾌하다.'; } },
    { label: '벤치에서 멍 때린다', run: s => { G.fat(-14); return '아무 생각도 안 했다. 그게 좋았다.'; } },
  ] });
ev({ id: 'empty_piano', loc: 'empty', title: '빈 교실의 낡은 피아노', text: '아무도 없는 교실 구석에 먼지 쌓인 피아노가 있다. 건반 하나를 눌러 본다.',
  choices: [
    { label: '노래를 흥얼거린다', run: s => { if (G.talent('voice')) { G.add('rep', 4); return '복도를 지나던 학생들이 문 앞에 모여들었다. 이 목소리… 나였어?'; } G.fat(-8); return '음정은 엉망이지만 속은 후련하다.'; } },
    { label: '조용히 나간다', run: s => { G.add('luck', 1); return '나가는데 피아노가 혼자 "도" 소리를 냈다. …기분 탓이겠지.'; } },
  ] });
ev({ id: 'empty_board', loc: 'empty', title: '칠판의 수수께끼', text: '빈 교실 칠판에 이상한 수식이 적혀 있다. 아래엔 "풀면 행운이 온다"는 낙서.',
  choices: [
    { label: '풀어 본다', hint: '공부 판정', run: s => { if (G.check('study', 60) || G.talent('detective')) { G.add('luck', 3); G.grow('study', 2); return '답은 "4교시 매점"이었다. 그날 매점에서 빵이 덤으로 나왔다.'; } G.fat(6); return '30분을 고민했지만 실패. 누가 장난친 걸지도.'; } },
    { label: '답을 아무렇게나 적는다', run: s => { G.absurd(); return '"정답: 치킨". 다음 날, 누군가 그 아래에 "정답!"이라고 적어 놨다.'; } },
  ] });
ev({ id: 'roof_sky', loc: 'roof', title: '옥상의 하늘', text: '바람이 분다. 운동장도, 교실도, 시험도 다 작아 보인다.',
  choices: [
    { label: '한숨 잔다', run: s => { G.fat(-25); return '구름이 지나가는 걸 보다가 잠들었다.'; } },
    { label: '소원을 빈다', run: s => { G.add('luck', 3); return '비행기 하나가 지나갔다. 소원이 접수된 것 같다.'; } },
  ] });

/* ───────── 첫 만남 (각자의 장소) ───────── */
/* ───────── 병맛 이벤트 ───────── */
ev({ id: 'intro_contest', type: 'absurd', title: '전교 10초 자기소개 대회', once: true,
  text: '조회 시간, 교장 선생님이 마이크를 잡았다. "지금부터 전교생 10초 자기소개 대회를 시작합니다. 첫 번째는… 거기 학생!"',
  choices: [
    { label: '정석 자기소개', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 6); return '10초 딱 맞춰 끝냈다. 교장 선생님이 엄지를 들었다.'; } G.add('rep', -2); return '이름만 말하고 8초 동안 정적. 전교생이 숨을 죽였다.'; } },
    { label: '즉석 랩으로 한다', hint: '운 판정', run: s => { if (G.talent('talker') || G.check('luck', 55)) { G.add('rep', 10); G.nick('양일 래퍼'); return '"Yo 양일고 신입생, 꿈은 크고 키는 작네" 운동장이 들썩였다.'; } G.add('rep', -4); G.nick('10초 침묵왕'); return '첫 마디에서 박자를 놓쳤다. 남은 9초는 비트박스로 버텼다.'; } },
    { label: '도망친다', run: s => { G.fat(5); G.nick('조회대 도망자'); return '운동장 끝까지 달렸다. 박수가 터져 나왔다. 왜?'; } },
  ] });
ev({ id: 'pigeon', type: 'absurd', title: '교실에 들어온 비둘기',
  text: '수업 중, 열린 창문으로 비둘기가 날아 들어와 교탁 위에 앉았다. 선생님과 비둘기가 서로를 노려본다.',
  choices: [
    { label: '맨손으로 잡는다', hint: '체력 판정', run: s => { if (G.check('stamina', 55)) { G.add('rep', 4); return '한 번에 잡아서 창밖으로 보내 줬다. 교실에 박수가 터졌다.'; } G.fat(10); G.add('rep', -1); return '비둘기는 내 머리 위에 앉았다. 그리고 떠나지 않았다.'; } },
    { label: '이름을 지어 준다', run: s => { G.grow('social', 2); G.nick('비둘기 집사'); return '"구구"라고 불렀다. 비둘기가 대답했다. 반 친구들이 나를 집사라 부르기 시작했다.'; } },
    { label: '수업에 집중한다', run: s => { G.grow('study', 2); G.aff('teacher', 3); return '혼돈 속에서도 필기를 계속했다. 선생님이 감동받은 눈치다.'; } },
  ] });
ev({ id: 'ghost', type: 'absurd', title: '3층 화장실 귀신 소문',
  text: '"3층 끝 화장실에서 밤마다 노랫소리가 들린대." 반 전체가 이 소문으로 떠들썩하다.',
  choices: [
    { label: '방과후에 확인하러 간다', run: s => { if (G.talent('detective')) { G.add('rep', 4); G.flag('ghostSolved'); return '발자국과 고무장갑을 단서로 범인을 찾았다. 노래 연습을 하던 경비 아저씨였다. 아저씨는 트로트 대회에 나간다고 한다.'; }
      G.add('luck', 2); G.fat(6); return '노래의 주인은 화장실 청소를 하며 트로트를 부르는 경비 아저씨였다. 아저씨가 사탕을 줬다.'; } },
    { label: '소문을 더 키운다', run: s => { G.grow('social', 2); G.add('rep', -1); return '다음 날 소문은 "귀신이 아이돌 데뷔를 준비 중"으로 진화해 있었다.'; } },
  ] });
ev({ id: 'mic_on', type: 'absurd', title: '켜져 있던 방송실 마이크',
  text: '방송실 심부름 중에 혼잣말로 노래를 불렀다. 그런데 빨간 불이… ON AIR. 전교에 내 노래가 나가고 있다.',
  choices: [
    { label: '끝까지 완창한다', run: s => { if (G.talent('voice') || G.check('social', 60)) { G.add('rep', 8); G.flag('stage'); return '노래가 끝나자 학교 전체에서 박수 소리가 들렸다. 하루아침에 스타가 됐다.'; } G.add('rep', 3); G.nick('방송실 가수'); return '2절까지 불렀다. 음정은 엉망이었지만 그 패기에 다들 반했다.'; } },
    { label: '조용히 마이크를 끈다', run: s => { G.add('rep', -1); return '"…방금 그 노래 누구야?" 쉬는 시간 내내 모른 척했다.'; } },
  ] });
ev({ id: 'teacher_dance', type: 'absurd', title: '철벽 쌤의 비밀',
  text: '빈 교실 창문 너머로 담임 김철벽 쌤이 아이돌 춤을 연습하는 모습을 목격했다. 무표정 그대로.',
  choices: [
    { label: '못 본 걸로 한다', run: s => { G.aff('teacher', 10); return '다음 날, 쌤이 내 수행평가 피드백을 유난히 길게 써 줬다. 알고 있었던 걸까.'; } },
    { label: '들어가서 같이 춘다', hint: '체력 판정', run: s => { G.nick('교무실 댄서'); if (G.check('stamina', 45)) { G.aff('teacher', 14); G.add('rep', 3); return '완벽한 2인 군무가 완성됐다. 쌤이 축제 무대에 같이 서자고 했다.'; } G.aff('teacher', 5); G.fat(10); return '열심히 따라 했지만 박자가 하나씩 밀렸다. 쌤이 아주 조금 웃었다.'; } },
    { label: '친구들에게 알린다', run: s => { G.add('rep', 3); G.aff('teacher', -8); return '소문은 30분 만에 전교로 퍼졌다. 쌤의 철벽이 한층 더 두꺼워졌다.'; } },
  ] });
ev({ id: 'vending', type: 'absurd', title: '자판기의 반란',
  text: '자판기에 천 원을 넣었더니 음료가 쉬지 않고 쏟아진다. 다섯 개, 열 개, 열다섯 개…',
  choices: [
    { label: '반 친구들에게 나눠 준다', run: s => { G.grow('social', 3); G.add('rep', 3); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); return '그날 반에서 나는 산타였다.'; } },
    { label: '자판기에게 절한다', run: s => { G.add('luck', 4); return '자판기가 "띠링" 소리를 냈다. 축복받은 기분이다.'; } },
    { label: '행정실에 신고한다', run: s => { G.add('rep', 2); G.aff('teacher', 2); return '행정실 선생님이 고장 신고 감사하다며 음료 하나를 줬다.'; } },
  ] });
ev({ id: 'fortune', type: 'absurd', title: '수상한 점술 동아리',
  text: '복도 끝 책상에 "양일 점술 연구회 · 시험 운세 무료"라는 종이가 붙어 있다. 고깔모자를 쓴 선배가 손짓한다.',
  choices: [
    { label: '운세를 본다', run: s => { if (G.chance(0.5 + s.stats.luck / 300)) { G.set('fortune', 1); return '"다음 시험… 대길이로다." 근거는 없지만 자신감이 차오른다. (다음 시험 +5)'; } G.set('fortune', -1); return '"다음 시험… 흉이로다." 불길하다. (다음 시험 -5)'; } },
    { label: '역으로 선배 운세를 봐 준다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.grow('social', 3); G.nick('양일 점쟁이'); return '"선배, 오늘 점심 김치찌개 나와요." 맞았다. 신규 부원으로 스카우트됐다.'; } return '선배가 고깔모자를 벗고 조용히 자리를 떠났다.'; } },
  ] });
ev({ id: 'name_typo', type: 'absurd', title: '학생부 이름 오타 사건', once: true,
  text: s => `교무실에서 받은 학생증 이름이 "${s.name.slice(0, -1)}콩"으로 적혀 있다. 정정하려면 3일이 걸린다고 한다.`,
  choices: [
    { label: '당분간 그 이름으로 산다', run: s => { G.nick(s.name.slice(0, -1) + '콩'); G.add('rep', 3); G.grow('social', 2); return '"콩아!" 이제 전교생이 나를 그렇게 부른다. 묘하게 정이 간다.'; } },
    { label: '바로 정정 요청한다', run: s => { G.aff('teacher', 2); return '철벽 쌤이 직접 행정실에 전화해서 하루 만에 고쳐 줬다.'; } },
  ] });
ev({ id: 'mascot', type: 'absurd', title: '마스코트 탈 알바',
  text: '학생회에서 급하게 사람을 찾는다. 학교 마스코트 "양일이"(양 모양) 탈을 쓰고 신입생 홍보를 해 달라고.',
  choices: [
    { label: '탈을 쓴다', run: s => { G.add('rep', 5); G.fat(14); G.nick('인간 양일이'); return '"메에~" 아이들이 줄을 서서 사진을 찍었다. 탈 안은 사우나였다.'; } },
    { label: '정중히 거절한다', run: s => { return '대신 들어간 학생회 선배가 탈을 쓴 채 계단에서 굴렀다. 다행히 탈이 푹신했다.'; } },
  ] });
ev({ id: 'chicken', type: 'absurd', title: '치킨 30마리 배달',
  text: '쉬는 시간, 배달 기사님이 교실 문을 열었다. "양일고 2반… 치킨 30마리 시키신 분?" 아무도 손을 들지 않는다.',
  choices: [
    { label: '범인을 찾는다', hint: '사교성 판정', run: s => { if (G.check('social', 50) || G.talent('detective')) { G.add('rep', 4); G.flag('ghostSolved'); return '범인은 교장 선생님이었다. 전교생 간식으로 주문한 걸 방송을 깜빡하셨단다.'; } return '아무도 모른다. 결국 반 전체가 기사님께 절을 하고 돌려보냈다.'; } },
    { label: '일단 먹는다', run: s => { G.fat(-15); G.add('rep', -1); G.grow('social', 2); return '치킨 파티가 열렸다. 다음 날 교장 선생님이 "내 치킨 누가 먹었니" 방송을 했다.'; } },
  ] });
ev({ id: 'lunch_lady', type: 'absurd', title: '국자 든 급식 아주머니의 도전',
  text: '"오늘 깍두기 남김없이 다 먹는 학생에게는 내일 닭다리 두 개!" 급식 아주머니가 국자를 높이 들었다.',
  choices: [
    { label: '도전을 받아들인다', hint: '체력 판정', run: s => { if (G.check('stamina', 45) || s.traits.includes('iron')) { G.fat(-15); G.add('rep', 3); G.nick('깍두기 대장'); return '깍두기 한 통을 비웠다. 다음 날 닭다리 두 개가 영광의 증표처럼 식판에 올라왔다.'; } G.fat(10); return '반쯤 먹다가 포기했다. 아주머니가 "내일 또 와" 하고 웃었다.'; } },
    { label: '정중히 사양한다', run: s => { return '"요즘 애들은 패기가 없어!" 국자가 아쉽게 내려갔다.'; } },
  ] });

/* ───────── 희귀 이벤트 ───────── */
ev({ id: 'secret_note', type: 'rare', loc: 'empty', once: true, title: '정체불명의 시험 대비 노트',
  cond: s => (s.visits.empty || 0) >= 2,
  text: '빈 교실 사물함 깊숙한 곳에서 낡은 노트를 발견했다. 표지에는 "양일고 시험 출제 경향 20년 분석 — 졸업생 일동".',
  choices: [
    { label: '꼼꼼히 연구한다', run: s => { G.grow('study', 8); G.flag('examTip', 2); return '20년치 출제 패턴이 한눈에 들어온다. 선배님들 감사합니다. (다음 시험 +8)'; } },
    { label: '친구들과 공유한다', run: s => { G.grow('study', 4); G.add('rep', 6); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 5)); return '노트는 반 전체의 보물이 됐다. 반 평균이 7점 올랐다.'; } },
  ] });
ev({ id: 'roof_key', type: 'rare', once: true, title: '녹슨 열쇠', cond: s => s.counts.explore >= 4 && !s.flags.roofOpen,
  text: '복도 소화전 뒤에서 녹슨 열쇠를 주웠다. 손잡이에 희미하게 "옥상"이라고 새겨져 있다.',
  choices: [
    { label: '조심스럽게 챙긴다', run: s => { G.set('roofOpen', 1); G.achieve('roof'); return '이제 옥상에 갈 수 있다. 아무에게도 말하지 말자. (탐험 장소 "옥상" 해금)'; } },
    { label: '교무실에 가져다 준다', run: s => { G.aff('teacher', 6); G.add('rep', 3); G.set('roofOpen', 1); return '"…옥상 열쇠? 네가 관리해라. 대신 안전하게." 철벽 쌤이 의외의 결정을 내렸다.'; } },
  ] });
ev({ id: 'kyogam_cat', type: 'rare', loc: 'roof', once: true, title: '교감냥과의 조우',
  text: '옥상 물탱크 위에 통통한 고양이가 앉아 있다. 목에 걸린 이름표: "교감". 학생들 사이에서 전설로만 전해지던 그 고양이다.',
  choices: [
    { label: '천천히 손을 내민다', hint: '운 판정', run: s => { if (G.check('luck', 40)) { G.achieve('cat'); G.add('luck', 5); G.set('catFriend', 1); return '교감냥이 손에 머리를 비볐다. 간택당했다. 오늘부터 행운이 따른다.'; } G.add('luck', 2); return '교감냥은 하품을 하고 물탱크 뒤로 사라졌다. 그래도 존재를 확인했다.'; } },
    { label: '참치캔을 바친다', run: s => { G.achieve('cat'); G.add('luck', 3); G.set('catFriend', 1); return '교감냥이 캔을 비우고 내 무릎에서 잠들었다. 5교시는 포기했다.'; } },
  ] });
ev({ id: 'time_capsule', type: 'rare', loc: 'field', once: true, title: '1999년의 타임캡슐', cond: s => s.year >= 2,
  text: '운동장 구석 흙이 이상하게 솟아 있다. 파 보니 녹슨 깡통이 나왔다. "1999년 양평여자종합고등학교 3학년 2반 타임캡슐". 남녀공학이 되기 1년 전이다.',
  choices: [
    { label: '편지를 읽는다', run: s => { G.add('luck', 4); G.add('rep', 3); return '"이걸 읽는 후배야. 내년부터 남학생도 들어온대. 교실이 시끄러워지겠지만 사이좋게 지내렴. 그리고 매점 소보로는 4교시 끝나기 1분 전에 사라진다." 귀중한 정보다.'; } },
    { label: '선생님께 가져간다', run: s => { G.aff('teacher', 12); return '철벽 쌤이 편지를 읽다가 굳었다. 그 반의 반장이… 쌤이었다.'; } },
  ] });
ev({ id: 'portrait', type: 'rare', once: true, title: '움직이는 초상화의 눈', cond: s => clubTag(s) === 'science' || s.talent === 'detective' || s.counts.explore >= 10,
  text: '본관 계단의 개교 기념 초상화. 눈동자가 나를 따라 움직이는 것 같다. 액자 아래에 작은 홈이 있다.',
  choices: [
    { label: '홈을 눌러 본다', run: s => { G.set('basement', 1); return '덜컹. 계단 아래 벽이 살짝 열렸다. 그 너머로 어두운 계단이 이어진다. (빈 교실 탐험 시 비밀 통로 출현)'; } },
    { label: '못 본 척 지나간다', run: s => { G.add('luck', 1); return '등 뒤에서 초상화가 한숨을 쉰 것 같았다.'; } },
  ] });
ev({ id: 'hidden_room', type: 'rare', loc: 'empty', once: true, title: '지하 비밀 창고', cond: s => s.flags.basement,
  text: '비밀 통로 끝에는 먼지 쌓인 창고가 있었다. 역대 축제 소품, 낡은 트로피, 그리고 "양일고 7대 미스터리 해답집".',
  choices: [
    { label: '해답집을 펼친다', run: s => { G.set('hiddenRoom', 1); G.achieve('detective'); G.add('luck', 4); G.grow('study', 3); return '7대 미스터리의 진실을 전부 알게 됐다. 이 학교의 진짜 주인은… 교감냥이었다.'; } },
    { label: '트로피를 닦아 놓는다', run: s => { G.set('hiddenRoom', 1); G.add('rep', 6); return '1998년 전국 대회 우승 트로피였다. 교장실 진열장에 다시 자리를 찾았다.'; } },
  ] });
ev({ id: 'legend_bread', type: 'rare', loc: 'store', once: true, title: '전설의 양일 소보로', cond: s => s.stats.luck >= 50,
  text: '매점 아주머니가 카운터 아래에서 금빛 포장지의 빵을 꺼냈다. "하루에 하나만 굽는 거야. 오늘은 네 차례다."',
  choices: [
    { label: '경건하게 먹는다', run: s => { STATS.forEach(k => G.add(k, 2)); G.fat(-20); return '한 입 먹는 순간 3년치 급식의 기억이 스쳐 갔다. 모든 능력치가 올랐다.'; } },
  ] });
ev({ id: 'ufo', type: 'rare', once: true, title: '운동장 미스터리 서클', cond: s => s.year >= 2,
  text: '아침 등교길, 운동장 한가운데에 거대한 원형 무늬가 새겨져 있다. 전교생이 창문에 붙어 있다.',
  choices: [
    { label: '조사한다', run: s => { G.add('luck', 3); G.absurd(); return '무늬는 정확히 양일고 교표 모양이었다. 범인은 끝내 잡히지 않았다.'; } },
    { label: '사진을 찍어 올린다', run: s => { G.add('rep', 5); return '사진이 지역 뉴스에 나왔다. "양일고에 외계인?"'; } },
  ] });

/* ───────── 친구 전용 이벤트 (친밀도 50 / 85) ───────── */
const CHAR_EVENTS = {
  chaerin: [
    { text: '방과후, 채린이가 교실에 혼자 남아 학급 일지를 쓰고 있다. "반장 일, 가끔 너무 무거워."',
      choices: [
        { label: '일지를 같이 쓴다', run: s => { G.aff('chaerin', 10); G.add('rep', 3); return '두 사람이 하니 30분 만에 끝났다. "다음 반장 선거, 부반장으로 나와 줄래?"'; } },
        { label: '떡볶이 먹으러 가자고 한다', run: s => { G.aff('chaerin', 8); G.fat(-10); return '"…반장도 가끔은 땡땡이칠 수 있지?" 처음 보는 채린이의 웃음이었다.'; } },
      ] },
    { text: '"나 사실 반장 하기 싫었어. 근데 네가 있어서 3년 버틴 것 같아." 채린이가 출석부를 꼭 쥐었다.',
      choices: [{ label: '"넌 최고의 반장이야."', run: s => { G.aff('chaerin', 10); G.add('rep', 5); G.achieve('bestie'); return '채린이가 출석부 맨 뒷장에 몰래 적어 둔 메모를 보여 줬다. "고마운 사람: 1번."'; } }] },
  ],
  taepung: [
    { text: '태풍이가 무릎에 붕대를 감고 벤치에 앉아 있다. "체육대회 전에 다쳤어… 나 없으면 우리 반 진다."',
      choices: [
        { label: '"내가 대신 뛸게."', run: s => { G.aff('taepung', 12); G.grow('stamina', 4); G.fat(10); return '그날부터 태풍이의 지옥 훈련이 시작됐다. 코치가 선수보다 신났다.'; } },
        { label: '병원에 같이 간다', run: s => { G.aff('taepung', 10); return '"…너 진짜 좋은 녀석이다." 태풍이가 처음으로 승부 얘기를 하지 않았다.'; } },
      ] },
    { text: '"우리 300번 넘게 대결했다. 전적은 비밀이다. 근데 이건 알아 둬. 넌 최고의 라이벌이었다."',
      choices: [{ label: '마지막 대결을 신청한다', run: s => { G.aff('taepung', 10); G.grow('stamina', 5); G.achieve('bestie'); return '운동장 한 바퀴, 동시에 결승선을 통과했다. 둘 다 운동장에 대자로 누워 웃었다.'; } }] },
  ],
  sori: [
    { text: '소리가 수첩을 잃어버리고 울상이다. "거기 학교 비밀이 다 들어 있단 말이야!"',
      choices: [
        { label: '학교를 같이 뒤진다', run: s => { G.aff('sori', 12); G.add('luck', 2); return '수첩은 매점 냉장고 위에 있었다. 소리가 수첩 첫 장을 보여 줬다. "믿을 수 있는 사람: 1명."'; } },
        { label: '"없어도 넌 소리야."', run: s => { G.aff('sori', 10); G.grow('social', 2); return '"…그 말, 소문 내도 돼?" 소리가 코를 훌쩍이며 웃었다.'; } },
      ] },
    { text: '"나 사실 소문 모으는 이유가 있어. 아무도 나한테 관심 없을까 봐. 근데 넌 처음부터 내 얘기를 들어 줬지."',
      choices: [{ label: '소리의 이야기를 끝까지 듣는다', run: s => { G.aff('sori', 10); G.add('luck', 4); G.achieve('bestie'); return '그날 소리는 수첩을 한 번도 펼치지 않았다.'; } }] },
  ],
  jaemin: [
    { text: '재민이가 교무실에서 혼나고 나왔다. 이번엔 진짜 억울하다고 한다. "화분은 바람이 넘어뜨린 거라고!"',
      choices: [
        { label: '증거를 찾아 준다', hint: '운 판정', run: s => { G.aff('jaemin', 10); if (G.check('luck', 40)) { G.add('rep', 3); return 'CCTV에 바람에 넘어지는 화분이 찍혀 있었다. 재민이 인생 첫 무죄 판결.'; } return '증거는 못 찾았지만 재민이는 내가 믿어 준 걸로 충분하다고 했다.'; } },
        { label: '같이 반성문을 써 준다', run: s => { G.aff('jaemin', 12); G.absurd(); return '반성문 마지막 줄: "하지만 화분도 반성해야 합니다." 둘 다 한 장씩 더 썼다.'; } },
      ] },
    { text: '"나랑 다니면 맨날 혼났잖아. 근데 왜 계속 같이 다녀?" 재민이가 처음으로 진지한 얼굴이다.',
      choices: [{ label: '"재밌으니까."', run: s => { G.aff('jaemin', 10); G.absurd(); G.achieve('bestie'); return '재민이가 웃더니 주머니에서 폭죽을 꺼냈다. "졸업식 때 쓰자." 합법적인 거라고 한다.'; } }] },
  ],
  teacher: [
    { text: '교무실에 불려 갔다. 혼나는 줄 알았는데 철벽 쌤이 진로 희망서를 내밀었다. "너는 뭘 하고 싶냐."',
      choices: [
        { label: '솔직하게 고민을 말한다', run: s => { G.aff('teacher', 10); G.grow('study', 3); return '쌤이 한 시간 동안 이야기를 들어 줬다. 철벽 너머에는 생각보다 넓은 방이 있었다.'; } },
        { label: '"쌤은 왜 선생님 됐어요?"', run: s => { G.aff('teacher', 12); return '"…나도 너 같은 학생이었거든." 짧지만 진심인 대답이었다.'; } },
      ] },
    { text: '철벽 쌤이 추천서를 쓰고 있다. 맨 위에 내 이름이 적혀 있다. "3년 동안 지켜봤다. 자신 있게 쓸 수 있겠더라."',
      choices: [{ label: '고개 숙여 인사한다', run: s => { G.aff('teacher', 8); G.add('rep', 6); G.set('recommend', 1); G.achieve('teacher_pet'); return '"…졸업해도 찾아와라." 철벽이 완전히 무너진 순간이었다.'; } }] },
  ],
};
Object.entries(CHAR_EVENTS).forEach(([id, list]) => list.forEach((e, i) => ev({
  id: `char_${id}_${i}`, type: 'char', once: true, title: i ? `${N(id)} · 마음을 연 날` : `${N(id)} · 가까워진 날`,
  who: () => id, text: e.text, choices: e.choices, threshold: i ? 85 : 50, charId: id, mode: id === 'teacher' ? undefined : 'classic',
})));

/* ───────── 학사 일정 (스토리) ───────── */
ev({ id: 'entrance', type: 'story', once: true, title: '양일고등학교 입학식', setup: (s, c) => { const d = s.mode === 'classic' ? FRIEND_IDS.filter(id => canDate(s, id)) : []; c.who = d.length ? d[Math.floor(Math.random() * d.length)] : FRIEND_IDS[0]; }, who: (s, c) => c.who,
  text: (s, c) => `개나리가 핀 3월, 본관 앞 교훈석에 "참되게 바르게 알차게"가 새겨져 있다. 1학년 ${SCHOOL.grades[1].total}명(남 ${SCHOOL.grades[1].boys} · 여 ${SCHOOL.grades[1].girls}), ${SCHOOL.grades[1].classes}개 반 중 2반. 담임 김철벽 쌤이 출석부를 펼쳤다. "${s.name}. 앞에 나와서 한마디." 옆자리에 앉은 ${N(c.who)}${josa(N(c.who), '이', '가')} 작게 "파이팅" 하고 속삭인다.`,
  choices: [
    { label: '밝게 인사한다', run: (s, c) => { G.grow('social', 3); G.add('rep', 2); G.meet(c.who); G.aff(c.who, 8); return `"잘 부탁해!" ${N2(c.who)} 제일 크게 박수를 쳤다. 입학 첫 친구가 생겼다.`; } },
    { label: '짧고 굵게', run: (s, c) => { G.meet(c.who); G.aff(c.who, 4); G.grow('study', 2); G.aff('teacher', 4); return '"잘 부탁드립니다." 철벽 쌤이 처음으로 출석부에서 눈을 들었다.'; } },
    { label: '자폭 개그를 던진다', hint: '운 판정', run: (s, c) => { G.meet(c.who); G.aff(c.who, 5); if (G.talent('talker') || G.check('luck', 50)) { G.add('rep', 6); G.grow('social', 2); return '교실이 뒤집어졌다. 입학 첫날부터 반의 분위기 메이커가 됐다.'; } G.nick('입학식 폭탄'); G.add('rep', -2); return '정적. 창밖에서 까마귀가 울었다. 별명이 생겼다.'; } },
  ] });
ev({ id: 'club_fair', type: 'story', once: true, title: '동아리 박람회',
  text: '2학기 첫날, 강당에 동아리 부스가 분야별로 줄지어 섰다. 어느 분야 부스부터 가 볼까? 동아리에 들면 "동아리 활동" 행동이 생긴다.',
  choices: Object.entries(CLUB_FIELDS).map(([field, f]) => ({ label: field, hint: `${f.clubs.length}개 동아리 · ${f.desc}`,
    run: s => { s.flags.clubField = field; s.queue.unshift('club_pick'); return `${field} 부스 앞으로 갔다. 선배들이 전단지를 내민다.`; } })).concat([
    { label: '귀가부 (가입 안 함)', run: s => { G.fat(-10); return '자유로운 영혼이 되었다. 대신 방과후가 조금 심심하다.'; } }]) });
ev({ id: 'club_pick', type: 'story', once: true, title: s => `${s.flags.clubField} 동아리 고르기`,
  text: s => `${s.flags.clubField} 분야 동아리들이 신입 부원을 기다린다.`,
  choices: s => CLUB_FIELDS[s.flags.clubField].clubs.map(name => ({ label: name, hint: CLUBS[name].desc,
    run: s => { s.club = name; G.flag('clubJoined'); return `${name}에 가입했다! ${CLUBS[name].welcome}`; } })) });
ev({ id: 'new_grade', type: 'story', once: true, title: '2학년 반 배정',
  text: '새 학년, 새 교실. 게시판 앞에서 반 배정표를 확인한다. 담임은… 또 김철벽 쌤이다.',
  choices: [
    { label: '친구들 이름부터 찾는다', run: s => { const w = pickFriend(s); if (w) { G.aff(w, 8); return `${N(w)}${josa(N(w), '과', '와')} 같은 반! 둘이 하이파이브를 했다.`; } G.grow('social', 2); return '아는 이름이 없다. 새로운 시작이다.'; } },
    { label: '쌤에게 인사하러 간다', run: s => { G.aff('teacher', 6); return '"…또 너냐." 말은 그래도 쌤의 입꼬리가 1밀리미터 올라갔다.'; } },
  ] });
ev({ id: 'career', type: 'story', once: true, title: '3학년 진로 상담', who: () => 'teacher',
  text: '"마지막 1년이다. 진로 ACE 프로젝트 기록부터 보자. 자기 관리, 삶의 지평, 진로 설계… 네 3년을 어떻게 마무리하고 싶냐." 철벽 쌤이 진지하게 묻는다.',
  choices: [
    { label: '성적으로 승부한다', run: s => { G.grow('study', 4); G.aff('teacher', 3); return '"좋다. 시간표를 다시 짜 보자." 쌤이 빨간 펜을 들었다.'; } },
    { label: '사람들과의 추억이 중요해요', run: s => { G.grow('social', 4); G.aff('teacher', 3); return '"그것도 공부다." 쌤이 상담 기록에 "현명함"이라고 적었다.'; } },
    { label: '전설을 남기고 싶어요', run: s => { G.add('rep', 4); G.absurd(); return '"…무슨 전설?" 쌤은 대답을 듣고 30초간 말이 없었다.'; } },
  ] });
ev({ id: 'sports_day', type: 'story', title: '체육한마당',
  text: s => `4월 3일, ${s.year}학년 체육한마당. 청군과 백군의 함성이 운동장을 메운다. 마지막 종목은 반 대항 계주다.`,
  choices: [
    { label: '계주 앵커로 출전한다', hint: '체력 판정', run: s => {
      const pb = payback('sports'); const boost = (clubTag(s) === 'sport' ? 10 : 0) + pb.bonus;
      if (G.talent('sprint') || G.check('stamina', 60 - boost)) { G.flag('sportsWins'); G.add('rep', 8); G.achieve('mvp'); return pb.text.trim() + (pb.text ? ' ' : '') + '마지막 코너에서 두 명을 제쳤다. 결승선을 끊는 순간 운동장이 무너질 듯한 함성이 터졌다.'; }
      G.fat(15); G.add('rep', 2); return pb.text.trim() + (pb.text ? ' ' : '') + '끝까지 달렸지만 아쉬운 2등. 그래도 반 친구들이 어깨동무를 해 줬다.'; } },
    { label: '응원단장을 맡는다', hint: '사교성 판정', run: s => { if (G.check('social', 55)) { G.add('rep', 6); G.grow('social', 3); return '응원가를 즉석에서 만들었다. 응원상 수상!'; } G.add('rep', 2); G.fat(8); return '목이 쉬도록 외쳤다. 다음 날 목소리가 나오지 않았다.'; } },
    { label: '그늘에서 쉰다', run: s => { G.fat(-20); return '나무 그늘 아래서 아이스크림을 먹었다. 이것도 체육대회의 묘미.'; } },
  ] });
ev({ id: 'festival', type: 'story', title: '녹향제 (학교 축제)',
  text: s => `7월 16일, 1학기 2차 정기시험이 끝나고 ${s.year}학년 녹향제가 열렸다. 부스와 양일가왕 무대가 기다린다. 운동장엔 무대가, 교실엔 부스가 가득하다.`,
  choices: [
    { label: '무대에 오른다', hint: '사교성 판정', run: s => {
      const boost = (clubTag(s) === 'band' ? 15 : 0) + (clubTag(s) === 'paper' ? 5 : 0);
      if (G.talent('voice') || G.check('social', 60 - boost)) { G.flag('stage'); G.add('rep', 10); G.achieve('festival_star'); return '조명이 나를 비췄다. 첫 소절에 운동장이 조용해지고, 마지막 소절에 떼창이 터졌다.'; }
      G.add('rep', 3); G.nick('축제 삑사리'); return '고음에서 삑사리가 났다. 그런데 그게 오히려 레전드 영상이 됐다.'; } },
    { label: '반 부스를 운영한다', run: s => { G.grow('social', 4); G.add('rep', 4); G.fat(12); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); return '우리 반 "철벽 쌤 몰래카메라 카페"가 매출 1위를 했다.'; } },
    { label: '축제를 구경한다', run: s => { G.fat(-12); G.add('luck', 3); s.money = (s.money || 0) + 10000; return '경품 추첨에서 문화상품권 만 원에 당첨됐다! (용돈 +10,000원)'; } },
    { mode: 'classic', label: '그 사람과 축제를 돈다', req: s => !!(s.partner || s.crush), reqText: '썸이나 연인이 있어야 한다', run: s => { const w = s.partner || s.crush; s.love[w] = clamp(s.love[w] + 12); G.aff(w, 5); G.fat(-5); return `${N(w)}${josa(N(w), '과', '와')} 솜사탕 하나를 나눠 먹으며 부스를 돌았다. 불꽃이 터질 때 눈이 마주쳤다. (설렘 ${s.love[w]})`; } },
  ] });
ev({ id: 'school_trip', type: 'story', once: true, title: '2학년 수학여행 · 제주도 (6/10~12)',
  text: '제주도 수학여행 첫날 밤. 숙소 방에 불이 꺼졌다. 하지만 아무도 잘 생각이 없다.',
  choices: [
    { label: '밤새 수다를 떤다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 7)); G.fat(20); G.grow('social', 3); return '새벽 4시까지 이야기했다. 서로의 비밀을 하나씩 알게 됐다.'; } },
    { label: '베개 싸움을 시작한다', hint: '체력 판정', run: s => { G.absurd(); if (G.check('stamina', 50)) { G.add('rep', 4); G.nick('베개 전쟁 영웅'); return '전설적인 승리를 거뒀다. 순찰 중이던 철벽 쌤도 베개에 맞았다.'; } G.aff('teacher', -4); return '베개가 순찰 중이던 철벽 쌤 얼굴에 정통으로 맞았다. 전원 복도에서 무릎 꿇고 반성.'; } },
    { label: '일찍 잔다', run: s => { G.fat(-15); G.grow('stamina', 2); return '다음 날 한라산 등반에서 혼자 쌩쌩했다.'; } },
  ] });
ev({ id: 'club_contest', type: 'story', once: true, title: '동아리 발표회', cond: s => !!s.club,
  text: s => `전교 동아리 발표회 날. ${CLUBS[s.club].name}의 차례가 다가온다. 그동안의 활동이 시험대에 오른다.`,
  choices: [
    { label: '전력을 다한다', run: s => { const pts = s.clubPts + Math.floor(s.stats[CLUBS[s.club].stat] / 10);
      if (pts >= 18) { G.achieve('club_champion'); G.add('rep', 10); G.flag('clubWin'); return `대상 수상! ${CLUBS[s.club].win}`; }
      if (pts >= 11) { G.add('rep', 5); return '우수상 수상! 조금만 더 했으면 대상이었다.'; }
      G.add('rep', 1); return '참가상. 그래도 무대에 선 것만으로 의미가 있었다.'; } },
  ] });
ev({ id: 'album', type: 'story', once: true, title: '졸업 앨범 촬영',
  text: '졸업 앨범 촬영 날. 사진사 아저씨가 외친다. "자, 자유 포즈 한 장 갑니다!"',
  choices: [
    { label: '절친과 함께 찍는다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const best = FRIEND_IDS.filter(id => s.met[id]).sort((a, b) => s.aff[b] - s.aff[a])[0]; G.aff(best, 8); return `${N(best)}와 어깨동무를 했다. 3년이 한 장에 담겼다.`; } },
    { label: '진지한 증명사진 포즈', run: s => { G.aff('teacher', 3); return '가장 단정한 사진이 나왔다. 철벽 쌤이 "모범적이군" 했다.'; } },
    { label: '병맛 포즈를 취한다', run: s => { G.absurd(); G.add('rep', 3); return '양 탈을 쓰고 찍었다. 졸업 앨범 역사상 가장 많이 회자되는 사진이 됐다.'; } },
  ] });
ev({ id: 'exam', type: 'story', title: '정기시험',
  text: s => `${s.year}학년 ${s.sem}학기 ${examName()} 날. 같은 학년 ${SCHOOL.grades[s.year].total}명이 동시에 시험지를 넘긴다. 내신 5등급, 1등급은 상위 10%뿐이다.`,
  choices: [
    { label: '실력대로 푼다', hint: '공부 기반', run: s => takeExam('skill') },
    { label: '찍기 신공을 믿는다', hint: '운 기반', run: s => takeExam('luck') },
    { label: '시험지 뒷면에 시를 쓴다', hint: '???', run: s => takeExam('poem') },
  ] });


/* ───────── 양일고 이야기 (학교 공개 자료 기반) ───────── */
ev({ id: 'mock', type: 'story', title: '전국연합모의학력평가',
  text: s => `${s.sem === 2 ? '9월 2일 전국연합학력평가 · 수능모의평가' : '6월 4일 전국연합학력평가 · 수능모의평가'} 날. 내신에는 안 들어가지만, 전국에서 내 위치를 알 수 있는 시험이다.`,
  choices: [
    { label: '진지하게 푼다', hint: '공부 기반', run: s => takeMock('real') },
    { label: '엎드려 잔다', hint: '피로 회복', run: s => takeMock('sleep') },
    { label: 'OMR 카드에 그림을 그린다', hint: '???', run: s => takeMock('art') },
  ] });
ev({ id: 'field_trip', type: 'story', once: true, title: '1학년 현장체험학습 · 롯데월드',
  text: '10월 29일 1학년 현장체험학습. 목적지는 롯데월드! 버스에서 내리자마자 다들 자이로드롭 쪽으로 뛰어간다.',
  choices: [
    { label: '자이로드롭에 도전한다', hint: '체력 판정', run: s => { if (G.check('stamina', 40)) { G.add('rep', 3); G.grow('stamina', 2); return '맨 앞줄에서 두 손을 번쩍 들었다. 내려와서 다리가 후들거렸지만 전설이 됐다.'; } G.fat(12); G.absurd(); return '올라가는 동안 반 친구들 이름을 전부 불렀다. 내려와서 한동안 말이 없었다.'; } },
    { label: '친구들과 퍼레이드 사진을 찍는다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 5)); G.grow('social', 2); return '머리띠를 맞춰 쓰고 찍은 단체 사진이 반 단톡방 프로필이 됐다.'; } },
    { mode: 'classic', label: '그 사람과 회전목마를 탄다', req: s => !!(s.partner || s.crush), reqText: '썸이나 연인이 있어야 한다', run: s => { const w = s.partner || s.crush; s.love[w] = clamp(s.love[w] + 12); G.aff(w, 6); return `${N(w)}${josa(N(w), '과', '와')} 나란히 회전목마를 탔다. 반 친구들이 몰래 찍은 사진이 돌았다. (설렘 ${s.love[w]})`; } },
  ] });
ev({ id: 'suneung', type: 'story', once: true, title: '대학수학능력시험',
  text: '11월, 수능 날 새벽. 후배들이 교문 앞에서 핫팩과 찹쌀떡을 건넨다. "선배님 화이팅!" 3년이 오늘 하루에 담긴다.',
  choices: [
    { label: '평소처럼 푼다', hint: '공부 기반', run: s => takeSuneung('skill') },
    { label: '심호흡하고 침착하게', hint: '공부 + 운', run: s => takeSuneung('calm') },
    { label: '모르면 찍는다, 후회는 없다', hint: '운 기반', run: s => takeSuneung('luck') },
  ] });
ev({ id: 'forsythia', loc: 'ginkgo', title: '개나리 핀 길', cond: s => s.sem === 1,
  text: '교화 개나리가 은행나무길 담장을 따라 노랗게 피었다. "희망찬 미래를 위해 부지런히 노력하는 학생"이 되라는 뜻이라고 들었다.',
  choices: [
    { label: '꽃길을 천천히 걷는다', run: s => { G.fat(-12); G.add('luck', 1); return '봄바람이 불었다. 오늘은 뭐든 잘될 것 같다.'; } },
    { label: '꽃 앞에서 다짐한다', run: s => { G.grow('study', 2); return '"이번 학기는 진짜 부지런하게." 개나리가 고개를 끄덕인 것 같다.'; } },
  ] });
ev({ id: 'ginkgo_smell', type: 'absurd', loc: 'ginkgo', title: '은행 열매 지뢰밭', cond: s => s.sem === 2,
  text: '가을, 교목 은행나무가 열매를 우수수 떨어뜨렸다. 길 전체가 지뢰밭이다. 냄새가… 엄청나다.',
  choices: [
    { label: '까치발로 건넌다', hint: '체력 판정', run: s => { if (G.check('stamina', 45)) { G.grow('stamina', 2); return '발레리나처럼 하나도 안 밟고 건넜다. 지켜보던 후배들이 박수를 쳤다.'; } G.add('rep', -1); G.nick('은행 냄새'); return '정확히 다섯 개를 밟았다. 하루 종일 주변 자리가 비었다.'; } },
    { label: '은행을 주워 급식실에 기부한다', run: s => { G.add('rep', 3); G.aff('teacher', 2); return '다음 주 급식에 은행 꼬치가 나왔다. 교목의 은혜다.'; } },
  ] });
ev({ id: 'motto_stone', type: 'rare', loc: 'ginkgo', once: true, title: '교훈석의 비밀', cond: s => (s.visits.ginkgo || 0) >= 2,
  text: '본관 앞 교훈석. 해 질 녘, "참되게 바르게 알차게" 세 단어 중 하나가 희미하게 빛나는 것 같다. 손을 대 본다.',
  choices: [
    { label: '참되게', hint: '도덕인', run: s => { G.grow('social', 5); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 5)); G.set('motto', 'social'); return '마음이 따뜻해졌다. 친구들에게 먼저 말을 걸고 싶어진다.'; } },
    { label: '바르게', hint: '건강인', run: s => { G.grow('stamina', 5); G.fat(-20); G.set('motto', 'stamina'); return '허리가 곧게 펴졌다. 몸이 가볍다.'; } },
    { label: '알차게', hint: '창의인 · 자주인', run: s => { G.grow('study', 5); G.set('motto', 'study'); return '머리가 맑아졌다. 오늘 배운 게 전부 기억난다.'; } },
  ] });
ev({ id: 'ginkgo_bench', loc: 'ginkgo', title: '은행나무 아래 벤치', text: '은행나무 그늘 아래 벤치. 바람에 잎이 흔들린다.',
  choices: [
    { label: '단어장을 편다', run: s => { G.grow('study', 2); G.fat(-5); return '그늘이 시원해서 단어가 잘 외워진다.'; } },
    { label: '누워서 하늘을 본다', run: s => { G.fat(-15); return '잎 사이로 햇빛이 반짝였다.'; } },
  ] });
ev({ id: 'unesco', title: '유네스코학교 캠페인',
  text: '유네스코학교 활동 주간. 복도에 "지속가능발전 · 평화와 인권 · 문화 간 학습" 포스터가 붙었다. 캠페인 참여자를 모집한다.',
  choices: [
    { label: '텀블러 캠페인을 연다', run: s => { G.add('rep', 3); G.grow('social', 2); return '일회용 컵 대신 텀블러를 쓰자는 캠페인. 철벽 쌤도 텀블러를 들고 왔다.'; } },
    { label: '세계시민 토론에 나간다', hint: '공부 판정', run: s => { if (G.check('study', 50)) { G.grow('study', 2); G.add('rep', 4); return '"빈곤과 기아" 주제 토론에서 우수상을 받았다.'; } G.grow('social', 2); return '말문이 막혔지만 상대 팀이 박수를 쳐 줬다. 이게 상호존중이다.'; } },
  ] });
ev({ id: 'science_lab', title: '과학중점학교 실험 수업', cond: s => s.year >= 1,
  text: '과학중점학교라 실험 수업이 유난히 많다. 오늘 과제는 "달걀을 3층에서 떨어뜨려도 안 깨지게 하기".',
  choices: [
    { label: '구조를 설계한다', hint: '공부 판정', run: s => { G.flag('sciHours', 1); if (G.check('study', 50)) { G.grow('study', 3); G.add('rep', 2); return '빨대 서른 개로 만든 구조물이 달걀을 지켜 냈다. 과학·수학 체험활동 시간 +1.'; } G.fat(6); return '달걀이 화려하게 깨졌다. 실패도 실험이다. 과학·수학 체험활동 시간 +1.'; } },
    { label: '달걀에 이름을 붙여 준다', run: s => { G.absurd(); G.flag('sciHours', 1); G.nick('달걀 아빠'); return '"계란이"는 장렬하게 산화했다. 반 전체가 묵념했다.'; } },
  ] });
ev({ id: 'robot_class', type: 'absurd', title: '로봇과 공학세계 시간의 폭주', cond: s => s.year === 1,
  text: '"로봇과 공학세계" 수업 시간. 조별로 만든 청소 로봇에 전원을 넣자, 로봇이 교실을 탈출해 복도를 질주하기 시작했다.',
  choices: [
    { label: '쫓아간다', hint: '체력 판정', run: s => { if (G.check('stamina', 45)) { G.add('rep', 3); return '급식실 앞에서 겨우 붙잡았다. 로봇은 복도를 반짝반짝하게 닦아 놓았다.'; } G.fat(12); return '로봇은 교무실로 들어가 철벽 쌤 책상 밑에서 멈췄다.'; } },
    { label: '코드를 고친다', hint: '공부 판정', run: s => { if (G.check('study', 50)) { G.grow('study', 3); return '조건문 하나를 고치자 로봇이 돌아와 내 앞에 멈춰 섰다. 과목 이름이 이해됐다.'; } G.absurd(); return '코드를 고쳤더니 로봇이 춤을 추기 시작했다. 아무도 멈출 수 없었다.'; } },
  ] });
ev({ id: 'hanmun', title: '한문 시간의 사자성어', cond: s => s.year === 1,
  text: '한문 시간. 선생님이 칠판에 "螢雪之功"을 쓰고 아무나 읽어 보라고 한다.',
  choices: [
    { label: '"형설지공!"', hint: '공부 판정', run: s => { if (G.check('study', 45)) { G.add('rep', 2); G.grow('study', 1); return '정답. 반딧불과 눈빛으로 공부해 이룬 성공이라는 뜻이다. 오늘 밤엔 스탠드 대신 반딧불을…'; } G.add('rep', -1); return '"영… 설… 지… 광?" 반 전체가 웃었다.'; } },
    { label: '사자성어를 지어낸다', run: s => { G.absurd(); G.grow('social', 2); return '"급식지존(給食至尊)". 선생님이 웃으며 오답 처리했다.'; } },
  ] });
ev({ id: 'river_fog', title: '남한강 물안개 등굣길',
  text: '아침 등굣길, 남한강에서 피어오른 물안개가 양평읍을 덮었다. 앞이 다섯 걸음밖에 안 보인다.',
  choices: [
    { label: '안개 속을 천천히 걷는다', run: s => { G.fat(-8); G.add('luck', 2); return '안개 속에서 은행나무길이 꿈처럼 나타났다.'; } },
    { label: '지각할까 봐 뛴다', run: s => { G.grow('stamina', 2); G.fat(5); if (G.chance(0.3)) { G.add('rep', -1); return '안개 속에서 전봇대와 인사했다.'; } return '교문에 1등으로 도착했다. 아무도 안 보였지만.'; } },
  ] });
ev({ id: 'anniversary', type: 'absurd', title: '개교기념 특별 훈화', once: true, cond: s => s.sem === 2,
  text: s => `1970년 1월 30일 개교식 이후 ${2025 + s.year - 1970}년. 교장 선생님이 개교기념 특별 훈화를 시작했다. "양평여자상업고등학교 시절부터 말이죠…" 벌써 20분째다.`,
  choices: [
    { label: '끝까지 경청한다', run: s => { G.aff('teacher', 4); G.grow('study', 1); G.fat(8); return '학교 역사를 전부 외웠다. 2000년에 남녀공학이 됐고, 2004년에 지금 이름이 됐다.'; } },
    { label: '서서 존다', run: s => { G.fat(-10); G.absurd(); return '서서 자는 기술을 터득했다. 고개가 끄덕여질 때마다 교장 선생님이 흐뭇해하셨다.'; } },
  ] });
ev({ id: 'school_song', type: 'absurd', title: '교가 실기 평가',
  text: '음악 시간, 교가 실기 평가가 있다. "하늘의 뜻을 받아 솟아난 새 줄기, 용문산 푸른 송백…" 한 명씩 앞에 나가야 한다.',
  choices: [
    { label: '목청껏 부른다', run: s => { if (G.talent('voice')) { G.add('rep', 6); G.flag('stage'); return '마지막 "참되고 바르고 알차게"에서 음악 선생님이 일어서서 박수를 쳤다.'; } if (G.check('social', 50)) { G.add('rep', 3); return '음정은 흔들렸지만 가사는 완벽했다.'; } G.nick('교가 삑사리'); return '"송백"에서 목소리가 뒤집혔다. 그 부분만 반 전체가 따라 했다.'; } },
    { label: '립싱크로 버틴다', hint: '운 판정', run: s => { if (G.check('luck', 50)) return '아무도 눈치채지 못했다. 입 모양은 완벽했다.'; G.add('rep', -2); return '반주가 멈췄는데 혼자 입을 움직이고 있었다.'; } },
  ] });
ev({ id: 'uve', title: '우베요거트의 정체',
  text: '급식에 보라색 요거트가 나왔다. 이름은 "우베요거트". 우베가 뭔지 아는 사람이 반에 아무도 없다.',
  choices: [
    { label: '먹어 본다', run: s => { if (G.talent('cook')) { G.add('rep', 3); return '"필리핀 보라색 참마야." 한 입에 맞혔다. 영양사님이 놀라셨다.'; } G.fat(-8); return '고구마 같기도 하고 바닐라 같기도 하다. 의외로 맛있다!'; } },
    { label: '정체를 조사한다', run: s => { G.grow('study', 1); G.add('luck', 1); return '우베는 필리핀의 보라색 참마였다. 쓸데없지만 알찬 지식이다.'; } },
  ] });
ev({ id: 'macaron', type: 'absurd', title: '할로윈 황치즈마카롱 대란', once: true, cond: s => s.sem === 2 && s.day >= 3 && s.day <= 4,
  text: '급식에 할로윈 특식 황치즈마카롱이 나왔다. 1인 1개. 그런데 배식대 끝에 하나가 남았다. 전교생의 시선이 한곳에 모인다.',
  choices: [
    { label: '가위바위보 토너먼트를 연다', hint: '운 판정', run: s => { G.grow('social', 2); if (G.check('luck', 50)) { G.fat(-12); G.add('rep', 3); return '7연승으로 마카롱을 쟁취했다. 할로윈의 왕.'; } return '1회전 탈락. 우승자는 철벽 쌤이었다.'; } },
    { label: '친구에게 양보한다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 8); return `${N2(w)} 마카롱을 반으로 갈라 줬다. 황치즈 맛이 난다.`; } },
  ] });

/* ───────── 인간관계: 친구끼리 엮이는 사건 ───────── */
ev({ id: 'lunch_together', rel: true, title: '같이 밥 먹을래?', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `점심시간, ${N(c.who)}${josa(N(c.who), '이', '가')} 식판을 들고 옆자리를 가리킨다. 오늘 메뉴는 ${todayMenu(s).slice(1, 4).join(', ')}.`,
  choices: [
    { label: '둘이 같이 먹는다', run: (s, c) => { G.aff(c.who, 8); G.fat(-5); return '반찬 하나씩 바꿔 먹으며 별것 아닌 얘기로 웃었다.'; } },
    { label: '다른 친구도 부른다', run: (s, c) => { const o = FRIEND_IDS.filter(id => s.met[id] && id !== c.who); G.aff(c.who, 4); G.grow('social', 2); if (o.length) { const w = o[Math.floor(Math.random() * o.length)]; G.aff(w, 5); return `${N(w)}까지 합류했다. 식탁이 시끌벅적해졌다.`; } return '부를 사람이 없어서 둘이 먹었다. 그래도 즐거웠다.'; } },
    { label: '혼밥이 편하다고 한다', run: (s, c) => { G.aff(c.who, -3); G.fat(-8); return '조용히 밥을 먹었다. 편하긴 한데 조금 허전하다.'; } },
  ] });
ev({ id: 'group_study', rel: true, title: '시험 전 스터디 결성', cond: s => specialsFor(s.year, s.sem, s.day + 1).includes('exam') && FRIEND_IDS.filter(id => s.met[id]).length >= 2,
  text: '시험 직전, 친구들이 도서관 스터디룸을 예약했다. "너도 와!"',
  choices: [
    { label: '같이 공부한다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 4)); G.grow('study', 2); G.fat(8); return '서로 모르는 걸 설명해 주다 보니 머리에 쏙쏙 들어왔다.'; } },
    { label: '간식 담당을 맡는다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 5)); G.grow('social', 2); return '스터디룸이 간식 파티장이 됐다. 공부는 절반만 했다.'; } },
  ] });
ev({ id: 'birthday', rel: true, title: '친구의 생일', cond: s => FRIEND_IDS.some(id => s.met[id] && !s.flags['bday_' + id]),
  setup: (s, c) => { const l = FRIEND_IDS.filter(id => s.met[id] && !s.flags['bday_' + id]); c.who = l[Math.floor(Math.random() * l.length)]; s.flags['bday_' + c.who] = 1; },
  who: (s, c) => c.who,
  text: (s, c) => `학년 단톡방에 누가 몰래 공지를 올렸다. "오늘 ${N(c.who)} 생일!" 정작 본인은 아무 말도 안 하고 있다.`,
  choices: [
    { label: '깜짝 파티를 연다', run: (s, c) => { G.aff(c.who, 14); FRIEND_IDS.forEach(id => s.met[id] && id !== c.who && G.aff(id, 2)); G.fat(6); return `매점 초코파이로 케이크를 쌓았다. ${N(c.who)}${josa(N(c.who), '이', '가')} 눈시울을 붉혔다.`; } },
    { label: '선물을 산다 (8,000원)', req: s => (s.money || 0) >= 8000, reqText: '용돈이 부족하다', run: (s, c) => { s.money -= 8000; G.aff(c.who, 16); return `용돈을 털어 산 선물을 건넸다. ${N2(c.who)} 한참 포장지를 만지작거렸다.`; } },
    { label: '조용히 편지를 건넨다', run: (s, c) => { G.aff(c.who, 10); return '짧은 편지였지만, 다음 날 그 편지가 필통 안에 꽂혀 있었다.'; } },
  ] });
ev({ id: 'walk_home', rel: true, title: '하굣길', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `하굣길, ${N(c.who)}${josa(N(c.who), '이', '가')} 같은 방향이라며 따라왔다. 남한강 둑길로 노을이 진다.`,
  choices: [
    { label: '편의점에 들른다', run: (s, c) => { G.aff(c.who, 7); G.fat(-6); return '컵라면 하나씩 들고 벤치에 앉았다. 오늘 하루가 괜찮아졌다.'; } },
    { label: '진로 이야기를 한다', run: (s, c) => { G.aff(c.who, 9); G.grow('study', 1); return '서로의 꿈을 처음으로 털어놓았다. 생각보다 진지한 대화였다.'; } },
  ] });
['bread_last', 'group_project', 'friend_down'].forEach(id => { EVENTS[id].rel = true; });

/* ───────── 이과 자율동아리 ───────── */
ev({ id: 'auto_club_fair', type: 'story', once: true, title: '이과 자율동아리 모집',
  text: '1학기 중간, 과학중점학교 이과 자율동아리 네 곳이 신입 부원을 모집한다. 정규 동아리와는 따로 활동하고, 생활기록부에도 남는다.',
  choices: Object.entries(AUTO_CLUBS).map(([k, a]) => ({ label: a.name, hint: a.desc,
    run: s => { s.autoClub = k; syncFriends(s); G.meet(a.friend); G.aff(a.friend, 6); return `${a.name}에 가입했다! ${a.welcome}`; } })).concat([
    { label: '가입하지 않는다', run: s => { G.fat(-8); return '자율동아리는 패스. 대신 방과후가 여유로워졌다.'; } }]) });

const AUTO_EVENTS = {
  robotics: [
    { text: '부원들과 만든 라인트레이서가 처음으로 트랙을 완주하기 직전, 바퀴가 빠졌다. 시온이가 순간접착제를 꺼낸다.',
      choices: [
        { label: '원인을 분석한다', hint: '공부 판정', run: s => { if (G.check('study', 50)) { G.grow('study', 3); return '모터 축 규격이 달랐다. 고친 로봇은 트랙 세 바퀴를 완주했다.'; } G.fat(8); return '원인을 못 찾았다. 그래도 오답 노트처럼 기록은 남겼다.'; } },
        { label: '시온이와 접착제로 붙인다', run: s => { G.aff('sion', 8); G.absurd(); return '바퀴가 단단히 붙었다. 시온이가 기념으로 로봇 완주 축하 댄스를 췄다.'; } },
      ] },
    { text: '경기도 청소년 로봇 경진대회 본선. 마지막 미션은 미로 탈출이다.',
      choices: [
        { label: '정석 알고리즘으로 간다', hint: '공부 판정', run: s => { if (G.check('study', 55)) { G.add('rep', 8); G.achieve('auto_club'); return '좌수법 알고리즘으로 최단 시간 탈출! 장려상을 받았다.'; } G.add('rep', 3); return '아쉽게 벽에 부딪혔다. 그래도 완주한 팀은 우리뿐이었다.'; } },
        { label: '현장에서 즉흥 개조한다', hint: '운 판정', run: s => { if (G.check('luck', 50)) { G.add('rep', 10); G.achieve('auto_club'); return '테이프와 빨대로 만든 범퍼가 신의 한 수였다. 창의상 수상!'; } G.absurd(); return '로봇이 미로 대신 심사위원석으로 돌진했다. 인상은 확실히 남겼다.'; } },
      ] },
  ],
  squid: [
    { text: '버터구이 수조의 갑오징어가 처음으로 알을 낳았다! 부원들 사이에 이름 짓기 전쟁이 벌어졌다.',
      choices: [
        { label: '관찰 일지를 쓴다', run: s => { G.grow('study', 3); return '부화까지 매일 기록했다. 알 속에서 작은 갑오징어가 꿈틀거렸다.'; } },
        { label: '"버터"라고 이름 짓는다', run: s => { G.absurd(); G.aff('jiyong', 6); G.nick('버터 집사'); return '반대 0표로 통과. 지용이가 "다음 알은 내 인큐베이터로 부화시키자"며 설계도를 꺼냈다.'; } },
      ] },
    { text: '갑오징어 생태 탐구 발표회. 심사위원이 묻는다. "그런데 동아리 이름이 왜 버터구이죠?"',
      choices: [
        { label: '진지하게 답한다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 8); G.achieve('auto_club'); return '"먹을 것으로만 보던 생물을 지키자는 역설입니다." 심사위원이 박수를 쳤다. 우수상!'; } G.add('rep', 3); return '말이 꼬였지만 탐구 내용은 탄탄했다.'; } },
        { label: '솔직하게 답한다', run: s => { G.absurd(); G.add('rep', 6); G.achieve('auto_club'); return '"처음엔… 먹으려고 키웠습니다." 강당이 웃음바다가 됐다. 인기상 수상.'; } },
      ] },
  ],
  seed: [
    { text: '시드핸즈 텃밭에 뿌린 양평 토종 씨앗에서 싹이 텄다. 시훈이가 사진을 백 장째 찍고 있다.',
      choices: [
        { label: '발아율 비교 실험을 한다', run: s => { G.grow('study', 3); return '온도별 발아율 그래프를 그렸다. 탐구 보고서 각이 나온다.'; } },
        { label: '키운 상추를 급식실에 기부한다', run: s => { G.add('rep', 4); G.aff('sihun', 6); return '다음 날 급식에 "시드핸즈 상추"가 나왔다. 영양사님이 이름표까지 붙여 주셨다.'; } },
      ] },
    { text: '토종 씨앗 나눔 장터를 열었다. 양평 시장 상인분들까지 구경을 오셨다.',
      choices: [
        { label: '씨앗 이야기를 설명한다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 8); G.achieve('auto_club'); return '할머니 한 분이 50년 된 씨앗을 기증해 주셨다. 지역 신문에 실렸다!'; } G.add('rep', 3); return '설명은 서툴렀지만 씨앗 봉투는 전부 나갔다.'; } },
        { label: '씨앗 봉투를 예쁘게 꾸민다', hint: '운 판정', run: s => { G.add('rep', 5); if (G.check('luck', 45)) { G.achieve('auto_club'); return '봉투 디자인이 입소문을 탔다. 교육청 행사에도 초대받았다.'; } return '봉투가 예뻐서 씨앗보다 봉투가 더 인기였다.'; } },
      ] },
  ],
  water: [
    { text: '워터스캔 첫 남한강 현장 측정. pH 측정기 화면에 14.0이라는 숫자가 떴다. 남한강이 양잿물일 리는 없다.',
      choices: [
        { label: '보정하고 다시 잰다', hint: '공부 판정', run: s => { if (G.check('study', 45)) { G.grow('study', 3); return '보정 용액을 바꾸자 7.4가 나왔다. 남한강은 건강하다.'; } G.fat(6); return '세 번을 다시 쟀다. 해가 졌다.'; } },
        { label: '태열이에게 물어본다', run: s => { G.aff('taeyeol', 8); return '"전극에 물기를 안 닦았네." 태열이가 웃으며 조용히 닦아 줬다.'; } },
      ] },
    { text: '1년치 남한강 수질 데이터를 정리했다. 지역 환경 단체가 자료를 요청해 왔다.',
      choices: [
        { label: '데이터를 공개한다', run: s => { G.add('rep', 8); G.achieve('auto_club'); return '워터스캔 데이터가 양평 하천 지도에 실렸다. 출처에 우리 동아리 이름이 적혀 있다.'; } },
        { label: '탐구 논문으로 다듬는다', hint: '공부 판정', run: s => { if (G.check('study', 55)) { G.grow('study', 4); G.achieve('auto_club'); return '청소년 과학탐구대회에서 동상을 받았다!'; } G.grow('study', 2); return '논문은 미완성이지만 실력은 늘었다.'; } },
      ] },
  ],
};
Object.entries(AUTO_EVENTS).forEach(([k, list]) => list.forEach((e, i) => ev({
  id: `auto_${k}_${i}`, type: 'club', once: true, title: `${AUTO_CLUBS[k].name} · ${i ? '대회의 날' : '첫 성과'}`,
  who: () => AUTO_CLUBS[k].friend, text: e.text, autoClub: k, threshold: i ? 9 : 4,
  choices: e.choices.map(ch => Object.assign({}, ch, { run: (s, c) => { const r = ch.run(s, c); addSetuk(AUTO_CLUBS[k].name, AUTO_CLUBS[k].setuk[i]); return r; } })),
})));

/* ───────── 수행평가 ───────── */
ev({ id: 'perf', type: 'story', title: '수행평가 주간',
  setup: (s, c) => {
    const done = (s.perf[semKey(s)] || {});
    const subs = subjectsOf(s).filter(x => done[x.name] == null);
    c.subs = subs.sort(() => Math.random() - 0.5).slice(0, 3).map(x => x.name);
  },
  text: (s, c) => c.subs.length ? `수행평가가 한 주에 몰렸다. ${c.subs.map(n => { const x = subjectsOf(s).find(y => y.name === n); return `${n}(${PERF_TASKS[x.area] || '과제'})`; }).join(', ')}. 다 잘하긴 어렵다. 어디에 힘을 줄까? 수행평가는 학기 성적의 40%다.` : '이번 학기 수행평가는 이미 다 끝냈다.',
  choices: (s, c) => c.subs.map(n => { const x = subjectsOf(s).find(y => y.name === n); const f = mateOf(x.friend), mate = f && s.met[f];
    return { label: `${n} 집중`, hint: `${PERF_TASKS[x.area] || '과제'}${mate ? ` · ${N(f)}${josa(N(f), '과', '와')} 같은 조` : ''}`, run: () => perfFocus(c.subs, n) }; })
    .concat(s.stats.stamina >= 60 && c.subs.length >= 2 ? c.subs.flatMap((a, i) => c.subs.slice(i + 1).map(b => ({ label: `${a} + ${b} 둘 다 집중`, hint: '체력 60 이상 · 피로 많이 쌓임', run: () => perfFocus(c.subs, [a, b]) }))) : [])
    .concat(s.stats.stamina >= 80 && c.subs.length >= 3 ? [{ label: '세 과목 모두 집중', hint: '체력 80 이상 · 피로 크게 쌓임', run: () => perfFocus(c.subs, c.subs.slice()) }] : [])
    .concat([{ label: c.subs.length ? '골고루 적당히' : '확인', run: () => perfFocus(c.subs, null) }]) });

/* ───────── 대학 진학 ───────── */
ev({ id: 'college_apply', type: 'story', once: true, title: '수시 원서 접수',
  text: s => { const m = metrics(s); return `3학년 2학기, 원서 시즌이다. 지금까지 내신 평균 ${Math.round(m.gpa * 10) / 10}등급, 세특 ${s.setuk.length}줄${s.autoClub ? `, 자율동아리 ${AUTO_CLUBS[s.autoClub].name}` : ''}. 철벽 쌤이 묻는다. "어떤 전형으로 갈래?"`; },
  who: () => 'teacher',
  choices: [
    { label: '수시 학생부교과', hint: '내신 등급 중심', run: s => { s.route = 'gyogwa'; return '"내신이 무기라면 교과가 맞다." 원서 6장을 꼼꼼히 골랐다.'; } },
    { label: '수시 학생부종합', hint: '내신 + 세특 · 동아리 활동', run: s => { s.route = 'jonghap'; return '"네 생기부는 이야기가 있다." 자기소개 대신 3년치 활동을 정리했다.'; } },
    { label: '체대 입시 (실기)', hint: '체력·체육 활동 중심 · 체력 60 이상', req: s => s.stats.stamina >= 60, reqText: '체력 60 이상이어야 한다', run: s => { s.route = 'sports'; G.grow('stamina', 2); return '"실기는 하루아침에 안 된다." 매일 아침 운동장 다섯 바퀴가 시작됐다.'; } },
    { label: '정시로 승부', hint: '11월 수능 성적 중심', run: s => { s.route = 'jeongsi'; G.grow('study', 2); return '"그럼 남은 건 수능뿐이다." 독서실 자리를 1년 끊었다.'; } },
  ] });
ev({ id: 'college_result', type: 'story', once: true, title: '합격자 발표',
  text: s => `${ROUTES[s.route || 'jonghap']} 결과 발표 날. 손이 떨려서 조회 버튼을 세 번 잘못 눌렀다.`,
  choices: [{ label: '결과 확인', run: s => {
    const r = collegeResult(s); s.college = r;
    if (r.tier === null) return `이번엔 아쉽게도… ${r.major} 지원은 모두 불합격. 재수를 결심했다. 1년 뒤의 나는 더 강할 거다.`;
    if (r.rank <= 1) { G.achieve('college_top'); SFX.play('fanfare'); }
    return `${r.tier} ${r.major} 합격! 교실에 함성이 터졌다.`; } }] });

/* ───────── 2026 학사일정 행사 · 전교회장 선거 ───────── */
ev({ id: 'exp_day', type: 'story', title: s => s.year === 1 ? '1학년 학생 주도형 체험학습 (6/11)' : '3학년 체험학습 · 롯데월드 (6/11)',
  text: s => s.year === 1 ? '반별로 직접 계획하는 학생 주도형 체험활동 날. 우리 반은 어디로 갈지 투표로 정했다.' : '수능 전 마지막 단체 나들이, 3학년 롯데월드. 다들 문제집을 챙겨 왔다가 결국 한 번도 꺼내지 않았다.',
  choices: s => s.year === 1 ? [
    { label: '동대문 디자인 플라자', run: s => { G.add('luck', 2); G.grow('social', 2); addSetuk('체험활동', '동대문 디자인 플라자 체험학습에서 곡선 건축 구조를 관찰하고 공간 디자인 보고서를 작성함.'); return '은빛 건물 곡선 아래서 건축가가 된 기분이었다.'; } },
    { label: '대학로 극장', run: s => { G.grow('social', 3); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); return '소극장 연극을 보고 나와서 반 친구들이 명대사를 따라 하며 걸었다.'; } },
    { label: '롯데월드 아쿠아리움', run: s => { G.fat(-10); G.add('luck', 2); return '벨루가가 유리창 앞에 멈춰 섰다. 버터구이 부원들이 갑오징어 수조 앞을 떠나지 못했다.'; } },
    { label: '대학 탐방 (한국외대·경희대)', run: s => { G.grow('study', 3); addSetuk('진로활동', '대학 탐방 프로그램에 참여해 전공별 교육과정을 조사하고 진로 계획을 구체화함.'); return '캠퍼스를 걸으며 3년 뒤의 나를 상상했다.'; } },
  ] : [
    { label: '친구들과 놀이기구 정복', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 5)); G.fat(-10); return '아틀란티스 줄에서 3년치 이야기를 다 했다.'; } },
    { mode: 'classic', label: '그 사람과 퍼레이드를 본다', req: s => !!(s.partner || s.crush), reqText: '썸이나 연인이 있어야 한다', run: s => { const w = s.partner || s.crush; s.love[w] = clamp(s.love[w] + 12); return `불빛 퍼레이드 아래서 ${N(w)}${josa(N(w), '이', '가')} 손을 잡았다. (설렘 ${s.love[w]})`; } },
    { label: '벤치에서 단어장을 편다', run: s => { G.grow('study', 3); G.absurd(); return '롯데월드에서 단어를 외운 사람은 나뿐이었다. 친구들이 사진을 찍어 갔다.'; } },
  ] });
ev({ id: 'field_trip2', type: 'story', once: true, title: '2학년 현장체험학습 (10/29)',
  text: '2학년 현장체험학습 날. 코스는 코엑스와 별마당 도서관. 어디서 시간을 보낼까?',
  choices: [
    { label: '코엑스 과학 전시관', run: s => { G.grow('study', 3); addSetuk('체험활동', '코엑스 과학 전시 관람 후 인상 깊은 기술을 골라 원리를 조사해 발표함.'); return '전시된 로봇팔을 보며 로보틱스 부원들이 수첩을 꺼냈다.'; } },
    { label: '별마당 도서관', run: s => { G.grow('study', 1); G.fat(-12); const w = pickFriend(s); if (w) G.aff(w, 6); return `거대한 책장 아래 ${w ? N(w) + josa(N(w), '과 ', '와 ') : ''}나란히 앉아 책을 읽었다.`; } },
    { label: '영화 감상', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); G.fat(-8); return '영화가 끝나고 결말 해석으로 반이 둘로 갈렸다.'; } },
  ] });
ev({ id: 'cheer', type: 'story', title: '수능 날 교문 응원 (11/19)',
  text: s => `11월 19일 대학수학능력시험 날. ${s.year}학년은 휴업이지만, 새벽 6시 교문 앞에 핫팩과 응원 피켓을 든 후배들이 모였다.`,
  choices: [
    { label: '새벽 응원에 나간다', run: s => { G.add('rep', 3); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); G.fat(8); return `"선배님 대박!" 목이 쉬도록 외쳤다. ${3 - s.year}년 뒤엔 내가 저 교문으로 들어가겠지.`; } },
    { label: '집에서 푹 쉰다', run: s => { G.fat(-25); return '수능 휴업일. 이불 속에서 하루를 보냈다.'; } },
    { label: '수능 문제를 풀어 본다', hint: '공부', run: s => { G.grow('study', 3); return '오후에 공개된 수능 국어 문제를 풀었다. …정신이 번쩍 들었다.'; } },
  ] });
const bestFriend = s => FRIEND_IDS.filter(id => s.met[id]).sort((a, b) => s.aff[b] - s.aff[a])[0] || null;
ev({ id: 'election', type: 'story', once: true, title: '전교 학생회장 선거 공고', cond: s => electionEligible(s),
  who: s => bestFriend(s),
  text: s => { const b = bestFriend(s); const rest = FRIEND_IDS.filter(id => s.met[id] && id !== b && s.aff[id] >= 40).map(N); return `2학기, 내년도 전교 학생회장 선거 공고가 붙었다. ${b ? N2(b) : '친구들이'} 공고문을 떼어 와 내 책상에 내려놓는다. "너 나가. 우리가 다 밀어줄게."${rest.length ? ` 뒤에서 ${rest.join(', ')}도 손을 번쩍 든다. "선거운동본부 우리가 맡을게!"` : ''}`; },
  choices: s => { const b = bestFriend(s); return [
    { label: '전교회장에 출마한다', hint: '친구 친밀도·학교 친구 우정 ★이 표가 된다 · 학생회 경력도 유리', run: s => { s.flags.candidate = 1; s.queue.unshift('election_campaign'); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); return '출마 서류에 이름을 적었다. 손이 떨렸다. 친구들이 바로 선거운동본부를 차렸다.'; } },
    b && { label: `${N(b)}${josa(N(b), '을', '를')} 회장으로, 나는 부회장으로`, run: s => { G.aff(b, 10); G.add('rep', 6); s.flags.vicePresident = 1; addSetuk('자율활동', '학생회 부회장으로 활동하며 학급 간 소통 창구를 마련함.'); return `${N(b)}${josa(N(b), '과', '와')} 러닝메이트로 나가 압도적인 표차로 당선됐다! 부회장 명찰을 받았다.`; } },
    { label: '선거대책위원장만 맡는다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 4)); G.grow('social', 3); return '친구를 회장으로 만들었다. 무대 뒤의 실세가 됐다.'; } },
    { label: '출마하지 않는다', run: s => { G.fat(-5); return '"아쉽다…" 친구들이 공고문을 다시 붙였다.'; } },
  ].filter(Boolean); } });
ev({ id: 'election_campaign', type: 'story', once: true, title: '선거 유세의 날', who: s => bestFriend(s),
  text: '선거 당일 강당. 후보는 셋. 마지막 3분 연설만 남았다. 친구들이 맨 앞줄에서 손팻말을 흔든다. 어떤 공약으로 승부할까?',
  choices: [
    { label: '급식 메뉴 투표제', hint: '평판이 높을수록 유리', run: s => electionResult('급식 메뉴 투표제를 도입하겠습니다!', s.stats.rep * 0.1) },
    { label: '매점 영업시간 연장', hint: '사교성이 높을수록 유리', run: s => electionResult('매점 문을 10분 더 열겠습니다!', s.stats.social * 0.1) },
    { label: '축제를 이틀로 확대', hint: '운이 좋을수록 유리', run: s => electionResult('축제를 이틀로 늘리겠습니다!', s.stats.luck * 0.1) },
    { label: '교감냥을 명예 교사로', hint: '???', run: s => { G.absurd(); return electionResult('교감냥을 명예 교사로 임명하겠습니다!', s.flags.catFriend ? 12 : G.rand(-5, 9)); } },
  ] });

/* ───────── 학교 시설: 천문대 · 체육관 ───────── */
LOCATIONS.observatory = { name: '천문대', desc: '망원경 · 별 관측' };
LOCATIONS.gym = { name: '체육관', desc: 'Y리그 연습 · 배드민턴' };
ev({ id: 'star_night', loc: 'observatory', title: '천문대의 밤', text: '야자가 끝나고 천문대에 올라갔다. 망원경 너머로 토성 고리가 보인다.',
  choices: [
    { label: '친구를 불러 같이 본다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 7); return `${N(w)}${josa(N(w), '이', '가')} 접안렌즈에서 눈을 떼지 못했다. "진짜 고리가 있네…"`; } },
    { label: '천체 사진을 찍는다', run: s => { G.add('luck', 2); G.grow('study', 2); addSetuk('천체 체험', '천문대 망원경으로 장노출 천체 사진을 촬영하고 영상 합성으로 달 표면 이미지를 완성함.'); return '장노출로 찍은 달 사진이 생각보다 선명하게 나왔다.'; } },
  ] });
ev({ id: 'gym_shoot', loc: 'gym', title: '체육관 자유투', text: '텅 빈 체육관에 농구공 하나가 굴러다닌다.',
  choices: [
    { label: '자유투 10개 도전', hint: '체력 판정', run: s => { if (G.check('stamina', 45)) { G.grow('stamina', 3); return '8개 성공! 2층 난간에서 누군가 박수를 쳤다.'; } G.grow('stamina', 1); return '림이 나를 거부했다. 그래도 땀은 개운하다.'; } },
    { label: '친구와 1대1', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 8); G.grow('stamina', 2); G.fat(10); return `${N2(w)} "한 판만 더!"를 열 번 외쳤다. Y리그 주전 각이다.`; } },
  ] });
ev({ id: 'gym_badminton', loc: 'gym', title: '배드민턴부 연습', text: '배드민턴부가 연습 중이다. 셔틀콕이 발 앞에 떨어졌다. "한 게임 할래요?"',
  choices: [
    { label: '라켓을 잡는다', run: s => { G.grow('stamina', 3); G.grow('social', 1); G.fat(8); return '스매시가 한 번 제대로 들어갔다. 부원들이 입부 원서를 내밀었다.'; } },
    { label: '셔틀콕만 돌려준다', run: s => { G.fat(-5); return '셔틀콕을 던졌는데 네트를 넘어갔다. 박수가 나왔다.'; } },
  ] });

/* ───────── 인간관계 사건 ───────── */
ev({ id: 'pe_partner', rel: true, title: '체육 시간 2인 1조',
  setup: (s, c) => { const u = FRIEND_IDS.filter(id => !s.met[id]); c.who = u.length && Math.random() < 0.5 ? u[Math.floor(Math.random() * u.length)] : pickFriend(s); },
  who: (s, c) => c.who,
  text: (s, c) => `체육 시간, 선생님이 "2인 1조!"를 외쳤다. 정신을 차려 보니 ${s.met[c.who] ? N(c.who) : '같은 반이지만 말해 본 적 없는 ' + N(c.who)}${josa(N(c.who), '과', '와')} 짝이 됐다. 과제는 2인 3각 달리기.`,
  choices: [
    { label: '구령 맞춰 진지하게 뛴다', hint: '체력 판정', run: (s, c) => { G.meet(c.who); if (G.check('stamina', 40)) { G.aff(c.who, 10); return '하나, 둘, 하나, 둘! 반에서 1등으로 들어왔다. 하이파이브가 저절로 나왔다.'; } G.aff(c.who, 6); return '세 걸음 만에 같이 넘어졌다. 바닥에 누워서 한참 웃었다.'; } },
    { label: '장난치며 천천히 간다', run: (s, c) => { G.meet(c.who); G.aff(c.who, 7); G.grow('social', 2); return `꼴찌였지만 ${N(c.who)}${josa(N(c.who), '이', '가')} 제일 많이 웃었다.`; } },
  ] });
ev({ id: 'group_chat', rel: true, title: '단톡방 대참사', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `${N(c.who)}에게만 보내려던 "내일 철벽 쌤 수업 진짜 졸릴 듯"을 반 단톡방에 보냈다. 철벽 쌤도 있는 방이다. 읽음 표시가 하나씩 사라진다.`,
  choices: [
    { label: '"쌤 죄송합니다"를 바로 보낸다', run: (s, c) => { G.aff('teacher', 3); G.aff(c.who, 4); return '쌤의 답장: "내일 1교시 쪽지시험." 반 전체가 나를 원망했다. 그래도 덕분에 다 같이 밤새 공부했다.'; } },
    { label: `친구에게 도움을 청한다`, run: (s, c) => { G.aff(c.who, 9); G.absurd(); return `${N(c.who)}${josa(N(c.who), '이', '가')} 곧바로 고양이 짤 50개를 올려 메시지를 밀어냈다. 진정한 친구다.`; } },
  ] });
ev({ id: 'lost_phone', rel: true, title: '사라진 휴대폰', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `${N(c.who)}${josa(N(c.who), '이', '가')} 사색이 됐다. 휴대폰이 없어졌단다. 5교시 시작까지 10분.`,
  choices: [
    { label: '같이 학교를 뒤진다', hint: '운 판정', run: (s, c) => { G.aff(c.who, 8); G.fat(6); if (G.check('luck', 40)) { G.aff(c.who, 4); return '급식실 잔반통 옆 선반에서 찾았다. 둘이 부둥켜안고 소리 질렀다.'; } return '결국 교무실 분실물 함에 있었다. 그래도 같이 뛰어다녀 준 게 고맙다고 했다.'; } },
    { label: '내 폰으로 전화를 걸어 준다', run: (s, c) => { G.aff(c.who, 6); G.absurd(); return `벨 소리가 ${N(c.who)}의 가방 안에서 울렸다. 벨 소리는 교가였다.`; } },
  ] });
ev({ id: 'missed_bus', rel: true, title: '버스를 놓친 날', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `막차 버스가 눈앞에서 떠났다. 옆을 보니 ${N(c.who)}도 같은 버스를 놓쳤다. 다음 버스는 40분 뒤.`,
  choices: [
    { label: '양평읍까지 같이 걷는다', run: (s, c) => { G.aff(c.who, 10); G.grow('stamina', 1); return '가로등 아래서 처음 듣는 이야기들이 쏟아졌다. 40분이 4분 같았다.'; } },
    { label: '정류장에서 같이 컵라면을 먹는다', run: (s, c) => { G.aff(c.who, 7); G.fat(-6); return '편의점 컵라면이 인생 최고의 맛이었다.'; } },
  ] });
ev({ id: 'night_snack', rel: true, title: '야자 끝, 편의점', cond: s => FRIEND_IDS.filter(id => s.met[id]).length >= 2,
  setup: (s, c) => { const m = FRIEND_IDS.filter(id => s.met[id]).sort(() => Math.random() - 0.5); c.a = m[0]; c.b = m[1]; }, who: (s, c) => c.a,
  text: (s, c) => `야간 자율학습이 끝난 밤 10시. ${N(c.a)}, ${N(c.b)}${josa(N(c.b), '과', '와')} 편의점 앞 파라솔에 앉았다. 남은 돈은 셋이 합쳐 4,300원.`,
  choices: [
    { label: '삼각김밥을 셋이 나눈다', run: (s, c) => { G.aff(c.a, 6); G.aff(c.b, 6); return '김밥 하나를 셋이 나눠 먹었다. 이상하게 배가 불렀다.'; } },
    { label: '내가 쏜다', run: (s, c) => { G.aff(c.a, 8); G.aff(c.b, 8); G.add('luck', -1); return '"너 오늘 왜 이렇게 멋있냐?" 지갑은 가벼워졌지만 마음은 무거워지지 않았다.'; } },
  ] });
ev({ id: 'study_bet', rel: true, title: '친구의 도전장', cond: s => FRIEND_IDS.some(id => s.met[id] && s.aff[id] >= 30),
  setup: (s, c) => { const l = FRIEND_IDS.filter(id => s.met[id] && s.aff[id] >= 30); c.who = l[Math.floor(Math.random() * l.length)]; }, who: (s, c) => c.who,
  text: (s, c) => `"다음 시험, 한 과목이라도 나보다 잘 보면 내가 매점 쏠게." ${N2(c.who)} 장난스럽게 도전장을 내밀었다.`,
  choices: [
    { label: '도전을 받아들인다', run: (s, c) => { G.aff(c.who, 6); G.grow('study', 3); s.flags.examTip = (s.flags.examTip || 0) + 1; return `그날부터 경쟁적으로 공부했다. ${N2(c.who)} 몰래 요점 정리를 건네주기도 했다. (다음 시험 +4)`; } },
    { label: '"같이 공부하자"고 제안한다', run: (s, c) => { G.aff(c.who, 9); G.grow('study', 2); return '"…그것도 괜찮네." 내기는 스터디가 됐다.'; } },
  ] });
ev({ id: 'class_punish', rel: true, title: '연대 책임', cond: s => FRIEND_IDS.filter(id => s.met[id]).length >= 2,
  text: '누군가 교실 뒤 게시판에 철벽 쌤 캐리커처를 그려 놨다. 범인이 안 나오자 반 전체가 방과후 대청소 당첨.',
  choices: [
    { label: '친구들과 노래 부르며 청소한다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 4)); G.grow('social', 2); G.fat(8); return '빗자루 마이크로 떼창을 했다. 청소가 콘서트가 됐다.'; } },
    { label: '범인을 찾아낸다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 3); return '범인은 옆 반 미술부였다. 그런데 그림이 너무 잘 그려서 쌤이 액자에 넣었다.'; } G.fat(8); return '끝내 범인은 안 나왔다. 캐리커처는 아직도 게시판에 있다.'; } },
  ] });

/* ───────── 창의적 체험활동 (학교 안내 책자 기반) ───────── */
const TOPICS = ['친환경 미래 도시 설계 프로젝트', '식물 부위와 빛 조건에 따른 카탈레이스 활성 비교', '기가지니 스피커 분해로 내부 원리 이해하기', '현대 도시에서 공학 원리 찾기', '농구 심판법', '중력렌즈 효과의 관측',
  '양력 발생 원리와 제트 엔진 구동 탐구', '의료용 AI 로봇은 간호에서 인간의 역할을 약화시키는가?', '청소년의 과도한 SNS 이용과 관련 법률', '양자컴퓨터의 이해', '꽃에서 염료를 추출해 안료 만들기', '간이 수질분석 키트 개발',
  '3D 설계로 만든 다리의 하중 실험', '한류로 바라본 한일 문화 교류의 역사', '소비자 심리와 광고 효과', '지역 마스코트를 조사하고 우리 지역 마스코트 디자인하기', '외교 언어의 정형화된 표현과 국제적 맥락', '자율 주행 기술과 생물의 감각 기관 비교',
  '태양광 발전 전력 소비 시각화 시스템', '퀀텀닷과 뇌과학'];
ev({ id: 'topic_project', rel: true, title: '주제 탐구 프로젝트', cond: s => !s.flags['topic_' + semKey(s)] && FRIEND_IDS.some(id => s.met[id]),
  setup: (s, c) => { s.flags['topic_' + semKey(s)] = 1; c.topics = TOPICS.slice().sort(() => Math.random() - 0.5).slice(0, 3); c.team = FRIEND_IDS.filter(id => s.met[id]).sort(() => Math.random() - 0.5).slice(0, 2); },
  who: (s, c) => c.team[0],
  text: (s, c) => `학교자율과정 주제 탐구 프로젝트 기간. ${c.team.map(N).join(', ')}${josa(N(c.team[c.team.length - 1]), '과', '와')} 모둠이 됐다. 어떤 주제로 탐구할까?`,
  choices: (s, c) => c.topics.map(t => ({ label: t, run: (s, c) => {
    c.team.forEach(id => G.aff(id, 6)); G.grow('study', 3);
    addSetuk('자율활동', `주제 탐구 프로젝트에서 "${t}"을(를) 모둠원과 함께 탐구하고 결과 보고서를 발표함.`);
    return `"${t}" 보고서를 완성했다. 마지막 날 밤 모둠 단톡방은 새벽 2시까지 불이 꺼지지 않았다.`; } })) });
const LECTURES = [
  ['영어영문학과', 'hum', '영문과 = 통역사? 그건… 반만 맞습니다'], ['심리학과', 'hum', '심리학이 유망 분야인 이유'], ['경제학과', 'hum', '경영학과를 아우르는 경제학과의 포스'], ['정치외교학과', 'hum', '정치의 언어로 세계를 읽다'],
  ['국어교육과', 'hum', '국어로 세상을 가르치고, 마음을 울리다'], ['문예창작학과', 'hum', '요즘은 웹소설·드라마까지 씁니다'], ['컴퓨터공학과', 'sci', 'AI는 컴퓨터 프로그래밍에서 시작한다'], ['전자전기공학부', 'sci', '회로설계부터 코딩, 로봇까지'],
  ['기계공학과', 'sci', '일상부터 우주까지, 세상의 모든 기술에 연결된 공학'], ['바이오식품공학과', 'sci', '생명과 화학으로 미래를 설계하다'], ['의생명공학과', 'sci', '공학으로 생명을 디자인하다'], ['건축학과', 'sci', '공간을 디자인하고, 삶을 설계하는 사람들'],
  ['간호학과', 'sci', '생명을 돌보고 마음을 잇다'], ['화학과', 'sci', '화학과에 대한 소개'], ['체육교육과·스포츠과학과', 'any', '영웅을 만드는 숨겨진 영웅들 - 체대 입시 고민 해결'], ['산업디자인학과', 'any', '미대 입시와 디자인 전공 알아보기']];
ev({ id: 'human_library', rel: true, title: '진로아카데미 · 졸업생 초청 특강', cond: s => !s.flags['lecture_' + s.year],
  setup: (s, c) => { s.flags['lecture_' + s.year] = 1; c.ls = LECTURES.filter(l => !s.track || l[1] === s.track || l[1] === 'any').sort(() => Math.random() - 0.5).slice(0, 3); },
  text: (s, c) => '진로아카데미 \'휴먼라이브러리\' 날. 양일고를 졸업한 선배들이 전공 이야기를 들려주러 왔다. 어느 교실로 갈까?',
  choices: (s, c) => c.ls.map(([major, , title]) => ({ label: major, hint: `"${title}"`, run: (s, c) => {
    s.flags.dream = major; G.grow('study', 1);
    addSetuk('진로활동', `졸업생 초청 전공 탐색 특강("${title}")을 듣고 ${major} 진학을 목표로 진로 계획을 세움.`);
    const w = pickFriend(s); if (w) G.aff(w, 3);
    return `"${title}" 특강을 들었다. 선배의 마지막 말이 오래 남았다. "고등학교 때 했던 사소한 탐구가 다 이어져요." 꿈의 학과: ${major}`; } })) });
ev({ id: 'mentoring', rel: true, title: '교육 멘토링 봉사', cond: s => s.year >= 2 && !s.flags['mentor_' + s.year],
  setup: s => { s.flags['mentor_' + s.year] = 1; },
  text: '진로형 봉사활동 시간. 1학년 후배들을 대상으로 교육 멘토링을 하기로 했다. 어떤 과목을 맡을까?',
  choices: ['국어', '수학', '과학', '사회'].map(area => ({ label: `${area} 멘토링`, run: s => {
    s.mastery[area] = clamp((s.mastery[area] ?? s.stats.study * 0.6) + 4); G.add('rep', 3); G.grow('social', 2);
    if (clubTag(s) === 'teach') G.add('rep', 2);
    addSetuk('봉사활동', `진로형 봉사활동으로 1학년 후배 대상 ${area} 교육 멘토링을 꾸준히 진행함.`);
    return `후배가 "선배 덕분에 이해했어요!"라고 했다. 가르치면서 내가 더 많이 배웠다. (${area} 숙련도 +4)`; } })) });
ev({ id: 'campaign', rel: true, title: '교내 캠페인 활동', cond: s => FRIEND_IDS.filter(id => s.met[id]).length >= 1,
  setup: (s, c) => { c.team = FRIEND_IDS.filter(id => s.met[id]).sort(() => Math.random() - 0.5).slice(0, 2); }, who: (s, c) => c.team[0],
  text: (s, c) => `${c.team.map(N).join(', ')}${josa(N(c.team[c.team.length - 1]), '과', '와')} 모둠을 짜서 진로형 봉사활동으로 교내 캠페인을 하기로 했다. 주제는?`,
  choices: ['폐의약품 폐기법 안내 및 수거 캠페인', '배리어프리 장애 인식 개선 캠페인', '플라스틱 줄이기 영상 캠페인', '올바른 분리배출 캠페인'].map(t => ({ label: t, run: (s, c) => {
    c.team.forEach(id => G.aff(id, 5)); G.add('rep', 3);
    addSetuk('봉사활동', `모둠원과 함께 "${t}"을 기획하고 점심시간 피켓 캠페인을 진행함.`);
    return '점심시간마다 피켓을 들었다. 처음엔 쑥스러웠는데, 마지막 날엔 후배들이 먼저 와서 참여했다.'; } })) });
ev({ id: 'busking', rel: true, title: '금요일의 양스킹', text: '매주 금요일 점심, 길바닥 음악 갈라쇼 "양일 버스킹"이 열린다. 오늘은 무대가 비어 있다.',
  choices: [
    { label: '무대에 선다', hint: '사교성 판정', run: s => { const boost = clubTag(s) === 'band' ? 15 : 0; if (G.talent('voice') || G.check('social', 55 - boost)) { G.flag('stage'); G.add('rep', 6); return '첫 소절에 복도가 조용해지고, 후렴에서 떼창이 터졌다. 다음 주 앵콜 요청이 쏟아졌다.'; } G.add('rep', 2); G.nick('양스킹 삑사리'); return '음이 살짝 나갔지만 친구들이 휴대폰 플래시를 흔들어 줬다.'; } },
    { label: '친구와 듀엣을 한다', req: anyFriend, reqText: '아는 친구가 필요', run: s => { const w = pickFriend(s); G.aff(w, 8); G.add('rep', 3); return `${N(w)}${josa(N(w), '과', '와')} 화음을 맞췄다. 노래가 끝나고 서로 마주 보며 웃었다.`; } },
    { label: '관객석에서 떼창한다', run: s => { G.grow('social', 2); G.fat(-6); return '목이 쉬도록 따라 불렀다. 금요일 점심이 기다려진다.'; } },
  ] });

/* ───────── 과학의 날 · Y리그 ───────── */
const RESEARCH = ['버섯 균사체를 활용한 플라스틱 대체 포장재 개발', '플렉스 센서를 이용한 다관절 로봇팔 제어', '바이오 차로 복원한 토양의 개선 정도 비교', '새차증후군 VOCs 제거를 위한 흡착 성능 최적화',
  '레몬의 항균 효과를 이용한 천연 비누', '자이로센서를 이용한 선박 자동 제어', '베르누이 효과를 활용한 에너지 절감형 공기 순환 장치', '해조류 기반 친환경 코팅층 개발', '전기 자동차 회생 제동 장치의 기울기별 효율', '헬름홀츠 공명기의 신호 전달 가능성'];
ev({ id: 'science_day', type: 'story', title: '과학의 날 · 과학 동아리 발표회',
  setup: (s, c) => { c.topic = RESEARCH[Math.floor(Math.random() * RESEARCH.length)]; c.member = !!s.autoClub || clubTag(s) === 'science'; },
  text: (s, c) => c.member ? `과학의 날. 과학중점학교답게 강당이 과학 동아리 발표회장으로 바뀌었다. 우리 팀 주제는 "${c.topic}". 발표 순서가 다가온다.` : '과학의 날. 강당에서 과학 동아리 발표회, 과학 상황극 "톡신", 천체 체험 부스가 동시에 열렸다.',
  choices: (s, c) => [
    { label: c.member ? '과제 연구를 발표한다' : '발표회를 관람하며 질문한다', hint: '공부 판정', run: (s, c) => {
      if (!c.member) { G.grow('study', 2); return '질문 하나를 던졌더니 발표자 선배가 "좋은 질문!"이라며 명함을 줬다.'; }
      if (s.autoClub) s.autoPts += 2;
      if (G.check('study', 50)) { G.add('rep', 8); G.achieve('auto_club'); addSetuk('과학탐구', `과학의 날 동아리 발표회에서 "${c.topic}" 연구를 발표해 우수상을 받음.`); return '질의응답까지 막힘이 없었다. 우수상! 경기도 과학 동아리 발표회 대표로 뽑혔다.'; }
      G.add('rep', 3); addSetuk('과학탐구', `과학의 날 동아리 발표회에서 "${c.topic}" 연구 과정과 시행착오를 발표함.`); return '실험 데이터가 예상과 달랐지만, 실패를 분석한 부분이 좋은 평을 받았다.'; } },
    { label: '과학 상황극 "톡신"에 참여한다', hint: '사교성 판정', run: s => { if (G.check('social', 45)) { G.add('rep', 5); G.grow('social', 2); return '즉흥 대사로 강당을 뒤집었다. 과학 개념도 정확했다는 칭찬까지.'; } G.absurd(); return '대사를 까먹고 "엔트로피!"만 외쳤다. 그게 제일 큰 박수를 받았다.'; } },
    { label: '양평의 별 페스티벌 부스를 돕는다', run: s => { G.add('luck', 3); const w = pickFriend(s); if (w) G.aff(w, 5); return `망원경으로 달을 보여 주자 꼬마들이 줄을 섰다.${w ? ` ${N(w)}${josa(N(w), '이', '가')} 옆에서 별자리 설명을 맡았다.` : ''}`; } },
  ] });
ev({ id: 'yleague', type: 'story', title: s => `${s.year}학년 Y리그 결승`,
  text: s => `반 대항 구기종목 대회 Y리그 결승. 종목은 ${['농구', '배구', '피구'][s.year - 1]}. 체육관이 응원 소리로 터질 것 같다.`,
  choices: [
    { label: '주전으로 뛴다', hint: '체력 판정', run: s => {
      const pb = payback('sports'); const boost = (clubTag(s) === 'sport' ? 12 : 0) + pb.bonus;
      if (G.talent('sprint') || G.check('stamina', 55 - boost)) { G.flag('sportsWins'); G.add('rep', 6); G.achieve('yleague'); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); return pb.text.trim() + (pb.text ? ' ' : '') + '종료 휘슬과 함께 결승 득점! 반 친구들이 코트로 뛰어들었다. Y리그 우승!'; }
      G.fat(15); G.add('rep', 2); return pb.text.trim() + (pb.text ? ' ' : '') + '1점 차 준우승. 그래도 마지막까지 포기하지 않았다.'; } },
    { label: '매니저로 물을 나른다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 4)); G.grow('social', 2); return '작전 타임마다 물과 수건을 날랐다. 경기 후 MVP가 나에게 공을 줬다.'; } },
    { label: '응원석에서 소리 지른다', run: s => { G.fat(-8); G.grow('social', 1); return '목이 쉬었다. 반 응원가가 이제 머리에서 안 떠난다.'; } },
  ] });

/* ───────── 학생회 ───────── */
ev({ id: 'council_recruit', type: 'story', once: false, title: '학생회 신입 부원 모집', cond: s => !s.council && !s.flags['councilAsk' + s.year],
  setup: s => { s.flags['councilAsk' + s.year] = 1; },
  text: s => `${s.year === 1 ? '입학 3주째' : '2학년 새 학기'}, 학생회실 앞에 "신입 부원 모집" 포스터가 붙었다. 학생회 선배가 지원서를 내민다. "동아리랑 따로야. 학교 행사를 직접 만드는 거지." 어느 부서에 지원할까?`,
  choices: Object.entries(COUNCIL_DEPTS).map(([k, d]) => ({ label: d.name, hint: d.desc,
    run: s => { s.council = k; s.councilPts = 0; G.add('rep', 2); return `학생회 ${d.name}에 들어갔다! 첫 회의에서 "${s.year === 1 ? '막내' : '새 부원'}" 명찰을 받았다.`; } }))
    .concat([{ label: '지원하지 않는다', run: s => { G.fat(-5); return '학생회는 패스. 방과후는 내 시간이다.'; } }]) });
const COUNCIL_CHOICES = [
  [{ label: '내 아이디어를 밀어붙인다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 5); return '회의실이 조용해졌다가 박수가 터졌다. 내 안이 채택됐다.'; } G.add('rep', 1); return '반대 의견에 막혔다. 그래도 회의록에 내 이름이 남았다.'; } },
   { label: '양쪽 의견을 조율한다', run: s => { G.grow('social', 3); return '두 의견을 합친 절충안이 나왔다. 선배가 "센스 있다"고 했다.'; } }],
  [{ label: '현장에서 직접 해결한다', hint: '체력 판정', run: s => { if (G.check('stamina', 45)) { G.add('rep', 8); G.achieve('council'); return '뛰어다니며 문제를 해결했다. 행사가 끝나고 학생회장이 어깨를 두드렸다. "올해의 부원은 너다."'; } G.add('rep', 3); G.fat(12); return '완벽하진 않았지만 행사는 무사히 끝났다.'; } },
   { label: '부원들과 역할을 나눈다', hint: '사교성 판정', run: s => { if (G.check('social', 45)) { G.add('rep', 7); G.achieve('council'); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 2)); return '각자 맡은 일을 척척 해냈다. 학생회가 하나의 팀이 된 날이었다.'; } G.add('rep', 3); return '조금 삐걱댔지만 끝까지 함께했다.'; } }],
];
[0, 1].forEach(i => ev({ id: `council_${i}`, type: 'council', once: true, threshold: i ? 9 : 4,
  title: s => `학생회 ${COUNCIL_DEPTS[s.council].name} · ${i ? '큰 행사' : '첫 회의'}`,
  text: s => COUNCIL_DEPTS[s.council].events[i],
  choices: COUNCIL_CHOICES[i].map(ch => Object.assign({}, ch, { run: (s, c) => { const r = ch.run(s, c); addSetuk('자율활동', `학생회 ${COUNCIL_DEPTS[s.council].name} 부원으로서 ${i ? '대규모 학교 행사를 운영하며 문제 해결력을 발휘함' : '학생 의견을 모아 행사 기획 회의를 이끎'}.`); return r; } })) }));

/* ───────── 연애 모드 전용: 가상 친구·연애 ───────── */
ev({ mode: 'classic', id: 'meet_taepung', type: 'meet', loc: 'field', once: true, cond: s => !s.met.taepung, who: () => 'taepung',
  text: '운동장 철봉에 매달린 누군가가 소리친다. "야! 너 턱걸이 몇 개 해?"',
  choices: [
    { label: '도전을 받아 준다', hint: '체력 판정', run: s => { G.meet('taepung'); if (G.check('stamina', 50)) { G.aff('taepung', 12); return '"오… 제법인데? 난 강태풍. 오늘부터 라이벌이다!"'; } G.aff('taepung', 6); G.fat(8); return '세 개 하고 떨어졌다. "괜찮아, 내가 키워 줄게!"'; } },
    { label: '응원만 한다', run: s => { G.meet('taepung'); G.aff('taepung', 5); G.grow('social', 1); return '박수를 쳐 주자 한 개를 더 했다. "고맙다! 난 강태풍!"'; } },
  ] });
ev({ mode: 'classic', id: 'meet_sori', type: 'meet', loc: 'store', once: true, cond: s => !s.met.sori, who: () => 'sori',
  text: '매점 벤치에 앉은 아이가 수첩을 펼친다. "너 신입생 맞지? 이름, 반, 혈액형."',
  choices: [
    { label: '순순히 답한다', run: s => { G.meet('sori'); G.aff('sori', 8); G.add('rep', 2); return '"좋아, 네 소문은 내가 좋게 퍼뜨려 줄게. 난 나소리."'; } },
    { label: '역으로 질문한다', hint: '사교성 판정', run: s => { G.meet('sori'); if (G.check('social', 45)) { G.aff('sori', 12); G.add('luck', 1); return '"오, 나한테 질문하는 사람은 처음이야!" 학교 비밀 세 개를 알려 줬다.'; } G.aff('sori', 4); return '"그건 영업 비밀이야." 수첩이 탁 닫혔다.'; } },
  ] });
ev({ mode: 'classic', id: 'meet_jaemin', type: 'meet', loc: 'empty', once: true, cond: s => !s.met.jaemin, who: () => 'jaemin',
  text: '빈 교실 문을 열자 연기가 피어오른다. 그 가운데 고글을 쓴 아이가 서 있다. "어… 이건 실험이야."',
  choices: [
    { label: '창문을 열어 준다', run: s => { G.meet('jaemin'); G.aff('jaemin', 9); return '"생명의 은인이다! 난 변재민. 다음 실험도 같이 하자."'; } },
    { label: '무슨 실험인지 묻는다', run: s => { G.meet('jaemin'); G.aff('jaemin', 6); G.absurd(); return '"라면 스프로 연기를 만드는 실험이야." 왜인지는 끝까지 말해 주지 않았다.'; } },
  ] });

ev({ mode: 'classic', id: 'rocket', type: 'absurd', title: '페트병 로켓 사건', cond: s => s.met.jaemin, who: () => 'jaemin',
  text: '"카운트다운 들어간다!" 재민이가 페트병 로켓에 불을… 아니 물을 넣고 펌프질 중이다. 발사 각도가 교무실 창문을 향한다.',
  choices: [
    { label: '각도를 계산해 준다', hint: '공부 판정', run: s => { G.aff('jaemin', 6); if (G.check('study', 55)) { G.add('rep', 5); return '로켓은 정확히 운동장 한가운데 착지했다. 과학 선생님이 실험 보고서를 요청했다.'; } G.add('rep', -3); G.aff('teacher', -4); return '로켓은 교무실 화분을 정확히 명중했다. 둘 다 반성문 3장.'; } },
    { label: '같이 발사한다', run: s => { G.aff('jaemin', 10); G.add('rep', -2); G.nick('로켓 공범'); return '"3, 2, 1, 발사!" …교감 선생님 모자가 날아갔다. 재민이와 함께 복도를 질주했다.'; } },
    { label: '말린다', run: s => { G.aff('jaemin', -3); G.aff('teacher', 3); return '"에이, 재미없게." 그날 재민이는 조용했다. 하루 동안만.'; } },
  ] });
ev({ mode: 'classic', id: 'paper_interview', title: '양일학보 인터뷰', cond: s => s.met.sori, who: () => 'sori',
  text: '"양일학보 다음 호에 \'요즘 1학년\' 특집 기사 쓰는데, 인터뷰 좀 해 줘!" 소리가 수첩과 녹음기를 들이민다.',
  choices: [
    { label: '성실하게 답한다', run: s => { G.aff('sori', 7); G.add('rep', 4); return '기사 제목: "참되게 바르게 알차게, 우리 반 모범생". 조금 과장됐다.'; } },
    { label: '아무 말 대잔치를 한다', run: s => { G.aff('sori', 9); G.absurd(); G.add('rep', 2); return '기사 제목: "급식은 인생이다". 영문판 VOTIY에도 번역돼 실렸다.'; } },
  ] });
ev({ mode: 'classic', id: 'tp_sori_fight', rel: true, title: '태풍 vs 소리', cond: s => s.met.taepung && s.met.sori,
  text: '양일학보에 "체육부장 강태풍, 팔씨름 3연패"라는 기사가 실렸다. 태풍이가 신문을 들고 소리에게 따진다. "이거 오보야!" "사진 증거 있어!" 둘 다 나를 쳐다본다.',
  choices: [
    { label: '태풍이 편을 든다', run: s => { G.aff('taepung', 10); G.aff('sori', -6); return '"역시 넌 내 편이야!" 소리는 수첩에 뭔가를 적었다. 불길하다.'; } },
    { label: '소리 편을 든다', run: s => { G.aff('sori', 10); G.aff('taepung', -6); return '"기자는 사실만 쓴다고!" 태풍이는 운동장으로 뛰쳐나가 팔굽혀펴기를 시작했다.'; } },
    { label: '정정 기사를 제안한다', hint: '사교성 판정', run: s => { if (G.check('social', 55)) { G.aff('taepung', 6); G.aff('sori', 6); G.grow('social', 3); return '"강태풍, 3연패 후 4연승 도전 중" 후속 기사가 나갔다. 둘 다 만족했다.'; } G.aff('taepung', -2); G.aff('sori', -2); return '"넌 빠져!" 동시에 소리쳤다. 이상하게 그때만 마음이 잘 맞았다.'; } },
  ] });
ev({ mode: 'classic', id: 'rumor_jaemin', rel: true, title: '재민이에 대한 소문', cond: s => s.met.sori && s.met.jaemin,
  text: '"재민이가 과학실 비커를 깼대!" 소리가 퍼뜨린 소문이 반에 돌고 있다. 재민이는 억울하다는 얼굴이다.',
  choices: [
    { label: '재민이를 변호한다', run: s => { G.aff('jaemin', 10); G.aff('sori', -4); return '알고 보니 비커는 바람에 넘어진 거였다. 재민이가 처음으로 진지하게 고맙다고 했다.'; } },
    { label: '소리에게 출처를 묻는다', run: s => { G.aff('sori', 6); G.aff('jaemin', 3); G.add('luck', 1); return '"어… 출처가… 재민이 본인이었어." 재민이가 자랑하려고 지어낸 얘기였다.'; } },
    { label: '팝콘을 꺼낸다', run: s => { G.absurd(); G.fat(-5); return '둘의 공방을 구경했다. 결론은 안 났지만 재밌었다.'; } },
  ] });
ev({ mode: 'classic', id: 'chaerin_jaemin', rel: true, title: '반장과 사고뭉치', cond: s => s.met.chaerin && s.met.jaemin,
  text: '채린이가 학급 일지에 재민이 이름을 또 적고 있다. "이번 주만 세 번째야!" 재민이가 나에게 눈빛으로 구조 신호를 보낸다.',
  choices: [
    { label: '이번만 봐달라고 한다', run: s => { G.aff('jaemin', 8); G.aff('chaerin', -3); return '"…네가 책임져." 채린이가 지우개를 들었다.'; } },
    { label: '채린이 편에 선다', run: s => { G.aff('chaerin', 8); G.aff('jaemin', -4); G.aff('teacher', 2); return '재민이가 배신자라고 외쳤다. 하지만 다음 날부터 지각을 안 했다.'; } },
    { label: '셋이 같이 청소하자고 한다', run: s => { G.aff('chaerin', 5); G.aff('jaemin', 5); G.fat(8); return '셋이 교실을 닦다 보니 어느새 웃고 있었다. 채린이가 일지에서 이름을 지웠다.'; } },
  ] });
ev({ mode: 'classic', id: 'crush_advice', rel: true, title: '비밀 연애 상담', cond: anyFriend, setup: (s, c) => { c.who = pickFriend(s); }, who: (s, c) => c.who,
  text: (s, c) => `${N(c.who)}${josa(N(c.who), '이', '가')} 주변을 두리번거리더니 속삭인다. "나… 좋아하는 사람 생긴 것 같아. 아무한테도 말하지 마."`,
  choices: [
    { label: '진지하게 상담해 준다', run: (s, c) => { G.aff(c.who, 10); G.grow('social', 1); return '한 시간 동안 작전을 짰다. 결과는… 다음 화에.'; } },
    { label: '비밀을 지켜 주겠다고 맹세한다', run: (s, c) => { G.aff(c.who, 8); G.set('secretKept', 1); return '새끼손가락을 걸었다. 소리가 근처에 없어서 다행이다.'; } },
    { label: '누군지 맞혀 본다', hint: '운 판정', run: (s, c) => { if (G.check('luck', 50)) { G.aff(c.who, 6); G.absurd(); return '한 번에 맞혔다. 비명과 함께 등짝을 맞았다.'; } G.aff(c.who, 2); return '세 번 다 틀렸다. "넌 눈치가 없구나…"'; } },
  ] });
ev({ mode: 'classic', id: 'borrow_notes', rel: true, title: '사라진 필기 노트', cond: s => s.met.chaerin && s.met.jaemin,
  text: '채린이가 빌려준 반장 필기 노트를 재민이가 잃어버렸다. 시험이 일주일 남았다. 채린이 표정이 굳었고, 재민이는 내 뒤에 숨었다.',
  choices: [
    { label: '셋이 같이 노트를 복원한다', run: s => { G.aff('chaerin', 6); G.aff('jaemin', 6); G.grow('study', 3); return '밤새 기억을 더듬어 노트를 다시 썼다. 원본보다 내용이 더 많아졌다.'; } },
    { label: '채린이 편을 든다', run: s => { G.aff('chaerin', 10); G.aff('jaemin', -5); return '재민이는 3일 동안 채린이에게 매점 간식을 바쳤다.'; } },
    { label: '재민이 편을 든다', run: s => { G.aff('jaemin', 10); G.aff('chaerin', -5); return '"…다음엔 사본만 빌려줄게." 채린이가 한숨을 쉬었다.'; } },
  ] });

/* ───────── 연애 ───────── */
const loveName = s => s.partner || s.crush;
ev({ mode: 'classic', id: 'love_flutter', type: 'love', rel: true, title: '두근, 하는 순간',
  cond: s => !s.crush && !s.partner && FRIEND_IDS.some(id => s.met[id] && s.aff[id] >= 30 && !s.loveNo[id] && canDate(s, id)),
  setup: (s, c) => { const l = FRIEND_IDS.filter(id => s.met[id] && s.aff[id] >= 30 && !s.loveNo[id] && canDate(s, id)); c.who = l[Math.floor(Math.random() * l.length)]; c.k = Math.floor(Math.random() * 4); },
  who: (s, c) => c.who,
  text: (s, c) => [
    `비가 쏟아지는 하굣길, ${N2(c.who)} 우산을 반쯤 내 쪽으로 기울였다. 자기 어깨가 젖는데도 모른 척한다.`,
    `도서관에서 같은 책을 동시에 집었다. 손이 닿았다. ${N2(c.who)} 먼저 손을 뗐는데, 귀가 빨갛다.`,
    `운동장 스탠드, ${N2(c.who)} 말없이 이온음료를 건넸다. "…네 것도 사는 김에."`,
    `야자가 끝난 밤 교문 앞, ${N2(c.who)} "같이 가자" 하며 기다리고 있었다. 별이 유난히 밝다.`][c.k],
  choices: [
    { label: '심장이 뛴다… (썸 시작)', run: (s, c) => { s.crush = c.who; s.love[c.who] = 40; G.achieve('first_love'); return `그날 밤, ${N(c.who)}의 메시지 알림이 울릴 때마다 심장이 같이 울렸다.`; } },
    { label: '친구로서 웃어넘긴다', run: (s, c) => { G.aff(c.who, 4); s.loveNo[c.who] = 1; return '좋은 친구가 있다는 건 그것만으로 든든하다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_date', type: 'love', rel: true, title: (s, c) => s.partner ? '데이트' : '둘만의 시간',
  cond: s => !!loveName(s), setup: (s, c) => { c.who = loveName(s); c.k = Math.floor(Math.random() * 5); }, who: (s, c) => c.who,
  text: (s, c) => [
    `방과후, ${N(c.who)}와 남한강 둑길을 걸었다. 노을에 강물이 반짝인다.`,
    `점심시간 매점, ${N2(c.who)} 마지막 소보로빵을 반으로 갈라 내밀었다.`,
    `은행나무길 벤치. ${N2(c.who)} 떨어지는 잎을 잡으면 소원이 이뤄진다며 손을 뻗는다.`,
    `도서관 구석 자리, ${N(c.who)}와 나란히 앉아 문제집을 폈다. 집중이 될 리가 없다.`,
    `축제 연습이 끝난 운동장, 둘만 남았다. ${N2(c.who)} 하늘을 보며 말이 없다.`][c.k] + (s.partner ? '' : ' 우리는 무슨 사이일까?'),
  choices: [
    { label: '솔직한 마음을 조금 보여 준다', run: (s, c) => loveReact(c.who, 'sincere') },
    { label: '장난치며 웃게 해 준다', run: (s, c) => loveReact(c.who, 'playful') },
    { label: '상대 이야기를 더 묻는다', run: (s, c) => loveReact(c.who, 'curious') },
    { label: '오늘은 공부해야 해서…', run: (s, c) => { G.grow('study', 2); s.love[c.who] = clamp(s.love[c.who] - 4); return `"아, 그래…" ${N2(c.who)} 웃었지만 조금 서운해 보였다.`; } },
  ] });
ev({ mode: 'classic', id: 'love_confess', type: 'love', title: '고백할까?',
  cond: s => s.crush && !s.partner && s.love[s.crush] >= 50 && !s.waitConfess,
  setup: (s, c) => { c.who = s.crush; }, who: (s, c) => c.who,
  text: (s, c) => `${N(c.who)}${josa(N(c.who), '과', '와')} 함께 있으면 시간이 너무 빨리 간다. 친구들도 "너네 사귀냐?"고 묻는다. 이제 마음을 전할 때일까?`,
  choices: [
    { label: '내가 먼저 고백한다', hint: '설렘·친밀도가 높을수록 성공', run: (s, c) => {
      const w = c.who, p = clamp(0.6 + (s.love[w] - 50) / 50 + s.aff[w] / 300, 0.4, 0.97);
      if (Math.random() < p) { startCouple(w); return `은행나무 아래에서 마음을 전했다. ${N2(w)} 한참 말이 없다가 고개를 끄덕였다. "…나도."`; }
      s.love[w] = 15; G.aff(w, -6); s.crush = null; s.loveNo[w] = 1;
      return `"미안… 너는 정말 소중한 친구야." 일주일은 어색했지만, ${N2(w)} 먼저 다시 말을 걸어 줬다.`; } },
    { label: '상대가 먼저 말해 주길 기다린다', run: s => { s.waitConfess = 1; return '조금 더 기다려 보기로 했다. 메시지 창을 열었다 닫았다를 반복했다.'; } },
    { label: '친구로 남기로 한다', run: (s, c) => { G.aff(c.who, 3); s.loveNo[c.who] = 1; s.crush = null; return '마음을 접었다. 그래도 좋은 친구라는 사실은 변하지 않는다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_their_confess', type: 'love', title: (s, c) => `${N2(c.who)} 할 말이 있대`,
  cond: s => s.crush && !s.partner && s.waitConfess && s.love[s.crush] >= 55,
  setup: (s, c) => { c.who = s.crush; }, who: (s, c) => c.who,
  text: (s, c) => `방과후 빈 교실. ${N2(c.who)} 한참 머뭇거리다 말한다. "나… 너 좋아해. 꽤 오래전부터."`,
  choices: [
    { label: '"나도 좋아해."', run: (s, c) => { const w = c.who; startCouple(w); return `${N2(w)} 얼굴이 빨개진 채로 웃었다. 창밖 은행나무가 유난히 노랬다.`; } },
    { label: '"미안, 친구로 지내고 싶어."', run: (s, c) => { const w = c.who; G.aff(w, -4); s.crush = null; s.waitConfess = 0; s.loveNo[w] = 1; return `"…알겠어. 말해 줘서 고마워." ${N2(w)} 애써 웃었다.`; } },
  ] });
// 질투: 내가 다른 이성과 있는 걸 연인이 보거나, 연인이 다른 이성과 있는 걸 내가 본다
const rivalsForMe = s => FRIEND_IDS.filter(id => id !== s.partner && s.met[id] && canDate(s, id));
const rivalsForPartner = s => FRIEND_IDS.filter(id => id !== s.partner && s.met[id] && CHARACTERS[id].gender !== CHARACTERS[s.partner].gender);
function jealousHit(s, n) { s.flags.jealous = (s.flags.jealous || 0) + n; s.loveTension = clamp((s.loveTension || 0) + 10 * n); s.flags.fightCause = 'jealous'; }
ev({ mode: 'classic', id: 'love_jealous', type: 'love', title: '연인이 질투한다',
  cond: s => s.partner && rivalsForMe(s).length > 0,
  setup: (s, c) => { c.who = s.partner; const r = rivalsForMe(s); c.other = r[Math.floor(Math.random() * r.length)]; c.k = Math.floor(Math.random() * 3); }, who: (s, c) => c.who,
  text: (s, c) => [
    `${N(c.other)}${josa(N(c.other), '과', '와')} 매점에서 빵을 나눠 먹으며 웃는데, ${N2(c.who)} 문 앞에 서 있었다. "…맛있어 보이네." 목소리가 차갑다.`,
    `조별 과제 때문에 ${N(c.other)}${josa(N(c.other), '과', '와')} 밤늦게 메시지를 주고받았다. 그걸 본 ${N2(c.who)} 하루 종일 말이 없다.`,
    `양스킹에서 ${N(c.other)}${josa(N(c.other), '과', '와')} 듀엣을 했다. 박수가 쏟아지는데, 관객석의 ${N2(c.who)} 혼자 박수를 치지 않았다.`][c.k] + (s.loveSecret ? ' 비밀 연애라 대놓고 따지지도 못하고 속만 끓이는 눈치다.' : ''),
  choices: [
    { label: '솔직하게 설명하고 안심시킨다', run: (s, c) => { const r = loveReact(c.who, 'sincere', 4); return `"그냥 친구야. 내가 좋아하는 건 너야." ${r}`; } },
    { label: '"질투하는 거야?" 하고 놀린다', run: (s, c) => { if (CHARACTERS[c.who].likes === 'playful') return loveReact(c.who, 'playful', 4); s.love[c.who] = clamp(s.love[c.who] - 10); jealousHit(s, 1); return `"장난칠 기분 아니야." ${N2(c.who)} 먼저 가 버렸다. (설렘 ${s.love[c.who]})`; } },
    { label: '"친구도 못 만나?" 하고 맞선다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] - 15); jealousHit(s, 2); G.aff(c.other, 3); return `크게 다퉜다. 그날 밤 ${N(c.who)}의 프로필 사진이 검은 화면으로 바뀌었다. (설렘 ${s.love[c.who]})`; } },
  ] });
ev({ mode: 'classic', id: 'love_jealous_me', type: 'love', title: '내가 질투한다',
  cond: s => s.partner && rivalsForPartner(s).length > 0,
  setup: (s, c) => { c.who = s.partner; const r = rivalsForPartner(s); c.other = r[Math.floor(Math.random() * r.length)]; c.k = Math.floor(Math.random() * 3); }, who: (s, c) => c.other,
  text: (s, c) => [
    `복도 끝에서 ${N2(c.who)} ${N(c.other)}${josa(N(c.other), '과', '와')} 이어폰을 한쪽씩 나눠 끼고 웃고 있다. 가슴이 철렁했다.`,
    `${N(c.who)}의 휴대폰 알림에 "${N(c.other)}: 오늘 고마웠어 ㅎㅎ"가 떴다. 무슨 일이 있었던 걸까.`,
    `Y리그 응원석에서 ${N2(c.who)} ${N(c.other)}에게만 물을 건넸다. 나는 바로 옆에 있었는데.`][c.k],
  choices: [
    { label: '솔직하게 서운하다고 말한다', run: (s, c) => { const liked = CHARACTERS[c.who].likes === 'sincere'; s.love[c.who] = clamp(s.love[c.who] + (liked ? 10 : 4)); return `"신경 쓰였구나… 미안해. ${N(c.other)}${josa(N(c.other), '은', '는')} 그냥 친구야." ${N2(c.who)} 손을 꼭 잡았다. (설렘 ${s.love[c.who]})`; } },
    { label: '아무렇지 않은 척한다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] - 6); jealousHit(s, 1); G.fat(8); return '괜찮은 척했지만 하루 종일 그 장면이 떠올랐다. 둘 사이에 묘한 거리가 생겼다.'; } },
    { label: '화를 낸다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] - 14); jealousHit(s, 2); G.aff(c.other, -4); return `"너 요즘 왜 그래?" 말다툼이 커졌다. ${N2(c.who)} 눈물을 참으며 돌아섰다. (설렘 ${s.love[c.who]})`; } },
    { label: '"우리 그만하자."', run: (s, c) => endCouple(`그 말이 나오자 ${N2(c.who)} 한참 아무 말도 못 했다. "…그래, 알겠어." 질투 때문에 시작된 다툼이 이별로 끝났다.`) },
  ] });
// 질투로 쌓인 다툼이 터진다
ev({ mode: 'classic', id: 'love_breakup_jealous', type: 'love', title: '쌓였던 게 터졌다',
  cond: s => s.partner && (s.flags.jealous || 0) >= 3, setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `방과후 은행나무길. ${N2(c.who)} 멈춰 섰다. "요즘 우리, 싸우기만 하는 것 같아. 자꾸 서로 의심하고… 이게 맞는 걸까?"`,
  choices: [
    { label: '진심으로 사과하고 다시 시작한다', hint: '설렘 50 이상이면 가능성 ↑', run: (s, c) => { if (s.love[c.who] >= 50 || G.check('social', 55)) { s.flags.jealous = 0; s.love[c.who] = clamp(s.love[c.who] + 10); return '한참을 이야기했다. 서로 서운했던 걸 다 꺼내 놓고 나니, 다시 손을 잡을 수 있었다.'; } return endCouple('"미안. 나는 이제 지친 것 같아." 사과는 늦었다. 그렇게 헤어졌다.'); } },
    { label: '서로를 위해 헤어지자고 한다', run: (s, c) => endCouple('"좋은 기억만 남기자." 둘 다 웃으려고 애썼다. 은행잎이 발밑에 수북했다.') },
  ] });
ev({ mode: 'classic', id: 'love_100', type: 'love', once: true, title: '사귄 지 100일',
  cond: s => s.partner && s.dayNo - s.partnerSince >= 12, setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `오늘은 ${N(c.who)}${josa(N(c.who), '과', '와')} 사귄 지 100일. 반 친구들이 이미 알고 있다. 소리가 달력에 하트를 그려 놨다.`,
  choices: [
    { label: '손편지를 쓴다', run: s => { s.love[s.partner] = clamp(s.love[s.partner] + 12); return `편지를 읽던 ${N2(s.partner)} 고개를 숙였다. 다음 날 답장이 필통에 들어 있었다.`; } },
    { label: '커플 키링을 맞춘다 (6,000원)', req: s => (s.money || 0) >= 6000, reqText: '용돈이 부족하다', run: s => { s.money -= 6000; s.love[s.partner] = clamp(s.love[s.partner] + 9); G.add('luck', 2); addCoupleItem('커플 키링'); loveTouch(s.partner, 20); return '가방에 똑같은 은행잎 키링이 달렸다.'; } },
    { label: '…까먹었다', run: s => { s.love[s.partner] = clamp(s.love[s.partner] - 15); G.absurd(); return '"오늘 무슨 날인지 몰라?" 등줄기에 식은땀이 흘렀다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_breakup', type: 'love', title: '우리 요즘…',
  cond: s => s.partner && s.love[s.partner] < 15, setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `${N2(c.who)} 조용히 말한다. "요즘 우리 좀 멀어진 것 같아. 너는 어때?"`,
  choices: [
    { label: '다시 잘해 보자고 한다', hint: '사교성 판정', run: s => { if (G.check('social', 45)) { s.love[s.partner] = 45; return '진지하게 이야기를 나눴다. 다시 손을 잡았다.'; } return endCouple('노력해 봤지만, 우리는 친구로 돌아가기로 했다.'); } },
    { label: '헤어지자고 한다', run: s => endCouple('조용히 이별했다. 그래도 고마웠다는 말은 진심이었다.') },
  ] });


/* ───────── 공개 연애 · 비밀 연애 ───────── */
ev({ mode: 'classic', id: 'love_reveal', type: 'love', once: false, title: '우리, 공개할까?', cond: s => !!s.partner && s.loveSecret === null,
  setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `사귀기로 한 다음 날 아침. ${N2(c.who)} 교문 앞에서 속삭인다. "반 애들한테… 말할까?"`,
  choices: [
    { label: '공개 연애', hint: '평판↑ · 친구들의 축하와 놀림 · 질투 이벤트', run: (s, c) => { s.loveSecret = false; G.add('rep', 3); FRIEND_IDS.forEach(id => id !== c.who && s.met[id] && G.aff(id, 2)); return `단톡방에 커플 사진을 올렸다. 1분 만에 "ㅊㅋㅊㅋ"가 50개 달렸다. 소리가 양일학보 특종이라며 인터뷰를 요청했다.`; } },
    { label: '비밀 연애', hint: '설렘이 덜 식음 · 들킬 뻔한 순간들 · 숨은 엔딩', run: (s, c) => { s.loveSecret = true; s.love[c.who] = clamp(s.love[c.who] + 5); return '둘만 아는 신호를 정했다. 복도에서 눈이 마주치면 오른쪽 귀를 만지기. 심장이 두 배로 뛴다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_tease', type: 'love', title: '공개 커플의 일상', cond: s => s.partner && s.loveSecret === false,
  setup: (s, c) => { c.who = s.partner; c.f = FRIEND_IDS.filter(id => id !== s.partner && s.met[id])[0] || 'chaerin'; }, who: (s, c) => c.f,
  text: (s, c) => `급식실에서 ${N(c.who)} 옆에 앉자 ${N2(c.f)} 큰 소리로 "오~ 커플석~" 하고 외쳤다. 반 전체가 쳐다본다.`,
  choices: [
    { label: '당당하게 손을 흔든다', hint: '사교성 판정', run: (s, c) => { if (G.check('social', 45)) { G.add('rep', 3); s.love[c.who] = clamp(s.love[c.who] + 6); return '박수가 터졌다. 그날부터 급식실 그 자리는 "커플석"이 됐다.'; } s.love[c.who] = clamp(s.love[c.who] + 2); return '손을 흔들다 숟가락을 떨어뜨렸다. 그래도 둘 다 웃었다.'; } },
    { label: '친구에게 반격한다', run: (s, c) => { G.aff(c.f, 5); G.absurd(); return `"너는 언제 연애할 건데?" ${N2(c.f)} 조용해졌다.`; } },
  ] });
ev({ mode: 'classic', id: 'love_almost', type: 'love', title: '들킬 뻔했다!', cond: s => s.partner && s.loveSecret === true,
  setup: (s, c) => { c.who = s.partner; c.k = Math.floor(Math.random() * 3); }, who: (s, c) => c.k === 0 ? 'sori' : c.who,
  text: (s, c) => [
    `은행나무길에서 ${N(c.who)}${josa(N(c.who), '과', '와')} 손을 잡고 걷는데, 저 앞에서 소리가 수첩을 들고 걸어온다!`,
    `${N2(c.who)} 보낸 하트 메시지가 수업 시간 전자칠판 화면 공유에 떴다. 다행히 이름은 가려져 있다.`,
    `커플 키링을 발견한 채린이가 묻는다. "어? 너 이거 ${N(c.who)} 거랑 똑같은데?"`][c.k],
  choices: [
    { label: '어떻게든 숨긴다', hint: '운 판정', run: (s, c) => { if (G.check('luck', 45)) { s.love[c.who] = clamp(s.love[c.who] + 8); return '아슬아슬하게 넘어갔다. 둘만 아는 비밀이 하나 더 늘었다.'; } s.loveSecret = false; G.add('rep', 2); if (s.met.sori) G.aff('sori', 4); return '결국 들켰다! 30분 만에 전교에 소문이 퍼졌다. 이제 공개 커플이다.'; } },
    { label: '이참에 공개한다', run: (s, c) => { s.loveSecret = false; G.add('rep', 3); s.love[c.who] = clamp(s.love[c.who] + 4); return `"사실 우리 사귀어." ${N2(c.who)} 놀라더니 웃었다. 숨길 때보다 마음이 가벼워졌다.`; } },
  ] });


['paper_interview'].forEach(id => { EVENTS[id].rel = true; });

/* ───────── 친구 에피소드 (실제 친구 출연 · 좋은 이야기만) ───────── */
const CN = id => CAMEOS[id].name;
const CAMEO_EVENTS = {
  ryun: [
    { title: '길 잃은 날의 내비게이션', text: '방과후 양평 시내에서 심부름을 하다 길을 잃었다. 그때 신륜이 나타났다. "여기서 남한강 쪽으로 두 블록, 그다음 왼쪽." 지도도 안 보고 말한다.',
      choices: [
        { label: '신륜을 따라간다', run: s => { G.fat(-8); G.grow('social', 2); return '5분 만에 도착했다. 가는 길에 이 동네 옛 지명 이야기까지 들었다. 걸어 다니는 지도는 실존했다.'; } },
        { label: '"세계 수도 퀴즈 하면서 가자"', run: s => { G.grow('study', 2); s.mastery['사회'] = clamp((s.mastery['사회'] ?? s.stats.study * 0.6) + 3); return '내가 나라 이름을 대면 신륜이 0.5초 만에 수도를 말했다. 30문제 전부 정답. (사회 숙련도 +3)'; } },
      ] },
    { title: '신륜의 지리 특강', text: '시험 전, 늘채움실에서 신륜이 화이트보드에 한반도 지도를 순식간에 그렸다. "지형이랑 기후는 이야기로 외우면 안 까먹어."',
      choices: [
        { label: '앞자리에서 받아 적는다', run: s => { s.mastery['사회'] = clamp((s.mastery['사회'] ?? s.stats.study * 0.6) + 6); G.grow('study', 2); return '태백산맥이 왜 동쪽에 치우쳤는지 이제야 이해했다. 옆에서 공부하던 애들이 하나둘 몰려와 같이 들었다. (사회 숙련도 +6)'; } },
        { label: '양평 지도를 그려 달라고 한다', run: s => { G.add('luck', 2); G.grow('social', 1); return '용문산, 두물머리, 남한강까지 완벽한 양평 지도가 완성됐다. 늘채움실 게시판에 붙여 두기로 했다.'; } },
      ] },
    { title: '여행 동선은 신륜에게', text: '체험학습 조별 동선 짜기. 다들 헤매는데 신륜이 말한다. "이 순서로 돌면 대기 시간이 제일 짧아."',
      choices: [
        { label: '신륜의 동선을 채택한다', run: s => { G.fat(-12); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 2)); return '우리 조만 모든 코스를 다 돌았다. 다른 조들이 비결을 물어봤다.'; } },
        { label: '같이 동선표를 꾸민다', run: s => { G.grow('social', 2); G.add('rep', 2); return '동선표가 너무 예뻐서 선생님이 다른 반에도 복사해 줬다.'; } },
      ] },
    { title: '두물머리 탐사대', text: '주말, 신륜이 연락했다. "두물머리 가 볼래? 남한강이랑 북한강이 만나는 거 직접 보면 지리 교과서가 달라 보여."',
      choices: [
        { label: '자전거 타고 같이 간다', run: s => { G.grow('stamina', 2); G.fat(-10); return '강물 색이 두 갈래로 갈리는 지점에서 신륜이 설명을 시작했다. 30분짜리 현장 강의였는데 하나도 안 지루했다.'; } },
        { label: '사진을 찍어 보고서로 만든다', run: s => { G.grow('study', 2); addSetuk('통합사회', '지역 하천 합류 지점을 직접 답사하여 지형과 생활의 관계를 탐구함.'); return '둘이 만든 "두물머리 답사 보고서"를 선생님이 수업 자료로 쓰셨다.'; } },
      ] },
    { title: '세계지도 앞의 약속', text: '졸업이 다가온 어느 날, 신륜이 복도 세계지도 앞에 멈춰 섰다. "졸업하면 여기 중에 어디부터 갈래?"',
      choices: [
        { label: '같이 갈 나라를 정한다', run: s => { G.grow('social', 3); G.fat(-8); return '신륜이 벌써 동선을 다 짜 놨다. "비행기 표만 사. 나머지는 내가 안내할게."'; } },
        { label: '양평 한 바퀴부터 하자고 한다', run: s => { G.add('luck', 3); return '"좋아, 출발은 양일고 정문이다." 둘이 지도에 작은 별 스티커를 붙였다.'; } },
      ] },
  ],
  seojun: [
    { title: '점심시간 포켓몬 배틀', text: '염서준이 진지한 얼굴로 다가왔다. "너, 트레이너의 눈을 하고 있어. 한 판 하자." 손에는 포켓몬 카드 덱이 들려 있다.',
      choices: [
        { label: '배틀을 받아들인다', hint: '운 판정', run: s => { if (G.check('luck', 45)) { G.add('luck', 3); return '마지막 턴에 역전승! 서준이가 박수를 쳤다. "인정. 넌 진짜 트레이너야."'; } G.grow('social', 2); return '완패했다. 서준이가 상성표를 친절하게 설명해 줬다. 다음엔 이길 것 같다.'; } },
        { label: '도감 퀴즈를 낸다', run: s => { G.grow('social', 2); G.fat(-6); return '"25번은?" "피카츄. 너무 쉽잖아." 151번까지 전부 맞혔다. 복도에 구경꾼이 모였다.'; } },
      ] },
    { title: '서준이의 도감식 암기법', text: '"영단어도 포켓몬처럼 외우면 돼. 타입, 진화, 특성으로 정리하는 거지." 서준이가 단어장을 도감처럼 만들어 왔다.',
      choices: [
        { label: '도감식으로 외워 본다', run: s => { s.mastery['영어'] = clamp((s.mastery['영어'] ?? s.stats.study * 0.6) + 6); G.grow('study', 2); return '"abandon: 노말 타입, 진화형 abandonment." 이상하게 머리에 쏙 들어온다. (영어 숙련도 +6)'; } },
        { label: '과학 개념도 부탁한다', run: s => { s.mastery['과학'] = clamp((s.mastery['과학'] ?? s.stats.study * 0.6) + 5); return '"원소는 타입 상성이랑 비슷해." 주기율표가 포켓몬 도감처럼 보이기 시작했다. (과학 숙련도 +5)'; } },
      ] },
    { title: '녹향제 포켓몬 퀴즈 부스', text: '서준이가 녹향제에 "포켓몬 퀴즈 부스"를 열자고 한다. "실루엣 보고 맞히면 사탕 하나."',
      choices: [
        { label: '같이 부스를 운영한다', run: s => { G.add('rep', 4); G.grow('social', 2); return '부스 앞에 줄이 운동장 끝까지 섰다. 선생님들도 몰래 와서 도전했다.'; } },
        { label: '홍보 포스터를 맡는다', run: s => { G.add('rep', 2); G.add('luck', 2); return '포스터 속 "양일 도감 완성에 도전하라!" 문구가 녹향제 유행어가 됐다.'; } },
      ] },
    { title: '서준이의 상성 상담소', text: '고민이 생긴 날, 염서준이 옆에 앉았다. "모든 문제엔 상성이 있어. 네 고민은 무슨 타입이야?"',
      choices: [
        { label: '진지하게 털어놓는다', run: s => { G.fat(-14); G.grow('social', 2); return '"그건 물 타입 고민이네. 전기로 가자." 무슨 말인지 모르겠는데 이상하게 마음이 풀렸다.'; } },
        { label: '포켓몬으로 바꿔 말한다', run: s => { G.absurd(); G.fat(-10); return '"내 시험 점수가 잉어킹이야." "괜찮아. 잉어킹은 갸라도스가 돼." 위로가 됐다.'; } },
      ] },
    { title: '졸업 기념 도감', text: '졸업 직전, 서준이가 공책 한 권을 건넸다. 표지에 "양일고 도감"이라고 적혀 있다. 우리 학년 친구들이 포켓몬 카드처럼 그려져 있다.',
      choices: [
        { label: '내 페이지부터 찾는다', run: s => { G.grow('social', 2); G.add('luck', 2); return '내 카드 특성: "포기하지 않음". 서준이가 웃었다. "레어 카드야."'; } },
        { label: '서준이 페이지를 그려 준다', run: s => { G.grow('social', 3); return '"염서준, 타입: 트레이너, 특성: 친구를 끝까지 챙김." 서준이가 한참 그 페이지를 봤다.'; } },
      ] },
  ],
  yejun: [
    { title: '그늘 명당 안내', text: '햇빛이 쨍쨍한 날 야외 행사. 양산을 쓴 김예준이 손짓한다. "여기가 학교에서 제일 시원한 그늘이야. 3년 동안 조사했어."',
      choices: [
        { label: '그늘에서 같이 응원한다', run: s => { G.fat(-15); G.grow('social', 2); return '예준이 말대로 바람까지 솔솔 불었다. 땡볕 아래 친구들이 하나둘 몰려왔다.'; } },
        { label: '양산을 같이 들어 준다', run: s => { G.grow('social', 2); G.add('rep', 1); return '"고마워. 사실 팔이 좀 아팠거든." 둘이 양산 하나를 나눠 들고 행사를 끝까지 봤다.'; } },
      ] },
    { title: '실내 공부 명당', text: '예준이가 "햇빛 안 드는데 집중 제일 잘 되는 곳"을 알려 주겠다며 늘채움실 구석 자리로 데려갔다.',
      choices: [
        { label: '나란히 앉아 공부한다', run: s => { G.grow('study', 3); G.fat(-5); return '조용하고, 시원하고, 눈부시지 않았다. 여기가 진짜 명당이다.'; } },
        { label: '명당 지도를 같이 만든다', run: s => { G.add('luck', 2); G.add('rep', 2); return '"양일고 실내 명당 지도"가 완성됐다. 시험 기간마다 후배들이 사진을 찍어 간다.'; } },
      ] },
    { title: '서로 챙기는 체험학습', text: '체험학습 날 아침, 예준이가 선크림과 모자를 챙겨 왔다. 그리고 내 것도 하나 더 챙겨 왔다. "너 지난번에 탔잖아."',
      choices: [
        { label: '"고마워, 대신 간식은 내가!"', run: s => { G.fat(-8); G.grow('social', 2); return '예준이는 그늘, 나는 간식. 완벽한 분업이었다.'; } },
        { label: '하루 종일 같이 다닌다', run: s => { G.grow('social', 3); return '실내 코스 위주로 돌았는데 오히려 제일 재밌었다.'; } },
      ] },
    { title: '비 오는 날의 예준이', text: '오랜만에 흐리고 비 오는 날. 김예준이 신이 나서 운동장으로 나간다. "오늘은 내가 제일 자유로운 날이야!"',
      choices: [
        { label: '같이 운동장을 뛴다', run: s => { G.grow('stamina', 2); G.fat(-10); return '빗속에서 둘이 축구공을 찼다. 흠뻑 젖었는데 예준이가 제일 크게 웃었다.'; } },
        { label: '우산 쓰고 산책한다', run: s => { G.grow('social', 2); G.fat(-12); return '은행나무길을 천천히 걸었다. 예준이가 "흐린 날 양일고가 제일 예뻐"라고 했다. 맞는 말이었다.'; } },
      ] },
    { title: '그늘 명당 인수인계', text: '3학년 2학기, 예준이가 1학년 후배들을 모아 놓고 진지하게 말한다. "지금부터 양일고 그늘 명당을 물려주겠다." 나를 조수로 불렀다.',
      choices: [
        { label: '명당 투어를 같이 한다', run: s => { G.add('rep', 3); G.grow('social', 2); return '후배들이 수첩에 받아 적었다. "선배님들 전설이에요." 예준이가 뿌듯해했다.'; } },
        { label: '명당 지도에 사인한다', run: s => { G.add('rep', 2); G.add('luck', 2); return '지도 구석에 둘의 이름을 적었다. "명당 1대 관리인". 앞으로도 계속 남을 것 같다.'; } },
      ] },
  ],
  mingyeol: [
    { title: '시험 전날의 구원자', text: '시험 전날, 교실 공기가 무겁다. 그때 다른 반 김민결이 문을 열고 들어와 교탁 앞에 섰다. "자, 긴장 푸는 시간. 철벽 쌤 성대모사 갑니다."',
      choices: [
        { label: '제일 크게 웃는다', run: s => { G.fat(-18); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 1)); return '반 전체가 책상을 치며 웃었다. 긴장이 싹 풀렸다. 그날 다들 공부가 더 잘 됐다.'; } },
        { label: '추임새로 거든다', run: s => { G.grow('social', 3); G.fat(-10); return '민결이 개그에 추임새를 넣었더니 콤비 개그가 됐다. 학년 단톡방에 영상이 올라왔다.'; } },
      ] },
    { title: '녹향제 개그 콤비', text: '"녹향제 장기자랑, 나랑 콤비로 나가자. 대본은 다 써 왔어." 민결이가 공책 세 권을 내밀었다.',
      choices: [
        { label: '콤비로 무대에 선다', hint: '사교성 판정', run: s => { G.flag('stage'); if (G.check('social', 40)) { G.add('rep', 7); return '첫 대사부터 강당이 터졌다. 앵콜로 즉석 개그까지 했다.'; } G.add('rep', 4); return '대사를 하나 까먹었는데, 민결이가 그걸 개그로 살렸다. 오히려 더 웃겼다.'; } },
        { label: '대본 감수만 맡는다', run: s => { G.grow('study', 1); G.add('rep', 2); return '내가 고친 펀치라인에서 제일 큰 웃음이 나왔다.'; } },
      ] },
    { title: '철벽 쌤 웃기기 대작전', text: '민결이가 비장하게 말한다. "3년 안에 철벽 쌤을 소리 내서 웃게 만들겠어. 도와줘."',
      choices: [
        { label: '작전에 합류한다', run: s => { G.aff('teacher', 5); G.absurd(); return '복도에서 마주친 철벽 쌤이 민결이의 한마디에 "풉" 하고 웃었다. 지켜보던 애들이 환호했다.'; } },
        { label: '타이밍을 계산해 준다', run: s => { G.grow('study', 1); G.aff('teacher', 3); return '쌤 기분이 제일 좋은 시간을 분석했다. 금요일 6교시 끝나기 3분 전. 작전은 성공했다.'; } },
      ] },
    { title: '급식실 개그 라이브', text: '점심 줄이 너무 길다. 다들 지쳐 있을 때 김민결이 식판을 마이크처럼 들었다. "기다리는 동안 급식 메뉴로 삼행시 갑니다."',
      choices: [
        { label: '운을 띄워 준다', run: s => { G.grow('social', 3); G.fat(-10); return '"떡! 떡하니 나타난 오늘의 메뉴. 볶! 볶음밥인 줄 알았지? 이! 이건 떡볶이." 급식실이 박수로 뒤집어졌다.'; } },
        { label: '관객석에서 리액션 담당', run: s => { G.fat(-12); G.add('rep', 1); return '내가 웃을 때마다 민결이 텐션이 올라갔다. 줄이 줄어드는 게 아쉬울 정도였다.'; } },
      ] },
    { title: '졸업식 사회자', text: '민결이가 졸업식 레크리에이션 사회를 맡았다. "부사회자 자리 하나 비었는데. 너밖에 없다."',
      choices: [
        { label: '부사회자를 맡는다', hint: '사교성 판정', run: s => { if (G.check('social', 45)) { G.add('rep', 6); return '둘의 호흡이 완벽했다. 철벽 쌤이 처음으로 박수를 치며 웃었다.'; } G.add('rep', 3); return '대본을 살짝 꼬였지만 민결이가 바로 받아쳤다. 그게 그날 최고의 웃음이었다.'; } },
        { label: '깜짝 영상을 준비한다', run: s => { G.grow('social', 2); G.add('rep', 3); return '3년 동안 찍은 민결이 개그 모음 영상이 나오자 강당이 웃음과 눈물로 가득 찼다.'; } },
      ] },
  ],
  jaewon: [
    { title: '운동장의 비둘기 떼', text: '점심시간 운동장에 비둘기 떼가 내려앉았다. 이재원이 그 자리에 얼어붙었다. 매점으로 가는 길이 막혔다.',
      choices: [
        { label: '앞장서서 길을 터 준다', run: s => { G.grow('stamina', 1); G.add('rep', 1); return '천천히 앞에서 걸었더니 비둘기들이 날아갔다. 재원이가 "진짜 고마워…" 하며 빵을 하나 사 줬다.'; } },
        { label: '돌아가는 길로 같이 간다', run: s => { G.grow('social', 2); return '조금 멀지만 은행나무길로 돌아갔다. 가는 길에 이야기를 많이 했다.'; } },
      ] },
    { title: '재원이의 반격', text: '내가 체육 수행평가 준비로 쩔쩔매자 이재원이 나섰다. "비둘기만 아니면 나 꽤 쓸 만하다고."',
      choices: [
        { label: '같이 연습한다', run: s => { G.grow('stamina', 3); return '재원이가 자세를 하나하나 잡아 줬다. 실력이 확 늘었다. 새만 없으면 진짜 든든한 친구다.'; } },
        { label: '공부도 부탁한다', run: s => { G.grow('study', 2); return '알고 보니 재원이는 정리의 달인이었다. 요약 노트가 교과서보다 명확했다.'; } },
      ] },
    { title: '은행나무길 작전', text: '은행나무길에 참새가 많아서 재원이가 매일 돌아서 다닌다. "오늘은 한번 지나가 보고 싶어." 재원이가 숨을 크게 쉰다.',
      choices: [
        { label: '옆에서 같이 걷는다', run: s => { G.grow('social', 3); return '천천히, 한 걸음씩. 끝까지 지나간 재원이가 웃었다. "생각보다 괜찮네." 대단한 하루였다.'; } },
        { label: '우산으로 경호한다', run: s => { G.absurd(); G.grow('social', 2); return '맑은 날 우산을 쓰고 경호원처럼 걸었다. 지나가던 친구들이 영문도 모르고 같이 경호에 합류했다.'; } },
      ] },
    { title: '재원이의 요약 노트', text: '시험 일주일 전, 이재원이 두툼한 노트를 들고 왔다. "내가 정리한 거. 너도 봐." 색깔별로 깔끔하게 정리돼 있다.',
      choices: [
        { label: '같이 보면서 공부한다', run: s => { G.grow('study', 3); G.fat(-4); return '재원이 노트 덕분에 범위가 한눈에 들어왔다. "대신 내 체육 수행 좀 봐 줘." 공정한 거래였다.'; } },
        { label: '내 노트랑 합친다', run: s => { G.grow('study', 2); G.add('rep', 2); return '둘의 노트를 합친 "양일고 최강 요약본"이 학년 전체에 돌았다.'; } },
      ] },
    { title: '재원이의 용기', text: '졸업식 날, 교문 앞 나무에 까치가 앉아 있다. 이재원이 크게 숨을 쉬더니 웃는다. "3년 전 나라면 못 지나갔을 거야. 같이 가자."',
      choices: [
        { label: '나란히 교문을 지난다', run: s => { G.grow('social', 3); G.fat(-10); return '재원이가 한 번도 멈추지 않고 걸었다. 교문을 나서며 둘이 하이파이브를 했다.'; } },
        { label: '기념사진을 찍는다', run: s => { G.add('luck', 2); G.grow('social', 2); return '사진 뒤쪽에 까치가 같이 찍혔다. 재원이가 말했다. "이건 액자에 넣어야겠다."'; } },
      ] },
  ],
  haram: [
    { title: '학생회장 선배의 부탁', text: '도하람 선배가 무거운 박스를 들고 계단을 오르고 있다. "아, 혹시 이것 좀 같이 들어 줄 수 있어? 녹향제 소품이야."',
      choices: [
        { label: '같이 든다', run: s => { G.grow('stamina', 1); G.add('rep', 2); return '"고마워! 이름이 뭐야?" 다음 날 복도에서 선배가 이름을 불러 줬다.'; } },
        { label: '친구들을 불러 같이 나른다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 2)); G.add('rep', 3); return '다섯 명이 한 줄로 박스를 날랐다. 선배가 음료를 한 박스 사 왔다.'; } },
      ] },
    { title: '선배의 진로 이야기', text: '학생회실에서 도하람 선배가 수시 원서를 보고 있다. "고1 때 이것저것 해 본 게 다 도움이 되더라. 너는 뭐 하고 싶어?"',
      choices: [
        { label: '진로 고민을 털어놓는다', run: s => { G.grow('study', 2); addSetuk('진로활동', '선배와의 진로 멘토링을 통해 관심 분야의 학업 계획을 구체화함.'); return '선배가 자기 생기부 정리 노하우를 알려 줬다. 메모가 한 페이지 가득 찼다.'; } },
        { label: '선배 학교생활 꿀팁을 묻는다', run: s => { G.add('luck', 2); G.fat(-5); return '"매점 소보로는 4교시 끝나기 1분 전." 이 정보는 대대로 전해 내려오는 것 같다.'; } },
      ] },
    { title: '선배의 졸업', text: '도하람 선배의 졸업식 날. 선배가 학생회 배지를 내 손에 쥐여 줬다. "다음은 네 차례야."',
      choices: [
        { label: '배지를 꼭 쥔다', run: s => { G.add('rep', 4); return '선배가 웃으며 교문을 나섰다. 배지가 생각보다 무거웠다.'; } },
        { label: '롤링페이퍼를 건넨다', run: s => { G.grow('social', 2); return '"고마웠습니다, 선배." 선배가 롤링페이퍼를 읽다 고개를 돌렸다.'; } },
      ] },
  ],
  daon: [
    { title: '후배가 생겼다', text: '2학년 첫 주, 1학년 서다온이 복도에서 길을 묻는다. "선배, 과학교과실-물리가 어디예요? 3번째 헤매는 중이에요…"',
      choices: [
        { label: '직접 데려다준다', run: s => { G.add('rep', 2); G.grow('social', 2); return '"선배 최고예요!" 다음 날부터 다온이가 복도에서 90도로 인사한다.'; } },
        { label: '학교 지도를 그려 준다', run: s => { G.add('rep', 1); G.add('luck', 1); return '내가 그려 준 지도가 1학년 단톡방에 퍼졌다. 의도치 않게 유명해졌다.'; } },
      ] },
    { title: '후배의 질문 폭탄', text: '다온이가 공책을 들고 왔다. "선배, 수행평가는 어떻게 준비해요? 동아리는요? 매점 꿀팁은요?"',
      choices: [
        { label: '하나하나 알려 준다', run: s => { G.grow('social', 2); G.add('rep', 3); return '설명하다 보니 내가 1년 동안 꽤 많이 배웠다는 걸 알았다.'; } },
        { label: '오답노트를 빌려준다', run: s => { G.grow('study', 1); G.add('rep', 2); return '다온이가 오답노트를 보고 감탄했다. "선배 글씨가 예뻐요." 노트가 1학년 사이에서 전설이 됐다.'; } },
      ] },
    { title: '후배의 응원', text: '수능 날 새벽, 교문 앞에 서다온이 핫팩과 손편지를 들고 서 있다. "선배, 꼭 대박 나세요!"',
      choices: [
        { label: '편지를 가슴에 넣는다', run: s => { G.fat(-10); G.add('luck', 3); return '시험장에 들어가기 전, 편지를 한 번 더 읽었다. 힘이 났다.'; } },
        { label: '"내년엔 네 차례야" 하고 웃는다', run: s => { G.grow('social', 2); return '다온이가 주먹을 꼭 쥐었다. 좋은 선배가 된 것 같아 뿌듯했다.'; } },
      ] },
  ],
};
Object.assign(CAMEO_EVENTS, MORE_CAMEO_EVENTS);
const CAMEO_COND = { haram: s => s.mode === 'classic' && s.year <= 2, daon: s => s.mode === 'classic' && s.year >= 2, jio: s => s.year >= 2 || s.sem === 2 };
Object.entries(CAMEO_EVENTS).forEach(([id, list]) => list.forEach((e, i) => ev({
  id: `cam_${id}_${i}`, type: 'cameo', once: true, title: e.title, cameo: id, step: i,
  // 4번째부터는 ★3을 채운 뒤 이어지는 추억 에피소드 (3학년에 마무리)
  cond: s => inRoster(s, id) && (!e.when || e.when(s)) && (i < 3 ? (s.cameo[id] || 0) === i : (s.cameo[id] || 0) >= 3 && s.seen[`cam_${id}_${i - 1}`] && (i < 4 || s.year === 3)) && (!CAMEO_COND[id] || CAMEO_COND[id](s)) && (id !== 'haram' || i < 2 || s.year === 2 && s.sem === 2) && (id !== 'daon' || i < 2 || s.year === 3),
  who: () => id, text: e.text,
  choices: e.choices.map(ch => Object.assign({}, ch, { run: (s, c) => { if (s.mode === 'real') { G.meet(id); G.aff(id, 6); } const r = ch.run(s, c); if (i < 3) { s.cameo[id] = Math.max(s.cameo[id] || 0, i + 1); G.notes.push(`${CN(id)} 우정 ${'★'.repeat(s.cameo[id])}`); dexFriend(id, s.cameo[id]); if (s.cameo[id] === 3) G.achieve('bestie'); } else { G.notes.push(`${CN(id)}${josa(CN(id), '과', '와')}의 추억이 하나 더 생겼다`); } return r; } })),
})));
