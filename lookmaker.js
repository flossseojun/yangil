// 내 외모 보내기: 게임에 나오는(나올) 친구가 자기 모습을 직접 골라 코드로 보낸다.
// 코드를 받으면 FRIEND_LOOKS에 그대로 옮겨 적는다. (구글 폼 미리 채우기 주소를 넣으면 버튼 하나로 바로 제출된다)
const LOOK_FORM_URL = '';          // 예: 'https://docs.google.com/forms/d/e/…/viewform?usp=pp_url&entry.123='
const LOOK_KEYS = ['hair', 'hairColor', 'skin', 'eyes', 'build', 'acc'];

function lookState() {
  if (!UI.look) UI.look = { name: '', av: Object.assign(randomAvatar('m'), { face: 'smile', acc: 'none' }), tall: false, memo: '', code: '' };
  return UI.look;
}
function lookCode(L) {
  const a = L.av, parts = LOOK_KEYS.map(k => `${k}=${a[k] || ''}`).concat(`tall=${L.tall ? 1 : 0}`);
  return `양일외모 v1 | ${L.name.trim() || '이름 없음'} | ${parts.join(', ')} | ${L.memo.trim().replace(/\|/g, '/')}`;
}
function readLookInputs() {
  const L = lookState(), n = document.getElementById('look-name'), m = document.getElementById('look-memo');
  if (n) L.name = n.value.slice(0, 12); if (m) L.memo = m.value.slice(0, 40);
}
function renderLooks() {
  const L = lookState(), a = L.av;
  const exprs = [['smile', '웃음'], ['laugh', '빵 터짐'], ['surprised', '놀람'], ['embarrassed', '당황']];
  return `<section class="dex looks">
    <header class="sheet-head row"><div><p class="eyebrow">게임에 나오는 친구라면</p><h2>내 외모 보내기</h2></div><button class="link" data-act="menu">← 메인으로</button></header>
    <p class="sit-text">게임 속 내 모습을 직접 골라서 보내 줘. 받은 그대로 게임에 넣어 줄게. 장면 그림, 단체사진, 학생증 카드에 모두 이 모습으로 나와.</p>
    <div class="looks-grid">
      <div class="paper looks-preview">
        <div class="looks-big">${avatarSVG(a, '내 모습 미리보기')}</div>
        <div class="looks-exprs">${exprs.map(([k, n]) => `<figure><div>${avatarSVG(a, n, { expr: k })}</div><figcaption>${n}</figcaption></figure>`).join('')}</div>
        <p class="fine">게임에서는 상황에 따라 표정이 이렇게 바뀌어.</p>
      </div>
      <div class="paper looks-form">
        <label class="looks-field"><span>이름</span><input id="look-name" maxlength="12" placeholder="게임에 나오는 이름" value="${esc(L.name)}"></label>
        <div class="av-ctrls">${LOOK_KEYS.map(k => `
          <div class="av-row"><span class="av-lab">${AVATAR_LABEL[k]}</span>
            <button class="av-step" data-act="look-step" data-arg="${k}|-1" aria-label="${AVATAR_LABEL[k]} 이전">◀</button>
            <b class="av-val">${avatarPartName(k, a[k])}</b>
            <button class="av-step" data-act="look-step" data-arg="${k}|1" aria-label="${AVATAR_LABEL[k]} 다음">▶</button></div>`).join('')}
        </div>
        <div class="looks-tall"><span class="av-lab">키</span>
          <button class="btn ${L.tall ? '' : 'primary'} small" data-act="look-tall" data-arg="0" aria-pressed="${!L.tall}">보통</button>
          <button class="btn ${L.tall ? 'primary' : ''} small" data-act="look-tall" data-arg="1" aria-pressed="${L.tall}">큰 편</button></div>
        <label class="looks-field"><span>특징 한 줄 (선택)</span><input id="look-memo" maxlength="40" placeholder="예: 알파카 인형을 늘 들고 다님" value="${esc(L.memo)}"></label>
        <div class="create-actions"><button class="btn" data-act="look-rand">랜덤으로</button><button class="btn primary" data-act="look-make">외모 코드 만들기</button></div>
        ${L.code ? `<div class="looks-code">
          <textarea id="look-code" readonly rows="5">${esc(L.code)}</textarea>
          <div class="create-actions">
            <button class="btn primary" data-act="look-copy">코드 복사</button>
            ${LOOK_FORM_URL ? `<a class="btn" href="${esc(LOOK_FORM_URL + encodeURIComponent(L.code))}" target="_blank" rel="noopener">바로 보내기</a>`
              : JOIN_FORM_URL ? `<a class="btn" href="${esc(JOIN_FORM_URL)}" target="_blank" rel="noopener">출연 신청 폼 열기</a>` : ''}
          </div>
          <p class="fine">${LOOK_FORM_URL ? '「바로 보내기」를 누르면 코드가 채워진 폼이 열려. 제출만 누르면 끝.' : '코드를 복사해서 출연 신청 폼의 특징 칸에 붙여 넣거나, 게임 만든 친구에게 카톡으로 보내 줘.'}</p>
        </div>` : ''}
      </div>
    </div>
  </section>`;
}
async function copyLook() {
  const t = document.getElementById('look-code'); if (!t) return;
  try { await navigator.clipboard.writeText(t.value); toast('코드를 복사했어'); }
  catch (e) { t.select(); try { document.execCommand('copy'); toast('코드를 복사했어'); } catch (e2) { toast('코드를 길게 눌러 복사해 줘'); } }
}

META_SCREENS.looks = () => renderLooks();
const _lookMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'looks') { lookState(); UI.screen = 'looks'; render(); window.scrollTo(0, 0); return true; }
  if (act === 'look-step') { readLookInputs(); const [k, d] = arg.split('|'); const L = lookState(); L.av = stepAvatar(L.av, k, +d); L.code = ''; render(); return true; }
  if (act === 'look-tall') { readLookInputs(); const L = lookState(); L.tall = arg === '1'; L.code = ''; render(); return true; }
  if (act === 'look-rand') { readLookInputs(); const L = lookState(); L.av = Object.assign(randomAvatar(Math.random() < .5 ? 'm' : 'f'), { face: 'smile', acc: 'none' }); L.code = ''; render(); return true; }
  if (act === 'look-make') { readLookInputs(); const L = lookState(); if (!L.name.trim()) { toast('이름을 적어 줘'); return true; } L.code = lookCode(L); render(); return true; }
  if (act === 'look-copy') { copyLook(); return true; }
  return _lookMeta(act, arg);
};
