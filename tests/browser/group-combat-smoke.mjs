// Browser-level smoke test of the REAL GroupCombatScreen, not the older
// four-rank CombatDemoPage. All data is synthetic and local to the harness.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const host='http://127.0.0.1:4173'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js',
  '--host','127.0.0.1','--port','4173','--strictPort'],{
  stdio:'pipe',env:{
    ...process.env,
    // Prevent the browser fixture from pointing at a real Supabase project.
    VITE_SUPABASE_URL:'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY:'browser-test-key',
  },
})
let browser
const consoleErrors=[]
function check(condition,message){assert.ok(condition,message)}
async function ready(){
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Vite exited unexpectedly: '+server.exitCode)
    try{
      const response=await fetch(host+'/tests/browser/group-combat.html')
      if(response.ok)return
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  throw Error('Timed out waiting for Vite dev server')
}
function parseHps(texts){
  return texts.map(s=>{
    const match=s.match(/(\d+)\/(\d+) HP/)
    if(!match)throw Error('No HP reading in '+s)
    return Number(match[1])
  })
}
async function inspect(page,name,mobile) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html',{waitUntil:'networkidle'})
  await page.locator('.group-combat').waitFor()
  const enemyBoard=page.locator('.combat-grid-board').first()
  check(await page.locator('.combat-grid-board').count()===2,name+': missing boards')
  check(await enemyBoard.locator('button').count()===9,name+': enemy board is not 3x3')
  check(await page.locator('.combat-grid-board').last().locator('button').count()===9,
    name+': hero board is not 3x3')
  check(await enemyBoard.locator('button.occupied').count()===3,name+': missing foes')
  check(await page.locator('.combat-group-enemies').count()===0,name+': obsolete enemy cards returned')
  check(await page.getByRole('button',{name:/Use Sword Slash|Attack .*Sword Slash/}).count()===0,
    name+': obsolete attack button returned')
  check((await page.locator('.combat-turn-banner').textContent()).includes('6/6 AP'),
    name+': expected five starting AP')
  const viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,
    viewport:innerWidth}))
  check(viewport.scroll<=viewport.viewport+2,name+': horizontal overflow')
  await page.screenshot({path:'test-artifacts/'+name+'-initial.png',fullPage:true})
  // Choosing an attack must show every square of its actual footprint.
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/Sweeping Arc/}).click()
  check(await enemyBoard.locator('button.splash').count()===3,
    name+': row pattern does not light up all three squares')
  check((await page.locator('.combat-attack-preview').textContent()).includes('3 enemies'),
    name+': attack preview hit count incorrect')
  // Tap the centre highlighted square to perform the attack on the whole row.
  await enemyBoard.locator('button.splash').nth(1).click()
  await page.waitForFunction(()=>{
    const foes=[...document.querySelectorAll('.combat-grid-board')][0]
      ?.querySelectorAll('button.occupied')||[]
    return foes.length===3&&[...foes].every(cell=>{
      const match=cell.textContent.match(/#\d+ (\d+) HP/)
      return match&&Number(match[1])<40
    })
  },null,{timeout:10000})
  check((await page.locator('.combat-turn-banner').textContent()).includes('4/6 AP'),
    name+': row attack did not consume two AP')
  await page.screenshot({path:'test-artifacts/'+name+'-after-aoe.png',fullPage:true})
  if(mobile) {
    const board=page.locator('.combat-grid-board').last()
    await board.locator('button.movable').first().click()
    check((await page.locator('.combat-turn-banner').textContent()).includes('4/6 AP'),
      name+': movement must not consume AP')
    await board.locator('button.movable').first().click()
    check((await page.locator('.combat-turn-banner').textContent()).includes('4/6 AP'),
      name+': second movement must not consume AP')
    await page.getByRole('button',{name:'End turn'}).click()
    await page.waitForFunction(()=>document.querySelector('.combat-turn-banner')
      ?.textContent.includes('6/6 AP'),null,{timeout:10000})
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)
    check(!overflow,name+': horizontal scrolling after movement')
  }
  check(errors.length===0,name+': browser exceptions '+errors.join(' | '))
  consoleErrors.push(...errors)
  console.log('PASS '+name+': grid selection, 3-square AoE, 5 AP and no duplicate controls')
}
async function verifySignatures(page) {
  for(const [element,label,kind] of [
    ['fire','Phantom Inferno','phantom'],
    ['earth',"Titan's Fortress",'titan'],
    ['lightning','Thunderous Fury','thunder'],
  ]) {
    const errors=[]
    page.on('pageerror',e=>errors.push(e.message))
    await page.goto(host+'/tests/browser/group-combat.html?scenario=signature-'+element,
      {waitUntil:'networkidle'})
    const signature=page.locator('.combat-signature-action')
    await signature.waitFor()
    check(await signature.isDisabled(),element+': locked before fusion enabled')
    await page.getByRole('button',{name:'Enable Fusion',exact:true}).click()
    check(await signature.isEnabled(),element+': enabled fusion still locked')
    await page.getByRole('button',{name:'Preview ✦ '+label}).click()
    if(element==='earth') {
      check(await page.locator('.combat-grid-board').last()
        .locator('.signature-preview-guard').count()===4,
        'earth: missing protected ally cross preview')
    }else {
      check(await page.locator('.combat-grid-board').first()
        .locator('button.splash').count()===4,
        element+': incorrect enemy-area preview')
    }
    check((await page.locator('.combat-attack-preview').first().textContent())
      .includes(label),element+': signature preview label missing')
    await signature.click()
    await page.waitForFunction(label=>document.querySelector('.combat-log')
      ?.textContent.includes(label)&&
      document.querySelector('.combat-signature-burst')?.textContent.includes(label),
      label,{timeout:10000})
    check(await page.locator('.combat-signature-burst.signature-'+kind).count()===1,
      element+': no unique signature animation')
    check(await page.evaluate(()=>window.__tacticalTestMetrics.saves)===0,
      element+': signature saved player before victory')
    await page.getByRole('button',{name:'End turn'}).click()
    await page.waitForFunction(()=>
      document.querySelector('.combat-turn-banner')?.textContent.includes('30/30 AP'),
      null,{timeout:10000})
    check((await signature.textContent()).includes('Cooldown: 3 rounds'),
      element+': signature should start with 3-round cooldown')
    check(await signature.isDisabled(),element+': signature ignored cooldown')
    if(element==='fire'){
      check(await page.locator('.combat-grid-board').first()
        .locator('.hazard').count()===4,
        'fire: persistent burning field missing')
    }
    if(element==='lightning'){
      check((await page.locator('.combat-log').textContent()).includes('3 enemies'),
        'lightning: three-target chain missing')
    }
    check(errors.length===0,element+': browser exceptions '+errors.join(' | '))
    await page.screenshot({path:'test-artifacts/signature-'+element+'.png',fullPage:true})
    console.log('PASS signature '+element+': '+label+' targeting, effects and cooldown')
  }
}
async function verifyClasslessTriad(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=triad-fire',
    {waitUntil:'networkidle'})
  const status=page.locator('.combat-fusion-status')
  await status.waitFor()
  check((await status.textContent()).includes('fire Elemental Triad'),
    'triad: classless character did not receive fusion')
  check(!(await status.textContent()).includes('null +'),
    'triad: incorrect class identity')
  const signature=page.locator('.combat-signature-action')
  check(await signature.isDisabled(),'triad: signature enabled before fusion toggle')
  await page.getByRole('button',{name:'Enable Fusion',exact:true}).click()
  check(await signature.isEnabled(),'triad: active signature was locked')
  await page.getByRole('button',{name:'Preview ✦ Fire Triad Resonance'}).click()
  check(await page.locator('.combat-grid-board').first()
    .locator('button.splash').count()===4,
    'triad: cross preview missing')
  await signature.click()
  await page.waitForFunction(()=>document.querySelector('.combat-log')
    ?.textContent.includes('fused into one attack'),
    null,{timeout:15000})
  const log=await page.locator('.combat-log').textContent()
  for(const label of ['Fire Blast','Cinderstorm'])
    check(log.toLowerCase().includes(label.toLowerCase()),
      'triad: missing source formula '+label)
  check(await page.evaluate(()=>window.__tacticalTestMetrics.saves)===0,
    'triad: mastery saved before victory')
  await page.getByRole('button',{name:'End turn'}).click()
  await page.waitForFunction(()=>document.querySelector('.combat-turn-banner')
    ?.textContent.includes('30/30 AP'),null,{timeout:15000})
  check((await signature.textContent()).includes('Cooldown: 4 rounds'),
    'triad: 4-round cooldown not set')
  check(await page.locator('.combat-grid-board').first()
    .locator('.hazard').count()===4,'triad: lingering fire zone not created')
  check(errors.length===0,'triad: browser exceptions '+errors.join(' | '))
  console.log('PASS triad: classless path fuses 3 learned elemental attacks in one cast')
  await page.screenshot({path:'test-artifacts/triad-fire.png',fullPage:true})
}
async function verifyTriadSpecialties(page) {
  const techniques={
    water:'Abyssal Torrent',lightning:'Storm Circuit',
    arcane:'Resonance Collapse',shadow:'Umbral Trinity',
    earth:'Tectonic Ward',wind:'Cyclone Weave',plant:'Verdant Rebirth',
    metal:'Iron Cataclysm',poison:'Plague Bloom',
  }
  for(const [element,technique] of Object.entries(techniques)){
    const errors=[]
    page.on('pageerror',error=>errors.push(error.message))
    await page.goto(host+'/tests/browser/group-combat.html?scenario=triad-'+element,
      {waitUntil:'networkidle'})
    await page.getByRole('button',{name:'Enable Fusion',exact:true}).click()
    const action=page.locator('.combat-signature-action')
    check((await action.textContent()).includes(technique),
      element+': signature technique is absent from button')
    await action.click()
    await page.waitForFunction(technique=>document.querySelector('.combat-log')
      ?.textContent.includes(technique),technique,{timeout:13000})
    check(await page.locator('.combat-signature-burst.signature-triad.triad-'+
      element).count()===1,element+': unique effect accent missing')
    check(await page.locator('.combat-turn-banner').count()===1,
      element+': battle frame did not render after triad')
    check(errors.length===0,element+': runtime errors '+errors.join(' | '))
    console.log('PASS triad specialty: '+element+' · '+technique)
  }
}
async function verifyTriadVictory(page) {
  await page.goto(host+'/tests/browser/group-combat.html?scenario=triad-victory',
    {waitUntil:'networkidle'})
  await page.locator('.combat-fusion-status').waitFor()
  await page.getByRole('button',{name:'Enable Fusion',exact:true}).click()
  await page.locator('.combat-signature-action').click()
  // Signature may win immediately. Only end the round if foes survive.
  await page.waitForFunction(()=>document.body.dataset.outcome==='win'||
    document.querySelector('.combat-result.win'),null,{timeout:4000}).catch(()=>{})
  if(!(await page.evaluate(()=>document.body.dataset.outcome==='win'))&&
    !(await page.locator('.combat-result.win').count()))
    await page.getByRole('button',{name:'End turn'}).click()
  await page.waitForFunction(()=>document.body.dataset.outcome==='win',
    null,{timeout:15000})
  const metrics=await page.evaluate(()=>window.__tacticalTestMetrics)
  check(metrics.saves===1,'triad victory: result saved multiple times')
  check(metrics.lastUpdates?.fusion_mastery?.['triad:fire']===1,
    'triad victory: triad mastery was not awarded')
  check(!metrics.lastUpdates?.active_class,
    'triad victory: character unexpectedly gained a class')
  console.log('PASS triad victory: exactly-once mastery save and no class assignment')
}
async function verifyFusionVictory(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=fusion-victory',
    {waitUntil:'networkidle'})
  await page.locator('.combat-fusion-status').waitFor()
  await page.getByRole('button',{name:'Enable Fusion'}).click()
  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  await page.locator('.combat-grid-board').first().locator('button.splash').nth(1).click()
  await page.waitForFunction(()=>document.body.dataset.outcome==='win',
    null,{timeout:15000})
  const result=await page.evaluate(()=>{
    const p=window.__tacticalTestMetrics
    return {saves:p.saves,mastery:p.lastUpdates?.fusion_mastery,
      weapon:p.lastUpdates?.weapon_mastery}
  })
  check(result.saves===1,'fusion victory: outcome saved more than once')
  check(result.mastery?.['ghostblade:fire']===46,
    'fusion victory: active pair practice XP was not saved')
  check(result.weapon?.sword===1,
    'fusion victory: original weapon mastery was lost')
  check(errors.length===0,'fusion victory: browser exceptions '+errors.join(' | '))
  console.log('PASS fusion victory: pair XP and weapon XP saved exactly once')
}
async function verifyFusion(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=fusion',
    {waitUntil:'networkidle'})
  await page.locator('.combat-grid-board').first().locator('button.occupied').first().waitFor()
  const fusion=page.locator('.combat-fusion-status')
  await fusion.waitFor()
  check((await fusion.textContent()).includes('ghostblade + fire'),
    'fusion: unlocked class/element pair was not shown')
  check((await fusion.textContent()).includes('Fusion Lv 6'),
    'fusion: pair-specific mastery did not load')
  await page.getByRole('button',{name:'Enable Fusion'}).click()
  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  await page.locator('.combat-grid-board').first().locator('button.splash').nth(1).click()
  await page.waitForFunction(()=>[...document.querySelectorAll('.combat-grid-board')[0]?.querySelectorAll('button.occupied')]
    .filter(unit=>unit.textContent.includes('🔥')).length===3,
    null,{timeout:10000})
  check((await page.locator('.combat-log').textContent()).includes('Phantom Inferno'),
    'fusion: signature rider was not applied')
  const banner=await page.locator('.combat-turn-banner').textContent()
  check(/\d+\/\d+ MP/.test(banner),
    'fusion: no MP resource in real battle')
  check(await page.evaluate(()=>window.__tacticalTestMetrics.saves)===0,
    'fusion: should not save during combat before victory')
  check(errors.length===0,'fusion: browser exceptions '+errors.join(' | '))
  await page.screenshot({path:'test-artifacts/desktop-fusion.png',fullPage:true})
  console.log('PASS fusion: separate unlock, mastery, signature, multi-foe infusion')
}
async function verifyMastery(page) {
  await page.goto(host+'/tests/browser/group-combat.html?scenario=mastery',
    {waitUntil:'networkidle'})
  await page.locator('.combat-grid-board').first().locator('button.occupied').first().waitFor()
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/Sword Slash/}).click()
  check((await page.locator('.combat-attack-preview').textContent()).includes('diamond2'),
    'mastery: Sword Slash did not evolve')
  check(await page.locator('.combat-grid-board').first().locator('button.splash').count()===7,
    'mastery: front-centre diamond2 should cover 7 board squares')
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/Emergency Attack/}).click()
  check((await page.locator('.combat-attack-preview').textContent()).includes('single'),
    'mastery: Emergency Attack fallback must remain single-target')
  console.log('PASS mastery: expanded slash and unchanged pulse')
}
async function verifyVictory(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=victory',
    {waitUntil:'networkidle'})
  await page.locator('.combat-grid-board').first().locator('button.occupied').first().waitFor()
  check(await page.locator('.combat-grid-board').first().locator('button.occupied').count()===3,
    'victory: expected three opponents')

  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  check((await page.locator('.combat-attack-preview').textContent())
    .includes('3 enemies'),'victory: wrong area preview')
  await page.locator('.combat-grid-board').first().locator('button.splash').nth(1).click()

  // Actual combat completion includes the asynchronous save, followed by
  // the story callback. No real Supabase writes occur in this fixture.
  await page.waitForFunction(()=>document.body.dataset.outcome==='win',
    null,{timeout:12000})
  check(await page.locator('.combat-result.win').count()===1,
    'victory: win banner missing')
  check((await page.locator('.combat-turn-banner').textContent())
    .includes('0/3 enemies remaining'),'victory: remaining enemy counter incorrect')
  check(await page.evaluate(()=>window.__tacticalTestMetrics.saves)===1,
    'victory: result should be saved exactly once')
  check(errors.length===0,'victory: browser exceptions '+errors.join(' | '))
  await page.screenshot({path:'test-artifacts/desktop-victory.png',fullPage:true})
  console.log('PASS victory: 3 targets defeated, one save, story win callback')
}

