/* Agents Desk dashboard (demo). All players, clubs and deals are fictional sample data. */

/* Sample data for prototypes (fictional players and clubs). Replace with the live API. */
(function(){
let s=7;const r=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};const pick=a=>a[Math.floor(r()*a.length)];
const FN=['Luca','Mateo','Noah','Elias','Rayan','Tomás','Jonas','Ilyas','Kenji','Adam','Malik','Theo','Oskar','Dario','Yannick','Samuel','Bruno','Kofi','Enzo','Hugo','Nikola','Arda','Joel','Felix','Marco','Sami','Rafael','Lior','Ibrahim','Aleks'];
const LN=['Moreau','Vandersteen','Alcántara','Okafor','Sørensen','Brandt','Kovač','Delgado','Haddad','Laurent','Ferreira','Novak','Schulte','Mendes','Aydın','Rossi','Petit','Janssen','Costa','Lindqvist','Diallo','Herrera','Bakker','Weber','Marín','Duarte','Nkosi','Varga','Keller','Ruiz'];
const NAT=[['France','EU'],['Belgium','EU'],['Spain','EU'],['Nigeria',''],['Denmark','EU'],['Germany','EU'],['Croatia','EU'],['Argentina',''],['Morocco',''],['Portugal','EU'],['Serbia',''],['Turkey',''],['Netherlands','EU'],['Italy','EU'],['Brazil',''],['Ghana',''],['Sweden','EU'],['Senegal','']];
const LEAGUES=['Premier League','La Liga','Serie A','Bundesliga','Ligue 1','Eredivisie','Primeira Liga','Championship','Süper Lig','Pro League'];
const CLUBS={'Premier League':['Harbour City','Ashford Rovers','Northgate United'],'La Liga':['Atlético Marina','CD Sierra Alta','Real Costanera'],'Serie A':['AC Lago Verde','Sporting Vesuvio','FC Torrino'],'Bundesliga':['FC Rheinstadt','SV Nordheide','Borussia Talbach'],'Ligue 1':['Olympique Varenne','AS Côte Bleue','Stade Lumière'],'Eredivisie':['FC Waterland','SC Dijkstad','Go Ahead Polder'],'Primeira Liga':['SC Atlântico','FC Douro Norte','Vitória do Sul'],'Championship':['Millbrook Town','Kingsport City','Ridgeway Athletic'],'Süper Lig':['Bosfor SK','Anadolu Kartal','İzmir Yıldız'],'Pro League':['KV Scheldestad','Royal Ardenne','Club Brugwater']};
const POS=[['GK','Goalkeeper'],['CB','Centre-Back'],['LB','Left-Back'],['RB','Right-Back'],['CDM','Defensive Midfield'],['CM','Central Midfield'],['CAM','Attacking Midfield'],['LW','Left Winger'],['RW','Right Winger'],['ST','Centre-Forward']];
const TRAITS={GK:['Shot-stopping','Distribution','Claims crosses'],CB:['Aerial duels','Progressive passing','Recovery pace'],LB:['Overlapping runs','Crossing','1v1 defending'],RB:['Overlapping runs','Crossing','Press resistance'],CDM:['Ball winning','Positional discipline','Switches play'],CM:['High running volume','Box-to-box','Press resistance'],CAM:['Plays in the pockets','Final pass','Long shots'],LW:['1v1 dribbling','High running volume','Cuts inside'],RW:['1v1 dribbling','Plays in the pockets','Crossing'],ST:['Finishing','Hold-up play','Runs in behind']};
const AGENT=['No agent','No agent','Relatives','Relatives','Agency'];
const P=[];
for(let i=0;i<120;i++){const lg=pick(LEAGUES);const ps=POS[Math.floor(r()*POS.length)];const age=17+Math.floor(r()*16);const rating=+(6+r()*2.3).toFixed(1);
  const base=(rating-6)*(lg==='Premier League'?14:lg==='Championship'||lg==='Pro League'||lg==='Süper Lig'?4:8)*(age<24?1.6:age>29?.5:1);
  const value=Math.max(.1,+(base*(.4+r())).toFixed(1));const n=pick(NAT);
  P.push({id:i+1,name:pick(FN)[0]+'. '+pick(LN),first:pick(FN),nat:n[0],eu:!!n[1],pos:ps[0],posName:ps[1],league:lg,club:pick(CLUBS[lg]),age,rating,value,foot:r()<.68?'Right':'Left',height:(ps[0]==='GK'||ps[0]==='CB'?183:168)+Math.floor(r()*16),contract:2026+Math.floor(r()*6),agent:pick(AGENT),traits:TRAITS[ps[0]].slice().sort(()=>r()-.5).slice(0,2),apps:Math.floor(r()*34),goals:Math.floor(r()*(ps[0]==='ST'||ps[0]==='LW'||ps[0]==='RW'?16:5))});}
P.forEach(p=>{p.name=p.first+' '+p.name.split(' ')[1];p.init=p.first[0]+p.name.split(' ')[1][0];});
const HUES=['#F4691F','#15151C','#2563EB','#16A34A','#9333EA','#DB2777','#0891B2','#B45309'];
window.AD={players:P,leagues:LEAGUES,clubs:CLUBS,positions:POS,hue:p=>HUES[p.id%HUES.length],
  money:v=>'€'+(v>=1?v.toFixed(v>=10?0:1).replace(/\.0$/,'')+'M':Math.round(v*1000)+'k')};
})();

/* ===== Agents Desk dashboard: shell, routing, loader, shared state ===== */
(function(){
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const app=$('#app'),load=$('#adLoad');let view=$('#view');
const reduceM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const IC={
overview:'<path d="M3 13a9 9 0 1 1 18 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.5"/>',
agency:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 9h5a1 1 0 0 1 1 1v11"/><path d="M8 8h2M8 12h2M8 16h2M3 21h18"/>',
calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
requests:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/>',
log:'<path d="M4 6h16M4 12h16M4 18h10"/>',
ai:'<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
filter:'<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
targets:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
noagents:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6 1.6 0 3 .6 4.1 1.6"/><path d="M16 15l5 5M21 15l-5 5"/>',
teams:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c1.8.8 3 2.6 3 5.5"/>',
standings:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
journalism:'<path d="M4 11a8 8 0 0 1 16 0"/><path d="M7 11a5 5 0 0 1 10 0"/><circle cx="12" cy="12" r="1.6"/><path d="M12 14v7"/>',
deals:'<path d="M13 3L4 14h7l-1 7 9-11h-7z"/>',
done:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
news:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const NAV=[['Dashboard',[['overview','Daily Overview'],['agency','Agency']]],
 ['CRM',[['calc','Deal Calculator','Calculate deal scenarios'],['requests','Transfer Requests','Manage player requests'],['log','Transfer Log','Track transfer history']]],
 ['Players',[['ai','AI Agent','',"BETA"],['filter','Filter'],['targets','Targets'],['noagents','No Agents']]],
 ['Season report',[['teams','Teams'],['standings','Standings']]],
 ['Transfer updates',[['journalism','Live Journalism'],['deals','Live Deals','','LIVE'],['done','Done Deals'],['news','News Dashboard']]]];
const mark=(s=34)=>`<svg width="${s}" height="${s}" viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle class="ad-ping" cx="22" cy="22" r="13.5" stroke="#F4691F" stroke-width="2"/><circle cx="22" cy="22" r="9" stroke="currentColor" stroke-width="3"/><circle class="ad-beat" cx="22" cy="22" r="4.4" fill="#F4691F"/></svg>`;
$('#sb').innerHTML=`<a class="sb-brand" href="#app-overview">${mark(36)}<span><b>AGENTS DESK</b><small>COMMAND HUB</small></span></a>`+NAV.map(g=>`<div class="sb-g"><span>${g[0]}</span>${g[1].map(n=>`<a class="nv" href="#app-${n[0]}" data-v="${n[0]}">${svg(n[0])}<span>${n[1]}${n[2]?`<small>${n[2]}</small>`:''}</span>${n[3]?`<em class="tag${n[3]==='LIVE'?' live':''}">${n[3]}</em>`:''}</a>`).join('')}</div>`).join('')+`<div class="sb-foot"><a href="index.html">← Back to the website</a></div>`;
// state
const LS={get(k,d){try{const v=localStorage.getItem('ad2-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('ad2-'+k,JSON.stringify(v))}catch(e){}}};
const S={targets:new Set(LS.get('targets',[])),requests:LS.get('requests',[{id:1,t:'Right footed winger under the age of 25. Higher than 6.5 rating',d:'Sep 28, 2026, 11:13 AM',st:'ready'}]),log:LS.get('log',[]),todo:LS.get('todo',[]),events:LS.get('events',[]),deals:LS.get('deals',[]),lastCalc:LS.get('lastCalc',null)};
const save=k=>LS.set(k,k==='targets'?[...S.targets]:S[k]);
// helpers
let tt;const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2300);};
const modal=(html,cls='')=>{const m=$('#modal');m.className='modal on '+cls;$('#modalBody').innerHTML=html;};
$('#modal').addEventListener('click',e=>{if(e.target.closest('[data-close]'))$('#modal').className='modal';});
const money=AD.money,hue=AD.hue;
const ring=v=>{const c=2*Math.PI*18;return `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(128,128,128,.18)" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="${v>80?'#16A34A':v>65?'#F4691F':'#B7791F'}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-v/100)}"/></svg>`;};
const who=p=>`<span class="who"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.posName} · ${p.age}</span></span></span>`;
const tgtBtn=(p,lab)=>`<button class="btn b-sm ${S.targets.has(p.id)?'b-dark':'b-gh'}" data-tgt="${p.id}">${S.targets.has(p.id)?'✓ Target':(lab||'+ Target')}</button>`;
document.addEventListener('click',e=>{const b=e.target.closest('#app [data-tgt]');if(!b)return;e.stopPropagation();const id=+b.dataset.tgt;S.targets.has(id)?S.targets.delete(id):S.targets.add(id);save('targets');toast(S.targets.has(id)?'Added to Targets':'Removed from Targets');$$(`#app [data-tgt="${id}"]`).forEach(x=>{const on=S.targets.has(id);x.classList.toggle('b-dark',on);x.classList.toggle('b-gh',!on);x.textContent=on?'✓ Target':'+ Target';});});
const profile=p=>modal(`<div class="who" style="gap:14px;margin-bottom:16px"><span class="av" style="width:56px;height:56px;font-size:18px;background:${hue(p)}">${p.init}</span><span class="nm"><b style="font-size:20px;font-family:var(--fd)">${p.name}</b><span>${p.nat} · ${p.age} yrs · ${p.foot} foot</span></span></div>
 <div class="grid g2" style="margin-bottom:14px"><div class="card" style="padding:12px"><span class="lbl">Club</span><b style="display:block">${p.club}</b><span class="note">${p.league}</span></div><div class="card" style="padding:12px"><span class="lbl">Market value</span><b class="val" style="display:block;font-size:18px">${money(p.value)}</b></div><div class="card" style="padding:12px"><span class="lbl">Contract until</span><b style="display:block">${p.contract}</b></div><div class="card" style="padding:12px"><span class="lbl">Agent</span><b style="display:block">${p.agent}</b></div></div>
 <div class="kv">${[['Position',p.posName],['Height',p.height+' cm'],['Average rating',p.rating.toFixed(1)],['Appearances (season)',p.apps],['Goals (season)',p.goals],['EU passport',p.eu?'Yes':'No']].map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="row" style="margin:14px 0">${p.traits.map(t=>`<span class="chip o">${t}</span>`).join('')}</div>
 <div class="row">${tgtBtn(p,'+ Add to targets')}<a class="btn b-or" href="#app-calc" data-close>Model a deal</a></div>`,'drawer');
const fmtD=d=>new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
window.ADX={$,$$,S,save,toast,modal,profile,ring,who,tgtBtn,svg,mark,money,hue,LS,fmtD,reduceM};
// loader
let loadT;const showLoad=(ms,cap)=>{$('#adLoadCap').textContent=cap||'Loading';load.classList.remove('out');clearTimeout(loadT);return new Promise(r=>{loadT=setTimeout(()=>{load.classList.add('out');r();},reduceM?0:ms);});};
window.ADX.showLoad=showLoad;
// routing
const V=window.ADV={};let cur=null;
function open(v){const first=!app.classList.contains('on');
  if(first){document.documentElement.style.overflow='hidden';app.classList.add('on');app.setAttribute('aria-hidden','false');window.__lenis&&window.__lenis.stop();}
  if(!V[v])v='overview';cur=v;$$('#sb .nv').forEach(a=>a.classList.toggle('on',a.dataset.v===v));app.classList.remove('nav-open');
  {const nv=document.createElement('div');nv.id='view';view.replaceWith(nv);view=nv;}view.className='vw '+v;const run=()=>{V[v](view);$('#mn').scrollTop=0;const n=NAV.flatMap(g=>g[1]).find(x=>x[0]===v);document.title=(n?n[1]+' · ':'')+'Agents Desk Dashboard';};
  if(first)setTimeout(run,0);else run();}
function close(){location.href='index.html';return;if(!app.classList.contains('on'))return;app.classList.remove('on');app.setAttribute('aria-hidden','true');document.documentElement.style.overflow='';window.__lenis&&window.__lenis.start();document.title='Agents Desk New Face';cur=null;}
function route(){const h=location.hash.slice(1);if(h.startsWith('app-'))open(h.slice(4));else{history.replaceState(null,'','#app-overview');open('overview');}}
addEventListener('hashchange',route);
window.ADX.go=v=>{if(location.hash==='#app-'+v)open(v);else location.hash='app-'+v;};
$('#burger').onclick=()=>app.classList.add('nav-open');$('#scrim').onclick=()=>app.classList.remove('nav-open');
$('#backSite').href='index.html';
$('.sb-foot a').href='index.html';
$('#gsearch').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim()){S.gq=e.target.value.trim();window.ADX.go('filter');}});
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#modal').className='modal';app.classList.remove('nav-open');}});
// first paint: brief brand loader, then route
window.addEventListener('DOMContentLoaded',()=>{});
// first paint: keep the brand screen only until the page is actually ready (fonts + assets), never longer than needed
(()=>{const bar=$('#adLoadBar');$('#adLoadCap').textContent=location.hash.startsWith('#app-')?'Opening your desk':'Loading';let p=.08;const set=v=>{p=Math.max(p,v);if(bar)bar.style.transform=`scaleX(${p})`;};set(.15);
 const steps=[document.fonts?document.fonts.ready.then(()=>set(.55)):Promise.resolve(),new Promise(r=>{if(document.readyState==='complete')r();else addEventListener('load',r,{once:true});}).then(()=>set(.9))];
 const t0=performance.now();Promise.race([Promise.all(steps),new Promise(r=>setTimeout(r,3500))]).then(()=>{set(1);setTimeout(()=>load.classList.add('out'),Math.max(180,450-(performance.now()-t0)));});})();
setTimeout(route,0);
})();

