/* Agents Desk sign up / log in (demo).
   No credentials are checked or stored. Both buttons create a local demo session and open the dashboard.
   URL options: ?mode=signup|login  &plan=basic|pro|elite  &period=monthly|yearly  &trial=1|0  &cur=EUR  &vat=19  &country=Germany
   The hash (e.g. #app-ai) is kept so you land on the page you clicked. */
(function () {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
               set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const q = new URLSearchParams(location.search);
  const next = location.hash && location.hash.startsWith('#app-') ? location.hash : '#app-overview';
  const PLAN_NAMES = { basic: 'Basic', pro: 'Pro', elite: 'Elite', team: 'Agency plan' };
  const plan = PLAN_NAMES[q.get('plan')] ? q.get('plan') : null;
  const period = q.get('period') === 'yearly' && plan !== 'basic' ? 'yearly' : 'monthly';
  const trial = q.get('trial') !== '0';
  const session = ls.get('ad-session', null);
  let mode = q.get('mode') || (ls.get('ad-known', false) ? 'login' : 'signup');

  /* notices */
  const notice = $('#notice');
  const say = (msg, kind = '') => { notice.textContent = msg; notice.className = 'auth-note ' + kind; notice.hidden = false; };
  if (q.get('loggedout')) say('You\'re logged out. See you soon.', 'ok');
  else if (q.get('deleted')) say('Your account was deleted. Thanks for trying Agents Desk.');
  else if (session && !plan) { mode = 'login'; say(`You're signed in as ${session.email}. Press Log in to continue.`, 'ok'); }

  /* mode switching: one form, fields shown per mode */
  const form = $('#authForm');
  function setMode(m) {
    mode = m === 'login' ? 'login' : 'signup';
    const signup = mode === 'signup';
    $$('[data-only]').forEach(e => e.hidden = e.dataset.only !== mode);
    $('#aTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#aSub').innerHTML = signup
      ? (plan ? `${trial ? 'Your plan' : 'Paid'}: <b>${PLANS_LBL()}</b>. ${trial ? 'Free for 3 days.' : 'Create your account to open your desk.'}` : 'Start with a 3-day free trial.')
      : 'Log in to your desk.';
    $('#aGo').textContent = signup ? 'Sign up' : 'Log in';
    $('#fPw').autocomplete = signup ? 'new-password' : 'current-password';
    $('#switchLine').innerHTML = signup ? 'Already have an account? <button type="button" class="span" data-to="login">Log in</button>' : 'Don\'t have an account? <button type="button" class="span" data-to="signup">Sign up</button>';
    $('[data-to]').addEventListener('click', e => { setMode(e.target.dataset.to); $(mode === 'signup' ? '#fName' : '#fEmail').focus(); });
    const u = new URL(location.href); u.searchParams.set('mode', mode); history.replaceState(null, '', u);
  }
  const PLANS_LBL = () => `${PLAN_NAMES[plan]} · ${period}`;
  if (session && !q.get('loggedout')) $('#fEmail').value = session.email || '';
  setMode(mode);

  /* show / hide password */
  $('#eye').addEventListener('click', () => {
    const i = $('#fPw'), show = i.type === 'password';
    i.type = show ? 'text' : 'password'; $('#eye').setAttribute('aria-pressed', show); $('#eye').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
  $('#forgot').addEventListener('click', () => say('If an account exists for that email, a reset link is on its way. (Demo: no email is sent.)', 'ok'));
  $$('[data-sso]').forEach(b => b.addEventListener('click', () => submit(mode, { name: '', email: '' }, $('#aGo'))));

  /* submit: demo, so empty fields are fine */
  form.addEventListener('submit', e => { e.preventDefault(); const f = new FormData(form); submit(mode, { name: mode === 'signup' ? f.get('name') : '', email: f.get('email') }, $('#aGo')); });

  function submit(kind, d, btn) {
    const email = (d.email || '').toString().trim() || 'demo@agentsdesk.football';
    const name = (d.name || '').toString().trim() || (session && session.email === email ? session.name : 'Demo Agent');
    ls.set('ad-session', Object.assign({}, session || {}, { name, email }));
    ls.set('ad-known', true);
    /* the subscription is built with the same billing engine as the checkout (js/billing.js), in cents */
    const B = window.ADB, nowT = Date.now();
    const isTeam = q.get('plan') === 'team', seats = isTeam ? B.clampSeats(+q.get('seats') || 3) : 1;
    const cid = B.COUNTRIES.some(c => c.id === q.get('country')) ? q.get('country') : 'DE';
    const buyer = isTeam ? 'business' : (q.get('buyer') === 'private' ? 'private' : 'business');
    const per = B.effPeriod(isTeam ? 'team' : (plan || 'pro'), period === 'yearly' || q.get('period') === 'yearly' ? 'yearly' : 'monthly');
    const cpn = q.get('coupon') ? B.checkCoupon(q.get('coupon'), { plan: isTeam ? 'team' : (plan || 'pro'), period: per }) : null;
    const vatId = q.get('vatid') || '', vOk = !!vatId;
    const evidence = { pay: q.get('ev') || 'estimate', payCountry: cid, ipCountry: q.get('ip') || cid, at: nowT };
    const base = { v: 2, vatId, vatOk: vOk, evidence, plan: isTeam ? 'elite' : (plan || 'pro'), seats, period: per, countryId: cid, buyer, coupon: cpn && cpn.ok ? cpn : null,
      payIndex: 0, credit: 0, remind: q.get('remind') !== '0', method: { type: 'card', label: 'Visa •••• 4242', exp: '08/28' }, backup: null, invoices: [],
      credits: { bal: 0, on: false, cap: null, auto: { on: false, below: 500, add: 2500 }, spent: 0, month: new Date().toISOString().slice(0, 7), log: [] } };
    const bp = base.seats > 1 ? 'team' : base.plan;
    if (kind === 'signup' || plan || isTeam) {
      if (trial) ls.set('ad-sub', Object.assign(base, { status: 'trialing', start: nowT, trialEnd: nowT + 72 * 36e5 }));
      else { /* paid on the pricing page: active from today, first invoice from the same quote */
        const qt = B.quote({ plan: bp, period: per, seats, country: cid, buyer, vatOk: vOk, coupon: base.coupon, payIndex: 0 });
        ls.set('ad-sub', Object.assign(base, { status: 'active', start: nowT, trialEnd: nowT, paidSince: nowT, periodEnd: B.addPeriod(nowT, per),
          payIndex: 1, lastPaidNet: qt.net, invoices: [B.invoiceFrom(qt, nowT)] }));
      }
    } else if (!ls.get('ad-sub', null) || (ls.get('ad-sub', {}).v || 0) < 2) {
      /* returning demo user: an active Pro monthly plan, paid 18 days ago, with some credits */
      const paid = nowT - 18 * 864e5, qt = B.quote({ plan: 'pro', period: 'monthly', country: 'DE', buyer: 'business' });
      const inv1 = B.invoiceFrom(qt, paid);
      const topup = { lines: [{ label: 'Credit top-up', c: 2500 }], net: 2500, vat: B.pct(2500, 1900) };
      const inv2 = Object.assign(B.invoiceFrom(Object.assign({}, qt, topup, { total: topup.net + topup.vat }), paid + 9 * 864e5, 'Credit top-up', [inv1]));
      ls.set('ad-sub', Object.assign(base, { plan: 'pro', period: 'monthly', status: 'active', start: paid, trialEnd: paid, paidSince: paid, periodEnd: B.addPeriod(paid, 'monthly'),
        payIndex: 1, lastPaidNet: qt.net, invoices: [inv2, inv1],
        credits: { bal: 2140, on: true, cap: 5000, auto: { on: false, below: 500, add: 2500 }, spent: 360, month: new Date().toISOString().slice(0, 7),
          log: [{ at: nowT - 2 * 864e5, what: '18 extra AI searches', amt: -360 }, { at: paid + 9 * 864e5, what: 'Top-up', amt: 2500 }] } }));
    }
    go(btn, kind === 'signup' ? 'Creating your desk…' : 'Logging you in…');
  }
  function go(btn, label = 'Opening your desk…') {
    if (btn) { btn.disabled = true; btn.classList.add('busy'); btn.textContent = label; }
    setTimeout(() => { location.href = 'dashboard.html' + next; }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
  }
})();
