import CanvasSurface from './CanvasSurface'

export default function DriftMode({ progress = 0, interruptionDetected = false }) {
  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    // Track background
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, w, h)

    // Track curve
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w * 0.1, h * 0.8)
    ctx.bezierCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.9, w * 0.9, h * 0.2)
    ctx.stroke()

    // Car position along parametric bezier (approx t = progress)
    const t = Math.min(0.999, progress)
    const p0 = { x: w * 0.1, y: h * 0.8 }
    const p1 = { x: w * 0.3, y: h * 0.6 }
    const p2 = { x: w * 0.6, y: h * 0.9 }
    const p3 = { x: w * 0.9, y: h * 0.2 }

    const B = (a, b, c, d, t) =>
      (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d

    const x = B(p0.x, p1.x, p2.x, p3.x, t)
    const y = B(p0.y, p1.y, p2.y, p3.y, t)

    // Direction for drift angle
    const dx = B(p0.x, p1.x, p2.x, p3.x, Math.min(0.999, t + 0.001)) - x
    const dy = B(p0.y, p1.y, p2.y, p3.y, Math.min(0.999, t + 0.001)) - y
    const angle = Math.atan2(dy, dx)

    const drift = 0.4 * Math.sin(progress * Math.PI * 4)
    const wobble = interruptionDetected ? (Math.sin(performance.now() / 60) * 0.2) : 0

    // Car
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle + drift + wobble)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(-14, -8, 28, 16)

    // sparks near tires
    ctx.fillStyle = 'rgba(255,215,0,0.8)'
    for (let i = 0; i < 6; i++) {
      const sx = -14 + (i % 2) * 28
      const sy = (i < 3 ? -8 : 8)
      ctx.beginPath()
      ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  return <CanvasSurface className="w-full h-full" draw={draw} />
}
