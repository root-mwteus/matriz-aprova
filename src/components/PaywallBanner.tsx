"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/ui"

/**
 * Banner de bloqueio do plano demo.
 *
 * Exibido na barra superior do painel enquanto o usuário está no plano
 * demo: um aviso persistente de que o acesso completo está bloqueado,
 * com link para a página de assinatura. O texto do aviso vem da config
 * editável no painel admin. Pode ser dispensado até a próxima sessão.
 */

interface ConfigData {
  avisoBloqueio: string
  pagamentosAtivos: boolean
}

export default function PaywallBanner() {
  const supabase = createClient()
  const [mostrar, setMostrar] = useState(false)
  const [demo, setDemo] = useState(false)
  const [aviso, setAviso] = useState("")

  useEffect(() => {
    let active = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("plano")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (!active) return
          setDemo(data?.plano !== "vitalicio")
        })
    })

    fetch("/api/pagamentos/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ConfigData | null) => {
        if (active && data) setAviso(data.avisoBloqueio)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    if (!demo) return
    setMostrar(localStorage.getItem("paywall_dispensado") !== "1")
  }, [demo])

  if (!demo || !mostrar) return null

  return (
    <div
      className="flex items-center gap-3 border-b border-line-accent bg-accent-soft px-4 py-2 lg:px-6"
      role="status"
    >
      <Lock size={14} strokeWidth={2} className="shrink-0 text-accent-ink" />
      <p className="min-w-0 flex-1 truncate text-xs text-fg sm:whitespace-normal sm:text-sm">
        {aviso}
      </p>
      <Link
        href="/assinar"
        className={cn(
          "shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-fg-on-accent",
          "transition-opacity duration-fast hover:opacity-90"
        )}
      >
        Assinar e desbloquear
      </Link>
      <IconButton
        label="Dispensar aviso"
        variant="ghost"
        size="sm"
        onClick={() => {
          localStorage.setItem("paywall_dispensado", "1")
          setMostrar(false)
        }}
        className="shrink-0"
      >
        <X size={14} strokeWidth={2} />
      </IconButton>
    </div>
  )
}
