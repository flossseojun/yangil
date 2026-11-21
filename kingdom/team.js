// 팀 편성: 캠퍼스 친구 중 5명을 골라 배치하고, 친구 프로필에서 레벨업 · 추억 이야기를 본다.
const $ = id => document.getElementById(id);
const nameOf = id => (ROSTER.find(f => f.id === id) || { name: id }).name;
const introOf = id => (ROSTER.find(f => f.id === id) || { role: '' }).role;
const titleOf = id => (ROSTER.find(f => f.id === id) || { title: '' }).title;
const DEFAULT_TEAM = ['junyoung', 'jeonggyu', 'yunsu', 'seojun', 'yejun'];
let G = loadCampus();
if (!G) { G = { res: { know: 20, snack: 10, power: 0 }, b: [], friends: [] }; }
G.lv = G.lv || {}; G.bond = G.bond || {};
let owned = G.friends.slice();
if (owned.length < 5) DEFAULT_TEAM.forEach(id => { if (!owned.includes(id) && owned.length < 5) owned.push(id); });   // 친구가 모자라면 체험 친구로 채운다
let team = [];
try { team = (JSON.parse(localStorage.getItem(TEAM_KEY)) || []).filter(id => owned.includes(id)).slice(0, 5); } catch (e) {}
if (!team.length) team = DEFAULT_TEAM.filter(id => owned.includes(id));
let { ch, st: stage } = loadSel(G);
let tab = 'all';
const imgCache = {};
const shotOf = k => (window.CHIBI_IMG || {})[k];   // 3D 친구 사진이 찍히면 그걸 쓴다
const fullImg = id => shotOf('f' + id) || imgCache['f' + id] || (imgCache['f' + id] = svgURL(kitSVG(id, 'stand', 'smile')));
const headImg = id => shotOf('h' + id) || imgCache['h' + id] || (imgCache['h' + id] = svgURL(kitHeadSVG(id)));
const save = () => { try { localStorage.setItem(TEAM_KEY, JSON.stringify(team)); } catch (e) {} saveSel(ch, stage); };
const BG = { tank: '#22385a', striker: '#5a2418', blaster: '#6a3a12', mage: '#3a2a66', healer: '#1d5b3a', support: '#5a4a16' };
const fmt = n => n.toLocaleString('ko-KR');

