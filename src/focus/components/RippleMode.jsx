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

    // Auto ripple density grows with progress
    const autoCount = Math.floor(1 + progress * 3)
    const time = performance.now() / 1000
    for (let i = 0; i < autoCount; i++) {
      const r = 40 + ((time * (i + 1) * 20) % 80)
      const x = ((i * 97.31) % 1) * w
      const y = ((i * 53.19) % 1) * h
      drawRipple(ctx, x, y, r)
    }

    // User ripples
    ripplesRef.current = ripplesRef.current.filter((rp) => performance.now() - rp.t < 1500)
    ripplesRef.current.forEach((rp) => {
      const elapsed = (performance.now() - rp.t) / 1000
      const radius = rp.r0 + elapsed * 120
      drawRipple(ctx, rp.x, rp.y, radius, 1 - elapsed / 1.5)
    })
  }

  const onClick = useCallback((e) => {
    if (!allowInteraction) return
    const rect = e.currentTarget.getBoundingClientRect()
    ripplesRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r0: 10, t: performance.now() })
  }, [allowInteraction])

  return <div className="w-full h-full" onClick={onClick}><CanvasSurface className="w-full h-full" draw={draw} /></div>
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
