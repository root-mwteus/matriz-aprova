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
      <svg
        aria-hidden
        viewBox="0 0 40 14"
        className="w-[40px] h-[14px] overflow-visible text-ink/35 dark:text-paper/35 group-hover:text-ink/60 dark:group-hover:text-paper/60 transition-colors duration-300 group-active:scale-95"
        fill="none"
      >
        <path
          d="M2 2 L20 12 L38 2"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
