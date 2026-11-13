// 반복 줄이기 A: 학교 행사가 학년·회차마다 다르게 보이게 하고, 새 일상 사건 15개를 더한다.
// 기존 사건 정의(events.js)를 감싸서 글 한 줄과 선택지 하나를 바꾼다. events.js·deep.js 다음에 불러온다.

function wrapStory(id, { flavor, swap }) {
  const e = EVENTS[id]; if (!e) return;
  const baseText = e.text, baseChoices = e.choices;
  if (flavor) e.text = (s, c) => { const t = typeof baseText === 'function' ? baseText(s, c) : baseText; const f = flavor(s, c); return f ? `${t} ${f}` : t; };
  if (swap) e.choices = (s, c) => swap(s, c, (typeof baseChoices === 'function' ? baseChoices(s, c) : baseChoices).slice());
}

/* ───────── 정기시험: 웃긴 선택지 두 개가 매번 바뀐다 (「실력대로」는 그대로) ───────── */
const EXAM_LUCK = [
  ['찍기 신공을 믿는다', '연필을 굴릴 때마다 기도했다.'],
  ['육각 연필을 굴려 정한다', '연필 여섯 면에 1~5와 "다시"를 적었다. "다시"가 세 번 나왔다.'],
  ['짝꿍의 기를 받아 찍는다', '쉬는 시간에 전교권 친구 어깨를 세 번 두드리고 왔다.'],
  ['답안지 마킹 무늬를 예쁘게 맞춘다', '답이 지그재그로 예쁘게 내려가도록 골랐다.'],
  ['"3번이 제일 많다"는 전설을 믿는다', '모르는 건 전부 3번. 선배들의 전설을 믿었다.'],
];
const EXAM_SILLY = [
  ['시험지 뒷면에 시를 쓴다', '시험지 뒷면에 시를 썼다.'],
  ['시험지 구석에 선생님 캐리커처를 그린다', '구석에 출제 선생님 얼굴을 그려 넣었다. 꽤 닮았다.'],
  ['문제마다 응원 문구를 적는다', '"넌 할 수 있어 7번" 문제마다 응원을 남겼다.'],
  ['서술형 칸에 4행시를 쓴다', '서술형 칸에 "양·일·고·사" 4행시를 적었다.'],
  ['시험 끝날 때까지 명상한다', '눈을 감고 호흡에 집중했다. 마음은 평온했다. 답안지도 평온했다.'],
];
wrapStory('exam', {
  flavor: s => {
    const n = (s.exams || []).length;
    return ['처음 보는 고등학교 시험, 손에 땀이 난다.', '두 번째 시험. 이번엔 시간 분배를 해 보자.', '교실 공기가 1학년 때보다 무겁다.', '옆자리 친구가 기도하고 있다.', '선배들이 "2학년 내신이 진짜"라고 했었다.', '마지막 해의 시험. 펜을 쥔 손에 힘이 들어간다.', '3년의 마지막 정기시험이다.'][Math.min(n, 6)];
  },
  swap: (s, c, ch) => {
    const n = (s.exams || []).length, L = EXAM_LUCK[n % EXAM_LUCK.length], Y = EXAM_SILLY[n % EXAM_SILLY.length];
    ch[1] = Object.assign({}, ch[1], { label: L[0], run: s => `${L[1]} ` + takeExam('luck') });
    ch[2] = Object.assign({}, ch[2], { label: Y[0], run: s => `${Y[1]} ` + takeExam('poem') });
    return ch;
  },
});

