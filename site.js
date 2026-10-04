/* Agents Desk landing page behaviour: nav, smooth scroll, counters, demo videos, reveals, FAQ, contact. */
(function(){
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Days until the Top-5 league winter window opens (1 Jan, Berlin time) */
(()=>{const now=new Date(),y=now.getMonth()>=1?now.getFullYear()+1:now.getFullYear();const open=Date.UTC(y,0,1)-3600e3;const d=Math.max(0,Math.ceil((open-now)/864e5));$$('.days').forEach(e=>e.textContent=d);})();

/* Official league logos: add licensed logo files here (URL or data URI) to replace the flags. */
const LEAGUE_LOGOS={};
$$('.lg').forEach(el=>{const u=LEAGUE_LOGOS[el.textContent.trim()];const f=$('.flag',el);if(u&&f){const i=new Image();i.className='lg-logo';i.alt='';i.src=u;f.replaceWith(i);}});

/* Hero orb (renders only while visible) */
const orb=$('#orb');if(orb&&window.mountOrb)window.mountOrb(orb,{maxDpr:1.5,maxPx:840});

/* Smooth scroll */
let lenis=null;
if(window.Lenis&&!reduce){lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  if(window.gsap&&window.ScrollTrigger){gsap.registerPlugin(ScrollTrigger);lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);}
  else{const raf=t=>{lenis.raf(t);requestAnimationFrame(raf);};requestAnimationFrame(raf);}}
const scrollToY=y=>lenis?lenis.scrollTo(y,{duration:1.2}):scrollTo({top:y,behavior:reduce?'auto':'smooth'});

/* Nav: anchors, mobile sheet, hide on scroll down */
const nav=$('#nav'),burger=$('#burger'),sheet=$('#sheet');
const closeSheet=()=>{sheet.hidden=true;burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Open menu');};
burger.addEventListener('click',()=>{const open=sheet.hidden;sheet.hidden=!open;burger.setAttribute('aria-expanded',open);burger.setAttribute('aria-label',open?'Close menu':'Open menu');});
addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});
document.addEventListener('click',e=>{const a=e.target.closest('a[data-anchor]');if(a){const el=document.querySelector(a.getAttribute('href'));if(el){e.preventDefault();closeSheet();scrollToY(el.getBoundingClientRect().top+scrollY-(a.getAttribute('href')==='#top'?0:16));}}
  else if(!sheet.hidden&&!e.target.closest('#sheet,#burger'))closeSheet();});
$$('.brand[href="#top"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();scrollToY(0);}));
let lastY=0;const secs=['desk','security','contact'].map(id=>document.getElementById(id));
const onScroll=()=>{const y=scrollY;nav.classList.toggle('hide',y>lastY&&y>400&&sheet.hidden);lastY=y;
  let act=null;secs.forEach(s=>{if(s&&s.getBoundingClientRect().top<innerHeight*.4)act=s.id;});$$('.nav-links a[data-anchor]').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+act));};
addEventListener('scroll',onScroll,{passive:true});

/* Rolling counters (slow, smooth) */
$$('.odo').forEach(el=>{const v=(+el.dataset.odo).toLocaleString('en-US');el.textContent='';
  [...v].forEach((ch,i)=>{if(!/\d/.test(ch)){const s=document.createElement('span');s.className='sep';s.textContent=ch;el.appendChild(s);return;}
    const d=document.createElement('span');d.className='d';const col=document.createElement('span');col.className='col';
    for(let k=0;k<30;k++){const n=document.createElement('span');n.textContent=k%10;col.appendChild(n);}
    d.appendChild(col);d.dataset.t=20+(+ch);col.style.setProperty('--dur',(3.2+i*.3)+'s');col.style.setProperty('--del',(i*.14)+'s');el.appendChild(d);});});
const roll=el=>{el.classList.add('run');$$('.d',el).forEach(d=>{$('.col',d).style.transform=`translateY(-${d.dataset.t}em)`;});};
if(reduce)$$('.odo').forEach(el=>{$$('.d',el).forEach(d=>$('.col',d).style.transform=`translateY(-${d.dataset.t}em)`);});
else{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){o.unobserve(e.target);setTimeout(()=>roll(e.target),200);}}),{threshold:.6});$$('.odo').forEach(el=>o.observe(el));}

