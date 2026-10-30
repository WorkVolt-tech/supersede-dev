// Prototype copy of src/game/tacticalGrid.js; keep in sync before deployment.
// SuperSede 3×3 tactical combat prototype rules.
// This module is pure: no Supabase writes or mutations of saved characters.
// rank 0 is the frontline on BOTH sides; columns are left=0, centre=1, right=2.
// Class abilities will eventually register patterns here, alongside weapon attacks.

export const TACTICAL_ATTACKS = {
  slash:       { label:'Sword Slash',      reach:'short', from:[0],   to:[0],       cols:'same',  shape:'single', damage:7, ap:1 },
  stab:        { label:'Dagger Stab',      reach:'short', from:[0],   to:[0],       cols:'near',  shape:'single', damage:6, ap:1 },
  jab:         { label:'Spear Jab',        reach:'short', from:[0],   to:[0,1],     cols:'same',  shape:'single', damage:6, ap:1 },
  bash:        { label:'Weapon Bash',      reach:'short', from:[0],   to:[0],       cols:'same',  shape:'single', damage:4, ap:1 },
  thrust:      { label:'Long Thrust',      reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'single', damage:5, ap:1 },
  lunge:       { label:'Shadow Lunge',     reach:'mid',   from:[0,1], to:[0,1],     cols:'near',  shape:'single', damage:5, ap:1 },
  throw:       { label:'Thrown Blade',     reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:3, ap:1 },
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
  pulse:       { label:'System Pulse',     reach:'long',  from:[0,1,2],to:[0,1,2], cols:'any',   shape:'single', damage:2, ap:1, fallback:true },
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
export function getTacticalAttacks(weaponType, classAttackIds=[], masteryXp=0) {
  const type=tacticalWeaponType(weaponType);
  const level=weaponMasteryLevel(masteryXp);
  const mastered=MASTERY_TECHNIQUES[type].filter(id=>level>=TACTICAL_ATTACKS[id].masteryLevel);
  const ids=[...TACTICAL_WEAPONS[type].attacks, ...mastered,
    ...classAttackIds.filter(id=>Boolean(TACTICAL_ATTACKS[id]) &&
      (!TACTICAL_ATTACKS[id].masteryLevel || level>=TACTICAL_ATTACKS[id].masteryLevel))];
  return [...new Set(ids)].map(id=>({id,...TACTICAL_ATTACKS[id]}));
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
      a.shape==='cross'?delta<=1:false;
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
export function chooseTacticalEnemyAction(weaponType, from, target, occupied=[]) {
  const kit=getTacticalAttacks(weaponType);
  // Low-tier unarmed foes do not inherit the player's advanced magical Wave;
  // they must close distance or use the weak emergency fallback.
  const attacks=kit.filter(a=>!a.fallback &&
    !(tacticalWeaponType(weaponType)==='unarmed' && a.id==='wave'));
  const valid=attacks.filter(a=>isTacticalTargetValid(a,from,target))
    .sort((a,b)=>b.damage-a.damage);
  if(valid.length)return {attack:valid[0]};
  const next=[[0,-1],[-1,0],[1,0],[0,1]]
    .map(([dc,dr])=>({col:from.col+dc,rank:from.rank+dr}))
    .filter(p=>p.col>=0&&p.col<3&&p.rank>=0&&p.rank<3&&
      !occupied.some(x=>x.col===p.col&&x.rank===p.rank))
    .map(pos=>({pos,options:attacks.filter(a=>isTacticalTargetValid(a,pos,target))}))
    .filter(candidate=>candidate.options.length)
    .sort((a,b)=>b.options.length-a.options.length);
  return next.length?{move:next[0].pos}:{attack:kit.find(a=>a.fallback)};
}

// All class kits inherit their equipped weapon's baseline reach plus an
// always-available weak Pulse. A class is free to replace/add class skills,
// but never loses the emergency target-anywhere fallback.
export function hasFullTacticalCoverage(weaponType, classAttackIds=[]) {
  const set=getTacticalAttacks(weaponType,classAttackIds);
  return ['short','mid','long'].every(reach=>set.some(a=>a.reach===reach)) &&
    set.some(a=>a.fallback && a.from.length===3 && a.to.length===3);
}
