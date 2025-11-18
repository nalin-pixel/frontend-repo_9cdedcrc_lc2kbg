import { useEffect, useRef } from 'react'

// CanvasSurface - responsive canvas that scales to parent size safely
export default function CanvasSurface({ draw, className = '', pixelRatio }) {
  const canvasRef = useRef(null)
  const dpr = Math.min(
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1,
    2
  )
  const pr = pixelRatio || dpr

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Try desynchronized context first, fall back if unavailable
    let ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    })
    if (!ctx) ctx = canvas.getContext('2d')

    let frameId
    let ro
    let width = 0
    let height = 0
    let scheduled = false

    const safeMeasure = () => {
      if (!canvas) return
      const parent = canvas.parentElement || canvas
      const rect = parent.getBoundingClientRect()

      // Ignore transient zero-size measurements; keep previous size
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (w < 2 || h < 2) {
        // Try again on next frame to avoid blank canvas
        if (!scheduled) {
          scheduled = true
          requestAnimationFrame(() => {
            scheduled = false
            safeMeasure()
          })
        }
        return
      }

      if (w !== width || h !== height) {
        width = w
        height = h
        const cw = Math.max(2, Math.floor(width * pr))
        const ch = Math.max(2, Math.floor(height * pr))
        canvas.width = cw
        canvas.height = ch
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        // Reset transform to map 1 unit to 1 CSS pixel
        ctx.setTransform(pr, 0, 0, pr, 0, 0)
        if (draw) draw(ctx, width, height, 0)
      }
    }

    const onFrame = (t) => {
      if (draw) draw(ctx, width, height, t)
      frameId = requestAnimationFrame(onFrame)
    }

    // Prefer ResizeObserver but fall back to window events
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => safeMeasure())
      ro.observe(canvas.parentElement || canvas)
    } else {
      const resizeHandler = () => safeMeasure()
      window.addEventListener('resize', resizeHandler)
      window.addEventListener('orientationchange', resizeHandler)
    }

    // Re-measure when tab becomes visible (layout can change when hidden)
    const visHandler = () => safeMeasure()
    document.addEventListener('visibilitychange', visHandler)

    // Initial measure + start loop
    safeMeasure()
    frameId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', visHandler)
      if (ro) {
        ro.disconnect()
      } else {
        window.removeEventListener('resize', safeMeasure)
        window.removeEventListener('orientationchange', safeMeasure)
      }
    }
  }, [draw, pr])

  return <canvas ref={canvasRef} className={className} />
}
