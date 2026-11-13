// 온라인 랭킹 (Firebase Firestore + 익명 로그인)
// FIREBASE_CONFIG에 Firebase 콘솔의 웹 앱 설정을 넣으면 켜진다. 비어 있으면 랭킹 탭은 "준비 중"으로 보인다.
// 공개돼도 괜찮은 웹 앱 설정값이다. 데이터는 Firestore 보안 규칙(firebase/firestore.rules)이 지킨다.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDna3Ns5wBfQSWNeGmc4yPsuXh816QeOIU',
  authDomain: 'yangil.firebaseapp.com',
  projectId: 'yangil',
  storageBucket: 'yangil.firebasestorage.app',
  messagingSenderId: '876969371374',
  appId: '1:876969371374:web:434d7c884e2fc8e52835ff',
};
const FB_VER = '10.12.2';
const NICK_KEY = 'yangil.nick';
const BAD_WORDS = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', '니애미', '느금', '애미', '애비', '썅', 'fuck', 'shit'];

const RANK = { ready: null, db: null, uid: null, err: '', cache: {}, loading: {} };
// 닉네임은 기기에 저장한다. 저장이 막힌 브라우저에서는 이번 접속 동안만 기억한다.
const nickOf = () => { try { return localStorage.getItem(NICK_KEY) || RANK.memNick || ''; } catch (e) { return RANK.memNick || ''; } };
function setNick(v) { RANK.memNick = v; try { localStorage.setItem(NICK_KEY, v); } catch (e) {} }
// 랭킹에 올릴 기록: 새 점수 계산(난이도 조정 뒤)으로 만든 기록만 (sv 2 이상)
const rankable = r => (r.sv || 0) >= 2 && !r.rankSent;
function nickProblem(n) {
  n = (n || '').trim();
  if (n.length < 2 || n.length > 10) return '닉네임은 2~10자로 적어 줘';
  if (BAD_WORDS.some(w => n.toLowerCase().replace(/\s/g, '').includes(w))) return '다른 닉네임을 써 줘';
  return '';
}
function loadScript(src) {
  return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('load ' + src)); document.head.appendChild(s); });
}
// SDK는 랭킹을 처음 쓸 때만 불러온다
function rankInit() {
  if (!FIREBASE_CONFIG) return Promise.resolve(false);
  if (RANK.ready) return RANK.ready;
  const base = `https://cdn.jsdelivr.net/npm/firebase@${FB_VER}/`;
  RANK.ready = loadScript(base + 'firebase-app-compat.js')
    .then(() => Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]))
    .then(() => { firebase.initializeApp(FIREBASE_CONFIG); RANK.db = firebase.firestore(); return firebase.auth().signInAnonymously(); })
    .then(c => { RANK.uid = c.user.uid; return true; })
    .catch(e => { RANK.err = '랭킹 서버에 연결하지 못했어요. 인터넷 연결을 확인하거나 게임 사이트에서 열어 주세요.'; console.warn(e); RANK.ready = null; return false; });
  return RANK.ready;
}