/* ===== Views: overview, agency ===== */
(function(){
const {$,$$,S,save,toast,modal,profile,who,tgtBtn,svg,money,hue,fmtD}=ADX;const P=AD.players;const V=ADV;
const cl=Object.values(AD.clubs).flat();
V.overview=el=>{
  const h=new Date().getHours();const lc=S.lastCalc||{fee:2500000,add:500000,sell:20,comm:5,net:2010000};
  const E=n=>'€'+Math.round(n).toLocaleString('en-US');
  el.innerHTML=`<section class="welcome"><div><h1>${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, <span>agent</span> 👋</h1><p>Here's what's happening in your football world today.</p></div><div class="wst"><div><b>16</b><span>Leagues</span></div><div><b>312</b><span>Clubs</span></div><div><b>15,396</b><span>Players</span></div><div><b>4,886</b><span>Active rumours</span></div></div></section>
  <div class="dgrid">
   <div class="card"><div class="card-h"><h3><span class="ic">${svg('requests')}</span>Transfer requests</h3><span class="badge n">${S.requests.length}</span></div>${S.requests.slice(0,3).map(r=>`<div class="li"><span>${r.t}</span><span class="badge ${r.st==='ready'?'g':'w'}">${r.st==='ready'?'● Ready':'Running'}</span></div>`).join('')||'<div class="empty">No requests yet.</div>'}<a class="link" href="#app-requests" style="display:inline-block;margin-top:10px">View all requests →</a></div>
   <div class="card"><div class="card-h"><h3><span class="ic">${svg('calc')}</span>Deal calculator</h3><a class="link" href="#app-calc">Edit</a></div><p class="note" style="margin:-8px 0 6px">${S.lastCalc?'Your last scenario':'Sample scenario'}</p><div class="kv"><div><span>Fee</span><b>${E(lc.fee)}</b></div><div><span>Add-ons</span><b>${E(lc.add)}</b></div><div><span>Sell-on %</span><b>${lc.sell}%</b></div><div><span>Commission</span><b>${lc.comm}%</b></div></div><div class="net"><span>Net to club</span><span>${E(lc.net)}</span></div><a class="link" href="#app-calc" style="display:inline-block;margin-top:10px">Open calculator →</a></div>
   <div class="card"><div class="card-h"><h3><span class="ic">${svg('log')}</span>Transfer log</h3><span class="badge n">Last 5</span></div>${S.log.slice(0,5).map(l=>`<div class="li"><span>${l.player} → ${l.to}</span><span class="note">${l.fee||''}</span></div>`).join('')||'<div class="empty" style="padding:20px 6px">No transfers logged yet.</div>'}<a class="link" href="#app-log">View full log →</a></div>
   <div class="c4">
    <div class="card"><div class="cal-h"><h3 style="font-size:15.5px">Calendar</h3><div class="row" style="gap:6px"><button id="pm" aria-label="Previous month">‹</button><b id="mon" style="font-size:13.5px;min-width:104px;text-align:center"></b><button id="nm" aria-label="Next month">›</button></div></div><div class="cal" id="cal"></div><div class="card-h" style="margin:14px 0 6px"><h3 style="font-size:14px">Events</h3><button class="link" id="addEv">+ Add event</button></div><div id="evs" class="note" style="display:block"></div></div>
    <div class="card"><div class="card-h"><h3 style="font-size:15.5px">To-do list <span class="note" id="tdn"></span></h3></div><div class="seg" id="tdT" style="margin-bottom:10px"><button class="on" data-v="all">All</button><button data-v="today">Today</button><button data-v="done">Done</button></div><div class="todo" id="todo"></div><form class="row" id="tdF" style="margin-top:8px;flex-wrap:nowrap"><input class="inp" id="tdI" placeholder="Add a task…" style="height:38px"><button class="btn b-dark b-sm" style="height:38px">Add</button></form></div>
   </div>
   <div class="wide"><div class="card-h"><h3>Live deals <span class="badge r"><span class="ldot"></span>LIVE</span></h3><a class="link" href="#app-deals">View all deals →</a></div><div class="strip">${P.slice(20,30).map((p,i)=>`<a class="card" href="#app-deals">${who(p)}<div class="mv">${p.club} → ${cl[(i*7+2)%cl.length]}</div><span class="badge ${['w','o','g'][i%3]}">${['Talks open','Bid submitted','Medical booked'][i%3]}</span></a>`).join('')}</div></div>
  </div>`;
  let vd=new Date();vd.setDate(1);const today=new Date();let pick=today.getDate();
  const cal=()=>{const y=vd.getFullYear(),m=vd.getMonth();$('#mon').textContent=vd.toLocaleDateString('en-GB',{month:'long',year:'numeric'});const f=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
    $('#cal').innerHTML=['Mo','Tu','We','Th','Fr','Sa','Su'].map(d=>`<small>${d}</small>`).join('')+'<span></span>'.repeat(f)+Array.from({length:n},(_,i)=>{const d=i+1,t=y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate(),ev=S.events.some(e=>e.y===y&&e.m===m&&e.d===d);return `<button class="${t?'today':''}${ev?' ev':''}${d===pick?' sel':''}" data-d="${d}">${d}</button>`;}).join('');
    const me=S.events.filter(e=>e.y===y&&e.m===m);$('#evs').innerHTML=me.length?me.map(e=>`<div class="li"><span style="color:var(--ink)">${e.t}</span><span>${e.d} ${vd.toLocaleDateString('en-GB',{month:'short'})}</span></div>`).join(''):'No events this month.';};
  $('#pm').onclick=()=>{vd.setMonth(vd.getMonth()-1);cal();};$('#nm').onclick=()=>{vd.setMonth(vd.getMonth()+1);cal();};
  $('#cal').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;pick=+b.dataset.d;cal();};
  $('#addEv').onclick=()=>{modal(`<h3 style="margin-bottom:12px">Add event · ${pick} ${vd.toLocaleDateString('en-GB',{month:'long'})}</h3><form id="evF" class="grid"><div class="field"><label for="evT">Title</label><input class="inp" id="evT" placeholder="Call with sporting director" required></div><button class="btn b-or">Add event</button></form>`);
    $('#evF').onsubmit=e=>{e.preventDefault();S.events.push({y:vd.getFullYear(),m:vd.getMonth(),d:pick,t:$('#evT').value});save('events');$('#modal').className='modal';cal();toast('Event added');};};
  cal();
  let tf='all';const td=()=>{const r=S.todo.map((x,i)=>({...x,i})).filter(x=>tf==='all'||(tf==='done'?x.d:(!x.d&&x.day===new Date().toDateString())));$('#tdn').textContent=`(${S.todo.filter(x=>!x.d).length})`;
    $('#todo').innerHTML=r.map(x=>`<label class="${x.d?'done':''}"><input type="checkbox" data-i="${x.i}" ${x.d?'checked':''}><span>${x.t}</span></label>`).join('')||`<div class="empty" style="padding:14px">Nothing here. You're all caught up.</div>`;};
  $('#todo').onchange=e=>{S.todo[+e.target.dataset.i].d=e.target.checked;save('todo');td();};
  $('#tdT').onclick=e=>{const b=e.target.closest('button');if(!b)return;tf=b.dataset.v;$$('#tdT button').forEach(x=>x.classList.toggle('on',x===b));td();};
  $('#tdF').onsubmit=e=>{e.preventDefault();const v=$('#tdI').value.trim();if(!v)return;S.todo.unshift({t:v,d:false,day:new Date().toDateString()});$('#tdI').value='';save('todo');td();};
  td();};

V.agency=el=>{
  const SQ=P.slice(0,9).map((p,i)=>({...p,contract:i%3===0?2026:p.contract,status:i===4?'Injured':i===2||i===6?'Rumour':'Fit'}));
  const M=[['all','Total players',SQ.length,'#2563EB','rgba(37,99,235,.1)','<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7"/>'],['inj','Injured players',SQ.filter(p=>p.status==='Injured').length,'#B7791F','rgba(183,121,31,.12)','<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h0"/>'],['rum','Active rumours',SQ.filter(p=>p.status==='Rumour').length,'#F4691F','rgba(244,105,31,.1)','<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>'],['noc','Players without contracts',SQ.length,'#DC2626','rgba(220,38,38,.08)','<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6M16 13l5 5M21 13l-5 5"/>'],['exp','Contracts expiring soon',SQ.filter(p=>p.contract<=2026).length,'#B45309','rgba(180,83,9,.1)','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>']];
  el.innerHTML=`<div class="ph"><div><span class="badge o">Agency</span><h1 style="margin-top:10px">Agency dashboard</h1><p>Portfolio metrics and performance from your squad data.</p></div></div>
  <div class="ag-hero"><span class="lg">${svg('agency')}</span><div style="position:relative"><h2 style="font-size:22px">Your agency</h2><p>Demo agency · ${SQ.length} sample players under management</p></div><span style="flex:1"></span><button class="btn b-sm" style="position:relative;background:rgba(255,255,255,.08);color:#fff" id="rmAg">Remove agency from profile</button></div>
  <div class="mets">${M.map(m=>`<button class="m${m[0]==='all'?' on':''}" data-f="${m[0]}"><span class="mi" style="background:${m[4]};color:${m[3]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${m[5]}</svg></span><b>${m[2]}</b><span>${m[1]}</span><span class="link" style="font-size:12px">Show →</span></button>`).join('')}</div>
  <div class="two"><div class="card" style="padding:6px"><div class="card-h" style="padding:12px 12px 0"><h3><span class="ic">${svg('teams')}</span><span id="rT">Total players</span></h3></div><div class="tw"><table class="tbl"><thead><tr><th>Player</th><th class="hm">Club</th><th>Status</th><th>Value</th><th class="hm">Contract</th></tr></thead><tbody id="roster"></tbody></table></div></div>
  <div class="card"><div class="card-h"><h3><span class="ic" style="background:var(--go-soft);color:var(--go)">🔥</span>Latest match performance</h3><button class="btn b-gh b-sm" id="ratings">Player ratings</button></div><p class="note" style="margin:-6px 0 12px;display:block">Numbers from the most recent match round</p><div class="perf"><div><small>Goals scored</small><b>1</b></div><div><small>Assists</small><b>0</b></div><div><small>Wins</small><b>1</b></div><div><small>Losses</small><b>2</b></div><div><small>Draws</small><b>0</b></div><div><small>Minutes played</small><b>304</b></div></div></div></div>
  <p class="note" style="margin-top:12px">● Sample squad</p>`;
  const stc={Fit:'#16A34A',Injured:'#B7791F',Rumour:'#F4691F'};let f='all';
  const draw=()=>{const r=SQ.filter(p=>f==='all'||f==='noc'||(f==='inj'&&p.status==='Injured')||(f==='rum'&&p.status==='Rumour')||(f==='exp'&&p.contract<=2026));$('#rT').textContent=M.find(m=>m[0]===f)[1];
    $('#roster').innerHTML=r.map(p=>`<tr data-p="${p.id}" style="cursor:pointer"><td>${who(p)}</td><td class="hm">${p.club}</td><td><span class="st"><i style="background:${stc[p.status]}"></i>${p.status}</span></td><td class="val">${money(p.value)}</td><td class="hm">${p.contract}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No players in this group.</td></tr>';};
  $('.mets').onclick=e=>{const b=e.target.closest('.m');if(!b)return;f=b.dataset.f;$$('.m').forEach(x=>x.classList.toggle('on',x===b));draw();};
  $('#roster').onclick=e=>{const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));};
  $('#ratings').onclick=()=>modal(`<h3 style="margin-bottom:12px">Player ratings · latest round</h3><div class="kv">${SQ.slice(0,6).map(p=>`<div><span>${p.name}</span><b>${(p.rating+((p.id%5)-2)/10).toFixed(1)}</b></div>`).join('')}</div>`);
  $('#rmAg').onclick=()=>toast('Agency link removal needs confirmation in the live product');
  draw();};
})();

