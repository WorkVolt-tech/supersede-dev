// SuperSede 3×3 tactical combat prototype rules.
// This module is pure: no Supabase writes or mutations of saved characters.
// rank 0 is the frontline on BOTH sides; columns are left=0, centre=1, right=2.
// Class abilities will eventually register patterns here, alongside weapon attacks.

export const TACTICAL_ATTACKS = {
  bareStrike:  { label:'Basic Strike', reach:'short', from:[0], to:[0],
    cols:'near', shape:'single', damage:3, ap:1,
    description:'Front row only: strike a front-row enemy in your column or an adjacent column.' },
  improvisedThrow: { label:'Improvised Throw', reach:'long', from:[0,1,2],to:[1,2],
    cols:'any',shape:'single',damage:2,ap:1, thrown:true,
    description:'Throw an improvised object at a middle- or rear-row enemy. Retrieve it next round (middle) or after 2 rounds (rear).' },
  slash:       { label:'Sword Slash',      reach:'short', from:[0],   to:[0],       cols:'same',  shape:'single', damage:7, ap:1 },
  stab:        { label:'Dagger Stab',      reach:'short', from:[0],   to:[0],       cols:'near',  shape:'single', damage:6, ap:1 },
  jab:         { label:'Spear Jab',        reach:'short', from:[0],   to:[0,1],     cols:'same',  shape:'single', damage:6, ap:1 },
  bash:        { label:'Weapon Bash',      reach:'short', from:[0],   to:[0],       cols:'same',  shape:'single', damage:4, ap:1 },
  thrust:      { label:'Long Thrust',      reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'single', damage:5, ap:1 },
  lunge:       { label:'Dagger Reach',     reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'single', damage:5, ap:1 },
  throw:       { label:'Dagger Throw',     reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:3, ap:1 },
  quickArrow:  { label:'Quick Shot',       reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'single', damage:4, ap:1 },
  aimed:       { label:'Aimed Shot',       reach:'long',  from:[1,2], to:[0,1,2],   cols:'any',   shape:'single', damage:6, ap:1 },
  snapshot:    { label:'Quick Shot',       reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:4, ap:1 },
  bolt:        { label:'Arcane Bolt',      reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:5, ap:1 },
  shieldToss:  { label:'Shield Toss',      reach:'mid',   from:[0,1], to:[0,1,2],   cols:'near',  shape:'single', damage:4, ap:1 },
  scatter:     { label:'Buckshot Spread',  reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'row',    damage:4, ap:2 },
  sweep:       { label:'Sweeping Arc',     reach:'short', from:[0],   to:[0],       cols:'near',  shape:'row',    damage:5, ap:2 },
  pierce:      { label:'Piercing Line',    reach:'long',  from:[1,2], to:[0,1,2],   cols:'any',   shape:'column', damage:4, ap:2 },
  wave:        { label:'Resonance Wave',   reach:'mid',   from:[0,1,2],to:[0,1,2], cols:'any',   shape:'cross',  damage:4, ap:2 },
  volley:      { label:'Arrow Volley',     reach:'long',  from:[1,2], to:[0,1,2],   cols:'any',   shape:'cross',  damage:3, ap:2 },
  shockwave:   { label:'Shield Shockwave', reach:'mid',   from:[0],   to:[0,1],     cols:'near',  shape:'row',    damage:4, ap:2 },
  masterArc:   { label:'Master Arc',      reach:'mid',  from:[0,1],to:[0,1],   cols:'near',shape:'row',   damage:8,ap:2,masteryLevel:20 },
  masterLine:  { label:'Master Piercing', reach:'long', from:[0,1,2],to:[0,1,2],cols:'any',shape:'column',damage:7,ap:2,masteryLevel:40 },
  masterBurst: { label:'Grand Resonance', reach:'long', from:[0,1,2],to:[0,1,2],cols:'any',shape:'cross', damage:9,ap:2,masteryLevel:80 },
  pulse:       { label:'Emergency Attack', reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:2, ap:0, fallback:true,
    description:'Basic emergency action (not a skill). Reaches any enemy row; once per round.' },
};

