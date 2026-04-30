"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function NavigationLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setVisible(true)
    setWidth(0)

    const t1 = setTimeout(() => setWidth(75), 80)
    const t2 = setTimeout(() => setWidth(100), 350)
    const t3 = setTimeout(() => setVisible(false), 600)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 h-0.5 bg-amber-400 z-[100] transition-all ease-out"
      style={{ width: `${width}%`, transitionDuration: width === 0 ? "0ms" : "300ms" }}
    />
  )
}
