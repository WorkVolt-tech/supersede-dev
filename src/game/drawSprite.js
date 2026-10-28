export function drawEntity(ctx, entity, sprite) {
  const { x, y, sz, col = '#c84030', vx = 0 } = entity

  ctx.save()
  ctx.translate(x, y)
  const tilt = Math.max(-0.35, Math.min(0.35, vx * 0.08))
  ctx.rotate(tilt)

  if (sprite) {
    const w = sz * 2.1
    const h = sz * 2.1
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h)
  } else {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(0, 0, sz * 0.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,.25)'
    ctx.beginPath()
    ctx.arc(0, sz * 0.15, sz * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  if (entity.mhp > 1) {
    const w = sz * 1.4
    const pct = Math.max(0, entity.hp / entity.mhp)
    ctx.fillStyle = 'rgba(0,0,0,.5)'
    ctx.fillRect(x - w / 2, y - sz - 10, w, 4)
    ctx.fillStyle = pct > 0.5 ? '#5ec45e' : pct > 0.25 ? '#c8b96e' : '#e05555'
    ctx.fillRect(x - w / 2, y - sz - 10, w * pct, 4)
  }

  if (entity.isBoss) {
    ctx.fillStyle = '#e8dcc2'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(entity.name, x, y - sz - 14)
  }
}
