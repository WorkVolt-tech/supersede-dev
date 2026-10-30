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
  check((await page.locator('.combat-turn-banner').textContent()).includes('2/2 AP'),
    name+': turn did not reset after two-AP action')
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
    await page.waitForFunction(()=>document.querySelector('.combat-turn-banner')?.textContent.includes('2/2 AP'))
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)
    check(!overflow,name+': horizontal scroll after combat interaction')
    await page.screenshot({path:'test-artifacts/'+name+'-after-move.png',fullPage:true})
  }
  check(errors.length===0,name+': browser exceptions '+errors.join(' | '))
  consoleErrors.push(...errors)
  process.stdout.write('PASS '+name+': group formation, AoE, AP, selection, viewport'+
    (mobile?', touch movement':'')+'\n')
}

try{
  await ready()
  await mkdir('test-artifacts',{recursive:true})
  browser=await chromium.launch({headless:true})
  const desktop=await browser.newPage({viewport:{width:1280,height:900}})
  await inspect(desktop,'desktop',false)
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
