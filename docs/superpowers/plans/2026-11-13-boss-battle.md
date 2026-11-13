# 학기말 보스전 · 친구 도감 · 3학년 2학기 시험 삭제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학기 2차 정기시험을 공부(숙련도·오답노트)를 무기로 쓰는 보스전으로 바꾸고, 1차는 정찰·장비 단계로 만들며, 친구 도감을 추가하고 3학년 2학기 시험을 없앤다.

**Architecture:** 전투 규칙은 화면과 분리된 순수 함수(`boss.js`)로 두고, 화면(`bossui.js`)이 그 상태를 그린다. 시험 점수는 기존 `takeExam`이 계산하고 전투 결과는 `bonusExtra` 한 값으로만 들어간다. 친구 도감은 `life.js`처럼 기존 화면을 감싸는 별도 파일(`frienddex.js`).

**Tech Stack:** 바닐라 JS, SVG + CSS 애니메이션, 테스트는 Playwright 스크립트(스크래치패드), 배포는 GitHub(main) + claude.ai 아티팩트.

**Spec:** `docs/superpowers/specs/2026-11-13-boss-battle-design.md`

## Global Constraints
- 점수 보너스 범위: 처치 +6~+10, 집중력 0 −10~−4, 시간 종료 −4~+5. 모든 과목 지필 점수에 같은 값.
- 등급 기준(S 103 · A 94 · B 72)과 Firestore 규칙은 바꾸지 않는다.
- 최대 8턴, 집중력 100 − max(0, 피로−50)/2.
- 데미지 = (8 + 레벨×2.2) × (약점 2 / 내성 0.5 / 보통 1) × 타이밍(완벽 1.5 · 좋음 1.0 · 아쉬움 0.6 · 빗나감 0.2). 레벨 = floor(숙련도/10) + 장비(1차 1~2등급 +1, 4등급 이하 −1).
- 복수 공격: 전투당 최대 3회, 내성 무시 ×2.5, 사용 시 오답노트 1개 제거.
- 친구 응원: 친밀도 70 이상 이번 판 친구 1명, 전투당 1회. 실제 친구는 돕는 역할만.
- 전투 중 과목 문제 없음. 1차는 전투 없음. 3학년 2학기 정기시험 없음.
- 휴대폰 400px 가로 넘침 없음. 설정 `SETTINGS.miniAuto`면 타이밍 자동 「좋음」, 동작 줄이기면 커서 느리게.
- 테스트는 실제 랭킹 서버에 쓰지 않는다(`rankSubmit = async () => false; rankDrain = () => {}`).

## Review Focus
- 수강 과목에 약점·내성 영역 과목이 하나도 없을 때 → 보통 배수로 정상 진행. (Task 2 테스트)
- 오답노트가 비어 있을 때 → 복수 공격 버튼 비활성, 오류 없음. (Task 2 테스트)
- 친밀도 70 이상 친구가 없을 때 → 응원 버튼 숨김. (Task 2 테스트)
- 전투 도중 새로고침/이어하기 → 전투가 처음부터 다시 시작되거나 자동 계산되어 시험이 사라지지 않는다. (Task 4 테스트)
- 1차를 「찍기」로 봐도 정찰 보고서는 나온다. (Task 3 테스트)

---

### Task 1: 3학년 2학기 정기시험 삭제

**Files:**
- Modify: `game.js` — `specialsFor` 의 `exam` 푸시, `finalizeSemester` 호출 지점, 학기 성적표 화면
- Test: 스크래치패드 `t1-noexam.js`

**Interfaces:**
- Produces: `examDay(year, sem, day) -> boolean` (game.js) — 그날 정기시험이 있는지. 3학년 2학기는 항상 false.

- [ ] **Step 1: 테스트 작성** — `specialsFor(3,2,d)`가 d=1..5 모두 `exam`을 포함하지 않고, `specialsFor(3,1,3)`·`(2,2,5)`는 포함. 3학년 2학기 끝까지 자동 진행 후 `S.semGrades`에 `key`가 3학년 2학기인 항목이 없고 오류 없음.
- [ ] **Step 2: 실행해 실패 확인** — `node t1-noexam.js` → 3-2에 exam 있음으로 FAIL
- [ ] **Step 3: 구현** — `examDay` 추가, `specialsFor`에서 사용. 3학년 2학기 성적표/`finalizeSemester`는 호출하지 않고 성적표 화면은 "3학년 2학기는 정기시험이 없어요" 문구.
- [ ] **Step 4: 통과 확인** — PASS, `node sim2.js` 오류 없음
- [ ] **Step 5: 커밋**

### Task 2: 보스 데이터와 전투 규칙 (boss.js)

**Files:**
- Create: `boss.js` (index.html·site-index.html·repo index.html에 `ranking.js` 뒤 로드)
- Test: 스크래치패드 `t2-engine.js`

