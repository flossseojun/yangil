// 이번 생은 야구다에서 참고한 기능: 그날 속으로(명장면 챌린지) · 동창회 대항전 · 양일고 소식판 · 명예의 전당 · 입학 등급

/* ───────── 입학 등급 (캐릭터 만들기 화면) ─────────
   다섯 능력치 합으로 등급을 매긴다. 상위 %는 무작위 주인공 3,000명을 뽑아 본 분포로 계산한다. */
let STAT_SUMS = null;
function statSum(stats) { return STATS.reduce((a, k) => a + stats[k], 0); }
function entryGrade(stats) {
  if (!STAT_SUMS) { STAT_SUMS = Array.from({ length: 3000 }, () => statSum(rollCharacter().stats)).sort((a, b) => a - b); }
  const v = statSum(stats), below = STAT_SUMS.filter(x => x < v).length, top = Math.max(1, Math.round(100 - below / STAT_SUMS.length * 100));
  const g = top <= 3 ? 'S' : top <= 10 ? 'A+' : top <= 22 ? 'A' : top <= 40 ? 'B+' : top <= 60 ? 'B' : top <= 80 ? 'C+' : 'C';
  return { g, top, sum: v };
}
function entryGradeHtml(stats) {
  const e = entryGrade(stats);
  return `<div class="entry-grade g-${e.g.replace('+', 'p')}"><b>${e.g}</b><span>입학 등급<small>능력치 합 ${e.sum} · 상위 ${e.top}%</small></span></div>`;
}

/* ───────── 양일고 소식판 (업데이트 소식) ───────── */
const NEWS = [
  ['11.12', '난이도 조정: S·A등급이 더 어려워졌어요. 친한 친구 점수는 6명까지'],
  ['11.11', '명예의 전당 입성 조건 공개: 전설 엔딩 + S등급 + 내신 1점대'],
  ['11.06', '날씨가 생겼어요(장마·폭염·첫눈) · 매점 옆 옷장 오픈 · 졸업식 단체사진'],
  ['11.02', '「그날 속으로」 명장면 챌린지 · 동창회 대항전 · 명예의 전당이 열렸어요'],
  ['11.01', '화면 연출 업데이트: 계절이 바뀌고, 행동할 때 짧은 장면이 나와요'],
  ['11.01', '졸업 특집 양일학보 · 매점 한정 상품 · 늦게 핀 꽃 · 저장 코드'],
  ['10.31', '사건마다 장면 그림이 생겼어요. 친구들 외모도 반영'],
  ['10.31', '새 친구 엄태정 · 문상웅 · 선우석 · 박민아 등장'],
];
function newsBoardHtml() {
  return `<section class="newsboard" aria-label="양일고 소식"><h2>양일고 소식</h2><ul>${NEWS.slice(0, 3).map(([d, t]) => `<li><time>${d}</time><span>${esc(t)}</span></li>`).join('')}</ul></section>`;
}

/* ───────── 명예의 전당 ─────────
   친구들이 보낸 졸업 카드 중에서 골라 직접 적어 넣는다. { name, ending, story, date } */
