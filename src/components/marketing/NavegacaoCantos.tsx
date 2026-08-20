"use client"

import { useEffect, useState } from "react"

export function NavegacaoCantos() {
  const [oculta, setOculta] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const pertoDoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
      setOculta(pertoDoFim)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
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
      }}
      className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 flex items-center justify-center p-4 -m-4 transition-opacity duration-300 select-none group"
    >
      <span className="relative block w-[52px] h-[16px] transition-transform duration-300 group-hover:scale-[1.08] group-active:scale-95">
        <span
          aria-hidden
          className="absolute left-0 top-1/2 w-[26px] h-[5px] -translate-y-1/2 origin-right rounded-full bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.4)] group-hover:from-white group-hover:via-zinc-50 group-hover:to-zinc-200 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.95),0_1px_4px_rgba(0,0,0,0.45)] transition-all duration-300"
          style={{ transform: "rotate(32deg)", borderRadius: "999px" }}
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 w-[26px] h-[5px] -translate-y-1/2 origin-left rounded-full bg-gradient-to-l from-zinc-400 via-zinc-100 to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.8),0_1px_3px_rgba(0,0,0,0.4)] group-hover:from-white group-hover:via-zinc-50 group-hover:to-zinc-200 group-hover:shadow-[0_0_16px_rgba(255,255,255,0.95),0_1px_4px_rgba(0,0,0,0.45)] transition-all duration-300"
          style={{ transform: "rotate(-32deg)", borderRadius: "999px" }}
        />
      </span>
    </button>
  )
}
