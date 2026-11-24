// Shards of Pippo - livello del prete gigante, pixel art.
(() => {
'use strict';
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const VH = 180;
let VW = 320;
const buf = document.createElement('canvas');
const b = buf.getContext('2d');
const IMG = {};
const NAMES = ['cielo', 'nuvole_lontane', 'nuvole_vicine', 'citta', 'prete', 'denti_su', 'denti_giu', 'mano', 'perno',
  'balcone56', 'balcone72', 'balcone88', 'vaso', 'lanterna', 'puff', 'pippo'];
const BOT = /bot=1/.test(location.search);
const FAST = BOT ? (parseInt((location.search.match(/fast=(\d+)/) || [])[1]) || 1) : 1;
let L = null;

// ---------------------------------------------------------------- input
const inp = { ax: 0, ay: 0, jump: false, jumpPressed: false, jumpReleased: false };
const keys = {};
addEventListener('keydown', e => { audioStart(); if (e.code === 'KeyM') toggleSound(); if (!keys[e.code] && (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'ArrowUp' && false)) inp.jumpPressed = true; keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'KeyZ') inp.jumpReleased = true; keys[e.code] = false; });
const touch = { stick: null, so: { x: 0, y: 0 }, sp: { x: 0, y: 0 }, jumpId: null, glow: 0 };
function tpos(t) { return { x: t.clientX, y: t.clientY }; }
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  audioStart();
  for (const t of e.changedTouches) {
    const p = tpos(t);
    if (p.x < 60 && p.y < 60) { toggleSound(); continue; }
    if (p.x < innerWidth / 2 && touch.stick === null) { touch.stick = t.identifier; touch.so = p; touch.sp = p; }
    else if (p.x >= innerWidth / 2 && touch.jumpId === null) { touch.jumpId = t.identifier; inp.jumpPressed = true; }
  }
  if (state === 'fine') restart();
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === touch.stick) touch.sp = tpos(t);
}, { passive: false });
function tend(e) {
  e.preventDefault();
  audioStart();
  for (const t of e.changedTouches) {
    if (t.identifier === touch.stick) touch.stick = null;
    if (t.identifier === touch.jumpId) { touch.jumpId = null; inp.jumpReleased = true; }
  }
}
cv.addEventListener('touchend', tend, { passive: false });
cv.addEventListener('touchcancel', tend, { passive: false });
document.addEventListener('click', () => audioStart());
document.addEventListener('visibilitychange', () => { if (!document.hidden && SND.ctx) SND.ctx.resume(); });
document.addEventListener('gesturestart', e => e.preventDefault());
cv.addEventListener('mousedown', e => { audioStart(); if (e.clientX < 60 && e.clientY < 60) toggleSound(); if (state === 'fine') restart(); });
function readInput() {
  let ax = 0, ay = 0;
  if (keys.ArrowLeft || keys.KeyA) ax -= 1;
  if (keys.ArrowRight || keys.KeyD) ax += 1;
  if (keys.ArrowUp || keys.KeyW) ay -= 1;
  if (keys.ArrowDown || keys.KeyS) ay += 1;
  if (touch.stick !== null) {
    const s = Math.min(innerWidth, innerHeight) * 0.16;
    const dx = touch.sp.x - touch.so.x, dy = touch.sp.y - touch.so.y;
    ax = Math.max(-1, Math.min(1, dx / s)); ay = Math.max(-1, Math.min(1, dy / s));
    if (Math.abs(ax) < 0.18) ax = 0;
    if (Math.abs(ay) < 0.3) ay = 0;
  }
  inp.ax = ax; inp.ay = ay;
  inp.jump = !!(keys.Space || keys.KeyZ || touch.jumpId !== null);
}