function layout(ids) {
  const front = ids.filter(id => ROLES[kitOf(id).role].melee), back = ids.filter(id => !ROLES[kitOf(id).role].melee);
  const F = [[87, 44], [73, 84], [92, 100]], Bk = [[52, 46], [36, 86], [18, 46], [58, 100], [6, 92]];
  return [...front.map((id, i) => ({ id, p: F[i] || Bk[i] })), ...back.map((id, i) => ({ id, p: Bk[i] }))];
}
function teamTagCount(s) { const tags = teamTags(team); return Object.keys(tags).some(t => ({ invent: ['chem', 'eng'], code: ['sona'], city: ['zec'], cheer: ['bcast'], sprout: ['seed'], squid: ['squid'], sport: ['sport'] })[s.id].includes(t)); }
// 양평 지도 스테이지: 스테이지를 지도 위 길로 보여 준다 (깬 곳은 깃발)
const MAP_THEME = { 1: ['#f7e7b0', '#e9b949', '#c98a00'], 2: ['#e2dcf7', '#9d86f0', '#6c4fd1'], 3: ['#d3dbef', '#7f90c8', '#3a4a8a'], 4: ['#e9e1d0', '#8fbf8a', '#2b4a3c'], 5: ['#fff0c8', '#ffd23f', '#c98a00'], 6: ['#dceaf7', '#8ab8e8', '#2f6fb8'], 7: ['#ffe4d6', '#ff9a7a', '#e0573b'] };
function renderMap() {
  const prog = progOf(G, ch), tower = ch === TOWER, n = 10, start = tower ? Math.max(1, prog - 4) : 1, th = MAP_THEME[ch] || MAP_THEME[1];
  const W = 600, H = 270, pos = i => { const row = Math.floor(i / 5), col = i % 5, x = 70 + (row ? 4 - col : col) * 115; return [x, row ? 205 : 100]; };
  let sd = ch * 7 + 3; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const deco = Array.from({ length: 18 }, () => { const x = rnd() * W, y = rnd() * H; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + rnd() * 10).toFixed(0)}" fill="${th[1]}" opacity=".35"/>`; }).join('');
  const pts = Array.from({ length: n }, (_, i) => pos(i));
  const road = 'M' + pts.map(p => p.join(',')).join(' L') ;
  const nodes = pts.map(([x, y], i) => { const st = start + i, done = st < prog, cur = st === prog, lock = st > prog, sel = st === stage, sn = starsOf(G, ch, st);
    return `<g class="nd${lock ? ' lock' : ''}${cur ? ' cur' : ''}" data-st="${st}">
      ${sel ? `<circle cx="${x}" cy="${y}" r="34" fill="none" stroke="#231c17" stroke-width="4" stroke-dasharray="6 5"/>` : ''}
      <circle class="c" cx="${x}" cy="${y}" r="26" fill="${lock ? '#d9d0bd' : cur ? '#ffd23f' : '#fffaf0'}" stroke="#231c17" stroke-width="4"/>
      <text x="${x}" y="${y + 8}" text-anchor="middle" font-family="Jua, sans-serif" font-size="${tower ? 18 : 22}" fill="${lock ? '#8a7a64' : '#231c17'}">${tower ? st + '층' : st}</text>
      ${done ? `<path d="M${x + 14} ${y - 22}v-30" stroke="#231c17" stroke-width="3"/><path d="M${x + 14} ${y - 52}l20 7-20 7z" fill="${th[2]}" stroke="#231c17" stroke-width="2"/>` : ''}
      ${sn ? `<text x="${x}" y="${y + 46}" text-anchor="middle" font-size="16" fill="#c98a00">${'★'.repeat(sn)}${'☆'.repeat(3 - sn)}</text>` : ''}
      ${lock && st === prog + 1 ? `<text x="${x}" y="${y + 46}" text-anchor="middle" font-family="Jua, sans-serif" font-size="13" fill="#8a7a64">잠김</text>` : ''}</g>`; }).join('');
  $('smap').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${CHAPTERS[ch - 1].place} 스테이지 지도"><rect width="${W}" height="${H}" fill="${th[0]}"/>${deco}
    <path d="${road}" fill="none" stroke="#fffaf0" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><path d="${road}" fill="none" stroke="${th[2]}" stroke-width="4" stroke-dasharray="10 10" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>
    <rect x="10" y="10" width="${CHAPTERS[ch - 1].place.length * 22 + 30}" height="34" rx="9" fill="#2b4a3c" stroke="#231c17" stroke-width="3"/><text x="25" y="35" font-family="Jua, sans-serif" font-size="20" fill="#fff">${CHAPTERS[ch - 1].place}</text>${nodes}</svg>`;
}
function renderTop() {
  renderMap(); setTimeout(() => { const on = document.querySelector('.ch.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);
  $('res').innerHTML = RES_ORDER.map(k => `<span class="rs">${drawIcon(k, 18)}${fmt(G.res[k] || 0)}</span>`).join('');
  const sm = stageMulOf(ch, stage), sn = starsOf(G, ch, stage);
  $('st-n').innerHTML = stageName(ch, stage) + `<span class="st-stars">${[0, 1, 2].map(i => drawIcon(i < sn ? 'star' : 'starOff', 12)).join('')}</span>`; $('st-rec').textContent = `추천 ${fmt(sm.rec)}`;
  $('st-prev').disabled = stage <= 1; $('st-next').disabled = stage >= Math.min(maxStageOf(ch), progOf(G, ch));
  $('chaps').innerHTML = CH_SHOW.map(n => CHAPTERS[n - 1]).map(c => { const open = progOf(G, c.n) > 0; return `<button class="ch${c.tower ? ' tower' : ''}${c.n === ch ? ' on' : ''}${open ? '' : ' lock'}" data-ch="${c.n}" ${open ? '' : 'aria-disabled="true"'}><small>챕터 ${c.n}</small><b>${open ? '' : drawIcon('lock', 16)}${c.place}</b><span>${open ? '보스 · ' + c.boss : `${prevOf(c.n)}-${CHAP_UNLOCK} 클리어 시 열림`}</span></button>`; }).join('');
}
function renderField() {
  const L = layout(team);
  $('field').innerHTML = '<span class="row-lab" style="left:10px">뒷줄</span><span class="row-lab" style="right:10px">앞줄 · 보스 쪽 →</span>' +
    L.map(({ id, p: [x, y] }) => `<div class="slot" data-id="${id}" style="left:${x}%;top:${y - 40}px"><span class="ring" style="--c:${ROLES[kitOf(id).role].color}"></span><img src="${fullImg(id)}" data-f="${id}" alt="${nameOf(id)}"><div class="nm">${roleIcon(kitOf(id).role, 11)}${nameOf(id)}</div></div>`).join('') +
    Array.from({ length: 5 - team.length }, (_, i) => `<div class="slot empty" style="left:${20 + i * 15}%"></div>`).join('');
  const syn = teamSynergy(team);
  $('syn').innerHTML = syn.filter(s => s.on || teamTagCount(s)).map(s => `<span class="${s.on ? 'on' : ''}"><b>${s.name}</b>${s.on ? s.desc : s.need}</span>`).join('') || '<span>같은 동아리 친구를 함께 넣으면 시너지가 켜져요</span>';
  const cb = campusBonus(G);
  $('camp').innerHTML = cb.list.length ? '<b>캠퍼스 보너스</b> · ' + cb.list.join(' · ') : '<b>캠퍼스 보너스</b> · 캠퍼스에서 과학실 · 다목적관 · 도서관 · 매점을 레벨업하면 전투가 강해져요';
  const pw = team.reduce((a, id) => a + powerOf(G, id), 0), rec = stageMulOf(ch, stage).rec;
  $('pow').innerHTML = `팀 전투력 ${fmt(pw)}<small style="color:${pw >= rec ? '#2f8f4e' : '#d0393e'}">추천 ${fmt(rec)}</small>`;
  $('go').disabled = !team.length;
}
function renderTabs() {
  $('tabs').innerHTML = [['all', '전체 ' + owned.length]].concat(ROLE_ORDER.map(r => [r, ROLES[r].name])).map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${k === 'all' ? '' : roleIcon(k, 12)}${n}</button>`).join('');
  $('roles').innerHTML = ROLE_ORDER.map(r => `<span>${roleIcon(r, 12)}<b>${ROLES[r].name}</b> ${ROLES[r].desc}</span>`).join('');
}
function renderList() {
  const list = owned.filter(id => tab === 'all' || kitOf(id).role === tab).sort((a, b) => ROLE_ORDER.indexOf(kitOf(a).role) - ROLE_ORDER.indexOf(kitOf(b).role));
  $('list').innerHTML = list.map(id => { const k = kitOf(id), n = team.indexOf(id);
    return `<div class="card ${n >= 0 ? 'on' : team.length >= 5 ? 'full' : ''}" role="button" tabindex="0" data-id="${id}" data-n="${n + 1}" style="--bg:${BG[k.role]}"><span class="lv">Lv.${lvOf(G, id)}${awakeOf(G, id) ? ' <i class="aw">각성</i>' : ''}</span>${gearOf(G, id) ? `<span class="gear" title="${gearOf(G, id).name}">${drawIcon(G.gear[id], 16)}</span>` : ''}<img src="${headImg(id)}" data-h="${id}" alt=""><b>${nameOf(id)}</b><span class="rl">${roleIcon(k.role, 11)}${ROLES[k.role].name}</span><span class="sk">${k.skill}</span><button class="info" data-pf="${id}" aria-label="${nameOf(id)} 프로필">i</button></div>`; }).join('');
  $('hint').textContent = G.friends.length < 5 ? `캠퍼스 친구가 ${G.friends.length}명이라 체험 친구로 채웠어요. 캠퍼스 동아리실에서 친구를 모집할 수 있어요.` : `카드를 눌러 넣고 빼요. ⓘ를 누르면 친구 프로필 · 레벨업 · 추억 이야기를 볼 수 있어요.`;
}
const backEl = document.getElementById('back'); if (backEl) backEl.insertAdjacentHTML('afterbegin', drawIcon('back', 18));
function render() { renderTop(); renderField(); renderTabs(); renderList(); }
function toggle(id) { const i = team.indexOf(id); if (i >= 0) team.splice(i, 1); else if (team.length < 5) team.push(id); save(); render(); }
function autoPick() {
  const by = r => owned.filter(id => kitOf(id).role === r).sort((a, b) => powerOf(G, b) - powerOf(G, a));
  const pick = [];
  ['tank', 'striker', 'healer'].forEach(r => { const c = by(r).find(id => !pick.includes(id)); if (c) pick.push(c); });
  const rest = owned.filter(id => !pick.includes(id));
  while (pick.length < 5 && rest.length) {
    let best = null, score = -1;
    rest.forEach(id => { const s = teamSynergy(pick.concat(id)).filter(x => x.on).length * 1000 + powerOf(G, id) + (['mage', 'blaster'].includes(kitOf(id).role) ? 300 : 0); if (s > score) { score = s; best = id; } });
    pick.push(best); rest.splice(rest.indexOf(best), 1);
  }
  team = pick; save(); render();
}

