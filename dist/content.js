import {officialRecords} from './official.js?v=20261024';
import {memberProfiles,professorSource} from './interactions.js?v=20261024';
export const official='https://conict.seoultech.ac.kr';
export const pageLinks={
 ...Object.fromEntries(Object.entries(memberProfiles).map(([id,p])=>[id,p.github||p.page||professorSource])),
 m1:'https://sebeen-yoon-research.paul020600.chatgpt.site/',
 m2:'https://sangmin9242.github.io/ko.html',
 m7:'https://kenny-0209.github.io/kyeongsoon-orbit/?v=20261018'
};
// Keep existing personal sites; other computers open the member's published GitHub.
export const albums=[
 {id:'space',name:'공간 스냅',subtitle:'사진으로 만나는 우리의 연구실',type:'photos'},
 {id:'conference',name:'현장·학회',subtitle:'연구실 밖에서 함께한 활동',type:'records'},
 {id:'highlights',name:'연구실 소식',subtitle:'공식 홈페이지에 남겨 둔 순간들',type:'records'},
 {id:'workshop',name:'워크숍·세미나',subtitle:'함께 배우고 이야기하는 시간',type:'records'}
];
const photoNames=['입구의 대형 TV','작은 주방','흰색 프레임의 자리','함께 일하는 연구실','노트북과 모니터','연구원의 책상','세 대의 모니터','함께 앉는 테이블','자리에서 바라본 연구실','연구원 공간 전경','창가의 연구원 자리','프린터와 창가 수납장','교수실의 이동식 TV','교수실·미팅 공간','교수실의 보조 테이블','교수실 입구','두 방을 잇는 문','연구실 앨범 TV','입구에서 본 연구실'];
export const photos=photoNames.map((title,i)=>({title,src:'./assets/room-'+String(i+1).padStart(2,'0')+'.jpg',caption:'제공해 주신 연구실 공간 사진 · 3D 모델의 참고 사진'}));
export const records=officialRecords;
export const galleryFallback={workshop:official+'/subList/20000008501',conference:official+'/subList/20000008503',highlights:official+'/subList/20000008502'};
export const tourStops=[
 {id:'welcome',eyebrow:'01 · WELCOME',title:'연구실에 오신 걸 환영해요',description:'526호 연구생 공간과 501호 교수님방이 이어진 연구실입니다. 문, 컴퓨터, 사람, 책장과 두 방의 모니터를 둘러보세요.',action:'손님으로 들어가기',type:'welcome',object:'d2'},
 {id:'desks',eyebrow:'02 · OUR SPACE',title:'생각이 자라는 자리',description:'일곱 개의 연구원 자리. 모니터, 책상과 익숙한 소품이 각자의 공간을 만듭니다. 컴퓨터를 누르면 그 자리의 주인을 만날 수 있어요.',action:'연구원 자리 둘러보기',type:'desks',object:'seat-s4'},
 {id:'people',eyebrow:'03 · SAY HELLO',title:'사람이 있는 연구실',description:'아바타에게 인사를 건네 보세요. 짧은 자기소개와 공식 홈페이지에 소개된 연구 분야를 들려드립니다.',action:'구성원에게 인사하기',type:'people',object:'seat-s3'},
 {id:'tv',eyebrow:'04 · LAB ALBUM',title:'큰 화면 속 우리 이야기',description:'526호와 501호 모니터에서 연구실 소개와 연구 분야, 논문, 실제 활동 사진을 볼 수 있어요. 수상·성과 기록은 책장에 모았습니다.',action:'연구실 모니터 열기',type:'media',object:'f13'},
 {id:'achievements',eyebrow:'05 · ACHIEVEMENTS',title:'책장에 모인 우리의 성과',description:'책장에서 연구실의 수상, 우수 논문, 과제 선정 기록과 실제 사진을 확인해 보세요.',action:'수상·성과 보기',type:'achievements',object:'f21'},
 {id:'professor',eyebrow:'06 · PROFESSOR',title:'교수님께 인사드리기',description:'연결된 문을 지나면 501호 교수님방이 나옵니다. 김태훈 교수님의 자리에서 연구실의 지도교수를 만나 보세요.',action:'김태훈 교수님께 인사하기',type:'person',object:'seat-s8'},
 {id:'prof-monitor',eyebrow:'07 · LAB MONITOR',title:'501호의 연구실 모니터',description:'교수님방의 모니터에서도 연구실 소개, 연구 분야, 구성원과 실제 활동 사진을 살펴볼 수 있습니다.',action:'교수님방 모니터 열기',type:'media',object:'f23'}
];