**Interfaces:**
- Produces:
  - `BOSSES: { [id]: { name, bg, weak: area|'rotate', resist: area|null, hp, phase2: { name, weak, resist }, moves: [{ id, name, dmg, counter: area, effect }] } }` — id: `ginkgo`, `led`, `locker`, `yaja`, `main`
  - `bossIdFor(year, sem) -> id|null` (3학년 2학기 null)
  - `newBattle(s, bossId, prep) -> B` — `B = { boss, hp, maxHp, phase, focus, turn, maxTurns: 8, skills: [{ subName, area, level }], revenge, cheer: friendId|null, cheerUsed, intent: move, effects: {}, log: [], done: null|'win'|'lose'|'time' }`
  - `skillMult(B, area) -> 2|1|0.5`
  - `playerAct(B, action, timing) -> B` — action: `{ type: 'skill', i }` | `{ type: 'revenge' }` | `{ type: 'cheer' }`; timing: `'perfect'|'good'|'meh'|'miss'`. 데미지, 막기(의도의 counter 영역과 같으면), 2단계 전환(hp ≤ 50%), 보스 반격과 다음 의도 결정, 턴 증가, 종료 판정까지.
  - `battleBonus(B) -> int` (Global Constraints 범위)
  - `autoBattle(s, bossId, prep) -> { bonus, done }` — 화면 없이 「좋음」 타이밍과 단순 전략(의도 막기 > 약점 > 최고 레벨)으로 끝까지.
- Consumes: `subjectsOf(s)`, `mastery(sub)`, `s.wrongNote`, `FRIEND_IDS`, `s.aff`

- [ ] **Step 1: 테스트 작성** — 고정 상태로: 약점 과목 「완벽」 데미지 = round((8+L*2.2)*2*1.5); 내성 ×0.5; 의도 counter 과목 사용 시 집중력 감소 0; hp ≤ 50%에서 `phase===2`; 8턴 뒤 `done==='time'`; `battleBonus` 경계값(처치·집중력 0·시간 종료); 오답노트 0개면 revenge 0, 친밀도 70 이상 없으면 cheer null; 약점·내성 영역 과목이 없어도 진행; `led`는 턴마다 weak가 바뀜; `main` 2단계 weak가 턴마다 바뀜; `autoBattle` 결과 bonus ∈ [−10, 10].
- [ ] **Step 2: 실행해 실패 확인** — `node t2-engine.js` → `newBattle is not defined`
- [ ] **Step 3: 구현** — 보스별 수치: hp 기준 학년별(1학년 120, 2학년 160, 3학년 200), 최종은 2단계 합산. 효과: 지속 피해(ginkgo), 1턴 기절/약점 전환(led), 3연타(locker), 타이밍 가속 플래그(yaja), 강한 스킬 −2레벨 2턴·스킬 섞기·1회 회복 15%(main 2단계).
- [ ] **Step 4: 통과 확인** — PASS
- [ ] **Step 5: 커밋**

### Task 3: 1차 시험 = 정찰 보고서와 장비

**Files:**
- Modify: `game.js` `takeExam` 끝 부분(1차일 때), 메인 상단 D-day 표시
- Modify: `boss.js` — `makePrep(s, examEntry) -> { bossId, equip: { [subName]: +1|-1 } }`
- Test: 스크래치패드 `t3-prep.js`

**Interfaces:**
- Produces: `S.bossPrep[semKey] = prep`; `prepHtml(prep) -> string` (결과 안 정찰 카드: 보스 실루엣·이름·약점·내성·장비 목록)
- Consumes: Task 2 `BOSSES`, `bossIdFor`

- [ ] **Step 1: 테스트 작성** — 1차를 skill/luck/poem 각각으로 봐도 `S.bossPrep[key].bossId === bossIdFor(y,s)`; 1~2등급 과목 equip +1, 4등급 이상 −1; 결과 텍스트/화면에 보스 이름 포함; 메인 화면 텍스트에 `학기말 보스` 포함; 3학년 2학기엔 prep 없음.
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현** — 결과 화면 노트에 정찰 카드 추가(`S.result` 또는 사건 결과 텍스트 뒤 HTML 블록), D-day 옆 「학기말 보스: 이름 D-n」.
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: 커밋**

### Task 4: 보스전 화면·타이밍 바·연출과 2차 시험 연결 (bossui.js)

**Files:**
- Create: `bossui.js` (boss.js 다음 로드), `style.css`에 보스전 스타일
- Modify: `events.js` `exam` 사건 — 2차(`examName()==='2차 정기시험'`)이고 보스가 있으면 「실력대로」가 전투를 연다
- Modify: `game.js` `takeExam(mode, bonusExtra = 0)` — `bonus += bonusExtra`, 결과 문구에 "보스전 보너스 ±n점"
- Test: 스크래치패드 `t4-ui.js` (데스크톱 1280, 모바일 400)