const HALL_OF_FAME = [];
// 명예의 전당 입성 조건: 전설 엔딩 + S등급 + 내신 1점대
function hallChecks(r) {
  const rr = typeof rarityOf === 'function' ? rarityOf(r) : null;
  return [
    { label: '전설 엔딩', sub: '100명 중 2명 미만이 보는 엔딩', ok: !!rr && rr.tier[0] === '전설', val: rr ? rr.tier[0] : '-' },
    { label: 'S등급', sub: '졸업 점수 103점 이상', ok: r.rank === 'S', val: `${r.rank}등급` },
    { label: '내신 1점대', sub: '내신 평균 2.0등급 미만', ok: r.gpa < 2, val: `${r.gpa}등급` },
  ];
}
const hallOk = r => hallChecks(r).every(c => c.ok);
function hallCheckHtml(r) {
  const cs = hallChecks(r), n = cs.filter(c => c.ok).length, ok = n === 3;
  return `<div class="paper hall-check ${ok ? 'in' : ''}">
    <h3 class="sec-title">${ok ? '🏆 명예의 전당 입성!' : `명예의 전당 도전 · ${n} / 3`}</h3>
    <ul class="hall-cond">${cs.map(c => `<li class="${c.ok ? 'ok' : ''}"><span>${c.ok ? '✓' : '✗'}</span><b>${c.label}</b><small>${c.sub} · 나: ${esc(c.val)}</small></li>`).join('')}</ul>
    <p class="fine">${ok ? '세 조건을 모두 채운 진짜 최고 기록이에요! 졸업 카드를 「의견 보내기」로 보내면 명예의 전당에 이름을 올려 드려요.' : n === 2 ? '하나만 더 채우면 명예의 전당이에요!' : '전설 엔딩 · S등급 · 내신 1점대를 한 판에 모두 채우면 명예의 전당에 들어가요.'}</p></div>`;
}
function renderHall() {
  const recs = loadRecords(), mine = recs.filter(hallOk);
  const near = recs.filter(r => !hallOk(r)).map(r => ({ r, n: hallChecks(r).filter(c => c.ok).length })).filter(x => x.n >= 1).sort((a, b) => b.n - a.n || a.r.gpa - b.r.gpa).slice(0, 3);
  const row = (r, extra) => `<li><span class="hall-no">${r.rank}</span><div><b>${esc(r.name)}</b><small>${esc(endingOf(r.ending).name)} · 내신 ${r.gpa} · No.${String(r.no).padStart(3, '0')}</small>${extra || ''}</div></li>`;
  return `<section class="dex hall">
    <header class="sheet-head row"><div><p class="eyebrow">진짜 최고 기록</p><h2>명예의 전당</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <div class="paper"><h3 class="sec-title">입성 조건 · 세 가지를 한 판에</h3>
      <ul class="hall-cond big"><li><span>1</span><b>전설 엔딩</b><small>100명 중 2명 미만이 보는 엔딩</small></li><li><span>2</span><b>S등급</b><small>졸업 점수 103점 이상</small></li><li><span>3</span><b>내신 1점대</b><small>내신 평균 2.0등급 미만</small></li></ul></div>
    <div class="paper"><h3 class="sec-title">내 졸업생 중 입성 · ${mine.length}명</h3>
      ${mine.length ? `<ul class="hall-list">${mine.map(r => row(r, '<p>🏆 세 조건 모두 달성</p>')).join('')}</ul>` : '<p class="fine">아직 없어요. 가장 가까웠던 기록은 아래에 있어요.</p>'}
      ${near.length ? `<h4 class="closet-slot">아깝게 놓친 기록</h4><ul class="hall-list">${near.map(x => row(x.r, `<p>${x.n} / 3 · 못 채운 것: ${hallChecks(x.r).filter(c => !c.ok).map(c => c.label).join(', ')}</p>`)).join('')}</ul>` : ''}</div>
    <div class="paper"><h3 class="sec-title">헌액된 졸업생</h3>
    ${HALL_OF_FAME.length ? `<ul class="hall-list">${HALL_OF_FAME.map((h, i) => `<li><span class="hall-no">${i + 1}</span><div><b>${esc(h.name)}</b><small>${esc(h.ending)} · ${esc(h.date || '')}</small><p>${esc(h.story)}</p></div></li>`).join('')}</ul>`
      : `<p><b>아직 헌액된 졸업생이 없어요.</b></p><p class="fine">세 조건을 모두 채웠다면 졸업 화면에서 카드를 만든 뒤, 「의견 보내기」로 졸업 카드를 보내 주세요. 확인해서 이곳에 이름을 올려 드려요.</p>${feedbackButton('btn primary')}`}</div>
  </section>`;
}

/* ───────── 그날 속으로: 명장면 챌린지 ─────────
   3년을 다 하지 않고, 학교 명장면 하나에 졸업생이 다시 들어가 세 번의 선택으로 결과를 바꾼다. 두 번 이상 성공하면 정복. */
