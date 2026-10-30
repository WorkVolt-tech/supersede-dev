import { useEffect, useRef, useState } from 'react'
import { useSprites } from '../../hooks/useSprites'
import { drawEntity } from '../../game/drawSprite'

const ETYPES = [
  { name: 'Looter',          hp: 1, spd: 1.6, atk: 6,  sz: 16, col: '#9a5e3a', score: 50,  pat: 'straight', spriteKey: 'looter' },
  { name: 'Hunter Scout',    hp: 2, spd: 1.2, atk: 10, sz: 24, col: '#c84030', score: 100, pat: 'zigzag',   spriteKey: 'hunter_scout' },
  { name: 'Bike Hunter',     hp: 1, spd: 2.8, atk: 5,  sz: 13, col: '#e8b850', score: 75,  pat: 'dive',     spriteKey: 'bike_hunter' },
  { name: 'Looter Truck',    hp: 4, spd: 0.9, atk: 16, sz: 32, col: '#7a4a28', score: 200, pat: 'straight', spriteKey: 'looter_truck' },
  { name: 'Hunter Marksman', hp: 2, spd: 1.0, atk: 14, sz: 20, col: '#d8a020', score: 150, pat: 'straight', spriteKey: 'hunter_marksman' },
  { name: 'Stalker Pack',    hp: 1, spd: 2.5, atk: 4,  sz: 10, col: '#5ec45e', score: 30,  pat: 'swarm',    spriteKey: 'stalker_pack' },
]

const HUNTER_CAPTAIN = {
  name: 'Hunter Captain', hp: 8, spd: 0.7, atk: 20, sz: 46, col: '#a02020',
  score: 1000, pat: 'zigzag', isBoss: true, spriteKey: 'hunter_captain',
}

const BOSS_AT_KILLS = 15