export const TACTICAL_WEAPONS = {
  sword:    { label:'Sword',         icon:'⚔️', attacks:['slash','thrust','sweep','pulse'] },
  dagger:   { label:'Dagger',        icon:'🗡️', attacks:['stab','lunge','throw','pulse'] },
  spear:    { label:'Spear',         icon:'🔱', attacks:['jab','thrust','pierce','pulse'] },
  staff:    { label:'Staff',         icon:'🪄', attacks:['bash','bolt','wave','pulse'] },
  bow:      { label:'Bow',           icon:'🏹', attacks:['bash','quickArrow','aimed','volley','pulse'] },
  crossbow: { label:'Crossbow',      icon:'🏹', attacks:['bash','quickArrow','aimed','pierce','pulse'] },
  pistol:   { label:'Pistol',        icon:'🔫', attacks:['bash','snapshot','scatter','pulse'] },
  rifle:    { label:'Rifle',         icon:'🔫', attacks:['bash','quickArrow','aimed','pierce','pulse'] },
  shotgun:  { label:'Shotgun',       icon:'💥', attacks:['bash','scatter','shockwave','pulse'] },
  shield:   { label:'Shield',        icon:'🛡️', attacks:['bash','shieldToss','shockwave','pulse'] },
  tome:     { label:'Tome',          icon:'📖', attacks:['bash','bolt','wave','pulse'] },
  unarmed:  { label:'Unarmed',       icon:'👊', attacks:['stab','lunge','wave','pulse'] },
};

// Match current equipmentSlots.js subtype spellings. Future classes and
// monsters also use this normalization, rather than requiring their own rules.
// Mastery adds techniques without removing any base-weapon reach.
export const MASTERY_TECHNIQUES = {
  sword:['masterArc','masterBurst'], dagger:['masterArc','masterLine'],
  spear:['masterArc','masterLine'], staff:['masterLine','masterBurst'],
  bow:['masterLine','masterBurst'], crossbow:['masterLine','masterBurst'],
  pistol:['masterLine','masterBurst'], rifle:['masterLine','masterBurst'],
  shotgun:['masterArc','masterBurst'], shield:['masterArc','masterBurst'],
  tome:['masterLine','masterBurst'], unarmed:['masterArc','masterBurst'],
}
export const WEAPON_ALIASES = {
  shortbow:'bow', longbow:'bow',
  firearm:'pistol', gun:'pistol', handgun:'pistol', revolver:'pistol',
  assault_rifle:'rifle', sniper_rifle:'rifle',
  smg:'pistol', submachine_gun:'pistol',
  // mainhand items not in this list use the universal unarmed kit.
};
export function tacticalWeaponType(type) {
  const key=String(type || '').toLowerCase().replace(/[\s-]/g,'_');
  return TACTICAL_WEAPONS[key] ? key : WEAPON_ALIASES[key] || 'unarmed';
}
/** Existing weapon techniques expand with mastery; System Pulse never does. */
export function evolveTacticalWeaponAttack(attack,masteryLevel=1) {
  if(attack.fallback)return {...attack}
  const lvl=Math.max(1,Math.floor(Number(masteryLevel)||1))
  let shape=attack.shape
  if(shape==='single') {
    if(attack.reach==='short')
      shape=lvl>=80?'diamond2':lvl>=40?'cross':lvl>=20?'row':'single'
    else if(attack.reach==='mid')
      shape=lvl>=80?'cross':lvl>=40?'row':'single'
    else if(attack.reach==='long')
      shape=lvl>=80?'row':'single'
  } else if(shape==='row')
    shape=lvl>=80?'rowPlus':lvl>=40?'fullRow':lvl>=20?'fullRow':'row'
  else if(shape==='column')
    shape=lvl>=80?'all':lvl>=40?'wideColumn':'column'
  else if(shape==='cross')
    shape=lvl>=80?'all':lvl>=40?'diamond2':'cross'
  return {...attack,shape}
}
// A player with no equipped main-hand weapon does not receive dagger,
// magical-wave or emergency skills just for being "unarmed". Existing
// enemy AI and equipped-weapon kits still use getTacticalAttacks.
export function getPlayerTacticalAttacks(hasMainhandWeapon,weaponType,masteryXp=0) {
  if(!hasMainhandWeapon) return ['bareStrike','improvisedThrow']
    .map(id=>({id,...TACTICAL_ATTACKS[id]}))
  return getTacticalAttacks(weaponType,[],masteryXp)
}
export function startImprovisedThrowRecovery(currentRound,targetRank) {
  if(targetRank!==1&&targetRank!==2)return currentRound
  return currentRound+targetRank
}
export function improvisedThrowTurnsRemaining(readyRound,currentRound) {
  return Math.max(0,Math.floor((Number(readyRound)||0)-(Number(currentRound)||0)))
}
export function tacticalAttackDescription(attack) {
  if(attack?.description)return attack.description
  if(!attack)return ''
  const shape=attack.shape==='single'?'one enemy':attack.shape+' area'
  const ranks=attack.to?.map(n=>['front','middle','rear'][n]).join(', ')||'any'
  return 'Targets '+ranks+' row'+(attack.to?.length===1?'':'s')+
    ' · '+shape+'.'
}
export function getTacticalAttacks(weaponType, classAttackIds=[], masteryXp=0) {
  const type=tacticalWeaponType(weaponType);
  const level=weaponMasteryLevel(masteryXp);
  const mastered=MASTERY_TECHNIQUES[type].filter(id=>level>=TACTICAL_ATTACKS[id].masteryLevel);
  const ids=[...TACTICAL_WEAPONS[type].attacks, ...mastered,
    ...classAttackIds.filter(id=>Boolean(TACTICAL_ATTACKS[id]) &&
      (!TACTICAL_ATTACKS[id].masteryLevel || level>=TACTICAL_ATTACKS[id].masteryLevel))];
  return [...new Set(ids)].map(id=>({id,...evolveTacticalWeaponAttack(TACTICAL_ATTACKS[id],level)}));
}

