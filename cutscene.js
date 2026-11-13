// 명장면 컷 연출: 큰 학교 행사 날, 사건 창 앞에 만화 컷 2~3장이 한 장씩 넘어간다.
// 같은 판·같은 학년에서는 한 번만. 설정의 「화면 연출」을 끄면 나오지 않는다.

const topFriends = (s, n = 2) => FRIEND_IDS.filter(id => s.met[id] && !(CHARACTERS[id] && CHARACTERS[id].isTeacher)).sort((a, b) => s.aff[b] - s.aff[a]).slice(0, n);
const ME = (s, expr, pose) => ({ me: true, av: s.avatar || randomAvatar(s.gender), expr, pose });
const FR = (id, expr, pose) => id ? { id, expr, pose } : null;
const SFX_TXT = (t, x = 236, y = 52, rot = -8, size = 26, color = '#ff5a3c') => `<g transform="translate(${x} ${y}) rotate(${rot})"><text text-anchor="middle" font-size="${size}" font-family="Jua, sans-serif" fill="#fff" stroke="#1f2a24" stroke-width="5" paint-order="stroke">${t}</text><text text-anchor="middle" font-size="${size}" font-family="Jua, sans-serif" fill="${color}">${t}</text></g>`;
const DAWN = '<rect width="320" height="180" fill="#1b2a5a" opacity=".45"/><rect width="320" height="180" fill="#ff9a5c" opacity=".12"/>';
const NIGHT = '<rect width="320" height="180" fill="#0b1030" opacity=".5"/>';

