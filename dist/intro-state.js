// The scene and brand animation can finish in either order.
export function createIntroGate({onClose=()=>{},onFailure=()=>{}}={}){
 let sceneReady=false,animationDone=false,closed=false,failed=false;
 const finish=()=>{if(!closed&&!failed&&sceneReady&&animationDone){closed=true;onClose();}};
 return {
  ready(){if(closed||failed)return;sceneReady=true;finish();},
  done(){if(closed||failed)return;animationDone=true;finish();},
  skip(){if(closed||failed)return;animationDone=true;finish();},
  fail(){if(closed||failed)return;failed=true;onFailure();},
  get sceneReady(){return sceneReady;},
  get animationDone(){return animationDone;},
  get closed(){return closed;},
  get failed(){return failed;}
 };
}

