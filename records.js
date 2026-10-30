// 졸업 기록 저장, 기록 갤러리, 도감, 결과 카드(PNG) 그리기.
const REC_KEY = 'yangil.records.v1';
const DEX_KEY = 'yangil.dex.v1';

function loadRecords() { return store.get(REC_KEY, []); }
function loadDex() { return Object.assign({ endings: {}, ach: {}, rare: {}, titles: {}, friends: {}, nicks: {} }, store.get(DEX_KEY, {})); }
// 친구 도감: 여러 판에 걸쳐 친구별로 가장 많이 모은 우정 ★
function dexFriend(id, stars) { const d = loadDex(); d.friends[id] = Math.max(d.friends[id] || 0, stars); store.set(DEX_KEY, d); }
function dexMark(kind, id) { const d = loadDex(); d[kind][id] = (d[kind][id] || 0) + 1; store.set(DEX_KEY, d); }

function saveRecord(s, j) {
  const recs = loadRecords();
  const no = recs.reduce((a, r) => Math.max(a, r.no), 0) + 1;
  const friends = Object.keys(CHARACTERS).filter(id => s.met[id]).sort((a, b) => s.aff[b] - s.aff[a]).map(id => ({ id, aff: s.aff[id] }));
  const rec = {
    no, mode: s.mode || 'real', avatar: s.avatar || null, name: s.name, gender: s.gender, traits: s.traits, talent: s.talent, talentRevealed: s.talentRevealed,
    ending: j.ending.id, rank: j.rank, score: j.score, stats: j.m, gpa: Math.round(j.m.gpa * 10) / 10,
    friends, ach: s.ach.slice(), rare: s.rare.slice(), nicks: s.nicks.slice(), club: s.club, absurd: s.absurd,
    bestExam: s.exams.reduce((a, e) => Math.max(a, e.score), 0), date: new Date().toISOString(),
    track: s.track, electives: s.electives, autoClub: s.autoClub, setuk: (s.setuk || []).length, setukTop: (s.setuk || []).slice(-2).map(x => x.text),
    days: (s.days || []).map(d => ({ y: d.y, s: d.s, date: d.date, k: d.k, rare: d.rare, n: d.n, a: d.a, h: d.h })), best: (s.best || []).slice(0, 3),
    college: s.college, daily: s.daily, memories: albumPicks(s.memories || [], 8), rolling: rollingList(s).filter(r => r.id !== 'teacher').slice(0, 4).map(r => ({ name: r.name, msg: r.msg })), title: TITLES[s.title || 'newbie'].name, titleCount: (s.titles || []).length, cameo: Object.assign({}, s.cameo || {}), president: s.flags.president ? 'president' : s.flags.vicePresident ? 'vice' : null, council: s.council ? COUNCIL_DEPTS[s.council].name : null, partner: s.partner ? { id: s.partner, love: s.love[s.partner], secret: !!s.loveSecret } : null, scale: 5, suneung: s.suneung ? s.suneung.grade : null, gradNo: SCHOOL.lastGradNo + (2026 + 2 - SCHOOL.lastGradYear),
  };
  recs.unshift(rec);
  store.set(REC_KEY, recs);
  dexMark('endings', rec.ending);
  return rec;
}

