/* Agents Desk pricing page + checkout.
   All prices, tax, coupons and totals come from js/billing.js (window.ADB), in integer cents.
   This file only renders them. */
(function () {
  const B = window.ADB;
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const TRIAL_HOURS = 168;             // 7 days, exactly 168 hours, also across clock changes
  const REFUND_DAYS = 14;              // money-back window on the first yearly payment (proposal)
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  const PLANS = [
    { id: 'basic', name: 'Basic', fit: 'For 1–2 clients', who: 'Get the essentials and check the market a few times a week.',
      key: ['1 Agency view a day', '3 deal calculations a day', '3 AI player searches a day', '3 saved calculations in total', 'First 75 players with no agent'] },
    { id: 'pro', name: 'Pro', fit: 'For 3–15 clients', who: 'For working agents who search and calculate every week.', rec: 'Recommended',
      key: ['10 Agency views a day', '20 deal calculations a day', '20 AI player searches a day', '25 saved calculations in total', 'First 250 players with no agent'] },
    { id: 'elite', name: 'Elite', fit: 'For 15+ clients or daily scouting', who: 'For agents who live in the market every day.',
      key: ['Unlimited Agency views', '50 deal calculations a day', '50 AI player searches a day', 'Unlimited saved calculations', 'Every player with no agent'] },
  ];
  const HELP = {
    'Daily Overview': 'Your start-of-day summary: requests, deals, calendar and to-dos.',
    'Agency views': 'Opening your agency page: the squad, contracts and values of the players you represent.',
    'Deal Calculator': 'Works out fee, add-ons, sell-on, tax and your commission for one deal.',
    'Saved calculations': 'Deal calculations you keep so you can reopen and share them later.',
    'Transfer Requests': 'Club briefs you save and run against our player database.',
    'Transfer Log entries': 'Moves you record, with fee, type and date.',
    'AI Search (Beta)': 'Describe a player in plain language and get a shortlist.',
    'Players with No Agents': 'Players with no registered representative, filterable by value band.',
    'Users': 'People who can sign in to this subscription. For more, use a team plan.',
  };
  /* comparison table (from the agreed pricing sheet): [label, basic, pro, elite]; true = included */
  const T = true;
  const TABLE = [
    ['Dashboard'], ['Daily Overview', T, T, T], ['Agency views', '1 / day', '10 / day', 'Unlimited'],
    ['CRM'], ['Deal Calculator', '3 / day', '20 / day', '50 / day'], ['Saved calculations', '3 in total', '25 in total', 'Unlimited'],
    ['Transfer Requests', '3 / day', '20 / day', '50 / day'], ['Transfer Log entries', '3 in total', '25 in total', 'Unlimited'],
    ['Players'], ['AI Search (Beta)', '3 / day', '20 / day', '50 / day'], ['Filter', T, T, T], ['Targets', T, T, T],
    ['Players with No Agents', 'First 75 results', 'First 250 results', 'All results'],
    ['Season Report'], ['Teams', T, T, T], ['Standings', T, T, T],
    ['Transfer Updates'], ['Live Journalism', T, T, T], ['Live Deals', T, T, T], ['Done Deals', T, T, T], ['News Dashboard', T, T, T],
    ['Account'], ['Users', '1', '1', '1'],
  ];

  /* ---------------- state ---------------- */
  const store = { get: k => { try { return localStorage.getItem('ad_pricing_' + k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem('ad_pricing_' + k, v); } catch (e) {} } };
  const savedC = store.get('country');
  const S = {
    aud: 'individual',
    period: 'monthly',
    country: B.COUNTRIES.some(c => c.id === savedC) ? savedC : B.guessCountry(),
    buyer: store.get('buyer') === 'private' ? 'private' : 'business',
    seats: 3,
    mobilePlan: 'pro',
  };
  const fmt = B.fmt;
  const tx = () => B.tax(S.country, S.buyer);
  const incl = () => !!tx().incl && S.aud !== 'enterprise';
  const shown = c => incl() ? B.shown(c, S.country, S.buyer) : c;     // what the page shows for a net amount
  const disp = (id, per = S.period, seats = 1) => B.display(id, per, { seats, country: S.country, buyer: S.buyer });
  const taxTag = () => { const t = tx(); return S.aud === 'enterprise' ? '+ VAT' : t.mode === 'unknown' ? '+ sales tax' : t.mode === 'none' ? 'no VAT' : t.incl ? 'incl. VAT' : '+ VAT'; };

  /* ---------------- dates ---------------- */
  const fmtDate = (d, time = true) => d.toLocaleString('en-GB', time
    ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
    : { weekday: 'short', day: 'numeric', month: 'short' });
  const longDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const shortDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const trialEnd = () => new Date(Date.now() + TRIAL_HOURS * 3600e3);
  const reminder = () => new Date(Date.now() + (TRIAL_HOURS - 48) * 3600e3);
  const periodEnd = (every, from = new Date()) => new Date(B.addPeriod(from.getTime(), every === 'year' ? 'yearly' : 'monthly'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICON = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    dash: '<span class="no" aria-label="Not included">–</span>',
  };

  /* ---------------- number tween: counts in whole cents and always lands on the exact value ---------------- */
  const PREV = new Map();
  function tween(el, key, to) {
    if (!el) return;
    const from = PREV.has(key) ? PREV.get(key) : to; PREV.set(key, to);
    el.textContent = fmt(from);
    if (from === to || RM.matches) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 520;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(k < 1 ? Math.round(from + (to - from) * e) : to);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- smooth scroll with a calm ease ---------------- */
  function glide(target, offset = 90) {
    const y = target.getBoundingClientRect().top + scrollY - offset;
    if (RM.matches) { scrollTo(0, y); return Promise.resolve(); }
    const y0 = scrollY, d = y - y0, dur = Math.min(1400, 600 + Math.abs(d) * .35), t0 = performance.now();
    return new Promise(res => {
      const step = now => {
        const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        scrollTo(0, y0 + d * e);
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- shared controls ---------------- */
  function bindSeg(el, key, after) {
    $$('button', el).forEach(b => b.addEventListener('click', () => {
      if (b.disabled) return;
      S[key] = b.dataset.v; store.set(key, S[key]); after();
    }));
  }
  function paintControls() {
    $$('[data-seg]').forEach(el => $$('button', el).forEach(b => { const on = b.dataset.v === S[el.dataset.seg]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }));
    $$('[data-tab]').forEach(b => { const on = b.dataset.tab === S.aud; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    const t = tx();
    $$('.tax-note').forEach(e => e.textContent = t.mode === 'none' && S.aud !== 'enterprise' ? 'Prices in euros. No VAT applies for your location; the final tax follows the country of your card or bank account.' : incl() ? `Prices in euros, including ${t.c.name} VAT (${t.bp / 100}%).` : 'Prices in euros, excluding VAT. Any VAT for your country is added at checkout.');
  }

  /* ---------------- plan cards ---------------- */
  function renderCards() {
    const wrap = $('#plans'); if (!wrap) return;
    wrap.innerHTML = PLANS.map(p => {
      const per = B.effPeriod(p.id, S.period), yearly = per === 'yearly', monthOnly = S.period === 'yearly' && !yearly;
      return `<article class="plan${p.rec ? ' rec' : ''}" data-plan="${p.id}">
        ${p.rec ? `<span class="rec-badge">${p.rec}</span>` : ''}
        <header><span class="fit">${esc(p.fit)}</span><h3>${p.name}</h3><p>${esc(p.who)}</p></header>
        <div class="price"><span class="amt" data-amt="${p.id}">${fmt(disp(p.id).perMonth)}</span><span class="per">/ month<br><em>${taxTag()}</em></span></div>
        <p class="bill">${yearly ? `<span data-yr="${p.id}">${fmt(disp(p.id).charge)}</span> billed yearly <span class="save">· save ${fmt(disp(p.id).saving)}</span>`
          : monthOnly ? 'Billed monthly <span class="muted">· no yearly option</span>' : 'Billed monthly'}</p>
        <button class="cta${p.rec ? ' primary' : ''}" data-start="${p.id}">Start free trial</button>
        <button class="buy-now" data-buy="${p.id}">or buy now without a trial</button>
        <ul class="key">${p.key.map(k => `<li>${ICON.check}${esc(k)}</li>`).join('')}
          ${p.id === 'elite' ? '<li class="xlink"><button class="link" data-goteam>Need seats for your team? See agency plans →</button></li>' : ''}</ul>
      </article>`;
    }).join('');
    PLANS.forEach(p => tween($(`[data-amt="${p.id}"]`, wrap), 'card-' + p.id, disp(p.id).perMonth));
    $$('[data-start]', wrap).forEach(b => b.addEventListener('click', () => openCheckout(b.dataset.start, b, 'trial')));
    $$('[data-buy]', wrap).forEach(b => b.addEventListener('click', () => openCheckout(b.dataset.buy, b, 'buy')));
    $$('[data-goteam]', wrap).forEach(b => b.addEventListener('click', goTeam));
  }
  const goTeam = () => { S.aud = 'enterprise'; renderAll(); glide($('#plansTop')); };

  /* ---------------- trial timeline ---------------- */
  function renderTimeline() {
    const t = $('#timeline'); if (!t) return;
    t.innerHTML = `
      <li><span class="dot now"></span><b>Today</b><span>Start free, ${fmt(0)}</span></li>
      <li><span class="dot"></span><b>${fmtDate(reminder(), false)}</b><span>Reminder email</span></li>
      <li><span class="dot charge"></span><b>${fmtDate(trialEnd())}</b><span>First payment, unless you cancel</span></li>`;
  }

  /* ---------------- comparison table ---------------- */
  function renderTable() {
    const tb = $('#cmp tbody'); if (!tb) return;
    tb.innerHTML = TABLE.map(r => {
      if (r.length === 1) return `<tr class="grp"><th colspan="4" scope="colgroup">${esc(r[0])}</th></tr>`;
      const help = HELP[r[0]] ? `<button class="tip" type="button" aria-label="What is ${esc(r[0])}?" data-tip="${esc(HELP[r[0]])}">?</button>` : '';
      const cells = ['basic', 'pro', 'elite'].map((id, i) => {
        const v = r[1 + i], html = v === true ? `${ICON.check}<span class="sr">Included</span>` : v == null ? ICON.dash : esc(v);
        const extra = r[0] === 'Users' && i === 2 ? '<button class="link sm" data-goteam>More seats →</button>' : '';
        return `<td data-p="${id}" class="${id === 'pro' ? 'rec-col' : ''}">${html}${extra}</td>`;
      }).join('');
      return `<tr><th scope="row"><span class="feat">${esc(r[0])}${help}</span></th>${cells}</tr>`;
    }).join('');
    $$('[data-goteam]', tb).forEach(b => b.addEventListener('click', goTeam));
    $$('#cmp thead [data-col]').forEach(th => {
      const id = th.dataset.col, per = B.effPeriod(id, S.period);
      $('.th-price', th).textContent = `${fmt(disp(id).perMonth)} / mo${per === 'yearly' ? ', billed yearly' : S.period === 'yearly' ? ', monthly only' : ''}`;
    });
    $('#cmp').dataset.show = S.mobilePlan;
    $$('[data-mplan]').forEach(b => { const on = b.dataset.mplan === S.mobilePlan; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  }

  /* ---------------- agency (team) ---------------- */
  function renderTeam() {
    if (!$('#team')) return;
    const per = S.period, seat = B.planNet('elite', per), seatPm = B.perMonth('elite', per);
    S.seats = B.clampSeats(S.seats);
    $('#seatN').textContent = S.seats;
    $('#seatMath').innerHTML = `${S.seats} seats × <b>${fmt(seatPm)}</b> a month${per === 'yearly' ? `, billed yearly (${fmt(seat)} per seat)` : ''}`;
    tween($('#teamTotal'), 'team-pm', B.perMonth('team', per, S.seats));
    $('#teamBill').textContent = `${fmt(B.planNet('team', per, S.seats))} + VAT billed ${per === 'yearly' ? 'once a year' : 'every month'}`;
    $('#seatHint').textContent = S.seats >= B.TEAM.max ? 'Need more than 10 seats? Talk to us below.' : S.seats <= B.TEAM.min ? 'Agency plans start at 2 seats.' : '';
    $$('[data-seatstep]').forEach(b => b.disabled = (+b.dataset.seatstep < 0 && S.seats <= B.TEAM.min) || (+b.dataset.seatstep > 0 && S.seats >= B.TEAM.max));
  }

  /* ---------------- checkout drawer (demo, takes no payment) ---------------- */
  const CO = { plan: 'pro', method: 'card', state: 'form', edit: false, opener: null, mode: 'trial', f: {}, remind: true, coupon: null, codeOpen: false, codeMsg: '', declared: null, vat: { input: '', status: 'idle', res: null, msg: '' } };
  function openCheckout(plan, opener, mode = 'trial') {
    CO.plan = plan; CO.mode = mode; CO.state = 'form'; CO.edit = false; CO.opener = opener || document.activeElement;
    revalidateCoupon();
    const d = $('#checkout'); renderCheckout();
    d.hidden = false; requestAnimationFrame(() => d.classList.add('open'));
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('.co-close', d).focus(), 60);
  }
  function closeCheckout() {
    const d = $('#checkout'); d.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(() => { d.hidden = true; if (CO.opener && document.contains(CO.opener)) CO.opener.focus(); }, 320);
  }
  document.addEventListener('keydown', e => {
    const d = $('#checkout'); if (d.hidden) return;
    if (e.key === 'Escape') { closeCheckout(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('button:not([disabled]), select, a[href], input, [tabindex]:not([tabindex="-1"])', d.querySelector('.panel')).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* ---------- who decides the VAT ----------
     1. the payment method's country (card issuer, IBAN, wallet/PayPal account) - can't be changed by typing
     2. the visitor's location (S.country) is only an estimate until then, and a second piece of evidence after
     3. if they clearly conflict (a no-VAT country card, but connecting from an EU country) the buyer confirms where they live
     4. a business gets the reverse charge only with a VAT ID verified for the same country */
  const WALLET_IDS = ['apple', 'google', 'paypal'];
  const cn = id => B.country(id).name;
  const noVat = id => { const c = B.country(id); return c.vat === null || c.vat === 0; };
  function payEvidence() {
    if (WALLET_IDS.includes(CO.method)) return { id: S.country, how: CO.method, wallet: true };
    if (CO.method === 'sepa') return B.ibanCountry(CO.f.iban);
    return B.cardCountry(CO.f.num);
  }
  function taxCountry() {
    const ev = payEvidence();
    if (!ev) return { id: S.country, state: 'estimate' };
    if (ev.unknown) return { id: S.country, state: 'unknown', how: ev.how };
    if (noVat(ev.id) && !noVat(S.country)) {
      if (CO.declared === ev.id || CO.declared === S.country) return { id: CO.declared, state: 'declared', how: ev.how, pay: ev.id };
      return { id: S.country, state: 'declare', how: ev.how, pay: ev.id };
    }
    return { id: ev.id, state: ev.wallet ? 'wallet' : 'payment', how: ev.how, pay: ev.id };
  }
  const vatOk = () => CO.vat.status === 'valid' && CO.vat.res && CO.vat.res.cc === taxCountry().id;
  const args = () => ({ plan: CO.plan, period: S.period, seats: S.seats, country: taxCountry().id, buyer: CO.plan === 'team' ? 'business' : S.buyer, vatOk: vatOk(), coupon: CO.coupon });
  const isBusiness = () => CO.plan === 'team' || S.buyer === 'business';
  const HOW = { card: 'your card', iban: 'your bank account', apple: 'your Apple Pay card', google: 'your Google Pay card', paypal: 'your PayPal account' };
  function taxBlock(q) {
    const t = taxCountry(), here = cn(S.country);
    let line;
    if (t.state === 'estimate') line = `VAT is <b>estimated for ${here}</b> from your location. The final VAT follows the country of the card or bank account you pay with.`;
    else if (t.state === 'unknown') line = `We couldn't read the country of ${HOW[t.how]} in this demo, so the estimate for ${here} is used. Live, the payment provider always returns it.`;
    else if (t.state === 'wallet') line = `VAT for <b>${cn(t.id)}</b>, taken from ${HOW[t.how]} when you confirm in the next step.`;
    else if (t.state === 'declare' || t.state === 'declared') line = `${HOW[t.how][0].toUpperCase() + HOW[t.how].slice(1)} is from <b>${cn(t.pay)}</b>, but you're connecting from <b>${here}</b>. Where do you live?
        <span class="declare" role="radiogroup" aria-label="Country you live in">${[t.pay, S.country].map(id => `<button type="button" role="radio" aria-checked="${CO.declared === id}" class="${CO.declared === id ? 'on' : ''}" data-declare="${id}">${cn(id)}</button>`).join('')}</span>${t.state === 'declared' ? `<span class="decl-note">VAT for <b>${cn(t.id)}</b>. We keep your answer with the payment record.</span>` : ''}`;
    else line = `VAT for <b>${cn(t.id)}</b>, based on ${HOW[t.how]}${t.state === 'declared' ? ' and your confirmation' : ''}.${t.id !== S.country && t.state !== 'declared' ? ` Your connection looks like ${here}; that doesn't change anything.` : ''}`;
    let vat = '';
    if (isBusiness()) {
      const v = CO.vat, st = v.status, r = v.res, home = t.id === B.HOME;
      const msg = st === 'checking' ? '<span class="vat-st">Checking the EU register…</span>'
        : st === 'invalid' ? `<span class="vat-st bad" role="alert">${v.msg}</span>`
        : st === 'valid' && r.cc !== t.id ? `<span class="vat-st bad" role="alert">This VAT ID is from ${cn(r.cc)}, but ${HOW[t.how] || 'your payment method'} is from ${cn(t.id)}. VAT is added until they match.</span>`
        : st === 'valid' ? `<span class="vat-st ok">Verified${home ? ' · German businesses pay 19% VAT and reclaim it in their VAT return' : ' · reverse charge, no VAT added'}</span>`
        : `<span class="vat-st">${home ? 'Optional for German businesses: shown on your invoice.' : 'Without a verified VAT ID, VAT is added as for a private buyer.'}</span>`;
      vat = `<div class="vat-row"><label class="input_label" for="coVat">Business VAT ID</label>
        <div class="code-in"><input id="coVat" class="input_field" placeholder="e.g. DE123456789" autocomplete="off" spellcheck="false" value="${esc(v.input)}"><button type="button" class="code-apply" data-vatcheck ${st === 'checking' ? 'disabled' : ''}>${st === 'valid' ? 'Re-check' : 'Verify'}</button></div>${msg}</div>`;
    }
    return `<div class="co-sec co-tax">
        <span class="co-lab">Buying as</span>
        ${CO.plan === 'team' ? '<p class="co-fine">Agency plans are for businesses.</p>' : '<div class="seg sm" data-seg="buyer" aria-label="Buying as"><button data-v="business">Business</button><button data-v="private">Private</button></div>'}
        ${vat}
        <p class="tax-ev">${line}</p>
      </div>`;
  }
  function revalidateCoupon() {
    if (!CO.coupon) return;
    const r = B.checkCoupon(CO.coupon.code, { plan: CO.plan, period: S.period });
    if (!r.ok) { CO.codeMsg = `${CO.coupon.code} was removed: ${r.error.toLowerCase()}`; CO.coupon = null; CO.codeOpen = true; }
  }
  /* lines exactly as the invoice will show them; for private buyers in VAT-inclusive form, still summing to the total */
  function displayLines(q) {
    if (!(q.tax.incl && q.tax.mode === 'add')) return { lines: q.lines.map(l => [l.label, l.c]), vatLine: [q.taxLabel, q.taxValue], inclusive: false };
    const g = c => c + B.pct(c, q.tax.bp);
    const lines = q.lines.map(l => [l.label, l.c >= 0 ? g(l.c) : -g(-l.c)]);
    const diff = q.total - lines.reduce((a, l) => a + l[1], 0);
    lines[lines.length - 1][1] += diff;                       // absorb the 1-cent rounding so the lines add up
    return { lines, vatLine: [`Includes VAT ${q.tax.bp / 100}% (${q.tax.c.name})`, fmt(q.vat)], inclusive: true };
  }
  function authUrl(q) {
    const u = new URLSearchParams({ mode: 'signup', plan: CO.plan, period: q.period, seats: q.seats, trial: CO.mode === 'buy' ? '0' : '1',
      country: taxCountry().id, buyer: args().buyer, vatid: vatOk() ? CO.vat.res.id : '', ev: taxCountry().state === 'declared' ? 'declared' : (taxCountry().how || 'estimate'), ip: S.country,
      coupon: CO.coupon ? CO.coupon.code : '', remind: CO.remind ? '1' : '0' });
    return 'auth.html?' + u.toString();
  }
  const WALLETS = [
    ['apple', 'Apple Pay', '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M16.37 12.6c-.03-2.73 2.23-4.05 2.33-4.11-1.27-1.86-3.25-2.11-3.95-2.14-1.68-.17-3.28.99-4.13.99-.86 0-2.17-.97-3.57-.94-1.84.03-3.53 1.07-4.48 2.71-1.91 3.31-.49 8.22 1.37 10.91.91 1.31 2 2.79 3.42 2.74 1.37-.05 1.89-.89 3.55-.89 1.65 0 2.12.89 3.57.86 1.48-.03 2.41-1.34 3.31-2.66 1.04-1.52 1.47-3 1.5-3.07-.03-.02-2.88-1.11-2.92-4.4zM13.65 4.58c.75-.92 1.26-2.19 1.12-3.46-1.08.04-2.4.72-3.18 1.63-.69.8-1.31 2.1-1.14 3.34 1.21.09 2.44-.61 3.2-1.51z"/></svg><b>Pay</b>'],
    ['google', 'Google Pay', '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1z"/><path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.86 8.88 4.75 12 4.75z"/></svg><b>Pay</b>'],
    ['paypal', 'PayPal', '<b class="pp"><i>Pay</i>Pal</b>'],
    ['sepa', 'SEPA Direct Debit', '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg><b class="sepa">SEPA</b>'],
  ];
  function remindRow(q) {
    return `<label class="co-remind"><input type="checkbox" id="coRemind" ${CO.remind ? 'checked' : ''}><span class="tgl-k" aria-hidden="true"></span>
      <span><b>Payment reminders</b><small>Email me 3 days before every ${q.every === 'year' ? 'yearly' : 'monthly'} payment${CO.mode === 'buy' ? '' : ' (the trial reminder is always sent)'}.</small></span></label>`;
  }
  function couponBlock() {
    if (CO.coupon) return `<div class="code-on" role="status"><span><b>${esc(CO.coupon.code)}</b> · ${esc(CO.coupon.label)}</span><button type="button" class="code-x" data-uncode aria-label="Remove code ${esc(CO.coupon.code)}">Remove</button></div>`;
    if (!CO.codeOpen) return `<button type="button" class="pay-switch" data-codeopen>Have a discount code?</button>${CO.codeMsg ? `<p class="code-err" role="alert">${esc(CO.codeMsg)}</p>` : ''}`;
    return `<div class="code-row"><div class="input_container"><label class="input_label" for="pf-code">Discount code</label>
        <div class="code-in"><input id="pf-code" class="input_field" placeholder="e.g. WELCOME10" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(CO.f.code || '')}"><button type="button" class="code-apply" data-applycode>Apply</button></div></div>
        ${CO.codeMsg ? `<p class="code-err" role="alert">${esc(CO.codeMsg)}</p>` : '<p class="pay-note">Demo codes: WELCOME10, AGENT20, AGENCY10 (agency).</p>'}</div>`;
  }
  const ready = () => { const s = taxCountry().state; return s !== 'estimate' && s !== 'declare'; };
  const demoHint = () => CO.method === 'card' ? '<p class="pay-note">Demo cards by country: 4000 0027 6000 0016 Germany · 4000 0025 0000 0003 France · 4000 0052 8000 0002 Netherlands · 4242 4242 4242 4242 United States.</p>'
    : CO.method === 'sepa' ? '<p class="pay-note">Demo: the IBAN\'s first two letters (DE, NL, FR…) set the country.</p>' : '';
  function payCard(label, q, short) {
    const m = CO.method, wallet = WALLETS.find(w => w[0] === m && m !== 'sepa'), f = CO.f;
    const inp = (name, lab, ph, extra = '') => `<div class="input_container"><label class="input_label" for="pf-${name}">${lab}</label><input id="pf-${name}" class="input_field" name="${name}" placeholder="${ph}" value="${esc(f[name] || '')}" ${extra}></div>`;
    const fields = wallet ? `<p class="pay-wallet">You'll confirm with <b>${wallet[1]}</b> in the next step. Nothing is charged before you confirm.</p>`
      : m === 'sepa' ? `<div class="credit-card-info--form">${inp('holder', 'Account holder', 'Name on the account', 'autocomplete="name"')}${inp('iban', 'IBAN', 'DE00 0000 0000 0000 0000 00', 'inputmode="text" autocomplete="off"')}
          <p class="pay-note">By confirming you authorise Agents Desk to collect payments from this account by SEPA Direct Debit.</p></div>`
      : `<div class="credit-card-info--form">${inp('holder', 'Card holder', 'Full name on the card', 'autocomplete="cc-name"')}${inp('num', 'Card number', '0000 0000 0000 0000', 'inputmode="numeric" autocomplete="cc-number"')}
          <div class="split">${inp('exp', 'Expiry date', 'MM / YY', 'inputmode="numeric" autocomplete="cc-exp"')}${inp('cvc', 'CVV', '123', 'inputmode="numeric" autocomplete="cc-csc"')}</div></div>`;
    const sep = wallet ? `${wallet[1]} selected` : m === 'sepa' ? 'SEPA Direct Debit selected' : 'or pay using card';
    return `<div class="pay-card">
      <span class="pay-h">Pay with</span>
      <div class="payment--options" role="radiogroup" aria-label="Payment method">${WALLETS.map(w => `<button type="button" role="radio" aria-checked="${m === w[0]}" aria-label="${w[1]}" class="${m === w[0] ? 'on' : ''}" data-m="${w[0]}">${w[2]}</button>`).join('')}</div>
      <div class="separator"><hr class="line"><p>${sep}</p><hr class="line"></div>
      ${fields}
      ${m !== 'card' ? '<button type="button" class="pay-switch" data-m="card">Pay by card instead</button>' : ''}
      <div class="code-wrap">${couponBlock()}</div>
      ${demoHint()}
      <button type="button" class="Btn pay-btn" data-go ${ready() ? '' : 'disabled'}><svg class="svgIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9V7a5 5 0 0 0-10 0v2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3zM9 7a3 3 0 0 1 6 0v2H9zm4 9.7V18h-2v-1.3a2 2 0 1 1 2 0z"/></svg><span>${!ready() ? (taxCountry().state === 'declare' ? 'Confirm where you live above' : m === 'sepa' ? 'Enter your IBAN to continue' : 'Enter your card to continue') : wallet ? `${short} with ${wallet[1]}` : label}</span></button>
      <p class="pay-secure">Secured by our payment provider. Agents Desk never sees your full card or bank details.${q.plan === 'team' ? ' Paying by invoice? <a href="mailto:info@agentsdesk.football?subject=Agency%20plan%20by%20invoice">Talk to us</a>.' : ''}</p>
    </div>`;
  }
  /* the amount of payment number i (0 = first) as text, honouring coupon duration */
  const payAt = i => { const x = B.quote({ ...args(), payIndex: i }); return x.tax.mode === 'unknown' ? `${fmt(x.net)} + tax` : fmt(x.total); };
  /* plain-language schedule for every payment after payment number `from` */
  function after(from, q) {
    const cp = q.coupon, every = q.every;
    if (cp && cp.duration === 'repeating' && from + 1 < cp.times) {
      const left = cp.times - from - 1;
      return `${payAt(from + 1)} for the next ${left} payment${left > 1 ? 's' : ''}, then ${payAt(cp.times)} every ${every}`;
    }
    return `${payAt(from + 1)} every ${every}`;
  }
  function summary(q, buy) {
    const dl = displayLines(q), end = trialEnd(), rem = reminder();
    const lines = dl.lines.map(([l, c]) => `<div class="ln${c < 0 ? ' minus' : ''}"><span>${esc(l)}</span><span>${fmt(c)}</span></div>`).join('');
    const est = !ready();
    const vat = `<div class="ln vat"><span>${esc(dl.vatLine[0])}${est ? ' · estimated' : ''}</span><span>${esc(dl.vatLine[1])}</span></div>`;
    const total = payAt(0);
    if (buy) return `<div class="co-sum">${lines}${dl.inclusive ? '' : vat}
        <div class="ln due"><span>Due today</span><span class="pay" id="coDue">${total}</span></div>${dl.inclusive ? vat : ''}
        <div class="ln"><span>Then</span><span>${after(0, q)}, from ${longDate(periodEnd(q.every))}</span></div></div>`;
    return `<div class="co-sum">
        <div class="ln due"><span>Due today</span><span>${fmt(0)}</span></div>
        <div class="ln"><span>Reminder email</span><span>${fmtDate(rem)}</span></div>
        ${lines}${dl.inclusive ? '' : vat}
        <div class="ln first"><span>First payment, if you don't cancel</span><span id="coDue">${total}<time>${fmtDate(end)}</time></span></div>${dl.inclusive ? vat : ''}
        <div class="ln"><span>Then</span><span>${after(0, q)} until you cancel</span></div></div>`;
  }
  /* the checkout shows amounts for the country that will actually be taxed, not the page estimate */
  const qShow = (q, c) => q.tax.mode === 'add' && q.tax.incl ? c + B.pct(c, q.tax.bp) : c;
  const qTag = q => ({ add: q.tax.incl ? 'incl. VAT' : '+ VAT', reverse: 'no VAT · reverse charge', none: 'no VAT', unknown: '+ tax' })[q.tax.mode];
  function renderCheckout() {
    const box = $('#coBody'), q = B.quote(args()), end = trialEnd(), rem = reminder();
    const totalTxt = q.tax.mode === 'unknown' ? `${fmt(q.net)} + tax` : fmt(q.total);
    $('#coH').textContent = CO.state === 'paid' ? 'You\'re all set' : CO.mode === 'buy' ? 'Buy your plan' : 'Start your free trial';

    if (CO.state !== 'form') {
      const cancelled = CO.state === 'cancelled', paid = CO.state === 'paid';
      box.innerHTML = `<div class="co-done ${cancelled ? 'is-cancel' : ''}" role="status">
        <div class="co-big" aria-hidden="true">${cancelled ? '✕' : '✓'}</div>
        <h3>${cancelled ? 'Trial cancelled. You won\'t be charged.' : paid ? 'Payment received' : 'Your free trial has started'}</h3>
        <p>${cancelled ? `You keep access until <b>${fmtDate(end)}</b>. After that your account becomes read-only, and nothing is charged.`
          : paid ? `You paid <b>${totalTxt}</b>. Your plan runs until ${longDate(periodEnd(q.every))}${q.every === 'year' ? `, with a full refund available for ${REFUND_DAYS} days` : ''}. We've emailed your receipt.`
          : `Nothing was charged today. We'll email you on <b>${fmtDate(rem)}</b>. If you don't cancel, <b>${totalTxt}</b> is charged on <b>${fmtDate(end)}</b>.`}</p>
        ${cancelled ? '<button class="cta primary" data-again>Back to plans</button>'
          : `<a class="cta primary wide" href="${authUrl(q)}">Create your account and open your desk →</a>${paid ? '' : '<button class="cta" data-cancel>Cancel trial</button><p class="co-fine">This is the same one-click cancel you get in Settings › Plan &amp; billing.</p>'}`}
        <p class="co-demo">Demo only. No payment was taken.</p></div>`;
      const c = $('[data-cancel]', box); if (c) c.addEventListener('click', () => { CO.state = 'cancelled'; renderCheckout(); $('[data-again]', box).focus(); });
      const a = $('[data-again]', box); if (a) a.addEventListener('click', closeCheckout);
      return;
    }

    const buy = CO.mode === 'buy', team = CO.plan === 'team', pl = PLANS.find(p => p.id === CO.plan);
    box.innerHTML = `
      <div class="co-mode" role="radiogroup" aria-label="How do you want to start?">
        <button role="radio" aria-checked="${!buy}" class="${!buy ? 'on' : ''}" data-mode="trial"><b>7-day free trial</b><small>${fmt(0)} today, pay later</small></button>
        <button role="radio" aria-checked="${buy}" class="${buy ? 'on' : ''}" data-mode="buy"><b>Buy now</b><small>Skip the trial, start today</small></button>
      </div>
      <div class="co-pick">
        <div><span class="co-lab">Your plan</span><b>${esc(q.lines[0].label)}</b><span class="muted">${fmt(qShow(q, q.sub))} ${qTag(q)} per ${q.every}${team ? ` · ${q.lines[0].note}` : ''}</span></div>
        ${team ? '' : `<button class="link" data-edit aria-expanded="${CO.edit}">${CO.edit ? 'Done' : 'Change'}</button>`}
      </div>
      ${CO.edit && !team ? `<div class="co-edit">
        <div class="co-plans" role="radiogroup" aria-label="Plan">${PLANS.map(p => `<button class="co-plan${p.id === CO.plan ? ' on' : ''}" role="radio" aria-checked="${p.id === CO.plan}" data-p="${p.id}"><b>${p.name}</b><span>${fmt(B.display(p.id, S.period, { country: q.tax.c.id, buyer: S.buyer, vatOk: vatOk() }).perMonth)}/mo</span></button>`).join('')}</div>
      </div>` : ''}
      ${taxBlock(q)}
      ${summary(q, buy)}
      ${remindRow(q)}
      ${buy ? payCard(`Pay ${totalTxt} and start now`, q, `Pay ${totalTxt}`) : payCard(`Start free trial · ${fmt(0)} today`, q, 'Start free trial')}
      <p class="co-fine">${buy ? `Your plan starts immediately. Cancel any time in Settings › Plan &amp; billing; you keep access until the end of the period you paid for.${q.every === 'year' ? ` Full refund if you ask within ${REFUND_DAYS} days.` : ''}`
        : `Cancel any time before ${fmtDate(end)} in Settings › Plan &amp; billing or from the reminder email, and you pay nothing. One free trial per person.${q.every === 'year' ? ` Changed your mind after the first yearly payment? Full refund within ${REFUND_DAYS} days.` : ''}`}</p>
      <p class="co-links"><a href="https://agentsdesk.football/term-of-service" target="_blank" rel="noopener">Terms</a><a href="#faq-refunds" data-close>Refund policy</a><a href="https://agentsdesk.football/privacy-policy" target="_blank" rel="noopener">Privacy</a></p>
      <p class="co-demo">Demo checkout: nothing is charged and no data is sent.</p>`;

    /* animate the amount due from its previous value */
    const due = $('#coDue', box); if (due && q.tax.mode !== 'unknown') { const keep = due.querySelector('time'); const span = document.createElement('span'); due.firstChild.replaceWith(span); tween(span, 'co-due', q.total); if (keep) due.appendChild(keep); }

    const ed = $('[data-edit]', box); if (ed) ed.addEventListener('click', () => { CO.edit = !CO.edit; renderCheckout(); $('[data-edit]', box).focus(); });
    $$('[data-p]', box).forEach(b => b.addEventListener('click', () => {
      CO.plan = b.dataset.p;
      if (!B.hasYearly(CO.plan) && S.period === 'yearly') { S.period = 'monthly'; store.set('period', 'monthly'); }
      revalidateCoupon(); renderAll(); renderCheckout(); $(`[data-p="${CO.plan}"]`, box).focus();
    }));
    const sg = $('[data-seg="period"]', box); if (sg) bindSeg(sg, 'period', () => { revalidateCoupon(); renderAll(); renderCheckout(); });
    const bs = $('[data-seg="buyer"]', box); if (bs) bindSeg(bs, 'buyer', () => { renderAll(); renderCheckout(); });
    $$('[data-declare]', box).forEach(b => b.addEventListener('click', () => { CO.declared = b.dataset.declare; renderCheckout(); const g = $('[data-go]', box); g && g.focus(); }));
    const vi = $('#coVat', box);
    if (vi) {
      vi.addEventListener('input', () => { CO.vat.input = vi.value; });
      const check = async () => {
        CO.vat.input = vi.value; CO.vat.status = 'checking'; renderCheckout();
        const r = await B.verifyVat(CO.vat.input);
        CO.vat = { input: r.valid ? r.id : CO.vat.input, status: r.valid ? 'valid' : 'invalid', res: r.valid ? r : null, msg: r.error || '' };
        renderCheckout(); const n = $('#coVat', box); n && n.focus();
      };
      vi.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      $('[data-vatcheck]', box).addEventListener('click', check);
    }
    const rm = $('#coRemind', box); if (rm) rm.addEventListener('change', e => { CO.remind = e.target.checked; });
    $$('[data-m]', box).forEach(b => b.addEventListener('click', () => { CO.method = CO.method === b.dataset.m && b.dataset.m !== 'card' ? 'card' : b.dataset.m; renderCheckout(); const f = $(`.payment--options [data-m="${CO.method}"]`, box) || $('#pf-holder', box); f && f.focus(); }));
    $$('.pay-card input:not(#pf-code)', box).forEach(i => i.addEventListener('input', () => {
      let v = i.value;
      if (i.name === 'num') v = v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
      if (i.name === 'exp') { v = v.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + ' / ' + v.slice(2); }
      if (i.name === 'cvc') v = v.replace(/\D/g, '').slice(0, 4);
      if (i.name === 'iban') v = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 34).replace(/(.{4})(?=.)/g, '$1 ');
      if (v !== i.value) i.value = v;
      const before = JSON.stringify(taxCountry()); CO.f[i.name] = v;
      if (JSON.stringify(taxCountry()) !== before) {
        if (taxCountry().state !== 'declared') CO.declared = null;
        renderCheckout(); const n = $('#pf-' + i.name, box); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
      }
    }));
    /* discount code */
    const co = $('[data-codeopen]', box); if (co) co.addEventListener('click', () => { CO.codeOpen = true; CO.codeMsg = ''; renderCheckout(); $('#pf-code', box).focus(); });
    const ci = $('#pf-code', box);
    const apply = () => {
      const r = B.checkCoupon(ci.value, { plan: CO.plan, period: S.period });
      CO.f.code = ci.value;
      if (r.ok) { CO.coupon = r; CO.codeMsg = ''; CO.f.code = ''; renderCheckout(); const x = $('[data-uncode]', box); x && x.focus(); }
      else { CO.codeMsg = r.error || 'Enter a code first.'; renderCheckout(); $('#pf-code', box).focus(); }
    };
    if (ci) { ci.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }); $('[data-applycode]', box).addEventListener('click', apply); }
    const un = $('[data-uncode]', box); if (un) un.addEventListener('click', () => { CO.coupon = null; CO.codeOpen = true; CO.codeMsg = ''; renderCheckout(); $('#pf-code', box).focus(); });
    $$('[data-close]', box).forEach(a => a.addEventListener('click', () => { closeCheckout(); const qa = $('#faq-refunds'); if (qa) { qa.classList.add('open'); $('button', qa).setAttribute('aria-expanded', 'true'); } }));
    $$('[data-mode]', box).forEach(b => b.addEventListener('click', () => { CO.mode = b.dataset.mode; renderCheckout(); $(`[data-mode="${CO.mode}"]`, box).focus(); }));
    $('[data-go]', box).addEventListener('click', () => { if (!ready()) return; CO.state = CO.mode === 'buy' ? 'paid' : 'started'; renderCheckout(); const n = $('.co-done a', box); if (n) n.focus(); });
    paintControls();
    if (sg && !B.hasYearly(CO.plan)) $$('button', sg).forEach(b => { const on = b.dataset.v === 'monthly'; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  }

  /* ---------------- audience ---------------- */
  function renderAud() {
    const team = S.aud === 'enterprise';
    $('#plans').hidden = team; $('#team').hidden = !team;
    $$('.only-ind').forEach(e => e.hidden = team);
  }
  function renderAll() { renderAud(); paintControls(); renderCards(); renderTimeline(); renderTable(); renderTeam(); }

  /* ---------------- wire up ---------------- */
  $$('[data-seg]').forEach(el => bindSeg(el, el.dataset.seg, renderAll));
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => { S.aud = b.dataset.tab; renderAll(); }));
  $$('[data-mplan]').forEach(b => b.addEventListener('click', () => { S.mobilePlan = b.dataset.mplan; renderTable(); }));
  $$('[data-seatstep]').forEach(b => b.addEventListener('click', () => { S.seats = B.clampSeats(S.seats + +b.dataset.seatstep); renderTeam(); }));
  $$('[data-team-start]').forEach(b => b.addEventListener('click', () => openCheckout('team', b)));
  $$('[data-close]').forEach(b => b.addEventListener('click', closeCheckout));
  /* "Not sure which plan?" glides to the comparison table and highlights it */
  $$('[data-tocompare]').forEach(b => b.addEventListener('click', async () => {
    const t = $('#compare'), w = $('.tbl-wrap', t);
    await glide(t, 70);
    if (w) { w.classList.remove('glow'); void w.offsetWidth; w.classList.add('glow'); }
    const h = $('#cmpH'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }));

  /* FAQ */
  $$('.qa').forEach(q => { const b = $('button', q); b.addEventListener('click', () => { const open = !q.classList.contains('open'); q.classList.toggle('open', open); b.setAttribute('aria-expanded', open); }); });
  /* nav sheet */
  const burger = $('#burger'), sheet = $('#sheet');
  if (burger) burger.addEventListener('click', () => { const o = sheet.hidden; sheet.hidden = !o; burger.setAttribute('aria-expanded', o); });
  /* reveals (content stays visible if this script never runs) */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.rv').forEach(el => io.observe(el));

  renderAll();
  setInterval(renderTimeline, 60000);
})();