/* ───────── 모의고사 ───────── */
const MOCK_REST = ['엎드려 잔다', '창밖 구름 모양을 관찰한다', '쉬는 시간마다 매점 간식 계획을 세운다', '문제지 여백에 낙서한다'];
const MOCK_ART = ['OMR 카드에 그림을 그린다', 'OMR 마킹으로 반 이름을 새긴다', 'OMR 카드에 은행잎 모양을 찍는다', '수험번호를 행운의 숫자로 외운다'];
wrapStory('mock', {
  flavor: s => ({ '1-1': '고등학교 첫 모의고사. OMR 카드가 아직 낯설다.', '1-2': '두 번째 모의고사. 시간 안에 다 푸는 게 목표다.', '2-1': '2학년 모의고사. 성적표에 백분위가 진하게 찍힌다.', '2-2': '수능이 1년 남았다는 말이 실감 나기 시작했다.', '3-1': '수능 D-160. 이제 모의고사가 수능 리허설이다.', '3-2': '9월 모의평가. 수능 전 마지막 실전이다.' })[`${s.year}-${s.sem}`] || '',
  swap: (s, c, ch) => {
    const k = (s.year - 1) * 2 + s.sem - 1;
    ch[1] = Object.assign({}, ch[1], { label: MOCK_REST[k % MOCK_REST.length] });
    ch[2] = Object.assign({}, ch[2], { label: MOCK_ART[k % MOCK_ART.length] });
    return ch;
  },
});

/* ───────── 체육한마당 · 녹향제 · Y리그: 학년마다 다른 글 + 학년 전용 선택지 ───────── */
wrapStory('sports_day', {
  flavor: s => ['첫 체육대회라 반 단체티가 어색하게 빳빳하다.', '이제 우리가 응원석 분위기를 이끄는 학년이다.', '고등학교 마지막 체육대회. 운동장이 유난히 넓어 보인다.'][s.year - 1],
  swap: (s, c, ch) => {
    const extra = [
      { label: '줄다리기 맨 뒤를 맡는다', hint: '체력 판정', run: s => { if (G.check('stamina', 50)) { G.add('rep', 5); G.grow('stamina', 2); return '줄을 몸에 감고 버텼다. 우리 반이 이겼다! 손바닥은 빨갛지만 기분은 최고.'; } G.fat(10); G.add('rep', 1); return '끝까지 버텼지만 아쉽게 끌려갔다. 다 같이 엉덩방아를 찧고 웃었다.'; } },
      { label: '1학년 후배 응원단을 이끈다', hint: '사교성 판정', run: s => { if (G.check('social', 50)) { G.add('rep', 6); G.grow('social', 2); return '후배들이 내 구호를 따라 했다. 응원석이 하나가 됐다.'; } G.add('rep', 2); return '구호가 조금 엇갈렸지만 후배들이 끝까지 따라와 줬다.'; } },
      { label: '반 깃발을 들고 운동장을 돈다', run: s => { G.add('rep', 4); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 3)); G.fat(5); return '마지막 체육대회. 깃발을 흔들며 운동장을 돌자 반 친구들이 따라 뛰었다.'; } },
    ][s.year - 1];
    return ch.concat([extra]);
  },
});
wrapStory('festival', {
  flavor: s => ['처음 보는 녹향제는 생각보다 훨씬 크다.', '작년보다 부스가 많아졌다. 이번엔 우리가 준비하는 쪽이다.', '마지막 녹향제. 내년엔 손님으로 와야 한다.'][s.year - 1],
  swap: (s, c, ch) => {
    const extra = [
      { label: '모든 부스 도장 깨기에 도전한다', run: s => { G.add('luck', 3); G.grow('social', 2); G.fat(6); return '부스 열두 개 도장을 다 모았다. 경품으로 녹향제 한정 키링을 받았다.'; } },
      { label: '양일가왕 무대 MC를 맡는다', hint: '사교성 판정', run: s => { if (G.check('social', 55)) { G.add('rep', 8); G.flag('stage'); return '애드리브가 터질 때마다 운동장이 웃었다. 진행상은 MC 몫이었다.'; } G.add('rep', 3); return '대본을 한 줄 건너뛰었지만, 그것까지 웃음으로 넘겼다.'; } },
      { label: '반 친구들과 마지막 단체 사진을 찍는다', run: s => { FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 4)); G.fat(-6); return '무대 조명 아래서 다 같이 브이를 했다. 그 사진이 반 단톡방 프로필이 됐다.'; } },
    ][s.year - 1];
    return ch.slice(0, 3).concat([extra], ch.slice(3));
  },
});
wrapStory('yleague', {
  flavor: s => ['1학년의 패기로 결승까지 올라왔다.', '작년 결승에서 진 상대를 다시 만났다. 설욕전이다.'][s.year - 1] || '',
  swap: (s, c, ch) => s.year === 2 ? ch.concat([{ label: '작년 패배 영상을 분석해 작전을 짠다', hint: '공부 판정', run: s => { if (G.check('study', 50)) { G.add('rep', 5); G.flag('sportsWins'); return '상대의 습관을 정확히 짚었다. 작전대로 흘러가 우승!'; } G.add('rep', 2); return '작전은 좋았지만 상대도 달라져 있었다. 그래도 접전이었다.'; } }]) : ch,
});
wrapStory('cheer', {
  flavor: s => ['처음 보는 수능 날 풍경이다. 선배들 얼굴이 진지하다.', '내년엔 내가 저 교문을 지나간다. 응원하는 손에 힘이 들어간다.'][s.year - 1] || '',
});
wrapStory('perf', {
  flavor: s => ['', '이번 학기 수행평가는 조별 과제가 많다.', '선생님이 "이번 수행은 세특에 들어간다"고 강조하셨다.', '수행평가 공지가 한꺼번에 세 개 올라왔다.', '수행평가 점수가 입시에 바로 쓰인다는 말에 다들 진지하다.', '이번이 마지막 수행평가다.'][Math.min(Object.keys(s.perf || {}).length, 5)],
});
wrapStory('science_day', {
  flavor: s => ['', '작년보다 발표 팀이 두 배로 늘었다.', '마지막 과학의 날. 후배들이 우리 발표를 받아 적는다.'][s.year - 1],
});