/* ===== View: deal calculator ===== */
(function(){
const {$,$$,S,save,toast,modal,LS}=ADX;const P=AD.players;
const COUNTRIES=[['de','🇩🇪 Germany',45],['es','🇪🇸 Spain',47],['it','🇮🇹 Italy',43],['fr','🇫🇷 France',45],['en','🏴 England',45],['be','🇧🇪 Belgium',50],['nl','🇳🇱 Netherlands',49.5],['pt','🇵🇹 Portugal',48],['se','🇸🇪 Sweden',52],['tr','🇹🇷 Turkey',40],['rs','🇷🇸 Serbia',20],['sa','🇸🇦 Saudi Arabia',0],['us','🇺🇸 USA (MLS)',37]];
const POS=['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST'];
const INT=`<option value="12">Yearly</option><option value="6">Half-yearly</option><option value="3">Quarterly</option><option value="1">Monthly</option>`;
const opt=(id,t,s,body)=>`<div class="opt" id="${id}"><div class="opt-h"><div><b>${t}</b><span>${s}</span></div><button class="sw" role="switch" aria-checked="false" aria-label="Toggle ${t}"></button></div><div class="opt-b"><div><div class="in">${body}</div></div></div></div>`;
const instF=(p,n)=>`<div class="grid g3"><div class="field"><label for="${p}N">Number of instalments</label><input class="inp" id="${p}N" inputmode="numeric" value="${n}"></div><div class="field"><label for="${p}I">Payment interval</label><select class="sel" id="${p}I">${INT}</select></div><div class="field"><label for="${p}D">First payment</label><input class="inp" type="date" id="${p}D" value="2026-07-01"></div></div>`;
const pct=(id,v,lab)=>`<div class="field"><label for="${id}">${lab}</label><div class="afx s"><input class="inp" id="${id}" inputmode="decimal" value="${v}"><span class="suf">%</span></div></div>`;
const eurF=(id,v,lab)=>`<div class="field"><label for="${id}">${lab}</label><div class="afx"><span class="pre">€</span><input class="inp money" id="${id}" data-money inputmode="numeric" value="${v}"></div></div>`;
const seg=(id,opts,on)=>`<div class="seg" id="${id}">${opts.map(o=>`<button data-v="${o[0]}"${o[0]===on?' class="on"':''}>${o[1]}</button>`).join('')}</div>`;
ADV.calc=el=>{
el.innerHTML=`
<div class="dc-hd"><span style="color:#fff">${ADX.mark(30)}</span><span class="t"><b>Agents Desk</b><small>DEAL CALCULATOR</small></span><span class="sp"></span>
 ${seg('dcFmt',[['de','1.500.000'],['en','1,500,000'],['fr','1 500 000']],'en')}
 <div class="dropd" id="dcMy"><button class="btn b-gh b-sm" id="dcMyB">My deals ▾</button><ul id="dcList"></ul></div>
 <button class="btn b-gh b-sm" id="dcSave">Save deal</button>
 <button class="btn b-or b-sm" id="dcPdf">Export PDF</button></div>
<div class="dc"><div>
 <nav class="dc-nav" id="dcNav"><button class="on" data-s="0"><span class="n">01</span><span><b>Deal</b><small>Player &amp; clubs</small></span></button><button data-s="1"><span class="n">02</span><span><b>Transfer fee</b><small>Fee · add-ons · sell-on</small></span></button><button data-s="2"><span class="n">03</span><span><b>Contract</b><small>Base + performance</small></span></button><button data-s="3"><span class="n">04</span><span><b>Commission</b><small>Split between parties</small></span></button></nav>
 <section class="pnl on"><div class="card"><div class="st-t"><h3>Player &amp; clubs</h3><p>Who is moving, and where</p></div>
  <input type="hidden" id="dPlayer"><input type="hidden" id="dFrom"><input type="hidden" id="dTo">
  <div class="dc-pick"><div class="dc-pk-h"><span class="n">A</span><b>Player</b><small>Choose league, club, then the player</small></div>
  <div class="grid g4"><div class="field"><label for="pLg">League</label><select class="sel" id="pLg"></select></div>
  <div class="field"><label for="pCl">Current club</label><select class="sel" id="pCl"></select></div>
  <div class="field"><label for="pPl">Player</label><select class="sel" id="pPl"></select></div>
  <div class="field"><label for="dPos">Position</label><select class="sel" id="dPos">${AD.positions.map(p=>`<option value="${p[0]}"${p[0]==='LW'?' selected':''}>${p[0]} · ${p[1]}</option>`).join('')}</select></div></div></div>
  <div class="dc-pick"><div class="dc-pk-h"><span class="n">B</span><b>New club</b><small>Where the player is moving</small></div>
  <div class="grid g4"><div class="field"><label for="tLg">League</label><select class="sel" id="tLg"></select></div>
  <div class="field"><label for="tCl">New club</label><select class="sel" id="tCl"></select></div>
  <div class="field dc-move" style="grid-column:span 2"><span class="lbl">Move</span><div class="mvp" id="mvP">—</div></div></div></div>
  <div class="stf"><span></span><button class="btn b-dark" data-next>Next: Transfer fee →</button></div></section>
 <section class="pnl"><div class="card"><div class="st-t"><h3>Transfer fee</h3><p>Base fee paid by the buying club</p></div>${eurF('dFee','2500000','Transfer fee')}</div>
  <div class="card"><div class="st-t"><h3>Fee add-ons</h3><button class="btn b-gh b-sm" id="addAo">+ Add</button></div><div class="items" id="dAo"></div><p class="help" style="margin-top:10px">Tap <kbd>G</kbd> to mark an add-on guaranteed vs. a conditional bonus. Tap <kbd>PG</kbd> to pay it per game: a games / season field appears on that line and multiplies the amount.</p></div>
  ${opt('oInst','Installment payments (transfer fee)','Split the transfer fee over time',instF('fi',4))}
  ${opt('oSell','Sell-on clause',"Share of the player's next transfer",`<div class="grid g3">${pct('dSell',20,'Sell-on rate')}<div class="field"><label for="dBasis">Basis</label><select class="sel" id="dBasis"><option value="net">Net transfer profit</option><option value="gross">Gross next fee</option></select></div>${eurF('dNext','8000000','Expected next transfer fee')}</div><div class="mini"><span>Selling club's future sell-on</span><b id="sellVal">€0</b></div>`)}
  ${opt('oTrain','Training compensation','Solidarity and training payments',`<div class="grid g2"><div>${pct('dSol',5,'Solidarity contribution')}<p class="help" style="margin-top:6px">Withheld from the transfer fee — reduces what the selling club receives.</p></div><div>${eurF('dTrain','0','Training compensation (fixed)')}<p class="help" style="margin-top:6px">Paid by the buying club on top of the fee.</p></div></div>`)}
  <div class="card"><div class="st-t"><h3>Result</h3><p>Club totals</p></div><div class="grid g2"><div><span class="sub-h">Selling club · receives</span><div class="kv" id="rSell"></div></div><div><span class="sub-h">Buying club · pays</span><div class="kv" id="rBuy"></div></div></div></div>
  <div class="stf"><button class="btn b-gh" data-prev>← Back</button><button class="btn b-dark" data-next>Next: Contract →</button></div></section>
 <section class="pnl"><div class="card"><div class="st-t"><h3>Base salary</h3><p>Before tax</p></div><div class="grid g2">${eurF('dSal','1200000','Basic salary')}<div class="field"><span class="lbl">Period</span>${seg('dPer',[['1','per year'],['12','per month'],['52','per week (UK)']],'1')}<p class="help" id="perHelp">Annual base.</p></div></div></div>
  <div class="card"><div class="st-t"><h3>Performance components / year</h3><button class="btn b-gh b-sm" id="addPf">+ Add</button></div><div class="items" id="dPf"></div><p class="help" style="margin-top:10px">Tap <kbd>G</kbd> to mark a component guaranteed vs. a conditional bonus. Tap <kbd>PG</kbd> to pay it per game: a games / season field appears on that line and multiplies the amount.</p></div>
  <div class="card"><div class="st-t"><h3>Term &amp; tax</h3><p>Rough top-bracket rates for high earners. Special regimes can differ — override the % per deal.</p></div><div class="grid g3"><div class="field"><label for="dYrs">Contract length</label><div class="afx s"><input class="inp" id="dYrs" inputmode="numeric" value="4"><span class="suf">yrs</span></div></div><div class="field"><label for="dCty">Country</label><select class="sel" id="dCty">${COUNTRIES.map(c=>`<option value="${c[0]}"${c[0]==='de'?' selected':''}>${c[1]}</option>`).join('')}</select></div>${pct('dTax',45,'Tax rate (editable)')}</div>
   <span class="sub-h" style="display:block;margin-top:14px">Result</span><div class="kv" id="rCon"></div></div>
  <div class="stf"><button class="btn b-gh" data-prev>← Back</button><button class="btn b-dark" data-next>Next: Commission →</button></div></section>
 <section class="pnl"><div class="card"><div class="st-t"><h3>% of wage</h3><span class="badge n" id="cWv">€0</span></div><div class="grid g3"><div class="field"><span class="lbl">Paid by</span>${seg('wPaid',[['buy','Buying club'],['sell','Selling club']],'buy')}</div>${pct('wRate',10,'Rate')}<div class="field"><label for="wApp">Applied</label><select class="sel" id="wApp"><option value="full">× full contract</option><option value="year">× per year</option><option value="fullnet">× full contract (net)</option><option value="yearnet">× per year (net)</option></select></div></div></div>
  <div class="card"><div class="st-t"><h3>% of transfer fee</h3><span class="badge n" id="cFv">€0</span></div><div class="grid g3"><div class="field"><span class="lbl">Paid by</span>${seg('fPaid',[['buy','Buying club'],['sell','Selling club']],'sell')}</div>${pct('fRate',5,'Rate')}<div class="field"><label for="fApp">Applied</label><select class="sel" id="fApp"><option value="feeadd">× transfer fee + add-ons</option><option value="fee">× transfer fee</option></select></div></div></div>
  ${opt('oAdd','Additional commission (fixed €)','A flat amount on top',`<div class="grid g2"><div class="field"><span class="lbl">Paid by</span>${seg('aPaid',[['buy','Buying club'],['sell','Selling club']],'buy')}</div>${eurF('aAmt','0','Fixed amount')}</div>`)}
  ${opt('oCI','Pay commission in instalments','Schedule each commission component',`<span class="sub-h">% of wage commission</span>${instF('cw',4)}<span class="sub-h">% of transfer fee commission</span>${instF('cf',3)}`)}
  <div class="card"><div class="st-t"><h3>Parties involved</h3>${seg('nPar',[['1','1'],['2','2'],['3','3'],['4','4']],'1')}</div><p class="help" style="margin:-4px 0 12px">How total commission is divided.</p><div class="grid" id="parties" style="gap:8px"></div>
   <div style="margin-top:14px"><span class="lbl">Split preview</span><div class="splitbar" id="spBar" style="margin-top:8px"></div><div class="legend" id="spLeg" style="margin-top:8px"></div></div></div>
  <div class="stf"><button class="btn b-gh" data-prev>← Back</button><button class="btn b-or" id="dcSave2">Save deal</button></div></section>
</div>
<aside class="sum" id="dcSum"><div class="hs"><span class="mono"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>How much I could make</span><div class="big" id="you">€0</div><div class="sub" id="youSub">Your estimated commission cut</div><div class="pw"><span style="color:#FF8A4A">●</span> powered by Agents Desk</div>
  <div class="rows"><div><span>Total commission · all parties</span><b id="sTot">€0</b></div><div><span>Commission per contract year</span><b id="sYr">€0</b></div></div></div>
 <div class="card"><div class="card-h" style="margin-bottom:8px"><h3 style="font-size:14.5px" id="sHead">Player · CB</h3></div><p class="note" id="sMove" style="display:block;margin:-6px 0 10px">— → —</p>${seg('sTab',[['sell','Selling club'],['buy','Buying club'],['player','Player']],'sell')}<div class="kv" id="sBody" style="margin-top:10px"></div></div>
 <div class="card"><div class="card-h" style="margin-bottom:4px"><h3 style="font-size:14.5px">Commission payments</h3><span class="badge n" id="tlB">1 payment</span></div><div class="tl" id="tl"></div><div class="legend" style="margin-top:8px"><span><i style="background:#F4691F"></i>% of wage</span><span><i style="background:#15151C"></i>% of fee</span><span><i style="background:#C9A27E"></i>Fixed</span></div></div>
 <p class="help">Indicative only. Tax rates are simplified top-bracket estimates; sell-on figures assume a hypothetical future fee.</p></aside></div>
<button class="sheetbar" id="sheetBar"><span><small>HOW MUCH I COULD MAKE</small><b id="barV">€0</b></span><span class="btn b-or b-sm">See breakdown ↓</span></button>`;
let FMT='en';const SEP={de:'.',en:',',fr:' '};
const fN=n=>Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,SEP[FMT]);
const E=n=>(n<0?'-':'')+'€'+fN(n);
const num=e=>{if(!e)return 0;const v=String(e.value);if(e.dataset.money!==undefined)return +v.replace(/[^\d-]/g,'')||0;return parseFloat(v.replace(',','.').replace(/[^\d.-]/g,''))||0;};
const g=id=>document.getElementById(id);
const SV={};$$('#app .vw.calc .seg[id]').forEach(s=>{if(s.id==='dcFmt')return;SV[s.id]=s.querySelector('.on').dataset.v;s.onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('button',s).forEach(x=>x.classList.toggle('on',x===b));SV[s.id]=b.dataset.v;if(s.id==='nPar'){PS.forEach(p=>p.s=0);parties();}if(s.id==='dPer')g('perHelp').textContent={1:'Annual base.',12:'Monthly base × 12.',52:'Weekly base × 52 (UK convention).'}[b.dataset.v];calc();};});
let POSV='LW';g('dPos').onchange=e=>{POSV=e.target.value;calc();};
const opts=(arr,ph,sel)=>`<option value="">${ph}</option>`+arr.map(x=>`<option${x===sel?' selected':''}>${x}</option>`).join('');
const fillP=()=>{const lg=g('pLg').value;const cs=lg?AD.clubs[lg]:[];const cv=g('pCl').value;g('pCl').innerHTML=opts(cs,lg?'Choose club':'Choose league first',cs.includes(cv)?cv:'');g('pCl').disabled=!lg;fillPl();};
const fillPl=()=>{const c=g('pCl').value;const ps=P.filter(p=>p.club===c);const pv=g('pPl').value;g('pPl').innerHTML=`<option value="">${c?(ps.length?'Choose player':'No players tracked'):'Choose club first'}</option>`+ps.map(p=>`<option value="${p.id}"${String(p.id)===pv?' selected':''}>${p.name} · ${p.pos} · ${AD.money(p.value)}</option>`).join('');g('pPl').disabled=!ps.length;syncP();};
const fillT=()=>{const lg=g('tLg').value;const cs=lg?AD.clubs[lg].filter(c=>c!==g('pCl').value):[];const cv=g('tCl').value;g('tCl').innerHTML=opts(cs,lg?'Choose club':'Choose league first',cs.includes(cv)?cv:'');g('tCl').disabled=!lg;syncP();};
const syncP=()=>{const p=P.find(x=>String(x.id)===g('pPl').value);g('dPlayer').value=p?p.name:'';g('dFrom').value=g('pCl').value;g('dTo').value=g('tCl').value;if(p&&g('dPos').value!==p.pos){g('dPos').value=p.pos;POSV=p.pos;}g('mvP').innerHTML=`<b>${p?p.name:'Player'}</b> <span>${g('pCl').value||'—'}</span> <i>→</i> <span>${g('tCl').value||'—'}</span>`;};
g('pLg').innerHTML=opts(AD.leagues,'Choose league','Bundesliga');g('tLg').innerHTML=opts(AD.leagues,'Choose league','Premier League');
g('pCl').innerHTML='';fillP();g('pCl').value=AD.clubs['Bundesliga'].find(c=>P.some(p=>p.club===c))||'';fillPl();{const f=P.find(p=>p.club===g('pCl').value);if(f){g('pPl').value=f.id;syncP();}}fillT();g('tCl').value=AD.clubs['Premier League'][0];syncP();
g('pLg').onchange=()=>{fillP();calc();};g('pCl').onchange=()=>{fillPl();fillT();calc();};g('pPl').onchange=()=>{syncP();calc();};g('tLg').onchange=()=>{fillT();calc();};g('tCl').onchange=()=>{syncP();calc();};
ADX._calcSync={fillP,fillPl,fillT,syncP};
g('dCty').onchange=e=>{g('dTax').value=COUNTRIES.find(c=>c[0]===e.target.value)[2];calc();};
// items
const item=(box,{label='',amount=0,g:gu=false,pg=false,games=30}={})=>{const d=document.createElement('div');d.className='itm'+(pg?' pg':'');
 d.innerHTML=`<input class="inp lab" placeholder="Label" value="${label}" aria-label="Label"><div class="afx"><span class="pre">€</span><input class="inp money amt" data-money inputmode="numeric" value="${fN(amount)}" aria-label="Amount"></div><button class="tg g${gu?' on':''}" title="Guaranteed" aria-pressed="${gu}">G</button><button class="tg p${pg?' on':''}" title="Per game" aria-pressed="${pg}">PG</button><button class="xx" aria-label="Remove">×</button><div class="gm">× <input class="inp gmi" inputmode="numeric" value="${games}" aria-label="Games per season"> games / season</div>`;
 d.querySelector('.g').onclick=e=>{e.target.classList.toggle('on');e.target.setAttribute('aria-pressed',e.target.classList.contains('on'));calc();};
 d.querySelector('.p').onclick=e=>{e.target.classList.toggle('on');d.classList.toggle('pg');calc();};
 d.querySelector('.xx').onclick=()=>{d.remove();calc();};g(box).appendChild(d);return d;};
const items=box=>$$('#'+box+' .itm').map(d=>{const pg=d.classList.contains('pg');return{label:d.querySelector('.lab').value||'Item',amount:num(d.querySelector('.amt'))*(pg?num(d.querySelector('.gmi')):1),g:d.querySelector('.g').classList.contains('on')};});
item('dAo',{label:'Appearance add-on',amount:250000,g:true});item('dAo',{label:'Promotion / European bonus',amount:250000});
['Appearance premium','Performance premium','Special payments'].forEach(l=>item('dPf',{label:l,amount:20000}));
g('addAo').onclick=()=>item('dAo').querySelector('.lab').focus();g('addPf').onclick=()=>item('dPf').querySelector('.lab').focus();
const O={};$$('#app .opt').forEach(o=>{O[o.id]=false;const sw=o.querySelector('.sw');o.querySelector('.opt-h').onclick=()=>{O[o.id]=!O[o.id];o.classList.toggle('on',O[o.id]);sw.setAttribute('aria-checked',O[o.id]);calc();};});
// parties
const COL=['#F4691F','#15151C','#8C8883','#E5B98F'];const PS=[{n:'You',s:100},{n:'Partner agent',s:0},{n:'Intermediary',s:0},{n:'Other',s:0}];
const parties=()=>{const n=+SV.nPar;if(PS.slice(0,n).reduce((a,p)=>a+p.s,0)!==100){const ev=Math.floor(100/n);PS.forEach((p,i)=>p.s=i<n?(i===0?100-ev*(n-1):ev):0);}
 g('parties').innerHTML=PS.slice(0,n).map((p,i)=>`<div class="party"><div class="afx"><span class="pre" style="width:10px;height:10px;border-radius:3px;background:${COL[i]}"></span><input class="inp" data-i="${i}" data-k="n" value="${p.n}" aria-label="Name" style="padding-left:30px"></div><div class="afx s"><input class="inp" data-i="${i}" data-k="s" value="${p.s}" inputmode="decimal" aria-label="Share"><span class="suf">%</span></div></div>`).join('');
 $$('#parties input').forEach(inp=>inp.oninput=()=>{PS[+inp.dataset.i][inp.dataset.k]=inp.dataset.k==='s'?(parseFloat(inp.value)||0):inp.value;calc();});};
parties();
// steps
let step=0;const pn=$$('#app .pnl'),sb=$$('#dcNav button');
const go=i=>{step=Math.max(0,Math.min(3,i));pn.forEach((p,k)=>p.classList.toggle('on',k===step));sb.forEach((b,k)=>{b.classList.toggle('on',k===step);b.classList.toggle('done',k<step);});const mn=$('#mn');const top=g('dcNav').getBoundingClientRect().top;if(top<70)mn.scrollTo({top:mn.scrollTop+top-80,behavior:'smooth'});};
sb.forEach((b,i)=>b.onclick=()=>go(i));$$('#app [data-next]').forEach(b=>b.onclick=()=>go(step+1));$$('#app [data-prev]').forEach(b=>b.onclick=()=>go(step-1));
// inputs
const vw=$('#app .vw.calc');
vw.addEventListener('focusout',e=>{if(e.target.matches('[data-money]')){const n=num(e.target);e.target.value=n?fN(n):'0';}});
vw.addEventListener('input',e=>{if(e.target.matches('input,select'))calc();});
vw.addEventListener('change',e=>{if(e.target.matches('select'))calc();});
g('dcFmt').onclick=e=>{const b=e.target.closest('button');if(!b)return;const vals=$$('#app [data-money]').map(num);FMT=b.dataset.v;$$('#dcFmt button').forEach(x=>x.classList.toggle('on',x===b));$$('#app [data-money]').forEach((x,i)=>x.value=fN(vals[i]));calc();};
$$('#app [data-money]').forEach(x=>{x.value=fN(num(x));});
let sTab='sell';
const addM=(d,m)=>{const x=new Date(d);x.setMonth(x.getMonth()+m);return x;};
const sched=(p,amt,on)=>{if(!on||!amt)return [{d:new Date(g(p+'D').value||'2026-07-01'),v:amt}];const n=Math.max(1,Math.min(24,Math.round(num(g(p+'N'))))),iv=+g(p+'I').value;return Array.from({length:n},(_,k)=>({d:addM(g(p+'D').value||'2026-07-01',k*iv),v:amt/n}));};
let R={};
function calc(){
 const fee=num(g('dFee')),ao=items('dAo'),aoMax=ao.reduce((a,x)=>a+x.amount,0),aoG=ao.filter(x=>x.g).reduce((a,x)=>a+x.amount,0);
 const sol=O.oTrain?num(g('dSol'))/100*fee:0,train=O.oTrain?num(g('dTrain')):0;
 const sellOn=O.oSell?num(g('dSell'))/100*(g('dBasis').value==='net'?Math.max(0,num(g('dNext'))-fee):num(g('dNext'))):0;
 const salY=num(g('dSal'))*(+SV.dPer),pf=items('dPf'),pfMax=pf.reduce((a,x)=>a+x.amount,0),pfG=pf.filter(x=>x.g).reduce((a,x)=>a+x.amount,0);
 const yrs=Math.max(0,num(g('dYrs'))),tax=Math.min(100,num(g('dTax')))/100;
 const gMax=salY+pfMax,gG=salY+pfG,nMax=gMax*(1-tax),nG=gG*(1-tax);
 const base={full:gMax*yrs,year:gMax,fullnet:nMax*yrs,yearnet:nMax}[g('wApp').value];
 const cW=num(g('wRate'))/100*base,cF=num(g('fRate'))/100*(g('fApp').value==='fee'?fee:fee+aoMax),cA=O.oAdd?num(g('aAmt')):0,tot=cW+cF+cA;
 const perYr=tot/Math.max(1,yrs);
 const byBuy=(SV.wPaid==='buy'?cW:0)+(SV.fPaid==='buy'?cF:0)+(SV.aPaid==='buy'?cA:0),bySell=tot-byBuy;
 const n=+SV.nPar,parts=PS.slice(0,n),shSum=parts.reduce((a,p)=>a+p.s,0),share=parts[0].s/100,you=tot*share;
 const cty=COUNTRIES.find(c=>c[0]===g('dCty').value);
 R={fee,ao,aoMax,aoG,sol,train,sellOn,salY,pf,pfMax,gMax,gG,nMax,nG,yrs,tax,cW,cF,cA,tot,you,share,byBuy,bySell,perYr,parts,cty,player:g('dPlayer').value.trim(),from:g('dFrom').value.trim(),to:g('dTo').value.trim(),pos:POSV};
 const y=g('you'),nv=E(you);if(y.textContent!==nv){y.textContent=nv;y.classList.add('bump');setTimeout(()=>y.classList.remove('bump'),200);}
 g('barV').textContent=nv;g('youSub').textContent=n>1?`Your ${parts[0].s}% share of the total commission`:'Your estimated commission cut';
 g('sTot').textContent=E(tot);g('sYr').textContent=E(perYr);g('cWv').textContent=E(cW);g('cFv').textContent=E(cF);g('sellVal').textContent=E(sellOn);
 g('sHead').textContent=`${R.player||'Player'} · ${POSV}`;g('sMove').textContent=`${R.from||'—'} → ${R.to||'—'} · ${yrs} yrs`;
 const sellRows=[['Transfer fee',fee],['Add-ons (max)',aoMax],sol?['Solidarity withheld',-sol]:null,['Receives (max)',fee+aoMax-sol,1]].filter(Boolean);
 const buyRows=[['Transfer fee + add-ons',fee+aoMax],train?['Training compensation',train]:null,[`Player wages (term)`,gMax*yrs],['Total cost',fee+aoMax+train+gMax*yrs,1]].filter(Boolean);
 const kv=rows=>rows.map(r=>`<div class="${r[2]?'tot':''}"><span>${r[0]}</span><b>${E(r[1])}</b></div>`).join('');
 g('rSell').innerHTML=kv(sellRows);g('rBuy').innerHTML=kv(buyRows);
 g('rCon').innerHTML=kv([['Basic salary / yr',salY],['Performance / yr',pfMax],['Net over contract (max)',nMax*yrs,1]]);
 const tabs={sell:[...sellRows,['Commission paid by selling club',bySell],sellOn?['Future sell-on',sellOn]:null],buy:[...buyRows.slice(0,-1),['Commission paid by buying club',byBuy],['Buying club total cost',fee+aoMax+train+gMax*yrs+byBuy,1]],player:[['Gross / year (max)',gMax],['Gross / year (guaranteed)',gG],[`Net / year (max) · ${(tax*100).toFixed(1).replace(/\.0$/,'')}% tax`,nMax],['Net / year (guaranteed)',nG],['Net over contract (max)',nMax*yrs,1]]}[sTab].filter(Boolean);
 g('sBody').innerHTML=kv(tabs);
 g('spBar').innerHTML=parts.map((p,i)=>`<i style="width:${shSum?p.s/shSum*100:0}%;background:${COL[i]}"></i>`).join('');
 g('spLeg').innerHTML=parts.map((p,i)=>`<span><i style="background:${COL[i]}"></i>${p.n||'Party '+(i+1)} (${p.s}%) · ${E(tot*p.s/100)}</span>`).join('')+(Math.round(shSum)!==100?`<span style="color:var(--bad)">Shares add up to ${shSum}%</span>`:'');
 // payments timeline: your share of each component
 const ci=O.oCI;const pays=[...sched('cw',cW*share,ci).map(p=>({...p,c:'#F4691F'})),...sched('cf',cF*share,ci).map(p=>({...p,c:'#15151C'})),...(cA?[{d:new Date(g('cwD').value||'2026-07-01'),v:cA*share,c:'#C9A27E'}]:[])].filter(p=>p.v>0);
 const byD={};pays.forEach(p=>{const k=p.d.toISOString().slice(0,7);(byD[k]=byD[k]||{d:p.d,parts:[]}).parts.push(p);});const cols=Object.values(byD).sort((a,b)=>a.d-b.d);
 const max=Math.max(1,...cols.map(c=>c.parts.reduce((a,p)=>a+p.v,0)));g('tlB').textContent=pays.length+(pays.length===1?' payment':' payments');
 g('tl').innerHTML=cols.slice(0,12).map(c=>{const t=c.parts.reduce((a,p)=>a+p.v,0);return `<div class="b"><em>${AD.money(t/1e6)}</em><div style="width:100%;display:flex;flex-direction:column-reverse;height:${Math.max(6,t/max*62)}px;border-radius:6px 6px 3px 3px;overflow:hidden">${c.parts.map(p=>`<i style="height:${p.v/t*100}%;background:${p.c}"></i>`).join('')}</div><span>${c.d.toLocaleDateString('en-GB',{month:'short'}).toUpperCase()} ${String(c.d.getFullYear()).slice(2)}</span></div>`;}).join('');
 S.lastCalc={fee,add:aoMax,sell:O.oSell?num(g('dSell')):0,comm:num(g('fRate')),net:fee+aoMax-sol};save('lastCalc');
}
g('sTab').onclick=e=>{const b=e.target.closest('button');if(!b)return;sTab=b.dataset.v;$$('#sTab button').forEach(x=>x.classList.toggle('on',x===b));calc();};
g('sheetBar').onclick=()=>g('dcSum').scrollIntoView({behavior:'smooth'});
// my deals
const dlist=()=>{g('dcList').innerHTML=S.deals.length?S.deals.map((d,i)=>`<li><button data-i="${i}">${d.name}<small>${d.when} · you make ${d.you}</small></button></li>`).join(''):'<li style="padding:10px;color:var(--faint);font-size:13px">No saved deals yet. Saved deals stay in this browser.</li>';};
g('dcMyB').onclick=e=>{e.stopPropagation();dlist();g('dcMy').classList.toggle('open');};
vw.addEventListener('click',e=>{if(!e.target.closest('#dcMy'))g('dcMy').classList.remove('open');});
g('dcList').onclick=e=>{const b=e.target.closest('button[data-i]');if(!b)return;const d=S.deals[+b.dataset.i];Object.entries(d.f).forEach(([id,v])=>{const x=g(id);if(x)x.value=v;});['pLg','pCl','pPl','tLg','tCl'].forEach((id,i)=>{if(d.f[id]!==undefined){g(id).value=d.f[id];[fillP,fillPl,syncP,fillT,syncP][i]();g(id).value=d.f[id];}});syncP();POSV=g('dPos').value;calc();g('dcMy').classList.remove('open');toast('Loaded '+d.name);};
const saveDeal=()=>{const f={};$$('#app .vw.calc input[id],#app .vw.calc select[id]').forEach(x=>f[x.id]=x.value);S.deals.unshift({name:(R.player||'Untitled deal')+' · '+POSV,when:new Date().toLocaleDateString('en-GB'),you:E(R.you),f});S.deals=S.deals.slice(0,15);save('deals');toast('Deal saved to My deals');};
g('dcSave').onclick=saveDeal;g('dcSave2').onclick=saveDeal;
// export: deal summary document (same sections as the product PDF)
g('dcPdf').onclick=async()=>{await ADX.vLoad(700);const r=R;const row=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`;
 modal(`<div class="doc"><div class="dh"><div><h2>Deal Summary</h2><div class="note" style="display:block">${r.player||'Player'} · ${r.pos} · ${r.from||'—'} → ${r.to||'—'}</div></div><div class="r"><b style="font-family:var(--fd);font-size:14px;color:var(--ink)">AGENTS DESK</b><br>${new Date().toLocaleDateString('en-GB')}</div></div>
 <div class="dsec"><h4>Player &amp; move</h4><div class="dg">${row('Player',(r.player||'—')+' · '+r.pos)}${row('From → To',(r.from||'—')+' → '+(r.to||'—'))}${row('Contract length',r.yrs+' yrs')}</div></div>
 <div class="dsec"><h4>Player earnings · ${r.cty[1].replace(/^\S+\s/,'')} (${(r.tax*100).toFixed(1).replace(/\.0$/,'')}% tax)</h4><div class="dg">${row('Basic salary / yr',E(r.salY))}${r.pf.map(x=>row(x.label,E(x.amount))).join('')}${row('Gross / year (max)',E(r.gMax))}${row('Net / year (max)',E(r.nMax))}${row('Net / year (guaranteed)',E(r.nG))}${row('Net over contract (max)',E(r.nMax*r.yrs))}</div></div>
 <div class="dsec"><h4>Selling club</h4><div class="dg">${row('Transfer fee',E(r.fee))}${r.ao.map(x=>row(x.label,E(x.amount))).join('')}${r.sol?row('Solidarity withheld',E(-r.sol)):''}${row('Receives (max)',E(r.fee+r.aoMax-r.sol))}</div></div>
 <div class="dsec"><h4>Agent commission</h4><div class="dg">${row(`% of wage · paid by ${SV.wPaid==='buy'?'buying':'selling'} club`,E(r.cW))}${row(`% of transfer fee · paid by ${SV.fPaid==='buy'?'buying':'selling'} club`,E(r.cF))}${r.cA?row('Additional (fixed)',E(r.cA)):''}${row('Total commission',E(r.tot))}${r.parts.map(p=>row(`${p.n} (${p.s}%)`,E(r.tot*p.s/100))).join('')}${row('Your share',E(r.you))}</div></div>
 <div class="tot"><span>Buying club total cost</span><b>${E(r.fee+r.aoMax+r.train+r.gMax*r.yrs+r.byBuy)}</b></div>
 <p class="disc">Indicative only. Tax rates are simplified top-bracket estimates; sell-on figures assume a hypothetical future fee.</p></div>
 <div class="row" style="margin-top:14px"><button class="btn b-dark" id="cpSum">Copy summary</button><span class="note">PDF download runs in the live product.</span></div>`);
 g('cpSum').onclick=()=>{const t=$('#modalBody .doc').innerText;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Summary copied')).catch(()=>toast('Copy is not available here'));};};
calc();};
})();

/* ===== Views: requests, log, filter, targets, no agents ===== */
(function(){
const {$,$$,S,save,toast,modal,profile,who,tgtBtn,svg,money,hue}=ADX;const P=AD.players;const V=ADV;
const stamp=()=>new Date().toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
V.requests=el=>{
 el.innerHTML=`<div class="ph"><div><span class="badge o">CRM</span><h1 style="margin-top:10px">Transfer requests</h1><p>Save a transfer brief, then run an AI player search against it. We'll email you when the result is ready.</p></div></div>
 <div class="card"><div class="field"><label for="rqT">New transfer request</label><textarea class="inp" id="rqT" rows="3" placeholder="Right-footed left winger, high 1v1 dribbling and running volume, budget 1-1.2M. Bouanga type."></textarea></div><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn b-dark" id="rqAdd">+ Add request</button></div></div>
 <div class="card" style="margin-top:14px"><div class="card-h"><h3>Your requests</h3><span class="badge n" id="rqN"></span></div><div id="rqL"></div></div>`;
 const draw=()=>{$('#rqN').textContent=S.requests.length;$('#rqL').innerHTML=S.requests.map(r=>`<div class="li" style="align-items:flex-start;flex-wrap:wrap;gap:10px"><div style="min-width:0;flex:1 1 300px"><div style="white-space:normal">${r.t}</div><div class="row" style="margin-top:6px"><span class="badge ${r.st==='ready'?'g':'w'}">${r.st==='ready'?'Result ready':'<span class="ldot"></span>Running'}</span><span class="note">${r.d}</span></div></div><div class="row"><button class="btn b-or b-sm" data-show="${r.id}" ${r.st!=='ready'?'disabled style="opacity:.5"':''}>Show result</button><button class="btn b-gh b-sm" data-ai="${r.id}">AI Agent</button><button class="btn b-gh b-sm" data-del="${r.id}" style="color:var(--bad)">Delete</button></div></div>`).join('')||'<div class="empty">No requests yet. Write a brief above.</div>';};
 $('#rqAdd').onclick=()=>{const t=$('#rqT').value.trim();if(!t){toast('Write the brief first');return;}const r={id:Date.now(),t,d:stamp(),st:'run'};S.requests.unshift(r);save('requests');$('#rqT').value='';draw();toast('Request saved. Running the AI search…');setTimeout(()=>{r.st='ready';save('requests');if($('#rqL'))draw();toast('Result ready for your request');},3500);};
 $('#rqL').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=+(b.dataset.show||b.dataset.ai||b.dataset.del);const r=S.requests.find(x=>x.id===id);
  if(b.dataset.del){S.requests=S.requests.filter(x=>x.id!==id);save('requests');draw();toast('Request deleted');return;}
  S.aiPrefill=r.t;S.aiAuto=!!b.dataset.show;ADX.go('ai');};
 draw();};

V.log=el=>{
 const cl=Object.values(AD.clubs).flat();
 el.innerHTML=`<div class="ph"><div><span class="badge o">CRM</span><h1 style="margin-top:10px">Transfer log</h1><p>Track transfer history for your clients: who moved, where, for how much and when.</p></div><button class="btn b-dark" id="lgNew">+ Log a transfer</button></div>
 <div class="card" style="padding:6px"><div class="tw"><table class="tbl"><thead><tr><th>Player</th><th>From</th><th>To</th><th>Type</th><th>Fee</th><th>Date</th><th></th></tr></thead><tbody id="lgB"></tbody></table></div></div>`;
 const draw=()=>{$('#lgB').innerHTML=S.log.map((l,i)=>`<tr><td><b>${l.player}</b></td><td>${l.from}</td><td>${l.to}</td><td><span class="badge ${l.type==='Loan'?'o':'g'}">${l.type}</span></td><td class="val">${l.fee||'—'}</td><td>${l.date}</td><td><button class="btn b-gh b-sm" data-i="${i}">Remove</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No transfers logged yet. Log your first one with the button above.</td></tr>';};
 $('#lgB').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;S.log.splice(+b.dataset.i,1);save('log');draw();};
 $('#lgNew').onclick=()=>{modal(`<h3 style="margin-bottom:14px">Log a transfer</h3><form id="lgF" class="grid g2"><div class="field"><label for="lP">Player</label><input class="inp" id="lP" list="lPl" required><datalist id="lPl">${P.slice(0,60).map(p=>`<option>${p.name}</option>`).join('')}</datalist></div><div class="field"><label for="lTy">Type</label><select class="sel" id="lTy"><option>Permanent</option><option>Loan</option><option>Free transfer</option></select></div><div class="field"><label for="lF">From</label><input class="inp" id="lF" list="lCl" required></div><div class="field"><label for="lT">To</label><input class="inp" id="lT" list="lCl" required><datalist id="lCl">${cl.map(c=>`<option>${c}</option>`).join('')}</datalist></div><div class="field"><label for="lFe">Fee</label><input class="inp" id="lFe" placeholder="€2.5M"></div><div class="field"><label for="lD">Date</label><input class="inp" type="date" id="lD" value="${new Date().toISOString().slice(0,10)}"></div><button class="btn b-or" style="grid-column:1/-1">Save to log</button></form>`);
  $('#lgF').onsubmit=e=>{e.preventDefault();S.log.unshift({player:$('#lP').value,from:$('#lF').value,to:$('#lT').value,type:$('#lTy').value,fee:$('#lFe').value,date:$('#lD').value});save('log');$('#modal').className='modal';draw();toast('Transfer logged');};};
 draw();};

/* Filter: the original player search fields */
V.filter=el=>{
 el.innerHTML=`<div class="ph"><div><span class="badge o">Players</span><h1 style="margin-top:10px">Player search</h1><p>Search by player name, or use advanced filters to narrow your scout.</p></div><span class="note">● Sample data</span></div>
 <div class="card"><div class="card-h"><h3>Search filters</h3><button class="btn b-gh b-sm" id="fClr">Clear all</button></div>
 <div class="field" style="margin-bottom:12px"><label for="fN">Player name</label><input class="inp" id="fN" placeholder="Search by name…"></div>
 <div class="grid g4"><div class="field"><label for="fPos">Detailed position</label><select class="sel" id="fPos"><option value="">All positions</option>${AD.positions.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select></div>
 <div class="field"><label for="fLg">League</label><select class="sel" id="fLg"><option value="">All European leagues</option>${AD.leagues.map(l=>`<option>${l}</option>`).join('')}</select></div>
 <div class="field"><span class="lbl">EU passport</span><div class="seg" id="fEU"><button class="on" data-v="">All</button><button data-v="1">EU</button><button data-v="0">No EU</button></div></div>
 <div class="field"><span class="lbl">Preferred foot</span><div class="seg" id="fFt"><button class="on" data-v="">Any</button><button data-v="Left">Left</button><button data-v="Right">Right</button></div></div></div>
 <div class="grid g4" style="margin-top:12px">${[['fA','Age range',16,40,1,' yrs'],['fR','Average rating',5,10,.1,''],['fV','Market value (€M)',0,200,1,'M'],['fH','Height (optional)',140,220,1,' cm']].map(r=>`<div class="field"><span class="lbl" style="display:flex;justify-content:space-between">${r[1]} <b id="${r[0]}L" style="color:var(--ink)"></b></span><div class="dual"><span class="tr"></span><span class="fl" id="${r[0]}F"></span><input type="range" id="${r[0]}1" min="${r[2]}" max="${r[3]}" step="${r[4]}" value="${r[2]}" aria-label="${r[1]} min"><input type="range" id="${r[0]}2" min="${r[2]}" max="${r[3]}" step="${r[4]}" value="${r[3]}" aria-label="${r[1]} max"></div></div>`).join('')}</div></div>
 <div class="row" style="justify-content:space-between;margin:14px 0 10px"><b id="fCount"></b><select class="sel" id="fSort" style="width:auto;height:36px"><option value="value">Highest value</option><option value="rating">Highest rating</option><option value="age">Youngest</option></select></div>
 <div class="card" style="padding:6px"><div class="tw cardify"><table class="tbl"><thead><tr><th>Player</th><th>Position</th><th>Club</th><th>Rating</th><th>Value</th><th>Foot</th><th></th></tr></thead><tbody id="fB"></tbody></table></div><div class="mcards" id="fM"></div><div class="row" style="justify-content:center;padding:12px"><button class="btn b-gh b-sm" id="fMore">Show more</button></div></div>`;
 if(S.gq){$('#fN').value=S.gq;S.gq=null;}
 const sv={fEU:'',fFt:''};['fEU','fFt'].forEach(id=>$('#'+id).onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('#'+id+' button').forEach(x=>x.classList.toggle('on',x===b));sv[id]=b.dataset.v;n=20;draw();});
 let n=20;const rg=k=>[+$('#'+k+'1').value,+$('#'+k+'2').value];
 const lab={fA:v=>`${v[0]}–${v[1]} yrs`,fR:v=>`${v[0].toFixed(1)}–${v[1].toFixed(1)}`,fV:v=>`€${v[0]}M–€${v[1]}M`,fH:v=>`${v[0]}–${v[1]} cm`};
 function draw(){['fA','fR','fV','fH'].forEach(k=>{const a=$('#'+k+'1'),b=$('#'+k+'2'),mn=+a.min,mx=+a.max;const v=rg(k);$('#'+k+'L').textContent=lab[k](v);$('#'+k+'F').style.left=(v[0]-mn)/(mx-mn)*100+'%';$('#'+k+'F').style.width=(v[1]-v[0])/(mx-mn)*100+'%';});
  const q=$('#fN').value.toLowerCase(),A=rg('fA'),Rr=rg('fR'),Vv=rg('fV'),H=rg('fH');const so=$('#fSort').value;
  const r=P.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!$('#fPos').value||p.pos===$('#fPos').value)&&(!$('#fLg').value||p.league===$('#fLg').value)&&p.age>=A[0]&&p.age<=A[1]&&p.rating>=Rr[0]&&p.rating<=Rr[1]&&p.value>=Vv[0]&&p.value<=Vv[1]&&p.height>=H[0]&&p.height<=H[1]&&(sv.fEU===''||(p.eu?'1':'0')===sv.fEU)&&(!sv.fFt||p.foot===sv.fFt)).sort((a,b)=>so==='age'?a.age-b.age:b[so]-a[so]);
  $('#fCount').textContent=`${r.length} players found`;const vis=r.slice(0,n);
  $('#fB').innerHTML=vis.map(p=>`<tr data-p="${p.id}" style="cursor:pointer"><td>${who(p)}</td><td><span class="pos">${p.posName}</span></td><td>${p.club}<span class="note" style="display:block">${p.league}</span></td><td>${p.rating.toFixed(1)}</td><td class="val">${money(p.value)}</td><td>${p.foot}</td><td>${tgtBtn(p)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No players match. Widen a filter.</td></tr>';
  $('#fM').innerHTML=vis.map(p=>`<div class="mc" data-p="${p.id}"><div class="r1">${who(p)}<span class="val">${money(p.value)}</span></div><div class="r2"><span class="pos">${p.posName}</span><span>${p.club}</span><span>Rating ${p.rating.toFixed(1)}</span></div>${tgtBtn(p,'+ Add to targets')}</div>`).join('')||'<div class="empty">No players match.</div>';
  $('#fMore').style.display=r.length>n?'':'none';}
 el.addEventListener('input',e=>{if(e.target.type==='range'){const k=e.target.id.slice(0,2);const a=$('#'+k+'1'),b=$('#'+k+'2');if(+a.value>+b.value){if(e.target===a)a.value=b.value;else b.value=a.value;}}n=20;draw();});
 el.addEventListener('change',e=>{if(e.target.tagName==='SELECT'){n=20;draw();}});
 $('#fMore').onclick=()=>{n+=20;draw();};
 $('#fClr').onclick=()=>{$('#fN').value='';$('#fPos').value='';$('#fLg').value='';['fA','fR','fV','fH'].forEach(k=>{$('#'+k+'1').value=$('#'+k+'1').min;$('#'+k+'2').value=$('#'+k+'2').max;});['fEU','fFt'].forEach(id=>{sv[id]='';$$('#'+id+' button').forEach((x,i)=>x.classList.toggle('on',i===0));});draw();};
 el.addEventListener('click',e=>{if(e.target.closest('[data-tgt]'))return;const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));});
 draw();};

V.targets=el=>{
 el.innerHTML=`<div class="ph"><div><span class="badge o">Players</span><h1 style="margin-top:10px">Targets</h1><p>Players you are tracking for your clients and open requests.</p></div><div class="row"><a class="btn b-gh" href="#app-filter">Find players</a><a class="btn b-dark" href="#app-noagents">No Agents list</a></div></div><div id="tgL"></div>`;
 const draw=()=>{const r=P.filter(p=>S.targets.has(p.id));$('#tgL').innerHTML=r.length?`<div class="pcs">${r.map(p=>`<div class="pc" data-p="${p.id}"><div class="top">${who(p)}<span class="val" style="margin-left:auto">${money(p.value)}</span></div><div class="meta"><div><small>Club</small><b style="font-size:12.5px;white-space:normal">${p.club}</b></div><div><small>Contract</small><b>${p.contract}</b></div><div><small>Agent</small><b style="font-size:12.5px">${p.agent}</b></div></div><div class="row">${tgtBtn(p)}<a class="btn b-gh b-sm" href="#app-calc">Model a deal</a></div></div>`).join('')}</div>`:`<div class="card empty"><b style="display:block;color:var(--ink);font-size:16px;margin-bottom:6px">No targets yet</b>Add players from Filter, No Agents or the AI Agent and they will show up here.</div>`;};
 el.addEventListener('click',e=>{if(e.target.closest('[data-tgt]')){setTimeout(draw,50);return;}if(e.target.closest('a'))return;const c=e.target.closest('[data-p]');if(c)profile(P.find(p=>p.id===+c.dataset.p));});
 draw();};

V.noagents=el=>{
 const L=P.filter(p=>p.agent!=='Agency');
 el.innerHTML=`<div class="ph"><div><span class="badge o">Players</span><h1 style="margin-top:10px">No Agents</h1><p>Players without a registered agent — filter by name, position, league, relatives, and market value.</p></div><span class="badge n" style="height:32px;padding:0 12px">Demo · sample data</span></div>
 <div class="card"><div class="grid g4"><div class="field"><label for="naQ">Search by name</label><input class="inp" id="naQ" placeholder="Search players…"></div><div class="field"><label for="naP">Position</label><select class="sel" id="naP"><option value="">All positions</option>${AD.positions.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select></div><div class="field"><label for="naL">League</label><select class="sel" id="naL"><option value="">All leagues</option>${AD.leagues.map(l=>`<option>${l}</option>`).join('')}</select></div><div class="field"><label for="naA">Agent status</label><select class="sel" id="naA"><option value="">All</option><option>No agent</option><option>Relatives</option></select></div></div>
 <div class="field" style="margin-top:12px;max-width:420px"><span class="lbl" style="display:flex;justify-content:space-between">Market value <b id="naVL" style="color:var(--ink)"></b></span><div class="dual"><span class="tr"></span><span class="fl" id="naVF"></span><input type="range" id="naV1" min="0" max="200" value="0" aria-label="Min value"><input type="range" id="naV2" min="0" max="200" value="200" aria-label="Max value"></div></div></div>
 <div class="row" id="naS" style="margin:14px 0"></div>
 <div class="card" style="padding:6px"><div class="tw cardify"><table class="tbl" id="naT"><thead><tr><th data-k="name" aria-sort="none">Player</th><th data-k="pos" aria-sort="none">Position</th><th data-k="club" aria-sort="none">Club</th><th data-k="agent" aria-sort="none">Agent</th><th data-k="value" aria-sort="descending">Value</th><th data-k="age" aria-sort="none">Age</th><th data-k="contract" aria-sort="none">Contract</th><th></th></tr></thead><tbody></tbody></table></div><div class="mcards" id="naM"></div><div class="row" style="justify-content:space-between;padding:12px"><span class="note" id="naC"></span><button class="btn b-gh b-sm" id="naMore">Show more</button></div></div>`;
 let sk='value',dir=-1,n=15;
 const ctr=y=>{const l=y-2026,c=l<=0?'#DC2626':l===1?'#B7791F':'#16A34A';return `<span class="cbar"><i><b style="width:${Math.min(100,(l+1)*20)}%;background:${c}"></b></i>${y}</span>`;};
 const agb=a=>`<span class="st"><i style="background:${a==='No agent'?'#16A34A':'#B7791F'}"></i>${a==='No agent'?'no agent':'Relatives'}</span>`;
 function draw(){const v1=+$('#naV1').value,v2=+$('#naV2').value;$('#naVL').textContent=`€${v1}M–€${v2}M`;$('#naVF').style.left=v1/2+'%';$('#naVF').style.width=(v2-v1)/2+'%';
  const q=$('#naQ').value.toLowerCase();const r=L.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!$('#naP').value||p.pos===$('#naP').value)&&(!$('#naL').value||p.league===$('#naL').value)&&(!$('#naA').value||p.agent===$('#naA').value)&&p.value>=v1&&p.value<=v2).sort((a,b)=>{const x=a[sk],y=b[sk];return (typeof x==='string'?x.localeCompare(y):x-y)*dir;});
  const vis=r.slice(0,n);
  $('#naT tbody').innerHTML=vis.map(p=>`<tr data-p="${p.id}" style="cursor:pointer"><td><span class="who"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.nat}</span></span></span></td><td><span class="pos">${p.posName}</span></td><td>${p.club}</td><td>${agb(p.agent)}</td><td class="val">${money(p.value)}</td><td>${p.age}</td><td>${ctr(p.contract)}</td><td>${tgtBtn(p)}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">No players match these filters.</td></tr>';
  $('#naM').innerHTML=vis.map(p=>`<div class="mc" data-p="${p.id}"><div class="r1"><span class="who"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.club}</span></span></span><span class="val">${money(p.value)}</span></div><div class="r2"><span class="pos">${p.posName}</span>${agb(p.agent)}<span>${p.age} yrs</span>${ctr(p.contract)}</div>${tgtBtn(p,'+ Add to targets')}</div>`).join('')||'<div class="empty">No players match.</div>';
  $('#naC').textContent=`● Sample data · showing ${vis.length} of ${r.length}`;$('#naMore').style.display=r.length>n?'':'none';
  $('#naS').innerHTML=[[r.length,'players match'],[r.filter(p=>p.agent==='No agent').length,'with no agent at all'],[r.filter(p=>p.contract<=2027).length,'contracts end by 2027'],[r.filter(p=>p.age<23).length,'under 23']].map(x=>`<div class="stat-pill"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');}
 el.addEventListener('input',e=>{if(e.target.id==='naV1'||e.target.id==='naV2'){if(+$('#naV1').value>+$('#naV2').value-5){if(e.target.id==='naV1')$('#naV1').value=+$('#naV2').value-5;else $('#naV2').value=+$('#naV1').value+5;}}n=15;draw();});
 el.addEventListener('change',e=>{if(e.target.tagName==='SELECT'){n=15;draw();}});
 $$('#naT th[data-k]').forEach(th=>th.onclick=()=>{const k=th.dataset.k;dir=sk===k?-dir:(k==='value'?-1:1);sk=k;$$('#naT th[data-k]').forEach(t=>t.setAttribute('aria-sort',t===th?(dir>0?'ascending':'descending'):'none'));draw();});
 $('#naMore').onclick=()=>{n+=15;draw();};
 el.addEventListener('click',e=>{if(e.target.closest('[data-tgt],th'))return;const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));});
 draw();};
})();

