// Companion positions are battle-local. Actions never ignore weapon range.
const CELLS=Array.from({length:9},(_,i)=>({col:i%3,rank:Math.floor(i/3)}))
const distance=(a,b)=>1+a.rank+b.rank+Math.abs(a.col-b.col)
const key=p=>p.col+':'+p.rank
export function initialCompanionPositions(companions,hero) {
  const used=new Set([key(hero)])
  return companions.map((member,i)=>{
    const preferred=[{col:0,rank:0},{col:2,rank:0},{col:0,rank:1},{col:2,rank:1},{col:0,rank:2},{col:2,rank:2},{col:1,rank:1},{col:1,rank:2}]
    const pos=preferred.find(p=>!used.has(key(p)))||CELLS.find(p=>!used.has(key(p)))
    if(pos)used.add(key(pos))
    return {...member,...(pos||{col:1,rank:2})}
  })
}
export function decideCompanionAction(member,allies,enemies,threats=[],hero=null) {
  const alive=enemies.filter(e=>e.hp>0)
  if(!alive.length)return {kind:'wait'}
  const range=member.range|| (member.id==='rhen'||member.id==='gio'||member.id==='kai'?'long':'short')
  const cap=range==='long'?7:range==='mid'?3:1
  const threatened=p=>threats.some(t=>t.col===p.col&&t.rank===p.rank)
  const canHit=p=>alive.filter(e=>distance(p,e)<=cap)
  const occupied=new Set(allies.filter(a=>a.id!==member.id).map(key))
  if(hero)occupied.add(key(hero))
  const neighbors=CELLS.filter(p=>Math.abs(p.col-member.col)+Math.abs(p.rank-member.rank)===1&&!occupied.has(key(p)))
  const here=canHit(member)
  if(threatened(member)){
    const escape=neighbors.filter(p=>!threatened(p)).sort((a,b)=>canHit(b).length-canHit(a).length)[0]
    if(escape)return {kind:'move',to:escape,reason:'evades a threatened square'}
  }
  if(here.length)return {kind:'attack',target:here.sort((a,b)=>a.hp-b.hp)[0]}
  const next=neighbors.sort((a,b)=>(threatened(a)?100:0)-(threatened(b)?100:0)+
    Math.min(...alive.map(e=>distance(a,e)))-Math.min(...alive.map(e=>distance(b,e))))[0]
  return next?{kind:'move',to:next,reason:'repositions into attack range'}:{kind:'wait'}
}
