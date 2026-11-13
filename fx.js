// 화면 연출: 메인 장면(계절·시간대) · 행동 결과 효과 · 하루/학기 전환 · 행동 컷인
// 설정의 「화면 연출」을 끄거나 기기의 '동작 줄이기'가 켜져 있으면 움직임 없이 바로 진행한다.
// 장면 SVG 맨 끝(바깥 svg 닫는 태그 앞)에 그림을 덧붙인다. 안쪽 아바타 svg가 먼저 닫히므로 마지막 태그를 찾는다.
const appendSvg = (svg, extra) => { const i = svg.lastIndexOf('</svg>'); return svg.slice(0, i) + extra + svg.slice(i); };
const FX = {
  get on() { let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {} return SETTINGS.fx !== false && !reduce; },
};

/* ───────── 1. 메인 장면: 오늘의 장소 + 계절 + 시간대 ───────── */
function seasonOf(month) { return month <= 4 && month >= 3 ? 'spring' : month <= 7 && month >= 5 ? 'summer' : month <= 9 ? 'early-fall' : month <= 11 ? 'fall' : 'winter'; }
const SEASON_NAME = { spring: '봄', summer: '여름', 'early-fall': '초가을', fall: '가을', winter: '겨울' };
function seasonOverlay(season) {
  const n = 14, fall = (shape, dur) => Array.from({ length: n }, (_, i) => { const x = (i * 23 + 7) % 320, d = dur + (i % 5) * 0.7, delay = -(i * 0.53) % d;
    return `<g transform="translate(${x} -10)">${shape(i)}<animateTransform attributeName="transform" type="translate" values="${x} -10; ${x + (i % 2 ? 18 : -14)} 95; ${x + (i % 2 ? -6 : 10)} 190" dur="${d}s" begin="${delay}s" repeatCount="indefinite"/></g>`; }).join('');
  if (season === 'spring') return fall(i => `<ellipse rx="3.2" ry="2" fill="#ffc1d6" opacity=".9" transform="rotate(${i * 37})"/>`, 6);
  if (season === 'fall') return fall(i => `<path d="M0 0 q4 -4 8 0 q-4 3 -8 0Z" fill="${['#f2be1a', '#e5ad0c', '#f7d34a'][i % 3]}" transform="rotate(${i * 41})"/>`, 7);
  if (season === 'winter') return `<rect width="320" height="180" fill="#dfeaff" opacity=".12"/>` + fall(i => `<circle r="${1.6 + (i % 3) * .6}" fill="#fff" opacity=".95"/>`, 8);
  if (season === 'summer') return `<circle cx="300" cy="10" r="60" fill="#fff6b0" opacity=".22"/><circle cx="300" cy="10" r="30" fill="#fff6b0" opacity=".25"/>`;
  return '';
}
function timeOverlay(slot, done) {
  if (done) return `<rect width="320" height="180" fill="#1b2a5a" opacity=".38"/><rect width="320" height="180" fill="url(#fx-dusk)" opacity=".5"/>`;
  if (slot >= 1) return `<rect width="320" height="180" fill="url(#fx-dusk)" opacity=".42"/>`;
  return '';
}
const FX_DEFS = `<defs><linearGradient id="fx-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a4c"/><stop offset="1" stop-color="#ffd0a0" stop-opacity="0"/></linearGradient></defs>`;
// 행동별 장소와 소품
const ACT_BG = { study: 'library', exercise: 'field', talk: 'hallway', rest: 'rooftop', club: 'classroom', auto: 'classroom', council: 'classroom', hangout: 'river', job: 'store' };
const ACT_PROP = { study: 'pencil', exercise: 'whistle', explore: 'magnifier', talk: 'bubble', rest: 'zzz', club: 'note', auto: 'flask', council: 'clipboard', hangout: 'bubble' };
function homeScene() {
  const d = dateOf(S.year, S.sem, S.day), season = seasonOf(d.getMonth() + 1), done = S.ap <= 0;
  // 행동 결과에 맞춘 내 표정·몸짓
  const ACT_MOOD = { exercise: { expr: 'laugh', pose: 'cheer' }, rest: { expr: 'sleepy' }, study: { expr: 'proud' }, talk: { expr: 'laugh' }, hangout: { expr: 'laugh', pose: 'v' }, explore: { expr: 'surprised' }, club: { expr: 'smile', pose: 'v' } };
  const myMood = S.fatigue >= 75 ? { expr: 'sleepy' } : S.result && S._act && ACT_MOOD[S._act] ? ACT_MOOD[S._act] : {};
  // 몸을 쓰는 행동은 전신 포즈로
  const ACT_POSE = { exercise: 'run', rest: 'sit', explore: 'walk', hangout: 'walk' };
  const pose = S.result && S._act && ACT_POSE[S._act];
  let bg = S.slot >= 1 ? 'ginkgo' : 'classroom', cast = [Object.assign({ me: true, av: S.avatar || randomAvatar(S.gender) }, myMood, pose ? { full: true, pose } : {})];
  const r = S.result, act = r && S._act;
  if (act) {
    bg = act === 'explore' && typeof LOC_BG !== 'undefined' ? LOC_BG[S._actArg] || 'hallway' : ACT_BG[act] || bg;
    const fid = act === 'talk' || act === 'hangout' ? String(S._actArg || '').split('|')[0] : null;
    if (fid && CHARACTERS[fid] && fid !== 'teacher') cast.push(act === 'hangout' ? { id: fid, expr: 'laugh', full: true, pose: 'walk' } : { id: fid, expr: 'laugh', pose: act === 'talk' ? 'wave' : null });
  }
  if (!act && specialsFor(S.year, S.sem, S.day).includes('exam')) bg = 'classroom';
  let svg = sceneSVG({ bg, cast, label: `${SEASON_NAME[season]} · ${SCENE_BG_NAME[bg] || ''} 장면` });
  // 행동 컷인과 같은 장면에서는 시간대·계절을 덧입힌다
  return appendSvg(svg, `${FX_DEFS}${timeOverlay(S.slot, done)}${FX.on ? seasonOverlay(season) : ''}`);
}
function homeSceneHtml() {
  const d = dateOf(S.year, S.sem, S.day), season = seasonOf(d.getMonth() + 1);
  return `<div class="sit-scene" aria-hidden="false">${homeScene()}<span class="sit-season">${SEASON_NAME[season]} · ${S.ap <= 0 ? '하교 후' : SLOTS[Math.min(S.slot, SLOTS.length - 1)]}</span></div>`;
}