/* ───────── 새 일상 사건 15개 (계절·학년 분위기) ───────── */
const monthNow = s => dateOf(s.year, s.sem, s.day).getMonth() + 1;
ev({ id: 'daily_first_snow_window', type: 'daily', title: '창가 자리의 겨울', cond: s => monthNow(s) >= 11 || monthNow(s) <= 2,
  text: '수업 중 창밖으로 눈이 날리기 시작했다. 선생님도 잠깐 칠판에서 손을 멈추셨다.',
  choices: [
    { label: '창밖을 보며 잠깐 쉰다', run: s => { G.fat(-6); G.add('luck', 1); return '하얀 운동장을 보니 머리가 맑아졌다.'; } },
    { label: '필기에 집중한다', run: s => { G.grow('study', 2); return '다들 창밖을 볼 때 혼자 필기를 끝냈다. 뿌듯하다.'; } },
  ] });
ev({ id: 'daily_umbrella_rack', type: 'daily', title: '우산꽂이 미스터리', cond: s => monthNow(s) >= 6 && monthNow(s) <= 9,
  text: '하굣길, 우산꽂이에 내 우산이 없다. 대신 똑같이 생긴 남의 우산 하나가 꽂혀 있다.',
  choices: [
    { label: '주인을 찾을 때까지 기다린다', run: s => { G.add('rep', 2); G.grow('social', 1); return '십 분 뒤 우산을 바꿔 간 친구가 헐레벌떡 돌아왔다. 고맙다고 사탕을 줬다.'; } },
    { label: '비를 맞으며 뛰어간다', run: s => { G.fat(6); G.absurd(); return '청춘 영화처럼 뛰었다. 다음 날 코가 조금 막혔다.'; } },
  ] });
ev({ id: 'daily_chalk_dust', type: 'daily', title: '주번의 칠판', text: '오늘 주번이다. 칠판이 분필 글씨로 빼곡하고 지우개는 이미 하얗다.',
  choices: [
    { label: '창밖에서 지우개를 턴다', run: s => { G.add('rep', 2); return '분필 가루가 구름처럼 날아갔다. 칠판이 반짝반짝해졌다.'; } },
    { label: '칠판 구석에 오늘의 명언을 쓴다', run: s => { G.grow('social', 2); G.absurd(); return '"내일 할 일을 오늘 하면 내일은 놀 수 있다." 반 친구들이 사진을 찍었다.'; } },
  ] });
ev({ id: 'daily_lost_airpod', type: 'daily', title: '굴러온 이어폰 한 짝', text: '복도 바닥에 무선 이어폰 한 짝이 떨어져 있다. 케이스는 없다.',
  choices: [
    { label: '교무실 분실물 함에 맡긴다', run: s => { G.add('rep', 3); return '점심때 주인이 찾아갔다는 소식을 들었다. 마음이 가볍다.'; } },
    { label: '반 단톡방에 주인을 찾는 글을 올린다', run: s => { G.grow('social', 2); return '오 분 만에 주인이 나타났다. "생명의 은인"이라는 답장이 왔다.'; } },
  ] });
