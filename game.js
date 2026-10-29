// 게임 진행: 주인공 생성, 날짜·행동·능력치, 이벤트 흐름, 화면 렌더링.
const SAVE_KEY = 'yangil.save.v8';
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } },
};

const STATS = ['study', 'stamina', 'social', 'luck', 'rep'];
const STAT_LABEL = { study: '공부', stamina: '체력', social: '사교성', luck: '운', rep: '평판' };
const SLOTS = ['점심시간', '방과후'];
const AP_MAX = 2;
// 하루 행동이 2번이라, 행동 하나의 효과를 키운다
const ACT_BOOST = 1.8;
// 하루에 저절로 일어나는 사건은 최대 2개 (탐험으로 찾아간 장소 사건은 제외)
const DAY_POPS = 2;
const semDays = () => CALENDAR[S.sem].length;  // 1학기 9일(축제 포함), 2학기 8일
const WEEKDAY = '일월화수목금토';

const TRAITS = {
  cram:    { name: '벼락치기의 신', good: '시험 직전 공부 효율 2배', bad: '평소 공부 효율 -20%' },
  vitamin: { name: '인간 비타민', good: '친밀도 상승 +50%', bad: '혼자 하는 자습은 피로 +4' },
  sleepy:  { name: '잠만보', good: '휴식·수면 회복 +60%', bad: '아침 행동 효율 -40%' },
  lucky:   { name: '행운의 주인공', good: '희귀 이벤트 확률 2배', bad: '방심해서 공부 효율 -10%' },
  chaos:   { name: '사건의 중심', good: '이벤트가 더 자주 터진다', bad: '병맛 사건 확률 2배' },
  shy:     { name: '수줍은 천재', good: '공부 효율 +25%', bad: '친밀도 상승 -30%' },
  hot:     { name: '열정 과다', good: '운동·동아리 효율 +30%', bad: '모든 행동 피로 +3' },
  glass:   { name: '유리멘탈', good: '컨디션 좋으면 시험 +6', bad: '피곤하면 시험 -10' },
  famous:  { name: '소문의 주인공', good: '평판 상승 1.5배', bad: '평판 하락도 1.5배' },
  iron:    { name: '강철 위장', good: '급식·빵 이벤트 회복 2배', bad: '급식 생각에 공부 효율 -10%' },
};
const TRAIT_CONFLICT = [['shy', 'vitamin'], ['cram', 'shy']];

const TALENTS = {
  voice:     { name: '숨은 가창력', hint: '노래할 기회가 오면…' },
  sprint:    { name: '번개 다리', hint: '전력으로 달려 보면…' },
  detective: { name: '탐정의 눈', hint: '수수께끼를 마주하면…' },
  cook:      { name: '절대 미각', hint: '이상한 음식을 먹어 보면…' },
  talker:    { name: '타고난 말빨', hint: '사람들 앞에 서 보면…' },
};

const SURNAMES = '김이박최정강조윤장임한오서신권황안송류홍'.split('');
// 성별은 무작위 이름 후보에만 쓰고 능력치에는 영향을 주지 않는다
const GIVEN = {
  m: ['서준', '도윤', '예준', '시우', '주원', '건우', '유준', '민재', '현우', '지호', '은호', '태오', '하준', '이안'],
  f: ['하은', '지우', '서연', '하린', '지아', '수아', '윤서', '채원', '다은', '소율', '나윤', '가은', '아린', '지유'],
};
const GENDER_LABEL = { m: '남학생', f: '여학생' };

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
// 확률적 반올림: 0.3이면 30% 확률로 1 (높은 능력치에서도 아주 가끔은 오른다)
const sround = x => Math.floor(x) + (Math.random() < x - Math.floor(x) ? 1 : 0);
const esc = str => String(str).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

let S = null;                       // 진행 중인 게임 상태 (저장 대상)
// 설정: 미니게임 자동 넘기기 · 빠른 진행(이벤트 결과 확인 창 생략, 모의고사 자동 응시)
const SETTINGS = Object.assign({ miniAuto: false, fast: false }, store.get('yangil.settings', {}));
function saveSettings() { store.set('yangil.settings', SETTINGS); }
const won = n => `${(n || 0).toLocaleString()}원`;

// 효과음: 파일 없이 Web Audio로 만든다. 버튼을 누른 뒤에만 소리가 난다.
const SFX = {
  on: store.get('yangil.sfx', true), ctx: null,
  tone(freq, dur, type, when, vol, to) {
    const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const T = (...a) => this.tone(...a);
      ({
        bell: () => { T(659, 0.6, 'sine', 0, 0.12); T(523, 0.8, 'sine', 0.35, 0.12); },
        click: () => T(880, 0.05, 'square', 0, 0.03),
        pop: () => { T(600, 0.08, 'sine', 0, 0.1); T(900, 0.1, 'sine', 0.07, 0.08); },
        boing: () => T(180, 0.45, 'triangle', 0, 0.15, 620),
        rare: () => [523, 659, 784, 1047].forEach((f, i) => T(f, 0.3, 'triangle', i * 0.08, 0.09)),
        stamp: () => { T(120, 0.3, 'triangle', 0, 0.3, 60); T(80, 0.35, 'sine', 0.02, 0.25); },
        fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, i === 5 ? 0.6 : 0.16, 'square', i * 0.13, 0.05)),
      })[name]?.();
    } catch (e) { /* 소리를 낼 수 없는 환경 */ }
  },
  toggle() { this.on = !this.on; store.set('yangil.sfx', this.on); if (this.on) this.play('pop'); },
};
const UI = { screen: 'menu', pick: null, draft: null, rec: null };

/* ───────── 이벤트용 헬퍼 ───────── */
const G = {
  notes: [],
  has: t => S.traits.includes(t),
  rand, chance: p => Math.random() < p,
  nearExam: () => [3, 4, 7, 8].includes(S.day),
  // 이벤트의 직접 보상도 능력치가 높을수록 덜 오른다
  add(stat, n, raw) {
    if (stat === 'rep' && G.has('famous')) n = Math.round(n * 1.5);
    if (n > 0 && !raw) n = sround(n * Math.max(0.15, 1.05 - S.stats[stat] / 95));
    S.stats[stat] = clamp(S.stats[stat] + n);
  },
  grow(stat, base) {
    let mult = S._eff || 1;
    if (stat === 'study') mult *= studyMult();
    if (G.has('hot') && (S._act === 'exercise' || S._act === 'club')) mult *= 1.3;
    const dim = Math.max(0.08, 1.05 - S.stats[stat] / 90);
    const gain = sround(base * mult * dim);
    G.add(stat, gain, true);
    return gain;
  },
  fat(n) { S.fatigue = clamp(S.fatigue + n); },
  aff(id, n) {
    if (n > 0 && id !== 'teacher') { if (G.has('vitamin')) n *= 1.5; if (G.has('shy')) n *= 0.7; }
    S.aff[id] = clamp(S.aff[id] + Math.round(n));
  },
  meet(id) { if (!S.met[id]) { S.met[id] = true; G.notes.push(`새로운 친구: ${CHARACTERS[id].name}`); } },
  check(stat, target) { return Math.random() < clamp((S.stats[stat] - target) / 40 + 0.5, 0.05, 0.95); },
  flag(k, n = 1) { S.flags[k] = (S.flags[k] || 0) + n; },
  set(k, v) { S.flags[k] = v; },
  nick(name) { if (!S.nicks.includes(name)) { S.nicks.push(name); G.notes.push(`별명 획득: "${name}"`); } },
  absurd() { S.absurd++; },
  talent(id) {
    if (S.talent !== id) return false;
    if (!S.talentRevealed) { S.talentRevealed = true; G.notes.push(`숨겨진 재능 개화: ${TALENTS[id].name}!`); G.achieve('talent'); }
    return true;
  },
  achieve(id) {
    if (S.ach.includes(id)) return;
    S.ach.push(id);
    G.notes.push(`업적 달성: ${ACHIEVEMENTS[id].name}`);
    dexMark('ach', id);
  },
};

// 함수 실행 전후의 능력치·피로·친밀도 차이를 기록한다
function withDiff(fn) {
  const before = { stats: { ...S.stats }, fatigue: S.fatigue, aff: { ...S.aff } };
  G.notes = [];
  const text = fn();
  const diffs = [];
  STATS.forEach(k => { const d = Math.round(S.stats[k]) - Math.round(before.stats[k]); if (d) diffs.push({ label: STAT_LABEL[k], d, good: d > 0 }); });
  const fd = S.fatigue - before.fatigue;
  if (fd) diffs.push({ label: '피로', d: fd, good: fd < 0 });
  Object.keys(S.aff).forEach(id => { const d = S.aff[id] - before.aff[id]; if (d && (S.met[id] || id === 'teacher')) diffs.push({ label: `${CHARACTERS[id].name} ♥`, d, good: d > 0 }); });
  return { text, diffs, notes: G.notes.slice() };
}

