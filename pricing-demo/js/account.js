/* Agents Desk dashboard: account menu, trial banner and Settings (Profile, Plan & billing, Usage, Account).
   DEMO: the session and subscription live in this browser's localStorage. Nothing is charged.
   Plan, price and limit data mirror js/pricing.js. */
(function () {
  const X = window.ADX, V = window.ADV;
  if (!X || !V) return;
  const { $, $$, toast, modal } = X;
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
               set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
               del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

  /* ---------------- data: prices, tax, coupons and proration come from js/billing.js (window.ADB), in cents ---------------- */
  const B = window.ADB;
  const REFUND_DAYS = 14, DAY = 864e5, TRIAL_MS = 72 * 36e5;
  const U = Infinity;
  const PLANS = {
    basic: { name: 'Basic', fit: 'For 1–2 clients', yearly: false, rank: 0,
      lim: { agency: 1, calc: 3, req: 3, ai: 3, saved: 3, log: 3, noag: 75 } },
    pro: { name: 'Pro', fit: 'For 3–15 clients', yearly: true, rank: 1,
      lim: { agency: 10, calc: 20, req: 20, ai: 20, saved: 25, log: 25, noag: 250 } },
    elite: { name: 'Elite', fit: 'For 15+ clients or daily scouting', yearly: true, rank: 2,
      lim: { agency: U, calc: 50, req: 50, ai: 50, saved: U, log: U, noag: U } },
  };
  /* extra usage: price per action above the daily limit, net cents (proposal) */
  const CREDIT = { ai: 20, calc: 10, req: 10, agency: 5 };
  const TOPUPS = [1000, 2500, 5000, 10000];
  const ROWS = [
    ['agency', 'Agency views', 'day', 'agency'], ['calc', 'Deal Calculator', 'day', 'calc'], ['req', 'Transfer Requests', 'day', 'requests'],
    ['ai', 'AI Search', 'day', 'ai'], ['saved', 'Saved calculations', 'total', 'calc'], ['log', 'Transfer Log entries', 'total', 'log'],
    ['noag', 'Players with No Agents', 'results', 'noagents'],
  ];

  /* ---------------- session & subscription ---------------- */
  const me = Object.assign({ name: 'Demo Agent', email: 'demo@agentsdesk.football', role: 'Football agent', phone: '', licence: '', company: '' }, ls.get('ad-session', {}));
  const initials = n => (n || 'A').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const now = () => Date.now();
  let sub = ls.get('ad-sub', null);
  const ym = () => new Date().toISOString().slice(0, 7);
  /* migrate older demo data (euros) to the cents-based v2 schema */
  if (sub && (sub.v || 0) < 2) {
    const c = v => Math.round((+v || 0) * 100);
    const cid = (B.COUNTRIES.find(x => x.name === sub.country) || {}).id || 'DE';
    sub = Object.assign(sub, { v: 2, countryId: cid, seats: 1, payIndex: sub.status === 'active' ? 1 : 0, credit: 0, coupon: null,
      invoices: (sub.invoices || []).map(i => { const net = c(i.net), vat = c(i.vat); return { id: i.id, at: i.at, desc: i.desc, lines: [{ label: i.desc, c: net }], net, vat, total: net + vat, taxLabel: 'VAT' }; }) });
    if (sub.credits) { const k = sub.credits; Object.assign(k, { bal: c(k.bal), spent: c(k.spent), cap: k.cap ? c(k.cap) : null, auto: { on: !!(k.auto && k.auto.on), below: c(k.auto ? k.auto.below : 5), add: c(k.auto ? k.auto.add : 25) }, log: (k.log || []).map(l => ({ ...l, amt: c(l.amt) })) }); }
  }
  if (!sub) sub = { v: 2, plan: 'pro', seats: 1, period: 'monthly', status: 'trialing', start: now(), trialEnd: now() + TRIAL_MS, countryId: 'DE', buyer: 'business', payIndex: 0, credit: 0, coupon: null, method: { type: 'card', label: 'Visa •••• 4242', exp: '08/28' }, invoices: [] };
  if (!sub.invoices) sub.invoices = [];
  if (!sub.seats) sub.seats = 1;
  if (!sub.credits) sub.credits = { bal: 0, on: false, cap: null, auto: { on: false, below: 500, add: 2500 }, spent: 0, month: ym(), log: [] };
  if (sub.credits.month !== ym()) { sub.credits.month = ym(); sub.credits.spent = 0; }
  if (!('backup' in sub)) sub.backup = null;
  const saveSub = () => { ls.set('ad-sub', sub); paintChrome(); };

  /* the billing-engine plan key: an Elite subscription with more than one seat is the agency plan */
  const bp = (plan = sub.plan, seats = sub.seats) => seats > 1 && plan === 'elite' ? 'team' : plan;
  const Q = (o = {}) => {
    const plan = o.plan || sub.plan, seats = o.seats || sub.seats;
    return B.quote({ plan: bp(plan, seats), period: o.period || sub.period, seats, country: sub.countryId, buyer: sub.buyer, vatOk: vOK(),
      coupon: 'coupon' in o ? o.coupon : sub.coupon, payIndex: 'payIndex' in o ? o.payIndex : (sub.payIndex || 0), credit: 'credit' in o ? o.credit : (sub.credit || 0) });
  };
  /* charge a plan payment: invoice from the quote, account credit consumed, coupon counter advanced */
  function chargePlan(at, desc) {
    const q = Q(); sub.credit = (sub.credit || 0) - q.creditUsed;
    sub.invoices.unshift(B.invoiceFrom(q, at, desc, sub.invoices));
    sub.lastPaidNet = q.net + q.creditUsed; sub.payIndex = (sub.payIndex || 0) + 1;
    return q;
  }
  /* status housekeeping: trial ends -> active; scheduled change -> applied at renewal; cancelled period ends -> expired */
  function tick() {
    if (sub.status === 'trialing' && now() >= sub.trialEnd) startPaid(sub.trialEnd);
    if (sub.status === 'trial_canceled' && now() >= sub.trialEnd) sub.status = 'expired';
    if (sub.status === 'canceled' && now() >= sub.periodEnd) sub.status = 'expired';
    while (sub.status === 'active' && sub.periodEnd && now() >= sub.periodEnd) {
      if (sub.pending) { sub.plan = sub.pending.plan; sub.period = sub.pending.period; if (sub.pending.seats) sub.seats = sub.pending.seats; sub.pending = null; }
      const at = sub.periodEnd; sub.paidSince = at; sub.periodEnd = addPeriod(at, sub.period); chargePlan(at);
    }
  }
  const addPeriod = B.addPeriod;
  function startPaid(at) { sub.status = 'active'; sub.paidSince = at; sub.periodEnd = addPeriod(at, sub.period); chargePlan(at); }

  /* ---------------- money & dates (cents) ---------------- */
  const money = B.fmt;
  const priceNet = (plan = sub.plan, period = sub.period, seats = sub.seats) => B.planNet(bp(plan, seats), period, seats);
  const perMonth = (plan, period, seats = 1) => B.perMonth(bp(plan, seats), period, seats);
  const vOK = () => sub.buyer !== 'business' || !!sub.vatId || sub.vatOk === undefined;
  const taxMode = () => B.tax(sub.countryId, sub.buyer, vOK()).mode;
  const taxNow = () => B.tax(sub.countryId, sub.buyer, vOK());
  /* private buyers see prices with VAT included, like on the pricing page */
  const show = c => { const t = taxNow(); return t.mode === 'add' && t.incl ? c + B.pct(c, t.bp) : c; };
  const disp = (plan, period, seats = 1) => B.display(bp(plan, seats), period, { seats, country: sub.countryId, buyer: sub.buyer, vatOk: vOK() });
  const taxWord = () => { const t = taxNow(); return ({ add: t.incl ? 'incl. VAT' : '+ VAT', reverse: '· reverse charge', none: '', unknown: '+ tax' })[t.mode]; };
  const planName = (plan = sub.plan, seats = sub.seats) => seats > 1 ? `Elite · ${seats} seats` : PLANS[plan].name;
  const fmt = (t, time = true) => new Date(t).toLocaleString('en-GB', time
    ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
  const left = t => { const ms = Math.max(0, t - now()), d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d ? `${d} day${d > 1 ? 's' : ''} ${h} h` : h ? `${h} h ${m} min` : `${m} min`; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const limitsNow = () => PLANS[sub.plan].lim; /* the trial gives the full plan */
  const isLive = () => ['trialing', 'active', 'trial_canceled', 'canceled'].includes(sub.status);
  const unit = k => CREDIT[k];
  const credLine = () => `AI search ${money(unit('ai'))} · Deal calculation ${money(unit('calc'))} · Transfer request ${money(unit('req'))} · Agency view ${money(unit('agency'))}${taxMode() === 'add' ? ', + VAT' : ''}`;
  const statusChip = () => ({ trialing: 'Trial', trial_canceled: 'Trial ends', active: '', canceled: 'Ends soon', expired: 'Expired' }[sub.status]);

  /* ---------------- chrome: account menu, top-right avatar, trial banner ---------------- */
  const IC = {
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/>',
    bars: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2A3 3 0 0 0 12 8c-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 0 1-2.8-1.2M12 6v2M12 16v2"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
    site: '<path d="M10 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5M14 4h6v6M20 4l-9 9"/>',
  };
  const ic = k => `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

  const foot = $('.sb-foot');
  foot.innerHTML = `<button class="acct" id="acctBtn" aria-haspopup="menu" aria-expanded="false" aria-controls="acctMenu">
      <span class="av acct-av"></span><span class="acct-tx"><b class="acct-name"></b><small class="acct-plan"></small></span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 15l5-5 5 5"/></svg></button>
    <div class="acct-menu" id="acctMenu" role="menu" hidden>
      <div class="am-head"><b class="acct-name"></b><span class="acct-mail"></span></div>
      <a role="menuitem" href="#app-settings">${ic('user')}Profile</a>
      <a role="menuitem" href="#app-billing">${ic('card')}Plan &amp; billing<em class="am-plan"></em></a>
      <a role="menuitem" href="#app-billing" data-tocredits>${ic('coin')}Credits<em class="am-cred"></em></a>
      <a role="menuitem" href="#app-usage">${ic('bars')}Usage</a>
      <a role="menuitem" href="#app-account">${ic('key')}Account &amp; sign-in</a>
      <hr>
      <button role="menuitem" class="am-up" data-plans>${ic('up')}Change plan</button>
      <a role="menuitem" href="mailto:info@agentsdesk.football">${ic('help')}Help &amp; support</a>
      <a role="menuitem" href="index.html">${ic('site')}Back to the website</a>
      <hr>
      <button role="menuitem" data-logout>${ic('out')}Log out</button>
    </div>`;
  const meEl = $('.tb .me');
  if (meEl) { const b = document.createElement('button'); b.className = 'me me-btn'; b.id = 'meBtn'; b.setAttribute('aria-label', 'Account menu'); b.innerHTML = `<span class="av acct-av"></span><div><b class="acct-name"></b><span class="acct-plan"></span></div>`; meEl.replaceWith(b); }
  const banner = document.createElement('div'); banner.className = 'tbanner'; banner.id = 'tbanner'; banner.hidden = true;
  $('.tb').after(banner);

  const menu = $('#acctMenu'), btn = $('#acctBtn');
  const openMenu = (anchor) => {
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    menu.classList.toggle('from-top', anchor && anchor.id === 'meBtn');
    const first = $('[role=menuitem]', menu); first && first.focus();
  };
  const closeMenu = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', e => { e.stopPropagation(); menu.hidden ? openMenu(btn) : closeMenu(); });
  const mb = $('#meBtn'); if (mb) mb.addEventListener('click', e => { e.stopPropagation(); menu.hidden ? openMenu(mb) : closeMenu(); });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#acctMenu')) closeMenu(); });
  menu.addEventListener('click', e => { if (e.target.closest('a,button')) closeMenu(); });
  menu.addEventListener('keydown', e => {
    const items = $$('[role=menuitem]', menu), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { closeMenu(); btn.focus(); }
  });

  function paintChrome() {
    const plan = PLANS[sub.plan], chip = statusChip();
    $$('.acct-av').forEach(e => e.textContent = initials(me.name));
    $$('.acct-name').forEach(e => e.textContent = me.name);
    $$('.acct-mail').forEach(e => e.textContent = me.email);
    $$('.acct-plan').forEach(e => e.textContent = sub.status === 'expired' ? 'No active plan' : `${plan.name} plan${chip ? ' · ' + chip : ''}`);
    $$('.am-plan').forEach(e => e.textContent = sub.status === 'expired' ? 'None' : plan.name);
    $$('.am-cred').forEach(e => e.textContent = money(sub.credits.bal));
    /* banner */
    const dismissed = sessionStorage.getItem('ad-banner-off') === sub.status;
    let html = '';
    if (sub.status === 'trialing') html = `<span class="tb-dot"></span><span><b>${planName()} free trial</b> · ${left(sub.trialEnd)} left<span class="tb-more">. First payment ${money(Q().total)} on ${fmt(sub.trialEnd)}, unless you cancel.</span></span><a class="tbl" href="#app-billing">Manage</a><button class="tbl strong" data-skiptrial>Start now</button>`;
    else if (sub.status === 'trial_canceled') html = `<span class="tb-dot warn"></span><span><b>Trial cancelled.</b><span class="tb-more"> You won't be charged.</span> Access until ${fmt(sub.trialEnd, false)}.</span><button class="tbl strong" data-resume>Keep my trial</button>`;
    else if (sub.status === 'canceled') html = `<span class="tb-dot warn"></span><span><b>Your ${plan.name} plan ends on ${fmt(sub.periodEnd, false)}.</b> You won't be charged again.</span><button class="tbl strong" data-resume>Resume plan</button>`;
    else if (sub.status === 'expired') html = `<span class="tb-dot warn"></span><span><b>You have no active plan.</b> Your data is kept for 30 days.</span><button class="tbl strong" data-plans>Choose a plan</button>`;
    banner.hidden = !html || dismissed;
    banner.innerHTML = html + (html ? `<button class="tb-x" aria-label="Hide this message" data-hidebanner>×</button>` : '');
  }

  /* ---------------- settings shell ---------------- */
  const TABS = [['settings', 'Profile', 'user'], ['billing', 'Plan & billing', 'card'], ['usage', 'Usage', 'bars'], ['account', 'Account & sign-in', 'key']];
  const shell = (el, active, body) => {
    el.innerHTML = `<div class="ph"><div><span class="lbl">Settings</span><h1>${TABS.find(t => t[0] === active)[1]}</h1></div></div>
      <div class="set-g"><nav class="set-nav" aria-label="Settings">${TABS.map(t => `<a href="#app-${t[0]}" class="${t[0] === active ? 'on' : ''}" ${t[0] === active ? 'aria-current="page"' : ''}>${ic(t[2])}${t[1]}</a>`).join('')}</nav>
      <div class="set-body">${body}</div></div>`;
  };

  /* Profile */
  V.settings = el => {
    shell(el, 'settings', `
      <section class="card set-card">
        <div class="prof-top"><span class="av big">${initials(me.name)}</span><div><b>${esc(me.name)}</b><span>${esc(me.email)}</span></div></div>
        <form class="set-form" id="profForm">
          <label><span>Full name</span><input name="name" value="${esc(me.name)}" autocomplete="name"></label>
          <label><span>Email</span><input name="email" type="email" value="${esc(me.email)}" autocomplete="email"></label>
          <label><span>Role</span><select name="role">${['Football agent', 'Agency owner', 'Assistant', 'Scout', 'Lawyer', 'Other'].map(r => `<option ${r === me.role ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
          <label><span>Agency or company <em>optional</em></span><input name="company" value="${esc(me.company)}" autocomplete="organization"></label>
          <label><span>Phone <em>optional</em></span><input name="phone" value="${esc(me.phone)}" autocomplete="tel"></label>
          <label><span>FIFA agent licence no. <em>optional</em></span><input name="licence" value="${esc(me.licence)}" placeholder="e.g. 202301-1234"></label>
          <label class="full"><span>Time zone</span><input value="${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin')}" readonly><small>Daily limits reset at midnight in this time zone. It follows your device.</small></label>
          <div class="full row-end"><button class="btn b-or" type="submit">Save changes</button></div>
        </form>
      </section>`);
    $('#profForm', el).addEventListener('submit', e => {
      e.preventDefault(); const f = new FormData(e.target);
      ['name', 'email', 'role', 'company', 'phone', 'licence'].forEach(k => me[k] = (f.get(k) || '').toString().trim() || me[k]);
      ls.set('ad-session', me); paintChrome(); V.settings(el); toast('Profile saved');
    });
  };

  /* Plan & billing */
  V.billing = el => {
    tick();
    const plan = PLANS[sub.plan], net = priceNet(), pm = perMonth(sub.plan, sub.period, sub.seats), yearSave = B.yearlySaving(bp(), sub.seats);
    const qNext = sub.pending ? Q({ plan: sub.pending.plan, period: sub.pending.period, seats: sub.pending.seats || sub.seats }) : Q();
    const due = q => taxMode() === 'unknown' ? `${money(q.net)} + tax` : money(q.total);
    let state = '', actions = '';
    if (sub.status === 'trialing') {
      state = `<div class="st trial"><b>Free trial · ${left(sub.trialEnd)} left</b><span>Your first payment of <b>${due(qNext)}</b>${qNext.coupon ? ` (with ${qNext.coupon.code})` : ''} is on <b>${fmt(sub.trialEnd)}</b>. Cancel before then and you pay nothing.</span></div>`;
      actions = `<button class="btn b-or" data-plans>Change plan</button><button class="btn b-gh" data-skiptrial>End trial and start now</button>`;
    } else if (sub.status === 'active') {
      state = `<div class="st ok"><b>Active</b><span>Renews on <b>${fmt(sub.periodEnd, false)}</b> for ${due(qNext)}${qNext.creditUsed ? `, of which ${money(qNext.creditUsed)} comes from your account credit` : ''}${sub.pending ? ` (changing to ${planName(sub.pending.plan, sub.pending.seats || sub.seats)}, ${sub.pending.period})` : ''}.</span></div>`;
      actions = `${sub.seats > 1 ? '<button class="btn b-or" data-seats>Change seats</button><button class="btn b-gh" data-plans>Change plan</button>' : '<button class="btn b-or" data-plans>Change plan</button>'}${sub.pending ? '<button class="btn b-gh" data-undopending>Keep current plan</button>' : ''}`;
    } else if (sub.status === 'trial_canceled') {
      state = `<div class="st warn"><b>Trial cancelled</b><span>You won't be charged. You keep access until <b>${fmt(sub.trialEnd)}</b>.</span></div>`;
      actions = `<button class="btn b-or" data-resume>Keep my trial</button><button class="btn b-gh" data-plans>Change plan</button>`;
    } else if (sub.status === 'canceled') {
      state = `<div class="st warn"><b>Cancelled</b><span>Your plan ends on <b>${fmt(sub.periodEnd, false)}</b>. You won't be charged again.</span></div>`;
      actions = `<button class="btn b-or" data-resume>Resume plan</button>`;
    } else {
      state = `<div class="st warn"><b>No active plan</b><span>Your data is kept for 30 days. Choose a plan to continue.</span></div>`;
      actions = `<button class="btn b-or" data-plans>Choose a plan</button>`;
    }
    const nudge = ['active', 'trialing'].includes(sub.status) && sub.period === 'monthly' && B.hasYearly(bp())
      ? `<div class="nudge"><span>Switch to yearly and save <b>${money(disp(sub.plan, 'yearly', sub.seats).saving)}</b> a year.</span><button class="btn b-sm b-dark" data-switchyear>Switch to yearly</button></div>`
      : ['active', 'trialing'].includes(sub.status) && sub.plan === 'basic' ? `<div class="nudge"><span>Need more searches and calculations? Pro yearly is ${money(disp('pro', 'yearly').perMonth)} a month ${taxWord()}.</span><button class="btn b-sm b-dark" data-plans>Compare plans</button></div>` : '';
    const cp = sub.coupon, cpLive = cp && B.couponApplies(cp, sub.payIndex || 0);
    const extras = `<dl class="bx">
        <div><dt>Discount</dt><dd>${cp ? `<b>${esc(cp.code)}</b> · ${esc(cp.label)}${cpLive ? '' : ' <span class="muted">(used)</span>'}` : '<span class="muted">None</span>'}</dd>${sub.status === 'expired' ? '' : `<button class="lnk" data-redeem>${cp && cpLive ? 'Change' : 'Redeem a code'}</button>`}</div>
        <div><dt>Account credit</dt><dd>${sub.credit ? `<b>${money(sub.credit)}</b> · used automatically on your next invoices` : `<span class="muted">${money(0)}</span>`}</dd></div></dl>`;
    const inv = sub.invoices.length ? `<table class="inv"><thead><tr><th>Date</th><th>Invoice</th><th>Description</th><th class="r">Amount</th><th class="r">Status</th><th><span class="sr">Details</span></th></tr></thead><tbody>
      ${sub.invoices.map(i => `<tr><td>${fmt(i.at, false)}</td><td class="mono">${i.id}</td><td>${esc(i.desc)}</td><td class="r">${money(i.total)}</td><td class="r"><span class="paid">${i.refunded ? 'Refunded' : 'Paid'}</span></td><td class="r"><button class="lnk" data-pdf="${i.id}">View</button></td></tr>`).join('')}</tbody></table>`
      : `<p class="empty">No invoices yet.${sub.status === 'trialing' ? ` Your first invoice is created on ${fmt(sub.trialEnd, false)}.` : ''}</p>`;
    const bd = ls.get('ad-billing', { name: me.name, company: me.company || '', vatId: '', address: '' });
    shell(el, 'billing', `
      <section class="card set-card plan-card">
        <div class="pc-top">
          <div><span class="lbl">Current plan</span><h2>${sub.status === 'expired' ? 'No plan' : planName()} <span class="per-tag">${sub.status === 'expired' ? '' : sub.period === 'yearly' ? 'Yearly' : 'Monthly'}</span></h2>
            <p class="muted">${sub.status === 'expired' ? '' : `${money(disp(sub.plan, sub.period, sub.seats).perMonth)} a month${sub.period === 'yearly' ? `, billed ${money(disp(sub.plan, sub.period, sub.seats).charge)} yearly` : ''} ${taxWord()} · ${sub.seats > 1 ? 'Agency plan' : plan.fit}`}</p></div>
          <div class="pc-act">${actions}</div>
        </div>
        ${state}
        ${nudge}
        ${extras}
        <div class="lim-mini">${ROWS.slice(0, 4).map(r => { const v = limitsNow()[r[0]]; return `<div><span>${r[1]}</span><b>${v === U ? 'Unlimited' : v + ' / ' + r[2]}</b></div>`; }).join('')}<a href="#app-usage" class="lnk">See usage →</a></div>
        ${sub.status !== 'expired' ? `<div class="remind-row"><div><b>Payment reminders</b><span class="muted">Email me 3 days before every payment${sub.status === 'trialing' ? '. Your trial reminder is always sent.' : '.'}</span></div>
          <label class="tgl"><input type="checkbox" data-remind ${sub.remind !== false ? 'checked' : ''}><span class="tk" aria-hidden="true"></span><b>${sub.remind !== false ? 'On' : 'Off'}</b><span class="sr">Payment reminders</span></label></div>` : ''}
      </section>
      ${creditsCard()}
      <div class="grid g2">
        <section class="card set-card">
          <div class="sc-h"><h3>Payment methods</h3><button class="lnk" data-paymethod>Update</button></div>
          <div class="pmv">${ic('card')}<div><b>${esc(sub.method.label)}</b><span>${sub.method.exp ? 'Expires ' + sub.method.exp : esc(sub.method.note || '')}</span></div><em class="pm-tag">Default</em></div>
          ${sub.backup ? `<div class="pmv">${ic('card')}<div><b>${esc(sub.backup.label)}</b><span>Backup · used if the default fails</span></div><span class="pm-act"><button class="lnk" data-mkdefault>Make default</button><button class="lnk mute" data-rmbackup>Remove</button></span></div>`
            : `<button class="add-pm" data-addbackup>+ Add a backup method</button>`}
          <p class="fine">Plan payments and credit top-ups use your default method. Payments are handled by our payment provider; Agents Desk never sees your full card or bank details.</p>
        </section>
        <section class="card set-card">
          <div class="sc-h"><h3>Billing details</h3><button class="lnk" data-billdetails>Edit</button></div>
          <dl class="bdl"><div><dt>Name</dt><dd>${esc(bd.name || '—')}</dd></div><div><dt>Company</dt><dd>${esc(bd.company || '—')}</dd></div><div><dt>VAT ID</dt><dd>${sub.vatId ? `${esc(sub.vatId)} <span class="ok-t">verified</span>` : esc(bd.vatId || '—')}</dd></div><div><dt>Country</dt><dd>${esc(B.country(sub.countryId).name)} · ${sub.buyer === 'private' ? 'Private' : 'Business'} · EUR</dd></div></dl>
          <p class="fine">Shown on your invoices. ${taxMode() === 'reverse' ? 'Reverse charge applies: no VAT is added.' : sub.buyer === 'business' && sub.countryId !== B.HOME ? 'Add a verified VAT ID to pay without VAT (reverse charge).' : ''} VAT country: ${esc(B.country(sub.countryId).name)}, ${sub.evidence ? `from ${({ card: 'your card', iban: 'your bank account', apple: 'Apple Pay', google: 'Google Pay', paypal: 'PayPal', estimate: 'your location', declared: 'your confirmation of where you live' })[sub.evidence.pay] || 'your payment method'}` : 'from your payment method'}.</p>
        </section>
      </div>
      <section class="card set-card">
        <div class="sc-h"><h3>Invoices</h3></div>
        ${inv}
      </section>
      ${['trialing', 'active'].includes(sub.status) ? `<section class="card set-card danger-zone">
        <div><h3>${sub.status === 'trialing' ? 'Cancel trial' : 'Cancel subscription'}</h3><p class="muted">${sub.status === 'trialing' ? `Cancel now and you won't be charged. You keep access until ${fmt(sub.trialEnd)}.` : `You keep access until ${fmt(sub.periodEnd, false)}. No further payments.${sub.period === 'yearly' && sub.paidSince && now() - sub.paidSince < REFUND_DAYS * DAY ? ` You're within ${REFUND_DAYS} days of your yearly payment, so you can get a full refund.` : ''}`}</p></div>
        <button class="btn b-gh danger" data-cancel>${sub.status === 'trialing' ? 'Cancel trial' : 'Cancel subscription'}</button>
      </section>` : ''}
      <p class="fine center">Need seats for your agency? <a href="pricing.html#plansTop">See agency plans</a> · Questions about billing? <a href="mailto:info@agentsdesk.football">Write to us</a></p>`);
  };

  /* Usage */
  V.usage = el => {
    const lim = limitsNow(), seed = new Date().toDateString().length + new Date().getDate();
    const used = ls.get('ad-usage-' + new Date().toDateString(), null) || Object.fromEntries(ROWS.map((r, i) => [r[0], Math.max(0, Math.round(((seed * (i + 3)) % 7) / 7 * (lim[r[0]] === U ? 12 : lim[r[0]])))]));
    ls.set('ad-usage-' + new Date().toDateString(), used);
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    shell(el, 'usage', `
      <section class="card set-card">
        <div class="sc-h"><h3>Today</h3><span class="muted sm">Daily limits reset at midnight, in ${left(midnight.getTime())}</span></div>
        
        <div class="usage">${ROWS.map(r => {
          const L = lim[r[0]], u = Math.min(used[r[0]], L === U ? used[r[0]] : L), pct = L === U ? 0 : Math.round(u / L * 100);
          return `<div class="ug ${L === U ? 'unl' : pct >= 100 ? 'full' : pct >= 80 ? 'hi' : ''}"><div class="ug-t"><a href="#app-${r[3]}">${r[1]}</a><span>${pct >= 100 && sub.credits.on ? '<em class="on-cr">Using credits</em> ' : ''}${L === U ? `${u} used · Unlimited` : `${u} of ${L}${r[2] === 'day' ? ' today' : r[2] === 'total' ? ' in total' : ' results'}`}</span></div>
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${L === U ? 100 : L}" aria-valuenow="${L === U ? 0 : u}" aria-label="${r[1]}"><i style="width:${Math.min(100, pct)}%"></i></div></div>`;
        }).join('')}</div>
        <div class="nudge xu"><span>${ic('coin')}${sub.credits.on ? `<b>Extra usage is on.</b> Above a daily limit you keep going for a few cents per action. Balance ${money(sub.credits.bal)}.` : '<b>Hit a limit?</b> Turn on extra usage and keep going with credits, from ' + money(unit('agency')) + ' per action.'}</span><a class="btn b-sm b-gh" href="#app-billing" data-tocredits>${sub.credits.on ? 'Manage credits' : 'Set up credits'}</a></div>
        ${sub.plan !== 'elite' ? `<div class="nudge"><span>Running into limits? ${sub.plan === 'basic' ? 'Pro' : 'Elite'} gives you ${sub.plan === 'basic' ? '20' : '50'} AI searches and deal calculations a day.</span><button class="btn b-sm b-dark" data-plans>Compare plans</button></div>` : ''}
      </section>`);
  };

  /* Account & sign-in */
  V.account = el => {
    shell(el, 'account', `
      <section class="card set-card">
        <div class="sc-h"><h3>Sign-in methods</h3></div>
        <div class="row-l"><div><b>Email and password</b><span class="muted">${esc(me.email)}</span></div><button class="btn b-sm b-gh" data-demo="Password reset email sent (demo)">Change password</button></div>
        <div class="row-l"><div><b>Google</b><span class="muted">Not connected</span></div><button class="btn b-sm b-gh" data-demo="Google connected (demo)">Connect</button></div>
        <div class="row-l"><div><b>Two-step verification</b><span class="muted">Adds a code from your phone when you sign in</span></div><button class="btn b-sm b-gh" data-demo="Two-step verification set up (demo)">Turn on</button></div>
      </section>
      <section class="card set-card">
        <div class="sc-h"><h3>Sessions</h3></div>
        <div class="row-l"><div><b>This device</b><span class="muted">Signed in now</span></div><button class="btn b-sm b-gh" data-logout>Log out</button></div>
        <div class="row-l"><div><b>All devices</b><span class="muted">Sign out everywhere, including phones and other browsers</span></div><button class="btn b-sm b-gh" data-demo="Signed out of all other devices (demo)">Log out everywhere</button></div>
      </section>
      <section class="card set-card danger-zone">
        <div><h3>Delete account</h3><p class="muted">Permanently deletes your desk, deals and saved data. ${['trialing', 'active'].includes(sub.status) ? 'Your subscription is cancelled first.' : ''}</p></div>
        <button class="btn b-gh danger" data-delete>Delete account</button>
      </section>`);
  };

  /* Credits / extra usage card (Plan & billing) */
  function creditsCard() {
    const c = sub.credits, live = isLive();
    const log = c.log.slice(0, 4);
    return `<section class="card set-card credits" id="credits">
      <div class="sc-h"><div><h3>Credits &amp; extra usage</h3><p class="muted sm">Keep working when you reach a daily limit. Extra actions are paid from your credit balance.</p></div>
        <label class="tgl"><input type="checkbox" data-xon ${c.on ? 'checked' : ''} ${live ? '' : 'disabled'}><span class="tk" aria-hidden="true"></span><b>${c.on ? 'On' : 'Off'}</b><span class="sr">Extra usage</span></label></div>
      <div class="cr-g">
        <div class="cr-bal"><span class="lbl">Balance</span><b>${money(c.bal)}</b><small>Credits never expire</small>
          <button class="btn b-or" data-topup ${live ? '' : 'disabled'}>Buy credits</button></div>
        <dl class="cr-rows">
          <div><dt>Auto-reload</dt><dd>${c.auto.on ? `Add <b>${money(c.auto.add)}</b> when the balance falls below ${money(c.auto.below)}` : 'Off'}</dd><button class="lnk" data-autoreload>Edit</button></div>
          <div><dt>Monthly cap</dt><dd>${c.cap ? `<b>${money(c.spent)}</b> of ${money(c.cap)} used this month` : `No cap · ${money(c.spent)} used this month`}</dd><button class="lnk" data-cap>Edit</button></div>
          <div><dt>Prices</dt><dd>${credLine()}</dd></div>
        </dl>
      </div>
      ${log.length ? `<ul class="cr-log">${log.map(l => `<li><span>${fmt(l.at, false)}</span><span>${esc(l.what)}</span><b class="${l.amt > 0 ? 'plus' : ''}">${l.amt > 0 ? '+' : '−'}${money(Math.abs(l.amt))}</b></li>`).join('')}</ul>` : ''}
      ${live ? '' : '<p class="fine">Credits need an active plan or trial.</p>'}
    </section>`;
  }
  function topupModal(sel = 25) {
    const c = sub.credits;
    const t = taxNow();
    const body = amt => { const v = Math.max(0, Math.round(+amt || 0)), tax = t.mode === 'add' ? B.pct(v, t.bp) : 0; return { v, tax, tot: v + tax }; };
    modal(`<span class="lbl">Buy credits</span><h2>Top up your balance</h2>
      <p class="muted">Balance now: <b>${money(c.bal)}</b>. Credits never expire and are only used when extra usage is on.</p>
      <div class="tu-chips" role="radiogroup" aria-label="Amount">${TOPUPS.map(a => `<button type="button" role="radio" aria-checked="${a === sel}" class="${a === sel ? 'on' : ''}" data-amt="${a}">${money(a)}</button>`).join('')}
        <label class="tu-other"><span class="sr">Other amount</span><input id="tuOther" inputmode="decimal" placeholder="Other"></label></div>
      <dl class="tu-sum" id="tuSum"></dl>
      <label class="ck"><input type="checkbox" id="tuOn" ${c.on ? 'checked disabled' : 'checked'}> Turn on extra usage, so credits are used when I reach a daily limit</label>
      <p class="fine">Paid with ${esc(sub.method.label)}. <button class="lnk" data-paymethod>Change</button> · Unused credits are refundable within 14 days of purchase.</p>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" id="tuGo">Pay</button></div>
      <p class="fine">Demo: nothing is charged.</p>`, 'acct-modal sm');
    let amt = sel;
    const paint = () => {
      const b = body(amt), ok = b.v >= 500 && b.v <= 50000;
      $('#tuSum').innerHTML = `<div><dt>Credits</dt><dd>${money(b.v)}</dd></div>${t.mode === 'add' ? `<div><dt>VAT ${t.bp / 100}%</dt><dd>${money(b.tax)}</dd></div>` : t.mode === 'reverse' ? '<div><dt>VAT</dt><dd>Reverse charge</dd></div>' : ''}<div class="tot"><dt>Total today</dt><dd>${money(b.tot)}</dd></div><div><dt>New balance</dt><dd>${money(c.bal + b.v)}</dd></div>`;
      $('#tuGo').textContent = ok ? `Pay ${money(b.tot)}` : 'Choose €5 to €500';
      $('#tuGo').disabled = !ok;
    };
    $$('[data-amt]').forEach(x => x.addEventListener('click', () => { amt = +x.dataset.amt; $('#tuOther').value = ''; $$('[data-amt]').forEach(y => { y.classList.toggle('on', y === x); y.setAttribute('aria-checked', y === x); }); paint(); }));
    $('#tuOther').addEventListener('input', e => { amt = Math.round((parseFloat(e.target.value.replace(',', '.')) || 0) * 100); $$('[data-amt]').forEach(y => { y.classList.remove('on'); y.setAttribute('aria-checked', 'false'); }); paint(); });
    $('#tuGo').addEventListener('click', () => {
      const b = body(amt); c.bal += b.v; if ($('#tuOn').checked) c.on = true;
      c.log.unshift({ at: now(), what: 'Top-up', amt: b.v });
      sub.invoices.unshift(B.invoiceFrom({ lines: [{ label: 'Credit top-up', c: b.v }], net: b.v, vat: b.tax, total: b.tot, taxLabel: t.mode === 'add' ? `VAT ${t.bp / 100}% (${t.c.name})` : 'VAT' }, now(), 'Credit top-up', sub.invoices));
      saveSub(); $('#modal').className = 'modal'; toast(`${money(b.v)} added to your balance`); rerender();
    });
    paint();
  }
  function autoReloadModal() {
    const a = sub.credits.auto;
    const sel = (id, vals, cur) => `<select id="${id}">${vals.map(v => `<option value="${v}" ${v === cur ? 'selected' : ''}>${money(v)}</option>`).join('')}</select>`;
    modal(`<span class="lbl">Auto-reload</span><h2>Never run out mid-deal</h2>
      <p class="muted">We top up your balance automatically, using your default payment method.</p>
      <label class="ck"><input type="checkbox" id="arOn" ${a.on ? 'checked' : ''}> Turn on auto-reload</label>
      <div class="ar-row">When the balance falls below ${sel('arBelow', [500, 1000, 2000], a.below)} add ${sel('arAdd', TOPUPS, a.add)}</div>
      <p class="fine">Your monthly cap still applies. Every reload gets its own invoice.</p>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" id="arSave">Save</button></div>`, 'acct-modal sm');
    $('#arSave').addEventListener('click', () => { a.on = $('#arOn').checked; a.below = +$('#arBelow').value; a.add = +$('#arAdd').value; saveSub(); $('#modal').className = 'modal'; toast(a.on ? 'Auto-reload is on' : 'Auto-reload is off'); rerender(); });
  }
  function capModal() {
    const c = sub.credits;
    modal(`<span class="lbl">Monthly cap</span><h2>Set a spending cap</h2>
      <p class="muted">Extra usage stops for the rest of the month once you reach the cap. You've used <b>${money(c.spent)}</b> this month.</p>
      <label class="ck"><input type="checkbox" id="capNo" ${c.cap ? '' : 'checked'}> No cap</label>
      <label class="cap-in"><span>Cap per month</span><input id="capV" inputmode="decimal" value="${((c.cap || 5000) / 100).toFixed(2)}" ${c.cap ? '' : 'disabled'}></label>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" id="capSave">Save</button></div>`, 'acct-modal sm');
    $('#capNo').addEventListener('change', e => { $('#capV').disabled = e.target.checked; });
    $('#capSave').addEventListener('click', () => { const v = parseFloat($('#capV').value.replace(',', '.')); c.cap = $('#capNo').checked || !(v > 0) ? null : Math.round(v * 100); saveSub(); $('#modal').className = 'modal'; toast(c.cap ? `Cap set to ${money(c.cap)} a month` : 'No monthly cap'); rerender(); });
  }
  function backupModal() {
    const opts = [['paypal', 'PayPal', 'PayPal'], ['sepa', 'SEPA Direct Debit', 'DE89 •••• 3000'], ['card', 'Another card', 'Mastercard •••• 5454']].filter(o => o[0] !== sub.method.type);
    modal(`<span class="lbl">Payment methods</span><h2>Add a backup method</h2>
      <p class="muted">If your default method fails, we try this one before your plan is interrupted.</p>
      <div class="pm-list">${opts.map((o, i) => `<label class="pm-opt"><input type="radio" name="bk" value="${o[0]}" ${i ? '' : 'checked'}><span><b>${o[1]}</b><small>${esc(o[2])}</small></span></label>`).join('')}</div>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" id="bkSave">Add</button></div>`, 'acct-modal sm');
    $('#bkSave').addEventListener('click', () => { const o = opts.find(x => x[0] === ($('input[name=bk]:checked') || {}).value); if (o) sub.backup = { type: o[0], label: o[2], exp: '' }; saveSub(); $('#modal').className = 'modal'; toast('Backup method added'); rerender(); });
  }

  /* ---------------- modals ---------------- */
  function plansModal(period = sub.period) {
    const cur = sub.plan, live = sub.status !== 'expired';
    modal(`${sub.seats > 1 && live ? `<p class="agency-note">You're on the <b>Agency plan with ${sub.seats} seats</b>. <button class="lnk" data-seats>Change the number of seats</button>, or move to a single-user plan below. That change applies when your current period ends.</p>` : ''}<div class="pm-h"><div><span class="lbl">Change plan</span><h2>Pick the plan that fits</h2></div>
        <div class="seg2" role="group" aria-label="Billing period"><button data-pp="monthly" class="${period === 'monthly' ? 'on' : ''}" aria-pressed="${period === 'monthly'}">Monthly</button><button data-pp="yearly" class="${period === 'yearly' ? 'on' : ''}" aria-pressed="${period === 'yearly'}">Yearly <i>−${B.YEARLY_OFF_BP / 100}%</i></button></div></div>
      <div class="pm-cards">${Object.entries(PLANS).map(([id, p]) => {
        const per = B.effPeriod(id, period), isCur = live && id === cur && sub.seats <= 1 && per === sub.period;
        const label = !live ? 'Choose' : sub.seats > 1 ? 'Move to this plan' : isCur ? 'Current plan' : p.rank > PLANS[cur].rank ? 'Upgrade' : p.rank < PLANS[cur].rank ? 'Downgrade' : `Switch to ${per}`;
        return `<div class="pm-card ${isCur ? 'cur' : ''} ${id === 'pro' ? 'rec' : ''}"><span class="fit">${p.fit}</span><b>${p.name}</b>
          <div class="pm-price">${money(disp(id, per).perMonth)}<small>/ month ${taxWord()}</small></div>
          <span class="muted sm">${per === 'yearly' ? `Billed ${money(disp(id, 'yearly').charge)} yearly` : period === 'yearly' ? 'Monthly only' : 'Billed monthly'}</span>
          <ul>${ROWS.slice(0, 4).map(r => `<li>${r[1]}: ${p.lim[r[0]] === U ? 'unlimited' : p.lim[r[0]] + (r[2] === 'day' ? ' a day' : '')}</li>`).join('')}</ul>
          <button class="btn ${isCur ? 'b-gh' : 'b-or'}" ${isCur ? 'disabled' : ''} data-pick="${id}" data-per="${per}">${label}</button></div>`;
      }).join('')}</div>
      <p class="fine center">Need several seats? <a href="pricing.html#plansTop">See agency plans</a>. Prices in euros, ${taxNow().incl ? 'including VAT' : taxMode() === 'add' ? 'excluding VAT' : 'no VAT added'}.</p>`, 'acct-modal');
  }
  /* every plan change goes through the billing engine: B.change() decides now / scheduled / trial / start and prices it */
  const qLines = q => `<dl class="q-lines">${q.lines.map(l => `<div class="${l.c < 0 ? 'minus' : ''}"><dt>${esc(l.label)}</dt><dd>${money(l.c)}</dd></div>`).join('')}
      <div><dt>${esc(q.taxLabel)}</dt><dd>${esc(q.taxValue)}</dd></div><div class="tot"><dt>Total</dt><dd>${taxMode() === 'unknown' ? money(q.net) + ' + tax' : money(q.total)}</dd></div></dl>`;
  function confirmChange(to, per) {
    per = B.effPeriod(to, per);
    const agency = sub.seats > 1 && ['active', 'canceled'].includes(sub.status);
    const r = agency ? { kind: 'scheduled', q: B.quote({ plan: to, period: per, country: sub.countryId, buyer: sub.buyer, vatOk: vOK() }) } : B.change(Object.assign({}, sub, { seats: 1 }), to, per), p = PLANS[to], every = per === 'yearly' ? 'year' : 'month';
    const tot = q => taxMode() === 'unknown' ? `${money(q.net)} + tax` : money(q.total);
    let title, body, cta, apply;
    if (r.kind === 'trial') {
      title = `${sub.status === 'trial_canceled' ? 'Keep your trial with' : 'Switch your trial to'} ${p.name}`;
      body = `<ul class="cf-list"><li>No charge now. Your trial still ends on <b>${fmt(sub.trialEnd)}</b>.</li><li>${p.name}'s limits apply straight away.</li><li>Then <b>${tot(r.q)}</b> per ${every}, unless you cancel.</li></ul>`;
      cta = `Switch to ${p.name}`; apply = () => { sub.plan = to; sub.period = per; sub.seats = 1; sub.status = 'trialing'; };
    } else if (r.kind === 'start') {
      title = `Start ${p.name} ${per}`;
      body = `<ul class="cf-list"><li>Your plan starts today. No new free trial.</li><li>Then every ${every} until you cancel.${per === 'yearly' ? ` Full refund if you ask within ${REFUND_DAYS} days.` : ''}</li></ul>${qLines(r.q)}`;
      cta = `Pay ${tot(r.q)} and start`; apply = () => { sub.plan = to; sub.period = per; sub.seats = 1; sub.trialEnd = now(); sub.payIndex = 0; sub.coupon = null; startPaid(now()); };
    } else if (r.kind === 'now') {
      title = to === sub.plan ? 'Switch to yearly' : `Upgrade to ${p.name}`;
      body = `<ul class="cf-list"><li>The change applies <b>right away</b> and a new ${every} starts today.</li><li>The unused part of your current period (<b>${money(r.unused)}</b>) is credited${sub.credit ? `, plus ${money(sub.credit)} account credit` : ''}.</li>${r.carry > 0 ? `<li><b>${money(r.carry)}</b> credit is left over and kept for your next invoices.</li>` : ''}${sub.coupon && B.couponApplies(sub.coupon, sub.payIndex || 0) ? `<li>Your ${esc(sub.coupon.code)} discount ends with this change.</li>` : ''}<li>Then ${tot(B.quote({ plan: to, period: per, country: sub.countryId, buyer: sub.buyer, vatOk: vOK() }))} per ${every} from ${fmt(addPeriod(now(), per), false)}.</li></ul>${qLines(r.q)}`;
      cta = r.q.total > 0 ? `Pay ${tot(r.q)} and upgrade` : 'Upgrade now';
      apply = () => {
        const at = now();
        sub.plan = to; sub.period = per; sub.seats = 1; sub.status = 'active'; sub.pending = null;
        sub.coupon = null; sub.payIndex = 1; sub.paidSince = at; sub.periodEnd = addPeriod(at, per);
        sub.invoices.unshift(B.invoiceFrom(r.q, at, `${p.name} · ${per} (upgrade)`, sub.invoices));
        sub.credit = r.carry; sub.lastPaidNet = r.q.net + r.q.creditUsed;
      };
    } else {
      title = to === sub.plan ? 'Switch to monthly' : `Downgrade to ${p.name}`;
      body = `<ul class="cf-list"><li>The change applies on <b>${fmt(sub.periodEnd, false)}</b>, when your current period ends. Until then you keep ${planName()}.</li><li>Then <b>${tot(r.q)}</b> per ${every}.</li><li>Nothing is deleted. Items above ${p.name}'s limits become read-only.</li></ul>`;
      cta = 'Schedule the change'; apply = () => { sub.status = 'active'; sub.pending = { plan: to, period: per, seats: 1 }; };
    }
    modal(`<span class="lbl">Confirm</span><h2>${title}</h2>${body}
      <div class="row-end"><button class="btn b-gh" data-plans>Back</button><button class="btn b-or" data-confirm>${cta}</button></div>
      <p class="fine">Demo: nothing is charged.</p>`, 'acct-modal sm');
    $('[data-confirm]').addEventListener('click', () => { apply(); saveSub(); $('#modal').className = 'modal'; toast('Plan updated'); rerender(); });
  }
  function seatsModal(n = sub.seats) {
    n = B.clampSeats(n);
    const r = B.seatChange(sub, n), nx = r.next, tot = q => money(q.total);
    let body = '';
    if (r.kind === 'none') body = `<p class="muted">You have ${n} seats. Each seat is the full Elite plan.</p>`;
    else if (r.kind === 'trial') body = `<ul class="cf-list"><li>No charge now. Your trial still ends on <b>${fmt(sub.trialEnd)}</b>.</li><li>Then <b>${tot(nx)}</b> per ${sub.period === 'yearly' ? 'year' : 'month'} for ${n} seats.</li></ul>`;
    else if (r.kind === 'scheduled') body = `<ul class="cf-list"><li>Removing seats applies on <b>${fmt(sub.periodEnd, false)}</b>, when your current period ends. Until then everyone keeps access.</li><li>Then <b>${tot(nx)}</b> per ${sub.period === 'yearly' ? 'year' : 'month'} for ${n} seats.</li></ul>`;
    else body = `<ul class="cf-list"><li>New seats work right away. You pay only for the rest of the current period.</li><li>From ${fmt(sub.periodEnd, false)}: <b>${tot(nx)}</b> per ${sub.period === 'yearly' ? 'year' : 'month'} for ${n} seats.</li></ul>${qLines(r.q)}`;
    modal(`<span class="lbl">Agency plan</span><h2>Seats</h2>
      <div class="seat-step"><button class="btn b-gh" data-seatn="${n - 1}" ${n <= B.TEAM.min ? 'disabled' : ''} aria-label="One seat fewer">−</button><b>${n}</b><button class="btn b-gh" data-seatn="${n + 1}" ${n >= B.TEAM.max ? 'disabled' : ''} aria-label="One seat more">+</button></div>
      ${body}
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" data-seatok ${r.kind === 'none' ? 'disabled' : ''}>${r.kind === 'now' ? `Pay ${tot(r.q)} and add seats` : r.kind === 'scheduled' ? 'Schedule the change' : 'Save'}</button></div>
      ${n >= B.TEAM.max ? '<p class="fine">Need more than 10 seats? <a href="mailto:info@agentsdesk.football">Talk to us</a>.</p>' : ''}<p class="fine">Demo: nothing is charged.</p>`, 'acct-modal sm');
    $$('[data-seatn]').forEach(b => b.addEventListener('click', () => seatsModal(+b.dataset.seatn)));
    $('[data-seatok]').addEventListener('click', () => {
      if (r.kind === 'now') { sub.invoices.unshift(B.invoiceFrom(r.q, now(), `Agency plan · +${n - sub.seats} seat${n - sub.seats > 1 ? 's' : ''} (prorated)`, sub.invoices)); sub.seats = n; }
      else if (r.kind === 'trial') sub.seats = n;
      else if (r.kind === 'scheduled') sub.pending = { plan: 'elite', period: sub.period, seats: n };
      saveSub(); $('#modal').className = 'modal'; toast(r.kind === 'scheduled' ? 'Seat change scheduled' : 'Seats updated'); rerender();
    });
  }
  function invoiceModal(id) {
    const i = sub.invoices.find(x => x.id === id); if (!i) return;
    const bd = ls.get('ad-billing', { name: me.name, company: me.company || '', vatId: '' });
    modal(`<span class="lbl">Invoice ${esc(i.id)}</span><h2>${money(i.total)} paid</h2>
      <p class="muted">${fmt(i.at)} · ${esc(sub.method.label)}<br>Billed to ${esc(bd.company || bd.name || me.name)}${bd.vatId ? ` · VAT ID ${esc(bd.vatId)}` : ''} · ${esc(B.country(sub.countryId).name)}</p>
      <dl class="q-lines">${(i.lines || [{ label: i.desc, c: i.net }]).map(l => `<div class="${l.c < 0 ? 'minus' : ''}"><dt>${esc(l.label)}</dt><dd>${money(l.c)}</dd></div>`).join('')}
        <div><dt>Subtotal</dt><dd>${money(i.net)}</dd></div><div><dt>${esc(i.taxLabel || 'VAT')}</dt><dd>${money(i.vat)}</dd></div><div class="tot"><dt>Total</dt><dd>${money(i.total)}</dd></div></dl>
      <div class="row-end"><button class="btn b-gh" data-close>Close</button><button class="btn b-or" data-demo="Invoice ${esc(i.id)} downloaded (demo)">Download PDF</button></div>`, 'acct-modal sm');
  }
  function redeemModal() {
    modal(`<span class="lbl">Discount code</span><h2>Redeem a code</h2>
      <p class="muted">The discount applies from your next payment${sub.status === 'trialing' ? ', the first one after your trial' : ''}.</p>
      <label class="cap-in wide"><span>Code</span><input id="rdCode" autocomplete="off" spellcheck="false" placeholder="e.g. WELCOME10" style="text-transform:uppercase"></label>
      <p class="fine" id="rdMsg">Demo codes: WELCOME10, AGENT20 (monthly), YEARLY15 (yearly), AGENCY10 (agency).</p>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" id="rdGo">Apply</button></div>`, 'acct-modal sm');
    const go = () => {
      const r = B.checkCoupon($('#rdCode').value, { plan: bp(), period: sub.period });
      if (!r.ok) { $('#rdMsg').textContent = r.error || 'Enter a code first.'; $('#rdMsg').classList.add('err'); return; }
      /* a code counts from the next payment, as if it were the first */
      const lab = r.label.replace('your first payment', 'your next payment').replace('your first yearly payment', 'your next yearly payment').replace('your first 3 monthly payments', 'your next 3 monthly payments');
      sub.coupon = Object.assign({}, r, { label: lab, times: r.duration === 'repeating' ? r.times + (sub.payIndex || 0) : r.times, from: sub.payIndex || 0 });
      if (r.duration === 'once') { sub.coupon.duration = 'repeating'; sub.coupon.times = (sub.payIndex || 0) + 1; }
      saveSub(); $('#modal').className = 'modal'; toast(`${r.code} applied`); rerender();
    };
    $('#rdGo').addEventListener('click', go); $('#rdCode').addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); $('#rdCode').focus();
  }
  function cancelModal() {
    const trial = sub.status === 'trialing', until = trial ? sub.trialEnd : sub.periodEnd;
    modal(`<span class="lbl">${trial ? 'Cancel trial' : 'Cancel subscription'}</span><h2>${trial ? 'Cancel your free trial?' : `Cancel your ${PLANS[sub.plan].name} plan?`}</h2>
      <ul class="cf-list"><li>${trial ? 'You won\'t be charged anything.' : 'No further payments will be taken.'}</li><li>You keep access until <b>${fmt(until)}</b>.</li><li>Your desk, deals and targets are kept for 30 days after that, in case you come back.</li></ul>
      <fieldset class="why"><legend>Mind telling us why? <em>optional</em></legend>${['Too expensive', 'Missing a feature I need', 'Only needed it for one deal', 'Switching to another tool', 'Something else'].map(r => `<label><input type="radio" name="why" value="${r}"> ${r}</label>`).join('')}</fieldset>
      ${sub.plan !== 'basic' ? `<p class="alt">Prefer to pay less? <button class="lnk" data-pick="basic" data-per="monthly">Switch to Basic for ${money(show(priceNet('basic', 'monthly', 1)))} a month ${taxWord()}</button></p>` : ''}
      <div class="row-end"><button class="btn b-gh" data-close>Keep my plan</button><button class="btn danger-solid" data-confirmcancel>${trial ? 'Cancel trial' : 'Cancel subscription'}</button></div>`, 'acct-modal sm');
    $('[data-confirmcancel]').addEventListener('click', () => {
      sub.status = trial ? 'trial_canceled' : 'canceled'; sub.pending = null; saveSub(); $('#modal').className = 'modal';
      toast(trial ? 'Trial cancelled. You won\'t be charged.' : 'Subscription cancelled'); rerender();
    });
  }
  function skipTrialModal() {
    const q = Q({ payIndex: sub.payIndex || 0 }), t = taxMode() === 'unknown' ? `${money(q.net)} + tax` : money(q.total);
    modal(`<span class="lbl">Start now</span><h2>End your trial and start ${planName()} today?</h2>
      <ul class="cf-list"><li>Your paid plan starts today. Nothing else changes.</li><li>You pay with ${esc(sub.method.label)}, then every ${sub.period === 'yearly' ? 'year' : 'month'} from today until you cancel.</li></ul>
      ${qLines(q)}
      <div class="row-end"><button class="btn b-gh" data-close>Not now</button><button class="btn b-or" data-confirmskip>Pay ${t} and start</button></div>
      <p class="fine">Demo: nothing is charged.</p>`, 'acct-modal sm');
    $('[data-confirmskip]').addEventListener('click', () => { sub.trialEnd = now(); startPaid(now()); saveSub(); $('#modal').className = 'modal'; toast(`${planName()} is active`); rerender(); });
  }
  function payMethodModal() {
    const opts = [['card', 'Card', 'Visa •••• 4242', '08/28'], ['paypal', 'PayPal', 'PayPal · ' + me.email, ''], ['sepa', 'SEPA Direct Debit', 'DE89 •••• 3000', '']];
    modal(`<span class="lbl">Payment method</span><h2>Update payment method</h2>
      <div class="pm-list">${opts.map(o => `<label class="pm-opt"><input type="radio" name="pmv" value="${o[0]}" ${sub.method.type === o[0] ? 'checked' : ''}><span><b>${o[1]}</b><small>${esc(o[2])}</small></span></label>`).join('')}</div>
      <p class="fine">In the live product you confirm new details on our payment provider's secure page.</p>
      <div class="row-end"><button class="btn b-gh" data-close>Cancel</button><button class="btn b-or" data-savepm>Save</button></div>`, 'acct-modal sm');
    $('[data-savepm]').addEventListener('click', () => {
      const v = ($('input[name=pmv]:checked') || {}).value; const o = opts.find(x => x[0] === v); if (o) sub.method = { type: o[0], label: o[2], exp: o[3] };
      saveSub(); $('#modal').className = 'modal'; toast('Payment method updated'); rerender();
    });
  }
  function billDetailsModal() {
    const bd = ls.get('ad-billing', { name: me.name, company: me.company || '', vatId: '', address: '', country: sub.country });
    modal(`<span class="lbl">Billing details</span><h2>Shown on your invoices</h2>
      <form class="set-form" id="bdForm">
        <label><span>Name</span><input name="name" value="${esc(bd.name)}"></label>
        <label><span>Company <em>optional</em></span><input name="company" value="${esc(bd.company)}"></label>
        <label><span>VAT ID <em>optional</em></span><input name="vatId" value="${esc(bd.vatId)}" placeholder="e.g. DE123456789"></label>
        <label><span>Country</span><input name="country" value="${esc(bd.country)}"></label>
        <label class="full"><span>Address</span><input name="address" value="${esc(bd.address)}" autocomplete="street-address"></label>
        <div class="full row-end"><button class="btn b-gh" type="button" data-close>Cancel</button><button class="btn b-or" type="submit">Save</button></div>
      </form>`, 'acct-modal sm');
    $('#bdForm').addEventListener('submit', e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); ls.set('ad-billing', f); $('#modal').className = 'modal'; toast('Billing details saved'); rerender(); });
  }
  function deleteModal() {
    modal(`<span class="lbl">Delete account</span><h2>Delete your account?</h2>
      <ul class="cf-list"><li>Your desk, deals, targets and saved calculations are deleted for good.</li><li>${['trialing', 'active'].includes(sub.status) ? 'Your subscription is cancelled first. No further payments.' : 'You have no active subscription.'}</li><li>Invoices are kept, as the law requires.</li></ul>
      <div class="row-end"><button class="btn b-gh" data-close>Keep my account</button><button class="btn danger-solid" data-dodelete>Delete account</button></div>`, 'acct-modal sm');
    $('[data-dodelete]').addEventListener('click', () => { ['ad-sub', 'ad-session', 'ad-billing'].forEach(ls.del); location.href = 'auth.html?mode=signup&deleted=1'; });
  }
  const logout = () => { ls.del('ad-session'); location.href = 'auth.html?mode=login&loggedout=1'; };

  /* ---------------- events (delegated) ---------------- */
  const rerender = () => { paintChrome(); const h = location.hash.slice(5); if (V[h] && ['settings', 'billing', 'usage', 'account'].includes(h)) V[h]($('#view')); };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-plans],[data-pick],[data-pp],[data-cancel],[data-skiptrial],[data-resume],[data-paymethod],[data-billdetails],[data-logout],[data-delete],[data-switchyear],[data-undopending],[data-hidebanner],[data-pdf],[data-redeem],[data-seats],[data-demo],[data-topup],[data-autoreload],[data-cap],[data-xon],[data-addbackup],[data-mkdefault],[data-rmbackup],[data-tocredits],[data-remind]');
    if (!t || !t.closest('#app')) return;
    if (t.matches('[data-plans]')) plansModal();
    else if (t.matches('[data-pp]')) plansModal(t.dataset.pp);
    else if (t.matches('[data-pick]')) confirmChange(t.dataset.pick, t.dataset.per);
    else if (t.matches('[data-cancel]')) cancelModal();
    else if (t.matches('[data-skiptrial]')) skipTrialModal();
    else if (t.matches('[data-resume]')) { sub.status = sub.status === 'trial_canceled' ? 'trialing' : 'active'; saveSub(); toast('Welcome back. Your plan continues.'); rerender(); }
    else if (t.matches('[data-paymethod]')) payMethodModal();
    else if (t.matches('[data-billdetails]')) billDetailsModal();
    else if (t.matches('[data-logout]')) logout();
    else if (t.matches('[data-delete]')) deleteModal();
    else if (t.matches('[data-switchyear]')) confirmChange(sub.plan, 'yearly');
    else if (t.matches('[data-undopending]')) { sub.pending = null; saveSub(); toast('You keep your current plan'); rerender(); }
    else if (t.matches('[data-hidebanner]')) { sessionStorage.setItem('ad-banner-off', sub.status); banner.hidden = true; }
    else if (t.matches('[data-pdf]')) invoiceModal(t.dataset.pdf);
    else if (t.matches('[data-redeem]')) redeemModal();
    else if (t.matches('[data-seats]')) seatsModal();
    else if (t.matches('[data-demo]')) toast(t.dataset.demo);
    else if (t.matches('[data-topup]')) topupModal();
    else if (t.matches('[data-autoreload]')) autoReloadModal();
    else if (t.matches('[data-cap]')) capModal();
    else if (t.matches('[data-xon]')) {
      if (t.checked && sub.credits.bal <= 0) { t.checked = false; topupModal(); return; }
      sub.credits.on = t.checked; saveSub(); toast(t.checked ? 'Extra usage is on' : 'Extra usage is off'); rerender();
    }
    else if (t.matches('[data-remind]')) { sub.remind = t.checked; saveSub(); toast(t.checked ? 'We\'ll email you 3 days before each payment' : 'Payment reminders are off'); rerender(); }
    else if (t.matches('[data-addbackup]')) backupModal();
    else if (t.matches('[data-mkdefault]')) { const d = sub.method; sub.method = sub.backup; sub.backup = d; saveSub(); toast('Default payment method changed'); rerender(); }
    else if (t.matches('[data-rmbackup]')) { sub.backup = null; saveSub(); toast('Backup method removed'); rerender(); }
    else if (t.matches('[data-tocredits]')) setTimeout(() => { const c = $('#credits'); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1400); } }, 120);
  });

  tick(); ls.set('ad-sub', sub); paintChrome();
  setInterval(() => { tick(); paintChrome(); }, 60000);
})();
