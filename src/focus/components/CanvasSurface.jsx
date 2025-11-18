import { useEffect, useRef } from 'react'

// CanvasSurface - responsive canvas that scales to parent size
export default function CanvasSurface({ draw, className = '', pixelRatio }) {
  const canvasRef = useRef(null)
  const dpr = Math.min(typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1, 2)
  const pr = pixelRatio || dpr

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })

    let frameId
    let ro
    let width = 0
    let height = 0

    const measure = () => {
      const parent = canvas.parentElement || canvas
      const rect = parent.getBoundingClientRect()
      // Prevent zero-size canvas which would render blank
      const w = Math.max(1, Math.floor(rect.width))
      const h = Math.max(1, Math.floor(rect.height))
      if (w !== width || h !== height) {
        width = w
        height = h
        canvas.width = Math.floor(width * pr)
        canvas.height = Math.floor(height * pr)
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        ctx.setTransform(pr, 0, 0, pr, 0, 0)
        if (draw) draw(ctx, width, height, 0)
      }
    }

    const onFrame = (t) => {
      if (draw) draw(ctx, width, height, t)
      frameId = requestAnimationFrame(onFrame)
    }

    // Prefer ResizeObserver but fall back to window resize for older browsers
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(canvas.parentElement || canvas)
    } else {
      window.addEventListener('resize', measure)
      window.addEventListener('orientationchange', measure)
    }

    measure()
    frameId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(frameId)
      if (ro) {
        ro.disconnect()
      } else {
        window.removeEventListener('resize', measure)
        window.removeEventListener('orientationchange', measure)
      }
    }
  }, [draw, pr])

  return <canvas ref={canvasRef} className={className} />
}
