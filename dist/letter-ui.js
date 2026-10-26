import {purposes,grades,timeSlots,researchAreas,todayKST,stepsFor,progressFor,setAnswer,toggleResearch,researchText,validateField,letterRows,configuredEndpoint,sendLetter} from './letter-core.js?v=instant20261026';
import {letterConfig} from './letter-config.js?v=mail20261025';
import {consentHTML} from './letter-privacy.js?v=privacy20261025c';

const view=document.querySelector('#letter-view'),history=document.querySelector('#letter-history'),progress=document.querySelector('#letter-progress');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h15m-6-6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const envelope='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6" stroke-linejoin="round"/></svg>';
let answers={},current='intro',returnToReview=false,busy=false,alert='';
const titles={name:'어떻게 불러드리면 될까요?',studentId:'학번도 알려주실래요?',grade:'지금 몇 학년인가요?',purpose:'어떤 이야기를 보내고 싶나요?',topic:'어떤 상담을 나누고 싶나요?',schedule:'언제가 편하신가요?',question:'어떤 점이 궁금하신가요?',motivation:'함께하고 싶은 이유가 있나요?',research:'어떤 연구가 마음에 드나요?',email:'답장은 어디로 보내드릴까요?',review:'이 마음 그대로, 보내볼까요?'};
const hints={name:'편지를 읽고 이름을 부르며 답장드릴게요.',studentId:'선택 항목이에요. 지금 적지 않아도 괜찮아요.',grade:'지금의 상황에 맞는 이야기를 준비하는 데 도움이 돼요.',purpose:'가장 가까운 이야기 하나를 골라주세요.',topic:'진로, 대학원, 연구 주제 등 편하게 적어주세요.',schedule:'희망 일정으로 접수돼요. 담당자가 답장으로 시간을 확정해드려요.',question:'처음 방문하셨다면 더 궁금한 게 많을 거예요.',motivation:'거창한 계획보다 지금의 관심이 궁금해요.',research:'여러 개를 골라도 좋아요. 아직 탐색 중이어도 괜찮아요.',email:'상담과 질문, 연구 참여에 대한 답장을 보내드려요.',review:'한 번 읽어보고, 바꾸고 싶은 답은 수정해주세요.'};
function textInput(key,type,placeholder,maxLength,extra=''){return `<label class="letter-field-label" for="answer-${key}">${key==='name'?'이름':key==='studentId'?'학번':key==='email'?'이메일':'직접 적는 연구분야'}</label><input class="letter-input" id="answer-${key}" name="${key}" type="${type}" value="${escapeHTML(answers[key])}" placeholder="${placeholder}" maxlength="${maxLength}" ${extra} aria-describedby="letter-error">`}
function textarea(key,placeholder){return `<label class="letter-field-label" for="answer-${key}">${titles[key]}</label><textarea class="letter-input letter-textarea" id="answer-${key}" name="${key}" rows="5" maxlength="3000" placeholder="${placeholder}" aria-describedby="letter-error">${escapeHTML(answers[key])}</textarea><span class="letter-counter" id="letter-counter">${(answers[key]||'').length.toLocaleString()} / 3,000</span>`}
function choices(key,items,multiple=false){return `<div class="letter-choices ${key==='purpose'?'letter-purpose':''}" role="group" aria-labelledby="letter-title">${items.map((item,i)=>{const value=typeof item==='string'?item:item.value,label=typeof item==='string'?item:item.label,selected=multiple?(answers[key]||[]).includes(value):answers[key]===value;return `<button type="button" class="letter-choice${selected?' selected':''}" data-choice="${key}" data-value="${escapeHTML(value)}" aria-pressed="${selected}">${key==='purpose'?`<span class="letter-choice-number">0${i+1}</span>`:''}<span><b>${escapeHTML(label)}</b>${item.hint?`<small>${escapeHTML(item.hint)}</small>`:''}</span><i aria-hidden="true">${selected?'✓':'+'}</i></button>`}).join('')}</div>`}
function fieldHTML(){
 if(current==='name')return textInput('name','text','이름을 적어주세요',40,'autocomplete="name"');
 if(current==='studentId')return textInput('studentId','text','학번을 적어주세요 (선택)',20,'inputmode="numeric" autocomplete="off"');
 if(current==='grade')return choices('grade',grades);
 if(current==='purpose')return choices('purpose',Object.entries(purposes).map(([value,item])=>({value,...item})));
 if(current==='topic')return textarea('topic','지금 고민하고 있는 이야기를 들려주세요.');
 if(current==='question')return textarea('question','연구실 생활, 연구 주제, 참여 방법… 무엇이든 좋아요.');
 if(current==='motivation')return textarea('motivation','어떤 계기로 연구실이 궁금해졌나요?')+'<button type="button" class="letter-text-button" data-action="exploring">아직 동기를 정리하고 있어요</button>';
 if(current==='schedule')return `<label class="letter-field-label visible" for="answer-date">희망 날짜</label><input class="letter-input" id="answer-date" type="date" name="date" min="${todayKST()}" value="${escapeHTML(answers.date)}" ${answers.time===timeSlots[2]?'disabled':''} aria-describedby="letter-error"><span class="letter-field-label visible">희망 시간대</span>${choices('time',timeSlots)}`;
 if(current==='research')return choices('research',researchAreas,true)+((answers.research||[]).includes('직접 적을게요')?textInput('researchOther','text','떠오른 연구분야나 아이디어',1000,'autocomplete="off"'):'');
 if(current==='email')return textInput('email','email','you@example.com',254,'autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false"');
 if(current==='review')return `<div class="letter-review">${letterRows(answers).map(([key,label,value])=>`<div class="letter-review-row"><dt>${label}</dt><dd>${escapeHTML(value)}${key==='studentId'&&answers.studentId?.trim()?'<small class="letter-id-status">선택 동의한 경우에만 전달</small>':''}</dd><button type="button" data-edit="${key}" aria-label="${label} 수정">수정</button></div>`).join('')}</div><div class="letter-recipient">${envelope}<span>받는 곳 <b>CONICT 연구실</b><small>${escapeHTML(letterConfig.recipient)}</small></span></div>${consentHTML(answers)}<div class="letter-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off" value="${escapeHTML(answers.website)}"></label></div>${!configuredEndpoint(letterConfig)?'<p class="letter-setup" role="status">연구실 편지함을 연결하고 있어요. 아직 전송할 수 없어요.</p>':''}`;
 return '';
}
function render({focus=true}={}){
 const steps=stepsFor(answers),index=steps.indexOf(current),intro=current==='intro',done=current==='done';
 progress.hidden=intro||done;history.hidden=intro||done||current==='review';
 if(!intro&&!done){const percent=progressFor(current);document.querySelector('#letter-stage').textContent=index<4?'처음 인사':current==='review'?'보내기 전 확인':current==='email'?'답장받을 곳':'당신의 이야기';document.querySelector('#letter-count').textContent=index<4?'01 / 03':['email','review'].includes(current)?'03 / 03':'02 / 03';document.querySelector('#letter-fill').style.width=percent+'%';document.querySelector('.letter-track').setAttribute('aria-valuenow',percent);history.innerHTML=['name','studentId','grade'].filter(key=>steps.indexOf(key)<index&&Object.hasOwn(answers,key)).map(key=>`<button type="button" class="letter-answer-chip" data-edit="${key}" aria-label="${key==='name'?'이름':key==='grade'?'학년':'학번'} 수정"><span>${key==='name'?'이름':key==='grade'?'학년':'학번'}</span>${escapeHTML(answers[key]||'건너뛰었어요')}<i aria-hidden="true">↗</i></button>`).join('')}
 if(intro)view.innerHTML=`<div class="letter-intro"><div class="letter-envelope">${envelope}</div><span class="letter-eyebrow">반가워요, 미래의 동료</span><h2 id="letter-title" tabindex="-1">CONICT에<br>편지 한 통 남겨볼까요?</h2><p>상담하고 싶은 이야기부터<br>함께 해보고 싶은 연구까지.<br>질문을 하나씩, 천천히 드릴게요.</p><button class="letter-next" data-action="start">편지 쓰기 ${arrow}</button><small>아직 연구 주제가 정해지지 않아도 괜찮아요.</small></div>`;
 else if(done)view.innerHTML=`<div class="letter-success"><div class="letter-envelope success-mark" aria-hidden="true">✓</div><span class="letter-eyebrow">THANK YOU FOR YOUR LETTER</span><h2 id="letter-title" tabindex="-1">편지를 보냈어요.</h2><p>들려주신 이야기를 잘 읽어볼게요.<br>담당자가 확인한 뒤 남겨주신 이메일로 답장드릴게요.</p><a class="letter-next" href="./index.html">연구실 더 둘러보기 ${arrow}</a><button class="letter-text-button" data-action="restart" ${busy?'disabled':''}>새 편지 쓰기</button></div>`;
 else view.innerHTML=`<form id="letter-form" novalidate><div class="letter-question"><span class="letter-kicker">${index<3?'반가워요. 한 가지만 더 알려주세요.':current==='review'?'TO. CONICT LAB':'천천히, 편하게 이야기해주세요.'}</span><h2 id="letter-title" tabindex="-1">${titles[current]}</h2><p class="letter-hint">${hints[current]}</p>${fieldHTML()}<p class="letter-alert" id="letter-error" role="alert" ${alert?'':'hidden'}>${escapeHTML(alert)}</p></div><div class="letter-actions"><button class="letter-back" type="button" data-action="back" aria-label="이전 질문">← 이전</button>${current==='studentId'?'<button class="letter-skip" type="button" data-action="skip">지금은 건너뛰기</button>':''}${['grade','purpose'].includes(current)?'':`<button class="letter-next" id="letter-next" type="submit" ${current==='review'&&!configuredEndpoint(letterConfig)?'disabled':''}>${current==='review'?'편지 보내기':returnToReview?'수정 마치기':'다음'} ${current==='review'?envelope:arrow}</button>`}</div></form>`;
 view.classList.remove('letter-enter');void view.offsetWidth;view.classList.add('letter-enter');
 bindEvents();
 if(focus)requestAnimationFrame(()=>{const target=view.querySelector('input:not([type="checkbox"]):not([disabled]):not([name="website"]),textarea')||view.querySelector('#letter-title');if(target?.isConnected)target.focus({preventScroll:true})});
}
function showError(message){alert=message;const el=document.querySelector('#letter-error');el.textContent=message;el.hidden=false;view.querySelector('input:not([type="checkbox"]):not([disabled]),textarea')?.setAttribute('aria-invalid','true');el.scrollIntoView({block:'nearest',behavior:'smooth'})}
function edit(key){if(busy)return;returnToReview=current==='review'&&key!=='purpose';current=key;alert='';render()}
function next(){
 const error=validateField(current,answers);if(error){showError(error);return}
 alert='';if(returnToReview){returnToReview=false;current='review'}else{const steps=stepsFor(answers);current=steps[steps.indexOf(current)+1]||'review'}render();
}
async function submit(){
 if(busy)return;const error=stepsFor(answers).map(key=>validateField(key,answers)).find(Boolean);if(error){showError(error);return}
 if(!configuredEndpoint(letterConfig)){showError('편지함 연결을 준비하고 있어요. 잠시 후 다시 방문해주세요.');return}
 if(answers.website?.trim()){showError('입력 내용을 확인한 뒤 다시 시도해주세요.');return}
 const submitted=structuredClone(answers);
 busy=true;current='done';alert='';history.innerHTML='';render();
 const result=await sendLetter(submitted,letterConfig);busy=false;
 if(result.ok){answers={};render({focus:false})}
 else{answers=submitted;current='review';alert=result.message;render({focus:false});document.querySelector('#letter-error')?.scrollIntoView({block:'nearest'})}
}
function bindEvents(){
 view.querySelector('#letter-form')?.addEventListener('submit',event=>{event.preventDefault();if(!busy)(current==='review'?submit():next())});
 view.querySelectorAll('input:not([type="checkbox"]),textarea').forEach(input=>input.addEventListener('input',()=>{setAnswer(answers,input.name,input.value);input.removeAttribute('aria-invalid');const count=document.querySelector('#letter-counter');if(count&&input.tagName==='TEXTAREA')count.textContent=input.value.length.toLocaleString()+' / 3,000'}));
 view.querySelectorAll('[data-consent]').forEach(input=>input.addEventListener('change',()=>{answers[input.dataset.consent]=input.checked;const status=view.querySelector('.letter-id-status');if(status)status.textContent=answers.studentIdConsent?'선택 동의함 · 전달할게요':'동의하지 않으면 학번은 빼고 보내요'}));
 view.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{if(busy)return;const {choice,value}=button.dataset;setAnswer(answers,choice,choice==='research'?toggleResearch(answers.research||[],value):value);if(choice==='time'&&value===timeSlots[2])delete answers.date;alert='';if(choice==='grade'||choice==='purpose'){next();return}render({focus:false});if(choice==='research'&&value==='직접 적을게요'&&(answers.research||[]).includes(value))view.querySelector('#answer-researchOther')?.focus()});
 view.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>edit(button.dataset.edit));history.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>edit(button.dataset.edit));
 view.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>{if(busy)return;const action=button.dataset.action;alert='';if(action==='start'){current='name';render()}else if(action==='back'){returnToReview=false;const steps=stepsFor(answers);current=steps[steps.indexOf(current)-1]||'intro';render()}else if(action==='skip'){setAnswer(answers,'studentId','');next()}else if(action==='exploring'){setAnswer(answers,'motivation','아직 동기를 정리하고 있어요.');next()}else if(action==='restart'){answers={};current='intro';returnToReview=false;render()}});
}
render({focus:false});