/* ===== Views: teams, standings, feeds, news ===== */
(function(){
const {$,$$,S,toast,modal,profile,who,svg,money,hue}=ADX;const P=AD.players;const V=ADV;
let s=11;const rnd=()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
const PRE=['FC','SC','AS','Real','Sporting','Athletic','United','City','Racing','Olympique'];const PLACES=['Valmora','Kesterby','Brannick','Ostrava Nova','Lindemar','Port Aster','Hollin','Marisca','Dornfeld','Calvera','Westerholt','Sanmarco','Rivabella','Tormund'];
const LT={};AD.leagues.forEach((lg,li)=>{const own=AD.clubs[lg];const extra=Array.from({length:9},(_,i)=>{const a=PRE[(i+li)%PRE.length],b=PLACES[(i*3+li)%PLACES.length];return ['United','City','Athletic'].includes(a)?b+' '+a:a+' '+b;});
 const teams=[...own,...extra].map((name,i)=>{const pl=24+Math.floor(rnd()*6);const w=Math.floor(rnd()*(pl*.6)),d=Math.floor(rnd()*(pl-w)*.5),l=pl-w-d;const gf=w*2+d+Math.floor(rnd()*10),ga=l*2+d+Math.floor(rnd()*8);return{name,pl,w,d,l,gf,ga,pts:w*3+d,squad:24+Math.floor(rnd()*8),age:(23+rnd()*5).toFixed(1),val:Math.round(20+rnd()*(lg==='Premier League'?900:300)),form:Array.from({length:5},()=>['W','D','L'][Math.floor(rnd()*3)])};}).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga));LT[lg]=teams;});
