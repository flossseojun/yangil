// 엔딩과 업적. 엔딩은 위에서부터 조건을 검사해 처음 맞는 것이 선택된다.
const ENDINGS = [
  { id: 'legend', name: '학교의 전설', hint: '공부·사교·평판 모두 정상, 내신 평균 2.2등급 이내, 업적 9개 이상',
    desc: '공부도, 사람도, 이름값도 모두 잡았다. 후배들은 당신의 이름을 교훈처럼 외운다.',
    test: (s, m) => m.study >= 80 && m.social >= 72 && m.rep >= 80 && m.gpa <= 2.2 && s.ach.length >= 9 },
  { id: 'president', name: '양일고 전교회장', hint: '친구들과 깊게 친해져서 전교회장 선거에 당선될 것',
    desc: '친구들의 표가 당신을 단상 위로 올렸다. 졸업식 날, 재학생 대표가 당신이 만든 공약 이야기를 했다.',
    test: (s, m) => s.flags.president && m.rep >= 65 && m.friends >= 3 },
  { id: 'council_hero', name: '학생회의 살림꾼', hint: '학생회에서 꾸준히 활동하며 큰 행사를 성공시킬 것',
    desc: '회장은 아니었지만 모든 행사 뒤에는 당신이 있었다. 졸업식 날 학생회 후배들이 감사패를 건넸다.',
    test: s => s.council && (s.councilPts || 0) >= 12 && s.seen.council_1 && !s.flags.president },
  { id: 'secret_couple', name: '아무도 몰랐던 커플', hint: '비밀 연애를 졸업까지 들키지 않고 지킬 것',
    desc: '졸업식 날, 둘이 손을 잡고 교문을 나서자 반 전체가 비명을 질렀다. "너네 언제부터?!" 3년 동안 아무도 몰랐다.',
    test: s => s.partner && s.loveSecret && s.love[s.partner] >= 75 },
  { id: 'couple', name: '양일고 공식 커플', hint: '설렘을 키워 고백하고, 졸업까지 마음을 지킬 것',
    desc: '은행나무길을 함께 걷던 두 사람. 졸업식 날 단체 사진 속에서도 둘은 나란히 서 있었다.',
    test: s => s.partner && s.love[s.partner] >= 70 },
  { id: 'byeongmat', name: '전설의 병맛 졸업생', hint: '황당한 사건을 몸소 겪고, 별명을 여러 개 얻을 것',
    desc: '당신이 지나간 자리에는 늘 웃음과 반성문이 남았다. 양일고 역사책의 "기타" 항목은 전부 당신 이야기다.',
    test: s => s.absurd >= 11 && s.nicks.length >= 3 },
  { id: 'mystery', name: '미스터리 해결사', hint: '학교의 숨겨진 비밀에 끝까지 다가갈 것',
    desc: '교감냥, 비밀 창고, 7대 미스터리. 양일고의 모든 비밀은 이제 당신의 수첩 안에 있다.',
    test: s => s.rare.length >= 4 && s.flags.hiddenRoom },
  { id: 'topstudent', name: '전교권 모범생', hint: '내신 평균 1.8등급 이내, 높은 공부 능력치',
    desc: '시험지 앞에서 흔들린 적이 없다. 졸업식 날 학업 우수상 단상에 당신이 섰다.',
    test: (s, m) => m.gpa <= 1.8 && m.study >= 75 },
  { id: 'scientist', name: '과학중점 연구원', hint: '이과를 선택하고 과학중점 탐구반에서 실험과 탐구에 몰두할 것',
    desc: '과학중점학교의 실험실이 당신의 두 번째 교실이었다. 졸업 후에도 연구 노트 첫 장에는 양일고 실험실 사진이 붙어 있다.',
    test: (s, m) => s.track === 'sci' && (clubTag(s) === 'science' || !!s.autoClub) && (s.flags.sciHours || 0) >= 4 && s.clubPts + s.autoPts >= 12 && m.study >= 70 },
  { id: 'auto_robotics', name: '양일 로봇 마스터', hint: '로보틱스 자율동아리에서 대회까지 가 볼 것',
    desc: '납땜 연기 속에서 3년을 보냈다. 졸업식 날, 로보틱스 후배들이 만든 로봇이 꽃다발을 건네주었다.',
    test: s => s.autoClub === 'robotics' && s.autoPts >= 10 && s.seen.auto_robotics_1 },
  { id: 'auto_squid', name: '갑오징어 박사', hint: '버터구이 자율동아리에서 끝까지 갑오징어를 지킬 것',
    desc: '버터구이의 전설. 수조 앞에는 "이 갑오징어는 먹지 마시오 — 선배 일동" 팻말과 당신의 이름이 남았다.',
    test: s => s.autoClub === 'squid' && s.autoPts >= 10 && s.seen.auto_squid_1 },
  { id: 'auto_seed', name: '토종 씨앗 지킴이', hint: '시드핸즈 자율동아리에서 씨앗 나눔까지 해 볼 것',
    desc: '당신이 심은 양평 토종 씨앗은 지금도 학교 텃밭에서 매년 싹을 틔운다. 개나리 옆 고랑이 당신 자리다.',
    test: s => s.autoClub === 'seed' && s.autoPts >= 10 && s.seen.auto_seed_1 },
  { id: 'auto_water', name: '남한강 수질 탐정', hint: '워터스캔 자율동아리에서 1년치 데이터를 완성할 것',
    desc: '남한강의 pH를 당신보다 잘 아는 고등학생은 없었다. 워터스캔 데이터 시트 첫 줄에는 아직도 당신 이름이 있다.',
    test: s => s.autoClub === 'water' && s.autoPts >= 10 && s.seen.auto_water_1 },
  { id: 'citizen', name: '양일 세계시민', hint: '친구와 평판, 그리고 유네스코학교 활동',
    desc: '참되게, 바르게, 알차게. 교훈을 몸으로 보여 준 사람. 유네스코학교 활동 사진 속에는 늘 당신이 있었다.',
    test: (s, m) => s.seen.unesco >= 2 && m.social >= 65 && m.rep >= 60 && m.friends >= 2 },
  { id: 'sports', name: '체육대회 레전드', hint: '체육대회 2회 이상 우승, 강한 체력',
    desc: '계주 바통을 쥔 당신은 무적이었다. 운동장 트랙에는 아직도 당신의 발자국이 남아 있다는 소문이 있다.',
    test: (s, m) => m.stamina >= 72 && (s.flags.sportsWins || 0) >= 2 },
  { id: 'idol', name: '녹향제의 아이돌', hint: '무대에 두 번 이상 오르고 평판을 쌓을 것',
    desc: '축제 무대가 끝날 때마다 앵콜이 터졌다. 졸업 후에도 녹향제 무대에는 당신의 노래가 흐른다.',
    test: (s, m) => (s.flags.stage || 0) >= 2 && m.rep >= 60 },
  { id: 'insider', name: '양일고 인싸', hint: '친구 3명 이상과 깊은 우정, 높은 사교성과 평판',
    desc: '복도를 지나가면 인사가 끊이지 않았다. 졸업식 날 롤링페이퍼가 세 장이나 필요했다.',
    test: (s, m) => m.social >= 70 && m.rep >= 62 && m.friends >= 3 },
  { id: 'sleeper', name: '보건실의 전설 잠만보', hint: '3년 동안 아주아주 많이 쉴 것',
    desc: '당신은 누구보다 잘 쉬었다. 보건실 침대에는 당신 전용이라는 이름표가 붙었다.',
    test: s => s.counts.rest >= 42 },
  { id: 'squad', name: '평생 가는 친구들', hint: '친구 여섯 명 이상과 우정 ★3을 채울 것 (실제 친구 모드)',
    desc: '졸업식이 끝나고 다 같이 은행나무길에 섰다. "10년 뒤에도 여기서 사진 찍자." 그 약속은 진짜가 될 것 같다.',
    test: (s, m) => s.mode !== 'classic' && CAMEO_IDS.filter(id => (s.cameo[id] || 0) >= 3).length >= 6 && m.friends >= 5 },
  { id: 'happy', name: '평범하지만 행복한 졸업', hint: '무리하지 않고 고르게, 친구 한 명 이상',
    desc: '특별한 전설은 없었지만 매일이 조금씩 즐거웠다. 돌아보면 그게 가장 큰 행운이었다.',
    test: (s, m) => STATS.every(k => m[k] >= 35) && m.friends >= 1 && s.fatigue < 75 },
  { id: 'survivor', name: '아무튼 졸업', hint: '어떻게든 졸업장을 받을 것',
    desc: '파란만장했지만 어쨌든 졸업장은 손에 쥐었다. 다음 생에는 조금 더 잘해 보자.',
    test: () => true },
];

