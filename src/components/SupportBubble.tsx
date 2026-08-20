"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Headset, LifeBuoy, MessageCircle, X } from "lucide-react"

const EMAIL_SUPORTE = "suporte@matrizaprova.com"
const TEXTO_WHATSAPP = "Olá! Encontrei uma falha ou tenho dúvida na Matriz Aprova."

export function SupportBubble() {
  const [aberto, setAberto] = useState(false)
  const [whatsapp, setWhatsapp] = useState("")

  useEffect(() => {
    fetch("/api/pagamentos/config")
      .then((r) => (r.ok ? r.json() : Promise.resolve({})))
      .then((d) => setWhatsapp(typeof d.whatsappSuporte === "string" ? d.whatsappSuporte : ""))
      .catch(() => {})
  }, [])

  const digitos = whatsapp.replace(/\D/g, "")
  const temWhatsapp = digitos.length > 0
  const href = temWhatsapp
    ? `https://wa.me/${digitos}?text=${encodeURIComponent(TEXTO_WHATSAPP)}`
    : `https://wa.me/5553999010269`
  const ContatoIcon = temWhatsapp ? MessageCircle : Headset

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2.5">
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
              href={href}
              target={temWhatsapp ? "_blank" : undefined}
              rel={temWhatsapp ? "noopener noreferrer" : undefined}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[color:var(--text-on-accent)] transition-colors duration-fast hover:bg-accent-hover"
            >
              <ContatoIcon size={16} strokeWidth={2} />
              {temWhatsapp ? "Contatar pelo WhatsApp" : "Contatar o suporte"}
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