// 활동 미니게임: 자습(과목 퀴즈) · 운동(타이밍) · 동아리(기억력) · 대화(반응 고르기)
// 결과는 효율 배수(0.7~1.6)로 돌아가고, '빠르게 넘기기'는 ×0.8이다.

// 문제: [질문, 정답, 오답, 오답, 오답]
const QUIZ = {
  영어: [['abandon', '버리다', '얻다', '유지하다', '칭찬하다'], ['benefit', '이익', '손해', '의무', '경고'], ['consume', '소비하다', '생산하다', '저축하다', '거절하다'],
    ['determine', '결정하다', '망설이다', '반대하다', '숨기다'], ['enhance', '향상시키다', '감소시키다', '무시하다', '비난하다'], ['frequent', '잦은', '드문', '거대한', '조용한'],
    ['generous', '관대한', '인색한', '성급한', '소심한'], ['inevitable', '피할 수 없는', '우연한', '쉬운', '임시의'], ['reluctant', '꺼리는', '열정적인', '확신하는', '유명한'],
    ['sustain', '지속하다', '중단하다', '파괴하다', '빌리다'], ['vivid', '생생한', '흐릿한', '지루한', '오래된'], ['curious', '호기심 많은', '무관심한', '두려운', '지친']].map(([w, ...r]) => [`"${w}"의 뜻은?`, ...r]),
  국어: [['맞춤법이 옳은 것은?', '어떻게 해야 돼?', '어떻게 해야 되?', '어떡게 해야 돼?', '어떻해 해야 돼?'], ['맞춤법이 옳은 것은?', '금세 끝났다', '금새 끝났다', '금쌔 끝났다', '금시 끝났다'],
    ['맞춤법이 옳은 것은?', '며칠 뒤에 보자', '몇일 뒤에 보자', '몇 일 뒤에 보자', '멧칠 뒤에 보자'], ['맞춤법이 옳은 것은?', '숙제를 안 했다', '숙제를 않 했다', '숙제를 아니 했다', '숙제를 앙 했다'],
    ['맞춤법이 옳은 것은?', '설거지를 했다', '설겆이를 했다', '설걷이를 했다', '설거쥐를 했다'], ['맞춤법이 옳은 것은?', '오랜만이야', '오랫만이야', '오랜마니야', '오래만이야'],
    ['"내 마음은 호수요"에 쓰인 표현은?', '은유법', '직유법', '의인법', '과장법'], ['"찬란한 슬픔의 봄"에 쓰인 표현은?', '역설법', '반어법', '설의법', '대구법'],
    ['"참되게 바르게 알차게"는 양일고의 무엇?', '교훈', '교가', '교화', '교목']],
  사회: [['수요가 늘고 공급이 그대로면 가격은?', '오른다', '내린다', '그대로다', '0이 된다'], ['삼권 분립에서 법을 만드는 기관은?', '국회', '법원', '정부', '헌법재판소'],
    ['UN 지속가능발전목표의 약자는?', 'SDGs', 'WHO', 'IMF', 'NATO'], ['양평군이 속한 광역자치단체는?', '경기도', '강원도', '충청북도', '인천광역시'],
    ['남한강과 북한강이 만나는 양평의 명소는?', '두물머리', '용문사', '설악산', '산굼부리'], ['인권을 국제적으로 선언한 문서는?', '세계 인권 선언', '마그나 카르타', '권리 청원', '베르사유 조약'],
    ['GDP의 뜻은?', '국내 총생산', '국민 총소득', '소비자 물가 지수', '실업률'], ['선거의 4대 원칙(보통·평등·직접·비밀)이 아닌 것은?', '자유 선거', '보통 선거', '평등 선거', '비밀 선거']],
  한국사: [['훈민정음을 창제한 왕은?', '세종', '태종', '정조', '영조'], ['3·1 운동이 일어난 해는?', '1919년', '1910년', '1945년', '1950년'], ['고려를 세운 사람은?', '왕건', '이성계', '궁예', '견훤'],
    ['광복절은?', '8월 15일', '3월 1일', '6월 25일', '10월 3일'], ['양일고가 개교식을 한 해는?', '1970년', '1969년', '2000년', '2004년'], ['양일고가 남녀공학이 된 해는?', '2000년', '1974년', '2004년', '2014년'],
    ['조선의 마지막 황제는?', '순종', '고종', '철종', '헌종'], ['임진왜란 때 거북선을 이끈 장군은?', '이순신', '권율', '김시민', '곽재우']],
  과학: [['물의 화학식은?', 'H₂O', 'CO₂', 'O₂', 'NaCl'], ['나트륨의 원소 기호는?', 'Na', 'N', 'Ne', 'K'], ['힘의 단위는?', 'N (뉴턴)', 'J (줄)', 'W (와트)', 'Pa (파스칼)'],
    ['광합성이 일어나는 세포 소기관은?', '엽록체', '미토콘드리아', '핵', '리보솜'], ['pH 7은?', '중성', '산성', '염기성', '강산성'], ['지구 대기에서 가장 많은 기체는?', '질소', '산소', '이산화 탄소', '아르곤'],
    ['F = ma 에서 a는?', '가속도', '속도', '질량', '거리'], ['용존산소량(DO)이 높을수록 물은?', '깨끗하다', '오염됐다', '짜다', '뜨겁다'], ['갑오징어가 속한 동물 무리는?', '연체동물', '어류', '갑각류', '극피동물']],
  한문: [['"螢雪之功"의 뜻은?', '고생하며 부지런히 공부함', '눈 위에 서리가 내림', '반딧불이 사라짐', '공을 세워 상을 받음'], ['"一石二鳥"와 뜻이 비슷한 것은?', '일거양득', '구사일생', '오리무중', '동문서답'],
    ['"大器晩成"의 뜻은?', '큰 인물은 늦게 이루어짐', '큰 그릇이 깨짐', '늦게 와서 혼남', '일찍 성공함'], ['"山"의 음은?', '산', '수', '천', '목'], ['"學"의 뜻은?', '배우다', '가르치다', '쓰다', '읽다'],
    ['"作心三日"의 뜻은?', '결심이 오래가지 못함', '사흘 만에 성공함', '마음을 세 번 먹음', '사흘 동안 일함']],
  정보: [['이진수 101은 십진수로?', '5', '3', '6', '101'], ['반복문은?', 'for', 'if', 'print', 'return'], ['1바이트는 몇 비트?', '8', '4', '16', '2'], ['조건에 따라 실행하는 문장은?', 'if', 'for', 'while', 'def'],
    ['아두이노에서 아날로그 센서 값을 읽는 함수는?', 'analogRead', 'digitalWrite', 'delay', 'setup']],
  외국어: [['중국어 "谢谢"의 뜻은?', '고마워요', '안녕하세요', '미안해요', '잘 가요'], ['일본어 "おはよう"의 뜻은?', '안녕(아침 인사)', '잘 자', '고마워', '미안해'], ['스페인어 "Hola"의 뜻은?', '안녕', '고마워', '잘 가', '네'],
    ['중국어 "你好"의 뜻은?', '안녕하세요', '감사합니다', '괜찮아요', '맛있어요'], ['일본어 "ありがとう"의 뜻은?', '고마워', '미안해', '안녕', '맛있다'], ['스페인어 "Gracias"의 뜻은?', '고마워요', '안녕', '미안해요', '사랑해요']],
};
QUIZ.기술 = QUIZ.정보;
// 수학은 학년에 맞춰 즉석에서 만든다
function mathQuestion(year) {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const opts = (ans, spread) => { const s = new Set([ans]); while (s.size < 4) s.add(ans + r(-spread, spread)); return [...s].map(String); };
  const kinds = year === 1 ? ['mul', 'eq', 'pct'] : year === 2 ? ['pow', 'log', 'seq', 'eq'] : ['diff', 'pow', 'seq'];
  const k = kinds[r(0, kinds.length - 1)];
  if (k === 'mul') { const a = r(12, 39), b = r(3, 9); return [`${a} × ${b} = ?`, ...opts(a * b, 12)]; }
  if (k === 'eq') { const x = r(2, 12), a = r(2, 6), b = r(1, 15); return [`${a}x + ${b} = ${a * x + b} 일 때 x는?`, ...opts(x, 4)]; }
  if (k === 'pct') { const n = r(2, 9) * 20, p = [10, 25, 50][r(0, 2)]; return [`${n}의 ${p}%는?`, ...opts(n * p / 100, 10)]; }
  if (k === 'pow') { const e = r(3, 8); return [`2^${e} = ?`, ...opts(2 ** e, 2 ** (e - 2))]; }
  if (k === 'log') { const e = r(2, 7); return [`log₂ ${2 ** e} = ?`, ...opts(e, 3)]; }
  if (k === 'seq') { const a = r(1, 9), d = r(2, 7); return [`등차수열 ${a}, ${a + d}, ${a + 2 * d}, … 의 다음 항은?`, ...opts(a + 3 * d, 5)]; }
  const c = r(1, 5), x = r(1, 4); return [`f(x) = x² + ${c}x 일 때 f'(${x})는?`, ...opts(2 * x + c, 4)];
}
// 추가 문제: 개념 · 양일고 · 학교생활
const MORE = {
  영어: [['"아무리 ~해도"에 해당하는 표현은?', 'no matter how', 'as soon as', 'in order to', 'so that'], ['빈칸: She has lived here ___ 2020.', 'since', 'for', 'during', 'by'],
    ['"look forward to" 다음에 오는 형태는?', '-ing', 'to부정사', '동사원형', '과거분사'], ['"despite"와 뜻이 같은 것은?', 'in spite of', 'because of', 'instead of', 'according to']],
  국어: [['훈민정음 자음 기본자는 무엇을 본떴나?', '발음 기관의 모양', '하늘·땅·사람', '동물의 모양', '한자의 획'], ['"돌다리도 두들겨 보고 건너라"의 뜻은?', '잘 아는 일도 조심해서 하라', '돌다리는 위험하다', '서두르면 성공한다', '남의 말을 믿지 마라'],
    ['시조의 기본 형식은?', '3장 6구 45자 내외', '4장 8구', '2장 4구', '5장 10구'], ['"님의 침묵"을 쓴 시인은?', '한용운', '김소월', '윤동주', '이육사']],
  사회: [['UNESCO가 다루지 않는 분야는?', '군사', '교육', '과학', '문화'], ['인구가 줄어 지역이 사라질 위기를 뜻하는 말은?', '지방 소멸', '도시화', '고령화', '역도시화'],
    ['기회비용이란?', '포기한 것 중 가장 큰 가치', '지불한 돈', '얻은 이익', '세금'], ['양일고가 2016년부터 참여한 학교 네트워크는?', '유네스코 학교', '혁신학교', '자율형 사립고', '마이스터고']],
  한국사: [['조선을 건국한 사람은?', '이성계', '왕건', '정도전', '세종'], ['신라가 삼국을 통일한 왕은?', '문무왕', '진흥왕', '법흥왕', '장수왕'], ['대한민국 임시 정부가 수립된 곳은?', '상하이', '베이징', '도쿄', '블라디보스토크'],
    ['6·25 전쟁이 일어난 해는?', '1950년', '1945년', '1953년', '1960년']],
  과학: [['빛이 가장 빠르게 이동하는 곳은?', '진공', '물', '유리', '공기'], ['산과 염기가 만나 물과 염이 생기는 반응은?', '중화 반응', '산화 반응', '연소', '광합성'], ['세포에서 에너지를 만드는 소기관은?', '미토콘드리아', '엽록체', '골지체', '액포'],
    ['전류의 단위는?', 'A (암페어)', 'V (볼트)', 'Ω (옴)', 'W (와트)'], ['양일고가 2011년부터 운영한 특색 교육은?', '과학중점학교', '영재학교', '마이스터 과정', '체육중점학교'], ['갑오징어 연구 동아리 버터구이가 하는 실험은?', '알 인공 부화·방류', '갑오징어 요리', '먹물 그림', '수조 청소만']],
  한문: [['"溫故知新"의 뜻은?', '옛것을 익혀 새것을 앎', '따뜻한 옛 친구', '새 옷을 입음', '고향을 떠남'], ['"水"의 음은?', '수', '화', '목', '토']],
  정보: [['알고리즘의 조건이 아닌 것은?', '무한성', '명확성', '유한성', '입력'], ['데이터로 스스로 학습하는 인공지능 기술은?', '머신러닝', '하드코딩', '디버깅', '컴파일']],
};
Object.entries(MORE).forEach(([k, l]) => { QUIZ[k] = (QUIZ[k] || []).concat(l); });
QUIZ.기술 = QUIZ.정보;
// OX 문제: [문장, 참인가]
const OX = {
  과학: [['소리는 진공에서도 전달된다.', false], ['물은 4℃에서 밀도가 가장 크다.', true], ['식물은 밤에도 호흡을 한다.', true], ['용존산소량이 낮을수록 깨끗한 물이다.', false]],
  사회: [['우리나라 국회의원 임기는 4년이다.', true], ['UN 본부는 제네바에 있다.', false], ['수요가 줄면 가격은 대체로 내려간다.', true]],
  한국사: [['훈민정음은 조선 세종 때 반포되었다.', true], ['고구려는 신라보다 먼저 멸망했다.', true], ['양일고는 처음부터 남녀공학이었다.', false]],
  국어: [['"되어"로 바꿀 수 있으면 "돼"를 쓴다.', true], ['"안"은 "아니"의 준말이다.', true], ['직유법은 "~처럼, ~같이"를 쓰지 않는다.', false]],
  영어: [['"advice"는 셀 수 있는 명사이다.', false], ['현재완료는 "have + 과거분사"이다.', true]],
};
// 한국사 연대순: 둘 중 먼저 일어난 일
const TIMELINE = [['고려 건국', 918], ['훈민정음 반포', 1446], ['임진왜란', 1592], ['갑오개혁', 1894], ['3·1 운동', 1919], ['광복', 1945], ['6·25 전쟁', 1950], ['양일고 개교', 1970], ['양일고 남녀공학 전환', 2000]];
const ENG_WORDS = QUIZ.영어.slice(0, 12).map(r => [r[0].replace(/^"(.*)"의 뜻은\?$/, '$1'), r[1]]);
function makeQuestion(area, year) {
  const roll = Math.random();
  if (OX[area] && roll < 0.22) { const [q, t] = OX[area][Math.floor(Math.random() * OX[area].length)]; return { area, q: `O / X : ${q}`, a: t ? 'O' : 'X', opts: ['O', 'X'] }; }
  if (area === '한국사' && roll < 0.45) { const [x, y] = TIMELINE.slice().sort(() => Math.random() - 0.5); return { area, q: '둘 중 먼저 일어난 일은?', a: x[1] < y[1] ? x[0] : y[0], opts: [x[0], y[0]] }; }
  if (area === '영어' && roll < 0.4) { const pick4 = ENG_WORDS.slice().sort(() => Math.random() - 0.5).slice(0, 4); return { area, q: `"${pick4[0][1]}"에 해당하는 영단어는?`, a: pick4[0][0], opts: pick4.map(w => w[0]).sort(() => Math.random() - 0.5) }; }
  return makeQuestionBasic(area, year);
}
function makeQuestionBasic(area, year) {

  const raw = area === '수학' ? mathQuestion(year) : (QUIZ[area] || QUIZ[['국어', '영어', '사회', '과학'][Math.floor(Math.random() * 4)]])[Math.floor(Math.random() * (QUIZ[area] || QUIZ.국어).length)] || QUIZ.국어[0];
  const [q, a, ...wrong] = raw;
  return { area, q, a, opts: [a, ...wrong].sort(() => Math.random() - 0.5) };
}

