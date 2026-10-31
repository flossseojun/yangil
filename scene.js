// 에피소드 장면 그림: 배경 + 인물(상반신) + 소품을 한 장의 SVG로 그린다. 320×180 (16:9)
// 인물은 avatar.js의 아바타를 그대로 쓰고, 친구마다 특징이 보이도록 외모를 정해 둔다.

/* ───────── 배경 ─────────
   빛(창문·하늘 그라데이션), 깊이(원근 바닥선·먼 산), 그림자, 질감을 넣어 한 장의 일러스트처럼 그린다. */
const SKY = (id, a, b, c) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".65" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>`;
const SHADE = `<defs><linearGradient id="sc-vign" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient><radialGradient id="sc-glow" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
const CLOUD = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="18" ry="7"/><ellipse cx="12" cy="-5" rx="11" ry="8"/><ellipse cx="-10" cy="-3" rx="9" ry="6"/></g>`;
const WINDOW = (x, y, w, h) => `<g><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="#f4efe4"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sc-win)"/>${CLOUD(x + w * .35, y + h * .3, .55)}<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * .55} H${x + w}" stroke="#f4efe4" stroke-width="3"/><path d="M${x + 4} ${y + h - 4} L${x + w * .35} ${y + 4}" stroke="#fff" stroke-width="2" opacity=".5"/></g>`;
const WIN_DEF = `<defs><linearGradient id="sc-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ccff2"/><stop offset="1" stop-color="#d8f0fb"/></linearGradient></defs>`;
const FLOOR = (y, c1, c2, lines = 7) => `<rect x="0" y="${y}" width="320" height="${180 - y}" fill="${c1}"/>${Array.from({ length: lines }, (_, i) => `<path d="M${160 + (i - (lines - 1) / 2) * 30} ${y} L${160 + (i - (lines - 1) / 2) * 110} 180" stroke="${c2}" stroke-width="1"/>`).join('')}<path d="M0 ${y + 14} H320 M0 ${y + 32} H320" stroke="${c2}" stroke-width="1" opacity=".7"/>`;
const LEAF = (x, y, r, c) => `<path d="M${x} ${y} q${r} ${-r} ${r * 2} 0 q${-r} ${r * .7} ${-r * 2} 0Z" fill="${c}"/>`;

const SCENE_BG = {
  classroom: () => `${WIN_DEF}${SHADE}
    <rect width="320" height="180" fill="#f1e9d6"/><rect width="320" height="8" fill="#e4d8bd"/>
    <rect x="0" y="104" width="320" height="10" fill="#d9c9a6"/>
    ${FLOOR(114, '#c79f6e', '#b08757')}
    ${WINDOW(10, 24, 44, 62)}${WINDOW(266, 24, 44, 62)}
    <path d="M54 24 L120 114 L80 114 L10 86Z" fill="#fff8d8" opacity=".25"/>
    <rect x="72" y="18" width="176" height="80" rx="3" fill="#7d5a36"/><rect x="77" y="23" width="166" height="70" fill="#2f5243"/>
    <rect x="77" y="23" width="166" height="70" fill="url(#sc-glow)"/>
    <text x="88" y="45" font-size="10.5" fill="#eef3ee" opacity=".9" font-family="'Nanum Pen Script', cursive, sans-serif">오늘의 급식: 돈가스 · 김치볶음밥</text>
    <text x="88" y="64" font-size="10" fill="#ffd96a" opacity=".9" font-family="'Nanum Pen Script', cursive, sans-serif">D-7 정기시험 · 수행평가 제출!</text>
    <text x="198" y="85" font-size="8" fill="#eef3ee" opacity=".6" font-family="sans-serif">주번: 양일</text>
    <rect x="96" y="96" width="128" height="4" rx="1" fill="#a07a50"/><rect x="104" y="94" width="10" height="3" fill="#fff"/><rect x="118" y="94" width="8" height="3" fill="#ffd23f"/>
    <rect x="148" y="6" width="24" height="10" rx="2" fill="#fff"/><circle cx="160" cy="11" r="3.5" fill="none" stroke="#555"/>
    ${[40, 120, 200, 280].map(x => `<g><rect x="${x - 26}" y="140" width="52" height="7" rx="2" fill="#b98955"/><rect x="${x - 22}" y="147" width="4" height="30" fill="#6e6e6e"/><rect x="${x + 18}" y="147" width="4" height="30" fill="#6e6e6e"/></g>`).join('')}
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  hallway: () => `${WIN_DEF}${SHADE}
    <rect width="320" height="180" fill="#e9eef0"/>
    <path d="M0 0 H320 V34 H0Z" fill="#f7f9fa"/>${WINDOW(30, 6, 70, 22)}${WINDOW(220, 6, 70, 22)}
    ${FLOOR(132, '#c3ccd0', '#aeb8bd', 9)}
    <rect x="0" y="128" width="320" height="5" fill="#9fabb1"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<g><rect x="${6 + i * 39}" y="40" width="35" height="90" rx="2" fill="${i % 3 === 1 ? '#86a8bd' : '#7f9fb3'}" stroke="#5f7f93" stroke-width="1.5"/>${[0, 1, 2].map(k => `<rect x="${12 + i * 39}" y="${48 + k * 5}" width="23" height="2.2" rx="1" fill="#5f7f93"/>`).join('')}<rect x="${33 + i * 39}" y="82" width="3" height="10" rx="1.5" fill="#dfe8ec"/><rect x="${14 + i * 39}" y="104" width="12" height="7" rx="1" fill="#f6f2e4" opacity=".85"/></g>`).join('')}
    <path d="M0 132 L320 132" stroke="#fff" stroke-width="1" opacity=".6"/>
    <ellipse cx="160" cy="150" rx="120" ry="10" fill="#fff" opacity=".18"/>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  field: () => `${SKY('sc-sky-f', '#6ec3f2', '#bfe6fb', '#e8f7ff')}${SHADE}
    <rect width="320" height="180" fill="url(#sc-sky-f)"/>
    <circle cx="54" cy="30" r="15" fill="#fff6b0"/><circle cx="54" cy="30" r="24" fill="#fff6b0" opacity=".25"/>
    ${CLOUD(130, 26, 1.1)}${CLOUD(240, 40, .8)}
    <path d="M0 98 Q40 58 92 80 Q130 48 176 74 Q214 52 258 72 Q292 56 320 76 V110 H0Z" fill="#8fb4a0"/>
    <path d="M0 104 Q70 82 140 98 Q210 80 320 96 V112 H0Z" fill="#6f9c80"/>
    <rect x="0" y="104" width="320" height="8" fill="#5f8c6f"/>${Array.from({ length: 16 }, (_, i) => `<circle cx="${i * 21 + 6}" cy="104" r="7" fill="#5a8a69"/>`).join('')}
    <rect y="110" width="320" height="70" fill="#d7b98a"/>
    <path d="M-20 180 Q160 112 340 180" fill="#79c46a"/>
    <path d="M10 180 Q160 128 310 180" stroke="#fff" stroke-width="1.8" fill="none" opacity=".8"/><path d="M40 180 Q160 140 280 180" stroke="#fff" stroke-width="1.2" fill="none" opacity=".5"/>
    <g stroke="#fff" stroke-width="3" fill="none"><path d="M238 110 V82 H300 V110"/></g><path d="M240 84 L298 84 L292 108 L244 108Z" fill="#fff" opacity=".18"/><path d="M240 84 L298 84 M248 84 L248 108 M258 84 L258 108 M268 84 L268 108 M278 84 L278 108 M288 84 L288 108" stroke="#fff" stroke-width=".6" opacity=".7"/>
    <rect x="16" y="94" width="40" height="14" fill="#c84b3a"/><path d="M14 94 H58" stroke="#8b2f22" stroke-width="2"/>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  store: () => `${SHADE}
    <rect width="320" height="180" fill="#f8f0e0"/><rect width="320" height="180" fill="url(#sc-glow)"/>
    <rect x="18" y="10" width="284" height="28" rx="5" fill="#d9534f"/><rect x="18" y="32" width="284" height="6" fill="#b33c39"/>
    <text x="160" y="29" text-anchor="middle" font-size="15" fill="#fff" font-family="Jua, sans-serif">양일 매점</text>
    ${[0, 1].map(r => `<rect x="26" y="${70 + r * 30}" width="268" height="5" fill="#9b7048"/><rect x="26" y="${75 + r * 30}" width="268" height="2" fill="#000" opacity=".12"/>` + Array.from({ length: 9 }, (_, i) => { const c = ['#f4c06a', '#e98e5b', '#f7e09b', '#9fd3c7', '#f2a7b5', '#c9b6f2', '#f4c06a', '#a0d47a', '#ffd1a6'][(i + r * 4) % 9]; return `<rect x="${32 + i * 29}" y="${52 + r * 30}" width="22" height="18" rx="3" fill="${c}"/><rect x="${34 + i * 29}" y="${56 + r * 30}" width="18" height="5" rx="1" fill="#fff" opacity=".55"/>`; }).join('')).join('')}
    <rect x="0" y="124" width="320" height="56" fill="#c48f5c"/><rect x="0" y="118" width="320" height="9" fill="#a8743f"/><rect x="0" y="127" width="320" height="3" fill="#000" opacity=".15"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${i * 44} 130 V180" stroke="#b17a45" stroke-width="1.5"/>`).join('')}
    <g transform="translate(262 108)"><ellipse cx="0" cy="8" rx="22" ry="5" fill="#000" opacity=".12"/><ellipse cx="0" cy="3" rx="19" ry="8" fill="#e7b46b"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${-12 + i * 3.5}" cy="${(i % 3) - 1}" r="1.6" fill="#c98b3c"/>`).join('')}<text x="0" y="-8" text-anchor="middle" font-size="6.5" fill="#7a4b1a" font-family="sans-serif">마지막 소보로!</text></g>
    <rect x="34" y="104" width="34" height="16" rx="2" fill="#444"/><rect x="37" y="107" width="28" height="7" fill="#7fe0b0"/>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  ginkgo: () => `${SKY('sc-sky-g', '#a9dcf7', '#e7f5fb', '#fdf3c9')}${SHADE}
    <rect width="320" height="180" fill="url(#sc-sky-g)"/>
    ${CLOUD(160, 22, .9)}
    <path d="M0 108 Q160 92 320 108 V180 H0Z" fill="#e5cf86"/>
    <path d="M128 180 L152 100 L168 100 L192 180Z" fill="#efe2bd"/><path d="M152 100 L128 180 M168 100 L192 180" stroke="#d8c89a" stroke-width="1"/>
    ${[[22, 62, 1.15], [72, 52, 1], [120, 70, .6], [200, 70, .6], [248, 52, 1], [298, 62, 1.15]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="2" cy="${118 - y > 0 ? (118 - y) / k - 2 : 50}" rx="16" ry="4" fill="#000" opacity=".1"/><path d="M-4 18 L-3 ${(116 - y) / k} H5 L4 18Z" fill="#7d5a3a"/><circle cx="0" cy="0" r="26" fill="#f2bf19"/><circle cx="-15" cy="10" r="17" fill="#f7d34a"/><circle cx="15" cy="8" r="19" fill="#e5ad0c"/><circle cx="-4" cy="-12" r="15" fill="#f9dc5c"/><circle cx="-8" cy="-6" r="6" fill="#fff3b0" opacity=".6"/></g>`).join('')}
    ${Array.from({ length: 26 }, (_, i) => LEAF((i * 47) % 320, 122 + (i * 31) % 56, 3 + (i % 3), ['#f2be1a', '#f7d34a', '#e5ad0c'][i % 3])).join('')}
    ${Array.from({ length: 8 }, (_, i) => LEAF(30 + i * 37, 40 + (i * 23) % 50, 2.5, '#f7d34a')).join('')}
    <g transform="translate(232 128)"><ellipse cx="18" cy="14" rx="26" ry="3" fill="#000" opacity=".12"/><rect x="0" y="0" width="38" height="5" rx="2" fill="#7a5a3a"/><rect x="0" y="-7" width="38" height="4" rx="2" fill="#8c6a48"/><rect x="3" y="5" width="3" height="9" fill="#5a4030"/><rect x="32" y="5" width="3" height="9" fill="#5a4030"/></g>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  library: () => `${WIN_DEF}${SHADE}
    <rect width="320" height="180" fill="#ecdfc6"/>
    <rect x="0" y="0" width="210" height="122" fill="#7a5638"/>
    ${[0, 1, 2].map(r => `<rect x="4" y="${36 + r * 38}" width="202" height="5" fill="#5d4029"/>` + Array.from({ length: 21 }, (_, i) => { const h = 22 + (i * 7 + r * 3) % 9, c = ['#b5523b', '#3b6e8f', '#5a8f4e', '#d9a441', '#7b4f9e', '#2f4f3f', '#c97b5a'][(i + r * 2) % 7]; return `<rect x="${7 + i * 9.5}" y="${36 + r * 38 - h}" width="${7.5 - (i % 4 === 0 ? 1.5 : 0)}" height="${h}" fill="${c}"/><rect x="${8 + i * 9.5}" y="${40 + r * 38 - h}" width="5.5" height="1.5" fill="#f4e6c4" opacity=".7"/>`; }).join('')).join('')}
    ${WINDOW(228, 18, 76, 84)}
    <path d="M228 102 L304 102 L250 160 L160 160Z" fill="#fff6cf" opacity=".28"/>
    <rect x="0" y="122" width="320" height="58" fill="#b38a5a"/>${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${128 + i * 6} H320" stroke="#a37a4c" stroke-width=".8"/>`).join('')}
    <rect x="30" y="136" width="250" height="9" rx="2" fill="#7d5a36"/><rect x="30" y="145" width="250" height="3" fill="#000" opacity=".15"/>
    <g transform="translate(238 124)"><rect x="-2" y="0" width="30" height="12" rx="1" fill="#f6f1e4"/><path d="M13 0 V12" stroke="#cfc4a8"/><rect x="40" y="-14" width="5" height="26" rx="1" fill="#4a7c59"/><path d="M42.5 -14 q-10 -6 -8 -16 q8 4 8 16" fill="#7fbf6a"/></g>
    <circle cx="70" cy="128" r="6" fill="#e9e1cd" stroke="#bfb08d"/><path d="M66 128 h8" stroke="#8d7a55"/>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  river: () => `${SKY('sc-sky-r', '#ff9f6e', '#ffd2a0', '#fff1d4')}${SHADE}
    <rect width="320" height="180" fill="url(#sc-sky-r)"/>
    <circle cx="246" cy="74" r="22" fill="#fff1bf"/><circle cx="246" cy="74" r="36" fill="#fff1bf" opacity=".25"/>
    ${CLOUD(80, 30, 1)}${CLOUD(180, 20, .7)}
    <path d="M0 90 Q40 56 96 80 Q134 48 184 74 Q228 50 268 70 Q300 58 320 70 V100 H0Z" fill="#8f86ab"/>
    <path d="M0 96 Q60 74 120 90 Q190 72 250 88 Q290 80 320 88 V102 H0Z" fill="#766e98"/>
    <rect y="98" width="320" height="34" fill="#6aa3c4"/>
    <rect x="232" y="98" width="28" height="34" fill="#ffe7a8" opacity=".35"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${10 + i * 46} ${104 + (i % 3) * 8} h${16 + (i % 2) * 8}" stroke="#fff" stroke-width="1.4" opacity=".55"/>`).join('')}
    <path d="M0 132 L320 124 L320 180 L0 180Z" fill="#94ba74"/>
    <path d="M0 146 L320 136 L320 148 L0 158Z" fill="#d8c9a0"/><path d="M0 152 L320 142" stroke="#fff" stroke-width="1" stroke-dasharray="8 8" opacity=".7"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 24 + 6} 172 q2 -8 4 0 M${i * 24 + 12} 176 q2 -6 4 0" stroke="#6f9a55" stroke-width="1.2" fill="none"/>`).join('')}
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  auditorium: () => `${SHADE}
    <rect width="320" height="180" fill="#3a2a4a"/>
    <path d="M0 0 H320 V22 Q160 34 0 22Z" fill="#8e2f3c"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 28} 0 V${24 + (i % 2) * 4}" stroke="#6e2230" stroke-width="2"/>`).join('')}
    <rect x="0" y="0" width="34" height="130" fill="#a63a49"/><rect x="286" y="0" width="34" height="130" fill="#a63a49"/>${[8, 18, 26, 294, 302, 312].map(x => `<path d="M${x} 0 V130" stroke="#7d2a37" stroke-width="2"/>`).join('')}
    <path d="M110 0 L80 120 L240 120 L210 0Z" fill="#fff6c8" opacity=".14"/>
    <rect x="34" y="104" width="252" height="22" fill="#8a5a34"/><rect x="34" y="104" width="252" height="4" fill="#b07a48"/>
    <rect x="90" y="36" width="140" height="22" rx="3" fill="#f4e9c8"/><text x="160" y="51" text-anchor="middle" font-size="10" fill="#6e2230" font-family="Jua, sans-serif">녹향제 · 양일고등학교</text>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${50 + i * 24}" cy="${70 + (i % 3) * 5}" r="2" fill="${['#ffd23f', '#ff8fa3', '#7cc7ff'][i % 3]}"/>`).join('')}
    <rect x="0" y="126" width="320" height="54" fill="#241a30"/>${[0, 1, 2].map(r => Array.from({ length: 16 }, (_, i) => `<path d="M${i * 21 + (r % 2) * 10} ${150 + r * 12} q8 -10 16 0" fill="#3b2c4d"/>`).join('')).join('')}
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  gym: () => `${SHADE}
    <rect width="320" height="180" fill="#e9dfcf"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${8 + i * 40}" y="6" width="30" height="14" fill="#cfe9f7" stroke="#bfae92"/>`).join('')}
    <rect x="0" y="22" width="320" height="4" fill="#bfae92"/>
    <g transform="translate(160 40)"><rect x="-26" y="0" width="52" height="34" fill="#fff" stroke="#c84b3a" stroke-width="2"/><rect x="-10" y="14" width="20" height="14" fill="none" stroke="#c84b3a" stroke-width="1.5"/><circle cx="0" cy="40" r="9" fill="none" stroke="#e8823a" stroke-width="2"/><path d="M-8 42 L-5 56 M8 42 L5 56 M0 49 L0 58" stroke="#fff" stroke-width="1" opacity=".9"/></g>
    ${FLOOR(112, '#d9a96a', '#c48f50', 9)}
    <path d="M40 180 Q160 120 280 180" stroke="#fff" stroke-width="2" fill="none"/><path d="M0 128 H320" stroke="#c84b3a" stroke-width="2"/>
    <ellipse cx="160" cy="140" rx="110" ry="9" fill="#fff" opacity=".22"/>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
  rooftop: () => `${SKY('sc-sky-n', '#0f1a3a', '#24346a', '#4a4f86')}${SHADE}
    <rect width="320" height="180" fill="url(#sc-sky-n)"/>
    ${Array.from({ length: 46 }, (_, i) => `<circle cx="${(i * 67) % 320}" cy="${(i * 37) % 110}" r="${i % 7 === 0 ? 1.6 : .8}" fill="#fff" opacity="${.5 + (i % 5) / 10}"/>`).join('')}
    <path d="M40 30 L70 22 L96 34 L124 26" stroke="#fff" stroke-width=".6" opacity=".6" fill="none"/>
    <circle cx="270" cy="34" r="12" fill="#fff6d6"/><circle cx="276" cy="30" r="12" fill="#24346a"/>
    <path d="M0 118 L60 108 L90 114 L140 102 L200 112 L260 100 L320 110 V130 H0Z" fill="#1b2347"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${14 + i * 31}" y="${116 - (i % 3) * 4}" width="3" height="3" fill="#ffd96a" opacity=".8"/>`).join('')}
    <rect x="0" y="128" width="320" height="52" fill="#4b5068"/>
    <path d="M0 128 H320" stroke="#7e849e" stroke-width="3"/>${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 20} 116 V128" stroke="#7e849e" stroke-width="2"/>`).join('')}<path d="M0 116 H320" stroke="#7e849e" stroke-width="2"/>
    <g transform="translate(56 120)"><path d="M0 0 L22 -18" stroke="#ccc" stroke-width="4"/><path d="M8 -4 L2 14 M8 -4 L16 14" stroke="#999" stroke-width="2"/></g>
    <rect width="320" height="180" fill="url(#sc-vign)"/>`,
};
const SCENE_BG_NAME = { classroom: '교실', hallway: '복도', field: '운동장', store: '매점', ginkgo: '은행나무길', library: '도서관', river: '남한강 둑길', auditorium: '강당', gym: '체육관', rooftop: '옥상 밤하늘' };

/* ───────── 친구 외모 ─────────
   av: 아바타 부품(+ lips), tall: 키 큼, prop: 들고 있는 소품 */
const FRIEND_LOOKS = {
  jaewon:    { av: { hair: 'short', hairColor: '#4a2f22', skin: '#f6dcc6', face: 'plain', acc: 'none' } },
  geonwoo:   { av: { hair: 'curly', hairColor: '#e9e2d0', skin: '#f6dcc6', face: 'smile', acc: 'none' }, prop: 'alpaca' },
  hayeon:    { av: { hair: 'long', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses' }, prop: 'book' },
  minah:     { av: { hair: 'ponytail', hairColor: '#1e1b1a', skin: '#efc6a2', face: 'proud', acc: 'none' }, prop: 'helmet', jacket: '#1f1f1f' },
  sangwoong: { av: { hair: 'twoblock', hairColor: '#2a2420', skin: '#f6dcc6', face: 'smile', acc: 'none' }, tall: true, prop: 'keyring' },
  soyul:     { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#efc6a2', face: 'smile', acc: 'none' }, tall: true, prop: 'basketball' },
  seongjun:  { av: { hair: 'twoblock', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'proud', acc: 'none' }, prop: 'card' },
  yuchan:    { av: { hair: 'twoblock', hairColor: '#e3c068', skin: '#b97f55', face: 'proud', acc: 'none' } },
  wooseok:   { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'none', lips: '#d6283b' } },
  seoan:     { av: { hair: 'buzz', hairColor: '#2a2420', skin: '#f6dcc6', face: 'smile', acc: 'none' } },
  taejeong:  { av: { hair: 'short', hairColor: '#4a2f22', skin: '#efc6a2', face: 'wink', acc: 'none' }, prop: 'phone' },
  // 사용자가 알려 준 외모
  ryun:      { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses', build: 'chubby' } },
  seojun:    { av: { hair: 'curly', hairColor: '#2a2420', skin: '#f6dcc6', face: 'smile', acc: 'glasses', build: 'slim' } },
  yejun:     { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#fcebdf', face: 'smile', acc: 'none', build: 'chubby' } },
  mingyeol:  { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#efc6a2', face: 'proud', acc: 'glasses', build: 'muscle' } },
  jiyong:    { av: { hair: 'curly', hairColor: '#2a2420', skin: '#f6dcc6', face: 'smile', acc: 'none' } },
  yunsu:     { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#efc6a2', face: 'proud', acc: 'none', build: 'chubby' } },
  eunseong:  { av: { hair: 'long', hairColor: '#7a4b2a', skin: '#f6dcc6', face: 'smile', acc: 'none' } },
  yunbo:     { av: { hair: 'twoblock', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'none' } },
  isan:      { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#b97f55', face: 'smile', acc: 'glasses' } },
  siwoo:     { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#fcebdf', face: 'smile', acc: 'none' } },
  hyunwoo:   { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses' }, prop: 'soccer' },
  jio:       { av: { hair: 'twoblock', hairColor: '#2a2420', skin: '#fcebdf', face: 'wink', acc: 'none' } },
  younggeun: { av: { hair: 'curly', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses' } },
  sia:       { av: { hair: 'long', hairColor: '#1e1b1a', skin: '#fcebdf', face: 'smile', acc: 'none', build: 'chubby' }, tall: true },
  yejunsim:  { av: { hair: 'twoblock', hairColor: '#1e1b1a', skin: '#b97f55', face: 'proud', acc: 'none' }, tall: true },
  jejun:     { av: { hair: 'curly', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses' } },
  sihun:     { av: { hair: 'twoblock', hairColor: '#b5813f', skin: '#fcebdf', face: 'smile', acc: 'none', nose: true } },
  hyeongseop:{ av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'plain', acc: 'none' } },
  sion:      { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#b97f55', face: 'smile', acc: 'glasses' } },
  yejin:     { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'smile', acc: 'glasses' } },
  jaejun:    { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#f6dcc6', face: 'proud', acc: 'glasses' } },
  taeyeol:   { av: { hair: 'curly', hairColor: '#1e1b1a', skin: '#fcebdf', face: 'smile', acc: 'glasses' } },
  munyunsu:  { av: { hair: 'short', hairColor: '#7a4b2a', skin: '#dba67b', face: 'smile', acc: 'none' } },
  hyeonseo:  { av: { hair: 'short', hairColor: '#1e1b1a', skin: '#efc6a2', face: 'wink', acc: 'none' } },
  yunho:     { av: { hair: 'short', hairColor: '#7a4b2a', skin: '#f6dcc6', face: 'smile', acc: 'none', nose: true } },
};
const lookOf = id => FRIEND_LOOKS[id] || { av: randomAvatar('m', typeof seededRng === 'function' ? seededRng('look-' + id) : Math.random) };

/* ───────── 소품 ───────── */
const PROPS = {
  alpaca: (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="18" rx="14" ry="11" fill="#fbf7ee" stroke="#d9cfb8"/><rect x="4" y="-6" width="9" height="22" rx="4.5" fill="#fbf7ee" stroke="#d9cfb8"/><circle cx="9" cy="-8" r="8" fill="#fbf7ee" stroke="#d9cfb8"/><circle cx="6" cy="-14" r="5" fill="#fff"/><circle cx="11" cy="-8" r="1.2" fill="#2a2420"/><ellipse cx="14" cy="-5" rx="2" ry="1.2" fill="#e8b4a8"/><path d="M5 -15 l-2 -5 M13 -15 l2 -5" stroke="#d9cfb8" stroke-width="2" stroke-linecap="round"/></g>`,
  book: (x, y) => `<g transform="translate(${x} ${y}) rotate(-12)"><rect x="-12" y="0" width="24" height="30" rx="2" fill="#3b6e8f"/><rect x="-9" y="4" width="18" height="6" fill="#f4f1e8"/></g>`,
  helmet: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-16 10 Q-16 -12 0 -12 Q16 -12 16 10Z" fill="#1f1f1f"/><path d="M-4 -2 H14 V8 H-4Z" fill="#6f8796" opacity=".9"/><path d="M-16 10 H16" stroke="#c0392b" stroke-width="3"/></g>`,
  keyring: (x, y) => `<g transform="translate(${x} ${y})"><circle cx="0" cy="-10" r="4" fill="none" stroke="#c9c9c9" stroke-width="1.5"/><path d="M0 -6 L-8 18 L8 18Z" fill="#fff" stroke="#9ad1b5" stroke-width="1.5"/><circle cx="0" cy="0" r="6" fill="#5fbf8f"/><path d="M-3 6 Q0 12 3 6" fill="#e05a6d"/></g>`,
  basketball: (x, y) => `<g transform="translate(${x} ${y})"><circle r="13" fill="#e8823a" stroke="#7a3b10" stroke-width="1.2"/><path d="M-13 0 H13 M0 -13 V13 M-9 -9 Q0 0 -9 9 M9 -9 Q0 0 9 9" stroke="#7a3b10" stroke-width="1.2" fill="none"/></g>`,
  card: (x, y) => `<g transform="translate(${x} ${y}) rotate(8)"><rect x="-14" y="-9" width="28" height="18" rx="2" fill="#ffd23f" stroke="#b8860b"/><text x="0" y="3" text-anchor="middle" font-size="6" fill="#5a4300" font-family="sans-serif">한턱 쿠폰</text></g>`,
  phone: (x, y) => `<g transform="translate(${x} ${y}) rotate(-10)"><rect x="-8" y="-14" width="16" height="28" rx="3" fill="#2a2a2a"/><rect x="-6" y="-11" width="12" height="20" fill="#7fd0ff"/><circle cx="0" cy="-1" r="4.5" fill="#fff" stroke="#2a2a2a" stroke-width="1"/><path d="M-4.5 -1 H4.5" stroke="#2a2a2a"/><path d="M-4.5 -1 A4.5 4.5 0 0 1 4.5 -1Z" fill="#e53935"/></g>`,
  soccer: (x, y) => `<g transform="translate(${x} ${y})"><circle r="12" fill="#fff" stroke="#333" stroke-width="1.2"/><path d="M0 -5 L4.8 -1.5 L3 4 L-3 4 L-4.8 -1.5Z" fill="#333"/><path d="M0 -5 V-12 M4.8 -1.5 L11 -4 M3 4 L7 10 M-3 4 L-7 10 M-4.8 -1.5 L-11 -4" stroke="#333" stroke-width="1"/></g>`,
  pigeons: () => [[40, 150], [70, 160], [255, 152], [285, 162], [150, 168]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(${i % 2 ? -1 : 1} 1)"><ellipse cx="0" cy="0" rx="10" ry="6.5" fill="#8d96a3"/><circle cx="8" cy="-6" r="4.5" fill="#7b8794"/><path d="M12 -6 l4 1 l-4 1Z" fill="#e0a040"/><circle cx="9" cy="-7" r="1" fill="#222"/><path d="M-10 0 l-6 -3 l1 6Z" fill="#6c7581"/><path d="M5 -3 q2 2 0 4" stroke="#6fbf8f" stroke-width="1.5" fill="none"/></g>`).join(''),
  motorcycle: () => `<g transform="translate(268 128)"><circle cx="-26" cy="20" r="13" fill="#222"/><circle cx="-26" cy="20" r="5" fill="#888"/><circle cx="30" cy="20" r="13" fill="#222"/><circle cx="30" cy="20" r="5" fill="#888"/><path d="M-26 20 L-8 2 H18 L30 20" stroke="#555" stroke-width="4" fill="none"/><path d="M-12 -2 Q2 -10 20 -2 L18 6 H-8Z" fill="#1f1f1f"/><path d="M-6 -4 Q4 -9 14 -4" stroke="#c0392b" stroke-width="3" fill="none"/><path d="M22 -4 L30 -14 M27 -14 H35" stroke="#888" stroke-width="3" stroke-linecap="round"/><circle cx="34" cy="0" r="3.5" fill="#ffe08a"/></g>`,
};

