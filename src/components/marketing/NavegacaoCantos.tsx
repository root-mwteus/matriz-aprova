"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function NavegacaoCantos() {
  const [voltarVisivel, setVoltarVisivel] = useState(false)

  useEffect(() => {
    const aoRolar = () => {
      if (window.scrollY <= 2) setVoltarVisivel(false)
    }
    window.addEventListener("scroll", aoRolar, { passive: true })
    window.addEventListener("touchmove", aoRolar, { passive: true })
    return () => {
      window.removeEventListener("scroll", aoRolar)
      window.removeEventListener("touchmove", aoRolar)
    }
  }, [])

  return (
    <>
      <Link
        href="#preco"
        aria-label="Ver mais"
        onClick={() => setVoltarVisivel(true)}
        className="fixed bottom-4 right-4 z-[60] flex flex-col items-center -rotate-6 select-none group"
      >
        <span className="font-display font-bold text-lg text-ink bg-lime border-2 border-ink rounded-lg px-3 py-1 shadow-lg group-hover:-translate-y-1 transition-transform">Mais!</span>
        <svg className="w-9 h-14 text-lime-dark dark:text-lime drop-shadow group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 40" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v24" />
          <path d="M5 21l7 7 7-7" />
        </svg>
      </Link>

      {voltarVisivel && (
        <Link
          href="#topo"
          aria-label="Voltar ao topo"
          onClick={() => setVoltarVisivel(false)}
          className="fixed bottom-4 left-4 z-[60] flex flex-col items-center rotate-6 select-none group"
        >
          <span className="font-display font-bold text-lg text-ink bg-lime border-2 border-ink rounded-lg px-3 py-1 shadow-lg group-hover:translate-y-1 transition-transform">Voltar</span>
          <svg className="w-9 h-14 text-lime-dark dark:text-lime drop-shadow group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 40" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 36v-24" />
            <path d="M5 19l7-7 7 7" />
          </svg>
        </Link>
      )}
    </>
  )
}