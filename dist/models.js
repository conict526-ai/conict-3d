import * as T from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {createHuman} from './human.js';
import {yoonAvatar} from './yoon.js';
import {leeAvatar} from './lee.js';
import {memberAvatar} from './member-rigs.js';
import {WALL_HEIGHT,defaultLayout,allWalls,wallById,renderWalls,openingsOnWall,wallLength,wallBlocks,doorPoses,doorPassage,contains,roomBounds,area} from './layout.js';

const palette={white:'#e9e9e1',metal:'#bdc4c2',black:'#272f34',wood:'#c59760',mint:'#78a7a4',grey:'#a9b1af',blue:'#40586a'};
const V=(x,y,z)=>new T.Vector3(x,y,z);
export function kit(mode='polygon'){
 const voxel=mode==='voxel', materials=new Map(), geometry=new Map();
 function mat(color,extra={}){let k=color+JSON.stringify(extra);if(!materials.has(k))materials.set(k,new T.MeshStandardMaterial({color,roughness:.78,metalness:.02,...extra}));return materials.get(k)}
 function mesh(g,geo,color,pos=[0,0,0],extra={}){const m=new T.Mesh(geo,mat(color,extra));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
 function box(g,size,pos,color,r=.025){let [w,h,d]=size;const k=size.join(',')+r+mode;let geo=geometry.get(k);if(!geo){geo=voxel||r===0?new T.BoxGeometry(w,h,d):new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3));geometry.set(k,geo)}return mesh(g,geo,color,pos)}
 function instances(g,points,unit,color){const geo=new T.BoxGeometry(unit*.97,unit*.97,unit*.97);const m=new T.InstancedMesh(geo,mat(color),points.length),mt=new T.Matrix4();points.forEach((p,i)=>{mt.makeTranslation(...p);m.setMatrixAt(i,mt)});m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
 function ell(g,scale,pos,color,detail=20){if(voxel){const u=Math.max(.025,Math.min(...scale)/4),pts=[];let [a,b,c]=scale;for(let x=-a;x<=a;x+=u)for(let y=-b;y<=b;y+=u)for(let z=-c;z<=c;z+=u){const q=x*x/(a*a)+y*y/(b*b)+z*z/(c*c);if(q<=1&&q>Math.max(0,1-u*3/Math.min(a,b,c)))pts.push([x+pos[0],y+pos[1],z+pos[2]])}return instances(g,pts,u,color)}const m=mesh(g,new T.SphereGeometry(1,detail,Math.max(12,detail/2)),color,pos);m.scale.set(...scale);return m}
 function cyl(g,r,h,pos,color,rt=r){return mesh(g,new T.CylinderGeometry(rt,r,h,voxel?8:24),color,pos)}
 function rod(g,a,b,r,color,rt=r){a=V(...a);b=V(...b);let m=cyl(g,r,a.distanceTo(b),a.clone().add(b).multiplyScalar(.5).toArray(),color,rt);m.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());return m}
 function curve(g,points,r,color){const path=new T.CatmullRomCurve3(points.map(p=>V(...p)));if(voxel){let pts=path.getPoints(Math.max(8,Math.ceil(path.getLength()/.035)));return instances(g,pts.map(p=>p.toArray()),Math.max(.025,r*2),color)}return mesh(g,new T.TubeGeometry(path,Math.max(16,points.length*6),r,6,false),color)}
 function loft(g,rings,color,n=24){
   // Every ring describes its actual sculpted cross section; clothing is one continuous surface.
   if(voxel){let pts=[],u=.032;for(let y=rings[0].y;y<=rings.at(-1).y;y+=u){let a=rings[0],b=rings.at(-1);for(let j=0;j<rings.length-1;j++)if(y>=rings[j].y&&y<=rings[j+1].y){a=rings[j];b=rings[j+1];break}let t=(y-a.y)/(b.y-a.y||1),rx=a.x+(b.x-a.x)*t,rz=a.z+(b.z-a.z)*t,cx=(a.cx||0)+((b.cx||0)-(a.cx||0))*t,cz=(a.cz||0)+((b.cz||0)-(a.cz||0))*t;for(let x=-rx;x<=rx;x+=u)for(let z=-rz;z<=rz;z+=u){let q=x*x/(rx*rx)+z*z/(rz*rz);if(q<=1&&q>Math.max(0,1-u*3/Math.min(rx,rz)))pts.push([cx+x,y,cz+z])}}return instances(g,pts,u,color)}
   let p=[],uv=[],idx=[];rings.forEach((r,j)=>{for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;const fold=(r.fold||0)*Math.cos(a*7+j*.7);p.push((r.cx||0)+(r.x+fold)*Math.cos(a),r.y,(r.cz||0)+(r.z+fold)*Math.sin(a));uv.push(i/n,j/(rings.length-1))}});for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1)}for(let i=1;i<n-1;i++){idx.push(0,i+1,i);let b=(rings.length-1)*(n+1);idx.push(b,b+i,b+i+1)}let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,color,[0,0,0],{side:T.DoubleSide})
 }
 function patch(g,points,color){let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setIndex(points.length===4?[0,1,2,0,2,3]:[0,1,2]);geo.computeVertexNormals();return mesh(g,geo,color,[0,0,0],{side:T.DoubleSide})}
 function segment(g,a,b,r1,r2,color){let d=V(...b).sub(V(...a)),len=d.length(),group=new T.Group();group.position.set(...a);group.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());g.add(group);loft(group,[{y:0,x:r1,z:r1*.87},{y:len*.18,x:r1*1.03,z:r1*.94,fold:.003},{y:len*.50,x:(r1+r2)/2,z:(r1+r2)*.45,fold:.005},{y:len*.85,x:r2*1.07,z:r2*.96,fold:.003},{y:len,x:r2,z:r2*.87}],color,16);return group}
 function ring(g,r,t,pos,color,rotation=[Math.PI/2,0,0]){let m=mesh(g,new T.TorusGeometry(r,t,voxel?4:8,voxel?12:32),color,pos);m.rotation.set(...rotation);return m}
 function sweep(g,points,radii,color){const path=new T.CatmullRomCurve3(points.map(p=>V(...p))),count=28,n=20,frames=path.computeFrenetFrames(count,false),p=[],uv=[],idx=[];let pts=[];for(let j=0;j<=count;j++){const t=j/count,at=path.getPoint(t),r=radii[0]+(radii[1]-radii[0])*t,fold=(j===14?.004:.001);for(let i=0;i<=n;i++){let a=i/n*Math.PI*2,rr=r+fold*Math.sin(a*5+j*.5),v=at.clone().addScaledVector(frames.normals[j],Math.cos(a)*rr).addScaledVector(frames.binormals[j],Math.sin(a)*rr*.91);p.push(...v.toArray());uv.push(i/n,t);if(voxel&&i<n)pts.push(v.toArray().map(v=>Math.round(v/.025)*.025))}}if(voxel)return instances(g,pts,.029,color);for(let j=0;j<count;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,b,a+1,b+1)}let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,color,[0,0,0],{side:T.DoubleSide})}
 return {mode,voxel,mat,mesh,box,ell,cyl,rod,curve,loft,patch,segment,ring,instances,sweep};
}