const CHALLENGES = {
  relay: { title: '체육한마당 마지막 코너', bg: 'field', match: 'relay', intro: '1학년 체육한마당, 반 대항 계주 마지막 바퀴. 바통을 받은 순간 우리 반은 3등이다. 함성이 운동장을 덮는다.', rounds: [
    ['첫 코너, 앞 주자와 거리가 벌어진다.', [['안쪽으로 파고든다', 'stamina', 45, '안쪽 라인을 타고 한 명을 제쳤다!', '안쪽이 막혀 오히려 속도가 줄었다.'], ['페이스를 지킨다', 'luck', 40, '앞 주자가 숨이 차서 느려졌다. 거리가 줄었다.', '거리가 그대로다. 시간이 없다.']]],
    ['직선 구간, 응원석에서 내 이름이 들린다.', [['응원에 힘입어 전력 질주', 'stamina', 55, '다리가 저절로 움직였다. 2등까지 올라왔다!', '숨이 턱 막혔다. 다리가 무겁다.'], ['친구들에게 손을 흔든다', 'social', 50, '응원 소리가 두 배가 됐다. 이상하게 힘이 난다.', '손 흔들다 리듬이 깨졌다.']]],
    ['마지막 코너, 1등과 나란히 섰다.', [['결승선까지 몸을 던진다', 'stamina', 60, '가슴 하나 차이! 우리 반이 1등이다!', '아주 조금 모자랐다. 그래도 반 친구들이 달려와 안아 줬다.'], ['상대의 반대쪽으로 붙는다', 'luck', 50, '상대가 바깥으로 밀리며 내가 먼저 들어왔다!', '타이밍이 맞지 않았다. 2등으로 들어왔다.']]],
  ] },
  stage: { title: '녹향제 무대 직전', bg: 'auditorium', intro: '녹향제 양일가왕 무대 5분 전. 마이크를 쥔 손에 땀이 흥건하다. 앞 팀 무대가 끝나 간다.', rounds: [
    ['무대 뒤, 심장이 쿵쾅거린다.', [['심호흡하고 발성 연습', 'stamina', 40, '목이 풀렸다. 목소리가 맑게 나온다.', '긴장해서 목이 더 잠겼다.'], ['친구들과 파이팅을 외친다', 'social', 45, '친구들의 응원에 긴장이 웃음으로 바뀌었다.', '파이팅 소리가 너무 작았다.']]],
    ['첫 소절, 조명이 나를 비춘다.', [['관객과 눈을 맞춘다', 'social', 55, '관객들이 박수로 박자를 맞춰 줬다!', '눈이 마주친 선생님 때문에 가사가 하얘졌다.'], ['눈을 감고 노래에 집중한다', 'study', 45, '가사가 또렷하게 떠올랐다. 첫 소절 완벽!', '박자를 한 번 놓쳤다.']]],
    ['클라이맥스, 고음 구간이다.', [['원키로 질러 버린다', 'luck', 55, '고음이 터졌다! 강당이 함성으로 뒤집혔다!', '삑사리가 났다. 그런데 그게 레전드 영상이 됐다.'], ['한 키 낮춰 안정적으로', 'study', 50, '깔끔하게 마무리. 심사위원이 고개를 끄덕였다.', '너무 조심하다 힘이 빠졌다.']]],
  ] },
  suneung: { title: '수능 날 아침', bg: 'classroom', intro: '3학년 11월, 수능 날 아침. 교문 앞에서 후배들이 응원가를 부른다. 수험표를 꼭 쥐었다.', rounds: [
    ['시험장 가는 길, 버스가 늦는다.', [['뛰어서 간다', 'stamina', 45, '여유 있게 도착했다. 숨을 고를 시간도 있다.', '숨이 차서 1교시 초반이 흔들렸다.'], ['택시를 잡는다', 'luck', 45, '바로 택시가 왔다. 운이 좋다.', '택시가 안 잡혀 아슬아슬했다.']]],
    ['1교시 국어, 처음 보는 지문이 나왔다.', [['차분하게 문단을 정리한다', 'study', 60, '구조가 보이기 시작했다. 문제가 풀린다!', '시간이 부족했다. 마지막 지문을 찍었다.'], ['아는 문제부터 푼다', 'luck', 50, '순서를 바꾼 게 신의 한 수였다.', '왔다 갔다 하다 실수가 났다.']]],
    ['점심시간, 긴장이 몰려온다.', [['친구가 싸 준 도시락을 먹는다', 'social', 45, '친구의 응원 쪽지가 들어 있었다. 힘이 난다.', '긴장해서 밥이 안 넘어갔다.'], ['오답노트를 훑는다', 'study', 55, '훑어본 문제가 오후에 그대로 나왔다!', '머리가 더 복잡해졌다.']]],
  ] },
  election: { title: '전교회장 선거 연설', bg: 'auditorium', intro: '2학년 전교회장 선거 연설 날. 강당에 전교생이 모였다. 내 차례가 다가온다.', rounds: [
    ['단상에 올랐다. 원고가 손에서 떨린다.', [['원고를 내려놓고 말한다', 'social', 60, '진심이 전해졌다. 강당이 조용히 집중한다.', '말이 꼬였다. 웃음이 터졌다.'], ['원고대로 또박또박', 'study', 45, '깔끔한 연설. 공약이 귀에 쏙 들어온다.', '너무 딱딱했다. 졸던 학생이 있다.']]],
    ['공약 발표, 반응이 궁금하다.', [['급식 개선 공약을 외친다', 'rep', 50, '박수가 터졌다! 급식은 언제나 옳다.', '"그거 저번에도 했잖아" 하는 소리가 들렸다.'], ['재미있는 공약으로 웃긴다', 'luck', 45, '강당이 웃음바다! 인상은 확실히 남겼다.', '썰렁했다. 마이크가 삐 소리를 냈다.']]],
    ['마지막 한마디.', [['"양일고를 사랑합니다!"', 'social', 55, '전교생이 함께 외쳤다. 결과는… 당선!', '함성은 컸지만 표는 아쉽게 모자랐다.'], ['조용히 고개 숙여 인사', 'rep', 55, '진중함이 통했다. 결과는… 당선!', '조금 아쉬운 표 차이였다.']]],
  ] },
  pigeon: { title: '비둘기 대탈출', bg: 'ginkgo', extras: ['pigeons'], intro: '은행나무길에 비둘기가 스무 마리 넘게 내려앉았다. 저 끝에서 이재원이 얼어붙어 나를 본다.', rounds: [
    ['비둘기들이 길을 꽉 막았다.', [['팔을 휘두르며 돌진', 'stamina', 45, '비둘기들이 한꺼번에 날아올랐다!', '비둘기들이 꿈쩍도 안 한다.'], ['과자 부스러기로 유인', 'luck', 45, '비둘기들이 반대쪽으로 우르르 몰려갔다.', '오히려 더 많이 모였다.']]],
    ['재원이가 덜덜 떨고 있다.', [['재원이 손을 잡아 준다', 'social', 45, '재원이가 한 걸음 내디뎠다.', '재원이가 다시 얼어붙었다.'], ['우산으로 경호한다', 'luck', 50, '우산 경호 작전 성공!', '바람에 우산이 뒤집혔다.']]],
    ['마지막 한 마리가 재원이 앞에 섰다.', [['조용히 길을 비켜 달라고 말한다', 'social', 55, '비둘기가 고개를 갸웃하더니 날아갔다. 재원이가 박수를 쳤다!', '비둘기가 오히려 다가왔다.'], ['재원이와 같이 뛰어 지나간다', 'stamina', 50, '둘이 함께 은행나무길을 통과했다!', '재원이가 중간에 멈춰 버렸다.']]],
  ] },
  bread: { title: '마지막 소보로 쟁탈전', bg: 'store', intro: '4교시 종이 울렸다. 매점에 남은 소보로빵은 단 하나. 복도 끝에서 수십 명이 달려온다.', rounds: [
    ['종이 울리자마자.', [['계단을 두 칸씩 뛴다', 'stamina', 50, '선두 그룹에 들어갔다!', '계단에서 줄에 막혔다.'], ['지름길(별관 복도)로 간다', 'luck', 45, '아무도 없는 지름길이었다!', '별관 문이 잠겨 있었다.']]],
    ['매점 앞, 줄이 엉켰다.', [['줄을 정리하며 앞으로', 'rep', 45, '줄 정리 덕분에 매점 아주머니가 먼저 불러 주셨다.', '정리하다 내가 뒤로 밀렸다.'], ['친구에게 자리를 부탁한다', 'social', 50, '친구가 맡아 둔 자리로 쏙!', '친구도 줄 뒤쪽이었다.']]],
    ['마지막 소보로, 손이 동시에 닿았다.', [['반으로 나누자고 한다', 'social', 50, '반쪽씩 나눠 먹었다. 이게 더 맛있다.', '상대가 단호했다. 빵은 떠났다.'], ['가위바위보로 정한다', 'luck', 50, '보를 냈다. 이겼다!', '주먹을 냈다. 졌다.']]],
  ] },
};
function challengeStats(who) { return who && who.stats ? who.stats : rollCharacter().stats; }
function renderChallenge() {
  const C = UI.ch, d = loadDex(), recs = loadRecords();
  if (!C) {
    const sel = UI.chWho ?? (recs[0] ? recs[0].no : 'new');
    return `<section class="dex challenge">
      <header class="sheet-head row"><div><p class="eyebrow">명장면 챌린지</p><h2>그날 속으로</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
      <p class="lead-text">졸업생이 학교 명장면 하나에 다시 들어가요. 선택 세 번 중 두 번 이상 성공하면 정복! 능력치가 높을수록 유리해요.</p>
      <h3 class="sec-title">누구로 들어갈까?</h3>
      <div class="ch-who">${recs.slice(0, 8).map(r => `<button class="ch-person ${sel === r.no ? 'on' : ''}" data-act="ch-who" data-arg="${r.no}" aria-pressed="${sel === r.no}">${r.avatar ? avatarSVG(r.avatar, r.name) : ''}<b>${esc(r.name)}</b><small>${esc(endingOf(r.ending).name)}</small></button>`).join('')}
        <button class="ch-person ${sel === 'new' ? 'on' : ''}" data-act="ch-who" data-arg="new" aria-pressed="${sel === 'new'}"><span class="ch-new">?</span><b>새 학생</b><small>능력치 무작위</small></button></div>
      <h3 class="sec-title">어느 날로 갈까?</h3>
      <div class="ch-list">${Object.entries(CHALLENGES).map(([id, c]) => `<button class="ch-card" data-act="ch-start" data-arg="${id}"><span class="ch-mark">${(d.challenges || {})[id] ? '정복 ✓' : '도전'}</span><b>${c.title}</b><small>${esc(c.intro.slice(0, 38))}…</small></button>`).join('')}</div>
    </section>`;
  }
  const c = CHALLENGES[C.id], who = C.who, cast = [{ me: true, av: who.avatar || randomAvatar(who.gender || 'm') }];
  const scene = c.match && typeof matchSVG === 'function' && C.round === 0 ? matchSVG(c.match, c.title) : sceneSVG({ bg: c.bg, cast, extras: c.extras || [], label: c.title });
  const done = C.round >= c.rounds.length;
  const body = done
    ? `<p class="ch-result ${C.passed >= 2 ? 'win' : 'lose'}"><b>${C.passed >= 2 ? '명장면 정복!' : '아쉽게 실패'}</b><span>${C.passed} / ${c.rounds.length} 성공</span></p>
       <ol class="ch-log">${C.log.map(x => `<li class="${x.ok ? 'ok' : 'no'}">${esc(x.text)}</li>`).join('')}</ol>
       <div class="create-actions"><button class="btn primary" data-act="ch-start" data-arg="${C.id}">다시 도전</button><button class="btn" data-act="ch-back">다른 명장면</button></div>`
    : C.last ? `<p class="ch-feedback ${C.last.ok ? 'ok' : 'no'}">${C.last.ok ? '성공! ' : '실패… '}${esc(C.last.text)}</p><button class="btn primary wide" data-act="ch-next">${C.round + 1 < c.rounds.length ? '다음 장면 →' : '결과 보기 →'}</button>`
    : `<p class="sit-text">${esc(C.round === 0 ? c.intro + ' ' : '')}${esc(c.rounds[C.round][0])}</p>
       <div class="ev-choices">${c.rounds[C.round][1].map(([label, stat], i) => `<button class="choice" data-act="ch-pick" data-arg="${i}"><b>${esc(label)}</b><small>${STAT_LABEL[stat]} ${Math.round(who.stats[stat])}</small></button>`).join('')}</div>`;
  return `<section class="dex challenge playing">
    <header class="sheet-head row"><div><p class="eyebrow">그날 속으로 · ${esc(who.name)}</p><h2>${c.title}</h2></div><button class="link" data-act="ch-back">그만두기</button></header>
    <div class="ev-scene">${scene}</div>
    <ol class="ch-steps">${c.rounds.map((_, i) => `<li class="${i < C.round || (i === C.round && C.last) ? (C.log[i] && C.log[i].ok ? 'ok' : 'no') : i === C.round ? 'now' : ''}"></li>`).join('')}</ol>
    ${body}
  </section>`;
}
function chPick(i) {
  const C = UI.ch, c = CHALLENGES[C.id], [label, stat, diff, okT, noT] = c.rounds[C.round][1][i];
  const v = C.who.stats[stat] || 30, chance = Math.min(.9, Math.max(.12, (v - diff + 50) / 100));
  const ok = Math.random() < chance; if (ok) C.passed++;
  C.last = { ok, text: ok ? okT : noT }; C.log.push({ ok, text: `${label} → ${ok ? okT : noT}` });
  SFX.play(ok ? 'pop' : 'boing'); render();
  if (ok && typeof fxBurst === 'function') fxBurst(document.querySelector('.ch-feedback'), [{ label: STAT_LABEL[stat], d: 1, good: true }], []);
}
function chNext() {
  const C = UI.ch, c = CHALLENGES[C.id]; C.round++; C.last = null;
  if (C.round >= c.rounds.length && C.passed >= 2) { const d = loadDex(); d.challenges = d.challenges || {}; d.challenges[C.id] = (d.challenges[C.id] || 0) + 1; store.set(DEX_KEY, d); SFX.play('fanfare'); }
  render(); window.scrollTo(0, 0);
}

