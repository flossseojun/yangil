// 학기말 보스전: 보스 데이터와 전투 규칙 (화면은 bossui.js)
// 2차 정기시험에서 공부한 과목 숙련도가 스킬이 되고, 전투 결과가 지필 점수에 ±10점 안쪽으로 더해진다.

const BOSSES = {
  ginkgo: { name: '은행왕', year: 1, sem: 1, bg: 'ginkgo', hp: 120, weak: '과학', resist: '사회',
    intro: '은행나무길 가장 큰 은행나무가 눈을 떴다. "시험지를 내놓아라… 아니, 은행을 받아라!"',
    win: '은행왕이 잎을 다 떨구며 쓰러졌다. "내년 가을에… 다시 보자…"', lose: '은행 냄새에 정신이 아득해졌다.',
    moves: [
      { id: 'bomb', name: '은행 열매 폭탄', dmg: 9, counter: '과학', effect: 'dot', desc: '냄새가 2턴 동안 남아요' },
      { id: 'leaf', name: '낙엽 회오리', dmg: 13, counter: '국어', desc: '노란 잎이 휘몰아쳐요' },
      { id: 'root', name: '뿌리 휘감기', dmg: 11, counter: '수학', effect: 'weaken', desc: '다음 공격이 약해져요' },
    ],
    phase2: { name: '겨울 은행왕', weak: '과학', resist: '국어', line: '잎이 다 떨어졌다. 앙상한 가지가 날카로워진다!',
      moves: [
        { id: 'branch', name: '앙상한 가지 찌르기', dmg: 15, counter: '영어', desc: '세게 찔러요' },
        { id: 'bomb2', name: '꽁꽁 언 은행 폭탄', dmg: 11, counter: '과학', effect: 'dot', desc: '2턴 동안 냄새가 나요' },
      ] } },
  led: { name: '다목적관 LED 스크린', year: 1, sem: 2, bg: 'auditorium', hp: 130, weak: 'rotate', resist: null,
    intro: '다목적관 대형 LED 화면이 켜지더니 얼굴이 떠올랐다. "다음 화면은… 시험 문제입니다."',
    win: '화면에 「신호 없음」이 떴다. 강당이 조용해졌다.', lose: '눈앞이 하얗게 번쩍였다.',
    moves: [
      { id: 'switch', name: '화면 전환', dmg: 8, counter: '영어', desc: '매 턴 약점 과목이 바뀌어요' },
      { id: 'blue', name: '블루스크린', dmg: 6, counter: '과학', effect: 'stun', desc: '막지 못하면 1턴 기절' },
      { id: 'flash', name: '고휘도 섬광', dmg: 13, counter: '사회', desc: '눈이 부셔요' },
    ],
    phase2: { name: 'LED 스크린 · 4K 모드', weak: 'rotate', resist: null, line: '해상도가 올라갔다! 화면이 더 선명하고 더 사나워진다.',
      moves: [
        { id: 'pixel', name: '픽셀 폭격', dmg: 15, counter: '수학', desc: '네모난 빛이 쏟아져요' },
        { id: 'blue2', name: '블루스크린 2.0', dmg: 8, counter: '국어', effect: 'stun', desc: '막지 못하면 1턴 기절' },
      ] } },
  locker: { name: '사물함 미믹', year: 2, sem: 1, bg: 'hallway', hp: 160, weak: '수학', resist: '국어',
    intro: '복도 끝 사물함 문이 덜컹 열리더니 이빨이 보였다. 안에서 시험지가 쏟아진다!',
    win: '사물함 문이 쾅 닫히고 조용해졌다. 안에서 잃어버린 체육복이 나왔다.', lose: '프린트 더미에 깔려 버렸다.',
    moves: [
      { id: 'storm', name: '프린트 폭풍', dmg: 5, hits: 3, counter: '국어', desc: '3연타! 막지 않으면 아파요' },
      { id: 'lock', name: '자물쇠 잠금', dmg: 7, counter: '영어', effect: 'seal', desc: '가장 강한 스킬을 1턴 잠가요' },
      { id: 'gym', name: '묵은 체육복 냄새', dmg: 12, counter: '과학', desc: '정신이 아찔해요' },
    ],
    phase2: { name: '열쇠 잃은 사물함', weak: '수학', resist: '영어', line: '자물쇠가 부서졌다! 문이 미친 듯이 여닫힌다.',
      moves: [
        { id: 'slam', name: '문짝 연타', dmg: 6, hits: 3, counter: '사회', desc: '3연타!' },
        { id: 'lock2', name: '이중 잠금', dmg: 9, counter: '수학', effect: 'seal', desc: '가장 강한 스킬을 1턴 잠가요' },
      ] } },
  yaja: { name: '야자의 유령', year: 2, sem: 2, bg: 'classroom', night: true, hp: 170, weak: '과학', resist: '국어',
    intro: '밤 10시, 텅 빈 자습실. 형광등이 깜빡이더니 하얀 유령이 책상 위로 떠올랐다. "아직… 집에 못 가…"',
    win: '창밖이 밝아지자 유령이 웃으며 사라졌다. "고마워… 이제 나도 하교한다…"', lose: '꾸벅, 책상에 이마를 박았다.',
    moves: [
      { id: 'sleep', name: '졸음 주문', dmg: 7, counter: '과학', effect: 'speed', desc: '2턴 동안 타이밍 바가 빨라져요' },
      { id: 'flicker', name: '형광등 깜빡', dmg: 12, counter: '수학', desc: '눈앞이 깜깜해요' },
      { id: 'bell', name: '밤 10시 종소리', dmg: 15, counter: '영어', desc: '머리가 울려요' },
    ],
    phase2: { name: '새벽 2시 유령', weak: '과학', resist: '수학', line: '시계가 새벽 2시를 가리킨다. 유령이 두 배로 커졌다!',
      moves: [
        { id: 'sleep2', name: '깊은 졸음 주문', dmg: 9, counter: '사회', effect: 'speed', desc: '2턴 동안 타이밍 바가 빨라져요' },
        { id: 'chill', name: '오싹한 한기', dmg: 17, counter: '국어', desc: '등골이 서늘해요' },
      ] } },
  main: { name: '양일고 본관', year: 3, sem: 1, bg: 'school', hp: 220, weak: '사회', resist: '영어',
    intro: '땅이 흔들리더니 본관 건물이 일어섰다. 창문이 눈처럼 번쩍인다. "3년 동안 잘 다녔지? 마지막 시험이다!"',
    win: '「…밸런스 다시 맞추러 간다.」 염서준이 노트북을 덮고 도망갔다. 본관이 조용히 제자리에 앉았다.', lose: '「이번 판은 내가 이겼다. 다음 판에서 보자.」 염서준이 씩 웃었다.',
    moves: [
      { id: 'laser', name: '교칙 레이저', dmg: 14, counter: '사회', desc: '교칙이 빛이 되어 날아와요' },
      { id: 'ring', name: '종소리 충격파', dmg: 10, counter: '국어', effect: 'ring', desc: '종이 울릴 때마다 보스가 강해져요' },
      { id: 'rush', name: '현관 돌진', dmg: 16, counter: '수학', desc: '건물이 통째로 돌진해요' },
    ],
    phase2: { name: '게임 제작자 염서준', weak: 'rotate', resist: 'rotate', glitch: true,
      line: '화면이 지지직거린다. "잠깐, 여기서 끝나면 재미없지." 노트북을 든 염서준이 난입했다!',
      moves: [
        { id: 'patch', name: '밸런스 패치', dmg: 8, counter: '수학', effect: 'nerf', desc: '가장 강한 스킬을 2턴 동안 약하게 해요' },
        { id: 'bug', name: '버그 소환', dmg: 12, counter: '과학', effect: 'shuffle', desc: '스킬 카드 순서가 뒤섞여요' },
        { id: 'hotfix', name: '핫픽스', dmg: 0, counter: '영어', effect: 'heal', desc: '체력을 한 번 회복해요' },
        { id: 'diff', name: '난이도 조정 −6점', dmg: 16, counter: '국어', desc: '아프다…' },
      ] } },
};
const BOSS_ORDER = ['ginkgo', 'led', 'locker', 'yaja', 'main'];
const TIMING_MULT = { perfect: 1.5, good: 1, meh: 0.6, miss: 0.2 };
const TIMING_NAME = { perfect: '완벽!', good: '좋음', meh: '아쉬움', miss: '빗나감' };