const ACHIEVEMENTS = {
  first_friend:  { name: '첫 친구', desc: '친밀도 50 이상인 친구가 생겼다' },
  bestie:        { name: '영혼의 단짝', desc: '친구 한 명과 우정 ★3을 채웠다' },
  networker:     { name: '양일고 마당발', desc: '이번 생의 친구들을 모두 만났다' },
  teacher_pet:   { name: '철벽 붕괴', desc: '담임 쌤의 추천서를 받았다' },
  ace:           { name: '시험의 신', desc: '시험에서 95점 이상을 받았다' },
  comeback:      { name: '역전의 명수', desc: '직전 시험보다 2등급 이상 올렸다' },
  suneung:       { name: '수능 대박', desc: '수능 평균 2등급 이내를 받았다' },
  first_love:    { name: '두근두근', desc: '처음으로 누군가에게 설렜다 (연애 모드)' },
  couple:        { name: '공식 커플', desc: '고백이 성공해 연인이 생겼다 (연애 모드)' },
  council:       { name: '학생회 대활약', desc: '학생회 큰 행사를 성공시켰다' },
  yleague:       { name: 'Y리그 우승', desc: '반 대항 Y리그 결승에서 이겼다' },
  president:     { name: '전교회장 당선', desc: '전교 학생회장 선거에서 이겼다' },
  auto_club:     { name: '자율동아리 성과', desc: '자율동아리 대회·발표에서 상을 받았다' },
  college_top:   { name: '명문대 합격', desc: '최상위권 또는 서울 주요 대학에 합격했다' },
  setuk_master:  { name: '세특 부자', desc: '세부능력 및 특기사항을 10줄 이상 채웠다' },
  bookworm:      { name: '도서관 지박령', desc: '도서관을 10번 방문했다' },
  nap_king:      { name: '수면의 달인', desc: '휴식을 30번 했다' },
  bread:         { name: '빵 전쟁의 승자', desc: '매점 빵 쟁탈전에서 2번 이겼다' },
  nickname:      { name: '별명 부자', desc: '별명이 3개 이상 생겼다' },
  chaos:         { name: '사건 자석', desc: '병맛 사건을 10번 겪었다' },
  roof:          { name: '출입 금지 해제', desc: '옥상 열쇠를 손에 넣었다' },
  cat:           { name: '교감냥의 간택', desc: '전설의 고양이와 친해졌다' },
  detective:     { name: '7대 미스터리', desc: '지하 비밀 창고의 해답집을 읽었다' },
  mvp:           { name: '체육대회 MVP', desc: '계주에서 우승했다' },
  festival_star: { name: '축제의 주인공', desc: '녹향제 무대를 뒤집었다' },
  club_champion: { name: '동아리 대상', desc: '동아리 발표회에서 대상을 받았다' },
  burnout:       { name: '번아웃', desc: '피로가 100에 도달해 쓰러졌다' },
  talent:        { name: '재능 개화', desc: '숨겨진 재능을 발견했다' },
};

