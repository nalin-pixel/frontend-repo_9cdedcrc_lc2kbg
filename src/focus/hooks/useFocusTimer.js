import { useCallback, useEffect, useRef, useState } from 'react'

// useFocusTimer - front-end only timer hook
// API:
//  - timeLeft (seconds)
//  - duration (seconds)
//  - progress 0..1
//  - isRunning
//  - start(), pause(), reset(newDuration?)
//  - onTick callback every second (optional)
export function useFocusTimer(initialDuration = 25 * 60, { onTick } = {}) {
  const [duration, setDuration] = useState(initialDuration)
  const [timeLeft, setTimeLeft] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(false)
  const tickRef = useRef(null)

  const progress = Math.min(1, Math.max(0, 1 - timeLeft / duration))

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      const next = Math.max(0, prev - 1)
      if (onTick) onTick(next)
      return next
    })
  }, [onTick])

  useEffect(() => {
    if (!isRunning) return
    tickRef.current = setInterval(tick, 1000)
    return () => clearInterval(tickRef.current)
  }, [isRunning, tick])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback((newDuration) => {
    const d = typeof newDuration === 'number' ? newDuration : duration
    setDuration(d)
    setTimeLeft(d)
    setIsRunning(false)
  }, [duration])

  return { timeLeft, duration, progress, isRunning, start, pause, reset }
}