const ini=c=>c.split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase();
const CC=['#1D4ED8','#DC2626','#15151C','#16A34A','#9333EA','#B45309','#0891B2','#DB2777'];
const crest=(n,sz=40)=>`<span class="av" style="width:${sz}px;height:${sz}px;border-radius:12px;background:${CC[n.length%CC.length]};font-size:${sz/3.2}px">${ini(n)}</span>`;
ADX.LT=LT;ADX.crest=(n,sz)=>crest(n,sz);ADX.CC=CC;ADX.ini=ini;
const lgSel=id=>`<select class="sel" id="${id}" style="width:auto;min-width:200px">${AD.leagues.map(l=>`<option>${l}</option>`).join('')}</select>`;
V.teams=el=>{
 el.innerHTML=`<div class="ph"><div><span class="badge o">Season report</span><h1 style="margin-top:10px">Teams</h1><p>Squad size, average age and squad value for every club in the league.</p></div>${lgSel('tmL')}</div><div class="pcs" id="tmG"></div><p class="note" style="margin-top:12px">● Sample clubs</p>`;
 const draw=()=>{$('#tmG').innerHTML=LT[$('#tmL').value].slice().sort((a,b)=>b.val-a.val).map(t=>`<button class="pc" data-t="${t.name}"><div class="top">${crest(t.name)}<span class="nm"><b>${t.name}</b><span>${$('#tmL').value}</span></span></div><div class="meta"><div><small>Squad</small><b>${t.squad}</b></div><div><small>Avg age</small><b>${t.age}</b></div><div><small>Value</small><b class="val">€${t.val}M</b></div></div></button>`).join('');};
 $('#tmL').onchange=draw;$('#tmG').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;const lg=$('#tmL').value;const sq=P.filter(p=>p.league===lg).slice(0,6);modal(`<div class="who" style="margin-bottom:14px">${crest(b.dataset.t,52)}<span class="nm"><b style="font-size:20px;font-family:var(--fd)">${b.dataset.t}</b><span>${lg}</span></span></div><span class="lbl">Players in this league on your radar</span><div class="kv" style="margin-top:6px">${sq.map(p=>`<div><span>${p.name} · ${p.posName}</span><b>${money(p.value)}</b></div>`).join('')}</div>`);};
 draw();};
V.standings=el=>{
 el.innerHTML=`<div class="ph"><div><span class="badge o">Season report</span><h1 style="margin-top:10px">Standings</h1><p>League table with form for the current season.</p></div>${lgSel('sdL')}</div><div class="card" style="padding:6px"><div class="tw"><table class="tbl"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th class="hm">GF</th><th class="hm">GA</th><th>GD</th><th>Pts</th><th class="hm">Form</th></tr></thead><tbody id="sdB"></tbody></table></div></div><p class="note" style="margin-top:12px">● Sample table</p>`;
 const fc={W:'#16A34A',D:'#8C8883',L:'#DC2626'};
 const draw=()=>{const t=LT[$('#sdL').value];$('#sdB').innerHTML=t.map((x,i)=>`<tr><td><b style="display:inline-grid;place-items:center;width:24px;height:24px;border-radius:7px;${i<4?'background:var(--go-soft);color:var(--go)':i>=t.length-3?'background:var(--bad-soft);color:var(--bad)':''}">${i+1}</b></td><td><span class="who">${crest(x.name,28)}<b>${x.name}</b></span></td><td>${x.pl}</td><td>${x.w}</td><td>${x.d}</td><td>${x.l}</td><td class="hm">${x.gf}</td><td class="hm">${x.ga}</td><td>${x.gf-x.ga>0?'+':''}${x.gf-x.ga}</td><td><b>${x.pts}</b></td><td class="hm"><span class="row" style="gap:3px;flex-wrap:nowrap">${x.form.map(f=>`<span style="width:20px;height:20px;border-radius:6px;display:grid;place-items:center;color:#fff;font-size:10px;font-weight:700;background:${fc[f]}">${f}</span>`).join('')}</span></td></tr>`).join('');};
 $('#sdL').onchange=draw;draw();};
/* feeds */
const allClubs=Object.entries(LT).flatMap(([lg,t])=>t.map(x=>({c:x.name,lg})));
const STAT={deals:[['Talks open','w'],['Bid submitted','o'],['Medical booked','g'],['Terms agreed','g'],['On hold','n']],journalism:[['Confirmed','g'],['Likely','w'],['Unverified','n']],done:[['Done deal','g'],['Loan','o']]};
const SRC=['Club statement','Monitored source','Local press','Agent network','Broadcaster'];
let k=1;const mk=(type,i)=>{const p=P[(i*7+type.length)%P.length];const to=allClubs[(i*5+3)%allClubs.length];const st=STAT[type][i%STAT[type].length];return{id:k++,type,p,from:{c:p.club,lg:p.league},to:to.c===p.club?allClubs[(i+1)%allClubs.length]:to,st,fee:type==='done'?(st[0]==='Loan'?'Loan':money(Math.max(.3,p.value*(.8+(i%5)/10)))):'',src:SRC[i%SRC.length],t:Date.now()-i*60000*(7+i%13)};};
const FEED=[];['deals','journalism','done'].forEach(t=>{for(let i=0;i<14;i++)FEED.push(mk(t,i+t.length*3));});
const ago=d=>{const m=Math.round((Date.now()-d)/60000);return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago';};
const club=c=>`<span class="club"><i style="background:${CC[c.c.length%CC.length]}">${ini(c.c)}</i><span>${c.c}</span></span>`;
let feedTimer;
const feed=type=>el=>{
 const T={deals:['Live Deals','Stay on top of the latest live deals shaping the market for agents.'],journalism:['Live Journalism','Reporting from monitored sources, rated by how reliable it is.'],done:['Done Deals','Completed transfers and loans, with fees where published.']}[type];
 el.innerHTML=`<div class="ph"><div><span class="badge r"><span class="ldot"></span>LIVE</span><h1 style="margin-top:10px">${T[0]}</h1><p>${T[1]}</p></div></div>
 <div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="seg" id="fdT"><a class="btn b-sm" href="#app-deals" style="${type==='deals'?'background:#fff;box-shadow:0 1px 3px rgba(21,21,28,.12)':''}">Live deals</a><a class="btn b-sm" href="#app-journalism" style="${type==='journalism'?'background:#fff;box-shadow:0 1px 3px rgba(21,21,28,.12)':''}">Live journalism</a><a class="btn b-sm" href="#app-done" style="${type==='done'?'background:#fff;box-shadow:0 1px 3px rgba(21,21,28,.12)':''}">Done deals</a></div>
 <div class="row" style="flex:1;justify-content:flex-end;min-width:0"><div class="field" style="max-width:260px;flex:1"><input class="inp" id="fdQ" placeholder="Search by player name…" aria-label="Search by player name"></div><select class="sel" id="fdL" style="max-width:200px" aria-label="League"><option value="">All leagues</option>${AD.leagues.map(l=>`<option>${l}</option>`).join('')}</select></div></div>
 <div style="display:flex;flex-direction:column;gap:8px" id="fdF"></div><p class="note" style="margin-top:12px">● Sample data · new items arrive automatically</p>`;
 const draw=nid=>{if(!$('#fdF'))return;const q=$('#fdQ').value.toLowerCase(),lg=$('#fdL').value;const r=FEED.filter(x=>x.type===type&&(!q||x.p.name.toLowerCase().includes(q))&&(!lg||x.from.lg===lg||x.to.lg===lg)).sort((a,b)=>b.t-a.t);
  $('#fdF').innerHTML=r.map(x=>`<article class="fi${x.id===nid?' new':''}" data-p="${x.p.id}" style="cursor:pointer"><span class="av" style="background:${hue(x.p)}">${x.p.init}</span><span class="nm"><b>${x.p.name}</b><span>${x.p.posName} · ${x.p.age}</span></span><span class="mv2">${club(x.from)}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex:none;color:var(--faint)"><path d="M5 12h14M13 6l6 6-6 6"/></svg>${club(x.to)}${x.fee?`<span class="money" style="font-size:12.5px;color:var(--mute)">${x.fee}</span>`:''}</span><span class="when"><span class="badge ${x.st[1]}">${x.st[0]}</span><span style="display:block;margin-top:4px">${ago(x.t)} · ${x.src}</span></span></article>`).join('')||'<div class="card empty">Nothing matches this search.</div>';};
 $('#fdQ').oninput=()=>draw();$('#fdL').onchange=()=>draw();
 $('#fdF').onclick=e=>{const a=e.target.closest('[data-p]');if(a)profile(P.find(p=>p.id===+a.dataset.p));};
 draw();clearInterval(feedTimer);let n=60;feedTimer=setInterval(()=>{if(!$('#fdF')){clearInterval(feedTimer);return;}const x=mk(type,n++);x.t=Date.now();FEED.push(x);draw(x.id);},9000);};
V.deals=feed('deals');V.journalism=feed('journalism');V.done=feed('done');
V.news=el=>{
 const H=[p=>`${p.name} attracts interest after strong run at ${p.club}`,p=>`${p.club} open contract talks with ${p.name}`,p=>`Scouts watch ${p.name} as ${p.league} window nears`,p=>`${p.name}'s contract runs to ${p.contract}: what it means for a summer move`,p=>`Why ${p.posName.toLowerCase()}s like ${p.name} are in demand this window`];
 const N=P.slice(30,48).map((p,i)=>({p,h:H[i%H.length](p),lg:p.league,t:Date.now()-i*3600000*(1+i%4),tag:['Transfer','Contract','Scouting','Market','Analysis'][i%5]}));
 el.innerHTML=`<div class="ph"><div><span class="badge o">Transfer updates</span><h1 style="margin-top:10px">News dashboard</h1><p>Stories around players, clubs and the market, filtered to what matters for your desk.</p></div>${lgSel('nwL').replace('<select class="sel" id="nwL" style="width:auto;min-width:200px">','<select class="sel" id="nwL" style="width:auto;min-width:200px"><option value="">All leagues</option>')}</div><div class="news" id="nwG"></div><p class="note" style="margin-top:12px">● Sample stories</p>`;
 const draw=()=>{const lg=$('#nwL').value;$('#nwG').innerHTML=N.filter(n=>!lg||n.lg===lg).map(n=>`<article class="nw"><div class="tp"><span class="badge o" style="background:rgba(244,105,31,.2);color:#FF9A5A">${n.tag}</span></div><h3>${n.h}</h3><p>${n.lg} · ${ago(n.t)}</p><button class="link" data-p="${n.p.id}" style="align-self:flex-start">Open player →</button></article>`).join('')||'<div class="card empty">No stories for this league yet.</div>';};
 $('#nwL').onchange=draw;$('#nwG').onclick=e=>{const b=e.target.closest('[data-p]');if(b)profile(P.find(p=>p.id===+b.dataset.p));};draw();};
})();

