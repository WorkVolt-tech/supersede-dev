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
  await view.waitForFunction(()=>document.querySelector('.combat-tactical-status')
    ?.textContent.includes('1/2 AP'),null,{timeout:10000})
  if(enabled){
    check((await view.locator('.combat-log').textContent()).includes('Phantom Inferno'),
      scenario+': no fusion rider on actual attack')
    check((await view.locator('.combat-status-list').textContent()).includes('cfx_emberStacks'),
      scenario+': existing ember status was not updated')
    check(await view.evaluate(()=>window.__singleFusionMetrics.saves)===0,
      scenario+': fusion mastery saved before victory')
  }else{
    check(!(await view.locator('.combat-log').textContent()).includes('Phantom Inferno'),
      'unfused: rider applied without purchase')
  }
  // A second original Sword Slash finishes the encounter without touching
  // boss choreography or bypassing the normal save/transition code.
  await enemyCell.click()
  await view.waitForFunction(()=>document.body.dataset.outcome==='win',
    null,{timeout:16000})
  const saved=await view.evaluate(()=>window.__singleFusionMetrics)
  check(saved.saves===1,scenario+': victory was not saved once')
  if(enabled){
    check(saved.lastUpdates.fusion_mastery?.['ghostblade:fire']===47,
      scenario+': fusion practice was not credited for both hits')
  }else{
    check(!saved.lastUpdates.fusion_mastery,
      'unfused: improperly added fusion mastery')
  }
  check(saved.lastUpdates.weapon_mastery?.sword===2,
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
  await runScenario('regular',page)
  await runScenario('boss',page)
  await runScenario('unfused',page)
  await page.close()
  console.log('PASS: single/boss fusion browser smoke')
}catch(error){
  console.error('SINGLE FUSION BROWSER FAILURE:',error)
  process.exitCode=1
}finally{
  if(browser)await browser.close()
  server.kill('SIGTERM')
}
