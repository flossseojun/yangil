// 게임 안 제보 화면: 버그 · 오타 · 아이디어를 Firebase(reports 컬렉션)에 바로 보낸다.
// 진행 상황(화면, 학년·학기·날짜, 보고 있던 사건, 기기)이 함께 저장돼서 어디서 생긴 일인지 알 수 있다.
const REPORT_KINDS = [['bug', '버그'], ['typo', '오타·어색한 글'], ['idea', '아이디어'], ['etc', '기타']];

function reportContext() {
  const c = { screen: UI.screen || '', ua: (navigator.userAgent || '').slice(0, 160), w: innerWidth, at: location.hostname || 'file' };
  if (S) Object.assign(c, { year: S.year, sem: S.sem, day: S.day, mode: S.mode, event: S.cur ? S.cur.id : '', boss: !!UI.boss });
  return c;
}
function openReport() {
  if (document.getElementById('report')) return;
  const el = document.createElement('div');
  el.id = 'report'; el.className = 'overlay notice-overlay';
  const ctx = reportContext();
  el.innerHTML = `<div class="card notice-card report-card" role="dialog" aria-modal="true" aria-labelledby="report-title">
    <p class="eyebrow">게임 만든 사람에게 바로 전달돼요</p>
    <h2 id="report-title">제보하기</h2>
    <div class="report-kinds" role="radiogroup" aria-label="종류">${REPORT_KINDS.map(([k, n], i) => `<label><input type="radio" name="rkind" value="${k}" ${i === 0 ? 'checked' : ''}> ${n}</label>`).join('')}</div>
    <textarea id="report-text" maxlength="500" rows="5" placeholder="어떤 일이 있었는지 적어 주세요. 예: 보스전에서 타이밍 바를 눌렀는데 넘어가지 않아요."></textarea>
    <p class="fine report-ctx">함께 보내는 정보: ${esc([ctx.screen, S ? `${S.year}학년 ${S.sem}학기 ${S.day}일째` : '', ctx.event ? `사건 ${ctx.event}` : '', `화면 폭 ${ctx.w}px`].filter(Boolean).join(' · '))}</p>
    <p class="report-msg fine" aria-live="polite"></p>
    <div class="create-actions"><button class="btn" data-rep="close">닫기</button><button class="btn primary" data-rep="send">보내기</button></div>
  </div>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-rep]');
    if (e.target === el || (b && b.dataset.rep === 'close')) { el.remove(); return; }
    if (b && b.dataset.rep === 'send') sendReport(el);
  });
  document.body.appendChild(el);
  el.querySelector('#report-text').focus();
}
async function sendReport(el) {
  const text = el.querySelector('#report-text').value.trim(), kind = (el.querySelector('input[name=rkind]:checked') || {}).value || 'etc';
  const msg = el.querySelector('.report-msg'), btn = el.querySelector('[data-rep=send]');
  if (text.length < 2) { msg.textContent = '내용을 조금만 더 적어 주세요.'; return; }
  btn.disabled = true; msg.textContent = '보내는 중…';
  try {
    if (!(await rankInit())) throw new Error('offline');
    await RANK.db.collection('reports').add({ uid: RANK.uid, nick: (typeof nickOf === 'function' ? nickOf() : '') || '', kind, text: text.slice(0, 500), ctx: reportContext(), ts: firebase.firestore.FieldValue.serverTimestamp(), v: 1 });
    el.querySelector('.report-card').innerHTML = `<h2>고마워요!</h2><p>제보가 잘 전달됐어요. 확인해서 고칠게요.</p><div class="create-actions"><button class="btn primary" data-rep="close">닫기</button></div>`;
  } catch (e) {
    console.warn(e); btn.disabled = false;
    msg.innerHTML = `보내지 못했어요. 인터넷 연결을 확인하거나 ${FEEDBACK_URL ? `<a href="${esc(FEEDBACK_URL)}" target="_blank" rel="noopener">의견 폼</a>으로 보내 주세요.` : '잠시 뒤 다시 시도해 주세요.'}`;
  }
}
// 「의견 보내기」 버튼을 게임 안 제보 화면으로 바꾼다
feedbackButton = cls => `<button class="${cls}" data-act="report-open">의견 보내기</button>`;
const _repMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'report-open') { openReport(); return true; }
  return _repMeta(act, arg);
};