ev({ id: 'daily_vending_jackpot', type: 'daily', title: '자판기의 기적', text: '자판기에 동전을 넣었더니 음료가 두 개 나왔다.',
  choices: [
    { label: '옆에 있던 친구에게 하나 준다', run: s => { G.grow('social', 2); const w = typeof pickFriend === 'function' ? pickFriend(s) : null; if (w) G.aff(w, 4); return '"오늘 운 좋다!" 둘이 건배했다.'; } },
    { label: '오늘의 운을 믿고 하나 더 뽑는다', run: s => { if (G.chance(0.3)) { G.add('luck', 3); return '또 두 개가 나왔다! 오늘은 무슨 날인가.'; } G.add('luck', 1); return '이번엔 하나만 나왔다. 그래도 기분은 좋다.'; } },
  ] });
ev({ id: 'daily_seat_change', type: 'daily', title: '자리 바꾸는 날', text: '한 달에 한 번 자리 바꾸는 날. 제비뽑기 통이 돌고 있다.',
  choices: [
    { label: '창가 자리를 노린다', run: s => { if (G.chance(0.4)) { G.fat(-5); G.add('luck', 2); return '창가 맨 뒷자리 당첨! 명당이다.'; } G.add('luck', 1); return '교탁 바로 앞자리. 선생님과 눈이 자주 마주칠 예정이다.'; } },
    { label: '앞자리를 자원한다', run: s => { G.grow('study', 2); G.aff('teacher', 3); return '앞자리에서 칠판이 잘 보인다. 선생님이 흐뭇하게 보셨다.'; } },
  ] });
ev({ id: 'daily_broadcast', type: 'daily', title: '점심 방송 신청곡', text: '방송부에서 점심 신청곡을 받는다는 공지가 떴다.',
  choices: [
    { label: '반 친구들 몰래 사연을 보낸다', run: s => { G.grow('social', 2); G.absurd(); return '점심시간, 내 사연이 흘러나왔다. 반 친구들이 누군지 추리하느라 바빴다.'; } },
    { label: '공부에 좋은 잔잔한 곡을 신청한다', run: s => { G.fat(-4); G.grow('study', 1); return '잔잔한 피아노 곡이 나오자 교실이 조금 조용해졌다.'; } },
  ] });
ev({ id: 'daily_mentor_note', type: 'daily', title: '후배의 질문', cond: s => s.year >= 2,
  text: '1학년 후배가 복도에서 쭈뼛거리며 다가왔다. "선배님, 동아리 뭐 하세요? 추천해 주실 수 있어요?"',
  choices: [
    { label: '진지하게 상담해 준다', run: s => { G.add('rep', 3); G.grow('social', 2); return '십 분 넘게 이야기했다. 후배가 고개를 꾸벅 숙이며 "꼭 들어갈게요"라고 했다.'; } },
    { label: '우리 동아리로 영업한다', run: s => { G.grow('social', 2); if (s.club) s.clubPts = (s.clubPts || 0) + 1; return '후배가 다음 날 가입 신청서를 들고 왔다. 영업 성공!'; } },
  ] });
ev({ id: 'daily_career_talk', type: 'daily', title: '진로 이야기', cond: s => s.year >= 2,
  text: '쉬는 시간, 반 친구들이 "너는 커서 뭐 할 거야?"라는 이야기로 시끌시끌하다.',
  choices: [
    { label: '내 꿈을 솔직하게 말한다', run: s => { G.grow('social', 2); G.add('luck', 1); return '다들 진지하게 들어 줬다. 말하고 나니 꿈이 조금 더 또렷해졌다.'; } },
    { label: '친구들 꿈을 하나씩 들어 준다', run: s => { G.grow('social', 3); return '다들 생각보다 멋진 꿈을 갖고 있었다. 10년 뒤 다시 모이자고 약속했다.'; } },
  ] });