const CUTSCENES = {
  entrance: s => [
    { bg: 'auditorium', cast: [ME(s, 'surprised')], cap: '3월 3일, 양일고등학교 입학식.', sfx: SFX_TXT('두근두근', 236, 48, -6, 24, '#ff7aa2') },
    { bg: 'classroom', cast: [ME(s, 'smile', 'wave')], cap: '처음 보는 교실, 처음 보는 얼굴들.', sfx: '' },
    { bg: 'ginkgo', cast: [ME(s, 'laugh', 'v')], cap: '오늘부터 3년, 나의 이야기가 시작된다.', sfx: SFX_TXT('시작!', 250, 46, 8, 28) },
  ],
  sports_day: s => { const [a, b] = topFriends(s); return [
    { bg: 'field', cast: [FR(a, 'laugh', 'cheer'), ME(s, 'laugh', 'cheer'), FR(b, 'laugh', 'v')].filter(Boolean), cap: `${s.year}학년 체육한마당. 운동장이 함성으로 가득하다.`, sfx: SFX_TXT('청군 이겨라!', 160, 40, -4, 24, '#2f6fbf') },
    { match: 'relay', cap: '마지막 종목, 반 대항 계주.', sfx: '' },
    { bg: 'field', cast: [ME(s, 'proud')], cap: '바통을 받을 차례다.', sfx: SFX_TXT('타닥타닥', 240, 60, 10, 22) },
  ]; },
  festival: s => { const [a, b] = topFriends(s); return [
    { bg: 'auditorium', cast: [ME(s, 'surprised')], cap: `${s.year}학년 녹향제. 무대 조명이 켜졌다.`, sfx: SFX_TXT('와아아!', 240, 46, -8, 28) },
    { bg: 'classroom', cast: [FR(a, 'laugh', 'wave'), ME(s, 'laugh'), FR(b, 'smile', 'v')].filter(Boolean), cap: '교실마다 부스, 복도마다 웃음소리.', sfx: '' },
    { bg: 'rooftop', cast: [ME(s, 'smile'), FR(a, 'smile')].filter(Boolean), cap: '축제가 끝나 가는 밤.', sfx: SFX_TXT('반짝', 250, 40, 6, 22, '#ffd23f') },
  ]; },
  school_trip: s => { const [a, b] = topFriends(s); return [
    { bg: 'river', cast: [ME(s, 'laugh', 'cheer'), FR(a, 'laugh', 'cheer')].filter(Boolean), cap: '2학년 수학여행. 비행기를 타고 제주도에 도착했다!', sfx: SFX_TXT('제주다!', 240, 44, -8, 28, '#2f8f6b') },
    { bg: 'field', cast: [FR(b, 'smile', 'v'), ME(s, 'wink', 'v'), FR(a, 'laugh')].filter(Boolean), cap: '돌하르방 앞에서 단체 사진.', sfx: SFX_TXT('찰칵', 250, 40, 8, 24, '#1f2a24') },
    { bg: 'rooftop', cast: [ME(s, 'laugh'), FR(a, 'laugh')].filter(Boolean), cap: '숙소의 밤은 아무도 잠들지 않았다.', sfx: SFX_TXT('쉿!', 240, 46, -6, 26, '#5b2a86') },
  ]; },
  suneung: s => [
    { bg: 'ginkgo', overlay: DAWN, cast: [ME(s, 'plain')], cap: '11월, 수능 날 새벽. 후배들의 응원 소리가 들린다.', sfx: SFX_TXT('선배님 화이팅!', 160, 38, -3, 22, '#ffd23f') },
    { bg: 'classroom', cast: [ME(s, 'proud')], cap: '3년이 오늘 하루에 담긴다.', sfx: SFX_TXT('사각사각', 248, 58, 8, 20, '#1f2a24') },
  ],
};
const CUT_KEY = (s, id) => `${id}:${s.year}`;
function cutPanelSVG(p, i) {
  let svg;
  if (p.match && typeof matchSVG === 'function') svg = matchSVG(p.match, p.cap);
  else svg = sceneSVG({ bg: p.bg, cast: p.cast, label: p.cap });
  const extra = (p.overlay || '') + (p.sfx || '');
  if (extra && typeof appendSvg === 'function') svg = appendSvg(svg, extra);
  return `<figure class="cut-panel p${i}" style="--r:${[-1.2, 1, -0.6][i % 3]}deg"><figcaption>${esc(p.cap)}</figcaption>${svg}</figure>`;
}
function cutHtml() {
  const C = UI.cut, ps = C.panels, done = C.shown >= ps.length;
  return `<div class="cut-page" data-act="cut-next">
    <div class="cut-panels">${ps.slice(0, C.shown).map(cutPanelSVG).join('')}</div>
    <div class="cut-bar"><button class="link" data-act="cut-skip">건너뛰기</button><span class="cut-dots">${ps.map((_, i) => `<i class="${i < C.shown ? 'on' : ''}"></i>`).join('')}</span>
      <button class="btn ${done ? 'primary' : ''}" data-act="cut-next">${done ? '계속 →' : '다음 ▶'}</button></div></div>`;
}
function cutWanted() {
  if (!S || !S.cur || S.cur.result || !CUTSCENES[S.cur.id]) return false;
  if (SETTINGS.fx === false || SETTINGS.fast) return false;
  if (navigator.webdriver && !window.__forceCut) return false;
  return !(S.cuts || {})[CUT_KEY(S, S.cur.id)];
}
const _cutRenderModal = renderModal;
renderModal = function () {
  if (!UI.cut && cutWanted()) UI.cut = { id: S.cur.id, panels: CUTSCENES[S.cur.id](S), shown: 1 };
  if (!UI.cut || !S || !S.cur || UI.screen !== 'game') { UI.cut = null; return _cutRenderModal(); }
  const m = document.getElementById('modal');
  m.hidden = false; m.className = 'overlay cut-overlay';
  m.innerHTML = cutHtml();
  const b = m.querySelector('.cut-bar .btn'); if (b) b.focus({ preventScroll: true });
};
function endCut() { if (!UI.cut) return; S.cuts = S.cuts || {}; S.cuts[CUT_KEY(S, UI.cut.id)] = 1; UI.cut = null; const m = document.getElementById('modal'); m.className = 'overlay'; save(); renderModal(); }
const _cutMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'cut-skip') { endCut(); return true; }
  if (act === 'cut-next' && UI.cut) { if (UI.cut.shown < UI.cut.panels.length) { UI.cut.shown++; SFX.play('page'); renderModal(); } else endCut(); return true; }
  return _cutMeta(act, arg);
};
document.addEventListener('keydown', e => { if (UI.cut && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); metaAction('cut-next'); } });
