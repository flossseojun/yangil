// 캐릭터 전신 포즈: 기존 상반신 아바타 아래로 몸통·팔·다리·신발을 이어 그린다. 100×200 좌표.
// 포즈: stand(서기) · walk(걷기) · run(달리기) · sit(앉기) · jump(점프) · wave(손 흔들기)
const BODY_POSES = {
  //        왼팔 [윗팔, 아랫팔]   오른팔           왼다리 [허벅지, 정강이]  오른다리        몸 기울기
  stand: { la: [8, 0], ra: [-8, 0], ll: [3, 0], rl: [-3, 0], lean: 0 },
  walk:  { la: [-18, -12], ra: [24, -16], ll: [16, 6], rl: [-16, -2], lean: 0 },
  run:   { la: [55, -95], ra: [-45, -90], ll: [-55, 70], rl: [40, 25], lean: 8 },
  sit:   { la: [12, -40], ra: [-12, 40], ll: [14, -14], rl: [-14, 14], lean: 0, sit: true, thigh: 9 },
  jump:  { la: [150, 20], ra: [-150, -20], ll: [30, -55], rl: [-30, 55], lean: 0, lift: -10 },
  wave:  { la: [8, 0], ra: [-150, -30], ll: [3, 0], rl: [-3, 0], lean: 0 },
};
// 관절 하나: 기준점에서 각도만큼 돌린 막대 + 끝 관절에서 다시 돌린 막대
function limb(x, y, a1, a2, len1, len2, w, color, endShape) {
  return `<g transform="translate(${x} ${y}) rotate(${a1})"><rect x="${-w / 2}" y="0" width="${w}" height="${len1 + 2}" rx="${w / 2}" fill="${color}"/>
    <g transform="translate(0 ${len1}) rotate(${a2})"><rect x="${-w / 2}" y="0" width="${w}" height="${len2}" rx="${w / 2}" fill="${color}"/>${endShape(len2)}</g></g>`;
}
function avatarFullSVG(av, label = '', opts = {}) {
  const a = Object.assign({ build: 'normal', skin: '#f6dcc6' }, av || {});
  const P = BODY_POSES[opts.pose] || BODY_POSES.stand;
  const jacketCol = opts.jacket || (a.top && typeof OUTFIT_TOP !== 'undefined' && OUTFIT_TOP[a.top] ? ({ hoodie: '#9aa3ad', cardigan: '#d9c3a0', pe: '#2f7d5b', classtee: '#ffd23f', padding: '#26292d' })[a.top] : '#2e3f63');
  const pants = a.top === 'pe' ? '#2a6b4e' : '#2b3346', sk = a.skin;
  const wide = a.build === 'chubby' ? 6 : a.build === 'muscle' ? 5 : a.build === 'slim' ? -4 : 0;
  const hipY = P.sit ? 128 : 130, lift = P.lift || 0;
  const hand = l => `<circle cx="0" cy="${l + 3}" r="5.2" fill="${sk}" stroke="${shade(sk, -0.28)}" stroke-width="1"/>`;
  const shoe = l => `<ellipse cx="3" cy="${l + 2}" rx="8" ry="4.5" fill="#1f1f1f"/><ellipse cx="5" cy="${l + 1}" rx="3" ry="1.4" fill="#fff" opacity=".35"/>`;
  const parts = [];
  // 다리 (몸통 뒤)
  const th = P.thigh || 24;
  parts.push(limb(42 - wide / 3, hipY, P.ll[0], P.ll[1], th, 24, 13 + wide / 3, pants, shoe));
  parts.push(limb(58 + wide / 3, hipY, P.rl[0], P.rl[1], th, 24, 13 + wide / 3, pants, shoe));
  // 몸통 아랫부분 (상반신 아바타의 재킷과 이어진다)
  parts.push(`<path d="M${17 - wide} 94 L${83 + wide} 94 L${79 + wide / 2} ${hipY + 4} L${21 - wide / 2} ${hipY + 4}Z" fill="${jacketCol}"/>`);
  if (!a.top || a.top === 'uniform') parts.push(`<path d="M50 94 V${hipY + 4}" stroke="#1f2b45" stroke-width="1.2"/><circle cx="45" cy="106" r="1.6" fill="#c9b37a"/><circle cx="45" cy="118" r="1.6" fill="#c9b37a"/>`);
  parts.push(`<rect x="${21 - wide / 2}" y="${hipY}" width="${58 + wide}" height="6" rx="2" fill="${shade(jacketCol, -0.25)}"/>`);
  // 상반신(머리·어깨)
  parts.push(avatarSVG(a, label, { expr: opts.expr }).replace('<svg class="avatar-svg"', '<svg x="0" y="0" width="100" height="100"'));
  // 팔 (어깨에서)
  parts.push(limb(18 - wide, 84, P.la[0], P.la[1], 22, 20, 11, jacketCol, hand));
  parts.push(limb(82 + wide, 84, P.ra[0], P.ra[1], 22, 20, 11, jacketCol, hand));
  return `<svg class="avatar-full" viewBox="0 -10 100 210" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 ${lift}) rotate(${P.lean} 50 140)">${parts.join('')}</g></svg>`;
}