// ---------------------------------------------------------------- suoni (sintetizzati, nessun file)
const SND = { ctx: null, master: null, music: null, on: true, step: 0, next: 0 };
function audioStart() {
  // iPhone: l'audio si sblocca solo dentro un gesto (meglio a fine tocco) e
  // con l'interruttore silenzioso attivo serve la sessione "playback".
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  if (!SND.el) {
    // traccia silenziosa in loop: su iOS fa passare l'audio della pagina come "media"
    const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    SND.el = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
    SND.el.loop = true; SND.el.setAttribute('playsinline', '');
  }
  try { const p = SND.el.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!SND.ctx) {
    SND.ctx = new AC();
    SND.master = SND.ctx.createGain(); SND.master.gain.value = SND.on ? 0.9 : 0; SND.master.connect(SND.ctx.destination);
    SND.music = SND.ctx.createGain(); SND.music.gain.value = 0.3; SND.music.connect(SND.master);
    SND.next = SND.ctx.currentTime + 0.1;
  }
  if (SND.ctx.state !== 'running') { try { SND.ctx.resume(); } catch (e) {} }
  // buffer muto suonato dentro il gesto: sblocca il contesto su Safari/Chrome iOS
  try {
    const b0 = SND.ctx.createBuffer(1, 1, 22050), s0 = SND.ctx.createBufferSource();
    s0.buffer = b0; s0.connect(SND.ctx.destination); s0.start(0);
  } catch (e) {}
  if (SND.next < SND.ctx.currentTime) SND.next = SND.ctx.currentTime + 0.05;
}
function tone(type, f0, f1, dur, vol, dest, when) {
  const c = SND.ctx; if (!c) return;
  const t0 = when || c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || SND.master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol, freq, q, dest, when) {
  const c = SND.ctx; if (!c) return;
  const t0 = when || c.currentTime;
  const n = Math.floor(c.sampleRate * dur), bf = c.createBuffer(1, n, c.sampleRate), d = bf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = bf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(dest || SND.master); s.start(t0);
}
const sfx = {
  salto: () => { tone('square', 330, 660, 0.12, 0.10); tone('triangle', 660, 990, 0.10, 0.05); },
  atterra: () => { noise(0.06, 0.18, 220, 1.2); },
  passo: () => { noise(0.03, 0.05, 1800, 2); },
  corda: () => { noise(0.05, 0.10, 900, 3); tone('triangle', 180, 150, 0.05, 0.03); },
  carica: () => { tone('sawtooth', 220, 440, 0.8, 0.035); tone('square', 880, 880, 0.05, 0.03); },
  schiaffo: () => { noise(0.16, 0.6, 1400, 0.7); noise(0.10, 0.4, 3200, 1.5); tone('sine', 120, 50, 0.22, 0.45); },
  resiste: () => { noise(0.14, 0.45, 1400, 0.7); tone('square', 140, 120, 0.1, 0.08); },
  puff: () => { noise(0.25, 0.25, 500, 0.6); },
  crac: () => { noise(0.08, 0.6, 2500, 2); tone('square', 90, 40, 0.18, 0.3); },
  denti: () => { noise(0.04, 0.18, 2200, 3); },
  fine: () => { [262, 311, 392, 523].forEach((f, i) => tone('triangle', f, f, 1.4, 0.10, SND.master, SND.ctx.currentTime + i * 0.12)); },
};
function play(n) { if (SND.ctx && SND.on) try { sfx[n](); } catch (e) {} }
// musichetta: basso pulsante in minore, arpeggio inquieto, tic-tac. Volume basso.
const BASS = [45, 45, 45, 45, 41, 41, 43, 43];             // La, Fa, Sol (MIDI)
const ARP = [[69, 72, 76, 72], [69, 72, 76, 75], [65, 69, 72, 69], [67, 71, 74, 71]];
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
function musicTick() {
  const c = SND.ctx; if (!c || state === 'fine') return;
  const spb = 60 / 132 / 2;                                  // crome a 132 bpm
  while (SND.next < c.currentTime + 0.2) {
    const s = SND.step, w = SND.next, bar = Math.floor(s / 8) % 8;
    if (s % 2 === 0) tone('triangle', midi(BASS[bar] - 12), midi(BASS[bar] - 12), spb * 1.6, 0.30, SND.music, w);
    const arp = ARP[Math.floor(bar / 2)];
    tone('square', midi(arp[s % 4]), midi(arp[s % 4]), spb * 0.7, (s % 4 === 0) ? 0.07 : 0.045, SND.music, w);
    noise(0.025, s % 2 ? 0.05 : 0.09, 6000, 1.5, SND.music, w);
    if (s % 16 === 12) tone('sine', midi(BASS[bar] + 13), midi(BASS[bar] + 13), spb * 2, 0.05, SND.music, w);   // nota storta, ansia
    SND.step++; SND.next += spb;
  }
}
function toggleSound() { SND.on = !SND.on; if (SND.master) SND.master.gain.value = SND.on ? 0.9 : 0; }

// ---------------------------------------------------------------- stato
const G = 620, JUMP = 236, RUN = 88, ACC = 900, CLIMB = 46;
const P = { x: 0, y: 0, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, hold: 0, mode: 'normale', rope: -1,
  stun: 0, spin: 0, anim: 0, climbd: 0, cling: false, plat: -1, face: 1 };
