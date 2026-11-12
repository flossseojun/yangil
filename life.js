// 날씨 · 옷장 · 졸업 단체사진
// 다른 파일의 함수(startDay, performAction, sceneSVG, seasonOverlay, metaAction)를 감싸서 덧붙인다. meta.js 다음에 불러온다.

/* ───────── 1. 날씨 ───────── */
const WEATHER = {
  sunny:   { icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', name: '맑음', tip: '하늘이 높고 맑다.' },
  rain:    { icon: '<path d="M20 15.5A4.5 4.5 0 0 0 17.5 7a6 6 0 0 0-11.5 1.5A4 4 0 0 0 6 16"/><path d="M8 19v2M12 17v2M16 19v2"/>', name: '비', tip: '우산 챙겼어?' },
  monsoon: { icon: '<path d="M20 15.5A4.5 4.5 0 0 0 17.5 7a6 6 0 0 0-11.5 1.5A4 4 0 0 0 6 16"/><path d="M8 17v4M12 15v6M16 17v4"/>', name: '장마', tip: '며칠째 비가 그치지 않는다.' },
  heat:    { icon: '<path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z"/><path d="M18 4l1.5-1.5M20 8h2M18 12l1.5 1.5"/>', name: '폭염', tip: '폭염 특보! 에어컨 앞자리 쟁탈전.' },
  dust:    { icon: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>', name: '미세먼지', tip: '미세먼지 나쁨. 체육은 실내에서.' },
  cold:    { icon: '<path d="M12 3v18M5 7l14 10M19 7 5 17"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2"/>', name: '한파', tip: '손이 꽁꽁. 핫팩이 귀하다.' },
  snow:    { icon: '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5"/>', name: '눈', tip: '눈이 소복소복 쌓였다.' },
  firstsnow: { icon: '<path d="M12 2v20M4.9 6.5l14.2 11M19.1 6.5 4.9 17.5"/><circle cx="12" cy="12" r="2.5"/>', name: '첫눈', tip: '올해 첫눈이다!' },
};
// 달마다 날씨 확률 (나머지는 맑음)
const WEATHER_ODDS = {
  3: { dust: .25, cold: .15 }, 4: { dust: .3, rain: .15 }, 5: { dust: .2, rain: .15 }, 6: { rain: .3, heat: .15 },
  7: { monsoon: .45, heat: .3 }, 8: { heat: .5, rain: .15 }, 9: { rain: .12 }, 10: { rain: .12 },
  11: { cold: .35, snow: .12 }, 12: { snow: .55, cold: .25 }, 1: { snow: .4, cold: .4 }, 2: { snow: .3, cold: .3 },
};
function rollWeather() {
  const m = dateOf(S.year, S.sem, S.day).getMonth() + 1, odds = WEATHER_ODDS[m] || {};
  let r = Math.random(), w = 'sunny';
  for (const k of Object.keys(odds)) { if (r < odds[k]) { w = k; break; } r -= odds[k]; }
  if (w === 'snow' && !S.flags['firstSnow' + S.year]) { S.flags['firstSnow' + S.year] = 1; w = 'firstsnow'; }
  return w;
}
const weatherIcon = w => UI_SVG(WEATHER[w].icon);
const weatherNow = () => (S && WEATHER[S.weather]) ? S.weather : 'sunny';
const isRain = w => w === 'rain' || w === 'monsoon';
const isSnow = w => w === 'snow' || w === 'firstsnow';
const wearing = slot => S && S.avatar && S.avatar[slot];

// 아침: 날씨를 정하고, 그날 몸 상태에 조금 반영한다
const _lifeStartDay = startDay;
startDay = function () {
  S.weather = rollWeather();
  _lifeStartDay();
  const w = S.weather, warm = wearing('top') === 'padding' || wearing('neck') === 'scarf';
  let line = '';
  if (w === 'heat') { if (wearing('top') === 'padding') { G.fat(7); line = '이 날씨에 롱패딩을 입고 왔다. 친구들이 나를 걱정스럽게 쳐다봤다. (피로 +7)'; } else { G.fat(4); line = '폭염 특보. 에어컨 바로 앞자리를 차지하려고 아침부터 뛰었다. (피로 +4)'; } }
  if (w === 'monsoon') { G.fat(2); line = '장마. 실내화까지 젖었다. (피로 +2)'; }
  if (w === 'cold') { if (warm) line = `한파지만 ${wearing('top') === 'padding' ? '롱패딩' : '목도리'} 덕분에 끄떡없다.`; else { G.fat(3); line = '한파. 교실까지 걸어오는 동안 얼어 버렸다. (피로 +3)'; } }
  if (w === 'snow') { G.add('luck', 1, true); line = '눈이 와서 운동장이 하얗다. 괜히 기분이 좋다. (운 +1)'; }
  if (w === 'firstsnow') {
    G.add('luck', 2, true); line = '올해 첫눈이 내렸다! 반 전체가 창문에 달라붙었다. (운 +2)';
    S.memories = (S.memories || []).concat({ when: `${S.year}학년 ${dateOf(S.year, S.sem, S.day).getMonth() + 1}월`, title: '첫눈 오는 날', choice: '창문에 달라붙어 눈 구경', type: 'daily' }).slice(-60);
  }
  if (line) { S.log.unshift(`${S.year}-${S.sem} · ${dateLabel()} 아침 — ${WEATHER[w].name} · ${line}`); S.weatherLine = line; } else S.weatherLine = '';
  save();
};

// 행동 결과에 날씨가 조금 끼어든다
function weatherTweak(type, arg) {
  const w = weatherNow(), fid = String(arg || '').split('|')[0], name = fid && CHARACTERS[fid] ? CHARACTERS[fid].name : '';
  if (type === 'exercise') {
    if (w === 'sunny') { G.add('stamina', 1, true); return '날씨가 좋아서 한 바퀴 더 뛰었다.'; }
    if (w === 'heat') { G.fat(4); return '더위를 먹었다. 그늘에서 한참 쉬었다.'; }
    if (w === 'dust') { G.fat(3); return '마스크 쓰고 뛰니 숨이 턱턱 막혔다.'; }
    if (isRain(w)) return '운동장이 진흙탕이라 체육관에서 했다.';
    if (isSnow(w)) { G.add('luck', 1, true); return '운동장 한가운데 눈사람을 세웠다.'; }
  }
  if (type === 'rest' && isRain(w)) { G.fat(-4); return '빗소리를 들으며 꿀잠을 잤다.'; }
  if (type === 'study' && isRain(w)) { G.add('study', 1, true); return '빗소리 덕분에 집중이 잘 됐다.'; }
  if ((type === 'talk' || type === 'hangout') && fid && S.aff[fid] !== undefined) {
    if (isRain(w)) { G.aff(fid, 2); return `${name}${josa(name, '과', '와')} 우산 하나를 같이 썼다.`; }
    if (isSnow(w)) { G.aff(fid, 3); return `${name}${josa(name, '과', '와')} 눈싸움을 했다. 둘 다 머리가 하얘졌다.`; }
    if (w === 'cold') { G.aff(fid, 1); return `${name}에게 핫팩 하나를 나눠 줬다.`; }
    if (w === 'heat' && type === 'hangout') { G.fat(2); return `${name}${josa(name, '과', '와')} 아이스크림을 하나씩 물고 다녔다.`; }
  }
  if (type === 'explore' && isSnow(w)) { G.add('luck', 1, true); return '아무도 안 밟은 눈길에 첫 발자국을 찍었다.'; }
  return '';
}
const _lifePerform = performAction;
performAction = function (type, arg, mult, note, info) {
  _lifePerform(type, arg, mult, note, info);
  if (!S || S.cur || !S.result || !S.weather) return;
  const r = withDiff(() => weatherTweak(type, arg));
  if (!r.text) return;
  const diffs = (S.result.diffs || []).slice();
  r.diffs.forEach(x => { const o = diffs.find(y => y.label === x.label); if (o) { o.d += x.d; o.good = o.label === '피로' ? o.d < 0 : o.d > 0; } else diffs.push(x); });
  S.result = Object.assign({}, S.result, { text: S.result.text + ' ' + r.text, diffs: diffs.filter(x => x.d), notes: (S.result.notes || []).concat(r.notes) });
  save(); render();
};

// 장면 그림에 날씨를 덧입힌다 (게임 화면에서만). 밖이면 비·눈이 내리고, 안이면 빛만 바뀐다.
const OUTDOOR_BG = ['field', 'ginkgo', 'river', 'rooftop'];
function weatherOverlay(w, outdoor, anim) {
  const fall = (n, shape, dur, drift) => Array.from({ length: n }, (_, i) => {
    const x = (i * 29 + 11) % 330 - 5, d = dur + (i % 4) * dur * .25, delay = -((i * 0.37) % d);
    const pos = (t, dx) => `${x + dx * t} ${-12 + 200 * t}`;
    return anim ? `<g>${shape(i)}<animateTransform attributeName="transform" type="translate" values="${pos(0, 0)}; ${pos(1, drift)}" dur="${d.toFixed(2)}s" begin="${delay.toFixed(2)}s" repeatCount="indefinite"/></g>`
      : `<g transform="translate(${x + (i % 3) * 6} ${(i * 37) % 180})">${shape(i)}</g>`;
  }).join('');
  if (isRain(w)) return `<rect width="320" height="180" fill="#2d3e55" opacity="${w === 'monsoon' ? .36 : .24}"/>` + (outdoor ? fall(w === 'monsoon' ? 34 : 22, () => '<path d="M0 0 l-4 12" stroke="#dbe9ff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>', .7, -24) : '');
  if (isSnow(w)) return `<rect width="320" height="180" fill="#e6efff" opacity=".16"/>` + (outdoor ? `<path d="M0 172 Q80 164 160 170 Q240 164 320 171 V180 H0Z" fill="#fff" opacity=".9"/>` : '') + fall(outdoor ? 26 : 12, i => `<circle r="${1.6 + (i % 3) * .7}" fill="#fff" opacity=".95"/>`, 6, 16);
  if (w === 'heat') return `<rect width="320" height="180" fill="#ff9a3c" opacity=".14"/><circle cx="300" cy="8" r="70" fill="#fff3a0" opacity=".3"/>`;
  if (w === 'dust') return `<rect width="320" height="180" fill="#c9b98a" opacity=".38"/>`;
  if (w === 'cold') return `<rect width="320" height="180" fill="#a9c8ff" opacity=".2"/>`;
  return '';
}
const _lifeScene = sceneSVG;
sceneSVG = function (o) {
  const svg = _lifeScene(o);
  if (!S || !S.weather || UI.screen !== 'game' || weatherNow() === 'sunny') return svg;
  return appendSvg(svg, weatherOverlay(weatherNow(), OUTDOOR_BG.includes(o.bg || 'classroom'), typeof FX !== 'undefined' && FX.on));
};
// 겨울이라고 늘 눈이 내리지는 않는다: 눈은 눈 오는 날에만
const _lifeSeason = seasonOverlay;
seasonOverlay = function (season) {
  if (season === 'winter') return '<rect width="320" height="180" fill="#dfeaff" opacity=".12"/>';
  if (season === 'summer' && S && isRain(weatherNow())) return '';
  return _lifeSeason(season);
};
// 메인 장면 위에 오늘의 날씨 표시
const _lifeHomeHtml = homeSceneHtml;
homeSceneHtml = function () {
  const html = _lifeHomeHtml(), w = WEATHER[weatherNow()];
  const badge = `<span class="sit-weather" title="${esc(w.tip)}">${weatherIcon(weatherNow())}${w.name}</span>`;
  const i = html.lastIndexOf('</div>');
  return html.slice(0, i) + badge + html.slice(i) + (S.weatherLine && S.slot === 0 && !S.result ? `<p class="weather-line">${weatherIcon(weatherNow())}<span>${esc(S.weatherLine)}</span></p>` : '');
};

/* ───────── 2. 옷장 ───────── */
const CLOSET = {
  hoodie:     { slot: 'top',  name: '회색 후드티',  price: 3000, desc: '편한 게 최고' },
  cardigan:   { slot: 'top',  name: '베이지 가디건', price: 3500, desc: '교복 위에 단정하게' },
  pe:         { slot: 'top',  name: '양일 체육복',  price: 2000, desc: '체육 없는 날에도 입는 사람' },
  classtee:   { slot: 'top',  name: '2반 반티',     price: 2500, desc: '노란색이라 어디서나 보인다' },
  padding:    { slot: 'top',  name: '검정 롱패딩',  price: 6000, desc: '한파에 강하다 · 폭염엔 금지' },
  beanie:     { slot: 'head', name: '빨간 비니',    price: 2500, desc: '방울이 달렸다' },
  cap:        { slot: 'head', name: '양일 볼캡',    price: 2500, desc: 'Y 로고 모자' },
  hairpin:    { slot: 'head', name: '별 머리핀',    price: 1200, desc: '반짝' },
  ribbon:     { slot: 'head', name: '리본 핀',      price: 1500, desc: '분홍 리본' },
  headphones: { slot: 'head', name: '헤드폰',       price: 4500, desc: '쉬는 시간 필수템' },
  scarf:      { slot: 'neck', name: '체크 목도리',  price: 2000, desc: '한파에 강하다' },
};
const SLOT_NAME = { top: '상의', head: '머리', neck: '목' };
function closetPicker() {
  const own = S.closet || [];
  const row = slot => Object.entries(CLOSET).filter(([, it]) => it.slot === slot).map(([id, it]) => {
    const has = own.includes(id), on = S.avatar && S.avatar[slot] === id, poor = !has && (S.money || 0) < it.price;
    return `<button class="pick closet-item ${on ? 'on' : ''}" data-act="wear" data-arg="${id}" ${poor ? 'disabled' : ''} aria-pressed="${on}">
      <span class="closet-thumb">${avatarSVG(Object.assign({}, S.avatar, { [slot]: id }), '')}</span>
      <span><b>${it.name}${on ? ' ✓' : ''}</b><small>${has ? (on ? '입는 중 · 누르면 벗기' : '내 옷장 · 누르면 입기') : poor ? `용돈 부족 · ${won(it.price)}` : `${won(it.price)} · ${it.desc}`}</small></span></button>`;
  }).join('');
  return `<div class="picker closet"><div class="picker-head"><b>옷장 · 용돈 ${won(S.money)}</b><button class="link" data-act="unpick">닫기</button></div>
    <div class="closet-top"><span class="closet-me">${avatarSVG(S.avatar, '지금 내 모습')}</span><p class="fine">산 옷은 장면 그림과 졸업 카드, 단체사진에도 나온다. 처음 입은 옷은 친구들이 알아봐 준다. 모은 옷 ${own.length} / ${Object.keys(CLOSET).length}</p></div>
    ${['top', 'head', 'neck'].map(slot => `<h4 class="closet-slot">${SLOT_NAME[slot]}</h4><div class="pick-grid">${row(slot)}</div>`).join('')}
    <p class="fine">옷을 사고 입는 데 행동력은 들지 않는다. 교복으로 돌아가려면 입은 옷을 한 번 더 누르면 된다.</p></div>`;
}
function wearItem(id) {
  const it = CLOSET[id]; if (!it || !S || !S.avatar) return;
  S.closet = S.closet || [];
  let msg;
  if (!S.closet.includes(id)) {
    if ((S.money || 0) < it.price) return;
    S.money -= it.price; S.closet.push(id);
    const r = withDiff(() => { G.add('social', 1, true); return ''; });
    msg = `${it.name}${josa(it.name, '을', '를')} 샀다! 다음 날 친구들이 "오, 새 옷?" 하고 알아봤다. (사교성 +1)`;
    if (S.closet.length === Object.keys(CLOSET).length && !S.flags.fashion) { S.flags.fashion = 1; G.nick('양일 패셔니스타'); msg += ' 옷장을 다 채웠다. 별명 "양일 패셔니스타"가 생겼다!'; }
    S.result = { title: `옷장 · ${it.name}`, text: msg + ` (남은 용돈 ${won(S.money)})`, diffs: r.diffs, notes: G.notes.slice() };
    S.avatar = Object.assign({}, S.avatar, { [it.slot]: id });
    if (typeof SFX !== 'undefined') SFX.play('pop');
  } else {
    S.avatar = Object.assign({}, S.avatar, { [it.slot]: S.avatar[it.slot] === id ? null : id });
  }
  save(); render();
}

/* ───────── 3. 졸업 단체사진 ───────── */
// 가장 친한 친구가 내 바로 옆에, 그다음은 바깥쪽과 뒷줄로 선다
function photoIds(s) {
  return Object.keys(CHARACTERS).filter(id => s.met[id] && !CHARACTERS[id].isTeacher && id !== 'teacher').sort((a, b) => s.aff[b] - s.aff[a]).slice(0, 11);
}
function photoLayout(ids) {
  const front = ids.slice(0, 4), back = ids.slice(4, 11);
  // 앞줄: [3, 1, 나, 0, 2]
  const order = [front[3], front[1], 'ME', front[0], front[2]].filter(Boolean);
  const backOrder = []; back.forEach((id, i) => i % 2 ? backOrder.unshift(id) : backOrder.push(id));
  return { order, back: backOrder };
}
function groupPhotoSVG(p) {
  const W = 360, H = 240, { order, back } = photoLayout(p.ids || []);
  const look = id => id === 'ME' ? { av: p.avatar || randomAvatar(p.gender) } : lookOf(id);
  const person = (id, cx, size, yBase) => {
    const l = look(id), sz = size * (l.tall ? 1.1 : l.small ? .9 : 1), x = cx - sz / 2, y = yBase - sz;
    let svg = avatarSVG(l.av, '').replace('<svg class="avatar-svg"', `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}"`);
    if (l.jacket) svg = svg.replace('fill="#2e3f63"', `fill="${l.jacket}"`);
    const extra = id === 'ME' ? `<g transform="translate(${cx + sz * .3} ${yBase - sz * .22})"><path d="M-9 -16 L0 4 L9 -16Z" fill="#7fbf6a"/><circle cx="-5" cy="-17" r="5" fill="#ff8fab"/><circle cx="5" cy="-18" r="5" fill="#ffd23f"/><circle cx="0" cy="-23" r="5" fill="#fff"/><circle cx="0" cy="-15" r="4.5" fill="#ff6f91"/></g><g transform="translate(${cx - sz * .32} ${yBase - sz * .16}) rotate(-25)"><rect x="-12" y="-3.5" width="24" height="7" rx="3.5" fill="#f4ecd8" stroke="#c9b48a"/><rect x="-2" y="-3.5" width="4" height="7" fill="#c23b2e"/></g>` : '';
    return svg + extra;
  };
  const bSlots = back.map((_, i) => W / 2 + (i - (back.length - 1) / 2) * (back.length > 6 ? 46 : 52));
  const fSlots = order.map((_, i) => W / 2 + (i - (order.length - 1) / 2) * 66);
  return `<svg class="group-photo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="졸업 단체사진" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="gp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd4f5"/><stop offset="1" stop-color="#e9f6fd"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#gp-sky)"/>
    <rect x="30" y="34" width="300" height="120" fill="#efe6d4"/><rect x="30" y="30" width="300" height="8" fill="#d8c9a8"/>
    ${Array.from({ length: 2 }, (_, r) => Array.from({ length: 9 }, (_, i) => `<rect x="${44 + i * 32}" y="${48 + r * 30}" width="20" height="18" fill="#a9d6ef" stroke="#f8f4ea" stroke-width="2"/>`).join('')).join('')}
    <rect x="95" y="16" width="170" height="22" rx="3" fill="#2e3f63"/><text x="180" y="31.5" text-anchor="middle" font-size="11" fill="#ffd23f" font-family="Jua, sans-serif">축 제${p.gradNo || ''}회 졸업 · 양일고등학교</text>
    ${[[18, 120], [342, 120]].map(([x, y]) => `<g transform="translate(${x} ${y})"><rect x="-3" y="0" width="6" height="40" fill="#7d5a3a"/><circle r="22" fill="#f2bf19"/><circle cx="-10" cy="8" r="13" fill="#f7d34a"/><circle cx="10" cy="6" r="14" fill="#e5ad0c"/></g>`).join('')}
    <rect y="150" width="${W}" height="${H - 150}" fill="#cdb48a"/><path d="M0 150 H${W}" stroke="#b39869" stroke-width="2"/>
    ${back.map((id, i) => person(id, bSlots[i], 70, 176)).join('')}
    ${order.map((id, i) => person(id, fSlots[i], 84, 236)).join('')}
    <text x="${W - 8}" y="${H - 6}" text-anchor="end" font-size="8" fill="#fff" opacity=".85" font-family="sans-serif">3학년 2반 · ${esc(p.name || '')}</text>
  </svg>`;
}
const photoName = id => id === 'ME' ? '나' : CHARACTERS[id] ? CHARACTERS[id].name : '';
function groupPhotoHtml(p) {
  const { order, back } = photoLayout(p.ids || []);
  return `<div class="paper group-photo"><h3 class="sec-title">졸업 단체사진</h3>
    <div class="group-photo-frame">${groupPhotoSVG(p)}</div>
    <p class="fine group-names">${back.length ? `<b>뒷줄</b> ${back.map(photoName).map(esc).join(' · ')}<br>` : ''}<b>앞줄</b> ${order.map(photoName).map(esc).join(' · ')}</p>
    <div class="create-actions center"><button class="btn" data-act="photo-save">사진 저장</button></div></div>`;
}
function photoOfState() { return { ids: photoIds(S), avatar: S.avatar, gender: S.gender, name: S.name, gradNo: SCHOOL.lastGradNo + 3 }; }
function photoOfRecord(r) { return { ids: r.photo, avatar: r.avatar, gender: r.gender, name: r.name, gradNo: r.gradNo }; }
function savePhoto() {
  const p = S ? photoOfState() : UI.rec && UI.rec.photo ? photoOfRecord(UI.rec) : null; if (!p) return;
  const img = new Image(), k = 3;
  img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = 360 * k; cv.height = 240 * k;
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const a = document.createElement('a'); a.download = `양일고_졸업사진_${p.name || ''}.png`;
    try { a.href = cv.toDataURL('image/png'); a.click(); } catch (e) { toast('저장이 막혀 있어요. 사진을 길게 눌러 저장하세요.'); }
  };
  img.onerror = () => toast('사진을 만들지 못했어요. 사진을 길게 눌러 저장하세요.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(groupPhotoSVG(p));
}

/* ───────── 클릭 처리 ───────── */
const _lifeMeta = metaAction;
metaAction = function (act, arg) {
  if (act === 'closet') { UI.pick = UI.pick === 'closet' ? null : 'closet'; render(); return true; }
  if (act === 'wear') { wearItem(arg); return true; }
  if (act === 'photo-save') { savePhoto(); return true; }
  if (act === 'unmet') { UI.showUnmet = !UI.showUnmet; render(); return true; }
  return _lifeMeta(act, arg);
};