// 대화 반응: 친구마다 좋아하는 반응이 다르다
// 친구 대사의 종류(제안 · 질문 · 그냥 말)에 맞춰 반응 문장을 바꾼다. 성향(진지·장난·호기심)은 그대로다.
function reactionsFor(line) {
  const t = line.trim();
  if (/(하자|가자|보자|자!|자\.|할래\?|갈래\?|볼래\?|먹을래\?|해 줄까\?|줄게)/.test(t)) return {
    sincere: '"좋아, 같이 하자." 하고 웃는다', playful: '"좋아! 대신 지는 사람이 매점 쏘기!"', curious: '"좋지! 근데 왜 갑자기?" 하고 웃으며 묻는다' };
  if (/\?$/.test(t)) return {
    sincere: '진지하게 대답해 준다', playful: '장난스럽게 대답한다', curious: '대답하고 이것저것 더 물어본다' };
  return REACTIONS;
}
const REACTIONS = {
  sincere: '진지하게 고개를 끄덕인다',
  playful: '장난스럽게 받아친다',
  curious: '"왜? 더 얘기해 줘" 하고 묻는다',
};

const MINI = { st: null, raf: 0, timers: [] };
const $mini = () => document.getElementById('mini');
const multOf = (k, n) => Math.round((0.7 + 0.9 * k / n) * 10) / 10;