// 매 행동·이벤트 뒤에 자동으로 검사되는 업적
const AUTO_ACH = {
  first_friend: s => FRIEND_IDS.some(id => s.aff[id] >= 50),
  networker: s => FRIEND_IDS.length > 0 && FRIEND_IDS.every(id => s.met[id]),
  bookworm: s => (s.visits.library || 0) >= 10,
  nap_king: s => s.counts.rest >= 30,
  bread: s => (s.flags.breadWins || 0) >= 2,
  nickname: s => s.nicks.length >= 3,
  chaos: s => s.absurd >= 10,
};

function metrics(s) {
  const m = {};
  STATS.forEach(k => m[k] = Math.round(s.stats[k]));
  // 내신 평균: 학기 성적(지필+수행)의 학점 가중 평균, 없으면 시험 평균
  const sg = s.semGrades || [];
  m.gpa = sg.length ? sg.reduce((a, g) => a + g.grade * g.credits, 0) / sg.reduce((a, g) => a + g.credits, 0)
    : s.exams.length ? s.exams.reduce((a, e) => a + e.grade, 0) / s.exams.length : 5;
  m.friends = FRIEND_IDS.filter(id => s.aff[id] >= 50).length;
  return m;
}

function judgeEnding(s) {
  const m = metrics(s);
  const ending = ENDINGS.find(e => e.test(s, m));
  const avg = STATS.reduce((a, k) => a + m[k], 0) / STATS.length;
  const score = avg * 0.5 + (5 - m.gpa) * 6 + (s.suneung ? (9 - s.suneung.grade) * 1.5 : 0) + s.ach.length * 1.5 + s.rare.length * 2 + m.friends * 2 + (s.college ? (5 - s.college.rank) * 1.5 : 0);
  const rank = score >= 103 ? 'S' : score >= 94 ? 'A' : score >= 72 ? 'B' : 'C';
  return { ending, rank, score: Math.round(score), m };
}

