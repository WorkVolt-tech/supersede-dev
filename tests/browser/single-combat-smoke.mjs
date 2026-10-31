// Real React CombatScreen smoke test for ordinary 1v1 and boss encounter
// pathways. This never connects to the live player's Supabase database.
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'

const host='http://127.0.0.1:4175'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js',
  '--host','127.0.0.1','--port','4175','--strictPort'],{
  stdio:'pipe',env:{...process.env,
    VITE_SUPABASE_URL:'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY:'browser-test-key'},
})
let browser
function check(value,label){assert.ok(value,label)}
async function ready(){
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Vite failed to start')
    try{const response=await fetch(host+'/tests/browser/single-combat.html')
      if(response.ok)return}catch{}
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  throw Error('Vite server timed out')
}
async function runClasslessTriadScenario(view) {
  const errors=[]
  view.on('pageerror',error=>errors.push(error.message))
  await view.goto(host+'/tests/browser/single-combat.html?scenario=triad-fire',
    {waitUntil:'networkidle'})
  const banner=view.locator('.combat-fusion-status')
  await banner.waitFor()
  check((await banner.textContent()).includes('fire Elemental Triad'),
    'single triad: classless fusion identity missing')
  const signature=view.locator('.combat-signature-action')
  check(await signature.isDisabled(),'single triad: signature unlocked before toggle')
  await view.getByRole('button',{name:'Enable Fusion',exact:true}).click()
  await view.getByRole('button',{name:'Preview ✦ Fire Triad Resonance'}).click()
  check(await view.locator('.signature-preview-guard').count()===4,
    'single triad: preview must include four enemy squares')
  await signature.click()
  await view.waitForFunction(()=>document.querySelector('.combat-log')
    ?.textContent.includes('fused for'),null,{timeout:15000})
  check(await view.locator('.combat-signature-burst').count()===1,
    'single triad: effect animation missing')
  check(errors.length===0,'single triad: exceptions '+errors.join(' | '))
  console.log('PASS 1v1 classless elemental triad: 3 abilities, MP cost, preview')
  await view.screenshot({path:'test-artifacts/single-triad-fire.png',fullPage:true})
}
async function runTriadSpecialty(view,element,technique) {
  const errors=[]
  view.on('pageerror',e=>errors.push(e.message))
  await view.goto(host+'/tests/browser/single-combat.html?scenario=triad-'+element,
    {waitUntil:'networkidle'})
  const toggle=view.getByRole('button',{name:'Enable Fusion',exact:true})
  await toggle.click()
  const action=view.locator('.combat-signature-action')
  check((await action.textContent()).includes(technique),
    element+': signature name mismatch')
  await action.click()
  await view.waitForFunction(technique=>document.querySelector('.combat-log')
    ?.textContent.includes(technique),technique,{timeout:12000})
  check(await view.locator('.combat-signature-burst.triad-'+element).count()===1,
    element+': custom triad visual missing')
  check(errors.length===0,element+': exceptions '+errors.join(' | '))
  console.log('PASS 1v1 triad specialty '+element+' · '+technique)
}
async function runSignatureScenario(scenario,view) {
  const label={
    'signature-fire':'Phantom Inferno',
    'signature-earth':"Titan's Fortress",
    'signature-lightning':'Thunderous Fury',
  }[scenario]
  const errors=[]
  view.on('pageerror',error=>errors.push(error.message))
  await view.goto(host+'/tests/browser/single-combat.html?scenario='+scenario,
    {waitUntil:'networkidle'})
  const signature=view.locator('.combat-signature-action')
  await signature.waitFor()
  check(await signature.isDisabled(),scenario+': signature active before fusion')
  await view.getByRole('button',{name:'Enable Fusion',exact:true}).click()
  check(await signature.isEnabled(),scenario+': signature not enabled')
  await view.getByRole('button',{name:'Preview ✦ '+label}).click()
  check(await view.locator('.signature-preview-guard').count()===4,
    scenario+': expected four preview tiles')
  await signature.click()
  await view.waitForFunction(label=>document.querySelector('.combat-log')
    ?.textContent.includes(label)&&
    document.querySelector('.combat-signature-burst')?.textContent.includes(label),
    label,{timeout:12000})
  check(await view.locator('.combat-signature-burst').count()===1,
    scenario+': signature visual missing')
  check(errors.length===0,scenario+': browser errors '+errors.join(' | '))
  await view.screenshot({path:'test-artifacts/single-'+scenario+'.png',fullPage:true})
  console.log('PASS 1v1 '+scenario+': signature effect, preview and animation')
}
async function runScenario(scenario,view){
  const errors=[]
  view.on('pageerror',e=>errors.push(e.message))
  await view.goto(host+'/tests/browser/single-combat.html?scenario='+scenario,
    {waitUntil:'networkidle'})
  await view.locator('.combat-screen .combat-grid-field').waitFor()
  const enabled=scenario!=='unfused'
  if(enabled){
    const toggle=view.getByRole('button',{name:'Enable Fusion'})
    await toggle.waitFor()
    check((await view.locator('.combat-fusion-status').textContent())
      .includes('Fusion Lv 6'),scenario+': missing stored fusion mastery')
    await toggle.click()
    check(await view.getByRole('button',{name:'Disable Fusion'}).count()===1,
      scenario+': fusion toggle did not turn on')
  }else{
    check(await view.locator('.combat-fusion-status').count()===0,
      'unfused: controls appeared despite missing unlock')
  }
  const enemyCell=view.locator('.combat-grid-board').first().locator('button.occupied')
  await enemyCell.click()
  // The original class damage/crit system may defeat a light training foe
  // in one swing. Both an AP-spending hit and an immediate victory are valid.
  await view.waitForFunction(()=>
    document.body.dataset.outcome==='win'||
    document.querySelector('[role="progressbar"][aria-label="Action Points"]')?.getAttribute('aria-valuenow')==='29',
    null,{timeout:10000})
  const firstVictory=await view.evaluate(()=>document.body.dataset.outcome==='win')
  if(enabled){
    check((await view.locator('.combat-log').textContent()).includes('Phantom Inferno'),
      scenario+': no fusion rider on actual attack')
    check((await view.locator('.combat-status-list').textContent()).includes('cfx_emberStacks'),
      scenario+': existing ember status was not updated')
    if(!firstVictory)check(await view.evaluate(()=>window.__singleFusionMetrics.saves)===0,
      scenario+': fusion mastery saved before victory')
  }else{
    check(!(await view.locator('.combat-log').textContent()).includes('Phantom Inferno'),
      'unfused: rider applied without purchase')
  }
  // A second normal attack finishes any surviving training foe. Do not
  // assume a deterministic count of hits when criticals and class hooks run.
  if(!firstVictory){
    await enemyCell.click()
    await view.waitForFunction(()=>document.body.dataset.outcome==='win',
      null,{timeout:16000})
  }
  const expectedHits=firstVictory?1:2
  const saved=await view.evaluate(()=>window.__singleFusionMetrics)
  check(saved.saves===1,scenario+': victory was not saved once')
  if(enabled){
    check(saved.lastUpdates.fusion_mastery?.['ghostblade:fire']===45+expectedHits,
      scenario+': fusion practice was not credited for successful attacks')
  }else{
    check(!saved.lastUpdates.fusion_mastery,
      'unfused: improperly added fusion mastery')
  }
  check(saved.lastUpdates.weapon_mastery?.sword===expectedHits,
    scenario+': existing weapon mastery was not saved')
  check(errors.length===0,scenario+': browser errors '+errors.join(' | '))
  await view.screenshot({path:'test-artifacts/single-'+scenario+'.png',fullPage:true})
  console.log('PASS 1v1 '+scenario+': fusion, statuses, AP, victory, save')
}
try{
  await ready()
  await mkdir('test-artifacts',{recursive:true})
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:1280,height:900}})
  await page.goto(host+'/tests/browser/single-combat.html?scenario=loadout',{waitUntil:'networkidle'})
  const loadout=page.getByRole('button',{name:/Warbound · Lv/})
  await loadout.waitFor()
  check(await loadout.isEnabled(),'saved Warbound skill should be available in solo combat')
  console.log('PASS solo: saved Warbound loadout is visible and usable')
  await page.goto(host+'/tests/browser/single-combat.html?scenario=companions',{waitUntil:'networkidle'})
  check(await page.getByRole('button',{name:/Left Front Marcus party ally/}).count()===1,
    'Marcus should occupy a solo battlefield square')
  check(await page.getByRole('button',{name:/Right Front Lena party ally/}).count()===1,
    'Lena should occupy a solo battlefield square')
  await page.getByRole('button',{name:'End turn'}).click()
  await page.waitForFunction(()=>document.querySelector('.combat-log')
    ?.textContent.includes('Marcus repositions into attack range'),null,{timeout:12000})
  console.log('PASS solo companions: party occupies battlefield and repositions tactically')
  await runScenario('regular',page)
  await runScenario('boss',page)
  await runScenario('unfused',page)
  await runSignatureScenario('signature-fire',page)
  await runSignatureScenario('signature-earth',page)
  await runSignatureScenario('signature-lightning',page)
  await runClasslessTriadScenario(page)
  await runTriadSpecialty(page,'water','Abyssal Torrent')
  await runTriadSpecialty(page,'earth','Tectonic Ward')
  await runTriadSpecialty(page,'lightning','Storm Circuit')
  await page.close()
  console.log('PASS: single/boss fusion browser smoke')
}catch(error){
  console.error('SINGLE FUSION BROWSER FAILURE:',error)
  process.exitCode=1
}finally{
  if(browser)await browser.close()
  server.kill('SIGTERM')
}
