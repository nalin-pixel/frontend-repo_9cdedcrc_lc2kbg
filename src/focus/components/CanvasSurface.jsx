import { useEffect, useRef } from 'react'

// CanvasSurface - responsive canvas that scales to parent size
export default function CanvasSurface({ draw, className = '', pixelRatio = Math.min(window.devicePixelRatio || 1, 2) }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let frameId

    const resize = () => {
      const parent = canvas.parentElement
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.floor(w * pixelRatio)
      canvas.height = Math.floor(h * pixelRatio)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      if (draw) draw(ctx, w, h, 0)
    }

    const onFrame = (t) => {
      if (draw) draw(ctx, canvas.clientWidth, canvas.clientHeight, t)
      frameId = requestAnimationFrame(onFrame)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    resize()
    frameId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(frameId)
      ro.disconnect()
    }
  }, [draw, pixelRatio])

  return <canvas ref={canvasRef} className={className} />
}