/* ───────── 친구 프로필 ───────── */
function openProfile(id) {
  const k = kitOf(id), r = ROLES[k.role], pf = PROFILES[id] || { desc: '', lines: [], story: [] }, lv = lvOf(G, id), bond = bondOf(G, id), cost = upCost(lv);
  const can = lv < MAX_LV && G.friends.includes(id) && Object.entries(cost).every(([x, n]) => (G.res[x] || 0) >= n);
  const st = pf.story || [], open = Math.min(st.length, bond);
  const inTeam = team.includes(id);
  $('pf').innerHTML = `<div class="pf" role="dialog" aria-modal="true" aria-label="${nameOf(id)} 프로필" style="--bg:${BG[k.role]}">
    <button class="x" data-close aria-label="닫기">×</button>
    <div class="art"><img src="${fullImg(id)}" data-f="${id}" alt="${nameOf(id)}"><small class="spin">끌어서 돌려 보기</small></div>
    <div>
      <h2>${nameOf(id)}</h2>
      <div class="sub">${roleIcon(k.role, 13)} ${r.name} · ${introOf(id)} · 칭호 「${titleOf(id)}」</div>
      <p class="desc">${pf.desc}</p>
      <div class="box"><h3>필살기</h3><div class="skn">${k.skill}</div><div class="skd">${skillDesc(id)}</div></div>
      <div class="box"><h3>레벨</h3><div class="lvrow"><b>Lv.${lv}</b><span class="lvbar"><i style="width:${lv / MAX_LV * 100}%"></i></span>
        ${lv >= MAX_LV ? '<span style="font-family:Jua">최고 레벨</span>' : G.friends.includes(id) ? `<a class="up" href="./?friend=${id}" style="text-decoration:none">캠퍼스에서 키우기 ›</a><span style="font-size:12px;color:var(--muted);margin-left:6px">경험치 ${xpOf(G, id)}/${xpNeed(lv)} · 전투에 데려가면 쌓여요</span>` : '<span style="font-size:12px;color:var(--muted)">캠퍼스 친구가 되면 키울 수 있어요</span>'}</div>
        <div class="skd" style="margin-top:4px">체력 · 공격 · 스킬 +${Math.round((lvMult(lv) - 1) * 100)}% · 전투력 ${fmt(powerOf(G, id))}</div><div class="skd" style="margin-top:4px">장비 · ${gearOf(G, id) ? `${drawIcon(G.gear[id], 14)} ${gearOf(G, id).name} (${gearOf(G, id).desc})` : '없음 (캠퍼스 친구들 → 문구점)'}${awakeOf(G, id) ? ' · <b>각성</b> 체력 · 공격 +10%, 스킬 +30%' : lv >= MAX_LV ? ' · 캠퍼스 친구들 창에서 각성할 수 있어요' : ''}</div></div>
      <div class="box"><h3>친밀도 <span class="hearts">${Array.from({ length: 5 }, (_, i) => drawIcon(i < bond ? 'heart' : 'heartOff', 16)).join('')}</span> · 함께 이길 때마다 +1</h3>
        <ul class="story">${st.map((x, i) => i < open ? `<li><b>추억 ${i + 1} · ${x.title}</b>${x.text}</li>` : `<li class="lock">${drawIcon('lock', 15)}추억 ${i + 1} · 친밀도 ${i + 1}에 열려요</li>`).join('') || '<li class="lock">아직 이야기가 없어요</li>'}</ul></div>
      <div class="box"><h3>대사</h3><ul class="lines">${(pf.lines || []).slice(0, Math.max(3, Math.min(9, 3 + bond * 2))).map(l => `<li>${l}</li>`).join('')}</ul></div>
      <div class="acts"><button class="btn ${inTeam ? 'sub' : 'go'}" data-toggle="${id}" style="margin-left:0">${inTeam ? '팀에서 빼기' : team.length >= 5 ? '팀이 꽉 찼어요' : '팀에 넣기'}</button></div>
    </div></div>`;
  $('pf').hidden = false;
  if (window.openViewer) try { window.openViewer(id, $('pf').querySelector('.art')); } catch (e) {}
}
$('pf').addEventListener('click', e => {
  if (e.target === $('pf') || e.target.closest('[data-close]')) { $('pf').hidden = true; window.closeViewer && window.closeViewer(); return; }
  const up = e.target.closest('[data-up]');
  if (up) { const id = up.dataset.up, lv = lvOf(G, id), cost = upCost(lv); if (Object.entries(cost).every(([x, n]) => (G.res[x] || 0) >= n)) { Object.entries(cost).forEach(([x, n]) => { G.res[x] -= n; }); G.lv[id] = lv + 1; saveCampus(G); KS.fx('levelup'); render(); openProfile(id); } return; }
  const tg = e.target.closest('[data-toggle]'); if (tg) { toggle(tg.dataset.toggle); openProfile(tg.dataset.toggle); }
});
addEventListener('keydown', e => { if (e.key === 'Escape') { $('pf').hidden = true; window.closeViewer && window.closeViewer(); } });
$('list').addEventListener('click', e => { const i = e.target.closest('[data-pf]'); if (i) { openProfile(i.dataset.pf); return; } const c = e.target.closest('.card'); if (c) toggle(c.dataset.id); });
$('field').addEventListener('click', e => { const s = e.target.closest('.slot[data-id]'); if (s) openProfile(s.dataset.id); });
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); } });
$('chaps').addEventListener('click', e => { const b = e.target.closest('.ch'); if (!b) return; const n = +b.dataset.ch; if (!progOf(G, n)) { const c = CHAPTERS[n - 1]; $('hint').textContent = `${prevOf(n)}-${CHAP_UNLOCK} 스테이지를 깨면 「${c.place}」${josa(c.place, '이', '가').slice(c.place.length)} 열려요`; $('hint').scrollIntoView({ block: 'nearest' }); return; } ch = n; stage = progOf(G, n); save(); render(); });
$('smap').addEventListener('click', e => { const g = e.target.closest('[data-st]'); if (!g) return; const st = +g.dataset.st; if (st > progOf(G, ch)) { $('hint').textContent = '앞 스테이지를 먼저 깨야 열려요'; return; } stage = st; save(); render(); });
$('st-prev').onclick = () => { stage = Math.max(1, stage - 1); save(); render(); };
$('st-next').onclick = () => { stage = Math.min(Math.min(maxStageOf(ch), progOf(G, ch)), stage + 1); save(); render(); };
$('auto').onclick = autoPick;
$('go').onclick = () => { save(); try { localStorage.removeItem('yangil.kingdom.train'); } catch (e) {} location.href = 'battle.html'; };
if (typeof KS !== 'undefined') { KS.play('campus'); KS.bind($('b-music')); document.addEventListener('click', e => { if (e.target.closest('button, .card, .slot, .ch')) KS.fx('click'); }, true); }
render();
