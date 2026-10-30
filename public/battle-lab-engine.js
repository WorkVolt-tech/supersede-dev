import {
  TACTICAL_WEAPONS, TACTICAL_ATTACKS, getTacticalAttacks, tacticalWeaponType,
  isTacticalTargetValid, tacticalHitTargets, weaponMasteryLevel,
  weaponMasteryBonus, awardWeaponMastery, nextWeaponMasteryThreshold
} from './battle-lab-rules.js';

// Standalone prototype: no database, XP, loot or character writes.
const columns=['left','center','right'];
const ranks=['front','middle','rear'];
const $=id=>document.getElementById(id);
const state={
  mode:'ap',weapon:'sword',attack:'slash',hero:{col:1,rank:0,hp:36},
  enemies:[],ap:2,freeMoveUsed:false,turn:1,over:false,messages:[],mastery:{}
};

function tell(msg){
  state.messages.unshift(msg);
  state.messages=state.messages.slice(0,18);
  $('status').textContent=msg;
}
function reset(){
  state.hero={col:1,rank:0,hp:36};
  state.enemies=[
    {id:'E1',weapon:'sword',col:1,rank:0,hp:18},
    {id:'E2',weapon:'spear',col:0,rank:1,hp:15},
    {id:'E3',weapon:'staff',col:2,rank:2,hp:12}
  ];
  state.ap=state.mode==='ap'?2:1;
  state.freeMoveUsed=false;
  state.turn=1;
  state.over=false;
  state.messages=[];
  state.attack=getTacticalAttacks(state.weapon)[0].id;
  tell('Enemy formation: sword, spear and staff. Their weapon range also determines their actions.');
  render();
}
const attackCost=attack=>state.mode==='ap'?attack.ap:1;
const currentAttack=()=>TACTICAL_ATTACKS[state.attack];
const canAct=attack=>!state.over&&state.ap>=attackCost(attack);
function canMove(col,rank){
  return !state.over&&state.ap>0&&
    !(state.mode==='free'&&state.freeMoveUsed)&&
    Math.abs(col-state.hero.col)+Math.abs(rank-state.hero.rank)===1;
}
function onCell(side,col,rank){
  if(state.over)return;
  if(side==='hero'){
    if(!canMove(col,rank)){tell('Move one unoccupied square sideways, forward or backward.');return;}
    state.hero.col=col;
    state.hero.rank=rank;
    if(state.mode==='ap')state.ap--;
    if(state.mode==='turn')state.ap=0;
    if(state.mode==='free')state.freeMoveUsed=true;
    tell('You move to '+columns[col]+' column, '+ranks[rank]+' rank.');
    if(state.ap===0)enemyPhase();else render();
    return;
  }
  const target=state.enemies.find(e=>e.hp>0&&e.col===col&&e.rank===rank);
  if(!target){tell('That enemy square is empty.');return;}
  const atk=currentAttack();
  if(!isTacticalTargetValid(atk,state.hero,target)){
    tell(atk.label+' cannot reach that square from your position.');
    return;
  }
  if(!canAct(atk)){tell('Not enough actions for '+atk.label+'.');return;}
  const affected=tacticalHitTargets(atk,target,state.enemies);
  const damage=atk.damage+(atk.fallback?0:weaponMasteryBonus(state.mastery[state.weapon]||0));
  for(const foe of affected)foe.hp=Math.max(0,foe.hp-damage);
  state.enemies=state.enemies.filter(foe=>foe.hp>0);
  state.ap-=attackCost(atk);
  if(!atk.fallback)state.mastery=awardWeaponMastery(state.mastery,state.weapon,1);
  tell(atk.label+' strikes '+affected.map(foe=>foe.id).join(', ')+
    ' for '+damage+' each.'+(atk.fallback?' No mastery XP for emergency Pulse.':
      ' '+TACTICAL_WEAPONS[state.weapon].label+' mastery +1 XP.'));
  if(!state.enemies.length){
    state.over=true;
    tell('Victory! Swap weapons or replay to experiment with another build.');
    render();return;
  }
  if(state.ap===0)enemyPhase();else render();
}
function enemyOccupied(col,rank,excluded){
  return state.enemies.some(e=>e!==excluded&&e.hp>0&&e.col===col&&e.rank===rank);
}
function chooseEnemyAction(foe){
  const attacks=getTacticalAttacks(foe.weapon);
  const hitOptions=attacks.filter(atk=>!atk.fallback&&
    isTacticalTargetValid(atk,foe,state.hero));
  hitOptions.sort((a,b)=>b.damage-a.damage);
  if(hitOptions.length)return {attack:hitOptions[0]};
  // An enemy unable to reach with its real weapon first seeks a legal tile
  // from which its preferred attacks will work. It cannot overlap allies.
  const positions=[];
  for(const [dc,dr] of [[0,-1],[-1,0],[1,0],[0,1]]){
    const col=foe.col+dc,rank=foe.rank+dr;
    if(col<0||col>2||rank<0||rank>2||enemyOccupied(col,rank,foe))continue;
    const pos={col,rank};
    positions.push({pos,
      useful:attacks.some(atk=>!atk.fallback&&isTacticalTargetValid(atk,pos,state.hero)),
      distance:rank+Math.abs(col-state.hero.col)
    });
  }
  positions.sort((a,b)=>Number(b.useful)-Number(a.useful)||a.distance-b.distance);
  if(positions.length)return {move:positions[0].pos};
  return {attack:attacks.find(a=>a.fallback)};
}
function enemyPhase(){
  if(state.over)return;
  const results=[];
  for(const foe of state.enemies){
    const chosen=chooseEnemyAction(foe);
    if(chosen.move){
      foe.col=chosen.move.col;foe.rank=chosen.move.rank;
      results.push(foe.id+' ('+foe.weapon+') moves to '+columns[foe.col]+' / '+ranks[foe.rank]+'.');
    }else if(chosen.attack){
      const valid=isTacticalTargetValid(chosen.attack,foe,state.hero);
      const affected=valid?tacticalHitTargets(chosen.attack,state.hero,[state.hero]):[];
      const damage=affected.length?chosen.attack.damage:0;
      state.hero.hp=Math.max(0,state.hero.hp-damage);
      results.push(foe.id+' uses '+chosen.attack.label+(damage?' for '+damage+' damage.':', but misses.'));
    }
    if(state.hero.hp<=0)break;
  }
  if(state.hero.hp<=0){
    state.over=true;
    tell('Defeat. '+results.join(' ')+' Try a different range or weapon.');
    render();return;
  }
  state.turn++;
  state.ap=state.mode==='ap'?2:1;
  state.freeMoveUsed=false;
  tell('Enemy phase: '+results.join(' '));
  render();
}
function renderSide(side){
  const board=$(side==='hero'?'ally-board':'enemy-board');
  board.replaceChildren();
  const rows=side==='hero'?[0,1,2]:[2,1,0];
  const attack=currentAttack();
  for(const rank of rows)for(let col=0;col<3;col++){
    const button=document.createElement('button');
    button.type='button';
    const hero=side==='hero'&&state.hero.col===col&&state.hero.rank===rank;
    const enemy=side==='enemy'?state.enemies.find(e=>e.hp>0&&e.col===col&&e.rank===rank):null;
    const reachable=side==='hero'&&!hero&&canMove(col,rank);
    const targetable=Boolean(enemy&&canAct(attack)&&isTacticalTargetValid(attack,state.hero,enemy));
    button.className='cell '+side+(hero?' hero':'')+
      (hero||enemy?' unit':'')+(reachable?' reachable':'')+
      (targetable?' targetable':'')+
      (side==='enemy'&&rank===0?' front-border':'')+
      (side==='hero'&&rank===0?' ally-front':'');
    button.disabled=state.over;
    button.setAttribute('aria-label',(side==='hero'?'Ally':'Enemy')+' '+columns[col]+
      ' column, '+ranks[rank]+' rank'+
      (hero?' hero':enemy?' '+enemy.id+' '+enemy.hp+' HP '+enemy.weapon:' empty')+
      (reachable?' move here':targetable?' valid attack target':''));
    const glyph=document.createElement('span');
    glyph.textContent=hero?'🧍':enemy?TACTICAL_WEAPONS[enemy.weapon].icon:'·';
    const small=document.createElement('small');
    small.textContent=hero?'YOU':enemy?enemy.id:ranks[rank];
    button.append(glyph,small);
    if(enemy){
      const hp=document.createElement('span');
      hp.className='hp';hp.textContent=enemy.hp+' HP';button.append(hp);
    }
    button.addEventListener('click',()=>onCell(side,col,rank));
    board.append(button);
  }
}
function renderActions(){
  const container=$('actions');container.replaceChildren();
  for(const atk of getTacticalAttacks(state.weapon)){
    const btn=document.createElement('button');
    btn.type='button';btn.className='action';
    btn.disabled=state.over;
    btn.setAttribute('aria-pressed',String(state.attack===atk.id));
    const name=document.createElement('b');
    name.textContent=atk.label+(atk.fallback?' · Emergency':'');
    const info=document.createElement('span');
    const shape={single:'Single target',row:'Adjacent row',cross:'Cross / +',column:'Full column'}[atk.shape];
    info.textContent=atk.reach.toUpperCase()+' · '+shape+' · '+
      atk.damage+' base dmg · '+attackCost(atk)+' action'+(attackCost(atk)>1?'s':'');
    btn.append(name,info);
    btn.addEventListener('click',()=>{
      state.attack=atk.id;
      tell(atk.label+': gold outlines show your legal targets.');
      render();
    });
    container.append(btn);
  }
}
function render(){
  renderSide('enemy');renderSide('hero');renderActions();
  $('hero-hp').textContent=state.hero.hp+'/36';
  $('turn').textContent=String(state.turn);
  $('ap').textContent=state.ap+(state.mode==='ap'?' AP':' action')+
    (state.mode==='free'&&!state.freeMoveUsed?' + free move':'');
  $('foes-left').textContent=String(state.enemies.length);
  const xp=state.mastery[state.weapon]||0;
  const next=nextWeaponMasteryThreshold(xp);
  $('mastery').textContent=TACTICAL_WEAPONS[state.weapon].label+
    ' Lv '+weaponMasteryLevel(xp)+' · '+xp+' XP'+
    (next===null?' (MAX)':' / '+next);
  $('end-turn').disabled=state.over;
  for(const mode of document.querySelectorAll('[data-mode]'))
    mode.setAttribute('aria-pressed',String(mode.dataset.mode===state.mode));
  $('log').replaceChildren();
  for(const entry of state.messages){
    const li=document.createElement('li');li.textContent=entry;$('log').append(li);
  }
}
const weaponSelect=$('weapon');
for(const [type,data]of Object.entries(TACTICAL_WEAPONS)){
  const option=document.createElement('option');
  option.value=type;option.textContent=data.icon+' '+data.label;
  weaponSelect.append(option);
}
weaponSelect.value=state.weapon;
weaponSelect.addEventListener('change',()=>{
  state.weapon=tacticalWeaponType(weaponSelect.value);
  state.attack=getTacticalAttacks(state.weapon)[0].id;
  tell('Equipped '+TACTICAL_WEAPONS[state.weapon].label+
    '. Mastery follows weapon type, not individual equipment.');
  render();
});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  state.mode=button.dataset.mode;reset();
}));
$('end-turn').addEventListener('click',enemyPhase);
$('restart').addEventListener('click',reset);
reset();