export default function VehicleCanvas({ onComplete, destination = 2 }) {
  const canvasRef = useRef(null)
  const { getSprite } = useSprites()
  const [hud, setHud] = useState({ hp: 100, maxHp: 100, kills: 0, score: 0, bossActive: false })
  const [gameOver, setGameOver] = useState(null)

  const stateRef = useRef(null)
  const touchControlsRef = useRef({left:false,right:false,shoot:false})
  const completedRef = useRef(false)

  function startTouchControl(control, event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    touchControlsRef.current[control] = true
  }
  function stopTouchControl(control, event) {
    event.preventDefault()
    touchControlsRef.current[control] = false
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = null
    let cancelled = false

    function resize() {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const player = { x: canvas.width / 2, y: canvas.height * 0.82, w: 28, h: 40, hp: 100, maxHp: 100 }
    const keys = { left: false, right: false, shoot: false }
    const enemies = []
    const bullets = []
    let spawnTimer = 0
    let kills = 0
    let score = 0
    let bossSpawned = false
    let bossActive = false
    let bossDefeated = false

    stateRef.current = { player, enemies, bullets }

    function onKeyDown(e) {
      if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault()
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true
      if (e.key === ' ') keys.shoot = true
    }
    function onKeyUp(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false
      if (e.key === ' ') keys.shoot = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    function spawnEnemy(forced) {
      const t = forced || ETYPES[Math.floor(Math.random() * ETYPES.length)]
      const rx = canvas.width * 0.15, rw = canvas.width * 0.7
      enemies.push({
        ...t, x: rx + t.sz + Math.random() * (rw - t.sz * 2), y: -40,
        vx: (Math.random() - 0.5) * 2, vy: t.spd, mhp: t.hp, zt: 0, zd: 1, dead: false,
      })
    }

    let fireTimer = 0
    function loop() {
      if (cancelled) return
      raf = requestAnimationFrame(loop)

      const moveSpd = 5
      if (keys.left || touchControlsRef.current.left)  player.x -= moveSpd
      if (keys.right || touchControlsRef.current.right) player.x += moveSpd
      const rx = canvas.width * 0.15, rw = canvas.width * 0.7
      player.x = Math.max(rx + player.w / 2, Math.min(rx + rw - player.w / 2, player.x))

      fireTimer--
      if ((keys.shoot || touchControlsRef.current.shoot) && fireTimer <= 0) {
        bullets.push({ x: player.x, y: player.y - player.h / 2, vy: -9 })
        fireTimer = 8
      }

      spawnTimer--
      if (spawnTimer <= 0 && !bossSpawned) { spawnEnemy(); spawnTimer = 55 }
      if (kills >= BOSS_AT_KILLS && !bossSpawned) {
        bossSpawned = true; bossActive = true
        spawnEnemy(HUNTER_CAPTAIN)
        setHud(h => ({ ...h, bossActive: true }))
      }

      for (const e of enemies) {
        if (e.dead) continue
        if (e.pat === 'zigzag') {
          e.zt++
          if (e.zt > 28) { e.zd *= -1; e.zt = 0 }
          e.x += e.vx + e.zd * 2.2
        } else if (e.pat === 'dive') {
          const dx = player.x - e.x, dy = player.y - e.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          e.vx += (dx / d) * 0.12
          e.x += e.vx
        } else if (e.pat === 'swarm') {
          e.x += Math.sin((e.zt += 0.1) * 2) * 2.5 + e.vx
        } else {
          e.x += e.vx
        }
        e.y += e.vy
        if (e.x < rx + e.sz) { e.x = rx + e.sz; e.vx = Math.abs(e.vx) }
        if (e.x > rx + rw - e.sz) { e.x = rx + rw - e.sz; e.vx = -Math.abs(e.vx) }

        if (e.y > canvas.height + 60) {
          e.dead = true
          if (e.isBoss) { cancelled = true; setGameOver('lose') }
        } else if (e.y > player.y - 20 && Math.abs(e.x - player.x) < e.sz + player.w / 2) {
          player.hp = Math.max(0, player.hp - e.atk)
          e.dead = true
          if (e.isBoss) { cancelled = true; setGameOver('lose') }
        }
      }

      for (const b of bullets) {
        b.y += b.vy
        for (const e of enemies) {
          if (e.dead) continue
          const dx = e.x - b.x, dy = e.y - b.y
          if (Math.sqrt(dx * dx + dy * dy) < e.sz) {
            e.hp--
            b.hit = true
            if (e.hp <= 0) { e.dead = true; kills++; score += e.score; if (e.isBoss) bossDefeated = true }
          }
        }
      }
      for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].hit || bullets[i].y < -20) bullets.splice(i, 1)
      }
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].dead) {
          if (enemies[i].isBoss) bossActive = false
          enemies.splice(i, 1)
        }
      }

      ctx.fillStyle = '#0a0805'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(200,184,128,.15)'
      ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, canvas.height); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(rx + rw, 0); ctx.lineTo(rx + rw, canvas.height); ctx.stroke()

      for (const b of bullets) {
        ctx.fillStyle = '#ffcc00'
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12)
      }
      for (const e of enemies) drawEntity(ctx, e, getSprite(e.spriteKey))
      drawEntity(ctx, { ...player, sz: 20, col: '#5eaee0' }, getSprite('default'))

      if (Math.random() < 0.1) {
        setHud({ hp: player.hp, maxHp: player.maxHp, kills, score, bossActive })
      }

      if (player.hp <= 0 && !gameOver) { cancelled = true; setGameOver('lose') }
      if (bossSpawned && bossDefeated && !bossActive && enemies.length === 0 && !gameOver) {
        cancelled = true; setGameOver('win')
      }
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelled = true
      touchControlsRef.current = {left:false,right:false,shoot:false}
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (gameOver && !completedRef.current) {
      completedRef.current = true
      onComplete?.(gameOver)
    }
  }, [gameOver, onComplete])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '.75rem 1rem',
        display: 'flex', justifyContent: 'space-between', color: '#c8b96e',
        fontFamily: 'monospace', fontSize: 12, pointerEvents: 'none', textShadow: '0 1px 2px #000',
      }}>
        <span>HULL {hud.hp}/{hud.maxHp}</span>
        <span>{hud.bossActive ? '⚠ HUNTER CAPTAIN' : `TO CHAPTER ${destination} · KILLS ${hud.kills}/${BOSS_AT_KILLS}`}</span>
        <span>SCORE {hud.score}</span>
      </div>
      {gameOver && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.85)', color: '#e8dcc2', fontFamily: 'monospace', fontSize: 20,
        }}>
          {gameOver === 'win' ? '✓ HUNTER CAPTAIN DOWN' : '✕ HULL BREACHED'}
        </div>
      )}
      {!gameOver && (
        <>
          <div style={{position:'absolute',bottom:32,left:12,display:'flex',gap:10,zIndex:5}}>
            {[
              {control:'left',label:'◀',name:'Steer left'},
              {control:'right',label:'▶',name:'Steer right'},
            ].map(button => (
              <button key={button.control} type="button" aria-label={button.name}
                onPointerDown={event=>startTouchControl(button.control,event)}
                onPointerUp={event=>stopTouchControl(button.control,event)}
                onPointerCancel={event=>stopTouchControl(button.control,event)}
                onLostPointerCapture={event=>stopTouchControl(button.control,event)}
                style={{width:56,height:56,borderRadius:12,touchAction:'none',userSelect:'none',
                  border:'2px solid #c8b96e',background:'rgba(15,14,22,.83)',color:'#fff2c7',fontSize:24,fontWeight:700}}>
                {button.label}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Fire weapon"
            onPointerDown={event=>startTouchControl('shoot',event)}
            onPointerUp={event=>stopTouchControl('shoot',event)}
            onPointerCancel={event=>stopTouchControl('shoot',event)}
            onLostPointerCapture={event=>stopTouchControl('shoot',event)}
            style={{position:'absolute',right:12,bottom:32,zIndex:5,width:70,height:56,borderRadius:12,
              touchAction:'none',userSelect:'none',border:'2px solid #e8b850',
              background:'rgba(100,36,22,.88)',color:'#fff5dc',fontSize:14,fontWeight:700}}>
            FIRE
          </button>
          <p style={{position:'absolute',bottom:5,left:0,right:0,textAlign:'center',pointerEvents:'none',
            color:'#9e8e66',fontFamily:'monospace',fontSize:10}}>
            ←/→ or A/D to steer · SPACE to fire · hold touch buttons on mobile
          </p>
        </>
      )}
    </div>
  )
}
