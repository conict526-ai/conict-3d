import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createIntroGate} from './dist/intro-state.js';

const source=readFileSync(new URL('./dist/intro.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
class Element{
 constructor(){this.listeners=new Map();this.dataset={};this.hidden=false;this.attrs=new Map();this.classList={add:()=>{}};}
 addEventListener(type,fn,{signal}={}){
  const list=this.listeners.get(type)||[];list.push({fn,signal});this.listeners.set(type,list);
 }
 emit(type){for(const {fn,signal} of this.listeners.get(type)||[])if(!signal?.aborted)fn();}
 querySelector(selector){return this.children?.[selector]||null;}
 querySelectorAll(){return [];}
 removeAttribute(name){this.attrs.delete(name);}
 contains(){return false;}
}
function mount({reduced=false,seen=false,hidden=false}={}){
 let now=0,next=0;const timers=new Map();
 const loader=new Element(),house=new Element(),video=new Element(),poster=new Element();
 const status=new Element(),skip=new Element(),recovery=new Element(),window=new Element(),document=new Element();
 const sceneScript=new Element();
 house.inert=true;poster.hidden=true;recovery.hidden=true;document.hidden=hidden;
 video.currentTime=0;video.paused=true;video.playCalls=0;
 video.play=()=>{video.paused=false;video.playCalls++;return Promise.resolve();};
 video.pause=()=>{video.paused=true;};video.load=()=>{};
 video.requestVideoFrameCallback=()=>++next;video.cancelVideoFrameCallback=()=>{};
 recovery.children={button:new Element()};
 loader.children={video,'.intro-poster':poster,'#intro-status':status,'.intro-skip':skip,'.intro-recovery':recovery,'.intro-visual':new Element(),'#intro-title':new Element()};
 document.children={'#loader':loader,'#house':house,'#scene-script':sceneScript};
 const storage=new Map(seen?[['conict-intro-20261026','1']]:[]);
 runInNewContext(source,{
  document,window,createIntroGate,AbortController,URLSearchParams,
  location:{search:'',reload:()=>{}},matchMedia:()=>({matches:reduced}),
  sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
  setTimeout:(fn,delay)=>{const id=++next;timers.set(id,{fn,at:now+delay});return id;},
  clearTimeout:id=>timers.delete(id)
 });
 return {
  loader,house,video,poster,skip,recovery,
  playing:()=>video.emit('playing'),
  ready:()=>window.emit('conict-scene-ready'),
  frame:time=>{video.currentTime=time;video.emit('timeupdate');},
  ended:()=>{video.currentTime=7;video.emit('ended');},
  visibility:value=>{document.hidden=value;document.emit('visibilitychange');},
  tick:duration=>{
   const end=now+duration;let count=0;
   while(true){
    const pending=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
    if(!pending)break;
    const [id,timer]=pending;timers.delete(id);now=timer.at;timer.fn();assert(++count<100,'timer loop');
   }
   now=end;
  }
 };
}

{
 const t=mount();assert(t.poster.hidden,'first paint must not show the complete fallback logo');
 t.playing();
 for(let cycle=1;cycle<=5;cycle++){
  for(const time of [2.5,3.4,4.8,6.99]){
   t.frame(time);assert(!t.video.paused,'loading must never freeze the completed logo');
   assert.equal(t.video.currentTime,time,'loading must never seek to the start of disassembly');
  }
  t.tick(7000);t.ended();
  assert.equal(t.video.currentTime,0,'each repeat must restart from incoming pieces');
  assert.equal(t.loader.dataset.introCycle,String(cycle+1));
  assert.equal(t.loader.dataset.introState,'loading');assert(t.house.inert);t.playing();
 }
 assert(t.poster.hidden,'35 seconds of healthy looping must not trigger a media fallback');
 t.frame(4.8);const playCalls=t.video.playCalls;t.ready();
 assert.equal(t.video.playCalls,playCalls,'scene readiness must not start a separate exit animation');
 assert.equal(t.video.currentTime,4.8,'scene readiness must not rewind or skip the current cycle');
 assert(!t.video.paused);t.frame(6.99);assert(t.house.inert);
 t.tick(15000);assert(t.poster.hidden,'healthy playback must not have a wall-clock cutoff');
 t.ended();assert.equal(t.loader.dataset.introState,'leaving');assert(t.house.inert);
 t.tick(360);assert(t.loader.hidden);assert(!t.house.inert);
}
for(const phaseTime of [0.2,1.5,2.8,3.4,4.8,6.99]){
 const t=mount();t.playing();t.frame(phaseTime);const playCalls=t.video.playCalls;t.ready();
 assert.equal(t.video.currentTime,phaseTime,'readiness at any phase preserves current playback');
 assert.equal(t.video.playCalls,playCalls,'no new playback on readiness');assert(!t.video.paused);
 t.frame(6.99);
 assert(!t.loader.hidden);assert(t.house.inert,'a cached room must still wait for the animation');
 t.ended();t.tick(360);assert(t.loader.hidden);assert.equal(t.loader.dataset.introCycle,'1','do not add an extra cycle before entering');
}
{
 const t=mount({hidden:true});assert.equal(t.video.playCalls,0);t.tick(30000);assert(t.poster.hidden);
 t.visibility(false);assert.equal(t.video.playCalls,1);t.playing();t.frame(1);
 t.visibility(true);assert(t.video.paused);t.tick(60000);assert(t.poster.hidden);
 t.visibility(false);t.playing();t.ready();t.frame(6.99);assert(t.house.inert);
 t.ended();t.tick(360);assert(t.loader.hidden);
}
{
 const t=mount();t.playing();t.video.emit('waiting');t.tick(11999);assert(t.poster.hidden);
 t.playing();t.tick(15000);assert(t.poster.hidden,'recovered buffering must cancel the timeout');
}
{
 const t=mount();t.tick(12000);assert(!t.poster.hidden,'unplayable media keeps the static fallback');
 assert(t.house.inert);t.ready();t.tick(360);assert(t.loader.hidden);
}
{
 const t=mount();t.playing();t.ready();t.skip.emit('click');t.tick(360);assert(t.loader.hidden);
}
{
 const t=mount();t.playing();t.skip.emit('click');const playCalls=t.video.playCalls;t.ended();
 assert.equal(t.video.playCalls,playCalls,'an ended event after skip must not restart the video');
 assert(t.house.inert);t.ready();t.tick(360);assert(t.loader.hidden);
}
{
 const t=mount();t.video.emit('error');assert(!t.poster.hidden);assert(t.house.inert);
 t.ready();t.tick(360);assert(t.loader.hidden);
}
for(const options of [{reduced:true},{seen:true}]){
 const t=mount(options);assert.equal(t.video.playCalls,0);assert(!t.poster.hidden);
 t.ready();t.tick(360);assert(t.loader.hidden);assert(!t.house.inert);
}
console.log('PASS: full cycles loop throughout 35s loading, readiness never pauses/seeks/replays, the current cycle ends before opening, and hidden-tab/skip/media fallbacks remain safe');