try{
  await ready()
  await mkdir('test-artifacts',{recursive:true})
  browser=await chromium.launch({headless:true})
  const desktop=await browser.newPage({viewport:{width:1280,height:900}})
  await desktop.goto(host+'/tests/browser/group-combat.html?scenario=loadout',{waitUntil:'networkidle'})
  const loadout=desktop.getByRole('button',{name:/Warbound · Lv/})
  await loadout.waitFor()
  check(await loadout.isEnabled(),'saved Warbound skill should be available in group combat')
  console.log('PASS group: saved Warbound loadout is visible and usable')
  await desktop.goto(host+'/tests/browser/group-combat.html?scenario=companions',{waitUntil:'networkidle'})
  check(await desktop.getByRole('button',{name:'Marcus · party ally'}).count()===1,
    'Marcus should occupy a group battlefield square')
  check(await desktop.getByRole('button',{name:'Lena · party ally'}).count()===1,
    'Lena should occupy a different group battlefield square')
  await desktop.getByRole('button',{name:'End turn'}).click()
  await desktop.waitForFunction(()=>document.querySelector('.combat-log')
    ?.textContent.includes('Marcus attacks'),null,{timeout:12000})
  console.log('PASS group companions: party occupies battlefield and attacks')
  await inspect(desktop,'desktop',false)
  await verifyMastery(desktop)
  await verifyFusion(desktop)
  await verifySignatures(desktop)
  await verifyClasslessTriad(desktop)
  await verifyTriadSpecialties(desktop)
  await verifyTriadVictory(desktop)
  await verifyFusionVictory(desktop)
  await verifyVictory(desktop)
  await desktop.close()
  const mobile=await browser.newPage({viewport:{width:390,height:844},
    deviceScaleFactor:1,isMobile:true,hasTouch:true})
  await inspect(mobile,'mobile',true)
  await mobile.close()
  console.log('PASS: all browser smoke checks')
}catch(error){
  console.error('BROWSER SMOKE FAILURE:',error)
  process.exitCode=1
}finally{
  if(browser)await browser.close()
  server.kill('SIGTERM')
}