/* ───────── 주인공 생성 ───────── */
// rng를 넘기면 같은 씨앗에서 같은 주인공이 나온다 (오늘의 주인공)
function rollCharacter(name, gender, rng = Math.random) {
  const R = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const P = arr => arr[Math.floor(rng() * arr.length)];
  gender = gender || P(['m', 'f']);
  const stats = {};
  STATS.forEach(k => stats[k] = R(15, 50));
  stats[P(STATS)] += 15;
  stats[P(STATS)] -= 8;
  const traitIds = Object.keys(TRAITS);
  const traits = [P(traitIds)];
  if (rng() < 0.55) {
    const t2 = P(traitIds.filter(t => t !== traits[0] && !TRAIT_CONFLICT.some(p => p.includes(t) && p.includes(traits[0]))));
    traits.push(t2);
  }
  if (traits.includes('lucky')) stats.luck += 10;
  STATS.forEach(k => stats[k] = clamp(stats[k], 5, 75));
  return { name: name || P(SURNAMES) + P(GIVEN[gender]), gender, stats, traits, talent: P(Object.keys(TALENTS)), avatar: randomAvatar(gender, rng) };
}
function seededRng(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function todayKey() { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; }

function newGame(d) {
  const aff = {}; Object.keys(CHARACTERS).forEach(id => aff[id] = 0);
  aff.teacher = 15;
  const mode = d.mode === 'classic' ? 'classic' : 'real';
  if (mode === 'classic') aff.chaerin = 10;
  S = {
    v: 1, mode, avatar: d.avatar || randomAvatar(d.gender), name: d.name, gender: d.gender, stats: { ...d.stats }, traits: d.traits, talent: d.talent, talentRevealed: false,
    fatigue: 15, year: 1, sem: 1, day: 1, dayNo: 1, ap: AP_MAX, slot: 0,
    met: mode === 'classic' ? { chaerin: true, teacher: true } : { teacher: true }, aff, club: null, clubPts: 0,
    exams: [], flags: {}, seen: {}, recent: [], rare: [], absurd: 0, nicks: [], ach: [],
    counts: { study: 0, talk: 0, rest: 0, exercise: 0, explore: 0, club: 0, auto: 0 }, visits: {}, studied: [],
    autoClub: null, autoPts: 0, council: null, councilPts: 0, money: 3000, memories: [], cameo: {}, roster: pickRoster(mode), titles: ['newbie'], title: 'newbie', perf: {}, written: {}, semGrades: [], setuk: [], route: null, college: null, daily: d.daily || null, vac: null,
    love: {}, crush: null, partner: null, partnerSince: 0, loveNo: {}, waitConfess: 0, loveDay: 0, wrongNote: [],
    favors: {}, pairs: {}, likedPlace: {}, loveTension: 0, loveTouch: 0, coupleItems: [],
    electives: {}, track: null, mastery: {}, dayEvent: false, dayTalk: false,
    log: [], queue: [], cur: null, result: null, phase: 'day', semStart: null, created: Date.now(),
  };
  syncFriends(S);
  S.semStart = snapshot();
  beginSemester();
}

// 매 학기 시작마다 수강신청을 먼저 한다 (교육과정 편제표의 선택군)
function beginSemester() {
  if (!S.electives[semKey(S)]) {
    S.phase = 'course'; UI.screen = 'course'; UI.course = null;
    save(); render(); return;
  }
  S.phase = 'day';
  subjectsOf(S).forEach(mastery);
  startDay();
  UI.screen = 'game';
  render();
  if (S.year === 1 && S.sem === 1 && S.day === 1 && S.roster) toast(`${S.mode === 'classic' ? '이번 생에 만날 학교 친구들' : '이번 생의 친구들'}: ${S.roster.map(id => CAMEOS[id].name).join(', ')}`);
}

function courseState() {
  if (!UI.course) UI.course = { track: S.track, picks: {} };
  return UI.course;
}
function courseReady() {
  const c = courseState();
  if (S.year === 2 && S.sem === 1 && !c.track) return false;
  return courseGroups(semKey(S), c.track, takenBefore(S)).every((g, gi) => (c.picks[gi] || []).length === g.pick);
}

function confirmCourse() {
  if (!courseReady()) return;
  const c = courseState();
  if (S.year === 2 && S.sem === 1) S.track = c.track;
  const groups = courseGroups(semKey(S), S.track, takenBefore(S));
  const names = Object.values(c.picks).flat();
  S.electives[semKey(S)] = names;
  const mates = new Set();
  groups.flatMap(g => g.list).filter(x => names.includes(x.name)).forEach(x => {
    if (x.graded === false && x.perk) G.grow(x.perk, 3);
    const f = mateOf(x.friend);
    if (!f) return;
    S.met[f] = true;
    G.aff(f, 4);
    mates.add(CHARACTERS[f].name);
  });
  beginSemester();
  toast('수강신청 완료!' + (mates.size ? ` 같은 수업: ${[...mates].join(', ')}` : ''));
}

// 과목 숙련도. 공통과목은 계열(국어·수학…)로 이어지고, 선택과목은 같은 계열 실력에서 시작한다.
function mastery(sub) {
  if (S.mastery[sub.key] == null) S.mastery[sub.key] = Math.round(S.mastery[sub.area] ?? S.stats.study * 0.6);
  return S.mastery[sub.key];
}
function studyMult() {
  let m = 1;
  if (G.has('cram')) m *= G.nearExam() ? 2 : 0.8;
  if (G.has('shy')) m *= 1.25;
  if (G.has('lucky')) m *= 0.9;
  if (G.has('iron')) m *= 0.9;
  return m;
}
function masteryUp(sub, base) {
  const m = mastery(sub);
  const up = sround(base * studyMult() * (S._eff || 1) * Math.max(0.1, 1.1 - m / 95));
  S.mastery[sub.key] = clamp(m + up);
  return up;
}

function snapshot() { return { stats: { ...S.stats }, aff: { ...S.aff }, nicks: S.nicks.length, ach: S.ach.length }; }
function save() { if (S) store.set(SAVE_KEY, S); }

/* ───────── 날짜 ───────── */
function dateOf(year, sem, day) {
  const y = 2026 + year - 1;
  const [m, dd] = CALENDAR[sem][day - 1];
  const d = new Date(y, m - 1, dd);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
function dateLabel(year = S.year, sem = S.sem, day = S.day) {
  const d = dateOf(year, sem, day);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
}

const STORY_NAMES = { council_recruit: '학생회 모집', perf: '수행평가', auto_club_fair: '자율동아리 모집', college_apply: '수시 원서', college_result: '합격자 발표', entrance: '입학식', club_fair: '동아리 박람회', new_grade: '반 배정', career: '진로 상담', mock: '모의고사', sports_day: '체육한마당', festival: '녹향제', field_trip: '현장체험학습', school_trip: '숙박형체험학습', club_contest: '동아리 발표회', science_day: '과학의 날', yleague: 'Y리그 결승', suneung: '대학수학능력시험', album: '졸업 앨범 촬영' };
// 실제 2026학년도 학사일정에 맞춘 학기별 행사
function specialsFor(year, sem, day) {
  const l = [];
  if (day === 1) {
    if (year === 1 && sem === 1) l.push('entrance');
    if (year === 1 && sem === 2) l.push('club_fair');
    if (year === 2 && sem === 1) l.push('new_grade');
    if (year === 3 && sem === 1) l.push('career');
    if (year === 3 && sem === 2) l.push('college_apply');
    if (year <= 2 && sem === 1 && !S.council && !S.flags['councilAsk' + year]) l.push('council_recruit');
  }
  if ((sem === 2 && day === 1) || (sem === 1 && day === 4)) l.push('mock');
  if (sem === 1 && day === 2) l.push('sports_day');
  if (year === 1 && sem === 1 && day === 4) l.push('auto_club_fair');
  if (year >= 2 && sem === 1 && day === 4) l.push('science_day');
  if (sem === 2 && day === 2 && year < 3) l.push('yleague');
  if (year === 2 && sem === 2 && day === 2 && electionEligible(S)) l.push('election');
  if (sem === 1 && day === 5) l.push(year === 2 ? 'school_trip' : 'exp_day');
  if (sem === 2 && day === 4) { l.push(year === 3 ? 'suneung' : 'cheer'); if (year < 3) l.push(year === 1 ? 'field_trip' : 'field_trip2'); }
  if (sem === 2 && day === 5) { if (year === 2 && S.club) l.push('club_contest'); if (year === 3) l.push('album'); }
  // 수행평가는 학기마다 두 번. 하루를 통째로 쓰는 행사와 겹치면 건너뛴다
  if ((sem === 1 ? [4, 5] : [2, 4]).includes(day) && l.reduce((a, id) => a + storyCost(id), 0) < 2) l.push('perf');
  if ((sem === 1 ? [3, 6] : [3, 5]).includes(day)) l.push('exam');
  if (sem === 1 && day === 6) l.push('festival');
  if (year === 3 && sem === 2 && day === 5) l.push('college_result');
  return l;
}
// 하루 행동이 2번뿐이라 학교 행사는 체육대회·축제만 행동력 1을 쓴다
function storyCost(id) { return id === 'sports_day' || id === 'festival' ? 1 : 0; }
// 친구들과 충분히 친하면 2학년 2학기에 전교회장 출마 권유를 받는다
// 친구들과의 우정 ★ 하나는 친밀도 4만큼 친다. 친밀도는 가장 친한 네 명까지 센다.
function cameoStars(s) { return CAMEO_IDS.reduce((a, id) => a + ((s.cameo || {})[id] || 0), 0); }
function topAff(s, n = 4) { return FRIEND_IDS.filter(id => s.met[id]).map(id => s.aff[id]).sort((a, b) => b - a).slice(0, n).reduce((a, b) => a + b, 0); }
function electionEligible(s) { const sum = topAff(s) + cameoStars(s) * 4; return sum >= 370 || FRIEND_IDS.filter(id => s.aff[id] >= 80).length >= 3 || (s.council && (s.councilPts || 0) >= 8 && sum >= 270); }
function specialLabel(id, day) { return id === 'exam' ? examName(day) : STORY_NAMES[id]; }
function examName(day = S.day) { return day === 3 ? '1차 정기시험' : '2차 정기시험'; }

function nextSpecial() {
  for (let d = S.day + 1; d <= semDays(); d++) {
    const l = specialsFor(S.year, S.sem, d);
    const main = l.filter(id => id !== 'perf');
    if (l.length) return { label: specialLabel(main.includes('exam') ? 'exam' : (main[0] || l[0]), d), dday: d - S.day };
  }
  return null;
}

/* ───────── 하루 진행 ───────── */
function startDay() {
  S.ap = AP_MAX; S.slot = 0; S.result = null; UI.pick = null; S.dayPops = 0;
  S.money = (S.money || 0) + ALLOWANCE; S.dayEvent = false; S.dayTalk = false; S.dayLove = false; S.dayCameo = false;
  const order = id => id === 'college_result' || id === 'festival' ? 2 : id === 'exam' ? 1 : 0;
  S.queue = specialsFor(S.year, S.sem, S.day).slice().sort((a, b) => order(a) - order(b));
  // 학교 친구들(실제 친구 출연)은 아침에 먼저 찾아온다. 시험 날은 쉰다.
  if (!S.queue.includes('exam') && Math.random() < 0.75) { const cam = pickCameoEvent(); if (cam) { S.dayCameo = true; S.dayPops++; S.queue.push(cam); } }
  // 부탁·합동 에피소드도 아침에 따로 기회가 있다
  else if (!S.queue.includes('exam') && Math.random() < 0.4) { const d = weighted(['favor_ask', 'duo'].filter(id => available(EVENTS[id])).map(id => ({ id, w: 1 }))); if (d) { S.dayPops++; S.queue.push(d); } }
  SFX.play('bell');
  nextEvent();
  save();
}

function endDay() {
  if (S.cur) return;
  const left = S.ap;
  // 2학기 1차 정기시험 다음 날(10/28)은 실제 학사일정대로 학교장재량휴업일
  const holiday = S.day === 3 ? (S.sem === 1 ? '5/4 재량휴업일' : '10/28 개교기념 재량휴업일') : S.year === 3 && S.sem === 2 && S.day === 4 ? '11/20 수능 다음 날 재량휴업일' : null;
  const sleep = Math.round(18 * (G.has('sleepy') ? 1.6 : 1)) + left * 5 + (holiday ? 30 : 0);
  G.fat(-sleep);
  romanceEndDay();
  if (S.partner && S.dayNo % 2 && !S.loveSecret) S.love[S.partner] = clamp(S.love[S.partner] - 1);
  S.day++; S.dayNo++;
  if (S.day > semDays()) {
    S.phase = 'report'; UI.screen = 'report';
    save(); render(); return;
  }
  startDay();
  const today = specialsFor(S.year, S.sem, S.day);
  toast((holiday ? `${holiday}, 하루 푹 쉬었다! 피로 -${sleep}` : `밤사이 피로 -${sleep}`) + (today.length ? ` · 오늘은 ${today.map(id => specialLabel(id, S.day)).join(', ')}!` : ''));
  render();
}

function nextSemester() {
  if (S.year === 3 && S.sem === 2) { S.phase = 'ceremony'; UI.screen = 'ceremony'; UI.cer = 0; save(); render(); SFX.play('bell'); return; }
  if (S.phase === 'report') { S.phase = 'vacation'; S.vac = null; UI.vac = []; UI.screen = 'vacation'; save(); render(); return; }
  if (S.sem === 1) S.sem = 2; else { S.sem = 1; S.year++; }
  S.day = 1; S.phase = 'day';
  S.semStart = snapshot();
  beginSemester();
}

const ACTIONS = {
  study:    { label: '자습하기', mark: '공', hint: '과목 선택 · 공부↑ · 피로↑' },
  talk:     { label: '친구와 대화', mark: '話', hint: '친밀도 · 사교성↑' },
  rest:     { label: '휴식하기', mark: '쉼', hint: '피로 회복' },
  exercise: { label: '운동하기', mark: '體', hint: '체력↑ · 피로↑' },
  explore:  { label: '학교 탐험', mark: '探', hint: '장소 이벤트 · 비밀' },
  club:     { label: '동아리 활동', mark: '部', hint: '전문 능력 · 발표회 준비' },
  auto:     { label: '자율동아리', mark: '自', hint: '이과 탐구 · 세특 · 진로' },
  council:  { label: '학생회 활동', mark: '會', hint: '행사 운영 · 평판↑ · 선거에 유리' },
  hangout:  { label: '약속 잡기', mark: '約', hint: '친구와 방과후·주말 약속 · 친밀도↑↑' },
};

// 행동을 고르면 먼저 미니게임을 하고, 결과 배수로 활동 효과가 정해진다
function doAction(type, arg) {
  if (S.ap <= 0 || S.cur || MINI.st) return;
  if (type === 'study' && arg === undefined) { UI.pick = 'study'; render(); return; }
  if (type === 'talk' && !arg) { UI.pick = 'talk'; render(); return; }
  if (type === 'explore' && !arg) { UI.pick = 'explore'; render(); return; }
  if (type === 'hangout' && !(arg || '').includes('|')) { UI.pick = 'hangout'; UI.hangWho = arg || null; render(); return; }
  UI.pick = null;
  const go = (mult = 1, note = '', info = {}) => performAction(type, arg, mult, note, info);
  if (SETTINGS.miniAuto && ['study', 'exercise', 'club', 'auto', 'council', 'talk'].includes(type) && arg !== 'wrong') return go(0.8, '자동 넘김');
  if (type === 'study') {
    const subs = subjectsOf(S);
    let qs;
    if (arg === 'wrong') qs = S.wrongNote.splice(0, 3).map(q => Object.assign({}, q, { opts: q.opts.slice().sort(() => Math.random() - 0.5) }));
    else qs = [0, 1, 2].map(() => { const sub = arg === 'all' ? pick(subs) : subs[+arg]; return makeQuestion(sub.area, S.year, sub.name); });
    render();
    return openMini('quiz', { title: arg === 'wrong' ? '오답노트' : '문제 풀기', qs }, go);
  }
  if (type === 'exercise') { render(); return openMini('timing', { title: '타이밍', stamina: S.stats.stamina }, go); }
  if (type === 'club') { render(); return openMini('memory', { title: '손발 맞추기', len: 3 + S.year }, go); }
  if (type === 'auto') { render(); return openMini('order', { title: '실험 순서 맞추기', club: S.autoClub }, go); }
  if (type === 'council') { render(); return openMini('sort', { title: '건의함 분류', n: 3 + S.year }, go); }
  if (type === 'talk') { UI.line = charLine(arg, S.aff[arg]); render(); return openMini('talk', { title: '반응 고르기', who: arg, line: UI.line }, go); }
  go();
}

function performAction(type, arg, mult = 1, note = '', info = {}) {
  S._act = type;
  S._eff = (S.fatigue >= 75 ? 0.6 : 1) * (S.slot === 0 && G.has('sleepy') ? 0.6 : 1) * mult * ACT_BOOST;
  const extra = G.has('hot') ? 3 : 0;
  const slotName = SLOTS[S.slot];
  let title = ACTIONS[type].label;
  let triggered = null;

  const r = withDiff(() => {
    S.counts[type] = (S.counts[type] || 0) + 1;
    switch (type) {
      case 'study': {
        const subs = subjectsOf(S);
        G.fat(13 + extra + (G.has('vitamin') ? 4 : 0));
        S.studied.push(S.dayNo);
        // 틀린 문제는 오답노트로 (최대 15문제)
        (info.log || []).forEach(q => { if (!S.wrongNote.some(w => w.q === q.q)) S.wrongNote.push(q); });
        S.wrongNote = S.wrongNote.slice(-15);
        if ((info.qs || []).length && !(info.log || []).length) G.flag('perfectQuiz');
        if (arg === 'wrong') {
          const fixed = (info.qs || []).filter(q => !(info.log || []).some(w => w.q === q.q));
          G.flag('wrongFixed', fixed.length);
          fixed.forEach(q => { const sub = subs.find(x => x.area === q.area); if (sub) masteryUp(sub, 7); });
          G.grow('study', 3);
          title = '자습 · 오답노트 복습';
          return `오답노트 ${(info.qs || []).length}문제 중 ${fixed.length}문제를 이번엔 맞혔다. 틀렸던 문제를 맞히니 실력이 확실히 붙는다.`;
        }
        if (arg === 'all') {
          G.grow('study', 2.6); subs.forEach(sub => masteryUp(sub, 4));
          title = '자습 · 골고루 복습';
          return `${subs.length}과목을 조금씩 훑었다. 넓고 얕게, 그래도 남는 게 있다.`;
        }
        const sub = subs[+arg];
        const before = mastery(sub);
        G.grow('study', 2.6);
        masteryUp(sub, 13);
        if (sub.perk) G.grow(sub.perk, 1);
        title = `자습 · ${sub.name}`;
        const gain = ` (${sub.name} 숙련도 ${before} → ${S.mastery[sub.key]})`;
        const sf = mateOf(sub.friend);
        if (sf && S.met[sf] && Math.random() < 0.4) {
          G.aff(sf, 4);
          return `같이 수강하는 ${CHARACTERS[sf].name}${josa(CHARACTERS[sf].name, '이', '가')} 옆자리에 앉아 같이 공부했다.${gain}`;
        }
        if (S.fatigue >= 75) return `${sub.name} 교과서의 글자가 춤을 춘다. 피곤해서 머리에 잘 안 들어온다.${gain}`;
        return pick([`${sub.name} 문제집 두 단원을 끝냈다.`, `${sub.name} 핵심 개념을 노트 한 장에 정리했다.`, `${sub.name} 오답 노트를 정리했다. 틀린 문제가 친구처럼 느껴진다.`, `${sub.name} 문제 하나를 40분 붙잡고 있다가 결국 풀었다!`]) + gain;
      }
      case 'talk': {
        const ch = CHARACTERS[arg];
        title = `${ch.name}${josa(ch.name, '과', '와')} 대화`;
        const line = UI.line || charLine(arg, S.aff[arg]);
        if (arg === 'teacher') { G.aff('teacher', rand(5, 8) * mult); G.grow('study', 1); G.fat(4 + extra); return `상담을 요청했다. "${line}"`; }
        G.aff(arg, rand(6, 9) * mult * ACT_BOOST); G.grow('social', 2); G.fat(5 + extra);
        if (S.partner === arg || S.crush === arg) { S.love[arg] = clamp(S.love[arg] + (info.matched ? 8 : 3)); G.notes.push(`${ch.name} 설렘 ${S.love[arg]}`); loveTouch(arg, 10); }
        if (ch.perk === 'study') G.grow('study', 1);
        if (ch.perk === 'stamina') G.grow('stamina', 1);
        if (ch.perk === 'luck') G.add('luck', 1);
        if (ch.perk === 'rep') G.add('rep', 1);
        if (ch.perk === 'chaos' && Math.random() < 0.35) triggered = 'chaos';
        return `"${line}"`;
      }
      case 'rest': {
        G.fat(-Math.round(25 * (G.has('sleepy') ? 1.6 : 1)));
        return pick(['책상에 엎드려 눈을 감았다. 꿈에서도 수업을 들었다.', '점심 먹고 운동장 벤치에서 낮잠을 잤다. 꿀맛이다.', '일찍 집에 가서 뒹굴었다. 이것도 자기 관리다.']);
      }
      case 'exercise': {
        G.grow('stamina', 4); G.fat(Math.round((12 + extra) * (1.2 - S.stats.stamina / 200)));
        const runner = FRIEND_IDS.find(id => S.met[id] && ['taepung', 'eunseong', 'isan', 'soyul', 'jio'].includes(id));
        if (runner && Math.random() < 0.35) { G.aff(runner, 5); return `${CHARACTERS[runner].name}${josa(CHARACTERS[runner].name, '이', '가')} 나타나 "같이 하자!" 하며 따라왔다. 결국 둘 다 땀범벅이 됐다.`; }
        return pick(['운동장을 다섯 바퀴 돌았다. 다리가 후들거린다.', '체육관에서 줄넘기 500개. 내일 종아리가 걱정된다.', '철봉에 매달려 버텼다. 팔이 내 것이 아닌 것 같다.']);
      }
      case 'hangout': {
        const [id, place] = arg.split('|');
        title = `${DATE_PLACES[place] ? '데이트' : '약속'} · ${(PLACES[place] || DATE_PLACES[place]).name}`;
        return hangout(id, place);
      }
      case 'explore': {
        S.visits[arg] = (S.visits[arg] || 0) + 1;
        G.fat(7 + extra);
        title = `${LOCATIONS[arg].name} 탐험`;
        triggered = arg;
        return `${slotName}, ${LOCATIONS[arg].name}에 가 봤다.`;
      }
      case 'club': {
        const cl = CLUBS[S.club];
        G.grow(cl.stat, 4); S.clubPts++; G.add('rep', 1); G.fat(10 + extra);
        if (clubTag(S) === 'band' && G.talent('voice')) return '합주 중에 보컬 파트를 대신 불렀다. 부원들이 악기를 멈추고 쳐다봤다.';
        return `${cl.name} 활동을 했다. ` + pick(['선배들이 조금씩 인정해 주기 시작했다.', '오늘은 생각보다 손발이 잘 맞았다.', '발표회 준비가 한 걸음 진척됐다.']);
      }
      case 'council': {
        const d = COUNCIL_DEPTS[S.council];
        G.grow(d.stat, 3); G.add('rep', 2); S.councilPts = (S.councilPts || 0) + 1; G.fat(10 + extra);
        title = `학생회 · ${d.name}`;
        const lead = FRIEND_IDS.find(id => S.met[id] && (id === 'chaerin' || S.year >= 2 && ['yejunsim', 'jejun'].includes(id)));
        if (lead && Math.random() < 0.35) { G.aff(lead, 4); return `${pick(d.acts)} ${CHARACTERS[lead].name}${josa(CHARACTERS[lead].name, '이', '가')} "역시 믿고 맡길 만해" 하며 음료를 건넸다.`; }
        return pick(d.acts);
      }
      case 'auto': {
        const a = AUTO_CLUBS[S.autoClub];
        G.grow(a.stat, 4); G.grow(a.perk, 1); S.autoPts++; G.flag('sciHours'); G.fat(10 + extra);
        title = `자율동아리 · ${a.name}`;
        if (S.met[a.friend] && Math.random() < 0.4) { G.aff(a.friend, 4); return `${pick(a.acts)} ${CHARACTERS[a.friend].name}${josa(CHARACTERS[a.friend].name, '이', '가')} 옆에서 같이 했다.`; }
        return pick(a.acts);
      }
    }
  });

  S.ap--; S.slot++;
  S.result = { title, text: r.text + (note ? `\n미니게임: ${note}` : ''), diffs: r.diffs, notes: r.notes };
  addLog(`${title}`);
  postChecks();

  if (S.fatigue >= 100) collapse();
  else if (triggered && triggered !== 'chaos') S.queue.unshift(pickLocationEvent(triggered));
  else if (S.queue.length === 0 && (S.dayPops || 0) < DAY_POPS) {
    // 친구가 먼저 말을 거는 일과 일상 사건은 각각 하루 한 번까지
    const quietDay = specialsFor(S.year, S.sem, S.day).length > 0;
    const loveEv = S.mode === 'classic' && !S.dayLove && Math.random() < 0.5 ? pickLoveEvent() : null;
    // 친구들과 엮이는 인간관계 사건 (하루 한 번)
    const rel = !S.dayTalk && Math.random() < (G.has('vitamin') ? 0.55 : 0.4) ? pickRelEvent() : null;
    // 학교 친구들(실제 친구 출연)은 따로 하루 한 번 기회가 있다
    const cam = !S.dayCameo && Math.random() < 0.35 ? pickCameoEvent() : null;
    if (loveEv) { S.dayLove = true; S.dayPops++; S.queue.push(loveEv); }
    else if (rel) { S.dayTalk = true; S.dayPops++; S.queue.push(rel); }
    else if (cam) { S.dayCameo = true; S.dayPops++; S.queue.push(cam); }
    else if (!S.dayEvent && !quietDay && Math.random() < (G.has('chaos') ? 0.3 : 0.18) + (triggered === 'chaos' ? 0.4 : 0)) {
      const e = pickRandomEvent();
      if (e) { S.dayEvent = true; S.dayPops++; S.queue.push(e); }
    }
  }
  nextEvent();
  save(); render();
}

function collapse() {
  S.fatigue = 70; S.ap = 0;
  G.notes = []; G.achieve('burnout');
  S.result = { title: '쓰러졌다!', text: '눈앞이 하얘졌다… 정신을 차려 보니 보건실 침대 위다. 오늘은 여기까지.', diffs: [], notes: G.notes.slice() };
  S.queue = [];
}

function addLog(text) {
  S.log.unshift(`${S.year}-${S.sem} · ${dateLabel()} ${SLOTS[Math.min(S.slot - 1, SLOTS.length - 1)] || ''} — ${text}`);
  S.log = S.log.slice(0, 40);
}

function postChecks() {
  Object.entries(AUTO_ACH).forEach(([id, t]) => { if (!S.ach.includes(id) && t(S)) { G.notes = []; G.achieve(id); toast(`업적 달성: ${ACHIEVEMENTS[id].name}`); } });
  Object.values(EVENTS).forEach(e => {
    if (e.type === 'char' && !S.seen[e.id] && (S.met[e.charId] || e.charId === 'teacher') && S.aff[e.charId] >= e.threshold && !S.queue.includes(e.id)
      && (e.threshold === 50 || S.seen[`char_${e.charId}_0`])) S.queue.push(e.id);
    if (e.type === 'council' && S.council && !S.seen[e.id] && (S.councilPts || 0) >= e.threshold && !S.queue.includes(e.id)
      && (e.threshold === 4 || S.seen.council_0)) S.queue.push(e.id);
    if (e.type === 'club' && e.autoClub === S.autoClub && !S.seen[e.id] && S.autoPts >= e.threshold && !S.queue.includes(e.id)
      && (e.threshold === 4 || S.seen[`auto_${S.autoClub}_0`])) S.queue.push(e.id);
  });
  if (S.setuk.length >= 10) G.achieve('setuk_master');
  S.titles = S.titles || ['newbie'];
  Object.entries(TITLES).forEach(([id, t]) => {
    if (S.titles.includes(id) || !t.test(S)) return;
    S.titles.push(id); dexMark('titles', id); toast(`칭호 획득: 「${t.name}」`);
    if (!S.title || S.title === 'newbie') S.title = id;
  });
  if (S.mode === 'classic') {
    // 고백·100일·이별 같은 연애 사건은 조건이 되면 하루 한 번까지 바로 일어난다
    if (S.loveDay !== S.dayNo && !S.cur) {
      const id = ['love_their_confess', 'love_breakup_jealous', 'love_fight', 'love_breakup', 'love_100', 'love_200', 'love_365', 'love_pepero', 'love_xmas', 'love_trip_night', 'love_confess'].find(id => !S.queue.includes(id) && available(EVENTS[id]));
      if (id) { S.queue.push(id); S.loveDay = S.dayNo; }
    }
  }
}

/* ───────── 이벤트 선택 ───────── */
function rareMult() {
  return (G.has('lucky') ? 2 : 1) * (clubTag(S) === 'science' ? 1.3 : 1) * (S.talentRevealed && S.talent === 'detective' ? 1.3 : 1) * (1 + S.stats.luck / 100);
}
function available(e) {
  if (e.once && S.seen[e.id]) return false;
  if (S.recent.includes(e.id)) return false;
  return !e.cond || e.cond(S);
}
function weighted(list) {
  const total = list.reduce((a, x) => a + x.w, 0);
  if (!total) return null;
  let r = Math.random() * total;
  for (const x of list) { r -= x.w; if (r <= 0) return x.id; }
  return list[list.length - 1].id;
}
function pickRandomEvent() {
  const list = Object.values(EVENTS).filter(e => !e.loc && !e.rel && ['daily', 'absurd', 'rare'].includes(e.type) && available(e)).map(e => {
    // 친구가 나오는 사건을 먼저 고른다
    let w = e.type === 'love' ? 6 : e.type === 'meet' ? 4 : e.rel ? 5 : e.type === 'daily' ? 2 : e.type === 'absurd' ? 1.2 * (G.has('chaos') ? 2 : 1) : 0.35 * rareMult();
    return { id: e.id, w: w / (1 + 1.5 * (S.seen[e.id] || 0)) };
  });
  return weighted(list);
}
// 연애 사건은 일상 사건과 따로 하루 한 번까지
// 인간관계 사건: 친구가 나오는 사건과, 아직 못 만난 친구와의 첫 만남
function pickRelEvent() {
  return weighted(Object.values(EVENTS).filter(e => (e.rel && e.type !== 'love' || e.type === 'meet' || e.type === 'cameo') && available(e))
    .map(e => ({ id: e.id, w: (e.relWeight || (e.type === 'meet' ? 4 : e.type === 'cameo' ? 3.5 : 3)) / (1 + (e.relWeight ? 0.4 : 1.5) * (S.seen[e.id] || 0)) })));
}
function pickCameoEvent() {
  return weighted(Object.values(EVENTS).filter(e => e.type === 'cameo' && available(e)).map(e => ({ id: e.id, w: S.cameo[e.cameo] ? 2 : 1 })));
}
function pickLoveEvent() {
  return weighted(['love_flutter', 'love_date', 'love_jealous', 'love_jealous_me', 'love_tease', 'love_almost'].filter(id => available(EVENTS[id])).map(id => ({ id, w: id === 'love_date' || id === 'love_flutter' ? 3 : 1.2 })));
}
function pickLocationEvent(loc) {
  const list = Object.values(EVENTS).filter(e => e.loc === loc && available(e)).map(e => {
    let w = e.type === 'meet' ? 7 : e.type === 'rare' ? 1.2 * rareMult() * (e.id === 'hidden_room' ? 3 : 1) : 3;
    return { id: e.id, w: w / (1 + 1.2 * (S.seen[e.id] || 0)) };
  });
  return weighted(list) || pickRandomEvent();
}

function nextEvent() {
  if (S.cur || !S.queue.length) return;
  const id = S.queue.shift();
  const e = EVENTS[id];
  if (!e || (e.cond && !e.cond(S))) return nextEvent();
  const ctx = {};
  if (e.setup) e.setup(S, ctx);
  S.cur = { id, ctx, result: null };
  S.seen[id] = (S.seen[id] || 0) + 1;
  S.recent = [id, ...S.recent].slice(0, 5);
  if (e.type === 'absurd') S.absurd++;
  if (e.type === 'rare' && !S.rare.includes(id)) { S.rare.push(id); dexMark('rare', id); }
  if (e.type === 'story') {
    const cost = storyCost(id);
    S.ap = Math.max(0, S.ap - cost); S.slot = Math.min(AP_MAX, S.slot + cost);
  }
  if (SETTINGS.fast && id === 'mock') { chooseEvent(0); return; }
  SFX.play({ rare: 'rare', absurd: 'boing', talk: 'pop', meet: 'pop', char: 'pop', club: 'rare', love: 'rare', council: 'rare', cameo: 'pop' }[e.type] || 'click');
}
function choicesOf(e, ctx) { return typeof e.choices === 'function' ? e.choices(S, ctx) : e.choices; }

function chooseEvent(i) {
  const e = EVENTS[S.cur.id];
  const c = choicesOf(e, S.cur.ctx)[i];
  if (c.req && !c.req(S)) return;
  SFX.play('click');
  S._eff = 1; S._act = 'event';
  const r = withDiff(() => c.run(S, S.cur.ctx));
  S.cur.result = { choice: c.label, ...r };
  if (SETTINGS.fast) { const t = eventTitle(e, S.cur.ctx); closeEvent(); if (!S.cur) S.result = { title: t, text: `선택: ${c.label}\n${r.text}`, diffs: r.diffs, notes: r.notes }; save(); render(); return; }
  save(); renderModal();
}

function closeEvent() {
  const e = EVENTS[S.cur.id];
  addLog(eventTitle(e, S.cur.ctx));
  // 추억 앨범: 학교 행사·친구·연애·동아리 같은 기억할 만한 순간을 남긴다
  if (['story', 'char', 'love', 'council', 'club', 'cameo', 'meet', 'rare'].includes(e.type) && !['exam', 'mock', 'perf', 'club_pick', 'college_apply'].includes(S.cur.id) && S.cur.result) {
    S.memories = (S.memories || []).concat({ when: `${S.year}학년 ${dateOf(S.year, S.sem, S.day).getMonth() + 1}월`, title: eventTitle(e, S.cur.ctx), choice: S.cur.result.choice, type: e.type }).slice(-60);
  }
  S.cur = null;
  postChecks();
  if (S.fatigue >= 100) collapse();
  nextEvent();
  save(); render();
}

function eventTitle(e, ctx) {
  if (e.title) return typeof e.title === 'function' ? e.title(S, ctx) : e.title;
  if (e.type === 'meet') { const n = CHARACTERS[e.who(S, ctx)].name; return `${n}${josa(n, '과', '와')}의 첫 만남`; }
  return '사건';
}

/* ───────── 시험 ───────── */
// 같은 학년 학생들의 점수가 정규분포(표준편차 14, 평균은 학기마다 상승)라고 보고 석차와 내신 5등급을 정한다
function normCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
// 절대평가(성취평가) 과목: 점수로 A~E
function absLetter(score) { return score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'E'; }
// 같은 학년 친구들도 3년 동안 같이 성장한다: 학기가 지날수록 비교 기준 평균이 올라간다
const COHORT_MEAN = [55, 61, 64, 66, 68, 70];
function cohortMean() { return S ? COHORT_MEAN[(S.year - 1) * 2 + (S.sem - 1)] : 64; }
function examRank(score, n) {
  const rank = clamp(Math.round((1 - normCdf((score - cohortMean()) / 14)) * n) + 1, 1, n);
  const pct = Math.round(rank / n * 1000) / 10;
  const grade = GRADE_CUTS.find(([, cut]) => pct <= cut)[0];
  return { rank, n, pct, grade };
}
// 수능은 9등급제 그대로 (4·11·23·40·60·77·89·96%)
function suneungGrade(pct) { return [4, 11, 23, 40, 60, 77, 89, 96, 100].findIndex(c => pct <= c) + 1; }
function takeExam(mode) {
  const s = S;
  const type = examName();
  const fatPen = Math.max(0, s.fatigue - 55) * 0.5;
  let bonus = 0, comment = '';
  if (mode === 'skill') {
    if (G.has('cram') && s.studied.some(d => d >= s.dayNo - 2)) { bonus += 8; comment += ' 벼락치기가 빛을 발했다!'; }
    if (clubTag(s) === 'science') bonus += 3;
  } else if (mode === 'luck') comment = ' 연필을 굴릴 때마다 기도했다.';
  else {
    G.absurd();
    if (G.chance(0.15 + s.stats.luck / 400)) { G.add('rep', 6); G.nick('양일고 시인'); comment = ' 채점하던 선생님이 시를 읽고 울었다. 교지에 실리게 됐다.'; }
    else { G.aff('teacher', -4); comment = ' 시험지 뒷면 시는 아무도 읽지 않았다.'; }
  }
  if (s.flags.examTip) { bonus += 4 * s.flags.examTip; s.flags.examTip = 0; comment += ' 미리 입수한 정보가 도움이 됐다.'; }
  if (s.flags.fortune) { bonus += 5 * s.flags.fortune; comment += s.flags.fortune > 0 ? ' 점괘가 맞았다!' : ' 불길한 점괘가 머리를 맴돌았다.'; s.flags.fortune = 0; }
  if (G.has('glass')) bonus += s.fatigue < 40 ? 6 : s.fatigue > 65 ? -10 : 0;
  if (s.flags.pen) { bonus += 3; s.flags.pen = 0; comment += ' 행운의 볼펜이 술술 써졌다.'; }
  if (s.partner && s.love[s.partner] >= 60) { bonus += 3; comment += ` ${CHARACTERS[s.partner].name}의 응원 메시지 덕분에 힘이 났다.`; }
  { const pb = payback('exam'); bonus += pb.bonus; comment += pb.text; }
  // 지필: 과목마다 따로 채점한다. 1차·2차 각각 30%, 수행평가 40%로 학기 성적을 낸다
  const key = semKey(s), first = s.day === 3;
  s.written[key] = s.written[key] || {};
  const subs = subjectsOf(s).map(sub => {
    const m = mastery(sub);
    let sc = mode === 'skill' ? 21 + s.stats.study * 0.45 + m * 0.4 - (s.year - 1) * 2 - fatPen + rand(-8, 8)
      : mode === 'luck' ? 18 + s.stats.luck * 0.5 + m * 0.2 + rand(-15, 22) - fatPen * 0.5
      : 8 + m * 0.35 + rand(-5, 5);
    sc = Math.round(clamp(sc + bonus));
    (s.written[key][sub.name] = s.written[key][sub.name] || []).push(sc);
    if (sub.abs) return { sub, score: sc, grade: null, letter: absLetter(sc) };
    return { sub, score: sc, ...examRank(sc, sub.size) };
  });
  // 절대평가 과목은 5등급 평균에서 뺀다
  const credits = subs.map(x => x.sub.abs ? 0 : x.sub.credits || 3), csum = credits.reduce((a, x) => a + x, 0);
  const wavg = arr => Math.round(arr.reduce((a, x, i) => a + x * credits[i], 0) / csum * 10) / 10;
  const score = Math.round(subs.reduce((a, x) => a + x.score, 0) / subs.length);
  s.exams.push({ year: s.year, sem: s.sem, type, score, grade: wavg(subs.map(x => x.grade)), subjects: subs.map(x => ({ name: x.sub.name, score: x.score, grade: x.grade, letter: x.letter, rank: x.rank, n: x.n })), mode });
  if (subs.some(x => x.score >= 95)) G.achieve('ace');
  G.fat(10);
  if (mode === 'skill') G.grow('study', 1);
  if (first) {
    return `${type} 결과 (지필 · 가채점)\n` + subs.map(x => `${x.sub.name} ${x.score}점 · 지금이라면 ${x.letter ? `${x.letter} (절대평가)` : `${x.grade}등급`}`).join('\n') + `\n수행평가와 2차 시험까지 합쳐서 학기 등급이 나온다.${comment}`;
  }
  const fin = finalizeSemester();
  if (fin.grade <= 1.5) SFX.play('fanfare');
  const react = fin.grade <= 1.5 ? '교실 뒤에서 탄성이 들렸다.' : fin.grade <= 2.5 ? '꽤 잘했다. 1등급 과목을 늘려 보자.' : fin.grade <= 3.5 ? '딱 중간. 약한 과목부터 챙기자.' : '성적표를 접어서 가방 깊숙이 넣었다.';
  return `${type} 결과 → 학기 최종 평균 ${fin.grade}등급\n` + fin.subjects.map(x => `${x.name} 지필 ${x.w.join('·')} + 수행 ${x.perf} → ${x.letter ? `${x.letter} (절대평가)` : `${x.grade}등급 (${x.rank}/${x.n})`}`).join('\n') + `\n${react}${comment}`;
}

// 학기 최종 성적: 지필(1차 30% + 2차 30%) + 수행평가 40%, 과목 수강 인원 안에서 석차·등급
function finalizeSemester() {
  const s = S, key = semKey(s);
  const perf = s.perf[key] = s.perf[key] || {};
  const subs = subjectsOf(s).map(sub => {
    const m = mastery(sub);
    if (perf[sub.name] == null) perf[sub.name] = Math.round(clamp(48 + m * 0.4 + rand(-5, 5)));
    const w = s.written[key]?.[sub.name] || [];
    const wavg = w.length ? w.reduce((a, x) => a + x, 0) / w.length : 50;
    const score = Math.round(wavg * 0.6 + perf[sub.name] * 0.4);
    const r = sub.abs ? { grade: null, rank: null, n: null } : examRank(score, sub.size);
    // 숙련도가 높은 과목은 세특에 수업 태도가 남는다
    if (m >= 75 && !s.setuk.some(x => x.key === key && x.subject === sub.name)) addSetuk(sub.name, `${sub.name} 수업에서 꾸준한 자기주도 학습으로 개념을 깊이 이해하고 친구들의 질문에 설명해 줌.`);
    return { name: sub.name, credits: sub.abs ? 0 : sub.credits || 3, w, perf: perf[sub.name], score, grade: r.grade, rank: r.rank, n: r.n, letter: sub.abs ? absLetter(score) : null };
  });
  const csum = subs.reduce((a, x) => a + x.credits, 0);
  const grade = Math.round(subs.reduce((a, x) => a + (x.grade || 0) * x.credits, 0) / csum * 10) / 10;
  const prev = s.semGrades[s.semGrades.length - 1];
  const entry = { key, year: s.year, sem: s.sem, subjects: subs, grade, credits: csum };
  s.semGrades.push(entry);
  if (prev && prev.grade - grade >= 1) G.achieve('comeback');
  return entry;
}

// 수행평가 주간: 고른 과목은 높게, 나머지는 기본 점수. 골고루면 모두 중간.
function perfFocus(names, focus) {
  // focus: null(골고루) · 과목 이름 · 과목 이름 배열(체력이 높을 때)
  const fs = focus === null ? [] : [].concat(focus);
  const s = S, key = semKey(s);
  const perf = s.perf[key] = s.perf[key] || {};
  const lines = names.map(n => {
    const sub = subjectsOf(s).find(x => x.name === n);
    const m = mastery(sub);
    let sc;
    if (focus === null) sc = 56 + m * 0.36 + rand(-5, 5);
    else if (fs.includes(n)) {
      sc = 66 + m * 0.3 + rand(-6, 10);
      const pf = mateOf(sub.friend); if (pf && s.met[pf]) { sc += 5; G.aff(pf, 6); }
      addSetuk(n, (SETUK_LINES[sub.area] || SETUK_LINES['교양']).replace('{sub}', n));
    } else sc = 44 + m * 0.38 + rand(-6, 6);
    perf[n] = Math.round(clamp(sc));
    return `${n} ${PERF_TASKS[sub.area] || '과제'} ${perf[n]}점`;
  });
  G.fat(fs.length ? 10 + 8 * (fs.length - 1) : 8);
  if (fs.length) G.flag('perfFocus', fs.length);
  fs.forEach(f => masteryUp(subjectsOf(s).find(x => x.name === f), 4));
  return lines.length ? lines.join('\n') + (fs.length ? `\n${fs.join(', ')} 과제는 세특에 기록됐다.` : '') : '할 일이 없었다.';
}

// 전교회장 선거: 친구들의 친밀도가 표가 된다
function electionResult(pledge, bonus) {
  const friendPower = (topAff(S) + cameoStars(S) * 4) / 23;
  const career = S.council ? Math.min(5, 1 + (S.councilPts || 0) * 0.4) : 0;  // 학생회 경력
  const pb = payback('election');
  const me = Math.round(clamp(6 + friendPower + pb.bonus + career + S.stats.rep * 0.12 + S.stats.social * 0.08 + bonus + rand(-7, 7), 12, 78));
  const rival = Math.round((100 - me) * rand(55, 70) / 100);
  const head = (pb.text ? pb.text.trim() + '\n' : '') + `"${pledge}" 개표 결과: 나 ${me}% · 상대 후보 ${rival}% · 기타 ${100 - me - rival}%.\n`;
  if (me > rival) {
    S.flags.president = 1; G.add('rep', 12); G.achieve('president'); G.nick('전교회장');
    addSetuk('자율활동', `전교 학생회장으로 당선되어 "${pledge.replace(/!$/, '')}" 공약을 이행하며 학생 자치 활동을 이끎.`);
    SFX.play('fanfare');
    return head + '당선이다! 친구들이 나를 들어 올렸다. 내년 양일고의 얼굴은 나다.';
  }
  G.add('rep', 4); G.grow('social', 2);
  return head + '아쉽게 낙선. 그래도 친구들과 밤새 만든 손팻말은 평생 추억이다.';
}


function addSetuk(subject, text) {
  if (!S.setuk.some(x => x.text === text)) { S.setuk.push({ key: semKey(S), subject, text }); G.notes.push(`세특 기록: ${subject}`); }
}

// 대학 진학: 전형에 따라 내신·세특·활동·수능을 다르게 본다
function collegeResult(s) {
  const m = metrics(s), route = s.route || 'jonghap';
  let sc;
  if (route === 'gyogwa') sc = (5 - m.gpa) * 24 + 4;
  else if (route === 'sports') sc = s.stats.stamina * 0.75 + (s.flags.sportsWins || 0) * 6 + (clubTag(s) === 'sport' ? 8 : 0) + (5 - m.gpa) * 5;
  else if (route === 'jonghap') sc = (5 - m.gpa) * 15 + Math.min(s.setuk.length, 14) * 2 + Math.min(s.autoPts, 12) * 0.6 + (s.club ? 3 : 0) + (s.flags.recommend ? 5 : 0) + (s.flags.president ? 6 : s.flags.vicePresident ? 3 : 0) + Math.min(s.councilPts || 0, 10) * 0.5;
  else sc = s.suneung ? (9 - s.suneung.grade) * 11 + 2 : 15;
  sc += rand(-6, 6);
  const t = COLLEGE_TIERS.findIndex(([c]) => sc >= c);
  return { route, major: collegeMajor(s), tier: t === -1 ? null : COLLEGE_TIERS[t][1], rank: t === -1 ? 5 : t, score: Math.round(sc) };
}
function collegeMajor(s) {
  const taken = Object.values(s.electives).flat();
  const has = (...l) => l.some(x => taken.includes(x));
  if (s.route === 'sports') return '체육교육과·스포츠과학과';
  if (s.autoClub && s.autoPts >= 6) return AUTO_CLUBS[s.autoClub].major;
  if (s.flags.dream) return s.flags.dream;
  if (clubTag(s) === 'medic') return '간호학과';
  if (s.track === 'sci') {
    if (has('물리학', '역학과 에너지', '전자기와 양자')) return '기계·전자공학과';
    if (has('생명과학', '생물의 유전', '세포와 물질대사')) return '생명과학과';
    if (has('화학', '물질과 에너지', '화학반응의 세계')) return '화학공학과';
    if (has('정보', '인공지능 기초')) return '컴퓨터공학과';
    return '자연과학계열';
  }
  if (has('교육의 이해')) return '교육학과';
  if (has('정치', '법과 사회')) return '정치외교·법학계열';
  if (has('경제', '금융과 경제생활', '인간과 경제 활동')) return '경영·경제학과';
  if (has('사회와 문화', '사회문제 탐구')) return '사회학·미디어학과';
  if (has('세계사', '동아시아 역사 기행', '역사로 탐구하는 현대 세계')) return '사학과';
  return '인문학계열';
}

// 전국연합모의학력평가: 내신에는 들어가지 않고 실력 점검만 한다
function takeMock(mode) {
  const s = S;
  if (mode === 'sleep') { G.fat(-20); G.add('rep', -1); return 'OMR 카드에 이름만 쓰고 엎드렸다. 감독 선생님의 한숨 소리가 자장가였다.'; }
  if (mode === 'art') { G.absurd(); G.nick('OMR 화가'); G.add('rep', 2); return 'OMR 마킹으로 은행나무 그림을 완성했다. 채점 기계가 잠시 멈췄다는 소문이 돌았다.'; }
  const score = clamp(20 + s.stats.study * 0.75 - (s.year - 1) * 3 - Math.max(0, s.fatigue - 55) * 0.4 + rand(-8, 8));
  const pct = Math.round((1 - normCdf((score - 55) / 18)) * 1000) / 10;
  G.grow('study', 2); G.fat(10);
  return `전국 상위 ${pct}% · 모의고사 ${suneungGrade(pct)}등급. 내신엔 안 들어가지만 내 위치를 알게 됐다.`;
}

// 대학수학능력시험 (3학년 2학기)
function takeSuneung(mode) {
  const s = S;
  let score = 22 + s.stats.study * 0.8 - Math.max(0, s.fatigue - 50) * 0.5 + rand(-8, 8);
  const pb = payback('suneung'); score += pb.bonus;
  if (mode === 'calm') score += s.stats.luck / 15;
  if (mode === 'luck') score = 15 + s.stats.luck * 0.5 + s.stats.study * 0.35 + rand(-15, 20);
  if (G.has('glass')) score += s.fatigue < 40 ? 6 : -8;
  const pct = Math.round((1 - normCdf((clamp(score) - 55) / 18)) * 1000) / 10;
  const grade = suneungGrade(pct);
  s.suneung = { grade, pct };
  if (grade <= 2) G.achieve('suneung');
  G.fat(25);
  return (pb.text ? pb.text.trim() + '\n' : '') + `수능 평균 ${grade}등급 (전국 상위 ${pct}%). ` + (grade <= 2 ? '교문 앞에서 기다리던 친구들이 환호했다.' : grade <= 4 ? '해냈다. 3년의 끝이 보인다.' : '끝났다는 사실만으로 눈물이 났다.');
}

/* ───────── 졸업 ───────── */
function graduate() {
  const j = judgeEnding(S);
  const rec = saveRecord(S, j);
  store.del(SAVE_KEY);
  S = null;
  UI.rec = rec; UI.screen = 'ending';
  render();
}

/* ───────── 렌더링 ───────── */
const $app = () => document.getElementById('app');

/* ───────── 처음 하는 사람을 위한 설명 ───────── */
const TUT_KEY = 'yangil.tutorial.v1';
function tutorialSteps() {
  const real = !S || S.mode !== 'classic';
  return [
    ['양일고에 온 걸 환영해!', '1학년 입학부터 3학년 졸업까지 3년을 보내는 게임이야. 학기마다 5~6일이 지나가고, 졸업할 때 내가 보낸 3년에 맞는 엔딩과 졸업 카드를 받아.'],
    ['하루는 행동 2번', '점심시간과 방과후에 한 번씩 행동을 골라. 자습, 친구와 대화, 운동, 학교 탐험, 약속 잡기 같은 것들이야. 행동마다 짧은 미니게임이 있는데, 귀찮으면 「빠르게 넘기기」를 눌러도 돼. 대신 효과가 조금 줄어.'],
    ['피로와 용돈', '행동할수록 피로가 쌓여. 75를 넘으면 효율이 떨어지고 100이 되면 쓰러지니까 가끔 휴식하자. 용돈은 하루 700원이야. 매점 간식이나 친구와 약속에 쓸 수 있어.'],
    ['학교 일정과 성적', '위쪽에 보이는 D-day가 다가오는 학교 행사야. 정기시험과 수행평가로 내신 등급(1~5등급)이 정해져. 시험 전에는 자습으로 과목 숙련도를 올려 두자.'],
    real ? ['친구들', '이번 판에 만날 친구들은 오른쪽(휴대폰은 「인간관계」 탭)에 있어. 대화하고, 약속을 잡고, 선물하면 친해져. 친구 에피소드를 볼 때마다 우정 ★이 올라. 친구 부탁을 들어주면 시험이나 선거 같은 중요한 날 보답해 줘.']
      : ['친구와 연애', '가상 친구 4명과 친해지면 썸이 시작될 수 있어. 대화와 데이트로 설렘을 키워서 고백해 보자. 연인과 오래 연락을 안 하면 서운함이 쌓이니 조심해. 실제 친구들은 우정 에피소드에 나와.'],
    ['이제 시작해 볼까?', '사건은 하루에 2개까지만 저절로 일어나. 저장은 자동으로 되고, 이 설명은 위쪽 「도움말」에서 다시 볼 수 있어. 좋은 3년 보내!'],
  ];
}
function renderTutorial() {
  let el = document.getElementById('tut');
  if (!el) { el = document.createElement('div'); el.id = 'tut'; el.className = 'overlay tut'; document.body.appendChild(el); }
  // 처음 게임 화면에 들어오면 한 번 자동으로 보여 준다
  if (UI.tut == null && UI.screen === 'game' && S && !S.cur && !(typeof MINI !== 'undefined' && MINI.st)) { let seen = false; try { seen = !!localStorage.getItem(TUT_KEY); } catch (e) {} if (!seen) UI.tut = 0; }
  if (UI.tut == null || UI.screen !== 'game') { el.hidden = true; el.innerHTML = ''; el.dataset.step = ''; return; }
  const steps = tutorialSteps(), i = Math.min(UI.tut, steps.length - 1), [title, body] = steps[i];
  if (!el.hidden && el.dataset.step === String(i)) return; // 같은 장이면 다시 그리지 않는다 (애니메이션 반복 방지)
  el.hidden = false; el.dataset.step = i;
  el.innerHTML = `<div class="ev-card tut-card" role="dialog" aria-modal="true" aria-labelledby="tut-title">
    <div class="tut-top"><span class="ev-type">게임 설명</span><span class="tut-dots" aria-label="${i + 1} / ${steps.length}">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span></div>
    <h2 id="tut-title">${title}</h2><p>${body}</p>
    <div class="tut-actions"><button class="link" data-act="tut-close">건너뛰기</button><span>${i ? '<button class="btn" data-act="tut-prev">이전</button>' : ''}<button class="btn primary" data-act="tut-next" autofocus>${i === steps.length - 1 ? '시작하기' : '다음'}</button></span></div>
  </div>`;
  const f = el.querySelector('[autofocus]'); if (f) f.focus({ preventScroll: true });
}
function closeTutorial() { UI.tut = null; try { localStorage.setItem(TUT_KEY, '1'); } catch (e) {} renderTutorial(); }

function render() {
  const fn = { menu: renderMenu, create: renderCreate, game: renderGame, report: renderReport, ending: renderEnding, gallery: renderGallery, dex: renderDex, school: renderSchool, course: renderCourse, vacation: renderVacation, ceremony: renderCeremony, settings: renderSettings }[UI.screen];
  $app().innerHTML = fn();
  $app().dataset.screen = UI.screen;
  renderModal();
  renderTutorial();
  if (UI.screen === 'ending') afterEndingRender();
  if (UI.screen === 'gallery') afterGalleryRender();
}

// 데이트 반응: 상대가 좋아하는 반응이면 설렘이 크게 오른다
function loveReact(who, style, base = 0) {
  const liked = CHARACTERS[who].likes === style;
  S.love[who] = clamp((S.love[who] || 0) + (liked ? 18 : 10) + base);
  G.aff(who, liked ? 5 : 2); loveTouch(who, 8);
  const n = CHARACTERS[who].name;
  return (liked ? `${n}${josa(n, '이', '가')} 눈을 반짝이며 웃었다. 마음이 통한 것 같다.` : `${n}${josa(n, '이', '가')} 웃어 주긴 했다. 다음엔 다른 방식이 좋을지도.`) + ` (설렘 ${S.love[who]})`;
}
function startCouple(w) {
  S.partner = w; S.crush = null; S.waitConfess = 0; S.partnerSince = S.dayNo; S.loveSecret = null;
  S.queue.unshift('love_reveal');
  S.love[w] = Math.max(S.love[w], 70); G.aff(w, 8);
  G.achieve('couple'); SFX.play('fanfare');
}
function endCouple(text) {
  const w = S.partner; S.partner = null; S.crush = null; S.loveSecret = null; S.loveTension = 0; S.loveNo[w] = 1; G.aff(w, -10);
  S.flags.jealous = 0; S.flags.exes = (S.flags.exes || 0) + 1; G.notes.push(`${CHARACTERS[w].name}${josa(CHARACTERS[w].name, '과', '와')} 헤어졌다`);
  return text;
}
function avatar(id, size = '') {
  const ch = CHARACTERS[id] || CAMEOS[id];
  return `<span class="avatar ${size}" style="--c:${ch.color}">${esc(ch.name.replace(/ (쌤|선배)$/, '').slice(-2, -1))}</span>`;
}
function statBar(label, v, cls = '') {
  return `<div class="stat ${cls}"><span class="stat-l">${label}</span><span class="bar"><i style="width:${clamp(v)}%"></i></span><span class="stat-v">${Math.round(v)}</span></div>`;
}
function diffChips(diffs) {
  return diffs.length ? `<div class="chips">${diffs.map(x => `<span class="chip ${x.good ? 'up' : 'down'}">${esc(x.label)} ${x.d > 0 ? '+' : ''}${x.d}</span>`).join('')}</div>` : '';
}
function notesHtml(notes) {
  return notes && notes.length ? `<ul class="notes">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '';
}
function traitChips(traits) {
  return traits.map(t => `<span class="trait" title="${esc(TRAITS[t].good)} / ${esc(TRAITS[t].bad)}">${esc(TRAITS[t].name)}</span>`).join('');
}

function renderMenu() {
  const sv = store.get(SAVE_KEY, null);
  const recs = loadRecords();
  const dex = loadDex();
  const found = ENDINGS.filter(e => dex.endings[e.id]).length;
  return `
  <section class="menu">
    <div class="board">
      <p class="board-date">${new Date().getMonth() + 1}월 ${new Date().getDate()}일 · 주번: 너</p>
      <p class="board-motto">참되게 · 바르게 · 알차게</p>
      <h1 class="logo">나는 이번생은<br><span>양일고다!</span></h1>
      <p class="board-sub">무작위 능력치로 입학해서, 내 선택으로 3년을 살고, 졸업 카드를 자랑하자.</p>
      <div class="chalk-tray"><i></i><i></i><i></i></div>
    </div>
    <button class="ledge-btn" data-act="new">새 인생 시작</button>
    <nav class="lockers" aria-label="메뉴">
      ${[['continue', '이어하기', sv ? `${esc(sv.name)}, ${sv.year}학년 ${sv.sem}학기` : '저장된 게임 없음', !sv],
        ['gallery', '기록 갤러리', `졸업생 ${recs.length}명`],
        ['dex', '도감', `엔딩 ${found}개 발견 (전체 ${ENDINGS.length})`],
        ['daily', '오늘의 주인공', '오늘은 모두 같은 주인공으로'],
        ['school', '학교 안내', `개교 ${new Date().getFullYear() - 1970}주년, 경기도 양평`]].map(([k, name, sub, off], i) => `
      <button class="locker" data-act="${k}" ${off ? 'disabled' : ''}><span class="locker-no">2-${String(i + 1).padStart(2, '0')}</span><span class="vents" aria-hidden="true"></span><span class="nametag"><b>${name}</b><small>${sub}</small></span></button>`).join('')}
    </nav>
    <div class="menu-foot"><button class="sfx-btn light" data-act="sfx" aria-pressed="${SFX.on}">효과음 ${SFX.on ? '켜짐' : '꺼짐'}</button><button class="sfx-btn light" data-act="settings">설정</button></div>
    <p class="fine center">양일고 학생이 만든 팬 게임입니다. 학교 정보는 공개 자료를 참고했어요. 실제 친구들은 본인 허락을 받고 출연했고, 가상 친구와 사건은 지어낸 이야기예요.</p>
  </section>`;
}

const MODES = {
  real: { name: '실제 친구 모드', desc: '친구가 전부 실제 친구들이야. 판마다 6명이 뽑힌다. 연애는 없다.' },
  classic: { name: '연애 모드', desc: '가상 친구 4명과 우정·연애. 실제 친구들은 우정 에피소드에 조연으로 나온다.' },
};
UI.mode = (() => { try { return localStorage.getItem('yangil.mode') === 'classic' ? 'classic' : 'real'; } catch (e) { return 'real'; } })();
function renderCreate() {
  const d = UI.draft;
  return `
  <section class="create">
    <header class="sheet-head">
      <p class="eyebrow">양일고등학교 입학 원서 · 제 ${loadRecords().length + 1}기</p>
      <h2>${d.daily ? '오늘의 주인공' : '이번 생의 나'}</h2>
      ${d.daily ? `<p class="daily-tag">${d.daily} · 오늘 이 게임을 하는 모두가 같은 능력치·특성으로 시작해. 친구랑 엔딩을 비교해 보자!</p>` : ''}
    </header>
    <div class="idcard">
      <div class="photo">${avatarSVG(d.avatar, '증명사진')}<small>증명사진</small></div>
      <div class="id-body">
        <label class="field-l" for="name-input">이름</label>
        <input id="name-input" class="name-input" maxlength="8" value="${esc(d.name)}" placeholder="이름을 적어 줘" autocomplete="off" required>
        <div class="seg gender" role="radiogroup" aria-label="성별">${Object.entries(GENDER_LABEL).map(([k, l]) => `<button role="radio" aria-checked="${d.gender === k}" class="${d.gender === k ? 'on' : ''}" data-act="gender" data-arg="${k}">${l}</button>`).join('')}</div>
        <div class="stats">${STATS.map(k => statBar(STAT_LABEL[k], d.stats[k])).join('')}</div>
      </div>
    </div>
    <h3 class="sec-title">증명사진 꾸미기</h3>
    <div class="av-ctrls">${AVATAR_KEYS.map(k => `
      <div class="av-row"><span class="av-lab">${AVATAR_LABEL[k]}</span>
        <button class="av-step" data-act="av-step" data-arg="${k}|-1" aria-label="${AVATAR_LABEL[k]} 이전">◀</button>
        <b class="av-val">${avatarPartName(k, d.avatar[k])}</b>
        <button class="av-step" data-act="av-step" data-arg="${k}|1" aria-label="${AVATAR_LABEL[k]} 다음">▶</button></div>`).join('')}
      <button class="btn av-rand" data-act="av-rand">랜덤으로 꾸미기</button>
    </div>
    <h3 class="sec-title">게임 버전</h3>
    <div class="mode-cards" role="radiogroup" aria-label="게임 버전">${Object.entries(MODES).map(([k, m]) => `
      <button role="radio" aria-checked="${UI.mode === k}" class="mode-card ${UI.mode === k ? 'on' : ''}" data-act="mode" data-arg="${k}"><b>${m.name}</b><span>${m.desc}</span></button>`).join('')}
    </div>
    <h3 class="sec-title">타고난 특성</h3>
    <div class="trait-cards">${d.traits.map(t => `
      <div class="trait-card"><b>${esc(TRAITS[t].name)}</b><span class="pro">+ ${esc(TRAITS[t].good)}</span><span class="con">− ${esc(TRAITS[t].bad)}</span></div>`).join('')}
      <div class="trait-card secret"><b>숨겨진 재능 ???</b><span>${esc(TALENTS[d.talent].hint)}</span></div>
    </div>
    <div class="create-actions">
      ${d.daily ? '' : `<button class="btn" data-act="reroll" ${d.rerolls ? '' : 'disabled'}>다시 태어나기 (${d.rerolls}회 남음)</button>`}
      <button class="btn primary" data-act="enroll">이대로 입학한다</button>
    </div>
    <button class="link" data-act="menu">← 메인으로</button>
  </section>`;
}

function renderGame() {
  const ns = nextSpecial();
  const fatigueCls = S.fatigue >= 75 ? 'danger' : S.fatigue >= 50 ? 'warn' : '';
  const friends = ['teacher'].concat(FRIEND_IDS).filter(id => S.met[id]);
  const examGrades = (S.semGrades && S.semGrades.length ? S.semGrades : S.exams).slice(-4);
  const res = S.result;
  return `
  <header class="topbar">
    <button class="logo-mini" data-act="menu" aria-label="메인 메뉴">양일고</button>
    <div class="date-box">
      <span class="grade-tag">${S.year}학년 ${S.sem}학기</span>
      <b>${dateLabel()}</b>
      <span class="dday">${ns ? `${esc(ns.label)} D-${ns.dday}` : (S.day === semDays() ? '학기 마지막 날' : '')}</span>
    </div>
    <div class="ap" aria-label="행동력 ${S.ap} / ${AP_MAX}">${Array.from({ length: AP_MAX }, (_, i) => `<i class="${i < S.ap ? 'on' : ''}"></i>`).join('')}<span>${S.ap} / ${AP_MAX}</span></div>
    <button class="sfx-btn" data-act="tut-open" aria-label="게임 설명 다시 보기">도움말</button>
    <button class="sfx-btn" data-act="sfx" aria-pressed="${SFX.on}">소리 ${SFX.on ? '켜짐' : '꺼짐'}</button>
    <div class="statline">${STATS.map(k => `<span>${STAT_LABEL[k]} <b>${Math.round(S.stats[k])}</b></span>`).join('')}<span class="${fatigueCls}">피로 <b>${S.fatigue}</b></span></div>
  </header>
  <main class="game" data-tab="${UI.gtab || 'me'}">
    <aside class="panel me">
      <div class="me-head">
        <span class="me-photo">${S.avatar ? avatarSVG(S.avatar) : esc(S.name.slice(-2, -1))}</span>
        <div><b class="me-name">${esc(S.name)}</b><small class="me-nick">${S.gender ? GENDER_LABEL[S.gender] + ' · ' : ''}${S.year}학년 2반${S.flags.president ? ' · 전교회장' : S.flags.vicePresident ? ' · 부회장' : ''}</small>${S.nicks.length ? `<small class="me-nick">"${esc(S.nicks[S.nicks.length - 1])}"</small>` : ''}</div>
      </div>
      <div class="traits">${traitChips(S.traits)}${S.talentRevealed ? `<span class="trait talent">${esc(TALENTS[S.talent].name)}</span>` : '<span class="trait secret">재능 ???</span>'}</div>
      <div class="stats">${STATS.map(k => statBar(STAT_LABEL[k], S.stats[k])).join('')}</div>
      <div class="stats fatigue">${statBar('피로', S.fatigue, fatigueCls)}</div>
      ${S.fatigue >= 75 ? '<p class="warn-text">너무 피곤하다. 행동 효율이 떨어진다.</p>' : ''}
      <dl class="me-meta">
        <div><dt>칭호</dt><dd><button class="link title-btn" data-act="title-pick">「${esc(TITLES[S.title || 'newbie'].name)}」 · ${(S.titles || []).length}개 ▾</button></dd></div>
        <div><dt>계열</dt><dd>${S.track ? TRACKS[S.track].name : '1학년 공통'}</dd></div>
        <div><dt>동아리</dt><dd>${S.club ? esc(CLUBS[S.club].name) + ` · 활동 ${S.clubPts}` : '귀가부'}</dd></div>
        <div><dt>학생회</dt><dd>${S.council ? COUNCIL_DEPTS[S.council].name + ` · 활동 ${S.councilPts || 0}` : '없음'}</dd></div>
        <div><dt>자율동아리</dt><dd>${S.autoClub ? AUTO_CLUBS[S.autoClub].name + ` · 활동 ${S.autoPts}` : S.year === 1 && S.sem === 1 && S.day < 5 ? '5/20 모집' : '없음'}</dd></div>
        <div><dt>용돈</dt><dd>${won(S.money)}</dd></div>
        <div><dt>세특</dt><dd>${S.setuk.length}줄</dd></div>
        <div><dt>최근 성적</dt><dd>${examGrades.length ? examGrades.map(e => `<span class="gr g${Math.round(e.grade)}">${e.grade}</span>`).join('') : '아직 없음'}</dd></div>
        <div><dt>발견</dt><dd>희귀 ${S.rare.length} · 업적 ${S.ach.length}</dd></div>
      </dl>
    </aside>

    <section class="stage">
      <ol class="slots">${SLOTS.map((n, i) => `<li class="${i < S.slot ? 'done' : i === S.slot && S.ap > 0 ? 'now' : ''}">${n}</li>`).join('')}</ol>
      <p class="menu-strip"><b>오늘의 급식</b> ${todayMenu(S).map(esc).join(' · ')}</p>
      <div class="situation">
        ${res ? `<p class="eyebrow">${esc(res.title)}</p><p class="sit-text">${esc(res.text)}</p>${diffChips(res.diffs)}${notesHtml(res.notes)}`
          : `<p class="eyebrow">현재 상황 · ${S.ap > 0 ? SLOTS[Math.min(S.slot, SLOTS.length - 1)] : '하교'}</p><h2>오늘은 어떻게 보낼까?</h2><p class="sit-text">${S.ap > 0 ? '행동을 하나 고르자. 행동력은 하루 2번.' : '오늘 할 일은 끝났다.'}</p>`}
      </div>
      ${UI.pick === 'shop' ? shopPicker() : UI.pick === 'gift' ? giftPicker() : UI.pick === 'title' ? titlePicker() : UI.pick === 'study' ? studyPicker() : UI.pick === 'talk' ? `
        <div class="picker"><div class="picker-head"><b>누구와 이야기할까?</b><button class="link" data-act="unpick">취소</button></div>
          <div class="pick-grid">${friends.map(id => `<button class="pick" data-act="talk" data-arg="${id}">${avatar(id)}<span><b>${esc(CHARACTERS[id].name)}${S.partner === id ? ' ♥' : S.crush === id ? ' ♡' : ''}</b><small>${esc(CHARACTERS[id].role)}</small></span></button>`).join('')}</div></div>`
      : UI.pick === 'hangout' ? hangPicker()
      : UI.pick === 'explore' ? `
        <div class="picker"><div class="picker-head"><b>어디로 가 볼까?</b><button class="link" data-act="unpick">취소</button></div>
          <div class="pick-grid">${Object.entries(LOCATIONS).filter(([k, l]) => !l.locked || S.flags.roofOpen).map(([k, l]) => `<button class="pick loc" data-act="explore" data-arg="${k}"><span><b>${l.name}</b><small>${l.desc} · 방문 ${S.visits[k] || 0}</small></span></button>`).join('')}</div></div>`
      : `<div class="actions">${Object.entries(ACTIONS).filter(([k]) => (k !== 'club' || S.club) && (k !== 'auto' || S.autoClub) && (k !== 'council' || S.council) && (k !== 'hangout' || FRIEND_IDS.some(id => S.met[id]))).map(([k, a]) => `
          <button class="action" data-act="${k}" ${S.ap > 0 ? '' : 'disabled'}><span class="stamp">${a.mark}</span><span><b>${a.label}</b><small>${a.hint}</small></span></button>`).join('')}</div>`}
      <div class="day-end">
        <button class="btn" data-act="shop">매점 · ${won(S.money)}</button>
        <button class="btn ${S.ap === 0 ? 'primary' : ''}" data-act="endday">${S.ap === 0 ? '하루 마치기 →' : `하루 일찍 마치기 (남은 행동력 → 휴식)`}</button>
      </div>
    </section>

    <nav class="mob-tabs" role="tablist" aria-label="내 정보">${[['me', '내 정보'], ['rel', '인간관계'], ['log', '생활 일지']].map(([k, l]) => `<button role="tab" aria-selected="${(UI.gtab || 'me') === k}" data-act="gtab" data-arg="${k}">${l}</button>`).join('')}</nav>
    <aside class="panel side rel">
      <h3 class="sec-title">인간관계</h3>
      <ul class="friends">${friends.map(id => { const t = affTier(S.aff[id]); const n = (S.cameo || {})[id] || 0; const lab = S.partner === id ? `${S.loveSecret ? '비밀 연애' : '연인'} ♥${S.love[id]}${(S.loveTension || 0) >= 20 ? ` · 서운함 ${S.loveTension}` : ''}${(S.coupleItems || []).length ? ` · 커플템 ${S.coupleItems.length}` : ''}` : S.crush === id ? `썸 ♡${S.love[id]}` : CHARACTERS[id].isTeacher ? TEACHER_TIER_LABEL[t] : S.mode === 'classic' ? TIER_LABEL[t] : `${TIER_LABEL[t]} <span class="stars">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</span>`; return `
        <li>${avatar(id, 'sm')}<div><b>${esc(CHARACTERS[id].name)}</b><span class="heart"><i style="width:${S.aff[id]}%"></i></span></div><small>${lab}</small></li>`; }).join('')}
        ${S.mode === 'classic' ? FRIEND_IDS.filter(id => !S.met[id]).map(() => '<li class="unknown"><span class="avatar sm">?</span><div><b>아직 못 만난 친구</b><span class="heart"></span></div><small>탐험해 보자</small></li>').join('')
          : FRIEND_IDS.filter(id => !S.met[id]).map(id => `<li class="unknown">${avatar(id, 'sm')}<div><b>${esc(CHARACTERS[id].name)}</b><small>${esc(CHARACTERS[id].role)}</small></div><small>아직 못 만남</small></li>`).join('')}
      </ul>
      ${S.mode === 'classic' ? `<h3 class="sec-title">학교 친구들</h3>
      <ul class="friends">${rosterIds(S).map(id => { const n = (S.cameo || {})[id] || 0; return `<li class="${n ? '' : 'unknown'}">${avatar(id, 'sm')}<div><b>${esc(CAMEOS[id].name)}</b><small>${esc(CAMEOS[id].role)}</small></div><small class="stars">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</small></li>`; }).join('')}</ul>` : ''}
    </aside>
    <aside class="panel side journal">
      <h3 class="sec-title">생활 일지</h3>
      <ol class="log">${S.log.slice(0, 7).map(l => `<li>${esc(l)}</li>`).join('') || '<li>아직 기록이 없다.</li>'}</ol>
    </aside>
  </main>`;
}

function shopPicker() {
  const can = id => { const it = SHOP[id]; if ((S.money || 0) < it.price) return '용돈 부족';
    if (it.love && !(S.partner || S.crush)) return '썸·연인이 없음'; if (id === 'keyring' && S.flags.keyring === semKey(S)) return '이번 학기엔 이미 줬다';
    if (id === 'pen' && S.flags.pen) return '이미 가지고 있다'; return ''; };
  return `<div class="picker"><div class="picker-head"><b>매점 · 용돈 ${won(S.money)}</b><button class="link" data-act="unpick">닫기</button></div>
    <div class="pick-grid">${Object.entries(SHOP).filter(([, it]) => !it.love || S.mode === 'classic').map(([id, it]) => { const why = can(id);
      return `<button class="pick" data-act="buy" data-arg="${id}" ${why ? 'disabled' : ''}><span class="subj-m">${(it.price / 1000).toFixed(1)}</span><span><b>${it.name}</b><small>${why || it.desc} · ${won(it.price)}</small></span></button>`; }).join('')}</div>
    <p class="fine">하루 용돈 ${won(ALLOWANCE)}. 사는 데 행동력은 들지 않는다.</p></div>`;
}
function hangPicker() {
  const who = UI.hangWho;
  if (!who) return `<div class="picker"><div class="picker-head"><b>누구랑 약속을 잡을까?</b><button class="link" data-act="unpick">취소</button></div>
    <div class="pick-grid">${FRIEND_IDS.filter(id => S.met[id]).map(id => `<button class="pick" data-act="hangout" data-arg="${id}">${avatar(id)}<span><b>${esc(CHARACTERS[id].name)}${S.partner === id ? ' ♥' : S.crush === id ? ' ♡' : ''}</b><small>${S.likedPlace[id] ? `좋아하는 곳: ${PLACES[favPlace(id)].name}` : '좋아하는 곳: ???'}</small></span></button>`).join('')}</div></div>`;
  return `<div class="picker"><div class="picker-head"><b>${esc(CHARACTERS[who].name)}${josa(CHARACTERS[who].name, '과', '와')} 어디 갈까?</b><button class="link" data-act="hangout">← 친구 다시 고르기</button></div>
    <div class="pick-grid">${Object.entries(isLove(who) ? Object.assign({}, DATE_PLACES, PLACES) : PLACES).map(([k, p]) => { const poor = (S.money || 0) < p.cost;
      const fav = DATE_PLACES[k] ? S.likedPlace['date_' + who] && DATE_FAV[who] === k : S.likedPlace[who] && favPlace(who) === k;
      return `<button class="pick loc" data-act="hangout" data-arg="${who}|${k}" ${poor ? 'disabled' : ''}><span><b>${DATE_PLACES[k] ? '♥ ' : ''}${p.name}${fav ? ' ★' : ''}</b><small>${poor ? '용돈 부족' : p.cost ? won(p.cost) : '무료'}</small></span></button>`; }).join('')}</div>
    <p class="fine">친구마다 제일 좋아하는 장소가 있다. 맞히면 친밀도가 크게 오른다.</p></div>`;
}
function giftPicker() {
  return `<div class="picker"><div class="picker-head"><b>누구에게 소보로빵을 줄까?</b><button class="link" data-act="unpick">취소</button></div>
    <div class="pick-grid">${FRIEND_IDS.filter(id => S.met[id]).map(id => `<button class="pick" data-act="gift" data-arg="${id}">${avatar(id)}<span><b>${esc(CHARACTERS[id].name)}</b><small>${esc(CHARACTERS[id].role)}</small></span></button>`).join('')}</div></div>`;
}
function buyItem(id, target) {
  const it = SHOP[id];
  if ((S.money || 0) < it.price) return;
  const r = withDiff(() => {
    S.money -= it.price;
    if (id === 'choco') { G.fat(-8); G.add('luck', 1); return '초코우유 한 팩에 기분이 좋아졌다.'; }
    if (id === 'energy') { G.fat(-20); return '에너지 음료를 원샷했다. 눈이 번쩍 뜨였다.'; }
    if (id === 'pen') { S.flags.pen = 1; return '금색 행운의 볼펜을 샀다. 다음 시험 때 쓰자.'; }
    if (id === 'keyring') { const w = S.partner || S.crush; S.love[w] = clamp(S.love[w] + 8); S.flags.keyring = semKey(S); if (S.partner === w) { addCoupleItem('은행잎 키링'); loveTouch(w, 10); } return `${CHARACTERS[w].name}에게 은행잎 키링을 줬다. 다음 날, 그 키링이 가방에 달려 있었다.`; }
    if (id === 'summary') { subjectsOf(S).forEach(sub => { S.mastery[sub.key] = clamp(mastery(sub) + 2); }); return '과목별 요약 노트 세트를 샀다. 한 번 훑어보니 정리가 된다. (모든 과목 숙련도 +2)'; }
    if (id === 'bread') { G.aff(target, 7); if (S.partner === target || S.crush === target) { S.love[target] = clamp(S.love[target] + 4); loveTouch(target, 8); } const n = CHARACTERS[target].name; return `${n}에게 소보로빵을 건넸다. "오, 웬일이야?" ${n}${josa(n, '이', '가')} 반을 갈라 다시 내밀었다.`; }
  });
  S.result = { title: `매점 · ${it.name}`, text: r.text + ` (남은 용돈 ${won(S.money)})`, diffs: r.diffs, notes: r.notes };
  UI.pick = null; SFX.play('pop'); postChecks(); save(); render();
}

function titlePicker() {
  return `<div class="picker"><div class="picker-head"><b>칭호 고르기 · ${(S.titles || []).length} / ${Object.keys(TITLES).length}</b><button class="link" data-act="unpick">닫기</button></div>
    <div class="pick-grid">${(S.titles || []).map(id => `<button class="pick ${S.title === id ? 'on' : ''}" data-act="title-set" data-arg="${id}"><span><b>「${esc(TITLES[id].name)}」</b><small>${esc(TITLES[id].desc)}</small></span></button>`).join('')}</div></div>`;
}

function studyPicker() {
  const subs = subjectsOf(S);
  return `<div class="picker"><div class="picker-head"><b>어떤 과목을 공부할까?</b><button class="link" data-act="unpick">취소</button></div>
    <div class="pick-grid">${subs.map((sub, i) => { const m = mastery(sub); const sf = mateOf(sub.friend), mate = sf && S.met[sf] ? ` · ${CHARACTERS[sf].name}` : '';
      return `<button class="pick subj" data-act="study" data-arg="${i}"><span class="subj-m">${m}</span><span><b>${esc(sub.name)}</b><small>${sub.abs ? '절대평가' : `수강 ${sub.size}명`}${mate}</small><span class="heart mastery"><i style="width:${m}%"></i></span></span></button>`; }).join('')}
      <button class="pick subj" data-act="study" data-arg="all"><span class="subj-m">全</span><span><b>골고루 복습</b><small>모든 과목 조금씩</small></span></button>
      ${S.wrongNote.length ? `<button class="pick subj" data-act="study" data-arg="wrong"><span class="subj-m">誤</span><span><b>오답노트 복습</b><small>${S.wrongNote.length}문제 · 다시 맞히면 숙련도 크게 ↑</small></span></button>` : ''}
    </div></div>`;
}

function renderCourse() {
  const c = courseState();
  const key = semKey(S), cur = CURRICULUM[key];
  const chooseTrack = S.year === 2 && S.sem === 1;
  const needTrack = chooseTrack && !c.track;
  const groups = needTrack ? [] : courseGroups(key, c.track, takenBefore(S));
  return `
  <section class="course">
    <header class="sheet-head">
      <p class="eyebrow">교육과정 편제표 · 고교학점제</p>
      <h2>${S.year}학년 ${S.sem}학기 수강신청</h2>
      <p class="sit-text">${chooseTrack ? '2학년부터는 계열을 정한다. 계열은 3학년까지 이어지고, 계열 과목과 공통 과목 중에서 고를 수 있다.' : '선택군마다 정해진 개수만큼 고른다. 나머지 공통과목은 모두 같이 듣는다.'}</p>
    </header>
    <p class="fine">내신 5등급은 과목별 수강 인원으로 산정돼. 수강 인원이 적은 과목은 1등급(상위 10%) 자리도 적다. 예술 과목은 등급 없이 A·B·C로 평가한다.</p>
    <div class="paper"><h3 class="sec-title">공통·일반과목 · 모두 수강</h3><ul class="subject-tags">${cur.core.map(([n, , cr]) => `<li>${n} <small>${cr}학점</small></li>`).join('')}</ul></div>
    ${chooseTrack ? `<h3 class="sec-title">계열 선택</h3><div class="track-pick">${Object.entries(TRACKS).map(([k, t]) => `
      <button class="track ${c.track === k ? 'on' : ''}" data-act="course-track" data-arg="${k}" aria-pressed="${c.track === k}"><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>`
      : S.track ? `<p class="track-tag">계열: ${TRACKS[S.track].name}</p>` : ''}
    ${needTrack ? '<p class="sit-text">먼저 계열을 골라 줘.</p>' : groups.map((g, gi) => { const picks = c.picks[gi] || [];
      return `<div class="course-group">
      <h3 class="sec-title">${esc(g.title)} · ${g.pick > 1 ? `${g.pick}개 선택` : '택1'} <span class="cg-count ${picks.length === g.pick ? 'ok' : ''}">${picks.length} / ${g.pick}</span></h3>
      <div class="course-grid">${g.list.map(e => { const on = picks.includes(e.name); const full = !on && picks.length >= g.pick && g.pick > 1;
        return `<button class="course-card ${on ? 'on' : ''}" data-act="course-toggle" data-arg="${gi}|${esc(e.name)}" ${full ? 'disabled' : ''} aria-pressed="${on}">
          <span class="cc-top"><b>${esc(e.name)}</b><span class="cc-area">${e.tag ? TRACKS[e.tag].name : e.area}</span></span>
          ${e.note ? `<small>${esc(e.note)}</small>` : ''}
          <span class="cc-meta">${e.credits}학점 · ${e.graded === false ? '성취평가 A·B·C' : e.abs ? '절대평가 A~E · 내신 등급 없음' : `수강 ${e.size}명 · 1등급 ${Math.max(1, Math.floor(e.size * 0.1))}명`}</span>
          ${mateOf(e.friend) ? `<span class="cc-friend">${avatar(mateOf(e.friend), 'sm')} ${CHARACTERS[mateOf(e.friend)].name}${S.met[mateOf(e.friend)] ? '' : '(아직 모르는 친구)'}도 신청</span>` : ''}
          ${e.perk ? `<span class="cc-perk">${e.graded === false ? '수강하면' : '공부하면'} ${STAT_LABEL[e.perk]}도 오른다</span>` : ''}
        </button>`; }).join('')}</div></div>`; }).join('')}
    <div class="create-actions"><button class="btn primary big" data-act="course-confirm" ${courseReady() ? '' : 'disabled'}>수강신청 완료</button></div>
  </section>`;
}

function renderModal() {
  const m = document.getElementById('modal');
  if (!S || !S.cur || UI.screen !== 'game') { m.hidden = true; m.innerHTML = ''; return; }
  const e = EVENTS[S.cur.id], c = S.cur.ctx, r = S.cur.result;
  const who = e.who ? e.who(S, c) : null;
  const typeLabel = { daily: e.rel ? '친구' : '일상', absurd: '병맛 사건', rare: '희귀 이벤트', meet: '첫 만남', char: '친구 이벤트', story: '학교 일정', talk: '말 걸기', club: '자율동아리', love: '연애', council: '학생회', cameo: '친구 에피소드' }[e.type];
  const text = typeof e.text === 'function' ? e.text(S, c) : e.text;
  m.hidden = false;
  // 사건 종류마다 다른 종이: 학교 일정은 가정통신문, 연애는 메시지, 친구 이야기는 앨범 사진, 나머지는 공책 쪽지
  const kind = ['story', 'council', 'club'].includes(e.type) ? 'notice' : e.type === 'love' ? 'sms' : ['cameo', 'char', 'meet'].includes(e.type) || e.rel ? 'photo' : 'note';
  const whoName = who ? esc((CHARACTERS[who] || CAMEOS[who]).name) : '';
  const top = kind === 'notice' ? `<div class="ev-letterhead"><span>양일고등학교</span><b>${e.type === 'story' ? '가정통신문' : e.type === 'council' ? '학생회 회의록' : '자율동아리 활동 기록'}</b><i class="seal" aria-hidden="true">양일</i></div>`
    : kind === 'sms' ? `<div class="ev-phone">${who ? avatar(who, 'sm') : ''}<b>${whoName}</b><small>${S.partner === who ? (S.loveSecret ? '비밀 연애 중' : '연애 중') : S.crush === who ? '썸' : '메시지'}</small></div>`
    : `<div class="ev-top"><span class="ev-type">${typeLabel}</span>${e.type === 'rare' ? '<span class="ev-new">도감 기록</span>' : ''}</div>`;
  m.innerHTML = `
  <div class="ev-card t-${e.type} k-${kind}" role="dialog" aria-modal="true" aria-labelledby="ev-title">
    ${top}
    <h2 id="ev-title">${esc(eventTitle(e, c))}</h2>
    <div class="ev-body">${who && kind !== 'sms' ? `<div class="speaker">${avatar(who, 'lg')}<small>${whoName}</small></div>` : ''}<p>${esc(text)}</p></div>
    ${r ? `
      <div class="ev-result"><p class="eyebrow">선택: ${esc(r.choice)}</p><p>${esc(r.text)}</p>${diffChips(r.diffs)}${notesHtml(r.notes)}</div>
      <button class="btn primary wide" data-act="evclose" autofocus>확인</button>`
    : `<div class="ev-choices">${choicesOf(e, c).map((ch, i) => { const ok = !ch.req || ch.req(S); const hint = typeof ch.hint === 'function' ? ch.hint() : ch.hint;
        return `<button class="choice" data-act="choose" data-arg="${i}" ${ok ? '' : 'disabled'}><b>${esc(ch.label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}${ok ? '' : `<small>${esc(ch.reqText)}</small>`}</button>`; }).join('')}</div>`}
  </div>`;
  const f = m.querySelector('[autofocus]') || m.querySelector('.choice:not([disabled])');
  if (f) f.focus({ preventScroll: true });
}

function renderReport() {
  const st = S.semStart;
  const fin = S.semGrades.find(g => g.key === semKey(S));
  const setuk = S.setuk.filter(x => x.key === semKey(S));
  const last = S.year === 3 && S.sem === 2;
  const topF = FRIEND_IDS.filter(id => S.met[id]).sort((a, b) => S.aff[b] - S.aff[a]).slice(0, 3);
  return `
  <section class="report">
    <header class="sheet-head">
      <p class="eyebrow">학교생활기록부 · ${S.year}학년 ${S.sem}학기</p>
      <h2>${esc(S.name)}의 학기 결산</h2>
    </header>
    <div class="report-grid">
      <div class="paper">
        <h3 class="sec-title">학기 성적 · 지필 60% + 수행 40%</h3>
        <table class="tbl"><thead><tr><th>과목</th><th>1차</th><th>2차</th><th>수행</th><th>등급</th></tr></thead><tbody>
        ${fin ? fin.subjects.map(x => `<tr><td>${esc(x.name)}</td><td>${x.w[0] ?? '—'}</td><td>${x.w[1] ?? '—'}</td><td>${x.perf}</td><td>${x.letter ? `<span class="gr">${x.letter}</span> <small>절대평가</small>` : `<span class="gr g${x.grade}">${x.grade}</span> <small>${x.rank}/${x.n}</small>`}</td></tr>`).join('') : '<tr><td colspan="5">기록 없음</td></tr>'}
        ${fin ? `<tr class="avg"><td>학점 가중 평균</td><td></td><td></td><td></td><td><b>${fin.grade}</b></td></tr>` : ''}
        </tbody></table>
        <p class="fine">내신 5등급제 · 1등급 상위 10%, 2등급 34%, 3등급 66%, 4등급 90%</p>
      </div>
      <div class="paper">
        <h3 class="sec-title">능력치 변화</h3>
        <table class="tbl"><tbody>${STATS.map(k => { const d = Math.round(S.stats[k]) - Math.round(st.stats[k]); return `<tr><td>${STAT_LABEL[k]}</td><td>${Math.round(S.stats[k])}</td><td class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${d}</td></tr>`; }).join('')}</tbody></table>
      </div>
      <div class="paper">
        <h3 class="sec-title">가까운 친구</h3>
        <ul class="friends">${topF.map(id => `<li>${avatar(id, 'sm')}<div><b>${esc(CHARACTERS[id].name)}</b><span class="heart"><i style="width:${S.aff[id]}%"></i></span></div><small>${TIER_LABEL[affTier(S.aff[id])]}</small></li>`).join('') || '<li>아직 친구가 없다…</li>'}</ul>
        <p class="teacher-note"><b>담임 의견 · 이번 학기 인재상 ${esc(idealOf(S).name)}</b> ${esc(teacherComment())}</p>
      </div>
    </div>
    <div class="paper setuk">
      <h3 class="sec-title">세부능력 및 특기사항 · 이번 학기 ${setuk.length}줄 (누적 ${S.setuk.length}줄)</h3>
      ${setuk.length ? `<ul>${setuk.map(x => `<li><b>${esc(x.subject)}</b> ${esc(x.text)}</li>`).join('')}</ul>` : '<p class="fine">이번 학기엔 기록이 없다. 수행평가에 집중하거나 동아리 성과를 내면 세특이 쌓인다.</p>'}
    </div>
    <div class="create-actions"><button class="btn primary big" data-act="nextsem">${last ? '졸업식장으로 →' : S.sem === 1 ? '여름방학 →' : '겨울방학 →'}</button></div>
  </section>`;
}

function renderVacation() {
  UI.vac = UI.vac || [];
  const season = S.sem === 1 ? '여름' : '겨울';
  const list = VACATION.filter(v => !v.cond || v.cond(S));
  if (S.vac) return `
  <section class="course">
    <header class="sheet-head"><p class="eyebrow">${S.year}학년 ${season}방학</p><h2>방학이 끝났다</h2></header>
    <div class="situation"><p class="sit-text">${esc(S.vac.text)}</p>${diffChips(S.vac.diffs)}${notesHtml(S.vac.notes)}</div>
    <div class="create-actions"><button class="btn primary big" data-act="vac-done">${S.sem === 1 ? '2학기 개학 →' : `${S.year + 1}학년 진급 →`}</button></div>
  </section>`;
  return `
  <section class="course">
    <header class="sheet-head"><p class="eyebrow">${S.year}학년 ${season}방학 · 약 ${S.sem === 1 ? 4 : 8}주</p><h2>방학 계획 세우기</h2>
      <p class="sit-text">방학 동안 할 일을 두 가지 고른다.</p></header>
    <div class="course-grid">${list.map(v => { const on = UI.vac.includes(v.id); const nm = typeof v.name === 'object' ? v.name[S.sem] : v.name;
      return `<button class="course-card ${on ? 'on' : ''}" data-act="vac-toggle" data-arg="${v.id}" aria-pressed="${on}" ${!on && UI.vac.length >= 2 ? 'disabled' : ''}>
        <span class="cc-top"><b>${nm}</b></span><small>${v.desc}</small></button>`; }).join('')}</div>
    <div class="create-actions"><button class="btn primary big" data-act="vac-go" ${UI.vac.length === 2 ? '' : 'disabled'}>이대로 보낸다 (${UI.vac.length} / 2)</button></div>
  </section>`;
}

function doVacation() {
  if (UI.vac.length !== 2) return;
  S._eff = 1; S._act = 'vacation';
  const run = {
    academy: () => { ['국어', '수학', '영어'].forEach(k => { S.mastery[k] = clamp((S.mastery[k] ?? S.stats.study * 0.6) + 6); }); G.grow('study', 3); G.fat(15); return '학원 특강으로 국어·수학·영어 기본기를 다졌다. (국·수·영 숙련도 +6)'; },
    reading: () => { const b = pick(BOOKS); G.grow('study', 2); addSetuk('독서', `방학 중 『${b}』를 읽고 자신의 진로와 연결한 독서 감상문을 작성함.`); return `『${b}』를 읽었다. 생각이 한 뼘 자란 기분이다.`; },
    job: () => { G.add('luck', 3); G.add('rep', 2); G.fat(10); S.money = (S.money || 0) + 8000; return '편의점 알바를 했다. 손님 응대 스킬이 늘었고, 폐기 삼각김밥은 맛있었다. (알바비 +8,000원)'; },
    trip: () => { G.fat(-40); G.grow('social', 3); return S.sem === 1 ? '친구들과 남한강에서 물놀이를 했다. 까맣게 탔다.' : '용문산 눈썰매장에서 하루 종일 놀았다. 볼이 빨개졌다.'; },
    friends: () => { FRIEND_IDS.forEach(id => S.met[id] && G.aff(id, 7)); return '친구들과 노래방, 떡볶이, 영화관 코스를 완주했다.'; },
    volunteer: () => { G.add('rep', 4); G.grow('social', 1); addSetuk('봉사', '방학 중 지역 복지관에서 어르신 디지털 교육 봉사활동에 꾸준히 참여함.'); return '복지관에서 어르신들께 스마트폰 쓰는 법을 알려 드렸다.'; },
    autocamp: () => { const a = AUTO_CLUBS[S.autoClub]; S.autoPts += 3; G.grow(a.stat, 2); G.flag('sciHours'); return `${a.name} 방학 탐구를 했다. ${pick(a.acts)} (자율동아리 활동 +3)`; },
    sleep: () => { G.fat(-100); return '방학 내내 잤다. 개학 전날에야 일어났다.'; },
  };
  const r = withDiff(() => UI.vac.map(id => run[id]()).join('\n'));
  S.vac = r;
  postChecks();
  save(); render();
}

function nextSemesterAfterVacation() {
  UI.vac = [];
  if (S.sem === 1) S.sem = 2; else { S.sem = 1; S.year++; }
  S.day = 1; S.phase = 'day';
  S.semStart = snapshot();
  beginSemester();
}

function renderSettings() {
  const row = (key, title, desc, on) => `<button class="setting ${on ? 'on' : ''}" data-act="set-toggle" data-arg="${key}" aria-pressed="${on}"><span><b>${title}</b><small>${desc}</small></span><span class="toggle">${on ? '켜짐' : '꺼짐'}</span></button>`;
  return `
  <section class="course">
    <header class="sheet-head row"><div><p class="eyebrow">게임 설정</p><h2>설정</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <div class="settings">
      ${row('miniAuto', '미니게임 자동 넘기기', '퀴즈·타이밍·기억력 미니게임을 건너뛰고 바로 진행한다 (효율 ×0.8, 오답노트 복습은 그대로)', SETTINGS.miniAuto)}
      ${row('fast', '빠른 진행', '이벤트 결과 확인 창을 생략하고 상황판에 바로 보여 준다. 모의고사는 자동으로 응시한다.', SETTINGS.fast)}
      ${row('sfx', '효과음', '종소리·팡파르 같은 효과음', SFX.on)}
    </div>
    <p class="fine">설정은 이 브라우저에 저장되고, 진행 중인 게임에도 바로 적용된다.</p>
  </section>`;
}

// 졸업식: 교가 → 롤링페이퍼 → 추억 앨범 → 엔딩 공개
function albumPicks(mem, n) {
  if (mem.length <= n) return mem;
  return Array.from({ length: n }, (_, i) => mem[Math.round(i * (mem.length - 1) / (n - 1))]);
}
function rollingList(s) {
  if (s.mode === 'classic') {
    const list = FRIEND_IDS.filter(id => s.met[id]).concat(['teacher']).map(id => ({ id, name: CHARACTERS[id].name, msg: s.partner === id ? `${ROLLING[id][3]} …그리고, 앞으로도 잘 부탁해. ♥` : ROLLING[id][affTier(s.aff[id])], heart: s.partner === id }));
    return list.concat(CAMEO_IDS.filter(id => (s.cameo || {})[id]).map(id => ({ id, name: CAMEOS[id].name, msg: CAMEO_ROLLING[id][s.cameo[id] - 1] })));
  }
  // 친구 롤링페이퍼는 우정 ★과 친밀도 중 높은 쪽 단계로 고른다
  const lvl = id => Math.max((s.cameo || {})[id] || 0, s.aff[id] >= 85 ? 3 : s.aff[id] >= 50 ? 2 : 1);
  return FRIEND_IDS.filter(id => s.met[id]).sort((a, b) => lvl(b) - lvl(a) || s.aff[b] - s.aff[a])
    .map(id => ({ id, name: CHARACTERS[id].name, msg: CAMEO_ROLLING[id][lvl(id) - 1] }))
    .concat([{ id: 'teacher', name: CHARACTERS.teacher.name, msg: ROLLING.teacher[affTier(s.aff.teacher)] }]);
}
function renderCeremony() {
  const step = UI.cer || 0;
  const head = `<p class="eyebrow center">제${SCHOOL.lastGradNo + 3}회 양일고등학교 졸업식 · 다목적관 강당</p>`;
  if (step === 0) return `
  <section class="ceremony">${head}
    <h2 class="cer-title">졸업을 축하합니다</h2>
    <div class="song"><p class="eyebrow">교가 제창</p>
      <p>하늘의 뜻을 받아 솟아난 새 줄기<br>용문산 푸른 송백 우리 내 굳은 의지</p>
      <p class="song-end">참되고 바르고 알차게<br>선구적인 배움터 양일고교</p></div>
    <p class="sit-text center">${esc(S.name)}의 3년이 오늘 끝난다. 강당 뒤편에 친구들이 롤링페이퍼를 들고 서 있다.</p>
    <div class="create-actions center"><button class="btn primary big" data-act="cer-next">롤링페이퍼 받기 →</button></div>
  </section>`;
  if (step === 1) { const list = rollingList(S); return `
  <section class="ceremony">${head}
    <h2 class="cer-title">롤링페이퍼</h2>
    <div class="rolling">${list.map((r, i) => `<div class="note ${r.heart ? 'heart' : ''}" style="--r:${(i % 5 - 2) * 1.2}deg">${avatar(r.id, 'sm')}<p>${esc(r.msg)}</p><small>— ${esc(r.name)}</small></div>`).join('')}</div>
    <div class="create-actions center"><button class="btn primary big" data-act="cer-next">추억 앨범 넘기기 →</button></div>
  </section>`; }
  if (step === 2) { const mem = albumPicks(S.memories || [], 16); return `
  <section class="ceremony">${head}
    <h2 class="cer-title">3년 추억 앨범</h2>
    ${mem.length ? `<div class="album">${mem.map((m, i) => `<figure class="polaroid t-${m.type}" style="--r:${(i % 4 - 1.5) * 1.6}deg"><span class="when">${esc(m.when)}</span><b>${esc(m.title)}</b><figcaption>${esc(m.choice || '')}</figcaption></figure>`).join('')}</div>` : '<p class="sit-text center">앨범이 비어 있다. 조용한 3년이었다.</p>'}
    <div class="create-actions center"><button class="btn primary big" data-act="cer-end">졸업 엔딩 공개 →</button></div>
  </section>`; }
  return '';
}

// 양일고 교육목표의 네 인재상
const IDEALS = {
  study:   { name: '창의인(創意人)', motto: '알차게', desc: '비판적 사고와 인문적 소양으로 창조적 지식을 창출하는' },
  stamina: { name: '건강인(健康人)', motto: '바르게', desc: '심신의 건강을 도모하여 세계와 공존하고 소통하는' },
  social:  { name: '도덕인(道德人)', motto: '참되게', desc: '배려와 나눔의 실천으로 공동체와 더불어 조화를 이루는' },
  rep:     { name: '자주인(自主人)', motto: '알차게', desc: '성숙한 자아의식과 자율적 자기 계발로 진로를 개척하는' },
  luck:    { name: '자주인(自主人)', motto: '알차게', desc: '성숙한 자아의식과 자율적 자기 계발로 진로를 개척하는' },
};
function idealOf(s) { return IDEALS[STATS.slice().sort((a, b) => s.stats[b] - s.stats[a])[0]]; }

function teacherComment() {
  const top = STATS.slice().sort((a, b) => S.stats[b] - S.stats[a])[0];
  const c = { study: '학업에 대한 집중력이 돋보임.', stamina: '체력이 좋아 교실 분위기에 활력을 줌.', social: '친구들과 두루 원만하게 지냄.', luck: '이상하게 좋은 일이 자주 생기는 학생.', rep: '학교에서 모르는 사람이 없음.' }[top];
  return c + (S.absurd >= 5 ? ' 다만 사건 사고에 자주 휘말리니 주의 요망.' : S.fatigue >= 70 ? ' 휴식도 공부임을 잊지 말 것.' : '');
}

function renderSchool() {
  const sc = SCHOOL;
  return `
  <section class="school">
    <header class="sheet-head row">
      <div><p class="eyebrow">${sc.en} · ${sc.kind}</p><h2>${sc.name}</h2></div>
      <button class="link" data-act="menu">← 메인으로</button>
    </header>
    <div class="motto-stone"><span>교훈</span><b>참되게</b><b>바르게</b><b>알차게</b></div>
    <div class="school-grid">
      <div class="paper">
        <h3 class="sec-title">학교 상징</h3>
        <dl class="kv">
          ${sc.symbols.map(([k, v, d]) => `<div><dt>${k}</dt><dd>${v}</dd><small>${d}</small></div>`).join('')}
        </dl>
      </div>
      <div class="paper">
        <h3 class="sec-title">교육목표 · 인재상</h3>
        <ul class="ideal-list">${Object.values(IDEALS).slice(0, 4).map(i => `<li><b>${i.name}</b><span>${i.desc} 사람</span></li>`).join('')}</ul>
      </div>
      <div class="paper">
        <h3 class="sec-title">재학생 (2026)</h3>
        <dl class="kv">
          <div><dt>총 학생</dt><dd>${sc.students}명</dd><small>남 ${sc.boys} · 여 ${sc.girls}</small></div>
          <div><dt>교원</dt><dd>${sc.teachers}명</dd></div>
          ${[1, 2, 3].map(g => `<div><dt>${g}학년</dt><dd>${sc.grades[g].total}명</dd><small>${sc.grades[g].classes}학급 · 반당 약 ${Math.round(sc.grades[g].total / sc.grades[g].classes)}명</small></div>`).join('')}
          <div><dt>연도별</dt><dd>${sc.yearly.map(([y, n]) => n).join(' → ')}</dd><small>${sc.yearly[0][0]}–${sc.yearly[2][0]}</small></div>
        </dl>
      </div>
      <div class="paper">
        <h3 class="sec-title">내신 등급 (5등급제)</h3>
        <table class="tbl"><thead><tr><th>등급</th><th>누적 비율</th><th>1학년 ${sc.grades[1].total}명 기준</th></tr></thead><tbody>
          ${GRADE_CUTS.map(([g, c], i) => `<tr><td><span class="gr g${g}">${g}</span></td><td>${i ? GRADE_CUTS[i - 1][1] + 1 : 1}–${c}%</td><td>~${Math.floor(sc.grades[1].total * c / 100)}등</td></tr>`).join('')}
        </tbody></table>
        <p class="fine">2025년 고1 입학생부터 적용. 과목별 수강 인원 기준으로 산정되어 과목마다 달라집니다.</p>
      </div>
      <div class="paper">
        <h3 class="sec-title">교육과정 편제표 · 선택군</h3>
        <ul class="curri">${Object.entries(CURRICULUM).map(([k, v]) => `<li><span>${k[0]}학년 ${k[2]}학기</span>${v.groups.map(g => `${esc(g.title)} ${g.pick > 1 ? g.pick + '개' : '택1'}`).join(' · ')}</li>`).join('')}</ul>
        <p class="fine">2025년 입학생 편제표 기준. 공통과목의 학기 배치와 수강 인원은 게임용 설정입니다.</p>
      </div>
      <div class="paper">
        <h3 class="sec-title">2026학년도 학사일정</h3>
        <ul class="sched">${REAL_SCHEDULE_2026.map(([d, t]) => `<li><span>${d}</span>${t}</li>`).join('')}</ul>
        <h3 class="sec-title">이번 주 급식</h3>
        <ul class="sched">${MENUS.slice(0, 3).map((m, i) => `<li><span>${['10/27', '10/29', '10/30'][i]}</span>${m.join(' · ')}</li>`).join('')}</ul>
      </div>
      <div class="paper wide">
        <h3 class="sec-title">학교 연혁</h3>
        <ol class="history">${sc.history.map(([y, t]) => `<li><span>${y}</span>${t}</li>`).join('')}</ol>
      </div>
      <div class="paper wide">
        <h3 class="sec-title">2025년 교내 동아리</h3>
        <ul class="curri">${Object.entries(CLUB_FIELDS).map(([f, v]) => `<li><span>${f}</span>${v.clubs.join(', ')}</li>`).join('')}</ul>
        <p class="fine">이과 심화 자율동아리: 로보틱스 · 버터구이 · 시드핸즈 · 워터스캔. 효과와 설명은 게임용 설정입니다.</p>
      </div>
      <div class="paper wide">
        <h3 class="sec-title">특색 교육</h3>
        <ul class="ideal-list">${sc.features.map(([k, v]) => `<li><b>${k}</b><span>${v}</span></li>`).join('')}</ul>
        <p class="fine">소재지 ${sc.region} · 공식 홈페이지 <a href="https://yangil-h.goeyp.kr/" target="_blank" rel="noopener">yangil-h.goeyp.kr</a></p>
        <p class="fine">출처: ${sc.source}, 양일고 홈페이지. 이 게임은 학교 공식 콘텐츠가 아닙니다.</p>
      </div>
    </div>
  </section>`;
}

/* ───────── 입력 처리 ───────── */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const act = b.dataset.act, arg = b.dataset.arg;
  switch (act) {
    case 'new': UI.draft = Object.assign(rollCharacter(), { rerolls: 3, name: '' }); UI.screen = 'create'; render(); document.getElementById('name-input').focus(); break;
    case 'reroll': { const nm = document.getElementById('name-input').value.trim(); const r = UI.draft.rerolls - 1; UI.draft = Object.assign(rollCharacter(nm, UI.draft.gender), { rerolls: r, avatar: UI.draft.avatar, name: nm }); render(); break; }
    case 'gender': {
      // 적어 둔 이름은 그대로 둔다
      UI.draft.name = document.getElementById('name-input').value.trim();
      UI.draft.gender = arg;
      render(); break;
    }
    case 'av-step': case 'av-rand': {
      const nm = document.getElementById('name-input').value.trim(); if (nm) UI.draft.name = nm;
      if (act === 'av-rand') UI.draft.avatar = randomAvatar(UI.draft.gender);
      else { const [k, dir] = arg.split('|'); UI.draft.avatar = stepAvatar(UI.draft.avatar, k, +dir); }
      render(); break;
    }
    case 'mode': UI.mode = arg; try { localStorage.setItem('yangil.mode', arg); } catch (e) {} { const nm = document.getElementById('name-input').value.trim(); if (nm) UI.draft.name = nm; } render(); break;
    case 'enroll': { const nm = document.getElementById('name-input').value.trim();
      if (!nm) { toast('이름을 먼저 적어 줘.'); document.getElementById('name-input').focus(); break; }
      UI.draft.name = nm.slice(0, 8); UI.draft.mode = UI.mode; newGame(UI.draft); break; }
    case 'continue': S = store.get(SAVE_KEY, null); if (S) { S.mode = S.mode || 'real'; S.coupleItems = S.coupleItems || []; S.cameo = S.cameo || {}; S.favors = S.favors || {}; S.pairs = S.pairs || {}; S.likedPlace = S.likedPlace || {}; S.love = S.love || {}; S.loveNo = S.loveNo || {}; syncFriends(S); S.titles = S.titles || ['newbie']; S.title = S.title || 'newbie'; UI.screen = ['report', 'course', 'vacation', 'ceremony'].includes(S.phase) ? S.phase : 'game'; UI.cer = 0; S.money = S.money ?? 3000; S.memories = S.memories || []; UI.course = null; UI.vac = []; render(); } break;
    case 'gtab': UI.gtab = arg; render(); break;
    case 'menu': if (S) save(); UI.screen = 'menu'; UI.pick = null; render(); break;
    case 'gallery': UI.screen = 'gallery'; render(); break;
    case 'dex': UI.screen = 'dex'; render(); break;
    case 'school': UI.screen = 'school'; render(); break;
    case 'unpick': UI.pick = null; render(); break;
    case 'rest': case 'exercise': case 'club': case 'auto': case 'council': doAction(act); break;
    case 'sfx': SFX.toggle(); render(); break;
    case 'tut-open': UI.tut = 0; renderTutorial(); break;
    case 'tut-next': UI.tut++; if (UI.tut >= tutorialSteps().length) closeTutorial(); else renderTutorial(); break;
    case 'tut-prev': UI.tut = Math.max(0, UI.tut - 1); renderTutorial(); break;
    case 'tut-close': closeTutorial(); break;
    case 'shop': UI.pick = UI.pick === 'shop' ? null : 'shop'; render(); break;
    case 'buy': if (SHOP[arg].gift) { UI.pick = 'gift'; render(); } else buyItem(arg); break;
    case 'gift': buyItem('bread', arg); break;
    case 'settings': UI.screen = 'settings'; render(); break;
    case 'set-toggle': if (arg === 'sfx') SFX.toggle(); else { SETTINGS[arg] = !SETTINGS[arg]; saveSettings(); } render(); break;
    case 'cer-next': UI.cer = (UI.cer || 0) + 1; render(); window.scrollTo(0, 0); break;
    case 'cer-end': graduate(); break;
    case 'title-pick': UI.pick = UI.pick === 'title' ? null : 'title'; render(); break;
    case 'title-set': S.title = arg; UI.pick = null; save(); render(); break;
    case 'daily': { const k = todayKey(); UI.draft = Object.assign(rollCharacter(null, null, seededRng('yangil-' + k)), { rerolls: 0, daily: k, name: '' }); UI.screen = 'create'; render(); document.getElementById('name-input').focus(); break; }
    case 'vac-toggle': { const i = UI.vac.indexOf(arg); if (i >= 0) UI.vac.splice(i, 1); else if (UI.vac.length < 2) UI.vac.push(arg); render(); break; }
    case 'vac-go': doVacation(); break;
    case 'vac-done': S.phase = 'report'; S.vac = null; nextSemesterAfterVacation(); break;
    case 'study': case 'talk': case 'explore': case 'hangout': doAction(act, arg); break;
    case 'course-track': { const c = courseState(); c.track = arg; c.picks = {}; render(); break; }
    case 'course-toggle': {
      const [gi, name] = [arg.slice(0, arg.indexOf('|')), arg.slice(arg.indexOf('|') + 1)];
      const c = courseState(), pick = courseGroups(semKey(S), c.track, takenBefore(S))[gi].pick;
      const p = c.picks[gi] = c.picks[gi] || [];
      const i = p.indexOf(name);
      if (i >= 0) p.splice(i, 1); else if (pick === 1) p.splice(0, 1, name); else if (p.length < pick) p.push(name);
      render(); break;
    }
    case 'course-confirm': confirmCourse(); break;
    case 'endday': endDay(); break;
    case 'choose': chooseEvent(+arg); break;
    case 'evclose': closeEvent(); break;
    case 'nextsem': nextSemester(); break;
    default: if (act.startsWith('mini-')) miniAction(act, arg); else if (typeof recordsAction === 'function') recordsAction(act, arg, b);
  }
});

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

function boot(data) {
  if (data && data.screen) {
    S = data.S || null; UI.screen = data.screen; UI.rec = data.rec || null;
    if (!S && ['game', 'report', 'course', 'vacation', 'ceremony'].includes(UI.screen)) UI.screen = 'menu';
    if (!UI.rec && UI.screen === 'ending') UI.screen = 'menu';
  }
  render();
}
// index.html이 모든 스크립트를 불러온 뒤 호출한다
function start() {
  window.claude?.hot?.snapshot?.(() => ({ S, screen: UI.screen === 'create' ? 'menu' : UI.screen, rec: UI.rec }));
  window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
}
