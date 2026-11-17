// 팀 편성: 캠퍼스에 모인 친구 중 5명을 골라 앞줄(방어·돌격)과 뒷줄(폭발·마법·회복·지원)에 세운다.
const $ = id => document.getElementById(id);
const nameOf = id => (ROSTER.find(f => f.id === id) || { name: id }).name;
const DEFAULT_TEAM = ['junyoung', 'jeonggyu', 'yunsu', 'seojun', 'yejun'];
let owned = [];
try { const g = JSON.parse(localStorage.getItem('yangil.kingdom.v1')); if (g && g.friends) owned = g.friends.slice(); } catch (e) {}
if (owned.length < 5) DEFAULT_TEAM.forEach(id => { if (!owned.includes(id) && owned.length < 5) owned.push(id); });   // 친구가 모자라면 체험 친구로 채운다
let team = [];
try { team = (JSON.parse(localStorage.getItem(TEAM_KEY)) || []).filter(id => owned.includes(id)).slice(0, 5); } catch (e) {}
if (!team.length) team = DEFAULT_TEAM.filter(id => owned.includes(id));
let tab = 'all';
const imgCache = {};
const fullImg = id => imgCache['f' + id] || (imgCache['f' + id] = svgURL(kitSVG(id, 'stand', 'smile')));
const headImg = id => imgCache['h' + id] || (imgCache['h' + id] = svgURL(kitHeadSVG(id)));
const save = () => { try { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); } catch (e) {} };
const BG = { tank: '#22385a', striker: '#5a2418', blaster: '#6a3a12', mage: '#3a2a66', healer: '#1d5b3a', support: '#5a4a16' };

// 앞줄 · 뒷줄 자리 (전투 화면과 같은 배치: 오른쪽이 보스 쪽)
function layout(ids) {
  const front = ids.filter(id => ROLES[kitOf(id).role].melee), back = ids.filter(id => !ROLES[kitOf(id).role].melee);
  const F = [[87, 44], [73, 84], [92, 100]], Bk = [[52, 46], [36, 86], [18, 46], [58, 100], [6, 92]];
  return [...front.map((id, i) => ({ id, p: F[i] || Bk[i] })), ...back.map((id, i) => ({ id, p: Bk[i] }))];
}
function renderField() {
  const L = layout(team);
  $('field').innerHTML = '<span class="row-lab" style="left:10px">뒷줄</span><span class="row-lab" style="right:10px">앞줄 · 보스 쪽 →</span>' +
    L.map(({ id, p: [x, y] }) => `<div class="slot" data-id="${id}" style="left:${x}%;top:${y - 40}px"><span class="ring" style="--c:${ROLES[kitOf(id).role].color}"></span><img src="${fullImg(id)}" alt="${nameOf(id)}"><div class="nm">${roleIcon(kitOf(id).role, 11)}${nameOf(id)}</div></div>`).join('') +
    Array.from({ length: 5 - team.length }, (_, i) => `<div class="slot empty" style="left:${20 + i * 15}%"></div>`).join('');
  const syn = teamSynergy(team);
  $('syn').innerHTML = syn.filter(s => s.on || teamTagCount(s)).map(s => `<span class="${s.on ? 'on' : ''}"><b>${s.name}</b>${s.on ? s.desc : s.need}</span>`).join('') || '<span>같은 동아리 친구를 함께 넣으면 시너지가 켜져요</span>';
  const pw = team.reduce((a, id) => a + power(id), 0);
  $('pow').innerHTML = `팀 전투력 ${pw.toLocaleString('ko-KR')}<small>추천 4,500</small>`;
  $('go').disabled = !team.length;
}
// 아직 안 켜졌어도 관련 동아리 친구가 한 명이라도 있으면 보여 준다
function teamTagCount(s) { const tags = teamTags(team); return Object.keys(s.fx).length && Object.keys(tags).some(t => ({ invent: ['chem', 'eng'], code: ['sona'], city: ['zec'], cheer: ['bcast'], sprout: ['seed'], squid: ['squid'], sport: ['sport'] })[s.id].includes(t)); }
function renderTabs() {
  $('tabs').innerHTML = [['all', '전체 ' + owned.length]].concat(ROLE_ORDER.map(r => [r, ROLES[r].name])).map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${k === 'all' ? '' : roleIcon(k, 12)}${n}</button>`).join('');
  $('roles').innerHTML = ROLE_ORDER.map(r => `<span>${roleIcon(r, 12)}<b>${ROLES[r].name}</b> ${ROLES[r].desc}</span>`).join('');
}
function renderList() {
  const list = owned.filter(id => tab === 'all' || kitOf(id).role === tab).sort((a, b) => ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
  $('list').innerHTML = list.map(id => { const k = kitOf(id), n = team.indexOf(id);
    return `<button class="card ${n >= 0 ? 'on' : team.length >= 5 ? 'full' : ''}" data-id="${id}" data-n="${n + 1}" style="--bg:${BG[k.role]}"><img src="${headImg(id)}" alt=""><b>${nameOf(id)}</b><span class="rl">${roleIcon(k.role, 11)}${ROLES[k.role].name}</span><span class="sk">${k.skill}</span></button>`; }).join('');
  const real = (() => { try { return (JSON.parse(localStorage.getItem('yangil.kingdom.v1')) || {}).friends || []; } catch (e) { return []; } })();
  $('hint').textContent = real.length < 5 ? `캠퍼스 친구가 ${real.length}명이라 체험 친구로 채웠어요. 캠퍼스에 동아리방을 지으면 친구가 늘어요.` : `캠퍼스 친구 ${owned.length}명 중 최대 5명. 카드를 눌러 넣고 빼요.`;
}
function render() { renderField(); renderTabs(); renderList(); }
function toggle(id) { const i = team.indexOf(id); if (i >= 0) team.splice(i, 1); else if (team.length < 5) team.push(id); save(); render(); }
// 자동 편성: 방어 1 · 돌격 1 · 회복 1을 먼저, 나머지는 시너지가 켜지는 쪽으로
function autoPick() {
  const by = r => owned.filter(id => kitOf(id).role === r);
  const pick = [];
  ['tank', 'striker', 'healer'].forEach(r => { const c = by(r).find(id => !pick.includes(id)); if (c) pick.push(c); });
  const rest = owned.filter(id => !pick.includes(id));
  while (pick.length < 5 && rest.length) {
    let best = null, score = -1;
    rest.forEach(id => { const s = teamSynergy(pick.concat(id)).filter(x => x.on).length * 1000 + power(id) + (['mage', 'blaster'].includes(kitOf(id).role) ? 300 : 0); if (s > score) { score = s; best = id; } });
    pick.push(best); rest.splice(rest.indexOf(best), 1);
  }
  team = pick; save(); render();
}
$('list').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) toggle(c.dataset.id); });
$('field').addEventListener('click', e => { const s = e.target.closest('.slot[data-id]'); if (s) toggle(s.dataset.id); });
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); } });
$('auto').onclick = autoPick;
$('go').onclick = () => { save(); location.href = 'battle.html'; };
render();
