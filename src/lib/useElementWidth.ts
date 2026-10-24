import { useEffect, useRef, useState } from 'react'

// วัดความกว้างจริงของกล่อง เพื่อวาด SVG ให้ตัวอักษรไม่ถูกย่อบนมือถือ
export function useElementWidth<T extends HTMLElement>(initial: number, minimum = 260) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(minimum, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [minimum])

  return [ref, width] as const
}
