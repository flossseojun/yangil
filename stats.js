// 플레이 통계 (이름·기기 정보 없이 날짜별 숫자만 센다)
// Firestore stats/{YYYY-MM-DD} 문서에 숫자를 1씩 더한다. 보안 규칙이 "한 번에 한 칸, 1씩만" 허용한다.
// 보는 곳: 게임 주소 뒤에 #stats (예: flossseojun.github.io/yangil/#stats)
const STAT_KEYS = ['visits', 'users', 'starts', 'r11', 'r12', 'r21', 'r22', 'r31', 'r32', 'grads'];
const STAT_NAME = { visits: '접속', users: '사용자', starts: '새 게임', r11: '1-1', r12: '1-2', r21: '2-1', r22: '2-2', r31: '3-1', r32: '3-2', grads: '졸업' };
const statDay = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const statOff = () => !FIREBASE_CONFIG || navigator.webdriver || /^file:/.test(location.protocol);

function statBump(key) {
  if (statOff() || !STAT_KEYS.includes(key)) return;
  rankInit().then(ok => {
    if (!ok) return;
    RANK.db.collection('stats').doc(statDay()).set({ [key]: firebase.firestore.FieldValue.increment(1) }, { merge: true }).catch(e => console.warn('stat', e));
  });
}
// 접속: 탭을 열 때 한 번 · 사용자: 기기마다 하루 한 번
setTimeout(() => {
  if (statOff()) return;
  try { if (!sessionStorage.getItem('yangil.visit')) { sessionStorage.setItem('yangil.visit', '1'); statBump('visits'); } } catch (e) { statBump('visits'); }
  try { const t = statDay(); if (localStorage.getItem('yangil.userDay') !== t) { localStorage.setItem('yangil.userDay', t); setTimeout(() => statBump('users'), 1200); } } catch (e) {}
}, 2500);
// 새 게임 · 학기 도달(어디서 그만두는지) · 졸업
const _statNew = newGame;
newGame = function (...a) { const r = _statNew.apply(this, a); statBump('starts'); return r; };
const _statDay = startDay;
startDay = function () {
  if (S && S.day === 1) { const k = `r${S.year}${S.sem}`; S.reach = S.reach || {}; if (!S.reach[k]) { S.reach[k] = 1; statBump(k); } }
  return _statDay();
};
const _statGrad = graduate;
graduate = function () { _statGrad(); statBump('grads'); };

/* ───────── 통계 화면 ───────── */
async function statFetch(days = 14) {
  if (!(await rankInit())) return null;
  const from = statDay(new Date(Date.now() - (days - 1) * 864e5));
  const snap = await RANK.db.collection('stats').where(firebase.firestore.FieldPath.documentId(), '>=', from).get();
  const map = {}; snap.forEach(d => { map[d.id] = d.data(); });
  return Array.from({ length: days }, (_, i) => { const id = statDay(new Date(Date.now() - (days - 1 - i) * 864e5)); return Object.assign({ id }, map[id] || {}); });
}
function renderStats() {
  const head = `<header class="sheet-head row"><div><p class="eyebrow">만든 사람만 보는 화면</p><h2>플레이 통계</h2></div><button class="link" data-act="menu">← 메인으로</button></header>`;
  if (!FIREBASE_CONFIG) return `<section class="dex stats">${head}<div class="paper"><p class="fine">랭킹 서버가 설정되지 않았어요.</p></div></section>`;
  if (!UI.stats && !UI.statsLoading) {
    UI.statsLoading = true;
    statFetch(14).then(rows => { UI.stats = rows || []; UI.statsErr = rows ? '' : (RANK.err || '불러오지 못했어요.'); }).catch(e => { UI.stats = []; UI.statsErr = '불러오지 못했어요. 보안 규칙을 게시했는지 확인해 주세요.'; console.warn(e); })
      .finally(() => { UI.statsLoading = false; if (UI.screen === 'stats') render(); });
  }
  const rows = UI.stats;
  if (!rows) return `<section class="dex stats">${head}<div class="paper"><p class="fine">불러오는 중…</p></div></section>`;
  if (UI.statsErr) return `<section class="dex stats">${head}<div class="paper"><p class="fine">${esc(UI.statsErr)}</p></div></section>`;
  const sum = k => rows.reduce((a, r) => a + (r[k] || 0), 0), today = rows[rows.length - 1] || {};
  const card = (k, v, sub) => `<div class="stat-card"><small>${STAT_NAME[k]}</small><b>${v}</b><span>${sub}</span></div>`;
  const cards = ['users', 'visits', 'starts', 'grads'].map(k => card(k, today[k] || 0, `14일 ${sum(k)}`)).join('');
  // 날짜별 막대 (사용자 · 새 게임 · 졸업)
  const max = Math.max(1, ...rows.map(r => Math.max(r.users || 0, r.starts || 0, r.grads || 0)));
  const bars = rows.map(r => `<div class="stat-day" title="${r.id} · 사용자 ${r.users || 0} · 새 게임 ${r.starts || 0} · 졸업 ${r.grads || 0}">
      <div class="stat-bars">${['users', 'starts', 'grads'].map(k => `<i class="b-${k}" style="height:${Math.round((r[k] || 0) / max * 100)}%"></i>`).join('')}</div>
      <small>${+r.id.slice(8)}</small></div>`).join('');
  // 어디까지 했나 (14일 합계): 1학년 1학기 시작을 100%로
  const steps = ['r11', 'r12', 'r21', 'r22', 'r31', 'r32', 'grads'], base = Math.max(1, sum('r11'));
  const funnel = steps.map((k, i) => { const v = sum(k), pct = Math.round(v / base * 100), prev = i ? sum(steps[i - 1]) : v, drop = i && prev ? Math.round((1 - v / prev) * 100) : 0;
    return `<li><span class="f-lab">${k === 'grads' ? '졸업' : STAT_NAME[k].replace('-', '학년 ') + '학기'}</span><span class="f-bar"><i style="width:${Math.min(100, pct)}%"></i></span><b>${v}</b><small>${pct}%${i && drop > 0 ? ` · ${drop}% 그만둠` : ''}</small></li>`; }).join('');
  return `<section class="dex stats">${head}
    <div class="stat-cards">${cards}</div>
    <div class="paper"><h3 class="sec-title">최근 14일</h3>
      <div class="stat-chart">${bars}</div>
      <p class="stat-legend"><span><i class="b-users"></i>사용자</span><span><i class="b-starts"></i>새 게임</span><span><i class="b-grads"></i>졸업</span></p></div>
    <div class="paper"><h3 class="sec-title">어디까지 했나 (14일 합계)</h3>
      <ul class="stat-funnel">${funnel}</ul>
      <p class="fine">각 학기를 시작한 판 수예요. 「그만둠」은 바로 앞 학기보다 줄어든 비율이에요. 아직 진행 중인 판도 있어서 최근 며칠은 낮게 나올 수 있어요.</p></div>
    <p class="fine">사용자는 기기마다 하루 한 번 세요. 이름·닉네임·기기 정보는 저장하지 않아요. <button class="link" data-act="stats-reload">새로고침</button></p>
  </section>`;
}
META_SCREENS.stats = () => renderStats();
const _statMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'stats-reload') { UI.stats = null; render(); return true; }
  return _statMeta(act, arg);
};
function statsFromHash() { if (location.hash === '#stats') { UI.screen = 'stats'; UI.stats = null; render(); window.scrollTo(0, 0); } }
window.addEventListener('hashchange', statsFromHash);
setTimeout(statsFromHash, 0);
