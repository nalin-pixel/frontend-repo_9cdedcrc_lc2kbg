import CanvasSurface from './CanvasSurface'
import { easeInOutQuad } from '../utils/easings'

export default function FlightMode({ progress = 0, isBreak = false }) {
  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    // Sky background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
    skyGrad.addColorStop(0, '#66a6ff')
    skyGrad.addColorStop(1, '#89f7fe')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h)

    const t = easeInOutQuad(progress)
    const y = h * (0.25 + 0.1 * Math.sin(progress * Math.PI * 2))
    const x = 40 + (w - 80) * t

    // Clouds parallax
    const cloud = (cx, cy, s, alpha = 0.8) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(cx, cy, 20 * s, 0, Math.PI * 2)
      ctx.arc(cx + 25 * s, cy + 5 * s, 25 * s, 0, Math.PI * 2)
      ctx.arc(cx - 25 * s, cy + 5 * s, 18 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    for (let i = 0; i < 10; i++) {
      const px = ((i * 97 + progress * 200) % (w + 100)) - 50
      cloud(px, h * 0.3 + (i % 3) * 40, 1 + (i % 3) * 0.3, 0.5)
    }

    // Plane
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(0.02 * Math.sin(progress * Math.PI * 4))
    ctx.fillStyle = '#334155'
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(40, 6)
    ctx.lineTo(-15, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // tail wing
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(-18, -8)
    ctx.lineTo(-6, -2)
    ctx.closePath()
    ctx.fillStyle = '#475569'
    ctx.fill()
    ctx.restore()

    // Runway during break
    if (isBreak) {
      const runwayY = h * 0.75
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(0, runwayY, w, 6)
      // dashed center line
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.setLineDash([12, 12])
      ctx.beginPath()
      ctx.moveTo(0, runwayY + 3)
      ctx.lineTo(w, runwayY + 3)
      ctx.stroke()
      ctx.setLineDash([])
      // Landing plane
      const landX = 40 + (w - 80) * t
      const landY = runwayY - 12
      ctx.save()
      ctx.translate(landX, landY)
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(40, 6)
      ctx.lineTo(-15, 0)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }

  return <CanvasSurface className="w-full h-full" draw={draw} />
}
