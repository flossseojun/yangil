// 학기말 보스전 화면: 보스 그림 · 타이밍 바 · 연출. 규칙은 boss.js
// 2차 정기시험에서 「실력대로 푼다」를 누르면 사건 창 대신 전투 창이 열리고, 끝나면 원래 시험 결과로 이어진다.

/* ───────── 보스 그림 (320×180) ───────── */
const BOSS_EYE = (x, y, r = 7, angry = true) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.85}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 1}" r="${r * 0.45}" fill="#1a1412"/><circle cx="${x + 2.4}" cy="${y - 1.2}" r="${r * 0.16}" fill="#fff"/>${angry ? `<path d="M${x - r - 2} ${y - r - 1} L${x + r} ${y - r + 4}" stroke="#1a1412" stroke-width="3" stroke-linecap="round"/>` : ''}</g>`;
const BOSS_EYE_R = (x, y, r = 7) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.85}" fill="#fff"/><circle cx="${x - 1}" cy="${y + 1}" r="${r * 0.45}" fill="#1a1412"/><circle cx="${x + 0.4}" cy="${y - 1.2}" r="${r * 0.16}" fill="#fff"/><path d="M${x + r + 2} ${y - r - 1} L${x - r} ${y - r + 4}" stroke="#1a1412" stroke-width="3" stroke-linecap="round"/></g>`;

