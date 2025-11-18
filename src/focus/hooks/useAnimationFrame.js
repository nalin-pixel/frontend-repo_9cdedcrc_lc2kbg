import { useEffect, useRef } from 'react'

// useAnimationFrame - calls a callback every animation frame with delta time in seconds
export function useAnimationFrame(callback, enabled = true) {
  const requestRef = useRef(null)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const animate = (time) => {
      const last = lastTimeRef.current || time
      const dt = (time - last) / 1000
      lastTimeRef.current = time
      callback(dt, time)
      requestRef.current = requestAnimationFrame(animate)
    }
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      requestRef.current = null
      lastTimeRef.current = 0
    }
  }, [callback, enabled])
}
