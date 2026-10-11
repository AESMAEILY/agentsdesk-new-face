/* Agents Desk hero globe: a dotted cobe globe that tours the players' current clubs.
   Pop-up cards show each player's club, league, country of origin and latest transfer.
   DEMO DATA: replace PLAYERS with live data from the desk API later. */
import createGlobe from '../cobe.js';

const PLAYERS = [
  { id:'mbappe', last:'Mbappé', name:'Kylian Mbappé', pos:'CF', img:'../mbappe_head.webp',
    club:'Real Madrid', short:'RMA', league:'LaLiga', city:'Madrid', at:[40.453,-3.688],
    origin:'France', flag:'fr', home:[48.905,2.484],
    from:{ club:'Paris Saint-Germain', short:'PSG', at:[48.841,2.253] }, year:'2024', fee:'Free' },
  { id:'haaland', last:'Haaland', name:'Erling Haaland', pos:'ST', img:'../haaland_head.webp',
    club:'Manchester City', short:'MCI', league:'Premier League', city:'Manchester', at:[53.483,-2.200],
    origin:'Norway', flag:'no', home:[58.735,5.648],
    from:{ club:'Borussia Dortmund', short:'BVB', at:[51.493,7.452] }, year:'2022', fee:'€60m' },
  { id:'debruyne', last:'De Bruyne', name:'Kevin De Bruyne', pos:'CAM', img:'../debruyne_head.webp',
    club:'Napoli', short:'NAP', league:'Serie A', city:'Naples', at:[40.828,14.193],
    origin:'Belgium', flag:'be', home:[51.054,3.717],
    from:{ club:'Manchester City', short:'MCI', at:[53.483,-2.200] }, year:'2025', fee:'Free' },
  { id:'martinelli', last:'Martinelli', name:'Gabriel Martinelli', pos:'LW', img:'../martinelli_head.webp',
    club:'Al Hilal', short:'HIL', league:'Saudi Pro League', city:'Riyadh', at:[24.713,46.675],
    origin:'Brazil', flag:'br', home:[-23.454,-46.533],
    from:{ club:'Arsenal', short:'ARS', at:[51.555,-0.108] }, year:'2026', fee:'~£60m' },
];
const HQ = [48.137, 11.575]; // Agents Desk, Munich

/* Club badges. Put a licensed crest file in `logo` (e.g. 'rma.svg') and it replaces the placeholder. */
const CLUBS = {
  RMA:{ name:'Real Madrid', logo:'../rma.webp', bg:'#FFFFFF', fg:'#00529F', ring:'#FEBE10' },
  PSG:{ name:'Paris Saint-Germain', logo:'../psg.webp', bg:'#004170', fg:'#FFFFFF', ring:'#DA291C' },
  MCI:{ name:'Manchester City', logo:'../mci.webp', bg:'#6CABDD', fg:'#1C2C5B', ring:'#1C2C5B' },
  BVB:{ name:'Borussia Dortmund', logo:'../bvb.webp', bg:'#FDE100', fg:'#000000', ring:'#000000' },
  NAP:{ name:'Napoli', logo:'../nap.webp', bg:'#12A0D7', fg:'#FFFFFF', ring:'#003C82' },
  ARS:{ name:'Arsenal', logo:'../ars.webp', bg:'#EF0107', fg:'#FFFFFF', ring:'#9C824A' },
  HIL:{ name:'Al Hilal', logo:'../hil.webp', bg:'#1E4FBF', fg:'#FFFFFF', ring:'#FFFFFF' },
};
const POS = { CF:'Centre-forward', ST:'Striker', CAM:'Attacking midfielder', LW:'Left winger' };

const FLAGS = {
  fr:'<svg viewBox="0 0 3 2"><path fill="#0055A4" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#EF4135" d="M2 0h1v2H2z"/></svg>',
  be:'<svg viewBox="0 0 3 2"><path d="M0 0h1v2H0z"/><path fill="#FAE042" d="M1 0h1v2H1z"/><path fill="#ED2939" d="M2 0h1v2H2z"/></svg>',
  no:'<svg viewBox="0 0 22 16"><path fill="#BA0C2F" d="M0 0h22v16H0z"/><path fill="#fff" d="M6 0h4v16H6zM0 6h22v4H0z"/><path fill="#00205B" d="M7 0h2v16H7zM0 7h22v2H0z"/></svg>',
  br:'<svg viewBox="0 0 20 14"><path fill="#009C3B" d="M0 0h20v14H0z"/><path fill="#FFDF00" d="M10 1.6 18.4 7 10 12.4 1.6 7z"/><circle cx="10" cy="7" r="3.1" fill="#002776"/></svg>',
};