let cam = { x: 0, y: 0 };
let state = 'gioco';
let t = 0, msg = '', msgT = 0, finT = 0, danger = false, shake = 0;
const puffs = [];
const arms = [];
let teethK = 0;

function restart() {
  P.x = L.W / 2 - 60; P.y = L.ground; P.vx = P.vy = 0; P.mode = 'normale'; P.stun = 0; P.spin = 0;
  cam.x = P.x - VW / 2; cam.y = L.H - VH;
  state = 'gioco'; finT = 0; t = 0;
  for (const a of arms) { a.state = 0; a.t = 0; a.hand = { ...a.hip }; a.cool = 2; }
  say('sali fino alla bocca del prete', 4);
  if (!BOT) setTimeout(() => say('a sinistra ti muovi - a destra salti, tenuto premuto ti aggrappi', 5), 4200);
}
function say(s, d) { msg = s; msgT = d; }

// ---------------------------------------------------------------- fisica
function update(dt) {
  t += dt;
  readInput();
  if (BOT) bot();
  if (state === 'fine') { finT += dt; endInput(); return; }
  danger = arms.some(a => a.state === 1 || a.state === 2);
  P.hold = inp.jump ? P.hold + dt : 0;
  if (P.stun > 0) {
    P.stun -= dt; P.spin += dt * 16;
    P.vy += G * dt; P.x += P.vx * dt;
    move(dt);
  } else if (P.mode === 'corda') {
    const r = L.ropes[P.rope];
    P.x = r.x;
    const v = inp.ay < -0.3 ? -CLIMB : inp.ay > 0.3 ? CLIMB * 1.4 : (inp.ax !== 0 && !BOT ? 0 : 0);
    P.y += v * dt; { const c0 = Math.floor(P.climbd / 10); P.climbd += Math.abs(v * dt); if (Math.floor(P.climbd / 10) !== c0) play('corda'); }
    if (P.y <= r.y0) { P.y = r.y0 - 14; P.mode = 'normale'; P.vy = 0; P.x = r.x + (inp.ax < 0 ? -6 : 6); }
    else if (P.y >= r.y1) { P.y = r.y1; P.mode = 'normale'; }
    if (inp.jumpPressed) { play('salto'); P.mode = 'normale'; P.vy = -JUMP * 0.75; P.vx = (inp.ax || P.face) * RUN; P.ropeCool = 0.3; }
  } else {
    if (P.ground) P.coyote = 0.1; else P.coyote -= dt;
    P.buffer -= dt;
    if (inp.jumpPressed && !(danger && P.ground)) P.buffer = 0.12;
    if (P.buffer > 0 && P.coyote > 0) { play('salto'); P.vy = -JUMP; P.buffer = 0; P.coyote = 0; P.ground = false; }
    if (inp.jumpReleased && P.vy < -60) P.vy *= 0.5;
    P.cling = P.ground && inp.jump && (danger || P.hold > 0.15);
    const want = P.cling ? 0 : inp.ax * RUN;
    const a = (P.ground ? ACC : ACC * 0.7) * dt;
    P.vx += Math.max(-a, Math.min(a, want - P.vx));
    if (inp.ax) P.face = Math.sign(inp.ax);
    P.vy += G * (P.vy > 0 ? 1.35 : 1) * dt;
    P.vy = Math.min(P.vy, 420);
    P.x += P.vx * dt;
    move(dt);
    // corde: si prendono spingendo su, o saltandoci contro
    P.ropeCool = (P.ropeCool || 0) - dt;
    if (P.ropeCool <= 0) for (let i = 0; i < L.ropes.length; i++) {
      const r = L.ropes[i];
      if (Math.abs(P.x - r.x) < 7 && P.y - 8 > r.y0 && P.y - 8 < r.y1 + 4 && (inp.ay < -0.4 || (!P.ground && P.vy > -80))) {
        if (P.ground && P.y >= r.y1 - 2 && !(inp.ay < -0.4)) continue;
        P.mode = 'corda'; P.rope = i; P.vx = P.vy = 0; P.y = Math.min(P.y, r.y1 - 1); break;
      }
    }
  }
  P.x = Math.max(8, Math.min(L.W - 8, P.x));
  updateArms(dt);
  updateTeeth(dt);
  for (const p of puffs) p.t += dt;
  while (puffs.length && puffs[0].t > 0.8) puffs.shift();
  if (msgT > 0) msgT -= dt;
  shake = Math.max(0, shake - dt);
  endInput();
}
function endInput() { inp.jumpPressed = false; inp.jumpReleased = false; }
function move(dt) {
  const prev = P.y;
  P.y += P.vy * dt;
  P.ground = false; P.plat = -1;
  if (P.vy >= 0) {
    if (P.y >= L.ground) { if (P.vy > 120) play('atterra'); P.y = L.ground; P.vy = 0; P.ground = true; }
    if (!(P.stun > 0.35)) for (let i = 0; i < L.plats.length; i++) {
      const p = L.plats[i];
      if (P.x > p.x + 2 && P.x < p.x + p.w - 2 && prev <= p.y + 0.5 && P.y >= p.y) {
        if (P.vy > 120) play('atterra');
        P.y = p.y; P.vy = 0; P.ground = true; P.plat = i; break;
      }
    }
  }
}