/* ───────── 2. 행동 결과 연출: 숫자 튀어 오르기 · 하트 · 꽃가루 ───────── */
function fxBurst(host, diffs, notes) {
  if (!FX.on || !host) return;
  const layer = document.createElement('div'); layer.className = 'fx-layer'; host.appendChild(layer);
  (diffs || []).slice(0, 6).forEach((x, i) => {
    const el = document.createElement('span'); el.className = 'fx-pop ' + (x.good ? 'up' : 'down');
    el.textContent = `${x.label.replace(' ♥', '')} ${x.label.includes('♥') ? '♥' : ''}${x.d > 0 ? '+' : ''}${x.d}`;
    el.style.left = (12 + (i % 3) * 30) + '%'; el.style.animationDelay = (i * 90) + 'ms'; layer.appendChild(el);
  });
  const hearts = (diffs || []).filter(x => x.label.includes('♥') && x.d > 0).length;
  for (let i = 0; i < Math.min(10, hearts * 5); i++) { const h = document.createElement('i'); h.className = 'fx-heart'; h.textContent = '♥'; h.style.left = (20 + Math.random() * 60) + '%'; h.style.animationDelay = (Math.random() * 400) + 'ms'; layer.appendChild(h); }
  if ((notes || []).some(n => /별명|업적|칭호|★|개화|단짝|레전드/.test(n))) fxConfetti(layer);
  setTimeout(() => layer.remove(), 2200);
}
function fxConfetti(layer) {
  const colors = ['#ffd23f', '#ff8fa3', '#7cc7ff', '#7fe0b0', '#b69cff'];
  for (let i = 0; i < 36; i++) { const c = document.createElement('i'); c.className = 'fx-conf'; c.style.left = Math.random() * 100 + '%'; c.style.background = colors[i % 5]; c.style.animationDelay = (Math.random() * 300) + 'ms'; c.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg'); layer.appendChild(c); }
  SFX.play('rare');
}
// 렌더 뒤에 새 결과가 생겼는지 보고 연출한다
function fxAfterRender() {
  if (UI.screen !== 'game' || !S) return;
  const res = S.result;
  if (res && res !== UI._fxRes) { UI._fxRes = res; fxBurst(document.querySelector('.situation'), res.diffs, res.notes); }
  const er = S.cur && S.cur.result;
  if (er && er !== UI._fxEv) { UI._fxEv = er; fxBurst(document.querySelector('.ev-result'), er.diffs, er.notes); }
}

/* ───────── 3. 하루 · 학기 전환 ───────── */
function fxOverlay(html, ms) {
  if (!FX.on) return;
  let el = document.getElementById('fx-overlay');
  if (!el) { el = document.createElement('div'); el.id = 'fx-overlay'; document.body.appendChild(el); el.addEventListener('click', () => { el.className = ''; el.innerHTML = ''; }); }
  el.innerHTML = html; el.className = 'show';
  clearTimeout(el._t); el._t = setTimeout(() => { el.className = ''; el.innerHTML = ''; }, ms);
}
function fxDayTurn(prevLabel) {
  const today = specialsFor(S.year, S.sem, S.day), exam = today.includes('exam') || today.includes('suneung');
  const special = today.filter(id => STORY_NAMES[id]).map(id => STORY_NAMES[id])[0];
  fxOverlay(`<div class="fx-cal" role="status" aria-live="polite">
    <div class="fx-page old"><small>${S.year}학년 ${S.sem}학기</small><b>${esc(prevLabel)}</b></div>
    <div class="fx-page new"><small>${S.year}학년 ${S.sem}학기</small><b>${esc(dateLabel())}</b>${special ? `<em>${esc(special)}</em>` : ''}</div>
    ${exam ? `<span class="fx-stamp">D-DAY</span>` : ''}
  </div>`, exam ? 1500 : 1100);
}
function fxSemesterTitle() {
  fxOverlay(`<div class="fx-title" role="status" aria-live="polite"><small>새 학기</small><b>${S.year}학년 ${S.sem}학기</b><span>${S.sem === 1 ? '봄바람과 함께 시작!' : '2학기, 다시 힘내자!'}</span></div>`, 1600);
}

/* ───────── 4. 행동 컷인 ───────── */
const CUT_PROPS = {
  pencil: () => `<g transform="translate(232 112)"><rect x="-3" y="-26" width="6" height="34" rx="1" fill="#ffd23f" transform="rotate(30)"><animateTransform attributeName="transform" type="rotate" values="20;40;20" dur=".5s" repeatCount="indefinite"/></rect></g><g transform="translate(206 140)"><rect width="46" height="32" rx="2" fill="#fff" stroke="#ccc"/><path d="M6 10 h30 M6 18 h26 M6 26 h20" stroke="#9ab" stroke-width="2"/></g>`,
  whistle: () => `<g><path d="M40 150 h240" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"><animate attributeName="stroke-dashoffset" values="0;-36" dur=".4s" repeatCount="indefinite"/></path></g><circle cx="250" cy="120" r="10" fill="#fff" stroke="#333"><animate attributeName="cy" values="120;100;120" dur=".6s" repeatCount="indefinite"/></circle>`,
  magnifier: () => `<g transform="translate(236 104)"><circle r="14" fill="#cfe9f7" fill-opacity=".5" stroke="#5d4029" stroke-width="4"/><path d="M10 10 L24 24" stroke="#5d4029" stroke-width="5" stroke-linecap="round"/><animateTransform attributeName="transform" type="translate" values="236 104; 250 96; 236 104" dur=".8s" repeatCount="indefinite"/></g>`,
  bubble: () => `<g transform="translate(160 40)"><rect x="-34" y="-16" width="68" height="30" rx="14" fill="#fff" stroke="#ccc"/><path d="M-6 14 l-6 10 l14 -10Z" fill="#fff"/><circle cx="-14" cy="-1" r="3.5" fill="#999"><animate attributeName="opacity" values=".2;1;.2" dur=".6s" repeatCount="indefinite"/></circle><circle cx="0" cy="-1" r="3.5" fill="#999"><animate attributeName="opacity" values=".2;1;.2" dur=".6s" begin=".2s" repeatCount="indefinite"/></circle><circle cx="14" cy="-1" r="3.5" fill="#999"><animate attributeName="opacity" values=".2;1;.2" dur=".6s" begin=".4s" repeatCount="indefinite"/></circle></g>`,
  zzz: () => `<g font-family="Jua, sans-serif" fill="#fff">${['Z', 'z', 'z'].map((t, i) => `<text x="${200 + i * 14}" y="${90 - i * 14}" font-size="${18 - i * 4}" opacity="0">${t}<animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="${i * .25}s" repeatCount="indefinite"/></text>`).join('')}</g>`,
  note: () => `<g font-size="18" fill="#ffd23f">${['♪', '♫'].map((t, i) => `<text x="${210 + i * 24}" y="80">${t}<animate attributeName="y" values="90;70;90" dur=".7s" begin="${i * .2}s" repeatCount="indefinite"/></text>`).join('')}</g>`,
  flask: () => `<g transform="translate(240 112)"><path d="M-6 -20 h12 v12 l12 22 h-36 l12 -22Z" fill="#cfe9f7" stroke="#557"/><path d="M-14 8 h28 l4 6 h-36Z" fill="#7fe0b0"/><circle cx="0" cy="-26" r="3" fill="#7fe0b0"><animate attributeName="cy" values="-24;-40" dur=".7s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur=".7s" repeatCount="indefinite"/></circle></g>`,
  clipboard: () => `<g transform="translate(236 104)"><rect x="-14" y="-18" width="28" height="36" rx="2" fill="#c48f5c"/><rect x="-10" y="-12" width="20" height="26" fill="#fff"/><path d="M-6 -4 l3 3 l6 -6 M-6 6 l3 3 l6 -6" stroke="#2ecc71" stroke-width="2" fill="none"/></g>`,
};
const ACT_LINE = { study: '집중해서 공부 중…', exercise: '운동장을 달리는 중…', explore: '학교를 둘러보는 중…', talk: '이야기를 나누는 중…', rest: '잠깐 쉬는 중…', club: '동아리 활동 중…', auto: '실험하는 중…', council: '학생회 회의 중…', hangout: '약속 장소로 가는 중…' };
function fxCutin(type, arg, then) {
  if (!FX.on || !ACT_LINE[type]) return then();
  const bg = type === 'explore' && typeof LOC_BG !== 'undefined' ? LOC_BG[arg] || 'hallway' : ACT_BG[type] || 'classroom';
  const fid = type === 'talk' || type === 'hangout' ? String(arg || '').split('|')[0] : null;
  const cast = [{ me: true, av: S.avatar || randomAvatar(S.gender) }].concat(fid && CHARACTERS[fid] && fid !== 'teacher' ? [{ id: fid }] : []);
  const svg = appendSvg(sceneSVG({ bg, cast, label: ACT_LINE[type] }), (CUT_PROPS[ACT_PROP[type]] || (() => ''))());
  let done = false; const go = () => { if (done) return; done = true; const el = document.getElementById('fx-overlay'); if (el) { el.className = ''; el.innerHTML = ''; } then(); };
  fxOverlay(`<div class="fx-cut" role="status" aria-live="polite">${svg}<p>${ACT_LINE[type]}</p></div>`, 950);
  const el = document.getElementById('fx-overlay'); if (el) el.onclick = go;
  setTimeout(go, 900);
}
