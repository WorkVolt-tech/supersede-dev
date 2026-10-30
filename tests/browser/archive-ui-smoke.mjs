// Navigation and stats smoke in isolated React, without a real account.
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import {chromium} from 'playwright'

const host='http://127.0.0.1:4176'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js',
  '--host','127.0.0.1','--port','4176','--strictPort'],{
  stdio:'pipe',env:{...process.env,
    VITE_SUPABASE_URL:'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY:'archive-ui-browser-test'},
})
let browser
function check(value,label){assert.ok(value,label)}
async function ready(){
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error('Vite failed to start')
    try{
      const response=await fetch(host+'/tests/browser/archive-ui.html')
      if(response.ok)return
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,200))
  }
  throw Error('Vite archive UI server timed out')
}
async function verifyMenu(page,chapter){
  await page.goto(host+'/tests/browser/archive-ui.html?chapter='+chapter,
    {waitUntil:'networkidle'})
  await page.getByText('Archive & systems').waitFor()
  const quick=await page.locator('.reading-quick-nav .reading-action').allTextContents()
  check(JSON.stringify(quick.map(x=>x.toLowerCase()))===
    JSON.stringify(['chapters','inventory','skills','trader','lobby','badges']),
    'Archive main shortcuts changed or duplicated')
  const extra=await page.locator('.reading-page-right .reading-action')
    .filter({hasText:/Tests & Previews|Sign out|Reset my character/}).allTextContents()
  check(extra.length===3,'Additional activities should have only testing, sign-out and reset')
  check(extra.filter(x=>x==='Tests & Previews').length===1,
    'Archive needs one tests and previews link')
  check(await page.getByText('Skills & Classes').count()===0,
    'duplicate Skills and Classes link')
  check(await page.getByText('Inventory (sample items)').count()===0,
    'sample items must be hidden behind testing room')
  const profession=page.locator('.reading-page-right')
    .getByRole('button',{name:/Professions/})
  check(await profession.count()===(chapter==='3'?1:0),
    'Chapter 3 profession visibility mismatch')
  const statLabels=await page.locator('.reading-minor-stats div')
    .allTextContents()
  check(statLabels.length===6,'record should contain six metrics in one group')
  for(const [i,label] of [
    'Combat ATK','Combat DEF','Initiative','Insight','PvP kills','Helps given'
  ].entries())
    check(statLabels[i].startsWith(label),label+' displayed out of order')
  check(await page.locator('.reading-derived-grid').count()===0,
    'derived stats should not have a second block')
  console.log('PASS archive chapter '+chapter+': no duplicates, gated professions, stat order')
}
async function verifyTestingRoom(page) {
  await page.getByRole('button',{name:'Tests & Previews',exact:true}).click()
  await page.getByText('Testing room',{exact:true}).waitFor()
  const entries=await page.locator('.reading-page-left .reading-chapter')
    .allTextContents()
  check(entries.length===4,'not all four demos and previews are in one room')
  for(const label of ['Inventory (sample items)','Combat Formation Test',
    'Twin Judges Animation Preview','Chapter 1 Boss Animation Preview'])
    check(entries.some(x=>x.includes(label)),'missing testing room entry '+label)
  await page.getByRole('button',{name:/Inventory \(sample items\)/}).click()
  check(await page.locator('#archive-selected-route').getAttribute('data-view')===
    'inventory-demo','sample items must open demo route, not player inventory')
  console.log('PASS testing room: one entry to all four demo routes')
}
async function verifySkills(page,viewport){
  await page.goto(host+'/tests/browser/archive-ui.html?chapter=1',
    {waitUntil:'networkidle'})
  await page.locator('.reading-quick-nav')
    .getByRole('button',{name:'skills',exact:true}).click()
  await page.getByRole('heading',{name:'Character stats'}).waitFor()
  const metrics=await page.locator('.skills-combat-metrics .skills-stat-tile')
    .allTextContents()
  const attrs=await page.locator('.skills-attribute-stats .skills-stat-tile')
    .allTextContents()
  check(metrics.length===6,'Skills missing six record/combat stats')
  check(attrs.length===9,'Skills missing all nine attributes')
  const expected=await page.evaluate(()=>window.__archiveExpectedStats)
  for(const [i,label,value] of [
    [0,'Combat ATK',expected.attack],[1,'Combat DEF',expected.defense],
    [2,'Initiative',expected.initiative],[3,'Insight',expected.core.insight],
    [4,'PvP Kills',8],[5,'Helps Given',4],
  ])
    check(metrics[i].includes(label)&&metrics[i].includes(String(value)),
      'Skills stat mismatch: '+label)
  const attack=attrs.find(x=>x.includes('Attack'))
  check(attack.includes('3 gear'),
    'Skills attributes did not reflect equipped weapon bonus')
  check(await page.locator('.skills-workspace').count()===1,
    'Original skill tree was lost')
  await page.screenshot({path:'test-artifacts/archive-skills-'+viewport+'.png',
    fullPage:true})
  console.log('PASS Skills '+viewport+': original skill tree plus nine equipment-aware stats')
}
try{
  await ready()
  await mkdir('test-artifacts',{recursive:true})
  browser=await chromium.launch({headless:true})
  const desktop=await browser.newPage({viewport:{width:1280,height:900}})
  await verifyMenu(desktop,'1')
  await verifyTestingRoom(desktop)
  await verifySkills(desktop,'desktop')
  await verifyMenu(desktop,'3')
  await desktop.screenshot({path:'test-artifacts/archive-chapter3.png',fullPage:true})
  await desktop.close()
  const mobile=await browser.newPage({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true})
  await verifyMenu(mobile,'1')
  await verifySkills(mobile,'mobile')
  await mobile.close()
  console.log('PASS: archive navigation and character stats smoke')
}catch(error){
  console.error('ARCHIVE UI BROWSER FAILURE:',error)
  process.exitCode=1
}finally{
  if(browser)await browser.close()
  server.kill('SIGTERM')
}