// Movement and attack ranges are expressed relative to EACH side's frontline;
// this works identically for player and enemy grids regardless of orientation.
export function isTacticalTargetValid(attack, from, target) {
  const a=typeof attack==='string'?TACTICAL_ATTACKS[attack]:attack;
  if(!a || !from || !target || !a.from.includes(from.rank) || !a.to.includes(target.rank))return false;
  const horizontal=Math.abs(from.col-target.col);
  return a.cols==='any'||(a.cols==='same'?horizontal===0:horizontal<=1);
}
export function getTacticalAffectedSquares(attack, target) {
  const a=typeof attack==='string'?TACTICAL_ATTACKS[attack]:attack;
  if(!a || !target)return [];
  const cells=[];
  for(let rank=0;rank<3;rank++)for(let col=0;col<3;col++){
    const delta=Math.abs(col-target.col)+Math.abs(rank-target.rank);
    const valid=a.shape==='single'?delta===0:
      a.shape==='row'?rank===target.rank&&Math.abs(col-target.col)<=1:
      a.shape==='column'?col===target.col:
      a.shape==='cross'?delta<=1:
      // An evolved focused spell adds two diagonal flanks toward the
      // opposing frontline; it does not wipe the entire 3×3 grid.
      a.shape==='crossPlus'?delta<=1||
        (Math.abs(col-target.col)===1&&rank===(target.rank===0?1:target.rank-1)):
      a.shape==='diamond2'?delta<=2:
      a.shape==='fullRow'?rank===target.rank:
      a.shape==='rowPlus'?Math.abs(rank-target.rank)<=1:
      a.shape==='wideColumn'?Math.abs(col-target.col)<=1:
      a.shape==='all'?true:false;
    if(valid)cells.push({col,rank});
  }
  return cells;
}
export function tacticalHitTargets(attack, target, units) {
  const squares=getTacticalAffectedSquares(attack,target);
  return units.filter(unit=>unit.hp>0 && squares.some(cell=>cell.col===unit.col&&cell.rank===unit.rank));
}

// Mastery is earned through USE of a weapon type, not a particular drop.
// In the lab it stays in memory across rematches; live DB persistence and
// anti-farming policies must be agreed before activating this system for real.
// Fast first tiers; level 100 is a sustained specialization milestone.
export const MASTERY_XP_THRESHOLDS=Array.from({length:100},(_,i)=>
  i<5?[0,5,14,28,48][i]:
    48+7*(i-4)+Math.ceil((i-4)*(i-4)*0.4));