const BOSS_ART = {
  ginkgo: ph => ph === 1 ? `
    <g class="boss-fig">
      <ellipse cx="160" cy="172" rx="70" ry="8" fill="#000" opacity=".2"/>
      <path d="M140 172 Q144 120 146 92 L174 92 Q176 120 180 172Z" fill="#7d5a3a" stroke="#5a3f28" stroke-width="2"/>
      <path d="M140 172 Q128 166 118 172 M180 172 Q192 165 204 172" stroke="#5a3f28" stroke-width="5" stroke-linecap="round"/>
      ${[[160, 58, 52], [116, 74, 34], [204, 72, 36], [134, 34, 30], [188, 34, 30], [160, 18, 26]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${['#f2bf19', '#f7d34a', '#e5ad0c', '#f9dc5c', '#f2be1a', '#f7d34a'][i]}" stroke="#c99a0c" stroke-width="1.5"/>`).join('')}
      <circle cx="140" cy="44" r="9" fill="#fff3b0" opacity=".55"/>
      ${BOSS_EYE(146, 112)}${BOSS_EYE_R(174, 112)}
      <path d="M146 134 Q160 124 174 134 Q160 144 146 134Z" fill="#3a2414"/><path d="M151 133 L154 137 L157 133 M163 133 L166 137 L169 133" fill="#fff"/>
      ${[[104, 104], [216, 100], [120, 120], [204, 122]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#e8c46a" stroke="#b08a2e"/>`).join('')}
      <path d="M108 58 l6 -4 4 6 M206 56 l-6 -4 -4 6" stroke="#c99a0c" stroke-width="2" fill="none"/>
    </g>` : `
    <g class="boss-fig">
      <ellipse cx="160" cy="172" rx="70" ry="8" fill="#000" opacity=".2"/>
      <path d="M138 172 Q143 118 146 86 L174 86 Q177 118 182 172Z" fill="#5e4430" stroke="#3e2c1e" stroke-width="2"/>
      <g stroke="#4a3424" stroke-width="5" stroke-linecap="round" fill="none"><path d="M150 90 L120 50 L96 44 M120 50 L112 22"/><path d="M170 90 L202 46 L228 40 M202 46 L212 18"/><path d="M160 88 L160 30 L148 10 M160 30 L174 8"/></g>
      ${[[96, 44], [112, 22], [228, 40], [212, 18], [148, 10], [174, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#eef4ff"/>`).join('')}
      ${BOSS_EYE(146, 112, 8)}${BOSS_EYE_R(174, 112, 8)}
      <path d="M144 136 Q160 126 176 136 Q160 148 144 136Z" fill="#2a1a10"/><path d="M149 135 L152 140 L155 135 M165 135 L168 140 L171 135" fill="#fff"/>
      ${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 41 + 13) % 320}" cy="${(i * 29) % 170}" r="1.6" fill="#fff" opacity=".85"/>`).join('')}
    </g>`,
  led: ph => `
    <g class="boss-fig">
      <ellipse cx="160" cy="172" rx="80" ry="7" fill="#000" opacity=".25"/>
      <rect x="150" y="140" width="20" height="30" fill="#3a3f47"/><rect x="118" y="164" width="84" height="8" rx="3" fill="#2b2f36"/>
      <rect x="66" y="18" width="188" height="124" rx="8" fill="#15181d" stroke="#4a515c" stroke-width="3"/>
      <rect x="74" y="26" width="172" height="108" rx="3" fill="${ph === 1 ? '#1d6fe0' : '#7a2be0'}"/>
      <rect x="74" y="26" width="172" height="108" rx="3" fill="url(#led-grid)" opacity=".35"/>
      <defs><pattern id="led-grid" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M6 0 H0 V6" fill="none" stroke="#000" stroke-width=".8"/></pattern></defs>
      ${ph === 1 ? `<rect x="112" y="58" width="22" height="22" fill="#fff"/><rect x="186" y="58" width="22" height="22" fill="#fff"/><rect x="120" y="66" width="10" height="10" fill="#0b2d63"/><rect x="194" y="66" width="10" height="10" fill="#0b2d63"/>
        <path d="M120 106 H200 V114 H120Z" fill="#fff"/><path d="M128 106 V114 M144 106 V114 M160 106 V114 M176 106 V114 M192 106 V114" stroke="#1d6fe0" stroke-width="3"/>`
      : `<path d="M106 54 l26 10 -26 10Z M214 54 l-26 10 26 10Z" fill="#ffe14d"/><path d="M118 104 Q160 124 202 104 Q160 112 118 104Z" fill="#fff"/>
        <text x="236" y="40" text-anchor="end" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">4K</text>
        ${Array.from({ length: 9 }, (_, i) => `<rect x="74" y="${30 + i * 12}" width="172" height="2" fill="#fff" opacity=".12"/>`).join('')}`}
      <circle cx="244" cy="136" r="2.5" fill="#5dff8a"/>
      <text x="160" y="152" text-anchor="middle" font-size="7" fill="#9aa3ad" font-family="sans-serif">YANGIL HIGH SCHOOL</text>
    </g>`,
  locker: ph => `
    <g class="boss-fig">
      <ellipse cx="160" cy="174" rx="60" ry="6" fill="#000" opacity=".25"/>
      <rect x="114" y="14" width="92" height="160" rx="4" fill="#7f9fb3" stroke="#56778b" stroke-width="3"/>
      ${[0, 1, 2].map(k => `<rect x="126" y="${26 + k * 7}" width="68" height="3" rx="1.5" fill="#56778b"/>`).join('')}
      <rect x="128" y="58" width="64" height="56" rx="6" fill="#2a1414"/>
      <path d="M128 64 ${[0, 1, 2, 3, 4, 5].map(i => `L${136 + i * 10} ${i % 2 ? 64 : 76}`).join(' ')} L192 64Z" fill="#f4f1ea"/>
      <path d="M128 110 ${[0, 1, 2, 3, 4, 5].map(i => `L${136 + i * 10} ${i % 2 ? 110 : 98}`).join(' ')} L192 110Z" fill="#f4f1ea"/>
      <path d="M140 92 Q160 104 180 90 L176 108 Q160 112 144 108Z" fill="#d9536a"/>
      ${BOSS_EYE(140, 44, 7)}${BOSS_EYE_R(180, 44, 7)}
      ${ph === 1 ? `<rect x="196" y="120" width="8" height="14" rx="2" fill="#d9b44a" stroke="#8a6d1a"/>` : `<path d="M206 22 L250 14 L250 172 L206 168Z" fill="#7f9fb3" stroke="#56778b" stroke-width="3"/><rect x="226" y="120" width="8" height="10" rx="2" fill="#8a8a8a" transform="rotate(28 230 125)"/>`}
      ${[[74, 50, -18], [244, 70, 14], [60, 110, 8], [252, 128, -10], [90, 150, 20]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-14" y="-10" width="28" height="20" fill="#fff" stroke="#cfcfcf"/><path d="M-9 -4 H9 M-9 1 H9 M-9 6 H4" stroke="#9aa3ad" stroke-width="1.4"/></g>`).join('')}
    </g>`,
  yaja: ph => `
    <g class="boss-fig ghost">
      <ellipse cx="160" cy="172" rx="50" ry="6" fill="#000" opacity=".25"/>
      <g transform="translate(160 92) scale(${ph === 1 ? 1 : 1.25}) translate(-160 -92)">
        <path d="M112 150 Q108 40 160 34 Q212 40 208 150 Q198 140 190 152 Q180 140 170 152 Q160 140 150 152 Q140 140 130 152 Q120 140 112 150Z" fill="${ph === 1 ? '#f2f5ff' : '#e6dcff'}" opacity=".93" stroke="#c9cfe8" stroke-width="2"/>
        <ellipse cx="142" cy="84" rx="9" ry="12" fill="#1c2240"/><ellipse cx="178" cy="84" rx="9" ry="12" fill="#1c2240"/><circle cx="145" cy="80" r="2.6" fill="#fff"/><circle cx="181" cy="80" r="2.6" fill="#fff"/>
        <ellipse cx="160" cy="112" rx="10" ry="${ph === 1 ? 7 : 11}" fill="#1c2240"/>
        <path d="M112 104 Q92 98 86 84 M208 104 Q228 98 234 84" stroke="${ph === 1 ? '#f2f5ff' : '#e6dcff'}" stroke-width="10" stroke-linecap="round" fill="none"/>
        <text x="236" y="70" font-size="14" fill="#c9d4ff" font-family="sans-serif">Z</text><text x="246" y="54" font-size="10" fill="#c9d4ff" font-family="sans-serif">z</text>
      </g>
    </g>`,
  main: ph => ph === 1 ? `
    <g class="boss-fig">
      <ellipse cx="160" cy="174" rx="120" ry="6" fill="#000" opacity=".25"/>
      <rect x="44" y="40" width="232" height="132" fill="#efe6d4" stroke="#b9a988" stroke-width="2"/>
      <rect x="40" y="34" width="240" height="10" fill="#d8c9a8"/>
      <rect x="120" y="14" width="80" height="26" rx="2" fill="#2e3f63"/><text x="160" y="32" text-anchor="middle" font-size="11" fill="#ffd23f" font-family="Jua, sans-serif">양일고등학교</text>
      ${[0, 1].map(r => Array.from({ length: 8 }, (_, i) => (i === 3 || i === 4) && r === 0 ? '' : `<rect x="${56 + i * 27}" y="${54 + r * 34}" width="18" height="20" fill="#a9d6ef" stroke="#f8f4ea" stroke-width="2"/>`).join('')).join('')}
      <rect x="132" y="50" width="22" height="26" rx="3" fill="#fff"/><rect x="166" y="50" width="22" height="26" rx="3" fill="#fff"/>
      <rect x="138" y="58" width="11" height="13" fill="#c0392b"/><rect x="171" y="58" width="11" height="13" fill="#c0392b"/>
      <path d="M128 46 L156 52 M192 46 L164 52" stroke="#3a2a1a" stroke-width="4" stroke-linecap="round"/>
      <path d="M138 172 V128 Q160 112 182 128 V172Z" fill="#3a2a1a"/><path d="M142 130 L148 138 L154 130 L160 138 L166 130 L172 138 L178 130" stroke="#fff" stroke-width="3" fill="none"/>
      <circle cx="160" cy="27" r="0" fill="none"/>
    </g>` : `
    <g class="boss-fig">
      <g opacity=".35"><rect x="44" y="40" width="232" height="132" fill="#efe6d4"/><rect x="138" y="128" width="44" height="44" fill="#3a2a1a"/></g>
      ${Array.from({ length: 7 }, (_, i) => `<rect x="0" y="${12 + i * 24}" width="320" height="${3 + (i % 3)}" fill="${['#ff2d6f', '#2dd4ff', '#b6ff2d'][i % 3]}" opacity=".35"/>`).join('')}
      <g transform="translate(96 46) scale(1.25)">${typeof avatarSVG === 'function' ? avatarSVG(Object.assign({}, typeof lookOf === 'function' ? lookOf('seojun').av : {}), '게임 제작자 염서준', { expr: 'proud' }).replace('<svg class="avatar-svg"', '<svg x="0" y="0" width="100" height="100"') : ''}</g>
      <g transform="translate(188 118)"><rect x="0" y="0" width="58" height="36" rx="3" fill="#2a2f36"/><rect x="4" y="4" width="50" height="28" fill="#0f1720"/><text x="8" y="16" font-size="6" fill="#5dff8a" font-family="monospace">balance.js</text><text x="8" y="25" font-size="6" fill="#ff8a5d" font-family="monospace">score -= 6</text><path d="M-6 36 H64 L58 42 H0Z" fill="#3a4049"/></g>
    </g>`,
};
function bossBg(id) {
  const b = BOSSES[id];
  if (b.bg === 'school') return `<defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ab8e8"/><stop offset="1" stop-color="#dff0fb"/></linearGradient></defs><rect width="320" height="180" fill="url(#bsky)"/><rect y="150" width="320" height="30" fill="#cdb48a"/>`;
  return (SCENE_BG[b.bg] || SCENE_BG.classroom)();
}
function bossSVG(id, phase = 1, opts = {}) {
  const b = BOSSES[id];
  const night = b.night ? `<rect width="320" height="180" fill="#0b1030" opacity=".62"/><rect class="flicker" x="100" y="0" width="120" height="6" fill="#eaf4ff" opacity=".9"/>` : '';
  return `<svg class="boss-svg" viewBox="0 0 320 180" role="img" aria-label="${esc(phase === 2 && b.phase2 ? b.phase2.name : b.name)}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${bossBg(id)}${night}${BOSS_ART[id](phase)}</svg>`;
}

/* ───────── 전투 흐름 ───────── */
const isBossExam = () => S && S.cur && S.cur.id === 'exam' && !S.cur.result && examName() === '2차 정기시험' && !!bossIdFor(S.year, S.sem);
function openBossBattle() {
  const id = bossIdFor(S.year, S.sem), prep = (S.bossPrep || {})[semKey(S)] || null;
  UI.boss = { B: newBattle(S, id, prep), stage: 'intro', pending: null, pop: null, msg: '' };
  SFX.play('bell'); renderModal();
}
// 시험 점수에 더할 보너스. 화면에서 싸웠으면 그 결과를, 자동 진행(시뮬레이션)이면 자동 전투 결과를 쓴다
function bossExamBonus(s) {
  if (!(examName() === '2차 정기시험' && bossIdFor(s.year, s.sem))) return 0;
  let B = s._bossB, bonus = s._bossBonus;
  if (bonus == null) { const a = autoBattle(s, bossIdFor(s.year, s.sem), (s.bossPrep || {})[semKey(s)] || null); B = a.B; bonus = a.bonus; }
  s._bossB = null; s._bossBonus = null;
  if (B && B.revengeUsed) s.wrongNote.splice(0, B.revengeUsed);
  s.bossLog = s.bossLog || []; s.bossLog.push({ key: semKey(s), bossId: B ? B.id : bossIdFor(s.year, s.sem), done: B ? B.done : 'time', bonus });
  if (B && B.done === 'win' && typeof dexMark === 'function') bossDexWin(B.id);
  s._bossNote = `보스전 보너스 ${bonus >= 0 ? '+' : ''}${bonus}점 · ${BOSSES[B ? B.id : bossIdFor(s.year, s.sem)].name} ${B && B.done === 'win' ? '처치!' : B && B.done === 'lose' ? '패배…' : '시간 종료'}`;
  return bonus;
}
function bossDexWin(id) { const d = loadDex(); d.bosses = d.bosses || {}; d.bosses[id] = (d.bosses[id] || 0) + 1; store.set(DEX_KEY, d); }

// 타이밍 바: 커서가 좌우로 오가고, 누른 순간의 위치로 판정한다
function timingSpeed(B) {
  let dur = S.year === 1 ? 1.15 : S.year === 2 ? 0.95 : 0.8;
  if (B.effects.speed) dur *= 0.6;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur *= 1.6; } catch (e) {}
  return dur;
}
function timingJudge(pos) { const d = Math.abs(pos - 0.5); return d < 0.06 ? 'perfect' : d < 0.17 ? 'good' : d < 0.3 ? 'meh' : 'miss'; }
function startTiming(action) {
  const U = UI.boss;
  if (SETTINGS.miniAuto) return resolveAct(action, 'good');
  U.pending = action; U.stage = 'timing'; U.tStart = performance.now(); U.tDur = timingSpeed(U.B) * 1000;
  renderModal();
}
function pressTiming() {
  const U = UI.boss; if (!U || U.stage !== 'timing') return;
  const t = (performance.now() - U.tStart) / U.tDur, ph = t % 2, pos = ph < 1 ? ph : 2 - ph;
  resolveAct(U.pending, timingJudge(pos), pos);
}
function resolveAct(action, timing, pos) {
  const U = UI.boss, B = U.B, hp0 = B.hp;
  playerAct(B, action, timing);
  const ev = B.last;
  U.pop = { dmg: hp0 - B.hp, timing, taken: ev.taken, blocked: ev.blocked, phase: ev.phaseChange, pos };
  U.msg = bossMsg(B, ev, action);
  U.stage = 'anim'; U.pending = null;
  SFX.play(timing === 'perfect' ? 'fanfare' : ev.dmg ? 'pop' : 'boing');
  renderModal();
  clearTimeout(U.timer);
  U.timer = setTimeout(() => { if (UI.boss !== U) return; U.stage = B.done ? 'result' : 'pick'; U.pop = null; if (B.done) SFX.play(B.done === 'win' ? 'fanfare' : 'boing'); renderModal(); }, ev.phaseChange ? 1700 : 1100);
}
function bossMsg(B, ev, action) {
  const parts = [];
  if (action.type === 'skill' && ev.sub) parts.push(`${ev.sub} 스킬! ${TIMING_NAME[ev.timing]}${ev.mult === 2 ? ' 약점 공격!' : ev.mult === 0.5 ? ' (내성이라 잘 안 들었다)' : ''}`);
  if (action.type === 'revenge') parts.push(`오답노트 복수 공격! ${TIMING_NAME[ev.timing]}`);
  parts.push(...ev.notes.filter(n => !/복수 공격/.test(n)));
  if (ev.phaseChange) parts.push(B.boss.phase2.line);
  else if (ev.taken) parts.push(`보스의 공격! 집중력 −${ev.taken}`);
  return parts.join(' ');
}
function finishBossBattle() {
  const U = UI.boss; if (!U) return;
  S._bossB = U.B; S._bossBonus = battleBonus(U.B);
  clearTimeout(U.timer); UI.boss = null;
  chooseEvent(0);
}

/* ───────── 그리기 ───────── */
const bar = (v, max, cls) => `<span class="bbar ${cls}"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%"></i></span>`;
function bossBattleHtml() {
  const U = UI.boss, B = U.B, ph = bossPhase(B), boss = B.boss;
  const title = `${S.year}학년 ${S.sem}학기 2차 정기시험`;
  const weak = curWeak(B), res = curResist(B);
  const stage = `<div class="boss-stage ${U.pop && U.pop.timing === 'perfect' && FX.on ? 'shake' : ''} ${U.pop && U.pop.dmg ? 'hit' : ''} ${B.phase === 2 && ph.glitch ? 'glitch' : ''}">
    ${bossSVG(B.id, B.phase)}
    <div class="boss-hud"><b>${esc(ph.name)}</b>${bar(B.hp, B.maxHp, 'hp')}<small>${B.hp} / ${B.maxHp}</small></div>
    ${U.pop && U.pop.dmg ? `<span class="dmg-pop ${U.pop.timing}">${U.pop.timing === 'perfect' ? '완벽! ' : ''}−${U.pop.dmg}</span>` : ''}
    ${U.pop && U.pop.blocked ? '<span class="dmg-pop block">막았다!</span>' : ''}
    ${U.pop && U.pop.phase ? `<span class="phase-banner">2단계 · ${esc(ph.name)}</span>` : ''}
  </div>`;
  if (U.stage === 'intro') return `<div class="boss-battle"><p class="eyebrow">${title} · 보스전</p>${stage}
    <p class="boss-line">${esc(boss.intro)}</p>
    <p class="fine">과목 스킬로 공격하세요. 보스가 예고한 과목으로 공격하면 공격하면서 막을 수 있어요. 스킬을 쓰면 타이밍 바가 나와요. 가운데에서 누르면 크리티컬!</p>
    <div class="create-actions center"><button class="btn primary big" data-act="boss-start">전투 시작</button></div></div>`;
  if (U.stage === 'result') {
    const bonus = battleBonus(B), win = B.done === 'win';
    return `<div class="boss-battle"><p class="eyebrow">${title} · 보스전</p>${stage}
      <h3 class="boss-result ${B.done}">${win ? '보스 처치!' : B.done === 'lose' ? '집중력이 바닥났다…' : '시험 종료 종이 울렸다'}</h3>
      <p class="boss-line">${esc(win ? boss.win : B.done === 'lose' ? boss.lose : `「${ph.name}」의 체력이 ${Math.round(B.hp / B.maxHp * 100)}% 남았다.`)}</p>
      <p class="boss-bonus">지필 점수 ${bonus >= 0 ? '+' : ''}${bonus}점</p>
      <div class="create-actions center"><button class="btn primary big" data-act="boss-finish">시험 결과 보기</button></div></div>`;
  }
  let order = B.skills.map((k, i) => i);
  if (B.effects.shuffle) order = order.slice().sort((a, b) => ((a * 7 + B.turn) % 5) - ((b * 7 + B.turn) % 5));
  const busy = U.stage !== 'pick';
  const skills = order.map((i, n) => { const k = B.skills[i], m = skillMult(B, k.area), sealed = B.effects.seal && B.sealed === i, counter = B.intent && B.intent.counter === k.area;
    return `<button class="boss-skill ${m === 2 ? 'weak' : m === 0.5 ? 'resist' : ''} ${counter ? 'counter' : ''}" data-act="boss-skill" data-arg="${i}" ${busy || sealed ? 'disabled' : ''}>
      <span class="key">${n < 9 ? n + 1 : ''}</span><b>${esc(k.subName)}</b><small>Lv.${skillLevel(B, i)}${m === 2 ? ' · 약점' : m === 0.5 ? ' · 내성' : ''}${counter ? ' · 막기' : ''}${sealed ? ' · 잠김' : ''}</small></button>`; }).join('');
  const intent = B.intent ? `<p class="boss-intent">다음 공격 ▶ <b>「${esc(B.intent.name)}」</b> ${B.intent.dmg ? `피해 ${(B.intent.dmg + B.ring) * (B.intent.hits || 1)}` : ''} · <span class="counter-tag">${esc(B.intent.counter)}</span>으로 막을 수 있음<small>${esc(B.intent.desc || '')}</small></p>` : '';
  const timing = U.stage === 'timing' ? `<div class="timing-wrap"><p class="fine">${B.effects.speed ? '졸음 주문! 커서가 빨라졌다. ' : ''}가운데에서 눌러! (스페이스 · 탭)</p>
    <button class="timing-bar" data-act="boss-press" aria-label="타이밍 누르기"><span class="zone meh"></span><span class="zone good"></span><span class="zone perfect"></span><span class="cursor" style="animation-duration:${U.tDur / 1000}s"></span></button></div>` : '';
  return `<div class="boss-battle"><p class="eyebrow">${title} · 턴 ${Math.min(B.turn, B.maxTurns)} / ${B.maxTurns}</p>${stage}
    <p class="boss-weak">약점 <b>${esc(weak || '없음')}</b>${res ? ` · 내성 <b>${esc(res)}</b>` : ''}${B.effects.nerf ? ' · 밸런스 패치: 가장 강한 스킬 −2' : ''}${B.effects.dot ? ' · 은행 냄새가 남아 있다' : ''}${B.effects.stun ? ' · 기절!' : ''}</p>
    ${U.msg ? `<p class="boss-msg">${esc(U.msg)}</p>` : ''}
    ${intent}
    <div class="boss-me"><span>나 · 집중력</span>${bar(B.focus, B.maxFocus, 'focus')}<small>${B.focus} / ${B.maxFocus}</small></div>
    ${timing}
    <div class="boss-skills">${skills}</div>
    <div class="boss-special">
      <button class="btn" data-act="boss-revenge" ${busy || !B.revenge ? 'disabled' : ''}>오답노트 복수 공격 ×${B.revenge}</button>
      ${B.cheer ? `<button class="btn" data-act="boss-cheer" ${busy || B.cheerUsed ? 'disabled' : ''}>응원: ${esc(CHARACTERS[B.cheer].name)}${B.cheerUsed ? ' (사용함)' : ''}</button>` : ''}
    </div></div>`;
}

// 사건 창 그리기를 감싸서, 보스전 중에는 전투 화면을 그린다
const _bossRenderModal = renderModal;
renderModal = function () {
  if (!UI.boss) { const mm = document.getElementById('modal'); if (mm && mm.classList.contains('boss-overlay')) mm.className = 'overlay'; return _bossRenderModal(); }
  const m = document.getElementById('modal');
  if (!S || UI.screen !== 'game') { UI.boss = null; return _bossRenderModal(); }
  m.hidden = false; m.className = 'overlay boss-overlay';
  m.innerHTML = `<div class="card boss-card" role="dialog" aria-label="보스전">${bossBattleHtml()}</div>`;
};

const _bossMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'choose' && arg === '0' && isBossExam() && !UI.boss) { openBossBattle(); return true; }
  if (act === 'boss-start' && UI.boss) { UI.boss.stage = 'pick'; renderModal(); return true; }
  if (act === 'boss-skill' && UI.boss && UI.boss.stage === 'pick') { startTiming({ type: 'skill', i: +arg }); return true; }
  if (act === 'boss-revenge' && UI.boss && UI.boss.stage === 'pick' && UI.boss.B.revenge) { startTiming({ type: 'revenge' }); return true; }
  if (act === 'boss-cheer' && UI.boss && UI.boss.stage === 'pick') { const B = UI.boss.B; playerAct(B, { type: 'cheer' }); UI.boss.msg = B.last ? B.last.notes.join(' ') : ''; SFX.play('pop'); renderModal(); return true; }
  if (act === 'boss-press') { pressTiming(); return true; }
  if (act === 'boss-finish') { finishBossBattle(); return true; }
  return _bossMeta(act, arg);
};
document.addEventListener('keydown', e => {
  const U = UI.boss; if (!U) return;
  if (e.code === 'Space' || e.key === ' ') { if (U.stage === 'timing') { e.preventDefault(); pressTiming(); } else if (U.stage === 'intro') { e.preventDefault(); U.stage = 'pick'; renderModal(); } return; }
  if (U.stage === 'pick' && /^[1-9]$/.test(e.key)) {
    const B = U.B; let order = B.skills.map((k, i) => i);
    if (B.effects.shuffle) order = order.slice().sort((a, b) => ((a * 7 + B.turn) % 5) - ((b * 7 + B.turn) % 5));
    const i = order[+e.key - 1]; if (i != null && !(B.effects.seal && B.sealed === i)) startTiming({ type: 'skill', i });
  }
});
