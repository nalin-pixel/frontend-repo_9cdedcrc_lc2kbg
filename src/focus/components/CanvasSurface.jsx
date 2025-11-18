import { useEffect, useRef } from 'react'

// CanvasSurface - responsive canvas that scales to parent size safely
export default function CanvasSurface({ draw, className = '', pixelRatio, style, debug = false }) {
  const canvasRef = useRef(null)
  const dpr = Math.min(
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1,
    2
  )
  const pr = pixelRatio || dpr

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Request a stable 2D context (avoid desynchronized on some browsers)
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

    // Offscreen buffer to keep last good frame (helps mask brief layout glitches)
    const buffer = document.createElement('canvas')
    const bctx = buffer.getContext('2d')

    const log = (...args) => { if (debug) console.debug('[CanvasSurface]', ...args) }

    const safeMeasure = () => {
      if (!canvas) return
      const parent = canvas.parentElement || canvas
      const rect = parent.getBoundingClientRect()

      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (w < 2 || h < 2) {
        // Defer and try again next frame to avoid blanking during transient measurements
        if (!scheduled) {
          scheduled = true
          requestAnimationFrame(() => {
            scheduled = false
            safeMeasure()
          })
        }
        log('bail measure small size', { w, h })
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
        // Resize buffer to match CSS pixels
        buffer.width = width
        buffer.height = height
        log('measure apply', { width, height, pr })
        if (draw && width >= 2 && height >= 2) {
          try { draw(ctx, width, height, 0) } catch (e) { log('draw error on measure', e) }
          // Capture last frame
          try { bctx.clearRect(0, 0, width, height); bctx.drawImage(canvas, 0, 0, width, height) } catch {}
        }
      }
    }

    const onFrame = (t) => {
      if (draw && width >= 2 && height >= 2) {
        try { draw(ctx, width, height, t) } catch (e) { log('draw error on frame', e) }
        // Capture last frame
        try { bctx.clearRect(0, 0, width, height); bctx.drawImage(canvas, 0, 0, width, height) } catch {}
      } else if (width >= 2 && height >= 2) {
        // If drawing paused but we have a buffer, re-blit it (defensive)
        try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.setTransform(pr, 0, 0, pr, 0, 0); ctx.drawImage(buffer, 0, 0, width, height) } catch {}
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

    // Also re-measure on pointer interactions; attach to both canvas and its parent
    const pointerHandler = () => safeMeasure()
    const parentEl = canvas.parentElement
    canvas.addEventListener('pointerdown', pointerHandler, { passive: true })
    canvas.addEventListener('pointerup', pointerHandler, { passive: true })
    if (parentEl) {
      parentEl.addEventListener('pointerdown', pointerHandler, { passive: true })
      parentEl.addEventListener('pointerup', pointerHandler, { passive: true })
    }

    // Initial measure + start loop
    safeMeasure()
    frameId = requestAnimationFrame(onFrame)

    return () => {
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', visHandler)
      canvas.removeEventListener('pointerdown', pointerHandler)
      canvas.removeEventListener('pointerup', pointerHandler)
      if (parentEl) {
        parentEl.removeEventListener('pointerdown', pointerHandler)
        parentEl.removeEventListener('pointerup', pointerHandler)
      }
      if (ro) {
        ro.disconnect()
      } else if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        window.removeEventListener('orientationchange', resizeHandler)
      }
    }
  }, [draw, pr, debug])

  return <canvas ref={canvasRef} className={className} style={{ touchAction: 'manipulation', ...style }} />
}