function bossIdFor(year, sem) { return BOSS_ORDER.find(id => BOSSES[id].year === year && BOSSES[id].sem === sem) || null; }
const bossPhase = B => B.phase === 2 && B.boss.phase2 ? B.boss.phase2 : B.boss;
const bossName = B => bossPhase(B).name;
function curWeak(B) { const w = bossPhase(B).weak; return w === 'rotate' ? B.rotWeak : w; }
function curResist(B) { const r = bossPhase(B).resist; return r === 'rotate' ? B.rotResist : r; }
function skillMult(B, area) { return area === curWeak(B) ? 2 : area === curResist(B) ? 0.5 : 1; }

// 친구 응원: 성격별로 효과가 다르다 (진지 → 회복, 장난 → 다음 공격 2배, 호기심 → 이번 턴 공격 막기)
const CHEER_EFFECT = { sincere: 'heal', playful: 'double', curious: 'shield' };
const CHEER_TEXT = { heal: '집중력을 25 회복해 줬다', double: '다음 공격을 2배로 만들어 줬다', shield: '보스의 다음 공격을 막아 줬다' };
function cheerOf(id) { const sig = typeof TALK_SIG !== 'undefined' && TALK_SIG[id]; const likes = sig ? sig[1].split(':')[1] : 'sincere'; return CHEER_EFFECT[likes] || 'heal'; }

