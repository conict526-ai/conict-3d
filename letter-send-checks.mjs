import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as core from './dist/letter-core.js';

// Exercise the real UI controller with a deferred transport; no mail is sent.
const source=(await readFile(new URL('./dist/letter-ui.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
const sample={name:'즉시 전송 점검',studentId:'',grade:'기타',purpose:'question',question:'지연 응답과 실패 복구를 검증하는 모의 편지입니다.',email:'conict526@gmail.com',consent:true,overseasConsent:true};
const element=()=>({innerHTML:'',textContent:'',hidden:false,style:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []},scrollIntoView(){}});
function harness(config={endpoint:'https://formspree.io/f/testletters'}){
 const elements=new Map(),view=element();elements.set('#letter-view',view);
 let finish,calls=0,sent;
 const document={querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key)}};
 const context=vm.createContext({...core,letterConfig:config,consentHTML:()=>'',document,requestAnimationFrame(){},structuredClone,sendLetter(a){calls++;sent=a;return new Promise(resolve=>{finish=resolve})}});
 vm.runInContext(source,context);context.input=structuredClone(sample);vm.runInContext("answers=input;current='review';render()",context);
 return {context,view,get calls(){return calls},get sent(){return sent},finish(result){finish(result)},submit(){return vm.runInContext('submit()',context)},state(){return vm.runInContext('({answers,current,busy,alert})',context)}};
}
const delayed=harness(),pending=delayed.submit();
assert.equal(delayed.calls,1);assert.equal(delayed.state().current,'done');assert(delayed.view.innerHTML.includes('편지를 보냈어요.'));
assert(delayed.view.innerHTML.includes('data-action="restart" disabled'),'a second letter cannot start while this request is pending');
assert.equal(delayed.state().answers.question,sample.question,'retain the draft until the result is known');
await delayed.submit();assert.equal(delayed.calls,1,'repeated clicks do not send duplicate letters');
delayed.finish({ok:true});await pending;assert.equal(Object.keys(delayed.state().answers).length,0,'clear personal data after acceptance');assert(!delayed.view.innerHTML.includes('data-action="restart" disabled'));
for(const kind of ['service','uncertain','limit']){
 const failed=harness(),request=failed.submit();assert.equal(failed.state().current,'done','show the immediate confirmation even during a delayed request');
 failed.finish({ok:false,kind,message:'전송 결과를 확인해주세요.'});await request;
 assert.equal(failed.state().current,'review');assert.equal(failed.state().answers.question,sample.question);assert.equal(failed.state().alert,'전송 결과를 확인해주세요.');assert.equal(failed.state().busy,false);
 const retry=failed.submit();assert.equal(failed.calls,2);failed.finish({ok:true});await retry;
}
for(const field of ['consent','overseasConsent']){
 const missing=harness();vm.runInContext(`answers.${field}=false`,missing.context);await missing.submit();assert.equal(missing.calls,0);assert.equal(missing.state().current,'review');
}
const unconfigured=harness({endpoint:''});await unconfigured.submit();assert.equal(unconfigured.calls,0);assert.equal(unconfigured.state().current,'review');
const bot=harness();vm.runInContext("answers.website='bot'",bot.context);await bot.submit();assert.equal(bot.calls,0);assert.equal(bot.state().current,'review');
await core.sendLetter(sample,{endpoint:'https://formspree.io/f/testletters'},async(_url,options)=>{assert.equal(options.keepalive,true,'continue the in-flight request when the visitor leaves the letter page');assert(Buffer.byteLength(options.body)<65536,'payload fits the browser keepalive limit');return {ok:true,json:async()=>({ok:true})}});
console.log(JSON.stringify({pass:true,mailSent:false,checks:['confirmation renders before the transport resolves','duplicate submission guard','draft recovery and retry on failure','required consents, setup and honeypot block before confirmation','clear private data on acceptance','keepalive request for navigation']},null,2));
