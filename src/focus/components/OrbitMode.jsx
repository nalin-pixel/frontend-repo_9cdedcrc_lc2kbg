import CanvasSurface from './CanvasSurface'

export default function OrbitMode({ progress = 0, isBreak = false }) {
  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)

    // Space background
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h))
    grad.addColorStop(0, '#0b1020')
    grad.addColorStop(1, '#00010a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 91.123) % 1) * w
      const sy = ((i * 53.789) % 1) * h
      const r = 0.5 + ((i * 3.1) % 1) * 1.5
      ctx.beginPath()
      ctx.arc(sx, sy, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Planet
    const planetR = Math.min(w, h) * 0.18
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, planetR, 0, Math.PI * 2)
    const planetG = ctx.createRadialGradient(w / 2 - planetR * 0.4, h / 2 - planetR * 0.4, planetR * 0.2, w / 2, h / 2, planetR)
    planetG.addColorStop(0, '#3b82f6')
    planetG.addColorStop(1, '#1e40af')
    ctx.fillStyle = planetG
    ctx.fill()

    // Orbit path
    const rx = planetR * 2.2
    const ry = planetR * 1.5
    ctx.strokeStyle = 'rgba(148,163,184,0.4)'
    ctx.beginPath()
    ctx.ellipse(w / 2, h / 2, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Ship position
    const angle = progress * Math.PI * 2
    const shipX = w / 2 + rx * Math.cos(angle)
    const shipY = h / 2 + ry * Math.sin(angle)

    // During break: land on planet
    if (isBreak) {
      const t = progress
      const landX = w / 2 + (shipX - w / 2) * (1 - t)
      const landY = h / 2 + (shipY - h / 2) * (1 - t)
      drawShip(ctx, landX, landY, 0.5)
    } else {
      drawShip(ctx, shipX, shipY, 0.6)
    }
  }

  const drawShip = (ctx, x, y, s = 1) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.fillStyle = '#e5e7eb'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(10, 0)
    ctx.lineTo(0, 8)
    ctx.lineTo(-12, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  return <CanvasSurface className="w-full h-full" draw={draw} />
}
