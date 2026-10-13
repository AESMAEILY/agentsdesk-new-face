/* Agents Desk orb: liquid WebGL sphere in brand orange.
   Shared by the landing hero and the dashboard AI Agent background.
   Renders only while visible, caps resolution, and respects reduced motion. */
(function(){
window.__orbFS=`precision highp float;uniform vec2 R;uniform float T;uniform vec2 M;uniform vec2 P;uniform float H;
  float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float n(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
    return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}
  void main(){float px=1.6/min(R.x,R.y);vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);vec2 dp=uv-P;float dl=length(dp);
    float k=exp(-dl*dl*14.)*H/(1.+dl*4.);uv-=dp*k*.05;
    float r=.36+.01*H+.004*sin(T*.0009);float d=length(uv);
    vec3 orange=vec3(.957,.412,.122),deep=vec3(.52,.12,.02),peach=vec3(1.,.82,.66),hot=vec3(1.,.56,.2);
    float fade=smoothstep(.5,.4,length(uv))*smoothstep(.5,.44,max(abs(uv.x),abs(uv.y)));
    float g=exp(-max(d-r,0.)*(13.-4.*H))*(.26+.16*H)*fade;
    if(d>r+px){gl_FragColor=vec4(orange*g,g);return;}
    float z=sqrt(max(r*r-d*d,0.));vec3 nn=normalize(vec3(uv,z+1e-4));
    float ph=dl*48.-T*.0026;float rip=sin(ph)*k*smoothstep(0.,.04,dl);
    nn=normalize(nn+vec3(normalize(dp+1e-5)*rip*.28,0.));
    float t=T*.00013;vec3 q=nn*1.7+vec3(M*.35,0.);
    float ca=cos(t*1.6),sa=sin(t*1.6);q.xz=mat2(ca,-sa,sa,ca)*q.xz;
    vec3 w1=vec3(fbm(q+vec3(0.,t*2.,t)),fbm(q+vec3(5.2,1.3-t,2.8)),0.);
    float w=fbm(q+w1*1.4+vec3(t,t*1.5,0.));
    float f=fbm(q*1.25+w*2.3+vec3(t*1.8,-t,0.));
    vec3 col=mix(deep,orange,smoothstep(.18,.62,f));col=mix(col,hot,smoothstep(.52,.82,f));
    float band=pow(abs(sin(f*10.+w*5.5+t*3.)),18.);col=mix(col,peach,band*.5);
    float caus=pow(fbm(q*3.+w*3.+vec3(0.,0.,t*2.)),3.)*.6;col+=peach*caus*.35;
    float fr=pow(1.-nn.z,2.4);col=mix(col,vec3(1.,.9,.82),fr*.5);
    vec3 L=normalize(vec3(-.45,.55,.75));vec3 rf=reflect(-L,nn);float sp=pow(max(rf.z,0.),70.)*1.1;float sp2=pow(max(dot(nn,normalize(vec3(.5,-.45,.7))),0.),16.)*.22;
    float rim=smoothstep(r-.012,r-.002,d)*.25;
    col+=vec3(sp)+peach*sp2+vec3(1.,.92,.85)*rim;
    float wv=.5+.5*sin(ph);col=mix(col,peach,k*.32*wv*wv);col*=1.+.07*H;
    float a=mix(.84,1.,fr);float edge=smoothstep(r+px,r-px,d);
    vec3 outc=orange*g;float A=mix(g,a,edge);gl_FragColor=vec4(mix(outc,col*a,edge),A);}`;
window.mountOrb=function(cv,opt){opt=opt||{};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false,powerPreference:'low-power'});
  if(!gl){cv.classList.add('no-gl');return false;}
  const sh=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);return o;};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,window.__orbFS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){cv.classList.add('no-gl');return false;}
  gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const u=k=>gl.getUniformLocation(pr,k);const uR=u('R'),uT=u('T'),uM=u('M'),uP=u('P'),uH=u('H');
  const maxDpr=opt.maxDpr||1.5,maxPx=opt.maxPx||900;
  let mx=0,my=0,tx=0,ty=0,px=5,py=5,ppx=5,ppy=5,hv=0,th=0,ph=4000,last=0,vis=true,raf=0;
  const size=()=>{const r=cv.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,maxDpr);const w=Math.min(maxPx,Math.round(r.width*d)),h=Math.min(maxPx,Math.round(r.height*d));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}gl.viewport(0,0,cv.width,cv.height);};
  if(opt.interactive!==false){addEventListener('pointermove',e=>{tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;const r=cv.getBoundingClientRect(),m=Math.min(r.width,r.height);px=(e.clientX-r.left-r.width/2)/m;py=(r.top+r.height/2-e.clientY)/m;th=Math.hypot(px,py)<.46?1:0;},{passive:true});document.addEventListener('mouseleave',()=>th=0);}
  const draw=t=>{const dt=Math.min(t-last,50);last=t;mx+=(tx-mx)*.04;my+=(ty-my)*.04;hv+=(th-hv)*.03;ppx+=(px-ppx)*.05;ppy+=(py-ppy)*.05;ph+=dt*(opt.speed||1)*(1+.7*hv);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(uR,cv.width,cv.height);gl.uniform1f(uT,ph);gl.uniform2f(uM,mx,-my);gl.uniform2f(uP,ppx,ppy);gl.uniform1f(uH,hv);gl.drawArrays(gl.TRIANGLES,0,3);};
  const loop=t=>{raf=0;if(!vis||document.hidden||!cv.isConnected)return;draw(t);raf=requestAnimationFrame(loop);};
  const start=()=>{if(!raf&&!reduce)raf=requestAnimationFrame(t=>{last=t;loop(t);});};
  size();addEventListener('resize',size);
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)start();},{rootMargin:'100px'}).observe(cv);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)start();});
  if(reduce){draw(9000);}else start();
  return true;};
})();