function rotate(B, rng) {
  const areas = [...new Set(B.skills.map(k => k.area))];
  const pick = ex => { const c = areas.filter(a => !ex.includes(a)); return c.length ? c[Math.floor(rng() * c.length)] : areas[0]; };
  B.rotWeak = pick([B.rotWeak]);
  B.rotResist = pick([B.rotWeak, B.rotResist]);
}
function pickMove(B, rng) {
  const ms = bossPhase(B).moves.filter(m => !(m.effect === 'heal' && B.healed));
  return ms[Math.floor(rng() * ms.length)];
}

function newBattle(s, bossId, prep, rng = Math.random) {
  const boss = BOSSES[bossId];
  const eq = (prep && prep.equip) || {};
  const skills = subjectsOf(s).map(sub => ({ subName: sub.name, area: sub.area, level: Math.max(1, Math.floor(mastery(sub) / 10) + (eq[sub.name] || 0)) }));
  const fans = FRIEND_IDS.filter(id => s.met[id] && (s.aff[id] || 0) >= 70 && !(CHARACTERS[id] && CHARACTERS[id].isTeacher)).sort((a, b) => s.aff[b] - s.aff[a]);
  const focus = Math.round(100 - Math.max(0, (s.fatigue || 0) - 50) / 2);
  const B = { id: bossId, boss, hp: boss.hp, maxHp: boss.hp, phase: 1, focus, maxFocus: focus, turn: 1, maxTurns: 8, skills,
    revenge: Math.min(3, (s.wrongNote || []).length), revengeUsed: 0, cheer: fans[0] || null, cheerUsed: false,
    effects: {}, ring: 0, healed: false, log: [], done: null, last: null };
  rotate(B, rng);
  B.intent = pickMove(B, rng);
  return B;
}

function strongest(B) { let bi = 0; B.skills.forEach((k, i) => { if (k.level > B.skills[bi].level) bi = i; }); return bi; }
function skillLevel(B, i) { return Math.max(1, B.skills[i].level - (B.effects.nerf && B.nerfSkill === i ? 2 : 0)); }

