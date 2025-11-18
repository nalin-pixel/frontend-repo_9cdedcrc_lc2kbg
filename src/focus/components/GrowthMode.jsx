import CanvasSurface from './CanvasSurface'

// Growth: seed -> sprout -> stem -> leaves -> bud -> flower
// stages map across progress with smooth scaling. streakLevel scales overall size.
export default function GrowthMode({ progress = 0, streakLevel = 1 }) {
  const draw = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    // background
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0f172a')
    g.addColorStop(1, '#0b3d2e')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    const cx = w / 2
    const baseY = h * 0.8
    const scale = 1 + Math.min(3, streakLevel) * 0.2

    const stageT = Math.min(0.999, progress)

    // stem height increases with progress
    const stemH = (h * 0.5) * stageT * scale

    // soil
    ctx.fillStyle = '#065f46'
    ctx.fillRect(0, baseY, w, h - baseY)

    // seed
    ctx.fillStyle = '#a16207'
    ctx.beginPath()
    ctx.ellipse(cx, baseY - 6, 10 * scale, 6 * scale, 0, 0, Math.PI * 2)
    ctx.fill()

    // stem
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 4 * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx, baseY - 6)
    ctx.quadraticCurveTo(cx - 10, baseY - stemH * 0.5, cx, baseY - stemH)
    ctx.stroke()

    // leaves at stages
    const leaf = (x, y, size, flip = 1) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(flip, 1)
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(24 * size, -18 * size, 48 * size, 0)
      ctx.quadraticCurveTo(24 * size, 18 * size, 0, 0)
      ctx.fill()
      ctx.restore()
    }

    if (stageT > 0.2) leaf(cx - 8, baseY - stemH * 0.4, 0.3 * scale, -1)
    if (stageT > 0.35) leaf(cx + 8, baseY - stemH * 0.6, 0.28 * scale, 1)
    if (stageT > 0.5) leaf(cx - 6, baseY - stemH * 0.75, 0.25 * scale, -1)

    // bud/flower
    if (stageT > 0.65) {
      const budY = baseY - stemH - 10 * scale
      ctx.fillStyle = '#f97316'
      ctx.beginPath()
      ctx.arc(cx, budY, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
      if (stageT > 0.85) {
        // petals open
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2
          const px = cx + Math.cos(ang) * 14 * scale
          const py = budY + Math.sin(ang) * 14 * scale
          ctx.fillStyle = '#fb7185'
          ctx.beginPath()
          ctx.arc(px, py, 6 * scale * (stageT - 0.85 + 0.2), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  return <CanvasSurface className="w-full h-full" draw={draw} />
}
