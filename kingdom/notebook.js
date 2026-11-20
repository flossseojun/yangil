// 양일 캠퍼스 덧붙이기: 처음 안내 · 자리 비운 동안 생산 · 수첩(오늘 · 도감 · 업적 · 저장) · 양평 명소 · 살아나는 동네
// kingdom.js 다음에 불러오고, window.__kingdom 으로 캠퍼스와 이야기한다.
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
  if (storyOpen() || !$('reqs').hidden || !$('nb').hidden || ($('fr') && !$('fr').hidden)) { tutEl.hidden = arrow.hidden = true; if (s.done()) nextTut(); return; }
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
  give(attReward((D.streak - 1) % 7 + 1)); KS.fx('fanfare');
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
    <button class="claim wide" data-att ${D.att ? 'disabled' : ''}>${D.att ? '오늘 출석 완료 · 내일 또 와요' : '출석 도장 찍기'}</button>
    <h3>오늘의 미션 <small>밤 12시에 바뀌어요</small></h3>
    ${D.ms.map((m, i) => { const p = msProg(m), ok = p >= m.n; return `<div class="req${ok && !m.got ? ' done' : ''}"><div class="rq"><b>${MISSIONS[m.k].text(m.n)}</b>${bar(p, m.n)}<div class="rw">${resText(msReward(), 13)}</div></div><button class="claim" data-ms="${i}" ${ok && !m.got ? '' : 'disabled'}>${m.got ? '받음' : '받기'}</button></div>`; }).join('')}
    <div class="req${done && !D.all ? ' done' : ''}"><div class="rq"><b>미션 3개 모두 하기</b><div class="rw">${resText(allReward(), 13)}</div></div><button class="claim" data-all ${done && !D.all ? '' : 'disabled'}>${D.all ? '받음' : '받기'}</button></div>`;
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
  if (b.dataset.all != null) { if (D.all || !D.ms.every(m => m.got)) return; D.all = true; give(allReward()); KS.fx('fanfare'); openNB(); return; }
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
    <div class="req${got ? '' : ' done'}"><div class="rq"><b>${I.daily}</b><p>하루에 한 번 받을 수 있어요</p><div class="rw">${resText(rw, 13)}</div></div><button class="claim" data-day ${got ? 'disabled' : ''}>${got ? '내일 또' : '받기'}</button></div>${trades}</div>`;
  lm.dataset.kind = kind; lm.dataset.name = name; lm.hidden = false;
}
lm.addEventListener('click', e => {
  if (e.target === lm || e.target.closest('[data-close]')) { lm.hidden = true; return; }
  const b = e.target.closest('button'); if (!b || b.disabled) return; const kind = lm.dataset.kind, I = LM_INFO[kind];
  if (b.dataset.day != null) { if (G.town[kind] === dayNum()) return; G.town[kind] = dayNum(); give(I.rw()); KS.fx('coin'); }
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
/* ───────── 7. 친구들: 캠퍼스 친구를 눌러 강화한다 ───────── */
G.lv = G.lv || {};
const fr = document.createElement('div'); fr.className = 'modal'; fr.id = 'fr'; fr.hidden = true; document.body.appendChild(fr);
let frRole = 'all', frOpen = null;
const fmt = n => n.toLocaleString('ko-KR');
const statOf = (id, lv) => { const r = ROLES[kitOf(id).role], m = lvMult(lv); return { hp: Math.round(r.hp * m), atk: Math.round(r.atk * m) }; };
function frBlock(id) { const lv = lvOf(G, id); if (lv >= MAX_LV) return '최고 레벨'; return canPay(upCost(lv)) ? '' : '자원 부족'; }
function openFR() {
  const list = G.friends.filter(id => frRole === 'all' || kitOf(id).role === frRole)
    .sort((a, b) => lvOf(G, b) - lvOf(G, a) || ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
  const total = G.friends.reduce((a, id) => a + powerOf(G, id), 0);
  const roles = [['all', `전체 ${G.friends.length}`]].concat(ROLE_ORDER.filter(r => G.friends.some(id => kitOf(id).role === r)).map(r => [r, ROLES[r].name]));
  const body = list.map(id => {
    const f = K.rosterOf(id), k = kitOf(id), r = ROLES[k.role], lv = lvOf(G, id), why = frBlock(id), open = frOpen === id;
    const now = statOf(id, lv), nx = statOf(id, Math.min(MAX_LV, lv + 1));
    const det = open ? `<div class="fr-det">
        <div><b>체력</b> ${fmt(now.hp)}${lv < MAX_LV ? ` → <em>${fmt(nx.hp)}</em>` : ''}</div>
        <div><b>공격</b> ${fmt(now.atk)}${lv < MAX_LV ? ` → <em>${fmt(nx.atk)}</em>` : ''}</div>
        <div><b>스킬</b> ${k.skill} · ${r.desc}</div>
        <div><b>친밀도</b> ${hearts(Math.min(5, (G.bond || {})[id] || 0))}</div></div>` : '';
    return `<div class="fr-c${open ? ' on' : ''}" data-fr="${id}" style="--rc:${r.color}">
      <img src="${faceSVG(id)}" alt="">
      <div class="fr-m"><b>${f.name}</b><small>${roleIcon(k.role, 12)} ${r.name} · 전투력 ${fmt(powerOf(G, id))}</small>
        <div class="fr-lv"><span>Lv.${lv}</span><i><u style="width:${lv / MAX_LV * 100}%"></u></i><span>${MAX_LV}</span></div></div>
      <button class="claim" data-frup="${id}" ${why ? 'disabled' : ''}>${lv >= MAX_LV ? '최고' : `강화<small>${resText(upCost(lv), 11)}</small>`}</button>${det}</div>`;
  }).join('');
  fr.innerHTML = `<div class="sheet nbs" role="dialog" aria-label="친구들"><div class="sh-top"><b>친구들</b><span class="nbres">${resText(G.res, 14)}</span><button class="x" data-close aria-label="닫기">${drawIcon('close', 18)}</button></div>
    <p class="fr-sum">캠퍼스 친구 ${G.friends.length}명 · 모두의 전투력 <b>${fmt(total)}</b><br><small>강화할 때마다 체력 · 공격 · 스킬이 8%씩 세져요. 친구를 누르면 자세히 보여요.</small></p>
    <div class="nbtabs fr-tabs">${roles.map(([k, n]) => `<button class="${frRole === k ? 'on' : ''}" data-role="${k}">${k === 'all' ? '' : roleIcon(k, 12)}${n}</button>`).join('')}</div>
    <div class="fr-list">${body}</div></div>`;
  fr.hidden = false;
}
fr.addEventListener('click', e => {
  if (e.target === fr || e.target.closest('[data-close]')) { fr.hidden = true; return; }
  const keep = fr.querySelector('.sheet') ? fr.querySelector('.sheet').scrollTop : 0, redraw = () => { openFR(); fr.querySelector('.sheet').scrollTop = keep; };
  const rb = e.target.closest('[data-role]'); if (rb) { KS.fx('click'); frRole = rb.dataset.role; frOpen = null; openFR(); return; }
  const ub = e.target.closest('[data-frup]');
  if (ub) {
    if (ub.disabled) return; const id = ub.dataset.frup, lv = lvOf(G, id), cost = upCost(lv);
    if (lv >= MAX_LV || !canPay(cost)) return;
    Object.entries(cost).forEach(([k, n]) => { G.res[k] -= n; }); G.lv[id] = lv + 1; G.stat.lvup = (G.stat.lvup || 0) + 1;
    K.save(); K.hud(); refreshBadge(); KS.fx('levelup'); K.toast(`${K.rosterOf(id).name} Lv.${lv + 1}!`);
    const p = K.people.find(q => q.id === id); if (p) K.sayText(p, lv + 1 >= MAX_LV ? '최고 레벨! 이제 누구든 덤벼!' : '나 더 강해진 것 같아!');
    frOpen = id; redraw(); return;
  }
  const c = e.target.closest('[data-fr]'); if (c) { KS.fx('pop'); frOpen = frOpen === c.dataset.fr ? null : c.dataset.fr; redraw(); }
});
const frBtn = document.createElement('button'); frBtn.className = 'rbtn'; frBtn.id = 'b-friends'; frBtn.setAttribute('aria-label', '친구들');
frBtn.innerHTML = drawIcon('club', 24); nbBtn.after(frBtn);
frBtn.onclick = () => { KS.fx('click'); openFR(); };

K.save();
Object.assign(K, { openFR, openNB, openLM, daily, ACH, TUT, offline, refreshBadge });
