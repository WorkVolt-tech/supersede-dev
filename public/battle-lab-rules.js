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
export function getTacticalAttacks(weaponType, classAttackIds=[]) {
  const type=tacticalWeaponType(weaponType);
  const ids=[...TACTICAL_WEAPONS[type].attacks,
    ...classAttackIds.filter(id=>Boolean(TACTICAL_ATTACKS[id]))];
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
export const MASTERY_XP_THRESHOLDS=[0,5,14,28,48];
export function weaponMasteryLevel(xp=0) {
  const value=Math.max(0,Math.floor(Number(xp)||0));
  let level=1;
  for(let i=1;i<MASTERY_XP_THRESHOLDS.length;i++)if(value>=MASTERY_XP_THRESHOLDS[i])level=i+1;
  return level;
}
export function weaponMasteryBonus(xp=0) {
  return weaponMasteryLevel(xp)-1; // +0..+4 damage in this prototype
}
export function awardWeaponMastery(mastery, weaponType, successfulHits=1) {
  const type=tacticalWeaponType(weaponType);
  return {...mastery,[type]:(mastery[type]||0)+Math.max(0,Math.floor(successfulHits))};
}
export function nextWeaponMasteryThreshold(xp) {
  return MASTERY_XP_THRESHOLDS.find(value=>value>xp)??null;
}

// All class kits inherit their equipped weapon's baseline reach plus an
// always-available weak Pulse. A class is free to replace/add class skills,
// but never loses the emergency target-anywhere fallback.
export function hasFullTacticalCoverage(weaponType, classAttackIds=[]) {
  const set=getTacticalAttacks(weaponType,classAttackIds);
  return ['short','mid','long'].every(reach=>set.some(a=>a.reach===reach)) &&
    set.some(a=>a.fallback && a.from.length===3 && a.to.length===3);
}