function openMini(kind, opts, done) {
  MINI.st = Object.assign({ kind, done, step: 0, hits: 0, log: [] }, opts);
  if (kind === 'quiz') MINI.st.qs = opts.qs;
  if (kind === 'timing') { MINI.st.rounds = 3; newTimingRound(); }
  if (kind === 'memory') { MINI.st.seq = Array.from({ length: opts.len }, () => Math.floor(Math.random() * 4)); MINI.st.input = []; MINI.st.showing = true; }
  if (kind === 'quiz') { MINI.st.deadline = performance.now() + 15000; }
  if (kind === 'order') { const pool = ORDER_TASKS[opts.club] || ORDER_TASKS.robotics; const t = pool[Math.floor(Math.random() * pool.length)]; Object.assign(MINI.st, { task: t, steps: t.steps.slice().sort(() => Math.random() - 0.5), got: [] }); }
  if (kind === 'sort') { MINI.st.slips = SLIPS.slice().sort(() => Math.random() - 0.5).slice(0, opts.n || 4); }
  renderMini();
  if (kind === 'timing') loopTiming();
  if (kind === 'quiz') loopQuiz();
  if (kind === 'memory') playSequence();
}

function closeMini(mult, note) {
  cancelAnimationFrame(MINI.raf); MINI.timers.forEach(clearTimeout); MINI.timers = [];
  const { done, log, matched, qs } = MINI.st; MINI.st = null;
  $mini().hidden = true; $mini().innerHTML = '';
  done(mult, note, { log: log || [], matched, qs });
}