**Interfaces:**
- Produces: `openBossBattle()` — `UI.boss = newBattle(...)` 후 전투 모달 표시; 끝나면 `finishBossBattle()`이 `takeExam('skill', battleBonus(B))` 결과로 기존 사건 결과 흐름에 합류; `bossSVG(id, phase, state) -> string` (320×180, 보스별 그림, 2단계 변형); `timingBar(speed, onPress)`
- Consumes: Task 2 전부, Task 3 `S.bossPrep`

- [ ] **Step 1: 테스트 작성** — 2차 시험 날 「실력대로」 클릭 → `.boss-battle` 보임, 스킬 카드 수 = 수강 과목 수; 스킬 클릭 → `.timing-bar` 보임 → 누르면 보스 hp 감소·`.dmg-pop` 표시; 8턴 또는 처치까지 진행 → 결과 화면에 "보스전 보너스" 문구 → 시험 결과 과목 점수 표시; `S.exams` 마지막 항목 존재; 「찍기」는 전투 없이 결과; 전투 중 `S` 저장 후 이어하기 → 시험 사건이 다시 열려 전투를 처음부터 할 수 있음; 400px에서 `scrollWidth <= 400`; 콘솔 오류 없음. 5명 보스 각각 `bossSVG` 1·2단계가 오류 없이 렌더(스크린샷 저장).
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현** — 레이아웃은 스펙 화면 그림대로. 애니메이션: 둥실(idle), 피격 번쩍+흔들림, 데미지 숫자, 완벽 시 화면 흔들림, 2단계 전환 연출, 야자 형광등 깜빡임, 최종 2단계 글리치 후 `avatarSVG(염서준 외모)`+노트북. 자동 시뮬레이션(`render`가 바뀐 테스트 환경)이나 `SETTINGS.miniAuto`면 `autoBattle`로 바로 보너스 계산. 키보드: 1~9 스킬, 스페이스 타이밍.
- [ ] **Step 4: 통과 확인** + 스크린샷 육안 확인
- [ ] **Step 5: 커밋**

### Task 5: 보스 기록 (도감·졸업)

**Files:**
- Modify: `bossui.js`(처치 시 `dexMark`), `records.js`(`saveRecord`에 `bosses`, 졸업 화면 한 줄), 도감 화면에 「보스 도감」 탭
- Test: 스크래치패드 `t5-bossdex.js`

**Interfaces:**
- Produces: `loadDex().bosses = { [bossId]: wins }`, `S.bossLog = [{ key, bossId, done, bonus }]`, 졸업 기록 `rec.bosses`

- [ ] **Step 1: 테스트 작성** — 전투 처치 후 `loadDex().bosses[id] >= 1`; 도감 보스 탭에 5칸(처치 전 실루엣); 졸업 기록 `rec.bosses.length` = 치른 보스전 수.
- [ ] **Step 2~5:** 실패 확인 → 구현 → 통과 → 커밋

### Task 6: 친구 도감 (frienddex.js)

**Files:**
- Create: `frienddex.js` (lookmaker.js 뒤 로드), 스타일
- Modify: 기록 갤러리 화면에 탭 「졸업생 | 친구 도감」
- Test: 스크래치패드 `t6-frienddex.js`

**Interfaces:**
- Produces: `friendDexData() -> [{ id, name, role, met, bestStars, nicks, episodes }]` — 실제 친구만(`CAMEO_IDS` 중 `fixed` 아님), 졸업 기록 전체와 도감에서 집계; `renderFriendDex()`; 카드 클릭 시 상세(롤링페이퍼 최고 단계 대사, 본 적 있으면 10년 뒤)

- [ ] **Step 1: 테스트 작성** — 카드 수 = 실제 친구 수(현재 50); 기록 없으면 「만난 친구 0 / 50」, 모두 실루엣; 가짜 졸업 기록(friends·cameo 포함) 넣으면 해당 친구 컬러 카드·★ 표시; 카드 클릭 시 상세에 롤링페이퍼 대사; 400px 가로 넘침 없음.
- [ ] **Step 2~5:** 실패 확인 → 구현 → 통과 → 커밋

### Task 7: 밸런스 확인과 배포

**Files:**
- Modify: 필요 시 `boss.js` 수치
- Test: `scoresim.js`(보스전 보너스 기록 추가), `bal3.js`, `sim2.js`

- [ ] **Step 1:** `scoresim.js`로 180판 — 보통 플레이 평균 보너스 0~+4, 잘하는 플레이(+완벽 타이밍 비율 60%) +7 이상인지, S·A 분포가 조정 직후 값(잘하는 플레이 A 약 30%, S 거의 0%)에서 크게 벗어나지 않는지 확인. 벗어나면 보스 hp·데미지 조정 후 재실행.
- [ ] **Step 2:** `bal3.js` errors [] / `sim2.js` 데스크톱·모바일 오류 없음
- [ ] **Step 3:** 소식판 항목 추가, NFC 등 영향 없음 확인
- [ ] **Step 4:** repo 동기화·커밋·푸시, 아티팩트 게시(새 파일 boss.js·bossui.js·frienddex.js 포함), GitHub 사이트에서 로드 확인
