import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createIntroGate} from './dist/intro-state.js';
function make(){
 const events=[];const gate=createIntroGate({onClose:()=>events.push('close'),onFailure:()=>events.push('error')});
 return {gate,events};
}
{
 const {gate,events}=make();gate.ready();assert.deepEqual(events,[]);
 gate.done();assert.deepEqual(events,['close']);gate.ready();gate.done();gate.skip();gate.fail();
 assert.deepEqual(events,['close'],'late events must not close twice or replace a visible scene with an error');
}
{
 const {gate,events}=make();gate.done();assert.deepEqual(events,[]);
 gate.ready();assert.deepEqual(events,['close'],'an animation finishing first must still wait for the scene');
}
{
 const {gate,events}=make();gate.skip();assert.deepEqual(events,[]);
 gate.ready();assert.deepEqual(events,['close'],'skip bypasses the animation but never reveals an unready scene');
}
{
 const {gate,events}=make();gate.ready();gate.skip();assert.deepEqual(events,['close']);
}
{
 const {gate,events}=make();gate.fail();gate.ready();gate.done();gate.skip();
 assert.deepEqual(events,['error']);assert(gate.failed);assert(!gate.closed);
}
{
 const {gate,events}=make();gate.ready();gate.fail();gate.done();
 assert.deepEqual(events,['error'],'a scene error must keep the recovery UI visible');
}
{
 const {gate,events}=make();gate.done();gate.ready();assert.deepEqual(events,['close'],'seen/reduced-motion/static fallback use the same safe transition');
}
const html=readFileSync(new URL('./dist/index.html',import.meta.url),'utf8');
const visit=readFileSync(new URL('./dist/visit.js',import.meta.url),'utf8');
assert(html.includes('<main id="house" inert aria-busy="true">'));
assert(html.indexOf('id="loader"')<html.indexOf('<main id="house"'),'the interactive scene can be inert without disabling the skip button');
assert(html.includes('muted playsinline preload="none"'));
assert(html.includes('intro.js?v=20261027c'));
assert(!/<video[^>]*\bposter=/.test(html),'the initial video must show its empty first frame, never the completed fallback logo');
assert(visit.includes("window.dispatchEvent(new Event('conict-scene-ready'))"));
assert(visit.indexOf("window.dispatchEvent(new Event('conict-scene-ready'))")>visit.indexOf('renderer.render(scene,camera);rendered=true'),'ready must follow an actual rendered frame');
assert(!visit.includes("resize();$('#loader').hidden=true"));
for(const file of ['logo-cycle.mp4','logo-cycle.webm','logo-poster.webp'])assert(existsSync(new URL('./dist/assets/intro/'+file,import.meta.url)));
console.log('PASS: first-render readiness, both event orders, skip, reduced/static fallback, failure, duplicate events, inert placement and local media');
