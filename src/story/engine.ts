// @ts-nocheck
// Scroll-scrubbed canvas story for the home page. One timeline S (0..10), one unit per <section>.

export function startStory(cv: HTMLCanvasElement, main: HTMLElement, onTone: (tone: string) => void): () => void {
  const c = cv.getContext('2d');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SANS = '"Huninn","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  let W = 390, H = 844, U = 1, DPR = 1, T = 0, raf = 0, alive = true;

  const C = {
    ink: '#231F35', ink2: '#3A3556', plank: '#4A4560', coral: '#F06A5A', salmon: '#F4A7A0', gold: '#F7C948', butter: '#F7E3A6',
    lime: '#D6EC6E', green: '#9BB23F', green2: '#6E8C25', teal: '#4FB5C0', aqua: '#6FCFD5', sea2: '#1D4A5E',
    lilac: '#B7A6D9', skin: '#F6C7A8', cream: '#FFFDF6', sand: '#F3E2B8'
  };
  const SH = 'rgba(20,18,40,.26)';

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (x, a, b) => clamp((x - a) / (b - a));
  const eo = t => 1 - Math.pow(1 - t, 3);
  const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const back = t => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const bounce = t => { const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
  function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };
  const qb = (a, b, d, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * d;

  // ---------- primitives ----------
  function rr(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function dot(x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }

  // Flat geometric person; x,y = feet. ~140 local units tall.
  function person(x, y, s, col, o: any = {}) {
    const a = o.a ?? 1; if (a <= 0.01 || s <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(s * U, s * U * (o.sq || 1));
    if (o.glow > 0) {
      const g = c.createRadialGradient(0, -62, 4, 0, -62, 100);
      g.addColorStop(0, `rgba(214,236,110,${.6 * o.glow})`); g.addColorStop(1, 'rgba(214,236,110,0)');
      c.fillStyle = g; dot(0, -62, 100);
    }
    const shape = (body, skin, hair, item1, item2, shadow) => {
      c.lineCap = 'round'; c.lineWidth = 9; c.strokeStyle = body; c.beginPath();
      if (o.arms === 'up') { c.moveTo(-17, -40); c.lineTo(-33, -76); c.moveTo(17, -40); c.lineTo(33, -76); }
      else if (o.arms === 'lift') { c.moveTo(-17, -42); c.lineTo(-27, -100); c.moveTo(17, -42); c.lineTo(27, -100); }
      else if (o.arms === 'hold') { c.moveTo(-19, -40); c.lineTo(-13, -24); c.moveTo(19, -40); c.lineTo(13, -24); }
      else { c.moveTo(-20, -38); c.lineTo(-29, -12); c.moveTo(20, -38); c.lineTo(29, -12); }
      c.stroke();
      c.fillStyle = body; c.beginPath(); c.moveTo(-27, 0); c.bezierCurveTo(-27, -34, -17, -54, 0, -54); c.bezierCurveTo(17, -54, 27, -34, 27, 0); c.closePath(); c.fill();
      c.fillStyle = skin; dot(0, -74, 20);
      c.fillStyle = hair; c.beginPath(); c.arc(0, -75, 21, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(4, -82, -19.5, -80); c.closePath(); c.fill();
      if (o.item === 'flag') {
        c.strokeStyle = shadow ? item1 : C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(33, -76); c.lineTo(39, -140); c.stroke();
        c.fillStyle = item1; c.beginPath(); c.moveTo(39, -140); c.lineTo(82, -128); c.lineTo(39, -113); c.closePath(); c.fill();
      } else if (o.item === 'box') {
        c.fillStyle = item1; rr(-21, -38, 42, 28, 4); c.fill();
        c.fillStyle = item2; c.fillRect(-3, -38, 6, 28); c.fillRect(-21, -27, 42, 6);
      } else if (o.item === 'book') {
        c.fillStyle = item1; rr(-23, -40, 46, 30, 3); c.fill();
        c.fillStyle = item2; c.fillRect(-19, -36, 17, 22); c.fillRect(2, -36, 17, 22);
      }
    };
    if (!o.noShadow) { c.save(); c.translate(4, 3); shape(SH, SH, SH, SH, SH, true); c.restore(); }
    const it = o.item === 'box' ? [C.coral, C.gold] : o.item === 'book' ? [C.ink2, C.cream] : [C.coral, C.coral];
    shape(col, C.skin, C.ink, it[0], it[1], false);
    c.fillStyle = C.ink; c.strokeStyle = C.ink; c.lineWidth = 2.6; c.lineCap = 'round';
    const e = o.expr || 'flat';
    if (e === 'daze') {
      c.beginPath(); c.moveTo(-10, -72); c.lineTo(-4, -72); c.moveTo(4, -72); c.lineTo(10, -72); c.stroke(); dot(0, -63, 2.4);
    } else {
      dot(-7, -72, 2.5); dot(7, -72, 2.5);
      c.beginPath();
      if (e === 'smile') c.arc(0, -67, 6, .15 * Math.PI, .85 * Math.PI);
      else if (e === 'sad') c.arc(0, -58, 6, 1.22 * Math.PI, 1.78 * Math.PI);
      else { c.moveTo(-5, -63); c.lineTo(5, -63); }
      c.stroke();
      if (e === 'smile') { c.fillStyle = 'rgba(240,106,90,.45)'; dot(-13, -66, 3.4); dot(13, -66, 3.4); }
    }
    c.restore();
  }

  // A club: three officers in the same club colour, lifting one shared plank of burdens.
  const OFF = [-58, 0, 58];
  const SLOTS = [[-40, 0], [40, 0], [-40, 1], [40, 1]];
  function club(cx, feet, s, col, o: any = {}) {
    const a = o.a ?? 1; if (a <= 0.01) return;
    const lift = o.lift || 0, sq = o.sq || 1;
    OFF.forEach((dx, i) => {
      const arms = lift > .5 ? 'lift' : (o.arms ? o.arms[i] : 'down');
      person(cx + dx * s * U, feet + (o.bob ? o.bob[i] : 0), s, col,
        { a, arms, item: o.flag && i === 1 && lift <= .5 ? 'flag' : null, expr: o.expr, sq, rot: o.rot ? o.rot * (1 + i * .3) : 0 });
    });
    if (lift <= 0) return;
    c.save(); c.globalAlpha *= a * seg(lift, .4, .8);
    const py = feet - 104 * s * U * sq, x0 = cx - 96 * s * U, w = 192 * s * U, ph = 9 * s * U;
    c.fillStyle = SH; rr(x0 + 4 * U, py + 3 * U, w, ph, 3 * U); c.fill();
    c.fillStyle = C.plank; rr(x0, py, w, ph, 3 * U); c.fill();
    (o.blocks || []).forEach((b, k) => {
      if (!b) return; const [sx, row] = SLOTS[k];
      c.save(); c.translate(cx + sx * s * U, py + (b.dy || 0) * s * U); c.scale(s * U, s * U);
      const by = -24 - row * 26;
      c.fillStyle = SH; rr(-31 + 4, by + 3, 62, 24, 4); c.fill();
      c.fillStyle = C.ink; rr(-31, by, 62, 24, 4); c.fill();
      if (b.label) { c.fillStyle = C.cream; c.font = `13px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.label, 0, by + 12.5); }
      c.restore();
    });
    c.restore();
  }
  const stackTop = n => 104 + 9 + (n > 2 ? 52 : n > 0 ? 26 : 0);

  function bubble(x, y, text, o: any = {}) {
    const sc = o.sc ?? 1; const a = o.a ?? 1; if (sc <= 0.01 || a <= 0.01 || x < -20 * U || x > W + 20 * U) return;
    const fs = (o.fs || 12) * U; c.font = `${o.weight || 500} ${fs}px ${SANS}`;
    const tw = c.measureText(text).width, pw = tw + fs * 1.4, ph = fs * 2.05;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(sc, sc * (o.flip ?? 1));
    const m = 6 * U; let off = 0;
    if (x - pw / 2 < m) off = m - (x - pw / 2); else if (x + pw / 2 > W - m) off = (W - m) - (x + pw / 2);
    const bx = -pw / 2 + off, by = -ph - fs * .55, tb = clamp(0, bx + ph / 2, bx + pw - ph / 2);
    c.fillStyle = 'rgba(8,10,28,.35)'; rr(bx + 3, by + 3, pw, ph, ph / 2); c.fill();
    c.fillStyle = o.bg || C.cream; rr(bx, by, pw, ph, ph / 2); c.fill();
    c.beginPath(); c.moveTo(tb - fs * .4, by + ph - 1); c.lineTo(0, 0); c.lineTo(tb + fs * .32, by + ph - 1); c.closePath(); c.fill();
    c.fillStyle = o.fg || C.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, bx + pw / 2, by + ph / 2 + fs * .06);
    c.restore();
  }

  function tag(x, y, text, a) {
    if (a <= 0.01) return; c.save(); c.globalAlpha *= a;
    const fs = 11.5 * U; c.font = `${fs}px ${SANS}`; const w = c.measureText(text).width + fs * 1.5, h = fs * 2;
    c.fillStyle = SH; rr(x - w / 2 + 2, y + 2, w, h, h / 2); c.fill();
    c.fillStyle = C.cream; rr(x - w / 2, y, w, h, h / 2); c.fill();
    c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + h / 2 + .5);
    c.restore();
  }

  function sea(y) {
    const g = c.createLinearGradient(0, y, 0, y + H); g.addColorStop(0, '#5BBCC4'); g.addColorStop(1, C.sea2);
    const wave = x => y + Math.sin(x * .035 + T * 1.6) * 3 * U;
    c.fillStyle = g; c.beginPath(); c.moveTo(0, wave(0));
    for (let x = 12; x <= W + 12; x += 12) c.lineTo(x, wave(x));
    c.lineTo(W + 12, y + H * 3); c.lineTo(0, y + H * 3); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,253,246,.55)'; c.lineWidth = 2 * U; c.beginPath(); c.moveTo(0, wave(0));
    for (let x = 12; x <= W + 12; x += 12) c.lineTo(x, wave(x)); c.stroke();
  }

  function islet(cx, base, w, h, a = 1) {
    if (a <= 0.01) return; c.save(); c.globalAlpha *= a;
    c.fillStyle = C.sand; c.beginPath(); c.ellipse(cx, base + 2 * U, w / 2 * 1.06, h * .42, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = SH; c.beginPath(); c.ellipse(cx + 4 * U, base + 2 * U, w / 2, h, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = C.green; c.beginPath(); c.ellipse(cx, base, w / 2, h, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = C.green2; c.beginPath(); c.ellipse(cx, base, w / 2, h, 0, Math.PI * 1.62, 0); c.lineTo(cx + w * .18, base); c.closePath(); c.fill();
    c.restore();
  }
  const isTop = (cx, base, w, h, x) => { const d = (x - cx) / (w / 2); return base - h * Math.sqrt(Math.max(0, 1 - d * d)); };

  // ---------- data ----------
  const R = rng(7);
  const TW_LL = [[121.52,25.30],[121.75,25.16],[122.00,25.02],[121.86,24.80],[121.84,24.50],[121.70,24.15],[121.60,23.90],[121.50,23.50],[121.38,23.15],[121.18,22.80],[120.98,22.50],[120.88,22.20],[120.85,21.92],[120.72,21.94],[120.62,22.30],[120.42,22.50],[120.26,22.66],[120.12,23.00],[120.14,23.40],[120.25,23.75],[120.38,24.05],[120.60,24.35],[120.85,24.70],[121.02,24.95],[121.20,25.08],[121.40,25.18]];
  const TW = TW_LL.map(([lo, la]) => [(lo - 121.05) * .917 / 3.4, (23.6 - la) / 3.4]);
  function inPoly(x, y, P) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
  const nodes = [];
  for (let tries = 0; nodes.length < 88 && tries < 30000; tries++) {
    const x = -.27 + R() * .54, y = -.5 + R();
    if (!inPoly(x, y, TW)) continue;
    if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < .05)) continue;
    nodes.push({ x, y, r: R(), m: null, px: 0, py: 0, a: 0 });
  }

  const LABELS = ['教案分享', '志工培訓', '經費申請', '招生經驗', '器材出借', '交接手冊', '合作學校', '講師人脈'];
  const PICKS = { '-1,-1': 0, '1,-1': 1, '-1,0': 2, '1,0': 3, '0,1': 4, '-1,2': 5, '1,2': 6, '0,2': 7 };
  const CROWD_COLS = ['#5D6A86', '#4A5577', '#6B7896', '#56607E', '#7A7FA0'];
  const clubs = []; const CR = rng(3);
  for (let row = -1; row <= 2; row++) for (let col = -1; col <= 1; col++) {
    const ours = col === 0 && row === 0;
    const nb = ours ? 4 : 1 + Math.floor(CR() * 2.4);
    clubs.push({ col, row, ours, nb,
      wx: col * 235 + (ours ? 0 : (CR() - .5) * 30), wy: row * 205 + (ours ? 0 : (CR() - .5) * 22),
      color: ours ? C.salmon : CROWD_COLS[Math.floor(CR() * CROWD_COLS.length)],
      rank: ours ? 0 : Math.hypot(col * 1.4, row) / Math.hypot(1.4, 2), r2: ours ? 0 : CR(),
      pick: PICKS[col + ',' + row] ?? -1, top: [0, 0],
      blocks: Array.from({ length: nb }, (_, k) => ({ label: ours ? ['招生', '經費', '教案', '交接'][k] : '', dy: 0 })) });
  }
  clubs.sort((a, b) => a.wy - b.wy);
  // each club becomes one light on the island
  [...clubs].sort((a, b) => a.rank - b.rank).forEach(m => {
    const tx = m.col * .12, ty = -.33 + (m.row + 1) * .22;
    let best = -1, bd = 1e9;
    nodes.forEach((n, i) => { if (n.m) return; const d = (n.x - tx) ** 2 + (n.y - ty) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best >= 0) nodes[best].m = m;
  });
  const edges = []; const seen = new Set();
  nodes.forEach((n, i) => {
    nodes.map((o, j) => [j, Math.hypot(o.x - n.x, o.y - n.y)]).filter(d => d[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3)
      .forEach(([j, d]) => { if (d > .15) return; const k = i < j ? i + '-' + j : j + '-' + i; if (seen.has(k)) return; seen.add(k);
        edges.push({ a: i, b: j, key: Math.min(n.y, nodes[j].y) + .5, ph: R() }); });
  });
  const STARS = Array.from({ length: 70 }, () => ({ x: R(), y: R(), r: .8 + R() * 1.6, b: .4 + R() * .6, p: R() * 6 }));
  const PLANK = Array.from({ length: 40 }, () => ({ x: R(), y: R(), r: .6 + R() * 1.4, s: .5 + R(), p: R() * 6 }));
  const PARTS = Array.from({ length: 150 }, (_, i) => ({ i, src: i % 3, ph: R(), sp: .8 + R() * .5 }));
  const KIDS_A = [{ dx: -162, col: C.aqua }, { dx: -122, col: C.gold }, { dx: 122, col: C.lilac }, { dx: 162, col: C.green }];
  const KIDS_8 = [-100, -52, 52, 100], KIDS_9 = [-100, -70, 70, 100], KCOL = [C.aqua, C.gold, C.lilac, C.green];
  const OURS_BLOCKS = ['招生', '經費', '教案', '交接'];

  // colour script: warm paper → dusk → deep sea → night → dawn
  const BG = [
    [0, '#FBF1D6', '#F7E3A6'], [.95, '#FBF1D6', '#F7E3A6'], [1.6, '#D9D3DE', '#BFC2D0'], [2.0, '#6E7A96', '#55607E'],
    [2.6, '#2A7F8E', '#1D4A5E'], [3.2, '#1D4A5E', '#1A1B30'], [4.8, '#1D4A5E', '#1A1B30'], [5.5, '#14152A', '#1A1B30'],
    [6.9, '#14152A', '#1A1B30'], [7.6, '#2A2848', '#8C6A8E'], [8.4, '#3A3556', '#E59A98'], [9.4, '#F4A7A0', '#F7D7A0'], [10, '#F7D7A0', '#FBF1D6']];
  function bgAt(S) {
    for (let i = 0; i < BG.length - 1; i++) { const a = BG[i], b = BG[i + 1]; if (S <= b[0]) { const t = eio(seg(S, a[0], b[0])); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; } }
    const l = BG[BG.length - 1]; return [l[1], l[2]];
  }

  // ---------- scenes ----------
  const ZC = () => Math.min(.62, W * .9 / (680 * U));
  let PAN = 0, SR = 0;
  function crowdPos(m, zt) { const z = lerp(1, ZC(), zt), Hc = lerp(H * .70, H * .645, zt); return [W / 2 + m.wx * z * U - PAN, Hc + m.wy * z * U, z]; }

  function early(S) {
    const leave = seg(S, .92, 1.35), shrink = eio(seg(S, .95, 1.5)), w2 = eio(seg(S, 1.95, 2.85));
    const camY = w2 * H, gY = H * .80, still = RM ? 0 : 1;
    const iw = lerp(W * 1.7, 310 * U, shrink), ih = lerp(H * .09, 30 * U, shrink), ecy = gY + ih * .6;
    const surf = x => { const d = (x - W / 2) / (iw / 2); return ecy - ih * Math.sqrt(Math.max(0, 1 - d * d)); };
    const seaY = lerp(H + 30, ecy - ih * .35, eio(seg(S, 1.0, 1.55)));

    c.save(); c.translate(0, -camY);
    const sunA = 1 - seg(S, .85, 1.35);
    if (sunA > 0) { c.globalAlpha = sunA; c.fillStyle = C.butter; dot(W * .8, H * .5, 48 * U); c.fillStyle = C.gold; dot(W * .8, H * .5, 32 * U); c.globalAlpha = 1; }
    if (leave < 1) {
      c.globalAlpha = 1 - leave;
      const y0 = H * .555, y1 = H * .575, cy = y0 + 48 * U;
      c.strokeStyle = C.ink; c.lineWidth = 1.5 * U; c.beginPath(); c.moveTo(-10, y0); c.quadraticCurveTo(W / 2, cy, W + 10, y1); c.stroke();
      for (let i = 0; i < 9; i++) {
        const t = (i + .5) / 9, x = lerp(-10, W + 10, t), y = qb(y0, cy, y1, t);
        c.save(); c.translate(x, y); c.rotate(Math.sin(T * 2 + i) * .12 * still);
        c.fillStyle = [C.coral, C.teal, C.gold, C.lilac][i % 4]; c.beginPath(); c.moveTo(-11 * U, 0); c.lineTo(11 * U, 0); c.lineTo(0, 22 * U); c.closePath(); c.fill();
        c.restore();
      }
      const tx = W * .1, ty = surf(tx) + 4 * U, tw = 90 * U, th = 70 * U;
      const tri = (x, y) => { c.beginPath(); c.moveTo(x, y - th); c.lineTo(x + tw / 2, y); c.lineTo(x - tw / 2, y); c.closePath(); c.fill(); };
      c.fillStyle = SH; tri(tx + 4 * U, ty + 2); c.fillStyle = C.teal; tri(tx, ty);
      c.fillStyle = C.sea2; c.beginPath(); c.moveTo(tx, ty - th * .6); c.lineTo(tx + tw * .17, ty); c.lineTo(tx - tw * .17, ty); c.closePath(); c.fill();
      c.globalAlpha = 1;
    }
    c.fillStyle = C.green; c.beginPath(); c.ellipse(W / 2, ecy, iw / 2, ih, 0, Math.PI, 0);
    c.lineTo(W / 2 + iw / 2, H * 3); c.lineTo(W / 2 - iw / 2, H * 3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(110,140,37,.55)'; c.beginPath(); c.ellipse(W / 2 + iw * .08, ecy + ih * .5, iw / 2 * .9, ih * .7, 0, Math.PI, 0); c.lineTo(W / 2 + iw / 2, H * 3); c.lineTo(W / 2 - iw * .37, H * 3); c.closePath(); c.fill();
    KIDS_A.forEach((k, i) => {
      if (leave >= 1) return;
      const x = W / 2 + k.dx * U * (1 + 1.8 * eo(leave));
      const jump = Math.abs(Math.sin(T * 3.2 + i * 1.3)) * 9 * U * (1 - leave) * still;
      person(x, surf(x) + 2 * U - jump, .6, k.col, { a: 1 - leave, arms: i % 2 ? 'up' : 'down', expr: 'smile' });
    });
    if (seaY < H + 20) sea(seaY);
    c.restore();

    if (S < 2.95) {
      const feet = surf(W / 2) + 2 * U, fy = lerp(feet, H * .70, w2);
      const camp = 1 - seg(S, .7, .95);
      const bob = [0, 1, 2].map(i => -Math.abs(Math.sin(T * 2.6 + i * 1.1)) * 5 * U * camp * still);
      let landed = 0;
      const blocks = OURS_BLOCKS.map((l, k) => { const t = seg(S, 1.22 + k * .13, 1.35 + k * .13); if (t >= 1) landed++; return t > 0 ? { label: l, dy: -(1 - bounce(t)) * 760 } : null; });
      const expr = S < 1.2 ? 'smile' : S < 1.45 ? 'flat' : S > 2.1 ? 'daze' : 'sad';
      club(W / 2, fy, 1.0, C.salmon, {
        lift: seg(S, 1.02, 1.18), blocks, sq: 1 - .03 * landed, expr, flag: S < .95, bob,
        arms: S < .95 ? ['up', 'up', 'down'] : ['down', 'down', 'down'], rot: Math.sin(T * 1.1) * .05 * w2 * still });
    }
  }

  function underwater(S) {
    const uw = seg(S, 2.15, 2.6) * (1 - seg(S, 4.95, 5.35)); if (uw <= 0) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = W * (.12 + i * .27) + Math.sin(T * .4 + i) * 14 * U;
      c.fillStyle = `rgba(111,207,213,${.06 * uw})`; c.beginPath(); c.moveTo(x0 - 16 * U, 0); c.lineTo(x0 + 16 * U, 0); c.lineTo(x0 + 100 * U, H); c.lineTo(x0 - 20 * U, H); c.closePath(); c.fill();
    }
    PLANK.forEach(p => {
      const y = (((p.y * H - T * 10 * p.s * U) % H) + H) % H, x = p.x * W + Math.sin(T * .6 + p.p) * 6 * U;
      c.fillStyle = `rgba(255,253,246,${.35 * uw})`; dot(x, y, p.r * U);
    });
    c.restore();
    const hb = seg(S, 1.98, 2.2) * (1 - seg(S, 2.95, 3.1));
    if (hb > 0) for (let i = 0; i < 9; i++) {
      const u = (T * .35 + i / 9) % 1, bx = W / 2 + ((i % 3) - 1) * 46 * U + Math.sin(u * 9 + i) * 8 * U, by = H * .70 - 120 * U - u * 200 * U;
      c.strokeStyle = `rgba(255,253,246,${.6 * hb * (1 - u)})`; c.lineWidth = 1.5 * U; c.beginPath(); c.arc(bx, by, (3 + (i % 3) * 2) * U * (.6 + u), 0, Math.PI * 2); c.stroke();
    }
  }

  function stars(S) {
    const a = seg(S, 5.1, 5.5) * (1 - seg(S, 7.2, 7.75)); if (a <= 0) return;
    STARS.forEach(s => { const tw = .6 + .4 * Math.sin(T * 1.5 + s.p); c.fillStyle = `rgba(255,253,246,${a * tw * s.b})`; c.fillRect(s.x * W, s.y * H * .8, s.r * U, s.r * U); });
  }

  function shareLinks() {
    const sh = seg(SR, 5.1, 5.4) * (1 - seg(SR, 6.0, 6.25)); if (sh <= 0) return;
    const picks = clubs.filter(m => m.pick >= 0);
    c.save(); c.lineCap = 'round';
    picks.forEach((m, k) => {
      const t = clubs[(clubs.indexOf(m) + 4) % clubs.length];
      const [x0, y0] = m.top, [x1, y1] = t.top, cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 46 * U;
      c.globalAlpha = sh * .55; c.strokeStyle = C.lime; c.lineWidth = 1.6 * U; c.setLineDash([4 * U, 6 * U]); c.lineDashOffset = -T * 18;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
      c.setLineDash([]);
      const u = ((RM ? .5 : T * .45) + k * .19) % 1, px = qb(x0, cx, x1, u), py = qb(y0, cy, y1, u);
      c.globalAlpha = sh; c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(214,236,110,.35)'; dot(px, py, 9 * U);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = C.lime; dot(px, py, 4 * U);
    });
    c.restore();
  }

  function crowdScene(S) {
    const zt = eio(seg(S, 3.0, 3.75)), still = RM ? 0 : 1;
    for (const m of clubs) {
      let a = m.ours ? 1 : eo(seg(S, 3.12 + m.rank * .35, 3.32 + m.rank * .35));
      const dt = seg(S, 5.0 + m.rank * .25, 5.18 + m.rank * .25); a *= 1 - dt;
      const [x, y, z] = crowdPos(m, zt);
      const s = z * (1 - .4 * dt);
      const drift = Math.sin(T * .9 + m.r2 * 6) * 3 * U * still;
      club(x, y + drift, s, m.color, { a, lift: 1, blocks: m.blocks, expr: m.ours ? 'sad' : 'flat', rot: Math.sin(T * .7 + m.r2 * 4) * .03 * still });
      m.top = [x, y + drift - stackTop(m.nb) * s * U - 4 * U];
    }
    shareLinks();
    for (const m of clubs) {
      const r = m.r2;
      const pop = seg(S, 3.45 + r * .35, 3.56 + r * .35);
      const f = seg(S, 4.0 + r * .18, 4.12 + r * .18);
      const out = m.pick >= 0 ? seg(S, 4.3, 4.42) : seg(S, 4.85, 5.0);
      if (pop > 0 && out < 1) bubble(m.top[0], m.top[1], f < .5 ? (m.ours ? '籌備營隊中…' : '…') : '？',
        { fs: m.ours ? 11 : 10.5, sc: back(pop), flip: Math.abs(Math.cos(f * Math.PI)), a: 1 - out });
      if (m.pick >= 0) {
        const p = seg(S, 4.38 + m.pick * .06, 4.5 + m.pick * .06), fa = 1 - seg(S, 5.0, 5.12);
        if (p > 0 && fa > 0) bubble(m.top[0], m.top[1], LABELS[m.pick], { fs: 12, sc: back(p), a: fa, bg: C.lime });
      }
    }
  }

  function netGeom(S) {
    const e1 = eio(seg(S, 6.95, 7.6)), e2 = eio(seg(S, 7.9, 8.4));
    const k = S < 7.9 ? lerp(1, .55, e1) : lerp(.55, .40, e2);
    const cy = S < 7.9 ? lerp(H * .68, H * .60, e1) : lerp(H * .60, H * .47, e2);
    return { k, cy, Th: S < 7.9 ? lerp(Math.min(H * .48, W * 1.15), Math.min(H * .52, W * 1.2), e1) : Math.min(H * .52, W * 1.2) };
  }
  const tpos = (n, g) => [W / 2 + n.x * g.Th * g.k, g.cy + n.y * g.Th * g.k];

  function netScene(S) {
    const na = 1 - seg(S, 9.05, 9.5); if (na <= 0) return;
    const g = netGeom(S), zc = ZC();
    for (const n of nodes) {
      const [tx, ty] = tpos(n, g);
      if (n.m) {
        const m = n.m, f = eio(seg(S, 5.2 + m.r2 * .3, 5.55 + m.r2 * .3));
        const [sx, sy] = crowdPos(m, 1);
        n.px = lerp(sx, tx, f); n.py = lerp(sy - 70 * zc * U, ty, f);
        n.a = seg(S, 5.0 + m.rank * .25, 5.18 + m.rank * .25);
      } else { n.px = tx; n.py = ty; n.a = seg(S, 5.45 + n.r * .25, 5.6 + n.r * .25); }
    }
    c.save(); c.globalAlpha = na;
    const ia = seg(S, 6.95, 7.35);
    if (ia > 0) {
      const poly = (dx, dy) => { c.beginPath(); TW.forEach(([x, y], i) => { const X = W / 2 + x * 1.14 * g.Th * g.k + dx, Y = g.cy + y * 1.06 * g.Th * g.k + dy; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
      c.globalAlpha = na * ia;
      c.fillStyle = SH; poly(5 * U, 4 * U); c.fill();
      c.fillStyle = C.green2; poly(0, 0); c.fill();
      c.strokeStyle = 'rgba(214,236,110,.7)'; c.lineWidth = 2 * U; c.stroke();
      c.globalAlpha = na;
    }
    const lw = Math.max(.6, g.k);
    c.globalCompositeOperation = 'lighter';
    const pathAll = (w, col) => {
      c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
      for (const e of edges) {
        const p = eo(seg(S, 5.55 + e.key * .35, 5.7 + e.key * .35)); if (p <= 0) continue;
        const A = nodes[e.a], B = nodes[e.b]; c.moveTo(A.px, A.py); c.lineTo(lerp(A.px, B.px, p), lerp(A.py, B.py, p));
      }
      c.stroke();
    };
    pathAll(7 * U * lw, 'rgba(214,236,110,.13)');
    pathAll(3 * U * lw, 'rgba(214,236,110,.32)');
    pathAll(1.2 * U * lw, 'rgba(238,255,170,.95)');
    const pa = seg(S, 5.85, 6.1);
    if (pa > 0) for (let i = 0; i < edges.length; i += 3) {
      const e = edges[i], u = (T * .45 + e.ph) % 1, A = nodes[e.a], B = nodes[e.b];
      c.fillStyle = `rgba(255,255,225,${.9 * pa})`; dot(lerp(A.px, B.px, u), lerp(A.py, B.py, u), 2 * U * lw);
    }
    for (const n of nodes) {
      if (n.a <= 0) continue; const r = (n.m ? 4.4 : 3) * U * Math.max(.65, g.k);
      c.fillStyle = `rgba(214,236,110,${.24 * n.a})`; dot(n.px, n.py, r * 3.4);
    }
    c.globalCompositeOperation = 'source-over';
    for (const n of nodes) {
      if (n.a <= 0) continue; const ours = n.m && n.m.ours; const r = (n.m ? 4.4 : 3) * U * Math.max(.65, g.k);
      c.globalAlpha = na * n.a; c.fillStyle = ours ? C.salmon : C.cream; dot(n.px, n.py, r);
    }
    c.restore();
  }

  function dawnScene(S) {
    const g = netGeom(S), still = RM ? 0 : 1;
    const seaT = eio(seg(S, 7.9, 8.3)), seaTop = lerp(H + 30, H * .72, seaT);
    const m9 = eio(seg(S, 9.0, 9.5));
    const kBase = seaTop + H * .155, kW = lerp(250, 232, m9) * U, kH = 24 * U;
    const sideX = sg => W / 2 + sg * (W / 2 - 38 * U), sW = 64 * U, sH = 16 * U;
    if (seaT > 0) sea(seaTop);

    const a9 = seg(S, 9.0, 9.35);
    if (a9 > 0) {
      [-1, 1].forEach(sg => {
        const ix = sideX(sg); islet(ix, kBase - 2 * U, sW, sH, a9);
        c.save(); c.globalAlpha = a9; c.globalCompositeOperation = 'lighter';
        const x0 = W / 2 + sg * (kW / 2 - 12 * U), x1 = ix - sg * 24 * U, y = kBase - 6 * U, cy = kBase - 58 * U;
        [[7, .16], [3, .4], [1.3, .95]].forEach(([w, al]) => { c.strokeStyle = `rgba(214,236,110,${al})`; c.lineWidth = w * U; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, cy, x1, y); c.stroke(); });
        c.restore();
      });
    }
    if (seaT > 0) islet(W / 2, kBase, kW, kH);

    const en = eo(seg(S, 7.15, 7.5)), mv = eio(seg(S, 7.9, 8.3));
    const fig = sg => {
      let x = lerp(W / 2 + sg * (W / 2 + 70 * U), W / 2 + sg * W * .29, en), y = H * .87, s = 1.0;
      x = lerp(x, W / 2 + sg * W * .35, mv); y = lerp(y, H * .64, mv); s = lerp(s, .78, mv);
      const ix = sideX(sg);
      x = lerp(x, ix, m9); y = lerp(y, isTop(ix, kBase - 2 * U, sW, sH, ix) + 2 * U, m9); s = lerp(s, .46, m9);
      return [x, y, s];
    };
    const [xL, yL, sL] = fig(-1), [xR, yR, sR] = fig(1);
    const la = seg(S, 7.35, 7.55) * (1 - seg(S, 7.95, 8.1));
    const lk = seg(S, 7.45, 7.6) * (1 - seg(S, 7.95, 8.1));
    if (lk > 0) {
      c.save(); c.globalAlpha = lk; c.setLineDash([6 * U, 7 * U]); c.lineDashOffset = -T * 24 * still; c.lineWidth = 2.4 * U; c.lineCap = 'round';
      [[xL, yL, sL, -1, C.gold], [xR, yR, sR, 1, C.aqua]].forEach(([x, y, s, sg, col]) => {
        const hy = y - 112 * s * U, ex = W / 2 + sg * .16 * g.Th * g.k, ey = g.cy + .18 * g.Th * g.k;
        c.strokeStyle = col; c.beginPath(); c.moveTo(x, hy); c.quadraticCurveTo(x, ey - 20 * U, ex, ey); c.stroke();
      });
      c.restore();
    }
    if (en > 0) {
      person(xL, yL, sL, C.gold, { arms: 'hold', item: 'box', expr: 'smile' });
      person(xR, yR, sR, C.teal, { arms: 'hold', item: 'book', expr: 'smile' });
      tag(xL, yL + 10 * U, '企業與基金會', la); tag(xR, yR + 10 * U, '教育組織與學校', la);
    }

    const amt = seg(S, 8.0, 8.4) * (1 - seg(S, 9.1, 9.45));
    if (amt > 0) {
      const srcs = [[W / 2, g.cy + .5 * g.Th * g.k], [xL + 20 * sL * U, yL - 46 * sL * U], [xR - 20 * sR * U, yR - 46 * sR * U]];
      const M = [W / 2, seaTop + H * .055], E = [W / 2, kBase - kH - 58 * U];
      const ctl = s => [lerp(s[0], M[0], .15), lerp(s[1], M[1], .85)];
      const cols = [[214, 236, 110], [247, 201, 72], [111, 207, 213]];
      c.save(); c.lineCap = 'round';
      srcs.forEach((s, i) => { const [cx, cy] = ctl(s); c.strokeStyle = `rgba(${cols[i]},${.16 * amt})`; c.lineWidth = 16 * U; c.beginPath(); c.moveTo(s[0], s[1]); c.quadraticCurveTo(cx, cy, M[0], M[1]); c.stroke(); });
      c.strokeStyle = `rgba(255,253,246,${.18 * amt})`; c.lineWidth = 26 * U; c.beginPath(); c.moveTo(M[0], M[1]); c.lineTo(E[0], E[1]); c.stroke();
      const pt = (p, u) => {
        if (u < .62) { const q = u / .62, s = srcs[p.src], [cx, cy] = ctl(s); return [qb(s[0], cx, M[0], q) + Math.sin(q * 9 + p.ph * 20) * 5 * U, qb(s[1], cy, M[1], q)]; }
        const q = (u - .62) / .38; return [lerp(M[0], E[0], q) + Math.sin(q * 12 + p.ph * 20) * 9 * U * (1 - q * .6), lerp(M[1], E[1], q)];
      };
      PARTS.forEach(p => {
        if (p.i / PARTS.length > amt) return;
        const u = (T * .12 * p.sp + p.ph) % 1, u0 = Math.max(0, u - .018);
        const [x, y] = pt(p, u), [x0, y0] = pt(p, u0), al = Math.sin(Math.PI * u);
        c.strokeStyle = `rgba(${cols[p.src]},${.9 * al})`; c.lineWidth = 2.6 * U; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke();
        c.fillStyle = `rgba(255,253,246,${.9 * al})`; dot(x, y, 1.2 * U);
      });
      c.restore();
    }

    if (seaT > 0) {
      const gk = seg(S, 8.45, 8.75);
      if (gk > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const u = (T * .3 + i / 12) % 1; c.fillStyle = `rgba(238,255,170,${.7 * gk * (1 - u)})`; dot(W / 2 + Math.sin(i * 2.3) * kW * .45, kBase - kH - 20 * U - u * 90 * U, 1.8 * U); } c.restore(); }
      // our club comes home, standing behind the children
      const h9 = eo(seg(S, 9.05, 9.4));
      if (h9 > 0) [-36, 0, 36].forEach((dx, i) => {
        const x = W / 2 + dx * U;
        person(x, lerp(H + 90, isTop(W / 2, kBase, kW, kH, x) + 2 * U, clamp(h9 * 1.2 - i * .1)), .5, C.salmon, { arms: i === 1 ? 'up' : 'down', expr: 'smile', glow: .4 * h9 });
      });
      KIDS_8.forEach((dx0, i) => {
        const dx = lerp(dx0, KIDS_9[i], m9), x = W / 2 + dx * U, j = Math.abs(Math.sin(T * 3.1 + i * 1.4)) * 7 * U * gk * still;
        person(x, isTop(W / 2, kBase, kW, kH, x) + 2 * U - j, lerp(.56, .48, m9), KCOL[i],
          { expr: gk > .5 ? 'smile' : 'flat', arms: gk > .5 && i % 2 ? 'up' : 'down', glow: gk * (1 - m9 * .5) });
      });
    }
  }

  const root = document.documentElement;
  // the two "other side" sections hold the old timeline still while the camera pans
  // 5–8.2: other side + sharing (story clock held); 8.2–8.62: lights fly into Taiwan; 8.62–9: the finished network rests
  const mapS = Sr => Sr < 5 ? Sr : Sr < 8.25 ? 4.98 : Sr < 8.65 ? 5 + (Sr - 8.25) * (.9 / .4) : Sr < 9 ? 5.9 + (Sr - 8.65) * (.1 / .35) : Sr - 3;
  function draw(Sr) {
    const S = mapS(Sr);
    PAN = W * 1.15 * (eio(seg(Sr, 6.0, 6.6)) + eio(seg(Sr, 7.0, 7.6))) * (1 - eio(seg(Sr, 8.0, 8.25))); SR = Sr;
    const [g1, g2] = bgAt(S);
    root.style.setProperty('--scrim', g1); root.style.setProperty('--scrim0', g1.replace('rgb(', 'rgba(').replace(')', ',0)'));
    const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, g1); gr.addColorStop(1, g2);
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    if (S < 2.95) early(S);
    underwater(S);
    stars(S);
    if (S >= 2.95 && S < 5.6 && PAN < W * 1.3) crowdScene(S);
    if (Sr > 5.9 && Sr < 8.3) partners(Sr);
    if (S >= 4.98) netScene(S);
    if (S >= 7.0) dawnScene(S);
  }

  // "the other side of the sea": education organisations, then sponsors, each holding resources that can't find students
  const PROPS = Array.from({ length: 7 }, (_, i) => ({ a: i / 7 * Math.PI * 2 + .3, r: .8 + (i % 3) * .14, ph: i * 1.7 }));
  function partners(Sr) {
    const still = RM ? 0 : 1;
    [{ wx: 1.15, kind: 'edu' }, { wx: 2.3, kind: 'sponsor' }].forEach(p => {
      const x = W / 2 + p.wx * W - PAN; if (Math.abs(x - W / 2) > W * 1.1) return;
      const near = clamp(1 - Math.abs(x - W / 2) / (W * .55));
      const base = H * .81, iw = 230 * U, ih = 34 * U, feet = isTop(x, base, iw, ih, x) + 2 * U;
      const halo = c.createRadialGradient(x, H * .62, 10, x, H * .62, 210 * U);
      const hc = p.kind === 'edu' ? '111,207,213' : '247,201,72';
      halo.addColorStop(0, `rgba(${hc},.30)`); halo.addColorStop(1, `rgba(${hc},0)`);
      c.fillStyle = halo; dot(x, H * .62, 210 * U);
      if (p.kind === 'edu') {
        const bx = x - 128 * U, by = H * .47, bw = 104 * U, bh = 68 * U;
        c.fillStyle = SH; rr(bx + 4 * U, by + 4 * U, bw, bh, 5 * U); c.fill();
        c.fillStyle = '#B98B5E'; rr(bx - 5 * U, by - 5 * U, bw + 10 * U, bh + 10 * U, 6 * U); c.fill();
        c.fillStyle = '#2F5A46'; rr(bx, by, bw, bh, 3 * U); c.fill();
        c.strokeStyle = 'rgba(255,253,246,.8)'; c.lineWidth = 2 * U; c.lineCap = 'round'; c.beginPath();
        c.moveTo(bx + 12 * U, by + 18 * U); c.lineTo(bx + 62 * U, by + 18 * U); c.moveTo(bx + 12 * U, by + 32 * U); c.lineTo(bx + 82 * U, by + 32 * U); c.moveTo(bx + 12 * U, by + 46 * U); c.lineTo(bx + 50 * U, by + 46 * U); c.stroke();
      }
      islet(x, base, iw, ih);
      person(x, feet, 1.05, p.kind === 'edu' ? C.teal : C.gold, { arms: 'hold', item: p.kind === 'edu' ? 'book' : 'box', expr: 'flat' });
      PROPS.forEach((q, i) => {
        const px = x + Math.cos(q.a) * 128 * U * q.r, py = H * .60 + Math.sin(q.a) * 64 * U * q.r + Math.sin(T * 1.3 + q.ph) * 5 * U * still;
        c.save(); c.translate(px, py); c.rotate(Math.sin(T * .8 + q.ph) * .15 * still);
        if (p.kind === 'edu') {
          c.fillStyle = SH; rr(-11 * U + 3 * U, -14 * U + 3 * U, 22 * U, 28 * U, 3 * U); c.fill();
          c.fillStyle = C.cream; rr(-11 * U, -14 * U, 22 * U, 28 * U, 3 * U); c.fill();
          c.strokeStyle = C.teal; c.lineWidth = 2 * U; c.beginPath(); c.moveTo(-6 * U, -6 * U); c.lineTo(6 * U, -6 * U); c.moveTo(-6 * U, 0); c.lineTo(6 * U, 0); c.moveTo(-6 * U, 6 * U); c.lineTo(2 * U, 6 * U); c.stroke();
        } else if (i % 2) {
          c.fillStyle = SH; dot(3 * U, 3 * U, 11 * U); c.fillStyle = C.gold; dot(0, 0, 11 * U);
          c.strokeStyle = '#C99A1F'; c.lineWidth = 2 * U; c.beginPath(); c.arc(0, 0, 6.5 * U, 0, Math.PI * 2); c.stroke();
        } else {
          c.fillStyle = SH; rr(-11 * U + 3 * U, -9 * U + 3 * U, 22 * U, 18 * U, 3 * U); c.fill();
          c.fillStyle = C.coral; rr(-11 * U, -9 * U, 22 * U, 18 * U, 3 * U); c.fill();
          c.fillStyle = C.gold; c.fillRect(-2 * U, -9 * U, 4 * U, 18 * U);
        }
        c.restore();
      });
      bubble(x, feet - 150 * U, p.kind === 'edu' ? '這些教案，誰用得上？' : '想幫忙，要去哪找學生？', { fs: 12, sc: back(clamp(near * 1.6 - .4)), a: near });
    });
  }

  // ---------- scroll → timeline ----------
  const secs = [...main.querySelectorAll(':scope > section')] as HTMLElement[];
  let tops = [];
  function measure() { tops = secs.map(el => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.height]; }); }
  let active = 0;
  function targetS() {
    const y = scrollY + innerHeight * .35; let S = 0; active = 0;
    for (let i = 0; i < tops.length; i++) { const [t, h] = tops[i]; if (y >= t) { S = i + Math.min(1, (y - t) / h); active = i; } }
    return S;
  }
  // only the current scene's text is shown; a backdrop in the scene's colour sits under it
  let shown = -1;
  function syncCopy() {
    if (active !== shown) { secs.forEach((s, i) => { s.dataset.active = String(i === active); }); shown = active; }
    const cp = secs[active] && secs[active].querySelector('.copy, .head');
    let b = 0; if (cp) { const r = cp.getBoundingClientRect(); b = Math.max(0, r.bottom); }
    root.style.setProperty('--scrim-h', Math.round(b + 18) + 'px');
  }
  let lastW = 0, lastH = 0;
  function resize() {
    const r = cv.getBoundingClientRect();
    if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 120) { measure(); return; }
    lastW = r.width; lastH = r.height; W = r.width; H = r.height; DPR = Math.min(2, devicePixelRatio || 1);
    U = Math.min(W / 390, H / 760); cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); measure();
  }
  addEventListener('resize', resize);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  ro && ro.observe(main);
  resize();

  const TONES = secs.map(s => s.dataset.tone || 'light');
  let Sd = targetS(), tone = '';
  function frame(now) {
    if (!alive) return;
    T = (RM ? .25 : 1) * now / 1000;
    const tgt = targetS(); Sd += (tgt - Sd) * (RM ? 1 : .085); if (Math.abs(tgt - Sd) < .0005) Sd = tgt;
    c.setTransform(DPR, 0, 0, DPR, 0, 0); draw(Sd); syncCopy();
    const nt = TONES[Math.min(TONES.length - 1, Math.floor(Sd))]; if (nt !== tone) { tone = nt; onTone(nt); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  if (document.fonts && document.fonts.load) {
    document.fonts.load(`13px "Huninn"`, '招生經費教案交接籌備營隊中…？教案分享志工培訓經費申請招生經驗器材出借交接手冊合作學校講師人脈企業與基金會教育組織與學校').catch(() => {});
    document.fonts.ready.then(measure).catch(() => {});
  }

  return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('resize', resize); ro && ro.disconnect(); };
}

// Taiwan outline shared with the map page (normalised: x≈±0.26, y -0.5..0.5, north up)
export const TAIWAN_LL: [number, number][] = [[121.52,25.30],[121.75,25.16],[122.00,25.02],[121.86,24.80],[121.84,24.50],[121.70,24.15],[121.60,23.90],[121.50,23.50],[121.38,23.15],[121.18,22.80],[120.98,22.50],[120.88,22.20],[120.85,21.92],[120.72,21.94],[120.62,22.30],[120.42,22.50],[120.26,22.66],[120.12,23.00],[120.14,23.40],[120.25,23.75],[120.38,24.05],[120.60,24.35],[120.85,24.70],[121.02,24.95],[121.20,25.08],[121.40,25.18]];
