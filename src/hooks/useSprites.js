import { useEffect, useState, useRef } from 'react'
import { flattenManifest } from '../game/spriteManifest'

const imageCache = new Map()
const statusCache = new Map()

function loadOne(key, path) {
  if (imageCache.has(key) || statusCache.get(key) === 'missing') {
    return Promise.resolve()
  }
  statusCache.set(key, 'loading')
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => { imageCache.set(key, img); statusCache.set(key, 'ready'); resolve() }
    img.onerror = () => { statusCache.set(key, 'missing'); resolve() }
    img.src = '/' + path
  })
}

export function useSprites() {
  const [, forceRender] = useState(0)
  const loadedOnce = useRef(false)

  useEffect(() => {
    if (loadedOnce.current) return
    loadedOnce.current = true
    const manifest = flattenManifest()
    Promise.all(Object.entries(manifest).map(([k, p]) => loadOne(k, p)))
      .then(() => forceRender(n => n + 1))
  }, [])

  return {
    getSprite: (key) => imageCache.get(key) || null,
    getStatus: (key) => statusCache.get(key) || 'loading',
  }
}