// 졸업 기록 올리기: 점수 기록 1개 + 내 엔딩 수집 현황(한 사람당 문서 1개)을 한 번에 쓴다
async function rankSubmit(rec) {
  const nick = nickOf();
  if (!FIREBASE_CONFIG || !nick || !rec || !rankable(rec)) return false;
  if (!(await rankInit())) return;
  const dex = loadDex(), endings = Object.keys(dex.endings || {}).filter(id => typeof endingOf === 'function' && endingOf(id)).slice(0, 30);
  const hall = typeof hallOk === 'function' ? hallOk(rec) : false;
  const FV = firebase.firestore.FieldValue, b = RANK.db.batch();
  b.set(RANK.db.collection('scores').doc(), { uid: RANK.uid, nick, score: Math.round(rec.score), rank: rec.rank, ending: rec.ending, gpa: Math.round(rec.gpa * 10) / 10, mode: rec.mode || 'real', hall, ts: FV.serverTimestamp(), v: 1 });
  b.set(RANK.db.collection('players').doc(RANK.uid), { nick, endings, count: endings.length, ts: FV.serverTimestamp() });
  try {
    await b.commit();
    rec.rankSent = true; markRecordSent(rec.no); RANK.cache = {};
    if (!quietRank) toast(`랭킹에 올렸어 · ${rec.score}점`);
    return true;
  } catch (e) { console.warn(e); return false; }
}
// 아직 못 올린 기록을 오래된 것부터 하나씩 자동으로 올린다 (서버 규칙상 20초에 한 번)
let quietRank = false;
function rankDrain(delay = 3000) {
  if (!FIREBASE_CONFIG || !nickOf() || RANK.draining) return;
  RANK.draining = true;
  const step = async () => {
    const next = loadRecords().filter(rankable).sort((a, b) => a.no - b.no)[0];
    if (!next || !nickOf()) { RANK.draining = false; return; }
    quietRank = true; await rankSubmit(next); quietRank = false;
    if (UI.screen === 'hall' || UI.screen === 'ending') render();
    setTimeout(step, 21000);
  };
  setTimeout(step, delay);
}
function markRecordSent(no) { const recs = loadRecords(); const r = recs.find(x => x.no === no); if (r) { r.rankSent = true; store.set(REC_KEY, recs); } }

// 랭킹 읽기 (화면을 열 때 한 번, 30초 동안 다시 쓰기)
async function rankFetch(tab) {
  const c = RANK.cache[tab]; if (c && Date.now() - c.at < 30000) return c.rows;
  if (RANK.loading[tab]) return null; RANK.loading[tab] = true;
  try {
    if (!(await rankInit())) return null;
    let rows;
    if (tab === 'score') {
      // 판마다 모두 보여 준다 (한 사람이 여러 줄에 나올 수 있다)
      const snap = await RANK.db.collection('scores').orderBy('score', 'desc').limit(100).get();
      rows = []; snap.forEach(d => rows.push(d.data()));
    } else if (tab === 'ending') {
      const snap = await RANK.db.collection('players').orderBy('count', 'desc').limit(50).get();
      rows = []; snap.forEach(d => rows.push(Object.assign({ uid: d.id }, d.data())));
    } else {
      const snap = await RANK.db.collection('scores').where('hall', '==', true).limit(50).get();
      rows = []; snap.forEach(d => rows.push(d.data()));
      rows.sort((a, b) => (b.ts ? b.ts.toMillis() : 0) - (a.ts ? a.ts.toMillis() : 0));
    }
    RANK.cache[tab] = { at: Date.now(), rows };
    return rows;
  } catch (e) { console.warn(e); RANK.err = '랭킹을 불러오지 못했어요.'; return null; }
  finally { RANK.loading[tab] = false; }
}

// 닉네임 칸 (처음 한 번만)
function nickBoxHtml(context) {
  return `<div class="paper nick-box"><h3 class="sec-title">랭킹 닉네임</h3>
    <p class="fine">${context === 'ending' ? '닉네임을 정하면 이번 기록부터 졸업할 때마다 자동으로 랭킹에 올라가요.' : '닉네임을 정하면 졸업할 때마다 자동으로 랭킹에 올라가요. 실명 대신 별명을 써도 돼요.'}</p>
    <div class="nick-row"><input id="nick-input" maxlength="10" placeholder="2~10자" value="${esc(nickOf())}"><button class="btn primary" data-act="nick-save" data-arg="${context}">저장</button></div></div>`;
}
// 졸업 화면: 자동 업로드 상태
function rankEndingHtml(r) {
  if (!FIREBASE_CONFIG) return '';
  if (!nickOf()) return nickBoxHtml('ending');
  return `<p class="fine rank-status">${r.rankSent ? `랭킹에 올라갔어요 · ${esc(nickOf())}` : `랭킹에 올리는 중… 인터넷이 연결되면 자동으로 올라가요 · ${esc(nickOf())}`} · <button class="link" data-act="hall" data-arg="score">랭킹 보기</button></p>`;
}
// 게임을 시작하기 전에 닉네임부터 정한다
function renderNickGate() {
  return `<section class="dex nick-gate">
    <header class="sheet-head row"><div><p class="eyebrow">입학 전에 하나만</p><h2>랭킹 닉네임 정하기</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <div class="paper"><p>졸업할 때마다 기록이 이 닉네임으로 <b>랭킹에 자동으로</b> 올라가요. 실명 대신 별명을 써도 돼요.</p>
      <div class="nick-row"><input id="nick-input" maxlength="10" placeholder="2~10자" value="${esc(nickOf())}" autofocus><button class="btn primary" data-act="nick-save" data-arg="gate">정하고 시작하기</button></div>
      <p class="fine">닉네임은 나중에 랭킹 화면에서 바꿀 수 있어요. 기기(브라우저)마다 따로 저장돼요.</p></div>
  </section>`;
}