/* ===== View: AI Agent (chat landing) ===== */
(function(){
const {$,$$,S,toast,profile,who,tgtBtn,money,hue,mark}=ADX;const P=AD.players;
const pub=p=>({id:p.id,name:p.name,age:p.age,nationality:p.nat,eu_passport:p.eu,position:p.posName,pos_code:p.pos,club:p.club,league:p.league,rating:p.rating,value_m_eur:p.value,foot:p.foot,height_cm:p.height,contract_until:p.contract,agent:p.agent,traits:p.traits});
function search(c){const pos=[].concat(c.positions||[]).map(x=>String(x).toUpperCase());const lg=[].concat(c.leagues||[]).map(String);
 let r=P.filter(p=>(!pos.length||pos.includes(p.pos))&&(!lg.length||lg.includes(p.league))&&(c.max_age==null||p.age<=+c.max_age)&&(c.min_age==null||p.age>=+c.min_age)&&(c.max_value_m==null||p.value<=+c.max_value_m)&&(c.min_value_m==null||p.value>=+c.min_value_m)&&(!c.foot||p.foot===c.foot)&&(c.min_rating==null||p.rating>=+c.min_rating)&&(!c.eu_passport||p.eu)&&(!c.agent_status||p.agent===c.agent_status)&&(c.contract_until_max==null||p.contract<=+c.contract_until_max));
 if(c.trait){const t=String(c.trait).toLowerCase().split(' ')[0];r=r.map(p=>({p,s:p.traits.some(x=>x.toLowerCase().includes(t))?1:0})).sort((a,b)=>b.s-a.s).map(x=>x.p);}
 return r.sort((a,b)=>b.rating-a.rating).slice(0,Math.min(12,+c.limit||8));}
function parse(t){const c={};t=t.toLowerCase();
 if(/wing/.test(t))c.positions=['LW','RW'];if(/striker|centre-forward|forward/.test(t))c.positions=['ST'];if(/centre-back|center back|centre back/.test(t))c.positions=['CB'];if(/goalkeeper|keeper/.test(t))c.positions=['GK'];if(/midfield/.test(t))c.positions=['CM','CDM','CAM'];if(/left-back|full-back/.test(t))c.positions=['LB'];
 if(/right[- ]foot/.test(t))c.foot='Right';if(/left[- ]foot/.test(t))c.foot='Left';
 let m=t.match(/under (?:the age of )?(\d{2})/);if(m)c.max_age=+m[1]-1;m=t.match(/over (\d{2})/);if(m)c.min_age=+m[1]+1;
 m=t.match(/€?\s*([\d.]+)\s*[–-]\s*([\d.]+)\s*m/);if(m){c.min_value_m=+m[1]*.6;c.max_value_m=+m[2]*1.1;}else{m=t.match(/(?:budget|under) (?:of )?€?\s*([\d.]+)\s*m/);if(m)c.max_value_m=+m[1];}
 if(/eu passport/.test(t))c.eu_passport=true;m=t.match(/(?:higher|more|better) than (\d(?:\.\d)?)/);if(m)c.min_rating=+m[1];
 if(/unrepresented|no agent|without (?:an )?agent/.test(t))c.agent_status='No agent';
 m=t.match(/contracts? (?:ending|end|expir\w*) (?:in |by )?(20\d\d)/);if(m)c.contract_until_max=+m[1];
 const lg=AD.leagues.filter(l=>t.includes(l.toLowerCase()));if(lg.length)c.leagues=lg;
 ['dribbling','running','pockets','aerial','finishing','crossing','passing'].forEach(k=>{if(t.includes(k))c.trait=k;});return c;}
const commission=i=>{const fee=+i.fee_eur||0,rate=+i.fee_rate_pct||0,wage=+i.gross_salary_per_year_eur||0,wr=+i.wage_rate_pct||0,yrs=+i.contract_years||0;const cf=fee*rate/100,cw=wage*wr/100*(yrs||1);return{fee_commission_eur:Math.round(cf),wage_commission_eur:Math.round(cw),total_eur:Math.round(cf+cw)};};
ADX.aiFind=q=>{const c=parse(q);let r=search(c);for(const k of ['contract_until_max','min_rating','trait','foot','leagues','min_age','max_age','min_value_m','max_value_m']){if(r.length)break;if(c[k]!==undefined){delete c[k];r=search(c);}}return r;};
const RULES=`You are the AI Agent inside Agents Desk, software for football agents. You help agents scout players and think through deals during the transfer window.
- Use the tools to look up players in the desk's database. Never invent players, clubs or numbers that the tools did not return. The database holds sample data.
- Keep answers short and practical: one or two sentences, then up to 5 bullet points naming the best fits with a short reason each (position, age, value, contract, agent status). Values are in euro millions (e.g. €1.2M).
- If the brief is vague, run a sensible search anyway and say what you assumed.
- For money questions about commission, use estimate_commission and show the figures.
- Plain language. No headings. Use **bold** only for player names.`;
const TOOLS=found=>[
 {name:'search_players',description:'Search the player database. Returns up to 12 players (id, name, age, position, club, league, rating, value_m_eur, foot, contract_until, agent, traits). Use for any scouting brief.',inputSchema:{type:'object',properties:{positions:{type:'array',items:{type:'string',enum:['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST']}},leagues:{type:'array',items:{type:'string',enum:AD.leagues}},min_age:{type:'number'},max_age:{type:'number'},min_value_m:{type:'number'},max_value_m:{type:'number'},foot:{type:'string',enum:['Left','Right']},min_rating:{type:'number'},eu_passport:{type:'boolean'},agent_status:{type:'string',enum:['No agent','Relatives','Agency']},contract_until_max:{type:'number'},trait:{type:'string',description:'one style keyword, e.g. dribbling, aerial, finishing'},limit:{type:'number'}}},
  execute:i=>{const r=search(i||{});r.forEach(p=>found.add(p.id));return r.map(pub);}},
 {name:'estimate_commission',description:'Estimate agent commission. Returns fee_commission_eur, wage_commission_eur and total_eur.',inputSchema:{type:'object',properties:{fee_eur:{type:'number'},fee_rate_pct:{type:'number'},gross_salary_per_year_eur:{type:'number'},wage_rate_pct:{type:'number'},contract_years:{type:'number'}}},execute:i=>commission(i||{})}];
const md=t=>{const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');const lines=esc(t).split('\n');let h='',ul=false;lines.forEach(l=>{const b=l.match(/^\s*[-*•]\s+(.*)/);if(b){if(!ul){h+='<ul>';ul=true;}h+='<li>'+b[1]+'</li>';}else{if(ul){h+='</ul>';ul=false;}if(l.trim())h+='<p>'+l+'</p>';}});if(ul)h+='</ul>';return h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');};
const cards=ids=>{const ps=ids.map(id=>P.find(p=>p.id===id)).filter(Boolean).slice(0,6);if(!ps.length)return'';return `<div class="pcs">${ps.map(p=>`<div class="pc" data-p="${p.id}"><div class="top">${who(p)}<span class="val" style="margin-left:auto">${money(p.value)}</span></div><div class="meta"><div><small>Club</small><b style="font-size:12px;white-space:normal">${p.club}</b></div><div><small>Rating</small><b>${p.rating.toFixed(1)}</b></div><div><small>Contract</small><b>${p.contract}</b></div></div><div class="why">${p.traits.map(t=>`<span class="hit">${t}</span>`).join('')}<span>${p.agent}</span></div>${tgtBtn(p)}</div>`).join('')}</div>`;};
const thinkHTML=ADX.srch?null:'';const think=()=>`<div class="think">${ADX.srch('Searching players')}</div>`;
let sampleFn=undefined;(async()=>{try{sampleFn=window.claude?await window.claude.use('sample'):null;}catch(e){sampleFn=null;}})();
let CHATS=ADX.LS.get('chats',[]);let CUR=null;let TURNS=[];let ctl=null;
const persist=()=>{if(!TURNS.length)return;let c=CHATS.find(x=>x.id===CUR);if(!c){CUR=Date.now();c={id:CUR,title:'',ts:0,turns:[]};CHATS.unshift(c);}c.turns=TURNS.map(t=>({role:t.role,content:t.content,ids:t.ids}));c.title=(TURNS.find(t=>t.role==='user')||{}).content||'Chat';c.ts=Date.now();CHATS=[c,...CHATS.filter(x=>x!==c)].slice(0,30);ADX.LS.set('chats',CHATS);};
ADV.ai=el=>{
 const h=new Date().getHours();
 el.innerHTML=`<div class="ai-grid"></div><canvas class="ai-orb" id="aiOrb" aria-hidden="true"></canvas><div class="ai-glow"></div>
 <aside class="ai-hist" id="aiHist" aria-label="Previous conversations"><div class="ah-h"><b>Chats</b><button class="ah-x" id="aiHx" aria-label="Close history">×</button></div><button class="ah-new" id="aiNew2"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>New chat</button><div class="ah-l" id="aiHL"></div><p class="ah-f">Saved in this browser</p></aside>
 <div class="ai-top"><div class="row" style="gap:8px"><button class="btn b-gh b-sm" id="aiHB" aria-expanded="false"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>History</button><span class="badge"><span class="ldot" style="color:#4ADE80"></span>AI Agent · Beta</span></div><button class="btn b-gh b-sm" id="aiNew">New chat</button></div>
 <div class="ai-body" id="aiBody"><div class="ai-hello"><span class="mk">${mark(64)}</span><h1>${h<12?'Good morning':h<18?'Good afternoon':'Good evening'}, <span>agent</span></h1><p>Describe the player, the club's brief or the deal. I'll search the desk and come back with a shortlist.</p></div>
 <div class="ai-chat" id="aiChat"></div>
 <div class="ai-dock"><div class="poda" id="poda"><div class="glow"></div><div class="darkBorderBg"></div><div class="white"></div><div class="border"></div>
  <div class="pmain"><span class="pink"></span><textarea id="aiIn" rows="1" placeholder="Ask the desk… e.g. left winger under 25, €1–1.2M" aria-label="Message the AI Agent"></textarea>
  <button class="send" id="aiSend" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span class="sq"></span></button></div></div>
  <div class="ai-sugg" id="aiSug">${[['Right-footed winger who plays on the left, under 25, budget €1–1.2M','winger'],['Unrepresented centre-backs in the Eredivisie','noagent'],['Strikers with contracts ending 2026','contract'],["What's my commission on a €3M fee at 5% plus 10% of a €1.2M salary over 4 years?",'calc']].map(s=>`<button data-q="${s[0]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/></svg>${s[0].length>46?s[0].slice(0,44)+'…':s[0]}</button>`).join('')}</div>
  <p class="ai-foot">Answers use the desk's sample player data. Check important figures before you act on them.</p></div></div>`;
 const body=$('#aiBody'),chat=$('#aiChat'),inp=$('#aiIn'),send=$('#aiSend'),poda=$('#poda');
 const fit=()=>{inp.style.height='auto';inp.style.height=Math.min(200,inp.scrollHeight)+'px';};inp.oninput=fit;
 const scroll=()=>{const mn=$('#mn');mn.scrollTo({top:mn.scrollHeight,behavior:'smooth'});};
 const add=(role,html)=>{const d=document.createElement('div');d.className='msg '+(role==='u'?'u':'a');d.innerHTML=role==='u'?`<div class="bub"></div>`:`<span class="ava">${mark(22)}</span><div class="bub">${html||''}</div>`;if(role==='u')d.querySelector('.bub').textContent=html;chat.appendChild(d);body.classList.add('chatting');scroll();return d.querySelector('.bub');};
 const hist=()=>{const L=$('#aiHL');if(!L)return;const ago=t=>{const d=new Date(t),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});};L.innerHTML=CHATS.length?CHATS.map(c=>`<div class="ah-i${c.id===CUR?' on':''}" data-c="${c.id}"><button class="ah-o" data-c="${c.id}"><b></b><small>${ago(c.ts)} · ${Math.ceil(c.turns.length/2)} ${c.turns.length>2?'questions':'question'}</small></button><button class="ah-d" data-d="${c.id}" aria-label="Delete chat">×</button></div>`).join(''):'<p class="ah-e">Your conversations appear here.</p>';CHATS.forEach(c=>{const b=L.querySelector(`[data-c="${c.id}"] b`);if(b)b.textContent=c.title;});};
 TURNS.forEach(t=>{if(t.role==='user')add('u',t.content);else add('a',md(t.content)+(t.ids?cards(t.ids):''));});
 const load=id=>{if(ctl)ctl.abort();const c=CHATS.find(x=>x.id===id);CUR=c?c.id:null;TURNS=c?c.turns.map(t=>({...t})):[];chat.innerHTML='';body.classList.toggle('chatting',TURNS.length>0);TURNS.forEach(t=>{if(t.role==='user')add('u',t.content);else add('a',md(t.content)+(t.ids?cards(t.ids):''));});hist();if(innerWidth<1280)el.classList.remove('hist-on');};
 const busy=on=>{poda.classList.toggle('busy',on);send.classList.toggle('stop',on);send.setAttribute('aria-label',on?'Stop':'Send');};
 async function ask(q){q=q.trim();if(!q)return;if(ctl){return;}inp.value='';fit();add('u',q);TURNS.push({role:'user',content:q});persist();hist();const bub=add('a',think());busy(true);
  const found=new Set();
  const offline=()=>{const c=parse(q);let txt,ids=[];if(/commission/i.test(q)){const n=q.match(/€?\s*([\d.]+)\s*m/gi)||[];const nums=n.map(x=>parseFloat(x.replace(/[^\d.]/g,''))*1e6);const pc=(q.match(/(\d+(?:\.\d+)?)\s*%/g)||[]).map(x=>parseFloat(x));const yrs=+(q.match(/(\d+)\s*years?/)||[])[1]||1;const r=commission({fee_eur:nums[0]||0,fee_rate_pct:pc[0]||0,gross_salary_per_year_eur:nums[1]||0,wage_rate_pct:pc[1]||0,contract_years:yrs});txt=`Here is the estimate:\n- Fee commission: **€${r.fee_commission_eur.toLocaleString('en-US')}**\n- Wage commission: **€${r.wage_commission_eur.toLocaleString('en-US')}**\n- Total: **€${r.total_eur.toLocaleString('en-US')}**\nOpen the deal calculator to add add-ons, tax and instalments.`;}
    else{let r=search(c),dropped=[];const ORDER=[['contract_until_max','contract date'],['min_rating','rating'],['trait','style'],['foot','foot'],['leagues','league'],['min_age','age'],['max_age','age'],['min_value_m','budget'],['max_value_m','budget'],['agent_status','agent status']];for(const [k,lab] of ORDER){if(r.length)break;if(c[k]!==undefined){delete c[k];dropped.push(lab);r=search(c);}}ids=r.map(p=>p.id);const pre=dropped.length&&r.length?`No exact match, so I relaxed the ${[...new Set(dropped)].join(' and ')}. `:'';txt=r.length?pre+`I found ${r.length} ${r.length===1?'player that fits':'players that fit'} your brief. Top picks:\n`+r.slice(0,4).map(p=>`- **${p.name}**, ${p.age}, ${p.posName} at ${p.club} (${p.league}), ${money(p.value)}, contract to ${p.contract}, ${p.agent.toLowerCase()}.`).join('\n'):'Nothing in the database matches all of that. Try loosening the age, budget or league.';}
    return{txt,ids};};
  try{
   if(sampleFn===undefined){await new Promise(r=>setTimeout(r,600));}
   if(!sampleFn){const o=offline();await new Promise(r=>setTimeout(r,ADX.reduceM?0:900));bub.innerHTML=md(o.txt)+cards(o.ids)+`<p class="note" style="color:rgba(243,242,240,.4);margin-top:8px">Demo answer from the desk's search over sample data.</p>`;TURNS.push({role:'assistant',content:o.txt,ids:o.ids});persist();hist();}
   else{ctl=new AbortController();const hh=TURNS.slice(-10).map(t=>({role:t.role,content:t.content}));
    const {text}=await sampleFn([{role:'user',content:RULES},...hh],{signal:ctl.signal,tools:TOOLS(found),modelTier:'quick',onText:({text})=>{bub.innerHTML=md(text);scroll();}});
    const ids=[...found];bub.innerHTML=md(text)+cards(ids);TURNS.push({role:'assistant',content:text,ids});persist();hist();}
  }catch(e){const code=e&&e.code;
   if(code==='cancelled'){bub.innerHTML=(e.text?md(e.text):'')+'<p class="note" style="color:rgba(243,242,240,.4)">Stopped.</p>';}
   else if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed','tools_unavailable'].includes(code)){sampleFn=null;const o=offline();bub.innerHTML=md(o.txt)+cards(o.ids);TURNS.push({role:'assistant',content:o.txt,ids:o.ids});persist();hist();}
   else{bub.innerHTML=(e&&e.text?md(e.text):'')+`<p class="ai-err">${code==='rate_limited'?'Too many questions at once. Wait a moment and send again.':code==='session_expired'?'Your session expired. Sign in again to keep chatting.':'Something went wrong while answering. Send your message again.'}</p>`;}
  }finally{ctl=null;busy(false);scroll();}}
 send.onclick=()=>{if(ctl){ctl.abort();return;}ask(inp.value);};
 inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(!ctl)ask(inp.value);}});
 $('#aiSug').onclick=e=>{const b=e.target.closest('[data-q]');if(b)ask(b.dataset.q);};
 const newChat=()=>{if(ctl)ctl.abort();CUR=null;TURNS=[];chat.innerHTML='';body.classList.remove('chatting');hist();inp.focus();};$('#aiNew').onclick=newChat;$('#aiNew2').onclick=newChat;
 const hb=$('#aiHB');const tog=on=>{el.classList.toggle('hist-on',on);hb.setAttribute('aria-expanded',on);};hb.onclick=()=>tog(!el.classList.contains('hist-on'));$('#aiHx').onclick=()=>tog(false);
 if(innerWidth>=1280&&CHATS.length)tog(true);
 $('#aiHL').onclick=e=>{const d=e.target.closest('[data-d]');if(d){const id=+d.dataset.d;CHATS=CHATS.filter(c=>c.id!==id);ADX.LS.set('chats',CHATS);if(CUR===id)newChat();else hist();ADX.toast('Chat deleted');return;}const o=e.target.closest('.ah-o');if(o)load(+o.dataset.c);};
 hist();ADX.aiOrb&&ADX.aiOrb($('#aiOrb'));
 chat.addEventListener('click',e=>{if(e.target.closest('[data-tgt]'))return;const c=e.target.closest('[data-p]');if(c)profile(P.find(p=>p.id===+c.dataset.p));});
 if(S.aiPrefill){const q=S.aiPrefill,auto=S.aiAuto;S.aiPrefill=null;if(auto)setTimeout(()=>ask(q),300);else{inp.value=q;fit();inp.focus();}}
};
})();




