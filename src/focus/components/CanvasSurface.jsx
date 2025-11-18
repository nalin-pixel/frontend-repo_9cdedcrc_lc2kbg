import { useEffect, useRef } from 'react'

// CanvasSurface - responsive canvas that scales to parent size safely
export default function CanvasSurface({ draw, className = '', pixelRatio, style }) {
  const canvasRef = useRef(null)
  const dpr = Math.min(
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1,
    2
  )
  const pr = pixelRatio || dpr

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Request a stable 2D context (avoid desynchronized on some mobile browsers)
    let ctx = canvas.getContext('2d', {
      alpha: true,
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
        if (draw && width >= 2 && height >= 2) {
          try { draw(ctx, width, height, 0) } catch { /* noop */ }
        }
      }
    }

    const onFrame = (t) => {
      if (draw && width >= 2 && height >= 2) {
        try { draw(ctx, width, height, t) } catch { /* noop */ }
      }
      frameId = requestAnimationFrame(onFrame)
    }

    // Prefer ResizeObserver but fall back to window events
    let resizeHandler
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => safeMeasure())
      ro.observe(canvas.parentElement || canvas)
    } else {
      resizeHandler = () => safeMeasure()
      window.addEventListener('resize', resizeHandler)
      window.addEventListener('orientationchange', resizeHandler)
    }

    // Re-measure when tab becomes visible (layout can change when hidden)
    const visHandler = () => safeMeasure()
    document.addEventListener('visibilitychange', visHandler)

    // Also re-measure on pointer interactions (some mobile browsers change layout)
    const pointerHandler = () => safeMeasure()
    canvas.addEventListener('pointerdown', pointerHandler, { passive: true })
    canvas.addEventListener('pointerup', pointerHandler, { passive: true })

    // Initial measure + start loop
    safeMeasure()
    frameId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', visHandler)
      canvas.removeEventListener('pointerdown', pointerHandler)
      canvas.removeEventListener('pointerup', pointerHandler)
      if (ro) {
        ro.disconnect()
      } else if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        window.removeEventListener('orientationchange', resizeHandler)
      }
    }
  }, [draw, pr])

  return <canvas ref={canvasRef} className={className} style={{ touchAction: 'manipulation', ...style }} />
}