// ---------------------------------------------------------------- mani
const L1 = 470, L2 = 470;
function initArms() {
  for (const a of L.arms) arms.push({ side: a.side, sh: { x: a.sh[0], y: a.sh[1] }, hip: { x: a.hip[0], y: a.hip[1] },
    hand: { x: a.hip[0], y: a.hip[1] }, state: 0, t: 0, from: null, to: null, cool: 2, hit: false });
}
function updateArms(dt) {
  const tx = P.x, ty = P.y - 14;
  for (const a of arms) {
    a.t += dt;
    if (a.state === 0) {
      a.hand = { x: a.hip.x, y: a.hip.y + Math.sin(t * 1.5 + a.side) * 2 };
      a.cool -= dt;
      const mine = (tx - L.W / 2) * a.side > -40;
      const reach = Math.hypot(tx - a.sh.x, ty - a.sh.y) < L1 + L2 - 30;
      const other = arms.some(o => o !== a && o.state !== 0);
      if (a.cool <= 0 && mine && reach && !other && state === 'gioco' && P.mode !== 'corda' && P.stun <= 0) {
        a.state = 1; a.t = 0; a.from = { ...a.hand }; a.hit = false; play('carica');
      }
    } else if (a.state === 1) {          // carica: la mano sale di lato e trema
      const k = Math.min(a.t / 0.85, 1), e = k * k * (3 - 2 * k);
      a.to = { x: tx + a.side * 70, y: ty - 46 };
      a.hand = { x: a.from.x + (a.to.x - a.from.x) * e + Math.sin(t * 70) * 2 * k, y: a.from.y + (a.to.y - a.from.y) * e + Math.cos(t * 55) * 2 * k };
      if (a.t >= 0.85) { a.state = 2; a.t = 0; a.from = { ...a.hand }; a.to = { x: tx - a.side * 46, y: ty + 6 }; }
    } else if (a.state === 2) {          // schiaffo
      const k = Math.min(a.t / 0.16, 1);
      a.hand = { x: a.from.x + (a.to.x - a.from.x) * k, y: a.from.y + (a.to.y - a.from.y) * k };
      if (!a.hit && P.mode !== 'corda' && Math.hypot(a.hand.x - tx, a.hand.y - ty) < 20) {
        a.hit = true; shake = 0.25;
        if (P.cling) { play('resiste'); puffs.push({ x: tx, y: ty - 10, t: 0, w: 'SCHIAFF!' }); say('si aggrappa e resiste', 1.5); }
        else {
          play('schiaffo'); puffs.push({ x: tx, y: ty - 10, t: 0, w: 'SCHIAFF!' });
          P.mode = 'normale'; P.stun = 0.6; P.spin = 0; P.vx = -a.side * 150; P.vy = -170;
        }
      }
      if (a.t >= 0.16) { if (!a.hit) play('puff'); if (!a.hit) puffs.push({ x: a.hand.x, y: a.hand.y, t: 0, w: 'PUFF!' }); a.state = 3; a.t = 0; }
    } else if (a.state === 3) { if (a.t > 0.35) { a.state = 4; a.t = 0; a.from = { ...a.hand }; } }
    else if (a.state === 4) {
      const k = Math.min(a.t / 0.8, 1), e = k * k * (3 - 2 * k);
      a.hand = { x: a.from.x + (a.hip.x - a.from.x) * e, y: a.from.y + (a.hip.y - a.from.y) * e };
      if (k >= 1) { a.state = 0; a.cool = 2.4 + Math.random() * 1.8; }
    }
    // limite di portata
    const dx = a.hand.x - a.sh.x, dy = a.hand.y - a.sh.y, d = Math.hypot(dx, dy), mx = L1 + L2 - 4;
    if (d > mx) { a.hand.x = a.sh.x + dx / d * mx; a.hand.y = a.sh.y + dy / d * mx; }
  }
}
function elbow(a) {
  const dx = a.hand.x - a.sh.x, dy = a.hand.y - a.sh.y, d = Math.max(1, Math.hypot(dx, dy));
  const h = Math.sqrt(Math.max(0, L1 * L1 - (d / 2) * (d / 2)));
  let nx = -dy / d, ny = dx / d;
  if (nx * a.side < 0) { nx = -nx; ny = -ny; }
  return { x: a.sh.x + dx / 2 + nx * h, y: a.sh.y + dy / 2 + ny * h };
}

