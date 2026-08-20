"use client"

import { useEffect, useState } from "react"

export function NavegacaoCantos() {
  const [oculta, setOculta] = useState(false)
  const [offsetX, setOffsetX] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const pertoDoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
      setOculta(pertoDoFim)
    }
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18
      setOffsetX(x)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("mousemove", onMove)
    onScroll()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("mousemove", onMove)
    }
  }, [])

  const proximo = () => {
    window.scrollBy({ top: window.innerHeight * 0.92, behavior: "smooth" })
  }

  return (
    <button
      type="button"
      onClick={proximo}
      aria-label="Próximo bloco"
      tabIndex={oculta ? -1 : 0}
      style={{
        opacity: oculta ? 0 : 1,
        pointerEvents: oculta ? "none" : "auto",
        transform: `translateX(calc(-50% + ${offsetX}px))`,
      }}
      className="fixed bottom-4 left-1/2 z-[60] flex items-center justify-center p-3 -m-3 transition-opacity duration-300 select-none group"
    >
      <span className="relative block w-[46px] h-[14px] transition-transform duration-300 group-hover:scale-[1.12] group-active:scale-95">
        <span
          aria-hidden
          className="absolute left-0 top-1/2 w-[23px] h-[2.5px] -translate-y-1/2 origin-right rounded-full bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.75),0_1px_2px_rgba(0,0,0,0.35)] group-hover:from-white group-hover:via-zinc-100 group-hover:to-zinc-300 group-hover:shadow-[0_0_14px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-300"
          style={{ transform: "rotate(32deg)" }}
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 w-[23px] h-[2.5px] -translate-y-1/2 origin-left rounded-full bg-gradient-to-l from-zinc-400 via-zinc-200 to-zinc-300 shadow-[0_0_10px_rgba(255,255,255,0.75),0_1px_2px_rgba(0,0,0,0.35)] group-hover:from-white group-hover:via-zinc-100 group-hover:to-zinc-300 group-hover:shadow-[0_0_14px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-300"
          style={{ transform: "rotate(-32deg)" }}
        />
      </span>
    </button>
  )
}