// 플레이어 행동 하나 → 데미지 → 2단계 → 보스 반격 → 다음 예고. B를 직접 바꾸고 돌려준다
function playerAct(B, action, timing = 'good', rng = Math.random) {
  if (B.done) return B;
  const ev = { turn: B.turn, action: action.type, timing, dmg: 0, blocked: false, taken: 0, notes: [] };
  // 응원은 턴을 쓰지 않는다
  if (action.type === 'cheer') {
    if (!B.cheer || B.cheerUsed) return B;
    B.cheerUsed = true; const eff = cheerOf(B.cheer);
    if (eff === 'heal') B.focus = Math.min(B.maxFocus, B.focus + 25);
    if (eff === 'double') B.effects.double = 1;
    if (eff === 'shield') B.effects.shield = 1;
    ev.notes.push(`${CHARACTERS[B.cheer].name}${josa(CHARACTERS[B.cheer].name, '이', '가')} 응원하러 왔다! ${CHEER_TEXT[eff]}.`);
    B.last = ev; B.log.push(ev); return B;
  }
  const move = B.intent;
  if (B.effects.stun) { B.effects.stun = 0; ev.notes.push('기절해서 이번 턴은 움직이지 못했다…'); }
  else if (action.type === 'revenge' && B.revenge > 0) {
    const top = B.skills[strongest(B)];
    ev.dmg = Math.round((8 + top.level * 2.2) * 2.5 * TIMING_MULT[timing]);
    B.revenge--; B.revengeUsed++; ev.notes.push('오답노트 복수 공격!');
  } else if (action.type === 'skill') {
    const i = action.i, k = B.skills[i];
    if (B.effects.seal && B.sealed === i) { ev.notes.push(`${k.subName} 스킬이 잠겨 있다!`); }
    else {
      ev.dmg = Math.round((8 + skillLevel(B, i) * 2.2) * skillMult(B, k.area) * TIMING_MULT[timing]);
      ev.mult = skillMult(B, k.area); ev.sub = k.subName;
      if (move && move.counter === k.area) ev.blocked = true;
    }
  }
  if (ev.dmg && B.effects.weaken) { ev.dmg = Math.round(ev.dmg * 0.7); B.effects.weaken = 0; }
  if (ev.dmg && B.effects.double) { ev.dmg *= 2; B.effects.double = 0; }
  B.effects.seal = 0;
  B.hp = Math.max(0, B.hp - ev.dmg);
  if (B.phase === 1 && B.boss.phase2 && B.hp > 0 && B.hp <= B.maxHp / 2) { B.phase = 2; ev.phaseChange = true; B.intent = null; }
  if (B.hp <= 0) { B.done = 'win'; B.last = ev; B.log.push(ev); return B; }
  // 보스 반격 (2단계로 막 바뀐 턴은 변신하느라 쉰다)
  if (move && !ev.phaseChange) {
    if (ev.blocked || B.effects.shield) { ev.blocked = true; B.effects.shield = 0; ev.notes.push(`「${move.name}」을(를) 막았다!`); }
    else {
      ev.taken = (move.dmg + B.ring) * (move.hits || 1);
      if (move.effect === 'dot') B.effects.dot = 2;
      if (move.effect === 'weaken') B.effects.weaken = 1;
      if (move.effect === 'stun') B.effects.stun = 1;
      if (move.effect === 'seal') { B.effects.seal = 1; B.sealed = strongest(B); }
      if (move.effect === 'speed') B.effects.speed = 2;
      if (move.effect === 'nerf') { B.effects.nerf = 3; B.nerfSkill = strongest(B); }
      if (move.effect === 'shuffle') B.effects.shuffle = 1;
    }
    if (move.effect === 'ring') B.ring += 2;
    if (move.effect === 'heal' && !B.healed) { B.healed = true; B.hp = Math.min(B.maxHp, B.hp + Math.round(B.maxHp * 0.15)); ev.notes.push('「핫픽스」로 체력을 회복했다!'); }
  }
  if (B.effects.dot) { ev.taken += 5; B.effects.dot--; }
  if (B.effects.speed) B.effects.speed--;
  if (B.effects.nerf) B.effects.nerf--;
  B.focus = Math.max(0, B.focus - ev.taken);
  B.last = ev; B.log.push(ev);
  if (B.focus <= 0) { B.done = 'lose'; return B; }
  B.turn++;
  if (B.turn > B.maxTurns) { B.done = 'time'; return B; }
  rotate(B, rng);
  B.intent = pickMove(B, rng);
  return B;
}