// ---------------------------------------------------------------- denti e bocca
function updateTeeth(dt) {
  const c = (t % 3.4);
  const prevK = teethK;
  teethK = c < 2.2 ? 0 : c < 2.32 ? (c - 2.2) / 0.12 : c < 2.9 ? 1 : 1 - (c - 2.9) / 0.5;
  if (prevK < 0.5 && teethK >= 0.5 && Math.abs(P.y - L.mouth.y1) < 200) play('denti');
  const m = L.mouth;
  const inside = P.x > m.x0 + 6 && P.x < m.x1 - 6 && P.y > m.y0 && P.y <= m.y1 && P.y - 28 < m.y1;
  if (state === 'gioco' && inside && P.stun <= 0) {
    if (teethK > 0.7) {
      play('crac'); puffs.push({ x: P.x, y: P.y - 20, t: 0, w: 'CRAC!' }); shake = 0.3;
      P.stun = 0.6; P.vx = (P.x < (m.x0 + m.x1) / 2 ? -1 : 1) * 140; P.vy = -120;
    } else if (Math.abs(P.x - (m.x0 + m.x1) / 2) < 10 && P.ground) {
      state = 'fine'; finT = 0; say('', 0); play('fine');
    }
  }
}

// ---------------------------------------------------------------- disegno
function frame(name) { return L.frames.indexOf(name); }
function pippoFrame() {
  if (P.stun > 0) return 'fall';
  if (P.mode === 'corda') return inp.ay !== 0 ? 'climb' + (Math.floor(P.climbd / 5) % 4) : 'hang';
  if (!P.ground) return P.vy < 0 ? 'jump' : 'fall';
  if (P.cling) return 'cling';
  if (Math.abs(P.vx) > 12) { const a0 = Math.floor(P.anim * 6); P.anim += Math.abs(P.vx) * 0.0016; const a1 = Math.floor(P.anim * 6); if (a1 !== a0 && a1 % 2 === 0) play('passo'); return 'run' + (a1 % 4); }
  return 'idle' + (Math.floor(t * 1.6) % 2);
}
function draw() {
  const W = VW;
  // telecamera
  const tx = Math.max(0, Math.min(L.W - W, P.x - W / 2));
  const ty = Math.max(0, Math.min(L.H - VH, P.y - 112));
  cam.x += (tx - cam.x) * 0.12; cam.y += (ty - cam.y) * 0.12;
  let cx = Math.round(cam.x), cy = Math.round(cam.y);
  if (shake > 0) { cx += Math.round((Math.random() - 0.5) * 4); cy += Math.round((Math.random() - 0.5) * 4); }
  // sfondo
  b.drawImage(IMG.cielo, 0, 0);
  const par = (img, f, op) => {
    const h = img.height, w = img.width;
    const oy = ((-(cy * f)) % h + h) % h - h;
    const ox = ((-(cx * f + t * (f * 6))) % w + w) % w - w;
    for (let y = oy; y < VH; y += h) for (let x = ox; x < W; x += w) b.drawImage(img, x, y);
  };
  par(IMG.nuvole_lontane, 0.12);
  const cityY = 70 + (L.H - VH - cy) * 0.35;
  if (cityY < VH) for (let x = -((cx * 0.4) % 480) - 480; x < W; x += 480) b.drawImage(IMG.citta, x, cityY);
  par(IMG.nuvole_vicine, 0.3);
  // prete
  b.drawImage(IMG.prete, cx, cy, W, VH, 0, 0, W, VH);
  // denti
  const m = L.mouth;
  b.save(); b.beginPath(); b.rect(m.x0 - cx - 2, m.y0 - cy, m.x1 - m.x0 + 4, m.y1 - m.y0); b.clip();
  const open = 1 - teethK;
  b.drawImage(IMG.denti_su, L.teeth.x - cx, Math.round(m.y0 - 12 + 18 * teethK) - cy);
  b.drawImage(IMG.denti_giu, L.teeth.x - cx, Math.round(m.y1 - 10 - 18 * teethK) - cy);
  b.restore();
  // braccia (dietro i balconi)
  for (const a of arms) drawArm(a, cx, cy);
  // corde
  for (let i = 0; i < L.ropes.length; i++) {
    const r = L.ropes[i];
    if (r.y1 < cy - 10 || r.y0 > cy + VH + 10) continue;
    for (let y = r.y0 - 2; y < r.y1 + 8; y++) {
      const sway = P.mode === 'corda' && P.rope === i ? Math.round(Math.sin(t * 5 + y * 0.08) * Math.min(1, Math.abs(y - P.y) / 40)) : 0;
      b.fillStyle = (Math.floor(y / 2) % 2) ? '#96784a' : '#6e5632';
      b.fillRect(r.x - cx + sway, y - cy, 1, 1);
      if (y % 6 === 0) { b.fillStyle = '#6e5632'; b.fillRect(r.x - cx - 1 + sway, y - cy, 3, 1); }
    }
    b.fillStyle = '#42301c'; b.fillRect(r.x - cx - 3, r.y0 - 4 - cy, 7, 3);
  }
  // balconi
  for (const p of L.plats) {
    if (p.y < cy - 30 || p.y > cy + VH + 30) continue;
    const img = IMG['balcone' + p.w];
    if (p.vaso) b.drawImage(IMG.vaso, p.x + 6 - cx, p.y - 16 - cy);
    if (p.lanterna) {
      const lx = p.x + p.w - 14 - cx, ly = p.y - 13 - cy;
      b.globalAlpha = 0.10 + 0.03 * Math.sin(t * 7 + p.x);
      b.fillStyle = '#ffb44a';
      for (const r of [22, 15, 9]) { b.beginPath(); b.arc(lx + 4, ly + 6, r, 0, 6.29); b.fill(); }
      b.globalAlpha = 1;
      b.drawImage(IMG.lanterna, lx, ly);
    }
    b.drawImage(img, p.x - cx, p.y - 12 - cy);
  }
  // Pippo
  const f = frame(pippoFrame());
  const px = Math.round(P.x - cx), py = Math.round(P.y - cy);
  b.save();
  b.translate(px, py - 15);
  if (P.stun > 0) b.rotate(P.spin);
  if (P.mode === 'corda') b.translate(Math.round(Math.sin(P.climbd * 0.4)), 0);
  b.drawImage(IMG.pippo, f * L.fw, 0, L.fw, L.fh, -13, -15, L.fw, L.fh);
  b.restore();
  if (danger && state === 'gioco') {
    b.fillStyle = (Math.floor(t * 8) % 2) ? '#ffd46e' : '#e88a3c';
    b.fillRect(px - 1, py - 40, 2, 6); b.fillRect(px - 1, py - 32, 2, 2);
  }
  // nuvolette
  b.textAlign = 'center'; b.font = 'bold 8px monospace';
  for (const p of puffs) {
    const k = Math.min(1, p.t / 0.12), s = 0.5 + 0.5 * k;
    b.globalAlpha = p.t > 0.55 ? Math.max(0, 1 - (p.t - 0.55) / 0.25) : 1;
    const w = IMG.puff.width * s, h = IMG.puff.height * s;
    b.drawImage(IMG.puff, Math.round(p.x - cx - w / 2), Math.round(p.y - cy - h / 2), w, h);
    b.fillStyle = '#241e30'; b.fillText(p.w, Math.round(p.x - cx), Math.round(p.y - cy + 3));
    b.globalAlpha = 1;
  }
  // altezza: barra a destra
  const prog = 1 - (P.y - L.mouth.y1) / (L.ground - L.mouth.y1);
  b.fillStyle = 'rgba(232,226,210,0.25)'; b.fillRect(W - 6, 20, 2, 140);
  b.fillStyle = '#e8e2d2'; b.fillRect(W - 7, 20 + 140 * (1 - Math.max(0, Math.min(1, prog))) - 1, 4, 3);
  // messaggi
  if (msgT > 0 && msg) {
    b.globalAlpha = Math.min(1, msgT);
    b.font = '8px monospace'; b.fillStyle = '#07060c';
    b.fillText(msg, W / 2 + 1, 15); b.fillStyle = '#e8e2d2'; b.fillText(msg, W / 2, 14);
    b.globalAlpha = 1;
  }
  if (state === 'fine') {
    b.globalAlpha = Math.min(1, finT / 1.2);
    b.fillStyle = '#05040a'; b.fillRect(0, 0, W, VH);
    b.globalAlpha = 1;
    if (finT > 1.2) {
      b.font = 'bold 16px monospace'; b.fillStyle = '#e8e2d2'; b.fillText('DENTRO.', W / 2, 86);
      b.font = '8px monospace'; b.fillStyle = '#8f88a6'; b.fillText('tocca per ricominciare', W / 2, 104);
    }
  }
}
function drawArm(a, cx, cy) {
  const e = elbow(a);
  const seg = (p, q, w, col) => { b.strokeStyle = col; b.lineWidth = w; b.lineCap = 'round'; b.beginPath(); b.moveTo(p.x - cx, p.y - cy); b.lineTo(q.x - cx, q.y - cy); b.stroke(); };
  const minY = Math.min(a.sh.y, e.y, a.hand.y) - 30, maxY = Math.max(a.sh.y, e.y, a.hand.y) + 30;
  if (maxY < cy || minY > cy + VH) return;
  // manica: contorno, stoffa, luce di luna sul bordo, polsino
  seg(a.sh, e, 24, '#08060e'); seg(e, a.hand, 21, '#08060e');
  seg(a.sh, e, 20, '#2a2738'); seg(e, a.hand, 17, '#2a2738');
  const off = (p, q, k) => { const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1; return [{ x: p.x - dy / d * k, y: p.y + dx / d * k }, { x: q.x - dy / d * k, y: q.y + dx / d * k }]; };
  let [p1, p2] = off(a.sh, e, 6 * a.side); seg(p1, p2, 3, '#3e3a56');
  [p1, p2] = off(e, a.hand, 5 * a.side); seg(p1, p2, 3, '#3e3a56');
  [p1, p2] = off(a.sh, e, -6 * a.side); seg(p1, p2, 4, '#1a1826');
  // pieghe
  for (const k of [0.3, 0.55, 0.8]) {
    const fx = a.sh.x + (e.x - a.sh.x) * k, fy = a.sh.y + (e.y - a.sh.y) * k;
    b.fillStyle = '#16141f'; b.fillRect(Math.round(fx - cx) - 4, Math.round(fy - cy), 8, 1);
  }
  const cu = { x: e.x + (a.hand.x - e.x) * 0.9, y: e.y + (a.hand.y - e.y) * 0.9 };
  seg(cu, { x: e.x + (a.hand.x - e.x) * 0.97, y: e.y + (a.hand.y - e.y) * 0.97 }, 22, '#08060e');
  b.save(); b.translate(Math.round(e.x - cx), Math.round(e.y - cy)); b.scale(1.6, 1.6); b.drawImage(IMG.perno, -8, -8); b.restore();
  b.save(); b.translate(Math.round(a.sh.x - cx), Math.round(a.sh.y - cy)); b.scale(1.8, 1.8); b.drawImage(IMG.perno, -8, -8); b.restore();
  // mano: ruotata verso la direzione dell'avambraccio
  const ang = Math.atan2(a.hand.y - e.y, a.hand.x - e.x) - Math.PI / 2;
  b.save(); b.translate(Math.round(a.hand.x - cx), Math.round(a.hand.y - cy)); b.rotate(ang + Math.PI);
  if (a.state === 1 && Math.floor(t * 10) % 2) { b.globalAlpha = 0.8; }
  b.scale(1.5, 1.5); b.drawImage(IMG.mano, -20, -30);
  b.restore(); b.globalAlpha = 1;
}
function drawControls() {
  if (BOT) return;
  ctx.save(); ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.strokeStyle = ctx.fillStyle = 'rgba(232,226,210,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(18, 24); ctx.lineTo(23, 24); ctx.lineTo(29, 19); ctx.lineTo(29, 37); ctx.lineTo(23, 32); ctx.lineTo(18, 32); ctx.closePath(); ctx.fill();
  if (SND.on) { ctx.beginPath(); ctx.arc(30, 28, 6, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(30, 28, 11, -0.9, 0.9); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(34, 23); ctx.lineTo(42, 33); ctx.moveTo(42, 23); ctx.lineTo(34, 33); ctx.stroke(); }
  ctx.restore();
  const s = innerWidth / VW >= 1 ? 1 : 1;
  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const R = Math.min(innerWidth, innerHeight) * 0.11;
  const rest = { x: innerWidth * 0.14, y: innerHeight * 0.78 };
  const o = touch.stick !== null ? touch.so : rest;
  ctx.strokeStyle = 'rgba(232,226,210,' + (touch.stick !== null ? 0.55 : 0.28) + ')';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(o.x, o.y, R, 0, 6.29); ctx.stroke();
  if (touch.stick !== null) {
    const dx = touch.sp.x - o.x, dy = touch.sp.y - o.y, d = Math.hypot(dx, dy), k = d > R ? R / d : 1;
    ctx.fillStyle = 'rgba(232,226,210,0.7)'; ctx.beginPath(); ctx.arc(o.x + dx * k, o.y + dy * k, R * 0.35, 0, 6.29); ctx.fill();
  }
  touch.glow = touch.jumpId !== null ? 1 : Math.max(0, touch.glow - 0.06);
  const jb = { x: innerWidth * 0.86, y: innerHeight * 0.78 };
  ctx.strokeStyle = 'rgba(232,226,210,' + (0.28 + 0.6 * touch.glow) + ')'; ctx.lineWidth = 2 + 4 * touch.glow;
  ctx.beginPath(); ctx.arc(jb.x, jb.y, R * 0.9, 0, 6.29); ctx.stroke();
  if (touch.glow > 0) { ctx.fillStyle = 'rgba(255,214,140,' + 0.18 * touch.glow + ')'; ctx.beginPath(); ctx.arc(jb.x, jb.y, R * 0.9, 0, 6.29); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- bot di prova (solo con ?bot=1)
let botCur = -1, botHold = 0;
function bot() {
  inp.jumpPressed = false; inp.jumpReleased = false;
  const want = (ax, ay, jump) => {
    if (jump && !inp.jump) inp.jumpPressed = true;
    if (!jump && inp.jump) inp.jumpReleased = true;
    inp.ax = ax; inp.ay = ay; inp.jump = jump;
  };
  if (P.ground && P.plat > botCur) botCur = P.plat;
  if (P.ground && P.plat === -1 && P.y >= L.ground - 1) botCur = -1;
  if (P.ground && P.plat >= 0 && P.plat < botCur) botCur = P.plat;
  const tgt = L.plats[botCur + 1];
  if (!tgt) { want(Math.sign(((L.mouth.x0 + L.mouth.x1) / 2) - P.x) * (teethK > 0.05 || (t % 3.4) > 1.4 ? 0 : 1), 0, false); return; }
  if (danger && P.ground) { want(0, 0, true); return; }
  // corda verso il bersaglio?
  const r = L.ropes.find(r => Math.abs(r.y0 - 14 - tgt.y) < 3);
  if (P.mode === 'corda') { want(0, -1, false); return; }
  if (r) { const d = r.x - P.x; want(Math.abs(d) < 2 ? 0 : Math.sign(d) * Math.min(1, Math.abs(d) / 10), Math.abs(d) < 5 ? -1 : 0, false); return; }
  const c = tgt.x + tgt.w / 2;
  const edge = P.x < tgt.x ? tgt.x - P.x : P.x > tgt.x + tgt.w ? P.x - (tgt.x + tgt.w) : 0;
  const dir = Math.sign(c - P.x);
  if (P.ground) {
    botHold = 0;
    if (edge < 34) want(dir * (Math.abs(c - P.x) > 10 ? 1 : 0.3), 0, true);
    else want(dir, 0, false);
  } else {
    botHold += 1 / 60;
    want(P.vy > 0 && Math.abs(c - P.x) < 6 ? 0 : dir, 0, botHold < 0.5);
  }
}

// ---------------------------------------------------------------- avvio e ciclo
function resize() {
  const dpr = devicePixelRatio || 1;
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  VW = Math.max(280, Math.min(384, Math.round(VH * innerWidth / innerHeight)));
  buf.width = VW; buf.height = VH;
  b.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
let last = 0, acc = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  acc += dt * FAST;
  while (acc >= 1 / 120) { update(1 / 120); acc -= 1 / 120; }
  if (SND.ctx && SND.on) musicTick();
  draw();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#07060c'; ctx.fillRect(0, 0, cv.width, cv.height);
  const sc = Math.min(cv.width / VW, cv.height / VH);
  const w = VW * sc, h = VH * sc;
  ctx.drawImage(buf, Math.round((cv.width - w) / 2), Math.round((cv.height - h) / 2), Math.round(w), Math.round(h));
  drawControls();
  requestAnimationFrame(loop);
}
Promise.all([fetch('livello.json').then(r => r.json()), ...NAMES.map(n => new Promise(res => {
  const i = new Image(); i.onload = () => { IMG[n] = i; res(); }; i.src = 'img/' + n + '.png';
}))]).then(([lvl]) => {
  L = lvl; resize(); initArms(); restart();
  window.__g = { P, L, get state() { return state; }, get t() { return t; }, cam, get botCur() { return botCur; }, get suono() { return SND.ctx ? SND.ctx.state + ' ' + SND.step : 'spento'; } };
  requestAnimationFrame(loop);
});
})();