/* ===== v16: dashboard upgrades ===== */
(function(){
const {$,$$,S,save,toast,modal,profile,who,svg,money,hue,LS,reduceM}=ADX;const P=AD.players;const V=ADV;const app=$('#app');
const PLUS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const CHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const rr=(i,k)=>{const x=Math.sin(i*127.1+k*311.7)*43758.5453;return x-Math.floor(x);};
const countUp=(el,to,fmt,dur=1500)=>{if(reduceM){el.textContent=fmt(to);return;}const t0=performance.now();const st=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=fmt(to*e);if(p<1&&el.isConnected)requestAnimationFrame(st);};el.textContent=fmt(0);requestAnimationFrame(st);};
const E=n=>'€'+Math.round(n).toLocaleString('en-US');
const mEur=v=>v>=1?'€'+(v>=10?Math.round(v):(+v.toFixed(1)))+'M':'€'+Math.round(v*1000)+'k';

/* ---------- in-view loader ---------- */
const vl=document.createElement('div');vl.className='vload';vl.setAttribute('aria-hidden','true');vl.innerHTML='<i></i>';$('#mn').prepend(vl);
let vt;ADX.vLoad=(ms=420)=>new Promise(r=>{vl.classList.remove('done');vl.classList.add('on');clearTimeout(vt);vt=setTimeout(()=>{vl.classList.add('done');r();setTimeout(()=>vl.classList.remove('on','done'),350);},reduceM?0:ms);});
ADX.miniLd='<span class="ad-spin sm" aria-hidden="true"></span>';

/* ---------- search loader (letters + rotating ball) ---------- */
ADX.srch=(t='Searching',dk)=>`<span class="srch-ld${dk?' dk':''}" role="status"><span class="sl-ball" aria-hidden="true"></span><span class="sl-w" aria-label="${t}">${[...t].map((c,i)=>`<span style="animation-delay:${(i*.1).toFixed(1)}s">${c===' '?'&nbsp;':c}</span>`).join('')}</span></span>`;
const sp=document.createElement('div');sp.className='srch-pill';sp.setAttribute('aria-hidden','true');sp.innerHTML='<div></div>';app.appendChild(sp);
let spT;const SQ={naQ:'Searching players',fN:'Searching players',fdQ:'Searching deals',lgQ:'Searching the log',gsearch:'Searching the desk'};
ADX.searching=(label,ms=650)=>{sp.firstChild.innerHTML=ADX.srch(label);sp.classList.add('on');clearTimeout(spT);spT=setTimeout(()=>sp.classList.remove('on'),reduceM?200:ms);};
document.addEventListener('input',e=>{const id=e.target.id;if(SQ[id]&&e.target.closest('#app')&&e.target.value.trim())ADX.searching(SQ[id]);},true);
document.addEventListener('change',e=>{if(e.target.closest('#app .vw.noagents,#app .vw.filter')&&e.target.tagName==='SELECT')ADX.searching('Filtering players',500);},true);
document.addEventListener('keydown',e=>{if(e.target.id==='gsearch'&&e.key==='Enter'&&e.target.value.trim())ADX.searching('Searching players',800);},true);
/* ---------- sidebar: gliding indicator ---------- */
const sb=$('#sb');const ind=document.createElement('span');ind.className='sb-ind';ind.setAttribute('aria-hidden','true');sb.prepend(ind);
let lastA=null;
const place=(a,hov)=>{if(!a||!a.offsetHeight){ind.classList.remove('ready');return;}ind.style.transform=`translateY(${a.offsetTop}px)`;ind.style.height=a.offsetHeight+'px';ind.classList.add('ready');ind.classList.toggle('hov',!!hov);};
const act=()=>$('#sb .nv.on');
sb.addEventListener('pointerover',e=>{const a=e.target.closest('.nv');if(a)place(a,!a.classList.contains('on'));});
sb.addEventListener('pointerleave',()=>place(act()));
new MutationObserver(()=>{const a=act();if(a!==lastA){lastA=a;requestAnimationFrame(()=>place(a));if(a){a.classList.remove('pop');void a.offsetWidth;a.classList.add('pop');}}}).observe(sb,{subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(()=>requestAnimationFrame(()=>place(act()))).observe(app,{attributes:true,attributeFilter:['class']});
addEventListener('resize',()=>place(act()));

/* ---------- top bar: live clock, window countdown, market ticker ---------- */
const tb=$('#app .tb');const lv=document.createElement('a');lv.className='tb-live';lv.href='#app-deals';lv.style.textDecoration='none';lv.setAttribute('aria-label','Live market status');
lv.innerHTML=`<span class="lv"><i></i><span>LIVE</span></span><b id="tbClk">--:--:--</b><span class="sep s1"></span><span class="win">Winter window opens in <em id="tbWin">—</em></span><span class="sep s2"></span><span class="tk" id="tbTk"><span></span></span>`;
tb.insertBefore(lv,$('#backSite'));
const WIN=Date.UTC(2026,11,31,23,0,0);const pad=n=>String(n).padStart(2,'0');
const clubs=Object.values(AD.clubs).flat();const STS=['Talks open','Bid submitted','Medical booked','Terms agreed','Done deal'];
let tkI=0,tkT=Date.now();const tkItem=()=>{const p=P[(tkI*17+5)%P.length],to=clubs[(tkI*7+3)%clubs.length];return{p,to,st:STS[tkI%STS.length]};};let cur=tkItem();
const tick=()=>{const now=new Date();$('#tbClk').textContent=now.toLocaleTimeString('en-GB',{timeZone:'Europe/Berlin',hour12:false})+' Berlin';
  const d=WIN-now.getTime();$('#tbWin').textContent=d>0?`${Math.floor(d/864e5)}d ${pad(Math.floor(d/36e5)%24)}:${pad(Math.floor(d/6e4)%60)}:${pad(Math.floor(d/1e3)%60)}`:'now open';
  const s=Math.round((Date.now()-tkT)/1000);const sp=$('#tbTk span:last-child');if(sp)sp.innerHTML=`Sample · ${cur.p.name} · <em>${cur.st}</em> · ${cur.p.club} → ${cur.to} · ${s<5?'just now':s+'s ago'}`;};
const roll=()=>{const box=$('#tbTk');if(!box)return;tkI++;cur=tkItem();tkT=Date.now();const old=box.querySelector('span');const n=document.createElement('span');n.className='in';box.appendChild(n);tick();requestAnimationFrame(()=>{n.classList.remove('in');old.classList.add('out');});setTimeout(()=>old.remove(),700);};
tick();setInterval(tick,1000);setInterval(roll,7000);

$('#app .tb-s').addEventListener('click',()=>{if(innerWidth<=560)ADX.go('filter');});
/* ---------- expanding "add to targets" button ---------- */
const tBtn=p=>{const on=S.targets.has(p.id);return `<button class="Btn${on?' on':''}" data-t2="${p.id}" aria-label="${on?'Remove '+p.name+' from':'Add '+p.name+' to'} targets"><span class="sign">${on?CHK:PLUS}</span><span class="text">${on?'Added':'Add target'}</span></button>`;};
ADX.tBtn=tBtn;
document.addEventListener('click',e=>{const b=e.target.closest('#app [data-t2]');if(!b)return;e.stopPropagation();const id=+b.dataset.t2;const on=!S.targets.has(id);on?S.targets.add(id):S.targets.delete(id);save('targets');
  $$(`#app [data-t2="${id}"]`).forEach(x=>{x.classList.toggle('on',on);x.querySelector('.sign').innerHTML=on?CHK:PLUS;x.querySelector('.text').textContent=on?'Added':'Add target';});toast(on?'Added to Targets':'Removed from Targets');});

/* ---------- AI background orb (same shader as the landing hero, blurred) ---------- */
ADX.aiOrb=cv=>{if(!cv||!window.mountOrb)return;window.mountOrb(cv,{interactive:true,maxDpr:1,maxPx:320,speed:.9});};

/* ---------- Agency ---------- */
let agSeen=false;
V.agency=el=>{
  const opp=Object.values(AD.clubs).flat();
  const SQ=P.slice(0,12).map((p,i)=>{const status=i===4||i===9?'Injured':i===2||i===6||i===10?'Rumour':'Fit';const min=status==='Injured'?0:(i===7?24:45+Math.floor(rr(p.id,2)*46));const att=['ST','LW','RW','CAM'].includes(p.pos);
    return{...p,contract:i===11?null:(i%3===0?2026:p.contract),status,res:['W','D','L','W','L'][Math.floor(rr(p.id,1)*5)],opp:opp[(p.id*5)%opp.length],min,g:min&&att?Math.floor(rr(p.id,3)*2.2):0,a:min?Math.floor(rr(p.id,4)*1.5):0,rt:min?+(6+rr(p.id,5)*2.3).toFixed(1):null,form:Array.from({length:5},(_,k)=>+(5.9+rr(p.id,k+7)*2.5).toFixed(1))};});
  const val=SQ.reduce((a,p)=>a+p.value,0),played=SQ.filter(p=>p.min),avgR=played.reduce((a,p)=>a+p.rt,0)/played.length;
  const ic={all:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7"/>',inj:'<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h0"/>',rum:'<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',noc:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6M16 13l5 5M21 13l-5 5"/>',exp:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',val:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'};
  const M=[['all','Total players',SQ.length,'#2563EB','rgba(37,99,235,.1)','under management',n=>Math.round(n)],['inj','Injured',SQ.filter(p=>p.status==='Injured').length,'#B7791F','rgba(183,121,31,.12)','out this round',n=>Math.round(n)],['rum','Active rumours',SQ.filter(p=>p.status==='Rumour').length,'#F4691F','rgba(244,105,31,.1)','linked this week',n=>Math.round(n)],['noc','Without contract',SQ.filter(p=>!p.contract).length,'#DC2626','rgba(220,38,38,.08)','free agents',n=>Math.round(n)],['exp','Expiring soon',SQ.filter(p=>p.contract&&p.contract<=2026).length,'#B45309','rgba(180,83,9,.1)','end by 2026',n=>Math.round(n)],['val','Squad value',val,'#16A34A','rgba(22,163,74,.1)',`avg rating ${avgR.toFixed(2)}`,n=>'€'+n.toFixed(1)+'M']];
  const W=SQ.filter(p=>p.min&&p.res==='W').length,D=SQ.filter(p=>p.min&&p.res==='D').length,Lq=SQ.filter(p=>p.min&&p.res==='L').length,tot=W+D+Lq;
  const top=SQ.slice().sort((a,b)=>b.value-a.value).slice(0,6),vmax=top[0].value;
  const yrs=[2026,2027,2028,2029,2030,2031].map(y=>[y,SQ.filter(p=>p.contract===y).length]),ymax=Math.max(...yrs.map(x=>x[1]),1);
  el.innerHTML=`<div class="ph"><div><span class="badge o">Agency</span><h1 style="margin-top:10px">Agency dashboard</h1><p>Portfolio metrics and the latest match round for every player you manage.</p></div><span class="note">● Sample squad</span></div>
  <div class="ag2-hero"><span class="lg">${svg('agency')}</span><div style="position:relative;min-width:0"><h2>Your agency</h2><p>Demo agency · ${SQ.length} sample players under management</p></div><span style="flex:1"></span><button class="btn b-sm" id="rmAg">Remove agency from profile</button></div>
  <div class="kp" id="kp">${M.map((m,i)=>`<button class="${m[0]==='all'?'on':''}" data-f="${m[0]}" style="--c:${m[3]};--s:${m[4]}"><span class="k1">${m[1]}<i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${ic[m[0]]}</svg></i></span><b data-i="${i}">${m[6](m[2])}</b><small>${m[5]}</small></button>`).join('')}</div>
  <div class="viz">
   <div class="card"><h4>Latest match round <small>Last 7 days</small></h4><div class="lr"><div><small>Goals</small><b data-c="${SQ.reduce((a,p)=>a+p.g,0)}">0</b></div><div><small>Assists</small><b data-c="${SQ.reduce((a,p)=>a+p.a,0)}">0</b></div><div><small>Minutes</small><b data-c="${SQ.reduce((a,p)=>a+p.min,0)}">0</b></div><div><small>Avg rating</small><b data-c="${avgR.toFixed(2)}" data-d="2">0</b></div></div>
    <div class="wdl">${[[W,'#16A34A'],[D,'#8C8883'],[Lq,'#DC2626']].map(x=>`<i style="width:${x[0]/tot*100}%;background:${x[1]}"></i>`).join('')}</div><div class="wdl-l"><span style="--c:#16A34A">${W} wins</span><span style="--c:#8C8883">${D} draws</span><span style="--c:#DC2626">${Lq} losses</span></div></div>
   <div class="card"><h4>Squad value <small>Top 6</small></h4><div class="hb">${top.map((p,i)=>`<div><span>${p.name}</span><i style="width:${p.value/vmax*100}%;animation-delay:${i*.06}s"></i><b>${money(p.value)}</b></div>`).join('')}</div></div>
   <div class="card"><h4>Contracts ending <small>By year</small></h4><div class="cy">${yrs.map((y,i)=>`<div><b>${y[1]}</b><i style="height:${Math.max(4,y[1]/ymax*58)}px;background:${y[0]<=2026?'#DC2626':y[0]===2027?'#F4691F':'#15151C'};animation-delay:${i*.06}s"></i><em>${String(y[0]).slice(2)}</em></div>`).join('')}</div></div>
  </div>
  <div class="card rost" style="padding:4px"><div class="rost-h"><h3 id="rT">Total players · latest match</h3><button class="btn b-gh b-sm" id="ratings">Player ratings</button></div>
   <div class="tw"><table class="tbl"><thead><tr><th>Player</th><th>Status</th><th>Last match</th><th>Rating</th><th class="hm2">Min</th><th class="hm2">G / A</th><th class="hm2">Form</th><th>Value</th><th class="hm2">Contract</th></tr></thead><tbody id="roster"></tbody></table></div></div>`;
  // numbers: motion only on the first visit
  $$('#kp b').forEach(b=>{const m=M[+b.dataset.i];if(!agSeen)countUp(b,m[2],m[6],1600);});
  $$('.lr b').forEach(b=>{const to=+b.dataset.c,dg=+(b.dataset.d||0);const f=n=>dg?n.toFixed(dg):Math.round(n).toLocaleString('en-US');if(!agSeen)countUp(b,to,f,1600);else b.textContent=f(to);});
  if(agSeen)$$('#app .vw.agency .wdl i,#app .vw.agency .hb i,#app .vw.agency .cy i').forEach(i=>i.style.animation='none');
  agSeen=true;
  const stc={Fit:'#16A34A',Injured:'#B7791F',Rumour:'#F4691F'},rc={W:'#16A34A',D:'#8C8883',L:'#DC2626'};const rtc=v=>v>=7.5?'#16A34A':v>=6.8?'#F4691F':'#8C8883';
  let f='all';
  const draw=()=>{const r=SQ.filter(p=>f==='all'||f==='val'||(f==='inj'&&p.status==='Injured')||(f==='rum'&&p.status==='Rumour')||(f==='noc'&&!p.contract)||(f==='exp'&&p.contract&&p.contract<=2026)).sort((a,b)=>f==='val'?b.value-a.value:0);
    $('#rT').textContent=M.find(m=>m[0]===f)[1]+' · latest match';
    $('#roster').innerHTML=r.map(p=>`<tr data-p="${p.id}" style="cursor:pointer"><td>${who(p)}</td><td><span class="st"><i style="background:${stc[p.status]}"></i>${p.status}</span></td><td>${p.min?`<span class="res" style="background:${rc[p.res]}">${p.res}</span><span class="mm">vs ${p.opp}</span>`:'<span class="mm">Did not play</span>'}</td><td>${p.rt?`<span class="rt" style="background:${rtc(p.rt)}">${p.rt.toFixed(1)}</span>`:'<span class="mm">—</span>'}</td><td class="hm2"><span class="ga">${p.min}'</span></td><td class="hm2"><span class="ga"><b>${p.g}</b> / <b>${p.a}</b></span></td><td class="hm2"><span class="spk" title="Last 5 ratings">${p.form.map((v,k)=>`<i style="height:${Math.max(3,(v-5.5)/3.2*20)}px;animation-delay:${k*.05}s"></i>`).join('')}</span></td><td class="val">${money(p.value)}</td><td class="hm2">${p.contract||'<span class="badge r">None</span>'}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No players in this group.</td></tr>';};
  $('#kp').onclick=e=>{const b=e.target.closest('button');if(!b)return;f=b.dataset.f;$$('#kp button').forEach(x=>x.classList.toggle('on',x===b));draw();};
  $('#roster').onclick=e=>{const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));};
  $('#ratings').onclick=()=>modal(`<h3 style="margin-bottom:12px">Player ratings · latest round</h3><div class="kv">${SQ.filter(p=>p.rt).sort((a,b)=>b.rt-a.rt).map(p=>`<div><span>${p.name}</span><b>${p.rt.toFixed(1)}</b></div>`).join('')}</div>`);
  $('#rmAg').onclick=()=>toast('Agency link removal needs confirmation in the live product');
  draw();};

/* ---------- No Agents ---------- */
const LMIN=.05,LMAX=200;const s2v=s=>s<=0?0:s>=100?Infinity:+(LMIN*Math.pow(LMAX/LMIN,s/100)).toPrecision(2);const v2s=v=>v<=0?0:!isFinite(v)?100:Math.max(0,Math.min(100,Math.log(v/LMIN)/Math.log(LMAX/LMIN)*100));
const pM=t=>{t=String(t).trim().toLowerCase().replace(/[€\s]/g,'').replace(',','.');if(!t)return null;const m=t.match(/^([\d.]+)(k|m|mio)?$/);if(!m)return null;let v=+m[1];if(m[2]==='k')v/=1000;else if(!m[2]&&v>=1000)v/=1e6;return v;};
const PRESET=[['Any',0,Infinity],['Under €500k',0,.5],['€500k–1M',.5,1],['€1–5M',1,5],['€5–10M',5,10],['€10–25M',10,25],['€25M+',25,Infinity]];
V.noagents=el=>{
  const L=P.filter(p=>p.agent!=='Agency');let lo=0,hi=Infinity,sk='value',dir=-1,n=15;
  el.innerHTML=`<div class="ph"><div><span class="badge o">Players</span><h1 style="margin-top:10px">No Agents</h1><p>Players without a registered agent or represented by relatives. Filter by name, position, league, agent status and market value.</p></div><span class="badge n" style="height:32px;padding:0 12px">Demo · sample data</span></div>
  <div class="card"><div class="na-f"><div class="field"><label for="naQ">Search by name</label><input class="inp" id="naQ" placeholder="Search players…"></div><div class="field"><label for="naP">Position</label><select class="sel" id="naP"><option value="">All positions</option>${AD.positions.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select></div><div class="field"><label for="naL">League</label><select class="sel" id="naL"><option value="">All leagues</option>${AD.leagues.map(l=>`<option>${l}</option>`).join('')}</select></div><div class="field"><label for="naA">Agent status</label><select class="sel" id="naA"><option value="">All</option><option>No agent</option><option value="Relatives">Relative</option></select></div></div>
   <div class="mv-box"><div class="mv-h"><span class="lbl">Market value</span><b id="naVL">Any value</b></div>
    <div class="mv-p" id="naPre">${PRESET.map((x,i)=>`<button data-i="${i}"${i===0?' class="on"':''}>${x[0]}<em></em></button>`).join('')}</div>
    <div class="hist-v" id="naH"></div>
    <div class="dual" style="margin:0 0 0"><span class="tr"></span><span class="fl" id="naVF"></span><input type="range" id="naV1" min="0" max="100" step="0.5" value="0" aria-label="Minimum market value"><input type="range" id="naV2" min="0" max="100" step="0.5" value="100" aria-label="Maximum market value"></div>
    <div class="mv-sc"><span>€0</span><span>€100k</span><span>€1M</span><span>€10M</span><span>€200M+</span></div>
    <div class="mv-r"><div class="field"><label for="naMin">Min</label><div class="afx"><span class="pre">€</span><input class="inp" id="naMin" placeholder="e.g. 250k" inputmode="decimal"></div></div><span class="to">to</span><div class="field"><label for="naMax">Max</label><div class="afx"><span class="pre">€</span><input class="inp" id="naMax" placeholder="e.g. 2.5M" inputmode="decimal"></div></div></div>
   </div></div>
  <div class="row" id="naS" style="margin:14px 0"></div>
  <div class="card" style="padding:4px"><div class="tw cardify"><table class="tbl natbl" id="naT"><thead><tr><th data-k="name" aria-sort="none">Player</th><th data-k="pos" aria-sort="none">Position</th><th data-k="agent" aria-sort="none">Agent status</th><th data-k="value" aria-sort="descending">Market value</th><th data-k="contract" aria-sort="none" class="hm">Contract</th><th aria-label="Add to targets"></th></tr></thead><tbody></tbody></table></div><div class="mcards" id="naM"></div><div class="row" style="justify-content:space-between;padding:12px"><span class="note" id="naC"></span><button class="btn b-gh b-sm" id="naMore">Show more</button></div></div>`;
  const ast=a=>a==='No agent'?'<span class="ast na"><i></i>No agent</span>':'<span class="ast rl"><i></i>Relative</span>';
  const bins=24;const H=Array(bins).fill(0);L.forEach(p=>{const b=Math.min(bins-1,Math.floor(v2s(p.value)/100*bins));H[b]++;});const hm=Math.max(...H);
  $('#naH').innerHTML=H.map(c=>`<i style="height:${c?Math.max(10,c/hm*100):4}%"></i>`).join('');
  const lab=()=>lo<=0&&!isFinite(hi)?'Any value':lo<=0?'Up to '+mEur(hi):!isFinite(hi)?mEur(lo)+' and above':mEur(lo)+' – '+mEur(hi);
  const sync=src=>{const s1=v2s(lo),s2=v2s(hi);if(src!=='range'){$('#naV1').value=s1;$('#naV2').value=s2;}$('#naVF').style.left=s1+'%';$('#naVF').style.width=(s2-s1)+'%';if(src!=='input'){$('#naMin').value=lo>0?mEur(lo).slice(1):'';$('#naMax').value=isFinite(hi)?mEur(hi).slice(1):'';}$('#naVL').textContent=lab();
    $$('#naH i').forEach((x,i)=>{const a=i/bins*100,b=(i+1)/bins*100;x.classList.toggle('in',b>s1&&a<s2);});$$('#naPre button').forEach((b,i)=>b.classList.toggle('on',PRESET[i][1]===lo&&PRESET[i][2]===hi));};
  function draw(){const q=$('#naQ').value.toLowerCase();const base=L.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!$('#naP').value||p.pos===$('#naP').value)&&(!$('#naL').value||p.league===$('#naL').value)&&(!$('#naA').value||p.agent===$('#naA').value));
    $$('#naPre button em').forEach((e,i)=>e.textContent=base.filter(p=>p.value>=PRESET[i][1]&&p.value<PRESET[i][2]).length);
    const r=base.filter(p=>p.value>=lo&&p.value<=hi).sort((a,b)=>{const x=a[sk],y=b[sk];return (typeof x==='string'?x.localeCompare(y):x-y)*dir;});const vis=r.slice(0,n);
    $('#naT tbody').innerHTML=vis.map((p,i)=>`<tr data-p="${p.id}" style="cursor:pointer;animation-delay:${Math.min(i,10)*.025}s"><td><span class="who"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.nat} · ${p.age} · ${p.club}</span></span></span></td><td><span class="pz">${p.posName}</span></td><td>${ast(p.agent)}</td><td><span class="mvv">${money(p.value)}</span></td><td class="hm">${p.contract}</td><td>${tBtn(p)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No players match these filters. Try a wider value range.</td></tr>';
    $('#naM').innerHTML=vis.map(p=>`<div class="mc" data-p="${p.id}"><div class="r1"><span class="who"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.club}</span></span></span></div><div class="r2"><span class="pz" style="display:inline-block;padding:3px 8px;border-radius:7px;background:rgba(21,21,28,.05);font-size:12px">${p.posName}</span>${ast(p.agent).replace('class="ast','style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px" class="ast')}<b class="val">${money(p.value)}</b><span>${p.contract}</span></div>${tBtn(p)}</div>`).join('')||'<div class="empty">No players match.</div>';
    $('#naC').textContent=`● Sample data · showing ${vis.length} of ${r.length}`;$('#naMore').style.display=r.length>n?'':'none';
    $('#naS').innerHTML=[[r.length,'players match'],[r.filter(p=>p.agent==='No agent').length,'with no agent at all'],[r.filter(p=>p.contract<=2027).length,'contracts end by 2027'],[r.filter(p=>p.age<23).length,'under 23']].map(x=>`<div class="stat-pill"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');}
  $('#naPre').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=PRESET[+b.dataset.i];lo=x[1];hi=x[2];sync();n=15;draw();};
  el.addEventListener('input',e=>{const id=e.target.id;
    if(id==='naV1'||id==='naV2'){let a=+$('#naV1').value,b=+$('#naV2').value;if(a>b-2){if(id==='naV1'){a=b-2;$('#naV1').value=a;}else{b=a+2;$('#naV2').value=b;}}lo=s2v(a);hi=s2v(b);sync('range');}
    else if(id==='naMin'||id==='naMax'){const a=pM($('#naMin').value),b=pM($('#naMax').value);lo=a==null?0:a;hi=b==null?Infinity:b;if(hi<lo)hi=lo;sync('input');}
    n=15;draw();});
  el.addEventListener('focusout',e=>{if(e.target.id==='naMin'||e.target.id==='naMax')sync();});
  el.addEventListener('change',e=>{if(e.target.tagName==='SELECT'){n=15;draw();}});
  $$('#naT th[data-k]').forEach(th=>th.onclick=()=>{const k=th.dataset.k;dir=sk===k?-dir:(k==='value'?-1:1);sk=k;$$('#naT th[data-k]').forEach(t=>t.setAttribute('aria-sort',t===th?(dir>0?'ascending':'descending'):'none'));draw();});
  $('#naMore').onclick=()=>{n+=15;draw();};
  el.addEventListener('click',e=>{if(e.target.closest('[data-t2],th,button'))return;const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));});
  sync();draw();};

/* ---------- Transfer requests ---------- */
const stamp=()=>new Date().toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const EX=['Right-footed left winger, high 1v1 dribbling and running volume, budget €1–1.2M','Unrepresented centre-backs in the Eredivisie under 23','Strikers with contracts ending 2026, EU passport','Defensive midfielder for Bundesliga, higher than 7 rating'];
V.requests=el=>{
  el.innerHTML=`<div class="ph"><div><span class="badge o">CRM</span><h1 style="margin-top:10px">Transfer requests</h1><p>Manage player requests. Save a club's brief, then run an AI player search against it. We'll email you when the result is ready.</p></div></div>
  <div class="rq-c"><div class="card"><div class="field"><label for="rqT">New transfer request</label><textarea class="inp" id="rqT" rows="4" maxlength="500" style="height:auto;padding:12px;resize:vertical" placeholder="Describe the player the club is asking for: position, profile, foot, age, league, budget…"></textarea></div><div class="row" style="justify-content:space-between;margin-top:10px"><span class="note" id="rqCt">0 / 500</span><div class="row"><button class="btn b-gh" id="rqAdd">Save request</button><button class="btn b-or" id="rqRun">Save &amp; run AI search</button></div></div></div>
  <div class="card"><span class="lbl">Example briefs</span><div class="rq-ex" style="margin-top:10px">${EX.map(x=>`<button data-x="${x}">${x}</button>`).join('')}</div></div></div>
  <div class="card" style="margin-top:14px;padding:4px"><div class="rost-h"><h3>Your requests <span class="badge n" id="rqN"></span></h3></div><div class="tw"><table class="tbl rqtbl"><thead><tr><th>Request</th><th>Created</th><th>Status</th><th></th></tr></thead><tbody id="rqL"></tbody></table></div></div>`;
  const draw=()=>{if(!$('#rqL'))return;$('#rqN').textContent=S.requests.length;$('#rqL').innerHTML=S.requests.map(r=>{const res=r.st==='ready'?ADX.aiFind(r.t):[];return `<tr><td class="br">${r.t.replace(/</g,'&lt;')}</td><td><span class="note">${r.d}</span></td><td>${r.st==='ready'?`<span class="badge g">● Result ready · ${res.length} ${res.length===1?'match':'matches'}</span><div class="rq-steps"><i class="on"></i><i class="on"></i><i class="on"></i></div>`:`<span class="rq-st">${ADX.srch('Searching players',true)}</span><div class="rq-steps"><i class="on"></i><i class="go"></i><i></i></div>`}</td><td><div class="acts"><button class="btn b-or b-sm" data-show="${r.id}" ${r.st!=='ready'?'disabled style="opacity:.5"':''}>Show result</button><button class="btn b-gh b-sm" data-ai="${r.id}">Open in AI Agent</button><button class="btn b-gh b-sm" data-del="${r.id}" style="color:var(--bad)" aria-label="Delete request">Delete</button></div></td></tr>`;}).join('')||'<tr><td colspan="4" class="empty">No requests yet. Write a brief above.</td></tr>';};
  $('#rqT').oninput=e=>$('#rqCt').textContent=e.target.value.length+' / 500';
  $$('.rq-ex button').forEach(b=>b.onclick=()=>{$('#rqT').value=b.dataset.x;$('#rqT').dispatchEvent(new Event('input'));$('#rqT').focus();});
  const add=run=>{const t=$('#rqT').value.trim();if(!t){toast('Write the brief first');$('#rqT').focus();return;}const r={id:Date.now(),t,d:stamp(),st:run?'run':'ready'};S.requests.unshift(r);save('requests');$('#rqT').value='';$('#rqCt').textContent='0 / 500';draw();
    if(run){toast('Request saved. Running the AI search…');setTimeout(()=>{r.st='ready';save('requests');draw();toast('Result ready for your request');},3200);}else toast('Request saved');};
  $('#rqAdd').onclick=()=>add(false);$('#rqRun').onclick=()=>add(true);
  $('#rqL').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const id=+(b.dataset.show||b.dataset.ai||b.dataset.del);const r=S.requests.find(x=>x.id===id);if(!r)return;
    if(b.dataset.del){S.requests=S.requests.filter(x=>x.id!==id);save('requests');draw();toast('Request deleted');return;}
    if(b.dataset.ai){S.aiPrefill=r.t;S.aiAuto=true;ADX.go('ai');return;}
    await ADX.vLoad(500);const res=ADX.aiFind(r.t).slice(0,8);
    modal(`<span class="badge g">Result ready</span><h3 style="margin:10px 0 4px">${res.length} players match this request</h3><p class="note" style="display:block;margin-bottom:14px">${r.t.replace(/</g,'&lt;')}</p><div style="display:flex;flex-direction:column;gap:8px">${res.map(p=>`<div class="li" style="align-items:center"><span class="who" style="flex:1;min-width:0"><span class="av" style="background:${hue(p)}">${p.init}</span><span class="nm"><b>${p.name}</b><span>${p.posName} · ${p.age} · ${p.club}</span></span></span><span class="val">${money(p.value)}</span>${tBtn(p)}</div>`).join('')||'<div class="empty">No players match yet.</div>'}</div><div class="row" style="margin-top:14px"><button class="btn b-dark" id="rqAi">Refine in AI Agent</button></div>`,'drawer');
    $('#rqAi').onclick=()=>{$('#modal').className='modal';S.aiPrefill=r.t;S.aiAuto=true;ADX.go('ai');};};
  draw();};

/* ---------- Transfer log ---------- */
const optList=(a,ph)=>`<option value="">${ph}</option>`+a.map(x=>`<option>${x}</option>`).join('');
V.log=el=>{
  if(!S.log.length&&!LS.get('logSeeded',false)){const pk=[P[3],P[17],P[28],P[41]];S.log=pk.map((p,i)=>({player:p.name,pos:p.pos,from:p.club,to:Object.values(AD.clubs).flat()[(i*7+4)%30],type:['Permanent','Loan','Permanent','Free transfer'][i],fee:i===1?'':i===3?'Free':mEur(Math.max(.4,p.value*.9)),date:`2026-0${7+i%2}-${String(4+i*6).padStart(2,'0')}`,sample:1}));save('log');LS.set('logSeeded',true);}
  el.innerHTML=`<div class="ph"><div><span class="badge o">CRM</span><h1 style="margin-top:10px">Transfer log</h1><p>Track transfer history for your clients: who moved, where, for how much and when.</p></div><button class="btn b-dark" id="lgNew">+ Log a transfer</button></div>
  <div class="lgs" id="lgS"></div>
  <div class="card" style="padding:4px"><div class="rost-h"><div class="row" style="flex:1;min-width:0"><div class="field" style="flex:1 1 220px;max-width:320px"><input class="inp" id="lgQ" placeholder="Search player or club…" aria-label="Search the log"></div><select class="sel" id="lgTy" style="width:auto" aria-label="Type"><option value="">All types</option><option>Permanent</option><option>Loan</option><option>Free transfer</option></select></div></div>
  <div class="tw"><table class="tbl"><thead><tr><th>Player</th><th>Move</th><th>Type</th><th>Fee</th><th>Date</th><th></th></tr></thead><tbody id="lgB"></tbody></table></div></div>`;
  const feeM=f=>{const v=pM(String(f||'').replace(/[^\dkmKM.,]/g,''));return v||0;};
  const draw=()=>{const q=$('#lgQ').value.toLowerCase(),ty=$('#lgTy').value;const r=S.log.map((l,i)=>({...l,i})).filter(l=>(!q||(l.player+l.from+l.to).toLowerCase().includes(q))&&(!ty||l.type===ty));
    $('#lgS').innerHTML=[['Transfers logged',S.log.length],['Total fees',mEur(S.log.reduce((a,l)=>a+feeM(l.fee),0))],['Permanent',S.log.filter(l=>l.type==='Permanent').length],['Loans',S.log.filter(l=>l.type==='Loan').length]].map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
    $('#lgB').innerHTML=r.map(l=>`<tr><td><b>${l.player}</b>${l.sample?' <span class="badge n" style="height:20px">Sample</span>':''}</td><td><span class="mvc">${l.from}<i>→</i>${l.to}</span></td><td><span class="badge ${l.type==='Loan'?'o':l.type==='Free transfer'?'n':'g'}">${l.type}</span></td><td class="val">${l.fee||'—'}</td><td>${l.date?new Date(l.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—'}</td><td style="text-align:right"><button class="btn b-gh b-sm" data-i="${l.i}">Remove</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No transfers logged yet. Log your first one with the button above.</td></tr>';};
  $('#lgQ').oninput=draw;$('#lgTy').onchange=draw;
  $('#lgB').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;S.log.splice(+b.dataset.i,1);save('log');draw();toast('Removed from log');};
  $('#lgNew').onclick=()=>{modal(`<h3 style="margin-bottom:14px">Log a transfer</h3><form id="lgF" class="grid g2"><div class="field"><label for="lL">League</label><select class="sel" id="lL">${optList(AD.leagues,'Choose league')}</select></div><div class="field"><label for="lF">From club</label><select class="sel" id="lF" required disabled><option value="">Choose league first</option></select></div><div class="field" style="grid-column:1/-1"><label for="lP">Player</label><select class="sel" id="lP" required disabled><option value="">Choose club first</option></select></div><div class="field"><label for="lL2">New club · league</label><select class="sel" id="lL2">${optList(AD.leagues,'Choose league')}</select></div><div class="field"><label for="lT">New club</label><select class="sel" id="lT" required disabled><option value="">Choose league first</option></select></div><div class="field"><label for="lTy">Type</label><select class="sel" id="lTy"><option>Permanent</option><option>Loan</option><option>Free transfer</option></select></div><div class="field"><label for="lFe">Fee</label><div class="afx"><span class="pre">€</span><input class="inp" id="lFe" placeholder="2.5M or 750k"></div></div><div class="field"><label for="lD">Date</label><input class="inp" type="date" id="lD" value="${new Date().toISOString().slice(0,10)}"></div><button class="btn b-or" style="grid-column:1/-1">Save to log</button></form>`);
    const q=id=>document.getElementById(id);
    q('lL').onchange=()=>{const v=q('lL').value;q('lF').innerHTML=optList(v?AD.clubs[v]:[],v?'Choose club':'Choose league first');q('lF').disabled=!v;q('lF').onchange();};
    q('lF').onchange=()=>{const c=q('lF').value,ps=P.filter(p=>p.club===c);q('lP').innerHTML=`<option value="">${c?(ps.length?'Choose player':'No tracked players'):'Choose club first'}</option>`+ps.map(p=>`<option value="${p.id}">${p.name} · ${p.pos}</option>`).join('');q('lP').disabled=!ps.length;};
    q('lL2').onchange=()=>{const v=q('lL2').value;q('lT').innerHTML=optList(v?AD.clubs[v].filter(c=>c!==q('lF').value):[],v?'Choose club':'Choose league first');q('lT').disabled=!v;};
    q('lTy').onchange=()=>{q('lFe').disabled=q('lTy').value==='Free transfer';if(q('lFe').disabled)q('lFe').value='';};
    q('lgF').onsubmit=async e=>{e.preventDefault();const p=P.find(x=>String(x.id)===q('lP').value);if(!p||!q('lT').value){toast('Choose the player and the new club');return;}const v=pM(q('lFe').value);
      S.log.unshift({player:p.name,pos:p.pos,from:q('lF').value,to:q('lT').value,type:q('lTy').value,fee:q('lTy').value==='Free transfer'?'Free':v?mEur(v):'',date:q('lD').value});save('log');$('#modal').className='modal';await ADX.vLoad(350);draw();toast('Transfer logged');};};
  draw();};

/* ---------- Teams ---------- */
let tmSel={};
V.teams=el=>{
  const LT=ADX.LT,crest=ADX.crest;let lg=tmSel.lg||AD.leagues[0];
  el.innerHTML=`<div class="ph"><div><span class="badge o">Season report</span><h1 style="margin-top:10px">Teams</h1><p>Pick a league, then a club. Squad size, average age, squad value and form for every team.</p></div><span class="note">● Sample clubs</span></div>
  <div class="lg-tabs" id="tmL" role="tablist"><span class="ind" id="tmI"></span>${AD.leagues.map(l=>`<button role="tab" data-l="${l}">${l}</button>`).join('')}</div>
  <div class="card" style="padding:4px 8px"><div class="rail" id="tmR" role="listbox" aria-label="Clubs"></div></div>
  <div class="tm-d" id="tmD" style="margin-top:12px"></div>`;
  const moveInd=()=>{const b=$(`#tmL button[data-l="${lg}"]`);if(!b)return;$$('#tmL button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b);});const ii=$('#tmI');ii.style.width=b.offsetWidth+'px';ii.style.transform=`translateX(${b.offsetLeft-4}px)`;b.scrollIntoView({block:'nearest',inline:'center',behavior:reduceM?'auto':'smooth'});};
  const fc={W:'#16A34A',D:'#8C8883',L:'#DC2626'};
  const detail=name=>{const t=LT[lg];const x=t.find(y=>y.name===name)||t[0];const rank=t.indexOf(x)+1;const avg=t.reduce((a,y)=>a+y.val,0)/t.length,mx=Math.max(...t.map(y=>y.val));tmSel={lg,team:x.name};
    $$('#tmR button').forEach(b=>{const on=b.dataset.t===x.name;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
    const own=P.filter(p=>p.club===x.name),lgP=P.filter(p=>p.league===lg).sort((a,b)=>b.value-a.value).slice(0,6);
    $('#tmD').innerHTML=`<div class="card"><div class="tm-h">${crest(x.name,60)}<div style="min-width:0"><h2>${x.name}</h2><p class="note" style="display:block">${lg} · ${rank}${['st','nd','rd'][rank-1]||'th'} in the table · ${x.pts} pts</p></div></div>
      <div class="tm-k"><div><small>Squad</small><b>${x.squad}</b></div><div><small>Avg age</small><b>${x.age}</b></div><div><small>Value</small><b class="val">€${x.val}M</b></div><div><small>Goal diff.</small><b>${x.gf-x.ga>0?'+':''}${x.gf-x.ga}</b></div></div>
      <div style="margin-top:14px"><span class="lbl">Squad value vs league average</span><div class="vbar"><i style="width:${x.val/mx*100}%"></i><em style="left:${avg/mx*100}%" title="League average"></em></div><div class="row" style="justify-content:space-between;margin-top:6px;font-size:12px;color:var(--faint)"><span>€${x.val}M</span><span>Avg €${Math.round(avg)}M</span></div></div>
      <div class="row" style="justify-content:space-between;margin-top:14px"><span class="lbl">Last 5</span><span class="fm">${x.form.map(f=>`<span style="background:${fc[f]}">${f}</span>`).join('')}</span></div></div>
      <div class="card"><div class="card-h"><h3 style="font-size:15px">${own.length?'Players from this club on the desk':'Top players in '+lg}</h3><span class="badge n">${(own.length?own:lgP).length}</span></div><div style="display:flex;flex-direction:column">${(own.length?own:lgP).map(p=>`<div class="li" data-p="${p.id}" style="cursor:pointer;align-items:center">${who(p)}<span class="row" style="gap:10px;flex-wrap:nowrap"><span class="val">${money(p.value)}</span>${tBtn(p)}</span></div>`).join('')}</div></div>`;};
  const rail=()=>{const t=LT[lg].slice().sort((a,b)=>b.val-a.val);$('#tmR').innerHTML=t.map((x,i)=>`<button role="option" data-t="${x.name}" style="animation-delay:${i*.03}s">${crest(x.name,46)}<span class="n">${x.name}</span></button>`).join('');detail(tmSel.lg===lg&&tmSel.team?tmSel.team:t[0].name);};
  $('#tmL').onclick=e=>{const b=e.target.closest('button');if(!b)return;lg=b.dataset.l;tmSel={};moveInd();rail();};
  $('#tmR').onclick=e=>{const b=e.target.closest('button');if(!b)return;detail(b.dataset.t);b.scrollIntoView({block:'nearest',inline:'center',behavior:reduceM?'auto':'smooth'});};
  $('#tmD').onclick=e=>{if(e.target.closest('[data-t2]'))return;const r=e.target.closest('[data-p]');if(r)profile(P.find(p=>p.id===+r.dataset.p));};
  rail();requestAnimationFrame(moveInd);addEventListener('resize',()=>{if($('#tmI'))moveInd();});};

/* ---------- loader on every page change (after the first full-screen one) ---------- */
let firstNav=!document.getElementById('adLoad').classList.contains('out');Object.keys(V).forEach(k=>{const f=V[k];V[k]=el=>{f(el);if(firstNav){firstNav=false;return;}ADX.vLoad(480);};});
if(location.hash.startsWith('#app-')&&app.classList.contains('on'))setTimeout(()=>{firstNav=true;ADX.go(location.hash.slice(5));},0);
})();

