import {distance,captures} from './geometry.js?v=2';

const canvas=document.querySelector('#scene');
const ctx=canvas.getContext('2d');
const victory=document.querySelector('#victory');
const soundButton=document.querySelector('#sound');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=1000,H=600,dpr=1,people=[],target,obstacles=[],background;
let drawing=false,pointer=null,line=[],fading=[],particles=[],won=false,winTime=0,last=0,clock=0;
let random=Math.random,audio=null,sound=false,resizeFrame=0;
const TAU=Math.PI*2;
const C={ink:'#576051',grass:'#ccddbe',path:'#eddfbf',light:'#f7edce'};
const shirts=['#d7a391','#edcc7e','#8eafad','#a6b48c','#bca2b1','#e9ddc1','#95abc1','#d9b87e'];
const skins=['#f3cfaa','#f7d7b8','#deb18d','#e8be96','#c79573'];
const hairs=['#655a49','#80705a','#b39a70','#987456','#53594b'];
function seeded(seed){return()=>{let t=seed+=0x6d2b79f5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function rr(a,b){return a+random()*(b-a)}
function pick(a){return a[Math.floor(random()*a.length)]}
function ellipse(g,x,y,rx,ry,fill,stroke){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.stroke()}}
function path(g,pts,color,width=2){g.beginPath();g.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)g.lineTo(...pts[i]);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke()}
function round(g,x,y,w,h,r,fill,stroke){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.stroke()}}
function bush(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);ellipse(g,0,11,29,8,'#aec79e');g.lineWidth=1.5;ellipse(g,-15,0,17,17,'#9dbb8f','#8da77f');ellipse(g,4,-9,20,22,'#a9c597','#8da77f');ellipse(g,22,2,16,16,'#a9c597','#8da77f');path(g,[[-17,4],[-14,1],[-11,4]],'#c9daa8',2);path(g,[[5,-11],[8,-14],[11,-11]],'#c9daa8',2);g.restore()}
function tree(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);ellipse(g,4,19,35,10,'#a8be9690');g.lineWidth=2;round(g,-5,-28,10,47,4,'#beaa7c','#928661');ellipse(g,-16,-38,25,28,'#99b58b','#829e77');ellipse(g,14,-39,26,31,'#a7bf8f','#829e77');ellipse(g,-1,-61,26,29,'#b7ca9b','#8ba77c');path(g,[[-13,-56],[-9,-59],[-5,-56]],'#d8dfb1',2.5);ellipse(g,19,-34,5,2.5,'#bacfa0');path(g,[[0,-13],[0,-31],[12,-42]],'#928661',2);g.restore()}
function flower(g,x,y,c){for(let i=0;i<5;i++){let a=i/5*TAU;ellipse(g,x+Math.cos(a)*2.7,y+Math.sin(a)*2.7,2.3,2.3,c)}ellipse(g,x,y,1.6,1.6,'#e4be6e')}
function bench(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);g.lineWidth=2;path(g,[[-26,9],[-28,23]],'#6b775d',4);path(g,[[26,9],[28,23]],'#6b775d',4);round(g,-33,-17,66,10,3,'#c7a578','#aa8e65');round(g,-33,-4,66,9,3,'#d4b386','#aa8e65');round(g,-36,9,72,10,3,'#dcc096','#aa8e65');g.restore()}
function lamp(g,x,y){g.lineWidth=2;path(g,[[x,y],[x,y-51]],'#8e9d7b',4);round(g,x-10,y-65,20,17,5,'#f4eac2','#9d9d79');path(g,[[x-12,y-66],[x+12,y-66]],'#8e9d7b',3);ellipse(g,x,y-69,2.5,3,'#8e9d7b');ellipse(g,x,y+2,8,3,'#a9bc93')}
function makeBackground(){
  background=document.createElement('canvas');background.width=Math.round(W*dpr);background.height=Math.round(H*dpr);
  const g=background.getContext('2d');g.scale(dpr,dpr);g.fillStyle=C.grass;g.fillRect(0,0,W,H);
  // Soft, meandering paths hold the crowd together like a miniature storybook park.
  g.lineCap='round';g.lineWidth=Math.min(180,W*.39);g.strokeStyle='#e9dcbc';g.beginPath();g.moveTo(-40,H*.83);g.bezierCurveTo(W*.35,H*.97,W*.7,H*.24,W+40,H*.3);g.stroke();
  g.lineWidth=Math.min(120,W*.29);g.strokeStyle='#eee2c5';g.beginPath();g.moveTo(W*.32,-30);g.bezierCurveTo(W*.48,H*.27,W*.25,H*.5,W*.66,H+30);g.stroke();
  g.strokeStyle='#f3e8ce';g.lineWidth=2;g.setLineDash([3,12]);g.beginPath();g.moveTo(-20,H*.87);g.bezierCurveTo(W*.38,H,W*.7,H*.3,W+20,H*.34);g.stroke();g.setLineDash([]);
  for(let i=0;i<W*H/1100;i++){const x=rr(8,W-8),y=rr(8,H-8);if(random()<.55){g.fillStyle=random()<.5?'#78976b12':'#fff9df20';ellipse(g,x,y,rr(1,3),rr(.7,1.4),g.fillStyle)}else{path(g,[[x-3,y+2],[x-1,y-2],[x,y+1],[x+3,y-3]],'#9eb68a40',1.1)}}
  // A fence, little gate, and quiet corners frame the playable area.
  g.strokeStyle='#a9ba94';g.lineWidth=3;path(g,[[20,37],[W*.38,37]],'#a9ba94',3);path(g,[[W*.58,37],[W-20,37]],'#a9ba94',3);
  for(let x=23;x<W-15;x+=21){if(x>W*.38&&x<W*.58)continue;round(g,x,20,6,35,3,'#e3dfb7','#acb692')}
  const small=W<600;
  obstacles=[];
  const addTree=(x,y,s)=>{tree(g,x,y,s);obstacles.push({x,y:y-20*s,r:31*s})};
  addTree(30,H*.29,small?.82:1.15);addTree(W-26,H*.19,small?.84:1.2);
  addTree(W*.9,H-20,small?.85:1.2);addTree(W*.14,H-15,small?.85:1.1);
  bush(g,3,H*.6,1.1);bush(g,W-5,H*.64,1.2);bush(g,W*.77,21,.8);bush(g,W*.19,22,.75);
  bench(g,small?W*.2:W*.13,H*.49,small?.7:.95);obstacles.push({x:small?W*.2:W*.13,y:H*.49,r:small?25:39});
  bench(g,W*.82,H*.76,small?.65:.9);obstacles.push({x:W*.82,y:H*.76,r:small?25:38});
  if(!small){lamp(g,83,100);lamp(g,W-95,H-65);bush(g,W*.45,H-1,1);}
  for(let i=0;i<24;i++){const edge=random()<.5;let x=edge?rr(10,40):rr(W-40,W-10),y=rr(80,H-25);flower(g,x,y,pick(['#f4e6b4','#f0cead','#e8d6c4']))}
  // Fallen leaves and pebbles are deliberately sparse around the figures.
  for(let i=0;i<20;i++){const x=rr(30,W-30),y=rr(60,H-20);g.save();g.translate(x,y);g.rotate(rr(-2,2));ellipse(g,0,0,4,2,'#adbb8960');g.restore()}
}
function blocked(x,y){return obstacles.some(o=>Math.hypot(x-o.x,y-o.y)<o.r+15)||x>W-120&&y<80}
function createPerson(prisoner=false){let x,y;for(let i=0;i<100;i++){x=rr(34,W-34);y=rr(90,H-30);if(!blocked(x,y)&&(!prisoner||x>W*.23&&x<W*.77&&y>H*.25&&y<H*.8))break}return{x,y,homeX:x,homeY:y,angle:rr(0,TAU),speed:prisoner?34:rr(5,13),phase:rr(0,TAU),turn:rr(1,4),scale:(W<600?rr(.75,.88):rr(.88,1.07))*(prisoner?1.09:1),shirt:pick(shirts),skin:pick(skins),hair:pick(hairs),style:Math.floor(rr(0,6)),prisoner}}
function reset(){random=seeded(Math.floor(Math.random()*2147483647));drawing=false;pointer=null;line=[];fading=[];particles=[];won=false;victory.hidden=true;canvas.style.cursor='crosshair';makeBackground();people=Array.from({length:Math.max(34,Math.round(W*H/4800))},()=>createPerson());target=createPerson(true);people.push(target)}
function size(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const oldW=W,oldH=H;W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!people.length){reset();return}drawing=false;pointer=null;line=[];fading=[];makeBackground();for(const p of people){p.x=Math.max(28,Math.min(W-28,p.x/oldW*W));p.y=Math.max(80,Math.min(H-25,p.y/oldH*H));p.homeX=p.x;p.homeY=p.y;p.scale*=(W<600?.82:.98)/(oldW<600?.82:.98)}const wanted=Math.max(34,Math.round(W*H/4800))+1;while(people.length<wanted)people.push(createPerson());while(people.length>wanted){const i=people.findIndex(p=>!p.prisoner);people.splice(i,1)}if(won){reset()}}
function person(g,p,t){
  const walking=won&&p.prisoner?0:Math.sin(t*(p.prisoner?11:7)+p.phase);const bounce=Math.abs(walking)*(p.prisoner?1.8:.7);
  g.save();g.translate(p.x,p.y);g.scale(p.scale,p.scale);g.lineWidth=1.6;g.lineJoin='round';g.lineCap='round';
  ellipse(g,0,3,12,4,'#586a4320');g.translate(0,-bounce);const lean=p.prisoner&&!won?Math.cos(p.angle)*.09:Math.cos(p.angle)*.025;g.rotate(lean);
  const leg=walking*3;path(g,[[-4,-6],[-5+leg,3],[-9+leg,3]],p.prisoner?'#62675a':'#6e796b',3.5);path(g,[[5,-6],[5-leg,3],[8-leg,3]],p.prisoner?'#62675a':'#6e796b',3.5);
  // Bent arms carry a tiny sack only on the striped escapee.
  path(g,[[-8,-21],[-13,-15+walking*2],[-12,-10+walking*2]],p.skin,4);path(g,[[8,-21],[13,-16-walking*2],[14,-19-walking*2]],p.skin,4);
  if(p.prisoner){ellipse(g,17,-17-walking*2,7,9,'#bfa579',C.ink);path(g,[[14,-25-walking*2],[19,-25-walking*2]],'#81775b',2)}
  g.lineWidth=1.5;round(g,-9,-25,18,20,6,p.prisoner?'#f4eedb':p.shirt,C.ink);
  if(p.prisoner){g.save();g.beginPath();g.roundRect(-9,-25,18,20,6);g.clip();for(let y=-23;y<-5;y+=7){g.fillStyle='#687164';g.fillRect(-10,y,20,3.5)}g.restore()}else if(p.style===1){path(g,[[-4,-24],[-4,-9]],'#fffae24d',2);ellipse(g,3,-14,1,1,'#6c786756')}else if(p.style===2){g.fillStyle='#f8f0d470';g.fillRect(-8,-16,16,2)}
  // Round cheeks, dot eyes and imperfect hair keep each person friendly.
  ellipse(g,0,-33,11,11.7,p.skin,C.ink);ellipse(g,-10.7,-32,2,3,p.skin);ellipse(g,10.7,-32,2,3,p.skin);
  if(p.prisoner){g.beginPath();g.moveTo(-11,-36);g.bezierCurveTo(-13,-50,13,-51,11,-36);g.closePath();g.fillStyle='#5a6357';g.fill();round(g,-12,-39,24,5,2,'#626b5e');path(g,[[-5,-44],[1,-45],[6,-44]],'#8b927e',1);round(g,-9,-35,18,7,3,'#596052');ellipse(g,-4,-32,1.7,1.7,'#fff8de');ellipse(g,4,-32,1.7,1.7,'#fff8de');ellipse(g,-4+(won?0:Math.cos(p.angle)*.5),-32,0.8,1.1,'#485045');ellipse(g,4+(won?0:Math.cos(p.angle)*.5),-32,.8,1.1,'#485045');if(won){ellipse(g,0,-25,2,2.4,null,C.ink)}else path(g,[[-2,-25],[1,-25.8],[3,-26]],'#8f6d52',1)}
  else{
    g.fillStyle=p.hair;g.beginPath();g.moveTo(-11,-33);g.bezierCurveTo(-14,-50,14,-50,11,-32);g.lineTo(8,-38);g.quadraticCurveTo(0,-35,-5,-40);g.quadraticCurveTo(-8,-34,-11,-33);g.fill();
    if(p.style===3){round(g,-12,-41,24,5,2,'#d1b784',C.ink);g.beginPath();g.moveTo(-8,-42);g.lineTo(-5,-49);g.lineTo(6,-49);g.lineTo(9,-42);g.closePath();g.fillStyle='#d9c193';g.fill();g.strokeStyle=C.ink;g.stroke()}else if(p.style===4){ellipse(g,9,-42,4,4,p.hair)}else if(p.style===5){round(g,-11,-43,22,7,3,p.shirt,C.ink);round(g,-12,-39,24,3,1,p.shirt)}
    ellipse(g,-4,-32,1.1,1.5,C.ink);ellipse(g,4,-32,1.1,1.5,C.ink);ellipse(g,-7,-28,2.2,1,'#dca18b66');ellipse(g,7,-28,2.2,1,'#dca18b66');g.beginPath();g.arc(0,-28,2,0.3,Math.PI-.3);g.strokeStyle='#a17c60';g.lineWidth=1;g.stroke();
  }
  g.restore();
}
function update(dt){const factor=drawing?.16:won?.35:1;for(const p of people){if((won||drawing)&&p.prisoner)continue;p.turn-=dt*factor;if(p.turn<0){p.angle+=rr(-1,1);p.turn=rr(1,4)}const step=dt*p.speed*factor;let nx=p.x+Math.cos(p.angle)*step,ny=p.y+Math.sin(p.angle)*step;const roaming=!p.prisoner&&Math.hypot(nx-p.homeX,ny-p.homeY)>43;if(nx<27||nx>W-27||ny<83||ny>H-23||blocked(nx,ny)||roaming){p.angle=Math.atan2((p.prisoner?H*.52:p.homeY)-p.y,(p.prisoner?W*.5:p.homeX)-p.x)+rr(-.7,.7)}else{p.x=nx;p.y=ny}}for(const f of fading)f.life-=dt;fading=fading.filter(f=>f.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.rotation+=p.spin*dt}particles=particles.filter(p=>p.life>0)}
function strokeLine(points,alpha=1,bad=false,closed=false){if(points.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)ctx.lineTo(points[i].x,points[i].y);if(closed)ctx.closePath();ctx.shadowColor='#675c4828';ctx.shadowBlur=3;ctx.shadowOffsetY=3;ctx.lineWidth=6;ctx.strokeStyle=bad?'#ca997a':'#b58d55';ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.lineWidth=3.5;ctx.strokeStyle=bad?'#e9bc9b':'#f7d998';ctx.stroke();ctx.setLineDash([1.6,6]);ctx.lineWidth=1.2;ctx.strokeStyle=bad?'#f5d8b9':'#fff1c5';ctx.stroke();ctx.restore()}
function cage(g,t){const p=target;const grow=Math.min(1,(t-winTime)*3);g.save();g.translate(p.x,p.y+5);g.scale(p.scale,p.scale);g.globalAlpha=grow;ellipse(g,0,-1,27,12,'#63745519','#83917b');g.translate(0,(1-grow)*-23);for(const x of[-23,-12,0,12,23]){path(g,[[x,-2],[x,-57]],'#74816c',3);ellipse(g,x,-58,2.5,2.5,'#9aa58d','#74816c')}g.beginPath();g.ellipse(0,-57,24,10,0,Math.PI,TAU);g.strokeStyle='#74816c';g.lineWidth=3;g.stroke();g.beginPath();g.ellipse(0,-57,24,10,0,0,Math.PI);g.stroke();round(g,6,-31,9,11,2,'#e8c675','#9a936d');ellipse(g,10.5,-25,1,1.4,'#96845b');g.restore()}
function render(t){ctx.clearRect(0,0,W,H);ctx.drawImage(background,0,0,W,H);people.sort((a,b)=>a.y-b.y);for(const p of people)person(ctx,p,reducedMotion?0:t);for(const f of fading)strokeLine(f.points,Math.min(f.life*2,1),true);if(line.length)strokeLine(line,1,false,won);if(drawing&&line.length){const a=line[0],b=line.at(-1),near=line.length>8&&distance(a,b)<35;ctx.save();ctx.setLineDash([3,5]);ctx.lineWidth=1.5;ctx.strokeStyle=near?'#8b9b69':'#b99a64';ellipse(ctx,a.x,a.y,near?13:8,near?13:8,'#fff8d955',ctx.strokeStyle);ctx.restore();ellipse(ctx,b.x,b.y,4,4,'#fff6d2','#b58d55')}
  if(won)cage(ctx,t);
  for(const p of particles){ctx.save();ctx.globalAlpha=Math.min(1,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.5);ctx.restore()}
}
function frame(ms){if(!last)last=ms;const dt=Math.min((ms-last)/1000,.04);last=ms;clock+=dt;update(dt);render(clock);requestAnimationFrame(frame)}
function position(e){const r=canvas.getBoundingClientRect();return{x:Math.max(2,Math.min(W-2,(e.clientX-r.left)*W/r.width)),y:Math.max(2,Math.min(H-2,(e.clientY-r.top)*H/r.height))}}
function tone(notes){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();for(const [i,n]of notes.entries()){const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.09;osc.type='sine';osc.frequency.setValueAtTime(n,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.07,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.25);osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+.26)}}catch{}}
function succeed(){won=true;winTime=clock;victory.hidden=false;canvas.style.cursor='default';tone([523.25,659.25,783.99,1046.5]);if(!reducedMotion)for(let i=0;i<90;i++)particles.push({x:target.x,y:target.y-25,vx:rr(-180,180),vy:rr(-230,-60),size:rr(4,8),color:pick(['#e7b875','#91ad87','#e5b2a0','#f6edc6','#9cafb2']),life:rr(1.2,2.8),rotation:rr(0,TAU),spin:rr(-5,5)})}
canvas.addEventListener('pointerdown',e=>{if(won||pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;drawing=true;line=[position(e)];canvas.setPointerCapture(pointer)});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!drawing)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.();const samples=coalesced?.length?coalesced:[e];for(const sample of samples){const p=position(sample);if(distance(p,line.at(-1))>2){line.push(p);if(line.length>1800)line=line.filter((_,i)=>i%2===0)}}});
function finish(e,cancelled=false){if(e.pointerId!==pointer)return;const p=position(e);if(!cancelled&&distance(p,line.at(-1))>2)line.push(p);drawing=false;const loop=line;pointer=null;try{canvas.releasePointerCapture(e.pointerId)}catch{}if(!cancelled&&captures(loop,{x:target.x,y:target.y-23*target.scale,radiusX:14*target.scale,radiusY:24*target.scale})){succeed()}else{fading.push({points:loop,life:.65});line=[];if(!cancelled&&loop.length>2)tone([240,190])}}
canvas.addEventListener('pointerup',e=>finish(e));canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>{if(pointer===e.pointerId){drawing=false;pointer=null;fading.push({points:line,life:.4});line=[]}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());document.querySelector('#restart').addEventListener('click',reset);document.querySelector('#again').addEventListener('click',reset);
soundButton.addEventListener('click',()=>{sound=!sound;soundButton.setAttribute('aria-pressed',String(sound));soundButton.setAttribute('aria-label',sound?'关闭声音':'开启声音');if(sound)tone([659,784])});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawing){drawing=false;pointer=null;fading.push({points:line,life:.4});line=[]}});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&drawing){drawing=false;pointer=null;line=[]}});
new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(size)}).observe(canvas);
size();requestAnimationFrame(frame);
