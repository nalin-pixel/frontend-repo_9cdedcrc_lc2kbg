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

    // Windows/desktop tap fallback: temporarily force pixel ratio = 1
    let forcedPrActive = false
    let forcedFramesLeft = 0
    let lastAppliedPr = pr

    const currentPr = () => (forcedPrActive ? 1 : pr)

    const applySizeAndTransform = (wCss, hCss, usePr) => {
      const cw = Math.max(2, Math.floor(wCss * usePr))
      const ch = Math.max(2, Math.floor(hCss * usePr))
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      if (canvas.style.width !== wCss + 'px') canvas.style.width = wCss + 'px'
      if (canvas.style.height !== hCss + 'px') canvas.style.height = hCss + 'px'
      // Reset transform to map 1 unit to 1 CSS pixel
      ctx.setTransform(usePr, 0, 0, usePr, 0, 0)
    }

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

      const usePr = currentPr()
      if (w !== width || h !== height || usePr !== lastAppliedPr) {
        width = w
        height = h
        lastAppliedPr = usePr
        applySizeAndTransform(width, height, usePr)
        // Resize buffer to match CSS pixels (not device pixels)
        if (buffer.width !== width || buffer.height !== height) {
          buffer.width = width
          buffer.height = height
        }
        log('measure apply', { width, height, pr: usePr })
        if (draw && width >= 2 && height >= 2) {
          try { draw(ctx, width, height, 0) } catch (e) { log('draw error on measure', e) }
          // Capture last frame
          try { bctx.clearRect(0, 0, width, height); bctx.drawImage(canvas, 0, 0, width, height) } catch {}
        }
      }
    }

    const onFrame = (t) => {
      // If we are in forced PR mode, count down frames and restore when done
      if (forcedPrActive) {
        forcedFramesLeft -= 1
        if (forcedFramesLeft <= 0) {
          forcedPrActive = false
          // Re-measure with native PR restored
          safeMeasure()
        }
      }

      const usePr = currentPr()
      if (usePr !== lastAppliedPr) {
        // If PR changed mid-frame, re-apply transform and sizes defensively
        applySizeAndTransform(width, height, usePr)
        lastAppliedPr = usePr
      }

      if (draw && width >= 2 && height >= 2) {
        try { draw(ctx, width, height, t) } catch (e) { log('draw error on frame', e) }
        // Capture last frame
        try { bctx.clearRect(0, 0, width, height); bctx.drawImage(canvas, 0, 0, width, height) } catch {}
      } else if (width >= 2 && height >= 2) {
        // If drawing paused but we have a buffer, re-blit it (defensive)
        try {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.setTransform(usePr, 0, 0, usePr, 0, 0)
          ctx.drawImage(buffer, 0, 0, width, height)
        } catch {}
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
    const pointerHandler = () => {
      // Trigger forced 1x pixel ratio for a few frames (helps some Windows/desktop cases)
      forcedPrActive = true
      forcedFramesLeft = 4
      safeMeasure()
    }
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
