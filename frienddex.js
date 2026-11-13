// 친구 도감: 기록 갤러리 안의 「졸업생 | 친구 도감」 탭. 실제 친구만, 졸업 기록과 도감에서 모은다.

function friendDexData() {
  const recs = loadRecords(), d = loadDex();
  return CAMEO_IDS.filter(id => !CAMEOS[id].fixed).map(id => {
    const c = CAMEOS[id], sigNick = typeof SIG_EVENTS !== 'undefined' && SIG_EVENTS[id] ? SIG_EVENTS[id][3] : null;
    const withMe = recs.filter(r => (r.friends || []).some(f => f.id === id) || (r.cameo || {})[id]);
    const bestStars = Math.max((d.friends || {})[id] || 0, ...withMe.map(r => (r.cameo || {})[id] || 0), 0);
    const nicks = sigNick && recs.some(r => (r.nicks || []).includes(sigNick)) ? [sigNick] : [];
    return { id, name: c.name, role: c.role, met: withMe.length > 0 || bestStars > 0, bestStars, nicks, grads: withMe.length };
  });
}
function renderFriendDex() {
  const data = friendDexData(), met = data.filter(x => x.met).length, open = UI.fdexOpen;
  const card = x => `<button class="fdex-card ${x.met ? 'met' : ''} ${open === x.id ? 'open' : ''}" data-act="fdex-open" data-arg="${x.id}" aria-expanded="${open === x.id}">
    <span class="fdex-pic">${avatarSVG(lookOf(x.id).av, x.name)}</span>
    <b>${esc(x.name)}</b><small>${esc(x.role)}</small>
    ${x.met ? `<span class="stars">${'★'.repeat(x.bestStars)}${'☆'.repeat(3 - x.bestStars)}</span>` : '<span class="fdex-lock">아직 못 만남</span>'}</button>`;
  const sel = open && data.find(x => x.id === open);
  const detail = sel ? `<div class="paper fdex-detail"><div class="fdex-detail-head"><span class="fdex-pic big">${avatarSVG(lookOf(sel.id).av, sel.name)}</span>
      <div><b>${esc(sel.name)}</b><small>${esc(sel.role)}</small><p>${esc(CAMEOS[sel.id].desc || '')}</p></div></div>
    ${sel.met ? `<p class="fdex-roll">“${esc((CAMEO_ROLLING[sel.id] || [])[Math.max(0, sel.bestStars - 1)] || '')}”</p>
      <p class="fine">함께 졸업 ${sel.grads}번 · 최고 우정 ${'★'.repeat(sel.bestStars) || '없음'}${sel.nicks.length ? ` · 얻은 별명 「${esc(sel.nicks[0])}」` : ''}</p>
      ${sel.bestStars >= 3 && typeof FUTURE !== 'undefined' && FUTURE[sel.id] ? `<p class="fdex-future"><b>10년 뒤</b> ${esc(FUTURE[sel.id][0])}</p>` : '<p class="fine">우정 ★★★을 채우면 10년 뒤 모습이 열려요.</p>'}`
      : '<p class="fine">아직 만난 적이 없어요. 이 친구가 뽑힌 판에서 친해져 보세요.</p>'}
    <button class="link" data-act="fdex-open" data-arg="">닫기</button></div>` : '';
  return `<p class="fdex-count"><b>만난 친구 ${met} / ${data.length}</b> · ★★★ ${data.filter(x => x.bestStars >= 3).length}명</p>
    ${detail}<div class="fdex-grid">${data.map(card).join('')}</div>`;
}

const _fdexGallery = renderGallery;
renderGallery = function () {
  const tab = UI.galTab || 'grads';
  const tabs = `<div class="seg gal-tabs" role="tablist">${[['grads', '졸업생'], ['friends', '친구 도감']].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="gal-tab" data-arg="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'grads') { const html = _fdexGallery(), i = html.indexOf('</header>') + 9; return html.slice(0, i) + tabs + html.slice(i); }
  return `<section class="gallery"><header class="sheet-head row"><div><p class="eyebrow">함께한 친구들</p><h2>기록 갤러리</h2></div><button class="link" data-act="menu">← 메인으로</button></header>${tabs}${renderFriendDex()}</section>`;
};
const _fdexMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'gal-tab') { UI.galTab = arg; UI.fdexOpen = null; render(); return true; }
  if (act === 'fdex-open') { UI.fdexOpen = arg || null; render(); if (arg) window.scrollTo({ top: 0, behavior: 'smooth' }); return true; }
  return _fdexMeta(act, arg);
};