const wrap = document.getElementById('globe');
if (wrap) init(wrap);

function init(wrap){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = wrap.querySelector('canvas');
  const layer = wrap.querySelector('.gl-layer');
  const card = wrap.querySelector('.gl-card');
  const nav = wrap.parentElement.querySelector('.gl-nav') || document.createElement('div'); // player buttons are optional
  const svg = wrap.querySelector('.gl-lead');
  const foot = wrap.parentElement; // reserves room below the globe for the card on phones
  const line = svg.querySelector('line'), dot = svg.querySelector('circle');
  const R = 0.8, ELEV = 0.03, rad = d => d * Math.PI / 180;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- pins (avatar bubbles) and nav chips ---------- */
  const pins = PLAYERS.map((p, i) => {
    const b = document.createElement('div');
    b.className = 'gl-pin';
    b.innerHTML = `<span class="gl-ring"></span><img src="${p.img}" alt="" decoding="async"><b>${esc(p.last)}</b>`;
    layer.appendChild(b);
    return b;
  });
  const chips = PLAYERS.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'gl-chip';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `Show ${p.name} on the globe`);
    b.innerHTML = `<img src="${p.img}" alt=""><span>${esc(p.last)}</span><i></i>`;
    b.addEventListener('click', () => { userHold = 0; goTo(i, true); });
    nav.appendChild(b);
    return b;
  });

  /* ---------- card ---------- */
  const crest = code => {
    const c = CLUBS[code] || { name: code, bg: '#333', fg: '#fff', ring: '#666' };
    return c.logo
      ? `<span class="gc-crest img" title="${esc(c.name)}"><img src="${c.logo}" alt="${esc(c.name)}"></span>`
      : `<span class="gc-crest" title="${esc(c.name)}" role="img" aria-label="${esc(c.name)}" style="--bg:${c.bg};--fg:${c.fg};--rg:${c.ring}">${code}</span>`;
  };
  const fillCard = p => {
    card.innerHTML = `
      <div class="gc-top">
        <div class="gc-ph"><img src="${p.img}" alt="${esc(p.name)}"></div>
        <div class="gc-id">
          <p class="gc-k"><i></i>${esc(p.city)}</p>
          <h3 class="gc-n">${esc(p.name)}</h3>
          <div class="gc-tags"><span class="gc-flag" role="img" aria-label="${esc(p.origin)}" title="${esc(p.origin)}">${FLAGS[p.flag]}</span><span class="gc-pos" title="${POS[p.pos] || p.pos}">${p.pos}</span></div>
        </div>
      </div>
      <div class="gc-tr" aria-label="Latest transfer: ${esc(p.from.club)} to ${esc(p.club)}, ${p.year}, ${esc(p.fee)}">
        ${crest(p.from.short)}<span class="gc-arr"><i></i></span>${crest(p.short)}
        <span class="gc-meta"><b>${p.year}</b>${esc(p.fee)}</span>
      </div>`;
  };

  /* ---------- globe ---------- */
  const test = document.createElement('canvas');
  const hasGL = !!(test.getContext('webgl2') || test.getContext('webgl'));
  const small = () => wrap.clientWidth < 460;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let size = wrap.clientWidth || 500;
  let phi = 0, theta = 0.3, focus = -1, shown = -1;

  const C = { arcDim:[0.42,0.2,0.1], arcHot:[1,0.55,0.22], pin:[1,0.42,0.12], old:[0.75,0.72,0.7] };
  const arcsFor = f => {
    const a = [];
    PLAYERS.forEach((p, i) => {
      a.push({ from: HQ, to: p.at, color: C.arcDim });
      a.push({ from: p.home, to: p.at, color: C.arcDim });
    });
    if (f >= 0) a.push({ from: PLAYERS[f].from.at, to: PLAYERS[f].at, color: C.arcHot });
    return a;
  };
  const markers = [
    ...PLAYERS.map(p => ({ location: p.at, size: 0.05, color: C.pin })),
    ...PLAYERS.map(p => ({ location: p.from.at, size: 0.025, color: C.old })),
    { location: HQ, size: 0.035, color: [1, 1, 1] },
  ];

  let globe = null;
  if (hasGL) {
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr, width: size, height: size,
      phi, theta, dark: 1, diffuse: 1.25, scale: 1,
      mapSamples: small() ? 14000 : 22000, mapBrightness: 5.2, mapBaseBrightness: 0.02,
      baseColor: [0.2, 0.2, 0.24], markerColor: C.pin, glowColor: [0.32, 0.15, 0.07],
      opacity: 0.9, markers, arcs: arcsFor(-1), arcColor: C.arcDim,
      arcWidth: 0.6, arcHeight: 0.22, markerElevation: ELEV,
    });
  } else wrap.classList.add('no-gl');

  /* same projection cobe uses, so DOM pins sit exactly on the markers */
  const project = (lat, lon, ph, th) => {
    const la = rad(lat), lo = rad(lon) - Math.PI, c = Math.cos(la), r = R + ELEV;
    const p = [-c * Math.cos(lo) * r, Math.sin(la) * r, c * Math.sin(lo) * r];
    const cx = Math.cos(th), cy = Math.cos(ph), sx = Math.sin(th), sy = Math.sin(ph);
    const rx = cy * p[0] + sy * p[2];
    const ry = sy * sx * p[0] + cx * p[1] - cy * sx * p[2];
    const rz = -sy * cx * p[0] + sx * p[1] + cy * cx * p[2];
    return { x: (rx + 1) / 2, y: (-ry + 1) / 2, z: rz };
  };
  /* rotation that brings a location to the front, nudged so the card has room */
  const target = (i, cur) => {
    const [lat, lon] = PLAYERS[i].at;
    let tp = 1.5 * Math.PI - rad(lon) + (small() ? 0 : 0.62);
    const tt = Math.max(-0.5, Math.min(0.7, rad(lat) * 0.72)) - (small() ? 0.18 : 0.05);
    const k = Math.round((cur - tp) / (2 * Math.PI)); tp += k * 2 * Math.PI;
    return [tp, tt];
  };

  /* ---------- tour state ---------- */
  const DWELL = 2800, TRAVEL = 1000;
  let anim = null, dwellStart = 0, userHold = 0, dragging = false;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function goTo(i, now) {
    focus = i;
    chips.forEach((c, k) => { c.classList.toggle('on', k === i); c.setAttribute('aria-pressed', k === i); c.style.removeProperty('--p'); });
    globe && globe.update({ arcs: arcsFor(i) });
    const [tp, tt] = target(i, phi);
    if (reduce || !globe) { phi = tp; theta = tt; anim = null; dwellStart = performance.now(); draw(); return; }
    anim = { p0: phi, t0: theta, p1: tp, t1: tt, s: performance.now(), d: now ? 1200 : TRAVEL };
  }

  function showCard(i) {
    if (i === shown) return;
    shown = i;
    card.classList.remove('in');
    if (i < 0) return;
    fillCard(PLAYERS[i]);
    void card.offsetWidth;
    card.classList.add('in');
  }

  /* ---------- per-frame layout ---------- */
  function draw() {
    if (globe) globe.update({ phi, theta });
    const W = wrap.clientWidth, H = wrap.clientHeight;
    let fp = null;
    PLAYERS.forEach((p, i) => {
      const s = project(p.at[0], p.at[1], phi, theta);
      const a = Math.max(0, Math.min(1, (s.z - 0.05) / 0.25));
      const el = pins[i];
      el.style.transform = `translate3d(${s.x * W}px,${s.y * H}px,0) scale(${0.6 + a * 0.4})`;
      el.style.opacity = a;
      el.classList.toggle('on', i === focus && !anim);
      el.classList.toggle('far', s.z < 0.5);
      if (i === focus) fp = { x: s.x * W, y: s.y * H, z: s.z };
    });

    // card follows the focused pin; hidden while travelling or when the pin turns away
    const showIt = focus >= 0 && !anim && fp && fp.z > 0.25;
    showCard(showIt ? focus : -1);
    if (showIt) {
      const cw = card.offsetWidth, ch = card.offsetHeight;
      let x, y, lx, ly;
      if (small()) {
        x = (W - cw) / 2; y = Math.max(fp.y + 40, H * 0.52); lx = Math.max(x + 24, Math.min(x + cw - 24, fp.x)); ly = y;
        foot.style.paddingBottom = Math.max(0, y + ch - H + 16) + 'px';
      }
      else {
        x = Math.max(-W * 0.12, fp.x - 60 - cw); y = Math.max(8, Math.min(H - ch - 8, fp.y - ch * 0.42));
        lx = x + cw; ly = Math.max(y + 18, Math.min(y + ch - 18, fp.y));
      }
      card.style.transform = `translate3d(${x}px,${y}px,0)`;
      line.setAttribute('x1', fp.x); line.setAttribute('y1', fp.y); line.setAttribute('x2', lx); line.setAttribute('y2', ly);
      dot.setAttribute('cx', lx); dot.setAttribute('cy', ly);
      svg.classList.add('on');
    } else svg.classList.remove('on');
    if (!small()) foot.style.paddingBottom = '';
  }

  /* ---------- loop (runs only while the hero is on screen) ---------- */
  let visible = false, raf = 0, last = performance.now();
  function frame(t) {
    raf = 0;
    const dt = Math.min(64, t - last); last = t;
    if (anim) {
      const k = Math.min(1, (t - anim.s) / anim.d), e = ease(k);
      phi = anim.p0 + (anim.p1 - anim.p0) * e; theta = anim.t0 + (anim.t1 - anim.t0) * e;
      if (k >= 1) { anim = null; dwellStart = t; }
    } else if (!dragging) {
      phi += dt * 0.000045; // the world keeps turning, slowly
      if (userHold > 0) { userHold -= dt; if (userHold <= 0) { userHold = 0; goTo(nearest(), false); } }
      else if (focus >= 0) {
        const k = (t - dwellStart) / DWELL;
        chips[focus].style.setProperty('--p', Math.min(1, k));
        if (k >= 1) goTo((focus + 1) % PLAYERS.length, false);
      }
    }
    draw();
    if (visible && !reduce) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf && visible && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const nearest = () => {
    let best = 0, bz = -9;
    PLAYERS.forEach((p, i) => { const z = project(p.at[0], p.at[1], phi, theta).z; if (z > bz) { bz = z; best = i; } });
    return best;
  };

  /* ---------- drag to spin ---------- */
  if (globe && !reduce) {
    let px = 0, py = 0, id = null;
    canvas.addEventListener('pointerdown', e => {
      id = e.pointerId; px = e.clientX; py = e.clientY; dragging = true; anim = null;
      focus = -1; chips.forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
      globe.update({ arcs: arcsFor(-1) });
      canvas.setPointerCapture(id); wrap.classList.add('grab');
    });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      phi += (e.clientX - px) * 0.006; theta = Math.max(-0.6, Math.min(0.9, theta + (e.clientY - py) * 0.004));
      px = e.clientX; py = e.clientY;
    });
    const up = e => { if (e.pointerId !== id) return; id = null; dragging = false; userHold = 2600; wrap.classList.remove('grab'); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }

  /* ---------- sizing & visibility ---------- */
  const resize = () => {
    size = wrap.clientWidth; if (!size) return;
    globe && globe.update({ width: size, height: size, mapSamples: small() ? 14000 : 22000 });
    draw();
  };
  new ResizeObserver(resize).observe(wrap);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; start(); }, { threshold: 0.05 }).observe(wrap);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { visible = false; } else { visible = wrap.getBoundingClientRect().bottom > 0; start(); } });

  [phi, theta] = target(0, 0);
  phi -= 1.2; // start a little before Madrid so the first fly-in is visible
  draw();
  requestAnimationFrame(() => { wrap.classList.add('ready'); goTo(0, false); if (reduce) draw(); });
}
