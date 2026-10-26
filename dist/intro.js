import {createIntroGate} from './intro-state.js?v=20261026';

const loader=document.querySelector('#loader'),house=document.querySelector('#house');
if(loader&&house&&!loader.hidden&&loader.dataset.sceneState!=='error')mountIntro();

function mountIntro(){
 const video=loader.querySelector('video'),poster=loader.querySelector('.intro-poster');
 const status=loader.querySelector('#intro-status'),skip=loader.querySelector('.intro-skip');
 const recovery=loader.querySelector('.intro-recovery');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const seenKey='conict-intro-20261026',force=new URLSearchParams(location.search).get('intro')==='1';
 let seen=false;try{seen=sessionStorage.getItem(seenKey)==='1'&&!force;}catch{}
 const aborter=new AbortController(),listen=(target,type,fn)=>target?.addEventListener(type,fn,{signal:aborter.signal});
 let animationTimer=0,sceneTimer=0,closeTimer=0,frameRequest=0,heldForScene=false;
 const holdTime=3.4,exitTime=5.85;
 const gate=createIntroGate({onClose:close,onFailure:fail});
 window.CONICTIntro={ready,fail:()=>gate.fail(),skip:()=>skipAnimation()};
 loader.dataset.introState='loading';

 function clearWatchdogs(){clearTimeout(animationTimer);clearTimeout(sceneTimer);}
 function stopVideo(){
  if(frameRequest&&video.cancelVideoFrameCallback)video.cancelVideoFrameCallback(frameRequest);
  frameRequest=0;video.pause();
 }
 function releaseVideo(){
  stopVideo();video.removeAttribute('src');
  for(const source of video.querySelectorAll('source'))source.removeAttribute('src');
  video.load();
 }
 function close(){
  clearWatchdogs();aborter.abort();
  const focusWasInside=loader.contains(document.activeElement);
  loader.dataset.introState='leaving';loader.classList.add('intro-leaving');
  stopVideo();
  try{sessionStorage.setItem(seenKey,'1');}catch{}
  closeTimer=setTimeout(()=>{
   loader.hidden=true;loader.dataset.introState='done';
   house.inert=false;house.removeAttribute('aria-busy');
   releaseVideo();
   if(focusWasInside)document.querySelector('#enter-button')?.focus({preventScroll:true});
  },reduced?0:360);
 }
 function fail(){
  clearWatchdogs();stopVideo();aborter.abort();
  loader.dataset.introState='error';loader.dataset.sceneState='error';
  loader.querySelector('.intro-visual').hidden=true;skip.hidden=true;recovery.hidden=false;
  loader.querySelector('#intro-title').textContent='연구실 화면을 열 수 없어요';
  status.textContent='다시 불러오거나 공식 연구실 홈페이지를 이용해 주세요.';
 }
 function staticFallback(){
  if(gate.closed||gate.failed)return;
  stopVideo();video.hidden=true;poster.hidden=false;
  gate.done();
 }
 function ready(){
  if(gate.closed||gate.failed)return;
  clearTimeout(sceneTimer);house.dataset.sceneReady='true';
  status.textContent='곧 연구실 문이 열립니다.';
  gate.ready();
  if(heldForScene&&!gate.closed){
   heldForScene=false;video.play().catch(staticFallback);watchFrames();
  }
 }
 function skipAnimation(){
  stopVideo();video.hidden=true;poster.hidden=false;
  skip.disabled=true;status.textContent=gate.sceneReady?'연구실로 들어갑니다.':'연구실을 불러오고 있어요.';
  gate.skip();
 }
 function watchProgress(){
  if(gate.closed||gate.failed||gate.animationDone)return;
  if(!gate.sceneReady&&video.currentTime>=holdTime){
   heldForScene=true;video.pause();video.currentTime=holdTime;
   status.textContent='연구실을 불러오고 있어요.';
   return;
  }
  if(gate.sceneReady&&video.currentTime>=exitTime)gate.done();
 }
 function watchFrames(){
  if(!video.requestVideoFrameCallback||frameRequest||gate.closed||gate.failed||gate.animationDone)return;
  frameRequest=video.requestVideoFrameCallback(()=>{
   frameRequest=0;watchProgress();
   if(!heldForScene)watchFrames();
  });
 }
 listen(skip,'click',skipAnimation);
 listen(recovery.querySelector('button'),'click',()=>location.reload());
 listen(window,'conict-scene-ready',ready);
 listen(window,'conict-scene-error',()=>gate.fail());
 listen(document.querySelector('#scene-script'),'error',()=>gate.fail());
 listen(video,'error',staticFallback);
 listen(video,'ended',()=>gate.done());
 listen(video,'timeupdate',watchProgress);
 listen(video,'playing',watchFrames);
 listen(document,'visibilitychange',()=>{
  if(gate.closed||gate.failed||gate.animationDone||reduced||seen)return;
  if(document.hidden)video.pause();
  else if(!heldForScene)video.play().catch(staticFallback);
 });
 listen(window,'pagehide',()=>{clearWatchdogs();clearTimeout(closeTimer);stopVideo();});
 sceneTimer=setTimeout(()=>{
  if(gate.sceneReady||gate.failed||gate.closed)return;
  status.textContent='불러오는 데 시간이 조금 걸리고 있어요.';
  recovery.hidden=false;
 },20000);
 if(reduced||seen){
  video.hidden=true;poster.hidden=false;gate.done();
 }else{
  video.preload='auto';video.load();
  animationTimer=setTimeout(staticFallback,12000);
  video.play().then(watchFrames).catch(staticFallback);
 }
 if(house.dataset.sceneReady==='true')ready();
}

