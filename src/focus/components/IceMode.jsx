import { useMemo } from 'react'
import CanvasSurface from './CanvasSurface'
import { easeOutCubic } from '../utils/easings'

export default function IceMode({ progress = 0, isBreak = false }) {
  const cracks = useMemo(() => {
    const rng = (seed) => {
      let x = seed
      return () => (x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296
    }
    const r = rng(42)
    return Array.from({ length: 16 }, (_, i) => ({
      x: r(),
      y: r(),
      len: 40 + r() * 120,
      rot: r() * Math.PI * 2,
      alpha: 0.15 + r() * 0.35,
    }))
  }, [])

  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    // Background blue tint
    const melt = easeOutCubic(progress)
    const baseAlpha = isBreak ? 0.2 : 0.6 * (1 - melt)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `rgba(180, 220, 255, ${Math.max(0.05, baseAlpha)})`)
    grad.addColorStop(1, `rgba(120, 180, 255, ${Math.max(0.05, baseAlpha)})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Cracks
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.6 * (1 - melt)})`
    cracks.forEach((c, idx) => {
      const length = c.len * (0.3 + 0.7 * (1 - melt))
      ctx.save()
      ctx.translate(c.x * w, c.y * h)
      ctx.rotate(c.rot)
      ctx.globalAlpha = c.alpha * (1 - melt)
      ctx.beginPath()
      ctx.moveTo(-length / 2, 0)
      ctx.lineTo(length / 2, 0)
      ctx.lineWidth = 1 + (idx % 3)
      ctx.stroke()
      // small branches
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(length / 3, 8)
      ctx.moveTo(0, 0)
      ctx.lineTo(-length / 3, -8)
      ctx.stroke()
      ctx.restore()
    })
    ctx.restore()

    // Mist particles (simple fog overlay)
    const fogAlpha = 0.05 + 0.15 * (1 - melt)
    ctx.fillStyle = `rgba(255,255,255,${fogAlpha})`
    for (let i = 0; i < 20; i++) {
      const x = ((i * 123.45) % 1) * w
      const y = ((i * 54.321) % 1) * h
      const r = 60 + ((i * 19.2) % 1) * 140
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(255,255,255,${fogAlpha})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return <CanvasSurface className="w-full h-full" draw={draw} />
}
