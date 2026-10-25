// Object roles and public introductions shared by the tour and its checks.
export const memberSource='https://conict.seoultech.ac.kr/subList/20000005912';
export const professorSource='https://conict.seoultech.ac.kr/subList/20000008500';
export const memberProfiles={
 m1:{github:'https://github.com/SebeenYoon',research:'건설자동감리 및 자동화'},
 m2:{github:'https://github.com/Sangmin9242',bio:'서울과학기술대학교 일반대학원 건축과 석사과정 이상민입니다.\n컴퓨터 비전과 로봇 기술을 활용한 건설 자동화 분야를 연구하고 있습니다.',research:'건설 자동화 · 건설 로보틱스 · 컴퓨터 비전'},
 m3:{github:'https://github.com/baebling',bio:'건설현장의 안전성과 생산성을 높이기 위한 건설 자동화 및 로봇 기술을 연구하고 있습니다. 현장의 요구와 작업자의 경험을 반영한 로봇 설계와 작업 자동화에 관심을 두고 있습니다.',research:'로봇 작업계획 및 공정 최적화 · 건설 영상 기반 로봇 학습'},
 m4:{github:'https://github.com/Minseung1129',research:'건설자동감리 및 자동화'},
 m5:{github:'https://github.com/wesamhashim24',research:'건설자동감리 및 자동화'},
 m6:{github:'https://github.com/abrorbek-ai',research:'건설자동감리 및 자동화'},
 m7:{github:'https://github.com/Kenny-0209',research:'건설자동감리 및 자동화'},
 m8:{page:professorSource,research:'건축 ICT · 로보틱스, 컴퓨터 비전, 건설 공정 및 시공 관리'}
};
// Some official anchor hrefs point to a different member. Use the displayed
// GitHub username belonging to each member, archived in the dated source HTML.
export function introduction(person){return memberProfiles[person.id]?.bio||(person.professor?'CONICT 연구실의 지도교수 '+person.name+'입니다.':'CONICT 연구실에 다니는 '+person.name+'입니다.')}
export function researchIntroduction(person){const field=memberProfiles[person.id]?.research;return field?field+' 분야를 연구하고 있습니다.':'연구 분야는 공식 구성원 소개에서 확인해 주세요.'}
export const roomLabels={r1:'526호 · 연구생 공간',r2:'501호 · 교수님방'};
export function applyRoomLabels(layout){for(const room of layout.rooms)if(roomLabels[room.id])room.name=roomLabels[room.id];return layout}
export function interactionType(object,part='object'){
 if(object.kind==='door')return 'door';
 if(object.kind==='seat')return part==='person'?'person':'computer';
 if(object.kind==='bookshelf')return 'achievements';
 if(['media-tv','cat','tv','monitors'].includes(object.kind))return 'media';
 return null;
}
