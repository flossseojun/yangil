// 정기시험 결과를 성적표 카드로 보여 준다 (1차: 가채점 · 2차: 학기 성적표)
const GRADE_COLOR = { 1: '#2f8f6b', 2: '#5aa36b', 3: '#c9a227', 4: '#e07b2b', 5: '#d64545' };
const LETTER_COLOR = { A: '#2f8f6b', B: '#5aa36b', C: '#c9a227', D: '#e07b2b', E: '#d64545' };
const gradeBadge = r => r.letter ? `<span class="gb" style="--c:${LETTER_COLOR[r.letter] || '#888'}">${r.letter}<small>절대</small></span>` : `<span class="gb" style="--c:${GRADE_COLOR[r.grade] || '#888'}">${r.grade}<small>등급</small></span>`;
const avgColor = g => GRADE_COLOR[Math.min(5, Math.max(1, Math.round(g)))];
function examCardHtml(c) {
  if (c.kind === 'first') return `<div class="exam-card">
    <div class="ec-head"><div><small>${esc(c.type)} · 가채점</small><b>과목 평균 ${c.avg}점</b></div><span class="ec-avg" style="--c:${avgColor(c.grade)}">${c.grade}<small>평균 등급</small></span></div>
    <ul class="ec-rows">${c.rows.map(r => `<li><span class="ec-sub">${esc(r.name)}</span><span class="ec-bar"><i style="width:${r.score}%;--c:${r.letter ? LETTER_COLOR[r.letter] : GRADE_COLOR[r.grade]}"></i></span><b class="ec-sc">${r.score}</b>${gradeBadge(r)}</li>`).join('')}</ul>
    <p class="ec-note">지금 점수라면 이런 등급이에요. 2차 시험과 수행평가까지 합쳐서 학기 등급이 정해져요.</p>
    ${c.prep ? `<div class="ec-box">${esc(c.prep).replace(/\n/g, '<br>')}</div>` : ''}
    ${c.comment ? `<p class="ec-cmt">${esc(c.comment)}</p>` : ''}</div>`;
  const diff = c.prev != null ? Math.round((c.prev - c.grade) * 10) / 10 : null;
  return `<div class="exam-card">
    <div class="ec-head"><div><small>${esc(c.type)} · ${S.year}학년 ${S.sem}학기 성적표</small><b>학기 평균 ${c.grade}등급</b>${diff != null ? `<em class="${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${diff > 0 ? `▲ ${diff} 올랐어요` : diff < 0 ? `▼ ${-diff} 내려갔어요` : '지난 학기와 같아요'}</em>` : ''}</div><span class="ec-avg" style="--c:${avgColor(c.grade)}">${c.grade}<small>평균 등급</small></span></div>
    ${c.boss ? `<div class="ec-box boss">${esc(c.boss)}</div>` : ''}
    <table class="ec-table"><thead><tr><th>과목</th><th>1차</th><th>2차</th><th>수행</th><th>최종</th><th>등급</th></tr></thead>
      <tbody>${c.rows.map(r => `<tr><td class="ec-sub">${esc(r.name)}</td><td>${r.w[0] ?? '-'}</td><td>${r.w[1] ?? '-'}</td><td>${r.perf}</td><td class="ec-fin">${r.score}</td><td>${gradeBadge(r)}${r.rank ? `<small class="ec-rank">${r.rank}/${r.n}등</small>` : ''}</td></tr>`).join('')}</tbody></table>
    <p class="ec-note">최종 = 지필(1차·2차 평균) 60% + 수행평가 40%</p>
    <p class="ec-cmt">${esc(c.react)}${c.comment ? ' ' + esc(c.comment) : ''}</p></div>`;
}
// 결과에 성적표를 붙인다
const _ecChoose = chooseEvent;
chooseEvent = function (i) { _ecChoose(i); if (S && S._examCard) { if (S.cur && S.cur.result) S.cur.result.card = S._examCard; S._examCard = null; save(); renderModal(); } };
const _ecModal = renderModal;
renderModal = function () {
  _ecModal();
  const r = S && S.cur && S.cur.result; if (!r || !r.card) return;
  const m = document.getElementById('modal');
  const spot = m.querySelector('.ev-dialog.result') || m.querySelector('.ev-result > p:not(.eyebrow)');
  if (spot && !m.querySelector('.exam-card')) spot.outerHTML = examCardHtml(r.card);
};