function renderMini() {
  const st = MINI.st, m = $mini();
  if (!st) { m.hidden = true; return; }
  m.hidden = false;
  const head = `<div class="mini-head"><span class="ev-type">미니게임 · ${st.title}</span>${st.result ? '' : '<button class="link" data-act="mini-skip">빠르게 넘기기 ×0.8</button>'}</div>`;
  let body = '';
  if (st.result) {
    body = `<div class="mini-result"><b>${st.result.title}</b><p>${esc(st.result.text)}</p><span class="mini-mult">효율 ×${st.result.mult}</span></div>
      <button class="btn primary wide" data-act="mini-done" autofocus>계속</button>`;
  } else if (st.kind === 'quiz') {
    const q = st.qs[st.step];
    body = `<div class="mini-timer"><i id="mini-bar"></i></div>
      <p class="mini-q"><small>${st.step + 1} / ${st.qs.length} · ${esc(q.sub || q.area)}</small>${esc(q.q)}</p>
      <div class="mini-opts">${q.opts.map((o, i) => `<button class="choice ${st.picked != null ? (o === q.a ? 'right' : i === st.picked ? 'wrong' : '') : ''}" data-act="mini-answer" data-arg="${i}" ${st.picked != null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>`;
  } else if (st.kind === 'timing') {
    body = `<p class="mini-q"><small>${st.step + 1} / ${st.rounds} · 성공 ${st.hits}</small>초록 구간에서 멈춰!</p>
      <div class="mini-track"><span class="mini-zone" style="left:${(st.zone - st.half) * 100}%;width:${st.half * 200}%"></span><span class="mini-cursor" id="mini-cursor"></span></div>
      <button class="btn primary wide big" data-act="mini-tap">지금!</button>`;
  } else if (st.kind === 'memory') {
    body = `<p class="mini-q"><small>${st.showing ? '순서를 기억해!' : `${st.input.length} / ${st.seq.length}`}</small>${st.showing ? '불이 켜지는 순서를 잘 봐.' : '같은 순서대로 눌러!'}</p>
      <div class="mini-pads">${[0, 1, 2, 3].map(i => `<button class="pad p${i}" id="pad${i}" data-act="mini-pad" data-arg="${i}" ${st.showing ? 'disabled' : ''} aria-label="${['빨강', '노랑', '초록', '파랑'][i]}"></button>`).join('')}</div>`;
  } else if (st.kind === 'order') {
    body = `<p class="mini-q"><small>${st.task.name}</small>실험 순서대로 눌러!</p>
      <ol class="order-done">${st.task.steps.map((x, k) => `<li class="${k < st.got.length ? 'ok' : ''}">${k < st.got.length ? esc(st.got[k]) : '?'}</li>`).join('')}</ol>
      <div class="mini-opts">${st.steps.map((x, k) => `<button class="choice" data-act="mini-order" data-arg="${k}" ${st.got.includes(x) ? 'disabled' : ''}>${esc(x)}</button>`).join('')}</div>`;
  } else if (st.kind === 'sort') {
    const slip = st.slips[st.step];
    body = `<p class="mini-q"><small>${st.step + 1} / ${st.slips.length} · 맞힘 ${st.hits}</small>어느 부서로 보낼까?</p>
      <blockquote class="slip">"${esc(slip[0])}"</blockquote>
      <div class="mini-opts bins">${SLIP_BINS.map(b => `<button class="choice" data-act="mini-sort" data-arg="${b}">${b}</button>`).join('')}</div>`;
  } else if (st.kind === 'talk') {
    body = `<div class="ev-body">${avatar(st.who, 'lg')}<p>"${esc(st.line)}"</p></div>
      <p class="mini-q"><small>${esc(CHARACTERS[st.who].name)}${josa(CHARACTERS[st.who].name, '은', '는')} 어떤 반응을 좋아할까?</small></p>
      <div class="mini-opts">${Object.entries(reactionsFor(st.line)).map(([k, t]) => `<button class="choice" data-act="mini-react" data-arg="${k}">${t}</button>`).join('')}</div>`;
  }
  m.innerHTML = `<div class="ev-card mini-card" role="dialog" aria-modal="true">${head}${body}</div>`;
  const f = m.querySelector('[autofocus]'); if (f) f.focus({ preventScroll: true });
}

function finishWith(title, text, mult) { MINI.st.result = { title, text, mult }; cancelAnimationFrame(MINI.raf); renderMini(); }

// 퀴즈: 15초 안에 문제를 푼다. 틀린 문제는 오답노트로 간다.
function loopQuiz() {
  const st = MINI.st; if (!st || st.kind !== 'quiz' || st.result) return;
  const left = Math.max(0, st.deadline - performance.now());
  const bar = document.getElementById('mini-bar'); if (bar) bar.style.width = `${left / 150}%`;
  if (left <= 0) return endQuiz(true);
  MINI.raf = requestAnimationFrame(loopQuiz);
}
function answerQuiz(i) {
  const st = MINI.st, q = st.qs[st.step];
  if (st.picked != null) return;
  st.picked = i;
  const ok = q.opts[i] === q.a;
  if (ok) { st.hits++; SFX.play('pop'); } else { st.log.push(q); SFX.play('click'); }
  renderMini();
  MINI.timers.push(setTimeout(() => {
    if (!MINI.st) return;
    st.picked = null; st.step++;
    if (st.step >= st.qs.length) endQuiz(false); else renderMini();
  }, ok ? 450 : 900));
}
function endQuiz(timeout) {
  const st = MINI.st, n = st.qs.length;
  st.qs.slice(st.step).forEach(q => st.log.push(q));
  const mult = multOf(st.hits, n);
  finishWith(st.hits === n ? '만점!' : timeout ? '시간 초과' : `${st.hits} / ${n} 정답`,
    st.log.length ? `틀린 문제는 오답노트에 적었다: ${st.log.map(q => q.a).join(', ')}` : '막힘없이 풀었다.', mult);
}

// 타이밍: 왔다 갔다 하는 막대를 초록 구간에서 멈춘다. 체력이 높을수록 구간이 넓다.
function newTimingRound() { const st = MINI.st; st.half = 0.13 + Math.min(0.07, (st.stamina || 40) / 1000); st.zone = st.half + Math.random() * (1 - 2 * st.half); st.t0 = performance.now(); st.speed = 0.75 + st.step * 0.12; }
function cursorPos() { const st = MINI.st; return (Math.sin((performance.now() - st.t0) / 1000 * st.speed * Math.PI) + 1) / 2; }
function loopTiming() {
  const st = MINI.st; if (!st || st.kind !== 'timing' || st.result) return;
  const c = document.getElementById('mini-cursor'); if (c) c.style.left = `${cursorPos() * 100}%`;
  MINI.raf = requestAnimationFrame(loopTiming);
}
function tapTiming() {
  const st = MINI.st, hit = Math.abs(cursorPos() - st.zone) <= st.half;
  if (hit) { st.hits++; SFX.play('pop'); } else SFX.play('click');
  st.step++;
  if (st.step >= st.rounds) return finishWith(st.hits === 3 ? '완벽해!' : `${st.hits} / 3 성공`, st.hits ? '몸이 리듬을 기억하기 시작했다.' : '오늘은 몸이 따로 놀았다.', multOf(st.hits, 3));
  newTimingRound(); renderMini(); loopTiming();
}

// 기억력: 켜지는 순서를 기억했다가 그대로 누른다
function playSequence() {
  const st = MINI.st;
  st.seq.forEach((p, i) => {
    MINI.timers.push(setTimeout(() => { const el = document.getElementById(`pad${p}`); if (el) { el.classList.add('lit'); SFX.play('click'); } }, 500 + i * 600));
    MINI.timers.push(setTimeout(() => { const el = document.getElementById(`pad${p}`); if (el) el.classList.remove('lit'); }, 900 + i * 600));
  });
  MINI.timers.push(setTimeout(() => { if (MINI.st === st) { st.showing = false; renderMini(); } }, 600 + st.seq.length * 600));
}
function pressPad(i) {
  const st = MINI.st;
  const el = document.getElementById(`pad${i}`); if (el) { el.classList.add('lit'); setTimeout(() => el.classList.remove('lit'), 150); }
  if (st.seq[st.input.length] !== i) { SFX.play('boing'); return finishWith(`${st.input.length} / ${st.seq.length}`, '순서가 꼬였다. 그래도 절반은 기억했다.', multOf(st.input.length, st.seq.length)); }
  st.input.push(i); SFX.play('pop');
  if (st.input.length === st.seq.length) return finishWith('완벽한 기억력!', '손발이 척척 맞았다.', 1.6);
  const s = document.querySelector('.mini-q small'); if (s) s.textContent = `${st.input.length} / ${st.seq.length}`;
}

// 자율동아리: 실험·활동 순서를 차례대로 누른다
const ORDER_TASKS = {
  robotics: [{ name: '라인트레이서 만들기', steps: ['회로도 그리기', '부품 납땜', '코드 업로드', '주행 테스트'] }, { name: '센서 보정', steps: ['센서 연결', '센서 값 읽기', '기준값 정하기', '라인 따라 주행'] }],
  squid: [{ name: '수조 관리', steps: ['물 받아 두기', '수온 맞추기', '물 일부 갈기', '갑오징어 상태 관찰'] }, { name: '사육 기록', steps: ['수온 확인', '염도 측정', '먹이 주기', '관찰 일지 쓰기'] }],
  seed: [{ name: '토종 씨앗 심기', steps: ['흙 고르기', '씨앗 심기', '물 주기', '싹 관찰하기'] }, { name: '씨앗 나눔 준비', steps: ['씨앗 고르기', '이름표 붙이기', '봉투에 담기', '장터에 진열'] }],
  water: [{ name: '남한강 수질 측정', steps: ['측정 지점 정하기', '강물 떠 오기', '측정기 보정', '결과 기록'] }, { name: 'pH 측정', steps: ['시료 채취', '전극 세척', 'pH 측정', '지도에 표시'] }],
};
function pressOrder(k) {
  const st = MINI.st, x = st.steps[k];
  if (x === st.task.steps[st.got.length]) {
    st.got.push(x); SFX.play('pop');
    if (st.got.length === st.task.steps.length) return finishWith('실험 성공!', '순서를 한 번도 틀리지 않았다. 결과가 깔끔하게 나왔다.', 1.6);
    return renderMini();
  }
  SFX.play('boing');
  finishWith(`${st.got.length} / ${st.task.steps.length}`, `"${x}"는 아직 할 차례가 아니었다. 다음엔 순서를 먼저 떠올려 보자.`, multOf(st.got.length, st.task.steps.length));
}
// 학생회: 건의함 쪽지를 알맞은 부서로 보낸다
const SLIP_BINS = ['행사', '복지', '안전·환경'];
const SLIPS = [
  ['축제 무대 시간을 늘려 주세요', '행사'], ['체육대회 종목에 이어달리기를 추가해 주세요', '행사'], ['양스킹 무대에 조명을 달아 주세요', '행사'], ['졸업식 영상을 학생들이 만들게 해 주세요', '행사'],
  ['매점 소보로빵을 더 들여와 주세요', '복지'], ['급식 메뉴 투표를 해 주세요', '복지'], ['교실 정수기를 고쳐 주세요', '복지'], ['도서관을 저녁까지 열어 주세요', '복지'],
  ['복도에서 뛰지 않기 캠페인을 해 주세요', '안전·환경'], ['분리수거함을 층마다 놓아 주세요', '안전·환경'], ['계단 미끄럼 방지 테이프를 붙여 주세요', '안전·환경'], ['은행나무길에 쓰레기통을 놓아 주세요', '안전·환경'],
];
function pressSort(bin) {
  const st = MINI.st, slip = st.slips[st.step];
  if (slip[1] === bin) { st.hits++; SFX.play('pop'); } else SFX.play('click');
  st.step++;
  if (st.step >= st.slips.length) return finishWith(st.hits === st.slips.length ? '완벽한 분류!' : `${st.hits} / ${st.slips.length} 정확`, st.hits === st.slips.length ? '건의 쪽지가 모두 알맞은 부서로 갔다.' : '몇 장은 다른 부서로 갔지만, 회의에서 바로잡았다.', multOf(st.hits, st.slips.length));
  renderMini();
}

function reactTalk(k) {
  const st = MINI.st, liked = CHARACTERS[st.who].likes;
  const ok = k === liked;
  finishWith(ok ? '딱 맞는 반응!' : '나쁘지 않아', ok ? `${CHARACTERS[st.who].name}${josa(CHARACTERS[st.who].name, '이', '가')} 활짝 웃었다.` : `${CHARACTERS[st.who].name}${josa(CHARACTERS[st.who].name, '은', '는')} 조금 다른 반응을 기대한 것 같다.`, ok ? 1.5 : 0.9);
  MINI.st.matched = ok;
}

function miniAction(act, arg) {
  const st = MINI.st; if (!st) return;
  if (act === 'mini-skip') return closeMini(0.8, '빠르게 넘김');
  if (act === 'mini-done') return closeMini(st.result.mult, `${st.title} ${st.result.title} · ×${st.result.mult}`);
  if (act === 'mini-answer') answerQuiz(+arg);
  if (act === 'mini-tap') tapTiming();
  if (act === 'mini-pad') pressPad(+arg);
  if (act === 'mini-react') reactTalk(arg);
  if (act === 'mini-order') pressOrder(+arg);
  if (act === 'mini-sort') pressSort(arg);
}