/* ───────── 동창회 대항전 (졸업생 클럽하우스) ───────── */
const REUNION_EVENTS = [['퀴즈 대결', 'study'], ['체육 대결', 'stamina'], ['장기자랑', 'social']];
function renderClubhouse() {
  const recs = loadRecords(), sel = UI.club3 || [], d = loadDex(), R = d.reunion || { wins: 0, plays: 0 }, res = UI.reunion;
  if (res) {
    return `<section class="dex clubhouse">
      <header class="sheet-head row"><div><p class="eyebrow">동창회 대항전 · ${res.rival}</p><h2>${res.win ? '우리 기수 승리!' : '아쉬운 패배'}</h2></div><button class="link" data-act="club-back">← 클럽하우스</button></header>
      <ul class="reunion-rounds">${res.rounds.map(r => `<li class="${r.win ? 'win' : 'lose'}"><b>${r.name}</b><span>우리 ${r.us} : ${r.them} 상대</span><em>${r.win ? '승' : '패'}</em><small>MVP ${esc(r.mvp)}</small></li>`).join('')}</ul>
      <p class="fine">통산 ${R.wins}승 ${R.plays - R.wins}패 · 이길수록 더 강한 선배 기수가 도전해 와요.</p>
      <div class="create-actions"><button class="btn primary" data-act="club-go">같은 팀으로 다시</button><button class="btn" data-act="club-back">팀 다시 짜기</button></div>
    </section>`;
  }
  return `<section class="dex clubhouse">
    <header class="sheet-head row"><div><p class="eyebrow">졸업생 클럽하우스</p><h2>동창회 대항전</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <p class="lead-text">내가 키운 졸업생 3명을 골라 선배 기수와 퀴즈 · 체육 · 장기자랑으로 겨뤄요. 통산 ${R.wins}승 ${R.plays - R.wins}패.</p>
    ${recs.length < 1 ? '<div class="paper"><p>아직 졸업생이 없어요. 한 명이라도 졸업시키면 동창회를 열 수 있어요.</p></div>' : `
    <div class="ch-who club">${recs.slice(0, 30).map(r => { const on = sel.includes(r.no); return `<button class="ch-person ${on ? 'on' : ''}" data-act="club-pick" data-arg="${r.no}" aria-pressed="${on}">${r.avatar ? avatarSVG(r.avatar, r.name) : ''}<b>${esc(r.name)}</b><small>공 ${r.stats.study} · 체 ${r.stats.stamina} · 사 ${r.stats.social}</small></button>`; }).join('')}</div>
    <button class="btn primary wide" data-act="club-go" ${sel.length ? '' : 'disabled'}>${sel.length ? `${sel.length}명으로 대항전 시작` : '졸업생을 1~3명 골라 줘'}</button>`}
  </section>`;
}
function playReunion() {
  const recs = loadRecords(), team = (UI.club3 || []).map(no => recs.find(r => r.no === no)).filter(Boolean);
  if (!team.length) return;
  const d = loadDex(), R = d.reunion = d.reunion || { wins: 0, plays: 0 };
  const level = 45 + Math.min(40, R.wins * 4), rival = `제${50 + R.wins}회 선배 기수`;
  const rounds = REUNION_EVENTS.map(([name, stat]) => {
    const scores = team.map(r => ({ r, s: r.stats[stat] + (stat === 'social' ? r.stats.luck * .3 : 0) + Math.random() * 30 }));
    const us = Math.round(scores.reduce((a, x) => a + x.s, 0) / team.length * (team.length === 3 ? 1.08 : team.length === 2 ? 1 : .92));
    const them = Math.round(level + Math.random() * 30 + (stat === 'social' ? 8 : 0));
    const mvp = scores.sort((a, b) => b.s - a.s)[0].r.name;
    return { name, us, them, win: us >= them, mvp };
  });
  const win = rounds.filter(r => r.win).length >= 2;
  R.plays++; if (win) R.wins++; store.set(DEX_KEY, d);
  UI.reunion = { rival, rounds, win }; SFX.play(win ? 'fanfare' : 'boing'); render(); window.scrollTo(0, 0);
}

