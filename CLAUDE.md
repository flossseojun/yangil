# 양일고 게임 프로젝트 메모

양일고등학교 학생(염서준, GitHub flossseojun)이 만드는 웹 게임 두 개. 빌드 도구 없는 순수 HTML/JS이고, GitHub Pages로 배포한다.
- 사이트: https://flossseojun.github.io/yangil/ (main 브랜치에 push하면 1~2분 뒤 반영)
- 사용자와는 **한국어**로 대화한다. 짧고 쉽게.

## 꼭 지킬 규칙
- 실존 친구(ROSTER, FRIEND_LOOKS의 58명)는 연애 · 질투 · 부정적인 내용에 절대 넣지 않는다. 송현수의 '일진'은 무늬만(해 없는 장난).
- 실제 선생님 이름 · 전화번호 · 학교 상징(교표) 이미지는 쓰지 않는다. 폼 스크린샷에 있는 전화번호도 쓰지 않는다.
- 연애/관계 관련 작업은 하기 전에 먼저 묻는다.
- 염서준의 게임 속 생김새는 바꾸지 않는다. 실제 사진(seojun-face.png, seojun-photo.jpg)은 최종 보스 연출에만 쓴다.
- 메인 게임의 '출연 안내' 문구는 고치지 않는다.
- 커밋에 모델 이름을 넣지 않는다. 사용자 이메일은 git 작성자로만 쓰고 외부 요청에 넣지 않는다.

## 1) 메인 게임 「나는 이번생은 양일고다!」 (저장소 최상위)
- 학교생활 시뮬레이션. index.html이 스크립트를 순서대로 불러오고, 전역 `S`(상태) · `UI`를 쓴다. 기능 파일들이 render · chooseEvent · endDay 같은 전역 함수를 감싸서(wrap) 덧붙이는 구조라 **스크립트 순서가 중요**하다.
- 주요 파일: game.js(본체) · events.js/eventv2.js(이벤트) · friends.js/deep.js/extras.js(친구 데이터) · story.js(챕터 이야기) · boss.js/bossui.js(보스) · avatar*.js/fullbody.js(SD 그림) · ranking.js/stats.js(Firebase 랭킹 · 통계) · sound.js(Web Audio).
- 친구 생김새: scene.js의 `FRIEND_LOOKS` / `lookOf(id)`.
- Firebase 규칙: firebase/firestore.rules (stats는 1씩 증가만 허용).

## 2) 3D 스핀오프 「양일 캠퍼스」 (kingdom/)
쿠키런 킹덤 같은 캠퍼스 키우기 + 팀 전투. Three.js 0.160.0 (jsdelivr importmap), 모듈 스크립트.
- **이야기:** 무너진 양평을 다시 세운다. 양일고를 복구하면 학교 가까운 동네부터 살아나고, 재건 25/50/75/100%에 양평역 · 물맑은시장 · 군청 · 전체가 복구된다.
- **화면 3개:** index.html+kingdom.js(캠퍼스) · team.html+team.js(팀 편성) · battle.html+battle.js(전투).
- **공용 일반 스크립트:** roster.js(친구 58명) · kits.js(역할 · 스킬 · 레벨 · 챕터 · 캠퍼스 보너스) · profiles.js(대사 · 추억) · ui.js(손그림 아이콘 `drawIcon`, 전체화면) · audio.js(`KS` 소리) · yangpyeong.js(`YP_MAP`, OpenStreetMap에서 받아 게임 좌표로 바꾼 양평읍 지도, 한 칸 ≈ 4.5m).
- **모듈:** chibi3d.js(`makeChibi` 3D 친구 · 표정 · 버릇) · chibishot.js(3D 친구 사진 찍기 · 프로필 3D 보기) · bosses.js(챕터별 무대 · 보스 모습).
- **캠퍼스(kingdom.js):** 시설 `FAC`(레벨 0~5, 0 = 폐허) · 구역 `ZONES`(core/east/back/west, 재건 % · 전투 챕터로 열림) · 꾸미기 `DECO` · 친구 의뢰 · 선물 · 이야기(`showStory`, `MILES`).
- **전투:** 챕터 1~4(은행왕 · LED 스크린 · 야자의 유령 · 본관→염서준) · 6 양평역(폭주 기관차) · 7 물맑은시장(떡볶이 대왕) · 5 도전의 탑. 열리는 순서는 `after`(4-5 → 탑 · 양평역, 6-5 → 시장), 화면 순서는 `CH_SHOW`.
- **저장(localStorage):** `yangil.kingdom.v1`(캠퍼스 G: res, fac, zones, b, friends, lv, bond, stage, chs, wins, story, req) · `.team` · `.chap` · `.stage` · `.voice` · `.sound` · `.deco`.
- **UI 스타일:** 카툰 + 학교 문구. 잉크 외곽선(#231c17), 종이(#fffaf0), 노랑(#ffd23f), 칠판 초록(#2b4a3c). 이모지 대신 `drawIcon`. 가로 화면은 `@media (max-height: 480px)`.
- 파일을 바꾸면 html의 `?v=숫자`를 올려야 휴대폰 캐시가 갱신된다.

## 작업 방법
- 작업 폴더 /home/user/yangil 에서 고치고, 배포할 때 /home/user/yangil-repo(이 저장소)로 복사해 커밋 · push한다. (새 세션에서는 저장소에서 바로 작업해도 된다.)
- 테스트: Playwright, `page.route('http://yangil.local/**')`로 로컬 파일을 내려 준다(로컬 서버는 안 됨). 전투는 `window.__battle`, 캠퍼스는 `window.__kingdom`으로 조작한다.
- **토큰 아끼기:** 스크린샷은 꼭 필요할 때 1장만. 파일은 필요한 줄만 grep/sed로 본다(kingdom.js · battle.js가 크다). 테스트는 바뀐 부분만 돌린다. 답은 짧게.
