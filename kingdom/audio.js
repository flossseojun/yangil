// 양일 캠퍼스 소리: 배경음악과 효과음을 Web Audio로 직접 합성한다 (파일 없음).
// 브라우저 규칙상 처음 화면을 누른 뒤부터 소리가 난다.
const KS = (() => {
  const SAVE = 'yangil.kingdom.sound';
  let on = true; try { on = localStorage.getItem(SAVE) !== '0'; } catch (e) {}
  let VOL = { m: 1, s: 1 }; try { const st = JSON.parse(localStorage.getItem('yangil.kingdom.settings')) || {}; VOL = { m: st.music ?? 1, s: st.sfx ?? 1 }; } catch (e) {}   // 설정 창의 음악 · 효과음 크기
  let ctx = null, master, music, sfxBus, noiseBuf, timer = null;
  const S = { track: null, want: null, step: 0, next: 0, last: {} };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) return true;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(comp);
    music = ctx.createGain(); music.gain.value = .5 * VOL.m; music.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .75 * VOL.s; sfxBus.connect(master);
    const n = ctx.sampleRate * .5; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    timer = setInterval(tick, 40);
    if (S.want) start(S.want);
    return true;
  }
  const unlock = () => { if (init() && ctx.state === 'suspended') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });

  // ── 소리 재료 ──
  function tone(f, t, dur, type = 'square', vol = .1, dest = sfxBus, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide || dur));
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = f * .015; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + dur + .05); }
    const a = o.attack || .005; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g).connect(dest); osc.start(t); osc.stop(t + dur + .02);
  }
  function noise(t, dur, type = 'lowpass', freq = 1200, vol = .2, dest = sfxBus, o = {}) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); if (o.q) f.Q.value = o.q;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(dest); s.start(t); s.stop(t + dur + .02);
  }
  const drum = (k, t) => {
    if (k === 'k') tone(150, t, .14, 'sine', .32, music, { to: 42, slide: .12 });
    else if (k === 's') { noise(t, .13, 'bandpass', 1900, .14, music, { q: .8 }); tone(220, t, .06, 'triangle', .05, music); }
    else if (k === 'h') noise(t, .035, 'highpass', 7500, .05, music);
    else if (k === 'o') noise(t, .14, 'highpass', 6500, .05, music);
  };

  // ── 배경음악 (16분음표 칸 · 0은 쉼표 · 베이스는 마디마다) ──
  const TRACKS = {
    campus: { len: .19, lead: 'triangle', vol: .07, drums: 'k...h...k.k.h...', bassVol: .1,
      melody: [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 76, 74, 72, 0, 0, 0, 69, 0, 72, 0, 76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 0, 0,
               65, 0, 69, 0, 72, 0, 74, 0, 76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 71, 0, 74, 0, 77, 76, 74, 0, 72, 0, 71, 0, 0, 0],
      bass: [48, 45, 41, 43] },
    ginkgo: { len: .15, lead: 'square', vol: .045, drums: 'k.h.s.h.k.hks.h.', bassVol: .12, bassEvery: 4,
      melody: [69, 0, 72, 76, 0, 74, 72, 0, 74, 0, 76, 0, 77, 76, 74, 0, 72, 0, 76, 79, 0, 77, 76, 0, 74, 0, 72, 0, 71, 0, 0, 0,
               65, 0, 69, 72, 0, 74, 72, 0, 69, 0, 72, 0, 74, 72, 71, 0, 64, 0, 68, 71, 0, 74, 76, 0, 77, 76, 74, 0, 71, 0, 68, 0],
      bass: [45, 48, 41, 40] },
    neon: { len: .125, lead: 'sawtooth', vol: .03, drums: 'k.hhs.hhk.hhs.ho', bassVol: .11, bassEvery: 2, arp: [0, 7, 12, 7],
      melody: [76, 0, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 74, 0, 0, 0, 76, 0, 0, 76, 0, 79, 0, 83, 0, 81, 0, 79, 76, 0, 0, 0,
               72, 0, 0, 72, 0, 76, 0, 72, 0, 71, 0, 69, 71, 0, 0, 0, 74, 0, 0, 74, 0, 77, 0, 81, 0, 79, 0, 77, 74, 0, 79, 0],
      bass: [40, 40, 36, 38] },
    ghost: { len: .28, lead: 'sine', vol: .07, vib: 5, drums: '........h.......', bassVol: .09,
      melody: [69, 0, 0, 72, 0, 0, 71, 0, 68, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 76, 0, 0, 75, 0, 71, 0, 0, 0, 0, 0, 0, 0,
               65, 0, 0, 69, 0, 0, 72, 0, 71, 0, 0, 0, 68, 0, 0, 0, 64, 0, 0, 0, 68, 0, 71, 0, 75, 0, 0, 0, 0, 0, 0, 0],
      bass: [45, 45, 41, 40] },
    storm: { len: .135, lead: 'square', vol: .04, drums: 'k.k.s.k.kk.s.k.s', bassVol: .12, bassEvery: 2,
      melody: [74, 0, 74, 77, 0, 74, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 74, 0, 74, 77, 0, 74, 82, 0, 81, 0, 79, 0, 77, 0, 76, 0,
               70, 0, 70, 74, 0, 70, 77, 0, 76, 0, 74, 0, 72, 0, 70, 0, 69, 0, 73, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 73, 0],
      bass: [38, 38, 34, 33] },
    maker: { len: .115, lead: 'square', vol: .045, drums: 'k.hsk.hsk.hsk.ss', bassVol: .12, bassEvery: 2, arp: [0, 4, 7, 12],
      melody: [72, 0, 79, 0, 76, 0, 79, 84, 0, 83, 79, 0, 81, 0, 79, 0, 77, 0, 81, 0, 79, 0, 77, 76, 0, 74, 72, 0, 74, 0, 79, 0,
               72, 0, 79, 0, 76, 0, 79, 84, 0, 86, 84, 0, 83, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 72, 0, 74, 76, 0, 72, 0, 0, 0],
      bass: [48, 43, 45, 41] },
  };
  function tick() {
    if (!ctx || !S.track || !on) return;
    const T = TRACKS[S.track], L = T.len;
    while (S.next < ctx.currentTime + .25) {
      const i = S.step % T.melody.length, m = T.melody[i], t = S.next, bar = Math.floor(i / 16) % T.bass.length;
      if (m) tone(hz(m), t, L * 1.7, T.lead, T.vol, music, { vib: T.vib, attack: T.vib ? .06 : .005 });
      const be = T.bassEvery || 8; if (i % be === 0) { const b = T.bass[bar]; tone(hz(b), t, L * (be === 8 ? 6 : be * .9), 'triangle', T.bassVol, music); }
      if (T.arp) tone(hz(T.bass[bar] + 24 + T.arp[i % T.arp.length]), t, L * .8, 'square', .018, music);
      const dch = T.drums[i % T.drums.length]; if (dch !== '.') drum(dch, t);
      S.next += L; S.step++;
    }
  }
  function start(name) {
    S.track = name; S.step = 0; S.next = ctx.currentTime + .08;
    const t = ctx.currentTime; music.gain.cancelScheduledValues(t); music.gain.setValueAtTime(.0001, t); music.gain.linearRampToValueAtTime(Math.max(.0001, .5 * VOL.m), t + .6);
  }

  // ── 효과음 ──
  const FX = {
    click: t => tone(880, t, .06, 'square', .05, sfxBus, { to: 1320, slide: .04 }),
    pop: t => { tone(520, t, .08, 'sine', .12, sfxBus, { to: 900, slide: .06 }); },
    swing: t => noise(t, .1, 'bandpass', 900, .12, sfxBus, { to: 2600, q: 1.2 }),
    throw: t => { noise(t, .12, 'bandpass', 1400, .07, sfxBus, { to: 3200, q: 2 }); tone(700, t, .08, 'triangle', .04, sfxBus, { to: 1100 }); },
    hit: t => { tone(180, t, .07, 'square', .07, sfxBus, { to: 90 }); noise(t, .05, 'lowpass', 2400, .1); },
    crit: t => { tone(220, t, .12, 'square', .1, sfxBus, { to: 70 }); noise(t, .12, 'lowpass', 4000, .18); tone(1320, t + .02, .1, 'triangle', .06); },
    ouch: t => { tone(330, t, .12, 'sawtooth', .06, sfxBus, { to: 160 }); noise(t, .06, 'lowpass', 1800, .08); },
    down: t => { tone(440, t, .35, 'triangle', .1, sfxBus, { to: 110, slide: .35 }); },
    heal: t => [76, 81, 88].forEach((m, i) => tone(hz(m), t + i * .06, .3, 'sine', .07)),
    shield: t => { tone(523, t, .3, 'triangle', .07, sfxBus, { vib: 9 }); tone(784, t + .04, .3, 'sine', .05); },
    cast: t => { tone(330, t, .35, 'sawtooth', .05, sfxBus, { to: 1320, slide: .3 }); noise(t, .35, 'bandpass', 600, .06, sfxBus, { to: 5000 }); },
    cutin: t => { noise(t, .3, 'highpass', 1500, .12, sfxBus, { to: 6000 }); [60, 64, 67, 72].forEach(m => tone(hz(m + 12), t + .12, .55, 'square', .035)); },
    warn: t => { tone(988, t, .1, 'square', .06); tone(988, t + .16, .1, 'square', .06); },
    boom: t => { tone(110, t, .45, 'sine', .3, sfxBus, { to: 30, slide: .4 }); noise(t, .5, 'lowpass', 1600, .3, sfxBus, { to: 200 }); },
    laser: t => { tone(1800, t, .3, 'sawtooth', .07, sfxBus, { to: 200, slide: .28 }); noise(t, .25, 'highpass', 3000, .06); },
    charge: t => tone(300, t, 1.4, 'sine', .07, sfxBus, { to: 2400, slide: 1.4, attack: .2 }),
    flash: t => { noise(t, .5, 'highpass', 2000, .2, sfxBus, { to: 9000 }); tone(2600, t, .4, 'sine', .06, sfxBus, { to: 1800 }); },
    vanish: t => { tone(880, t, .6, 'sine', .07, sfxBus, { to: 220, slide: .6, vib: 7 }); noise(t, .6, 'bandpass', 3000, .05, sfxBus, { to: 400 }); },
    sleep: t => [72, 67, 64].forEach((m, i) => tone(hz(m), t + i * .14, .3, 'sine', .07, sfxBus, { vib: 5 })),
    wake: t => [64, 67, 72].forEach((m, i) => tone(hz(m + 12), t + i * .05, .14, 'triangle', .06)),
    glitch: t => { for (let i = 0; i < 6; i++) tone(200 + Math.random() * 1400, t + i * .04, .05, 'square', .05); },
    stun: t => [84, 88, 91].forEach((m, i) => tone(hz(m), t + i * .05, .12, 'triangle', .05)),
    break: t => { noise(t, .7, 'lowpass', 5000, .28, sfxBus, { to: 300 }); tone(220, t, .5, 'square', .08, sfxBus, { to: 55 }); [79, 76, 72].forEach((m, i) => tone(hz(m), t + .1 + i * .07, .2, 'triangle', .05)); },
    reveal: t => { noise(t, 1, 'lowpass', 300, .3, sfxBus, { to: 6000 }); [48, 55, 60, 64, 67, 72].forEach((m, i) => tone(hz(m), t + .3 + i * .08, 1.4, 'sawtooth', .03)); },
    coin: t => { tone(hz(88), t, .07, 'square', .05); tone(hz(93), t + .07, .18, 'square', .05); },
    build: t => { tone(150, t, .15, 'square', .1, sfxBus, { to: 80 }); noise(t, .12, 'lowpass', 900, .15); [72, 76, 79, 84].forEach((m, i) => tone(hz(m), t + .15 + i * .06, .2, 'triangle', .05)); },
    levelup: t => [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(hz(m + 12), t + i * .045, .22, 'square', .04)),
    fanfare: t => { [[72, 0], [72, .12], [72, .24], [79, .36]].forEach(([m, d]) => tone(hz(m), t + d, .14, 'square', .05)); [72, 76, 79, 84].forEach(m => tone(hz(m), t + .5, .7, 'triangle', .045)); },
  };
  const GAP = { hit: .06, swing: .07, throw: .08, ouch: .1, crit: .08, coin: .05, click: .03 };

  return {
    get on() { return on; },
    setVol(m, sv) { VOL = { m, s: sv }; if (ctx) { music.gain.setTargetAtTime(Math.max(.0001, .5 * m), ctx.currentTime, .05); sfxBus.gain.setTargetAtTime(.75 * sv, ctx.currentTime, .05); } },
    get debug() { return { state: ctx && ctx.state, track: S.track, step: S.step }; },
    play(track) { S.want = track; if (!ctx) return; if (S.track !== track) start(track); },
    stop() { S.want = null; S.track = null; },
    fx(name) {
      if (!on || !ctx || ctx.state !== 'running' || !FX[name]) return;
      const now = ctx.currentTime; if (GAP[name] && now - (S.last[name] || -9) < GAP[name]) return; S.last[name] = now;
      FX[name](now + .005);
    },
    jingle(win) {
      if (!ctx) return; S.track = null; S.want = null; const t = ctx.currentTime + .1;
      if (!on) return;
      if (win) { [[72, 0], [76, .12], [79, .24], [84, .36]].forEach(([m, d]) => tone(hz(m), t + d, .16, 'square', .05, music)); [72, 76, 79, 84, 88].forEach(m => tone(hz(m), t + .55, 1.2, 'triangle', .05, music)); drum('k', t + .55); drum('o', t + .55); }
      else { [[67, 0], [66, .25], [65, .5], [64, .75]].forEach(([m, d]) => tone(hz(m), t + d, .3, 'triangle', .07, music)); tone(hz(40), t + .75, 1.2, 'sine', .12, music); }
    },
    toggle() {
      on = !on; try { localStorage.setItem(SAVE, on ? '1' : '0'); } catch (e) {}
      if (ctx) { master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, .05); if (on) { ctx.resume(); if (S.want && !S.track) start(S.want); } }
      return on;
    },
    // 켜고 끄기 버튼 연결
    bind(el) {
      if (!el) return; const draw = () => { el.innerHTML = typeof drawIcon === 'function' ? drawIcon(on ? 'music' : 'musicOff', 20) : (on ? '♪' : '×'); el.setAttribute('aria-pressed', on); el.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기'); };
      draw(); el.addEventListener('click', e => { e.stopPropagation(); KS.toggle(); draw(); });
    },
  };
})();