ev({ id: 'daily_suneung_dday', type: 'daily', title: '교실 앞 D-day 달력', cond: s => s.year === 3,
  text: '교실 앞에 수능 D-day 달력이 걸렸다. 숫자가 생각보다 작다.',
  choices: [
    { label: '오늘 공부 목표를 적는다', run: s => { G.grow('study', 3); G.fat(4); return '달력 옆에 목표를 붙였다. 하루가 조금 더 촘촘해졌다.'; } },
    { label: '친구들과 응원 문구를 붙인다', run: s => { G.grow('social', 2); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 2)); return '"우리 다 같이 웃으면서 졸업하자." 반 전체가 한 줄씩 적었다.'; } },
  ] });
ev({ id: 'daily_hallway_echo', type: 'daily', title: '빈 복도의 메아리', text: '방과후 텅 빈 복도. 내 발소리만 울린다.',
  choices: [
    { label: '복도 끝까지 전력 질주한다', run: s => { G.grow('stamina', 2); G.absurd(); return '하필 그때 교무실 문이 열렸다. 선생님과 눈이 마주쳤다.'; } },
    { label: '창가에서 노을을 본다', run: s => { G.fat(-5); G.add('luck', 1); return '운동장이 주황색으로 물들었다. 오늘 하루도 수고했다.'; } },
  ] });
ev({ id: 'daily_library_return', type: 'daily', title: '연체 도서', text: '도서관에서 문자가 왔다. "대출 도서가 3일 연체되었습니다."',
  choices: [
    { label: '바로 반납하러 간다', run: s => { G.add('rep', 1); G.grow('study', 1); return '사서 선생님이 "다음엔 제때"라며 웃으셨다. 반납하는 김에 새 책도 빌렸다.'; } },
    { label: '다 읽고 반납한다', run: s => { G.grow('study', 2); G.absurd(); return '마지막 장까지 읽었다. 연체는 늘었지만 감동도 늘었다.'; } },
  ] });
ev({ id: 'daily_group_chat', type: 'daily', title: '단톡방 폭주', text: '밤 11시, 반 단톡방 알림이 300개 쌓였다. 내일 준비물을 두고 논쟁 중이다.',
  choices: [
    { label: '정리 글을 올린다', run: s => { G.add('rep', 3); return '"내일 준비물: 색연필, 가위, 풀." 정리 한 줄에 단톡방이 평화로워졌다.'; } },
    { label: '알림을 끄고 잔다', run: s => { G.fat(-8); return '푹 잤다. 아침에 보니 결국 준비물은 없었다.'; } },
  ] });
ev({ id: 'daily_spring_blossom', type: 'daily', title: '벚꽃 엔딩', cond: s => monthNow(s) >= 3 && monthNow(s) <= 4,
  text: '교문 옆 벚나무가 활짝 폈다. 점심시간마다 사진 찍는 줄이 생겼다.',
  choices: [
    { label: '친구들과 단체 사진을 찍는다', run: s => { G.grow('social', 2); FRIEND_IDS.forEach(id => s.met[id] && G.aff(id, 2)); return '꽃잎이 날리는 순간 셔터를 눌렀다. 올해의 첫 추억이다.'; } },
    { label: '벚꽃 아래 벤치에서 책을 읽는다', run: s => { G.grow('study', 2); G.fat(-4); return '바람이 불 때마다 책장 위로 꽃잎이 떨어졌다.'; } },
  ] });
ev({ id: 'daily_heat_ice', type: 'daily', title: '폭염의 아이스크림', cond: s => monthNow(s) >= 6 && monthNow(s) <= 8,
  text: '에어컨이 고장 난 교실. 반장이 "아이스크림 단체 주문할 사람?"이라고 외친다.',
  choices: [
    { label: '손을 번쩍 든다', run: s => { G.fat(-6); s.money = Math.max(0, (s.money || 0) - 500); return '수박바 하나에 교실 온도가 2도 내려간 기분이다. (용돈 −500원)'; } },
    { label: '부채질 당번을 자원한다', run: s => { G.grow('social', 2); G.fat(4); return '책받침으로 옆 친구들을 부쳐 줬다. 다들 고맙다며 아이스크림을 한 입씩 나눠 줬다.'; } },
  ] });