/* Videos: load lazily, play only while on screen */
const playV=v=>{try{if(v.preload!=='auto'){v.preload='auto';v.load();}v.currentTime=0;const p=v.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}};

/* The desk tutorial */
const desk=$('#desk');const tabs=$$('.tt'),frs=$$('.tf'),vids=frs.map(f=>$('video',f));let cur=0,vis=false,started=false;
const bar=i=>{tabs.forEach(t=>{const b=$('.tpg i',t);b.style.animation='none';void b.offsetWidth;b.style.animation='';});const v=vids[i];tabs[i].style.setProperty('--d',(v&&isFinite(v.duration)&&v.duration?v.duration:10)+'s');};
const show=i=>{cur=i;tabs.forEach((t,k)=>{t.classList.toggle('on',k===i);t.setAttribute('aria-selected',k===i);});frs.forEach((f,k)=>{f.classList.toggle('on',k===i);if(k!==i&&vids[k])vids[k].pause();});$('#tutUrl').textContent='agentsdesk.football/dashboard/'+tabs[i].dataset.url;if(vids[i]&&vis&&!reduce)playV(vids[i]);bar(i);};
vids.forEach((v,i)=>{v.addEventListener('ended',()=>{if(i===cur&&vis&&!reduce)show((cur+1)%tabs.length);});v.addEventListener('loadedmetadata',()=>{if(i===cur)bar(i);});});
tabs.forEach((t,i)=>t.addEventListener('click',()=>show(i)));
$('.tut-tabs').addEventListener('keydown',e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;e.preventDefault();const n=(cur+(e.key==='ArrowDown'?1:-1)+tabs.length)%tabs.length;show(n);tabs[n].focus();});
new IntersectionObserver(es=>{vis=es[0].isIntersecting;desk.classList.toggle('paused',!vis);const v=vids[cur];if(vis){if(!started){started=true;show(0);}else if(v&&!reduce)v.play().catch(()=>{});}else if(v)v.pause();},{threshold:.25}).observe($('.tut-stage'));

/* Feature sections: play when visible, scroll-linked reveal on large screens */
const feats=$$('.feat');
const fio=new IntersectionObserver(es=>es.forEach(e=>{const v=$('video',e.target);if(!v)return;if(e.isIntersecting){v.loop=true;if(!reduce){if(v.preload!=='auto'){v.preload='auto';v.load();}v.play().catch(()=>{});}}else v.pause();}),{threshold:.1});
feats.forEach(f=>fio.observe(f));
if(window.gsap&&window.ScrollTrigger&&!reduce&&matchMedia('(min-width:901px)').matches){
  feats.forEach(f=>{const tl=gsap.timeline({scrollTrigger:{trigger:f,start:'top 80%',end:'top 0%',scrub:1}});
    tl.from($$('.fl > span',f),{yPercent:110,opacity:0,stagger:.15,duration:1,ease:'power3.out'},0)
      .from([$('.eyebrow',f),$('.feat-p',f),$('.feat-pts',f),$('.feat-go',f)],{opacity:0,y:24,stagger:.1,duration:.7},.3)
      .fromTo($('.device',f),{scale:.82,y:80,opacity:.3},{scale:1,y:0,opacity:1,duration:1.6,ease:'power2.out'},.1);});
}else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});feats.forEach(f=>{f.classList.add('io');io.observe(f);});}

/* Simple reveals */
const rio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rio.unobserve(e.target);}}),{threshold:.15});
$$('.rv').forEach(el=>rio.observe(el));

/* FAQ accordion */
$$('.qa').forEach(q=>{const b=$('button',q);b.addEventListener('click',()=>{const open=!q.classList.contains('open');$$('.qa').forEach(o=>{o.classList.remove('open');$('button',o).setAttribute('aria-expanded','false');});if(open){q.classList.add('open');b.setAttribute('aria-expanded','true');}});});

/* Contact form opens the visitor's email app */
const f=$('#ctF');if(f)f.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(f);const sub=encodeURIComponent('Website enquiry from '+d.get('n'));const body=encodeURIComponent(d.get('m')+'\n\n'+d.get('n')+'\n'+d.get('e'));const a=document.createElement('a');a.href=`mailto:info@agentsdesk.football?subject=${sub}&body=${body}`;a.target='_top';document.body.appendChild(a);a.click();a.remove();$('.ct-n',f).textContent='Your email app should open with the message. If it does not, write to info@agentsdesk.football.';});
})();
