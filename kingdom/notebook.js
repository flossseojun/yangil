// 양일 캠퍼스 덧붙이기: 처음 안내 · 자리 비운 동안 생산 · 수첩(오늘 · 도감 · 업적 · 저장) · 양평 명소 · 살아나는 동네
// kingdom.js 다음에 불러오고, window.__kingdom 으로 캠퍼스와 이야기한다.
import { shot } from './chibishot.js';
const K = window.__kingdom, G = K.G, THREE = K.THREE;
const $ = id => document.getElementById(id);
const L = () => K.campusLv();
const dayNum = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / 864e5);
const give = rw => { Object.entries(rw).forEach(([k, n]) => { if (n) G.res[k] = (G.res[k] || 0) + n; }); K.save(); K.hud(); refreshBadge(); };
const canPay = c => Object.entries(c).every(([k, n]) => (G.res[k] || 0) >= n);
const storyOpen = () => !$('story').hidden;
// 이야기 창이 비면 띄운다 (마일스톤 이야기와 겹치지 않게)
function showQ(pages, done) { const go = () => { if (storyOpen()) { setTimeout(go, 500); return; } K.showStory(pages, done); }; go(); }
G.stat = G.stat || {};

/* ───────── 1. 자리 비운 동안 생산 ───────── */
const OFF_RATE = .35, OFF_CAP = 12;   // 시설마다 최대 12번치를 35% 속도로 (창고가 꽉 찬다)
function offline() {
  const now = Date.now(), seen = G.seen; G.seen = now;
  if (!seen || now - seen < 3 * 60 * 1000) return;
  const gain = { know: 0, snack: 0, power: 0 };
  K.FAC_ORDER.forEach(t => { const p = K.prodOf(t); if (!p || !p[1] || !K.facOpen(t)) return; const n = Math.min(OFF_CAP, Math.floor((now - seen) / (p[2] * 1000))); gain[p[0]] += Math.round(n * p[1] * OFF_RATE); });
  if (!gain.know && !gain.snack && !gain.power) return;
  const m = Math.round((now - seen) / 60000), away = m >= 60 * 24 ? `${Math.floor(m / 1440)}일` : m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60 ? m % 60 + '분' : ''}` : `${m}분`;
  showQ([{ t: '다녀왔어?', p: `<b>${away}</b> 동안 친구들이 캠퍼스를 지켰어요.<br>창고에 쌓인 자원이에요.<small style="display:block;color:#7a6d5c;font-size:12px;margin-top:4px">시설 레벨이 높을수록 많이 쌓여요 (최대 ${OFF_CAP}번치)</small>`, art: 'mile', reward: gain, btn: '받기' }], () => { give(gain); KS.fx('coin'); });
}
offline();
let seenT = 0;
K.HOOK.tick.push(dt => { if ((seenT += dt) > 5) { seenT = 0; G.seen = Date.now(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) { G.seen = Date.now(); K.save(); } else offline(); });

/* ───────── 2. 처음 안내 (튜토리얼) ───────── */
if (G.tut == null && (K.lvOfFac('main') >= 1 || G.wins)) G.tut = 99;   // 이미 하던 친구는 건너뛴다
if (G.tut == null) G.tut = 0;
const colSum = () => G.stat.col || 0;
const flags = { req: false, fight: false };
const TUT = [
  { text: '무너진 <b>본관</b>을 눌러서 복구해 보자!', fac: 'main', done: () => K.lvOfFac('main') >= 1 },
  { text: '본관 위에 <b>말풍선</b>이 뜨면 눌러서 지식을 모아요.<br><small>20초쯤 기다리면 떠요</small>', bubble: 'main', start: () => { TUT[1].c0 = colSum(); }, done: () => colSum() > (TUT[1].c0 || 0) },
  { text: '<b>매점</b>도 복구하면 간식이 나와요.', fac: 'store', done: () => K.lvOfFac('store') >= 1 },
  { text: '친구들 부탁을 들어주면 보상을 받아요.<br><b>의뢰</b> 버튼을 눌러 보자!', el: 'b-req', done: () => flags.req },
  { text: '<b>수첩</b>에는 출석 · 오늘의 미션 · 친구 도감 · 업적이 있어요.', el: 'b-note', done: () => flags.note },
  { text: '<b>친구들</b>에서 친구를 강화하고 문구 장비를 끼워요.', el: 'b-friends', done: () => flags.fr },
  { text: '준비 끝! <b>전투</b>로 양평을 차지한 녀석들을 몰아내자.', el: 'b-fight', done: () => flags.fight },
];
const tutEl = document.createElement('div'); tutEl.className = 'tut'; tutEl.hidden = true;
tutEl.innerHTML = '<p></p><button type="button">건너뛰기</button>';
const arrow = document.createElement('div'); arrow.className = 'tut-arrow'; arrow.hidden = true;
arrow.innerHTML = '<svg viewBox="0 0 40 48" width="40" height="48"><path d="M13 3h14v22h10L20 45 3 25h10z" fill="#ffd23f" stroke="#231c17" stroke-width="3.5" stroke-linejoin="round"/></svg>';
document.body.append(tutEl, arrow);
let tutStarted = -1;
function endTut() { G.tut = 99; tutEl.hidden = arrow.hidden = true; K.save(); }
tutEl.querySelector('button').onclick = () => { KS.fx('click'); endTut(); };
const facTop = t => { const m = K.meshes.get(t); return m ? m.position.clone().add(new THREE.Vector3(0, (m.userData.h || 2) + .6, 0)) : null; };
function pointAt(x, y, dir) { arrow.hidden = false; arrow.className = 'tut-arrow ' + dir; arrow.style.left = x + 'px'; arrow.style.top = y + 'px'; }
function stepTut() {
  if (G.tut == null) G.tut = 0;
  if (G.tut >= TUT.length) return;
  const s = TUT[G.tut];
  if (storyOpen() || !$('reqs').hidden || !$('nb').hidden || [...document.querySelectorAll('#fr, #ga, #ev, .modal.join')].some(m => !m.hidden)) { tutEl.hidden = arrow.hidden = true; if (s.done()) nextTut(); return; }
  if (tutStarted !== G.tut) { tutStarted = G.tut; s.start && s.start(); tutEl.querySelector('p').innerHTML = `<b class="n">${G.tut + 1}/${TUT.length}</b> ${s.text}`; }
  tutEl.hidden = false;
  if (s.done()) { nextTut(); return; }
  const up = $('i-up'), info = $('info');
  if (s.fac && info.classList.contains('show') && up && !up.disabled) { const r = up.getBoundingClientRect(); pointAt(r.left + r.width / 2, r.top - 4, 'down'); return; }
  let v = null;
  if (s.fac) v = facTop(s.fac); else if (s.bubble) v = K.bubbles.has(s.bubble) ? K.bubbles.get(s.bubble).position.clone().add(new THREE.Vector3(0, .9, 0)) : null;
  if (v) { const [x, y] = K.toScreen(v); pointAt(x, y, 'down'); return; }
  if (s.el) { const r = $(s.el).getBoundingClientRect(); if (r.width) { pointAt(r.left - 6, r.top + r.height / 2, 'right'); return; } }
  arrow.hidden = true;
}
function nextTut() {
  G.tut++; K.save(); KS.fx('pop');
  if (G.tut >= TUT.length) { endTut(); const rw = { know: 30, snack: 20, power: 10 }; give(rw); K.toast('안내 끝! 선물로 자원을 받았어요'); }
}
K.HOOK.tick.push(() => { if (G.tut < 99) stepTut(); });
$('b-req').addEventListener('click', () => { flags.req = true; });
document.addEventListener('click', e => { if (e.target.closest('#b-fight') && G.tut === TUT.length - 1) { G.tut = 99; K.save(); } }, true);

/* ───────── 3. 출석 · 오늘의 미션 ───────── */
const MISSIONS = {
  col:   { n: 8, text: n => `자원 말풍선 ${n}번 모으기`, cur: () => G.stat.col || 0 },
  talk:  { n: 5, text: n => `친구와 ${n}번 이야기하기`, cur: () => G.stat.talk || 0 },
  gift:  { n: 1, text: () => '친구 선물(!) 받기', cur: () => G.stat.gift || 0 },
  up:    { n: 1, text: () => '시설 1번 복구 · 레벨업', cur: () => G.stat.up || 0 },
  deco:  { n: 1, text: () => '꾸미기 1개 놓기', cur: () => G.stat.deco || 0 },
  reqs:  { n: 1, text: () => '친구 의뢰 1개 들어주기', cur: () => G.stat.reqs || 0 },
  win:   { n: 1, text: () => '전투 1번 이기기', cur: () => G.wins || 0 },
  lvup:  { n: 1, text: () => '친구 1번 강화하기', cur: () => G.stat.lvup || 0 },
};
const attReward = d => ({ know: 20 + d * 10, snack: 15 + d * 8, power: d === 7 ? 40 : d * 4 });
const msReward = () => ({ know: 15 + L() * 3, snack: 10 + L() * 2 });
const allReward = () => ({ know: 20 + L() * 4, snack: 10 + L() * 2, power: 10 + L() * 2 });
function daily() {
  const today = dayNum(); let D = G.daily;
  if (!D || D.day !== today) {
    const keys = Object.keys(MISSIONS).sort(() => Math.random() - .5).slice(0, 3);
    const prev = D || {};
    D = G.daily = { day: today, last: prev.last, streak: prev.streak || 0, best: prev.best || 0, att: false, all: false,
      ms: keys.map(k => ({ k, n: MISSIONS[k].n, base: MISSIONS[k].cur(), got: false })) };
    K.save();
  }
  return D;
}
const msProg = m => Math.min(m.n, MISSIONS[m.k].cur() - m.base);
function claimAtt() {
  const D = daily(); if (D.att) return;
  D.streak = D.last === D.day - 1 ? D.streak + 1 : 1; D.last = D.day; D.best = Math.max(D.best, D.streak); D.att = true;
  G.ticket = (G.ticket || 0) + 1; give(attReward((D.streak - 1) % 7 + 1)); KS.fx('fanfare'); K.toast('출석 선물 · 뽑기권 1장도 받았어요!');
}

/* ───────── 4. 업적 ───────── */
const ZK = ['east', 'back', 'west'];
const ACH = [
  ['first', '첫 삽', '시설 하나를 복구했다', () => K.FAC_ORDER.filter(t => K.lvOfFac(t)).length ? 1 : 0, 1, { know: 20, snack: 10 }],
  ['main3', '본관 3층', '본관을 Lv.3으로', () => K.lvOfFac('main'), 3, { know: 60, snack: 30 }],
  ['main5', '본관 완공', '본관을 Lv.5로', () => K.lvOfFac('main'), 5, { know: 150, snack: 80, power: 40 }],
  ['r25', '기차가 다시 선다', '양평 재건 25%', () => Math.round(K.restore() * 100), 25, { know: 40, snack: 20 }],
  ['r50', '장날이 돌아왔다', '양평 재건 50%', () => Math.round(K.restore() * 100), 50, { know: 80, snack: 50 }],
  ['r100', '다시 우리 동네', '양평 재건 100%', () => Math.round(K.restore() * 100), 100, { know: 300, snack: 200, power: 100 }],
  ['zones', '캠퍼스 넓히기', '별관 · 뒷동산 · 기숙사 구역을 모두 열기', () => ZK.filter(z => G.zones[z]).length, 3, { know: 120, snack: 80, power: 40 }],
  ['f10', '친구 10명', '캠퍼스 친구 10명 모으기', () => G.friends.length, 10, { know: 40, snack: 30 }],
  ['f30', '친구 30명', '캠퍼스 친구 30명 모으기', () => G.friends.length, 30, { know: 120, snack: 80, power: 30 }],
  ['fall', '모두 모였다', `친구 ${ROSTER.length}명 모두 모으기`, () => G.friends.length, ROSTER.length, { know: 300, snack: 200, power: 100 }],
  ['deco10', '꾸미기 장인', '꾸미기 10개 놓기', () => G.b.length, 10, { snack: 50 }],
  ['req10', '부탁 해결사', '친구 의뢰 10개 들어주기', () => G.stat.reqs || 0, 10, { know: 60, snack: 40 }],
  ['gift20', '선물 부자', '친구 선물 20번 받기', () => G.stat.gift || 0, 20, { know: 50, snack: 50 }],
  ['win1', '첫 승리', '전투에서 이기기', () => G.wins || 0, 1, { know: 30, power: 10 }],
  ['win30', '전투 베테랑', '전투 30번 이기기', () => G.wins || 0, 30, { know: 150, snack: 80, power: 60 }],
  ['ch4', '본관 옥상으로', '챕터 4 열기', () => typeof progOf === 'function' && progOf(G, 4) > 0 ? 1 : 0, 1, { know: 100, power: 40 }],
  ['tower', '도전의 탑', '4-5를 깨고 도전의 탑 열기', () => typeof progOf === 'function' && progOf(G, 5) > 0 ? 1 : 0, 1, { know: 150, snack: 80, power: 60 }],
  ['tower10', '탑 10층', '도전의 탑 10층 깨기', () => G.towerBest || 0, 10, { know: 300, snack: 150, power: 100 }],
  ['star30', '별 모으기', '전투 별 30개 모으기', () => typeof totalStars === 'function' ? totalStars(G) : 0, 30, { know: 120, snack: 60, power: 40 }],
  ['pull10', '뽑기 마니아', '친구 뽑기 10번 하기', () => G.stat.pulls || 0, 10, { know: 80, snack: 60 }],
  ['gear5', '문구 부자', '친구 5명에게 장비 끼우기', () => Object.keys(G.gear || {}).length, 5, { know: 100, snack: 60, power: 30 }],
  ['awake1', '첫 각성', '친구 한 명 각성시키기', () => G.stat.awake || 0, 1, { know: 200, snack: 120, power: 60 }],
  ['evdeco', '행사 개근', '학교 행사 한정 꾸미기 받기', () => Object.keys(G.decoUnlock || {}).length, 1, { know: 120, snack: 80 }],
  ['ch7', '시장까지 지켰다', '물맑은시장 챕터 열기', () => typeof progOf === 'function' && progOf(G, 7) > 0 ? 1 : 0, 1, { know: 150, snack: 100, power: 50 }],
  ['att7', '개근상', '7일 연속 출석', () => (G.daily && G.daily.best) || 0, 7, { know: 150, snack: 100, power: 50 }],
];
G.ach = G.ach || {};
const achReady = a => !G.ach[a[0]] && a[3]() >= a[4];

/* ───────── 수첩 창 ───────── */
const nb = document.createElement('div'); nb.className = 'modal'; nb.id = 'nb'; nb.hidden = true; document.body.appendChild(nb);
let tab = 'today', pick = null;
const faceCache = {};
const faceSVG = id => faceCache[id] || (faceCache[id] = svgURL(kitHeadSVG(id)));
const hearts = n => Array.from({ length: 5 }, (_, i) => drawIcon(i < n ? 'heart' : 'heartOff', 13)).join('');
function bar(p, n) { return `<div class="rbar"><i style="width:${Math.min(100, p / n * 100)}%"></i><span>${Math.min(p, n)} / ${n}</span></div>`; }
function tabToday() {
  const D = daily(), d = D.att ? (D.streak - 1) % 7 + 1 : (D.last === D.day - 1 ? D.streak : 0) % 7 + 1;
  const days = Array.from({ length: 7 }, (_, i) => { const n = i + 1, got = D.att ? n <= d : n < d, now = !D.att && n === d; return `<div class="att${got ? ' got' : ''}${now ? ' now' : ''}${n === 7 ? ' big' : ''}"><small>${n}일</small>${drawIcon(got ? 'star' : 'starOff', n === 7 ? 26 : 20)}<span>${resText(attReward(n), 10)}</span></div>`; }).join('');
  const done = D.ms.every(m => m.got);
  return `<h3>출석 <small>${D.streak ? `연속 ${D.att ? D.streak : D.last === D.day - 1 ? D.streak : 0}일` : '매일 들어오면 선물이 커져요'}</small></h3>
    <div class="atts">${days}</div>
    <button class="claim wide" data-att ${D.att ? 'disabled' : ''}>${D.att ? '오늘 출석 완료 · 내일 또 와요' : '출석 도장 찍기 · 뽑기권 1장'}</button>
    <h3>오늘의 미션 <small>밤 12시에 바뀌어요</small></h3>
    ${D.ms.map((m, i) => { const p = msProg(m), ok = p >= m.n; return `<div class="req${ok && !m.got ? ' done' : ''}"><div class="rq"><b>${MISSIONS[m.k].text(m.n)}</b>${bar(p, m.n)}<div class="rw">${resText(msReward(), 13)}</div></div><button class="claim" data-ms="${i}" ${ok && !m.got ? '' : 'disabled'}>${m.got ? '받음' : '받기'}</button></div>`; }).join('')}
    <div class="req${done && !D.all ? ' done' : ''}"><div class="rq"><b>미션 3개 모두 하기</b><div class="rw">${resText(allReward(), 13)}<span class="rs">${drawIcon('star', 13)}뽑기권 1</span></div></div><button class="claim" data-all ${done && !D.all ? '' : 'disabled'}>${D.all ? '받음' : '받기'}</button></div>`;
}
function tabDex() {
  const own = new Set(G.friends);
  let det = '';
  if (pick && own.has(pick)) {
    const f = K.rosterOf(pick), pf = (typeof PROFILES !== 'undefined' && PROFILES[pick]) || { desc: '', lines: [], story: [] }, b = Math.min(5, (G.bond || {})[pick] || 0), st = pf.story || [];
    det = `<div class="dex-d"><img src="${faceSVG(pick)}" alt=""><div><b>${f.name}</b><small>${f.role || ''}</small><p>${pf.desc || ''}</p><div class="hearts">친밀도 ${hearts(b)}</div><small>추억 ${Math.min(st.length, b)} / ${st.length}개 열림 · 함께 전투에서 이기면 친밀도가 올라요</small>${st.slice(0, b).map(x => `<p class="mem"><b>${x.title}</b> ${x.text}</p>`).join('')}</div></div>`;
  }
  return `<h3>친구 도감 <small>${own.size} / ${ROSTER.length}명 · 동아리실에서 모집해요</small></h3>${bar(own.size, ROSTER.length)}${det}
    <div class="dex">${ROSTER.map(f => own.has(f.id) ? `<button class="dx${pick === f.id ? ' on' : ''}" data-dx="${f.id}"><img src="${faceSVG(f.id)}" alt="" loading="lazy"><span>${f.name}</span></button>` : `<div class="dx no"><i>?</i><span>???</span></div>`).join('')}</div>`;
}
function tabAch() {
  const n = ACH.filter(a => G.ach[a[0]]).length;
  return `<h3>업적 <small>${n} / ${ACH.length}개 달성</small></h3>` + ACH.map(a => { const [id, name, desc, cur, goal, rw] = a, got = !!G.ach[id], c = cur(), ok = c >= goal;
    return `<div class="req ach${got ? ' got' : ok ? ' done' : ''}"><span class="medal">${drawIcon(got || ok ? 'star' : 'starOff', 28)}</span><div class="rq"><b>${name}</b><p>${desc}</p>${got ? '' : bar(c, goal)}<div class="rw">${resText(rw, 13)}</div></div><button class="claim" data-ach="${id}" ${ok && !got ? '' : 'disabled'}>${got ? '달성' : '받기'}</button></div>`; }).join('');
}
function tabSave() {
  return `<h3>저장 백업 <small>폰을 바꾸거나 기록이 지워져도 되살릴 수 있어요</small></h3>
    <p class="sv">저장은 이 브라우저에만 돼요. 가끔 <b>저장 코드</b>를 복사해서 카톡 나에게 보내기 같은 곳에 보관해 두세요.</p>
    <div class="sv-row"><button class="claim" data-sv="copy">저장 코드 복사</button><button class="claim alt" data-sv="file">파일로 저장</button></div>
    <h3>되살리기</h3>
    <textarea id="sv-in" rows="3" placeholder="저장 코드를 여기에 붙여 넣으세요"></textarea>
    <div class="sv-row"><button class="claim" data-sv="load">코드로 되살리기</button><label class="claim alt">파일 불러오기<input type="file" id="sv-file" accept=".txt,text/plain" hidden></label></div>
    <p class="sv warn">되살리면 지금 기록은 그 코드의 기록으로 바뀌어요.</p>`;
}
function openNB(t) {
  if (t) tab = t;
  const tabs = [['today', '오늘'], ['dex', '도감'], ['ach', '업적'], ['save', '저장']];
  const dot = k => (k === 'today' && todayCount()) || (k === 'ach' && ACH.some(achReady)) ? '<i class="dot"></i>' : '';
  nb.innerHTML = `<div class="sheet nbs" role="dialog" aria-label="수첩"><div class="sh-top"><b>수첩</b><span class="nbres">${resText(G.res, 14)}</span><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <div class="nbtabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}${dot(k)}</button>`).join('')}</div>
    <div class="nbbody">${({ today: tabToday, dex: tabDex, ach: tabAch, save: tabSave })[tab]()}</div></div>`;
  nb.hidden = false; flags.note = true;
}
const exportCode = () => { K.save(); G.seen = Date.now(); const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('yangil.kingdom')) o[k] = localStorage.getItem(k); } return 'YK1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))); };
function importCode(code) {
  try {
    code = String(code).trim().replace(/\s+/g, ''); if (!code.startsWith('YK1:')) throw 0;
    const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(4))))); const main = JSON.parse(o['yangil.kingdom.v1'] || 'null'); if (!main || !main.res) throw 0;
    if (!confirm(`이 기록으로 되살릴까요?\n친구 ${(main.friends || []).length}명 · 지식 ${main.res.know || 0}\n지금 기록은 사라져요.`)) return;
    window.__noSave = true;
    Object.keys(o).forEach(k => { if (k.startsWith('yangil.kingdom') && typeof o[k] === 'string') localStorage.setItem(k, o[k]); });
    location.reload();
  } catch (e) { K.toast('저장 코드가 올바르지 않아요'); }
}
nb.addEventListener('click', e => {
  if (e.target === nb || e.target.closest('[data-close]')) { nb.hidden = true; return; }
  const tb = e.target.closest('[data-tab]'); if (tb) { KS.fx('click'); tab = tb.dataset.tab; openNB(); return; }
  const D = daily(), b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.att != null) { claimAtt(); openNB(); return; }
  if (b.dataset.ms != null) { const m = D.ms[+b.dataset.ms]; if (m.got || msProg(m) < m.n) return; m.got = true; give(msReward()); KS.fx('coin'); openNB(); return; }
  if (b.dataset.all != null) { if (D.all || !D.ms.every(m => m.got)) return; D.all = true; G.ticket = (G.ticket || 0) + 1; give(allReward()); K.toast('미션 완료 · 뽑기권 1장!'); KS.fx('fanfare'); openNB(); return; }
  if (b.dataset.ach) { const a = ACH.find(x => x[0] === b.dataset.ach); if (!a || !achReady(a)) return; G.ach[a[0]] = Date.now(); give(a[5]); KS.fx('fanfare'); K.toast(`업적 달성 · ${a[1]}`); openNB(); return; }
  if (b.dataset.dx) { KS.fx('pop'); pick = pick === b.dataset.dx ? null : b.dataset.dx; openNB(); nb.querySelector('.nbbody').scrollTop = 0; return; }
  if (b.dataset.sv === 'copy') { const c = exportCode(), ta = $('sv-in'); const ok = () => K.toast('저장 코드를 복사했어요'); if (navigator.clipboard) navigator.clipboard.writeText(c).then(ok, () => { ta.value = c; ta.select(); K.toast('아래 코드를 길게 눌러 복사하세요'); }); else { ta.value = c; ta.select(); try { document.execCommand('copy'); ok(); } catch (er) {} } return; }
  if (b.dataset.sv === 'file') { const a = document.createElement('a'), d = new Date(); a.href = URL.createObjectURL(new Blob([exportCode()], { type: 'text/plain' })); a.download = `양일캠퍼스-저장-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.txt`; document.body.appendChild(a); a.click(); a.remove(); K.toast('저장 파일을 내려받았어요'); return; }
  if (b.dataset.sv === 'load') { importCode($('sv-in').value); return; }
});
nb.addEventListener('change', e => { if (e.target.id === 'sv-file' && e.target.files[0]) e.target.files[0].text().then(importCode); });

// 수첩 버튼 (의뢰 버튼 아래)
const nbBtn = document.createElement('button'); nbBtn.className = 'rbtn'; nbBtn.id = 'b-note'; nbBtn.setAttribute('aria-label', '수첩');
nbBtn.innerHTML = drawIcon('note', 24) + '<i class="badge" id="note-n" hidden>0</i>';
$('b-req').after(nbBtn);
nbBtn.onclick = () => { KS.fx('click'); openNB(); };
const todayCount = () => { const D = daily(); return (D.att ? 0 : 1) + D.ms.filter(m => !m.got && msProg(m) >= m.n).length + (!D.all && D.ms.every(m => m.got) ? 1 : 0); };
function refreshBadge() { const n = todayCount() + ACH.filter(achReady).length, el = $('note-n'); if (el) { el.textContent = n; el.hidden = !n; } }
let badgeT = 0;
K.HOOK.tick.push(dt => { if ((badgeT += dt) > 1.5) { badgeT = 0; refreshBadge(); } });
refreshBadge();
// 하루 처음 들어오면 수첩을 연다 (안내가 끝난 뒤)
const autoOpen = () => { if (G.tut < 99 || daily().att) return; if (storyOpen() || !$('reqs').hidden) { setTimeout(autoOpen, 800); return; } openNB('today'); };
setTimeout(autoOpen, 1500);

/* ───────── 5. 양평 명소: 복구되면 눌러서 들르기 ───────── */
G.town = G.town || {};
const LM_INFO = {
  station: { story: '“기차가 다시 다녀요! 양일고 학생들 덕분이에요.” 양평역 앞에 다시 사람들이 내린다.', daily: '기차 손님 선물', rw: () => ({ know: 30 + L() * 4, snack: 20 + L() * 3 }) },
  market: { story: '“떡볶이 하나 서비스!” 다시 열린 물맑은시장. 시장 교환소에서 자원을 바꿀 수 있어요.', daily: '시장 시식 코너', rw: () => ({ snack: 30 + L() * 4 }),
    trades: [[{ snack: 30 }, { know: 20 }], [{ know: 30 }, { snack: 20 }], [{ know: 20, snack: 20 }, { power: 15 }]] },
  hall: { story: '군청 앞 광장에 다시 불이 켜졌다. 게시판에 양평 소식이 붙어 있다.', daily: '군청 응원 선물', rw: () => ({ power: 15 + L() * 2, know: 20 + L() * 3 }), news: true },
};
const lm = document.createElement('div'); lm.className = 'modal'; lm.id = 'lm'; lm.hidden = true; document.body.appendChild(lm);
function openLM(kind, name) {
  const I = LM_INFO[kind], got = G.town[kind] === dayNum(), rw = I.rw();
  const news = I.news ? `<div class="req"><div class="rq"><b>양평 소식</b><p>재건 ${Math.round(K.restore() * 100)}% · 캠퍼스 친구 ${G.friends.length}명 · 전투 승리 ${G.wins || 0}번${G.towerBest ? ` · 도전의 탑 ${G.towerBest}층` : ''}</p></div></div>` : '';
  const trades = (I.trades || []).map((t, i) => `<div class="req"><div class="rq"><b>교환</b><div class="rw">${resText(t[0], 14)} → ${resText(t[1], 14)}</div></div><button class="claim" data-tr="${i}" ${canPay(t[0]) ? '' : 'disabled'}>바꾸기</button></div>`).join('');
  lm.innerHTML = `<div class="sheet" role="dialog" aria-label="${name}"><div class="sh-top"><b>${name}</b><small>다시 살아난 양평</small><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <p class="lm-st">${I.story}</p>${news}
    ${kind === 'market' ? (() => { const gt = G.town.gearDay === dayNum(), t = GEAR_ORDER[dayNum() % 5]; return `<div class="req${gt ? '' : ' done'}"><div class="rq"><b>문구 좌판 · 오늘의 장비</b><p>하루에 한 번 공짜로 하나 받아요</p><div class="rw">${drawIcon(t, 16)} ${STATIONERY[t].name} <small>${STATIONERY[t].desc}</small></div></div><button class="claim" data-gday ${gt ? 'disabled' : ''}>${gt ? '내일 또' : '받기'}</button></div>`; })() : ''}
    <div class="req${got ? '' : ' done'}"><div class="rq"><b>${I.daily}</b><p>하루에 한 번 받을 수 있어요</p><div class="rw">${resText(rw, 13)}</div></div><button class="claim" data-day ${got ? 'disabled' : ''}>${got ? '내일 또' : '받기'}</button></div>${trades}</div>`;
  lm.dataset.kind = kind; lm.dataset.name = name; lm.hidden = false;
}
lm.addEventListener('click', e => {
  if (e.target === lm || e.target.closest('[data-close]')) { lm.hidden = true; return; }
  const b = e.target.closest('button'); if (!b || b.disabled) return; const kind = lm.dataset.kind, I = LM_INFO[kind];
  if (b.dataset.gday != null) { if (G.town.gearDay === dayNum()) return; G.town.gearDay = dayNum(); const t = GEAR_ORDER[dayNum() % 5]; G.items[t] = (G.items[t] || 0) + 1; K.save(); KS.fx('levelup'); K.toast(`${STATIONERY[t].name}을(를) 받았어요! 친구들 → 장비에서 끼워요`); }
  else if (b.dataset.day != null) { if (G.town[kind] === dayNum()) return; G.town[kind] = dayNum(); give(I.rw()); KS.fx('coin'); }
  else if (b.dataset.tr != null) { const [pay, get] = I.trades[+b.dataset.tr]; if (!canPay(pay)) return; Object.entries(pay).forEach(([k, n]) => { G.res[k] -= n; }); give(get); KS.fx('coin'); }
  openLM(kind, lm.dataset.name);
});
K.HOOK.tap.push(ray => {
  const hit = ray.intersectObjects(K.mapLabels.filter(s => s.userData.lm && s.visible), false)[0];
  if (!hit) return false;
  const { kind, name } = hit.object.userData, th = K.LANDMARK[kind][0];
  KS.fx('click');
  if (K.restore() < th - 1e-9) { K.toast(`${name}은(는) 양평 재건 ${Math.round(th * 100)}%에 다시 살아나요`); return true; }
  openLM(kind, name); return true;
});

/* ───────── 6. 살아나는 동네: 재건될수록 차와 사람이 늘어난다 ───────── */
{
  const M = typeof YP_MAP !== 'undefined' ? YP_MAP : null;
  if (M) {
    const MAXC = 36, MAXP = 70;
    const carBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1.1, .42, .55), new THREE.MeshToonMaterial({ color: '#ffffff' }), MAXC);
    const carTop = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .3, .48), new THREE.MeshToonMaterial({ color: '#dfeaf2' }), MAXC);
    const pedBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(.1, .13, .38, 6), new THREE.MeshToonMaterial({ color: '#ffffff' }), MAXP);
    const pedHead = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshToonMaterial({ color: '#f3d2b5' }), MAXP);
    [carBody, carTop, pedBody, pedHead].forEach(m => { m.count = 0; m.frustumCulled = false; K.scene.add(m); });
    const CAR_C = ['#e5484d', '#3f7fb8', '#ffd23f', '#f3f1ea', '#2f8f6b', '#6b7078', '#ff9a3c'], PED_C = ['#3f7fb8', '#e5484d', '#2b4a3c', '#ffd23f', '#c86bff', '#8a5a34', '#f3f1ea'];
    const col = new THREE.Color();
    for (let i = 0; i < MAXC; i++) carBody.setColorAt(i, col.set(CAR_C[i % CAR_C.length]));
    for (let i = 0; i < MAXP; i++) pedBody.setColorAt(i, col.set(PED_C[(i * 3) % PED_C.length]));
    const roads = M.R.map(r => ({ cls: r[0], p: r[2] })).filter(r => r.p.length >= 4);
    const LMP = M.P.filter(p => K.LANDMARK[p[0]]).map(p => ({ kind: p[0], x: p[2], z: p[3] }));
    const radiusOf = r => r < .04 ? 0 : 300 * Math.pow(Math.min(1, (r - .03) / .92), 1.25);   // 무너진 건물이 살아나는 거리 (kingdom.js와 같은 식)
    const near = (x, z, R) => Math.hypot(x - 12, z - 6) < R;
    const cars = [], peds = [];
    let R = -1;
    function spawnRoad(list, carMode) {
      const cand = roads.filter(r => (carMode ? r.cls >= 1 : r.cls <= 1) && near(r.p[0], r.p[1], R));
      if (!cand.length) return null;
      const r = cand[Math.floor(Math.random() * cand.length)], segs = r.p.length / 2 - 1, i = Math.floor(Math.random() * segs);
      return { r, i, t: Math.random(), dir: Math.random() < .5 ? 1 : -1, sp: carMode ? 2.4 + Math.random() * 1.6 : .45 + Math.random() * .3, lane: carMode ? (r.cls >= 2 ? .35 : .15) : (Math.random() - .5) * .5 };
    }
    function rebuild() {
      const r = K.restore(), nR = radiusOf(r); if (Math.abs(nR - R) < 2) return; R = nR;
      const nc = Math.min(MAXC, Math.round(r * 44)), np = Math.min(MAXP, Math.round(r * 50));
      cars.length = 0; peds.length = 0;
      for (let k = 0; k < nc; k++) { const a = spawnRoad(roads, true); if (a) cars.push(a); }
      for (let k = 0; k < np; k++) { const a = spawnRoad(roads, false); if (a) peds.push(a); }
      // 살아난 명소 앞에는 사람이 모인다
      LMP.forEach(l => { if (r >= K.LANDMARK[l.kind][0] - 1e-9) for (let k = 0; k < 8 && peds.length < MAXP; k++) peds.push({ home: l, x: l.x + (Math.random() - .5) * 8, z: l.z + (Math.random() - .5) * 8, tx: l.x, tz: l.z, sp: .5 }); });
      carBody.count = carTop.count = cars.length; pedBody.count = pedHead.count = peds.length;
    }
    const dm = new THREE.Object3D();
    function walk(a, dt) {
      const p = a.r.p, n = p.length / 2 - 1;
      const ax = p[a.i * 2], az = p[a.i * 2 + 1], bx = p[a.i * 2 + 2], bz = p[a.i * 2 + 3], len = Math.hypot(bx - ax, bz - az) || .01;
      a.t += a.dir * a.sp * dt / len;
      if (a.t > 1) { if (a.i < n - 1) { a.i++; a.t = 0; } else { a.t = 1; a.dir = -1; } }
      else if (a.t < 0) { if (a.i > 0) { a.i--; a.t = 1; } else { a.t = 0; a.dir = 1; } }
      const x = ax + (bx - ax) * a.t, z = az + (bz - az) * a.t;
      if (!near(x, z, R + 6)) a.dir *= -1;   // 아직 무너진 쪽으로는 안 간다
      const dx = (bx - ax) / len * a.dir, dz = (bz - az) / len * a.dir;
      return { x: x - dz * a.lane, z: z + dx * a.lane, ang: Math.atan2(-dz, dx) };
    }
    let rt = 0, tt = 0;
    K.HOOK.tick.push((dt, t) => {
      if ((rt -= dt) <= 0) { rt = 2; rebuild(); }
      if (!cars.length && !peds.length) return;
      tt += dt; if (tt < 1 / 30) return; const d = tt; tt = 0;   // 30fps로만 움직인다 (폰 배터리)
      cars.forEach((a, i) => { const q = walk(a, d); dm.position.set(q.x, -.18, q.z); dm.rotation.set(0, q.ang, 0); dm.updateMatrix(); carBody.setMatrixAt(i, dm.matrix); dm.position.y = .1; dm.translateX(-.08); dm.updateMatrix(); carTop.setMatrixAt(i, dm.matrix); });
      peds.forEach((a, i) => {
        let x, z, bob = Math.abs(Math.sin(t * 8 + i)) * .04;
        if (a.home) { const dx = a.tx - a.x, dz = a.tz - a.z, l = Math.hypot(dx, dz); if (l < .1) { a.tx = a.home.x + (Math.random() - .5) * 10; a.tz = a.home.z + (Math.random() - .5) * 10; } else { a.x += dx / l * a.sp * d; a.z += dz / l * a.sp * d; } x = a.x; z = a.z; }
        else { const q = walk(a, d); x = q.x; z = q.z; }
        dm.rotation.set(0, 0, 0); dm.position.set(x, -.2 + bob, z); dm.updateMatrix(); pedBody.setMatrixAt(i, dm.matrix); dm.position.y = .07 + bob; dm.updateMatrix(); pedHead.setMatrixAt(i, dm.matrix);
      });
      [carBody, carTop, pedBody, pedHead].forEach(m => { m.instanceMatrix.needsUpdate = true; });
    });
  }
}
/* ───────── 7. 친구들: 캠퍼스 친구를 눌러 강화 · 장비 · 각성 ───────── */
G.lv = G.lv || {}; G.items = G.items || {}; G.gear = G.gear || {}; G.awake = G.awake || {};
const fr = document.createElement('div'); fr.className = 'modal'; fr.id = 'fr'; fr.hidden = true; document.body.appendChild(fr);
let frRole = 'all', frOpen = null, frTab = 'list';
const fmt = n => n.toLocaleString('ko-KR');
const statOf = (id, lv) => { const r = ROLES[kitOf(id).role], m = lvMult(lv), b = boostOf(G, id); return { hp: Math.round(r.hp * m * b.hp), atk: Math.round(r.atk * m * b.atk) }; };
function frBlock(id) { const lv = lvOf(G, id); if (lv >= MAX_LV) return '최고 레벨'; return canPay(upCost(lv)) ? '' : '자원 부족'; }
const gearIcon = (t, n = 16) => drawIcon(t, n);
function frList() {
  const list = G.friends.filter(id => frRole === 'all' || kitOf(id).role === frRole)
    .sort((a, b) => lvOf(G, b) - lvOf(G, a) || ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
  const roles = [['all', `전체 ${G.friends.length}`]].concat(ROLE_ORDER.filter(r => G.friends.some(id => kitOf(id).role === r)).map(r => [r, ROLES[r].name]));
  const body = list.map(id => {
    const f = K.rosterOf(id), k = kitOf(id), r = ROLES[k.role], lv = lvOf(G, id), why = frBlock(id), open = frOpen === id, aw = awakeOf(G, id), gq = G.gear[id];
    const now = statOf(id, lv), nx = statOf(id, Math.min(MAX_LV, lv + 1));
    const owned = GEAR_ORDER.filter(t => (G.items[t] || 0) > 0);
    const det = open ? `<div class="fr-det">
        <div><b>체력</b> ${fmt(now.hp)}${lv < MAX_LV ? ` → <em>${fmt(nx.hp)}</em>` : ''}</div>
        <div><b>공격</b> ${fmt(now.atk)}${lv < MAX_LV ? ` → <em>${fmt(nx.atk)}</em>` : ''}</div>
        <div><b>스킬</b> ${k.skill} · ${r.desc}${aw ? ' · <em>각성 +30%</em>' : ''}</div>
        <div><b>친밀도</b> ${hearts(Math.min(5, (G.bond || {})[id] || 0))}</div>
        <div class="fr-gear"><b>장비</b>${gq ? `${gearIcon(gq)} ${STATIONERY[gq].name} <small>${STATIONERY[gq].desc}</small> <button class="mini" data-unequip="${id}">빼기</button>` : '<small>없음</small>'}
          ${owned.length ? `<span class="fr-own">${owned.map(t => `<button class="mini" data-equip="${id}" data-t="${t}">${gearIcon(t)}${STATIONERY[t].name} ×${G.items[t]}</button>`).join('')}</span>` : `<small>· 문구점에서 살 수 있어요</small>`}</div>
        ${lv >= MAX_LV && !aw ? `<div class="fr-aw"><button class="claim aw" data-awake="${id}" ${canPay(AWAKE_COST) ? '' : 'disabled'}>각성하기 <small>${resText(AWAKE_COST, 11)}</small></button><small>체력 · 공격 +10%, 스킬 +30%</small></div>` : ''}</div>` : '';
    return `<div class="fr-c${open ? ' on' : ''}${aw ? ' awake' : ''}" data-fr="${id}" style="--rc:${r.color}">
      <img src="${faceSVG(id)}" alt="">
      <div class="fr-m"><b>${f.name}${aw ? ' <span class="aw-tag">각성</span>' : ''}${gq ? ` ${gearIcon(gq)}` : ''}</b><small>${roleIcon(k.role, 12)} ${r.name} · 전투력 ${fmt(powerOf(G, id))}</small>
        <div class="fr-lv"><span>Lv.${lv}</span><i><u style="width:${lv / MAX_LV * 100}%"></u></i><span>${MAX_LV}</span></div></div>
      <button class="claim" data-frup="${id}" ${why ? 'disabled' : ''}>${lv >= MAX_LV ? (aw ? '각성 완료' : '최고') : `강화<small>${resText(upCost(lv), 11)}</small>`}</button>${det}</div>`;
  }).join('');
  return `<div class="nbtabs fr-tabs">${roles.map(([k, n]) => `<button class="${frRole === k ? 'on' : ''}" data-role="${k}">${k === 'all' ? '' : roleIcon(k, 12)}${n}</button>`).join('')}</div><div class="fr-list">${body}</div>`;
}
function frShop() {
  const worn = t => Object.values(G.gear).filter(x => x === t).length;
  return `<p class="fr-sum"><small>장비는 친구마다 하나씩 낄 수 있어요. 친구를 눌러 펼친 뒤 끼우세요. 빼면 다시 가방으로 돌아와요.<br><b>얻는 곳</b> · 전투 승리(처음 깬 스테이지는 꼭!) · 친구 선물(!) · 물맑은시장 문구 좌판(하루 1개) · 여기 문구점</small></p><div class="fr-list">${GEAR_ORDER.map(t => { const g = STATIONERY[t];
    return `<div class="fr-c shop"><span class="gi-big">${gearIcon(t, 36)}</span><div class="fr-m"><b>${g.name}</b><small>${g.desc} · 가방 ${G.items[t] || 0}개 · 끼운 친구 ${worn(t)}명</small></div><button class="claim" data-buy="${t}" ${canPay(g.cost) ? '' : 'disabled'}>사기<small>${resText(g.cost, 11)}</small></button></div>`; }).join('')}</div>`;
}
function openFR() {
  flags.fr = true;
  const total = G.friends.reduce((a, id) => a + powerOf(G, id), 0);
  fr.innerHTML = `<div class="sheet nbs" role="dialog" aria-label="친구들"><div class="sh-top"><b>친구들</b><span class="nbres">${resText(G.res, 14)}</span><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <div class="nbtabs"><button class="${frTab === 'list' ? 'on' : ''}" data-frtab="list">친구 강화</button><button class="${frTab === 'shop' ? 'on' : ''}" data-frtab="shop">문구점</button></div>
    <p class="fr-sum">캠퍼스 친구 ${G.friends.length}명 · 모두의 전투력 <b>${fmt(total)}</b>${frTab === 'list' ? '<br><small>강화할 때마다 체력 · 공격 · 스킬이 8%씩 세져요. Lv.10이 되면 각성할 수 있어요. 친구를 누르면 자세히 보여요.</small>' : ''}</p>
    ${frTab === 'list' ? frList() : frShop()}</div>`;
  fr.hidden = false;
}
fr.addEventListener('click', e => {
  if (e.target === fr || e.target.closest('[data-close]')) { fr.hidden = true; return; }
  const keep = fr.querySelector('.sheet') ? fr.querySelector('.sheet').scrollTop : 0, redraw = () => { openFR(); fr.querySelector('.sheet').scrollTop = keep; };
  const tb = e.target.closest('[data-frtab]'); if (tb) { KS.fx('click'); frTab = tb.dataset.frtab; openFR(); return; }
  const rb = e.target.closest('[data-role]'); if (rb) { KS.fx('click'); frRole = rb.dataset.role; frOpen = null; openFR(); return; }
  const buy = e.target.closest('[data-buy]'); if (buy) { if (buy.disabled) return; const g = STATIONERY[buy.dataset.buy]; if (!canPay(g.cost)) return; Object.entries(g.cost).forEach(([k, n]) => { G.res[k] -= n; }); G.items[buy.dataset.buy] = (G.items[buy.dataset.buy] || 0) + 1; K.save(); K.hud(); KS.fx('coin'); K.toast(`${g.name}을(를) 샀어요`); redraw(); return; }
  const eq = e.target.closest('[data-equip]'); if (eq) { const id = eq.dataset.equip, t = eq.dataset.t; if (!(G.items[t] > 0)) return; if (G.gear[id]) G.items[G.gear[id]] = (G.items[G.gear[id]] || 0) + 1; G.items[t]--; G.gear[id] = t; K.save(); KS.fx('build'); redraw(); return; }
  const un = e.target.closest('[data-unequip]'); if (un) { const id = un.dataset.unequip, t = G.gear[id]; if (t) { G.items[t] = (G.items[t] || 0) + 1; delete G.gear[id]; K.save(); KS.fx('click'); } redraw(); return; }
  const aw = e.target.closest('[data-awake]'); if (aw) { if (aw.disabled) return; const id = aw.dataset.awake; if (lvOf(G, id) < MAX_LV || awakeOf(G, id) || !canPay(AWAKE_COST)) return; Object.entries(AWAKE_COST).forEach(([k, n]) => { G.res[k] -= n; }); G.awake[id] = 1; G.stat.awake = (G.stat.awake || 0) + 1; K.save(); K.hud(); KS.fx('fanfare'); K.toast(`${K.rosterOf(id).name} 각성!`); const p = K.people.find(q => q.id === id); if (p) K.sayText(p, '뭔가 깨어난 느낌이야…!'); redraw(); return; }
  const ub = e.target.closest('[data-frup]');
  if (ub) {
    if (ub.disabled) return; const id = ub.dataset.frup, lv = lvOf(G, id), cost = upCost(lv);
    if (lv >= MAX_LV || !canPay(cost)) return;
    Object.entries(cost).forEach(([k, n]) => { G.res[k] -= n; }); G.lv[id] = lv + 1; G.stat.lvup = (G.stat.lvup || 0) + 1;
    K.save(); K.hud(); refreshBadge(); KS.fx('levelup'); K.toast(`${K.rosterOf(id).name} Lv.${lv + 1}!`);
    const p = K.people.find(q => q.id === id); if (p) K.sayText(p, lv + 1 >= MAX_LV ? '최고 레벨! 이제 각성할 수 있대!' : '나 더 강해진 것 같아!');
    frOpen = id; redraw(); return;
  }
  const c = e.target.closest('[data-fr]'); if (c) { KS.fx('pop'); frOpen = frOpen === c.dataset.fr ? null : c.dataset.fr; redraw(); }
});
const frBtn = document.createElement('button'); frBtn.className = 'rbtn'; frBtn.id = 'b-friends'; frBtn.setAttribute('aria-label', '친구들');
frBtn.innerHTML = drawIcon('club', 24); nbBtn.after(frBtn);
frBtn.onclick = () => { KS.fx('click'); openFR(); };

/* ───────── 8. 친구 얻기: 시설 복구 합류 · 동아리실 뽑기 ───────── */
// 시설을 처음 복구하면 그 시설과 어울리는 친구가 합류한다 (tag: 동아리, role: 역할)
const FAC_FRIEND = {
  main: {}, lab: { tag: 'chem', role: 'blaster' }, library: { role: 'mage' }, store: { role: 'support' }, cafe: { role: 'healer' },
  field: { tag: 'sport' }, gym: { tag: 'sport' }, comp: { tag: 'sona', role: 'mage' }, broadcast: { tag: 'zec', role: 'support' },
  health: { tag: 'medi', role: 'healer' }, farm: { tag: 'squid', role: 'tank' }, greenhouse: { role: 'mage' }, pavilion: { role: 'support' },
  dorm: { tag: 'zec', role: 'tank' }, pool: { tag: 'sport', role: 'striker' }, hall: { role: 'blaster' },
};
const FAC_LINE = { main: '본관에 불이 켜진 걸 보고 왔어!', lab: '과학실 다시 열렸다며? 실험하러 왔어!', library: '도서관 자리 맡으러 왔어.', store: '매점 열었다길래 바로 왔지!', cafe: '급식 냄새 맡고 왔어.',
  field: '운동장에서 공 찰 사람!', gym: '다목적관 다시 쓸 수 있대서 왔어!', comp: '컴퓨터실 생겼다며? 코딩하러 왔어.', broadcast: '아침 방송은 내가 맡을게!', health: '보건실은 내가 지킬게.',
  farm: '텃밭 가꾸는 거 도와줄게!', greenhouse: '온실 식물 구경하러 왔어.', pavilion: '정자에서 쉬다 가도 돼?', dorm: '기숙사 방 하나 줘!', pool: '수영장 열었다며? 물놀이 가자!', hall: '강당에서 공연해도 돼?' };
G.joinFac = G.joinFac || null;
if (!G.joinFac) { G.joinFac = {}; K.FAC_ORDER.forEach(t => { if (K.lvOfFac(t)) G.joinFac[t] = 1; }); }   // 이미 복구한 시설은 지난 일로 친다
function pickFor(t) {
  const want = FAC_FRIEND[t] || {}, pool = ROSTER.filter(f => !G.friends.includes(f.id) && f.id !== 'seojun');
  const byTag = want.tag ? pool.filter(f => kitOf(f.id).tag === want.tag) : [], byRole = want.role ? pool.filter(f => kitOf(f.id).role === want.role) : [];
  return byTag.length ? byTag : byRole.length ? byRole : pool;
}
let joinT = 0;
K.HOOK.tick.push(dt => {
  if ((joinT += dt) < 1) return; joinT = 0;
  const t = K.FAC_ORDER.find(x => x !== 'club' && K.lvOfFac(x) && !G.joinFac[x]); if (!t) return;
  G.joinFac[t] = 1; const pool = pickFor(t); if (!pool.length) { K.save(); return; }
  const f = pool[Math.floor(Math.random() * pool.length)];
  setTimeout(() => { const got = K.recruit(f.id, t, `${K.FAC[t].name} 복구`); if (!got) return; K.save(); K.hud(); showJoin(got.id, `${K.FAC[t].name} 복구`, FAC_LINE[t]); }, 1400);
});
// 새 친구 카드 (뽑기 · 시설 합류 공용)
const jn = document.createElement('div'); jn.className = 'modal join'; jn.hidden = true; document.body.appendChild(jn);
function joinCard(id, sub, line) {
  const f = K.rosterOf(id), k = kitOf(id), r = ROLES[k.role];
  return `<div class="jc" style="--rc:${r.color}"><small class="jc-sub">${sub}</small><div class="jc-art"><img src="${faceSVG(id)}" alt=""></div>
    <b>${f.name}</b><span class="jc-role">${roleIcon(k.role, 14)} ${r.name} · ${k.skill}</span><p>“${line || '잘 부탁해!'}”</p></div>`;
}
function showJoin(id, sub, line) {
  if (!jn.hidden) return;
  jn.innerHTML = `<div class="jbox">${joinCard(id, sub + ' · 새 친구 합류!', line)}<div class="sv-row"><button class="claim alt" data-jfr>친구들 보기</button><button class="claim" data-close>좋아!</button></div></div>`;
  jn.hidden = false;
}
jn.addEventListener('click', e => { if (e.target.closest('[data-jfr]')) { jn.hidden = true; openFR(); return; } if (e.target === jn || e.target.closest('[data-close]')) jn.hidden = true; });

// 뽑기 창 (친구들 창과 같은 모양) + 진짜 게임 같은 뽑기 연출
// 반짝 캡슐(약 12%)은 친구 등급이 아니라 '뽑기 운'이다: 그 친구가 Lv.2로 오고 보너스 자원이 붙는다
const ga = document.createElement('div'); ga.className = 'modal'; ga.id = 'ga'; ga.hidden = true; document.body.appendChild(ga);
let gaLast = null;
G.ticket = G.ticket || 0;
const leftList = () => ROSTER.filter(f => !G.friends.includes(f.id));
const roomOf = () => Math.max(0, Math.min(K.recruitCap(), ROSTER.length) - G.friends.length);
const multiN = () => Math.min(5, roomOf(), leftList().length);
const costN = n => { const c = { know: 0, snack: 0, power: 0 }, f0 = G.friends.length; for (let i = 0; i < n; i++) { const m = f0 + i; c.know += 18 + m * 4; c.snack += 10 + m * 2; c.power += 4 + m; } if (n >= 5) Object.keys(c).forEach(k => { c[k] = Math.round(c[k] * .9); }); return c; };
// 친구를 다 모으면 '응원 뽑기': 캠퍼스 친구 한 명이 레벨업한다
const CHEER_COST = { know: 120, snack: 80, power: 30 };
const cheerMode = () => !leftList().length;
const cheerPool = () => G.friends.filter(id => lvOf(G, id) < MAX_LV);
const gaBlock = () => { if (cheerMode()) return !cheerPool().length ? '모두 최고 레벨이에요' : G.ticket || canPay(CHEER_COST) ? '' : '자원이 모자라요'; if (!roomOf()) return `동아리실 Lv.${K.lvOfFac('club') + 1}이 필요해요`; return G.freePull || G.ticket ? '' : canPay(K.recruitCost()) ? '' : '자원이 모자라요'; };
function openGacha() {
  const left = leftList(), why = gaBlock(), free = G.freePull > 0, mn = multiN();
  const byRole = ROLE_ORDER.map(r => [r, left.filter(f => kitOf(f.id).role === r).length]).filter(x => x[1]);
  const one = why || (cheerMode() ? (G.ticket ? `응원 뽑기 <span>${drawIcon('star', 14)}×1</span>` : `응원 뽑기 <span>${resText(CHEER_COST, 13)}</span>`) : free ? '무료로 뽑기!' : G.ticket ? `뽑기권으로 뽑기 <span>${drawIcon('star', 14)}×1</span>` : `1번 뽑기 <span>${resText(K.recruitCost(), 13)}</span>`);
  ga.innerHTML = `<div class="sheet nbs" role="dialog" aria-label="친구 뽑기"><div class="sh-top"><b>친구 뽑기</b><span class="nbres">${resText(G.res, 14)}<span class="rs">${drawIcon('star', 14)}${G.ticket}</span></span><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <p class="fr-sum">동아리실 Lv.${K.lvOfFac('club')} · 친구 <b>${G.friends.length}</b> / ${Math.min(K.recruitCap(), ROSTER.length)}명까지 · 뽑기권 <b>${G.ticket}</b>장<br><small><b class="gold-t">반짝 캡슐</b>이 나오면 친구가 Lv.2로 오고 보너스 자원도 받아요. 뽑기권은 출석 · 오늘의 미션에서 받아요.</small></p>
    <div class="ga-stage">${gaLast ? joinCard(gaLast.id, gaLast.gold ? '반짝 등장!' : '방금 뽑은 친구', gaLast.line) : `<div class="ga-machine"><div class="gm-glass">${[0, 1, 2, 3, 4, 5, 6].map(i => `<i style="--i:${i}"></i>`).join('')}</div><div class="gm-body"><span>양일 뽑기</span><b></b></div></div>`}</div>
    <div class="ga-btns"><button class="claim ga-go" data-pull="1" ${why ? 'disabled' : ''}>${one}</button>
      ${mn >= 2 && !why && !cheerMode() ? `<button class="claim ga-go multi" data-pull="${mn}" ${canPay(costN(mn)) ? '' : 'disabled'}>${mn}번 뽑기${mn >= 5 ? ' <em>10% 할인</em>' : ''} <span>${resText(costN(mn), 12)}</span></button>` : ''}</div>
    <h3 class="ga-h">${cheerMode() ? '친구를 모두 모았어요! 이제 <b class="gold-t">응원 뽑기</b>로 친구가 레벨업해요' : `못 만난 친구 ${left.length}명`}</h3>
    <div class="ga-roles">${byRole.map(([r, n]) => `<span style="--rc:${ROLES[r].color}">${roleIcon(r, 13)} ${ROLES[r].name} ${n}</span>`).join('') || '<span>모두 만났어요!</span>'}</div>
    <div class="dex ga-dex">${left.map(() => '<div class="dx no"><i>?</i><span>???</span></div>').join('')}</div></div>`;
  ga.hidden = false;
}
function doPull(n) {
  if (gaBlock()) return;
  if (cheerMode()) {   // 응원 뽑기
    if (G.ticket > 0) G.ticket--; else { if (!canPay(CHEER_COST)) return; Object.entries(CHEER_COST).forEach(([k, v]) => { G.res[k] -= v; }); }
    const pool = cheerPool(), id = pool[Math.floor(Math.random() * pool.length)], from = lvOf(G, id), gold = Math.random() < .12, to = Math.min(MAX_LV, from + (gold ? 2 : 1));
    G.lv[id] = to; G.stat.pulls = (G.stat.pulls || 0) + 1; K.save(); K.hud(); refreshBadge();
    gaLast = { id, cheer: true, gold, from, to, line: '응원 고마워! 더 열심히 할게!' }; summon([gaLast]); return;
  }
  if (n === 1) { if (G.freePull > 0) G.freePull--; else if (G.ticket > 0) G.ticket--; else { const c = K.recruitCost(); if (!canPay(c)) return; Object.entries(c).forEach(([k, v]) => { G.res[k] -= v; }); } }
  else { n = Math.min(n, multiN()); const c = costN(n); if (n < 2 || !canPay(c)) return; Object.entries(c).forEach(([k, v]) => { G.res[k] -= v; }); }
  const firstEver = !G.stat.pulls, out = [];
  for (let i = 0; i < n; i++) {
    const f = K.recruit(null, 'club', '동아리실 뽑기', true); if (!f) break;
    const gold = (firstEver && i === 0) || Math.random() < .12, pf = typeof PROFILES !== 'undefined' && PROFILES[f.id];
    if (gold) { G.lv[f.id] = Math.max(2, G.lv[f.id] || 1); const bonus = { know: 20 + L() * 2, snack: 15 + L() }; Object.entries(bonus).forEach(([k, v]) => { G.res[k] += v; }); out.push({ id: f.id, gold, bonus, line: pf && pf.lines && pf.lines[0] }); }
    else out.push({ id: f.id, gold: false, line: pf && pf.lines && pf.lines[0] });
    G.stat.pulls = (G.stat.pulls || 0) + 1;
  }
  if (!out.length) return;
  K.save(); K.hud(); refreshBadge(); gaLast = out[out.length - 1];
  summon(out);
}
ga.addEventListener('click', e => {
  if (e.target === ga || e.target.closest('[data-close]')) { ga.hidden = true; gaLast = null; return; }
  const b = e.target.closest('[data-pull]'); if (!b || b.disabled) return; doPull(+b.dataset.pull);
});

/* ── 뽑기 연출: 캡슐이 떨어지고 → 톡 누르면 흔들리다 터지고 → 카드가 뒤집힌다 ── */
const sm = document.createElement('div'); sm.className = 'summon'; sm.hidden = true;
sm.innerHTML = `<canvas class="sm-fx"></canvas><div class="sm-rays"></div><div class="sm-flash"></div>
  <div class="sm-cap"><i class="t"></i><i class="b"></i><s></s></div><p class="sm-tip">톡! 눌러서 열기</p>
  <div class="sm-card"><div class="sm-in"><div class="sm-back"><b>양일</b><small>CAMPUS</small></div><div class="sm-front"></div></div></div>
  <div class="sm-count"></div><div class="sm-sum"></div><div class="sm-btns"></div><button class="sm-skip">건너뛰기 ›</button>`;
document.body.appendChild(sm);
const smq = sel => sm.querySelector(sel), cv = smq('.sm-fx'), cx = cv.getContext('2d');
let parts = [], smRaf = 0, SQ = null;
const shotCache = {};
const fullShot = id => shotCache[id] || (shotCache[id] = (() => { try { return shot(id, { kind: 'full', w: 300, h: 360, pose: 'cheer', face: 'happy', turn: .25 }); } catch (e) { return faceSVG(id); } })());
function burst(x, y, gold, color) {
  const cols = gold ? ['#ffd23f', '#fff3c4', '#ffb000', '#ffffff'] : [color, '#ffffff', '#ffd23f', '#cfe3ff'];
  for (let i = 0; i < (gold ? 140 : 80); i++) { const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * (gold ? 11 : 8); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, life: 1, r: 2 + Math.random() * 5, c: cols[i % cols.length], star: Math.random() < .35, rot: Math.random() * 6 }); }
}
function smLoop() {
  const w = cv.width = innerWidth * devicePixelRatio, h = cv.height = innerHeight * devicePixelRatio; cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); cx.clearRect(0, 0, w, h);
  if (SQ && SQ.gold && Math.random() < .5) parts.push({ x: Math.random() * innerWidth, y: innerHeight + 5, vx: 0, vy: -1.5 - Math.random() * 2, life: 1, r: 1.5 + Math.random() * 2.5, c: '#ffe58a', star: true, rot: 0, slow: 1 });
  parts = parts.filter(p => p.life > 0);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; if (!p.slow) { p.vy += .22; p.vx *= .985; } p.life -= p.slow ? .008 : .014; p.rot += .1;
    cx.globalAlpha = Math.max(0, p.life); cx.fillStyle = p.c; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
    if (p.star) { cx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? p.r * .45 : p.r * 1.3, a = k * Math.PI / 5; cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } cx.fill(); } else cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
    cx.restore(); });
  cx.globalAlpha = 1; smRaf = requestAnimationFrame(smLoop);
}
const CAP_C = ['#5b8def', '#e5484d', '#2f8f6b', '#c86bff', '#ff9a3c'];
function summon(list) {
  SQ = { list, i: 0, phase: 'drop', gold: false }; sm.hidden = false; sm.className = 'summon'; parts = [];
  cancelAnimationFrame(smRaf); smLoop(); nextCap();
}
function nextCap() {
  const r = SQ.list[SQ.i], role = ROLES[kitOf(r.id).role];
  SQ.phase = 'drop'; SQ.gold = r.gold;
  sm.className = 'summon drop' + (r.gold ? ' gold' : ''); sm.style.setProperty('--cap', r.gold ? '#ffd23f' : CAP_C[Math.floor(Math.random() * CAP_C.length)]); sm.style.setProperty('--rc', role.color);
  smq('.sm-count').textContent = SQ.list.length > 1 ? `${SQ.i + 1} / ${SQ.list.length}` : '';
  smq('.sm-front').innerHTML = ''; smq('.sm-btns').innerHTML = ''; smq('.sm-sum').innerHTML = '';
  fullShot(r.id);   // 미리 찍어 둔다
  KS.fx('throw'); setTimeout(() => { if (SQ && SQ.phase === 'drop') { KS.fx('hit'); if (r.gold) KS.fx('charge'); } }, 520);
}
function openCap() {
  const r = SQ.list[SQ.i]; SQ.phase = 'crack'; sm.classList.add('crack'); KS.fx('charge');
  setTimeout(() => {
    if (!SQ || SQ.phase !== 'crack') return; SQ.phase = 'open'; sm.classList.add('open'); KS.fx('break'); setTimeout(() => KS.fx('reveal'), 120);
    const b = smq('.sm-cap').getBoundingClientRect(); burst(b.left + b.width / 2, b.top + b.height / 2, r.gold, ROLES[kitOf(r.id).role].color);
    const f = K.rosterOf(r.id), k = kitOf(r.id), role = ROLES[k.role];
    smq('.sm-front').innerHTML = `${r.gold ? `<span class="sm-badge">${r.cheer ? '반짝 응원!' : '반짝 등장!'}</span>` : ''}<img src="${fullShot(r.id)}" alt=""><b>${f.name}</b><span class="sm-role">${roleIcon(k.role, 15)} ${role.name} · ${k.skill}</span><p>“${r.line || '잘 부탁해!'}”</p>${r.cheer ? `<div class="sm-bonus">응원 성공! Lv.${r.from} → Lv.${r.to}</div>` : r.gold ? `<div class="sm-bonus">Lv.2로 합류 · 보너스 ${resText(r.bonus, 13)}</div>` : ''}`;
    setTimeout(() => { if (!SQ) return; SQ.phase = 'card'; sm.classList.add('card'); KS.fx(r.gold ? 'fanfare' : 'levelup'); smq('.sm-tip').textContent = SQ.i < SQ.list.length - 1 ? '눌러서 다음' : ''; if (SQ.i === SQ.list.length - 1) endButtons(); }, 650);
  }, r.gold ? 1100 : 750);
}
function endButtons() {
  SQ.phase = 'end';
  const again = !gaBlock();
  smq('.sm-btns').innerHTML = `<button class="claim alt" data-sfr>친구들 보기</button>${again ? '<button class="claim" data-sagain>한 번 더!</button>' : ''}<button class="claim alt" data-sclose>닫기</button>`;
}
function summary() {
  SQ.phase = 'end'; sm.className = 'summon sum' + (SQ.list.some(r => r.gold) ? ' gold' : '');
  smq('.sm-count').textContent = ''; smq('.sm-tip').textContent = '';
  smq('.sm-sum').innerHTML = `<h2>새 친구 ${SQ.list.length}명!</h2><div class="sm-grid">${SQ.list.map(r => { const k = kitOf(r.id); return `<div class="sm-mini${r.gold ? ' g' : ''}" style="--rc:${ROLES[k.role].color}"><img src="${faceSVG(r.id)}" alt=""><b>${K.rosterOf(r.id).name}</b><small>${roleIcon(k.role, 11)}${ROLES[k.role].name}${r.gold ? ' · Lv.2' : ''}</small></div>`; }).join('')}</div>`;
  endButtons(); KS.fx('fanfare');
}
function closeSummon() { sm.hidden = true; cancelAnimationFrame(smRaf); parts = []; SQ = null; openGacha(); }
sm.addEventListener('click', e => {
  if (!SQ) return;
  if (e.target.closest('.sm-skip')) { if (SQ.list.length > 1) summary(); else if (SQ.phase === 'drop') openCap(); return; }
  if (e.target.closest('[data-sclose]')) { closeSummon(); return; }
  if (e.target.closest('[data-sfr]')) { closeSummon(); ga.hidden = true; openFR(); return; }
  if (e.target.closest('[data-sagain]')) { const n = SQ.list.length; sm.hidden = true; cancelAnimationFrame(smRaf); SQ = null; doPull(n > 1 && multiN() >= 2 && canPay(costN(multiN())) ? multiN() : 1); if (!SQ) openGacha(); return; }
  if (SQ.phase === 'drop') { openCap(); return; }
  if (SQ.phase === 'card') { if (SQ.i < SQ.list.length - 1) { SQ.i++; nextCap(); } else if (SQ.list.length > 1) summary(); }
});
const gaBtn = document.createElement('button'); gaBtn.className = 'rbtn'; gaBtn.id = 'b-gacha'; gaBtn.setAttribute('aria-label', '친구 뽑기');
gaBtn.innerHTML = drawIcon('star', 24) + '<i class="badge" id="ga-n" hidden>!</i>'; frBtn.after(gaBtn);
gaBtn.onclick = () => { KS.fx('click'); G.gachaSeen = 1; openGacha(); };
// 동아리실이 생기면 뽑기 버튼이 나타나고 알려 준다
let gaT = 0;
function syncGacha() {
  const on = K.lvOfFac('club') > 0; gaBtn.hidden = !on;
  const n = $('ga-n'); if (n) n.hidden = !(on && (G.freePull > 0 || G.ticket > 0 || !G.gachaSeen)); if (n) n.textContent = G.freePull > 0 || !G.gachaSeen ? '!' : G.ticket;
  if (on && !G.gachaTold) {
    if (storyOpen() || !jn.hidden) return; G.gachaTold = 1; K.save();
    showQ([{ t: '뽑기 버튼이 생겼어요!', p: '동아리실이 다시 열려서 <b>친구 뽑기</b>를 할 수 있어요.<br>오른쪽 <b>별 버튼</b>을 눌러 보세요. 첫 뽑기는 <b>무료</b>예요!', art: 'mile', btn: '뽑으러 가기' }], () => { G.gachaSeen = 1; openGacha(); });
  }
}
K.HOOK.tick.push(dt => { if ((gaT += dt) > .8) { gaT = 0; syncGacha(); } });
syncGacha();
if (K.lvOfFac('club') && G.gachaTold == null && G.friends.length > 5) G.gachaTold = 1;   // 이미 동아리실이 있던 친구는 짧게 알려 준다
if (G.gachaTold === 1 && !G.gachaSeen && K.lvOfFac('club')) setTimeout(() => K.toast('동아리실 친구 모집이 별 버튼(뽑기)으로 바뀌었어요!'), 2500);

/* ───────── 8½. 오른쪽 버튼 정리: 자주 안 쓰는 버튼은 '메뉴'로 ───────── */
{
  const more = document.createElement('button'); more.className = 'rbtn'; more.id = 'b-more'; more.setAttribute('aria-label', '메뉴'); more.setAttribute('aria-expanded', 'false');
  more.innerHTML = '<span class="dots3"><i></i><i></i><i></i></span><span class="more-lab">메뉴</span>';
  const pop = document.createElement('div'); pop.className = 'more-pop'; pop.hidden = true;
  const LAB = { 'b-rot': '돌리기', 'b-in': '가까이', 'b-out': '멀리', 'b-music': '소리', 'b-full': '전체화면', 'b-back': '원래 게임' };
  Object.keys(LAB).forEach(id => { const b = $(id); if (!b) return; const row = document.createElement('label'); row.className = 'more-row'; row.append(b); row.insertAdjacentHTML('beforeend', `<span>${LAB[id]}</span>`); pop.append(row); });
  $('b-fight').after(more); document.body.append(pop);
  const place = () => { const r = more.getBoundingClientRect(); pop.style.top = Math.max(8, Math.min(innerHeight - pop.offsetHeight - 8, r.top - 6)) + 'px'; pop.style.right = (innerWidth - r.left + 8) + 'px'; };
  more.onclick = e => { e.stopPropagation(); KS.fx('click'); pop.hidden = !pop.hidden; more.setAttribute('aria-expanded', String(!pop.hidden)); if (!pop.hidden) place(); };
  document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== more && !more.contains(e.target)) { pop.hidden = true; more.setAttribute('aria-expanded', 'false'); } });
  addEventListener('resize', () => { if (!pop.hidden) place(); });
}

/* ───────── 9. 낮과 밤: 실제 시간에 맞춰 하늘이 바뀌고, 밤에는 불이 켜진다 ───────── */
const SKY = [   // [시, 하늘, 반구빛, 햇빛 세기, 햇빛 색, 밤 정도]
  [0, '#141a33', .38, .15, '#9fb4ff', 1], [5, '#1d2448', .42, .18, '#9fb4ff', 1], [6.2, '#f2b49a', .9, .9, '#ffc59a', .45], [7.5, '#bfe3f5', 1.15, 1.7, '#fff3d6', 0],
  [16.5, '#bfe3f5', 1.15, 1.7, '#fff3d6', 0], [18, '#f0956a', .95, 1.05, '#ffb27a', .35], [19.4, '#232a52', .5, .25, '#9fb4ff', .9], [24, '#141a33', .38, .15, '#9fb4ff', 1],
];
let hourOverride = null; { const q = new URLSearchParams(location.search).get('hour'); if (q != null && !isNaN(+q)) hourOverride = +q; }
const hourNow = () => { if (hourOverride != null) return hourOverride; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
const hemi = K.scene.children.find(o => o.isHemisphereLight), cA = new THREE.Color(), cB = new THREE.Color();
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(.35, 'rgba(255,214,110,.85)'); gr.addColorStop(1, 'rgba(255,200,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const winMat = new THREE.PointsMaterial({ color: '#ffd36b', size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
const lampMat = new THREE.PointsMaterial({ map: glowTex, size: 34, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
let townWin = null, campWin = null, lampPts = null, nightN = 0;
// 무너진 건물 문턱값: kingdom.js와 같은 방법으로 다시 계산한다 (재건된 건물만 불이 켜지게)
const TOWN_B = (() => {
  const M = typeof YP_MAP !== 'undefined' ? YP_MAP : null; if (!M) return [];
  const LM = M.P.filter(p => K.LANDMARK[p[0]]).map(p => [p[2], p[3], K.LANDMARK[p[0]][0]]);
  let sd = 11; const rnd2 = () => (sd = (sd * 9301 + 49297) % 233280) / 233280, out = [];
  M.B.forEach(([lv, f]) => { if (f.length < 6) return; let cx = 0, cz = 0; for (let k = 0; k < f.length; k += 2) { cx += f[k]; cz += f[k + 1]; } cx /= f.length / 2; cz /= f.length / 2;
    const d = Math.hypot(cx - 12, cz - 6); let t = Math.min(.97, .03 + .92 * Math.pow(Math.min(1, d / 300), .8) + rnd2() * .05); LM.forEach(([x, z, th]) => { if (Math.hypot(cx - x, cz - z) < 16) t = Math.min(t, th - .005); });
    out.push({ f, cx, cz, h: Math.max(.6, lv * .66), lv, thr: t }); });
  return out;
})();
let winR = -1, winSig = '';
function buildLights() {
  const r = K.restore();
  if (Math.abs(r - winR) > .005) {
    winR = r; if (townWin) K.scene.remove(townWin);
    const pos = [];
    TOWN_B.forEach((b, i) => { if (r < b.thr) return; const floors = Math.min(4, Math.max(1, b.lv)), f = b.f, n = f.length / 2;
      for (let e = 0; e < Math.min(n - 1, 4); e++) { const ax = f[e * 2], az = f[e * 2 + 1], bx = f[e * 2 + 2], bz = f[e * 2 + 3]; let mx = (ax + bx) / 2, mz = (az + bz) / 2; const ox = mx - b.cx, oz = mz - b.cz, ol = Math.hypot(ox, oz) || 1; mx += ox / ol * .08; mz += oz / ol * .08;
        for (let fl = 0; fl < floors; fl++) if ((i * 7 + e * 3 + fl * 5) % 3) pos.push(mx, -.4 + .35 + fl * .66, mz); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); townWin = new THREE.Points(g, winMat); townWin.frustumCulled = false; K.scene.add(townWin);
  }
  const sig = K.FAC_ORDER.map(t => K.lvOfFac(t)).join('') + '|' + G.b.filter(b => b.t === 'lamp').map(b => b.x + ',' + b.z).join(';');
  if (sig !== winSig) {
    winSig = sig; if (campWin) K.scene.remove(campWin); if (lampPts) K.scene.remove(lampPts);
    const pos = [];
    K.FAC_ORDER.forEach(t => { const d = K.FAC[t], m = K.meshes.get(t); if (!K.lvOfFac(t) || !K.facOpen(t) || d.ground || !m) return; const [x0, z0] = d.at, [w, dd] = d.size, top = Math.min(4, (m.userData.h || 2) - .5);
      for (let y = .7; y < top; y += .75) { for (let x = x0 + .5; x < x0 + w; x += .9) { pos.push(x, y, z0 + dd + .04); pos.push(x, y, z0 - .04); } for (let z = z0 + .5; z < z0 + dd; z += .9) { pos.push(x0 + w + .04, y, z); pos.push(x0 - .04, y, z); } } });
    let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); campWin = new THREE.Points(g, winMat); campWin.frustumCulled = false; K.scene.add(campWin);
    const lp = []; G.b.filter(b => b.t === 'lamp').forEach(b => lp.push(b.x + .5, 1.65, b.z + .5));
    [[10.4, N0 - .2], [13.6, N0 - .2]].forEach(([x, z]) => lp.push(x, 1.8, z));   // 정문 기둥
    g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lampPts = new THREE.Points(g, lampMat); lampPts.frustumCulled = false; K.scene.add(lampPts);
  }
}
const N0 = 24;
function applySky() {
  const h = ((hourNow() % 24) + 24) % 24; let i = 0; while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
  const a = SKY[i], b = SKY[i + 1], k = (h - a[0]) / ((b[0] - a[0]) || 1), lerp = (x, y) => x + (y - x) * k;
  K.scene.background.copy(cA.set(a[1]).lerp(cB.set(b[1]), k));
  nightN = lerp(a[5], b[5]);
  if (hemi) { hemi.intensity = lerp(a[2], b[2]); hemi.color.copy(cA.set('#fff7e0').lerp(cB.set('#8fa0d8'), nightN)); }
  K.sun.intensity = lerp(a[3], b[3]); K.sun.color.copy(cA.set(a[4]).lerp(cB.set(b[4]), k));
  winMat.opacity = Math.max(0, Math.min(1, (nightN - .25) * 1.6)); lampMat.opacity = winMat.opacity * .95;
  document.body.classList.toggle('night', nightN > .5);
}
let skyT = 99, lightT = 99;
K.HOOK.tick.push(dt => { if ((skyT += dt) > 20) { skyT = 0; applySky(); } if ((lightT += dt) > 3) { lightT = 0; buildLights(); } });
buildLights(); applySky();
const setHour = h => { hourOverride = h; applySky(); };

/* ───────── 10. 학교 행사: 달마다 바뀌는 행사 미션 · 포인트 · 한정 꾸미기 ───────── */
const EVENTS = [
  { months: [1, 2], id: 'winter', name: '겨울방학 눈 축제', deco: 'snowman', color: '#5b8def', desc: '눈 쌓인 캠퍼스에서 친구들과 눈싸움!', fx: 'snow' },
  { months: [3, 4], id: 'spring', name: '새 학기 벚꽃 주간', deco: 'cherry', color: '#ff8fb3', desc: '새 교실, 새 친구, 꽃잎 날리는 은행나무길', fx: 'petal' },
  { months: [5, 6], id: 'sports', name: '양일 체육대회', deco: 'flags', color: '#2f8f6b', desc: '반 대항 계주와 줄다리기! 운동장이 들썩여요' },
  { months: [7, 8], id: 'summer', name: '여름방학 물놀이', deco: 'parasol', color: '#3fb6e6', desc: '수영장과 남한강에서 시원하게 놀아요' },
  { months: [9, 10], id: 'festival', name: '양일 축제', deco: 'booth', color: '#c86bff', desc: '부스 열고 공연하는 우리 학교 축제' },
  { months: [11], id: 'exam', name: '수능 응원', deco: 'banner', color: '#e5484d', desc: '선배들 수능 대박을 다 같이 응원해요' },
  { months: [12], id: 'xmas', name: '크리스마스 캠퍼스', deco: 'xmas', color: '#2f8f4e', desc: '트리 불빛 반짝이는 겨울 캠퍼스', fx: 'snow' },
];
const EV_M = {
  col:   { n: 40, text: '자원 말풍선 40번 모으기', cur: () => G.stat.col || 0 },
  talk:  { n: 15, text: '친구와 15번 이야기하기', cur: () => G.stat.talk || 0 },
  up:    { n: 5, text: '시설 5번 복구 · 레벨업', cur: () => G.stat.up || 0 },
  win:   { n: 5, text: '전투 5번 이기기', cur: () => G.wins || 0 },
  reqs:  { n: 5, text: '친구 의뢰 5개 들어주기', cur: () => G.stat.reqs || 0 },
  gift:  { n: 5, text: '친구 선물 5번 받기', cur: () => G.stat.gift || 0 },
  pulls: { n: 3, text: '친구 뽑기 3번 하기', cur: () => G.stat.pulls || 0 },
  lvup:  { n: 5, text: '친구 5번 강화하기', cur: () => G.stat.lvup || 0 },
};
const EV_STEPS = [[20, { know: 80, snack: 60 }], [40, { ticket: 1 }], [60, { know: 150, snack: 100, power: 50 }], [80, { ticket: 2 }], [100, { deco: 1 }]];
G.decoUnlock = G.decoUnlock || {};
function curEvent() {
  const d = new Date(), m = d.getMonth() + 1, E = EVENTS.find(e => e.months.includes(m)), last = E.months[E.months.length - 1];
  const end = new Date(d.getFullYear(), last, 1), left = Math.max(0, Math.ceil((end - d) / 864e5));
  return { E, key: d.getFullYear() + '-' + E.id, left };
}
function evState() {
  const { E, key } = curEvent();
  if (!G.ev || G.ev.key !== key) {
    let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const ks = Object.keys(EV_M).sort((a, b) => ((h >> (a.length + b.charCodeAt(0) % 5)) & 1) - .5 || a.localeCompare(b)).slice(0, 5);
    G.ev = { key, ms: ks, base: Object.fromEntries(ks.map(k => [k, EV_M[k].cur()])), got: {}, rw: {} }; K.save();
  }
  return { E, S: G.ev };
}
const evProg = (S, k) => Math.min(EV_M[k].n, EV_M[k].cur() - (S.base[k] || 0));
const evPts = S => Object.keys(S.got).length * 20;
const evRwText = (r, E) => r.deco ? `${drawIcon(E.deco, 16)} ${K.DECO[E.deco].name}` : r.ticket ? `${drawIcon('star', 14)} 뽑기권 ${r.ticket}` : `${drawIcon('know', 13)} 자원 묶음`;
function evCount() { const { S } = evState(); return S.ms.filter(k => !S.got[k] && evProg(S, k) >= EV_M[k].n).length + EV_STEPS.filter(([p]) => evPts(S) >= p && !S.rw[p]).length; }
const ev = document.createElement('div'); ev.className = 'modal'; ev.id = 'ev'; ev.hidden = true; document.body.appendChild(ev);
function openEV() {
  const { E, S } = evState(), { left } = curEvent(), pts = evPts(S);
  ev.innerHTML = `<div class="sheet nbs ev-sheet" role="dialog" aria-label="${E.name}" style="--ec:${E.color}"><div class="sh-top"><b>${E.name}</b><small>${left ? `${left}일 남음` : '오늘 마지막 날!'}</small><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <div class="ev-hero"><span class="ev-ic">${drawIcon(E.deco, 54)}</span><div><p>${E.desc}</p><small>미션을 하면 행사 포인트를 받아요. <b>100점</b>을 모으면 한정 꾸미기 <b>${K.DECO[E.deco].name}</b>을(를) 받아요!</small></div></div>
    <div class="ev-bar"><i style="width:${pts}%"></i>${EV_STEPS.map(([p, r]) => `<button class="ev-step${pts >= p ? ' on' : ''}${S.rw[p] ? ' got' : ''}" style="left:${p}%" data-evrw="${p}" ${pts >= p && !S.rw[p] ? '' : 'disabled'}><b>${p}</b><span>${evRwText(r, E)}</span></button>`).join('')}</div>
    <h3 class="ga-h">행사 포인트 <b>${pts}</b> / 100</h3>
    ${S.ms.map(k => { const p = evProg(S, k), ok = p >= EV_M[k].n; return `<div class="req${ok && !S.got[k] ? ' done' : ''}"><div class="rq"><b>${EV_M[k].text}</b>${bar(p, EV_M[k].n)}<div class="rw">행사 포인트 +20</div></div><button class="claim" data-evm="${k}" ${ok && !S.got[k] ? '' : 'disabled'}>${S.got[k] ? '받음' : '받기'}</button></div>`; }).join('')}
    ${G.decoUnlock[E.deco] ? `<p class="sv">${K.DECO[E.deco].name}은(는) 아래 꾸미기 줄 끝에 있어요.</p>` : ''}</div>`;
  ev.hidden = false;
}
ev.addEventListener('click', e => {
  if (e.target === ev || e.target.closest('[data-close]')) { ev.hidden = true; return; }
  const { E, S } = evState(), b = e.target.closest('button'); if (!b || b.disabled) return;
  if (b.dataset.evm) { const k = b.dataset.evm; if (S.got[k] || evProg(S, k) < EV_M[k].n) return; S.got[k] = 1; KS.fx('coin'); K.save(); openEV(); return; }
  if (b.dataset.evrw) { const p = +b.dataset.evrw, r = (EV_STEPS.find(x => x[0] === p) || [])[1]; if (!r || S.rw[p] || evPts(S) < p) return; S.rw[p] = 1;
    if (r.deco) { G.decoUnlock[E.deco] = 1; K.syncEventCards(); K.toast(`한정 꾸미기 · ${K.DECO[E.deco].name}을(를) 받았어요!`); KS.fx('fanfare'); }
    else if (r.ticket) { G.ticket = (G.ticket || 0) + r.ticket; K.toast(`뽑기권 ${r.ticket}장!`); KS.fx('fanfare'); }
    else { give(r); KS.fx('coin'); }
    K.save(); openEV(); }
});
// 행사 띠 (자원 아래)
const evChip = document.createElement('button'); evChip.className = 'evchip'; document.body.appendChild(evChip);
function syncEV() { const { E } = evState(), { left } = curEvent(), n = evCount(); evChip.style.setProperty('--ec', E.color); evChip.innerHTML = `${drawIcon(E.deco, 18)}<b>${E.name}</b><small>D-${left}</small>${n ? `<i class="badge">${n}</i>` : ''}`; }
evChip.onclick = () => { KS.fx('click'); openEV(); };
let evT = 0; K.HOOK.tick.push(dt => { if ((evT += dt) > 2) { evT = 0; syncEV(); } }); syncEV();
// 행사 날씨: 눈 · 꽃잎
{ const fx = curEvent().E.fx; if (fx) { const box = document.createElement('div'); box.className = 'evfx ' + fx; box.innerHTML = Array.from({ length: 22 }, (_, i) => `<i style="left:${(i * 4.6 + (i % 3) * 7) % 100}%;animation-delay:${-(i * .83) % 9}s;animation-duration:${7 + (i % 5) * 1.3}s"></i>`).join(''); document.body.appendChild(box); } }

K.save();
Object.assign(K, { openEV, evState, setHour, openGacha, showJoin, openFR, openNB, openLM, daily, ACH, TUT, offline, refreshBadge });
