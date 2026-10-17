/* Agents Desk billing engine — one source of truth for the pricing page, checkout and dashboard.
   All money is integer euro CENTS. Nothing is rounded twice; every displayed total is the sum of its displayed lines.

   Rules (modelled on how Claude bills):
   - One price list in euros. VAT depends on the billing country and buyer type.
   - Yearly = 12 × monthly − 10%, rounded down to the cent. Basic is monthly only.
   - Agency plan = Elite price × seats (2–10). No volume discount; bigger deals go through sales.
   - Coupons apply to the plan amount before VAT. VAT is charged on what is actually paid.
   - Upgrades apply now: a new period starts today and the unused part of the current period is credited.
     If the credit is larger than the new charge, the rest is kept as account credit for future invoices.
   - Downgrades and switching yearly → monthly apply at the end of the paid period.
   - Account credit is applied to the next invoices automatically, before VAT. */
(function () {
  const PRICE = { basic: 699, pro: 999, elite: 1499 };       // net cents per month (Oct 2026 pricing)
  const YEARLY = { basic: false, pro: false, elite: false, team: false }; // yearly billing paused for now
  const YEARLY_OFF_BP = 1000;                                   // 10.00 % in basis points
  const TEAM = { min: 2, max: 10 };
  const NAMES = { basic: 'Basic', pro: 'Pro', elite: 'Elite', team: 'Agency' };

  /* VAT in basis points (19 % = 1900). null = cannot be shown up front (US sales tax). */
  const COUNTRIES = [
    { id: 'DE', name: 'Germany', vat: 1900, tz: ['Europe/Berlin'] },
    { id: 'AT', name: 'Austria', vat: 2000, tz: ['Europe/Vienna'] },
    { id: 'BE', name: 'Belgium', vat: 2100, tz: ['Europe/Brussels'] },
    { id: 'FR', name: 'France', vat: 2000, tz: ['Europe/Paris'] },
    { id: 'IE', name: 'Ireland', vat: 2300, tz: ['Europe/Dublin'] },
    { id: 'IT', name: 'Italy', vat: 2200, tz: ['Europe/Rome'] },
    { id: 'NL', name: 'Netherlands', vat: 2100, tz: ['Europe/Amsterdam'] },
    { id: 'PT', name: 'Portugal', vat: 2300, tz: ['Europe/Lisbon'] },
    { id: 'ES', name: 'Spain', vat: 2100, tz: ['Europe/Madrid'] },
    { id: 'GB', name: 'United Kingdom', vat: 2000, tz: ['Europe/London'] },
    { id: 'CH', name: 'Switzerland', vat: 810, tz: ['Europe/Zurich'] },
    { id: 'US', name: 'United States', vat: 0, tz: ['America/'] },
    { id: 'XX', name: 'Another country', vat: 0, tz: [] },
  ];
  const HOME = 'DE';

  /* demo coupons. duration: once = first payment, repeating = first N payments, forever */
  const COUPONS = {
    WELCOME10: { pct: 10, duration: 'once', label: '10% off your first payment' },
    AGENT20: { pct: 20, duration: 'repeating', times: 3, only: 'monthly', label: '20% off your first 3 monthly payments' },
    YEARLY15: { pct: 15, duration: 'once', only: 'yearly', label: '15% off your first yearly payment' },
    AGENCY10: { pct: 10, duration: 'forever', team: true, label: '10% off every agency payment' },
  };

  /* ---------- helpers ---------- */
  const fmt = (c, opts = {}) => {
    const neg = c < 0, v = Math.abs(c) / 100;
    const s = '€' + v.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? '−' : '') + s;
  };
  const pct = (c, bp) => Math.round(c * bp / 10000);            // half-up to the cent (c is always ≥ 0 here)
  const country = id => COUNTRIES.find(c => c.id === id) || COUNTRIES.find(c => c.id === HOME);
  const guessCountry = () => {
    let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    const hit = COUNTRIES.find(c => c.tz.some(z => tz.startsWith(z)));
    return hit ? hit.id : (tz.startsWith('Europe/') ? HOME : 'XX');
  };

  /* ---------- prices ---------- */
  const hasYearly = plan => !!YEARLY[plan];
  const effPeriod = (plan, period) => period === 'yearly' && hasYearly(plan) ? 'yearly' : 'monthly';
  const yearlyNet = plan => Math.floor(PRICE[plan] * 12 * (10000 - YEARLY_OFF_BP) / 10000);
  /* net cents charged per billing period */
  function planNet(plan, period, seats = 1) {
    if (plan === 'team') return planNet('elite', period) * clampSeats(seats);
    return effPeriod(plan, period) === 'yearly' ? yearlyNet(plan) : PRICE[plan];
  }
  /* what we show as "per month": the yearly price spread over 12 months, rounded down */
  function perMonth(plan, period, seats = 1) {
    const p = effPeriod(plan, period), n = planNet(plan, p, seats);
    return p === 'yearly' ? Math.floor(n / 12) : n;
  }
  const yearlySaving = (plan, seats = 1) => hasYearly(plan) ? planNet(plan, 'monthly', seats) * 12 - planNet(plan, 'yearly', seats) : 0;
  const clampSeats = n => Math.max(TEAM.min, Math.min(TEAM.max, n | 0));

  /* ---------- tax ---------- */
  /* vatOk: a business only gets the reverse charge with a VAT ID that was verified for the same country */
  function tax(countryId, buyer, vatOk = true) {
    const c = country(countryId);
    if (c.vat === null) return { mode: 'unknown', bp: 0, c };
    if (!c.vat) return { mode: 'none', bp: 0, c };
    if (buyer === 'business' && vatOk && c.id !== HOME) return { mode: 'reverse', bp: 0, c };
    return { mode: 'add', bp: c.vat, c, incl: buyer === 'private' };
  }
  /* a net amount as the buyer sees it on the page (private buyers see VAT included) */
  function shown(net, countryId, buyer, vatOk = true) {
    const t = tax(countryId, buyer, vatOk);
    return t.mode === 'add' && t.incl ? net + pct(net, t.bp) : net;
  }
  /* every price the buyer reads for a plan, derived from the amounts that are actually charged,
     so "per month", "billed yearly" and "you save" always agree with each other */
  function display(plan, period, { seats = 1, country: cid = HOME, buyer = 'business', vatOk = true } = {}) {
    const p = effPeriod(plan, period), sh = c => shown(c, cid, buyer, vatOk);
    const month = sh(planNet(plan, 'monthly', seats));
    if (p === 'monthly') return { period: p, perMonth: month, charge: month, saving: 0 };
    const year = sh(planNet(plan, 'yearly', seats));
    return { period: p, perMonth: Math.floor(year / 12), charge: year, saving: month * 12 - year };
  }

  /* ---------- coupons ---------- */
  function checkCoupon(code, { plan, period }) {
    const k = String(code || '').trim().toUpperCase();
    if (!k) return { ok: false, error: '' };
    const c = COUPONS[k];
    if (!c) return { ok: false, error: 'This code isn\'t valid.' };
    const p = effPeriod(plan, period);
    if (c.only && c.only !== p) return { ok: false, error: `This code only works with ${c.only} billing.` };
    if (c.team && plan !== 'team') return { ok: false, error: 'This code is for agency plans.' };
    return { ok: true, code: k, ...c };
  }
  /* does the coupon still apply to payment number n (0 = first payment)? */
  const couponApplies = (cp, n) => !!cp && (cp.duration === 'forever' || (cp.duration === 'once' && n === 0) || (cp.duration === 'repeating' && n < cp.times));

  /* ---------- the quote: every number the checkout shows comes from here ---------- */
  function quote({ plan, period, seats = 1, country: cid, buyer = 'business', vatOk = true, coupon = null, credit = 0, payIndex = 0, creditLabel = 'Account credit' }) {
    const p = effPeriod(plan, period), every = p === 'yearly' ? 'year' : 'month';
    const sub = planNet(plan, p, seats);
    const cp = coupon && couponApplies(coupon, payIndex) ? coupon : null;
    const discount = cp ? pct(sub, cp.pct * 100) : 0;
    const afterDiscount = sub - discount;
    const creditUsed = Math.min(credit, afterDiscount);
    const net = afterDiscount - creditUsed;
    const t = tax(cid, buyer, vatOk);
    const vat = t.mode === 'add' ? pct(net, t.bp) : 0;
    const total = net + vat;
    const label = plan === 'team' ? `Agency plan · ${clampSeats(seats)} seats · ${p}` : `${NAMES[plan]} · ${p}`;
    const lines = [{ k: 'plan', label, c: sub, note: plan === 'team' ? `${clampSeats(seats)} × ${fmt(planNet('elite', p))}` : '' }];
    if (discount) lines.push({ k: 'discount', label: `${cp.code} · ${cp.pct}% off`, c: -discount });
    if (creditUsed) lines.push({ k: 'credit', label: creditLabel, c: -creditUsed });
    return {
      plan, period: p, every, seats: clampSeats(seats), sub, discount, creditUsed, net, vat, total, tax: t, lines, coupon: cp,
      taxLabel: t.mode === 'add' ? `VAT ${t.bp / 100}% (${t.c.name})` : t.mode === 'reverse' ? 'VAT · reverse charge' : t.mode === 'none' ? 'VAT · not charged' : 'Sales tax',
      taxValue: t.mode === 'add' ? fmt(vat) : t.mode === 'reverse' ? 'Not added' : t.mode === 'none' ? '€0.00' : 'Added where it applies',
    };
  }
  /* the payment after this one (coupons may have run out) */
  const nextQuote = (args) => quote({ ...args, credit: 0, payIndex: (args.payIndex || 0) + 1 });

  /* ---------- plan changes (dashboard) ---------- */
  const DAY = 864e5;
  const addPeriod = (t, period) => { const d = new Date(t); period === 'yearly' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1); return d.getTime(); };
  const rank = { basic: 0, pro: 1, elite: 2 };
  /* Unused value of the current period, net of any discount that was paid. */
  function unusedCredit(sub, now) {
    if (!sub.periodEnd || !sub.paidSince || !['active', 'canceled'].includes(sub.status)) return 0;
    const total = sub.periodEnd - sub.paidSince, left = Math.max(0, sub.periodEnd - now);
    const paid = sub.lastPaidNet != null ? sub.lastPaidNet : planNet(sub.plan, sub.period);
    return Math.floor(paid * left / total);
  }
  /* returns { kind: 'now'|'scheduled'|'trial'|'start', charge quote, credit, carry } */
  function change(sub, to, toPeriod, now = Date.now()) {
    const p = effPeriod(to, toPeriod);
    /* unverified businesses outside Germany keep paying VAT on plan changes too */
    const base = { plan: to, period: p, country: sub.countryId, buyer: sub.buyer, vatOk: sub.buyer !== 'business' || sub.vatOk !== false };
    if (sub.status === 'trialing' || sub.status === 'trial_canceled') return { kind: 'trial', q: quote({ ...base, coupon: sub.coupon }) };
    if (sub.status === 'expired' || (sub.status === 'canceled' && now >= sub.periodEnd)) return { kind: 'start', q: quote({ ...base, credit: sub.credit || 0 }) };
    const isUp = rank[to] > rank[sub.plan] || (to === sub.plan && p === 'yearly' && sub.period === 'monthly');
    if (!isUp) return { kind: 'scheduled', at: sub.periodEnd, q: quote({ ...base }) };
    const unused = unusedCredit(sub, now), have = (sub.credit || 0) + unused;
    const q = quote({ ...base, credit: have, creditLabel: sub.credit ? `Unused time on ${NAMES[sub.plan]} + account credit` : `Unused time on ${NAMES[sub.plan]}` });
    return { kind: 'now', q, unused, carry: have - q.creditUsed };
  }

  /* ---------- tax evidence: the payment method decides the country ----------
     Live: the payment provider returns the card's issuing country (from its BIN), the IBAN's country,
     or the PayPal / wallet account country. Typed addresses and IP addresses are only supporting evidence.
     Demo: Stripe's public test cards per country, and the IBAN's two-letter prefix. */
  const TEST_CARDS = { '4000000400000008': 'AT', '4000000560000004': 'BE', '4000002500000003': 'FR', '4000002760000016': 'DE', '4000003720000005': 'IE',
    '4000003800000008': 'IT', '4000005280000002': 'NL', '4000006200000007': 'PT', '4000007240000007': 'ES', '4000008260000000': 'GB', '4000007560000009': 'CH', '4242424242424242': 'US' };
  const known = id => COUNTRIES.some(c => c.id === id && c.id !== 'XX');
  function cardCountry(num) {
    const d = String(num || '').replace(/\D/g, '');
    if (d.length < 6) return null;                                   // not enough digits to read the issuer yet
    if (TEST_CARDS[d]) return { id: TEST_CARDS[d], how: 'card' };
    return d.length >= 15 ? { id: 'XX', how: 'card', unknown: true } : null;
  }
  function ibanCountry(iban) {
    const c = String(iban || '').replace(/\s/g, '').toUpperCase().slice(0, 2);
    if (c.length < 2) return null;
    return { id: known(c) ? c : 'XX', how: 'iban', unknown: !known(c) };
  }
  /* VAT ID: format per country (live: VIES / UK HMRC / Swiss UID lookup) */
  const VAT_FORMAT = { DE: /^DE\d{9}$/, AT: /^ATU\d{8}$/, BE: /^BE[01]\d{9}$/, FR: /^FR[0-9A-Z]{2}\d{9}$/, IE: /^IE\d{7}[A-Z]{1,2}$|^IE\d[A-Z+*]\d{5}[A-Z]$/,
    IT: /^IT\d{11}$/, NL: /^NL\d{9}B\d{2}$/, PT: /^PT\d{9}$/, ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, GB: /^GB(\d{9}|\d{12})$/, CH: /^CHE\d{9}(MWST|TVA|IVA)?$/ };
  const cleanVat = v => String(v || '').toUpperCase().replace(/[\s.\-]/g, '');
  function vatCountry(v) { const x = cleanVat(v); return x.startsWith('CHE') ? 'CH' : x.slice(0, 2); }
  function checkVatFormat(v) {
    const x = cleanVat(v), cc = vatCountry(x);
    if (!x) return { ok: false, error: '' };
    if (!VAT_FORMAT[cc]) return { ok: false, error: 'Start with the country code, e.g. DE123456789.' };
    if (!VAT_FORMAT[cc].test(x)) return { ok: false, error: `That doesn't look like a valid ${country(cc).name} VAT ID.` };
    return { ok: true, id: x, cc };
  }
  /* simulated registry lookup; resolves like VIES would */
  function verifyVat(v) {
    const f = checkVatFormat(v);
    return new Promise(res => setTimeout(() => {
      if (!f.ok) return res({ valid: false, error: f.error || 'Enter a VAT ID.' });
      if (/0{6}$/.test(f.id)) return res({ valid: false, error: 'The EU register says this VAT ID is not active.' });
      res({ valid: true, id: f.id, cc: f.cc, name: 'Registered business', at: Date.now() });
    }, 650));
  }

  /* ---------- agency seats (like Claude Team: add seats mid-term, prorated; remove at renewal) ---------- */
  function seatChange(sub, seats, now = Date.now()) {
    const to = clampSeats(seats), from = sub.seats || 1, per = effPeriod('team', sub.period);
    const ctx = { country: sub.countryId, buyer: 'business', vatOk: sub.vatOk !== false };
    const next = quote({ plan: 'team', period: per, seats: to, ...ctx, coupon: sub.coupon, payIndex: sub.payIndex || 0 });
    if (to === from) return { kind: 'none', next };
    if (sub.status === 'trialing' || sub.status === 'trial_canceled') return { kind: 'trial', next };
    if (to < from) return { kind: 'scheduled', at: sub.periodEnd, next };
    const total = sub.periodEnd - sub.paidSince, left = Math.max(0, sub.periodEnd - now), add = to - from;
    const perSeat = planNet('elite', per), days = Math.ceil(left / DAY);
    const net = Math.round(perSeat * add * left / total);
    const t = tax(ctx.country, 'business', ctx.vatOk), vat = t.mode === 'add' ? pct(net, t.bp) : 0;
    const q = { plan: 'team', period: per, seats: to, sub: net, discount: 0, creditUsed: 0, net, vat, total: net + vat, tax: t,
      lines: [{ k: 'seats', label: `${add} extra seat${add > 1 ? 's' : ''} × ${fmt(perSeat)}, for the ${days} days left in this ${per === 'yearly' ? 'year' : 'month'}`, c: net }],
      taxLabel: t.mode === 'add' ? `VAT ${t.bp / 100}% (${t.c.name})` : t.mode === 'reverse' ? 'VAT · reverse charge' : 'VAT · not charged', taxValue: t.mode === 'add' ? fmt(vat) : t.mode === 'reverse' ? 'Not added' : '€0.00' };
    return { kind: 'now', q, next };
  }

  /* ---------- invoices ---------- */
  let seq = 1000;
  function invoiceFrom(q, at, desc, existing = []) {
    seq = Math.max(1000, ...existing.map(i => +String(i.id).replace(/\D/g, '') || 0));
    seq += 1;
    return { id: 'AD-' + seq, at, desc: desc || q.lines[0].label, lines: q.lines.map(l => ({ label: l.label, c: l.c })), net: q.net, vat: q.vat, total: q.total, taxLabel: q.taxLabel };
  }

  window.ADB = { PRICE, TEAM, NAMES, COUNTRIES, COUPONS, HOME, YEARLY_OFF_BP, DAY,
    fmt, pct, display, country, cardCountry, ibanCountry, checkVatFormat, verifyVat, vatCountry, cleanVat, TEST_CARDS, guessCountry, hasYearly, effPeriod, planNet, perMonth, yearlySaving, clampSeats,
    tax, shown, checkCoupon, couponApplies, quote, nextQuote, seatChange, unusedCredit, change, addPeriod, invoiceFrom, rank };
})();
