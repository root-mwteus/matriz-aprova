"use client"

import { useEffect, useState } from "react"

export function NavegacaoCantos() {
  const [ocultaDescer, setOcultaDescer] = useState(false)
  const [mostraSubir, setMostraSubir] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const pertoDoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120
      setOcultaDescer(pertoDoFim)
      setMostraSubir(window.scrollY > window.innerHeight * 0.4)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const descer = () => {
    window.scrollBy({ top: window.innerHeight * 0.92, behavior: "smooth" })
  }
  const subir = () => {
    window.scrollBy({ top: -window.innerHeight * 0.92, behavior: "smooth" })
  }

  return (
    <div
      className="fixed z-[60] flex flex-col items-center gap-1.5 -translate-x-1/2"
      style={{
        left: "50%",
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <button
        type="button"
        onClick={subir}
        aria-label="Bloco anterior"
        tabIndex={mostraSubir ? 0 : -1}
        style={{
          opacity: mostraSubir ? 1 : 0,
          pointerEvents: mostraSubir ? "auto" : "none",
        }}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 touch-manipulation transition-opacity duration-300 select-none group"
      >
        <svg
          aria-hidden
          viewBox="0 0 40 14"
          className="h-[14px] w-[40px] shrink-0 overflow-visible text-ink/35 dark:text-paper/35 group-hover:text-ink/60 dark:group-hover:text-paper/60 transition-colors duration-300 group-active:scale-95"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M2 12 L20 2 L38 12"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={descer}
        aria-label="Próximo bloco"
        tabIndex={ocultaDescer ? -1 : 0}
        style={{
          opacity: ocultaDescer ? 0 : 1,
          pointerEvents: ocultaDescer ? "none" : "auto",
        }}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 touch-manipulation transition-opacity duration-300 select-none group"
      >
        <svg
          aria-hidden
          viewBox="0 0 40 14"
          className="h-[14px] w-[40px] shrink-0 overflow-visible text-ink/35 dark:text-paper/35 group-hover:text-ink/60 dark:group-hover:text-paper/60 transition-colors duration-300 group-active:scale-95"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M2 2 L20 12 L38 2"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>
    </div>
  )
}
