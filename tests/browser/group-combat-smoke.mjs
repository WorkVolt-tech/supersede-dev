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
async function inspect(page,name,mobile){
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html',{waitUntil:'networkidle'})
  await page.locator('.group-combat').waitFor()
  check(await page.locator('.combat-grid-board').count()===2,name+': missing 2 boards')
  check(await page.locator('.combat-grid-board').first().locator('button').count()===9,name+': enemy cells != 9')
  check(await page.locator('.combat-grid-board').last().locator('button').count()===9,name+': ally cells != 9')
  const units=page.locator('.combat-group-unit')
  check(await units.count()===3,name+': expected 3 independent foes')
  check(await page.locator('.combat-grid-board').first().locator('button.occupied').count()===3,
    name+': occupied squares missing')
  const initial=parseHps(await units.allTextContents())
  check(initial.every(value=>value===40),name+': incorrect starting HP: '+initial)
  check(await page.locator('.combat-turn-banner').textContent().then(t=>t.includes('2/2 AP')),
    name+': 2 action points missing')
  const viewport=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,
    viewport:innerWidth}))
  check(viewport.scroll<=viewport.viewport+2,
    name+': horizontal overflow '+JSON.stringify(viewport))
  await page.screenshot({path:'test-artifacts/'+name+'-initial.png',fullPage:true})

  // Selecting an enemy is free; targeting the enemy grid or list should
  // highlight exactly one foe, and never accidentally spend an AP.
  await units.nth(1).click()
  check(await units.nth(1).evaluate(node=>node.classList.contains('current')),
    name+': target selection not reflected')
  check((await page.locator('.combat-turn-banner').textContent()).includes('2/2 AP'),
    name+': target selection spent AP')
  // Sword Slash hits the same column only. Selecting a foe in another
  // column should show honest feedback and disable the attack.
  check(await page.locator('.combat-range-warning').count()===1,
    name+': out-of-range target did not show a warning')
  check(await page.getByRole('button',{name:/Use Sword Slash/}).isDisabled(),
    name+': out-of-range slash remained enabled')
  await units.first().click()
  check(await page.locator('.combat-range-warning').count()===0,
    name+': target range warning did not clear')

  // Sweeping Arc has row AoE and costs both AP. All three front-row rats
  // must take damage from the actual live weapon handler.
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/Sweeping Arc/}).click()
  check(await page.locator('.combat-grid-board').first().locator('button.splash').count()===3,
    name+': Sweeping Arc footprint preview misses front row')
  check((await page.locator('.combat-attack-preview').textContent()).includes('3 enemies'),
    name+': AoE preview hit count is inaccurate')
  await page.getByRole('button',{name:/Use Sweeping Arc/}).click()
  await page.waitForFunction(()=>{
    const rows=[...document.querySelectorAll('.combat-group-unit')]
    return rows.length===3&&rows.every(node=>{
      const m=node.textContent.match(/(\d+)\/(\d+) HP/)
      return m&&Number(m[1])<40
    })
  },null,{timeout:10000})
  const after=parseHps(await units.allTextContents())
  check(after.every(hp=>hp<40),name+': row AoE missed enemies: '+after)
  // Damage is rendered before the asynchronous slower-enemy phase finishes.
  // Wait until combat controls are usable again, not merely until HP changes.
  await page.waitForFunction(()=>{
    const banner=document.querySelector('.combat-turn-banner')
    const end=[...document.querySelectorAll('.combat-actions button')]
      .find(button=>button.textContent.trim()==='End turn')
    return banner?.textContent.includes('2/2 AP')&&end&&!end.disabled
  },null,{timeout:10000})
  await page.screenshot({path:'test-artifacts/'+name+'-after-aoe.png',fullPage:true})

  if(mobile){
    // A tap on an adjacent unoccupied friendly square moves exactly one
    // grid step for 1 AP; it must not activate a 2-AP sweep afterward.
    const move=page.locator('.combat-grid-board').last().locator('button.movable').first()
    check(await move.count()===1,name+': no legal mobile movement target')
    await move.click()
    check((await page.locator('.combat-turn-banner').textContent()).includes('1/2 AP'),
      name+': moving did not consume exactly 1 AP')
    check(await page.getByRole('button',{name:/Use Sweeping Arc/}).isDisabled(),
      name+': 2-AP AoE wrongly enabled with 1 AP')
    await page.getByRole('button',{name:'End turn'}).click()
    await page.waitForFunction(()=>{
      const banner=document.querySelector('.combat-turn-banner')
      const end=[...document.querySelectorAll('.combat-actions button')]
        .find(button=>button.textContent.trim()==='End turn')
      return banner?.textContent.includes('2/2 AP')&&end&&!end.disabled
    },null,{timeout:10000})
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)
    check(!overflow,name+': horizontal scroll after combat interaction')
    await page.screenshot({path:'test-artifacts/'+name+'-after-move.png',fullPage:true})
  }
  check(errors.length===0,name+': browser exceptions '+errors.join(' | '))
  consoleErrors.push(...errors)
  process.stdout.write('PASS '+name+': group formation, AoE, AP, selection, viewport'+
    (mobile?', touch movement':'')+'\n')
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
    await page.waitForFunction(()=>
      document.querySelector('.combat-turn-banner')?.textContent.includes('2/2 AP'),
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
async function verifyFusionVictory(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=fusion-victory',
    {waitUntil:'networkidle'})
  await page.locator('.combat-fusion-status').waitFor()
  await page.getByRole('button',{name:'Enable Fusion'}).click()
  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  await page.getByRole('button',{name:/Use Sweeping Arc/}).click()
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
  await page.locator('.combat-group-unit').first().waitFor()
  const fusion=page.locator('.combat-fusion-status')
  await fusion.waitFor()
  check((await fusion.textContent()).includes('ghostblade + fire'),
    'fusion: unlocked class/element pair was not shown')
  check((await fusion.textContent()).includes('Fusion Lv 6'),
    'fusion: pair-specific mastery did not load')
  await page.getByRole('button',{name:'Enable Fusion'}).click()
  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  await page.getByRole('button',{name:/Use Sweeping Arc/}).click()
  await page.waitForFunction(()=>[...document.querySelectorAll('.combat-group-unit')]
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
  await page.locator('.combat-group-unit').first().waitFor()
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/Sword Slash/}).click()
  check((await page.locator('.combat-attack-preview').textContent()).includes('diamond2'),
    'mastery: Sword Slash did not evolve')
  check(await page.locator('.combat-grid-board').first().locator('button.splash').count()===7,
    'mastery: front-centre diamond2 should cover 7 board squares')
  await page.locator('.combat-tactical-weapons').getByRole('button',
    {name:/System Pulse/}).click()
  check((await page.locator('.combat-attack-preview').textContent()).includes('single'),
    'mastery: System Pulse fallback must remain single-target')
  console.log('PASS mastery: expanded slash and unchanged pulse')
}
async function verifyVictory(page) {
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario=victory',
    {waitUntil:'networkidle'})
  await page.locator('.combat-group-unit').first().waitFor()
  check(await page.locator('.combat-group-unit').count()===3,
    'victory: expected three opponents')

  await page.locator('.combat-tactical-weapons')
    .getByRole('button',{name:/Sweeping Arc/}).click()
  check((await page.locator('.combat-attack-preview').textContent())
    .includes('3 enemies'),'victory: wrong area preview')
  await page.getByRole('button',{name:/Use Sweeping Arc/}).click()

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
  await inspect(desktop,'desktop',false)
  await verifyMastery(desktop)
  await verifyFusion(desktop)
  await verifySignatures(desktop)
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