const endingOf = id => ENDINGS.find(e => e.id === id);
const fmtDate = iso => { const d = new Date(iso); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const recNo = n => `No.${String(n).padStart(3, '0')}`;

/* ───────── 졸업 · 엔딩 화면 ───────── */
function renderEnding() {
  const r = UI.rec, e = endingOf(r.ending);
  const best = r.friends.find(f => f.id !== 'teacher');
  return `
  <section class="ending">
    <div class="diploma">
      ${r.avatar ? `<div class="diploma-photo">${avatarSVG(r.avatar, `${esc(r.name)} 증명사진`)}</div>` : ''}
      <p class="diploma-no">제 ${r.gradNo || 57}회 졸업 · 졸업생 ${SCHOOL.grades[3].total}명 중 한 명</p>
      <h1 class="diploma-title">졸 업 장</h1>
      <p class="diploma-name"><span>성명</span> ${esc(r.name)}</p>
      <p class="diploma-body">위 학생은 양일고등학교에서 3년 동안의 과정을 마치고, 그 3년을 아래와 같이 보냈기에 이 증서를 드립니다.</p>
      <p class="diploma-ending"><small>졸업 엔딩</small>${esc(e.name)}</p>
      <p class="ending-desc">${esc(e.desc)}</p>
      <p class="diploma-sign">양일고등학교</p>
      <span class="seal big" aria-hidden="true">양일</span>
      <span class="rank-stamp r-${r.rank}" aria-label="등급 ${r.rank}">${r.rank}</span>
    </div>
    <div class="ending-grid">
      <figure class="card-frame"><img id="card-img" alt="${esc(r.name)}의 졸업 기록 카드"><figcaption>카드를 만드는 중…</figcaption></figure>
      <div class="ending-side">
        <div class="paper">
          <h3 class="sec-title">학교생활기록부</h3>
          <dl class="kv record-table">
            <div><dt>내신 평균</dt><dd>${r.gpa}등급${r.scale === 5 ? '' : ' (9등급제)'}</dd></div>
            <div><dt>수능</dt><dd>${r.suneung ? r.suneung + '등급' : '—'}</dd></div>
            <div><dt>절친</dt><dd>${best && best.aff >= 50 ? esc(charInfo(best.id).name) : '—'}</dd></div>
            <div><dt>업적</dt><dd>${r.ach.length}개</dd></div>
            <div><dt>희귀 이벤트</dt><dd>${r.rare.length}개</dd></div>
            <div><dt>숨은 재능</dt><dd>${esc(TALENTS[r.talent].name)}${r.talentRevealed ? '' : ' (끝내 몰랐다)'}</dd></div>
            <div><dt>진학</dt><dd>${r.college ? (r.college.tier ? esc(`${r.college.tier} ${r.college.major}`) : '재수 결심') : '—'}</dd>${r.college ? `<small>${ROUTES[r.college.route]}</small>` : ''}</div>
            <div><dt>칭호</dt><dd>「${esc(r.title || '양일고 신입생')}」</dd><small>모은 칭호 ${r.titleCount || 1}개</small></div>
            <div><dt>학생회</dt><dd>${r.president === 'president' ? '전교회장' : r.president === 'vice' ? '부회장' : r.council ? `${r.council}` : '—'}</dd></div>
            ${r.mode === 'classic' || r.partner ? `<div><dt>연애</dt><dd>${r.partner ? `${esc(charInfo(r.partner.id).name)} ♥${r.partner.secret ? ' (비밀 연애)' : ''}` : '솔로'}</dd></div>` : ''}
            <div><dt>우정 ★3</dt><dd>${Object.values(r.cameo || {}).filter(x => x >= 3).length}명</dd></div>
            <div><dt>세특 · 자율동아리</dt><dd>${r.setuk || 0}줄${r.autoClub ? ` · ${AUTO_CLUBS[r.autoClub].name}` : ''}</dd></div>
          </dl>
          ${r.nicks.length ? `<p class="nick-line">별명: ${r.nicks.map(n => `"${esc(n)}"`).join(', ')}</p>` : ''}
        </div>
        <div class="create-actions col">
          <button class="btn primary" data-act="share" data-arg="${r.no}">결과 공유하기</button>
          ${UI.shareText ? `<textarea class="share-text" readonly aria-label="공유 문구">${esc(UI.shareText)}</textarea>` : ''}
          <button class="btn" data-act="png" data-arg="${r.no}">PNG로 저장</button>
          <button class="btn" data-act="new">새로운 인생 시작</button>
          <button class="btn" data-act="gallery">기록 갤러리</button>
          ${joinButton('btn')}
        </div>
        <p class="fine">다운로드가 막혀 있으면 카드 이미지를 길게 누르거나 우클릭해서 저장하세요.</p>
      </div>
    </div>
    ${renderBest(r)}
    ${renderEpilogue(r)}
    ${renderLifeMap(r)}
    ${renderRarity(r)}
    ${(r.memories || []).length ? `<div class="paper"><h3 class="sec-title">추억 앨범</h3><div class="album small">${r.memories.map((m, i) => `<figure class="polaroid t-${m.type}" style="--r:${(i % 4 - 1.5) * 1.6}deg"><span class="when">${esc(m.when)}</span><b>${esc(m.title)}</b><figcaption>${esc(m.choice || '')}</figcaption></figure>`).join('')}</div></div>` : ''}
    ${(r.rolling || []).length ? `<div class="paper"><h3 class="sec-title">롤링페이퍼 한 줄</h3><ul class="rolling-mini">${r.rolling.map(x => `<li><b>${esc(x.name)}</b> ${esc(x.msg)}</li>`).join('')}</ul></div>` : ''}
  </section>`;
}

// 나의 명장면 (졸업식 앨범에서 ★을 찍은 장면)
function renderBest(r) {
  if (!(r.best || []).length) return '';
  return `<div class="paper"><h3 class="sec-title">나의 명장면</h3><ol class="best-list">${r.best.map((m, i) => `<li><span class="best-no">★ ${i + 1}</span><small>${esc(m.when)}</small><b>${esc(m.title)}</b>${m.choice ? `<span>${esc(m.choice)}</span>` : ''}</li>`).join('')}</ol></div>`;
}

// 3년 인생 지도: 하루 = 한 칸. 칸을 누르면 그날 있었던 일이 보인다.
function renderLifeMap(r) {
  const days = r.days || [];
  if (!days.length) return '';
  UI.mapDays = days;
  const counts = {}; days.forEach(d => counts[d.k] = (counts[d.k] || 0) + 1);
  const top = Object.keys(counts).filter(k => k !== 'plain').sort((a, b) => counts[b] - counts[a])[0];
  const row = y => [1, 2].map(s => days.map((d, i) => [d, i]).filter(([d]) => d.y === y && d.s === s)
    .map(([d, i]) => `<button type="button" class="map-cell k-${d.k}${d.rare ? ' rare' : ''}" data-act="map-day" data-arg="${i}" aria-label="${y}학년 ${esc(d.date)} ${DAY_KINDS[d.k].label}">${DAY_KINDS[d.k].icon}</button>`).join('')).map(h => `<span class="map-sem">${h}</span>`).join('');
  return `<div class="paper life-map">
    <h3 class="sec-title">3년 인생 지도</h3>
    <p class="fine">하루가 한 칸이야. 모두 ${days.length}일${top ? ` · 가장 많았던 날은 「${DAY_KINDS[top].label}」 (${counts[top]}일)` : ''}. 칸을 누르면 그날이 보여.</p>
    <div class="map-grid">${[1, 2, 3].map(y => `<div class="map-row"><span class="map-year">${y}학년</span>${row(y)}</div>`).join('')}</div>
    <p class="map-detail" id="map-detail" aria-live="polite">칸을 눌러 그날을 다시 떠올려 봐.</p>
    <ul class="map-legend">${Object.keys(DAY_KINDS).filter(k => counts[k]).map(k => `<li><i class="map-cell k-${k}">${DAY_KINDS[k].icon}</i>${DAY_KINDS[k].label} ${counts[k]}</li>`).join('')}</ul>
  </div>`;
}
function showMapDay(i) {
  const d = (UI.mapDays || [])[i], el = document.getElementById('map-detail');
  if (!d || !el) return;
  document.querySelectorAll('.map-cell.on').forEach(c => c.classList.remove('on'));
  const btn = document.querySelector(`.map-cell[data-arg="${i}"]`); if (btn) btn.classList.add('on');
  const what = (d.n || []).length ? d.n.join(' · ') : (d.a || []).length ? `${d.a.join(', ')}을(를) 하며 보낸 하루` : '조용히 지나간 하루';
  el.innerHTML = `<b>${d.y}학년 ${esc(d.date)}</b> · ${DAY_KINDS[d.k].label}${d.h ? ` (${esc(d.h)})` : ''}<br>${esc(what)}`;
}

// 엔딩 희귀도 · 졸업생 통계 (가상 졸업생 시뮬레이션 기준, endings.js의 GRAD_STATS)
function topPct(v, qs, lowerBetter) {
  // qs: 0~100 백분위 값(오름차순). 내 값보다 나은 사람의 비율 = 상위 %
  let below = 0; for (let i = 0; i < qs.length; i++) if (qs[i] < v) below = i;
  let p = lowerBetter ? Math.round(below / (qs.length - 1) * 100) : 100 - Math.round(below / (qs.length - 1) * 100);
  return Math.min(99, Math.max(1, p));
}
function rarityOf(r) {
  const G = GRAD_STATS[r.mode] || GRAD_STATS.real, n = G.n, c = G.endings[r.ending] || 0;
  const per100 = Math.max(c / n * 100, 0);
  const tier = per100 < 2 ? ['전설', 4] : per100 < 5 ? ['희귀', 3] : per100 < 12 ? ['드묾', 2] : ['흔함', 1];
  return { per100, tier };
}
function renderRarity(r) {
  if (typeof GRAD_STATS === 'undefined') return '';
  const { per100, tier } = rarityOf(r), Q = GRAD_STATS.q;
  const stars3 = Object.values(r.cameo || {}).filter(x => x >= 3).length;
  const mine = loadRecords().filter(x => x.ending === r.ending).length;
  const rows = [
    ['내신', `${r.gpa}등급`, topPct(r.gpa, Q.gpa, true)],
    ['종합 점수', `${r.score}점`, topPct(r.score, Q.score)],
    ['우정 ★3 친구', `${stars3}명`, topPct(stars3, Q.stars3)],
    ['업적', `${r.ach.length}개`, topPct(r.ach.length, Q.ach)],
  ];
  return `<div class="paper rarity">
    <h3 class="sec-title">졸업생 통계</h3>
    <div class="rarity-head"><span class="rarity-tier t${tier[1]}">${tier[0]}</span>
      <p>이 엔딩을 본 졸업생은 <b>100명 중 ${per100 < 1 ? '1명도 안 돼' : `${Math.round(per100)}명`}</b>${per100 < 1 ? '' : ''}.<br><small>${mine > 1 ? `나는 이 엔딩을 ${mine}번째 봤어.` : '내 기록에서는 처음 본 엔딩이야!'}</small></p></div>
    <ul class="pct-list">${rows.map(([k, v, p]) => `<li><span>${k}</span><b>${v}</b><span class="pct-bar"><i style="width:${100 - p}%"></i></span><em>상위 ${p}%</em></li>`).join('')}</ul>
    <p class="fine">가상 졸업생 ${GRAD_STATS.real.n + GRAD_STATS.classic.n}명이 여러 방식으로 3년을 보낸 결과와 비교한 거야.</p>
  </div>`;
}

async function afterEndingRender() {
  const img = document.getElementById('card-img');
  const url = await cardDataUrl(UI.rec);
  if (!img.isConnected) return;
  img.src = url;
  img.nextElementSibling.textContent = `${recNo(UI.rec.no)} · ${fmtDate(UI.rec.date)}`;
}

/* ───────── 기록 갤러리 ───────── */
UI.sort = 'new';
function renderGallery() {
  let recs = loadRecords();
  const rankOrder = { S: 0, A: 1, B: 2, C: 3 };
  if (UI.sort === 'rank') recs = recs.slice().sort((a, b) => rankOrder[a.rank] - rankOrder[b.rank] || b.score - a.score);
  if (UI.sort === 'study') recs = recs.slice().sort((a, b) => a.gpa - b.gpa);
  return `
  <section class="gallery">
    <header class="sheet-head row">
      <div><p class="eyebrow">역대 졸업생 명부</p><h2>기록 갤러리</h2></div>
      <button class="link" data-act="menu">← 메인으로</button>
    </header>
    <div class="toolbar">
      <div class="seg" role="group" aria-label="정렬">${[['new', '최신순'], ['rank', '등급순'], ['study', '성적순']].map(([k, l]) => `<button class="${UI.sort === k ? 'on' : ''}" data-act="sort" data-arg="${k}">${l}</button>`).join('')}</div>
      <div class="tool-r"><button class="btn sm" data-act="backup">기록 백업 복사</button><button class="btn sm" data-act="importopen">기록 가져오기</button></div>
    </div>
    <div id="import-box" class="import" hidden>
      <label for="import-text">백업해 둔 기록 코드를 붙여 넣으세요.</label>
      <textarea id="import-text" rows="3"></textarea>
      <div class="tool-r"><button class="btn sm primary" data-act="import">가져오기</button></div>
    </div>
    ${recs.length ? `<div class="rec-grid">${recs.map(r => {
      const e = endingOf(r.ending);
      return `<button class="rec" data-act="view" data-arg="${r.no}">
        <span class="rec-top"><span>${recNo(r.no)}</span><span>${fmtDate(r.date)}</span></span>
        <span class="rec-main"><span class="rank-stamp sm r-${r.rank}">${r.rank}</span><span><b>${esc(r.name)}</b><small>${esc(e.name)}</small></span></span>
        <span class="mini-stats">${STATS.map(k => `<span title="${STAT_LABEL[k]}"><i style="height:${r.stats[k]}%"></i><em>${STAT_LABEL[k][0]}</em></span>`).join('')}</span>
        <span class="rec-traits">${r.daily ? `오늘의 주인공 ${r.daily} · ` : ''}${r.traits.map(t => esc(TRAITS[t].name)).join(' · ')}</span>
        ${r.college && r.college.tier ? `<span class="rec-traits">${esc(r.college.tier + ' ' + r.college.major)}</span>` : ''}
      </button>`; }).join('')}</div>`
    : `<div class="empty"><p>아직 졸업생이 없다.</p><p>첫 번째 인생을 시작해서 명부에 이름을 올려 보자.</p><button class="btn primary" data-act="new">새 인생 시작</button></div>`}
  </section>`;
}
function afterGalleryRender() { }

/* ───────── 도감 ───────── */
UI.dexTab = 'endings';
function renderDex() {
  const d = loadDex();
  const tabs = [['endings', `엔딩 ${ENDINGS.filter(e => d.endings[e.id]).length}/${ENDINGS.length}`], ['ach', `업적 ${Object.keys(ACHIEVEMENTS).filter(k => d.ach[k]).length}/${Object.keys(ACHIEVEMENTS).length}`], ['titles', `칭호 ${Object.keys(TITLES).filter(k => d.titles[k]).length}/${Object.keys(TITLES).length}`], ['friends', `친구 ${CAMEO_IDS.filter(id => d.friends[id]).length}/${CAMEO_IDS.length}`], ['nicks', `별명 ${friendNicks().filter(x => d.nicks[x.nick]).length}/${friendNicks().length}`], ['rare', `희귀 이벤트 ${Object.values(EVENTS).filter(e => e.type === 'rare' && d.rare[e.id]).length}/${Object.values(EVENTS).filter(e => e.type === 'rare').length}`]];
  let body = '';
  if (UI.dexTab === 'endings') body = ENDINGS.map(e => d.endings[e.id]
    ? `<li class="dex-item found"><b>${esc(e.name)}</b><span>${esc(e.desc)}</span><small>달성 ${d.endings[e.id]}회</small></li>`
    : `<li class="dex-item"><b>??????</b><span>힌트: ${esc(e.hint)}</span></li>`).join('');
  if (UI.dexTab === 'ach') body = Object.entries(ACHIEVEMENTS).map(([k, a]) => d.ach[k]
    ? `<li class="dex-item found"><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></li>`
    : `<li class="dex-item"><b>???</b><span>${esc(a.desc)}</span></li>`).join('');
  if (UI.dexTab === 'titles') body = Object.entries(TITLES).map(([k, t]) => d.titles[k]
    ? `<li class="dex-item found"><b>「${esc(t.name)}」</b><span>${esc(t.desc)}</span></li>`
    : `<li class="dex-item"><b>「???」</b><span>${esc(t.desc)}</span></li>`).join('');
  if (UI.dexTab === 'rare') body = Object.values(EVENTS).filter(e => e.type === 'rare').map(e => d.rare[e.id]
    ? `<li class="dex-item found rare"><b>${esc(e.title)}</b><span>${esc(typeof e.text === 'function' ? '' : e.text)}</span></li>`
    : `<li class="dex-item"><b>??? 미발견</b><span>${e.loc ? `${LOCATIONS[e.loc].name} 어딘가에서…` : '학교 어딘가에서…'}</span></li>`).join('');
  if (UI.dexTab === 'nicks') body = renderNickDex(d);
  if (UI.dexTab === 'friends') body = CAMEO_IDS.map(id => { const c = CAMEOS[id], n = d.friends[id] || 0; return n
    ? `<li class="dex-item found"><b>${esc(c.name)} <small class="stars">${'★'.repeat(n)}${'☆'.repeat(3 - n)}</small></b><span>${esc(c.role)}</span>${n >= 3 ? `<small>칭호 「${esc(c.title)}」</small>` : ''}</li>`
    : `<li class="dex-item"><b>???</b><span>힌트: ${esc(c.role)}</span></li>`; }).join('');
  return `
  <section class="dex">
    <header class="sheet-head row">
      <div><p class="eyebrow">모든 인생의 기록</p><h2>양일고 도감</h2></div>
      <button class="link" data-act="menu">← 메인으로</button>
    </header>
    <div class="seg" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${UI.dexTab === k}" class="${UI.dexTab === k ? 'on' : ''}" data-act="dextab" data-arg="${k}">${l}</button>`).join('')}</div>
    <ul class="dex-list">${body}</ul>
  </section>`;
}

/* ───────── 기록 관련 버튼 ───────── */
function recordsAction(act, arg) {
  const recs = loadRecords();
  if (act === 'sort') { UI.sort = arg; render(); }
  if (act === 'dextab') { UI.dexTab = arg; render(); }
  if (act === 'view') openViewer(recs.find(r => r.no === +arg));
  if (act === 'png') savePng(recs.find(r => r.no === +arg) || UI.rec);
  if (act === 'viewclose') closeViewer();
  if (act === 'importopen') { const b = document.getElementById('import-box'); b.hidden = !b.hidden; }
  if (act === 'backup') {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify({ records: recs, dex: loadDex() }))));
    const fallback = () => { const box = document.getElementById('import-box'); box.hidden = false; const t = document.getElementById('import-text'); t.value = code; t.select(); toast('코드를 선택해 두었어요. 직접 복사해 주세요.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(() => toast('기록 백업 코드를 복사했어요.'), fallback); else fallback();
  }
  if (act === 'import') {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(document.getElementById('import-text').value.trim()))));
      const have = new Set(recs.map(r => `${r.date}|${r.name}`));
      let next = recs.reduce((a, r) => Math.max(a, r.no), 0);
      const added = (data.records || []).filter(r => !have.has(`${r.date}|${r.name}`)).map(r => Object.assign({}, r, { no: ++next }));
      store.set(REC_KEY, added.concat(recs).sort((a, b) => b.date.localeCompare(a.date)));
      const d = loadDex();
      ['endings', 'ach', 'rare', 'friends'].forEach(k => Object.entries((data.dex || {})[k] || {}).forEach(([id, v]) => { d[k][id] = Math.max(d[k][id] || 0, v); }));
      store.set(DEX_KEY, d);
      toast(`기록 ${added.length}개를 가져왔어요.`); render();
    } catch (e) { toast('코드를 읽을 수 없어요. 백업 코드 전체를 붙여 넣었는지 확인해 주세요.'); }
  }
}

async function openViewer(rec) {
  const v = document.getElementById('viewer');
  v.hidden = false;
  v.innerHTML = `<div class="viewer-card" role="dialog" aria-modal="true" aria-label="졸업 기록 카드">
    <img alt="${esc(rec.name)}의 졸업 기록 카드">
    <div class="create-actions"><button class="btn primary" data-act="png" data-arg="${rec.no}">PNG로 저장</button><button class="btn" data-act="viewclose">닫기</button></div>
    <p class="fine">다운로드가 막혀 있으면 이미지를 길게 누르거나 우클릭해서 저장하세요.</p></div>`;
  v.querySelector('img').src = await cardDataUrl(rec);
}
function closeViewer() { const v = document.getElementById('viewer'); v.hidden = true; v.innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.getElementById('viewer').hidden) closeViewer(); });

async function savePng(rec) {
  const url = await cardDataUrl(rec);
  const a = document.createElement('a');
  a.href = url; a.download = `양일고_졸업카드_${recNo(rec.no)}_${rec.name}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  toast('카드를 저장했어요. 안 되면 이미지를 길게 눌러 저장하세요.');
}

