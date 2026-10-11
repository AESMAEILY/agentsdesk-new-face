/* Agents Desk hero, version 2: a live "number stream" drawn on canvas (sharp at any resolution)
   with the player cards floating in and out of it like the numbers do. Plus a ticker tape.
   SAMPLE DATA: the market values on the ticker are made up for the demo. */
(function () {
  const hero = document.querySelector('.hero-v3');
  if (!hero) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- data ---------------- */
  const PLAYERS = [
    { name: 'Kylian Mbappé', last: 'Mbappé', img: '../mbappe_head.webp', city: 'Madrid', flag: 'fr', origin: 'France', pos: 'CF', club: 'RMA', from: 'PSG', year: '2024', fee: 'Free', value: 180, chg: 0.8 },
    { name: 'Erling Haaland', last: 'Haaland', img: '../haaland_head.webp', city: 'Manchester', flag: 'no', origin: 'Norway', pos: 'ST', club: 'MCI', from: 'BVB', year: '2022', fee: '€60m', value: 175, chg: 2.1 },
    { name: 'Kevin De Bruyne', last: 'De Bruyne', img: '../debruyne_head.webp', city: 'Naples', flag: 'be', origin: 'Belgium', pos: 'CAM', club: 'NAP', from: 'MCI', year: '2025', fee: 'Free', value: 15, chg: -1.4 },
    { name: 'Gabriel Martinelli', last: 'Martinelli', img: '../martinelli_head.webp', city: 'Riyadh', flag: 'br', origin: 'Brazil', pos: 'LW', club: 'HIL', from: 'ARS', year: '2026', fee: '~£60m', value: 55, chg: 3.6 },
  ];
  const CLUBS = {
    RMA: ['Real Madrid', '../rma.webp'], PSG: ['Paris Saint-Germain', '../psg.webp'],
    MCI: ['Manchester City', '../mci.webp'], BVB: ['Borussia Dortmund', '../bvb.webp'],
    NAP: ['Napoli', '../nap.webp'], ARS: ['Arsenal', '../ars.webp'], HIL: ['Al Hilal', '../hil.webp'],
  };
  const FLAGS = {
    fr: '<svg viewBox="0 0 3 2"><path fill="#0055A4" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#EF4135" d="M2 0h1v2H2z"/></svg>',
    be: '<svg viewBox="0 0 3 2"><path d="M0 0h1v2H0z"/><path fill="#FAE042" d="M1 0h1v2H1z"/><path fill="#ED2939" d="M2 0h1v2H2z"/></svg>',
    no: '<svg viewBox="0 0 22 16"><path fill="#BA0C2F" d="M0 0h22v16H0z"/><path fill="#fff" d="M6 0h4v16H6zM0 6h22v4H0z"/><path fill="#00205B" d="M7 0h2v16H7zM0 7h22v2H0z"/></svg>',
    br: '<svg viewBox="0 0 20 14"><path fill="#009C3B" d="M0 0h20v14H0z"/><path fill="#FFDF00" d="M10 1.6 18.4 7 10 12.4 1.6 7z"/><circle cx="10" cy="7" r="3.1" fill="#002776"/></svg>',
  };
  const crest = c => `<span class="gc-crest img" title="${esc(CLUBS[c][0])}"><img src="${CLUBS[c][1]}" alt="${esc(CLUBS[c][0])}"></span>`;
  const fmt = v => '€' + (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + 'm';
  const pct = p => (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p).toFixed(1) + '%';

  /* ---------------- exchange board (canvas): candlestick chart + ticking quote columns ---------------- */
  const cv = hero.querySelector('.nf');
  const ctx = cv.getContext('2d');
  const C = { cyan: [95, 212, 244], orange: [244, 105, 31], oHi: [255, 138, 74], up: [61, 220, 151], dn: [255, 90, 95], ink: [230, 236, 240] };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const mono = getComputedStyle(document.documentElement).getPropertyValue('--f-mono').trim() || 'monospace';
  const CODES = ['RMA','BAR','ATM','MCI','MUN','LIV','ARS','CHE','TOT','NEW','PSG','LYO','MON','BAY','BVB','RBL','B04','JUV','INT','MIL','NAP','ROM','AJA','PSV','BEN','POR','SCP','HIL','NAS','GAL','FEN'];
  const POS = ['ST','CF','LW','RW','CAM','CM','CDM','CB','LB','RB','GK'];
  const m = v => '€' + (v >= 10 ? (Math.round(v * 2) / 2).toString() : v.toFixed(1)) + 'm';

  /* each column is one "market"; rows share a layout: label | value | change */
  const KINDS = [
    { head: 'LIVE DEALS', row: () => { let a = pick(CODES), b = pick(CODES); while (b === a) b = pick(CODES); return { l: `${a} → ${b}`, v: rnd(4, 120) }; } },
    { head: 'MARKET VALUE', row: () => ({ l: `${pick(POS).padEnd(3)} · ${Math.round(rnd(17, 33))}Y`, v: rnd(2, 190) }) },
    { head: 'RELEASE CLAUSES', row: () => ({ l: `${pick(CODES)} · ${Math.round(rnd(2026, 2031))}`, v: rnd(15, 250) }) },
    { head: 'LOANS', row: () => { let a = pick(CODES), b = pick(CODES); while (b === a) b = pick(CODES); return { l: `${a} → ${b}`, v: rnd(0.5, 8), tag: Math.random() < 0.4 ? 'OPT' : '' }; } },
    { head: 'FREE AGENTS', wage: true, row: () => ({ l: `${pick(POS).padEnd(3)} · ${Math.round(rnd(19, 34))}Y`, v: rnd(1, 40), wage: true }) },
  ];
  const ROW = 30; let HEAD = 120;
  let W = 0, H = 0, dpr = 1, cols = [], candles = [], running = false, last = 0, candleT = 0, tickT = 0;

  const makeRow = k => { const r = KINDS[k].row(); r.chg = rnd(-9, 12); r.flash = 0; r.fade = 0; return r; };
  function layout() {
    const colW = W < 520 ? Math.max(170, W / 2) : W < 1000 ? 250 : 290;
    const n = Math.max(1, Math.floor((W - 24) / colW));
    const gap = (W - n * colW) / (n + 1);
    const rows = Math.ceil((H - HEAD) / ROW) + 2;
    cols = Array.from({ length: n }, (_, i) => {
      const k = i % KINDS.length;
      return { k, x: gap + i * (colW + gap), w: colW, off: rnd(0, ROW), speed: rnd(9, 15) * (i % 2 ? 1 : 0.8), rows: Array.from({ length: rows }, () => { const r = makeRow(k); r.fade = 1; return r; }), delay: i * 0.18 };
    });
    // candles across the full width
    const cw = W < 520 ? 10 : 14, count = Math.ceil(W / cw) + 2;
    let p = 100; candles = [];
    for (let i = 0; i < count; i++) candles.push(p = nextCandle(p));
    candles.cw = cw;
  }
  function nextCandle(prev) {
    const o = typeof prev === 'number' ? prev : prev.c;
    const c = Math.max(40, Math.min(160, o + rnd(-6, 6.6)));
    return { o, c, h: Math.max(o, c) + rnd(0.5, 5), l: Math.min(o, c) - rnd(0.5, 5) };
  }
  function resize() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    HEAD = W < 520 ? 96 : 122;
    layout();
    if (!running) frame(performance.now(), true);
  }

  let intro = 0;
  function frame(t, once) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    intro = once && reduce ? 9 : intro + dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* 1. chart grid + candles (lower 60% of the hero) */
    const top = H * 0.32, bot = H * 0.92, ch = bot - top;
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
    for (let y = top; y <= bot + 1; y += ch / 5) { ctx.beginPath(); ctx.moveTo(0, Math.round(y) + .5); ctx.lineTo(W, Math.round(y) + .5); ctx.stroke(); }
    candleT += dt;
    const step = 1.1, cw = candles.cw, shift = (candleT / step) * cw;
    if (candleT >= step) { candleT -= step; candles.shift(); candles.push(nextCandle(candles[candles.length - 1])); }
    let lo = Infinity, hi = -Infinity; for (const c of candles) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); }
    const Y = v => bot - (v - lo) / (hi - lo || 1) * ch;
    const reveal = Math.min(1, intro / 2.2);
    ctx.beginPath(); let started = false;
    candles.forEach((c, i) => {
      const x = i * cw - shift + cw / 2;
      if (x > W * reveal + cw) return;
      const up = c.c >= c.o, col = up ? C.up : C.dn, a = 0.16 + 0.22 * (x / W);
      ctx.strokeStyle = rgba(col, a); ctx.fillStyle = rgba(col, a * 0.9);
      ctx.beginPath(); ctx.moveTo(x, Y(c.h)); ctx.lineTo(x, Y(c.l)); ctx.stroke();
      const y1 = Y(Math.max(c.o, c.c)), y2 = Y(Math.min(c.o, c.c));
      ctx.fillRect(x - cw * 0.3, y1, cw * 0.6, Math.max(1.5, y2 - y1));
    });
    // moving average line in brand orange
    ctx.beginPath(); started = false;
    candles.forEach((c, i) => {
      if (i < 5) return; const x = i * cw - shift + cw / 2; if (x > W * reveal) return;
      let s = 0; for (let j = i - 5; j <= i; j++) s += candles[j].c; const y = Y(s / 6);
      started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true);
    });
    ctx.strokeStyle = 'rgba(244,105,31,.55)'; ctx.lineWidth = 1.6; ctx.shadowColor = 'rgba(244,105,31,.6)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    // price axis on the right
    ctx.font = `500 10px ${mono}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(230,236,240,.28)';
    for (let i = 0; i <= 5; i++) { const v = lo + (hi - lo) * (1 - i / 5); ctx.fillText(m(v), W - 10, top + ch * i / 5 - 7); }

    /* 2. quote columns */
    tickT -= dt;
    if (tickT < 0) {
      tickT = rnd(0.08, 0.22);
      const col = pick(cols), r = pick(col.rows);
      const mv = rnd(-0.06, 0.07); r.v = Math.max(0.5, r.v * (1 + mv)); r.chg = Math.max(-40, Math.min(60, r.chg + mv * 100)); r.flash = mv >= 0 ? 1 : -1;
    }
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = W < 700 ? 0.45 : 1;
    for (const col of cols) {
      const a0 = Math.max(0, Math.min(1, (intro - col.delay) / 0.8));
      if (a0 <= 0) continue;
      // header
      ctx.textAlign = 'left'; ctx.font = `600 10.5px ${mono}`; ctx.fillStyle = rgba(C.oHi, 0.85 * a0);
      ctx.fillText(KINDS[col.k].head, col.x, HEAD - 22);
      ctx.fillStyle = rgba(C.ink, 0.25 * a0); ctx.textAlign = 'right'; ctx.font = `500 9.5px ${mono}`;
      ctx.fillText(KINDS[col.k].wage ? 'WAGE' : 'VALUE   CHG', col.x + col.w, HEAD - 22);
      ctx.fillStyle = rgba(C.ink, 0.12 * a0); ctx.fillRect(col.x, HEAD - 10, col.w, 1);
      // scrolling rows
      col.off += col.speed * dt;
      if (col.off >= ROW) { col.off -= ROW; col.rows.pop(); const r = makeRow(col.k); col.rows.unshift(r); }
      col.rows.forEach((r, i) => {
        const y = HEAD + i * ROW + col.off - ROW + ROW / 2;
        if (y < HEAD - 2 || y > H + ROW) return;
        r.fade = Math.min(1, r.fade + dt * 1.6);
        const edge = Math.min(1, (y - HEAD) / 40, (H - y) / 90);
        const a = Math.max(0, edge) * r.fade * a0;
        if (a <= 0.01) return;
        if (r.flash) {
          ctx.fillStyle = rgba(r.flash > 0 ? C.up : C.dn, 0.16 * Math.abs(r.flash) * a);
          ctx.fillRect(col.x - 6, y - ROW / 2 + 3, col.w + 12, ROW - 6);
          r.flash *= Math.pow(0.12, dt); if (Math.abs(r.flash) < 0.02) r.flash = 0;
        }
        const up = r.chg >= 0;
        ctx.textAlign = 'left'; ctx.font = `500 12px ${mono}`; ctx.fillStyle = rgba(C.ink, 0.5 * a);
        ctx.fillText(r.l + (r.tag ? ' +' + r.tag : ''), col.x, y);
        ctx.textAlign = 'right'; ctx.font = `600 12px ${mono}`;
        if (KINDS[col.k].wage) { ctx.fillStyle = rgba(C.cyan, 0.85 * a); ctx.fillText('€' + Math.round(r.v * 9) + 'k/w', col.x + col.w, y); }
        else {
          ctx.fillStyle = rgba(C.cyan, 0.72 * a); ctx.fillText(m(r.v), col.x + col.w - 74, y);
          ctx.fillStyle = rgba(up ? C.up : C.dn, 0.78 * a);
          ctx.fillText((up ? '▲ ' : '▼ ') + Math.abs(r.chg).toFixed(1) + '%', col.x + col.w, y);
        }
        ctx.fillStyle = rgba(C.ink, 0.05 * a); ctx.fillRect(col.x, Math.round(y + ROW / 2) - 0.5, col.w, 1);
      });
    }
    ctx.globalAlpha = 1;
    if (!once && running) requestAnimationFrame(frame);
  }
  const play = () => { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(frame); };
  const stop = () => { running = false; };

  /* ---------------- floating player cards ---------------- */
  const stage = hero.querySelector('.pc-stage');
  const cardHTML = p => `
    <div class="gc-top">
      <div class="gc-ph"><img src="${p.img}" alt="${esc(p.name)}"></div>
      <div class="gc-id">
        <p class="gc-k"><i></i>${esc(p.city)}</p>
        <h3 class="gc-n">${esc(p.name)}</h3>
        <div class="gc-tags"><span class="gc-flag" role="img" aria-label="${esc(p.origin)}" title="${esc(p.origin)}">${FLAGS[p.flag]}</span><span class="gc-pos">${p.pos}</span></div>
      </div>
    </div>
    <div class="gc-tr">${crest(p.from)}<span class="gc-arr"><i></i></span>${crest(p.club)}<span class="gc-meta"><b>${p.year}</b>${esc(p.fee)}</span></div>`;

  /* slots: positions (in % of the stage) cards take turns on, so they never pile up */
  const SLOTS_WIDE = [[8, 6], [46, 30], [12, 56], [52, 70], [30, 18], [4, 78]];
  const SLOTS_NARROW = [[0, 0], [0, 50]];
  let slotIx = 0, cardIx = 0, live = [], timer = 0;

  function spawnCard() {
    if (!stage) return;
    const narrow = stage.clientWidth < 520;
    const slots = narrow ? SLOTS_NARROW : SLOTS_WIDE;
    const max = narrow ? 1 : 2;
    while (live.length >= max) retire(live.shift());
    let s = slots[slotIx++ % slots.length];
    const p = PLAYERS[cardIx++ % PLAYERS.length];
    const el = document.createElement('div');
    el.className = 'gl-card pc';
    el.innerHTML = cardHTML(p);
    const jx = narrow ? 0 : rnd(-3, 3), jy = narrow ? 0 : rnd(-3, 3);
    el.style.left = (narrow ? 50 : s[0] + jx) + '%';
    el.style.top = (narrow ? 50 : s[1] + jy) + '%';
    if (narrow) el.classList.add('center');
    el.style.setProperty('--dx', rnd(-18, 18).toFixed(0) + 'px');
    el.style.setProperty('--dy', rnd(-26, -10).toFixed(0) + 'px');
    stage.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    live.push(el);
  }
  function retire(el) {
    el.classList.remove('in'); el.classList.add('out');
    setTimeout(() => el.remove(), 1200);
  }
  const loop = () => { spawnCard(); timer = setTimeout(loop, 2800); };
  const startCards = () => { if (!timer && !reduce) loop(); };
  const stopCards = () => { clearTimeout(timer); timer = 0; };

  /* ---------------- ticker tape ---------------- */
  const tape = hero.querySelector('.tape-track');
  if (tape) {
    const one = PLAYERS.map(p => `<span class="tp-i${p.chg < 0 ? ' dn' : ''}"><img src="${CLUBS[p.club][1]}" alt="">${esc(p.last.toUpperCase())} <b>${fmt(p.value)}</b> <em>${pct(p.chg)}</em></span>`).join('')
      + '<span class="tp-i tp-note">Sample market values</span>';
    tape.innerHTML = one + one;
  }

  /* ---------------- lifecycle ---------------- */
  resize();
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => frame(performance.now(), true));
  if (reduce) { if (stage) { spawnCard(); } return; }
  new IntersectionObserver(es => {
    if (es[0].isIntersecting && !document.hidden) { play(); startCards(); } else { stop(); stopCards(); }
  }, { threshold: 0.05 }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); stopCards(); } else if (hero.getBoundingClientRect().bottom > 0) { play(); startCards(); } });
})();