/* ───────── 장면 그리기 ─────────
   cast: [{ id } | { me: true, av }] 왼쪽부터. extras: 배경 위에 얹을 소품 이름(비둘기, 오토바이 등) */
function sceneSVG({ bg = 'classroom', cast = [], extras = [], label = '장면' }) {
  const n = cast.length, W = 320, H = 180;
  const slots = n === 1 ? [160] : n === 2 ? [108, 212] : [68, 160, 252];
  const people = cast.map((c, i) => {
    const look = c.me ? { av: c.av, me: true } : lookOf(c.id);
    const size = (look.tall ? 128 : look.small ? 96 : 108) * (n >= 3 ? .92 : 1), x = slots[i] - size / 2, y = H - size + 4;
    let svg = avatarSVG(look.av, '').replace('<svg class="avatar-svg"', `<svg x="${x}" y="${y}" width="${size}" height="${size}"`);
    if (look.jacket) svg = svg.replace('fill="#2e3f63"', `fill="${look.jacket}"`);
    const shadow = `<ellipse cx="${slots[i]}" cy="${H - 2}" rx="${size * .34}" ry="5" fill="#000" opacity=".18"/>`;
    const prop = look.prop && PROPS[look.prop] ? PROPS[look.prop](slots[i] + size * 0.36, y + size * 0.72) : '';
    return shadow + svg + prop;
  }).join('');
  return `<svg class="scene-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">${(SCENE_BG[bg] || SCENE_BG.classroom)()}${extras.map(e => PROPS[e] ? PROPS[e]() : '').join('')}${people}</svg>`;
}

