// 사건 창 개편 (시안): 대사는 말풍선 + 표정, 서술은 짧은 문단, 글자는 타자 치듯. 누르면 바로 다 보인다.
// 설정 SETTINGS.evClassic 이 true 면 예전 사건 창을 쓴다.

// 글을 서술과 대사로 나눈다: "…" 안은 대사
function splitDialog(text) {
  const out = []; const re = /"([^"]+)"/g; let last = 0, m;
  while ((m = re.exec(text))) {
    const before = text.slice(last, m.index).trim();
    if (before) out.push({ kind: 'narr', text: before });
    out.push({ kind: 'say', text: m[1].trim() });
    last = re.lastIndex;
  }
  const rest = text.slice(last).trim(); if (rest) out.push({ kind: 'narr', text: rest });
  // 서술이 길면 문장 단위로 두세 문장씩 끊는다
  return out.flatMap(seg => {
    if (seg.kind !== 'narr' || seg.text.length < 70) return [seg];
    const sents = seg.text.match(/[^.!?…]+[.!?…]+["']?\s*|[^.!?…]+$/g) || [seg.text];
    const chunks = []; let cur = '';
    sents.forEach(x => { if ((cur + x).length > 70 && cur) { chunks.push(cur.trim()); cur = ''; } cur += x; });
    if (cur.trim()) chunks.push(cur.trim());
    return chunks.map(t => ({ kind: 'narr', text: t }));
  });
}
// 대사 한 줄의 표정 (scene.js의 규칙 재사용)
function lineExpr(line) {
  const hit = typeof MOOD_RULES !== 'undefined' && MOOD_RULES.find(([re]) => re.test(line));
  if (hit) return hit[1].friend.expr || 'smile';
  if (/!|ㅋ|하하|좋아|최고/.test(line)) return 'laugh';
  if (/\?/.test(line)) return 'surprised';
  if (/…|\.\.\./.test(line)) return 'embarrassed';
  return 'smile';
}
function faceHtml(who, expr) {
  if (!who || !CHARACTERS[who] && !(typeof CAMEOS !== 'undefined' && CAMEOS[who])) return '<span class="bub-face anon">…</span>';
  if (who === 'teacher' || (CHARACTERS[who] && CHARACTERS[who].isTeacher)) return `<span class="bub-face">${avatar(who, 'sm')}</span>`;
  return `<span class="bub-face">${avatarSVG(lookOf(who).av, '', { expr })}</span>`;
}
function dialogHtml(text, who, cls = '') {
  const name = who && (CHARACTERS[who] || (typeof CAMEOS !== 'undefined' && CAMEOS[who])) ? (CHARACTERS[who] || CAMEOS[who]).name : '';
  return `<div class="ev-dialog ${cls}">${splitDialog(text).map(seg => seg.kind === 'say'
    ? `<div class="bub-row">${faceHtml(who, lineExpr(seg.text))}<div class="bubble">${name ? `<small>${esc(name)}</small>` : ''}<p class="tw" data-full="${esc(seg.text)}"></p></div></div>`
    : `<p class="narr tw" data-full="${esc(seg.text)}"></p>`).join('')}</div>`;
}

/* ───────── 타자 효과 ───────── */
const TW = { key: null, raf: 0 };
function typingOn() {
  if (SETTINGS.fast || SETTINGS.typeInstant || (navigator.webdriver && !window.__forceTyping)) return false;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) {}
  return true;
}
function runTyping(root, key) {
  cancelAnimationFrame(TW.raf);
  const els = [...root.querySelectorAll('.tw')];
  const finish = () => { els.forEach(el => { el.textContent = el.dataset.full; el.classList.add('done'); }); root.classList.add('typed'); TW.key = key; };
  if (!typingOn() || TW.key === key) return finish();
  let i = 0, ch = 0, lastT = 0; const speed = 16;   // 한 번에 2글자씩, 약 1초에 120자
  root.classList.remove('typed');
  const step = t => {
    if (!root.isConnected) return;
    if (t - lastT >= speed) {
      lastT = t; const el = els[i]; if (!el) return finish();
      const full = el.dataset.full; ch += 2;
      el.textContent = full.slice(0, ch); el.classList.add('typing');
      if (ch >= full.length) { el.classList.remove('typing'); el.classList.add('done'); i++; ch = 0; lastT = t + 160; }
    }
    if (i < els.length) TW.raf = requestAnimationFrame(step); else finish();
  };
  TW.raf = requestAnimationFrame(step);
  root.addEventListener('click', e => { if (!root.classList.contains('typed') && !e.target.closest('button')) { cancelAnimationFrame(TW.raf); finish(); } });
}

/* ───────── 사건 창 그리기 (보스전이 아닐 때) ───────── */
const _evRenderModal = renderModal;
renderModal = function () {
  if (SETTINGS.evClassic || (typeof UI !== 'undefined' && UI.boss)) return _evRenderModal();
  if (!S || !S.cur || UI.screen !== 'game') return _evRenderModal();
  const m = document.getElementById('modal');
  if (m.classList.contains('boss-overlay')) m.className = 'overlay';
  const e = EVENTS[S.cur.id], c = S.cur.ctx, r = S.cur.result;
  const who = e.who ? e.who(S, c) : null;
  const text = typeof e.text === 'function' ? e.text(S, c) : e.text;
  const typeLabel = { daily: e.rel ? '친구' : '일상', absurd: '병맛 사건', rare: '희귀 이벤트', meet: '첫 만남', char: '친구 이벤트', story: '학교 일정', talk: '말 걸기', club: '자율동아리', love: '연애', council: '학생회', cameo: '친구' }[e.type] || '사건';
  m.hidden = false;
  const key = S.cur.id + ':' + (r ? 'r' : 'q') + ':' + S.dayNo + ':' + S.slot;
  m.innerHTML = `
  <div class="ev-card ev2 t-${e.type}" role="dialog" aria-modal="true" aria-labelledby="ev-title">
    <div class="ev2-scene">${sceneFor(e, c, who, r ? text + ' ' + r.text : text)}<span class="ev2-tag">${typeLabel}${e.type === 'rare' ? ' · 도감 기록' : ''}</span></div>
    <h2 id="ev-title">${esc(eventTitle(e, c))}</h2>
    ${r ? `<p class="ev2-chosen">선택 · ${esc(r.choice)}</p>${dialogHtml(r.text, who, 'result')}
      <div class="ev2-after">${diffChips(r.diffs)}${notesHtml(r.notes)}<button class="btn primary wide" data-act="evclose">확인</button></div>`
    : `${dialogHtml(text, who)}
      <div class="ev2-after ev-choices">${choicesOf(e, c).map((ch, i) => { const ok = !ch.req || ch.req(S); const hint = typeof ch.hint === 'function' ? ch.hint() : ch.hint;
        return `<button class="choice" data-act="choose" data-arg="${i}" ${ok ? '' : 'disabled'}><b>${esc(ch.label)}</b>${hint ? `<small>${esc(hint)}</small>` : ''}${ok ? '' : `<small>${esc(ch.reqText)}</small>`}</button>`; }).join('')}</div>`}
    <p class="ev2-skip fine">화면을 누르면 바로 다 보여요</p>
  </div>`;
  const card = m.querySelector('.ev2');
  runTyping(card, key);
  const f = m.querySelector('[data-act=evclose]') || m.querySelector('.choice:not([disabled])');
  if (f) f.focus({ preventScroll: true });
};
