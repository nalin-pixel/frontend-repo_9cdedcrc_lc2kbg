import { useCallback, useMemo, useRef } from 'react'
import CanvasSurface from './CanvasSurface'

export default function RippleMode({ progress = 0, allowInteraction = true }) {
  const ripplesRef = useRef([])

  const hue = useMemo(() => 200 + progress * 40, [progress])

  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    // Water background
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, `hsl(${hue}, 80%, 65%)`)
    g.addColorStop(1, `hsl(${hue + 20}, 70%, 55%)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    const now = performance.now()

    // Auto ripple density grows with progress
    const autoCount = Math.floor(1 + progress * 3)
    const time = now / 1000
    for (let i = 0; i < autoCount; i++) {
      const r = 40 + ((time * (i + 1) * 20) % 80)
      const x = ((i * 97.31) % 1) * w
      const y = ((i * 53.19) % 1) * h
      drawRipple(ctx, x, y, r)
    }

    // User ripples
    ripplesRef.current = ripplesRef.current.filter((rp) => now - rp.t < 1500)
    ripplesRef.current.forEach((rp) => {
      const elapsed = (now - rp.t) / 1000
      const radius = rp.r0 + elapsed * 120
      drawRipple(ctx, rp.x, rp.y, radius, 1 - elapsed / 1.5)
    })
  }

  const addRipple = useCallback((clientX, clientY, target) => {
    if (!allowInteraction || !target) return
    const rect = target.getBoundingClientRect()
    ripplesRef.current.push({ x: clientX - rect.left, y: clientY - rect.top, r0: 10, t: performance.now() })
  }, [allowInteraction])

  const onPointerDown = useCallback((e) => {
    // Support mouse, touch, and pen
    if (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches.length > 0) {
      const t = e.nativeEvent.touches[0]
      addRipple(t.clientX, t.clientY, e.currentTarget)
    } else {
      addRipple(e.clientX, e.clientY, e.currentTarget)
    }
  }, [addRipple])

  return (
    <div className="w-full h-full" onPointerDown={onPointerDown}>
      <CanvasSurface className="w-full h-full" draw={draw} />
    </div>
  )
}

function drawRipple(ctx, x, y, r, alpha = 0.8) {
  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
  ctx.globalAlpha = alpha * 0.6
  ctx.stroke()
  ctx.restore()
}