export function avatar(k,person,seated=false){return person.id==='m1'?yoonAvatar(()=>createHuman(k,person,seated),seated):person.id==='m2'?leeAvatar(()=>createHuman(k,person,seated),seated):memberAvatar(()=>createHuman(k,person,seated),person,seated)}

export function chair(k,white=false,meeting=false){
 const g=new T.Group(),{box,cyl,rod,curve,ell}=k;const frame=white?'#dddeda':'#293138',cloth=white?'#78a6a3':meeting?'#47617c':'#343e43';
 box(g,[.49,.085,.46],[0,.465,0],cloth,.07);cyl(g,.044,.26,[0,.285,0],palette.metal);cyl(g,.073,.11,[0,.18,0],frame);
 for(let i=0;i<5;i++){let a=i/5*Math.PI*2,x=Math.sin(a)*.29,z=Math.cos(a)*.29;rod(g,[0,.19,0],[x,.105,z],.026,frame);let w=cyl(g,.036,.031,[x,.045,z],frame);w.rotation.z=Math.PI/2;let w2=cyl(g,.036,.031,[x+.035,.045,z],frame);w2.rotation.z=Math.PI/2}
 const points=[[-.22,.57,.225],[-.255,.75,.24],[-.27,1.05,.295],[-.22,1.13,.32],[.22,1.13,.32],[.27,1.05,.295],[.255,.75,.24],[.22,.57,.225]];
 curve(g,points,.022,frame);curve(g,[[-.22,.57,.225],[0,.54,.235],[.22,.57,.225]],.022,frame);
 // Curved, individually woven backrest with open mesh gaps.
 for(let i=0;i<=20;i++){let x=-.225+i*.0225;curve(g,[[x,.60,.23+Math.abs(x)*.13],[x,.80,.22+Math.abs(x)*.18],[x,1.08,.28+Math.abs(x)*.14]],.0038,white?'#adb8b4':'#657172')}
 for(let y=.61;y<1.09;y+=.024)curve(g,[[-.225,y,.225+(.24-y)*-.11],[0,y,.216+(y-.6)*.12],[.225,y,.225+(.24-y)*-.11]],.0034,white?'#b4beb9':'#566567');
 if(!meeting){box(g,[.11,.27,.045],[0,.67,.29],frame);rod(g,[0,1.08,.32],[0,1.28,.33],.026,frame);box(g,[.36,.16,.08],[0,1.27,.33],frame,.06)}
 for(let s of [-1,1]){rod(g,[s*.22,.47,.10],[s*.31,.74,.04],.022,frame);box(g,[.11,.045,.31],[s*.30,.75,-.07],frame,.018)}return g;
}
function screenTexture(active,theme=0){let c=document.createElement('canvas');c.width=512;c.height=320;let x=c.getContext('2d');x.fillStyle=active?['#173b43','#25314b','#274244'][theme%3]:'#172128';x.fillRect(0,0,512,320);if(active){x.fillStyle='#6cb9ba';x.fillRect(0,0,512,13);x.fillStyle='#1a2a32';x.fillRect(12,27,100,280);for(let i=0;i<8;i++){x.fillStyle=i%3===0?'#86bcaf':'#506b75';x.fillRect(27,42+i*27,45+i%3*19,5)}x.fillStyle='#f0eee3';x.fillRect(129,29,365,274);x.fillStyle='#47727d';x.fillRect(145,49,200,9);for(let i=0;i<11;i++){x.fillStyle=i%4===0?'#95bdb9':'#bcc9c9';x.fillRect(145,77+i*17,60+(i*23)%230,4)}x.fillStyle='#b7c9c9';x.fillRect(363,216,26,46);x.fillStyle='#558882';x.fillRect(398,196,25,66);x.fillStyle='#d2a678';x.fillRect(433,177,25,85)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
export function monitors(k,active=true,prof=false){const g=new T.Group(),{box,rod,cyl}=k;const arr=prof?[[-.36,1.09,.025,.64,.38,false],[.36,1.09,.025,.64,.38,false]]:[[-.52,1.115,0,.37,.61,true],[0,1.15,-.04,.62,.37,false],[.60,1.15,0,.62,.37,false]];arr.forEach(([x,y,z,w,h,portrait],i)=>{const a=new T.Group();a.position.set(x,y,z);a.rotation.y=x<-.4?.13:x>.4?-.13:0;g.add(a);box(a,[w+.026,h+.026,.043],[0,0,0],palette.black,.012);let pl=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:screenTexture(active,i)}));pl.position.z=.023;pl.userData.screen=true;a.add(pl);box(a,[.065,.018,.013],[0,-h/2+.012,.024],'#4d595c',.002);rod(g,[x,.768,z-.08],[x,y-.05,z-.055],.018,palette.metal);box(g,[.22,.023,.13],[x,.751,z+.01],'#455456',.015);if(i===1){box(a,[w*.91,.018,.023],[0,h/2+.038,.035],'#303c3e',.007);box(a,[.09,.035,.035],[0,h/2+.02,0],'#263237');cyl(a,.010,.008,[0,h/2+.018,.024],'#729b99')}});return g}
export function tower(k,active=true){let g=new T.Group();k.box(g,[.245,.48,.445],[0,.26,0],'#263035',.025);k.box(g,[.222,.43,.011],[0,.28,.228],'#20272c',.014);for(let y=.15;y<.47;y+=.13){k.ring(g,.047,.004,[0,y,.24],active?'#88c4c0':'#566466',[0,0,0]);for(let i=0;i<6;i++){let a=i*Math.PI/3;k.rod(g,[0,y,.24],[Math.sin(a)*.038,y+Math.cos(a)*.038,.24],.003,'#667979')}}for(let x=-.09;x<.10;x+=.018)k.box(g,[.005,.013,.29],[x,.511,-.01],'#3a494c',.001);k.ell(g,[.006,.002,.006],[.07,.514,.14],active?'#86c4bf':'#52636a');return g}
export function desk(k){const g=new T.Group();g.name='높이 조절 책상';g.userData.furnitureType='desk';k.box(g,[1.60,.065,.80],[0,.741,0],palette.white,.036);for(let s of [-1,1]){k.box(g,[.085,.41,.095],[s*.64,.27,0],palette.white,.012);k.box(g,[.067,.245,.075],[s*.64,.585,0],'#c9d0cd',.005);k.box(g,[.095,.055,.71],[s*.64,.048,0],palette.white,.018)}k.box(g,[1.22,.06,.075],[0,.643,0],palette.metal,.008);k.box(g,[.20,.022,.067],[.58,.705,.36],palette.white,.018);k.box(g,[.045,.012,.02],[.635,.704,.397],'#3c575f',.002);return g}
export function partition(k){let g=new T.Group();k.box(g,[1.62,.55,.047],[0,1.01,0],'#a4aeaa',.035);for(let s of [-1,1]){k.box(g,[.035,.15,.12],[s*.57,.79,0],palette.white,.008)}for(let i=0;i<3;i++)k.box(g,[.10,.10,.003],[.44-i*.115,1.055,.027],['#aeced0','#d7c4a0','#c4d1b9'][i],.001);return g}
export function table(k,prof=false){
 const g=new T.Group(),lift=prof?0:.12;
 // Raise the lab tabletop above the chair arms; keep the feet on the floor.
 k.box(g,[prof?2.1:2.00,.065,prof?.85:.95],[0,.74+lift,0],prof?'#c3945d':'#d4c29f',.065);
 for(const x of [-.72,.72])for(const z of [-.30,.30])k.rod(g,[x,.705+lift,z],[x*1.10,.05,z*1.13],.025,prof?'#a7b6b7':palette.white);
 k.cyl(g,.12,.015,[0,.783+lift,0],'#dbe2dc');
 for(let i=0;i<5;i++)k.box(g,[.037,.022,.05],[(i-2)*.035,.80+lift,(i%2)*.04],'#6d9f9e',.006);
 return g;
}
// Straight wall-side table visible beside the coat stand in room photo 14.
export function wallTable(k){
 const g=new T.Group();g.name='professor wall-side table';
 k.box(g,[1.408,.014,.608],[0,.695,0],'#3b3b37',.006);
 k.box(g,[1.40,.04,.60],[0,.72,0],'#c79e6a',.015);
 const frame=new T.Group();frame.name='dark support frame';g.add(frame);
 for(const x of [-.61,.61])for(const z of [-.235,.235]){
  k.box(frame,[.045,.655,.045],[x,.36,z],'#3b403e',.006);
  k.box(frame,[.056,.033,.056],[x,.0165,z],'#282e2c',.003);
 }
 for(const x of [-.61,.61])k.box(frame,[.035,.055,.48],[x,.66,0],'#454942',.003);
 k.box(frame,[1.22,.055,.035],[0,.66,-.235],'#454942',.003);
 k.box(frame,[1.20,.31,.025],[0,.49,-.215],'#555750',.003);
 for(let i=0;i<5;i++)k.box(g,[1.18,.001,.0015],[0,.7405,-.18+i*.08],i%2?'#bf9662':'#cda877',.0001);
 return g;
}
export function bookshelf(k){let g=new T.Group();const c='#b68b5c';k.box(g,[1.5,1.91,.055],[0,1.005,-.18],c,.003);for(let x of [-.75,-.25,.25,.75])k.box(g,[.038,1.93,.37],[x,1.02,0],c,.004);for(let y of [.08,.47,.86,1.25,1.64,1.99])k.box(g,[1.53,.033,.37],[0,y,0],c,.004);for(let row=0;row<4;row++)for(let j=0;j<10;j++){let x=-.65+j*.126;if(row===1&&j>3&&j<7)continue;let h=.24+(j%3)*.022;k.box(g,[.042+j%3*.006,h,.19],[x,.50+row*.39+h/2,.035],['#ece7d5','#526b74','#91704d','#7d8d7e','#cfbd92'][j%5],.004);k.box(g,[.025,.004,.007],[x,.58+row*.39,.133],'#e6dcc4',.001)}k.box(g,[.46,.37,.019],[-.50,.27,.196],'#c49b6a');k.cyl(g,.012,.024,[-.36,.31,.22],palette.metal).rotation.x=Math.PI/2;return g}
export function cabinet(k){let g=new T.Group();k.box(g,[2.19,.74,.37],[0,.42,0],palette.white);k.box(g,[2.24,.042,.40],[0,.81,0],'#f2f0e6');for(let i=0;i<5;i++)k.box(g,[.431,.72,.024],[-.875+i*.439,.424,.2],'#e9eae2',.004);return g}
export function purifier(k){let g=new T.Group();for(let j=0;j<2;j++){let y=.25+j*.47;k.cyl(g,.18,.40,[0,y,0],'#d1d7d3');k.cyl(g,.182,.035,[0,y+.216,0],'#303b42');for(let i=0;i<48;i++){let a=i/48*Math.PI*2;k.rod(g,[.183*Math.sin(a),y-.17,.183*Math.cos(a)],[.183*Math.sin(a),y+.17,.183*Math.cos(a)],.0027,'#60716d')}k.ring(g,.147,.004,[0,y+.235,0],'#789fdf');k.cyl(g,.11,.025,[0,y+.224,0],'#414b50')}return g}
export function sideTable(k){
 const g=new T.Group();g.name='professor side table';
 const width=1.30,depth=.65,r=depth/2,shape=new T.Shape();
 shape.moveTo(-width/2+r,-r);shape.lineTo(width/2,-r);shape.lineTo(width/2,r);shape.lineTo(-width/2+r,r);
 if(k.voxel){
  // Stepped silhouette for the voxel version of the half-rounded end.
  const unit=.035;
  for(let i=1;i<=20;i++){const a=Math.PI/2+i*Math.PI/20,x=Math.max(-width/2,Math.round((-width/2+r+Math.cos(a)*r)/unit)*unit),z=Math.round(Math.sin(a)*r/unit)*unit,last=shape.currentPoint;shape.lineTo(x,last.y);shape.lineTo(x,z)}
 }else shape.absarc(-width/2+r,0,r,Math.PI/2,Math.PI*1.5,false);
 shape.closePath();
 function top(name,thickness,y,color){const m=k.mesh(g,new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:false,curveSegments:24}),color,[0,y,0]);m.name=name;m.rotation.x=Math.PI/2;return m}
 top('dark edge band',.024,.726,'#41464d');top('rounded wood countertop',.024,.75,'#cfa166');
 k.cyl(g,.048,.665,[-.30,.367,0],'#282e32');k.cyl(g,.052,.024,[-.30,.025,0],'#22272b');
 // The grey pedestal has an open shelf facing inward and a solid outer panel.
 const pedestal=new T.Group();pedestal.name='grey storage pedestal';g.add(pedestal);
 k.box(pedestal,[.025,.665,.58],[.588,.365,0],'#575b60',.002);
 k.box(pedestal,[.34,.665,.025],[.43,.365,-.277],'#484e54',.002);
 k.box(pedestal,[.34,.665,.025],[.43,.365,.277],'#565b61',.002);
 for(const y of [.06,.30,.52,.695])k.box(pedestal,[.34,.022,.55],[.43,y,0],'#444b52',.002);
 for(const x of [.30,.55])k.box(pedestal,[.045,.03,.49],[x,.025,0],'#30363b',.002);
 for(let i=0;i<4;i++)k.box(pedestal,[.24,.016,.27],[.427,.54+i*.018,.03],['#b2b5ae','#d1c9b9','#89958f','#c2beaf'][i],.001);
 const plant=new T.Group();plant.name='grey potted plant';plant.position.set(.28,.75,.035);g.add(plant);
 k.cyl(plant,.115,.017,[0,.011,0],'#3c4247');k.cyl(plant,.102,.19,[0,.11,0],'#62696a',.116);k.cyl(plant,.105,.01,[0,.206,0],'#493f34');
 k.curve(plant,[[0,.205,0],[.007,.35,0],[-.004,.51,.008]],.009,'#536947');
 for(let i=0;i<4;i++){const y=.30+i*.05,a=i*2.5,x=Math.sin(a)*.12,z=Math.cos(a)*.075;k.rod(plant,[0,y,0],[x,y+.04,z],.004,'#647c51');const leaf=k.voxel?k.box(plant,[.145,.025,.05],[x,y+.045,z],'#627d49',0):k.ell(plant,[.082,.011,.028],[x,y+.045,z],'#627d49');leaf.name='plant leaf '+(i+1);leaf.rotation.y=-a;leaf.rotation.z=.25*Math.sin(a)}
 const basket=new T.Group();basket.name='snack basket';basket.position.set(-.32,.75,-.07);g.add(basket);
 for(const x of [-.13,.13])k.box(basket,[.019,.067,.015],[x,.034,0],'#30373b',.002);
 k.box(basket,[.31,.018,.20],[0,.074,0],'#4a4f51',.003);k.box(basket,[.285,.03,.175],[0,.094,0],'#b9b5a7',.004);
 for(const x of [-.144,.144])k.box(basket,[.012,.057,.19],[x,.126,0],'#b6b2a5',.002);
 for(const z of [-.088,.088])k.box(basket,[.30,.057,.012],[0,.126,z],'#b6b2a5',.002);
 for(let i=0;i<12;i++){const packet=k.box(basket,[.017,.06,.025],[-.115+(i%6)*.045,.136,Math.floor(i/6)*.05-.02],['#d5d9d4','#877b7f','#b85545','#5d7381'][i%4],.002);packet.rotation.z=(i%3-1)*.18}
 return g;
}
export function labPurifier(k){
 const g=new T.Group();g.name='single-body air purifier';
 k.cyl(g,.225,.63,[0,.345,0],'#eeeae2',.245);
 k.cyl(g,.215,.035,[0,.028,0],'#c7ceca');
 k.cyl(g,.251,.025,[0,.674,0],'#38404a');
 k.ring(g,.251,.006,[0,.691,0],'#739cf9');
 k.cyl(g,.262,.03,[0,.714,0],'#485056');
 k.cyl(g,.048,.13,[0,.796,0],'#525d62');
 for(let i=0;i<5;i++){
  const a=i/5*Math.PI*2,blade=k.box(g,[.10,.012,.15],[.115*Math.sin(a),.79,.115*Math.cos(a)],'#9ba9aa',.008);blade.rotation.y=a+.45;
 }
 // The reference has a broad translucent fan head above one white tapered body.
 k.mesh(g,new T.CylinderGeometry(.269,.266,.17,k.voxel?12:32,1,true),'#ced6d9',[0,.791,0],{transparent:true,opacity:.35,side:T.DoubleSide});
 k.ring(g,.22,.014,[0,.885,0],'#c6c9c7');
 k.cyl(g,.065,.02,[0,.897,0],'#343d42');
 for(let i=0;i<24;i++){
  const a=i/24*Math.PI*2;
  k.rod(g,[.072*Math.sin(a),.898,.072*Math.cos(a)],[.222*Math.sin(a),.898,.222*Math.cos(a)],.003,'#767e80');
  k.rod(g,[.255*Math.sin(a),.723,.255*Math.cos(a)],[.255*Math.sin(a),.86,.255*Math.cos(a)],.0035,'#292f35');
 }
 for(let i=0;i<5;i++)k.box(g,[.025,.006,.0015],[-.045+i*.022,.635,.244],'#a7b2ad',.001);
 return g;
}
export function woodCabinet(k){
 const g=new T.Group();g.name='wood storage module';
 k.box(g,[.59,.69,.405],[0,.39,0],'#d4bc98',.006);
 k.box(g,[.62,.04,.43],[0,.75,0],'#e1d4bb',.005);
 k.box(g,[.555,.635,.02],[0,.391,.212],'#d9c5a5',.003);
 k.box(g,[.57,.035,.39],[0,.035,0],'#b7ac97',.002);
 k.rod(g,[.205,.54,.222],[.205,.54,.237],.014,'#eeeae1');
 return g;
}
export function coffeeCabinet(k){
 const g=new T.Group();g.name='black coffee cabinet';
 k.box(g,[1.11,.70,.45],[0,.395,0],'#2d3032',.006);
 k.box(g,[1.15,.04,.48],[0,.76,0],'#414244',.004);
 k.box(g,[1.04,.045,.40],[0,.045,0],'#22272a',.002);
 for(let i=0;i<3;i++){
  const y=.18+i*.20;k.box(g,[.52,.19,.02],[-.275,y,.234],'#353638',.002);
  k.rod(g,[-.355,y+.027,.253],[-.20,y+.027,.253],.008,'#8b8d88');
 }
 k.box(g,[.515,.615,.02],[.275,.387,.234],'#303437',.002);
 k.rod(g,[.08,.40,.253],[.08,.49,.253],.008,'#8b8d88');
 return g;
}
export function sofa(k){
 const g=new T.Group();g.name='Three-seat lounge sofa';
 const fabric='#667d70',edge='#4c6358',cushion='#85998a';
 for(const x of [-.91,.91])for(const z of [-.32,.32])k.box(g,[.075,.17,.075],[x,.095,z],'#715641',.009);
 k.box(g,[2.10,.21,.87],[0,.24,0],edge,.07);
 k.box(g,[2.10,.48,.18],[0,.62,-.37],fabric,.075);
 for(const x of [-1,1])k.box(g,[.16,.41,.92],[x,.435,0],fabric,.055);
 for(const x of [-.64,0,.64]){
  k.box(g,[.622,.14,.66],[x,.40,.055],cushion,.055);
  const back=k.box(g,[.62,.36,.15],[x,.65,-.255],fabric,.06);back.rotation.x=-.10;
  k.box(g,[.54,.006,.008],[x,.46,.335],'#a0b09f',.002);
 }
 const pillow=k.box(g,[.31,.31,.12],[-.79,.61,-.12],'#d3bea0',.075);pillow.rotation.z=.18;
 const pillow2=k.box(g,[.31,.31,.12],[.79,.61,-.12],'#bbc4ad',.075);pillow2.rotation.z=-.18;
 return g;
}
export function coffeeTools(k){
 const g=new T.Group();g.name='pour-over tools';
 k.box(g,[1.05,.014,.40],[0,.007,0],'#343738',.004);
 const kettle=new T.Group();kettle.name='gooseneck kettle';kettle.userData.dynamic=true;kettle.position.set(-.33,.014,.015);g.add(kettle);
 k.cyl(kettle,.084,.145,[0,.083,0],'#a6b0b1',.064);
 k.cyl(kettle,.065,.012,[0,.161,0],'#bac2c0');k.cyl(kettle,.015,.019,[0,.176,0],'#3d4648');
 k.curve(kettle,[[.069,.07,0],[.105,.073,0],[.144,.16,0],[.193,.168,0]],.01,'#a6b0b1');
 k.curve(kettle,[[-.054,.14,0],[-.124,.151,0],[-.136,.071,0],[-.081,.037,0]],.011,'#333a3d');
 const brew=new T.Group();brew.name='dripper and glass server';brew.position.set(.025,.018,0);g.add(brew);
 k.mesh(brew,new T.CylinderGeometry(.048,.073,.135,20),'#d9e5e2',[0,.083,0],{transparent:true,opacity:.42,roughness:.18});
 k.cyl(brew,.065,.046,[0,.039,0],'#654d3c',.058);
 k.curve(brew,[[.048,.14,0],[.095,.132,0],[.106,.054,0],[.067,.025,0]],.007,'#c5d3ce');
 k.cyl(brew,.09,.012,[0,.165,0],'#e8e1d7');
 k.cyl(brew,.026,.11,[0,.225,0],'#ede4d9',.074);
 k.mesh(brew,new T.CylinderGeometry(.067,.022,.103,20,1,true),'#faf2e5',[0,.238,0],{side:T.DoubleSide});
 k.cyl(brew,.062,.006,[0,.289,0],'#6b503d');
 for(let i=0;i<2;i++){
  const x=.30+i*.14;k.cyl(g,.045,.085,[x,.061,.05],'#f0e9dc');k.cyl(g,.034,.004,[x,.105,.05],'#775a44');
  k.ring(g,.023,.006,[x+.05,.069,.05],'#e5dfd4',[0,Math.PI/2,0]);
 }
 return g;
}
export function fridge(k){let g=new T.Group();k.box(g,[.50,1.19,.52],[0,.64,0],'#e5e7df');k.box(g,[.495,.76,.025],[0,.83,.274],'#e7e9e2');k.box(g,[.495,.365,.025],[0,.255,.274],'#dce0d9');k.box(g,[.15,.012,.019],[.12,.46,.296],'#bac4bf');k.box(g,[.15,.012,.019],[.12,1.19,.296],'#bac4bf');return g}
export function sink(k){let g=new T.Group();k.loft(g,[{y:.03,x:.12,z:.11},{y:.30,x:.065,z:.073},{y:.68,x:.074,z:.08},{y:.76,x:.21,z:.18},{y:.81,x:.25,z:.20}],palette.white);k.ell(g,[.214,.022,.164],[0,.80,.016],'#bccac3');k.curve(g,[[0,.79,-.13],[0,.96,-.13],[0,.97,-.065]],.017,palette.metal);k.box(g,[.43,.55,.028],[0,1.32,-.205],'#a9c2c0');return g}
export function kitchen(k){let g=new T.Group();let fr=fridge(k);fr.position.set(-.70,0,0);g.add(fr);k.box(g,[1.22,.75,.57],[.2,.41,0],palette.white);k.box(g,[1.25,.03,.61],[.2,.80,0],'#a3b3b0');k.ell(g,[.26,.022,.22],[.02,.816,0],'#677d80');for(let i=0;i<3;i++)k.box(g,[.396,.70,.016],[-.21+i*.405,.41,.292],palette.white);k.curve(g,[[.08,.81,-.19],[.08,1.055,-.19],[.08,1.06,-.03],[.08,.99,-.025]],.017,palette.metal);k.box(g,[1.19,.48,.30],[.24,1.69,-.15],palette.white);k.box(g,[.012,.44,.011],[.24,1.69,.008],'#b5c1bb');return g}
export function shelf(k){let g=new T.Group();for(let x of [-.43,.43])k.box(g,[.04,1.82,.42],[x,.93,0],palette.white);for(let y of [.08,.51,.99,1.43,1.83])k.box(g,[.86,.035,.42],[0,y,0],palette.white);k.box(g,[.46,.29,.34],[-.17,.66,0],'#e0e4df');k.box(g,[.29,.22,.015],[-.22,.66,.18],'#334a53');for(let y of [.60,.72])k.cyl(g,.02,.014,[.005,y,.182],'#95a39b').rotation.x=Math.PI/2;k.ell(g,[.13,.19,.15],[.23,.7,0],'#d4d9d2');k.box(g,[.053,.10,.02],[.23,.73,.153],'#a9b6af');k.cyl(g,.084,.19,[.04,1.105,0],'#aeb8b4');k.curve(g,[[.12,1.18,0],[.16,1.15,0],[.12,1.03,0]],.014,'#333f40');for(let j=0;j<4;j++)k.box(g,[.15,.15,.19],[-.28+j*.18,1.52,0],['#c4d8d3','#ebe5cf','#cda68a','#b4c6c0'][j]);return g}
export function tv(k){let g=new T.Group();k.box(g,[1.93,1.11,.065],[0,1.37,0],'#243034');let pl=new T.Mesh(new T.PlaneGeometry(1.86,1.04),new T.MeshBasicMaterial({map:screenTexture(true,1)}));pl.position.set(0,1.37,.035);g.add(pl);for(let s of [-1,1]){k.box(g,[.075,1.12,.077],[s*.3,.76,-.10],'#2d393c');k.box(g,[.083,.07,.65],[s*.48,.11,-.08],'#2d393c');for(let z of [-.33,.19]){let w=k.cyl(g,.039,.027,[s*.48,.046,z],'#233034');w.rotation.z=Math.PI/2}}k.box(g,[.9,.03,.25],[0,.92,.04],'#303d3e');k.box(g,[.15,.04,.08],[.18,.96,.11],'#566267');return g}
export function rack(k){let g=new T.Group();for(let s of [-1,1]){k.rod(g,[s*.37,.08,0],[s*.37,1.56,0],.015,palette.white);k.rod(g,[s*.37,.08,-.22],[s*.37,.08,.22],.015,palette.white)}k.rod(g,[-.37,1.56,0],[.37,1.56,0],.014,palette.white);for(let s of [-1,1]){k.curve(g,[[s*.12,1.57,0],[s*.16,1.47,0],[s*.33,1.35,0],[s*.04,1.35,0],[s*.16,1.47,0]],.008,'#758887');k.loft(g,[{y:.79,x:.15,z:.028,cx:s*.16},{y:1.17,x:.17,z:.034,cx:s*.16},{y:1.35,x:.19,z:.032,cx:s*.16},{y:1.42,x:.057,z:.035,cx:s*.16}],s===1?'#303b42':'#e4dfd2',18)}k.box(g,[.20,.36,.20],[.57,.20,0],'#8a9694');for(let i=0;i<4;i++)k.curve(g,[[.51+i*.03,.11,0],[.51+i*.03,.71,0],[.56+i*.03,.78,0],[.59+i*.03,.71,0]],.011,'#364b51');return g}
export function mediaTV(k){
 const g=new T.Group();g.name='Lab album TV';k.box(g,[2.16,1.21,.065],[0,1.45,0],'#e8e7de');
 const c=document.createElement('canvas');c.width=1024;c.height=576;const ctx=c.getContext('2d');
 ctx.fillStyle='#173d36';ctx.fillRect(0,0,1024,576);ctx.fillStyle='#a7c0a5';ctx.fillRect(48,52,64,8);
 ctx.font='22px sans-serif';ctx.fillStyle='#c5d8c9';ctx.fillText('CONICT · OPEN HOUSE',48,104);
 ctx.font='bold 68px sans-serif';ctx.fillStyle='#f5f0df';ctx.fillText('LAB ALBUM',48,245);
 ctx.font='30px sans-serif';ctx.fillText('우리의 공간과 함께한 순간들',48,313);
 for(let i=0;i<3;i++){ctx.fillStyle=['#bdcaa5','#d2ae7d','#86a79a'][i];ctx.fillRect(48+i*278,388,254,130)}
 ctx.fillStyle='#f5f0df';ctx.font='25px sans-serif';ctx.fillText('둘러보기 →',735,92);
 const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(2.09,1.14),new T.MeshBasicMaterial({map:tx}));m.position.set(0,1.45,.035);m.userData.screen=true;g.add(m);
 k.ell(g,[.004,.004,.002],[.98,.87,.035],'#89b990');return g;
}
// Legacy imported layouts retain the old kind, with corrected TV geometry.
export function cat(k){return mediaTV(k)}
export function lamp(k){let g=new T.Group();k.cyl(g,.18,.035,[0,.035,0],'#334345');k.rod(g,[0,.035,0],[0,1.52,0],.014,'#29373b');k.cyl(g,.042,.115,[0,1.57,0],'#e9e4d4',.16);k.cyl(g,.144,.012,[0,1.634,0],'#fff3d4');return g}
export function printer(k){let g=new T.Group();k.box(g,[.46,.32,.41],[0,.19,0],palette.white);k.box(g,[.455,.035,.402],[0,.365,0],'#e4e8df');k.box(g,[.34,.07,.06],[0,.22,.211],'#394d53');k.box(g,[.28,.011,.16],[0,.17,.25],'#bdc6bd');let pl=k.box(g,[.10,.07,.015],[.155,.315,.212],'#456674');pl.rotation.x=-.25;return g}
export function makeFurniture(k,id){switch(id){case 'sofa-3':return sofa(k);case 'desk':return desk(k);case 'chair-black':return chair(k);case 'chair-white':return chair(k,true);case 'monitors':return monitors(k);case 'tower':return tower(k);case 'partition':return partition(k);case 'meeting':return table(k);case 'prof-table':return table(k,true);case 'side-table':return sideTable(k);case 'wall-table':return wallTable(k);case 'bookshelf':return bookshelf(k);case 'cabinet':return cabinet(k);case 'purifier':return purifier(k);case 'purifier-lab':return labPurifier(k);case 'wood-cabinet':return woodCabinet(k);case 'coffee-cabinet':return coffeeCabinet(k);case 'coffee-tools':return coffeeTools(k);case 'kitchen':return kitchen(k);case 'sink':return sink(k);case 'fridge':return fridge(k);case 'shelf':return shelf(k);case 'tv':return tv(k);case 'rack':return rack(k);case 'cat':case 'media-tv':return mediaTV(k);case 'lamp':return lamp(k);case 'printer':return printer(k);default:return desk(k)}}
export function workstation(k,seat,person,state){let g=new T.Group(),active=state==='online';g.name=seat.label;g.userData.seat=seat.id;g.add(desk(k));g.add(monitors(k,active,seat.professor));let ch=chair(k,seat.chair==='white');ch.position.z=.82;g.add(ch);let pc=tower(k,active);pc.position.set(.61,0,.08);g.add(pc);if(!seat.professor){let pa=partition(k);pa.position.z=-.44;g.add(pa)}
 k.box(g,[.43,.025,.145],[-.10,.791,.205],'#e1e5dc',.012);for(let row=0;row<4;row++)for(let j=0;j<12;j++)k.box(g,[.023,.009,.020],[-.29+j*.033,.810,.152+row*.030],j%5===0?'#8cb3b1':'#d7dbd5',.002);k.ell(g,[.03,.02,.051],[.32,.80,.22],'#abbeb9');k.box(g,[.19,.006,.19],[.32,.778,.23],'#445e61');k.cyl(g,.034,.105,[-.68,.827,.21],'#bb9572');k.rod(g,[-.68,.876,.21],[-.67,.94,.205],.003,'#293f46');
 if(seat.id==='s6'){k.box(g,[.28,.015,.20],[.49,.788,-.12],'#bdc9c6');let l=k.box(g,[.28,.18,.01],[.49,.878,-.207],'#bbc7c6');l.rotation.x=-.18;k.box(g,[.255,.15,.006],[.49,.884,-.193],'#334951')}
 if(active||person.professor){let av=avatar(k,person,true);av.position.z=.85;av.rotation.y=Math.PI;g.add(av);Object.defineProperty(g.userData,'avatar',{value:av,writable:true,configurable:true})}
 g.position.set(seat.x,0,seat.z);g.rotation.y=seat.rotation;return g}

