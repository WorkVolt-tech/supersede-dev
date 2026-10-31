import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'

// Fully isolated test fixtures: no player saves, login or live database.
const host='http://127.0.0.1:4177'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js',
  '--host','127.0.0.1','--port','4177','--strictPort'],{
  stdio:'pipe',env:{...process.env,
    VITE_SUPABASE_URL:'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY:'unarmed-browser-test'},
})
let browser
function check(condition,message){assert.ok(condition,message)}
async function ready(){
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Vite did not start')
    try{if((await fetch(host+'/tests/browser/group-combat.html')).ok)return}catch{}
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  throw Error('Vite timed out')
}
async function checkMeter(page,expected){
  const meter=page.getByRole('progressbar',{name:'Action Points'})
  check(await meter.count()===1,'missing visual AP meter')
  check(Number(await meter.getAttribute('aria-valuenow'))===expected,
    'incorrect AP meter: expected '+expected)
  check(await meter.locator('.combat-ap-fill').count()===1,
    'missing single continuous AP bar')
}
async function testGroup(page,distance){
  const scenario='unarmed-'+distance
  const middle=distance==='middle'
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(host+'/tests/browser/group-combat.html?scenario='+scenario,
    {waitUntil:'networkidle'})
  await page.locator('.combat-tactical-weapons').waitFor()
  const choices=page.locator('.combat-tactical-weapons button')
  const names=await choices.allTextContents()
  check(choices&&names.length===2,'unequipped group fighter must have only two basic attacks')
  check(names[0].includes('Basic Strike')&&names[1].includes('Improvised Throw'),
    'group unarmed kit contains the wrong moves: '+names)
  for(const rogue of ['Dagger Stab','Shadow Lunge','Resonance Wave','System Pulse'])
    check(!names.join(' ').includes(rogue),'low-level unarmed player gained '+rogue)
  await checkMeter(page,5)
  check((await choices.nth(1).textContent()).includes('Retrieval'),
    'throw description is missing from visible button')
  check((await page.locator('.combat-tactical-status').textContent())
    .includes('No weapon equipped'),'group combat falsely claims a weapon')
  await choices.nth(1).click()
  check((await page.locator('.combat-attack-details[role="status"]').textContent()).includes(
    '2–4 squares'),'selected throw distance description missing')
  await page.locator('.combat-grid-board').first().locator('button')
    .nth(middle?4:1).click()
  await page.waitForFunction(()=>document.querySelector('.combat-attack-details[role="status"]')
    ?.textContent.includes('Thrown object recovery'),null,{timeout:12000})
  await checkMeter(page,4)
  check(await choices.nth(1).isDisabled(),
    'thrown object could be used again without retrieval')
  const initial=await page.locator('.combat-attack-details[role="status"]').textContent()
  check(initial.includes(middle?'1 round':'2 rounds'),
    'incorrect initial projectile return time')
  await page.getByRole('button',{name:'End turn'}).click()
  await page.waitForFunction(()=>document.querySelector('.combat-ap-meter')?.dataset.round==='2'&&
    document.querySelector('[role="progressbar"][aria-label="Action Points"]')
      ?.getAttribute('aria-valuenow')==='5',null,{timeout:12000})
  await checkMeter(page,5)
  check(await choices.nth(1).isEnabled()===middle,
    'middle must recover next turn; rear must take 2 turns')
  if(!middle){
    await page.getByRole('button',{name:'End turn'}).click()
    await page.waitForFunction(()=>document.querySelector('.combat-ap-meter')?.dataset.round==='3'&&
      document.querySelector('[role="progressbar"][aria-label="Action Points"]')
        ?.getAttribute('aria-valuenow')==='5',null,{timeout:12000})
    check(await choices.nth(1).isEnabled(),'rear thrown object not recovered after 2 rounds')
  }
  check(errors.length===0,'group combat errors: '+errors.join(' | '))
  await page.screenshot({path:'test-artifacts/unarmed-group-'+distance+'.png',fullPage:true})
  console.log('PASS unarmed group '+distance+': no phantom skills, descriptions, AP bar and recovery')
}
async function testSolo(page,distance){
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto(host+'/tests/browser/single-combat.html?scenario=unarmed-'+distance,
    {waitUntil:'networkidle'})
  await page.locator('.combat-tactical-weapons').waitFor()
  const choices=page.locator('.combat-tactical-weapons button')
  const names=await choices.allTextContents()
  check(names.length===2&&names[0].includes('Basic Strike')&&
    names[1].includes('Improvised Throw'),'solo unarmed kit incorrect: '+names)
  check((await page.locator('.combat-tactical-status').textContent())
    .includes('NO WEAPON EQUIPPED'),'solo combat falsely claims a weapon')
  await checkMeter(page,5)
  await choices.nth(1).click()
  const target=page.locator('.combat-grid-board').first().locator('button.occupied')
  check(await target.isEnabled(),'throw cannot reach '+distance+' foe')
  await target.click()
  await page.waitForFunction(()=>document.querySelector('.combat-attack-details[role="status"]')
    ?.textContent.includes('Thrown object recovery') &&
    document.querySelector('[role="progressbar"][aria-label="Action Points"]')
      ?.getAttribute('aria-valuenow')==='1',null,{timeout:12000})
  await checkMeter(page,4)
  check(await choices.nth(1).isDisabled(),'solo thrown object could be reused immediately')
  await page.getByRole('button',{name:'End turn'}).click()
  await page.waitForFunction(()=>document.querySelector('.combat-ap-meter')?.dataset.round==='2'&&
    document.querySelector('[role="progressbar"][aria-label="Action Points"]')
      ?.getAttribute('aria-valuenow')==='5',null,{timeout:15000})
  await checkMeter(page,5)
  check(await choices.nth(1).isEnabled()===(distance==='middle'),
    'solo projectile readiness incorrect after first round')
  if(distance==='rear'){
    await page.getByRole('button',{name:'End turn'}).click()
    await page.waitForFunction(()=>document.querySelector('.combat-ap-meter')?.dataset.round==='3'&&
      document.querySelector('[role="progressbar"][aria-label="Action Points"]')
        ?.getAttribute('aria-valuenow')==='5',null,{timeout:15000})
    check(await choices.nth(1).isEnabled(),'solo rear throw did not recover in second round')
  }
  check(errors.length===0,'solo combat errors: '+errors.join(' | '))
  await page.screenshot({path:'test-artifacts/unarmed-solo-'+distance+'.png',fullPage:true})
  console.log('PASS unarmed solo '+distance+': square range, AP meter and throw retrieval')
}
try{
  await ready()
  await mkdir('test-artifacts',{recursive:true})
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  await testGroup(page,'middle')
  await testGroup(page,'rear')
  await testSolo(page,'middle')
  await testSolo(page,'rear')
  await page.close()
  console.log('PASS: unequipped starter combat across group and solo encounters')
}catch(error){
  console.error('UNARMED COMBAT BROWSER FAILURE:',error)
  process.exitCode=1
}finally{
  if(browser)await browser.close()
  server.kill('SIGTERM')
}
