// 제보: 네이버 폼으로 받는다. 제보 화면에서 폼을 열고, 원하면 지금 진행 상황을 복사해 폼에 붙여 넣을 수 있다.
function reportContextText() {
  const parts = [`화면 ${UI.screen || ''}`];
  if (S) parts.push(`${S.mode === 'classic' ? '연애 모드' : '실제 친구 모드'} ${S.year}학년 ${S.sem}학기 ${S.day}일째`, S.cur ? `사건 ${S.cur.id}` : '', UI.boss ? '보스전 중' : '');
  parts.push(`화면 폭 ${innerWidth}px`, (navigator.userAgent || '').replace(/\s+/g, ' ').slice(0, 120));
  return parts.filter(Boolean).join(' · ');
}
function openReport() {
  if (document.getElementById('report')) return;
  const el = document.createElement('div');
  el.id = 'report'; el.className = 'overlay notice-overlay';
  el.innerHTML = `<div class="card notice-card report-card" role="dialog" aria-modal="true" aria-labelledby="report-title">
    <p class="eyebrow">버그 · 오타 · 아이디어</p>
    <h2 id="report-title">제보하기</h2>
    <p>제보 폼이 새 창으로 열려요. 어디서 생긴 일인지 알려 주면 더 빨리 고칠 수 있어요.</p>
    <div class="report-ctx-box"><small>지금 진행 상황</small><p>${esc(reportContextText())}</p></div>
    <p class="report-msg fine" aria-live="polite"></p>
    <div class="create-actions"><button class="btn" data-rep="copy">진행 상황 복사</button><a class="btn primary" href="${esc(FEEDBACK_URL)}" target="_blank" rel="noopener" data-rep="open">제보 폼 열기</a></div>
    <button class="link report-close" data-rep="close">닫기</button>
  </div>`;
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-rep]');
    if (e.target === el || (b && b.dataset.rep === 'close')) { el.remove(); return; }
    if (b && b.dataset.rep === 'copy') {
      const msg = el.querySelector('.report-msg'), t = reportContextText();
      try { await navigator.clipboard.writeText(t); msg.textContent = '복사했어요. 폼의 내용 칸에 붙여 넣어 주세요.'; }
      catch (x) { msg.textContent = '복사가 막혀 있어요. 위 글을 길게 눌러 복사해 주세요.'; }
    }
  });
  document.body.appendChild(el);
}
// 「의견 보내기」 버튼도 제보 화면을 연다
feedbackButton = cls => `<button class="${cls}" data-act="report-open">의견 보내기</button>`;
const _repMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'report-open') { openReport(); return true; }
  return _repMeta(act, arg);
};