function renderRankHall() {
  const tab = UI.rankTab || 'score';
  const tabs = [['score', '졸업 점수'], ['ending', '엔딩 수집'], ['hall', '명예의 전당']];
  const head = `<header class="sheet-head row"><div><p class="eyebrow">친구들과 겨루기</p><h2>랭킹 · 명예의 전당</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <nav class="rank-tabs" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${tab === k}" data-act="rank-tab" data-arg="${k}">${n}</button>`).join('')}</nav>`;
  let body = '';
  if (!FIREBASE_CONFIG) body = `<div class="paper"><p><b>온라인 랭킹은 준비 중이에요.</b></p><p class="fine">곧 친구들과 졸업 점수와 엔딩 수집으로 순위를 겨룰 수 있어요.</p></div>`;
  else {
    const c = RANK.cache[tab];
    if (!c) { rankFetch(tab).then(() => { if (UI.screen === 'hall') render(); }); }
    const rows = c ? c.rows : null, me = RANK.uid;
    if (!nickOf()) body += nickBoxHtml('rank');
    if (!rows) body += `<div class="paper"><p class="fine">${RANK.err ? esc(RANK.err) : '불러오는 중…'}</p></div>`;
    else if (!rows.length) body += `<div class="paper"><p class="fine">아직 기록이 없어요. 첫 번째 주인공이 되어 봐요.</p></div>`;
    else body += `<ol class="rank-list">${rows.map((x, i) => {
      const meCls = x.uid === me ? ' me' : '';
      const right = tab === 'ending' ? `<b class="rank-val">${x.count}<small> / ${ENDINGS.length}</small></b>`
        : `<b class="rank-val">${x.score}<small>점</small></b>`;
      const sub = tab === 'ending' ? '모은 엔딩' : `${x.rank}등급 · ${esc((endingOf(x.ending) || {}).name || '')} · 내신 ${x.gpa}`;
      return `<li class="rank-row${meCls}"><span class="rank-no${i < 3 && tab !== 'hall' ? ' top' + (i + 1) : ''}">${tab === 'hall' ? '🏆' : i + 1}</span><div><b>${esc(x.nick)}${x.uid === me ? ' (나)' : ''}</b><small>${sub}</small></div>${right}</li>`;
    }).join('')}</ol>`;
    // 아직 못 올린 내 기록 다시 올리기
    const unsent = nickOf() ? loadRecords().filter(rankable).length : 0;
    if (unsent) { body += `<p class="fine">아직 안 올라간 기록 ${unsent}개를 자동으로 올리는 중이에요 (20초에 하나씩).</p>`; rankDrain(500); }
    if (nickOf()) body += `<p class="fine">닉네임 ${esc(nickOf())} · <button class="link" data-act="nick-edit">바꾸기</button></p>`;
  }
  if (tab === 'hall') {
    // 기존 명예의 전당(입성 조건 · 내 기록 · 헌액된 졸업생)을 아래에 이어 붙인다
    const inner = renderHall().replace(/^[\s\S]*?<\/header>/, '').replace(/<\/section>\s*$/, '');
    body += inner;
  }
  return `<section class="dex hall">${head}${body}</section>`;
}

META_SCREENS.hall = () => renderRankHall();
META_SCREENS.nick = () => renderNickGate();
const _rankMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'hall' && arg) { UI.rankTab = arg; UI.screen = 'hall'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'rank-tab') { UI.rankTab = arg; render(); return true; }
  // 닉네임 없이 게임을 시작하려 하면 닉네임 화면으로 보낸다
  if (FIREBASE_CONFIG && !nickOf() && (act === 'new' || act === 'continue' || act === 'daily')) { UI.afterNick = act; UI.screen = 'nick'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'nick-edit') { RANK.memNick = ''; try { localStorage.removeItem(NICK_KEY); } catch (e) {} render(); return true; }
  if (act === 'nick-save') {
    const v = (document.getElementById('nick-input') || {}).value || '', why = nickProblem(v);
    if (why) { toast(why); return true; }
    setNick(v.trim()); toast('닉네임을 정했어');
    rankDrain(1000);
    if (arg === 'gate') { const go = UI.afterNick || 'new'; UI.afterNick = null; UI.screen = 'menu'; render(); const btn = document.querySelector(`[data-act="${go}"]`); if (btn) btn.click(); }
    else render();
    return true;
  }
  return _rankMeta(act, arg);
};
// 졸업하면 자동으로 올린다
const _rankGraduate = graduate;
graduate = function () {
  _rankGraduate();
  if (UI.rec && FIREBASE_CONFIG && nickOf()) rankSubmit(UI.rec).then(() => { if (UI.screen === 'ending') render(); rankDrain(21000); });
};
// 접속할 때 못 올린 기록이 있으면 자동으로 올린다
if (FIREBASE_CONFIG && nickOf()) rankDrain(4000);

/* ───────── 공지사항 팝업 ─────────
   게임을 열면 한 번 뜬다. 「확인」을 누르면 이 기기에서는 다시 안 뜬다. (자동 테스트 브라우저에서는 띄우지 않는다) */
const NOTICE = {
  id: 'ranking-2026-11',
  title: '🏆 랭킹 시스템이 열렸어요!',
  date: '2026.11.13',
  body: [
    ['친구들과 순위 겨루기', '메인 메뉴 「랭킹」에서 졸업 점수 · 엔딩 수집 · 명예의 전당 순위를 볼 수 있어요.'],
    ['닉네임 한 번만', '게임을 시작할 때 닉네임(2~10자)을 정하면 끝. 실명 대신 별명을 써도 돼요.'],
    ['졸업하면 자동 등록', '졸업할 때마다 기록이 판마다 자동으로 랭킹에 올라가요. 따로 누를 건 없어요.'],
    ['명예의 전당', '전설 엔딩 + S등급 + 내신 1점대를 한 판에 채우면 명예의 전당에 이름이 올라가요.'],
  ],
};
const NOTICE_KEY = 'yangil.notice';
function showNotice(force) {
  if (!force) { try { if (navigator.webdriver || localStorage.getItem(NOTICE_KEY) === NOTICE.id) return; } catch (e) { return; } }
  if (document.getElementById('notice')) return;
  const el = document.createElement('div');
  el.id = 'notice'; el.className = 'overlay notice-overlay';
  el.innerHTML = `<div class="card notice-card" role="dialog" aria-modal="true" aria-labelledby="notice-title">
    <p class="eyebrow">양일고 공지사항 · ${NOTICE.date}</p>
    <h2 id="notice-title">${esc(NOTICE.title)}</h2>
    <ul class="notice-list">${NOTICE.body.map(([h, t]) => `<li><b>${esc(h)}</b><span>${esc(t)}</span></li>`).join('')}</ul>
    <div class="create-actions"><button class="btn" data-notice="rank">랭킹 보러 가기</button><button class="btn primary" data-notice="ok">확인</button></div>
  </div>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-notice]'); if (!b && e.target !== el) return;
    try { localStorage.setItem(NOTICE_KEY, NOTICE.id); } catch (x) {}
    el.remove();
    if (b && b.dataset.notice === 'rank' && !S) { UI.screen = 'hall'; UI.rankTab = 'score'; render(); }
  });
  document.body.appendChild(el);
  const ok = el.querySelector('[data-notice=ok]'); if (ok) ok.focus();
}
setTimeout(() => showNotice(false), 400);