// 지필 점수에 더할 보너스: 처치 +6~+10, 집중력 0 −10~−4, 시간 종료 −4~+5
function battleBonus(B) {
  const left = B.hp / B.maxHp;
  if (B.done === 'win') return 6 + Math.round(4 * Math.max(0, B.focus) / B.maxFocus);
  if (B.done === 'lose') return -10 + Math.round(6 * (1 - left));
  if (B.done === 'time') return Math.round(-4 + 9 * (1 - left));
  return 0;
}

// 화면 없이 끝까지: 「막기 > 약점 > 가장 강한 스킬」, 타이밍은 확률로
function autoBattle(s, bossId, prep, opts = {}) {
  const rng = opts.rng || Math.random, pPerfect = opts.perfect ?? 0.2;
  const B = newBattle(s, bossId, prep, rng);
  const roll = () => { const r = rng(); return r < pPerfect ? 'perfect' : r < pPerfect + 0.5 ? 'good' : r < pPerfect + 0.8 ? 'meh' : 'miss'; };
  let guard = 0;
  while (!B.done && guard++ < 40) {
    if (B.cheer && !B.cheerUsed && B.focus < B.maxFocus * 0.55) { playerAct(B, { type: 'cheer' }, 'good', rng); continue; }
    if (B.revenge > 0 && rng() < 0.35) { playerAct(B, { type: 'revenge' }, roll(), rng); continue; }
    const usable = B.skills.map((k, i) => i).filter(i => !(B.effects.seal && B.sealed === i));
    const score = i => (B.intent && B.intent.counter === B.skills[i].area ? 100 : 0) + skillMult(B, B.skills[i].area) * 10 + skillLevel(B, i);
    const best = usable.sort((a, b) => score(b) - score(a))[0] ?? 0;
    playerAct(B, { type: 'skill', i: best }, roll(), rng);
  }
  return { bonus: battleBonus(B), done: B.done, B };
}

/* ───────── 1차 정기시험 = 전투 준비 ─────────
   1차 결과로 학기말 보스 정보를 공개하고, 잘 본 과목은 +1, 못 본 과목은 −1 장비가 된다 */
function makePrep(s, examEntry) {
  const bossId = bossIdFor(s.year, s.sem); if (!bossId) return null;
  const equip = {};
  ((examEntry && examEntry.subjects) || []).forEach(x => { if (x.grade == null) return; if (x.grade <= 2) equip[x.name] = 1; else if (x.grade >= 4) equip[x.name] = -1; });
  return { bossId, equip };
}
function prepText(prep) {
  if (!prep) return '';
  const b = BOSSES[prep.bossId], up = Object.keys(prep.equip).filter(k => prep.equip[k] > 0), down = Object.keys(prep.equip).filter(k => prep.equip[k] < 0);
  const weak = b.weak === 'rotate' ? '매 턴 바뀜' : b.weak;
  return `\n\n[정찰 보고서] 학기말 보스 「${b.name}」 · 약점 ${weak}${b.resist ? ` · 내성 ${b.resist}` : ''}.` +
    (up.length ? `\n장비 강화: ${up.join(', ')} 스킬 +1` : '') + (down.length ? `\n보스가 노리는 약점: ${down.join(', ')} 스킬 −1` : '') +
    `\n2차 정기시험까지 ${weak === '매 턴 바뀜' ? '여러 과목을 골고루' : weak + ' 과목을'} 공부해 두자.`;
}
const bossDay = sem => sem === 1 ? 6 : 5;
function bossBanner() {
  if (!S || !S.bossPrep) return '';
  const prep = S.bossPrep[semKey(S)]; if (!prep) return '';
  const left = bossDay(S.sem) - S.day; if (left < 0) return '';
  return `<span class="dday boss-dday">학기말 보스: ${esc(BOSSES[prep.bossId].name)} ${left ? 'D-' + left : '오늘!'}</span>`;
}