// 칭호: 조건을 채우면 얻고, 하나를 골라 이름 앞에 단다
const TITLES = {
  newbie:        { name: '양일고 신입생', desc: '입학했다', test: () => true },
  study_artisan: { name: '자습 장인', desc: '자습을 40번 했다', test: s => s.counts.study >= 40 },
  quiz_master:   { name: '퀴즈 고수', desc: '자습 퀴즈를 10번 만점으로 풀었다', test: s => (s.flags.perfectQuiz || 0) >= 10 },
  wrong_master:  { name: '오답노트 마스터', desc: '오답노트로 15문제를 다시 맞혔다', test: s => (s.flags.wrongFixed || 0) >= 15 },
  perf_artisan:  { name: '수행평가 장인', desc: '수행평가에 8번 집중했다', test: s => (s.flags.perfFocus || 0) >= 8 },
  top_grade:     { name: '1등급 사냥꾼', desc: '학기 평균 1.5등급 이내를 받았다', test: s => (s.semGrades || []).some(g => g.grade <= 1.5) },
  setuk_rich:    { name: '세특 부자', desc: '세특을 15줄 채웠다', test: s => s.setuk.length >= 15 },
  sleeper:       { name: '보건실 단골', desc: '휴식을 30번 했다', test: s => s.counts.rest >= 30 },
  explorer:      { name: '양일고 탐험가', desc: '학교 탐험을 20번 했다', test: s => s.counts.explore >= 20 },
  store_vip:     { name: '매점 VIP', desc: '매점에 8번 갔다', test: s => (s.visits.store || 0) >= 8 },
  stargazer:     { name: '별 보는 사람', desc: '천문대에 5번 갔다', test: s => (s.visits.observatory || 0) >= 5 },
  sports_star:   { name: '운동장의 전설', desc: '체육한마당·Y리그에서 2번 우승했다', test: s => (s.flags.sportsWins || 0) >= 2 },
  stage_star:    { name: '무대 체질', desc: '무대에 2번 올라 박수를 받았다', test: s => (s.flags.stage || 0) >= 2 },
  networker:     { name: '마당발', desc: '친구 4명과 "친구" 이상이 됐다', test: s => FRIEND_IDS.filter(id => s.aff[id] >= 50).length >= 4 },
  chaos:         { name: '사건 자석', desc: '병맛 사건을 10번 겪었다', test: s => s.absurd >= 10 },
  nick_rich:     { name: '별명 수집가', desc: '별명이 3개 생겼다', test: s => s.nicks.length >= 3 },
  council:       { name: '학생회 일꾼', desc: '학생회 활동을 8번 했다', test: s => (s.councilPts || 0) >= 8 },
  researcher:    { name: '꼬마 연구원', desc: '자율동아리 활동을 8번 했다', test: s => (s.autoPts || 0) >= 8 },
  president:     { name: '전교회장', desc: '전교회장에 당선됐다', test: s => !!s.flags.president },
  romantic:      { name: '로맨티스트', desc: '연애를 시작했다 (연애 모드)', test: s => !!s.partner },
  heartbreak:    { name: '이별을 아는 자', desc: '이별을 겪었다 (연애 모드)', test: s => (s.flags.exes || 0) >= 1 },
  connector:     { name: '연결 고리', desc: '친구 셋 이상을 서로 이어 줬다', test: s => Object.values(s.pairs || {}).filter(v => v >= 2).length >= 3 },
  promise:       { name: '약속의 달인', desc: '친구와 약속을 10번 잡았다', test: s => (s.flags.hangouts || 0) >= 10 },
  grateful:      { name: '은혜 갚는 친구들', desc: '부탁을 들어준 친구가 3번 보답했다', test: s => (s.flags.paybacks || 0) >= 3 },
  couple_items:  { name: '커플템 수집가', desc: '커플템을 3개 모았다 (연애 모드)', test: s => (s.coupleItems || []).length >= 3 },
  makeup:        { name: '화해의 기술', desc: '연인과 다툰 뒤 두 번 화해했다 (연애 모드)', test: s => (s.flags.makeups || 0) >= 2 },
  dater:         { name: '데이트 장인', desc: '데이트를 5번 했다 (연애 모드)', test: s => (s.flags.dates || 0) >= 5 },
  class_star:    { name: '양일고 인기인', desc: '친구 5명과 우정 ★3을 채웠다', test: s => CAMEO_IDS.filter(id => (s.cameo[id] || 0) >= 3).length >= 5 },
};
CAMEO_IDS.forEach(id => { TITLES['cam_' + id] = { name: CAMEOS[id].title, desc: `${CAMEOS[id].name}${josa(CAMEOS[id].name, '과', '와')} 우정 ★3`, test: s => (s.cameo[id] || 0) >= 3 }; });
// 가상 졸업생 600명(전략 4가지 × 두 모드)을 시뮬레이션한 결과. 엔딩 희귀도와 상위 % 계산에 쓴다.
// q: 0·5·10…100 백분위 값
const GRAD_STATS = {"q": {"gpa": [1.1, 1.4, 1.5, 1.7, 1.8, 1.9, 2, 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 3, 3.1, 3.3, 3.4, 3.6, 3.9, 4.5], "score": [61, 75, 79, 82, 84, 86, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 100, 101, 103, 109], "stars3": [2, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7], "ach": [3, 6, 6, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 13, 16]}, "real": {"n": 300, "endings": {"insider": 98, "idol": 75, "president": 30, "sports": 29, "happy": 20, "squad": 12, "byeongmat": 7, "auto_water": 6, "legend": 6, "auto_squid": 4, "auto_seed": 4, "auto_robotics": 4, "survivor": 3, "topstudent": 2}}, "classic": {"n": 300, "endings": {"topstudent": 90, "couple": 38, "scientist": 32, "legend": 29, "happy": 19, "insider": 18, "byeongmat": 14, "auto_seed": 10, "sports": 9, "idol": 9, "survivor": 8, "secret_couple": 7, "auto_water": 5, "president": 4, "auto_robotics": 4, "auto_squid": 4}}};
