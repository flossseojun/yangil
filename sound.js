// 소리: 상황별 배경음악(평소 · 시험 · 보스전 · 축제 · 밤 · 졸업)과 효과음 추가. 모두 Web Audio로 직접 합성한다.

/* ───────── 배경음악 트랙 ───────── */
// 16분음표 칸 단위 멜로디(0 = 쉼표), 베이스는 마디(16칸)마다, drums: k 킥 · s 스네어 · h 하이햇
const BGM_TRACKS = {
  daily: { len: 0.27, lead: 'triangle', vol: 0.05, melody: BGM.melody, bass: BGM.bass, drums: '' },
  exam: { len: 0.22, lead: 'sine', vol: 0.045,
    melody: [69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 72, 0, 75, 0, 74, 0, 67, 0, 71, 0, 74, 0, 71, 0, 67, 0, 71, 0, 74, 0, 72, 0,
             65, 0, 69, 0, 72, 0, 69, 0, 65, 0, 69, 0, 72, 0, 71, 0, 64, 0, 68, 0, 71, 0, 68, 0, 64, 0, 68, 0, 71, 0, 0, 0],
    bass: [45, 43, 41, 40], drums: 'h.h.h.h.h.h.h.h.' },
  boss: { len: 0.16, lead: 'square', vol: 0.035,
    melody: [69, 0, 69, 72, 0, 69, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 69, 0, 69, 72, 0, 69, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0,
             65, 0, 65, 69, 0, 65, 72, 0, 69, 0, 65, 0, 64, 0, 65, 0, 64, 0, 64, 68, 0, 64, 71, 0, 76, 0, 74, 0, 72, 0, 71, 0],
    bass: [45, 45, 41, 40], drums: 'k.h.s.h.k.k.s.hh' },
  festival: { len: 0.2, lead: 'square', vol: 0.03,
    melody: [72, 74, 76, 0, 79, 0, 76, 0, 77, 76, 74, 0, 72, 0, 74, 0, 76, 77, 79, 0, 84, 0, 79, 0, 81, 79, 77, 0, 76, 0, 0, 0,
             77, 0, 81, 0, 79, 0, 77, 0, 76, 0, 79, 0, 77, 0, 76, 0, 74, 0, 77, 0, 76, 74, 72, 0, 74, 0, 71, 0, 72, 0, 0, 0],
    bass: [48, 45, 41, 43], drums: 'k.h.s.h.k.h.s.h.' },
  night: { len: 0.34, lead: 'sine', vol: 0.045,
    melody: [76, 0, 0, 0, 79, 0, 0, 0, 74, 0, 0, 0, 72, 0, 0, 0, 71, 0, 0, 0, 72, 0, 74, 0, 76, 0, 0, 0, 0, 0, 0, 0,
             72, 0, 0, 0, 76, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 69, 0, 0, 0, 71, 0, 72, 0, 69, 0, 0, 0, 0, 0, 0, 0],
    bass: [45, 41, 48, 43], drums: '' },
  ending: { len: 0.3, lead: 'triangle', vol: 0.05,
    melody: [72, 0, 0, 0, 76, 0, 79, 0, 84, 0, 0, 0, 83, 0, 79, 0, 81, 0, 0, 0, 77, 0, 81, 0, 79, 0, 0, 0, 0, 0, 0, 0,
             77, 0, 0, 0, 76, 0, 74, 0, 76, 0, 0, 0, 79, 0, 72, 0, 74, 0, 0, 0, 79, 0, 77, 0, 72, 0, 0, 0, 0, 0, 0, 0],
    bass: [48, 52, 53, 55], drums: '' },
};
BGM.track = 'daily';
BGM.noiseBuf = null;
BGM.drum = function (kind, t) {
  const c = this.ctx;
  if (kind === 'k') { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g).connect(this.gain); o.start(t); o.stop(t + 0.16); return; }
  if (!this.noiseBuf) { const n = c.sampleRate * 0.2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = b; }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = this.noiseBuf; f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000;
  const dur = kind === 's' ? 0.12 : 0.04; g.gain.setValueAtTime(kind === 's' ? 0.08 : 0.03, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(this.gain); s.start(t); s.stop(t + dur + 0.01);
};
BGM.tick = function () {
  const c = this.ctx, T = BGM_TRACKS[this.track] || BGM_TRACKS.daily, len = T.len;
  while (this.next < c.currentTime + 0.4) {
    const i = this.step % T.melody.length, m = T.melody[i];
    if (m) this.note(this.hz(m), this.next, len * 1.8, T.lead, T.vol);
    if (i % 8 === 0) { const b = T.bass[Math.floor(i / 16) % T.bass.length]; this.note(this.hz(b), this.next, len * 7.5, 'sine', 0.06); this.note(this.hz(b + 7), this.next + len * 4, len * 3.5, 'sine', 0.035); }
    const d = T.drums && T.drums[i % T.drums.length]; if (d && d !== '.') this.drum(d, this.next);
    this.next += len; this.step++;
  }
};
// 트랙 바꾸기: 살짝 줄였다가 새 곡 처음부터
BGM.setTrack = function (name) {
  if (!BGM_TRACKS[name] || name === this.track) return;
  this.track = name; this.step = 0;
  if (this.ctx && this.gain) { const t = this.ctx.currentTime; this.gain.gain.cancelScheduledValues(t); this.gain.gain.setValueAtTime(0.0001, t); this.gain.gain.linearRampToValueAtTime(0.7, t + 0.8); this.next = t + 0.15; }
};
function trackFor() {
  if (UI.screen === 'ending' || UI.screen === 'ceremony') return 'ending';
  if (UI.boss) return UI.boss.B && UI.boss.B.id === 'yaja' ? 'night' : 'boss';
  if (UI.cut && UI.cut.id === 'festival') return 'festival';
  if (S && S.cur && !S.cur.result) {
    if (['exam', 'mock', 'suneung'].includes(S.cur.id)) return 'exam';
    if (['festival', 'sports_day', 'school_trip'].includes(S.cur.id)) return 'festival';
  }
  if (S && UI.screen === 'game' && S.ap <= 0) return 'night';
  return 'daily';
}
const _sndRender = render;
render = function () { _sndRender(); BGM.setTrack(trackFor()); };
const _sndModal = renderModal;
renderModal = function () { _sndModal(); BGM.setTrack(trackFor()); };