export function weaponMasteryLevel(xp=0) {
  const value=Math.max(0,Math.floor(Number(xp)||0));
  let level=1;
  for(let i=1;i<MASTERY_XP_THRESHOLDS.length;i++)if(value>=MASTERY_XP_THRESHOLDS[i])level=i+1;
  return level;
}
export function weaponMasteryBonus(xp=0) {
  return Math.floor((weaponMasteryLevel(xp)-1)/10); // +0..+9 base damage
}
export function awardWeaponMastery(mastery, weaponType, successfulHits=1) {
  const type=tacticalWeaponType(weaponType);
  return {...mastery,[type]:(mastery[type]||0)+Math.max(0,Math.floor(successfulHits))};
}
export function nextWeaponMasteryThreshold(xp) {
  return MASTERY_XP_THRESHOLDS.find(value=>value>xp)??null;
}

// Enemy choices use the same legal targeting rules as player attacks.
// Try a meaningful attack, otherwise move one adjacent square toward a legal
// weapon shot. If no movement helps, use the weak universal fallback.
export function chooseTacticalEnemyAction(weaponType, from, target, occupied=[], avoidSquares=[]) {
  const kit=getTacticalAttacks(weaponType);
  // Low-tier unarmed foes do not inherit the player's advanced magical Wave;
  // they must close distance or use the weak emergency fallback.
  const attacks=kit.filter(a=>!a.fallback &&
    !(tacticalWeaponType(weaponType)==='unarmed' && a.id==='wave'));
  const valid=attacks.filter(a=>isTacticalTargetValid(a,from,target))
    .sort((a,b)=>b.damage-a.damage);
  // Persistent elemental fields are fixed hazards. An enemy standing in a
  // burning square should step into a safe neighboring tile when possible,
  // even if it could attack from the burning square.
  const blocked=new Set(occupied.filter(u=>u.hp===undefined||u.hp>0)
    .map(u=>u.col+':'+u.rank));
  const hazard=new Set(avoidSquares.map(p=>p.col+':'+p.rank));
  const directions=[[0,-1],[-1,0],[1,0],[0,1]];
  const neighbors=pos=>directions.map(([dc,dr])=>({col:pos.col+dc,rank:pos.rank+dr}))
    .filter(p=>p.col>=0&&p.col<3&&p.rank>=0&&p.rank<3&&
      !blocked.has(p.col+':'+p.rank));
  if(hazard.has(from.col+':'+from.rank)){
    const safe=neighbors(from).filter(p=>!hazard.has(p.col+':'+p.rank))
      .sort((a,b)=>{
        const options=p=>attacks.filter(attack=>isTacticalTargetValid(attack,p,target));
        return Math.max(0,...options(b).map(x=>x.damage))-
          Math.max(0,...options(a).map(x=>x.damage));
      });
    if(safe.length)return {move:safe[0]};
  }
  if(valid.length)return {attack:valid[0]};
  // Breadth-first movement through unoccupied cells. Avoid hazardous tiles
  // where possible, but allow them if the formation leaves no other route.
  const visited=new Set([from.col+':'+from.rank]);
  const queue=[{pos:from,first:null}];
  const options=[];
  for(let i=0;i<queue.length;i++){
    const {pos,first}=queue[i];
    if(first && attacks.some(a=>isTacticalTargetValid(a,pos,target))){
      options.push({first,pos,depth:i,risk:hazard.has(first.col+':'+first.rank)?1:0});
    }
    const next=neighbors(pos).filter(p=>!visited.has(p.col+':'+p.rank))
      .sort((a,b)=>Number(hazard.has(a.col+':'+a.rank))-
        Number(hazard.has(b.col+':'+b.rank)));
    for(const candidate of next){
      visited.add(candidate.col+':'+candidate.rank);
      queue.push({pos:candidate,first:first||candidate});
    }
  }
  if(options.length){
    // The queue is in increasing step distance. Among equally reachable
    // firing squares, prefer a safe first step.
    options.sort((a,b)=>a.risk-b.risk||a.depth-b.depth);
    return {move:options[0].first};
  }
  return {attack:kit.find(a=>a.fallback)};
}

// All class kits inherit their equipped weapon's baseline reach plus an
// always-available weak Pulse. A class is free to replace/add class skills,
// but never loses the emergency target-anywhere fallback.
export function hasFullTacticalCoverage(weaponType, classAttackIds=[]) {
  const set=getTacticalAttacks(weaponType,classAttackIds);
  return ['short','mid','long'].every(reach=>set.some(a=>a.reach===reach)) &&
    set.some(a=>a.fallback && a.from.length===3 && a.to.length===3);
}
