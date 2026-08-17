"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Headset, LifeBuoy, X } from "lucide-react"

const EMAIL_SUPORTE = "suporte@matrizaprova.com"

export function SupportBubble() {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative w-[280px] rounded-xl border border-line-strong bg-[color:var(--surface)] p-4 shadow-lg"
            role="dialog"
            aria-label="Contato com o suporte"
          >
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar suporte"
              className="absolute right-2 top-2 rounded-md p-1 text-[color:var(--text-3)] transition-colors duration-fast hover:bg-surface-hover hover:text-[color:var(--text)]"
            >
              <X size={15} strokeWidth={2.25} />
            </button>

            <p className="pr-6 text-sm font-semibold text-[color:var(--text)]">
              Encontrou falhas ou tem dúvidas?
            </p>

            <a
              href={`mailto:${EMAIL_SUPORTE}?subject=Suporte%20%E2%80%94%20D%C3%BAvida%20ou%20falha`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[color:var(--text-on-accent)] transition-colors duration-fast hover:bg-accent-hover"
            >
              <Headset size={16} strokeWidth={2} />
              Contatar o suporte
            </a>

            <span
              aria-hidden
              className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 rounded-[2px] border-b border-r border-line-strong bg-[color:var(--surface)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar suporte" : "Abrir suporte"}
        title="Suporte"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-[color:var(--text-on-accent)] shadow-lg transition-transform duration-fast hover:scale-105"
      >
        {aberto ? (
          <X size={22} strokeWidth={2.25} />
        ) : (
          <LifeBuoy size={22} strokeWidth={2} />
        )}
      </button>
    </div>
  )
}