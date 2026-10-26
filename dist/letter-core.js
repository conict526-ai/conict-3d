export const purposes={counsel:{label:'상담하고 싶어요',short:'상담',hint:'진로, 연구, 대학원 이야기를 나눠요.'},question:{label:'궁금한 게 있어요',short:'문의',hint:'작은 궁금증도 편하게 물어보세요.'},join:{label:'함께 연구하고 싶어요',short:'연구 참여',hint:'관심과 시작하고 싶은 이야기를 들려주세요.'}};
export const grades=['1학년','2학년','3학년','4학년','대학원생','기타'];
export const timeSlots=['오전 09:00–12:00','오후 13:00–18:00','시간을 함께 정하고 싶어요'];
export const researchAreas=['건설 로보틱스','건설 영상·컴퓨터 비전','로봇 학습','작업계획·공정 최적화','직접 적을게요','아직 탐색 중이에요'];
import {privacyPolicy,deletionDeadline,koreanTimestamp} from './letter-privacy.js?v=privacy20261025c';
export const branchFields=['topic','date','time','question','motivation','research','researchOther'];
const clean=value=>typeof value==='string'?value.trim():'';
export function todayKST(now=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`}
export function stepsFor(a){return ['name','studentId','grade','purpose',...(a.purpose==='counsel'?['topic','schedule']:a.purpose==='question'?['question']:a.purpose==='join'?['motivation','research']:[]),'email','review']}
export function progressFor(current){return {name:10,studentId:20,grade:30,purpose:40,topic:56,motivation:56,schedule:72,question:72,research:72,email:86,review:100}[current]||0}
export function setAnswer(a,key,value){if(key==='purpose'&&a.purpose!==value)for(const field of branchFields)delete a[field];a[key]=value;a.consent=false;a.overseasConsent=false;a.studentIdConsent=false;return a}
export function toggleResearch(selected,value){if(!researchAreas.includes(value))return selected;const next=selected.includes(value)?selected.filter(v=>v!==value):[...selected,value];return value==='아직 탐색 중이에요'&&next.includes(value)?[value]:next.filter(v=>v!=='아직 탐색 중이에요')}
export function researchText(a){return (a.research||[]).map(v=>v==='직접 적을게요'?clean(a.researchOther):v).filter(Boolean).join(' · ')}
export function validateField(key,a,today=todayKST()){
 const text=clean(a[key]);
 if(key==='name'&&(!text||text.length>40||/[\r\n]/.test(text)))return '이름을 40자 이내로 적어주세요.';
 if(key==='studentId'&&(text.length>20||/[\r\n]/.test(text)))return '학번은 20자 이내로 적어주세요.';
 if(key==='grade'&&!grades.includes(a.grade))return '현재 학년을 골라주세요.';
 if(key==='purpose'&&!Object.hasOwn(purposes,a.purpose))return '보내고 싶은 이야기 하나를 골라주세요.';
 if(['topic','question','motivation'].includes(key)&&(!text||text.length>3000))return '이야기를 3,000자 이내로 적어주세요.';
 if(key==='schedule'){
  if(!timeSlots.includes(a.time))return '희망하는 시간대를 골라주세요.';
  if(a.time!==timeSlots[2]&&!a.date)return '희망하는 날짜도 골라주세요.';
  if(a.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||Number.isNaN(Date.parse(a.date+'T00:00:00Z'))||new Date(a.date+'T00:00:00Z').toISOString().slice(0,10)!==a.date||a.date<today))return '오늘 이후의 날짜를 골라주세요.';
 }
 if(key==='research'){
  if(!Array.isArray(a.research)||!a.research.length||a.research.some(v=>!researchAreas.includes(v)))return '관심 분야나 ‘아직 탐색 중이에요’를 골라주세요.';
  if(a.research.includes(researchAreas.at(-1))&&a.research.length!==1)return '탐색 중이거나 관심 있는 분야 중 하나로 골라주세요.';
  if(a.research.includes('직접 적을게요')&&(!clean(a.researchOther)||clean(a.researchOther).length>1000))return '관심 분야를 1,000자 이내로 적어주세요.';
 }
 if(key==='email'&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)||text.length>254))return '답장받을 이메일 주소를 확인해주세요.';
 if(key==='review'&&a.consent!==true)return '편지 전달을 위한 개인정보 수집·이용에 동의해주세요.';
 if(key==='review'&&a.overseasConsent!==true)return '국외 이전 안내를 확인하고 국외 이전에 동의해주세요.';
 return '';
}
export function letterRows(a){
 const rows=[['name','이름',clean(a.name)],['studentId','학번',clean(a.studentId)||'적지 않았어요'],['grade','학년',a.grade],['purpose','보내는 이야기',purposes[a.purpose]?.short||'']];
 if(a.purpose==='counsel')rows.push(['topic','상담하고 싶은 이야기',clean(a.topic)],['schedule','상담 희망 일정',[a.date,a.time].filter(Boolean).join(' · ')]);
 if(a.purpose==='question')rows.push(['question','궁금한 이야기',clean(a.question)]);
 if(a.purpose==='join')rows.push(['motivation','함께하고 싶은 이유',clean(a.motivation)],['research','관심 있는 연구',researchText(a)]);
 rows.push(['email','답장받을 이메일',clean(a.email)]);return rows;
}
export function mailPayload(a,now=new Date()){
 for(const key of stepsFor(a)){const error=validateField(key,a,todayKST(now));if(error)throw new Error(error)}
 const deadline=deletionDeadline(now),rows=letterRows(a).filter(([key])=>key!=='studentId'||(a.studentIdConsent===true&&clean(a.studentId)));
 const deletionGuide=`[담당자 삭제 기준]\n회신·상담·참여 안내가 끝나면 지체 없이 삭제. 미완료 건도 접수부터 최대 30일 내 삭제.\n최대 삭제기한 참고값: ${koreanTimestamp(deadline)}\n위 값은 작성 기기 시각 기준입니다. Gmail 실제 수신 시각을 확인해 접수부터 30일을 넘기지 마세요.\n받은 원문·보낸 답장·첨부·별도 저장본을 함께 삭제하고, Gmail 휴지통에서도 해당 메일을 영구 삭제하세요.\n계속 상담이 필요하면 기한 전에 새 목적·기간을 안내하고 다시 동의를 받으세요. 자동 삭제 기능은 연결되어 있지 않습니다.`;
 return {email:clean(a.email),name:clean(a.name),_subject:`[CONICT ${purposes[a.purpose].short}] 연구실에 도착한 편지`,message:rows.map(([,label,value])=>`${label}\n${value}`).join('\n\n')+'\n\n'+deletionGuide,유형:purposes[a.purpose].short,개인정보_수집이용_동의:'동의함',국외이전_동의:'동의함',학번_선택동의:a.studentIdConsent===true&&clean(a.studentId)?'동의함':'미동의 또는 미입력 · 학번 전송 제외',안내_버전:privacyPolicy.version,동의_및_전송시각:now.toISOString(),최대_삭제기한:deadline.toISOString(),_gotcha:clean(a.website)};
}
export function configuredEndpoint(config){return /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(config.endpoint||'')}
export async function sendLetter(a,config,fetcher=fetch,{timeoutMs=25000}={}){
 if(!configuredEndpoint(config))return {ok:false,kind:'setup',message:'편지함 연결을 준비하고 있어요. 잠시 후 다시 방문해주세요.'};
 let payload;try{payload=mailPayload(a)}catch(error){return {ok:false,kind:'validation',message:error.message}}
 if(payload._gotcha)return {ok:false,kind:'validation',message:'입력 내용을 확인한 뒤 다시 시도해주세요.'};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetcher(config.endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal,credentials:'omit',keepalive:true,referrerPolicy:'strict-origin-when-cross-origin'});
  let body;try{body=await response.json()}catch{}
  if(response.ok&&body?.ok===true)return {ok:true};
  if(response.status===429)return {ok:false,kind:'limit',message:'편지가 잠시 몰리고 있어요. 조금 기다렸다가 다시 보내주세요.'};
  return {ok:false,kind:'service',message:'편지가 접수되지 않았어요. 입력 내용은 남아 있으니 잠시 후 다시 시도해주세요.'};
 }catch(error){return {ok:false,kind:'uncertain',message:'연결이 끊겨 전송 결과를 확인하지 못했어요. 중복 접수를 피하려면 연구실에 확인한 뒤 다시 보내주세요.'}}finally{clearTimeout(timer)}
}