export function room(k,seats,members,states,layout=defaultLayout()){
 const root=new T.Group();root.name='CONICT editable layout';const seatNodes=[];const wallColor='#ded0b3',wallSurface=new T.MeshBasicMaterial({color:wallColor,toneMapped:false});
 for(const r of layout.rooms){const g=new T.Group();g.name=r.name;g.userData.layoutId=r.id;g.userData.layoutKind='room';root.add(g);const shape=new T.Shape();r.points.forEach((p,i)=>i===0?shape.moveTo(p.x,-p.z):shape.lineTo(p.x,-p.z));shape.closePath();const floor=k.mesh(g,new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:false}),r.color,[0,-.17,0]);floor.rotation.x=-Math.PI/2;const bounds=roomBounds(r),step=Math.max(.6,Math.sqrt(area(r.points)/350));for(let x=bounds.minX+step/2;x<bounds.maxX;x+=step)for(let z=bounds.minZ+step/2;z<bounds.maxZ;z+=step){const corners=[{x:x-step*.49,z:z-step*.49},{x:x+step*.49,z:z-step*.49},{x:x+step*.49,z:z+step*.49},{x:x-step*.49,z:z+step*.49}];if(corners.every(p=>contains(r.points,p)))k.box(g,[step*.97,.012,step*.97],[x,-.006,z],r.color,.001)}}
 for(const w of renderWalls(layout)){if(!w.enabled)continue;const group=new T.Group();group.name='wall '+w.id;group.userData.layoutId=w.parentId;group.userData.layoutKind='wall';root.add(group);const len=wallLength(w),dx=(w.b.x-w.a.x)/len,dz=(w.b.z-w.a.z)/len,angle=-Math.atan2(dz,dx),height=WALL_HEIGHT,section=layout.cutaway?(w.shared?.82:dz-dx>0?.30:WALL_HEIGHT):WALL_HEIGHT;group.userData.wallHeight=WALL_HEIGHT;for(const b of wallBlocks(w,openingsOnWall(layout,w),height)){const centre=(b.from+b.to)/2;const m=k.box(group,[b.to-b.from,b.top-b.bottom,w.thickness],[w.a.x+dx*centre,(b.bottom+b.top)/2,w.a.z+dz*centre],wallColor,.003);m.rotation.y=angle;m.material=wallSurface;m.castShadow=false;m.receiveShadow=false;if(section<WALL_HEIGHT){m.material=m.material.clone();m.material.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),section)];m.material.clipShadows=true}}}
 for(const o of layout.openings){const w=wallById(layout,o.wallId);if(!w?.enabled)continue;const g=new T.Group();g.position.set(w.a.x+(w.b.x-w.a.x)*o.t,0,w.a.z+(w.b.z-w.a.z)*o.t);g.rotation.y=-Math.atan2(w.b.z-w.a.z,w.b.x-w.a.x);g.name=o.kind;g.userData.layoutId=o.id;g.userData.layoutKind='opening';root.add(g);const frame='#dfdfd4',passage=doorPassage(layout,o),{depth,centerZ}=passage;g.userData.connectedWallIds=passage.wallIds;for(const x of [-o.width/2,o.width/2])k.box(g,[.038,o.height,depth],[x,o.sill+o.height/2,centerZ],frame,.003);k.box(g,[o.width+.04,.04,depth],[0,o.sill+o.height,centerZ],frame,.003);if(o.kind==='window'){k.box(g,[o.width+.04,.04,depth],[0,o.sill,0],frame,.003);k.box(g,[o.width,o.height,.014],[0,o.sill+o.height/2,0],'#a9bebb',.002);for(let y=o.sill+.025;y<o.sill+o.height;y+=.055)k.box(g,[o.width-.02,.04,.016],[0,y,.015],'#c6a06b',.002);for(const x of [-o.width*.3,o.width*.3])k.rod(g,[x,o.sill,.036],[x,o.sill+o.height,.036],.0027,'#e0cfad')}else{if(depth>w.thickness+.026)k.box(g,[o.width-.04,.15,depth],[0,-.075,centerZ],'#cbd0c9',.001);for(const [index,pose] of doorPoses(o).entries()){const leaf=new T.Group();leaf.name=o.leaves===2?'door leaf '+(index+1):'door leaf';leaf.userData.doorLeaf=true;leaf.userData.doorId=o.id;leaf.userData.hinge=pose.hinge||o.hinge;leaf.userData.nominalWidth=pose.width;leaf.position.set(pose.hingeX,0,0);leaf.rotation.y=pose.rotation;g.add(leaf);k.box(leaf,[pose.width-.035,o.height-.04,.025],[pose.direction*(pose.width-.035)/2,(o.height-.04)/2,0],'#dbd8c5',.015);for(const side of [-1,1])k.rod(leaf,[pose.direction*(pose.width-.15),.93,side*.025],[pose.direction*(pose.width-.07),.93,side*.025],.009,'#94a5a0');}}}
 for(const o of layout.objects){let node;if(o.kind==='seat'){const s=seats.find(s=>s.id===o.seatId);if(!s)continue;node=workstation(k,{...s,x:0,z:0,rotation:0},members.find(p=>p.id===s.member),states[s.id]||'unknown');seatNodes.push(node)}else if(o.kind==='chair-meeting')node=chair(k,false,true);else if(o.kind==='plant'){node=new T.Group();k.cyl(node,.095,.13,[0,.07,0],'#546b60');for(let i=0;i<5;i++){const x=Math.sin(i*2)*.14,z=Math.cos(i*2)*.11;k.rod(node,[0,.13,0],[x,.40,z],.005,'#587454');const l=k.ell(node,[.075,.024,.032],[x,.38,z],'#6e9367');l.rotation.z=i*.8}}else node=makeFurniture(k,o.kind);node.name=o.name;node.position.set(o.x,o.y,o.z);node.rotation.y=o.rotation*Math.PI/180;node.scale.set(o.scaleX,o.scaleY,o.scaleZ);node.userData.layoutId=o.id;node.userData.layoutKind='object';root.add(node)}
 root.userData.seatNodes=seatNodes;return root;
}