/* ───────── 화면 · 버튼 연결 ───────── */
const META_SCREENS = { challenge: () => renderChallenge(), clubhouse: () => renderClubhouse(), hall: () => renderHall() };
function metaAction(act, arg) {
  switch (act) {
    case 'challenge': UI.screen = 'challenge'; UI.ch = null; render(); window.scrollTo(0, 0); return true;
    case 'ch-who': UI.chWho = arg === 'new' ? 'new' : +arg; render(); return true;
    case 'ch-start': { const sel = UI.chWho ?? (loadRecords()[0] ? loadRecords()[0].no : 'new');
      const rec = sel === 'new' ? null : loadRecords().find(r => r.no === sel);
      const who = rec ? { name: rec.name, avatar: rec.avatar, gender: rec.gender, stats: rec.stats } : (() => { const c = rollCharacter(); return { name: '새 학생', avatar: randomAvatar(c.gender), gender: c.gender, stats: c.stats }; })();
      UI.ch = { id: arg, who, round: 0, passed: 0, log: [], last: null }; render(); window.scrollTo(0, 0); return true; }
    case 'ch-pick': chPick(+arg); return true;
    case 'ch-next': chNext(); return true;
    case 'ch-back': UI.ch = null; render(); return true;
    case 'clubhouse': UI.screen = 'clubhouse'; UI.reunion = null; render(); window.scrollTo(0, 0); return true;
    case 'club-pick': { const s = UI.club3 = UI.club3 || [], n = +arg, i = s.indexOf(n); if (i >= 0) s.splice(i, 1); else if (s.length < 3) s.push(n); else toast('팀은 3명까지야. 한 명을 빼고 골라 줘.'); render(); return true; }
    case 'club-go': playReunion(); return true;
    case 'club-back': UI.reunion = null; render(); return true;
    case 'hall': UI.screen = 'hall'; render(); window.scrollTo(0, 0); return true;
  }
  return false;
}