/* ───────── 효과음 추가 ───────── */
const SFX_EXTRA = {
  hit: T => { T(220, 0.12, 'square', 0, 0.08, 110); T(660, 0.06, 'triangle', 0.02, 0.06); },
  crit: T => { T(880, 0.08, 'square', 0, 0.07); T(1320, 0.12, 'square', 0.06, 0.06); T(1760, 0.25, 'triangle', 0.12, 0.06); T(110, 0.25, 'triangle', 0, 0.18, 55); },
  block: T => { T(1200, 0.05, 'square', 0, 0.05); T(600, 0.18, 'triangle', 0.03, 0.08, 900); },
  miss: T => T(300, 0.25, 'sine', 0, 0.06, 150),
  hurt: T => { T(160, 0.2, 'sawtooth', 0, 0.06, 90); },
  phase: T => [392, 370, 349, 330, 523].forEach((f, i) => T(f, i === 4 ? 0.6 : 0.12, 'sawtooth', i * 0.1, 0.05)),
  page: T => { T(1400, 0.04, 'triangle', 0, 0.04); T(900, 0.06, 'triangle', 0.03, 0.03); },
  heart: T => { T(784, 0.1, 'sine', 0, 0.07); T(1047, 0.18, 'sine', 0.09, 0.07); },
  coin: T => { T(988, 0.07, 'square', 0, 0.05); T(1319, 0.2, 'square', 0.07, 0.05); },
  levelup: T => [523, 659, 784].forEach((f, i) => T(f, 0.14, 'triangle', i * 0.07, 0.07)),
};
const _sfxPlay = SFX.play.bind(SFX);
SFX.play = function (name) {
  if (!SFX_EXTRA[name]) return _sfxPlay(name);
  if (!this.on) return;
  try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); SFX_EXTRA[name]((...a) => this.tone(...a)); } catch (e) {}
};
// 결과 연출과 함께: 친밀도가 오르면 하트 소리, 능력치만 오르면 레벨업 소리
if (typeof fxBurst === 'function') {
  const _sndBurst = fxBurst;
  fxBurst = function (host, diffs, notes) {
    _sndBurst(host, diffs, notes);
    const d = diffs || [];
    if (d.some(x => x.label.includes('♥') && x.d > 0)) SFX.play('heart');
    else if (d.filter(x => x.good && x.label !== '피로').length >= 2) SFX.play('levelup');
  };
}
