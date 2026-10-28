// 연애 모드 확장: 데이트 장소 · 기념일과 커플템 · 서운함이 쌓이면 다툼, 그리고 화해

/* ───────── 데이트 장소 (약속 잡기에서 썸·연인과 갈 수 있다) ───────── */
const DATE_PLACES = {
  railbike: { name: '양평 레일바이크', cost: 6000, text: n => `${n}${josa(n, '과', '와')} 레일바이크를 탔다. 터널에 들어설 때마다 ${n}${josa(n, '이', '가')} 소리를 질렀다.` },
  cinema:   { name: '읍내 작은영화관', cost: 7000, text: n => `${n}${josa(n, '과', '와')} 영화를 봤다. 팝콘 통 안에서 손이 두 번 부딪혔다.` },
  bingsu:   { name: '빙수집', cost: 5000, text: n => `빙수 하나에 숟가락 두 개. ${n}${josa(n, '이', '가')} 팥을 자꾸 내 쪽으로 밀어 줬다.` },
  semiwon:  { name: '세미원 연꽃길', cost: 3000, text: n => `${n}${josa(n, '과', '와')} 세미원 징검다리를 건넜다. 연꽃 사이로 해가 졌다.` },
  yongmun:  { name: '용문사 은행나무', cost: 2000, text: n => `천 년 넘은 은행나무 아래 ${n}${josa(n, '과', '와')} 나란히 섰다. 소원은 서로 비밀로 하기로 했다.` },
  photo:    { name: '인생네컷', cost: 4000, item: '인생네컷 사진', text: n => `${n}${josa(n, '과', '와')} 인생네컷을 찍었다. 마지막 컷에서 ${n}${josa(n, '이', '가')} 볼에 손가락 하트를 올렸다.` },
};
const DATE_FAV = { chaerin: 'semiwon', taepung: 'railbike', sori: 'photo', jaemin: 'cinema' };
const isLove = id => S && S.mode === 'classic' && (S.partner === id || S.crush === id);

// 연인과 시간을 보내면 서운함이 풀린다
function loveTouch(id, ease = 10) {
  if (!S.partner || S.partner !== id) return;
  S.loveTouch = S.dayNo;
  S.loveTension = Math.max(0, (S.loveTension || 0) - ease);
}
function addCoupleItem(name) {
  S.coupleItems = S.coupleItems || [];
  if (!S.coupleItems.includes(name)) { S.coupleItems.push(name); G.notes.push(`커플템 획득: ${name}`); }
}
function dateOut(id, place) {
  const p = DATE_PLACES[place], n = CHARACTERS[id].name;
  S.money = (S.money || 0) - p.cost;
  const liked = DATE_FAV[id] === place;
  S.love[id] = clamp(S.love[id] + (liked ? 16 : 8)); G.aff(id, 5); G.fat(-8);
  G.notes.push(`${n} 설렘 ${S.love[id]}`);
  loveTouch(id, 20);
  if (p.item && S.partner === id) addCoupleItem(p.item);
  if (liked && !S.likedPlace['date_' + id]) { S.likedPlace['date_' + id] = true; G.notes.push(`${n}${josa(n, '이', '가')} 제일 좋아하는 데이트: ${p.name}`); }
  S.flags.dates = (S.flags.dates || 0) + 1;
  return p.text(n) + (liked ? ` "여기 진짜 와 보고 싶었어." ${n}${josa(n, '이', '가')} 환하게 웃었다.` : '');
}