/* ───────── 결과 카드 그리기 (1080×1440) ───────── */
const cardCache = {};
async function cardDataUrl(rec) {
  const key = `${rec.no}|${rec.date}`;
  if (cardCache[key]) return cardCache[key];
  try { await Promise.all(['700 64px Jua', '400 28px "Gowun Dodum"', '700 28px "Gowun Dodum"'].map(f => document.fonts.load(f))); } catch (e) { /* 기본 글꼴 사용 */ }
  const W = 1080, H = 1800, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const DISP = 'Jua, "Gowun Dodum", sans-serif', BODY = '"Gowun Dodum", "Apple SD Gothic Neo", sans-serif';
  const e = endingOf(rec.ending);

  // 칠판 배경 + 분필 얼룩
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2b4a3c'); g.addColorStop(1, '#1d3329');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = 0.05;
  for (let i = 0; i < 40; i++) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse((i * 263) % W, (i * 419) % H, 120 + (i % 5) * 30, 18, (i % 7) / 3, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  // 나무 테두리
  x.strokeStyle = '#a8794a'; x.lineWidth = 28; x.strokeRect(14, 14, W - 28, H - 28);
  x.strokeStyle = '#7d5631'; x.lineWidth = 4; x.strokeRect(30, 30, W - 60, H - 60);

  x.fillStyle = '#e9efe9'; x.font = `26px ${BODY}`; x.textBaseline = 'alphabetic';
  x.fillText(rec.daily ? `오늘의 주인공 ${rec.daily} · 제${rec.gradNo || 57}회 졸업` : `양일고등학교 제${rec.gradNo || 57}회 졸업 기록 카드`, 80, 110);
  x.textAlign = 'right'; x.fillText(`${recNo(rec.no)} · ${fmtDate(rec.date)}`, W - 80, 110); x.textAlign = 'left';
  x.fillStyle = 'rgba(233,239,233,.35)'; x.fillRect(80, 132, W - 160, 2);

  // 엔딩
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText('졸업 엔딩', 80, 200);
  x.fillStyle = '#ffffff'; x.font = `${e.name.length > 9 ? 70 : 86}px ${DISP}`; x.fillText(e.name, 80, 300);

  // 등급 도장
  x.save(); x.translate(W - 180, 250); x.rotate(-0.18);
  x.strokeStyle = '#ff6b6b'; x.lineWidth = 10; x.beginPath(); x.arc(0, 0, 92, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 76, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#ff6b6b'; x.font = `110px ${DISP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(rec.rank, 0, 8);
  x.restore(); x.textAlign = 'left'; x.textBaseline = 'alphabetic';

  // 증명사진(아바타) + 이름 + 별명 + 특성. 아바타가 있으면 이름 줄을 오른쪽으로 민다
  const av = rec.avatar ? await avatarImage(rec.avatar) : null;
  const L = av ? 244 : 80;
  if (av) {
    x.fillStyle = '#e9efe9'; roundRect(x, 80, 338, 144, 170, 12); x.fill();
    x.save(); roundRect(x, 86, 344, 132, 158, 8); x.clip(); x.fillStyle = '#cfdcd3'; x.fillRect(86, 344, 132, 158); x.drawImage(av, 70, 352, 164, 164); x.restore();
  }
  x.fillStyle = '#ffffff'; x.font = `64px ${DISP}`; x.fillText(rec.name, L, 420);
  const nw = x.measureText(rec.name).width;
  if (rec.college) { x.fillStyle = '#ffd23f'; x.font = `26px ${BODY}`; x.fillText(rec.college.tier ? `${rec.college.tier} ${rec.college.major} 합격 · ${ROUTES[rec.college.route]}` : '재수 결심 · 1년 뒤를 기약', 80, 538); }
  const sub = [rec.gender ? GENDER_LABEL[rec.gender] : '', rec.nicks.length ? `"${rec.nicks[rec.nicks.length - 1]}"` : ''].filter(Boolean).join(' · ');
  if (sub) { x.fillStyle = '#c9d6cd'; x.font = `30px ${BODY}`; x.fillText(sub, L + 20 + nw, 418); }
  let cx = L;
  const chips = (rec.title ? [`「${rec.title}」`] : []).concat(!rec.president && rec.council ? [`학생회 ${rec.council}`] : []).concat(rec.partner ? [`${charInfo(rec.partner.id).name} ♥`] : []).concat(rec.president ? [rec.president === 'president' ? '전교회장' : '부회장'] : []).concat(rec.track ? [TRACKS[rec.track].name] : []).concat(rec.traits.map(t => TRAITS[t].name)).concat(rec.talentRevealed ? [TALENTS[rec.talent].name] : []);
  x.font = `26px ${BODY}`;
  const hl = i => i >= chips.length - (rec.talentRevealed ? 1 : 0);
  chips.forEach((c, i) => {
    const w = x.measureText(c).width + 36;
    if (cx + w > W - 80) return;
    x.fillStyle = hl(i) ? '#ffd23f' : 'rgba(255,255,255,.14)';
    roundRect(x, cx, 450, w, 48, 24); x.fill();
    x.fillStyle = hl(i) ? '#1d3329' : '#ffffff'; x.fillText(c, cx + 18, 483);
    cx += w + 12;
  });

  // 능력치 막대
  let y = 616;
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText('최종 능력치', 80, y - 30);
  STATS.forEach((k, i) => {
    const yy = y + i * 62;
    x.fillStyle = '#e9efe9'; x.font = `28px ${BODY}`; x.fillText(STAT_LABEL[k], 80, yy + 28);
    x.fillStyle = 'rgba(255,255,255,.12)'; roundRect(x, 200, yy + 6, 560, 28, 14); x.fill();
    x.fillStyle = '#f4f7f2'; roundRect(x, 200, yy + 6, Math.max(28, 5.6 * rec.stats[k]), 28, 14); x.fill();
    x.fillStyle = '#ffffff'; x.font = `34px ${DISP}`; x.fillText(String(rec.stats[k]), 784, yy + 32);
  });
  // 성적 박스
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; roundRect(x, 860, y - 6, 140, 300, 16); x.stroke();
  x.textAlign = 'center';
  x.fillStyle = '#c9d6cd'; x.font = `24px ${BODY}`; x.fillText(rec.scale === 5 ? '내신 평균' : '평균 등급', 930, y + 36);
  x.fillStyle = '#ffffff'; x.font = `72px ${DISP}`; x.fillText(String(rec.gpa), 930, y + 120);
  x.fillStyle = '#c9d6cd'; x.font = `24px ${BODY}`; x.fillText(rec.suneung ? '수능' : '최고 점수', 930, y + 190);
  x.fillStyle = '#ffffff'; x.font = `48px ${DISP}`; x.fillText(rec.suneung ? `${rec.suneung}등급` : String(rec.bestExam), 930, y + 252);
  x.textAlign = 'left';

  // 인간관계
  y = 960;
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText('인간관계', 80, y);
  rec.friends.filter(f => f.id !== 'teacher').slice(0, 3).forEach((f, i) => {
    const ch = charInfo(f.id), fx = 80 + i * 310, fy = y + 30;
    x.fillStyle = ch.color; x.beginPath(); x.arc(fx + 34, fy + 34, 34, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.font = `34px ${DISP}`; x.textAlign = 'center'; x.fillText(ch.name.slice(-2, -1), fx + 34, fy + 46); x.textAlign = 'left';
    x.font = `28px ${BODY}`; x.fillText(ch.name, fx + 82, fy + 28);
    x.fillStyle = '#ff9aa8'; x.font = `24px ${BODY}`; x.fillText(`${TIER_LABEL[affTier(f.aff)]} ♥${f.aff}`, fx + 82, fy + 62);
  });
  if (!rec.friends.some(f => f.id !== 'teacher')) { x.fillStyle = '#c9d6cd'; x.font = `26px ${BODY}`; x.fillText('혼자서도 씩씩했던 3년', 80, y + 60); }

  // 업적
  y = 1130;
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText(`업적 ${rec.ach.length} · 세특 ${rec.setuk || 0}줄 · 희귀 ${rec.rare.length} · 병맛 ${rec.absurd}${rec.autoClub ? ` · ${AUTO_CLUBS[rec.autoClub].name}` : ''}`, 80, y);
  cx = 80; let cy = y + 24;
  x.font = `24px ${BODY}`;
  rec.ach.slice(0, 8).forEach(id => {
    const t = ACHIEVEMENTS[id].name, w = x.measureText(t).width + 30;
    if (cx + w > W - 80) { cx = 80; cy += 54; }
    if (cy > y + 100) return;
    x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 2; roundRect(x, cx, cy, w, 42, 21); x.stroke();
    x.fillStyle = '#ffffff'; x.fillText(t, cx + 15, cy + 29);
    cx += w + 10;
  });
  if (!rec.ach.length) { x.fillStyle = '#c9d6cd'; x.fillText('업적은 다음 생에…', 80, y + 52); }

  // 나의 명장면
  y = 1310;
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText('나의 명장면', 80, y);
  const best = (rec.best || []).length ? rec.best : (rec.memories || []).slice(-3);
  x.font = `27px ${BODY}`;
  best.slice(0, 3).forEach((m, i) => {
    x.fillStyle = '#ffd23f'; x.fillText('★', 80, y + 50 + i * 46);
    x.fillStyle = '#c9d6cd'; x.fillText(m.when, 120, y + 50 + i * 46);
    const wx = 120 + x.measureText(m.when).width + 16;
    x.fillStyle = '#ffffff'; let t = m.title; while (t.length > 1 && wx + x.measureText(t).width > W - 80) t = t.slice(0, -2) + '…';
    x.fillText(t, wx, y + 50 + i * 46);
  });
  if (!best.length) { x.fillStyle = '#c9d6cd'; x.fillText('조용하지만 소중했던 3년', 120, y + 50); }

  // 3년 인생 지도 (하루 = 한 칸) + 엔딩 희귀도
  y = 1506;
  x.fillStyle = '#ffd23f'; x.font = `30px ${DISP}`; x.fillText('3년 인생 지도', 80, y);
  const MAPC = { love: '#ff8fa3', school: '#ffd23f', friend: '#7cc7ff', club: '#b69cff', odd: '#7fe0b0', study: '#e9efe9', rest: '#6f8a7b', plain: '#cdbf9f' };
  [1, 2, 3].forEach(yr => {
    const ry = y + 22 + (yr - 1) * 40;
    x.fillStyle = '#c9d6cd'; x.font = `22px ${BODY}`; x.fillText(`${yr}학년`, 80, ry + 25);
    (rec.days || []).filter(d => d.y === yr).forEach((d, i) => {
      const cx2 = 170 + i * 44 + (d.s === 2 ? 20 : 0);
      x.fillStyle = MAPC[d.k] || MAPC.plain; roundRect(x, cx2, ry, 36, 32, 6); x.fill();
      if (d.rare) { x.fillStyle = '#1d3329'; x.font = `20px ${BODY}`; x.textAlign = 'center'; x.fillText('✦', cx2 + 18, ry + 23); x.textAlign = 'left'; }
    });
  });
  if (typeof GRAD_STATS !== 'undefined') {
    const { per100, tier } = rarityOf(rec);
    x.textAlign = 'center';
    x.strokeStyle = '#ffd23f'; x.lineWidth = 3; roundRect(x, 750, y - 4, 250, 150, 16); x.stroke();
    x.fillStyle = '#ffd23f'; x.font = `42px ${DISP}`; x.fillText(tier[0], 875, y + 50);
    x.fillStyle = '#e9efe9'; x.font = `23px ${BODY}`; x.fillText('이 엔딩을 본 졸업생', 875, y + 92);
    x.fillStyle = '#ffffff'; x.font = `28px ${DISP}`; x.fillText(per100 < 1 ? '100명 중 1명 미만' : `100명 중 ${Math.round(per100)}명`, 875, y + 130);
    x.textAlign = 'left';
  }

  // 바닥 분필 받침
  x.fillStyle = '#a8794a'; x.fillRect(30, H - 120, W - 60, 10);
  x.fillStyle = '#f4f7f2'; x.fillRect(120, H - 132, 60, 12); x.fillStyle = '#ffd23f'; x.fillRect(200, H - 132, 44, 12); x.fillStyle = '#ff9aa8'; x.fillRect(262, H - 132, 38, 12);
  x.fillStyle = '#e9efe9'; x.font = `30px ${DISP}`; x.textAlign = 'right'; x.fillText('나는 이번생은 양일고다!', W - 80, H - 62); x.textAlign = 'left';
  x.fillStyle = '#ffd23f'; x.font = `26px ${BODY}`; x.fillText('참되게 · 바르게 · 알차게', 80, H - 64);

  return (cardCache[key] = cv.toDataURL('image/png'));
}

function roundRect(x, l, t, w, h, r) {
  x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath();
}