// 사건의 장소·글에서 배경을 고른다 (앞에 있는 단어가 먼저)
const SCENE_WORDS = [
  [/옥상|밤하늘|별자리|별을 보|망원경|목성/, 'rooftop'], [/강당|축제|녹향제|졸업식|입학식|무대|양스킹/, 'auditorium'],
  [/체육관|농구|배드민턴|스쿼트|헬스|유도|매트/, 'gym'], [/남한강|둑길|강가|하천|노을|할리/, 'river'],
  [/도서관|책장|서가|스터디룸/, 'library'], [/매점|소보로|빵|분식|떡볶이|편의점|쏜다|한턱/, 'store'],
  [/은행나무|벤치|하굣길|산책/, 'ginkgo'], [/운동장|축구|달리기|체육한마당|스탠드|크로스|골대|레이드|포켓스톱/, 'field'],
  [/복도|사물함|게시판|교문/, 'hallway'],
];
const LOC_BG = { library: 'library', store: 'store', field: 'field', ginkgo: 'ginkgo', empty: 'classroom', roof: 'rooftop' };
function sceneBgFor(e, text) {
  if (e.loc && LOC_BG[e.loc]) return LOC_BG[e.loc];
  const t = (typeof e.title === 'string' ? e.title : '') + ' ' + (text || '');
  const hit = SCENE_WORDS.find(([re]) => re.test(t));
  return hit ? hit[1] : e.type === 'story' ? 'hallway' : 'classroom';
}
// 게임 사건 창의 장면: 나 + 등장 친구(합동 장면이면 두 명)
function sceneFor(e, c, who, text) {
  const ids = [];
  if (S.cur && S.cur.id === 'pair_scene' && typeof PAIR_SCENES !== 'undefined') ids.push(PAIR_SCENES[c.i][0], PAIR_SCENES[c.i][1]);
  else if (c && c.a && c.b && CHARACTERS[c.a] && CHARACTERS[c.b]) ids.push(c.a, c.b);
  else if (who && who !== 'teacher') ids.push(who);
  const meAv = S.avatar || randomAvatar(S.gender);
  const cast = ids.length === 2 ? [{ id: ids[0] }, { me: true, av: meAv }, { id: ids[1] }] : [{ me: true, av: meAv }].concat(ids.map(id => ({ id })));
  const extras = [];
  if (/비둘기/.test(text)) extras.push('pigeons');
  if (/할리/.test(text)) extras.push('motorcycle');
  return sceneSVG({ bg: sceneBgFor(e, text), cast, extras, label: `${eventTitle(e, c)} 장면` });
}