/* ───────── 서운함과 다툼 ───────── */
// 하루를 마칠 때: 연인과 아무 시간도 안 보냈으면 서운함이 쌓인다. 시험 기간엔 더 쌓인다.
function romanceEndDay() {
  if (S.mode !== 'classic' || !S.partner) return;
  if (S.loveTouch === S.dayNo) return;
  const exam = specialsFor(S.year, S.sem, S.day).includes('exam');
  S.loveTension = clamp((S.loveTension || 0) + (S.loveSecret ? 3 : 4) + (exam ? 3 : 0));
  if (exam) S.flags.fightCause = 'exam';
  else if (S.flags.fightCause !== 'jealous') S.flags.fightCause = 'contact';
}
const FIGHT_TEXT = {
  contact: n => `${n}에게서 짧은 메시지가 왔다. "요즘 우리 얼굴 본 지 오래된 거 알아?" 마침표 하나가 유난히 차갑다.`,
  exam: n => `시험이 끝난 날, ${n}${josa(n, '이', '가')} 말한다. "시험 기간이라 이해하려고 했는데… 연락 한 통도 없는 건 좀 서운했어."`,
  jealous: n => `${n}${josa(n, '이', '가')} 은행나무길에서 멈춰 섰다. "저번 일, 아직 다 안 풀렸어. 그냥 넘어가면 안 될 것 같아."`,
};
ev({ mode: 'classic', id: 'love_fight', type: 'love', title: '서운함이 쌓였다',
  cond: s => s.partner && (s.loveTension || 0) >= 45,
  setup: (s, c) => { c.who = s.partner; c.cause = s.flags.fightCause || 'contact'; }, who: (s, c) => c.who,
  text: (s, c) => FIGHT_TEXT[c.cause](N(c.who)),
  choices: (s, c) => {
    // 화해: 상대가 좋아하는 방식이면 성공 확률이 크게 오른다
    const makeup = (style, line) => (s, c) => {
      const w = c.who, liked = CHARACTERS[w].likes === style;
      const p = clamp(0.35 + s.love[w] / 200 + (liked ? 0.35 : 0), 0.2, 0.95);
      if (Math.random() < p) {
        s.loveTension = 0; s.flags.fightCause = null; s.flags.jealous = 0; s.flags.makeups = (s.flags.makeups || 0) + 1;
        s.love[w] = clamp(s.love[w] + 10); loveTouch(w, 0); G.notes.push('다투고 나서 오히려 더 가까워졌다');
        return `${line} ${N2(w)} 한참 나를 보다가 피식 웃었다. "…다음엔 먼저 말해 줘." 그날 하굣길엔 손을 잡고 걸었다. (설렘 ${s.love[w]})`;
      }
      s.loveTension = 25; s.love[w] = clamp(s.love[w] - 5);
      return `${line} ${N2(w)} "알겠어"라고만 했다. 완전히 풀린 것 같지는 않다. (설렘 ${s.love[w]})`;
    };
    return [
      { label: '먼저 진심으로 사과한다', hint: '진심이 통하는 상대라면 효과적', run: makeup('sincere', '"미안해. 내가 너무 당연하게 생각했어."') },
      { label: '좋아하는 간식을 사 들고 찾아간다 (5,000원)', req: s => (s.money || 0) >= 5000, reqText: '용돈이 부족하다', hint: '장난스럽게 풀리는 상대라면 효과적',
        run: (s, c) => { s.money -= 5000; return makeup('playful', '"화 풀어 주세요~" 하며 좋아하는 간식을 내밀었다.')(s, c); } },
      { label: '왜 서운했는지 끝까지 들어 준다', hint: '이야기를 들어 주는 걸 좋아하는 상대라면 효과적', run: makeup('curious', '말을 끊지 않고 끝까지 들었다.') },
      { label: '"나도 서운한 거 많아."', run: (s, c) => { const w = c.who; s.love[w] = clamp(s.love[w] - 15); s.loveTension = 60; return `말다툼이 커졌다. ${N2(w)} 먼저 자리를 떴다. 오늘 밤은 메시지가 오지 않을 것 같다. (설렘 ${s.love[w]})`; } },
    ];
  } });

