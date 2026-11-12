// 온라인 랭킹 (Firebase Firestore + 익명 로그인)
// FIREBASE_CONFIG에 Firebase 콘솔의 웹 앱 설정을 넣으면 켜진다. 비어 있으면 랭킹 탭은 "준비 중"으로 보인다.
const FIREBASE_CONFIG = null;
const FB_VER = '10.12.2';
const NICK_KEY = 'yangil.nick';
const BAD_WORDS = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '좆', '존나', '니애미', '느금', '애미', '애비', '썅', 'fuck', 'shit'];

const RANK = { ready: null, db: null, uid: null, err: '', cache: {}, loading: {} };
const nickOf = () => { try { return localStorage.getItem(NICK_KEY) || ''; } catch (e) { return ''; } };
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
  if (!FIREBASE_CONFIG || !nick || !rec || rec.rankSent) return;
  if (!(await rankInit())) return;
  const dex = loadDex(), endings = Object.keys(dex.endings || {}).filter(id => typeof endingOf === 'function' && endingOf(id)).slice(0, 30);
  const hall = typeof hallOk === 'function' ? hallOk(rec) : false;
  const FV = firebase.firestore.FieldValue, b = RANK.db.batch();
  b.set(RANK.db.collection('scores').doc(), { uid: RANK.uid, nick, score: Math.round(rec.score), rank: rec.rank, ending: rec.ending, gpa: Math.round(rec.gpa * 10) / 10, mode: rec.mode || 'real', hall, ts: FV.serverTimestamp(), v: 1 });
  b.set(RANK.db.collection('players').doc(RANK.uid), { nick, endings, count: endings.length, ts: FV.serverTimestamp() });
  try {
    await b.commit();
    rec.rankSent = true; markRecordSent(rec.no); RANK.cache = {};
    toast(`랭킹에 올렸어 · ${rec.score}점`);
  } catch (e) { console.warn(e); toast('랭킹에 올리지 못했어. 잠시 뒤 랭킹 화면에서 다시 올려 줘'); }
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
      const snap = await RANK.db.collection('scores').orderBy('score', 'desc').limit(100).get();
      const seen = new Set(); rows = [];
      snap.forEach(d => { const x = d.data(); if (!seen.has(x.uid)) { seen.add(x.uid); rows.push(x); } });  // 한 사람은 최고 기록 하나만
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
  return `<p class="fine rank-status">${r.rankSent ? `랭킹에 올라갔어요 · 닉네임 ${esc(nickOf())}` : `랭킹에 올리는 중… · 닉네임 ${esc(nickOf())}`} · <button class="link" data-act="hall" data-arg="score">랭킹 보기</button></p>`;
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
    const unsent = nickOf() ? loadRecords().filter(r => !r.rankSent).slice(0, 1) : [];
    if (unsent.length) body += `<p class="fine">아직 랭킹에 안 올라간 기록이 있어요. <button class="link" data-act="rank-retry" data-arg="${unsent[0].no}">${esc(unsent[0].name)} · ${unsent[0].score}점 올리기</button></p>`;
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
const _rankMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'hall' && arg) { UI.rankTab = arg; UI.screen = 'hall'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'rank-tab') { UI.rankTab = arg; render(); return true; }
  if (act === 'nick-edit') { try { localStorage.removeItem(NICK_KEY); } catch (e) {} render(); return true; }
  if (act === 'nick-save') {
    const v = (document.getElementById('nick-input') || {}).value || '', why = nickProblem(v);
    if (why) { toast(why); return true; }
    try { localStorage.setItem(NICK_KEY, v.trim()); } catch (e) { toast('이 브라우저에서는 닉네임을 저장할 수 없어요'); return true; }
    toast('닉네임을 저장했어');
    if (arg === 'ending' && UI.rec) rankSubmit(UI.rec).then(() => render()); else render();
    return true;
  }
  if (act === 'rank-retry') { const r = loadRecords().find(x => x.no === +arg); if (r) rankSubmit(r).then(() => render()); return true; }
  return _rankMeta(act, arg);
};
// 졸업하면 자동으로 올린다
const _rankGraduate = graduate;
graduate = function () {
  _rankGraduate();
  if (UI.rec && FIREBASE_CONFIG && nickOf()) rankSubmit(UI.rec).then(() => { if (UI.screen === 'ending') render(); });
};