/* ───────── 기념일 · 특별한 날 ───────── */
ev({ mode: 'classic', id: 'love_200', type: 'love', once: true, title: '사귄 지 200일',
  cond: s => s.partner && s.dayNo - s.partnerSince >= 24, setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `200일. ${N2(c.who)} 쉬는 시간에 쪽지를 건넸다. "오늘 끝나고 시간 비워 둬. 할 말 있어."`,
  choices: [
    { label: '커플링을 맞춘다 (10,000원)', req: s => (s.money || 0) >= 10000, reqText: '용돈이 부족하다', run: (s, c) => { s.money -= 10000; s.love[c.who] = clamp(s.love[c.who] + 14); addCoupleItem('은행잎 커플링'); loveTouch(c.who, 30); return '은행잎이 새겨진 반지를 나눠 꼈다. 수업 시간에 자꾸 손을 보게 된다.'; } },
    { label: '서로에게 200일 편지를 쓴다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 10); addCoupleItem('200일 편지'); loveTouch(c.who, 30); return `${N(c.who)}의 편지 마지막 줄: "300일에도 이렇게 쓰고 있었으면 좋겠다."`; } },
  ] });
ev({ mode: 'classic', id: 'love_365', type: 'love', once: true, title: '1주년',
  cond: s => s.partner && s.dayNo - s.partnerSince >= 40, setup: (s, c) => { c.who = s.partner; }, who: (s, c) => c.who,
  text: (s, c) => `사귄 지 1년. ${N2(c.who)} 둘이 처음 이야기했던 곳에서 기다리고 있었다. 손에 작은 상자가 들려 있다.`,
  choices: [
    { label: '1년치 사진으로 앨범을 만들어 준다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 15); addCoupleItem('1주년 앨범'); loveTouch(c.who, 40); return `${N2(c.who)} 앨범을 넘기다 한 장에서 멈췄다. 처음 같이 찍은 사진이었다.`; } },
    { label: '처음 고백했던 말을 다시 한다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 12); loveTouch(c.who, 40); return '1년 전과 똑같은 말인데, 이번엔 둘 다 웃음이 터졌다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_pepero', type: 'love', title: '빼빼로데이 주간',
  cond: s => !!(s.partner || s.crush) && s.sem === 2 && s.day === 4 && !s.flags['pepero' + s.year],
  setup: (s, c) => { c.who = s.partner || s.crush; s.flags['pepero' + s.year] = 1; }, who: (s, c) => c.who,
  text: (s, c) => `11월, 빼빼로데이가 지난 주였다. 매점 할인 매대 앞에서 ${N(c.who)} 생각이 났다.${s.partner ? '' : ' 아직 사귀는 사이도 아닌데, 줘도 될까?'}`,
  choices: [
    { label: '직접 만든 빼빼로를 준다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 12); G.fat(6); loveTouch(c.who, 15); return `초코를 녹여 밤새 만들었다. 모양은 엉망이었지만 ${N2(c.who)} 한 개도 남기지 않았다. (설렘 ${s.love[c.who]})`; } },
    { label: '사물함에 몰래 넣어 둔다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + (s.partner ? 7 : 14)); loveTouch(c.who, 10); return `쪽지는 이름 없이 하트만 그렸다. 다음 날 ${N2(c.who)} 나를 보자마자 웃음을 참지 못했다. (설렘 ${s.love[c.who]})`; } },
    { label: '쑥스러워서 그냥 지나친다', run: (s, c) => { G.fat(-4); return '할인 빼빼로는 내가 다 먹었다. 조금 아쉽다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_xmas', type: 'love', title: '크리스마스 선물 교환',
  cond: s => !!s.partner && s.sem === 2 && s.day === 5 && !s.flags['xmas' + s.year],
  setup: (s, c) => { c.who = s.partner; s.flags['xmas' + s.year] = 1; }, who: (s, c) => c.who,
  text: (s, c) => `겨울방학식 날. 크리스마스에 각자 바빠서 못 한 선물 교환을 오늘 하기로 했다. ${N2(c.who)} 쇼핑백을 등 뒤에 숨기고 있다.`,
  choices: [
    { label: '커플 목도리를 준다 (8,000원)', req: s => (s.money || 0) >= 8000, reqText: '용돈이 부족하다', run: (s, c) => { s.money -= 8000; s.love[c.who] = clamp(s.love[c.who] + 13); addCoupleItem('커플 목도리'); loveTouch(c.who, 25); return '같은 색 목도리를 둘러매고 교문을 나섰다. 반 친구들이 휘파람을 불었다.'; } },
    { label: '1년 동안의 일을 담은 편지를 준다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 10); loveTouch(c.who, 25); return `${N2(c.who)} 편지를 읽다 목도리에 얼굴을 묻었다.`; } },
    { label: '두물머리 불빛 축제에 같이 간다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 11); G.fat(-10); loveTouch(c.who, 25); return '강 위에 불빛이 반짝였다. 추웠는데 하나도 춥지 않았다.'; } },
  ] });
ev({ mode: 'classic', id: 'love_trip_night', type: 'love', once: true, title: '수학여행의 밤',
  cond: s => !!(s.partner || s.crush) && s.year === 2 && !!s.seen.school_trip, setup: (s, c) => { c.who = s.partner || s.crush; }, who: (s, c) => c.who,
  text: (s, c) => `제주도 수학여행 둘째 날 밤. 숙소 앞 바닷가에서 ${N2(c.who)} 혼자 파도를 보고 있다. 철벽 쌤의 순찰까지 10분.`,
  choices: [
    { label: '옆에 앉아 같이 바다를 본다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 14); loveTouch(c.who, 20); return `파도 소리 때문에 말을 크게 해야 했다. 그래서 더 솔직해졌다. (설렘 ${s.love[c.who]})`; } },
    { label: '조개껍데기를 주워 준다', run: (s, c) => { s.love[c.who] = clamp(s.love[c.who] + 10); if (s.partner) addCoupleItem('제주 조개껍데기'); loveTouch(c.who, 15); return `"이거 평생 간직할게." ${N2(c.who)} 조개껍데기를 주머니에 넣었다.`; } },
    { label: '순찰 오기 전에 들어간다', run: (s, c) => { G.aff('teacher', 3); return '방에 들어가자마자 철벽 쌤이 문을 열었다. 아슬아슬했다.'; } },
  ] });
